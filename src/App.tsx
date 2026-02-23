import { Container } from '@radix-ui/themes';
import React, { useState } from 'react';
import { RdfUpload } from './components/RdfUpload';
import { RdfSource, RdfViewer } from './components/RdfViewer';


const App: React.FC = () => {
  const [dataSources, setDataSources] = useState<RdfSource[]>([]);
  const [ontologySources, setOntologySources] = useState<RdfSource[]>([]);
  return (
    <Container size="3" p="4">
      Upload RDF data:
    <RdfUpload onUpload={(source) => setDataSources(prev => [...prev, source])}></RdfUpload>

    Upload RDF ontologies:
    <RdfUpload onUpload={(source) => setOntologySources(prev => [...prev, source])}></RdfUpload>

    <RdfViewer dataSources={dataSources} ontologySources={ontologySources} baseUri="http://example.org/"></RdfViewer>
    </Container>
  )
};

export default App;
