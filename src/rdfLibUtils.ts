import * as RDF from 'rdflib';
import { type ContentType, SubjectType } from "rdflib/lib/types.js";

/**
 * Promisified version of RDF.parse
 */
export async function parseRdf(store: RDF.Store, content: string, baseUri: string, contentType: string): Promise<RDF.Store> {
    return new Promise((resolve, reject) => {
        RDF.parse(content, store, baseUri, contentType, (error, _) => {
            if (error) {
                reject(error);
            }
            resolve(store);
        }
        );
    });
}

/**
 * Promisified version of RDF.serialize
 */
export async function serializeRdf(store: RDF.Formula, baseUri: string, contentType: ContentType): Promise<string> {
    return new Promise((resolve, reject) => {
        RDF.serialize(null, store, baseUri, contentType, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result ?? '');
            }
        });
    });
}

export const EXTENSION_TO_CONTENT_TYPE: Record<string, ContentType> = {
    ".ttl": "text/turtle",
    ".n3": "text/n3",
    ".nq": "application/n-quads",
    ".rdf": "application/rdf+xml",
    ".owl": "application/rdf+xml",
    ".xml": "application/rdf+xml",
    ".jsonld": "application/ld+json",
    ".json": "application/ld+json",
};

export function subjectToId(subject: SubjectType): string {
    return encodeURIComponent(subject.value);
}
