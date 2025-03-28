/**
 * Figma Model Context Protocol サーバー例
 * 
 * このファイルはFigma Model Context Protocolサーバーの基本的な使用例を示します。
 * 環境変数FIGMA_ACCESS_TOKENにFigmaのアクセストークンを設定して実行してください。
 */

import { FigmaMcpServer } from "./src/adapters/ai_model_integration.ts";
import { SseTransport } from "./src/transports/sse.ts";

// サーバーポート（環境変数から取得、デフォルトは3000）
const PORT = parseInt(Deno.env.get("PORT") || "3000");

// メイン関数
async function main() {
  console.log("Figma Model Context Protocol サーバーを起動しています...");
  
  // Figmaアクセストークンを環境変数から取得
  const accessToken = Deno.env.get("FIGMA_ACCESS_TOKEN");
  if (!accessToken) {
    console.error("エラー: 環境変数FIGMA_ACCESS_TOKENが設定されていません。");
    console.error("Figma個人アクセストークンを設定してください。");
    console.error("例: export FIGMA_ACCESS_TOKEN=your-figma-access-token");
    Deno.exit(1);
  }
  
  // Figma認証設定
  const authConfig = {
    accessToken
  };
  
  // Figma MCPサーバーを作成
  const figmaMcpServer = new FigmaMcpServer(
    authConfig,
    "Figma MCP Server",
    "1.0.0"
  );
  
  // サーバーを取得
  const server = figmaMcpServer.getServer();
  
  // SSEトランスポートを作成
  const transport = new SseTransport({
    port: PORT,
    path: "/mcp"
  });
  
  // サーバーを起動
  try {
    await server.connect(transport);
    console.log(`サーバーが起動しました。http://localhost:${PORT}/mcp にアクセスしてください。`);
    console.log("Ctrl+Cで終了します。");
    
    // プロセスが終了しないようにする
    await new Promise(() => {});
  } catch (error) {
    console.error("サーバー起動エラー:", error);
    Deno.exit(1);
  }
}

// メイン関数を実行
if (import.meta.main) {
  main().catch(error => {
    console.error("予期しないエラーが発生しました:", error);
    Deno.exit(1);
  });
}
