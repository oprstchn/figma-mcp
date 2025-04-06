/**
 * Figma Model Context Protocol サーバー
 *
 * MCPプロトコルを使用してFigma APIとのインテグレーションを提供するサーバー
 */

import server from "./src/server/mcp.ts";
import { createSSEServer } from "./src/server/sse.ts";
import { createStdioServer } from "./src/server/stdio.ts";

const modeArg = Deno.args.find((arg) => arg.startsWith("--mode="));
const portArg = Deno.args.find((arg) => arg.startsWith("--port="));

const mode = modeArg ? modeArg.split("=")[1] : null;
const port = portArg ? Number(portArg.split("=")[1]) : 8888;

if (mode === "stdio") {
	if (portArg) {
		console.warn("Warning: --port option is ignored in stdio mode");
	}
	await createStdioServer(server);
} else if (mode === "sse") {
	await createSSEServer(server, { port });
} else {
	console.error(
		"Usage: deno run --allow-net --allow-read --allow-write --allow-run main.ts --mode=stdio|sse [--port=PORT]",
	);
	Deno.exit(1);
}
