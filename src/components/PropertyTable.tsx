import React from 'react';
import * as RDF from 'rdflib';
import { NamedNode } from 'rdflib/lib/tf-types';
import { Heading, Text, Table, Box, Link } from '@radix-ui/themes';
import * as Tooltip from '@radix-ui/react-tooltip';

// Import RDFS namespace
const RDFS = RDF.Namespace("http://www.w3.org/2000/01/rdf-schema#");

interface PropertyTableProps {
  store: RDF.Store;
  subject: NamedNode | null;
  onEntityClick: (entity: NamedNode, updateHistory?: boolean) => void;
  getEntityLabel: (entity: NamedNode) => string;
  labelPredicates: NamedNode[];
}

interface PropertyRow {
  predicate: string;
  predicateUri: string;
  predicateComment?: string;
  object: string;
  objectUri: string;
  objectComment?: string;
  isEntity: boolean;
  isPredicateClickable: boolean;
}

const PropertyTable: React.FC<PropertyTableProps> = ({
  store,
  subject,
  onEntityClick,
  getEntityLabel,
  labelPredicates
}) => {
  if (!subject || !store) {
    return (
      <Box p="4">
        <Text>Select an entity to view its properties</Text>
      </Box>
    );
  }

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


  // Get all properties for the selected entity
  const statements = store.statementsMatching(subject, null, null, null);
  
  // Convert to a format suitable for the table
  const data: PropertyRow[] = statements.map(statement => {
    const predicate = statement.predicate;
    const object = statement.object;
    
    const isEntity = object.termType === 'NamedNode';
    
    // Check if predicate exists as a subject in the store
    const isPredicateClickable = store.statementsMatching(predicate, null, null, null).length > 0;
    
    // Get predicate label
    const predicateLabel = predicate.termType === 'NamedNode' 
      ? getEntityLabel(predicate as NamedNode)
      : predicate.value.split(/[/#]/).pop() || predicate.value;
    
    // Get comments for predicate and object (if it's an entity)
    const predicateComment = predicate.termType === 'NamedNode' 
      ? getEntityComment(predicate.value)
      : undefined;
    
    const objectComment = isEntity 
      ? getEntityComment(object.value)
      : undefined;
    
    return {
      predicate: predicateLabel,
      predicateUri: predicate.value,
      predicateComment: predicateComment,
      object: object.value,
      objectUri: object.value,
      objectComment: objectComment,
      isEntity: isEntity,
      isPredicateClickable: isPredicateClickable
    };
  });

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
    <Tooltip.Provider delayDuration={300}>
      <Box p="4">
{getEntityComment(subject.value) ? (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Heading as="h2" size="5" mb="2">{getEntityLabel(subject)}</Heading>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="tooltip-content" sideOffset={5}>
                <Text size="1" weight="bold">{getEntityLabel(subject)}</Text>
                <Text size="1" style={{ color: 'var(--gray-11)' }}>{getEntityComment(subject.value)}</Text>
                <Tooltip.Arrow className="tooltip-arrow" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <Heading as="h2" size="5" mb="2">{getEntityLabel(subject)}</Heading>
        )}
        
        {data.length === 0 ? (
        <Text>No properties found for this entity</Text>
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Property</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Value</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((row, index) => (
              <Table.Row key={index}>
                <Table.Cell>
                  {row.isPredicateClickable ? (
                    row.predicateComment ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link onClick={() => handlePredicateClick(row.predicateUri)}>
                            {row.predicate}
                          </Link>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" sideOffset={5}>
                            <Text size="1" weight="bold">{row.predicate}</Text>
                            <Text size="1" style={{ color: 'var(--gray-11)' }}>{row.predicateComment}</Text>
                            <Tooltip.Arrow className="tooltip-arrow" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ) : (
                      <Link onClick={() => handlePredicateClick(row.predicateUri)}>
                        {row.predicate}
                      </Link>
                    )
                  ) : (
                    row.predicateComment ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Text>{row.predicate}</Text>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" sideOffset={5}>
                            <Text size="1" weight="bold">{row.predicate}</Text>
                            <Text size="1" style={{ color: 'var(--gray-11)' }}>{row.predicateComment}</Text>
                            <Tooltip.Arrow className="tooltip-arrow" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ) : (
                      <Text>{row.predicate}</Text>
                    )
                  )}
                </Table.Cell>
                <Table.Cell>
                  {row.isEntity ? (
                    row.objectComment ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link onClick={() => handleEntityClick(row.objectUri)}>
                            {getEntityLabel(RDF.sym(row.objectUri))}
                          </Link>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" sideOffset={5}>
                            <Text size="1" weight="bold">{getEntityLabel(RDF.sym(row.objectUri))}</Text>
                            <Text size="1" style={{ color: 'var(--gray-11)' }}>{row.objectComment}</Text>
                            <Tooltip.Arrow className="tooltip-arrow" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ) : (
                      <Link onClick={() => handleEntityClick(row.objectUri)}>
                        {getEntityLabel(RDF.sym(row.objectUri))}
                      </Link>
                    )
                  ) : (
                    <Text>{row.object}</Text>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  </Tooltip.Provider>
  );
};

export default PropertyTable;
