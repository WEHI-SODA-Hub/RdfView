// This script has moved into the main package.
// The library function is exported from src/filterRdfs.ts
// and the CLI entry point is at src/bin/filterRdfs.ts.
//
// To run directly:  npx filter-rdfs <files...>
// To import:        import { filterRdfs } from '@wehi-soda-hub/rdf-viewer/filterRdfs';

export { filterRdfs } from '../src/filterRdfs';

import { filterRdfs } from '../src/filterRdfs';
await filterRdfs(process.argv.slice(2));
