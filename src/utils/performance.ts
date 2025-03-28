/**
 * パフォーマンス最適化モジュール
 * 
 * Figma Model Context Protocolのパフォーマンスを最適化するためのユーティリティ
 */

/**
 * キャッシュエントリ型
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * キャッシュオプション
 */
interface CacheOptions {
  ttl: number; // キャッシュの有効期間（ミリ秒）
  maxSize?: number; // キャッシュの最大サイズ
}

/**
 * メモリキャッシュ
 */
export class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private options: CacheOptions;
  
  /**
   * メモリキャッシュを初期化
   * @param options キャッシュオプション
   */
  constructor(options: CacheOptions) {
    this.cache = new Map<string, CacheEntry<T>>();
    this.options = {
      ttl: options.ttl || 60000, // デフォルトは1分
      maxSize: options.maxSize || 100 // デフォルトは100エントリ
    };
  }
  
  /**
   * キャッシュからアイテムを取得
   * @param key キー
   * @returns キャッシュされた値（存在しない場合はnull）
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // 有効期限切れの場合は削除して null を返す
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  /**
   * キャッシュにアイテムを設定
   * @param key キー
   * @param value 値
   * @param ttl 有効期間（ミリ秒、省略時はデフォルト値）
   */
  set(key: string, value: T, ttl?: number): void {
    // キャッシュが最大サイズに達している場合は、最も古いエントリを削除
    if (this.options.maxSize && this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      let oldestKey: string | null = null;
      let oldestTimestamp = Infinity;
      
      for (const [entryKey, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestKey = entryKey;
          oldestTimestamp = entry.timestamp;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    const actualTtl = ttl || this.options.ttl;
    const now = Date.now();
    
    this.cache.set(key, {
      value,
      timestamp: now,
      expiresAt: now + actualTtl
    });
  }
  
  /**
   * キャッシュからアイテムを削除
   * @param key キー
   * @returns 削除に成功した場合はtrue
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * キャッシュのサイズを取得
   * @returns キャッシュのサイズ
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * 有効期限切れのエントリを削除
   * @returns 削除されたエントリの数
   */
  prune(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
}

/**
 * バッチ処理ユーティリティ
 */
export class BatchProcessor<T, R> {
  private batchSize: number;
  private processFn: (items: T[]) => Promise<R[]>;
  private queue: T[] = [];
  private processing = false;
  private callbacks: Array<(result: R) => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];
  
  /**
   * バッチプロセッサを初期化
   * @param batchSize バッチサイズ
   * @param processFn バッチ処理関数
   */
  constructor(batchSize: number, processFn: (items: T[]) => Promise<R[]>) {
    this.batchSize = batchSize;
    this.processFn = processFn;
  }
  
  /**
   * アイテムを追加
   * @param item 追加するアイテム
   * @returns 処理結果のPromise
   */
  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push(item);
      this.callbacks.push(resolve);
      this.errorCallbacks.push(reject);
      
      this.processQueue();
    });
  }
  
  /**
   * キューを処理
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    try {
      // バッチサイズに達しているか、タイマーが発火した場合に処理
      if (this.queue.length >= this.batchSize) {
        const batch = this.queue.splice(0, this.batchSize);
        const batchCallbacks = this.callbacks.splice(0, this.batchSize);
        const batchErrorCallbacks = this.errorCallbacks.splice(0, this.batchSize);
        
        try {
          const results = await this.processFn(batch);
          
          // 各コールバックに結果を渡す
          for (let i = 0; i < results.length; i++) {
            batchCallbacks[i](results[i]);
          }
        } catch (error) {
          // エラーが発生した場合は、すべてのコールバックにエラーを渡す
          for (const errorCallback of batchErrorCallbacks) {
            errorCallback(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    } finally {
      this.processing = false;
      
      // キューにまだアイテムがある場合は、再度処理
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }
  
  /**
   * 残りのアイテムを強制的に処理
   * @returns 処理結果のPromise
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }
    
    const batch = [...this.queue];
    const batchCallbacks = [...this.callbacks];
    const batchErrorCallbacks = [...this.errorCallbacks];
    
    this.queue = [];
    this.callbacks = [];
    this.errorCallbacks = [];
    
    try {
      const results = await this.processFn(batch);
      
      // 各コールバックに結果を渡す
      for (let i = 0; i < results.length; i++) {
        batchCallbacks[i](results[i]);
      }
    } catch (error) {
      // エラーが発生した場合は、すべてのコールバックにエラーを渡す
      for (const errorCallback of batchErrorCallbacks) {
        errorCallback(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}

/**
 * 並列処理ユーティリティ
 */
