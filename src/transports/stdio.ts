/**
 * 標準入出力トランスポート
 * 
 * 標準入出力を使用したMCPトランスポート実装
 */

import { McpTransport } from "../model/model_context_protocol.ts";

/**
 * 標準入出力トランスポート
 */
export class StdioTransport implements McpTransport {
  private messageHandler: ((message: string) => Promise<void>) | null = null;
  private running = false;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private buffer = "";
  
  /**
   * トランスポートに接続
   * @param messageHandler メッセージハンドラー
   */
  async connect(messageHandler: (message: string) => Promise<void>): Promise<void> {
    this.messageHandler = messageHandler;
    this.running = true;
    
    // 標準入力からの読み取りを開始
    this.startReading();
    
    return Promise.resolve();
  }
  
  /**
   * メッセージを送信
   * @param message 送信するメッセージ
   */
  send(message: string): void {
    // 標準出力にメッセージを書き込む
    Deno.stdout.writeSync(this.encoder.encode(message + "\n"));
  }
  
  /**
   * トランスポートを切断
   */
  async disconnect(): Promise<void> {
    this.running = false;
    this.messageHandler = null;
    return Promise.resolve();
  }
  
  /**
   * 標準入力からの読み取りを開始
   */
  private async startReading(): Promise<void> {
    const buf = new Uint8Array(1024);
    
    while (this.running) {
      try {
        const n = await Deno.stdin.read(buf);
        
        if (n === null) {
          // 入力ストリームが閉じられた
          this.running = false;
          break;
        }
        
        const chunk = this.decoder.decode(buf.subarray(0, n));
        await this.processChunk(chunk);
      } catch (error) {
        console.error("Error reading from stdin:", error);
        this.running = false;
        break;
      }
    }
  }
  
  /**
   * 受信したチャンクを処理
   * @param chunk 受信したチャンク
   */
  private async processChunk(chunk: string): Promise<void> {
    this.buffer += chunk;
    
    // 改行で区切られたメッセージを処理
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || ""; // 最後の行は不完全かもしれないので、バッファに戻す
    
    for (const line of lines) {
      if (line.trim() && this.messageHandler) {
        await this.messageHandler(line);
      }
    }
  }
}
