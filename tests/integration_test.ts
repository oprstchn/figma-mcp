/**
 * 統合テスト
 * 
 * このファイルはModel Context Protocolの全コンポーネントを統合的にテストします。
 */

import { FigmaClient } from "../src/api/figma_client.ts";
import { FigmaFileAPI } from "../src/api/figma_file_api.ts";
import { FigmaToModelContextAdapter } from "../src/adapters/figma_to_model_context_adapter.ts";
import { AIModelIntegrationFactory } from "../src/adapters/ai_model_integration.ts";
import { ModelContextProtocol } from "../src/model/model_context_protocol.ts";
import { FigmaAuth } from "../src/auth/figma_auth.ts";

// テスト結果を記録するオブジェクト
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

// テスト関数
function test(name: string, fn: () => Promise<void> | void) {
  testResults.total++;
  console.log(`\n🧪 テスト: ${name}`);
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`✅ 成功: ${name}`);
          testResults.passed++;
        })
        .catch((error) => {
          console.error(`❌ 失敗: ${name}`);
          console.error(`   エラー: ${error.message}`);
          testResults.failed++;
        });
    } else {
      console.log(`✅ 成功: ${name}`);
      testResults.passed++;
    }
  } catch (error) {
    console.error(`❌ 失敗: ${name}`);
    console.error(`   エラー: ${error.message}`);
    testResults.failed++;
  }
}

// スキップするテスト関数
function skip(name: string, _fn: () => Promise<void> | void) {
  testResults.total++;
  testResults.skipped++;
  console.log(`\n⏭️ スキップ: ${name}`);
}

// アサーション関数
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * メイン関数
 */
