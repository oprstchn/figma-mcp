/**
 * AI モデル統合の使用例
 * 
 * このサンプルはModel Context ProtocolをRooCodeとClineに統合する方法を示しています。
 */

import { FigmaClient } from "../src/api/figma_client.ts";
import { FigmaToModelContextAdapter } from "../src/adapters/figma_to_model_context_adapter.ts";
import { AIModelIntegrationFactory } from "../src/adapters/ai_model_integration.ts";
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
  console.error("使用方法: deno run -A examples/ai_integration.ts <file_key> [roocode|cline]");
  Deno.exit(1);
}

// AIモデルタイプを取得（デフォルトはroocode）
const modelType = (Deno.args[1] || "roocode").toLowerCase();
if (modelType !== "roocode" && modelType !== "cline") {
  console.error("無効なAIモデルタイプです。'roocode'または'cline'を指定してください。");
  Deno.exit(1);
}

/**
 * メイン関数
 */
async function main() {
  try {
    console.log("Figma APIクライアントを初期化しています...");
    const client = new FigmaClient({ accessToken });
    
    // Model Contextに変換
    console.log(`\nFigmaファイル (${fileKey}) をModel Contextに変換しています...`);
    const adapter = new FigmaToModelContextAdapter(client);
    const modelContext = await adapter.convertFileToModelContext(fileKey, {
      includeStyles: true,
      includeVariables: true,
      includeImages: true,
    });
    
    // AIモデル統合を作成
    console.log(`\n${modelType.toUpperCase()}統合を初期化しています...`);
    const aiIntegration = AIModelIntegrationFactory.createIntegration(modelType as "roocode" | "cline");
    
    // サンプルプロンプト
    const samplePrompts = {
      roocode: "このデザインに基づいてHTMLとCSSを生成してください。レスポンシブデザインに対応し、アクセシビリティに配慮してください。",
      cline: "このデザインを参考に、Reactコンポーネントを作成してください。Tailwind CSSを使用し、ダークモードにも対応させてください。"
    };
    
    const prompt = samplePrompts[modelType as "roocode" | "cline"];
    
    // コンテキストをフォーマット
    console.log("\nModel Contextをフォーマットしています...");
    const formattedContext = aiIntegration.formatContext(modelContext);
    
    // フォーマット結果のサンプルを表示（長すぎる場合は省略）
    const contextPreview = JSON.stringify(JSON.parse(formattedContext), null, 2).slice(0, 500) + "...";
    console.log(`\nフォーマット結果のプレビュー:\n${contextPreview}`);
    
    // プロンプトにコンテキストを注入
    console.log("\nプロンプトにコンテキストを注入しています...");
    const enhancedPrompt = aiIntegration.injectContext(modelContext, prompt);
    
    // 注入結果のサンプルを表示（長すぎる場合は省略）
    const promptPreview = enhancedPrompt.length > 1000 
      ? enhancedPrompt.slice(0, 500) + "\n...\n" + enhancedPrompt.slice(enhancedPrompt.length - 500)
      : enhancedPrompt;
    console.log(`\n注入結果のプレビュー:\n${promptPreview}`);
    
    // 結果をファイルに保存
    const outputDir = "./output";
    await Deno.mkdir(outputDir, { recursive: true });
    
    const contextFile = `${outputDir}/formatted_context_${modelType}_${fileKey}.json`;
    console.log(`\nフォーマットされたコンテキストをファイルに保存しています (${contextFile})...`);
    await Deno.writeTextFile(contextFile, formattedContext);
    
    const promptFile = `${outputDir}/enhanced_prompt_${modelType}_${fileKey}.txt`;
    console.log(`強化されたプロンプトをファイルに保存しています (${promptFile})...`);
    await Deno.writeTextFile(promptFile, enhancedPrompt);
    
    console.log("\n処理が完了しました。");
    console.log(`\n次のステップ: 生成されたプロンプトを${modelType.toUpperCase()}に送信して、デザインに基づいたコードを生成できます。`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

// メイン関数を実行
main();
