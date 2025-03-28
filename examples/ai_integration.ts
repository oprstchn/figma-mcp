/**
 * AI モデル統合の使用例
 * 
 * RooCodeとClineとの統合を示す例
 */

import { RooCodeIntegration, ClineIntegration } from "../src/adapters/ai_model_integration.ts";
import { StdioTransport } from "../src/transports/stdio.ts";

// RooCode統合の例
async function rooCodeExample() {
  console.log("Figma Model Context Protocol - RooCode統合の例");
  
  // Figma認証設定
  const authConfig = {
    accessToken: Deno.env.get("FIGMA_ACCESS_TOKEN") || "your-figma-access-token"
  };
  
  // RooCode統合を初期化
  const rooCodeIntegration = new RooCodeIntegration(authConfig);
  
  // サーバーを取得
  const server = rooCodeIntegration.getMcpServer();
  
  // トランスポートを作成
  const transport = new StdioTransport();
  
  // サーバーを起動
  console.log("RooCode統合サーバーを起動しています...");
  await server.connect(transport);
  console.log("サーバーが起動しました。Ctrl+Cで終了します。");
  
  // サーバーを実行し続ける
  await new Promise(() => {});
}

// Cline統合の例
async function clineExample() {
  console.log("Figma Model Context Protocol - Cline統合の例");
  
  // Figma認証設定
  const authConfig = {
    accessToken: Deno.env.get("FIGMA_ACCESS_TOKEN") || "your-figma-access-token"
  };
  
  // Cline統合を初期化
  const clineIntegration = new ClineIntegration(authConfig);
  
  // サーバーを取得
  const server = clineIntegration.getMcpServer();
  
  // トランスポートを作成
  const transport = new StdioTransport();
  
  // サーバーを起動
  console.log("Cline統合サーバーを起動しています...");
  await server.connect(transport);
  console.log("サーバーが起動しました。Ctrl+Cで終了します。");
  
  // サーバーを実行し続ける
  await new Promise(() => {});
}

// メイン関数
async function main() {
  // コマンドライン引数に基づいて実行する例を選択
  const args = Deno.args;
  
  if (args.includes("--roocode")) {
    await rooCodeExample();
  } else if (args.includes("--cline")) {
    await clineExample();
  } else {
    console.log("使用方法: deno run -A ai_integration.ts [--roocode|--cline]");
    console.log("  --roocode: RooCode統合の例を実行");
    console.log("  --cline: Cline統合の例を実行");
  }
}

// メイン関数を実行
if (import.meta.main) {
  main().catch(error => {
    console.error("エラーが発生しました:", error);
    Deno.exit(1);
  });
}
