/**
 * AI モデル統合
 * 
 * RooCodeやClineとの統合インターフェース
 */

import { McpServer, McpResourceTemplate, McpContent } from "../model/model_context_protocol.ts";
import { FigmaClient } from "../api/figma_client.ts";
import { FigmaFileClient } from "../api/figma_file_api.ts";
import { FigmaComponentsClient } from "../api/figma_components_api.ts";
import { FigmaCommentsClient } from "../api/figma_comments_api.ts";
import { FigmaToModelContextAdapter, FigmaModelContextResourceProvider } from "./figma_to_model_context_adapter.ts";
import { FigmaAuthConfig } from "../api/types.ts";

/**
 * Figma MCP サーバー
 */
export class FigmaMcpServer {
  private server: McpServer;
  private figmaClient: FigmaClient;
  private fileClient: FigmaFileClient;
  private componentsClient: FigmaComponentsClient;
  private commentsClient: FigmaCommentsClient;
  private adapter: FigmaToModelContextAdapter;
  private resourceProvider: FigmaModelContextResourceProvider;

  /**
   * Figma MCP サーバーを初期化
   * @param authConfig Figma認証設定
   * @param serverName サーバー名
   * @param serverVersion サーバーバージョン
   */
  constructor(
    authConfig: FigmaAuthConfig,
    serverName: string = "Figma MCP Server",
    serverVersion: string = "1.0.0"
  ) {
    // MCPサーバーを初期化
    this.server = new McpServer({
      name: serverName,
      version: serverVersion
    });

    // Figmaクライアントを初期化
    this.figmaClient = new FigmaClient(authConfig);
    this.fileClient = new FigmaFileClient(authConfig);
    this.componentsClient = new FigmaComponentsClient(authConfig);
    this.commentsClient = new FigmaCommentsClient(authConfig);

    // アダプターを初期化
    this.adapter = new FigmaToModelContextAdapter();
    this.resourceProvider = new FigmaModelContextResourceProvider();

    // リソースとツールを登録
    this.registerResources();
    this.registerTools();
  }

  /**
   * リソースを登録
   */
  private registerResources(): void {
    // ファイルリソース
    this.server.resource(
      "figma-file",
      this.resourceProvider.getFileResourceTemplate(),
      async (uri, params) => {
        const fileKey = params.fileKey;
        const file = await this.fileClient.getFile({ key: fileKey });
        const resource = this.adapter.convertFileToResource(file, fileKey);
        return { contents: [resource] };
      }
    );

    // ノードリソース
    this.server.resource(
      "figma-node",
      this.resourceProvider.getNodeResourceTemplate(),
      async (uri, params) => {
        const { fileKey, nodeId } = params;
        const node = await this.fileClient.getNode(fileKey, nodeId);
        if (!node) {
          throw new Error(`Node not found: ${nodeId}`);
        }
        const resource = this.adapter.convertNodeToResource(node, fileKey, nodeId);
        return { contents: [resource] };
      }
    );

    // コンポーネントリソース
    this.server.resource(
      "figma-component",
      this.resourceProvider.getComponentResourceTemplate(),
      async (uri, params) => {
        const componentKey = params.componentKey;
        const response = await this.componentsClient.getComponent(componentKey);
        const resource = this.adapter.convertComponentToResource(response.component);
        return { contents: [resource] };
      }
    );

    // コメントリソース
    this.server.resource(
      "figma-comment",
      this.resourceProvider.getCommentResourceTemplate(),
      async (uri, params) => {
        const { fileKey, commentId } = params;
        const response = await this.commentsClient.getComment({ file_key: fileKey, comment_id: commentId });
        const resource = this.adapter.convertCommentToResource(response.comment, fileKey);
        return { contents: [resource] };
      }
    );
  }

