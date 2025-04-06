import type { ToolCallback } from "@mcp/sdk/server/mcp.js";
import type { ZodRawShape } from "zod";
import { z } from "zod";
import { FigmaClient } from "./mod.ts";

type Tool<Args extends ZodRawShape> = {
	name: string;
	description: string;
	inputSchema: Args;
	cb: ToolCallback<Args>;
};

export class FigmaTools {
	private readonly figmaClient: FigmaClient;
	private readonly tools: Tool<ZodRawShape>[];

	constructor(figmaAccessToken: string) {
		this.figmaClient = new FigmaClient({
			accessToken: figmaAccessToken,
		});

		// ツール定義を初期化
		this.tools = this.initializeTools();
	}

	// ツール定義を取得するメソッド
	getTools(): Tool<ZodRawShape>[] {
		return this.tools;
	}

	// ツール定義を初期化するメソッド
	private initializeTools(): Tool<ZodRawShape>[] {
		return [
			// ファイル関連
			{
				name: "figma_getFile",
				description: "Get a Figma file",
				inputSchema: {
					file_key: z
						.string()
						.describe("The key of the Figma file to retrieve"),
					version: z
						.string()
						.optional()
						.describe("A specific version ID to retrieve"),
					depth: z
						.number()
						.optional()
						.describe(
							"Depth of nodes to retrieve (defaults to entire document)",
						),
					geometry: z.string().optional().describe("Geometry format to export"),
					plugin_data: z.string().optional().describe("Plugin data to include"),
					branch_data: z
						.boolean()
						.optional()
						.describe("Whether to include branch data"),
				},
				cb: async (params) => {
					const file = await this.figmaClient.getFile({
						file_key: params.file_key,
						version: params.version,
						depth: params.depth,
						geometry: params.geometry,
						plugin_data: params.plugin_data,
						branch_data: params.branch_data,
					});
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(file, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_getFileNodes",
				description: "Get specific nodes from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					ids: z.array(z.string()).describe("Array of node IDs to retrieve"),
					version: z
						.string()
						.optional()
						.describe("A specific version ID to retrieve"),
					depth: z.number().optional().describe("Depth of nodes to retrieve"),
					geometry: z.string().optional().describe("Geometry format to export"),
					plugin_data: z.string().optional().describe("Plugin data to include"),
					branch_data: z
						.boolean()
						.optional()
						.describe("Whether to include branch data"),
				},
				cb: async (params) => {
					const nodes = await this.figmaClient.getFileNodes({
						file_key: params.file_key,
						ids: params.ids,
						version: params.version,
						depth: params.depth,
						geometry: params.geometry,
						plugin_data: params.plugin_data,
						branch_data: params.branch_data,
					});
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(nodes, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_getNode",
				description: "Get a specific node from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					nodeId: z.string().describe("The ID of the node to retrieve"),
				},
				cb: async (params) => {
					const node = await this.figmaClient.getNode(
						params.file_key,
						params.nodeId,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(node, null, 2),
							},
						],
						isError: false,
					};
				},
			},

			// コンポーネント関連
			{
				name: "figma_getComponents",
				description: "Get components from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const components = await this.figmaClient.getAllFileComponents(
						params.file_key,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(components, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_getAllFileComponentSets",
				description: "Get all component sets from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const componentSets = await this.figmaClient.getAllFileComponentSets(
						params.file_key,
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
				},
			},
			{
				name: "figma_getTeamComponents",
				description: "Get components from a Figma team",
				inputSchema: {
					team_id: z.string().describe("The ID of the Figma team"),
				},
				cb: async (params) => {
					const components = await this.figmaClient.getTeamComponents(
						params.team_id,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(components, null, 2),
							},
						],
						isError: false,
					};
				},
			},

