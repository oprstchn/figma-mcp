# Model Context Protocol

Model Context Protocolは、FigmaのデザインデータをRooCodeやClineなどのAIモデルが理解できる形式に変換するためのプロトコルです。このプロジェクトはDenoを使用して実装されています。

## 概要

このプロジェクトは以下の主要コンポーネントで構成されています：

1. **Figma API クライアント**: Figma APIと通信するためのクライアントライブラリ
2. **Model Context Protocol**: デザインコンテキストを表現するための標準化されたデータモデル
3. **アダプター**: Figma APIデータをModel Context形式に変換するためのアダプター
4. **AI統合**: RooCodeとClineとの統合インターフェース

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/figma-model-context-protocol.git
cd figma-model-context-protocol

# 依存関係をインストール（必要な場合）
deno cache --reload src/mod.ts
```

## 使用方法

### 基本的な使用例

```typescript
import { FigmaClient } from "./src/api/figma_client.ts";
import { FigmaToModelContextAdapter } from "./src/adapters/figma_to_model_context_adapter.ts";
import { AIModelIntegrationFactory } from "./src/adapters/ai_model_integration.ts";

// Figma APIクライアントを初期化
const client = new FigmaClient({
  accessToken: "your-figma-access-token"
});

// アダプターを作成
const adapter = new FigmaToModelContextAdapter(client);

// Figmaファイルをモデルコンテキストに変換
const fileKey = "figma-file-key";
const modelContext = await adapter.convertFileToModelContext(fileKey, {
  includeStyles: true,
  includeVariables: true,
  includeImages: true
});

// RooCode統合を作成
const rooCodeIntegration = AIModelIntegrationFactory.createIntegration("roocode");

// プロンプトにコンテキストを注入
const prompt = "このデザインに基づいてHTMLとCSSを生成してください";
const enhancedPrompt = rooCodeIntegration.injectContext(modelContext, prompt);

console.log(enhancedPrompt);
```

### Figma認証

```typescript
import { FigmaAuth } from "./src/auth/figma_auth.ts";

// 個人アクセストークンのURLを取得
const tokenUrl = FigmaAuth.getPersonalAccessTokenUrl();
console.log(`個人アクセストークンを生成するには次のURLにアクセスしてください: ${tokenUrl}`);

// OAuth2認証URLを生成
const oauthConfig = {
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  redirectUri: "your-redirect-uri"
};

const authUrl = FigmaAuth.getOAuth2AuthorizationUrl(oauthConfig);
console.log(`OAuth2認証を行うには次のURLにアクセスしてください: ${authUrl}`);

// 認証コードをトークンに交換
const code = "authorization-code";
const tokenResponse = await FigmaAuth.exchangeCodeForToken(oauthConfig, code);
console.log(`アクセストークン: ${tokenResponse.access_token}`);
```

### Clineとの統合

```typescript
// Cline統合を作成
const clineIntegration = AIModelIntegrationFactory.createIntegration("cline");

// プロンプトにコンテキストを注入
const prompt = "このデザインに基づいてReactコンポーネントを生成してください";
const enhancedPrompt = clineIntegration.injectContext(modelContext, prompt);

console.log(enhancedPrompt);
```

## API リファレンス

### Figma API クライアント

#### FigmaClient

Figma APIと通信するための基本クライアント。

```typescript
const client = new FigmaClient({
  accessToken: "your-figma-access-token",
  apiVersion: "v1", // オプション
  baseUrl: "https://api.figma.com" // オプション
});
```

#### FigmaFileAPI

Figmaファイルにアクセスするためのメソッドを提供します。

```typescript
const fileApi = new FigmaFileAPI(client);

// ファイルを取得
const file = await fileApi.getFile("file-key");

// ファイル内の特定ノードを取得
const nodes = await fileApi.getFileNodes("file-key", ["node-id-1", "node-id-2"]);

// 画像を取得
const images = await fileApi.getImage("file-key", ["node-id-1", "node-id-2"]);

// 画像フィルを取得
const imageFills = await fileApi.getImageFills("file-key");
```

#### FigmaComponentsAPI

Figmaコンポーネントとスタイルにアクセスするためのメソッドを提供します。

```typescript
const componentsApi = new FigmaComponentsAPI(client);

// チームコンポーネントを取得
const components = await componentsApi.getTeamComponents("team-id");

// チームコンポーネントセットを取得
const componentSets = await componentsApi.getTeamComponentSets("team-id");

// チームスタイルを取得
const styles = await componentsApi.getTeamStyles("team-id");

// 特定のコンポーネントを取得
const component = await componentsApi.getComponent("component-key");
```

#### FigmaCommentsAPI

Figmaコメントを管理するためのメソッドを提供します。

```typescript
const commentsApi = new FigmaCommentsAPI(client);

// コメントを取得
const comments = await commentsApi.getComments("file-key");

// コメントを投稿
const newComment = await commentsApi.postComment("file-key", {
  message: "コメントメッセージ",
  client_meta: {
    node_id: "node-id",
    node_offset: { x: 0, y: 0 }
  }
});

// コメントに返信
const reply = await commentsApi.postCommentReply("file-key", "comment-id", "返信メッセージ");

