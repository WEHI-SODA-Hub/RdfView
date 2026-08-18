import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RdfViewer, RdfViewerProps } from '../src/components/RdfViewer';

const BASE_URI = 'https://example.org/crate/';

// Minimal self-contained JSON-LD graph with two linked subjects.
const dataSources: RdfViewerProps['dataSources'] = [{
  content: JSON.stringify({
    '@graph': [
      {
        '@id': './',
        '@type': 'https://schema.org/Dataset',
        'https://schema.org/creator': { '@id': '#creator' },
        'https://schema.org/description': 'Example description',
        'https://schema.org/name': 'Example dataset',
      },
      {
        '@id': '#creator',
        '@type': 'https://schema.org/Person',
        'https://schema.org/name': 'Example creator',
      },
    ],
  }),
  contentType: 'application/ld+json',
}];

// Minimal standard-vocabulary ontology used to give the graph readable labels
const ontologySources: RdfViewerProps['ontologySources'] = [{
  content: `
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix schema: <https://schema.org/> .

    rdf:type rdfs:label "type" .
    schema:name rdfs:label "name" ; rdfs:subPropertyOf rdfs:label .
    schema:creator rdfs:label "creator" .
    schema:description rdfs:label "description" .
    schema:Dataset rdfs:label "Dataset" .
    schema:Person rdfs:label "Person" .
  `,
  contentType: 'text/turtle',
}];

function renderViewer(props: Partial<RdfViewerProps> = {}) {
  return render(
    <RdfViewer
      baseUri={BASE_URI}
      dataSources={dataSources}
      ontologySources={ontologySources}
      {...props}
    />,
  );
}

afterEach(cleanup);

describe('RdfViewer display options', () => {
  it('displays all entities and navigation by default', async () => {
    renderViewer();

    expect(await screen.findByRole('heading', { name: 'Example dataset' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Example creator' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Entities' })).toBeInTheDocument();
    const creatorRow = screen.getByRole('row', { name: 'creator Example creator' });
    expect(creatorRow.querySelector('a')).toBeInTheDocument();
  });

  it('hides the entity list without hiding entity tables', async () => {
    renderViewer({ showEntityList: false });

    expect(await screen.findByRole('heading', { name: 'Example dataset' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Example creator' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Entities' })).not.toBeInTheDocument();
  });
});
