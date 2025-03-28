/**
 * Model Context Protocol
 * 
 * メインモジュールファイル - すべてのコンポーネントをエクスポートします
 */

// API クライアント
export * from "./api/figma_client.ts";
export * from "./api/figma_file_api.ts";
export * from "./api/figma_components_api.ts";
export * from "./api/figma_comments_api.ts";
export * from "./api/figma_webhooks_api.ts";
export * from "./api/figma_variables_api.ts";

// 認証
export * from "./auth/figma_auth.ts";

// モデルコンテキストプロトコル
export * from "./model/model_context_protocol.ts";

// アダプター
export * from "./adapters/figma_to_model_context_adapter.ts";
export * from "./adapters/ai_model_integration.ts";

/**
 * バージョン情報
 */
export const VERSION = "1.0.0";

/**
 * パフォーマンス設定
 */
export const CONFIG = {
  /**
   * キャッシュ設定
   */
  cache: {
    /**
     * キャッシュを有効にするかどうか
     */
    enabled: true,
    
    /**
     * キャッシュの有効期限（ミリ秒）
     */
    ttl: 5 * 60 * 1000, // 5分
  },
  
  /**
   * 並列処理設定
   */
  concurrency: {
    /**
     * 並列リクエストの最大数
     */
    maxRequests: 5,
    
    /**
     * リクエスト間の遅延（ミリ秒）
     */
    requestDelay: 100,
  },
  
  /**
   * バッチ処理設定
   */
  batch: {
    /**
     * バッチサイズ
     */
    size: 20,
  },
};

/**
 * パフォーマンス設定を更新
 * @param options 更新するオプション
 */
export function configure(options: Partial<typeof CONFIG>): typeof CONFIG {
  if (options.cache) {
    CONFIG.cache = { ...CONFIG.cache, ...options.cache };
  }
  
  if (options.concurrency) {
    CONFIG.concurrency = { ...CONFIG.concurrency, ...options.concurrency };
  }
  
  if (options.batch) {
    CONFIG.batch = { ...CONFIG.batch, ...options.batch };
  }
  
  return CONFIG;
}

/**
 * メモリキャッシュの実装
 */
class MemoryCache {
  private cache = new Map<string, { value: unknown; expires: number }>();
  
  /**
   * キャッシュからデータを取得
   * @param key キャッシュキー
   * @returns キャッシュされた値またはundefined
   */
  get<T>(key: string): T | undefined {
    if (!CONFIG.cache.enabled) return undefined;
    
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }
  
  /**
   * データをキャッシュに保存
   * @param key キャッシュキー
   * @param value 保存する値
   * @param ttl 有効期限（ミリ秒）
   */
  set(key: string, value: unknown, ttl = CONFIG.cache.ttl): void {
    if (!CONFIG.cache.enabled) return;
    
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }
  
  /**
   * キャッシュからデータを削除
   * @param key キャッシュキー
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * グローバルキャッシュインスタンス
 */
export const cache = new MemoryCache();

/**
 * バッチ処理ユーティリティ
 * @param items 処理するアイテムの配列
 * @param fn 各アイテムに適用する関数
 * @param batchSize バッチサイズ
 * @returns 処理結果の配列
 */
export async function processBatch<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize = CONFIG.batch.size
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * 並列処理ユーティリティ
 * @param items 処理するアイテムの配列
 * @param fn 各アイテムに適用する関数
 * @param concurrency 並列度
 * @returns 処理結果の配列
 */
export async function processParallel<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = CONFIG.concurrency.maxRequests
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;
  
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      
      // リクエスト間の遅延
      if (index > 0 && CONFIG.concurrency.requestDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.concurrency.requestDelay));
      }
      
      results[index] = await fn(item);
    }
  });
  
  await Promise.all(workers);
  return results;
}

/**
 * パフォーマンスモニタリングユーティリティ
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();
  private static counters = new Map<string, number>();
  
  /**
   * タイマーを開始
   * @param label タイマーラベル
   */
  static startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }
  
  /**
   * タイマーを終了し、経過時間を返す
   * @param label タイマーラベル
   * @returns 経過時間（ミリ秒）
   */
  static endTimer(label: string): number {
    const start = this.timers.get(label);
    if (start === undefined) {
      throw new Error(`Timer "${label}" not started`);
    }
    
    const elapsed = performance.now() - start;
    this.timers.delete(label);
    return elapsed;
  }
  
  /**
   * カウンターをインクリメント
   * @param label カウンターラベル
   * @param increment インクリメント量
   */
  static incrementCounter(label: string, increment = 1): void {
    const current = this.counters.get(label) || 0;
    this.counters.set(label, current + increment);
  }
  
  /**
   * カウンター値を取得
   * @param label カウンターラベル
   * @returns カウンター値
   */
  static getCounter(label: string): number {
    return this.counters.get(label) || 0;
  }
  
  /**
   * すべてのカウンターをリセット
   */
  static resetCounters(): void {
    this.counters.clear();
  }
  
  /**
   * すべてのタイマーをリセット
   */
  static resetTimers(): void {
    this.timers.clear();
  }
  
  /**
   * すべてのモニタリングデータをリセット
   */
  static reset(): void {
    this.resetCounters();
    this.resetTimers();
  }
  
  /**
   * パフォーマンスレポートを取得
   * @returns パフォーマンスレポート
   */
  static getReport(): { timers: Record<string, number>; counters: Record<string, number> } {
    const timerReport: Record<string, number> = {};
    const counterReport: Record<string, number> = {};
    
    for (const [label, start] of this.timers.entries()) {
      timerReport[label] = performance.now() - start;
    }
    
    for (const [label, count] of this.counters.entries()) {
      counterReport[label] = count;
    }
    
    return {
      timers: timerReport,
      counters: counterReport,
    };
  }
}
