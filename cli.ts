#!/usr/bin/env -S deno run --allow-env --allow-read --allow-net

import { load } from "std/dotenv/mod.ts";
import type { z } from "zod";
import { FigmaResource } from "./src/resource.ts";
import { FigmaTools } from "./src/tools.ts";

// .env ファイルを読み込む
await load({ export: true });

// 環境変数から Figma アクセストークンを取得
const FIGMA_ACCESS_TOKEN = Deno.env.get("FIGMA_ACCESS_TOKEN");

if (!FIGMA_ACCESS_TOKEN) {
	console.error("Error: FIGMA_ACCESS_TOKEN environment variable is not set");
	Deno.exit(1);
}

// コマンドライン引数の解析
const args = Deno.args;
const command = args[0]?.toLowerCase();

// FigmaToolsの初期化
const figmaTools = new FigmaTools(FIGMA_ACCESS_TOKEN);

// FigmaResourceの初期化
const figmaResource = new FigmaResource(FIGMA_ACCESS_TOKEN);

// ヘルプを表示
if (
	!command ||
	command === "help" ||
	command === "--help" ||
	command === "-h"
) {
	console.log(`
Figma MCP CLI

使用方法:
  ./cli.ts <command>

コマンド:
  tools                    - 利用可能なツール一覧を表示
  tool <name>              - 特定のツールの詳細を表示
  run <tool> [JSON形式のパラメータ]  - 指定したツールを実行する
  resources                - 利用可能なリソース一覧を表示
  help                     - このヘルプを表示

ツール実行の例:
  ./cli.ts run figma_getFile '{"file_key": "12345"}'
  ./cli.ts run figma_getComments '{"file_key": "12345"}'
  ./cli.ts run figma_postComment '{"file_key": "12345", "message": "コメント", "client_meta": {"x": 100, "y": 200}}'
`);
	Deno.exit(0);
}

// ツール一覧を表示
if (command === "tools") {
	console.log("利用可能なツール一覧:");
	console.log("====================");

	for (const tool of figmaTools.getTools()) {
		console.log(`- ${tool.name}: ${tool.description}`);

		// 引数の型情報を表示
		if (tool.inputSchema) {
			console.log("  引数:");
			for (const [paramName, paramSchema] of Object.entries(tool.inputSchema)) {
				const isRequired = paramSchema._def?.required !== false;
				const typeInfo = getTypeInfo(paramSchema);
				console.log(
					`    - ${paramName}${isRequired ? "" : " (省略可)"}: ${typeInfo}`,
				);
				if (paramSchema._def?.description) {
					console.log(`      説明: ${paramSchema._def.description}`);
				}
			}
		}
		console.log("");
	}

	Deno.exit(0);
}

// 特定のツールの詳細を表示
if (command === "tool" && args[1]) {
	const toolName = args[1];
	const tool = figmaTools.getToolByName(toolName);

	if (!tool) {
		console.error(
			`エラー: "${toolName}" という名前のツールは見つかりませんでした`,
		);
		Deno.exit(1);
	}

	console.log(`ツール: ${tool.name}`);
	console.log(`説明: ${tool.description}`);
	console.log("引数:");

	if (tool.inputSchema) {
		for (const [paramName, paramSchema] of Object.entries(tool.inputSchema)) {
			const isRequired = paramSchema._def?.required !== false;
			const typeInfo = getTypeInfo(paramSchema);
			console.log(
				`  - ${paramName}${isRequired ? "" : " (省略可)"}: ${typeInfo}`,
			);
			if (paramSchema._def?.description) {
				console.log(`    説明: ${paramSchema._def.description}`);
			}
		}
	} else {
		console.log("  引数はありません");
	}

	Deno.exit(0);
}

// ツールを実行
if (command === "run" && args[1]) {
	const toolName = args[1];
	const tool = figmaTools.getToolByName(toolName);

	if (!tool) {
		console.error(
			`エラー: "${toolName}" という名前のツールは見つかりませんでした`,
		);
		Deno.exit(1);
	}

	// JSON形式のパラメータを解析
	const paramsString = args[2] || "{}";
	let params: Record<string, unknown>;

	try {
		params = JSON.parse(paramsString);
	} catch (e) {
		console.error(
			"パラメータの解析に失敗しました。有効なJSON形式で指定してください。",
		);
		console.error(`エラー: ${e instanceof Error ? e.message : String(e)}`);
		console.log(
			`例: ./cli.ts run ${toolName} '{"param1": "value1", "param2": 123}'`,
		);
		Deno.exit(1);
	}

	console.log(`ツール '${toolName}' を実行中...`);
	console.log("パラメータ:", JSON.stringify(params, null, 2));

	try {
		// AbortControllerを使用して正しくsignalを生成
		const controller = new AbortController();
		const result = await tool.cb(params, { signal: controller.signal });

		console.log("\n結果:");
		if (result.isError) {
			console.error("エラーが発生しました");
		}

		for (const content of result.content) {
			if (content.type === "text") {
				try {
					// JSONの場合は整形して表示
					const json = JSON.parse(content.text);
					console.log(JSON.stringify(json, null, 2));
				} catch {
					// そうでない場合はそのまま表示
					console.log(content.text);
				}
			} else {
				console.log(content);
			}
		}
	} catch (error: unknown) {
		console.error(
			"ツールの実行中にエラーが発生しました:",
			error instanceof Error ? error.message : String(error),
		);
		Deno.exit(1);
	}

	Deno.exit(0);
}

// リソース一覧を表示
if (command === "resources") {
	console.log("利用可能なリソース一覧:");
	console.log("====================");

	for (const resource of figmaResource.getResources()) {
		console.log(`- ${resource.name}: ${resource.metadata.description}`);
		console.log(`  URI パターン: ${resource.uriPattern}`);

		// URIパターンから変数を抽出して表示
		const variables = extractVariablesFromPattern(resource.uriPattern);
		if (variables.length > 0) {
			console.log("  変数:");
			for (const variable of variables) {
				console.log(`    - ${variable}: string`);
			}
		}

		console.log("");
	}

	Deno.exit(0);
}

// 不明なコマンド
console.error(`エラー: 不明なコマンド "${command}"`);
console.log("ヘルプを表示するには: ./cli.ts help");
Deno.exit(1);

/**
 * Zodスキーマから型情報を取得
 */
function getTypeInfo(schema: z.ZodTypeAny): string {
	if (!schema || !schema._def) {
		return "unknown";
	}

	const type = schema._def.typeName;

	switch (type) {
		case "ZodString":
			return "string";
		case "ZodNumber":
			return "number";
		case "ZodBoolean":
			return "boolean";
		case "ZodArray": {
			const innerType = schema._def.type
				? getTypeInfo(schema._def.type)
				: "unknown";
			return `${innerType}[]`;
		}
		case "ZodObject":
			return "object";
		case "ZodOptional": {
			const optionalType = schema._def.innerType
				? getTypeInfo(schema._def.innerType)
				: "unknown";
			return optionalType;
		}
		default:
			return type || "unknown";
	}
}

/**
 * URIパターンから変数を抽出
 */
function extractVariablesFromPattern(pattern: string): string[] {
	const variables: string[] = [];
	const regex = /{([^}]+)}/g;

	const match = regex.exec(pattern);
	if (match) {
		variables.push(match[1]);
	}

	return variables;
}
