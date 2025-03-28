/**
 * Figma Variables API
 * 
 * Implementation of Figma API endpoints for accessing and managing variables.
 * Note: Variables API is only available to members in Enterprise organizations.
 */

import { FigmaClient } from "./figma_client.ts";

// Type definitions for Figma API responses
export interface VariableCollection {
  id: string;
  name: string;
  key: string;
  modes: VariableMode[];
  defaultModeId: string;
  remote: boolean;
  hiddenFromPublishing: boolean;
}

export interface VariableMode {
  modeId: string;
  name: string;
}

export interface VariableValue {
  type: string;
  value: unknown;
}

export interface Variable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: string;
  valuesByMode: Record<string, VariableValue>;
  remote: boolean;
  description: string;
  hiddenFromPublishing: boolean;
  scopes: string[];
}

export interface GetVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: {
      collections: VariableCollection[];
      variables: Variable[];
    };
  };
}

export interface PublishVariablesRequest {
  variableIds?: string[];
  variableCollectionIds?: string[];
}

export interface PublishVariablesResponse {
  status: number;
  error: boolean;
}

export interface CreateVariableRequest {
  name: string;
  key?: string;
  variableCollectionId: string;
  resolvedType: string;
  valuesByMode: Record<string, VariableValue>;
  description?: string;
  hiddenFromPublishing?: boolean;
  scopes?: string[];
}

export interface UpdateVariableRequest {
  name?: string;
  key?: string;
  resolvedType?: string;
  valuesByMode?: Record<string, VariableValue>;
  description?: string;
  hiddenFromPublishing?: boolean;
  scopes?: string[];
}

export interface CreateVariableCollectionRequest {
  name: string;
  key?: string;
  modes: VariableMode[];
  defaultModeId: string;
  hiddenFromPublishing?: boolean;
}

export interface UpdateVariableCollectionRequest {
  name?: string;
  key?: string;
  modes?: VariableMode[];
  defaultModeId?: string;
  hiddenFromPublishing?: boolean;
}

/**
 * Figma Variables API client extension
 */
export class FigmaVariablesAPI {
  private client: FigmaClient;

  /**
   * Creates a new Figma Variables API client
   * @param client Base Figma API client
   */
  constructor(client: FigmaClient) {
    this.client = client;
  }

  /**
   * Get variables for a file
   * @param fileKey The file key
   * @returns Variables for the file
   */
  async getVariables(fileKey: string): Promise<GetVariablesResponse> {
    return this.client.get<GetVariablesResponse>(`/files/${fileKey}/variables`);
  }

  /**
   * Publish variables in a file
   * @param fileKey The file key
   * @param request Variables to publish
   * @returns Publish status
   */
  async publishVariables(fileKey: string, request: PublishVariablesRequest): Promise<PublishVariablesResponse> {
    return this.client.post<PublishVariablesResponse>(`/files/${fileKey}/variables/publish`, request);
  }

  /**
   * Create a variable in a file
   * @param fileKey The file key
   * @param variable Variable data to create
   * @returns The created variable
   */
  async createVariable(fileKey: string, variable: CreateVariableRequest): Promise<Variable> {
    return this.client.post<Variable>(`/files/${fileKey}/variables`, variable);
  }

  /**
   * Update a variable
   * @param fileKey The file key
   * @param variableId The variable ID
   * @param updates Variable data to update
   * @returns The updated variable
   */
  async updateVariable(fileKey: string, variableId: string, updates: UpdateVariableRequest): Promise<Variable> {
    return this.client.put<Variable>(`/files/${fileKey}/variables/${variableId}`, updates);
  }

  /**
   * Delete a variable
   * @param fileKey The file key
   * @param variableId The variable ID
   * @returns Success status
   */
  async deleteVariable(fileKey: string, variableId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/files/${fileKey}/variables/${variableId}`);
  }

  /**
   * Create a variable collection in a file
   * @param fileKey The file key
   * @param collection Variable collection data to create
   * @returns The created variable collection
   */
  async createVariableCollection(fileKey: string, collection: CreateVariableCollectionRequest): Promise<VariableCollection> {
    return this.client.post<VariableCollection>(`/files/${fileKey}/variable_collections`, collection);
  }

  /**
   * Update a variable collection
   * @param fileKey The file key
   * @param collectionId The variable collection ID
   * @param updates Variable collection data to update
   * @returns The updated variable collection
   */
  async updateVariableCollection(
    fileKey: string, 
    collectionId: string, 
    updates: UpdateVariableCollectionRequest
  ): Promise<VariableCollection> {
    return this.client.put<VariableCollection>(`/files/${fileKey}/variable_collections/${collectionId}`, updates);
  }

  /**
   * Delete a variable collection
   * @param fileKey The file key
   * @param collectionId The variable collection ID
   * @returns Success status
   */
  async deleteVariableCollection(fileKey: string, collectionId: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/files/${fileKey}/variable_collections/${collectionId}`);
  }
}
