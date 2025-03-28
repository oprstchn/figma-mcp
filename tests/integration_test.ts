/**
 * 統合テスト
 * 
 * Figma Model Context Protocolの各コンポーネントが正しく連携して動作することを確認するテスト
 */

import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import { FigmaClient } from "../src/api/figma_client.ts";
import { FigmaFileClient } from "../src/api/figma_file_api.ts";
import { FigmaComponentsClient } from "../src/api/figma_components_api.ts";
import { FigmaCommentsClient } from "../src/api/figma_comments_api.ts";
import { FigmaWebhooksClient } from "../src/api/figma_webhooks_api.ts";
import { FigmaVariablesClient } from "../src/api/figma_variables_api.ts";
import { FigmaAccessTokenProvider } from "../src/auth/figma_auth.ts";
import { McpServer, McpResourceTemplate } from "../src/model/model_context_protocol.ts";
import { FigmaToModelContextAdapter, FigmaModelContextResourceProvider } from "../src/adapters/figma_to_model_context_adapter.ts";
import { FigmaMcpServer, RooCodeIntegration, ClineIntegration } from "../src/adapters/ai_model_integration.ts";

// モックトランスポート
class MockTransport {
  private messageHandler: ((message: string) => Promise<void>) | null = null;
  public sentMessages: string[] = [];
  
  async connect(messageHandler: (message: string) => Promise<void>): Promise<void> {
    this.messageHandler = messageHandler;
    return Promise.resolve();
  }
  
  send(message: string): void {
    this.sentMessages.push(message);
  }
  
  async disconnect(): Promise<void> {
    this.messageHandler = null;
    return Promise.resolve();
  }
  
  async simulateIncomingMessage(message: string): Promise<void> {
    if (!this.messageHandler) {
      throw new Error("Not connected");
    }
    await this.messageHandler(message);
  }
}

// テスト用のモックデータ
const mockAuthConfig = {
  accessToken: "mock-access-token"
};

// Figma APIクライアントのテスト
Deno.test("Figma API Client Test", () => {
  const client = new FigmaClient(mockAuthConfig);
  assertExists(client);
});

// Figmaファイルクライアントのテスト
Deno.test("Figma File Client Test", () => {
  const client = new FigmaFileClient(mockAuthConfig);
  assertExists(client);
});

// Figmaコンポーネントクライアントのテスト
Deno.test("Figma Components Client Test", () => {
  const client = new FigmaComponentsClient(mockAuthConfig);
  assertExists(client);
});

// Figmaコメントクライアントのテスト
Deno.test("Figma Comments Client Test", () => {
  const client = new FigmaCommentsClient(mockAuthConfig);
  assertExists(client);
});

// Figma Webhookクライアントのテスト
Deno.test("Figma Webhooks Client Test", () => {
  const client = new FigmaWebhooksClient(mockAuthConfig);
  assertExists(client);
});

// Figma変数クライアントのテスト
Deno.test("Figma Variables Client Test", () => {
  const client = new FigmaVariablesClient(mockAuthConfig);
  assertExists(client);
});

// 認証プロバイダーのテスト
Deno.test("Figma Auth Provider Test", () => {
  const provider = new FigmaAccessTokenProvider("mock-token");
  const config = provider.getAuthConfig();
  assertEquals(config.accessToken, "mock-token");
});

// MCPサーバーのテスト
Deno.test("MCP Server Test", () => {
  const server = new McpServer({
    name: "Test Server",
    version: "1.0.0"
  });
  assertExists(server);
});

// リソーステンプレートのテスト
Deno.test("MCP Resource Template Test", () => {
  const template = new McpResourceTemplate("test://{param}");
  const uri = template.generateUri({ param: "value" });
  assertEquals(uri, "test://value");
  
  const params = template.extractParams("test://value");
  assertEquals(params?.param, "value");
});

// Figmaアダプターのテスト
Deno.test("Figma To Model Context Adapter Test", () => {
  const adapter = new FigmaToModelContextAdapter();
  assertExists(adapter);
});

// リソースプロバイダーのテスト
Deno.test("Figma Model Context Resource Provider Test", () => {
  const provider = new FigmaModelContextResourceProvider();
  const template = provider.getFileResourceTemplate();
  assertExists(template);
  assertEquals(template.getTemplate(), "figma://file/{fileKey}");
});

// Figma MCPサーバーのテスト
Deno.test("Figma MCP Server Test", () => {
  const server = new FigmaMcpServer(mockAuthConfig);
  assertExists(server);
  assertExists(server.getServer());
});

