import React from 'react';
import * as RDF from 'rdflib';
import { NamedNode } from 'rdflib/lib/tf-types';
import { Heading, Text, Table, Box, Link } from '@radix-ui/themes';

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
  object: string;
  objectUri: string;
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
    
    return {
      predicate: predicateLabel,
      predicateUri: predicate.value,
      object: object.value,
      objectUri: object.value,
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
    <Box p="4">
      <Heading as="h2" size="5" mb="2" title={subject.value}>{getEntityLabel(subject)}</Heading>
      
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
                    <Link onClick={() => handlePredicateClick(row.predicateUri)} title={row.predicateUri}>
                      {row.predicate}
                    </Link>
                  ) : (
                    <Text title={row.predicateUri}>{row.predicate}</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {row.isEntity ? (
                    <Link onClick={() => handleEntityClick(row.objectUri)} title={row.objectUri}>
                      {getEntityLabel(RDF.sym(row.objectUri))}
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
