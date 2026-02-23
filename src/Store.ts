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

    nameFor(term: Term): string {
        if (term.termType === 'Literal') return term.value;
        else return this.entityName(term as Subject);
    }

    anyStatementsMatching(subject: Subject | null, predicate: NamedNode | null, object: Term | null): RDF.Statement[] {
        return [...this.data.statementsMatching(subject, predicate, object, null), ...this.ontology.statementsMatching(subject, predicate, object, null)];
    }

    /**
     * Gets a human readable name for an entity
     */
    entityName(entity: Subject): string {
        for (const labelPredicate of this.namePredicates) {
            for (const label of this.anyStatementsMatching(entity, labelPredicate, null)) {
                return label.object.value;
            }
        }
        throw new Error(`No label found for entity ${entity.value}`);
    }

    /**
     * Gets a description for any term 
     */
    descriptionFor(entity: Term): string | null {
        if (entity.termType === 'Literal') return null;
        else return this.entityDescription(entity as Subject);
    }

    /**
     * Gets a human readable description for an entity
     */
    entityDescription(entity: Subject): string {
        // Try each description predicate in order
        for (const descriptionPredicate of this.descriptionPredicates) {
            for (const description of this.anyStatementsMatching(entity, descriptionPredicate, null)) {
                return description.object.value;
            }
        }
        throw new Error(`No description found for entity ${entity.value}`);

        // TODO: consider handling case where no description is found 
        // If no label found, return the URI or its last part
        // const uri = entity.value;
        // const lastPart = uri.split(/[/#]/).pop();
        // return lastPart || uri;
    }
}
