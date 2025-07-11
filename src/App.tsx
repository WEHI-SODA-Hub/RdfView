import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as RDF from 'rdflib';
import EntityList from './components/EntityList';
import PropertyTable from './components/PropertyTable';
import RdfLoader from './components/RdfLoader';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [store, setStore] = useState<RDF.Store | null>(null);
  const [entities, setEntities] = useState<RDF.NamedNode[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<RDF.NamedNode | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
    
    // Only update entities list if this is not an ontology load
    if (!isOntology) {
      // Extract only subjects from the store (including blank nodes)
      const subjects = new Set<RDF.NamedNode | RDF.BlankNode>();
      loadedStore.statements.forEach(quad => {
        if (quad.subject.termType === 'NamedNode' || quad.subject.termType === 'BlankNode') {
          subjects.add(quad.subject as RDF.NamedNode | RDF.BlankNode);
        }
        // Note: Not including entities that only appear as objects
      });
      
      // Filter to get only named nodes for the list
      const entityList = Array.from(subjects).filter(
        subject => subject.termType === 'NamedNode'
      ) as RDF.NamedNode[];
      
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

  const handleEntitySelect = (entity: RDF.NamedNode, updateHistory = true) => {
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
      <RdfLoader onRdfLoaded={handleRdfLoaded} setLoading={setLoading} store={store} />
      
      {loading ? (
        <div className="loading">Loading RDF data...</div>
      ) : store ? (
        <div className="app-container">
          <EntityList 
            entities={entities} 
            selectedEntity={selectedEntity} 
            onEntitySelect={handleEntitySelect} 
          />
          <PropertyTable 
            store={store} 
            subject={selectedEntity} 
            onEntityClick={handleEntitySelect} 
          />
        </div>
      ) : (
        <div className="loading">Please load an RDF file to begin</div>
      )}
    </QueryClientProvider>
  );
};

export default App;
