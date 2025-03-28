/**
 * Figma コンポーネントアクセスAPI
 *
 * Figmaコンポーネント、コンポーネントセット、スタイルへのアクセスを提供するメソッド
 */

import { Client } from "./client.ts";
import { FigmaComponent, FigmaComponentSet, FigmaStyle } from "./types.ts";

/**
 * Figmaコンポーネントアクセスクライアント
 */
export class FigmaComponentsClient extends Client {
	/**
	 * チームのコンポーネントを取得
	 * @param teamId チームID
	 * @returns コンポーネントリスト
	 */
	async getTeamComponents(
		teamId: string,
	): Promise<{ components: FigmaComponent[] }> {
		return await this.request<{ components: FigmaComponent[] }>(
			`/teams/${teamId}/components`,
		);
	}

	/**
	 * コンポーネントの詳細を取得
	 * @param key コンポーネントキー
	 * @returns コンポーネント詳細
	 */
	// このエンドポイントはFigma API仕様書に記載されていません
	// async getComponent(key: string): Promise<{ component: FigmaComponent }> {
	// 	return await this.request<{ component: FigmaComponent }>(
	// 		`/components/${key}`,
	// 	);
	// }

	/**
	 * コンポーネントセットの詳細を取得
	 * @param key コンポーネントセットキー
	 * @returns コンポーネントセット詳細
	 */
	// このエンドポイントはFigma API仕様書に記載されていません
	// async getComponentSet(
	// 	key: string,
	// ): Promise<{ component_set: FigmaComponentSet }> {
	// 	return await this.request<{ component_set: FigmaComponentSet }>(
	// 		`/component_sets/${key}`,
	// 	);
	// }

	/**
	 * チームのスタイルを取得
	 * @param teamId チームID
	 * @returns スタイルリスト
	 */
	async getTeamStyles(teamId: string): Promise<{ styles: FigmaStyle[] }> {
		return await this.request<{ styles: FigmaStyle[] }>(
			`/teams/${teamId}/styles`,
		);
	}

	/**
	 * スタイルの詳細を取得
	 * @param key スタイルキー
	 * @returns スタイル詳細
	 */
	// このエンドポイントはFigma API仕様書に記載されていません
	// async getStyle(key: string): Promise<{ style: FigmaStyle }> {
	// 	return await this.request<{ style: FigmaStyle }>(`/styles/${key}`);
	// }

	/**
	 * ファイル内のすべてのコンポーネントを取得
	 * @param fileKey ファイルキー
	 * @returns コンポーネントマップ
	 */
	async getAllFileComponents(
		fileKey: string,
	): Promise<Record<string, FigmaComponent>> {
		const response = await this.request<any>(`/files/${fileKey}`);
		return response.components || {};
	}

	/**
	 * ファイル内のすべてのコンポーネントセットを取得
	 * @param fileKey ファイルキー
	 * @returns コンポーネントセットマップ
	 */
	async getAllFileComponentSets(
		fileKey: string,
	): Promise<Record<string, FigmaComponentSet>> {
		const response = await this.request<any>(`/files/${fileKey}`);
		return response.componentSets || {};
	}

	/**
	 * ファイル内のすべてのスタイルを取得
	 * @param fileKey ファイルキー
	 * @returns スタイルマップ
	 */
	async getAllFileStyles(fileKey: string): Promise<Record<string, FigmaStyle>> {
		const response = await this.request<any>(`/files/${fileKey}`);
		return response.styles || {};
	}

	/**
	 * コンポーネントの画像を取得
	 * @param key コンポーネントキー
	 * @param params 画像パラメータ
	 * @returns 画像URL
	 */
	// このエンドポイントはFigma API仕様書に記載されていません
	// async getComponentImage(
	// 	key: string,
	// 	params: { format?: "jpg" | "png" | "svg"; scale?: number } = {},
	// ): Promise<string | null> {
	// 	try {
	// 		const response = await this.request<any>(
	// 			`/images/components/${key}`,
	// 			"GET",
	// 			params,
	// 		);
	// 		return response.images?.[key] || null;
	// 	} catch (error) {
	// 		console.error(`Error getting component image for ${key}:`, error);
	// 		return null;
	// 	}
	// }
}
