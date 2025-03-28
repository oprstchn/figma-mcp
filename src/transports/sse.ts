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
    
    // クライアント数をログに出力
    console.log(`Message sent to ${this.clients.size} clients`);
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
        // クエリパラメータで接続モードを確認
        const mode = url.searchParams.get("mode");
        
        if (mode === "html") {
          // HTMLクライアントを提供
          return this.provideHtmlClient();
        } else {
          // SSE接続を確立
          return this.handleSseConnection();
        }
      } else if (request.method === "POST") {
        // クライアントからのメッセージを処理
        return this.handleClientMessage(request);
      }
    } else if (url.pathname === "/") {
      // ルートパスにアクセスした場合はMCPエンドポイントにリダイレクト
      return Response.redirect(`${this.config.path}?mode=html`, 302);
    }
    
    // その他のリクエストには404を返す
    return new Response("Not Found", { status: 404 });
  }
  
  /**
   * HTML SSEクライアントを提供
   * @returns HTMLレスポンス
   */
  private provideHtmlClient(): Response {
    // HTML文字列を生成
    const html = this.generateHtmlClient();
    
    const headers = new Headers({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache"
    });
    
    return new Response(html, { headers });
  }
  
  /**
   * HTML SSEクライアント文字列を生成
   * @returns HTML文字列
   */
  private generateHtmlClient(): string {
    const mcpPath = this.config.path;
    
    return "<!DOCTYPE html>\n" +
      "<html lang=\"ja\">\n" +
      "<head>\n" +
      "  <meta charset=\"UTF-8\">\n" +
      "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
      "  <title>Figma Model Context Protocol Client</title>\n" +
      "  <style>\n" +
      "    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f7; }\n" +
      "    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,.1); padding: 20px; }\n" +
      "    h1 { margin-top: 0; padding-bottom: 10px; border-bottom: 1px solid #eee; }\n" +
      "    .status { font-size: 14px; color: #666; margin-bottom: 20px; }\n" +
      "    .status span.connected { color: #34c759; font-weight: bold; }\n" +
      "    .status span.disconnected { color: #ff3b30; font-weight: bold; }\n" +
      "    .event-container { display: flex; gap: 20px; margin-bottom: 20px; }\n" +
      "    .event-list { flex: 2; border: 1px solid #ddd; border-radius: 6px; padding: 15px; height: 400px; overflow-y: auto; background: #f8f8f8; }\n" +
      "    .control-panel { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 15px; background: #f8f8f8; }\n" +
      "    .event-item { margin-bottom: 10px; padding: 10px; border-left: 4px solid #007aff; background: white; border-radius: 0 4px 4px 0; box-shadow: 0 1px 3px rgba(0,0,0,.1); word-break: break-all; }\n" +
      "    .event-item pre { margin: 0; white-space: pre-wrap; }\n" +
      "    .timestamp { color: #8e8e93; font-size: 12px; margin-bottom: 5px; }\n" +
      "    button { background: #007aff; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; margin-right: 8px; margin-bottom: 8px; }\n" +
      "    button:hover { background: #0062cc; }\n" +
      "    button:disabled { background: #b6b6b6; cursor: not-allowed; }\n" +
      "    textarea { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #ddd; margin-bottom: 10px; font-family: monospace; resize: vertical; min-height: 100px; }\n" +
      "    label { display: block; margin-bottom: 5px; font-weight: 500; }\n" +
      "    .info-panel { padding: 15px; background: #f1f8ff; border: 1px solid #c2e0ff; border-radius: 6px; margin-top: 20px; }\n" +
      "  </style>\n" +
      "</head>\n" +
      "<body>\n" +
      "  <div class=\"container\">\n" +
      "    <h1>Figma Model Context Protocol Client</h1>\n" +
      "    <div class=\"status\">Status: <span id=\"status\" class=\"disconnected\">Disconnected</span></div>\n" +
      "    <div class=\"event-container\">\n" +
      "      <div class=\"event-list\" id=\"event-list\">\n" +
      "        <div class=\"event-item\">\n" +
      "          <div class=\"timestamp\">Welcome to Figma MCP Client</div>\n" +
      "          <pre>Connect to start receiving events</pre>\n" +
      "        </div>\n" +
      "      </div>\n" +
      "      <div class=\"control-panel\">\n" +
      "        <label for=\"message-input\">Send JSON-RPC Message:</label>\n" +
      "        <textarea id=\"message-input\" placeholder='{\"jsonrpc\":\"2.0\",\"method\":\"resource.list\",\"id\":1,\"params\":{}}'></textarea>\n" +
      "        <button id=\"connect-btn\">Connect</button>\n" +
      "        <button id=\"disconnect-btn\" disabled>Disconnect</button>\n" +
      "        <button id=\"send-btn\" disabled>Send Message</button>\n" +
      "        <button id=\"clear-btn\">Clear Events</button>\n" +
      "        <div>\n" +
      "          <button id=\"list-resources-btn\" disabled>List Resources</button>\n" +
      "          <button id=\"list-tools-btn\" disabled>List Tools</button>\n" +
      "        </div>\n" +
      "      </div>\n" +
      "    </div>\n" +
      "    <div class=\"info-panel\">\n" +
      "      <h3>Example Commands</h3>\n" +
      "      <ul>\n" +
      "        <li><code>resource.list</code> - リソース一覧を取得</li>\n" +
      "        <li><code>resource.templates</code> - リソーステンプレート一覧を取得</li>\n" +
      "        <li><code>tool.list</code> - ツール一覧を取得</li>\n" +
      "        <li><code>tool.call</code> - ツールを呼び出し (パラメータ必須)</li>\n" +
      "      </ul>\n" +
      "    </div>\n" +
      "  </div>\n" +
      "  <script>\n" +
      "    let eventSource = null;\n" +
      "    let messageId = 1;\n" +
      "    const mcpPath = \"" + mcpPath + "\";\n" +
      "    \n" +
      "    const statusEl = document.getElementById('status');\n" +
      "    const eventListEl = document.getElementById('event-list');\n" +
      "    const messageInputEl = document.getElementById('message-input');\n" +
      "    const connectBtn = document.getElementById('connect-btn');\n" +
      "    const disconnectBtn = document.getElementById('disconnect-btn');\n" +
      "    const sendBtn = document.getElementById('send-btn');\n" +
      "    const clearBtn = document.getElementById('clear-btn');\n" +
      "    const listResourcesBtn = document.getElementById('list-resources-btn');\n" +
      "    const listToolsBtn = document.getElementById('list-tools-btn');\n" +
      "    \n" +
      "    function addEvent(data, isOutgoing) {\n" +
      "      const now = new Date();\n" +
      "      const timestamp = now.toLocaleTimeString() + '.' + now.getMilliseconds();\n" +
      "      \n" +
      "      const eventItem = document.createElement('div');\n" +
      "      eventItem.className = 'event-item';\n" +
      "      if (isOutgoing) {\n" +
      "        eventItem.style.borderLeftColor = '#5ac8fa';\n" +
      "      }\n" +
      "      \n" +
      "      const timestampEl = document.createElement('div');\n" +
      "      timestampEl.className = 'timestamp';\n" +
      "      timestampEl.textContent = isOutgoing ? 'Sent at ' + timestamp : 'Received at ' + timestamp;\n" +
      "      \n" +
      "      const preEl = document.createElement('pre');\n" +
      "      let content = data;\n" +
      "      \n" +
      "      try {\n" +
      "        if (typeof data === 'string') {\n" +
      "          const json = JSON.parse(data);\n" +
      "          content = JSON.stringify(json, null, 2);\n" +
      "        } else {\n" +
      "          content = JSON.stringify(data, null, 2);\n" +
      "        }\n" +
      "      } catch (e) {\n" +
      "        content = data;\n" +
      "      }\n" +
      "      \n" +
      "      preEl.textContent = content;\n" +
      "      \n" +
      "      eventItem.appendChild(timestampEl);\n" +
      "      eventItem.appendChild(preEl);\n" +
      "      eventListEl.appendChild(eventItem);\n" +
      "      \n" +
      "      eventListEl.scrollTop = eventListEl.scrollHeight;\n" +
      "    }\n" +
      "    \n" +
      "    function updateStatus(connected) {\n" +
      "      statusEl.textContent = connected ? 'Connected' : 'Disconnected';\n" +
      "      statusEl.className = connected ? 'connected' : 'disconnected';\n" +
      "      \n" +
      "      connectBtn.disabled = connected;\n" +
      "      disconnectBtn.disabled = !connected;\n" +
      "      sendBtn.disabled = !connected;\n" +
      "      listResourcesBtn.disabled = !connected;\n" +
      "      listToolsBtn.disabled = !connected;\n" +
      "    }\n" +
      "    \n" +
      "    function connect() {\n" +
      "      try {\n" +
      "        if (eventSource) {\n" +
      "          eventSource.close();\n" +
      "        }\n" +
      "        \n" +
      "        eventSource = new EventSource(mcpPath);\n" +
      "        \n" +
      "        eventSource.onopen = function() {\n" +
      "          addEvent('Connection established');\n" +
      "          updateStatus(true);\n" +
      "        };\n" +
      "        \n" +
      "        eventSource.onmessage = function(event) {\n" +
      "          addEvent(event.data);\n" +
      "        };\n" +
      "        \n" +
      "        eventSource.onerror = function(error) {\n" +
      "          console.error('SSE error:', error);\n" +
      "          addEvent('Error: Connection failed');\n" +
      "          updateStatus(false);\n" +
      "          eventSource.close();\n" +
      "          eventSource = null;\n" +
      "        };\n" +
      "        \n" +
      "        eventSource.addEventListener('connect', function(event) {\n" +
      "          addEvent('Connected to server');\n" +
      "        });\n" +
      "      } catch (error) {\n" +
      "        console.error('Connection error:', error);\n" +
      "        addEvent('Error: ' + error.message);\n" +
      "      }\n" +
      "    }\n" +
      "    \n" +
      "    function disconnect() {\n" +
      "      if (eventSource) {\n" +
      "        eventSource.close();\n" +
      "        eventSource = null;\n" +
      "        addEvent('Connection closed');\n" +
      "        updateStatus(false);\n" +
      "      }\n" +
      "    }\n" +
      "    \n" +
      "    function sendMessage(messageObj) {\n" +
      "      if (!eventSource) {\n" +
      "        addEvent('Error: Not connected');\n" +
      "        return;\n" +
      "      }\n" +
      "      \n" +
      "      try {\n" +
      "        let message;\n" +
      "        \n" +
      "        if (messageObj) {\n" +
      "          message = messageObj;\n" +
      "        } else {\n" +
      "          const text = messageInputEl.value.trim();\n" +
      "          if (!text) {\n" +
      "            addEvent('Error: Message is empty');\n" +
      "            return;\n" +
      "          }\n" +
      "          \n" +
      "          message = JSON.parse(text);\n" +
      "        }\n" +
      "        \n" +
      "        if (!message.id && message.method) {\n" +
      "          message.id = messageId++;\n" +
      "        }\n" +
      "        \n" +
      "        if (!message.jsonrpc) {\n" +
      "          message.jsonrpc = '2.0';\n" +
      "        }\n" +
      "        \n" +
      "        const messageStr = JSON.stringify(message);\n" +
      "        \n" +
      "        fetch(mcpPath, {\n" +
      "          method: 'POST',\n" +
      "          headers: {\n" +
      "            'Content-Type': 'application/json'\n" +
      "          },\n" +
      "          body: messageStr\n" +
      "        }).catch(function(error) {\n" +
      "          console.error('Fetch error:', error);\n" +
      "          addEvent('Error sending message: ' + error.message);\n" +
      "        });\n" +
      "        \n" +
      "        addEvent(message, true);\n" +
      "      } catch (error) {\n" +
      "        console.error('JSON parse error:', error);\n" +
      "        addEvent('Error parsing JSON: ' + error.message);\n" +
      "      }\n" +
      "    }\n" +
      "    \n" +
      "    function listResources() {\n" +
      "      sendMessage({\n" +
      "        jsonrpc: '2.0',\n" +
      "        method: 'resource.list',\n" +
      "        id: messageId++,\n" +
      "        params: {}\n" +
      "      });\n" +
      "    }\n" +
      "    \n" +
      "    function listTools() {\n" +
      "      sendMessage({\n" +
      "        jsonrpc: '2.0',\n" +
      "        method: 'tool.list',\n" +
      "        id: messageId++,\n" +
      "        params: {}\n" +
      "      });\n" +
      "    }\n" +
      "    \n" +
      "    function clearEvents() {\n" +
      "      eventListEl.innerHTML = '';\n" +
      "      addEvent('Events cleared');\n" +
      "    }\n" +
      "    \n" +
      "    connectBtn.addEventListener('click', connect);\n" +
      "    disconnectBtn.addEventListener('click', disconnect);\n" +
      "    sendBtn.addEventListener('click', function() { sendMessage(); });\n" +
      "    clearBtn.addEventListener('click', clearEvents);\n" +
      "    listResourcesBtn.addEventListener('click', listResources);\n" +
      "    listToolsBtn.addEventListener('click', listTools);\n" +
      "    \n" +
      "    updateStatus(false);\n" +
      "  </script>\n" +
      "</body>\n" +
      "</html>";
  }
  
  /**
   * SSE接続を処理
   * @returns SSEレスポンス
   */
  private handleSseConnection(): Response {
    // 新しいストリームペアを作成
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // コントローラーを作成
    const controller: ReadableStreamDefaultController<Uint8Array> = {
      enqueue: (chunk: Uint8Array) => {
        writer.write(chunk).catch(error => {
          console.error("Error writing to stream:", error);
          this.clients.delete(controller);
        });
      },
      close: () => {
        writer.close().catch(console.error);
        this.clients.delete(controller);
      },
      error: (reason: any) => {
        writer.abort(reason).catch(console.error);
        this.clients.delete(controller);
      },
      desiredSize: null // This is a read-only property in the actual controller
    };
    
    // クライアントを追加
    this.clients.add(controller);
    
    // SSEヘッダーを設定
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });
    
    // 接続が開始されたことを示すイベントを送信
    const connectEvent = this.encoder.encode("event: connect\ndata: connected\n\n");
    controller.enqueue(connectEvent);
    
    return new Response(stream.readable, { headers });
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
