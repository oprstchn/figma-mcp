# Figma API 仕様書

## 概要

Figma APIは、Figmaファイル、コンポーネント、コメント、ユーザー情報などにプログラムからアクセスするためのRESTful APIです。このドキュメントでは、APIの主要な機能と使用方法について説明します。

## デベロッパープラットフォーム

Figmaは以下の開発者向けツールを提供しています：

1. **Figma REST API**：
   - 外部アプリケーションからFigmaファイルやデータにアクセス
   - チーム管理、ファイル操作、コメント管理などの自動化

2. **Figma Plugins**：
   - Figma内で動作するカスタム機能を開発
   - デザインファイルの直接操作が可能

3. **Figma Widgets**：
   - インタラクティブな要素をFigmaファイルに追加
   - リアルタイムコラボレーション機能の拡張

4. **Dev Mode**：
   - デザインとコード間のギャップを埋めるための機能
   - デザイン仕様の自動抽出とエクスポート

## 認証

Figma APIでは、以下の2つの認証方法をサポートしています：

1. **個人アクセストークン**：
   - ユーザープロファイルページから生成
   - 単一ユーザーとしてAPIにアクセス
   - 使用方法：リクエストヘッダーに `Authorization: Bearer {token}` を追加

2. **OAuth2**（推奨）：
   - 複数ユーザー向け
   - コールバックを登録してクライアントシークレットを取得
   - 特定ユーザーの代わりに操作する必要がない場合に適している

### OAuth2 アプリケーション設定

OAuth2アプリケーションを作成するには、以下の手順に従います：

1. Figmaアカウントページで「設定」を開く
2. 「開発者向け」>「新しいアプリを作成」をクリック
3. 以下の情報を入力:
   - アプリ名
   - リダイレクトURI
   - 必要なスコープ選択
4. クライアントIDとクライアントシークレットを取得

### スコープ

APIアクセスの最新のスコープは以下のとおりです：

- `files:read`: 基本的なファイル読み取り
- `files:write`: ファイルの作成・更新・削除（Beta）
- `file_variables:read`: 変数の読み取り（Enterprise組織のメンバーのみ）
- `file_variables:write`: 変数の作成・更新（Enterprise組織のメンバーのみ）
- `file_comments:read`: コメントの読み取り
- `file_comments:write`: ファイル内のコメントの投稿と削除
- `file_branches:read`: ブランチの読み取り
- `file_branches:write`: ブランチの作成・更新
- `file_dev_resources:read`: 開発リソースの読み取り
- `file_dev_resources:write`: 開発リソースの作成・更新
- `library_analytics:read`: デザインシステム分析の読み取り
- `webhooks:write`: Webhooksの作成と管理
- `users:read`: ユーザー情報の読み取り
- `orgs:read`: 組織情報の読み取り

注意: `file_read` スコープはOAuth 2トークンでは非推奨です。上記のスコープを使用してください。

## エンドポイント

### ファイル

#### GET /v1/files/:key

ファイルキーで指定されたドキュメントを取得します。

**パラメータ**:
- `key`: ファイルキー（Figma URL から抽出可能）
- `version`（オプション）: 特定のバージョンを取得

**レスポンス**:
```json
{
  "name": "ファイル名",
  "role": "ロール",
  "lastModified": "最終更新日時",
  "editorType": "エディタタイプ",
  "thumbnailUrl": "サムネイルURL",
  "version": "バージョン",
  "document": {
    "id": "ドキュメントID",
    "name": "ドキュメント名",
    "type": "DOCUMENT",
    "children": [...]
  },
  "components": {...},
  "styles": {...},
  "schemaVersion": 0
}
```

#### GET /v1/files/:key/nodes

ファイル内の特定のノードを取得します。

**パラメータ**:
- `key`: ファイルキー
- `ids`: カンマ区切りのノードID
- `version`（オプション）: 特定のバージョン
- `depth`（オプション）: ノードツリーの探索深度

**レスポンス**:
```json
{
  "name": "ファイル名",
  "lastModified": "最終更新日時",
  "thumbnailUrl": "サムネイルURL",
  "nodes": {
    "nodeId1": {
      "document": {...},
      "components": {...},
      "schemaVersion": 0,
      "styles": {...}
    },
    "nodeId2": {...}
  }
}
```

#### GET /v1/images/:key

ファイル内のノードの画像を取得します。

