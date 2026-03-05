import * as RDF from 'rdflib';
import { NamedNode, BlankNode, Literal } from '@rdfjs/types';
import { ContentType } from 'rdflib/lib/types';

// Triple-specific types that exclude `Variable` and `DefaultGraph`, which are not relevant for our use case
export type Subject = NamedNode | BlankNode;
export type Object = NamedNode | BlankNode | Literal;
export type Predicate = NamedNode | BlankNode;

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
