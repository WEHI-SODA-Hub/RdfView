import * as RDF from 'rdflib';
import { subPropertyOf, label, comment } from './RDFS';
import { NamedNode, Quad_Subject as Subject, Term } from 'rdflib/lib/tf-types';
import { parseRdf } from './rdfLibUtils';

/**
 * Triple Store that keeps two stores: one for the main RDF data and one for the ontology.
 */
export class OntologyStore {
    data: RDF.Store;
    ontology: RDF.Store;
    /**
     * Set of predicates to use for entity names (e.g. rdfs:label)
     */
    namePredicates: Set<NamedNode>;
    /**
     * Set of predicates to use for entity descriptions (e.g. rdfs:comment)
     */
    descriptionPredicates: Set<NamedNode>;

    constructor() {
        this.data = RDF.graph();
        this.ontology = RDF.graph();
        this.namePredicates = new Set([label]);
        this.descriptionPredicates = new Set([comment]);
    }

    async addOntology(content: string, baseUri: string, contentType: string): Promise<void> {
        await parseRdf(this.ontology, content, baseUri, contentType);
        this.updatePredicates();
    }

    async addData(content: string, baseUri: string, contentType: string): Promise<void> {
        await parseRdf(this.data, content, baseUri, contentType);
        this.updatePredicates();
    }

    /**
     * Yields all subjects in the data store.
     */
    *getSubjects(): Generator<Subject> {
        for (const statement of this.data.statements) {
            yield statement.subject as Subject;
        }
    }

    /**
     * Updates the set of predicates to use for labels and descriptions using the ontology store.
     */
    updatePredicates() {
        // Find all predicates that are subproperties of rdfs:label
        this.ontology.statementsMatching(null, subPropertyOf, label, null).forEach(statement => {
            if (statement.subject.termType === 'NamedNode') {
                this.namePredicates.add(statement.subject as RDF.NamedNode);
            }
        });
        // Find all predicates that are subproperties of rdfs:comment
        this.ontology.statementsMatching(null, subPropertyOf, comment, null).forEach(statement => {
            if (statement.subject.termType === 'NamedNode') {
                this.descriptionPredicates.add(statement.subject as RDF.NamedNode);
            }
        });
    }

    anyStatementsMatching(subject: Subject | null, predicate: NamedNode | null, object: Term | null): RDF.Statement[] {
        return [...this.data.statementsMatching(subject, predicate, object, null), ...this.ontology.statementsMatching(subject, predicate, object, null)];
    }

    /**
     * Gets a human readable name for an entity, or null if no name can be found.
     */
    entityName(term: Term): string | null {
        if (term instanceof RDF.Literal) return term.value;
        else if (term instanceof RDF.Variable) {
            throw new Error(`Cannot get name for variable ${term.value}`);
        }
        else if (term instanceof RDF.BlankNode || term instanceof RDF.NamedNode) {
            for (const labelPredicate of this.namePredicates) {
                for (const label of this.anyStatementsMatching(term, labelPredicate, null)) {
                    return label.object.value;
                }
            }
            return null;
        }
        else {
            return null;
        }
    }

    /**
     *  Yields all types for a given entity, looking in both the data and ontology stores. 
     */
    *iterTypes(entity: NamedNode | RDF.BlankNode): Generator<NamedNode> {
        for (const typeStatement of this.anyStatementsMatching(entity, RDF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), null)) {
            if (typeStatement.object instanceof RDF.NamedNode) {
                yield typeStatement.object;
            }
        }
    }

    /**
     * Yields display-friendly types for a given entity 
     * @param preferredPrefix Optionally, a prefix to filter types by
     */
    *displayTypes(entity: NamedNode | RDF.BlankNode, preferredPrefix: string | null = null): Generator<string> {
        for (const type of this.iterTypes(entity)) {
            // Skip types that don't match the preferred prefix, if provided.
            if (preferredPrefix && !type.value.startsWith(preferredPrefix)) {
                continue;
            }
            const name = this.entityName(type);
            if (name) {
                yield name;
            }
        }
    }

    /**
     * Gets a display-friendly type for an entity, returning null if no types are found or if none match the preferred prefix (if provided).
     */
    displayType(entity: NamedNode | RDF.BlankNode, preferredPrefix: string | null = null): string | null {
        return this.displayTypes(entity, preferredPrefix).next().value ?? null
    }

    /**
     * Same as entityName but returns a default string if no name can be found.
     */
    // nameFor(term: Term): string {
    //     return this.entityName(term) || "<Unnamed entity>";
    // }


    /**
     * Same as entityDescription but returns an empty string if no description can be found.
     */
    // descriptionFor(entity: Term): string {
    //     return this.entityDescription(entity) || ""
    // }

    /**
     * Gets a human readable description for a term, returning null if no description can be found.
     */
    entityDescription(entity: Term): string | null {
        // Try each description predicate in order
        if (entity instanceof RDF.NamedNode || entity instanceof RDF.BlankNode) {
            for (const descriptionPredicate of this.descriptionPredicates) {
                for (const description of this.anyStatementsMatching(entity, descriptionPredicate, null)) {
                    return description.object.value;
                }
            }
        }
        return null;

        // TODO: consider handling case where no description is found 
        // If no label found, return the URI or its last part
        // const uri = entity.value;
        // const lastPart = uri.split(/[/#]/).pop();
        // return lastPart || uri;
    }
}
