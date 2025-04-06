/**
 * Figma Model Context Protocol サーバー
 *
 * MCPプロトコルを使用してFigma APIとのインテグレーションを提供するサーバー
 */

import { Server } from "@mcp/sdk/server/index.js";
import { StdioServerTransport } from "@mcp/sdk/server/stdio.js";
import {
	type CallToolRequest,
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
} from "@mcp/sdk/types.js";
import { load } from "std/dotenv/mod.ts";
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
		name: "figma_getFileNodes",
		description: "Get specific nodes from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				ids: {
					type: "array",
					description: "Array of node IDs to retrieve",
					items: {
						type: "string",
					},
				},
			},
			required: ["file_key", "ids"],
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
		name: "figma_getAllFileComponentSets",
		description: "Get all component sets from a Figma file",
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
		name: "figma_getTeamComponents",
		description: "Get components from a Figma team",
		inputSchema: {
			type: "object",
			properties: {
				team_id: {
					type: "string",
					description: "The ID of the Figma team",
				},
			},
			required: ["team_id"],
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
		name: "figma_getTeamStyles",
		description: "Get styles from a Figma team",
		inputSchema: {
			type: "object",
			properties: {
				team_id: {
					type: "string",
					description: "The ID of the Figma team",
				},
			},
			required: ["team_id"],
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
		name: "figma_postComment",
		description: "Post a comment to a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				message: {
					type: "string",
					description: "The comment message",
				},
				client_meta: {
					type: "object",
					description: "Metadata for positioning the comment",
				},
			},
			required: ["file_key", "message"],
		},
	},
	{
		name: "figma_replyToComment",
		description: "Reply to a comment in a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				message: {
					type: "string",
					description: "The reply message",
				},
				comment_id: {
					type: "string",
					description: "The ID of the comment to reply to",
				},
				client_meta: {
					type: "object",
					description: "Metadata for positioning the comment",
				},
			},
			required: ["file_key", "message", "comment_id"],
		},
	},
	{
		name: "figma_deleteComment",
		description: "Delete a comment from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				comment_id: {
					type: "string",
					description: "The ID of the comment to delete",
				},
			},
			required: ["file_key", "comment_id"],
		},
	},
	{
		name: "figma_getResolvedComments",
		description: "Get resolved comments from a Figma file",
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
		name: "figma_getUnresolvedComments",
		description: "Get unresolved comments from a Figma file",
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
	{
		name: "figma_getVariables",
		description: "Get variables from a Figma file",
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
		name: "figma_getFileVariables",
		description: "Get file variables from a Figma file",
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
		name: "figma_getFileVariableCollections",
		description: "Get variable collections from a Figma file",
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
		name: "figma_getVariable",
		description: "Get a specific variable from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				variable_id: {
					type: "string",
					description: "The ID of the variable to retrieve",
				},
			},
			required: ["file_key", "variable_id"],
		},
	},
	{
		name: "figma_getVariableCollection",
		description: "Get a specific variable collection from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				collection_id: {
					type: "string",
					description: "The ID of the variable collection to retrieve",
				},
			},
			required: ["file_key", "collection_id"],
		},
	},
	{
		name: "figma_getVariablesByCollection",
		description: "Get variables by collection from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				collection_id: {
					type: "string",
					description: "The ID of the variable collection",
				},
			},
			required: ["file_key", "collection_id"],
		},
	},
	{
		name: "figma_getVariablesByType",
		description: "Get variables by type from a Figma file",
		inputSchema: {
			type: "object",
			properties: {
				file_key: {
					type: "string",
					description: "The key of the Figma file",
				},
				type: {
					type: "string",
					description: "The type of variables to retrieve",
				},
			},
			required: ["file_key", "type"],
		},
	},
	{
		name: "figma_getTeamWebhooks",
		description: "Get webhooks for a Figma team",
		inputSchema: {
			type: "object",
			properties: {
				team_id: {
					type: "string",
					description: "The ID of the Figma team",
				},
			},
			required: ["team_id"],
		},
	},
	{
		name: "figma_createWebhook",
		description: "Create a webhook for a Figma team",
		inputSchema: {
			type: "object",
			properties: {
				team_id: {
					type: "string",
					description: "The ID of the Figma team",
				},
				event_type: {
					type: "string",
					description: "The event type for the webhook",
				},
				endpoint: {
					type: "string",
					description: "The endpoint URL for the webhook",
				},
				passcode: {
					type: "string",
					description: "The passcode for the webhook",
				},
				description: {
					type: "string",
					description: "Description of the webhook",
				},
			},
			required: ["team_id", "event_type", "endpoint", "passcode"],
		},
	},
	{
		name: "figma_deleteWebhook",
		description: "Delete a webhook from a Figma team",
		inputSchema: {
			type: "object",
			properties: {
				team_id: {
					type: "string",
					description: "The ID of the Figma team",
				},
				webhook_id: {
					type: "string",
					description: "The ID of the webhook to delete",
				},
			},
			required: ["team_id", "webhook_id"],
		},
	},
	{
		name: "figma_getWebhook",
		description: "Get a specific webhook from a Figma team",
		inputSchema: {
			type: "object",
			properties: {
				team_id: {
					type: "string",
					description: "The ID of the Figma team",
				},
				webhook_id: {
					type: "string",
					description: "The ID of the webhook to retrieve",
				},
			},
			required: ["team_id", "webhook_id"],
		},
	},
	{
		name: "figma_getWebhooksByEventType",
		description: "Get webhooks by event type from a Figma team",
		inputSchema: {
			type: "object",
			properties: {
				team_id: {
					type: "string",
					description: "The ID of the Figma team",
				},
				event_type: {
					type: "string",
					description: "The event type to filter webhooks",
				},
			},
			required: ["team_id", "event_type"],
		},
	},
	{
		name: "figma_findWebhooksByEndpoint",
		description: "Find webhooks by endpoint from a Figma team",
		inputSchema: {
			type: "object",
			properties: {
				team_id: {
					type: "string",
					description: "The ID of the Figma team",
				},
				endpoint: {
					type: "string",
					description: "The endpoint URL to filter webhooks",
				},
			},
			required: ["team_id", "endpoint"],
		},
	},
	{
		name: "figma_getFileWithComments",
		description: "Get a Figma file with its comments",
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
		name: "figma_getFileAssetsAndVariables",
		description: "Get assets and variables from a Figma file",
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
		name: "figma_component_set",
		uriPattern: "figma://component_set/{component_set_key}",
		description: "Figma component set",
		parameters: {
			component_set_key: {
				description: "The key of the component set",
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
	{
		name: "figma_variable",
		uriPattern: "figma://file/{file_key}/variable/{variable_id}",
		description: "Figma variable",
		parameters: {
			file_key: {
				description: "The key of the Figma file",
				schema: { type: "string" },
			},
			variable_id: {
				description: "The ID of the variable",
				schema: { type: "string" },
			},
		},
	},
	{
		name: "figma_variable_collection",
		uriPattern: "figma://file/{file_key}/variable_collection/{collection_id}",
		description: "Figma variable collection",
		parameters: {
			file_key: {
				description: "The key of the Figma file",
				schema: { type: "string" },
			},
			collection_id: {
				description: "The ID of the variable collection",
				schema: { type: "string" },
			},
		},
	},
	{
		name: "figma_team",
		uriPattern: "figma://team/{team_id}",
		description: "Figma team",
		parameters: {
			team_id: {
				description: "The ID of the Figma team",
				schema: { type: "string" },
			},
		},
	},
	{
		name: "figma_webhook",
		uriPattern: "figma://team/{team_id}/webhook/{webhook_id}",
		description: "Figma webhook",
		parameters: {
			team_id: {
				description: "The ID of the Figma team",
				schema: { type: "string" },
			},
			webhook_id: {
				description: "The ID of the webhook",
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
				figma_component_set: RESOURCES[3],
				figma_style: RESOURCES[4],
				figma_comment: RESOURCES[5],
				figma_variable: RESOURCES[6],
				figma_variable_collection: RESOURCES[7],
				figma_team: RESOURCES[8],
				figma_webhook: RESOURCES[9],
			},
			tools: {
				// ファイル関連
				figma_getFile: TOOLS[0],
				figma_getFileNodes: TOOLS[1],
				figma_getNode: TOOLS[2],

				// コンポーネント関連
				figma_getComponents: TOOLS[3],
				figma_getAllFileComponentSets: TOOLS[4],
				figma_getTeamComponents: TOOLS[5],

				// スタイル関連
				figma_getStyles: TOOLS[6],
				figma_getTeamStyles: TOOLS[7],

				// コメント関連
				figma_getComments: TOOLS[8],
				figma_postComment: TOOLS[9],
				figma_replyToComment: TOOLS[10],
				figma_deleteComment: TOOLS[11],
				figma_getResolvedComments: TOOLS[12],
				figma_getUnresolvedComments: TOOLS[13],

				// 画像関連
				figma_getImages: TOOLS[14],

				// 変数関連
				figma_getVariables: TOOLS[15],
				figma_getFileVariables: TOOLS[16],
				figma_getFileVariableCollections: TOOLS[17],
				figma_getVariable: TOOLS[18],
				figma_getVariableCollection: TOOLS[19],
				figma_getVariablesByCollection: TOOLS[20],
				figma_getVariablesByType: TOOLS[21],

				// Webhook関連
				figma_getTeamWebhooks: TOOLS[22],
				figma_createWebhook: TOOLS[23],
				figma_deleteWebhook: TOOLS[24],
				figma_getWebhook: TOOLS[25],
				figma_getWebhooksByEventType: TOOLS[26],
				figma_findWebhooksByEndpoint: TOOLS[27],

				// 複合関数
				figma_getFileWithComments: TOOLS[28],
				figma_getFileAssetsAndVariables: TOOLS[29],
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
				// ファイル関連
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

				case "figma_getFileNodes": {
					const nodes = await figma.getFileNodes(args);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(nodes, null, 2),
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

				// コンポーネント関連
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

				case "figma_getAllFileComponentSets": {
					const componentSets = await figma.getAllFileComponentSets(
						args.file_key,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(componentSets, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getTeamComponents": {
					const components = await figma.getTeamComponents(args.team_id);
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

				// スタイル関連
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

				case "figma_getTeamStyles": {
					const styles = await figma.getTeamStyles(args.team_id);
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

				// コメント関連
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

				case "figma_postComment": {
					const comment = await figma.postComment(args);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(comment, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_replyToComment": {
					const reply = await figma.replyToComment(args);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(reply, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_deleteComment": {
					const result = await figma.deleteComment(
						args.file_key,
						args.comment_id,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getResolvedComments": {
					const comments = await figma.getResolvedComments(args.file_key);
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

				case "figma_getUnresolvedComments": {
					const comments = await figma.getUnresolvedComments(args.file_key);
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

				// 画像関連
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

				// 変数関連
				case "figma_getVariables": {
					const variables = await figma.getVariables({
						file_key: args.file_key,
					});
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(variables, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getFileVariables": {
					const variables = await figma.getFileVariables(args.file_key);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(variables, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getFileVariableCollections": {
					const collections = await figma.getFileVariableCollections(
						args.file_key,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(collections, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getVariable": {
					const variable = await figma.getVariable(
						args.file_key,
						args.variable_id,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(variable, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getVariableCollection": {
					const collection = await figma.getVariableCollection(
						args.file_key,
						args.collection_id,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(collection, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getVariablesByCollection": {
					const variables = await figma.getVariablesByCollection(
						args.file_key,
						args.collection_id,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(variables, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getVariablesByType": {
					const variables = await figma.getVariablesByType(
						args.file_key,
						args.type,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(variables, null, 2),
							},
						],
						isError: false,
					};
				}

				// Webhook関連
				case "figma_getTeamWebhooks": {
					const webhooks = await figma.getTeamWebhooks(args.team_id);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(webhooks, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_createWebhook": {
					const webhook = await figma.createWebhook(args);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(webhook, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_deleteWebhook": {
					const result = await figma.deleteWebhook(
						args.team_id,
						args.webhook_id,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getWebhook": {
					const webhook = await figma.getWebhook(args.team_id, args.webhook_id);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(webhook, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getWebhooksByEventType": {
					const webhooks = await figma.getWebhooksByEventType(
						args.team_id,
						args.event_type,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(webhooks, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_findWebhooksByEndpoint": {
					const webhooks = await figma.findWebhooksByEndpoint(
						args.team_id,
						args.endpoint,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(webhooks, null, 2),
							},
						],
						isError: false,
					};
				}

				// 複合関数
				case "figma_getFileWithComments": {
					const result = await figma.getFileWithComments(args.file_key);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result, null, 2),
							},
						],
						isError: false,
					};
				}

				case "figma_getFileAssetsAndVariables": {
					const result = await figma.getFileAssetsAndVariables(args.file_key);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result, null, 2),
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
