/**
 * RooCode and Cline Integration
 * 
 * Integration interfaces for RooCode and Cline AI models.
 */

import { ModelContext } from "../model/model_context_protocol.ts";

/**
 * Base interface for AI model integrations
 */
export interface AIModelIntegration {
  /**
   * Get the name of the AI model
   * @returns Model name
   */
  getModelName(): string;
  
  /**
   * Format Model Context for the AI model
   * @param context Model Context
   * @returns Formatted context string
   */
  formatContext(context: ModelContext): string;
  
  /**
   * Inject Model Context into a prompt
   * @param context Model Context
   * @param prompt Original prompt
   * @returns Enhanced prompt with context
   */
  injectContext(context: ModelContext, prompt: string): string;
}

/**
 * RooCode integration implementation
 */
export class RooCodeIntegration implements AIModelIntegration {
  /**
   * Get the name of the AI model
   * @returns Model name
   */
  getModelName(): string {
    return "RooCode";
  }
  
  /**
   * Format Model Context for RooCode
   * @param context Model Context
   * @returns Formatted context string
   */
  formatContext(context: ModelContext): string {
    // RooCode prefers a specific format for design context
    const formattedContext = {
      designContext: {
        source: context.metadata.source,
        fileInfo: {
          name: context.metadata.source.fileName,
          lastModified: context.metadata.source.lastModified,
          url: context.metadata.source.url,
        },
        structure: this.formatStructure(context),
        elements: this.formatElements(context),
        styles: context.design.styles,
      },
      semantics: context.semantics,
    };
    
    return JSON.stringify(formattedContext);
  }
  
  /**
   * Format structure for RooCode
   * @param context Model Context
   * @returns Formatted structure
   */
  private formatStructure(context: ModelContext): any {
    // RooCode prefers a tree structure rather than flat hierarchy
    const nodeMap = new Map<string, any>();
    
    // Create node map
    for (const node of context.design.structure.hierarchy) {
      nodeMap.set(node.id, {
        id: node.id,
        name: node.name,
        type: node.type,
        children: [],
      });
    }
    
    // Build tree
    for (const node of context.design.structure.hierarchy) {
      if (node.parent && nodeMap.has(node.parent)) {
        const parentNode = nodeMap.get(node.parent);
        parentNode.children.push(nodeMap.get(node.id));
      }
    }
    
    // Return root node
    return nodeMap.get(context.design.structure.root);
  }
  
  /**
   * Format elements for RooCode
   * @param context Model Context
   * @returns Formatted elements
   */
  private formatElements(context: ModelContext): any {
    // RooCode prefers elements with additional metadata
    return context.design.elements.map(element => {
      const formattedElement = { ...element };
      
      // Add semantic information if available
      if (context.semantics) {
        const semanticInfo = context.semantics.elements.find(
          semantic => semantic.elementId === element.id
        );
        
        if (semanticInfo) {
          formattedElement.semantic = semanticInfo;
        }
      }
      
      // Add interaction information if available
      if (context.interactions) {
        const interactionInfo = context.interactions.interactions.filter(
          interaction => interaction.elementId === element.id
        );
        
        if (interactionInfo.length > 0) {
          formattedElement.interactions = interactionInfo;
        }
      }
      
      return formattedElement;
    });
  }
  
  /**
   * Inject Model Context into a prompt for RooCode
   * @param context Model Context
   * @param prompt Original prompt
   * @returns Enhanced prompt with context
   */
  injectContext(context: ModelContext, prompt: string): string {
    const formattedContext = this.formatContext(context);
    
    return `
[DESIGN_CONTEXT]
${formattedContext}
[/DESIGN_CONTEXT]

${prompt}
`;
  }
}

/**
 * Cline integration implementation
 */
export class ClineIntegration implements AIModelIntegration {
  /**
   * Get the name of the AI model
   * @returns Model name
   */
  getModelName(): string {
    return "Cline";
  }
  
  /**
   * Format Model Context for Cline
   * @param context Model Context
   * @returns Formatted context string
   */
  formatContext(context: ModelContext): string {
    // Cline prefers a more concise format with specific sections
    const formattedContext = {
      metadata: {
        source: context.metadata.source.type,
        file: context.metadata.source.fileName,
        url: context.metadata.source.url,
      },
      design: {
        elements: this.formatElementsForCline(context),
        colors: this.extractColors(context),
        typography: this.extractTypography(context),
        components: this.extractComponents(context),
      },
    };
    
    return JSON.stringify(formattedContext, null, 2);
  }
  
