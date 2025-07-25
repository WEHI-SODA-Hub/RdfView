import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as RDF from 'rdflib';
import EntityList from './components/EntityList';
import PropertyTable from './components/PropertyTable';
import RdfLoader from './components/RdfLoader';
import { NamedNode } from 'rdflib/lib/tf-types';
import { Container, Flex, Box, Text, Heading, Switch, Theme } from '@radix-ui/themes';

const queryClient = new QueryClient();

// Standard RDF vocabularies
const RDFS = RDF.Namespace("http://www.w3.org/2000/01/rdf-schema#");
const RDF_NS = RDF.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
const OWL = RDF.Namespace("http://www.w3.org/2002/07/owl#");
const SKOS = RDF.Namespace("http://www.w3.org/2004/02/skos/core#");

// Known label predicates
const KNOWN_LABEL_PREDICATES: NamedNode[] = [
  RDFS('label'),
];

const App: React.FC = () => {
  const [store, setStore] = useState<RDF.Store | null>(null);
  const [entities, setEntities] = useState<NamedNode[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<NamedNode | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [labelPredicates, setLabelPredicates] = useState<NamedNode[]>(KNOWN_LABEL_PREDICATES);
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  // Function to find all label predicates in the store
  const findLabelPredicates = (store: RDF.Store): NamedNode[] => {
    // Start with our known label predicates
    const result = new Set<NamedNode>(KNOWN_LABEL_PREDICATES);
    
    // Find all predicates that are subPropertyOf rdfs:label
    const labelPredicate = RDFS('label');
    const subPropertyPredicate = RDFS('subPropertyOf');
    
    // Get all statements where something is a subproperty of rdfs:label
    const statements = store.statementsMatching(null, subPropertyPredicate, labelPredicate, null);
    statements.forEach(statement => {
      if (statement.subject.termType === 'NamedNode') {
        result.add(statement.subject as NamedNode);
      }
    });
    
    return Array.from(result);
  };

  // Function to get the label for an entity using available label predicates
  const getEntityLabel = (entity: NamedNode): string => {
    if (!store) return entity.value;
    
    // In advanced mode, always show the full IRI
    if (advancedMode) {
      return entity.value;
    }
    
    // Try each label predicate in order
    for (const labelPredicate of labelPredicates) {
      const labels = store.statementsMatching(entity, labelPredicate, null, null);
      if (labels.length > 0) {
        return labels[0].object.value;
      }
    }
    
    // If no label found, return the URI or its last part
    const uri = entity.value;
    const lastPart = uri.split(/[/#]/).pop();
    return lastPart || uri;
  };

  // Check URL for entity on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const entityUri = params.get('entity');
    
    if (entityUri && store) {
      try {
        const entity = RDF.sym(entityUri);
        handleEntitySelect(entity, false);
      } catch (error) {
        console.error('Error parsing entity URI from URL:', error);
      }
    }
  }, [store]);

  const handleRdfLoaded = (loadedStore: RDF.Store, isOntology = false) => {
    setStore(loadedStore);
    setLoading(false);
    
    // Update label predicates whenever the store changes
    const updatedLabelPredicates = findLabelPredicates(loadedStore);
    setLabelPredicates(updatedLabelPredicates);
    
    // Only update entities list if this is not an ontology load
    if (!isOntology) {
      // Extract only subjects from the store (including blank nodes)
      const subjects = new Set<NamedNode | RDF.BlankNode>();
      loadedStore.statements.forEach(quad => {
        if (quad.subject.termType === 'NamedNode' || quad.subject.termType === 'BlankNode') {
          subjects.add(quad.subject as NamedNode | RDF.BlankNode);
        }
        // Note: Not including entities that only appear as objects
      });
      
      // Filter to get only named nodes for the list
      const entityList = Array.from(subjects).filter(
        subject => subject.termType === 'NamedNode'
      ) as NamedNode[];
      
      setEntities(entityList);
      
      // Check if there's an entity in the URL, otherwise select the first entity
      const params = new URLSearchParams(window.location.search);
      const entityUri = params.get('entity');
      
      if (entityUri) {
        try {
          const entity = RDF.sym(entityUri);
          setSelectedEntity(entity);
        } catch (error) {
          console.error('Error parsing entity URI from URL:', error);
          if (entityList.length > 0) {
            setSelectedEntity(entityList[0]);
          }
        }
      } else if (entityList.length > 0) {
        setSelectedEntity(entityList[0]);
      }
    }
  };

  const handleEntitySelect = (entity: NamedNode, updateHistory = true) => {
    setSelectedEntity(entity);
    
    // Update URL with the selected entity
    if (updateHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set('entity', entity.value);
      window.history.pushState({ entityUri: entity.value }, '', url.toString());
    }
  };
  
  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.entityUri && store) {
        const entity = RDF.sym(event.state.entityUri);
        setSelectedEntity(entity);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [store]);

  return (
    <QueryClientProvider client={queryClient}>
      <Container size="4">
        <Box py="4">
          <Flex justify="between" align="center" mb="4">
            <RdfLoader onRdfLoaded={handleRdfLoaded} setLoading={setLoading} store={store} />
            
            {store && (
              <Flex align="center" gap="2">
                <Text size="2">Simplified</Text>
                <Switch 
                  checked={advancedMode}
                  onCheckedChange={setAdvancedMode}
                  size="2"
                />
                <Text size="2">Advanced</Text>
              </Flex>
            )}
          </Flex>
        
          {loading ? (
            <Flex justify="center" align="center" p="6">
              <Text size="4">Loading RDF data...</Text>
            </Flex>
          ) : store ? (
            <Flex gap="4">
              <Box className="entity-list" style={{ width: '300px', borderRight: '1px solid var(--gray-6)', overflowY: 'auto' }}>
                <EntityList 
                  entities={entities} 
                  selectedEntity={selectedEntity} 
                  onEntitySelect={handleEntitySelect}
                  getEntityLabel={getEntityLabel}
                  store={store}
                />
              </Box>
              <Box style={{ flex: 1, overflowY: 'auto' }}>
                <PropertyTable 
                  store={store} 
                  subject={selectedEntity} 
                  onEntityClick={handleEntitySelect}
                  getEntityLabel={getEntityLabel}
                  labelPredicates={labelPredicates}
                />
              </Box>
            </Flex>
          ) : (
            <Flex justify="center" align="center" height="9" p="6">
              <Text size="4">Please load an RDF file to begin</Text>
            </Flex>
          )}
        </Box>
      </Container>
    </QueryClientProvider>
  );
};

export default App;