  /**
   * ツールを登録
   */
  private registerTools(): void {
    // ファイル検索ツール
    this.server.tool(
      "search-figma-files",
      { query: "string" },
      async (params) => {
        const query = params.query as string;
        // 注意: 実際のFigma APIにはファイル検索エンドポイントがないため、
        // ここではモックデータを返しています。実際の実装では、
        // Figmaプラグインやその他の方法でファイル検索を行う必要があります。
        return {
          content: [
            {
              type: "text",
              text: `検索クエリ "${query}" に一致するFigmaファイルの検索結果です。\n\n` +
                    `注意: Figma APIには直接的なファイル検索機能がないため、この機能は制限されています。`
            }
          ]
        };
      }
    );

    // コンポーネント検索ツール
    this.server.tool(
      "search-figma-components",
      { teamId: "string", query: "string" },
      async (params) => {
        const teamId = params.teamId as string;
        const query = params.query as string;
        
        try {
          const response = await this.componentsClient.getTeamComponents(teamId);
          const filteredComponents = response.components.filter(
            comp => comp.name.toLowerCase().includes(query.toLowerCase())
          );
          
          let resultText = `チームID ${teamId} 内で "${query}" に一致するコンポーネント:\n\n`;
          
          if (filteredComponents.length === 0) {
            resultText += "一致するコンポーネントが見つかりませんでした。";
          } else {
            filteredComponents.forEach(comp => {
              resultText += `- ${comp.name} (Key: ${comp.key})\n`;
              if (comp.description) {
                resultText += `  説明: ${comp.description}\n`;
              }
              resultText += "\n";
            });
          }
          
          return {
            content: [
              {
                type: "text",
                text: resultText
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
              }
            ]
          };
        }
      }
    );

    // ノード情報取得ツール
    this.server.tool(
      "get-figma-node-info",
      { fileKey: "string", nodeId: "string" },
      async (params) => {
        const fileKey = params.fileKey as string;
        const nodeId = params.nodeId as string;
        
        try {
          const node = await this.fileClient.getNode(fileKey, nodeId);
          if (!node) {
            return {
              content: [
                {
                  type: "text",
                  text: `ノードID ${nodeId} が見つかりませんでした。`
                }
              ]
            };
          }
          
          const content = this.resourceProvider.convertNodeToContent(node, fileKey, nodeId);
          return { content: [content] };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
              }
            ]
          };
        }
      }
    );
  }

  /**
   * サーバーを取得
   * @returns MCPサーバー
   */
  getServer(): McpServer {
    return this.server;
  }
}

/**
 * RooCode統合インターフェース
 */
export class RooCodeIntegration {
  private figmaMcpServer: FigmaMcpServer;
  
  /**
   * RooCode統合を初期化
   * @param authConfig Figma認証設定
   */
  constructor(authConfig: FigmaAuthConfig) {
    this.figmaMcpServer = new FigmaMcpServer(
      authConfig,
      "Figma RooCode Integration",
      "1.0.0"
    );
  }
  
  /**
   * Figma MCPサーバーを取得
   * @returns Figma MCPサーバー
   */
  getFigmaMcpServer(): FigmaMcpServer {
    return this.figmaMcpServer;
  }
  
  /**
   * MCPサーバーを取得
   * @returns MCPサーバー
   */
  getMcpServer(): McpServer {
    return this.figmaMcpServer.getServer();
  }
}

/**
 * Cline統合インターフェース
 */
export class ClineIntegration {
  private figmaMcpServer: FigmaMcpServer;
  
  /**
   * Cline統合を初期化
   * @param authConfig Figma認証設定
   */
  constructor(authConfig: FigmaAuthConfig) {
    this.figmaMcpServer = new FigmaMcpServer(
      authConfig,
      "Figma Cline Integration",
      "1.0.0"
    );
  }
  
  /**
   * Figma MCPサーバーを取得
   * @returns Figma MCPサーバー
   */
  getFigmaMcpServer(): FigmaMcpServer {
    return this.figmaMcpServer;
  }
  
  /**
   * MCPサーバーを取得
   * @returns MCPサーバー
   */
  getMcpServer(): McpServer {
    return this.figmaMcpServer.getServer();
  }
}
