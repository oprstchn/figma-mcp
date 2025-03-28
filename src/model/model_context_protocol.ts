/**
 * Model Context Protocol コア実装
 * 
 * MCPの基本構造とメッセージ処理を実装
 */

// 基本的なMCPメッセージ型
export interface McpMessage {
  jsonrpc: string;
  id?: string | number;
}

// MCPリクエスト型
export interface McpRequest extends McpMessage {
  method: string;
  params: Record<string, unknown>;
}

// MCPレスポンス型
export interface McpResponse extends McpMessage {
  result?: unknown;
  error?: McpError;
}

// MCP通知型
export interface McpNotification extends McpMessage {
  method: string;
  params: Record<string, unknown>;
}

// MCPエラー型
export interface McpError {
  code: number;
  message: string;
  data?: unknown;
}

// MCPサーバー設定
export interface McpServerConfig {
  name: string;
  version: string;
  supportedProtocolVersions?: string[];
  currentProtocolVersion?: string;
}

// MCPリソース型
export interface McpResource {
  uri: string;
  text: string;
  metadata?: Record<string, unknown>;
}

// MCPコンテンツ型
export interface McpContent {
  type: string;
  text?: string;
  uri?: string;
  metadata?: Record<string, unknown>;
}

// MCPリソーステンプレート
export class McpResourceTemplate {
  private template: string;
  private options: Record<string, unknown>;
  private paramRegex = /{([^}]+)}/g;

  constructor(template: string, options: Record<string, unknown> = {}) {
    this.template = template;
    this.options = options;
  }

  // テンプレートからURIを生成
  generateUri(params: Record<string, string>): string {
    return this.template.replace(this.paramRegex, (match, paramName) => {
      return params[paramName] || match;
    });
  }

  // URIからパラメータを抽出
  extractParams(uri: string): Record<string, string> | null {
    // テンプレートをパターンに変換
    const pattern = this.template.replace(this.paramRegex, (match, paramName) => {
      return `(?<${paramName}>[^/]+)`;
    });
    
    const regex = new RegExp(`^${pattern}$`);
    const match = uri.match(regex);
    
    if (!match || !match.groups) {
      return null;
    }
    
    return match.groups;
  }

  // テンプレートを取得
  getTemplate(): string {
    return this.template;
  }

  // オプションを取得
  getOptions(): Record<string, unknown> {
    return this.options;
  }
}

// MCPサーバー実装
export class McpServer {
  private config: McpServerConfig;
  private resources: Map<string, (uri: URL, params: Record<string, string>) => Promise<{ contents: McpResource[] }>>;
  private resourceTemplates: Map<string, McpResourceTemplate>;
  private tools: Map<string, (params: Record<string, unknown>) => Promise<{ content: McpContent[] }>>;
  private prompts: Map<string, Record<string, unknown>>;
  private transport: McpTransport | null = null;
  private nextId = 1;

  constructor(config: McpServerConfig) {
    this.config = {
      ...config,
      supportedProtocolVersions: config.supportedProtocolVersions || ["2024-11-05", "2024-10-07"],
      currentProtocolVersion: config.currentProtocolVersion || "2024-11-05"
    };
    this.resources = new Map();
    this.resourceTemplates = new Map();
    this.tools = new Map();
    this.prompts = new Map();
  }

  // リソースを登録
  resource(
    name: string,
    template: string | McpResourceTemplate,
    handler: (uri: URL, params: Record<string, string>) => Promise<{ contents: McpResource[] }>
  ): void {
    const resourceTemplate = typeof template === 'string' 
      ? new McpResourceTemplate(template)
      : template;
    
    this.resourceTemplates.set(name, resourceTemplate);
    this.resources.set(name, handler);
  }

  // ツールを登録
  tool(
    name: string,
    schema: Record<string, unknown>,
    handler: (params: Record<string, unknown>) => Promise<{ content: McpContent[] }>
  ): void {
    this.tools.set(name, handler);
  }

  // プロンプトを登録
  prompt(
    name: string,
    definition: Record<string, unknown>
  ): void {
    this.prompts.set(name, definition);
  }

  // トランスポートに接続
  async connect(transport: McpTransport): Promise<void> {
    this.transport = transport;
    await transport.connect(this.handleMessage.bind(this));
    
    // サーバー情報を通知
    this.sendNotification("server.info", {
      name: this.config.name,
      version: this.config.version,
      protocol: {
        jsonrpc: "2.0",
        version: this.config.currentProtocolVersion,
        supported: this.config.supportedProtocolVersions
      }
    });
  }

