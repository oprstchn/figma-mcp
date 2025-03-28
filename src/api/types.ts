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

// スタイル関連の型
export interface FigmaStyle {
	key: string;
	name: string;
	description: string;
	styleType: string;
}

// 画像関連の型
export interface FigmaImageResponse extends FigmaResponse {
	images: { [key: string]: string };
}

export interface FigmaImageParams {
	ids: string[];
	scale?: number;
	format?: "jpg" | "png" | "svg" | "pdf";
	svg_include_id?: boolean;
	svg_simplify_stroke?: boolean;
	use_absolute_bounds?: boolean;
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
	valuesByMode: { [key: string]: any };
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
