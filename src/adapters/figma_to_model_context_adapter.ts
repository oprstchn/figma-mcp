/**
 * Figma to Model Context アダプター
 * 
 * FigmaデータをModel Context Protocol形式に変換するアダプター
 */

import { 
  FigmaFile, 
  FigmaNode, 
  FigmaComponent, 
  FigmaComponentSet,
  FigmaStyle,
  FigmaComment
} from "../api/types.ts";
import { McpResource, McpContent, McpResourceTemplate } from "../model/model_context_protocol.ts";

/**
 * Figmaデータ変換アダプター
 */
export class FigmaToModelContextAdapter {
  /**
   * Figmaファイルをリソースに変換
   * @param file Figmaファイル
   * @param fileKey ファイルキー
   * @returns MCPリソース
   */
  convertFileToResource(file: FigmaFile, fileKey: string): McpResource {
    return {
      uri: `figma://file/${fileKey}`,
      text: this.formatFileContent(file),
      metadata: {
        name: file.name,
        lastModified: file.lastModified,
        version: file.version,
        schemaVersion: file.schemaVersion
      }
    };
  }

  /**
   * Figmaノードをリソースに変換
   * @param node Figmaノード
   * @param fileKey ファイルキー
   * @param nodeId ノードID
   * @returns MCPリソース
   */
  convertNodeToResource(node: FigmaNode, fileKey: string, nodeId: string): McpResource {
    return {
      uri: `figma://file/${fileKey}/node/${nodeId}`,
      text: this.formatNodeContent(node),
      metadata: {
        name: node.name,
        type: node.type,
        id: node.id
      }
    };
  }

  /**
   * Figmaコンポーネントをリソースに変換
   * @param component Figmaコンポーネント
   * @returns MCPリソース
   */
  convertComponentToResource(component: FigmaComponent): McpResource {
    return {
      uri: `figma://component/${component.key}`,
      text: this.formatComponentContent(component),
      metadata: {
        name: component.name,
        key: component.key,
        description: component.description
      }
    };
  }

  /**
   * Figmaスタイルをリソースに変換
   * @param style Figmaスタイル
   * @returns MCPリソース
   */
  convertStyleToResource(style: FigmaStyle): McpResource {
    return {
      uri: `figma://style/${style.key}`,
      text: this.formatStyleContent(style),
      metadata: {
        name: style.name,
        key: style.key,
        styleType: style.styleType
      }
    };
  }

  /**
   * Figmaコメントをリソースに変換
   * @param comment Figmaコメント
   * @param fileKey ファイルキー
   * @returns MCPリソース
   */
  convertCommentToResource(comment: FigmaComment, fileKey: string): McpResource {
    return {
      uri: `figma://file/${fileKey}/comment/${comment.id}`,
      text: this.formatCommentContent(comment),
      metadata: {
        id: comment.id,
        user: comment.user.handle,
        created_at: comment.created_at,
        resolved_at: comment.resolved_at
      }
    };
  }

  /**
   * Figmaファイルの内容をテキスト形式にフォーマット
   * @param file Figmaファイル
   * @returns フォーマットされたテキスト
   */
  private formatFileContent(file: FigmaFile): string {
    let content = `# ${file.name}\n\n`;
    content += `Last Modified: ${file.lastModified}\n`;
    content += `Version: ${file.version}\n\n`;
    
    if (file.document) {
      content += `## Document Structure\n\n`;
      content += this.formatNodeHierarchy(file.document, 0);
    }
    
    const componentCount = Object.keys(file.components || {}).length;
    const styleCount = Object.keys(file.styles || {}).length;
    
    content += `\n## Summary\n\n`;
    content += `- Components: ${componentCount}\n`;
    content += `- Styles: ${styleCount}\n`;
    
    return content;
  }

