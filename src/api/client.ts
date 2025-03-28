/**
 * Figma API クライアント
 *
 * Figma APIへのアクセスを提供する基本クライアント
 */

import { FigmaAuthConfig, FigmaResponse } from "./types.ts";

/**
 * Figma APIクライアントのベースクラス
 */
export class Client {
	private accessToken: string;
	private apiBase: string;

	/**
	 * Figma APIクライアントを初期化
	 * @param config 認証設定
	 */
	constructor(config: FigmaAuthConfig) {
		this.accessToken = config.accessToken;
		this.apiBase = config.apiBase || "https://api.figma.com/v1";
	}

	/**
	 * Figma APIにリクエストを送信する
	 * @param endpoint APIエンドポイント
	 * @param method HTTPメソッド
	 * @param params リクエストパラメータ
	 * @returns APIレスポンス
	 */
	protected async request<T extends FigmaResponse>(
		endpoint: string,
		method: string = "GET",
		params?: Record<string, unknown>,
	): Promise<T> {
		const url = new URL(`${this.apiBase}${endpoint}`);

		const headers = new Headers({
			"X-Figma-Token": this.accessToken,
			"Content-Type": "application/json",
		});

		const options: RequestInit = {
			method,
			headers,
		};

		// GETリクエストの場合はURLにクエリパラメータを追加
		if (method === "GET" && params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined) {
					if (Array.isArray(value)) {
						// 配列の場合はカンマ区切りの文字列に変換
						url.searchParams.append(key, value.join(","));
					} else {
						url.searchParams.append(key, String(value));
					}
				}
			});
		} else if (params) {
			// GET以外の場合はリクエストボディにJSONを設定
			options.body = JSON.stringify(params);
		}

		try {
			const response = await fetch(url.toString(), options);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					`Figma API error: ${response.status} ${response.statusText} - ${errorData.message || "Unknown error"}`,
				);
			}

			return (await response.json()) as T;
		} catch (error) {
			console.error("Error calling Figma API:", error);
			throw error;
		}
	}

	/**
	 * APIクライアントが正しく設定されているか確認
	 * @returns 認証が有効な場合はtrue
	 */
	async validateAuth(): Promise<boolean> {
		try {
			// ユーザー情報を取得して認証をテスト
			const response = await this.request("/me");
			return !response.error;
		} catch (error) {
			console.error("Authentication validation failed:", error);
			return false;
		}
	}
}
