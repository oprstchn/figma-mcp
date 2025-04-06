/**
 * Figma コンポーネントアクセスAPI
 *
 * Figmaコンポーネント、コンポーネントセット、スタイルへのアクセスを提供するメソッド
 */

import { Client } from "./client.ts";
import type {
	FigmaComponent,
	FigmaComponentSet,
	FigmaComponentSetsResponse,
	FigmaComponentsResponse,
	FigmaFile,
	FigmaStyle,
	FigmaStylesResponse,
} from "./types.ts";

/**
 * Figmaコンポーネントアクセスクライアント
 */
export class FigmaComponentsClient extends Client {
	/**
	 * チームのコンポーネントを取得
	 * @param teamId チームID
	 * @returns コンポーネントリスト
	 */
	async getTeamComponents(teamId: string): Promise<FigmaComponentsResponse> {
		return await this.request<FigmaComponentsResponse>(
			`/teams/${teamId}/components`,
		);
	}

	/**
	 * チームのコンポーネントセットを取得
	 * @param teamId チームID
	 * @returns コンポーネントセットリスト
	 */
	async getTeamComponentSets(
		teamId: string,
	): Promise<FigmaComponentSetsResponse> {
		return await this.request<FigmaComponentSetsResponse>(
			`/teams/${teamId}/component_sets`,
		);
	}

	/**
	 * チームのスタイルを取得
	 * @param teamId チームID
	 * @returns スタイルリスト
	 */
	async getTeamStyles(teamId: string): Promise<FigmaStylesResponse> {
		return await this.request<FigmaStylesResponse>(`/teams/${teamId}/styles`);
	}

	/**
	 * ファイル内のすべてのコンポーネントを取得
	 * @param fileKey ファイルキー
	 * @returns コンポーネントマップ
	 */
	async getAllFileComponents(
		fileKey: string,
	): Promise<Record<string, FigmaComponent>> {
		const response = await this.request<FigmaFile>(`/files/${fileKey}`);
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
		const response = await this.request<FigmaFile>(`/files/${fileKey}`);
		return response.componentSets || {};
	}

	/**
	 * ファイル内のすべてのスタイルを取得
	 * @param fileKey ファイルキー
	 * @returns スタイルマップ
	 */
	async getAllFileStyles(fileKey: string): Promise<Record<string, FigmaStyle>> {
		const response = await this.request<FigmaFile>(`/files/${fileKey}`);
		return response.styles || {};
	}
}
