# Figma MCP - 開発ガイド

## 開発環境のセットアップ

### 前提条件

- [Deno](https://deno.land/) 1.41.0以上がインストールされていること

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/oprstchn/figma-mcp.git
cd figma-mcp

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してFIGMA_ACCESS_TOKENを設定
```

## 開発

### プロジェクト構造

```
figma-mcp/
├── src/               # ソースコード
│   ├── api/           # Figma API実装
│   ├── auth/          # 認証モジュール
│   ├── server/        # MCPサーバー実装
│   ├── mod.ts         # メインモジュール
│   ├── resource.ts    # Figmaリソース実装
│   └── tools.ts       # Figmaツール実装
├── docs/              # ドキュメント
├── deno.json          # Denoプロジェクト設定
└── main.ts            # メインエントリーポイント
```

### テストの実行

```bash
# すべてのテストを実行
deno task test

# 特定のテストファイルを実行
deno test --allow-net --allow-env --allow-read --allow-write tests/figma_api_test.ts
```

### サーバーの実行

```bash
# stdio モードでサーバーを起動
deno run --allow-net --allow-env --allow-read --allow-write --allow-run main.ts --mode=stdio

# SSE モードでサーバーを起動 (デフォルトポート: 8888)
deno run --allow-net --allow-env --allow-read --allow-write --allow-run main.ts --mode=sse

# カスタムポートでSSEサーバーを起動
deno run --allow-net --allow-env --allow-read --allow-write --allow-run main.ts --mode=sse --port=3000

# 開発モード（ファイル変更を監視）でサーバーを起動
deno run --watch --allow-net --allow-env --allow-read --allow-write --allow-run main.ts --mode=sse
```

## Figma API アクセス

### アクセストークンの取得

1. Figmaにログイン
2. 設定 > アカウント > 個人アクセストークン
3. 新しいトークンを生成
4. 環境変数に設定:
   ```bash
   # .envファイルを編集
   FIGMA_ACCESS_TOKEN="your-token-here"
   ```

### OAuth2 設定

1. Figmaデベロッパーコンソールでアプリを登録
2. クライアントIDとシークレットを取得
3. リダイレクトURIを設定
4. 認証フローを実装:
   ```typescript
   import { FigmaAuth } from "./src/auth/figma_auth.ts";
   
   const config = {
     clientId: "your-client-id",
     clientSecret: "your-client-secret",
     redirectUri: "your-redirect-uri"
   };
   
   const authUrl = FigmaAuth.getOAuth2AuthorizationUrl(config);
   // ユーザーをauthUrlにリダイレクト
   
   // コールバックで認証コードを受け取り、トークンと交換
   const code = "authorization-code";
   const tokenResponse = await FigmaAuth.exchangeCodeForToken(config, code);
   ```

## Model Context Protocol (MCP)

MCPの詳細については[mcp.md](/mcp.md)およびMCP公式ドキュメントを参照してください。本プロジェクトでは`@modelcontextprotocol/sdk`パッケージを使用しています。

## 貢献ガイドライン

### コーディング規約

- TypeScriptの型を適切に使用すること
- ドキュメンテーションコメントを追加すること
- テストを作成すること
- CLAUDE.mdに記載されたコードスタイルガイドラインに従うこと

### プルリクエスト

1. フォークを作成
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### プルリクエストチェックリスト

- [ ] テストが追加されていること
- [ ] ドキュメントが更新されていること
- [ ] コードスタイルに従っていること
- [ ] すべてのテストが成功していること

## リリースプロセス

1. バージョン番号を更新 (deno.json)
2. タグを作成 (`git tag v1.0.0`)
3. タグをプッシュ (`git push origin v1.0.0`)

## トラブルシューティング

### よくある問題

- **認証エラー**: アクセストークンが正しく設定されているか確認
- **レート制限**: Figma APIのレート制限（1分あたり60リクエスト）に注意
- **大きなファイル**: 大きなFigmaファイルを処理する場合はバッチ処理を使用
