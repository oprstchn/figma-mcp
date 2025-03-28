/**
 * Figma Webhook API
 * 
 * Figma Webhookの作成、管理、削除を提供するメソッド
 */

import { FigmaClient } from "./figma_client.ts";
import { 
  FigmaWebhook,
  FigmaWebhookParams,
  FigmaWebhooksResponse
} from "./types.ts";

/**
 * Figma Webhookアクセスクライアント
 */
export class FigmaWebhooksClient extends FigmaClient {
  /**
   * チームのWebhookを取得
   * @param teamId チームID
   * @returns Webhookリスト
   */
  async getTeamWebhooks(teamId: string): Promise<FigmaWebhooksResponse> {
    return await this.request<FigmaWebhooksResponse>(`/teams/${teamId}/webhooks`);
  }

  /**
   * Webhookを作成
   * @param params Webhook作成パラメータ
   * @returns 作成されたWebhook
   */
  async createWebhook(params: FigmaWebhookParams): Promise<{ webhook: FigmaWebhook }> {
    const { team_id, ...webhookData } = params;
    return await this.request<{ webhook: FigmaWebhook }>(
      `/teams/${team_id}/webhooks`,
      "POST",
      webhookData
    );
  }

  /**
   * Webhookを削除
   * @param teamId チームID
   * @param webhookId WebhookID
   * @returns 削除結果
   */
  async deleteWebhook(teamId: string, webhookId: string): Promise<{ success: boolean }> {
    return await this.request<{ success: boolean }>(
      `/teams/${teamId}/webhooks/${webhookId}`,
      "DELETE"
    );
  }

  /**
   * 特定のWebhookを取得
   * @param teamId チームID
   * @param webhookId WebhookID
   * @returns Webhook詳細
   */
  async getWebhook(teamId: string, webhookId: string): Promise<{ webhook: FigmaWebhook }> {
    const response = await this.getTeamWebhooks(teamId);
    const webhook = response.webhooks.find(wh => wh.id === webhookId);
    
    if (!webhook) {
      throw new Error(`Webhook with ID ${webhookId} not found in team ${teamId}`);
    }
    
    return { webhook };
  }

  /**
   * 特定のイベントタイプのWebhookを取得
   * @param teamId チームID
   * @param eventType イベントタイプ
   * @returns Webhookリスト
   */
  async getWebhooksByEventType(teamId: string, eventType: string): Promise<FigmaWebhook[]> {
    const response = await this.getTeamWebhooks(teamId);
    return response.webhooks.filter(webhook => webhook.event_type === eventType);
  }

  /**
   * Webhookのステータスを確認
   * @param teamId チームID
   * @param webhookId WebhookID
   * @returns Webhookのステータス
   */
  async checkWebhookStatus(teamId: string, webhookId: string): Promise<string> {
    const { webhook } = await this.getWebhook(teamId, webhookId);
    return webhook.status;
  }

  /**
   * 特定のエンドポイントに対するWebhookを検索
   * @param teamId チームID
   * @param endpoint エンドポイントURL
   * @returns Webhookリスト
   */
  async findWebhooksByEndpoint(teamId: string, endpoint: string): Promise<FigmaWebhook[]> {
    const response = await this.getTeamWebhooks(teamId);
    return response.webhooks.filter(webhook => webhook.endpoint === endpoint);
  }
}
