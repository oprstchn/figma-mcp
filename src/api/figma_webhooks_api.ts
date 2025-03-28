/**
 * Figma Webhooks API
 * 
 * Implementation of Figma API endpoints for managing webhooks.
 */

import { FigmaClient } from "./figma_client.ts";

// Type definitions for Figma API responses
export interface Webhook {
  id: string;
  team_id: string;
  event_type: WebhookEventType;
  client_id: string;
  endpoint: string;
  passcode: string;
  status: WebhookStatus;
  description: string;
  protocol_version: string;
}

export type WebhookEventType = 
  | 'FILE_UPDATE' 
  | 'FILE_VERSION_UPDATE' 
  | 'FILE_COMMENT' 
  | 'FILE_DELETE' 
  | 'LIBRARY_PUBLISH';

export type WebhookStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';

export interface GetWebhooksResponse {
  webhooks: Webhook[];
}

export interface CreateWebhookRequest {
  event_type: WebhookEventType;
  endpoint: string;
  passcode: string;
  description?: string;
}

export interface UpdateWebhookRequest {
  endpoint?: string;
  passcode?: string;
  description?: string;
}

/**
 * Figma Webhooks API client extension
 */
export class FigmaWebhooksAPI {
  private client: FigmaClient;

  /**
   * Creates a new Figma Webhooks API client
   * @param client Base Figma API client
   */
  constructor(client: FigmaClient) {
    this.client = client;
  }

  /**
   * Get webhooks for a team
   * @param teamId The team ID
   * @returns Webhooks for the team
   */
  async getWebhooks(teamId: string): Promise<GetWebhooksResponse> {
    return this.client.get<GetWebhooksResponse>(`/teams/${teamId}/webhooks`);
  }

  /**
   * Create a webhook for a team
   * @param teamId The team ID
   * @param webhook Webhook data to create
   * @returns The created webhook
   */
  async createWebhook(teamId: string, webhook: CreateWebhookRequest): Promise<Webhook> {
    return this.client.post<Webhook>(`/teams/${teamId}/webhooks`, webhook);
  }

  /**
   * Get a specific webhook
   * @param webhookId The webhook ID
   * @returns The webhook
   */
  async getWebhook(webhookId: string): Promise<Webhook> {
    return this.client.get<Webhook>(`/webhooks/${webhookId}`);
  }

  /**
   * Update a webhook
   * @param webhookId The webhook ID
   * @param updates Webhook data to update
   * @returns The updated webhook
   */
  async updateWebhook(webhookId: string, updates: UpdateWebhookRequest): Promise<Webhook> {
    return this.client.put<Webhook>(`/webhooks/${webhookId}`, updates);
  }

  /**
   * Delete a webhook
   * @param webhookId The webhook ID
   * @returns Success status
   */
  async deleteWebhook(webhookId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/webhooks/${webhookId}`);
  }
}
