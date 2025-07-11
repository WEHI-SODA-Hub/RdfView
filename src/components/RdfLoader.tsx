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
      RDF.parse(content, store, baseUri, contentType, (error, _) => {
        // Pass the store to the parent component
        onRdfLoaded(store);
      });
    } catch (error) {
      console.error('Error parsing RDF data:', error);
      setLoading(false);
      alert('Error parsing RDF file. Please check if the format matches the file extension.');
    }
  };

  return (
    <div className="file-input">
      <input
        type="file"
        accept=".rdf,.ttl,.nt,.jsonld,.n3,.xml,.json"
        onChange={handleFileChange}
        ref={fileInputRef}
      />
    </div>
  );
};

export default RdfLoader;