			// スタイル関連
			{
				name: "figma_getStyles",
				description: "Get styles from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const styles = await this.figmaClient.getAllFileStyles(
						params.file_key,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(styles, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_getTeamStyles",
				description: "Get styles from a Figma team",
				inputSchema: {
					team_id: z.string().describe("The ID of the Figma team"),
				},
				cb: async (params) => {
					const styles = await this.figmaClient.getTeamStyles(params.team_id);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(styles, null, 2),
							},
						],
						isError: false,
					};
				},
			},

			// コメント関連
			{
				name: "figma_getComments",
				description: "Get comments from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const comments = await this.figmaClient.getComments({
						file_key: params.file_key,
					});
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(comments, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_postComment",
				description: "Post a comment to a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					message: z.string().describe("The comment message"),
					client_meta: z
						.object({
							node_id: z.string().optional().describe("Node ID to comment on"),
							node_offset: z
								.object({
									x: z.number().describe("X position of the comment"),
									y: z.number().describe("Y position of the comment"),
								})
								.optional()
								.describe("Position offset for the comment"),
						})
						.optional()
						.describe("Metadata for positioning the comment"),
				},
				cb: async (params) => {
					const comment = await this.figmaClient.postComment({
						file_key: params.file_key,
						message: params.message,
						client_meta: params.client_meta,
					});
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(comment, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_replyToComment",
				description: "Reply to a comment in a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					message: z.string().describe("The reply message"),
					comment_id: z.string().describe("The ID of the comment to reply to"),
					client_meta: z
						.object({
							node_id: z.string().optional().describe("Node ID to comment on"),
							node_offset: z
								.object({
									x: z.number().describe("X position of the comment"),
									y: z.number().describe("Y position of the comment"),
								})
								.optional()
								.describe("Position offset for the comment"),
						})
						.optional()
						.describe("Metadata for positioning the comment"),
				},
				cb: async (params) => {
					const reply = await this.figmaClient.replyToComment({
						file_key: params.file_key,
						message: params.message,
						comment_id: params.comment_id,
						client_meta: params.client_meta,
					});
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(reply, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_deleteComment",
				description: "Delete a comment from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					comment_id: z.string().describe("The ID of the comment to delete"),
				},
				cb: async (params) => {
					const result = await this.figmaClient.deleteComment(
						params.file_key,
						params.comment_id,
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
				},
			},
			{
				name: "figma_getResolvedComments",
				description: "Get resolved comments from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const comments = await this.figmaClient.getResolvedComments(
						params.file_key,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(comments, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_getUnresolvedComments",
				description: "Get unresolved comments from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const comments = await this.figmaClient.getUnresolvedComments(
						params.file_key,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(comments, null, 2),
							},
						],
						isError: false,
					};
				},
			},

			// 画像関連
			{
				name: "figma_getImages",
				description: "Get images from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					ids: z.array(z.string()).describe("Array of node IDs to render"),
					scale: z
						.number()
						.optional()
						.describe("Scale factor for rendering (default: 1)"),
					format: z
						.enum(["jpg", "png", "svg", "pdf"])
						.optional()
						.describe("Image format to use"),
					svg_include_id: z
						.boolean()
						.optional()
						.describe("Whether to include IDs in SVG output"),
					svg_simplify_stroke: z
						.boolean()
						.optional()
						.describe("Whether to simplify strokes in SVG output"),
					use_absolute_bounds: z
						.boolean()
						.optional()
						.describe("Whether to use absolute bounds"),
				},
				cb: async (params) => {
					const images = await this.figmaClient.getImage(params.file_key, {
						ids: params.ids,
						scale: params.scale,
						format: params.format,
						svg_include_id: params.svg_include_id,
						svg_simplify_stroke: params.svg_simplify_stroke,
						use_absolute_bounds: params.use_absolute_bounds,
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
				},
			},

			// 変数関連
			{
				name: "figma_getVariables",
				description: "Get variables from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const variables = await this.figmaClient.getFileVariables(
						params.file_key,
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
				},
			},
			{
				name: "figma_getFileVariables",
				description: "Get file variables from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const variables = await this.figmaClient.getFileVariables(
						params.file_key,
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
				},
			},
			{
				name: "figma_getFileVariableCollections",
				description: "Get variable collections from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const collections = await this.figmaClient.getFileVariableCollections(
						params.file_key,
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
				},
			},
			{
				name: "figma_getVariable",
				description: "Get a specific variable from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					variable_id: z
						.string()
						.describe("The ID of the variable to retrieve"),
				},
				cb: async (params) => {
					const variable = await this.figmaClient.getVariable(
						params.file_key,
						params.variable_id,
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
				},
			},
			{
				name: "figma_getVariableCollection",
				description: "Get a specific variable collection from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					collection_id: z
						.string()
						.describe("The ID of the variable collection to retrieve"),
				},
				cb: async (params) => {
					const collection = await this.figmaClient.getVariableCollection(
						params.file_key,
						params.collection_id,
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
				},
			},
			{
				name: "figma_getVariablesByCollection",
				description: "Get variables by collection from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					collection_id: z
						.string()
						.describe("The ID of the variable collection"),
				},
				cb: async (params) => {
					const variables = await this.figmaClient.getVariablesByCollection(
						params.file_key,
						params.collection_id,
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
				},
			},
			{
				name: "figma_getVariablesByType",
				description: "Get variables by type from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					type: z.string().describe("The type of variables to retrieve"),
				},
				cb: async (params) => {
					const variables = await this.figmaClient.getVariablesByType(
						params.file_key,
						params.type,
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
				},
			},
			{
				name: "figma_getVariableValueForMode",
				description: "Get variable value for a specific mode",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					variable_id: z.string().describe("The ID of the variable"),
					mode_id: z.string().describe("The ID of the mode"),
				},
				cb: async (params) => {
					const value = await this.figmaClient.getVariableValueForMode(
						params.file_key,
						params.variable_id,
						params.mode_id,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(value, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_getVariableCollections",
				description: "Get variable collections from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const collections = await this.figmaClient.getFileVariableCollections(
						params.file_key,
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
				},
			},
			{
				name: "figma_updateVariables",
				description: "Update variables in a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					variableUpdates: z
						.array(
							z.object({
								variableId: z.string().optional(),
								action: z.enum(["CREATE", "UPDATE", "DELETE"]),
								name: z.string().optional(),
								key: z.string().optional(),
								resolvedType: z.string().optional(),
								valuesByMode: z
									.record(
										z.object({
											type: z.string(),
											value: z.union([
												z.string(),
												z.number(),
												z.boolean(),
												z.record(z.unknown()),
											]),
										}),
									)
									.optional(),
								description: z.string().optional(),
								scopes: z.array(z.string()).optional(),
							}),
						)
						.optional()
						.describe("Variable updates to apply"),
					variableCollectionUpdates: z
						.array(
							z.object({
								variableCollectionId: z.string().optional(),
								action: z.enum(["CREATE", "UPDATE", "DELETE"]),
								name: z.string().optional(),
								key: z.string().optional(),
								modes: z
									.array(
										z.object({
											modeId: z.string(),
											name: z.string(),
										}),
									)
									.optional(),
								defaultModeId: z.string().optional(),
							}),
						)
						.optional()
						.describe("Variable collection updates to apply"),
				},
				cb: async (params) => {
					const result = await this.figmaClient.updateVariables(
						params.file_key,
						{
							variableUpdates: params.variableUpdates,
							variableCollectionUpdates: params.variableCollectionUpdates,
						},
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
				},
			},
			{
				name: "figma_publishVariables",
				description: "Publish variables from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					variableIds: z
						.array(z.string())
						.describe("IDs of variables to publish"),
					variableCollectionIds: z
						.array(z.string())
						.describe("IDs of variable collections to publish"),
				},
				cb: async (params) => {
					const result = await this.figmaClient.publishVariables(
						params.file_key,
						{
							variableIds: params.variableIds,
							variableCollectionIds: params.variableCollectionIds,
						},
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
				},
			},

			// ブランチ関連
			{
				name: "figma_getBranches",
				description: "Get branches from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const branches = await this.figmaClient.getBranches(params.file_key);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(branches, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_createBranch",
				description: "Create a new branch in a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
					name: z.string().describe("Name of the branch"),
					description: z
						.string()
						.optional()
						.describe("Description of the branch"),
				},
				cb: async (params) => {
					const result = await this.figmaClient.createBranch(params.file_key, {
						name: params.name,
						description: params.description,
					});
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result, null, 2),
							},
						],
						isError: false,
					};
				},
			},

			// Webhook関連
			{
				name: "figma_getTeamWebhooks",
				description: "Get webhooks for a Figma team",
				inputSchema: {
					team_id: z.string().describe("The ID of the Figma team"),
				},
				cb: async (params) => {
					const webhooks = await this.figmaClient.getTeamWebhooks(
						params.team_id,
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
				},
			},
			{
				name: "figma_createWebhook",
				description: "Create a webhook for a Figma team",
				inputSchema: {
					team_id: z.string().describe("The ID of the Figma team"),
					event_type: z.string().describe("The event type for the webhook"),
					endpoint: z.string().describe("The endpoint URL for the webhook"),
					passcode: z.string().describe("The passcode for the webhook"),
					description: z
						.string()
						.optional()
						.describe("Description of the webhook"),
				},
				cb: async (params) => {
					const webhook = await this.figmaClient.createWebhook({
						team_id: params.team_id,
						event_type: params.event_type,
						endpoint: params.endpoint,
						passcode: params.passcode,
						description: params.description,
					});
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(webhook, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_deleteWebhook",
				description: "Delete a webhook from a Figma team",
				inputSchema: {
					team_id: z.string().describe("The ID of the Figma team"),
					webhook_id: z.string().describe("The ID of the webhook to delete"),
				},
				cb: async (params) => {
					const result = await this.figmaClient.deleteWebhook(
						params.team_id,
						params.webhook_id,
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
				},
			},
			{
				name: "figma_getWebhook",
				description: "Get a specific webhook from a Figma team",
				inputSchema: {
					team_id: z.string().describe("The ID of the Figma team"),
					webhook_id: z.string().describe("The ID of the webhook to retrieve"),
				},
				cb: async (params) => {
					const webhook = await this.figmaClient.getWebhook(
						params.team_id,
						params.webhook_id,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(webhook, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_getWebhooksByEventType",
				description: "Get webhooks by event type from a Figma team",
				inputSchema: {
					team_id: z.string().describe("The ID of the Figma team"),
					event_type: z.string().describe("The event type to filter webhooks"),
				},
				cb: async (params) => {
					const webhooks = await this.figmaClient.getWebhooksByEventType(
						params.team_id,
						params.event_type,
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
				},
			},
			{
				name: "figma_checkWebhookStatus",
				description: "Check the status of a webhook",
				inputSchema: {
					team_id: z.string().describe("The ID of the Figma team"),
					webhook_id: z.string().describe("The ID of the webhook to check"),
				},
				cb: async (params) => {
					const status = await this.figmaClient.checkWebhookStatus(
						params.team_id,
						params.webhook_id,
					);
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify({ status }, null, 2),
							},
						],
						isError: false,
					};
				},
			},
			{
				name: "figma_findWebhooksByEndpoint",
				description: "Find webhooks by endpoint from a Figma team",
				inputSchema: {
					team_id: z.string().describe("The ID of the Figma team"),
					endpoint: z.string().describe("The endpoint URL to filter webhooks"),
				},
				cb: async (params) => {
					const webhooks = await this.figmaClient.findWebhooksByEndpoint(
						params.team_id,
						params.endpoint,
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
				},
			},

			// 複合関数
			{
				name: "figma_getFileWithComments",
				description: "Get a Figma file with its comments",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const result = await this.figmaClient.getFileWithComments(
						params.file_key,
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
				},
			},
			{
				name: "figma_getFileAssetsAndVariables",
				description: "Get assets and variables from a Figma file",
				inputSchema: {
					file_key: z.string().describe("The key of the Figma file"),
				},
				cb: async (params) => {
					const result = await this.figmaClient.getFileAssetsAndVariables(
						params.file_key,
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
				},
			},
		];
	}

	// ツール名から特定のツールを取得するメソッド
	getToolByName(name: string): Tool<ZodRawShape> | undefined {
		return this.tools.find((tool) => tool.name === name);
	}
}