export class ParallelProcessor<T, R> {
  private concurrency: number;
  private processFn: (item: T) => Promise<R>;
  private queue: T[] = [];
  private activeCount = 0;
  private callbacks: Array<(result: R) => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];
  
  /**
   * 並列プロセッサを初期化
   * @param concurrency 並列数
   * @param processFn 処理関数
   */
  constructor(concurrency: number, processFn: (item: T) => Promise<R>) {
    this.concurrency = concurrency;
    this.processFn = processFn;
  }
  
  /**
   * アイテムを追加
   * @param item 追加するアイテム
   * @returns 処理結果のPromise
   */
  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push(item);
      this.callbacks.push(resolve);
      this.errorCallbacks.push(reject);
      
      this.processQueue();
    });
  }
  
  /**
   * キューを処理
   */
  private async processQueue(): Promise<void> {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }
    
    const item = this.queue.shift()!;
    const callback = this.callbacks.shift()!;
    const errorCallback = this.errorCallbacks.shift()!;
    
    this.activeCount++;
    
    try {
      const result = await this.processFn(item);
      callback(result);
    } catch (error) {
      errorCallback(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }
  
  /**
   * すべてのアイテムが処理されるまで待機
   * @returns 完了Promise
   */
  async waitForAll(): Promise<void> {
    if (this.queue.length === 0 && this.activeCount === 0) {
      return;
    }
    
    return new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.queue.length === 0 && this.activeCount === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
}

/**
 * レート制限ユーティリティ
 */
export class RateLimiter {
  private maxRequests: number;
  private interval: number;
  private requestTimes: number[] = [];
  
  /**
   * レート制限を初期化
   * @param maxRequests 最大リクエスト数
   * @param interval 間隔（ミリ秒）
   */
  constructor(maxRequests: number, interval: number) {
    this.maxRequests = maxRequests;
    this.interval = interval;
  }
  
  /**
   * リクエストを実行
   * @param fn 実行する関数
   * @returns 関数の実行結果
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    
    try {
      return await fn();
    } finally {
      this.recordRequest();
    }
  }
  
  /**
   * スロットが利用可能になるまで待機
   */
  private async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // 期限切れのリクエスト時間を削除
    this.requestTimes = this.requestTimes.filter(time => now - time < this.interval);
    
    if (this.requestTimes.length < this.maxRequests) {
      return;
    }
    
    // 最も古いリクエストが期限切れになるまで待機
    const oldestTime = this.requestTimes[0];
    const waitTime = this.interval - (now - oldestTime);
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // 再帰的に呼び出して、スロットが利用可能かどうかを再確認
    return this.waitForSlot();
  }
  
  /**
   * リクエストを記録
   */
  private recordRequest(): void {
    this.requestTimes.push(Date.now());
  }
}

/**
 * 最適化されたFigma APIクライアント用のオプション
 */
export interface OptimizedClientOptions {
  cacheEnabled?: boolean;
  cacheTtl?: number;
  cacheMaxSize?: number;
  batchSize?: number;
  concurrency?: number;
  rateLimit?: {
    maxRequests: number;
    interval: number;
  };
}

/**
 * デフォルトの最適化オプション
 */
export const DEFAULT_OPTIMIZATION_OPTIONS: OptimizedClientOptions = {
  cacheEnabled: true,
  cacheTtl: 300000, // 5分
  cacheMaxSize: 1000,
  batchSize: 10,
  concurrency: 5,
  rateLimit: {
    maxRequests: 30,
    interval: 60000 // 1分
  }
};
