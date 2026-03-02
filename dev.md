# Design
* This is designed to be a component library, the `demo/` app is really for demonstration purposes only, not for distribution
* Equally, the `RdfUpload` component isn't meaningfully meant to be user facing
* The `OntologyStore` class is completely decoupled from React. It's a pure-JS class.
* `RdfViewer` is the only component that is aware of the `OntologyStore`. The `EntityList` and `PropertyTable` get given statements from the store.
