/**
 * Figma ファイルアクセスAPI
 *
 * Figmaファイル、ノード、画像へのアクセスを提供するメソッド
 */

import { Client } from "./client.ts";
import type {
	FigmaCommentsResponse,
	FigmaComponent,
	FigmaFile,
	FigmaFileImagesResponse,
	FigmaFileNodesResponse,
	FigmaFileParams,
	FigmaImageParams,
	FigmaImageResponse,
	FigmaNode,
	FigmaStyle,
} from "./types.ts";

/**
 * Figmaファイルアクセスクライアント
 */
export class FigmaFileClient extends Client {
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
	): Promise<FigmaFileNodesResponse> {
		const { file_key, ...queryParams } = params;
		return await this.request<FigmaFileNodesResponse>(
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
	async getFileComments(fileKey: string): Promise<FigmaCommentsResponse> {
		return await this.request<FigmaCommentsResponse>(
			`/files/${fileKey}/comments`,
		);
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
	 * Figmaファイル内の画像ファイルを取得
	 * @param fileKey ファイルキー
	 * @returns 画像URLリスト
	 */
	async getFileImages(fileKey: string): Promise<FigmaFileImagesResponse> {
		return await this.request<FigmaFileImagesResponse>(
			`/files/${fileKey}/images`,
		);
	}

	/**
	 * Figmaファイル内のコンポーネントを検索
	 * @param fileKey ファイルキー
	 * @returns コンポーネントリスト
	 */
	async findComponents(
		fileKey: string,
	): Promise<Record<string, FigmaComponent>> {
		const file = await this.getFile({ file_key: fileKey });
		return file.components || {};
	}

	/**
	 * Figmaファイル内のスタイルを検索
	 * @param fileKey ファイルキー
	 * @returns スタイルリスト
	 */
	async findStyles(fileKey: string): Promise<Record<string, FigmaStyle>> {
		const file = await this.getFile({ file_key: fileKey });
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

			return response.nodes?.[nodeId.replace("-", ":")]?.document || null;
		} catch (error) {
			console.error(`Error getting node ${nodeId}:`, error);
			return null;
		}
	}
}
