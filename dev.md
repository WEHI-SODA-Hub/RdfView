# Design
* This is designed to be a component library, the `demo/` app is really for demonstration purposes only, not for distribution
* Equally, the `RdfUpload` component isn't meaningfully meant to be user facing
* The `OntologyStore` class is completely decoupled from React. It's a pure-JS class.
* `RdfViewer` is the only component that is aware of the `OntologyStore`. The `EntityList` and `PropertyTable` get given statements from the store.

# Workflow

There are three separate vite configs, each targeting a different output:

## `build:lib` — Browser component library (`vite.config.lib.ts` → `dist/`)

The primary package output. Builds the React components (`RdfViewer`, `RdfUpload`, etc.) and utility code as an ES module bundle. React, rdflib, and Radix UI are externalized as peer dependencies so they aren't duplicated in the consumer's bundle. Type declarations are rolled up via `vite-plugin-dts`.

Consumers import this via the default package export:
```ts
import { RdfViewer } from '@wehi-soda-hub/rdf-viewer';
```

## `build:cli` — Node CLI tool (`vite.config.cli.ts` → `dist-cli/`)

Builds the `filterRdfs` function and its CLI wrapper as a Node-targeted ES module. Node builtins (`fs`, `path`, etc.) and `rdflib` are externalized. The CLI entry point gets a shebang banner added by Rollup.

This is kept in a separate build so that Node-only imports (`fs`, `path`) never leak into the browser bundle. Consumers can use the CLI directly or import the function programmatically:

```bash
npx filter-rdfs schema.ttl ontology.owl
```
```ts
import { filterRdfs } from '@wehi-soda-hub/rdf-viewer/filterRdfs';
```

## `build:demo` — Demo app (`vite.config.demo.ts` → `dist-demo/`)

Builds the demo/showcase app for GitHub Pages. This is a regular Vite app build rooted in `demo/` — it bundles everything (including React and rdflib) for standalone deployment. Not included in the published npm package.

## Why three builds?

The browser components and the Node CLI share source code (`rdfLibUtils.ts`, `RDFS.ts`) but have fundamentally different targets — one must avoid Node builtins, the other requires them. Separate Vite configs let each build externalize only what's appropriate for its environment. The demo is a third concern: a fully bundled standalone app that isn't part of the package at all.

All three outputs ship from the same `pnpm build` command:
```bash
pnpm build   # runs build:lib && build:cli && build:demo
```

Only `dist/` and `dist-cli/` are included in the published npm package (via the `files` field in `package.json`). The `exports` map routes each subpath to the correct directory.
