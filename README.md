# Figma Model Context Protocol (MCP)

Figma Model Context Protocolは、FigmaのデザインデータをAIモデルが理解できる形式に変換するためのプロトコルです。このプロジェクトはDenoを使用して実装されています。

## 概要

このプロジェクトは以下の主要コンポーネントで構成されています：

1. **Figma API クライアント**: Figma APIと通信するためのクライアントライブラリ
2. **Model Context Protocol**: デザインコンテキストを表現するための標準化されたデータモデル

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/oprstchn/figma-mcp.git
cd figma-mcp

# 依存関係をインストール
deno cache --reload src/mod.ts
```

## 使用方法

### サーバーの起動

リポジトリのルートにある`server.ts`を使用して、Figma MCPサーバーを起動できます。

```bash
# 環境変数を設定
export FIGMA_ACCESS_TOKEN=your-figma-access-token

# サーバーを起動
deno task start

# または開発モード（ファイル変更を監視）で起動
deno task dev
```

サーバーは`http://localhost:3000/mcp`でアクセス可能になります。ポート番号は環境変数`PORT`で変更できます。

```bash
# カスタムポートでサーバーを起動
export PORT=8080
deno task start
```

### Dockerを使用した実行

このプロジェクトはDockerコンテナとしても実行できます。

```bash
# イメージをビルド
docker build -t figma-mcp .

# コンテナを実行（SSEモード）
docker run --rm -p 8888:8888 --env-file .env figma-mcp

# 異なるポートを指定して実行
docker run --rm -p 3000:8888 --env-file .env figma-mcp

# カスタムコマンドを実行（例：STDIOモード）
docker run --rm --env-file .env figma-mcp deno run --allow-net --allow-read --allow-env --allow-run main.ts --mode=stdio
```

### 基本的な使用例

```typescript
import { FigmaClient } from "./src/api/figma_client.ts";

// Figma APIクライアントを初期化
const client = new FigmaClient({
  accessToken: "your-figma-access-token"
});

// ファイルを取得
const fileKey = "figma-file-key";
const file = await client.getFile(fileKey);

console.log(file);
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

## 利用可能なスクリプト

`deno.json`に定義されたスクリプトを使用して、さまざまな操作を実行できます：

```bash
# テストを実行
deno task test

# サーバーを起動
deno task start

# 開発モード（ファイル変更を監視）でサーバーを起動
deno task dev
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
const fileApi = client.file;

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
const componentsApi = client.components;

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
const commentsApi = client.comments;

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
const webhooksApi = client.webhooks;

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
const variablesApi = client.variables;

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

## Model Context Protocol (MCP)

詳しくは、[mcp.md](/mcp.md)および[model_context_protocol_design.md](/docs/model_context_protocol_design.md)を参照してください。

## プロジェクト構造

```
figma-mcp/
├── src/
│   ├── api/
│   │   ├── client.ts               # 基本APIクライアントインターフェース
│   │   ├── figma_client.ts         # Figma APIクライアント
│   │   ├── figma_file_api.ts       # ファイルAPI
│   │   ├── figma_components_api.ts # コンポーネントAPI
│   │   ├── figma_comments_api.ts   # コメントAPI
│   │   ├── figma_webhooks_api.ts   # WebhooksAPI
│   │   ├── figma_variables_api.ts  # 変数API
│   │   └── types.ts                # 共通型定義
│   ├── auth/
│   │   └── figma_auth.ts           # 認証モジュール
│   └── mod.ts                      # メインモジュール
├── docs/
│   └── model_context_protocol_design.md # MCPデザインドキュメント
├── main.ts                         # MCPサーバーエントリーポイント
├── Dockerfile                      # Dockerコンテナ定義
├── .dockerignore                   # Dockerビルド時の除外ファイル
├── deno.json                       # Denoプロジェクト設定
├── mcp.md                          # MCP仕様まとめ
└── figma.md                        # Figma API仕様
```

## ライセンス

MITライセンス

## 貢献

貢献ガイドラインについては[CONTRIBUTING.md](/CONTRIBUTING.md)を参照してください。
