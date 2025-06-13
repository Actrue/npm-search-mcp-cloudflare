import { McpAgent } from "agents/mcp";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

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

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "NpmSearch",
		version: "1.0.0"
	});

	async init() {
		// NPM package search tool
		this.server.tool(
			"searchNpmPackage",
			`搜索npm包信息工具，输入包名可获取该包的最新版本、描述、作者、主页、仓库地址和依赖关系等信息。`,
			{ packageName: z.string() },
			async ({ packageName }) => {
				try {
					const response = await fetch(`https://registry.npmjs.org/${packageName}`);
					const data = (await response.json()) as NpmPackage;
					
					if (response.ok) {
						const result = {
							name: data.name,
							version: data["dist-tags"].latest,
							description: data.description,
							author: typeof data.author === 'string' ? data.author : data.author?.name,
							homepage: data.homepage,
							repository: data.repository?.url,
							dependencies: data.versions[data["dist-tags"].latest].dependencies
						};

						return {
							content: [{
								type: "text",
								text: JSON.stringify(result, null, 2)
							}]
						};
					} else {
						const errorMsg = `Erro: Pacote '${packageName}' não encontrado`;
						return {
							content: [{
								type: "text",
								text: errorMsg
							}]
						};
					}
				} catch (error: unknown) {
					const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
					const errorMsg = `Erro ao buscar informações do pacote: ${errorMessage}`;
					return {
						content: [{
							type: "text",
							text: errorMsg
						}]
					};
				}
			}
		);

		// 获取npm上最流行的10个包信息
		this.server.resource(
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
	}
}