**パラメータ**:
- `key`: ファイルキー
- `ids`: カンマ区切りのノードID
- `scale`（オプション）: 画像スケール（デフォルト: 1）
- `format`（オプション）: 画像フォーマット（'jpg', 'png', 'svg', 'pdf'）
- `svg_include_id`（オプション）: SVGにIDを含めるかどうか
- `svg_simplify_stroke`（オプション）: SVGのストロークを簡略化するかどうか
- `use_absolute_bounds`（オプション）: 絶対境界を使用するかどうか
- `version`（オプション）: 特定のバージョン

**レスポンス**:
```json
{
  "err": "エラーメッセージ（エラー時のみ）",
  "images": {
    "nodeId1": "画像URL1",
    "nodeId2": "画像URL2"
  }
}
```

#### GET /v1/files/:key/images

ファイル内の画像フィルを取得します。

**パラメータ**:
- `key`: ファイルキー

**レスポンス**:
```json
{
  "err": "エラーメッセージ（エラー時のみ）",
  "images": {
    "imageRef1": "画像URL1",
    "imageRef2": "画像URL2"
  },
  "meta": {
    "images": {
      "imageRef1": {
        "url": "画像URL1"
      }
    }
  }
}
```

### コンポーネントとスタイル

#### GET /v1/teams/:team_id/components

チームライブラリの公開コンポーネントを取得します。

**パラメータ**:
- `team_id`: チームID
- `page_size`（オプション）: ページサイズ
- `cursor`（オプション）: ページネーションカーソル

**レスポンス**:
```json
{
  "error": false,
  "status": 200,
  "meta": {
    "components": [
      {
        "key": "コンポーネントキー",
        "file_key": "ファイルキー",
        "node_id": "ノードID",
        "thumbnail_url": "サムネイルURL",
        "name": "コンポーネント名",
        "description": "説明",
        "created_at": "作成日時",
        "updated_at": "更新日時",
        "user": {
          "id": "ユーザーID",
          "handle": "ハンドル",
          "img_url": "画像URL"
        },
        "containing_frame": {
          "name": "フレーム名",
          "node_id": "ノードID",
          "background_color": "背景色",
          "page_id": "ページID",
          "page_name": "ページ名"
        },
        "component_set_id": "コンポーネントセットID",
        "component_property_definitions": {...}
      }
    ],
    "cursor": {
      "before": "前のカーソル",
      "after": "次のカーソル"
    }
  }
}
```

#### GET /v1/teams/:team_id/component_sets

チームライブラリの公開コンポーネントセットを取得します。

**パラメータ**:
- `team_id`: チームID
- `page_size`（オプション）: ページサイズ
- `cursor`（オプション）: ページネーションカーソル

**レスポンス**:
```json
{
  "error": false,
  "status": 200,
  "meta": {
    "component_sets": [
      {
        "key": "コンポーネントセットキー",
        "file_key": "ファイルキー",
        "node_id": "ノードID",
        "thumbnail_url": "サムネイルURL",
        "name": "コンポーネントセット名",
        "description": "説明",
        "created_at": "作成日時",
        "updated_at": "更新日時",
        "user": {
          "id": "ユーザーID",
          "handle": "ハンドル",
          "img_url": "画像URL"
        },
        "containing_frame": {
          "name": "フレーム名",
          "node_id": "ノードID",
          "background_color": "背景色",
          "page_id": "ページID",
          "page_name": "ページ名"
        },
        "component_property_definitions": {...}
      }
    ],
    "cursor": {
      "before": "前のカーソル",
      "after": "次のカーソル"
    }
  }
}
```

#### GET /v1/teams/:team_id/styles

チームライブラリの公開スタイルを取得します。

**パラメータ**:
- `team_id`: チームID
- `page_size`（オプション）: ページサイズ
- `cursor`（オプション）: ページネーションカーソル
- `style_type`（オプション）: スタイルタイプ（'FILL', 'TEXT', 'EFFECT', 'GRID'）

**レスポンス**:
```json
{
  "error": false,
  "status": 200,
  "meta": {
    "styles": [
      {
        "key": "スタイルキー",
        "file_key": "ファイルキー",
        "node_id": "ノードID",
        "style_type": "スタイルタイプ",
        "thumbnail_url": "サムネイルURL",
        "name": "スタイル名",
        "description": "説明",
        "created_at": "作成日時",
        "updated_at": "更新日時",
        "user": {
          "id": "ユーザーID",
          "handle": "ハンドル",
          "img_url": "画像URL"
        },
        "sort_position": "ソート位置"
      }
    ],
    "cursor": {
      "before": "前のカーソル",
      "after": "次のカーソル"
    }
  }
}
```

