/**
 * Server-Sent Events トランスポート
 * 
 * Server-Sent Eventsを使用したMCPトランスポート実装
 */

import { McpTransport } from "../model/model_context_protocol.ts";

/**
 * SSEトランスポート設定
 */
export interface SseTransportConfig {
  port: number;
  host?: string;
  path?: string;
}

/**
 * Server-Sent Eventsトランスポート
 */
export class SseTransport implements McpTransport {
  private config: SseTransportConfig;
  private messageHandler: ((message: string) => Promise<void>) | null = null;
  private server: Deno.HttpServer | null = null;
  private clients: Set<ReadableStreamDefaultController<Uint8Array>> = new Set();
  private encoder = new TextEncoder();
  
  /**
   * SSEトランスポートを初期化
   * @param config SSEトランスポート設定
   */
  constructor(config: SseTransportConfig) {
    this.config = {
      host: config.host || "localhost",
      port: config.port,
      path: config.path || "/mcp"
    };
  }
  
  /**
   * トランスポートに接続
   * @param messageHandler メッセージハンドラー
   */
  async connect(messageHandler: (message: string) => Promise<void>): Promise<void> {
    this.messageHandler = messageHandler;
    
    // HTTPサーバーを作成
    this.server = Deno.serve({
      port: this.config.port,
      hostname: this.config.host
    }, this.handleRequest.bind(this));
    
    console.log(`SSE transport listening on http://${this.config.host}:${this.config.port}${this.config.path}`);
    
    return Promise.resolve();
  }
  
  /**
   * メッセージを送信
   * @param message 送信するメッセージ
   */
  send(message: string): void {
    // すべてのクライアントにメッセージを送信
    for (const controller of this.clients) {
      try {
        const data = this.encoder.encode(`data: ${message}\n\n`);
        controller.enqueue(data);
      } catch (error) {
        console.error("Error sending message to client:", error);
        this.clients.delete(controller);
      }
    }
  }
  
  /**
   * トランスポートを切断
   */
  async disconnect(): Promise<void> {
    if (this.server) {
      this.server.shutdown();
      this.server = null;
    }
    
    this.clients.clear();
    this.messageHandler = null;
    
    return Promise.resolve();
  }
  
  /**
   * HTTPリクエストを処理
   * @param request HTTPリクエスト
   * @returns HTTPレスポンス
   */
  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // MCPエンドポイントへのリクエストを処理
    if (url.pathname === this.config.path) {
      if (request.method === "GET") {
        // SSE接続を確立
        return this.handleSseConnection();
      } else if (request.method === "POST") {
        // クライアントからのメッセージを処理
        return this.handleClientMessage(request);
      }
    }
    
    // その他のリクエストには404を返す
    return new Response("Not Found", { status: 404 });
  }
  
  /**
   * SSE接続を処理
   * @returns SSEレスポンス
   */
  private handleSseConnection(): Response {
    const { readable, writable } = new TransformStream();
    const controller = writable.getWriter();
    
    // クライアントを追加
    this.clients.add(controller as unknown as ReadableStreamDefaultController<Uint8Array>);
    
    // 接続が閉じられたときにクライアントを削除
    readable.pipeTo(new WritableStream()).catch(() => {
      this.clients.delete(controller as unknown as ReadableStreamDefaultController<Uint8Array>);
    });
    
    // SSEヘッダーを設定
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    
    return new Response(readable, { headers });
  }
  
  /**
   * クライアントからのメッセージを処理
   * @param request POSTリクエスト
   * @returns HTTPレスポンス
   */
  private async handleClientMessage(request: Request): Promise<Response> {
    try {
      const message = await request.text();
      
      if (this.messageHandler) {
        await this.messageHandler(message);
      }
      
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error handling client message:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}
