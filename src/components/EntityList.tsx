import React from 'react';
import { NamedNode } from 'rdflib/lib/tf-types';
import { Heading, Text, ScrollArea, Box } from '@radix-ui/themes';

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
    <Box>
      <Heading as="h2" size="4" mb="3">Entities</Heading>
      {entities.length === 0 ? (
        <Text>No entities found</Text>
      ) : (
        <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Box asChild>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {entities.map((entity) => (
                <Box 
                  key={entity.value}
                  asChild
                >
                  <li 
                    style={{ 
                      padding: '8px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      backgroundColor: selectedEntity?.value === entity.value ? 'var(--accent-3)' : 'transparent',
                    }}
                    onClick={() => onEntitySelect(entity)}
                    title={entity.value} // Show the full IRI on hover
                  >
                    <Text size="2">{getEntityLabel(entity)}</Text>
                  </li>
                </Box>
              ))}
            </ul>
          </Box>
        </ScrollArea>
      )}
    </Box>
  );
};

export default EntityList;
