import { Box, Container, Em, Flex, Text, Badge } from '@radix-ui/themes';
import { Quad_Subject as Subject, Term } from "rdflib/lib/tf-types";
import { ContentType } from "rdflib/lib/types";
import React, { useEffect, useRef, useState } from 'react';
import { OntologyStore } from "../Store";
import EntityList from './EntityList';
import PropertyTable from './PropertyTable';
import { BlankNode, NamedNode, Statement } from 'rdflib';

/**
 * Represents an RDF input
 */
export type RdfSource = {
    content: string;
    contentType: ContentType
}

export type RdfViewerProps = {
    /**
     * Zero or more RDF data sources to load and display
     */
    dataSources: RdfSource[];
    /**
     * Zero or more RDF ontology sources to load. Entities are not displayed directly but only used for getting labels and descriptions
     */
    ontologySources: RdfSource[];
    /**
     * Base URI to use when loading RDF data and ontologies
     */
    baseUri: string,

    /**
     * Custom content to display when an entity has no label.
     */
    missingLabel?: React.ReactNode;

    /**
     * Custom content to display when an entity has no description.
     */
    missingDescription?: React.ReactNode;

    /**
     * If provided, prefer types that start with this prefix when displaying entity types.
     */
    preferredPrefix?: string;

    /**
     * Optional function to skip certain statements from being displayed in the property table. 
     */
    skipStatement?: (statement: Statement, store: OntologyStore) => boolean;
}

/**
 * Re-usable component for viewing RDF data.
 */
export const RdfViewer: React.FC<RdfViewerProps> = ({ dataSources, ontologySources, baseUri, missingLabel, missingDescription, preferredPrefix, skipStatement }) => {
    const ontologyStore = useRef<OntologyStore>(new OntologyStore());

    function nameFor(entity: Term): React.ReactNode {
        const name = ontologyStore.current.entityName(entity);
        let types: string[] = [];
        if (entity instanceof NamedNode || entity instanceof BlankNode) {
            types = [...ontologyStore.current.displayTypes(entity, preferredPrefix)];
        }

        let content;
        if (name) {
            content = name;
        } else if (missingLabel) {
            content = missingLabel;
        } else {
            content = <span style={{ fontVariant: "small-caps" }}>Unnamed entity</span>;
        }

        return <div>
            <Flex gap="2">
                {types.map((type) => <Badge key={type}>{type}</Badge>)}
            </Flex>
            <Text>{content}</Text>
        </div>
    }

    function descriptionFor(entity: Term): React.ReactNode {
        const description = ontologyStore.current.entityDescription(entity);
        if (description) {
            return <Text>{description}</Text>;
        } else if (missingDescription) {
            return missingDescription;
        } else {
            return <Text>No description available</Text>;
        }
    }

    // dummy state to trigger re-renders
    const [_, setStoreVersion] = useState(0);
    const [selectedEntity, setSelectedEntity] = useState<Subject | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        Promise.all([
            ...dataSources.map(source => ontologyStore.current.addData(source.content, baseUri, source.contentType))
        ]).then(() => {
            setStoreVersion(prev => prev + 1); // Update the dummy state to trigger re-render
            setLoading(false);
        }).catch((error) => {
            console.error("Error loading RDF data:", error);
            setLoading(false);
        });
    }, [dataSources, baseUri])
    useEffect(() => {
        Promise.all([
            ...ontologySources.map(source => ontologyStore.current.addOntology(source.content, baseUri, source.contentType)),
        ]).then(() => {
            setStoreVersion(prev => prev + 1); // Update the dummy state to trigger re-render
            setLoading(false);
        }).catch((error) => {
            console.error("Error loading RDF data:", error);
            setLoading(false);
        });
    }, [ontologySources, baseUri])

    let content;
    if (loading) {
        content = (<Flex justify="center" align="center" p="6">
            <Text size="4">Loading RDF data...</Text>
        </Flex>);
    }
    else {
        const statements = ontologyStore.current.anyStatementsMatching(selectedEntity, null, null).filter(statement => !skipStatement || !skipStatement(statement, ontologyStore.current));
        content = (<Flex gap="4">
            <Box className="entity-list" style={{ width: '300px', borderRight: '1px solid var(--gray-6)', overflowY: 'auto' }}>
                <EntityList
                    selectedEntity={selectedEntity}
                    onEntitySelect={(entity) => setSelectedEntity(entity)}
                    descriptionFor={descriptionFor}
                    nameFor={nameFor}
                    entities={[... new Set(ontologyStore.current.getSubjects())]}
                />
            </Box>
            <Box style={{ flex: 1, overflowY: 'auto' }}>
                <PropertyTable
                    subject={selectedEntity}
                    onEntityClick={(entity) => setSelectedEntity(entity)}
                    nameFor={nameFor}
                    descriptionFor={descriptionFor}
                    hasStatements={(predicate) => {
                        if (predicate instanceof NamedNode || predicate instanceof BlankNode) {
                            return ontologyStore.current.anyStatementsMatching(predicate, null, null).filter(statement => !skipStatement || !skipStatement(statement, ontologyStore.current)).length > 0;
                        }
                        return false;
                    }}
                    statements={statements}
                />
            </Box>
        </Flex>
        )
    }

    return (
        <Container size="4">
            <Box py="4">
                {content}
            </Box>
        </Container>
    )
}
