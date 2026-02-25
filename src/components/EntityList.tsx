import { Box, Heading, ScrollArea, Text } from '@radix-ui/themes';
import { Quad_Subject as Subject } from 'rdflib/lib/tf-types';
import React from 'react';


interface EntityListProps {
  entities: Subject[];
  selectedEntity: Subject | null;
  onEntitySelect: (entity: Subject, updateHistory?: boolean) => void;
  nameFor: (entity: Subject) => React.ReactNode;
  descriptionFor: (entity: Subject) => React.ReactNode;
}

/**
 * Lists all subjects in the store
 */
const EntityList: React.FC<EntityListProps> = ({
  selectedEntity,
  onEntitySelect,
  nameFor,
  entities,
  descriptionFor
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
              {entities.map((entity) => {
                const name = nameFor(entity);
                const description = descriptionFor(entity);
                return <Box
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
                  >
                    <Text size="2">{name}</Text>
                  </li>
                </Box>
              })}
            </ul>
          </Box>
        </ScrollArea>
      )}
    </Box>
  );
};

export default EntityList;
