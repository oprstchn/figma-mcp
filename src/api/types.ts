/**
 * Figma API 型定義
 *
 * Figma APIのレスポンス型とリクエストパラメータの型定義
 */

// 認証関連の型
export interface FigmaAuthConfig {
	accessToken: string;
	apiBase?: string;
}

// 基本的なAPIレスポンス型
export interface FigmaResponse {
	status: number;
	error?: boolean;
	message?: string;
}

// ファイル関連の型
export interface FigmaFile extends FigmaResponse {
	name: string;
	lastModified: string;
	thumbnailUrl: string;
	version: string;
	document: FigmaDocument;
	components: { [key: string]: FigmaComponent };
	componentSets: { [key: string]: FigmaComponentSet };
	schemaVersion: number;
	styles: { [key: string]: FigmaStyle };
	nodes?: { [key: string]: FigmaNode };
}

// /files/:key/nodes エンドポイントのレスポンス型
export interface FigmaFileNodesResponse extends FigmaResponse {
	name: string;
	lastModified: string;
	thumbnailUrl: string;
	version: string;
	nodes: {
		[nodeId: string]: {
			document: FigmaDocument;
			components?: { [key: string]: FigmaComponent };
			schemaVersion?: number;
			styles?: { [key: string]: FigmaStyle };
		};
	};
}

export interface FigmaDocument {
	id: string;
	name: string;
	type: string;
	children?: FigmaNode[];
}

export interface FigmaNode {
	id: string;
	name: string;
	type: string;
	visible?: boolean;
	children?: FigmaNode[];
}

// コンポーネント関連の型
export interface FigmaComponent {
	key: string;
	name: string;
	description: string;
	componentSetId?: string;
	documentationLinks?: string[];
}

export interface FigmaComponentSet {
	key: string;
	name: string;
	description: string;
	documentationLinks?: string[];
}

// コンポーネントAPIレスポンス型
export interface FigmaComponentsResponse extends FigmaResponse {
	meta: {
		components: FigmaComponent[];
		cursor?: {
			before: string;
			after: string;
		};
	};
}

export interface FigmaComponentSetsResponse extends FigmaResponse {
	meta: {
		component_sets: FigmaComponentSet[];
		cursor?: {
			before: string;
			after: string;
		};
	};
}

// スタイル関連の型
export interface FigmaStyle {
	key: string;
	name: string;
	description: string;
	styleType: string;
}

// スタイルAPIレスポンス型
export interface FigmaStylesResponse extends FigmaResponse {
	meta: {
		styles: FigmaStyle[];
		cursor?: {
			before: string;
			after: string;
		};
	};
}

// 画像関連の型
export interface FigmaImageResponse extends FigmaResponse {
	images: { [key: string]: string };
}

export interface FigmaFileImagesResponse extends FigmaResponse {
	images: { [key: string]: string };
	meta?: {
		images: {
			[key: string]: {
				url: string;
			};
		};
	};
}

export interface FigmaImageParams {
	ids: string[];
	scale?: number;
	format?: "jpg" | "png" | "svg" | "pdf";
	svg_include_id?: boolean;
	svg_simplify_stroke?: boolean;
	use_absolute_bounds?: boolean;
	[key: string]: unknown;
}

// コメント関連の型
export interface FigmaComment {
	id: string;
	message: string;
	file_key: string;
	parent_id: string;
	user: FigmaUser;
	created_at: string;
	resolved_at?: string;
	client_meta?: {
		node_id?: string;
		node_offset?: {
			x: number;
			y: number;
		};
	};
}

export interface FigmaCommentsResponse extends FigmaResponse {
	comments: FigmaComment[];
}

export interface FigmaUser {
	id: string;
	handle: string;
	img_url: string;
}

export interface FigmaUserResponse extends FigmaResponse {
	id: string;
	email: string;
	handle: string;
	img_url: string;
}

