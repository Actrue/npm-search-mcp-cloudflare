# NPM MCP Server

This is a Model Context Protocol (MCP) server that provides functionality to fetch information about npm packages.

## Features

1. **Package Search**: Tool to fetch detailed information about npm packages
2. **Popular Packages**: Resource to list the 10 most popular npm packages

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Running

```bash
npm start
```

For development:

```bash
npm run dev
```

## Usage

The server exposes two main functionalities:

### 1. searchNpmPackage Tool

Fetches detailed information about a specific npm package. The tool returns comprehensive package information including:

- Package name
- Latest version
- Description
- Author information
- Homepage URL
- Repository URL
- Dependencies list

Example usage:

```typescript
const result = await server.tools.searchNpmPackage({ packageName: "react" });
```

Example response:

```json
{
  "name": "react",
  "version": "18.2.0",
  "description": "React is a JavaScript library for building user interfaces.",
  "author": "Meta Open Source",
  "homepage": "https://reactjs.org/",
  "repository": {
    "url": "https://github.com/facebook/react.git"
  },
  "dependencies": {
    "loose-envify": "^1.1.0"
  }
}
```

### 2. popular-packages Resource

Lists the 10 most popular npm packages, sorted by popularity. Each package in the list includes:

- Package name
- Description
- Current version

Resource URI: `npm://popular`

Example response:

```json
[
  {
    "name": "lodash",
    "description": "Lodash modular utilities",
    "version": "4.17.21"
  },
  // ... more packages
]
```

## Integration with AI Models

This MCP server can be integrated with AI models to:

1. Get package information before installation
2. Compare different package versions
3. Analyze dependencies
4. Find popular alternatives
5. Get quick package summaries

## Technologies

- TypeScript
- Model Context Protocol SDK
- Node-fetch
- Zod
