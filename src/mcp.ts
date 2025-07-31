import { McpAgent } from "agents/mcp";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchNpmPackage, searchNpmPackages, getDownloadStats } from "./tools";
import * as readline from "readline";

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
		version: "1.0.0",
	});

	// 存储SSE客户端连接
	private sseClients: Map<string, any> = new Map();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async init() {
		// NPM package search tool
		this.server.tool(
			"searchNpmPackage",
			`搜索npm包信息工具，输入包名可获取该包的最新版本、描述、作者、主页、仓库地址和依赖关系等信息。`,
			{ packageName: z.string() },
			async ({ packageName }) => {
				try {
					const result = await searchNpmPackage(packageName);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result),
							},
						],
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : "Erro desconhecido";
					const errorMsg = `Erro ao buscar informações do pacote: ${errorMessage}`;
					return {
						content: [
							{
								type: "text",
								text: errorMsg,
							},
						],
					};
				}
			},
		);

		// NPM package search by query tool
		this.server.tool(
			"searchNpmPackages",
			`搜索npm包工具，输入查询字符串可获取相关包的名称、描述、版本等信息。支持排序和分页选项。`,
			{
				query: z.string(),
				size: z.number().optional(),
				from: z.number().optional(),
				quality: z.number().optional(),
				popularity: z.number().optional(),
				maintenance: z.number().optional(),
				sortBy: z.enum(['optimal', 'quality', 'popularity', 'maintenance', 'created', 'updated', 'downloads']).optional()
			},
			async ({ query, size, from, quality, popularity, maintenance, sortBy }) => {
				try {
					const result = await searchNpmPackages(query, { size, from, quality, popularity, maintenance, sortBy });
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(
									result.objects.map((obj) => ({
										name: obj.package.name,
										description: obj.package.description,
										version: obj.package.version,
										date: obj.package.date,
										downloads: obj.package.downloads
									})),
								),
							},
						],
					};
				} catch (error: unknown) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error searching packages: ${errorMessage}`,
							},
						],
					};
				}
			},
		);

		// 获取npm包下载统计信息
		this.server.tool(
			"getDownloadStats",
			`获取npm包下载统计信息，可以指定时间范围（last-day, last-week, last-month）。`,
			{
				packageName: z.string(),
				period: z.enum(['last-day', 'last-week', 'last-month']).optional()
			},
			async ({ packageName, period }) => {
				try {
					const result = await getDownloadStats(packageName, period);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result),
							},
						],
					};
				} catch (error: unknown) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error fetching download stats: ${errorMessage}`,
							},
						],
					};
				}
			},
		);

		// 获取npm包下载统计信息
		this.server.tool(
			"getDownloadStats",
			`获取npm包下载统计信息，可以指定时间范围（last-day, last-week, last-month）。`,
			{
				packageName: z.string(),
				period: z.enum(['last-day', 'last-week', 'last-month']).optional()
			},
			async ({ packageName, period }) => {
				try {
					const result = await getDownloadStats(packageName, period);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result),
							},
						],
					};
				} catch (error: unknown) {
					const errorMessage = error instanceof Error ? error.message : "Unknown error";
					return {
						content: [
							{
								type: "text",
								text: `Error fetching download stats: ${errorMessage}`,
							},
						],
					};
				}
			},
		);

		// 获取npm上最流行的10个包信息
		this.server.resource(
			"popular-packages",
			new ResourceTemplate("npm://popular", { list: undefined }),
			async (uri) => {
				try {
					const response = await fetch(
						"https://registry.npmjs.org/-/v1/search?text=popularity&size=10",
					);
					const data = (await response.json()) as SearchResponse;

					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify(
									data.objects.map((obj) => ({
										name: obj.package.name,
										description: obj.package.description,
										version: obj.package.version,
									})),
									null,
									2,
								),
							},
						],
					};
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : "Erro desconhecido";
					return {
						contents: [
							{
								uri: uri.href,
								text: `Erro ao buscar pacotes populares: ${errorMessage}`,
							},
						],
					};
				}
			},
		);
	}

	// 添加SSE推送方法
	async pushDownloadStatsUpdate(packageName: string, stats: any) {
		// 这里需要实现SSE推送逻辑
		// 由于具体的SSE实现可能在McpAgent中，我们暂时只打印日志
		console.log(`Pushing download stats update for ${packageName}:`, stats);
	}

	// CLI functionality
	async startCLI() {
		console.log("\nServidor NPM iniciado!");
		console.log('Para buscar informações de um pacote, use: packageName = "nome-do-pacote"');
		console.log('Exemplo: packageName = "react-dom"\n');

		// Função para buscar informações do pacote
		async function searchNpmPackageCLI(packageName: string): Promise<void> {
			try {
				console.log(`\nBuscando informações para o pacote: ${packageName}`);
				const result = await searchNpmPackage(packageName);

				console.log("\nInformações do pacote:");
				console.log("-------------------");
				Object.entries(result).forEach(([key, value]) => {
					if (key === "dependencies") {
						console.log("\nDependências:");
						console.log(JSON.stringify(value, null, 2));
					} else {
						console.log(`${key}: ${value}`);
					}
				});
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
				console.log(`\nErro ao buscar informações do pacote: ${errorMessage}`);
			}
		}

		// Criar interface de linha de comando
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		// Função principal para interação com o usuário
		function startCLI() {
			console.log("\nBem-vindo ao NPM Package Info!");
			console.log(
				'Digite o nome do pacote para buscar informações ou "sair" para encerrar\n',
			);

			function askPackage() {
				rl.question("Nome do pacote: ", async (input) => {
					if (input.toLowerCase() === "sair") {
						console.log("\nAté logo!");
						rl.close();
						process.exit(0);
					}

					await searchNpmPackageCLI(input);
					console.log("\n-------------------");
					askPackage();
				});
			}

			askPackage();
		}

		// Iniciar o programa
		startCLI();
	}

	// Start the MCP server
	async startServer() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
	}
}
