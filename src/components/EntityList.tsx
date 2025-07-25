import React from 'react';
import { NamedNode } from 'rdflib/lib/tf-types';
import { Heading, Text, ScrollArea, Box } from '@radix-ui/themes';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as RDF from 'rdflib';

// Import RDFS namespace
const RDFS = RDF.Namespace("http://www.w3.org/2000/01/rdf-schema#");

interface EntityListProps {
  entities: NamedNode[];
  selectedEntity: NamedNode | null;
  onEntitySelect: (entity: NamedNode, updateHistory?: boolean) => void;
  getEntityLabel: (entity: NamedNode) => string;
  store: RDF.Store | null;
}

const EntityList: React.FC<EntityListProps> = ({ 
  entities, 
  selectedEntity, 
  onEntitySelect,
  getEntityLabel,
  store
}) => {
  // Function to get the comment for an entity
  const getEntityComment = (entityUri: string): string | undefined => {
    if (!store) return undefined;
    
    // Use rdfs:comment predicate
    const commentPredicate = RDFS('comment');
    const entityNode = RDF.sym(entityUri);
    const comments = store.statementsMatching(entityNode, commentPredicate, null, null);
    
    if (comments.length > 0) {
      return comments[0].object.value;
    }
    
    return undefined;
  };

  return (
    <Box>
      <Heading as="h2" size="4" mb="3">Entities</Heading>
      {entities.length === 0 ? (
        <Text>No entities found</Text>
      ) : (
        <Tooltip.Provider delayDuration={300}>
          <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <Box asChild>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {entities.map((entity) => (
                  <Box 
                    key={entity.value}
                    asChild
                  >
                    {getEntityComment(entity.value) ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
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
                            <Text size="2">{getEntityLabel(entity)}</Text>
                          </li>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" sideOffset={5}>
                            <Text size="1" weight="bold">{getEntityLabel(entity)}</Text>
                            <Text size="1" style={{ color: 'var(--gray-11)' }}>{getEntityComment(entity.value)}</Text>
                            <Tooltip.Arrow className="tooltip-arrow" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ) : (
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
                        <Text size="2">{getEntityLabel(entity)}</Text>
                      </li>
                    )}
                  </Box>
                ))}
              </ul>
            </Box>
          </ScrollArea>
        </Tooltip.Provider>
      )}
    </Box>
  );
};

export default EntityList;
