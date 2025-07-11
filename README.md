# RDF Viewer

A simple web application for browsing RDF data, built with React, TypeScript, TanStack Query, and rdflib.js.

## Features

- Load RDF data from local files (supports RDF/XML, Turtle, N-Triples, JSON-LD, N3)
- View a list of named entities in the RDF graph
- Browse entity properties in a table view
- Navigate between entities by clicking on entity references
- Load sample demo data to try out the application

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the Application

```bash
npm start
```

The application will be available at http://localhost:3000.

## How to Use

1. Load an RDF file using the file input at the top of the page, or click "Load Demo Data" to try the application with sample data.
2. Browse the list of entities on the left panel.
3. Click on an entity to view its properties in the right panel.
4. If a property value is a reference to another entity (shown as a clickable link), you can click on it to navigate to that entity.
5. You can also load ontology files to enhance your data with additional context. The ontology will be filtered to include only entities referenced in your data.

## Deployment

This project is set up to be deployed to GitHub Pages using two methods:

### Manual Deployment

To deploy the app manually:

1. Update the `homepage` field in `package.json` with your GitHub username:
   ```json
   "homepage": "https://YOUR_USERNAME.github.io/RdfViewer"
   ```

2. Run the deployment command:
   ```bash
   npm run deploy
   ```

### GitHub Actions

The project also includes a GitHub Actions workflow that automatically deploys the app to GitHub Pages whenever changes are pushed to the main branch. 

To use it:

1. Push your repository to GitHub
2. Go to your repository Settings → Pages
3. Set up GitHub Pages to deploy from the `gh-pages` branch
4. Push changes to the main branch to trigger automatic deployment

## Technologies Used

- React
- TypeScript
- TanStack Query (for state management)
- rdflib.js (for RDF parsing and manipulation)
- CSS for styling
