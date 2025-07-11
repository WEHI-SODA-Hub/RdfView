import React, { useRef } from 'react';
import * as RDF from 'rdflib';

interface RdfLoaderProps {
  onRdfLoaded: (store: RDF.Store) => void;
  setLoading: (loading: boolean) => void;
}

const RdfLoader: React.FC<RdfLoaderProps> = ({ onRdfLoaded, setLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Create a base URI for the RDF data
      const baseUri = 'http://example.org/base';
      
      // Parse the RDF data
      RDF.parse(content, store, baseUri, contentType, (error, kb) => {
        // Pass the store to the parent component
        onRdfLoaded(store);
      });
    } catch (error) {
      console.error('Error parsing RDF data:', error);
      setLoading(false);
      alert('Error parsing RDF file. Please check if the format matches the file extension.');
    }
  };

  const handleDemoData = () => {
    setLoading(true);
    
    // Create a sample RDF graph
    const store = RDF.graph();
    const RDF_NS = RDF.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
    const RDFS_NS = RDF.Namespace('http://www.w3.org/2000/01/rdf-schema#');
    const EX_NS = RDF.Namespace('http://example.org/');
    
    // Create some sample data
    const alice = EX_NS('alice');
    const bob = EX_NS('bob');
    const charlie = EX_NS('charlie');
    const person = EX_NS('Person');
    
    // Add triples to the store
    store.add(alice, RDF_NS('type'), person);
    store.add(alice, RDFS_NS('label'), RDF.literal('Alice Smith'));
    store.add(alice, EX_NS('age'), RDF.literal('28'));
    store.add(alice, EX_NS('email'), RDF.literal('alice@example.org'));
    store.add(alice, EX_NS('knows'), bob);
    
    store.add(bob, RDF_NS('type'), person);
    store.add(bob, RDFS_NS('label'), RDF.literal('Bob Johnson'));
    store.add(bob, EX_NS('age'), RDF.literal('34'));
    store.add(bob, EX_NS('email'), RDF.literal('bob@example.org'));
    store.add(bob, EX_NS('knows'), charlie);
    
    store.add(charlie, RDF_NS('type'), person);
    store.add(charlie, RDFS_NS('label'), RDF.literal('Charlie Brown'));
    store.add(charlie, EX_NS('age'), RDF.literal('42'));
    store.add(charlie, EX_NS('email'), RDF.literal('charlie@example.org'));
    store.add(charlie, EX_NS('knows'), alice);
    
    // Pass the store to the parent component
    onRdfLoaded(store);
  };

  return (
    <div className="file-input">
      <input
        type="file"
        accept=".rdf,.ttl,.nt,.jsonld,.n3,.xml,.json"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ marginRight: '10px' }}
      />
      <button onClick={handleDemoData}>
        Load Demo Data
      </button>
    </div>
  );
};

export default RdfLoader;
