import { cleanup, render, screen } from '@testing-library/react';
import * as RDF from 'rdflib';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isDisplayableStatement,
  PropertyTable,
} from '../src/components/PropertyTable';

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

describe('PropertyTable', () => {
  it('ignores variables because they are query placeholders rather than RDF values', () => {
    const subject = RDF.namedNode('https://example.org/dataset');
    const statements = [
      new RDF.Statement(
        subject,
        RDF.namedNode('https://schema.org/name'),
        RDF.literal('Example dataset'),
      ),
      new RDF.Statement(
        subject,
        RDF.namedNode('https://example.org/queryResult'),
        RDF.variable('result'),
      ),
    ];

    render(
      <PropertyTable
        subject={subject}
        statements={statements}
        nameFor={(term) => term.value}
        descriptionFor={() => null}
        hasStatements={() => false}
        onEntityClick={() => undefined}
      />,
    );

    // Supported statements still render while the variable statement is omitted
    expect(screen.getByRole('row', { name: 'https://schema.org/name Example dataset' })).toBeInTheDocument();
    expect(screen.queryByText('https://example.org/queryResult')).not.toBeInTheDocument();
  });
});