### コメント

#### GET /v1/files/:file_key/comments

ファイルのコメントを取得します。

**パラメータ**:
- `file_key`: ファイルキー

**レスポンス**:
```json
{
  "comments": [
    {
      "id": "コメントID",
      "client_meta": {
        "node_id": "ノードID",
        "node_offset": {
          "x": 0,
          "y": 0
        }
      },
      "message": "コメントメッセージ",
      "file_key": "ファイルキー",
      "parent_id": "親コメントID",
      "user": {
        "id": "ユーザーID",
        "handle": "ハンドル",
        "img_url": "画像URL"
      },
      "created_at": "作成日時",
      "resolved_at": "解決日時",
      "reactions": [...]
    }
  ]
}
```

#### POST /v1/files/:file_key/comments

ファイルにコメントを投稿します。

**パラメータ**:
- `file_key`: ファイルキー

**リクエストボディ**:
```json
{
  "message": "コメントメッセージ",
  "client_meta": {
    "node_id": "ノードID",
    "node_offset": {
      "x": 0,
      "y": 0
    }
  },
  "comment_id": "コメントID（返信の場合）"
}
```

**レスポンス**:
```json
{
  "id": "コメントID",
  "client_meta": {...},
  "message": "コメントメッセージ",
  "file_key": "ファイルキー",
  "parent_id": "親コメントID",
  "user": {...},
  "created_at": "作成日時"
}
```

### ユーザー

#### GET /v1/me

現在のユーザー情報を取得します。

**レスポンス**:
```json
{
  "id": "ユーザーID",
  "email": "メールアドレス",
  "handle": "ハンドル",
  "img_url": "画像URL"
}
```

### Webhooks

#### GET /v1/teams/:team_id/webhooks

チームのWebhookを取得します。

**パラメータ**:
- `team_id`: チームID

**レスポンス**:
```json
{
  "webhooks": [
    {
      "id": "WebhookID",
      "team_id": "チームID",
      "event_type": "イベントタイプ",
      "client_id": "クライアントID",
      "endpoint": "エンドポイントURL",
      "passcode": "パスコード",
      "status": "ステータス",
      "description": "説明",
      "protocol_version": "プロトコルバージョン"
    }
  ]
}
```

#### POST /v1/teams/:team_id/webhooks

チームにWebhookを作成します。

**パラメータ**:
- `team_id`: チームID

**リクエストボディ**:
```json
{
  "event_type": "イベントタイプ",
  "endpoint": "エンドポイントURL",
  "passcode": "パスコード",
  "description": "説明"
}
```

**レスポンス**:
```json
{
  "id": "WebhookID",
  "team_id": "チームID",
  "event_type": "イベントタイプ",
  "client_id": "クライアントID",
  "endpoint": "エンドポイントURL",
  "passcode": "パスコード",
  "status": "ステータス",
  "description": "説明",
  "protocol_version": "プロトコルバージョン"
}
```

### Webhook イベントタイプ

Webhookで使用可能なイベントタイプは以下の通りです：

- `FILE_UPDATE`: ファイルが更新されたとき
- `FILE_VERSION_UPDATE`: ファイルの新しいバージョンが作成されたとき
- `FILE_DELETE`: ファイルが削除されたとき
- `FILE_COMMENT`: ファイルにコメントが追加されたとき
- `LIBRARY_PUBLISH`: ライブラリが公開されたとき
- `FILE_BRANCH_UPDATE`: ファイルのブランチが更新されたとき
- `FILE_BRANCH_MERGE`: ブランチがマージされたとき
- `LIBRARY_PUBLISH_ERROR`: ライブラリの公開に失敗したとき
- `VARIABLE_PUBLISH`: 変数が公開されたとき
- `DEV_RESOURCE_UPDATED`: 開発リソースが更新されたとき

