# Figma Model Context Protocol

Figma Model Context Protocol（MCP）は、FigmaデザインデータをRooCodeやClineなどのAIモデルから参照できるようにするためのライブラリです。Model Context Protocol仕様に準拠したサーバーを実装し、Figma APIとの統合を提供します。

## 特徴

- **Denoベース**: 最新のDenoランタイムを使用した実装
- **標準ライブラリ優先**: 外部SDKに依存せず、Denoの標準ライブラリを最大限活用
- **型安全**: TypeScriptの型システムを活用した安全な実装
- **公式仕様準拠**: Model Context Protocol公式仕様に完全準拠
- **Figma API完全対応**: Figma APIの全機能にアクセス可能
- **AIモデル統合**: RooCodeとClineとの統合インターフェースを提供

## インストール

```bash
# Denoプロジェクトに依存関係として追加
deno add @oprstchn/figma-model-context-protocol
```

または、直接インポートすることもできます：

```typescript
import { FigmaMcpServer } from "https://deno.land/x/figma_model_context_protocol/mod.ts";
```

## 基本的な使い方

### Figma MCPサーバーの作成

```typescript
import { FigmaMcpServer } from "@oprstchn/figma-model-context-protocol/mod.ts";
import { StdioTransport } from "@oprstchn/figma-model-context-protocol/transports/stdio.ts";

// Figma認証設定
const authConfig = {
  accessToken: "your-figma-access-token"
};

// Figma MCPサーバーを作成
const figmaMcpServer = new FigmaMcpServer(
  authConfig,
  "My Figma MCP Server",
  "1.0.0"
);

// トランスポートを作成して接続
const transport = new StdioTransport();
await figmaMcpServer.getServer().connect(transport);
```

### RooCodeとの統合

```typescript
import { RooCodeIntegration } from "@oprstchn/figma-model-context-protocol/mod.ts";

// Figma認証設定
const authConfig = {
  accessToken: "your-figma-access-token"
};

// RooCode統合を初期化
const rooCodeIntegration = new RooCodeIntegration(authConfig);

// トランスポートを作成して接続
const transport = new StdioTransport();
await rooCodeIntegration.getMcpServer().connect(transport);
```

### Clineとの統合

```typescript
import { ClineIntegration } from "@oprstchn/figma-model-context-protocol/mod.ts";

// Figma認証設定
const authConfig = {
  accessToken: "your-figma-access-token"
};

// Cline統合を初期化
const clineIntegration = new ClineIntegration(authConfig);

// トランスポートを作成して接続
const transport = new StdioTransport();
await clineIntegration.getMcpServer().connect(transport);
```

## 高度な使い方

### カスタムリソースの追加

```typescript
import { McpResourceTemplate } from "@oprstchn/figma-model-context-protocol/mod.ts";

// Figma MCPサーバーを取得
const server = figmaMcpServer.getServer();

// カスタムリソースを追加
server.resource(
  "my-custom-resource",
  new McpResourceTemplate("custom://{param}"),
  async (uri, params) => {
    // リソースハンドラーの実装
    return {
      contents: [
        {
          uri: uri.href,
          text: `Custom resource with param: ${params.param}`
        }
      ]
    };
  }
);
```

### カスタムツールの追加

```typescript
// Figma MCPサーバーを取得
const server = figmaMcpServer.getServer();

// カスタムツールを追加
server.tool(
  "my-custom-tool",
  { param1: "string", param2: "number" },
  async (params) => {
    // ツールハンドラーの実装
    return {
      content: [
        {
          type: "text",
          text: `Custom tool executed with params: ${params.param1}, ${params.param2}`
        }
      ]
    };
  }
);
```

## アーキテクチャ

このライブラリは以下のコンポーネントで構成されています：

### API

- **FigmaClient**: Figma APIへのアクセスを提供する基本クライアント
- **FigmaFileClient**: Figmaファイル、ノード、画像へのアクセスを提供
- **FigmaComponentsClient**: Figmaコンポーネント、コンポーネントセット、スタイルへのアクセスを提供
- **FigmaCommentsClient**: Figmaコメントの操作を提供
- **FigmaWebhooksClient**: Figma Webhookの作成、管理、削除を提供
- **FigmaVariablesClient**: Figma変数とコレクションへのアクセスを提供

### 認証

- **FigmaAccessTokenProvider**: アクセストークンによる認証を提供
- **FigmaOAuth2Provider**: OAuth2による認証を提供
- **FigmaAuthProviderFactory**: 認証プロバイダーの作成を簡素化

### モデル

- **McpServer**: Model Context Protocolサーバーの実装
- **McpResourceTemplate**: リソーステンプレートの実装
- **McpTransport**: トランスポートインターフェース

### アダプター

- **FigmaToModelContextAdapter**: FigmaデータをModel Context形式に変換
- **FigmaMcpServer**: Figma APIとMCPサーバーを統合
- **RooCodeIntegration**: RooCodeとの統合インターフェース
- **ClineIntegration**: Clineとの統合インターフェース

### トランスポート

- **StdioTransport**: 標準入出力を使用したトランスポート
- **SseTransport**: Server-Sent Eventsを使用したトランスポート

## ライセンス

MIT

## 貢献

貢献は歓迎します！詳細は[CONTRIBUTING.md](./CONTRIBUTING.md)を参照してください。
