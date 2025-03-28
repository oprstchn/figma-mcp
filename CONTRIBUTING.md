# Figma Model Context Protocol - 開発ガイド

## 開発環境のセットアップ

### 前提条件

- [Deno](https://deno.land/) 1.32.0以上がインストールされていること

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/figma-model-context-protocol.git
cd figma-model-context-protocol
```

## 開発

### プロジェクト構造

```
figma-model-context-protocol/
├── src/               # ソースコード
│   ├── api/           # Figma API実装
│   ├── auth/          # 認証モジュール
│   ├── model/         # Model Context Protocol
│   ├── adapters/      # 変換アダプター
│   └── mod.ts         # メインモジュール
├── tests/             # テストコード
├── examples/          # 使用例
├── docs/              # ドキュメント
└── figma.md           # Figma API仕様
```

### テストの実行

```bash
# すべてのテストを実行
deno task test

# 特定のテストファイルを実行
deno test --allow-net --allow-env --allow-read --allow-write tests/integration_test.ts
```

### 使用例の実行

```bash
# 基本的な使用例
deno task example:basic <file_key>

# AI統合の使用例
deno task example:ai <file_key> [roocode|cline]
```

## Figma API アクセス

### アクセストークンの取得

1. Figmaにログイン
2. 設定 > アカウント > 個人アクセストークン
3. 新しいトークンを生成
4. 環境変数に設定:
   ```bash
   export FIGMA_ACCESS_TOKEN="your-token-here"
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

## パフォーマンス最適化

### キャッシュ設定

```typescript
import { configure } from "./src/mod.ts";

// キャッシュ設定をカスタマイズ
configure({
  cache: {
    enabled: true,
    ttl: 10 * 60 * 1000, // 10分
  }
});
```

### 並列処理設定

```typescript
import { configure } from "./src/mod.ts";

// 並列処理設定をカスタマイズ
configure({
  concurrency: {
    maxRequests: 10,
    requestDelay: 50,
  }
});
```

### パフォーマンスモニタリング

```typescript
import { PerformanceMonitor } from "./src/mod.ts";

// タイマーを開始
PerformanceMonitor.startTimer("operation");

// 処理を実行
// ...

// タイマーを終了して経過時間を取得
const elapsed = PerformanceMonitor.endTimer("operation");
console.log(`処理時間: ${elapsed}ms`);

// カウンターをインクリメント
PerformanceMonitor.incrementCounter("api_calls");

// レポートを取得
const report = PerformanceMonitor.getReport();
console.log(report);
```

## 貢献ガイドライン

### コーディング規約

- TypeScriptの型を適切に使用する
- ドキュメンテーションコメントを追加する
- テストを作成する

### プルリクエスト

1. フォークを作成
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## リリースプロセス

1. バージョン番号を更新 (deno.json)
2. CHANGELOG.mdを更新
3. タグを作成 (`git tag v1.0.0`)
4. タグをプッシュ (`git push origin v1.0.0`)

## トラブルシューティング

### よくある問題

- **認証エラー**: アクセストークンが正しく設定されているか確認
- **レート制限**: Figma APIのレート制限（1分あたり60リクエスト）に注意
- **大きなファイル**: 大きなFigmaファイルを処理する場合はバッチ処理を使用

### デバッグ

```typescript
// デバッグログを有効化
const client = new FigmaClient({ 
  accessToken: "your-token",
  debug: true 
});
```
