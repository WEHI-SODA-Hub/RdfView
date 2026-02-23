/**
 * RDFS namespace and common properties
 */
import * as RDF from 'rdflib';

export const RDFS = RDF.Namespace("http://www.w3.org/2000/01/rdf-schema#");
export const subPropertyOf = RDFS('subPropertyOf');
export const label = RDFS('label');
export const comment= RDFS('comment');
