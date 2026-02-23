import React from 'react';
import * as RDF from 'rdflib';
import { NamedNode, Term, Quad_Subject as Subject } from 'rdflib/lib/tf-types';
import { Heading, Text, Table, Box, Link } from '@radix-ui/themes';
import * as Tooltip from '@radix-ui/react-tooltip';
import { OntologyStore } from '../Store';

// Import RDFS namespace

interface PropertyTableProps {
  store: OntologyStore;
  subject: Subject | null;
  onEntityClick: (entity: Subject, updateHistory?: boolean) => void;
}

interface PropertyRow {
  // Predicate name
  predicate: string;
  predicateUri: string;
  predicateDescription?: string;
  predicateClickable: boolean;

  // Object value (either entity label or literal value)
  object: string;
  objectUri: string;
  objectDescription?: string;
  // Whether the object is an entity (i.e. not a literal)
  objectIsEntity: boolean;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({
  store,
  subject,
  onEntityClick,
}) => {
  if (!subject || !store) {
    return (
      <Box p="4">
        <Text>Select an entity to view its properties</Text>
      </Box>
    );
  }

  // Get all properties for the selected entity
  const statements = store.data.statementsMatching(subject, null, null, null);
  
  // Convert to a format suitable for the table
  const data: PropertyRow[] = statements.map(statement => {
    const predicate = statement.predicate;
    const object = statement.object;
    
    const isEntity = object.termType === 'NamedNode';
    
    // Check if predicate exists as a subject in the store
    const isPredicateClickable = store.data.statementsMatching(predicate, null, null, null).length > 0;
    
    return {
      predicate: store.nameFor(predicate),
      predicateUri: predicate.value,
      predicateComment: store.descriptionFor(predicate),
      predicateClickable: isPredicateClickable,
      object: store.nameFor(object),
      objectUri: object.value,
      objectDescription: store.descriptionFor(object),
      objectIsEntity: isEntity,
    } as PropertyRow;
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
    const statements = store.data.statementsMatching(predicateNode, null, null, null);
    
    // Only make it clickable if it exists as a subject in the store
    if (statements.length > 0) {
      onEntityClick(predicateNode);
    }
  };

  const description = store.descriptionFor(subject);

  return (
    <Tooltip.Provider delayDuration={300}>
      <Box p="4">
{subject !== null ? (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Heading as="h2" size="5" mb="2">{store.nameFor(subject)}</Heading>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="tooltip-content" sideOffset={5}>
                <Text size="1" weight="bold">{store.nameFor(subject)}</Text>
                <Text size="1" style={{ color: 'var(--gray-11)' }}>{description}</Text>
                <Tooltip.Arrow className="tooltip-arrow" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <Heading as="h2" size="5" mb="2">{store.nameFor(subject)}</Heading>
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
                  {row.predicateClickable ? (
                    row.predicateDescription ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link onClick={() => handlePredicateClick(row.predicateUri)}>
                            {row.predicate}
                          </Link>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" sideOffset={5}>
                            <Text size="1" weight="bold">{row.predicate}</Text>
                            <Text size="1" style={{ color: 'var(--gray-11)' }}>{row.predicateDescription}</Text>
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
                    row.predicateDescription ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Text>{row.predicate}</Text>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" sideOffset={5}>
                            <Text size="1" weight="bold">{row.predicate}</Text>
                            <Text size="1" style={{ color: 'var(--gray-11)' }}>{row.predicateDescription}</Text>
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
                  {row.objectIsEntity ? (
                    row.objectDescription ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link onClick={() => handleEntityClick(row.objectUri)}>
                            {store.nameFor(RDF.sym(row.objectUri))}
                          </Link>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" sideOffset={5}>
                            <Text size="1" weight="bold">{store.nameFor(RDF.sym(row.objectUri))}</Text>
                            <Text size="1" style={{ color: 'var(--gray-11)' }}>{row.objectDescription}</Text>
                            <Tooltip.Arrow className="tooltip-arrow" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ) : (
                      <Link onClick={() => handleEntityClick(row.objectUri)}>
                        {store.nameFor(RDF.sym(row.objectUri))}
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
