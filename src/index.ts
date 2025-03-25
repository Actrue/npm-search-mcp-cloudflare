import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

interface NpmPackage {
  name: string;
  description: string;
  "dist-tags": { latest: string };
  versions: { [key: string]: { dependencies: Record<string, string> } };
  author: { name: string } | string;
  homepage: string;
  repository: { url: string };
}

interface SearchResponse {
  objects: Array<{
    package: {
      name: string;
      description: string;
      version: string;
    };
  }>;
}

// Criar o servidor MCP
const server = new McpServer({
  name: "NpmSearchServer",
  version: "1.0.0"
});

// Adicionar ferramenta para buscar informações de pacotes npm
server.tool(
  "searchNpmPackage",
  { packageName: z.string() },
  async ({ packageName }) => {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);
      const data = (await response.json()) as NpmPackage;
      
      if (response.ok) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              name: data.name,
              version: data["dist-tags"].latest,
              description: data.description,
              author: data.author,
              homepage: data.homepage,
              repository: data.repository,
              dependencies: data.versions[data["dist-tags"].latest].dependencies
            }, null, 2)
          }]
        };
      } else {
        return {
          content: [{
            type: "text",
            text: `Erro: Pacote '${packageName}' não encontrado`
          }]
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        content: [{
          type: "text",
          text: `Erro ao buscar informações do pacote: ${errorMessage}`
        }]
      };
    }
  }
);

// Adicionar recurso para listar pacotes populares
server.resource(
  "popular-packages",
  new ResourceTemplate("npm://popular", { list: undefined }),
  async (uri) => {
    try {
      const response = await fetch("https://registry.npmjs.org/-/v1/search?text=popularity&size=10");
      const data = (await response.json()) as SearchResponse;
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(data.objects.map(obj => ({
            name: obj.package.name,
            description: obj.package.description,
            version: obj.package.version
          })), null, 2)
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return {
        contents: [{
          uri: uri.href,
          text: `Erro ao buscar pacotes populares: ${errorMessage}`
        }]
      };
    }
  }
);

// Iniciar o servidor
const transport = new StdioServerTransport();
void server.connect(transport); 