import type { McpServer } from "@mcp/sdk/server/mcp.js";
import { SSEServerTransport } from "@mcp/sdk/server/sse.js";
import express, { type Request, type Response } from "express";

export const createSSEServer = async (
	server: McpServer,
	config: { port: number },
) => {
	const app = express();
	const transports: { [sessionId: string]: SSEServerTransport } = {};
	app.get("/sse", async (_: Request, res: Response) => {
		const transport = new SSEServerTransport("/messages", res);
		transports[transport.sessionId] = transport;
		res.on("close", () => {
			delete transports[transport.sessionId];
		});
		await server.connect(transport);
	});

	app.post("/messages", async (req: Request, res: Response) => {
		const sessionId = req.query.sessionId;
		const transport = transports[sessionId];
		if (transport) {
			await transport.handlePostMessage(req, res);
		} else {
			res.status(404).send("Session not found");
		}
	});

	await app.listen(config.port);
};
