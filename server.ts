/**
 * Figma Model Context Protocol サーバー
 *
 * MCPプロトコルを使用してFigma APIとのインテグレーションを提供するサーバー
 */

import { load } from "https://deno.land/std@0.203.0/dotenv/mod.ts";
import { Server } from "npm:@modelcontextprotocol/sdk@1.8.0/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.8.0/server/stdio.js";
import {
	CallToolRequest,
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
} from "npm:@modelcontextprotocol/sdk@1.8.0/types.js";
import { FigmaClient } from "./src/api/figma_client.ts";

// .env ファイルを読み込む
await load({ export: true });

// 環境変数から Figma アクセストークンを取得
const FIGMA_ACCESS_TOKEN = Deno.env.get("FIGMA_ACCESS_TOKEN");

if (!FIGMA_ACCESS_TOKEN) {
	console.error("Error: FIGMA_ACCESS_TOKEN environment variable is not set");
	Deno.exit(1);
}

// FigmaAPIクライアントの初期化
const figma = new FigmaClient({
	accessToken: FIGMA_ACCESS_TOKEN,
});

// ツール定義
const TOOLS = [
	{
		name: "figma_getFile",
		description: "Get a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file to retrieve",
				},
				version: {
					type: "string",
					description: "A specific version ID to retrieve",
				},
				depth: {
					type: "number",
					description:
						"Depth of nodes to retrieve (defaults to entire document)",
				},
			},
			required: ["file_key"],
		},
	},
	{
		name: "figma_getNode",
		description: "Get a specific node from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				nodeId: {
					type: "string",
					description: "The ID of the node to retrieve",
				},
			},
			required: ["file_key", "nodeId"],
		},
	},
	{
		name: "figma_getComponents",
		description: "Get components from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
			},
			required: ["file_key"],
		},
	},
	{
		name: "figma_getStyles",
		description: "Get styles from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
			},
			required: ["file_key"],
		},
	},
	{
		name: "figma_getComments",
		description: "Get comments from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
			},
			required: ["file_key"],
		},
	},
	{
		name: "figma_getImages",
		description: "Get images from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				ids: {
					type: "array",
					description: "Array of node IDs to render",
					items: {
						type: "string",
					},
				},
				scale: {
					type: "number",
					description: "Scale factor for rendering (default: 1)",
				},
				format: {
					type: "string",
					enum: ["jpg", "png", "svg", "pdf"],
					description: "Image format to use",
				},
			},
			required: ["file_key", "ids"],
		},
	},
];

// リソース定義
const RESOURCES = [
	{
		name: "figma_file",
		uriPattern: "figma://file/{file_key}",
		description: "Figma file with document structure and content",
		parameters: {
			file_key: {
				description: "The key of the Figma file",
				schema: { type: "string" },
			},
		},
	},
	{
		name: "figma_node",
		uriPattern: "figma://file/{file_key}/node/{node_id}",
		description: "Specific node from a Figma file",
		parameters: {
			file_key: {
				description: "The key of the Figma file",
				schema: { type: "string" },
			},
			node_id: {
				description: "The ID of the node",
				schema: { type: "string" },
			},
		},
	},
	{
		name: "figma_component",
		uriPattern: "figma://component/{component_key}",
		description: "Figma component",
		parameters: {
			component_key: {
				description: "The key of the component",
				schema: { type: "string" },
			},
		},
	},
	{
		name: "figma_style",
		uriPattern: "figma://style/{style_key}",
		description: "Figma style",
		parameters: {
			style_key: {
				description: "The key of the style",
				schema: { type: "string" },
			},
		},
	},
	{
		name: "figma_comment",
		uriPattern: "figma://file/{file_key}/comment/{comment_id}",
		description: "Figma comment",
		parameters: {
			file_key: {
				description: "The key of the Figma file",
				schema: { type: "string" },
			},
			comment_id: {
				description: "The ID of the comment",
				schema: { type: "string" },
			},
		},
	},
];

// MCPサーバーの初期化
const server = new Server(
	{
		name: "figma-mcp-server",
		version: "1.0.0",
	},
	{
		capabilities: {
			resources: {
				figma_file: RESOURCES[0],
				figma_node: RESOURCES[1],
				figma_component: RESOURCES[2],
				figma_style: RESOURCES[3],
				figma_comment: RESOURCES[4],
			},
			tools: {
				figma_getFile: TOOLS[0],
				figma_getNode: TOOLS[1],
				figma_getComponents: TOOLS[2],
				figma_getStyles: TOOLS[3],
				figma_getComments: TOOLS[4],
				figma_getImages: TOOLS[5],
			},
		},
	},
);

server.setRequestHandler(ListResourcesRequestSchema, () => ({
	resources: RESOURCES,
}));

// ツール一覧ハンドラー
server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: TOOLS }));

// // リソースハンドラーの登録
// server.resource(
//   "figma_file",
//   resourceProvider.getFileResourceTemplate(),
//   async (uri, { fileKey }) => {
//     try {
//       const file = await figma.getFile({ key: fileKey });
//       const resource = resourceProvider.adapter.convertFileToResource(file, fileKey);

//       return {
//         contents: [resource]
//       };
//     } catch (error) {
//       console.error(`Error retrieving file ${fileKey}:`, error);
//       return {
//         contents: [
//           {
//             uri: uri.href,
//             text: `Error retrieving file: ${error instanceof Error ? error.message : String(error)}`
//           }
//         ]
//       };
//     }
//   }
// );

