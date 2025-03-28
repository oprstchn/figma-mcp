/**
 * Figma コメントアクセスAPI
 *
 * Figmaファイルのコメント操作を提供するメソッド
 */

import { load } from "https://deno.land/std@0.203.0/dotenv/mod.ts";

import { Client } from "./client.ts";
import {
	FigmaComment,
	FigmaCommentsParams,
	FigmaCommentsResponse,
	FigmaCreateCommentParams,
} from "./types.ts";

await load({ export: true });

/**
 * Figmaコメントアクセスクライアント
 */
export class FigmaCommentsClient extends Client {
	/**
	 * ファイルのコメントを取得
	 * @param params コメント取得パラメータ
	 * @returns コメントリスト
	 */
	async getComments(
		params: FigmaCommentsParams,
	): Promise<FigmaCommentsResponse> {
		const { file_key } = params;
		return await this.request<FigmaCommentsResponse>(
			`/files/${file_key}/comments`,
		);
	}

	/**
	 * 特定のコメントを取得
	 * @param params コメント取得パラメータ（comment_idは必須）
	 * @returns コメント
	 */
	async getComment(
		params: FigmaCommentsParams & { comment_id: string },
	): Promise<{ comment: FigmaComment }> {
		const { file_key, comment_id } = params;
		return await this.request<{ comment: FigmaComment }>(
			`/files/${file_key}/comments/${comment_id}`,
		);
	}

	/**
	 * コメントを投稿
	 * @param params コメント作成パラメータ
	 * @returns 作成されたコメント
	 */
	async postComment(
		params: FigmaCreateCommentParams,
	): Promise<{ comment: FigmaComment }> {
		const { file_key, ...commentData } = params;
		return await this.request<{ comment: FigmaComment }>(
			`/files/${file_key}/comments`,
			"POST",
			commentData,
		);
	}

	/**
	 * コメントに返信
	 * @param params コメント作成パラメータ（comment_idは必須）
	 * @returns 作成された返信コメント
	 */
	async replyToComment(
		params: FigmaCreateCommentParams & { comment_id: string },
	): Promise<{ comment: FigmaComment }> {
		return await this.postComment(params);
	}

	/**
	 * コメントを削除
	 * @param fileKey ファイルキー
	 * @param commentId コメントID
	 * @returns 削除結果
	 */
	async deleteComment(
		fileKey: string,
		commentId: string,
	): Promise<{ success: boolean }> {
		return await this.request<{ success: boolean }>(
			`/files/${fileKey}/comments/${commentId}`,
			"DELETE",
		);
	}

	/**
	 * コメントを解決済みとしてマーク
	 * @param fileKey ファイルキー
	 * @param commentId コメントID
	 * @returns 更新されたコメント
	 */
	async resolveComment(
		fileKey: string,
		commentId: string,
	): Promise<{ comment: FigmaComment }> {
		return await this.request<{ comment: FigmaComment }>(
			`/files/${fileKey}/comments/${commentId}`,
			"PATCH",
			{ resolved: true },
		);
	}

	/**
	 * コメントを未解決としてマーク
	 * @param fileKey ファイルキー
	 * @param commentId コメントID
	 * @returns 更新されたコメント
	 */
	async unresolveComment(
		fileKey: string,
		commentId: string,
	): Promise<{ comment: FigmaComment }> {
		return await this.request<{ comment: FigmaComment }>(
			`/files/${fileKey}/comments/${commentId}`,
			"PATCH",
			{ resolved: false },
		);
	}

	/**
	 * ファイルの解決済みコメントを取得
	 * @param fileKey ファイルキー
	 * @returns 解決済みコメントリスト
	 */
	async getResolvedComments(fileKey: string): Promise<FigmaComment[]> {
		const response = await this.getComments({ file_key: fileKey });
		return response.comments.filter(
			(comment) => comment.resolved_at !== undefined,
		);
	}

	/**
	 * ファイルの未解決コメントを取得
	 * @param fileKey ファイルキー
	 * @returns 未解決コメントリスト
	 */
	async getUnresolvedComments(fileKey: string): Promise<FigmaComment[]> {
		const response = await this.getComments({ file_key: fileKey });
		return response.comments.filter(
			(comment) => comment.resolved_at === undefined,
		);
	}
}
