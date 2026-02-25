import * as Tooltip from '@radix-ui/react-tooltip';
import { Box, Heading, Link, Table, Text } from '@radix-ui/themes';
import * as RDF from 'rdflib';
import { Quad_Subject as Subject, Term } from 'rdflib/lib/tf-types';
import React from 'react';

// Import RDFS namespace

interface PropertyTableProps {
  /**
   * The entity currently being displayed
   */
  subject: Subject | null;
  /**
   * Statements about that entity
   */
  statements: RDF.Statement[];
  /**
   * Gets the display name for an entity 
   */
  nameFor: (entity: Term) => React.ReactNode;
  /**
   * Gets a description for an entity 
   */
  descriptionFor: (entity: Term) => React.ReactNode;
  /**
   * Callback for when an entity is clicked 
   */
  onEntityClick: (entity: Subject, updateHistory?: boolean) => void;
  /**
   * True if this entity has statements about it. 
   * This can be used to determine whether to make the predicate clickable (i.e. if it has statements about it, it can be clicked to view those statements).
   */
  hasStatements: (predicate: Term) => boolean;
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
  subject,
  onEntityClick,
  statements,
  nameFor,
  descriptionFor,
  hasStatements
}) => {
  if (!subject) {
    return (
      <Box p="4">
        <Text>Select an entity to view its properties</Text>
      </Box>
    );
  }

  // Convert to a format suitable for the table
  const data: PropertyRow[] = statements.map(statement => {
    const predicate = statement.predicate;
    const object = statement.object;
    
    const isEntity = object.termType === 'NamedNode';
    
    return {
      predicate: nameFor(predicate),
      predicateUri: predicate.value,
      predicateComment: descriptionFor(predicate),
      predicateClickable: hasStatements(predicate),
      object: nameFor(object),
      objectUri: object.value,
      objectDescription: descriptionFor(object),
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
    
    // Only make it clickable if it exists as a subject in the store
    if (hasStatements(predicateNode)) {
      onEntityClick(predicateNode);
    }
  };

  const description = descriptionFor(subject);

  return (
    <Tooltip.Provider delayDuration={300}>
      <Box p="4">
{subject !== null ? (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Heading as="h2" size="5" mb="2">{nameFor(subject)}</Heading>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="tooltip-content" sideOffset={5}>
                <Text size="1" weight="bold">{nameFor(subject)}</Text>
                <Text size="1" style={{ color: 'var(--gray-11)' }}>{description}</Text>
                <Tooltip.Arrow className="tooltip-arrow" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : (
          <Heading as="h2" size="5" mb="2">{nameFor(subject)}</Heading>
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
                            {nameFor(RDF.sym(row.objectUri))}
                          </Link>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" sideOffset={5}>
                            <Text size="1" weight="bold">{nameFor(RDF.sym(row.objectUri))}</Text>
                            <Text size="1" style={{ color: 'var(--gray-11)' }}>{row.objectDescription}</Text>
                            <Tooltip.Arrow className="tooltip-arrow" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ) : (
                      <Link onClick={() => handleEntityClick(row.objectUri)}>
                        {nameFor(RDF.sym(row.objectUri))}
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
