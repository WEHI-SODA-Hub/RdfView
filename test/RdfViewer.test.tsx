import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { Statement } from 'rdflib';
import { afterEach, describe, expect, it } from 'vitest';
import { OntologyStore } from '../src/Store';
import { EntityFilter, RdfViewer, RdfViewerProps } from '../src/components/RdfViewer';

const BASE_URI = 'https://example.org/crate/';
const SCHEMA_DESCRIPTION = 'https://schema.org/description';

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

// Minimal standard-vocabulary ontology used to give the graph readable labels.
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

const rootSubjectFilter: EntityFilter = (subject) =>
  subject.termType === 'NamedNode' && subject.value === BASE_URI;

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

describe('RdfViewer entity filtering', () => {
  it('displays all entities and navigation by default', async () => {
    renderViewer();

    expect(await screen.findByRole('heading', { name: 'Example dataset' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Example creator' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Entities' })).toBeInTheDocument();
    const creatorRow = screen.getByRole('row', { name: 'creator Example creator' });
    expect(creatorRow.querySelector('a')).toBeInTheDocument();
  });

  it('filters the resolved root entity and disables navigation to hidden entities', async () => {
    renderViewer({ entityFilter: rootSubjectFilter });

    expect(await screen.findByRole('heading', { name: 'Example dataset' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Example creator' })).not.toBeInTheDocument();

    const hiddenEntityLabel = screen.getByText('Example creator');
    expect(hiddenEntityLabel).toBeInTheDocument();
    expect(hiddenEntityLabel.closest('a')).toBeNull();
  });

  it('hides the entity list without hiding entity tables', async () => {
    renderViewer({ showEntityList: false });

    expect(await screen.findByRole('heading', { name: 'Example dataset' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Example creator' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Entities' })).not.toBeInTheDocument();
  });

  it('updates displayed entities when the filter changes', async () => {
    const { rerender } = renderViewer();
    expect(await screen.findByRole('heading', { name: 'Example creator' })).toBeInTheDocument();

    rerender(
      <RdfViewer
        baseUri={BASE_URI}
        dataSources={dataSources}
        ontologySources={ontologySources}
        entityFilter={rootSubjectFilter}
      />,
    );
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Example creator' })).not.toBeInTheDocument();
    });

    rerender(
      <RdfViewer
        baseUri={BASE_URI}
        dataSources={dataSources}
        ontologySources={ontologySources}
      />,
    );
    expect(await screen.findByRole('heading', { name: 'Example creator' })).toBeInTheDocument();
  });

  it('applies statement filtering independently of entity filtering', async () => {
    const skipDescription = (statement: Statement, _store: OntologyStore) =>
      statement.predicate.value === SCHEMA_DESCRIPTION;

    renderViewer({
      entityFilter: rootSubjectFilter,
      skipStatement: skipDescription,
    });

    expect(await screen.findByRole('heading', { name: 'Example dataset' })).toBeInTheDocument();
    expect(screen.queryByText('description')).not.toBeInTheDocument();
    expect(screen.queryByText('Example description')).not.toBeInTheDocument();
    expect(screen.getByText('creator')).toBeInTheDocument();
  });

  it('displays an empty state when no entities match', async () => {
    renderViewer({ entityFilter: () => false });

    expect(await screen.findByText('No entities found')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Entities' })).not.toBeInTheDocument();
  });
});
