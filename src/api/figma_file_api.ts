/**
 * Figma ファイルアクセスAPI
 *
 * Figmaファイル、ノード、画像へのアクセスを提供するメソッド
 */

import { Client } from "./client.ts";
import {
	FigmaAuthConfig,
	FigmaFile,
	FigmaFileParams,
	FigmaImageParams,
	FigmaImageResponse,
	FigmaNode,
} from "./types.ts";

/**
 * Figmaファイルアクセスクライアント
 */
export class FigmaFileClient extends Client {
	/**
	 * Figmaファイルクライアントを初期化
	 * @param config 認証設定
	 */
	constructor(config: FigmaAuthConfig) {
		super(config);
	}

	/**
	 * Figmaファイルを取得
	 * @param params ファイル取得パラメータ
	 * @returns Figmaファイル
	 */
	async getFile(params: FigmaFileParams): Promise<FigmaFile> {
		const { file_key, ...queryParams } = params;
		return await this.request<FigmaFile>(
			`/files/${file_key}`,
			"GET",
			queryParams,
		);
	}

	/**
	 * Figmaファイルの特定ノードを取得
	 * @param params ファイル取得パラメータ（idsは必須）
	 * @returns 指定されたノードを含むFigmaファイル
	 */
	async getFileNodes(
		params: FigmaFileParams & { ids: string[] },
	): Promise<FigmaFile> {
		const { file_key, ...queryParams } = params;
		return await this.request<FigmaFile>(
			`/files/${file_key}/nodes`,
			"GET",
			queryParams,
		);
	}

	/**
	 * Figmaファイルのコメントを取得
	 * @param fileKey ファイルキー
	 * @returns コメントリスト
	 */
	async getFileComments(fileKey: string): Promise<any> {
		return await this.request<any>(`/files/${fileKey}/comments`);
	}

	/**
	 * Figmaファイルの画像を取得
	 * @param fileKey ファイルキー
	 * @param params 画像取得パラメータ
	 * @returns 画像URL
	 */
	async getImage(
		fileKey: string,
		params: FigmaImageParams,
	): Promise<FigmaImageResponse> {
		return await this.request<FigmaImageResponse>(
			`/images/${fileKey}`,
			"GET",
			params,
		);
	}


	/**
	 * Figmaファイル内のコンポーネントを検索
	 * @param fileKey ファイルキー
	 * @returns コンポーネントリスト
	 */
	async findComponents(fileKey: string): Promise<any> {
		const file = await this.getFile({ key: fileKey });
		return file.components || {};
	}

	/**
	 * Figmaファイル内のスタイルを検索
	 * @param fileKey ファイルキー
	 * @returns スタイルリスト
	 */
	async findStyles(fileKey: string): Promise<any> {
		const file = await this.getFile({ key: fileKey });
		return file.styles || {};
	}

	/**
	 * 指定されたノードIDのノードを取得
	 * @param fileKey ファイルキー
	 * @param nodeId ノードID
	 * @returns ノード
	 */
	async getNode(fileKey: string, nodeId: string): Promise<FigmaNode | null> {
		try {
			const response = await this.getFileNodes({
				file_key: fileKey,
				ids: [nodeId],
			});
			const nodes = response.document?.children || [];
			return nodes.find((node) => node.id === nodeId) || null;
		} catch (error) {
			console.error(`Error getting node ${nodeId}:`, error);
			return null;
		}
	}
}
