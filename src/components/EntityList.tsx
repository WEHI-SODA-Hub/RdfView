import React from 'react';
import { NamedNode } from 'rdflib/lib/tf-types';

interface EntityListProps {
  entities: NamedNode[];
  selectedEntity: NamedNode | null;
  onEntitySelect: (entity: NamedNode, updateHistory?: boolean) => void;
  getEntityLabel: (entity: NamedNode) => string;
}

const EntityList: React.FC<EntityListProps> = ({ 
  entities, 
  selectedEntity, 
  onEntitySelect,
  getEntityLabel
}) => {
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