  /**
   * Format elements for Cline
   * @param context Model Context
   * @returns Formatted elements for Cline
   */
  private formatElementsForCline(context: ModelContext): any[] {
    // Cline prefers a flattened structure with path information
    const result: any[] = [];
    const nodeMap = new Map<string, HierarchyNode>();
    
    // Create node map for quick lookup
    for (const node of context.design.structure.hierarchy) {
      nodeMap.set(node.id, node);
    }
    
    // Process each element
    for (const element of context.design.elements) {
      // Skip document and canvas nodes
      if (element.type === "DOCUMENT" || element.type === "CANVAS") {
        continue;
      }
      
      // Get path to element
      const path = this.getElementPath(element.id, nodeMap);
      
      // Create formatted element
      const formattedElement = {
        id: element.id,
        name: element.name,
        type: element.type,
        path,
        position: element.position,
        style: element.style,
        text: element.text,
      };
      
      result.push(formattedElement);
    }
    
    return result;
  }
  
  /**
   * Get path to element
   * @param elementId Element ID
   * @param nodeMap Node map
   * @returns Path to element
   */
  private getElementPath(elementId: string, nodeMap: Map<string, any>): string {
    const path: string[] = [];
    let currentId = elementId;
    
    while (currentId) {
      const node = nodeMap.get(currentId);
      if (!node) break;
      
      path.unshift(node.name);
      currentId = node.parent;
    }
    
    return path.join(" > ");
  }
  
  /**
   * Extract colors from context
   * @param context Model Context
   * @returns Extracted colors
   */
  private extractColors(context: ModelContext): any[] {
    // Extract colors from styles
    const colors = context.design.styles.colors.map(colorStyle => ({
      name: colorStyle.name,
      value: this.colorToHex(colorStyle.fill.type === "SOLID" 
        ? (colorStyle.fill as any).color 
        : { r: 0, g: 0, b: 0, a: 1 }),
    }));
    
    // Extract colors from variables if available
    if (context.design.variables) {
      const colorVariables = context.design.variables.variables.filter(
        variable => variable.resolvedType === "COLOR"
      );
      
      for (const variable of colorVariables) {
        // Get color from default mode
        const collection = context.design.variables.collections.find(
          c => c.id === variable.variableCollectionId
        );
        
        if (collection) {
          const defaultModeId = collection.defaultModeId;
          const value = variable.valuesByMode[defaultModeId];
          
          if (value && value.type === "COLOR") {
            colors.push({
              name: variable.name,
              value: this.colorToHex(value.value as any),
              isVariable: true,
            });
          }
        }
      }
    }
    
    return colors;
  }
  
  /**
   * Convert color to hex
   * @param color Color object
   * @returns Hex color string
   */
  private colorToHex(color: { r: number; g: number; b: number; a: number }): string {
    const r = Math.round(color.r * 255).toString(16).padStart(2, "0");
    const g = Math.round(color.g * 255).toString(16).padStart(2, "0");
    const b = Math.round(color.b * 255).toString(16).padStart(2, "0");
    
    if (color.a < 1) {
      const a = Math.round(color.a * 255).toString(16).padStart(2, "0");
      return `#${r}${g}${b}${a}`;
    }
    
    return `#${r}${g}${b}`;
  }
  
  /**
   * Extract typography from context
   * @param context Model Context
   * @returns Extracted typography
   */
  private extractTypography(context: ModelContext): any[] {
    // Extract typography from text styles
    return context.design.styles.text.map(textStyle => ({
      name: textStyle.name,
      fontFamily: textStyle.fontFamily,
      fontSize: textStyle.fontSize,
      fontWeight: textStyle.fontWeight,
      lineHeight: textStyle.lineHeight,
      letterSpacing: textStyle.letterSpacing,
    }));
  }
  
  /**
   * Extract components from context
   * @param context Model Context
   * @returns Extracted components
   */
  private extractComponents(context: ModelContext): any[] {
    // Extract components from extensions
    const componentLibrary = context.extensions?.componentLibrary as any;
    
    if (componentLibrary && componentLibrary.components) {
      return componentLibrary.components.map((component: any) => ({
        name: component.name,
        description: component.description,
        thumbnail: component.thumbnailUrl,
      }));
    }
    
    // If no component library, extract from elements
    return context.design.elements
      .filter(element => element.type === "COMPONENT")
      .map(component => ({
        name: component.name,
        id: component.id,
      }));
  }
  
  /**
   * Inject Model Context into a prompt for Cline
   * @param context Model Context
   * @param prompt Original prompt
   * @returns Enhanced prompt with context
   */
  injectContext(context: ModelContext, prompt: string): string {
    const formattedContext = this.formatContext(context);
    
    return `
<design-context>
${formattedContext}
</design-context>

User request: ${prompt}
`;
  }
}

/**
 * Factory for creating AI model integrations
 */
export class AIModelIntegrationFactory {
  /**
   * Create an AI model integration
   * @param modelType Model type
   * @returns AI model integration
   */
  static createIntegration(modelType: "roocode" | "cline"): AIModelIntegration {
    switch (modelType.toLowerCase()) {
      case "roocode":
        return new RooCodeIntegration();
      case "cline":
        return new ClineIntegration();
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }
}
