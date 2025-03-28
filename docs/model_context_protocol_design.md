# Model Context Protocol 設計

## 概要

Model Context Protocolは、デザインツール（Figma）とAIモデル（RooCode、Cline）の間でコンテキスト情報を共有するための標準化されたプロトコルです。このプロトコルにより、AIモデルはデザイン情報を理解し、より適切な応答や提案を行うことができます。

## 目的

1. Figmaのデザイン情報をAIモデルが理解できる形式に変換する
2. デザインコンテキストをAIモデルに提供し、より適切な応答を可能にする
3. 異なるAIモデル（RooCode、Cline）で共通のインターフェースを提供する
4. 将来的に他のデザインツールやAIモデルにも拡張可能な柔軟な設計にする

## プロトコル構造

Model Context Protocolは以下の主要コンポーネントで構成されます：

1. **コンテキストコンテナ**: すべてのデザインコンテキスト情報を格納する最上位コンテナ
2. **メタデータ**: プロトコルバージョン、ソース情報などの基本情報
3. **デザイン要素**: デザインの構造と要素（レイアウト、コンポーネント、スタイルなど）
4. **セマンティック情報**: デザイン要素の意味や関係性
5. **インタラクション情報**: ユーザーインタラクションやフロー
6. **アセット参照**: 画像、アイコン、フォントなどの参照情報

## データモデル

### コンテキストコンテナ

```typescript
interface ModelContext {
  metadata: ContextMetadata;
  design: DesignContext;
  semantics?: SemanticContext;
  interactions?: InteractionContext;
  assets?: AssetReferences;
  extensions?: Record<string, unknown>;
}
```

### メタデータ

```typescript
interface ContextMetadata {
  version: string;
  source: {
    type: "figma";
    fileKey: string;
    fileName: string;
    lastModified: string;
    url?: string;
  };
  timestamp: string;
  generator: string;
}
```

### デザインコンテキスト

```typescript
interface DesignContext {
  structure: DesignStructure;
  elements: DesignElement[];
  styles: DesignStyles;
  variables?: DesignVariables;
}

interface DesignStructure {
  root: string; // ルート要素のID
  hierarchy: HierarchyNode[];
}

interface HierarchyNode {
  id: string;
  name: string;
  type: ElementType;
  children?: string[]; // 子要素のID配列
  parent?: string; // 親要素のID
}

type ElementType = 
  | "DOCUMENT"
  | "CANVAS"
  | "FRAME"
  | "GROUP"
  | "COMPONENT"
  | "INSTANCE"
  | "TEXT"
  | "VECTOR"
  | "RECTANGLE"
  | "ELLIPSE"
  | "POLYGON"
  | "LINE"
  | "BOOLEAN_OPERATION"
  | "STAR"
  | "SLICE";

interface DesignElement {
  id: string;
  name: string;
  type: ElementType;
  visible: boolean;
  locked: boolean;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };
  style?: {
    fills?: Fill[];
    strokes?: Stroke[];
    effects?: Effect[];
    opacity?: number;
    blendMode?: BlendMode;
  };
  text?: {
    characters: string;
    style: TextStyle;
  };
  componentProperties?: Record<string, ComponentProperty>;
  constraints?: Constraints;
  layoutProperties?: LayoutProperties;
  [key: string]: unknown; // 拡張プロパティ
}

interface DesignStyles {
  colors: ColorStyle[];
  text: TextStyle[];
  effects: EffectStyle[];
  grids: GridStyle[];
}

interface DesignVariables {
  collections: VariableCollection[];
  variables: Variable[];
}
```

### セマンティックコンテキスト

```typescript
interface SemanticContext {
  elements: SemanticElement[];
  relationships: SemanticRelationship[];
  annotations: SemanticAnnotation[];
}

interface SemanticElement {
  elementId: string;
  role: string; // "header", "button", "navigation", "content", etc.
  importance: "primary" | "secondary" | "tertiary";
  state?: string[]; // "hover", "pressed", "disabled", etc.
  accessibility?: AccessibilityInfo;
}

interface SemanticRelationship {
  type: "contains" | "connects" | "references" | "depends-on";
  sourceId: string;
  targetId: string;
  description?: string;
}

interface SemanticAnnotation {
  elementId: string;
  text: string;
  author?: string;
  timestamp?: string;
}
```

### インタラクションコンテキスト

```typescript
interface InteractionContext {
  flows: UserFlow[];
  interactions: ElementInteraction[];
  transitions: Transition[];
}

interface UserFlow {
  id: string;
  name: string;
  description?: string;
  steps: FlowStep[];
}

interface FlowStep {
  id: string;
  name: string;
  elementId: string;
  nextSteps?: string[]; // 次のステップのID配列
  conditions?: string[];
}

interface ElementInteraction {
  elementId: string;
  type: "click" | "hover" | "drag" | "input" | "scroll";
  response: {
    type: "navigate" | "toggle" | "expand" | "submit" | "custom";
    target?: string; // ターゲット要素のID
    action?: string;
  };
}

interface Transition {
  sourceId: string;
  targetId: string;
  trigger: string;
  animation?: {
    type: string;
    duration: number;
    easing: string;
  };
}
```

### アセット参照

```typescript
interface AssetReferences {
  images: ImageAsset[];
  icons: IconAsset[];
  fonts: FontAsset[];
}

interface ImageAsset {
  id: string;
  name: string;
  url: string;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  elementIds: string[]; // この画像を使用する要素のID配列
}

interface IconAsset {
  id: string;
  name: string;
  url: string;
  format: string;
  elementIds: string[]; // このアイコンを使用する要素のID配列
}

interface FontAsset {
  family: string;
  style: string;
  url?: string;
  elementIds: string[]; // このフォントを使用する要素のID配列
}
```

## 変換プロセス

Figma APIからModel Context Protocolへの変換プロセスは以下のステップで行われます：

1. Figma APIを使用してファイル情報を取得
2. ファイル構造を解析し、階層構造を構築
3. デザイン要素の詳細情報を抽出
4. スタイルと変数情報を収集
5. セマンティック情報を推論または抽出
6. インタラクション情報を解析
7. アセット参照を収集
8. すべての情報をModel Context形式に変換

## 拡張性

Model Context Protocolは拡張性を考慮して設計されています：

1. **バージョニング**: メタデータにバージョン情報を含め、将来的な変更に対応
2. **拡張フィールド**: 各オブジェクトに拡張プロパティを許可
3. **プラグインシステム**: 変換プロセスにプラグインを追加できる仕組み
4. **カスタムセマンティクス**: 特定のドメインに特化したセマンティック情報を追加可能

## AIモデル統合

RooCodeやClineなどのAIモデルとの統合は以下の方法で行います：

1. **コンテキスト注入**: AIモデルのプロンプトにModel Contextを追加
2. **参照解決**: AIモデルがデザイン要素を参照できるようにする
3. **双方向通信**: AIモデルからの変更をFigmaに反映する仕組み
4. **コンテキスト更新**: デザイン変更時にModel Contextを更新する仕組み

## セキュリティと認証

1. **アクセス制御**: Figma APIの認証情報を安全に管理
2. **データ最小化**: 必要な情報のみを含める
3. **プライバシー保護**: 個人情報や機密情報を除外
4. **暗号化**: 必要に応じてデータを暗号化

## 実装計画

1. コアプロトコル定義の実装
2. Figma APIからの変換アダプターの実装
3. RooCodeとClineの統合インターフェースの実装
4. テストとバリデーション
5. ドキュメントと使用例の作成
