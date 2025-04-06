import type { Variables } from "@mcp/sdk";
import {
	type ResourceMetadata,
	ResourceTemplate,
} from "@mcp/sdk/server/mcp.js";
import { FigmaClient } from "./api/figma_client.ts";
import type { FigmaComment } from "./api/types.ts";

// オリジナルのResourceはReadResourceCallbackと互換性がないため、独自の定義を作成
export interface FigmaResourceDefinition {
	name: string;
	uriPattern: string; // server.tsで使用するため
	template: ResourceTemplate;
	metadata: ResourceMetadata;
	readCallback: (
		uri: URL,
		variables: Variables,
	) => Promise<{
		contents: Array<{
			uri: string;
			text: string;
		}>;
	}>;
}

export class FigmaResource {
	private readonly figmaClient: FigmaClient;

	constructor(figmaAccessToken: string) {
		this.figmaClient = new FigmaClient({
			accessToken: figmaAccessToken,
		});
	}

	getResources(): FigmaResourceDefinition[] {
		return [
			{
				name: "figma_file",
				uriPattern: "figma://file/{file_key}",
				template: new ResourceTemplate("figma://file/{file_key}", {
					list: undefined,
				}),
				metadata: {
					description: "Figma file with document structure and content",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					const file = await this.figmaClient.getFile({
						file_key: variables.file_key,
					});
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify(file),
							},
						],
					};
				},
			},
			{
				name: "figma_node",
				uriPattern: "figma://file/{file_key}/node/{node_id}",
				template: new ResourceTemplate(
					"figma://file/{file_key}/node/{node_id}",
					{
						list: undefined,
					},
				),
				metadata: {
					description: "Specific node from a Figma file",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					const node = await this.figmaClient.getNode(
						variables.file_key,
						variables.node_id,
					);
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify(node),
							},
						],
					};
				},
			},
			{
				name: "figma_component",
				uriPattern: "figma://component/{component_key}",
				template: new ResourceTemplate("figma://component/{component_key}", {
					list: undefined,
				}),
				metadata: {
					description: "Figma component",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					// Componentの取得処理（実際の実装はAPIに合わせて調整）
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify({
									component_key: variables.component_key,
								}),
							},
						],
					};
				},
			},
			{
				name: "figma_component_set",
				uriPattern: "figma://component_set/{component_set_key}",
				template: new ResourceTemplate(
					"figma://component_set/{component_set_key}",
					{
						list: undefined,
					},
				),
				metadata: {
					description: "Figma component set",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					// ComponentSetの取得処理（実際の実装はAPIに合わせて調整）
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify({
									component_set_key: variables.component_set_key,
								}),
							},
						],
					};
				},
			},
			{
				name: "figma_style",
				uriPattern: "figma://style/{style_key}",
				template: new ResourceTemplate("figma://style/{style_key}", {
					list: undefined,
				}),
				metadata: {
					description: "Figma style",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					// Styleの取得処理（実際の実装はAPIに合わせて調整）
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify({ style_key: variables.style_key }),
							},
						],
					};
				},
			},
			{
				name: "figma_comment",
				uriPattern: "figma://file/{file_key}/comment/{comment_id}",
				template: new ResourceTemplate(
					"figma://file/{file_key}/comment/{comment_id}",
					{
						list: undefined,
					},
				),
				metadata: {
					description: "Figma comment",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					// コメントの取得処理
					const comments = await this.figmaClient.getComments({
						file_key: variables.file_key,
					});
					const comment = comments.comments.find(
						(c: FigmaComment) => c.id === variables.comment_id,
					);
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify(comment || { error: "Comment not found" }),
							},
						],
					};
				},
			},
			{
				name: "figma_variable",
				uriPattern: "figma://file/{file_key}/variable/{variable_id}",
				template: new ResourceTemplate(
					"figma://file/{file_key}/variable/{variable_id}",
					{
						list: undefined,
					},
				),
				metadata: {
					description: "Figma variable",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					const variable = await this.figmaClient.getVariable(
						variables.file_key,
						variables.variable_id,
					);
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify(variable),
							},
						],
					};
				},
			},
			{
				name: "figma_variable_collection",
				uriPattern:
					"figma://file/{file_key}/variable_collection/{collection_id}",
				template: new ResourceTemplate(
					"figma://file/{file_key}/variable_collection/{collection_id}",
					{
						list: undefined,
					},
				),
				metadata: {
					description: "Figma variable collection",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					const collection = await this.figmaClient.getVariableCollection(
						variables.file_key,
						variables.collection_id,
					);
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify(collection),
							},
						],
					};
				},
			},
			{
				name: "figma_team",
				uriPattern: "figma://team/{team_id}",
				template: new ResourceTemplate("figma://team/{team_id}", {
					list: undefined,
				}),
				metadata: {
					description: "Figma team",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					// Teamの取得処理（実際の実装はAPIに合わせて調整）
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify({ team_id: variables.team_id }),
							},
						],
					};
				},
			},
			{
				name: "figma_webhook",
				uriPattern: "figma://team/{team_id}/webhook/{webhook_id}",
				template: new ResourceTemplate(
					"figma://team/{team_id}/webhook/{webhook_id}",
					{
						list: undefined,
					},
				),
				metadata: {
					description: "Figma webhook",
				},
				readCallback: async (uri: URL, variables: Variables) => {
					const webhook = await this.figmaClient.getWebhook(
						variables.team_id,
						variables.webhook_id,
					);
					return {
						contents: [
							{
								uri: uri.href,
								text: JSON.stringify(webhook),
							},
						],
					};
				},
			},
		];
	}
}
