# RDF Viewer

**Visit https://wehi-soda-hub.github.io/RdfView/**.

*Please note that this is in very early development and is basically a proof of concept at this point.*

## Motivation

RdfView is similar to other table viewers like [`ro-crate-html-js`](https://github.com/Language-Research-Technology/ro-crate-html-js).
RdfView was developer for somewhat different requirements.
In particular:
* It supports loading ontology files to describe the graph. This means that vocabularies other than schema.org can be fully understood
* It is not RO-Crate specific
* It shows triples with the same predicate separately instead of grouped
* Any entity can be viewed, including classes
* It's a web application, so non-technical users can use it

## Technologies

- React with TypeScript
- RDFLib.js for RDF parsing and manipulation
- TanStack Query for state management
- Radix UI for a beautiful, accessible user interface
