// Loads one or more RDF files, keeps only triples whose predicate is
// rdfs:label, rdfs:comment, or rdfs:subPropertyOf, then prints Turtle to stdout.

import * as fs from 'fs';
import * as path from 'path';
import * as RDF from 'rdflib';
import { parseRdf, serializeRdf, EXTENSION_TO_CONTENT_TYPE } from '../src/rdfLibUtils.ts';
import { label, comment, subPropertyOf } from '../src/RDFS.ts';

const FILTER_PREDICATES = [label, comment, subPropertyOf];

async function main(): Promise<void> {
    const files = process.argv.slice(2);
    const store = RDF.graph();

    for (const filePath of files) {
        const absPath = path.resolve(filePath);
        let content: string;
        content = fs.readFileSync(absPath, 'utf8');
        const ext = path.extname(absPath).toLowerCase();
        const contentType = EXTENSION_TO_CONTENT_TYPE[ext] ?? 'text/turtle';
        const baseUri = `file://${absPath}`;
        await parseRdf(store, content, baseUri, contentType);
    }

    const filteredStore = RDF.graph();
    for (const predicate of FILTER_PREDICATES) {
        for (const st of store.statementsMatching(null, predicate, null, null)) {
            filteredStore.add(st.subject, st.predicate, st.object, st.graph);
        }
    }

    const turtle = await serializeRdf(filteredStore, 'http://example.org/', 'text/turtle');
    process.stdout.write(turtle);
}
await main();

// main().catch(err => {
//     process.stderr.write(`Unexpected error: ${err.message}\n`);
//     process.exit(1);
// });
