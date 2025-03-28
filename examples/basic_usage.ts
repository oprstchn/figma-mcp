/**
 * 基本的な使用例
 * 
 * Figma Model Context Protocolの基本的な使い方を示す例
 */

import { FigmaMcpServer } from "../src/adapters/ai_model_integration.ts";
import { StdioTransport } from "../src/transports/stdio.ts";

// メイン関数
async function main() {
  console.log("Figma Model Context Protocol - 基本的な使用例");
  
  // Figma認証設定
  const authConfig = {
    accessToken: Deno.env.get("FIGMA_ACCESS_TOKEN") || "your-figma-access-token"
  };
  
  // Figma MCPサーバーを作成
  const figmaMcpServer = new FigmaMcpServer(
    authConfig,
    "Example Figma MCP Server",
    "1.0.0"
  );
  
  // サーバーを取得
  const server = figmaMcpServer.getServer();
  
  // カスタムリソースを追加
  server.resource(
    "example-resource",
    "example://{param}",
    async (uri, params) => {
      console.log(`リソースが要求されました: ${uri.href}`);
      console.log(`パラメータ: ${JSON.stringify(params)}`);
      
      return {
        contents: [
          {
            uri: uri.href,
            text: `Example resource with param: ${params.param}`
          }
        ]
      };
    }
  );
  
  // カスタムツールを追加
  server.tool(
    "example-tool",
    { message: "string" },
    async (params) => {
      console.log(`ツールが呼び出されました: example-tool`);
      console.log(`パラメータ: ${JSON.stringify(params)}`);
      
      return {
        content: [
          {
            type: "text",
            text: `You said: ${params.message}`
          }
        ]
      };
    }
  );
  
  // トランスポートを作成
  const transport = new StdioTransport();
  
  // サーバーを起動
  console.log("サーバーを起動しています...");
  await server.connect(transport);
  console.log("サーバーが起動しました。Ctrl+Cで終了します。");
  
  // サーバーを実行し続ける
  await new Promise(() => {});
}

// メイン関数を実行
if (import.meta.main) {
  main().catch(error => {
    console.error("エラーが発生しました:", error);
    Deno.exit(1);
  });
}
