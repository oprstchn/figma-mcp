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

}
