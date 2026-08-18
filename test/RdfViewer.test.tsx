import { cleanup, render, screen } from '@testing-library/react';
import * as RDF from 'rdflib';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isDisplayableStatement,
  RdfViewer,
  RdfViewerProps,
} from '../src/components/RdfViewer';

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

// rdflib parses JSON-LD @list values as Collection terms, which PropertyTable cannot render
const collectionDataSources: RdfViewerProps['dataSources'] = [{
  content: JSON.stringify({
    '@graph': [
      {
        '@id': './',
        'https://schema.org/keywords': {
          '@list': ['one', 'two'],
        },
        'https://schema.org/name': 'Collection dataset',
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
    schema:keywords rdfs:label "keywords" .
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

describe('isDisplayableStatement', () => {
  const subject = RDF.namedNode('https://example.org/subject');
  const predicate = RDF.namedNode('https://example.org/predicate');

  // PropertyTable can render these standard RDF object terms
  it.each([
    ['named node', RDF.namedNode('https://example.org/object')],
    ['blank node', RDF.blankNode('object')],
    ['literal', RDF.literal('value')],
  ])('accepts a named-node predicate with a %s object', (_, object) => {
    expect(isDisplayableStatement(new RDF.Statement(subject, predicate, object))).toBe(true);
  });

  it('rejects a variable predicate', () => {
    const statement = new RDF.Statement(
      subject,
      RDF.variable('predicate'),
      RDF.literal('value'),
    );

    expect(isDisplayableStatement(statement)).toBe(false);
  });

  // rdflib can produce these extended terms, but PropertyTable cannot render them yet
  it.each([
    ['variable', RDF.variable('object')],
    ['collection', new RDF.Collection([RDF.literal('value')])],
    ['empty', new RDF.Empty()],
  ])('rejects a named-node predicate with a %s object', (_, object) => {
    expect(isDisplayableStatement(new RDF.Statement(subject, predicate, object))).toBe(false);
  });
});

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

  it('ignores statements with object terms the property table cannot display', async () => {
    renderViewer({ dataSources: collectionDataSources });

    // Supported statements still render, while the unsupported collection statement is omitted
    expect(await screen.findByRole('heading', { name: 'Collection dataset' })).toBeInTheDocument();
    expect(screen.queryByText('keywords')).not.toBeInTheDocument();
  });
});