// コメントを解決
await commentsApi.resolveComment("file-key", "comment-id");
```

#### FigmaWebhooksAPI

FigmaのWebhookを管理するためのメソッドを提供します。

```typescript
const webhooksApi = new FigmaWebhooksAPI(client);

// Webhookを取得
const webhooks = await webhooksApi.getWebhooks("team-id");

// Webhookを作成
const newWebhook = await webhooksApi.createWebhook("team-id", {
  event_type: "FILE_UPDATE",
  endpoint: "https://example.com/webhook",
  passcode: "passcode",
  description: "説明"
});

// Webhookを更新
const updatedWebhook = await webhooksApi.updateWebhook("webhook-id", {
  description: "更新された説明"
});
```

#### FigmaVariablesAPI

Figma変数を管理するためのメソッドを提供します（Enterprise限定）。

```typescript
const variablesApi = new FigmaVariablesAPI(client);

// 変数を取得
const variables = await variablesApi.getVariables("file-key");

// 変数を公開
await variablesApi.publishVariables("file-key", {
  variableIds: ["variable-id-1", "variable-id-2"]
});

// 変数を作成
const newVariable = await variablesApi.createVariable("file-key", {
  name: "変数名",
  variableCollectionId: "collection-id",
  resolvedType: "COLOR",
  valuesByMode: {
    "mode-id": {
      type: "COLOR",
      value: { r: 1, g: 0, b: 0, a: 1 }
    }
  }
});
```

### Model Context Protocol

#### ModelContextProtocol

Model Context Protocolのコア実装。

```typescript
// 空のコンテキストを作成
const context = ModelContextProtocol.createEmptyContext({
  type: "figma",
  fileKey: "file-key",
  fileName: "ファイル名",
  lastModified: "最終更新日時"
});

// コンテキストを検証
const validation = ModelContextProtocol.validateContext(context);
if (!validation.valid) {
  console.error("検証エラー:", validation.errors);
}

// コンテキストをシリアライズ
const json = ModelContextProtocol.serializeContext(context);

// JSONからコンテキストをパース
const parsedContext = ModelContextProtocol.parseContext(json);

// 要素をIDで検索
const element = ModelContextProtocol.findElementById(context, "element-id");

// 要素を名前で検索
const elements = ModelContextProtocol.findElementsByName(context, "要素名");

// 要素の子要素を取得
const children = ModelContextProtocol.getElementChildren(context, "parent-id");
```

### アダプター

#### FigmaToModelContextAdapter

Figma APIデータをModel Context形式に変換するためのアダプター。

```typescript
const adapter = new FigmaToModelContextAdapter(client);

// Figmaファイルをモデルコンテキストに変換
const modelContext = await adapter.convertFileToModelContext("file-key", {
  includeStyles: true,
  includeVariables: true,
  includeImages: true,
  teamId: "team-id" // コンポーネントライブラリにアクセスする場合
});
```

### AI統合

#### AIModelIntegrationFactory

AIモデル統合を作成するためのファクトリー。

```typescript
// RooCode統合を作成
const rooCodeIntegration = AIModelIntegrationFactory.createIntegration("roocode");

// Cline統合を作成
const clineIntegration = AIModelIntegrationFactory.createIntegration("cline");
```

#### RooCodeIntegration

RooCodeとの統合インターフェース。

```typescript
// コンテキストをフォーマット
const formattedContext = rooCodeIntegration.formatContext(modelContext);

// プロンプトにコンテキストを注入
const enhancedPrompt = rooCodeIntegration.injectContext(modelContext, prompt);
```

#### ClineIntegration

Clineとの統合インターフェース。

```typescript
// コンテキストをフォーマット
const formattedContext = clineIntegration.formatContext(modelContext);

// プロンプトにコンテキストを注入
const enhancedPrompt = clineIntegration.injectContext(modelContext, prompt);
```

## プロジェクト構造

```
figma-model-context-protocol/
├── src/
│   ├── api/
│   │   ├── figma_client.ts         # 基本APIクライアント
│   │   ├── figma_file_api.ts       # ファイルAPI
│   │   ├── figma_components_api.ts # コンポーネントAPI
│   │   ├── figma_comments_api.ts   # コメントAPI
│   │   ├── figma_webhooks_api.ts   # WebhooksAPI
│   │   └── figma_variables_api.ts  # 変数API
│   ├── auth/
│   │   └── figma_auth.ts           # 認証モジュール
│   ├── model/
│   │   └── model_context_protocol.ts # モデルコンテキストプロトコル
│   ├── adapters/
│   │   ├── figma_to_model_context_adapter.ts # Figmaアダプター
│   │   └── ai_model_integration.ts # AIモデル統合
│   └── mod.ts                      # メインモジュール
├── tests/
│   └── figma_api_test.ts           # APIテスト
├── examples/
│   ├── basic_usage.ts              # 基本的な使用例
│   └── ai_integration.ts           # AI統合の例
├── docs/
│   └── model_context_protocol_design.md # プロトコル設計
└── figma.md                        # Figma API仕様
```

## ライセンス

MITライセンス

## 貢献

プルリクエストは歓迎します。大きな変更を行う場合は、まずissueを開いて変更内容を議論してください。

## 作者

あなたの名前
