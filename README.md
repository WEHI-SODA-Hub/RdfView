# RDF Viewer

**Visit https://wehi-soda-hub.github.io/RdfView/**.

*Please note that this is in very early development and is basically a proof of concept at this point.*

## Motivation

RdfView is similar to other table viewers like [`ro-crate-html-js`](https://github.com/Language-Research-Technology/ro-crate-html-js).
RdfView was developed for somewhat different requirements.
In particular:
* It supports loading ontology files to describe the graph. This means that vocabularies other than schema.org can be fully understood
* It is not RO-Crate specific
* It shows triples with the same predicate separately instead of grouped
* Any entity can be viewed, including classes
* It's a web application, so non-technical users can use it

## Demo Application

The `demo/` directory contains a standalone web app that lets you load and browse RDF files in the browser.

You can try out the demo application by visiting https://wehi-soda-hub.github.io/RdfView/.

Alternatively, to run it locally, clone this repo and then run:

```bash
npm install
npm run dev
```

## Library Usage

`rdf-viewer` exports two React components:

```tsx
import { RdfViewer, RdfUpload } from 'rdf-viewer';
import type { RdfSource } from 'rdf-viewer';
```

Refer to the source code for prop descriptions for each of these components.

## Pre-processing Ontologies with `filterRdfs.ts`

Large ontologies (e.g. schema.org, OWL, SKOS) contain thousands of triples that `rdf-viewer` never uses — axioms, domain/range constraints, deprecated terms, etc. Only three predicate types influence rendering:

The `scripts/filterRdfs.ts` utility strips an ontology file down to only these triples, producing a much smaller file that is faster to fetch and parse in the browser.

e.g.
```bash
curl https://www.w3.org/2000/01/rdf-schema > rdfs.ttl
node scripts/filterRdfs.ts rdfs.ttl > output.ttl
```

You can then import the resulting `output.ttl` in your bundler, and pass it via the `ontologySources` prop.
