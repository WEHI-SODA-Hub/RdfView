import React, { useRef, useState } from 'react';
import * as RDF from 'rdflib';
import { Box, Text, Heading, Flex, Button, ScrollArea } from '@radix-ui/themes';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDownIcon } from '@radix-ui/react-icons';

interface RdfLoaderProps {
  onRdfLoaded: (store: RDF.Store, isOntology?: boolean) => void;
  setLoading: (loading: boolean) => void;
  store?: RDF.Store | null;
}

interface LoadedOntology {
  name: string;
  uri: string;
  statements: number;
}

const RdfLoader: React.FC<RdfLoaderProps> = ({ onRdfLoaded, setLoading, store }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ontologyInputRef = useRef<HTMLInputElement>(null);
  const [loadedOntologies, setLoadedOntologies] = useState<LoadedOntology[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        loadRdfData(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleOntologyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !store) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        loadOntologyData(content, file.name, store);
      }
    };
    reader.readAsText(file);
  };

  const loadRdfData = (content: string, filename: string) => {
    const store = RDF.graph();
    
    // Determine the content type based on the file extension
    const fileExt = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/rdf+xml'; // default
    
    if (fileExt === 'ttl') {
      contentType = 'text/turtle';
    } else if (fileExt === 'nt') {
      contentType = 'application/n-triples';
    } else if (fileExt === 'json' || fileExt === 'jsonld') {
      contentType = 'application/ld+json';
    } else if (fileExt === 'n3') {
      contentType = 'text/n3';
    }
    
    try {
      const baseUri = `file://`;
      
      // Parse the RDF data
      RDF.parse(content, store, baseUri, contentType, (error, _) => {
        // Pass the store to the parent component
        onRdfLoaded(store, false);
      });
    } catch (error) {
      console.error('Error parsing RDF data:', error);
      setLoading(false);
      alert('Error parsing RDF file. Please check if the format matches the file extension.');
    }
  };

  const loadOntologyData = (content: string, filename: string, existingStore: RDF.Store) => {
    // Create a temporary store for the ontology
    const ontologyStore = RDF.graph();
    
    // Determine the content type based on the file extension
    const fileExt = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/rdf+xml'; // default
    
    if (fileExt === 'ttl') {
      contentType = 'text/turtle';
    } else if (fileExt === 'nt') {
      contentType = 'application/n-triples';
    } else if (fileExt === 'json' || fileExt === 'jsonld') {
      contentType = 'application/ld+json';
    } else if (fileExt === 'n3') {
      contentType = 'text/n3';
    }
    
    try {
      // Create a base URI from the filename
      const baseUri = `file://${filename}`;
      
      // Parse the ontology data
      RDF.parse(content, ontologyStore, baseUri, contentType, (error, _) => {
        if (error) {
          console.error('Error parsing ontology:', error);
          setLoading(false);
          alert('Error parsing ontology file.');
          return;
        }
        
        // Get all named entities from the existing store
        const referencedEntities = new Set<string>();
        
        // Collect all named entities (subjects and objects) from the existing store
        existingStore.statements.forEach(statement => {
          if (statement.subject.termType === 'NamedNode') {
            referencedEntities.add(statement.subject.value);
          }
          if (statement.object.termType === 'NamedNode') {
            referencedEntities.add(statement.object.value);
          }
          if (statement.predicate.termType === 'NamedNode') {
            referencedEntities.add(statement.predicate.value);
          }
        });
        
        // Find all statements in the ontology that relate to entities in our data
        // or that are immediately connected to them
        const statementsToAdd: RDF.Statement[] = [];
        
        ontologyStore.statements.forEach(statement => {
          // Include statements where the subject is referenced in our data
          if (statement.subject.termType === 'NamedNode' && 
              referencedEntities.has(statement.subject.value)) {
            statementsToAdd.push(statement);
          }
          // Include statements where the object is referenced in our data
          else if (statement.object.termType === 'NamedNode' && 
                  referencedEntities.has(statement.object.value)) {
            statementsToAdd.push(statement);
          }
          // Include statements where the predicate is referenced in our data
          else if (referencedEntities.has(statement.predicate.value)) {
            statementsToAdd.push(statement);
          }
        });
        
        // Add the filtered statements to the existing store
        statementsToAdd.forEach(statement => {
          existingStore.add(
            statement.subject,
            statement.predicate,
            statement.object,
            statement.graph
          );
        });
        
        // Add ontology to the list of loaded ontologies
        const newOntology: LoadedOntology = {
          name: filename,
          uri: baseUri,
          statements: statementsToAdd.length
        };
        
        setLoadedOntologies(prev => [...prev, newOntology]);
        
        // Pass the enhanced store back without triggering a subjects update
        // We use a special flag or property to indicate this is an ontology update
        onRdfLoaded(existingStore, true);
        setLoading(false);
      });
    } catch (error) {
      console.error('Error processing ontology data:', error);
      setLoading(false);
      alert('Error processing ontology file.');
    }
  };

  // Methods to trigger file input clicks
  const triggerRdfFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerOntologyFileInput = () => {
    if (ontologyInputRef.current) {
      ontologyInputRef.current.click();
    }
  };

  return (
    <Box className="file-input">
      <Box style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'var(--color-panel-solid)', borderRadius: 'var(--radius-4)', border: '1px solid var(--gray-5)' }}>
        <Flex direction="column" gap="3">
          <Box>
            {/* Hidden file inputs */}
            <input
              id="rdf-file"
              type="file"
              accept=".rdf,.ttl,.nt,.jsonld,.n3,.xml,.json"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <input
              id="ontology-file"
              type="file"
              accept=".rdf,.ttl,.nt,.jsonld,.n3,.xml,.json"
              onChange={handleOntologyFileChange}
              ref={ontologyInputRef}
              disabled={!store}
              style={{ display: 'none' }}
            />
            
            {/* Dropdown Menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="soft" size="2">
                  Import
                  <ChevronDownIcon />
                </Button>
              </DropdownMenu.Trigger>
              
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="dropdown-content" sideOffset={5}>
                  <DropdownMenu.Item 
                    className="dropdown-item" 
                    onSelect={triggerRdfFileInput}
                  >
                    Load RDF Data
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Separator className="dropdown-separator" />
                  
                  <DropdownMenu.Item 
                    className="dropdown-item" 
                    onSelect={triggerOntologyFileInput}
                    disabled={!store}
                  >
                    Load Ontology
                  </DropdownMenu.Item>
                  
                  <DropdownMenu.Arrow className="dropdown-arrow" />
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </Box>
          
          {store && loadedOntologies.length > 0 && (
            <Box mt="3">
              <Heading as="h4" size="3" mb="2">Loaded Ontologies:</Heading>
              <ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '150px' }}>
                <Box asChild>
                  <ul style={{ margin: '0', paddingLeft: '20px' }}>
                    {loadedOntologies.map((ontology, index) => (
                      <li key={index}>
                        <Text size="2">
                          {ontology.name} <Text size="1" color="gray">({ontology.statements} statements)</Text>
                        </Text>
                      </li>
                    ))}
                  </ul>
                </Box>
              </ScrollArea>
            </Box>
          )}
          
          {store && (
            <Text as="p" size="1" color="gray" mt="1">
              Ontology will be filtered to include only entities referenced in the data.
            </Text>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default RdfLoader;