async function runTests() {
  console.log("=== Model Context Protocol 統合テスト ===");
  
  // 環境変数からアクセストークンを取得
  const accessToken = Deno.env.get("FIGMA_ACCESS_TOKEN");
  const fileKey = Deno.env.get("FIGMA_TEST_FILE_KEY");
  
  // アクセストークンがない場合は一部のテストをスキップ
  const testOrSkip = accessToken ? test : skip;
  
  // FigmaClient基本機能のテスト
  test("FigmaClient - 初期化", () => {
    const client = new FigmaClient({ accessToken: "dummy-token" });
    assert(client !== null, "クライアントが正しく初期化されていません");
  });
  
  // FigmaAuth機能のテスト
  test("FigmaAuth - 個人アクセストークンURL取得", () => {
    const url = FigmaAuth.getPersonalAccessTokenUrl();
    assert(url === "https://www.figma.com/settings/user-profile/personal-access-tokens", "個人アクセストークンURLが正しくありません");
  });
  
  test("FigmaAuth - OAuth2認証URL生成", () => {
    const config = {
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      redirectUri: "https://example.com/callback",
      scope: ["files:read"],
    };
    
    const url = FigmaAuth.getOAuth2AuthorizationUrl(config);
    assert(url.includes("https://www.figma.com/oauth"), "OAuth2 URLのベースが正しくありません");
    assert(url.includes("client_id=test-client-id"), "OAuth2 URLにクライアントIDが含まれていません");
    assert(url.includes("redirect_uri=https%3A%2F%2Fexample.com%2Fcallback"), "OAuth2 URLにリダイレクトURIが含まれていません");
  });
  
  // ModelContextProtocol基本機能のテスト
  test("ModelContextProtocol - 空のコンテキスト作成", () => {
    const source = {
      type: "figma" as const,
      fileKey: "test-file-key",
      fileName: "Test File",
      lastModified: new Date().toISOString(),
    };
    
    const context = ModelContextProtocol.createEmptyContext(source);
    assert(context.metadata.source.fileKey === "test-file-key", "ソース情報が正しく設定されていません");
    assert(context.design.structure.hierarchy.length === 0, "階層が空ではありません");
    assert(context.design.elements.length === 0, "要素が空ではありません");
  });
  
  test("ModelContextProtocol - コンテキスト検証", () => {
    const source = {
      type: "figma" as const,
      fileKey: "test-file-key",
      fileName: "Test File",
      lastModified: new Date().toISOString(),
    };
    
    const context = ModelContextProtocol.createEmptyContext(source);
    const validation = ModelContextProtocol.validateContext(context);
    assert(validation.valid, "有効なコンテキストが検証に失敗しました");
    
    // 無効なコンテキストの検証
    const invalidContext = { ...context };
    // @ts-ignore: テスト用に意図的にプロパティを削除
    delete invalidContext.metadata;
    
    const invalidValidation = ModelContextProtocol.validateContext(invalidContext as any);
    assert(!invalidValidation.valid, "無効なコンテキストが検証に通過しました");
    assert(invalidValidation.errors.length > 0, "検証エラーが報告されていません");
  });
  
  test("ModelContextProtocol - シリアライズとパース", () => {
    const source = {
      type: "figma" as const,
      fileKey: "test-file-key",
      fileName: "Test File",
      lastModified: new Date().toISOString(),
    };
    
    const context = ModelContextProtocol.createEmptyContext(source);
    const json = ModelContextProtocol.serializeContext(context);
    const parsedContext = ModelContextProtocol.parseContext(json);
    
    assert(parsedContext.metadata.source.fileKey === "test-file-key", "シリアライズ/パース後のデータが一致しません");
  });
  
  // AIモデル統合のテスト
  test("AIModelIntegration - ファクトリー", () => {
    const rooCodeIntegration = AIModelIntegrationFactory.createIntegration("roocode");
    assert(rooCodeIntegration.getModelName() === "RooCode", "RooCode統合の名前が正しくありません");
    
    const clineIntegration = AIModelIntegrationFactory.createIntegration("cline");
    assert(clineIntegration.getModelName() === "Cline", "Cline統合の名前が正しくありません");
    
    try {
      // @ts-ignore: テスト用に意図的に無効な値を渡す
      AIModelIntegrationFactory.createIntegration("invalid");
      assert(false, "無効なモデルタイプでエラーが発生しませんでした");
    } catch (error) {
      assert(error.message.includes("Unsupported model type"), "適切なエラーメッセージが返されていません");
    }
  });
  
  test("AIModelIntegration - コンテキスト注入", () => {
    const source = {
      type: "figma" as const,
      fileKey: "test-file-key",
      fileName: "Test File",
      lastModified: new Date().toISOString(),
    };
    
    const context = ModelContextProtocol.createEmptyContext(source);
    const prompt = "テストプロンプト";
    
    const rooCodeIntegration = AIModelIntegrationFactory.createIntegration("roocode");
    const rooCodePrompt = rooCodeIntegration.injectContext(context, prompt);
    assert(rooCodePrompt.includes("[DESIGN_CONTEXT]"), "RooCode用のプロンプトに[DESIGN_CONTEXT]タグがありません");
    assert(rooCodePrompt.includes(prompt), "RooCode用のプロンプトに元のプロンプトが含まれていません");
    
    const clineIntegration = AIModelIntegrationFactory.createIntegration("cline");
    const clinePrompt = clineIntegration.injectContext(context, prompt);
    assert(clinePrompt.includes("<design-context>"), "Cline用のプロンプトに<design-context>タグがありません");
    assert(clinePrompt.includes(`User request: ${prompt}`), "Cline用のプロンプトに元のプロンプトが含まれていません");
  });
  
  // Figma API統合テスト（アクセストークンがある場合のみ）
  testOrSkip("FigmaClient - APIリクエスト", async () => {
    if (!accessToken) {
      throw new Error("アクセストークンが設定されていません");
    }
    
    const client = new FigmaClient({ accessToken });
    const response = await client.get("v1/me");
    
    assert(response.id, "ユーザー情報が取得できませんでした");
    assert(response.email, "ユーザーメールが取得できませんでした");
  });
  
  testOrSkip("FigmaFileAPI - ファイル取得", async () => {
    if (!accessToken || !fileKey) {
      throw new Error("アクセストークンまたはファイルキーが設定されていません");
    }
    
    const client = new FigmaClient({ accessToken });
    const fileApi = new FigmaFileAPI(client);
    const file = await fileApi.getFile(fileKey);
    
    assert(file.name, "ファイル名が取得できませんでした");
    assert(file.document, "ドキュメントが取得できませんでした");
    assert(file.document.id, "ドキュメントIDが取得できませんでした");
  });
  
  testOrSkip("FigmaToModelContextAdapter - 変換", async () => {
    if (!accessToken || !fileKey) {
      throw new Error("アクセストークンまたはファイルキーが設定されていません");
    }
    
    const client = new FigmaClient({ accessToken });
    const adapter = new FigmaToModelContextAdapter(client);
    const modelContext = await adapter.convertFileToModelContext(fileKey, {
      includeStyles: true,
    });
    
    assert(modelContext.metadata.source.fileKey === fileKey, "ファイルキーが正しく設定されていません");
    assert(modelContext.design.structure.root, "ルートノードが設定されていません");
    assert(modelContext.design.structure.hierarchy.length > 0, "階層が空です");
    assert(modelContext.design.elements.length > 0, "要素が空です");
    
    // 検証
    const validation = ModelContextProtocol.validateContext(modelContext);
    assert(validation.valid, "変換されたコンテキストが検証に失敗しました");
  });
  
  testOrSkip("エンドツーエンド - Figma to AI Model", async () => {
    if (!accessToken || !fileKey) {
      throw new Error("アクセストークンまたはファイルキーが設定されていません");
    }
    
    // 1. Figma APIクライアントを初期化
    const client = new FigmaClient({ accessToken });
    
    // 2. Figmaファイルを取得してModel Contextに変換
    const adapter = new FigmaToModelContextAdapter(client);
    const modelContext = await adapter.convertFileToModelContext(fileKey, {
      includeStyles: true,
      includeVariables: true,
    });
    
    // 3. RooCode統合を使用してプロンプトを生成
    const rooCodeIntegration = AIModelIntegrationFactory.createIntegration("roocode");
    const prompt = "このデザインに基づいてHTMLとCSSを生成してください";
    const enhancedPrompt = rooCodeIntegration.injectContext(modelContext, prompt);
    
    assert(enhancedPrompt.includes("[DESIGN_CONTEXT]"), "生成されたプロンプトにデザインコンテキストが含まれていません");
    assert(enhancedPrompt.includes(prompt), "生成されたプロンプトに元のプロンプトが含まれていません");
    
    // 4. Cline統合を使用してプロンプトを生成
    const clineIntegration = AIModelIntegrationFactory.createIntegration("cline");
    const clinePrompt = clineIntegration.injectContext(modelContext, prompt);
    
    assert(clinePrompt.includes("<design-context>"), "生成されたプロンプトにデザインコンテキストが含まれていません");
    assert(clinePrompt.includes(`User request: ${prompt}`), "生成されたプロンプトに元のプロンプトが含まれていません");
  });
  
  // テスト結果を表示
  await Promise.resolve().then(() => {
    console.log("\n=== テスト結果 ===");
    console.log(`総テスト数: ${testResults.total}`);
    console.log(`成功: ${testResults.passed}`);
    console.log(`失敗: ${testResults.failed}`);
    console.log(`スキップ: ${testResults.skipped}`);
    
    if (testResults.failed > 0) {
      console.error("\n❌ テストに失敗しました");
      Deno.exit(1);
    } else {
      console.log("\n✅ すべてのテストに成功しました");
    }
  });
}

// テストを実行
if (import.meta.main) {
  runTests();
}
