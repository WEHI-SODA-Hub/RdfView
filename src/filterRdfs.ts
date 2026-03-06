// Loads one or more RDF files, keeps only triples whose predicate is
// rdfs:label, rdfs:comment, or rdfs:subPropertyOf, then prints Turtle to stdout.

import * as fs from 'fs';
import * as path from 'path';
import * as RDF from 'rdflib';
import { parseRdf, serializeRdf, EXTENSION_TO_CONTENT_TYPE } from './rdfLibUtils';
import { label, comment, subPropertyOf } from './RDFS';

const FILTER_PREDICATES = [label, comment, subPropertyOf];

export async function filterRdfs(files: string[], out: NodeJS.WritableStream = process.stdout): Promise<void> {
    const store = RDF.graph();

    for (const filePath of files) {
        const absPath = path.resolve(filePath);
        const content = fs.readFileSync(absPath, 'utf8');
        const ext = path.extname(absPath).toLowerCase();
        const contentType = EXTENSION_TO_CONTENT_TYPE[ext] ?? 'text/turtle';
        const baseUri = `file://${absPath}`;
        try {
            await parseRdf(store, content, baseUri, contentType);
        }
        catch (error) {
            console.error(`Error parsing ${filePath}:`, error);
        }
    }

    const filteredStore = RDF.graph();
    for (const predicate of FILTER_PREDICATES) {
        for (const st of store.statementsMatching(null, predicate, null, null)) {
            filteredStore.add(st.subject, st.predicate, st.object, st.graph);
        }
    }

    const turtle = await serializeRdf(filteredStore, 'http://example.org/', 'text/turtle');
    out.write(turtle);
}
