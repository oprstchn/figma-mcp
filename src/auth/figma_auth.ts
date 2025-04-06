/**
 * Figma 認証モジュール
 *
 * Figma APIの認証機能を提供するモジュール
 */

import type { FigmaAuthConfig } from "../api/types.ts";

/**
 * アクセストークン認証プロバイダー
 */
export class FigmaAccessTokenProvider {
	private accessToken: string;

	/**
	 * アクセストークンプロバイダーを初期化
	 * @param accessToken Figma個人アクセストークン
	 */
	constructor(accessToken: string) {
		this.accessToken = accessToken;
	}

	/**
	 * 認証設定を取得
	 * @returns Figma認証設定
	 */
	getAuthConfig(): FigmaAuthConfig {
		return {
			accessToken: this.accessToken,
		};
	}

	/**
	 * アクセストークンを取得
	 * @returns アクセストークン
	 */
	getAccessToken(): string {
		return this.accessToken;
	}

	/**
	 * アクセストークンを更新
	 * @param newToken 新しいアクセストークン
	 */
	updateAccessToken(newToken: string): void {
		this.accessToken = newToken;
	}
}

/**
 * OAuth2認証プロバイダー
 */
export class FigmaOAuth2Provider {
	private clientId: string;
	private clientSecret: string;
	private redirectUri: string;
	private accessToken: string | null;
	private refreshToken: string | null;
	private expiresAt: number | null;

	/**
	 * OAuth2プロバイダーを初期化
	 * @param clientId OAuth2クライアントID
	 * @param clientSecret OAuth2クライアントシークレット
	 * @param redirectUri リダイレクトURI
	 */
	constructor(clientId: string, clientSecret: string, redirectUri: string) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.redirectUri = redirectUri;
		this.accessToken = null;
		this.refreshToken = null;
		this.expiresAt = null;
	}

	/**
	 * 認証URLを生成
	 * @param state 状態パラメータ
	 * @param scope スコープ（カンマ区切り）
	 * @returns 認証URL
	 */
	getAuthorizationUrl(state: string, scope = "file_read"): string {
		const params = new URLSearchParams({
			client_id: this.clientId,
			redirect_uri: this.redirectUri,
			scope,
			state,
			response_type: "code",
		});

		return `https://www.figma.com/oauth?${params.toString()}`;
	}

	/**
	 * 認証コードからトークンを取得
	 * @param code 認証コード
	 * @returns トークン取得結果
	 */
	async getTokenFromCode(code: string): Promise<boolean> {
		try {
			const response = await fetch("https://www.figma.com/api/oauth/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					client_id: this.clientId,
					client_secret: this.clientSecret,
					redirect_uri: this.redirectUri,
					code,
					grant_type: "authorization_code",
				}),
			});

			if (!response.ok) {
				throw new Error(`Failed to get token: ${response.statusText}`);
			}

			const data = await response.json();
			this.accessToken = data.access_token;
			this.refreshToken = data.refresh_token;
			this.expiresAt = Date.now() + data.expires_in * 1000;

			return true;
		} catch (error) {
			console.error("Error getting token:", error);
			return false;
		}
	}

	/**
	 * リフレッシュトークンを使用してアクセストークンを更新
	 * @returns トークン更新結果
	 */
	async refreshAccessToken(): Promise<boolean> {
		if (!this.refreshToken) {
			throw new Error("No refresh token available");
		}

		try {
			const response = await fetch("https://www.figma.com/api/oauth/refresh", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					client_id: this.clientId,
					client_secret: this.clientSecret,
					refresh_token: this.refreshToken,
					grant_type: "refresh_token",
				}),
			});

			if (!response.ok) {
				throw new Error(`Failed to refresh token: ${response.statusText}`);
			}

			const data = await response.json();
			this.accessToken = data.access_token;
			this.expiresAt = Date.now() + data.expires_in * 1000;

			return true;
		} catch (error) {
			console.error("Error refreshing token:", error);
			return false;
		}
	}

	/**
	 * 認証設定を取得
	 * @returns Figma認証設定
	 */
	getAuthConfig(): FigmaAuthConfig {
		if (!this.accessToken) {
			throw new Error("No access token available");
		}

		return {
			accessToken: this.accessToken,
		};
	}

	/**
	 * アクセストークンを取得（必要に応じて更新）
	 * @returns アクセストークン
	 */
	async getAccessToken(): Promise<string> {
		if (!this.accessToken) {
			throw new Error("No access token available");
		}

		// トークンの有効期限が切れている場合は更新
		if (this.expiresAt && Date.now() > this.expiresAt - 60000) {
			const refreshed = await this.refreshAccessToken();
			if (!refreshed) {
				throw new Error("Failed to refresh access token");
			}
		}

		return this.accessToken;
	}

	/**
	 * トークンが有効かどうかを確認
	 * @returns トークンが有効な場合はtrue
	 */
	isTokenValid(): boolean {
		return (
			!!this.accessToken && !!this.expiresAt && Date.now() < this.expiresAt
		);
	}
}

/**
 * アクセストークン認証プロバイダーを作成
 * @param accessToken Figma個人アクセストークン
 * @returns アクセストークン認証プロバイダー
 */
export function createAccessTokenProvider(
	accessToken: string,
): FigmaAccessTokenProvider {
	return new FigmaAccessTokenProvider(accessToken);
}

/**
 * OAuth2認証プロバイダーを作成
 * @param clientId OAuth2クライアントID
 * @param clientSecret OAuth2クライアントシークレット
 * @param redirectUri リダイレクトURI
 * @returns OAuth2認証プロバイダー
 */
export function createOAuth2Provider(
	clientId: string,
	clientSecret: string,
	redirectUri: string,
): FigmaOAuth2Provider {
	return new FigmaOAuth2Provider(clientId, clientSecret, redirectUri);
}
