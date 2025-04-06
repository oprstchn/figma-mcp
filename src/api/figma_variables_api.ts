/**
 * Figma 変数アクセスAPI
 *
 * Figma変数とコレクションへのアクセスを提供するメソッド
 */

import { Client } from "./client.ts";
import type {
	FigmaVariable,
	FigmaVariableCollection,
	FigmaVariablePublishParams,
	FigmaVariablePublishResponse,
	FigmaVariableUpdateParams,
	FigmaVariableUpdateResponse,
	FigmaVariablesParams,
	FigmaVariablesResponse,
} from "./types.ts";

/**
 * Figma変数アクセスクライアント
 */
export class FigmaVariablesClient extends Client {
	/**
	 * ファイルの変数とコレクションを取得
	 * @param params 変数取得パラメータ
	 * @returns 変数とコレクションのレスポンス
	 */
	async getVariables(
		params: FigmaVariablesParams,
	): Promise<FigmaVariablesResponse> {
		const { file_key } = params;
		return await this.request<FigmaVariablesResponse>(
			`/files/${file_key}/variables`,
		);
	}

	/**
	 * ファイルの変数を取得
	 * @param fileKey ファイルキー
	 * @returns 変数リスト
	 */
	async getFileVariables(fileKey: string): Promise<FigmaVariable[]> {
		const response = await this.getVariables({ file_key: fileKey });
		return response.variables || [];
	}

	/**
	 * ファイルの変数コレクションを取得
	 * @param fileKey ファイルキー
	 * @returns 変数コレクションリスト
	 */
	async getFileVariableCollections(
		fileKey: string,
	): Promise<FigmaVariableCollection[]> {
		const response = await this.getVariables({ file_key: fileKey });
		return response.variableCollections || [];
	}

	/**
	 * 特定の変数を取得
	 * @param fileKey ファイルキー
	 * @param variableId 変数ID
	 * @returns 変数
	 */
	async getVariable(
		fileKey: string,
		variableId: string,
	): Promise<FigmaVariable | null> {
		try {
			const response = await this.getVariables({ file_key: fileKey });
			return (
				response.variables.find((variable) => variable.id === variableId) ||
				null
			);
		} catch (error) {
			console.error(`Error getting variable ${variableId}:`, error);
			return null;
		}
	}

	/**
	 * 特定の変数コレクションを取得
	 * @param fileKey ファイルキー
	 * @param collectionId コレクションID
	 * @returns 変数コレクション
	 */
	async getVariableCollection(
		fileKey: string,
		collectionId: string,
	): Promise<FigmaVariableCollection | null> {
		try {
			const response = await this.getVariables({ file_key: fileKey });
			return (
				response.variableCollections.find(
					(collection) => collection.id === collectionId,
				) || null
			);
		} catch (error) {
			console.error(
				`Error getting variable collection ${collectionId}:`,
				error,
			);
			return null;
		}
	}

	/**
	 * 特定のコレクションに属する変数を取得
	 * @param fileKey ファイルキー
	 * @param collectionId コレクションID
	 * @returns 変数リスト
	 */
	async getVariablesByCollection(
		fileKey: string,
		collectionId: string,
	): Promise<FigmaVariable[]> {
		try {
			const response = await this.getVariables({ file_key: fileKey });
			return response.variables.filter(
				(variable) => variable.variableCollectionId === collectionId,
			);
		} catch (error) {
			console.error(
				`Error getting variables for collection ${collectionId}:`,
				error,
			);
			return [];
		}
	}

	/**
	 * 特定のタイプの変数を取得
	 * @param fileKey ファイルキー
	 * @param type 変数タイプ
	 * @returns 変数リスト
	 */
	async getVariablesByType(
		fileKey: string,
		type: string,
	): Promise<FigmaVariable[]> {
		try {
			const response = await this.getVariables({ file_key: fileKey });
			return response.variables.filter(
				(variable) => variable.resolvedType === type,
			);
		} catch (error) {
			console.error(`Error getting variables of type ${type}:`, error);
			return [];
		}
	}

	/**
	 * 変数のモード別の値を取得
	 * @param fileKey ファイルキー
	 * @param variableId 変数ID
	 * @param modeId モードID
	 * @returns 変数の値
	 */
	async getVariableValueForMode(
		fileKey: string,
		variableId: string,
		modeId: string,
	): Promise<{
		type: string;
		value: string | number | boolean | Record<string, unknown>;
	} | null> {
		try {
			const variable = await this.getVariable(fileKey, variableId);
			if (!variable) return null;

			return variable.valuesByMode[modeId] || null;
		} catch (error) {
			console.error(`Error getting variable value for mode ${modeId}:`, error);
			return null;
		}
	}

	/**
	 * 変数を更新
	 * @param fileKey ファイルキー
	 * @param params 更新パラメータ
	 * @returns 更新結果
	 */
	async updateVariables(
		fileKey: string,
		params: FigmaVariableUpdateParams,
	): Promise<FigmaVariableUpdateResponse> {
		return await this.request<FigmaVariableUpdateResponse>(
			`/files/${fileKey}/variables`,
			"PATCH",
			params,
		);
	}

	/**
	 * 変数を公開
	 * @param fileKey ファイルキー
	 * @param params 公開する変数とコレクションのID
	 * @returns 公開結果
	 */
	async publishVariables(
		fileKey: string,
		params: FigmaVariablePublishParams,
	): Promise<FigmaVariablePublishResponse> {
		return await this.request<FigmaVariablePublishResponse>(
			`/files/${fileKey}/variables/publish`,
			"POST",
			params,
		);
	}
}
