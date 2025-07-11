import React from 'react';
import * as RDF from 'rdflib';

interface PropertyTableProps {
  store: RDF.Store;
  subject: RDF.NamedNode | null;
  onEntityClick: (entity: RDF.NamedNode, updateHistory?: boolean) => void;
}

interface PropertyRow {
  predicate: string;
  predicateUri: string;
  object: string;
  objectUri: string;
  isEntity: boolean;
  isPredicateClickable: boolean;
}

const PropertyTable: React.FC<PropertyTableProps> = ({
  store,
  subject,
  onEntityClick
}) => {
  if (!subject || !store) {
    return <div className="property-table">Select an entity to view its properties</div>;
  }

  // Get all properties for the selected entity
  const statements = store.statementsMatching(subject, null, null, null);
  
  // Convert to a format suitable for the table
  const data: PropertyRow[] = statements.map(statement => {
    const predicate = statement.predicate;
    const object = statement.object;
    
    const isEntity = object.termType === 'NamedNode';
    
    // Check if predicate exists as a subject in the store
    const isPredicateClickable = store.statementsMatching(predicate, null, null, null).length > 0;
    
    return {
      predicate: getPrefixedName(predicate.value),
      predicateUri: predicate.value,
      object: object.value,
      objectUri: object.value,
      isEntity: isEntity,
      isPredicateClickable: isPredicateClickable
    };
  });

  // Helper function to get a prefixed name for display
  function getPrefixedName(uri: string): string {
    // Extract the last part of the URI for display
    const lastPart = uri.split(/[/#]/).pop();
    return lastPart || uri;
  }

  // Function to handle clicking on an entity reference
  const handleEntityClick = (uri: string) => {
    const entityNode = RDF.sym(uri);
    onEntityClick(entityNode);
  };

  // Function to handle clicking on a predicate
  const handlePredicateClick = (uri: string) => {
    // Check if the predicate exists as a subject in the store
    const predicateNode = RDF.sym(uri);
    const statements = store.statementsMatching(predicateNode, null, null, null);
    
    // Only make it clickable if it exists as a subject in the store
    if (statements.length > 0) {
      onEntityClick(predicateNode);
    }
  };

  return (
    <div className="property-table">
      <h2>Properties of {getPrefixedName(subject.value)}</h2>
      <p><small>{subject.value}</small></p>
      
      {data.length === 0 ? (
        <p>No properties found for this entity</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Property</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {row.isPredicateClickable ? (
                    <div>
                      <span
                        className="property-link"
                        onClick={() => handlePredicateClick(row.predicateUri)}
                      >
                        {row.predicate}
                      </span>
                    </div>
                  ) : (
                    <div>{row.predicate}</div>
                  )}
                  <div><small>{row.predicateUri}</small></div>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {row.isEntity ? (
                    <span 
                      className="property-link"
                      onClick={() => handleEntityClick(row.objectUri)}
                    >
                      {getPrefixedName(row.object)}
                    </span>
                  ) : (
                    row.object
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PropertyTable;