  /**
   * Figmaノード階層をテキスト形式にフォーマット
   * @param node Figmaノード
   * @param depth 階層の深さ
   * @returns フォーマットされたテキスト
   */
  private formatNodeHierarchy(node: FigmaNode, depth: number): string {
    const indent = '  '.repeat(depth);
    let content = `${indent}- ${node.name} (${node.type})`;
    
    if (!node.visible) {
      content += ' [hidden]';
    }
    
    content += '\n';
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        content += this.formatNodeHierarchy(child, depth + 1);
      }
    }
    
    return content;
  }

  /**
   * Figmaノードの内容をテキスト形式にフォーマット
   * @param node Figmaノード
   * @returns フォーマットされたテキスト
   */
  private formatNodeContent(node: FigmaNode): string {
    let content = `# ${node.name}\n\n`;
    content += `Type: ${node.type}\n`;
    content += `ID: ${node.id}\n`;
    
    if (node.visible !== undefined) {
      content += `Visible: ${node.visible ? 'Yes' : 'No'}\n`;
    }
    
    if (node.children && node.children.length > 0) {
      content += `\n## Children\n\n`;
      for (const child of node.children) {
        content += `- ${child.name} (${child.type})\n`;
      }
    }
    
    return content;
  }

  /**
   * Figmaコンポーネントの内容をテキスト形式にフォーマット
   * @param component Figmaコンポーネント
   * @returns フォーマットされたテキスト
   */
  private formatComponentContent(component: FigmaComponent): string {
    let content = `# Component: ${component.name}\n\n`;
    
    if (component.description) {
      content += `${component.description}\n\n`;
    }
    
    content += `Key: ${component.key}\n`;
    
    if (component.componentSetId) {
      content += `Component Set: ${component.componentSetId}\n`;
    }
    
    if (component.documentationLinks && component.documentationLinks.length > 0) {
      content += `\n## Documentation Links\n\n`;
      for (const link of component.documentationLinks) {
        content += `- ${link}\n`;
      }
    }
    
    return content;
  }

  /**
   * Figmaスタイルの内容をテキスト形式にフォーマット
   * @param style Figmaスタイル
   * @returns フォーマットされたテキスト
   */
  private formatStyleContent(style: FigmaStyle): string {
    let content = `# Style: ${style.name}\n\n`;
    
    if (style.description) {
      content += `${style.description}\n\n`;
    }
    
    content += `Key: ${style.key}\n`;
    content += `Type: ${style.styleType}\n`;
    
    return content;
  }

  /**
   * Figmaコメントの内容をテキスト形式にフォーマット
   * @param comment Figmaコメント
   * @returns フォーマットされたテキスト
   */
  private formatCommentContent(comment: FigmaComment): string {
    let content = `# Comment by ${comment.user.handle}\n\n`;
    content += `${comment.message}\n\n`;
    content += `Posted: ${comment.created_at}\n`;
    
    if (comment.resolved_at) {
      content += `Resolved: ${comment.resolved_at}\n`;
    }
    
    if (comment.parent_id) {
      content += `Reply to: ${comment.parent_id}\n`;
    }
    
    if (comment.client_meta && comment.client_meta.node_id) {
      content += `Node: ${comment.client_meta.node_id}\n`;
      
      if (comment.client_meta.node_offset) {
        content += `Position: (${comment.client_meta.node_offset.x}, ${comment.client_meta.node_offset.y})\n`;
      }
    }
    
    return content;
  }
}

/**
 * Figma Model Context リソースプロバイダー
 */
export class FigmaModelContextResourceProvider {
  private adapter: FigmaToModelContextAdapter;
  
  constructor() {
    this.adapter = new FigmaToModelContextAdapter();
  }
  
  /**
   * ファイルリソーステンプレートを取得
   * @returns リソーステンプレート
   */
  getFileResourceTemplate(): McpResourceTemplate {
    return new McpResourceTemplate("figma://file/{fileKey}", { list: false });
  }
  
  /**
   * ノードリソーステンプレートを取得
   * @returns リソーステンプレート
   */
  getNodeResourceTemplate(): McpResourceTemplate {
    return new McpResourceTemplate("figma://file/{fileKey}/node/{nodeId}", { list: false });
  }
  
  /**
   * コンポーネントリソーステンプレートを取得
   * @returns リソーステンプレート
   */
  getComponentResourceTemplate(): McpResourceTemplate {
    return new McpResourceTemplate("figma://component/{componentKey}", { list: false });
  }
  
  /**
   * スタイルリソーステンプレートを取得
   * @returns リソーステンプレート
   */
  getStyleResourceTemplate(): McpResourceTemplate {
    return new McpResourceTemplate("figma://style/{styleKey}", { list: false });
  }
  
  /**
   * コメントリソーステンプレートを取得
   * @returns リソーステンプレート
   */
  getCommentResourceTemplate(): McpResourceTemplate {
    return new McpResourceTemplate("figma://file/{fileKey}/comment/{commentId}", { list: false });
  }
  
  /**
   * Figmaファイルをコンテンツに変換
   * @param file Figmaファイル
   * @param fileKey ファイルキー
   * @returns MCPコンテンツ
   */
  convertFileToContent(file: FigmaFile, fileKey: string): McpContent {
    const resource = this.adapter.convertFileToResource(file, fileKey);
    
    return {
      type: "text",
      text: resource.text,
      uri: resource.uri,
      metadata: resource.metadata
    };
  }
  
  /**
   * Figmaノードをコンテンツに変換
   * @param node Figmaノード
   * @param fileKey ファイルキー
   * @param nodeId ノードID
   * @returns MCPコンテンツ
   */
  convertNodeToContent(node: FigmaNode, fileKey: string, nodeId: string): McpContent {
    const resource = this.adapter.convertNodeToResource(node, fileKey, nodeId);
    
    return {
      type: "text",
      text: resource.text,
      uri: resource.uri,
      metadata: resource.metadata
    };
  }
}
