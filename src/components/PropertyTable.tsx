import * as Tooltip from '@radix-ui/react-tooltip';
import { Box, Heading, Link, Table, Text } from '@radix-ui/themes';
import * as RDF from 'rdflib';
import { Quad_Subject as Subject, Term } from 'rdflib/lib/tf-types';
import { ObjectType, PredicateType } from 'rdflib/lib/types';
import React from 'react';

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
  hasStatements: (term: Term) => boolean;

  ref?: React.Ref<HTMLDivElement>;

  id?: string;
}

interface PropertyRow {
  // Predicate name
  predicate: string;
  predicateUri: PredicateType;

  // Object value (either entity label or literal value)
  object: string;
  objectUri: ObjectType;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({
  subject,
  onEntityClick,
  statements,
  nameFor,
  descriptionFor,
  hasStatements,
  id,
  ref
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
      predicateUri: predicate,
      object: nameFor(object),
      objectUri: object,
    } as PropertyRow;
  });

  // Function to handle clicking on an entity reference
  const handleEntityClick = (uri: ObjectType) => {
    if (uri instanceof RDF.NamedNode || uri instanceof RDF.BlankNode) {
      onEntityClick(uri);
    }
  };


  // Function to handle clicking on a predicate
  // const handlePredicateClick = (uri: PredicateType) => {
  //   // Only make it clickable if it exists as a subject in the store
  //   if (hasStatements(predicateNode)) {
  //     onEntityClick(predicateNode);
  //   }
  // };

  const description = descriptionFor(subject);

  return (
    <Box p="4" ref={ref} id={id}>
      <Heading as="h2" size="5" mb="2">{nameFor(subject)}</Heading>

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
                  <Text>{row.predicate}</Text>
                </Table.Cell>
                <Table.Cell>
                  {hasStatements(row.objectUri) ? (
                    <Link onClick={() => handleEntityClick(row.objectUri)} style={{
                      cursor: 'pointer'
                    }}>
                      {nameFor(row.objectUri)}
                    </Link>
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
  );
};

export default PropertyTable;
