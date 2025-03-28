/**
 * Figma Components and Styles API
 * 
 * Implementation of Figma API endpoints for accessing components and styles.
 */

import { FigmaClient } from "./figma_client.ts";

// Type definitions for Figma API responses
export interface User {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

export interface ContainingFrame {
  name: string;
  node_id: string;
  background_color: string;
  page_id: string;
  page_name: string;
}

export interface ComponentPropertyDefinition {
  type: string;
  defaultValue: unknown;
  variantOptions?: string[];
  preferredValues?: unknown[];
}

export interface Component {
  key: string;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user: User;
  containing_frame: ContainingFrame;
  component_set_id?: string;
  component_property_definitions?: Record<string, ComponentPropertyDefinition>;
}

export interface ComponentSet {
  key: string;
  file_key: string;
  node_id: string;
  thumbnail_url: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user: User;
  containing_frame: ContainingFrame;
  component_property_definitions?: Record<string, ComponentPropertyDefinition>;
}

export interface Style {
  key: string;
  file_key: string;
  node_id: string;
  style_type: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  thumbnail_url: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user: User;
  sort_position: string;
}

export interface Cursor {
  before?: string;
  after?: string;
}

export interface GetComponentsResponse {
  error: boolean;
  status: number;
  meta: {
    components: Component[];
    cursor: Cursor;
  };
}

export interface GetComponentSetsResponse {
  error: boolean;
  status: number;
  meta: {
    component_sets: ComponentSet[];
    cursor: Cursor;
  };
}

export interface GetStylesResponse {
  error: boolean;
  status: number;
  meta: {
    styles: Style[];
    cursor: Cursor;
  };
}

/**
 * Figma Components and Styles API client extension
 */
export class FigmaComponentsAPI {
  private client: FigmaClient;

  /**
   * Creates a new Figma Components API client
   * @param client Base Figma API client
   */
  constructor(client: FigmaClient) {
    this.client = client;
  }

  /**
   * Get published components from a team library
   * @param teamId The team ID
   * @param pageSize Number of items per page (default: 30)
   * @param cursor Pagination cursor
   * @returns Published components
   */
  async getTeamComponents(
    teamId: string,
    pageSize?: number,
    cursor?: string
  ): Promise<GetComponentsResponse> {
    const params: Record<string, string> = {};
    
    if (pageSize !== undefined) {
      params.page_size = pageSize.toString();
    }
    
    if (cursor) {
      params.cursor = cursor;
    }
    
    return this.client.get<GetComponentsResponse>(`/teams/${teamId}/components`, params);
  }

  /**
   * Get published component sets from a team library
   * @param teamId The team ID
   * @param pageSize Number of items per page (default: 30)
   * @param cursor Pagination cursor
   * @returns Published component sets
   */
  async getTeamComponentSets(
    teamId: string,
    pageSize?: number,
    cursor?: string
  ): Promise<GetComponentSetsResponse> {
    const params: Record<string, string> = {};
    
    if (pageSize !== undefined) {
      params.page_size = pageSize.toString();
    }
    
    if (cursor) {
      params.cursor = cursor;
    }
    
    return this.client.get<GetComponentSetsResponse>(`/teams/${teamId}/component_sets`, params);
  }

  /**
   * Get published styles from a team library
   * @param teamId The team ID
   * @param pageSize Number of items per page (default: 30)
   * @param cursor Pagination cursor
   * @param styleType Filter by style type
   * @returns Published styles
   */
  async getTeamStyles(
    teamId: string,
    pageSize?: number,
    cursor?: string,
    styleType?: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
  ): Promise<GetStylesResponse> {
    const params: Record<string, string> = {};
    
    if (pageSize !== undefined) {
      params.page_size = pageSize.toString();
    }
    
    if (cursor) {
      params.cursor = cursor;
    }
    
    if (styleType) {
      params.style_type = styleType;
    }
    
    return this.client.get<GetStylesResponse>(`/teams/${teamId}/styles`, params);
  }

  /**
   * Get a specific component by key
   * @param key The component key
   * @returns The component metadata
   */
  async getComponent(key: string): Promise<Component> {
    return this.client.get<Component>(`/components/${key}`);
  }

  /**
   * Get a specific component set by key
   * @param key The component set key
   * @returns The component set metadata
   */
  async getComponentSet(key: string): Promise<ComponentSet> {
    return this.client.get<ComponentSet>(`/component_sets/${key}`);
  }

  /**
   * Get a specific style by key
   * @param key The style key
   * @returns The style metadata
   */
  async getStyle(key: string): Promise<Style> {
    return this.client.get<Style>(`/styles/${key}`);
  }
}