Webhookイベントのペイロード例:
```json
{
  "event_type": "イベントタイプ",
  "team_id": "チームID",
  "file_key": "ファイルキー",
  "file_name": "ファイル名",
  "timestamp": "タイムスタンプ",
  "passcode": "パスコード",
  "webhook_id": "WebhookID",
  "transaction_id": "トランザクションID",
  "triggered_by": {
    "id": "ユーザーID",
    "handle": "ハンドル"
  },
  "client_id": "クライアントID",
  "contents": {...}
}
```

### 変数

#### GET /v1/files/:file_key/variables

ファイルの変数を取得します（Enterprise限定）。

**パラメータ**:
- `file_key`: ファイルキー

**レスポンス**:
```json
{
  "status": 200,
  "error": false,
  "meta": {
    "variables": {
      "collections": [
        {
          "id": "コレクションID",
          "name": "コレクション名",
          "key": "コレクションキー",
          "modes": [
            {
              "modeId": "モードID",
              "name": "モード名"
            }
          ],
          "defaultModeId": "デフォルトモードID",
          "remote": false,
          "hiddenFromPublishing": false
        }
      ],
      "variables": [
        {
          "id": "変数ID",
          "name": "変数名",
          "key": "変数キー",
          "variableCollectionId": "コレクションID",
          "resolvedType": "解決タイプ",
          "valuesByMode": {
            "modeId": {
              "type": "タイプ",
              "value": "値"
            }
          },
          "remote": false,
          "description": "説明",
          "hiddenFromPublishing": false,
          "scopes": ["スコープ"]
        }
      ]
    }
  }
}
```

#### POST /v1/files/:file_key/variables/publish

ファイルの変数を公開します（Enterprise限定）。

**パラメータ**:
- `file_key`: ファイルキー

**リクエストボディ**:
```json
{
  "variableIds": ["変数ID1", "変数ID2"],
  "variableCollectionIds": ["コレクションID1", "コレクションID2"]
}
```

**レスポンス**:
```json
{
  "status": 200,
  "error": false
}
```

#### PATCH /v1/files/:file_key/variables

ファイルの変数を更新します（Enterprise限定）。

**パラメータ**:
- `file_key`: ファイルキー

**リクエストボディ**:
```json
{
  "variableUpdates": [
    {
      "variableId": "変数ID",
      "action": "UPDATE", // CREATE, UPDATE, DELETE のいずれか
      "name": "変数名",
      "key": "変数キー",
      "variableCollectionId": "コレクションID",
      "resolvedType": "解決タイプ",
      "valuesByMode": {
        "modeId": {
          "type": "タイプ",
          "value": "値"
        }
      },
      "description": "説明",
      "scopes": ["スコープ"]
    }
  ],
  "variableCollectionUpdates": [
    {
      "variableCollectionId": "コレクションID",
      "action": "UPDATE", // CREATE, UPDATE, DELETE のいずれか
      "name": "コレクション名",
      "key": "コレクションキー",
      "modes": [
        {
          "modeId": "モードID",
          "name": "モード名"
        }
      ],
      "defaultModeId": "デフォルトモードID"
    }
  ]
}
```

**レスポンス**:
```json
{
  "status": 200,
  "error": false,
  "meta": {
    "variableUpdates": [
      {
        "id": "変数ID",
        "status": "status_code"
      }
    ],
    "variableCollectionUpdates": [
      {
        "id": "コレクションID",
        "status": "status_code"
      }
    ]
  }
}
```

### Dev Resources API

#### GET /v1/files/:key/dev_resources

ファイル内の開発リソースを取得します。

**パラメータ**:
- `key`: ファイルキー
- `node_id`（オプション）: 特定のノードID
- `depth`（オプション）: 探索深度

**レスポンス**:
```json
{
  "status": 200,
  "error": false,
  "meta": {
    "dev_resources": [
      {
        "key": "リソースキー",
        "file_key": "ファイルキー",
        "node_id": "ノードID",
        "name": "リソース名",
        "resource_type": "リソースタイプ",
        "created_at": "作成日時",
        "updated_at": "更新日時",
        "properties": {...},
        "user": {
          "id": "ユーザーID",
          "handle": "ハンドル",
          "img_url": "画像URL"
        }
      }
    ]
  }
}
```

#### POST /v1/files/:key/dev_resources

ファイルに開発リソースを追加します。

**パラメータ**:
- `key`: ファイルキー

**リクエストボディ**:
```json
{
  "node_id": "ノードID",
  "name": "リソース名",
  "resource_type": "リソースタイプ",
  "properties": {...}
}
```

