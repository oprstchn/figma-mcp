/**
 * 基本的な使用例
 * 
 * このサンプルはFigma APIクライアントとModel Context Protocolの基本的な使用方法を示しています。
 */

import { FigmaClient } from "../src/api/figma_client.ts";
import { FigmaFileAPI } from "../src/api/figma_file_api.ts";
import { FigmaToModelContextAdapter } from "../src/adapters/figma_to_model_context_adapter.ts";
import { ModelContextProtocol } from "../src/model/model_context_protocol.ts";

// 環境変数からアクセストークンを取得
const accessToken = Deno.env.get("FIGMA_ACCESS_TOKEN");
if (!accessToken) {
  console.error("環境変数FIGMA_ACCESS_TOKENが設定されていません。");
  console.error("Figma個人アクセストークンを取得して設定してください。");
  Deno.exit(1);
}

// Figmaファイルキーを取得（コマンドライン引数または環境変数から）
const fileKey = Deno.args[0] || Deno.env.get("FIGMA_FILE_KEY");
if (!fileKey) {
  console.error("Figmaファイルキーが指定されていません。");
  console.error("使用方法: deno run -A examples/basic_usage.ts <file_key>");
  Deno.exit(1);
}

/**
 * メイン関数
 */
async function main() {
  try {
    console.log("Figma APIクライアントを初期化しています...");
    const client = new FigmaClient({ accessToken });
    const fileApi = new FigmaFileAPI(client);
    
    // ファイル情報を取得
    console.log(`ファイル情報を取得しています (${fileKey})...`);
    const file = await fileApi.getFile(fileKey);
    console.log(`ファイル名: ${file.name}`);
    console.log(`最終更新: ${file.lastModified}`);
    console.log(`ページ数: ${file.document.children.length}`);
    
    // 最初のページの最初のノードを取得
    if (file.document.children.length > 0 && file.document.children[0].children?.length > 0) {
      const firstPage = file.document.children[0];
      const firstNode = firstPage.children[0];
      
      console.log(`\n最初のページ: ${firstPage.name}`);
      console.log(`最初のノード: ${firstNode.name} (${firstNode.type})`);
      
      // ノード詳細を取得
      console.log(`\nノード詳細を取得しています (${firstNode.id})...`);
      const nodes = await fileApi.getFileNodes(fileKey, [firstNode.id]);
      console.log("ノード詳細:", JSON.stringify(nodes.nodes[firstNode.id], null, 2));
    }
    
    // Model Contextに変換
    console.log("\nFigmaファイルをModel Contextに変換しています...");
    const adapter = new FigmaToModelContextAdapter(client);
    const modelContext = await adapter.convertFileToModelContext(fileKey, {
      includeStyles: true,
      includeVariables: true,
    });
    
    // Model Contextの検証
    console.log("\nModel Contextを検証しています...");
    const validation = ModelContextProtocol.validateContext(modelContext);
    if (validation.valid) {
      console.log("検証成功: Model Contextは有効です。");
    } else {
      console.warn("検証警告: Model Contextに問題があります。");
      console.warn("エラー:", validation.errors);
    }
    
    // 統計情報を表示
    console.log("\nModel Context統計:");
    console.log(`要素数: ${modelContext.design.elements.length}`);
    console.log(`階層ノード数: ${modelContext.design.structure.hierarchy.length}`);
    console.log(`カラースタイル数: ${modelContext.design.styles.colors.length}`);
    console.log(`テキストスタイル数: ${modelContext.design.styles.text.length}`);
    
    // 変数情報を表示（存在する場合）
    if (modelContext.design.variables) {
      console.log(`変数コレクション数: ${modelContext.design.variables.collections.length}`);
      console.log(`変数数: ${modelContext.design.variables.variables.length}`);
    }
    
    // Model Contextをファイルに保存
    const outputFile = `./model_context_${fileKey}.json`;
    console.log(`\nModel Contextをファイルに保存しています (${outputFile})...`);
    const json = ModelContextProtocol.serializeContext(modelContext);
    await Deno.writeTextFile(outputFile, json);
    console.log("保存完了。");
    
    console.log("\n処理が完了しました。");
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

// メイン関数を実行
main();