  // メッセージハンドラー
  private async handleMessage(message: string): Promise<void> {
    try {
      const parsed = JSON.parse(message);
      
      // リクエスト処理
      if (parsed.method && parsed.id !== undefined) {
        await this.handleRequest(parsed as McpRequest);
      }
      // 通知処理
      else if (parsed.method) {
        await this.handleNotification(parsed as McpNotification);
      }
      // レスポンス処理
      else if (parsed.id !== undefined) {
        await this.handleResponse(parsed as McpResponse);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      
      // パースエラーの場合はエラーレスポンスを送信
      if (error instanceof SyntaxError) {
        this.sendErrorResponse("unknown", -32700, "Parse error", error.message);
      }
    }
  }

  // リクエスト処理
  private async handleRequest(request: McpRequest): Promise<void> {
    const { method, params, id } = request;
    
    try {
      let result: unknown;
      
      // メソッドに応じた処理
      switch (method) {
        case "resource.get":
          result = await this.handleResourceGet(params);
          break;
        
        case "resource.list":
          result = await this.handleResourceList(params);
          break;
        
        case "resource.templates":
          result = await this.handleResourceTemplates();
          break;
        
        case "tool.list":
          result = await this.handleToolList();
          break;
        
        case "tool.call":
          result = await this.handleToolCall(params);
          break;
        
        case "prompt.list":
          result = await this.handlePromptList();
          break;
        
        case "prompt.get":
          result = await this.handlePromptGet(params);
          break;
        
        default:
          // 未知のメソッド
          this.sendErrorResponse(id, -32601, "Method not found", `Method '${method}' not found`);
          return;
      }
      
      // 成功レスポンスを送信
      this.sendResponse(id, result);
    } catch (error) {
      console.error(`Error handling request ${method}:`, error);
      
      // エラーレスポンスを送信
      this.sendErrorResponse(
        id,
        -32603,
        "Internal error",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // 通知処理
  private async handleNotification(notification: McpNotification): Promise<void> {
    const { method, params } = notification;
    
    try {
      switch (method) {
        case "client.info":
          // クライアント情報を受信
          console.log("Client info received:", params);
          break;
        
        default:
          console.warn(`Unknown notification method: ${method}`);
          break;
      }
    } catch (error) {
      console.error(`Error handling notification ${method}:`, error);
    }
  }

  // レスポンス処理
  private async handleResponse(response: McpResponse): Promise<void> {
    // 現在のサーバー実装ではレスポンスは期待していない
    console.log("Unexpected response received:", response);
  }

  // リソース取得処理
  private async handleResourceGet(params: Record<string, unknown>): Promise<{ contents: McpResource[] }> {
    const uriStr = params.uri as string;
    if (!uriStr) {
      throw new Error("Missing required parameter: uri");
    }
    
    const uri = new URL(uriStr);
    const scheme = uri.protocol.replace(':', '');
    
    // リソースハンドラーを探す
    for (const [name, template] of this.resourceTemplates.entries()) {
      const extractedParams = template.extractParams(uriStr);
      if (extractedParams) {
        const handler = this.resources.get(name);
        if (handler) {
          return await handler(uri, extractedParams);
        }
      }
    }
    
    throw new Error(`Resource not found: ${uriStr}`);
  }

  // リソース一覧処理
  private async handleResourceList(params: Record<string, unknown>): Promise<{ resources: string[] }> {
    // 実装されたリソーステンプレートからURIのリストを生成
    const resources: string[] = [];
    
    for (const [name, template] of this.resourceTemplates.entries()) {
      if (template.getOptions().list !== false) {
        resources.push(template.getTemplate());
      }
    }
    
    return { resources };
  }

  // リソーステンプレート一覧処理
  private async handleResourceTemplates(): Promise<{ templates: Record<string, unknown>[] }> {
    const templates: Record<string, unknown>[] = [];
    
    for (const [name, template] of this.resourceTemplates.entries()) {
      templates.push({
        name,
        template: template.getTemplate(),
        options: template.getOptions()
      });
    }
    
    return { templates };
  }

  // ツール一覧処理
  private async handleToolList(): Promise<{ tools: string[] }> {
    return { tools: Array.from(this.tools.keys()) };
  }

  // ツール呼び出し処理
  private async handleToolCall(params: Record<string, unknown>): Promise<{ content: McpContent[] }> {
    const toolName = params.name as string;
    const toolParams = params.params as Record<string, unknown>;
    
    if (!toolName) {
      throw new Error("Missing required parameter: name");
    }
    
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    return await tool(toolParams || {});
  }

  // プロンプト一覧処理
  private async handlePromptList(): Promise<{ prompts: string[] }> {
    return { prompts: Array.from(this.prompts.keys()) };
  }

  // プロンプト取得処理
  private async handlePromptGet(params: Record<string, unknown>): Promise<{ prompt: Record<string, unknown> }> {
    const promptName = params.name as string;
    
    if (!promptName) {
      throw new Error("Missing required parameter: name");
    }
    
    const prompt = this.prompts.get(promptName);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptName}`);
    }
    
    return { prompt };
  }

  // レスポンス送信
  private sendResponse(id: string | number, result: unknown): void {
    if (!this.transport) {
      throw new Error("Transport not connected");
    }
    
    const response: McpResponse = {
      jsonrpc: "2.0",
      id,
      result
    };
    
    this.transport.send(JSON.stringify(response));
  }

  // エラーレスポンス送信
  private sendErrorResponse(id: string | number, code: number, message: string, data?: unknown): void {
    if (!this.transport) {
      throw new Error("Transport not connected");
    }
    
    const response: McpResponse = {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        data
      }
    };
    
    this.transport.send(JSON.stringify(response));
  }

  // 通知送信
  private sendNotification(method: string, params: Record<string, unknown>): void {
    if (!this.transport) {
      throw new Error("Transport not connected");
    }
    
    const notification: McpNotification = {
      jsonrpc: "2.0",
      method,
      params
    };
    
    this.transport.send(JSON.stringify(notification));
  }

  // リクエスト送信
  async sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.transport) {
      throw new Error("Transport not connected");
    }
    
    const id = this.nextId++;
    
    const request: McpRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params
    };
    
    this.transport.send(JSON.stringify(request));
    
    // 注意: 現在の実装ではレスポンスの待機は行っていない
    // 実際の実装では、Promiseを返し、レスポンスを待機する必要がある
    return Promise.resolve();
  }
}

// MCPトランスポートインターフェース
export interface McpTransport {
  connect(messageHandler: (message: string) => Promise<void>): Promise<void>;
  send(message: string): void;
  disconnect(): Promise<void>;
}
