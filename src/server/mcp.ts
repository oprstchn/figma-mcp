import { McpServer } from "@mcp/sdk/server/mcp.js";
import { load } from "std/dotenv/mod.ts";
import { FigmaResource } from "../resource.ts";
import { FigmaTools } from "../tools.ts";

// .env ファイルを読み込む
await load({ export: true });

// 環境変数から Figma アクセストークンを取得
const FIGMA_ACCESS_TOKEN = Deno.env.get("FIGMA_ACCESS_TOKEN");

if (!FIGMA_ACCESS_TOKEN) {
	console.error("Error: FIGMA_ACCESS_TOKEN environment variable is not set");
	Deno.exit(1);
}

// FigmaToolsの初期化
const figmaTools = new FigmaTools(FIGMA_ACCESS_TOKEN);

// FigmaResourceの初期化
const figmaResource = new FigmaResource(FIGMA_ACCESS_TOKEN);

// MCPサーバーの初期化
const server = new McpServer(
	{
		name: "figma-mcp-server",
		version: "1.0.0",
	},
	{
		capabilities: {},
	},
);

// ツールの登録
for (const tool of figmaTools.getTools()) {
	server.tool(tool.name, tool.description, tool.inputSchema, tool.cb);
}

// リソースの登録
for (const resource of figmaResource.getResources()) {
	server.resource(
		resource.name,
		resource.template,
		resource.metadata,
		resource.readCallback,
	);
}

export default server;
