/**
 * Figma API クライアント
 *
 * 全ての Figma API にアクセスするための統合クライアント
 */

import { FigmaAuthConfig, FigmaFile, FigmaFileParams, FigmaImageParams, FigmaImageResponse, FigmaNode } from "./types.ts";
import { Client } from "./client.ts";
import { FigmaCommentsClient } from "./figma_comments_api.ts";
import { FigmaComponentsClient } from "./figma_components_api.ts";
import { FigmaFileClient } from "./figma_file_api.ts";
import { FigmaVariablesClient } from "./figma_variables_api.ts";
import { FigmaWebhooksClient } from "./figma_webhooks_api.ts";

/**
 * Figma API への統合アクセスを提供するクライアント
 */
export class FigmaClient extends Client {
  public readonly files: FigmaFileClient;
  public readonly comments: FigmaCommentsClient;
  public readonly components: FigmaComponentsClient;
  public readonly variables: FigmaVariablesClient;
  public readonly webhooks: FigmaWebhooksClient;

  /**
   * 統合 Figma API クライアントを初期化
   * @param config 認証設定
   */
  constructor(config: FigmaAuthConfig) {
    super(config);

    // 各 API クライアントを初期化
    this.files = new FigmaFileClient(config);
    this.comments = new FigmaCommentsClient(config);
    this.components = new FigmaComponentsClient(config);
    this.variables = new FigmaVariablesClient(config);
    this.webhooks = new FigmaWebhooksClient(config);
  }

  // File API メソッド
  async getFile(params: FigmaFileParams): Promise<FigmaFile> {
    return await this.files.getFile(params);
  }

  async getFileNodes(params: FigmaFileParams & { ids: string[] }): Promise<FigmaFile> {
    return await this.files.getFileNodes(params);
  }

  async getFileComments(fileKey: string): Promise<any> {
    return await this.files.getFileComments(fileKey);
  }

  async getImage(fileKey: string, params: FigmaImageParams): Promise<FigmaImageResponse> {
    return await this.files.getImage(fileKey, params);
  }


  async findComponents(fileKey: string): Promise<any> {
    return await this.files.findComponents(fileKey);
  }

  async findStyles(fileKey: string): Promise<any> {
    return await this.files.findStyles(fileKey);
  }

  async getNode(fileKey: string, nodeId: string): Promise<FigmaNode | null> {
    return await this.files.getNode(fileKey, nodeId);
  }

  // Comments API メソッド
  async getComments(params: { file_key: string }): Promise<any> {
    return await this.comments.getComments(params);
  }


  async postComment(params: { file_key: string; message: string; client_meta?: any }): Promise<any> {
    return await this.comments.postComment(params);
  }

  async replyToComment(params: { file_key: string; message: string; comment_id: string; client_meta?: any }): Promise<any> {
    return await this.comments.replyToComment(params);
  }

  async deleteComment(fileKey: string, commentId: string): Promise<{ success: boolean }> {
    return await this.comments.deleteComment(fileKey, commentId);
  }


  async getResolvedComments(fileKey: string): Promise<any[]> {
    return await this.comments.getResolvedComments(fileKey);
  }

  async getUnresolvedComments(fileKey: string): Promise<any[]> {
    return await this.comments.getUnresolvedComments(fileKey);
  }

  // Components API メソッド
  async getTeamComponents(teamId: string): Promise<any> {
    return await this.components.getTeamComponents(teamId);
  }



  async getTeamStyles(teamId: string): Promise<any> {
    return await this.components.getTeamStyles(teamId);
  }


  async getAllFileComponents(fileKey: string): Promise<any> {
    return await this.components.getAllFileComponents(fileKey);
  }

  async getAllFileComponentSets(fileKey: string): Promise<any> {
    return await this.components.getAllFileComponentSets(fileKey);
  }

  async getAllFileStyles(fileKey: string): Promise<any> {
    return await this.components.getAllFileStyles(fileKey);
  }


  // Variables API メソッド
  async getVariables(params: { file_key: string }): Promise<any> {
    return await this.variables.getVariables(params);
  }

  async getFileVariables(fileKey: string): Promise<any[]> {
    return await this.variables.getFileVariables(fileKey);
  }

  async getFileVariableCollections(fileKey: string): Promise<any[]> {
    return await this.variables.getFileVariableCollections(fileKey);
  }

  async getVariable(fileKey: string, variableId: string): Promise<any | null> {
    return await this.variables.getVariable(fileKey, variableId);
  }

  async getVariableCollection(fileKey: string, collectionId: string): Promise<any | null> {
    return await this.variables.getVariableCollection(fileKey, collectionId);
  }

  async getVariablesByCollection(fileKey: string, collectionId: string): Promise<any[]> {
    return await this.variables.getVariablesByCollection(fileKey, collectionId);
  }

  async getVariablesByType(fileKey: string, type: string): Promise<any[]> {
    return await this.variables.getVariablesByType(fileKey, type);
  }

  async getVariableValueForMode(fileKey: string, variableId: string, modeId: string): Promise<any | null> {
    return await this.variables.getVariableValueForMode(fileKey, variableId, modeId);
  }

  // Webhooks API メソッド
  async getTeamWebhooks(teamId: string): Promise<any> {
    return await this.webhooks.getTeamWebhooks(teamId);
  }

  async createWebhook(params: { team_id: string; event_type: string; endpoint: string; passcode: string; description?: string }): Promise<any> {
    return await this.webhooks.createWebhook(params);
  }

  async deleteWebhook(teamId: string, webhookId: string): Promise<{ success: boolean }> {
    return await this.webhooks.deleteWebhook(teamId, webhookId);
  }

  async getWebhook(teamId: string, webhookId: string): Promise<any> {
    return await this.webhooks.getWebhook(teamId, webhookId);
  }

  async getWebhooksByEventType(teamId: string, eventType: string): Promise<any[]> {
    return await this.webhooks.getWebhooksByEventType(teamId, eventType);
  }

  async checkWebhookStatus(teamId: string, webhookId: string): Promise<string> {
    return await this.webhooks.checkWebhookStatus(teamId, webhookId);
  }

  async findWebhooksByEndpoint(teamId: string, endpoint: string): Promise<any[]> {
    return await this.webhooks.findWebhooksByEndpoint(teamId, endpoint);
  }

  /**
   * 統合クライアントのすべての機能を使用した例：ファイルとそのコメントを取得
   * @param fileKey ファイルキー
   * @returns ファイルとコメントの情報
   */
  async getFileWithComments(fileKey: string) {
    const [file, comments] = await Promise.all([
      this.getFile({ file_key: fileKey }),
      this.getComments({ file_key: fileKey })
    ]);

    return {
      file,
      comments: comments.comments
    };
  }

  /**
   * ファイルの変数とコンポーネントを一度に取得
   * @param fileKey ファイルキー
   * @returns 変数とコンポーネントの情報
   */
  async getFileAssetsAndVariables(fileKey: string) {
    const [variables, components, styles] = await Promise.all([
      this.getFileVariables(fileKey),
      this.getAllFileComponents(fileKey),
      this.getAllFileStyles(fileKey)
    ]);

    return {
      variables,
      components,
      styles
    };
  }
}