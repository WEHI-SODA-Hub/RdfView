import React, { useEffect, useRef } from 'react';
import * as RDF from 'rdflib';
import { NamedNode } from 'rdflib/lib/tf-types';
import { Box, Text } from '@radix-ui/themes';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import Graph from "rdf-cytoscape/lib/graph"
import Dataset from "rdf-cytoscape"

// Register the dagre layout
cytoscape.use(dagre);

interface GraphViewProps {
  store: RDF.Store;
  selectedEntity: NamedNode | null;
  onEntityClick: (entity: NamedNode, updateHistory?: boolean) => void;
  getEntityLabel: (entity: NamedNode) => string;
  baseEntities: NamedNode[];
}

const GraphView: React.FC<GraphViewProps> = ({
  store,
  selectedEntity,
  onEntityClick,
  getEntityLabel,
  baseEntities
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current || !store) return;

    // Initialize cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'background-color': '#6E56CF',
            'color': '#000',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'font-size': '10px',
            'border-width': 2,
            'border-color': '#DDD4FE'
          }
        },
        {
          selector: 'node.selected',
          style: {
            'border-width': 3,
            'border-color': '#F54A45',
            'background-color': '#8875E0'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#8E8EA0',
            'target-arrow-color': '#8E8EA0',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '8px',
            'text-rotation': 'autorotate',
            'text-background-color': '#FFFFFF',
            'text-background-opacity': 0.7,
            'text-background-padding': '2px'
          }
        }
      ],
      layout: {
        name: 'dagre',
        nodeDimensionsIncludeLabels: true,
        padding: 30,
        spacingFactor: 1.5,
        rankDir: 'LR',
        rankSep: 100,
        edgeSep: 30,
        nodeSep: 50,
      } as any,
      // Add these options to constrain the graph
      minZoom: 0.2,
      maxZoom: 2.5,
      wheelSensitivity: 0.2,
      boxSelectionEnabled: false
    });

    // Store the cytoscape instance
    cyRef.current = cy;

    // Convert RDF data to cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [];
    
    // Add nodes for all base entities (excluding ontology entities)
    const addedNodes = new Set<string>();
    
    // First, add all base entities as nodes
    baseEntities.forEach(entity => {
      elements.push({
        data: {
          id: entity.value,
          label: getEntityLabel(entity),
          uri: entity.value
        },
        group: 'nodes'
      });
      addedNodes.add(entity.value);
    });
    
    // Process all statements to extract edges, but only between base entities
    store.statements.forEach(statement => {
      const subject = statement.subject;
      const predicate = statement.predicate;
      const object = statement.object;
      
      // Add edge if both subject and object are base entities (already in addedNodes)
      if (subject.termType === 'NamedNode' && object.termType === 'NamedNode' &&
          addedNodes.has(subject.value) && addedNodes.has(object.value)) {
        elements.push({
          data: {
            id: `${subject.value}-${predicate.value}-${object.value}`,
            source: subject.value,
            target: object.value,
            label: getEntityLabel(predicate as NamedNode),
            uri: predicate.value
          },
          group: 'edges'
        });
      }
    });

    // Add elements to the graph
    cy.add(elements);

    // After layout is complete, fit to screen and center
    cy.layout({ 
      name: 'dagre',
      nodeDimensionsIncludeLabels: true,
      padding: 30,
      spacingFactor: 0.5,
      rankDir: 'LR',
      rankSep: 80,
      edgeSep: 30,
      nodeSep: 50,
      componentSpacing: 100,
      fit: true, // Make sure layout fits to screen
      animate: true,
      animationDuration: 500
    } as any).run();

    // Add viewport constraint to keep graph in view
    cy.on('viewport', () => {
      const extent = cy.extent();
      const viewportWidth = containerRef.current?.clientWidth || 100;
      const viewportHeight = containerRef.current?.clientHeight || 100;
      
      // If user zooms out too far, reset to fit view
      if (cy.zoom() < 0.2) {
        cy.fit(undefined, 30);
        cy.zoom(Math.max(0.2, cy.zoom()));
      }
    });

    // Add click event for nodes
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const uri = node.data('uri');
      
      if (uri) {
        try {
          const entity = RDF.sym(uri);
          onEntityClick(entity, true);
        } catch (error) {
          console.error('Error handling node click:', error);
        }
      }
    });

    // Initial fit to screen
    setTimeout(() => {
      cy.fit(undefined, 30);
      cy.center();
    }, 100);

    // Handle component cleanup
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [store, getEntityLabel, onEntityClick, baseEntities]);

  // Update selected entity highlight when it changes
  useEffect(() => {
    if (!cyRef.current || !selectedEntity) return;

    // Reset all selections
    cyRef.current.nodes().removeClass('selected');

    // Find the node corresponding to the selected entity and highlight it
    const selectedNode = cyRef.current.nodes(`[uri = "${selectedEntity.value}"]`);
    if (selectedNode.length > 0) {
      selectedNode.addClass('selected');
      
      // Center the view on the selected node with animation
      cyRef.current.animate({
        center: { eles: selectedNode },
        duration: 500,
        queue: false
      });
    }
  }, [selectedEntity]);

  if (!store) {
    return (
      <Box p="4">
        <Text>Please load an RDF file to view the graph</Text>
      </Box>
    );
  }

  return (
    <Box style={{ width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      <Text size="1" mb="2">Displaying {baseEntities.length} entities from base RDF (excluding ontology entities)</Text>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: 'calc(100% - 24px)', 
          border: '1px solid var(--gray-6)', 
          borderRadius: '6px',
          overflow: 'hidden' // Prevent scrollbars
        }}
      ></div>
    </Box>
  );
};

export default GraphView;