**レスポンス**:
```json
{
  "status": 200,
  "error": false,
  "meta": {
    "dev_resource": {
      "key": "リソースキー",
      "file_key": "ファイルキー",
      "node_id": "ノードID",
      "name": "リソース名",
      "resource_type": "リソースタイプ",
      "created_at": "作成日時",
      "updated_at": "更新日時",
      "properties": {...},
      "user": {...}
    }
  }
}
```

### Branch API

#### GET /v1/files/:key/branches

ファイルのブランチ一覧を取得します。

**パラメータ**:
- `key`: ファイルキー

**レスポンス**:
```json
{
  "status": 200,
  "error": false,
  "meta": {
    "branches": [
      {
        "key": "ブランチキー",
        "name": "ブランチ名",
        "description": "説明",
        "created_at": "作成日時",
        "updated_at": "更新日時",
        "creator": {
          "id": "ユーザーID",
          "handle": "ハンドル",
          "img_url": "画像URL"
        },
        "status": "ステータス"
      }
    ]
  }
}
```

#### POST /v1/files/:key/branches

ファイルに新しいブランチを作成します。

**パラメータ**:
- `key`: ファイルキー

**リクエストボディ**:
```json
{
  "name": "ブランチ名",
  "description": "説明"
}
```

**レスポンス**:
```json
{
  "status": 200,
  "error": false,
  "meta": {
    "branch": {
      "key": "ブランチキー",
      "name": "ブランチ名",
      "description": "説明",
      "created_at": "作成日時",
      "updated_at": "更新日時",
      "creator": {...},
      "status": "ステータス"
    }
  }
}
```

## ファイル構造

Figmaファイルは以下の構造を持っています：

1. **DOCUMENT**: ファイルのルートノード
2. **CANVAS**: ページを表すノード（DOCUMENTの子）
3. **FRAME/GROUP/その他**: レイヤーやオブジェクトを表すノード（CANVASの子）

各ノードには以下のようなプロパティがあります：

- **グローバルプロパティ**（すべてのノードに存在）:
  - `id`: ノードを一意に識別する文字列
  - `name`: ユーザーが設定した名前
  - `type`: ノードタイプ（DOCUMENT, CANVAS, FRAME, GROUP, TEXT など）
  - `visible`: 表示/非表示状態
  - `locked`: ロック状態

- **ノード固有のプロパティ**:
  - ノードタイプによって異なるプロパティ
  - 例: TEXTノードには`characters`プロパティがある

## エラー処理

APIはHTTPステータスコードを使用してエラーを示します：

| ステータスコード | 説明 | 対応方法 |
|------------|------------|------------|
| 200 | 成功 | - |
| 400 | 不正なリクエスト | リクエストパラメータを確認 |
| 401 | 認証エラー | アクセストークンを確認 |
| 403 | 権限エラー | 適切なスコープと権限を確認 |
| 404 | リソースが見つからない | ファイルキーやIDを確認 |
| 409 | リソースの競合 | 最新の状態を取得して再試行 |
| 413 | ペイロードが大きすぎる | リクエストサイズを削減 |
| 429 | レート制限超過 | X-Rate-Limit-Resetまで待機 |
| 500 | サーバーエラー | 一時的な問題の可能性、後で再試行 |
| 503 | サービス利用不可 | 一時的な問題の可能性、後で再試行 |

エラーレスポンスの例:
```json
{
  "status": 404,
  "error": true,
  "message": "File not found"
}
```

## レート制限

Figma APIはレート制限を適用しており、以下のヘッダーで制限状況を確認できます：

- `X-Rate-Limit-Limit`: 期間内の最大リクエスト数
- `X-Rate-Limit-Remaining`: 残りのリクエスト数
- `X-Rate-Limit-Reset`: 制限がリセットされる時間（Unix時間）

現在のレート制限：
- 個人アクセストークン: 1分あたり120リクエスト
- OAuth2トークン: 1分あたりユーザーごとに120リクエスト
- イメージAPI: 30分あたり2,000リクエスト

バーストトラフィックに対する追加制限も適用される場合があります。

レート制限に達すると、429ステータスコードが返されます。

## OpenAPI仕様

Figma REST APIの完全な仕様は、OpenAPI形式で以下のリポジトリで公開されています：
https://github.com/figma/rest-api-spec

この仕様を使用して、APIドキュメントの生成、クライアントSDKの生成などが可能です。
