/**
 * Figma Model Context Protocol サーバーテスト
 * 
 * サーバーへの接続とリクエスト送信をテストするスクリプト
 */

async function testServer() {
  const port = Deno.env.get("PORT") || "3001";
  const host = Deno.env.get("HOST") || "localhost";
  const path = Deno.env.get("MCP_PATH") || "/mcp";
  
  const baseUrl = `http://${host}:${port}`;
  console.log(`サーバーに接続: ${baseUrl}`);
  
  try {
    // 1. ホームページの取得
    console.log("\n1. ホームページの取得:");
    const homeResponse = await fetch(baseUrl);
    if (homeResponse.ok) {
      console.log("  ✓ ホームページの取得に成功");
      console.log(`  ステータス: ${homeResponse.status}`);
      console.log(`  コンテンツタイプ: ${homeResponse.headers.get("Content-Type")}`);
    } else {
      console.error(`  ✗ ホームページの取得に失敗: ${homeResponse.status} ${homeResponse.statusText}`);
    }
    
    // 2. リソース一覧のリクエスト
    console.log("\n2. リソース一覧のリクエスト:");
    const resourceListRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "resource.list",
      params: {}
    };
    
    const resourceListResponse = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(resourceListRequest)
    });
    
    if (resourceListResponse.ok) {
      const resourceList = await resourceListResponse.json();
      console.log("  ✓ リソース一覧の取得に成功");
      console.log(`  リソース数: ${resourceList.result?.resources?.length || 0}`);
      console.log("  リソース:", resourceList.result?.resources);
    } else {
      console.error(`  ✗ リソース一覧の取得に失敗: ${resourceListResponse.status} ${resourceListResponse.statusText}`);
    }
    
    // 3. ツール一覧のリクエスト
    console.log("\n3. ツール一覧のリクエスト:");
    const toolListRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tool.list",
      params: {}
    };
    
    const toolListResponse = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(toolListRequest)
    });
    
    if (toolListResponse.ok) {
      const toolList = await toolListResponse.json();
      console.log("  ✓ ツール一覧の取得に成功");
      console.log(`  ツール数: ${toolList.result?.tools?.length || 0}`);
      console.log("  ツール:", toolList.result?.tools);
    } else {
      console.error(`  ✗ ツール一覧の取得に失敗: ${toolListResponse.status} ${toolListResponse.statusText}`);
    }
    
    // 4. 特定ファイルのリソース取得
    console.log("\n4. 特定ファイルのリソース取得:");
    const fileKey = "test123";
    const resourceRequest = {
      jsonrpc: "2.0",
      id: 3,
      method: "resource.get",
      params: {
        uri: `figma://file/${fileKey}`
      }
    };
    
    const resourceResponse = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(resourceRequest)
    });
    
    if (resourceResponse.ok) {
      const resource = await resourceResponse.json();
      console.log("  ✓ リソースの取得に成功");
      console.log(`  リソースURI: ${resource.result?.contents?.[0]?.uri}`);
      
      // JSONを解析して最初の10行を表示
      try {
        const content = JSON.parse(resource.result?.contents?.[0]?.text || "{}");
        console.log("  コンテンツサンプル（部分）:");
        console.log("  ファイル名:", content.name);
        console.log("  最終更新:", content.lastModified);
      } catch (error) {
        console.error("  JSONの解析に失敗:", error);
      }
    } else {
      console.error(`  ✗ リソースの取得に失敗: ${resourceResponse.status} ${resourceResponse.statusText}`);
      try {
        const errorJson = await resourceResponse.json();
        console.error("  エラー詳細:", errorJson);
      } catch (e) {
        console.error("  レスポンスの解析に失敗");
      }
    }
    
    // 5. ツール呼び出し
    console.log("\n5. ツール呼び出し (figma_getFile):");
    const toolRequest = {
      jsonrpc: "2.0",
      id: 4,
      method: "tool.call",
      params: {
        name: "figma_getFile",
        params: {
          fileKey: "test123"
        }
      }
    };
    
    const toolResponse = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(toolRequest)
    });
    
    if (toolResponse.ok) {
      const tool = await toolResponse.json();
      console.log("  ✓ ツール呼び出しに成功");
      
      // JSONを解析して最初の10行を表示
      try {
        const content = JSON.parse(tool.result?.content?.[0]?.text || "{}");
        console.log("  コンテンツサンプル（部分）:");
        console.log("  ファイル名:", content.name);
        console.log("  最終更新:", content.lastModified);
      } catch (error) {
        console.error("  JSONの解析に失敗:", error);
      }
    } else {
      console.error(`  ✗ ツール呼び出しに失敗: ${toolResponse.status} ${toolResponse.statusText}`);
    }
    
    console.log("\nテスト完了！");
    
  } catch (error) {
    console.error("テスト中にエラーが発生しました:", error);
  }
}

// .envファイルを読み込む
try {
  await Deno.readTextFile(".env").then(envText => {
    const envVars = envText.split("\n")
      .filter(line => line.trim() && !line.startsWith("#"))
      .map(line => {
        const [key, ...value] = line.split("=");
        return [key.trim(), value.join("=").trim()];
      });
    
    for (const [key, value] of envVars) {
      Deno.env.set(key, value);
    }
    
    console.log(".envファイルから環境変数を読み込みました");
  });
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    console.warn(".envファイルの読み込み中にエラーが発生しました:", error);
  }
}

// テスト実行
await testServer();