// Webhook関連の型
export interface FigmaWebhook {
	id: string;
	team_id: string;
	event_type: string;
	client_id: string;
	endpoint: string;
	passcode: string;
	status: string;
	description: string;
	protocol_version: string;
}

export interface FigmaWebhookResponse {
	webhook: FigmaWebhook;
}

export interface FigmaWebhooksResponse extends FigmaResponse {
	webhooks: FigmaWebhook[];
}

// 変数関連の型
export interface FigmaVariable {
	id: string;
	name: string;
	key: string;
	variableCollectionId: string;
	resolvedType: string;
	valuesByMode: {
		[key: string]: {
			type: string;
			value: string | number | boolean | Record<string, unknown>;
		};
	};
	remote: boolean;
	description?: string;
}

export interface FigmaVariableCollection {
	id: string;
	name: string;
	key: string;
	modes: FigmaVariableMode[];
	defaultModeId: string;
	remote: boolean;
	hiddenFromPublishing: boolean;
}

export interface FigmaVariableMode {
	modeId: string;
	name: string;
}

export interface FigmaVariablesResponse extends FigmaResponse {
	variables: FigmaVariable[];
	variableCollections: FigmaVariableCollection[];
}

export interface FigmaVariablePublishParams {
	variableIds: string[];
	variableCollectionIds: string[];
	[key: string]: unknown;
}

export interface FigmaVariablePublishResponse extends FigmaResponse {
	// success は status: 200 で判定
}

// ブランチ関連の型
export interface FigmaBranch {
	key: string;
	name: string;
	description?: string;
	created_at: string;
	updated_at: string;
	creator: {
		id: string;
		handle: string;
		img_url: string;
	};
	status: string;
}

export interface FigmaBranchesResponse extends FigmaResponse {
	meta: {
		branches: FigmaBranch[];
	};
}

export interface FigmaBranchResponse extends FigmaResponse {
	meta: {
		branch: FigmaBranch;
	};
}

export interface FigmaCreateBranchParams extends Record<string, unknown> {
	name: string;
	description?: string;
}

// 変数更新関連の型
export interface FigmaVariableUpdateAction {
	variableId?: string;
	variableCollectionId?: string;
	action: "CREATE" | "UPDATE" | "DELETE";
	name?: string;
	key?: string;
	resolvedType?: string;
	valuesByMode?: {
		[modeId: string]: {
			type: string;
			value: string | number | boolean | Record<string, unknown>;
		};
	};
	description?: string;
	scopes?: string[];
	modes?: {
		modeId: string;
		name: string;
	}[];
	defaultModeId?: string;
}

export interface FigmaVariableUpdateParams extends Record<string, unknown> {
	variableUpdates?: FigmaVariableUpdateAction[];
	variableCollectionUpdates?: FigmaVariableUpdateAction[];
}

export interface FigmaVariableUpdateStatus {
	id: string;
	status: string;
}

export interface FigmaVariableUpdateResponse extends FigmaResponse {
	meta?: {
		variableUpdates?: FigmaVariableUpdateStatus[];
		variableCollectionUpdates?: FigmaVariableUpdateStatus[];
	};
}

// APIリクエストパラメータの型
export interface FigmaFileParams {
	file_key: string;
	version?: string;
	ids?: string[];
	depth?: number;
	geometry?: string;
	plugin_data?: string;
	branch_data?: boolean;
}

export interface FigmaCommentsParams {
	file_key: string;
	comment_id?: string;
}

export interface FigmaCreateCommentParams {
	file_key: string;
	message: string;
	client_meta?: {
		node_id?: string;
		node_offset?: {
			x: number;
			y: number;
		};
	};
	comment_id?: string;
}

export interface FigmaWebhookParams {
	team_id: string;
	event_type: string;
	endpoint: string;
	passcode: string;
	description?: string;
}

export interface FigmaVariablesParams {
	file_key: string;
}
