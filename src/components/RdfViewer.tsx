import { Box, Container, Flex, Text } from '@radix-ui/themes';
import { Quad_Subject as Subject } from "rdflib/lib/tf-types";
import { ContentType } from "rdflib/lib/types";
import React, { useEffect, useRef, useState } from 'react';
import { OntologyStore } from "../Store";
import EntityList from './EntityList';
import PropertyTable from './PropertyTable';

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
    baseUri: string
}

/**
 * Re-usable component for viewing RDF data.
 */
export const RdfViewer: React.FC<RdfViewerProps> = ({ dataSources, ontologySources, baseUri }) => {
    const ontologyStore = useRef<OntologyStore>(new OntologyStore());
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
        content = (<Flex gap="4">
            <Box className="entity-list" style={{ width: '300px', borderRight: '1px solid var(--gray-6)', overflowY: 'auto' }}>
                <EntityList
                    selectedEntity={selectedEntity}
                    onEntitySelect={(entity) => setSelectedEntity(entity)}
                    store={ontologyStore.current}
                />
            </Box>
            <Box style={{ flex: 1, overflowY: 'auto' }}>
                <PropertyTable
                    store={ontologyStore.current}
                    subject={selectedEntity}
                    onEntityClick={(entity) => setSelectedEntity(entity)}
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
