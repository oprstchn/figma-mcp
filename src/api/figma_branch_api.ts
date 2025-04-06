import { Client } from "./client.ts";
import type {
	FigmaBranchResponse,
	FigmaBranchesResponse,
	FigmaCreateBranchParams,
} from "./types.ts";

/**
 * Figma ブランチアクセスAPI
 */
export class FigmaBranchClient extends Client {
	/**
	 * ファイルのブランチ一覧を取得
	 */
	async getBranches(fileKey: string): Promise<FigmaBranchesResponse> {
		return await this.request<FigmaBranchesResponse>(
			`/files/${fileKey}/branches`,
		);
	}

	/**
	 * 新しいブランチを作成
	 */
	async createBranch(
		fileKey: string,
		params: FigmaCreateBranchParams,
	): Promise<FigmaBranchResponse> {
		return await this.request<FigmaBranchResponse>(
			`/files/${fileKey}/branches`,
			"POST",
			params,
		);
	}
}
