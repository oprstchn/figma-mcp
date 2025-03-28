/**
 * Figma File API
 * 
 * Implementation of Figma API endpoints for accessing file data.
 */

import { FigmaClient } from "./figma_client.ts";

// Type definitions for Figma API responses
export interface FigmaFile {
  document: Document;
  components: Record<string, Component>;
  schemaVersion: number;
  styles: Record<string, Style>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  editorType: string;
  linkAccess: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  children: Node[];
}

export interface Node {
  id: string;
  name: string;
  type: string;
  [key: string]: unknown;
}

export interface Component {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks?: string[];
}

export interface Style {
  key: string;
  name: string;
  description: string;
  styleType: string;
}

export interface GetFileNodesResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  err?: string;
  nodes: Record<string, {
    document: Node;
    components: Record<string, Component>;
    schemaVersion: number;
    styles: Record<string, Style>;
  }>;
}

export interface GetImageResponse {
  err?: string;
  images: Record<string, string>;
  status?: number;
}

export interface GetImageFillsResponse {
  err?: string;
  images: Record<string, string>;
  meta?: {
    images: Record<string, {
      url: string;
    }>;
  };
}

/**
 * Figma File API client extension
 */
export class FigmaFileAPI {
  private client: FigmaClient;

  /**
   * Creates a new Figma File API client
   * @param client Base Figma API client
   */
  constructor(client: FigmaClient) {
    this.client = client;
  }

  /**
   * Get a Figma file by key
   * @param fileKey The file key (can be extracted from Figma file URL)
   * @param version Optional version ID to retrieve
   * @returns The Figma file data
   */
  async getFile(fileKey: string, version?: string): Promise<FigmaFile> {
    const params: Record<string, string> = {};
    if (version) {
      params.version = version;
    }
    
    return this.client.get<FigmaFile>(`/files/${fileKey}`, params);
  }

  /**
   * Get specific nodes from a Figma file
   * @param fileKey The file key
   * @param ids Array of node IDs to retrieve
   * @param version Optional version ID
   * @param depth Optional depth to traverse the node tree
   * @returns The requested nodes
   */
  async getFileNodes(
    fileKey: string, 
    ids: string[], 
    version?: string,
    depth?: number
  ): Promise<GetFileNodesResponse> {
    const params: Record<string, string> = {
      ids: ids.join(','),
    };
    
    if (version) {
      params.version = version;
    }
    
    if (depth !== undefined) {
      params.depth = depth.toString();
    }
    
    return this.client.get<GetFileNodesResponse>(`/files/${fileKey}/nodes`, params);
  }

  /**
   * Get images for nodes in a Figma file
   * @param fileKey The file key
   * @param ids Array of node IDs to get images for
   * @param scale Optional image scale (default: 1)
   * @param format Optional image format (default: 'png')
   * @param svgIncludeId Optional include ID in SVG (default: false)
   * @param svgSimplifyStroke Optional simplify stroke in SVG (default: true)
   * @param useAbsoluteBounds Optional use absolute bounds (default: false)
   * @param version Optional version ID
   * @returns URLs to the requested images
   */
  async getImage(
    fileKey: string,
    ids: string[],
    scale?: number,
    format?: 'jpg' | 'png' | 'svg' | 'pdf',
    svgIncludeId?: boolean,
    svgSimplifyStroke?: boolean,
    useAbsoluteBounds?: boolean,
    version?: string
  ): Promise<GetImageResponse> {
    const params: Record<string, string> = {
      ids: ids.join(','),
    };
    
    if (scale !== undefined) {
      params.scale = scale.toString();
    }
    
    if (format) {
      params.format = format;
    }
    
    if (svgIncludeId !== undefined) {
      params.svg_include_id = svgIncludeId.toString();
    }
    
    if (svgSimplifyStroke !== undefined) {
      params.svg_simplify_stroke = svgSimplifyStroke.toString();
    }
    
    if (useAbsoluteBounds !== undefined) {
      params.use_absolute_bounds = useAbsoluteBounds.toString();
    }
    
    if (version) {
      params.version = version;
    }
    
    return this.client.get<GetImageResponse>(`/images/${fileKey}`, params);
  }

  /**
   * Get image fills for a Figma file
   * @param fileKey The file key
   * @returns URLs to the image fills
   */
  async getImageFills(fileKey: string): Promise<GetImageFillsResponse> {
    return this.client.get<GetImageFillsResponse>(`/files/${fileKey}/images`);
  }
}
