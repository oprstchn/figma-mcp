/**
 * Figma Comments API
 * 
 * Implementation of Figma API endpoints for accessing and managing comments.
 */

import { FigmaClient } from "./figma_client.ts";

// Type definitions for Figma API responses
export interface User {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

export interface ClientMeta {
  node_id?: string;
  node_offset?: {
    x: number;
    y: number;
  };
}

export interface Reaction {
  user: User;
  emoji: string;
  created_at: string;
}

export interface Comment {
  id: string;
  client_meta: ClientMeta;
  message: string;
  file_key: string;
  parent_id?: string;
  user: User;
  created_at: string;
  resolved_at?: string;
  reactions?: Reaction[];
  order_id?: number;
}

export interface GetCommentsResponse {
  comments: Comment[];
}

export interface PostCommentRequest {
  message: string;
  client_meta?: ClientMeta;
  comment_id?: string; // For replies
}

/**
 * Figma Comments API client extension
 */
export class FigmaCommentsAPI {
  private client: FigmaClient;

  /**
   * Creates a new Figma Comments API client
   * @param client Base Figma API client
   */
  constructor(client: FigmaClient) {
    this.client = client;
  }

  /**
   * Get comments for a file
   * @param fileKey The file key
   * @returns Comments for the file
   */
  async getComments(fileKey: string): Promise<GetCommentsResponse> {
    return this.client.get<GetCommentsResponse>(`/files/${fileKey}/comments`);
  }

  /**
   * Post a comment to a file
   * @param fileKey The file key
   * @param comment Comment data to post
   * @returns The created comment
   */
  async postComment(fileKey: string, comment: PostCommentRequest): Promise<Comment> {
    return this.client.post<Comment>(`/files/${fileKey}/comments`, comment);
  }

  /**
   * Post a reply to a comment
   * @param fileKey The file key
   * @param commentId The parent comment ID
   * @param message The reply message
   * @returns The created comment reply
   */
  async postCommentReply(fileKey: string, commentId: string, message: string): Promise<Comment> {
    return this.postComment(fileKey, {
      message,
      comment_id: commentId
    });
  }

  /**
   * Delete a comment
   * @param fileKey The file key
   * @param commentId The comment ID to delete
   * @returns Success status
   */
  async deleteComment(fileKey: string, commentId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/files/${fileKey}/comments/${commentId}`);
  }

  /**
   * Add a reaction to a comment
   * @param fileKey The file key
   * @param commentId The comment ID
   * @param emoji The emoji to add as reaction
   * @returns The updated comment
   */
  async addReaction(fileKey: string, commentId: string, emoji: string): Promise<Comment> {
    return this.client.post<Comment>(`/files/${fileKey}/comments/${commentId}/reactions`, { emoji });
  }

  /**
   * Remove a reaction from a comment
   * @param fileKey The file key
   * @param commentId The comment ID
   * @param emoji The emoji to remove
   * @returns Success status
   */
  async removeReaction(fileKey: string, commentId: string, emoji: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/files/${fileKey}/comments/${commentId}/reactions`, { emoji });
  }

  /**
   * Resolve a comment
   * @param fileKey The file key
   * @param commentId The comment ID to resolve
   * @returns The updated comment
   */
  async resolveComment(fileKey: string, commentId: string): Promise<Comment> {
    return this.client.post<Comment>(`/files/${fileKey}/comments/${commentId}/resolve`);
  }

  /**
   * Unresolve a comment
   * @param fileKey The file key
   * @param commentId The comment ID to unresolve
   * @returns The updated comment
   */
  async unresolveComment(fileKey: string, commentId: string): Promise<Comment> {
    return this.client.post<Comment>(`/files/${fileKey}/comments/${commentId}/unresolve`);
  }
}