// server.resource(
//   "figma_node",
//   resourceProvider.getNodeResourceTemplate(),
//   async (uri, { fileKey, nodeId }) => {
//     try {
//       const node = await figma.getNode(fileKey, nodeId);

//       if (!node) {
//         throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
//       }

//       const resource = resourceProvider.adapter.convertNodeToResource(node, fileKey, nodeId);

//       return {
//         contents: [resource]
//       };
//     } catch (error) {
//       console.error(`Error retrieving node ${nodeId}:`, error);
//       return {
//         contents: [
//           {
//             uri: uri.href,
//             text: `Error retrieving node: ${error instanceof Error ? error.message : String(error)}`
//           }
//         ]
//       };
//     }
//   }
// );

// // ツールハンドラーの登録
// server.tool(
//   "figma_getFile",
//   TOOLS[0].inputSchema,
//   async (params) => {
//     try {
//       const { fileKey, version, depth } = params;
//       const file = await figma.getFile({
//         key: fileKey as string,
//         version: version as string,
//         depth: depth as number
//       });

//       const content = resourceProvider.convertFileToContent(file, fileKey as string);

//       return {
//         content: [content]
//       };
//     } catch (error) {
//       console.error(`Error in figma_getFile:`, error);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error: ${error instanceof Error ? error.message : String(error)}`
//           }
//         ]
//       };
//     }
//   }
// );

// server.tool(
//   "figma_getNode",
//   TOOLS[1].inputSchema,
//   async (params) => {
//     try {
//       const { fileKey, nodeId } = params;
//       const node = await figma.getNode(fileKey as string, nodeId as string);

//       if (!node) {
//         throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
//       }

//       const content = resourceProvider.convertNodeToContent(node, fileKey as string, nodeId as string);

//       return {
//         content: [content]
//       };
//     } catch (error) {
//       console.error(`Error in figma_getNode:`, error);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error: ${error instanceof Error ? error.message : String(error)}`
//           }
//         ]
//       };
//     }
//   }
// );

// server.tool(
//   "figma_getComponents",
//   TOOLS[2].inputSchema,
//   async (params) => {
//     try {
//       const { fileKey } = params;
//       const components = await figma.findComponents(fileKey as string);

//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(components, null, 2)
//           }
//         ]
//       };
//     } catch (error) {
//       console.error(`Error in figma_getComponents:`, error);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error: ${error instanceof Error ? error.message : String(error)}`
//           }
//         ]
//       };
//     }
//   }
// );

// server.tool(
//   "figma_getStyles",
//   TOOLS[3].inputSchema,
//   async (params) => {
//     try {
//       const { fileKey } = params;
//       const styles = await figma.findStyles(fileKey as string);

//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(styles, null, 2)
//           }
//         ]
//       };
//     } catch (error) {
//       console.error(`Error in figma_getStyles:`, error);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error: ${error instanceof Error ? error.message : String(error)}`
//           }
//         ]
//       };
//     }
//   }
// );

// server.tool(
//   "figma_getComments",
//   TOOLS[4].inputSchema,
//   async (params) => {
//     try {
//       const { fileKey } = params;
//       const comments = await figma.getFileComments(fileKey as string);

//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(comments, null, 2)
//           }
//         ]
//       };
//     } catch (error) {
//       console.error(`Error in figma_getComments:`, error);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error: ${error instanceof Error ? error.message : String(error)}`
//           }
//         ]
//       };
//     }
//   }
// );

// server.tool(
//   "figma_getImages",
//   TOOLS[5].inputSchema,
//   async (params) => {
//     try {
//       const { fileKey, ids, scale, format } = params;
//       const images = await figma.getImage(fileKey as string, {
//         ids: ids as string[],
//         scale: scale as number,
//         format: format as string
//       });

//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(images, null, 2)
//           }
//         ]
//       };
//     } catch (error) {
//       console.error(`Error in figma_getImages:`, error);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error: ${error instanceof Error ? error.message : String(error)}`
//           }
//         ]
//       };
//     }
//   }
// );

// ツールハンドラー
server.setRequestHandler(
	CallToolRequestSchema,
	async (request: CallToolRequest) => {
		const name = request.params.name;
		const args = request.params.arguments ?? {};

		try {
			switch (name) {
				case "figma_getFile": {
					const file = await figma.getFile(args);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(file, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getNode": {
					const node = await figma.getNode(args.file_key, args.nodeId);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(node, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getComponents": {
					const components = await figma.getAllFileComponents(args.file_key);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(components, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getStyles": {
					const styles = await figma.getAllFileStyles(args.file_key);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(styles, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getComments": {
					const comments = await figma.getComments({ file_key: args.file_key });
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(comments, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getImages": {
					const images = await figma.getImage(args.file_key, {
						ids: args.ids,
						scale: args.scale,
						format: args.format,
					});
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(images, null, 2),
							},
						],
						isError: false,
					};
				}
			}
		} catch (error) {
			console.error(`Error executing tool ${name}:`, error);
			return {
				content: [
					{
						type: "text",
						text: `Error executing tool ${name}: ${error.message}`,
					},
				],
				isError: true,
			};
		}
	},
);

// サーバーの起動
await server.connect(new StdioServerTransport());
console.error("MCP Figma server running on stdio");
