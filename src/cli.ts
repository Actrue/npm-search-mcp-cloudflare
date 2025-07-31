import { MyMCP } from "./mcp";

// Mock context and environment for CLI usage
const mockCtx: any = {
	waitUntil: () => {},
	passThroughOnException: () => {},
};

const mockEnv: any = {};

async function main() {
	const mcp = new MyMCP(mockCtx, mockEnv);
	await mcp.init();

	// Check if we're running in CLI mode
	if (process.argv.includes("--cli")) {
		await mcp.startCLI();
	} else {
		// Start the MCP server
		await mcp.startServer();
	}
}

main().catch(console.error);
