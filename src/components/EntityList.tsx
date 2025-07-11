import React from 'react';
import * as RDF from 'rdflib';

interface EntityListProps {
  entities: RDF.NamedNode[];
  selectedEntity: RDF.NamedNode | null;
  onEntitySelect: (entity: RDF.NamedNode) => void;
}

const EntityList: React.FC<EntityListProps> = ({ 
  entities, 
  selectedEntity, 
  onEntitySelect 
}) => {
  // Function to get a friendly display name for an entity
  const getEntityLabel = (entity: RDF.NamedNode): string => {
    // Extract the last part of the URI for display
    const uri = entity.value;
    const lastPart = uri.split(/[/#]/).pop();
    return lastPart || uri;
  };

  return (
    <div className="entity-list">
      <h2>Entities</h2>
      {entities.length === 0 ? (
        <p>No entities found</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {entities.map((entity) => (
            <li 
              key={entity.value} 
              className={`entity-item ${selectedEntity?.value === entity.value ? 'active' : ''}`}
              onClick={() => onEntitySelect(entity)}
            >
              {getEntityLabel(entity)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EntityList;