// RooCode統合のテスト
Deno.test("RooCode Integration Test", () => {
  const integration = new RooCodeIntegration(mockAuthConfig);
  assertExists(integration);
  assertExists(integration.getMcpServer());
});

// Cline統合のテスト
Deno.test("Cline Integration Test", () => {
  const integration = new ClineIntegration(mockAuthConfig);
  assertExists(integration);
  assertExists(integration.getMcpServer());
});

// MCPサーバーとトランスポートの統合テスト
Deno.test("MCP Server and Transport Integration Test", async () => {
  const server = new McpServer({
    name: "Test Server",
    version: "1.0.0"
  });
  
  const transport = new MockTransport();
  await server.connect(transport);
  
  // サーバー情報通知が送信されたことを確認
  assertEquals(transport.sentMessages.length, 1);
  const message = JSON.parse(transport.sentMessages[0]);
  assertEquals(message.method, "server.info");
  assertEquals(message.params.name, "Test Server");
  assertEquals(message.params.version, "1.0.0");
});

// リソースリクエストのテスト
Deno.test("Resource Request Test", async () => {
  const server = new McpServer({
    name: "Test Server",
    version: "1.0.0"
  });
  
  // テストリソースを登録
  server.resource(
    "test-resource",
    new McpResourceTemplate("test://{param}"),
    async (uri, params) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Test resource with param: ${params.param}`
          }
        ]
      };
    }
  );
  
  const transport = new MockTransport();
  await server.connect(transport);
  
  // リソースリクエストをシミュレート
  await transport.simulateIncomingMessage(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "resource.get",
    params: {
      uri: "test://value"
    }
  }));
  
  // レスポンスが送信されたことを確認
  assertEquals(transport.sentMessages.length, 2); // サーバー情報通知 + リソースレスポンス
  const response = JSON.parse(transport.sentMessages[1]);
  assertEquals(response.id, 1);
  assertExists(response.result);
  assertEquals(response.result.contents[0].text, "Test resource with param: value");
});

// ツール呼び出しのテスト
Deno.test("Tool Call Test", async () => {
  const server = new McpServer({
    name: "Test Server",
    version: "1.0.0"
  });
  
  // テストツールを登録
  server.tool(
    "test-tool",
    { message: "string" },
    async (params) => {
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
  
  const transport = new MockTransport();
  await server.connect(transport);
  
  // ツール呼び出しをシミュレート
  await transport.simulateIncomingMessage(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tool.call",
    params: {
      name: "test-tool",
      params: {
        message: "Hello, world!"
      }
    }
  }));
  
  // レスポンスが送信されたことを確認
  assertEquals(transport.sentMessages.length, 2); // サーバー情報通知 + ツールレスポンス
  const response = JSON.parse(transport.sentMessages[1]);
  assertEquals(response.id, 1);
  assertExists(response.result);
  assertEquals(response.result.content[0].text, "You said: Hello, world!");
});

// Figma MCPサーバーの統合テスト
Deno.test("Figma MCP Server Integration Test", async () => {
  const server = new FigmaMcpServer(mockAuthConfig);
  const mcpServer = server.getServer();
  
  const transport = new MockTransport();
  await mcpServer.connect(transport);
  
  // サーバー情報通知が送信されたことを確認
  assertEquals(transport.sentMessages.length, 1);
  const message = JSON.parse(transport.sentMessages[0]);
  assertEquals(message.method, "server.info");
  assertEquals(message.params.name, "Figma MCP Server");
});

// RooCode統合の統合テスト
Deno.test("RooCode Integration Integration Test", async () => {
  const integration = new RooCodeIntegration(mockAuthConfig);
  const server = integration.getMcpServer();
  
  const transport = new MockTransport();
  await server.connect(transport);
  
  // サーバー情報通知が送信されたことを確認
  assertEquals(transport.sentMessages.length, 1);
  const message = JSON.parse(transport.sentMessages[0]);
  assertEquals(message.method, "server.info");
  assertEquals(message.params.name, "Figma RooCode Integration");
});

// Cline統合の統合テスト
Deno.test("Cline Integration Integration Test", async () => {
  const integration = new ClineIntegration(mockAuthConfig);
  const server = integration.getMcpServer();
  
  const transport = new MockTransport();
  await server.connect(transport);
  
  // サーバー情報通知が送信されたことを確認
  assertEquals(transport.sentMessages.length, 1);
  const message = JSON.parse(transport.sentMessages[0]);
  assertEquals(message.method, "server.info");
  assertEquals(message.params.name, "Figma Cline Integration");
});
