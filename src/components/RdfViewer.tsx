import { Box, Container, Flex, Text, Badge, ScrollArea } from '@radix-ui/themes';
import { ContentType } from "rdflib/lib/types";
import React, { useEffect, useRef, useState } from 'react';
import { OntologyStore } from "../Store";
import EntityList from './EntityList';
import PropertyTable from './PropertyTable';
import {  Statement } from 'rdflib';
import { InView } from "react-intersection-observer";
import { Subject, Object } from '../rdfLibUtils';

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
    // dummy state to trigger re-renders
    const [_, setStoreVersion] = useState(0);
    // const [selectedEntity, setSelectedEntity] = useState<Subject | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // These two state variables used to be the same, but separating them avoids loops where scrolling triggers more scrolling etc.

    // Content that has been scrolled into view and should be highlighted in the TOC
    const [shouldHighlight, setShouldHighlight] = useState<Subject | null>(null);
    // Entity that was clicked in the TOC and should be scrolled into view
    const [shouldScrollIntoView, setShouldScrollIntoView] = useState<Subject | null>(null);

    /**
     * Generates a display name for an entity using the ontology store.
     * @param context The context in which the name is being displayed. "sidebar" is the list of entities on the left, "subject" is the title of an entity in the main view, and "object" is when the entity is displayed as an object in the property table.
     * @returns 
     */
    function nameFor(entity: Object, context : "sidebar" | "subject" | "object"): React.ReactNode {
        const name = ontologyStore.current.entityName(entity);
        let types: string[] = [];
        if ((entity.termType === "NamedNode" || entity.termType === "BlankNode") && context === "sidebar") {
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

    function descriptionFor(entity: Object): React.ReactNode {
        const description = ontologyStore.current.entityDescription(entity);
        if (description) {
            return <Text>{description}</Text>;
        } else if (missingDescription) {
            return missingDescription;
        } else {
            return <Text>No description available</Text>;
        }
    }

    // Load data sources and ontologies when they change
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
        const subjects = [... new Set(ontologyStore.current.getSubjects())];
        content = (<Flex gap="4">
            <Box className="entity-list" flexGrow="1" style={{
                // width: '300px', borderRight: '1px solid var(--gray-6)', overflowY: 'auto'
            }}>
                <EntityList
                    visibleEntity={shouldHighlight}
                    onEntitySelect={(entity) => { setShouldScrollIntoView(entity) }}
                    descriptionFor={descriptionFor}
                    nameFor={(entity) => nameFor(entity, "sidebar")}
                    entities={subjects}
                />
            </Box>
            <Box flexGrow="2" style={{ overflowY: 'auto' }}>
                <PropertyTableList
                    subjects={subjects}
                    ontologyStore={ontologyStore.current}
                    skipStatement={skipStatement}
                    nameFor={(entity) => nameFor(entity, "subject")}
                    descriptionFor={descriptionFor}
                    onEntityBecomesVisible={(entity) => { setShouldHighlight(entity) }}
                    visibleEntity={shouldScrollIntoView}
                    onEntityLink={entity => setShouldScrollIntoView(entity)}
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


const PropertyTableList: React.FC<{
    subjects: Subject[],
    ontologyStore: OntologyStore,
    skipStatement?: (statement: Statement, store: OntologyStore) => boolean,
    nameFor: (entity: Object) => React.ReactNode,
    descriptionFor: (entity: Object) => React.ReactNode,
    // Called when an entity becomes visible in the main view (i.e. when it is scrolled into view).
    onEntityBecomesVisible: (entity: Subject) => void,
    // Called when an entity is clicked in the property table (i.e. when an entity is linked from another entity's properties)
    onEntityLink: (entity: Subject) => void,
    visibleEntity: Subject | null
}> = ({ subjects, ontologyStore, skipStatement, nameFor, descriptionFor, onEntityBecomesVisible, visibleEntity, onEntityLink }) => {
    const visibleEntityRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (visibleEntityRef.current) {
            visibleEntityRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [visibleEntity, visibleEntityRef.current]);

    return (

        <ScrollArea type="auto" scrollbars="vertical" style={{
            maxHeight: 'calc(100vh - 200px)'
        }}>
            {subjects.map(subject => {
                const statements = ontologyStore.anyStatementsMatching(subject, null, null).filter(statement => !skipStatement || !skipStatement(statement, ontologyStore));
                return (
                    <InView onChange={(inView, entry) => {
                        if (inView) {
                            onEntityBecomesVisible(subject)
                        }
                    }} key={subject.value}>
                        <PropertyTable
                            id={encodeURIComponent(subject.value)}
                            ref={visibleEntity?.value === subject.value ? visibleEntityRef : null}
                            subject={subject}
                            onEntityClick={(entity) => { 
                                onEntityLink(entity); 
                             }}
                            nameFor={nameFor}
                            descriptionFor={descriptionFor}
                            hasStatements={(term) => {
                                if (term.termType === 'NamedNode' || term.termType === 'BlankNode') {
                                    // Only use data store here, because the ontology store contains mostly classes and properties that won't be in the entity list
                                    return ontologyStore.data.statementsMatching(term, null, null).filter(statement => !skipStatement || !skipStatement(statement, ontologyStore)).length > 0;
                                }
                                return false;
                            }}
                            statements={statements}
                        />
                    </InView>
                )
            }
            )}

        </ScrollArea>
    )
}
