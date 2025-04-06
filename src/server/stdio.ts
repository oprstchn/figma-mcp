import type { McpServer } from "@mcp/sdk/server/mcp.ts";
import { StdioServerTransport } from "@mcp/sdk/server/stdio.js";

export const createStdioServer = async (server: McpServer) => {
	const transport = new StdioServerTransport();
	await server.connect(transport);
};
