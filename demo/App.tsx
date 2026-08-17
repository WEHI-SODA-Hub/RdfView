import { Container, Flex } from '@radix-ui/themes';
import React, { useState } from 'react';
import { RdfUpload } from '../src/components/RdfUpload';
import { RdfSource, RdfViewer } from '../src/components/RdfViewer';

const BASE_URI = 'http://example.org/';

const App: React.FC = () => {
  const [dataSources, setDataSources] = useState<RdfSource[]>([]);
  const [ontologySources, setOntologySources] = useState<RdfSource[]>([]);
  const [showEntityList, setShowEntityList] = useState(true);

  return (
    <Container size="3" p="4">
      Upload RDF data:
      <RdfUpload onUpload={(source) => setDataSources(prev => [...prev, source])}></RdfUpload>

      Upload RDF ontologies:
      <RdfUpload onUpload={(source) => setOntologySources(prev => [...prev, source])}></RdfUpload>

      <Flex direction="column" gap="2" my="4">
        <label>
          <input
            type="checkbox"
            checked={showEntityList}
            onChange={(event) => setShowEntityList(event.target.checked)}
          />
          Show entity list
        </label>
      </Flex>

      <RdfViewer
        dataSources={dataSources}
        ontologySources={ontologySources}
        baseUri={BASE_URI}
        showEntityList={showEntityList}
        skipStatement={(statement, store) =>
          statement.object.termType == "Variable" || statement.object.termType == "Collection" || statement.object.termType == "Empty" || !store.entityName(statement.predicate) || !store.entityName(statement.object)
        }
      />
    </Container>
  )
};

export default App;
