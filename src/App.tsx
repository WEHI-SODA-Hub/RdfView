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

  const handleRdfLoaded = (loadedStore: RDF.Store) => {
    setStore(loadedStore);
    setLoading(false);
    
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
    
    // Select the first entity if available
    if (entityList.length > 0) {
      setSelectedEntity(entityList[0]);
    }
  };

  const handleEntitySelect = (entity: RDF.NamedNode) => {
    setSelectedEntity(entity);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <RdfLoader onRdfLoaded={handleRdfLoaded} setLoading={setLoading} />
      
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
