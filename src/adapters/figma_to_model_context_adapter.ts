/**
 * Figma to Model Context Adapter
 * 
 * Converts Figma API data to Model Context Protocol format.
 */

import { FigmaClient } from "../api/figma_client.ts";
import { FigmaFileAPI } from "../api/figma_file_api.ts";
import { FigmaComponentsAPI } from "../api/figma_components_api.ts";
import { FigmaVariablesAPI } from "../api/figma_variables_api.ts";
import {
  ModelContext,
  ModelContextProtocol,
  DesignElement,
  HierarchyNode,
  ElementType,
  Fill,
  Stroke,
  Effect,
  TextStyle,
  ColorStyle,
  EffectStyle,
  VariableCollection,
  Variable,
} from "../model/model_context_protocol.ts";

/**
 * Adapter for converting Figma API data to Model Context Protocol
 */
export class FigmaToModelContextAdapter {
  private client: FigmaClient;
  private fileApi: FigmaFileAPI;
  private componentsApi: FigmaComponentsAPI;
  private variablesApi: FigmaVariablesAPI;
  
  /**
   * Creates a new Figma to Model Context adapter
   * @param client Figma API client
   */
  constructor(client: FigmaClient) {
    this.client = client;
    this.fileApi = new FigmaFileAPI(client);
    this.componentsApi = new FigmaComponentsAPI(client);
    this.variablesApi = new FigmaVariablesAPI(client);
  }
  
  /**
   * Convert a Figma file to Model Context
   * @param fileKey Figma file key
   * @param options Conversion options
   * @returns Model Context
   */
  async convertFileToModelContext(
    fileKey: string,
    options: {
      includeStyles?: boolean;
      includeVariables?: boolean;
      includeImages?: boolean;
      teamId?: string; // Required for component library access
    } = {}
  ): Promise<ModelContext> {
    // Get file data
    const figmaFile = await this.fileApi.getFile(fileKey);
    
    // Create empty context
    const context = ModelContextProtocol.createEmptyContext({
      type: "figma",
      fileKey,
      fileName: figmaFile.name,
      lastModified: figmaFile.lastModified,
      url: `https://www.figma.com/file/${fileKey}`,
    });
    
    // Process document structure
    this.processDocumentStructure(context, figmaFile.document);
    
    // Process styles if requested
    if (options.includeStyles) {
      this.processStyles(context, figmaFile.styles);
    }
    
    // Process variables if requested
    if (options.includeVariables) {
      await this.processVariables(context, fileKey);
    }
    
    // Process images if requested
    if (options.includeImages) {
      await this.processImages(context, fileKey);
    }
    
    // Process component library if team ID is provided
    if (options.teamId) {
      await this.processComponentLibrary(context, options.teamId);
    }
    
    return context;
  }
  
  /**
   * Process document structure
   * @param context Model Context to update
   * @param document Figma document
   */
  private processDocumentStructure(context: ModelContext, document: any): void {
    // Set root node
    context.design.structure.root = document.id;
    
    // Process nodes recursively
    const hierarchy: HierarchyNode[] = [];
    const elements: DesignElement[] = [];
    
    this.processNode(document, null, hierarchy, elements);
    
    // Update context
    context.design.structure.hierarchy = hierarchy;
    context.design.elements = elements;
  }
  
  /**
   * Process a node recursively
   * @param node Figma node
   * @param parentId Parent node ID or null for root
   * @param hierarchy Hierarchy array to update
   * @param elements Elements array to update
   */
  private processNode(node: any, parentId: string | null, hierarchy: HierarchyNode[], elements: DesignElement[]): void {
    // Create hierarchy node
    const hierarchyNode: HierarchyNode = {
      id: node.id,
      name: node.name,
      type: this.mapNodeType(node.type),
    };
    
    if (parentId) {
      hierarchyNode.parent = parentId;
    }
    
    if (node.children && node.children.length > 0) {
      hierarchyNode.children = node.children.map((child: any) => child.id);
    }
    
    hierarchy.push(hierarchyNode);
    
    // Create design element
    const element = this.createDesignElement(node);
    elements.push(element);
    
    // Process children recursively
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        this.processNode(child, node.id, hierarchy, elements);
      }
    }
  }
  
  /**
   * Create a design element from a Figma node
   * @param node Figma node
   * @returns Design element
   */
  private createDesignElement(node: any): DesignElement {
    const element: DesignElement = {
      id: node.id,
      name: node.name,
      type: this.mapNodeType(node.type),
      visible: node.visible !== false, // Default to true if not specified
      locked: node.locked === true, // Default to false if not specified
    };
    
    // Add position if available
    if (node.absoluteBoundingBox) {
      element.position = {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      };
      
      if (node.rotation) {
        element.position.rotation = node.rotation;
      }
    }
    
    // Add style if available
    if (node.fills || node.strokes || node.effects) {
      element.style = {};
      
      if (node.fills && node.fills.length > 0) {
        element.style.fills = this.mapFills(node.fills);
      }
      
      if (node.strokes && node.strokes.length > 0) {
        element.style.strokes = this.mapStrokes(node.strokes, node.strokeWeight);
      }
      
      if (node.effects && node.effects.length > 0) {
        element.style.effects = this.mapEffects(node.effects);
      }
      
      if (node.opacity !== undefined) {
        element.style.opacity = node.opacity;
      }
      
      if (node.blendMode) {
        element.style.blendMode = node.blendMode;
      }
    }
    
    // Add text if available
    if (node.type === "TEXT" && node.characters) {
      element.text = {
        characters: node.characters,
        style: this.mapTextStyle(node.style),
      };
    }
    
    // Add component properties if available
    if (node.componentProperties) {
      element.componentProperties = {};
      
      for (const [key, prop] of Object.entries(node.componentProperties)) {
        element.componentProperties[key] = {
          type: (prop as any).type,
          value: (prop as any).value,
          defaultValue: (prop as any).defaultValue,
        };
        
        if ((prop as any).variantOptions) {
          element.componentProperties[key].variantOptions = (prop as any).variantOptions;
        }
      }
    }
    
    // Add constraints if available
    if (node.constraints) {
      element.constraints = {
        horizontal: node.constraints.horizontal,
        vertical: node.constraints.vertical,
      };
    }
    
    // Add layout properties if available
    if (node.layoutMode) {
      element.layoutProperties = {
        layoutMode: node.layoutMode,
      };
      
      if (node.paddingLeft !== undefined) element.layoutProperties.paddingLeft = node.paddingLeft;
      if (node.paddingRight !== undefined) element.layoutProperties.paddingRight = node.paddingRight;
      if (node.paddingTop !== undefined) element.layoutProperties.paddingTop = node.paddingTop;
      if (node.paddingBottom !== undefined) element.layoutProperties.paddingBottom = node.paddingBottom;
      if (node.itemSpacing !== undefined) element.layoutProperties.itemSpacing = node.itemSpacing;
      if (node.counterAxisSizingMode !== undefined) element.layoutProperties.counterAxisSizingMode = node.counterAxisSizingMode;
      if (node.primaryAxisSizingMode !== undefined) element.layoutProperties.primaryAxisSizingMode = node.primaryAxisSizingMode;
      if (node.primaryAxisAlignItems !== undefined) element.layoutProperties.primaryAxisAlignItems = node.primaryAxisAlignItems;
      if (node.counterAxisAlignItems !== undefined) element.layoutProperties.counterAxisAlignItems = node.counterAxisAlignItems;
    }
    
    return element;
  }
  
  /**
   * Map Figma node type to Model Context element type
   * @param figmaType Figma node type
   * @returns Model Context element type
   */
  private mapNodeType(figmaType: string): ElementType {
    switch (figmaType) {
      case "DOCUMENT": return "DOCUMENT";
      case "CANVAS": return "CANVAS";
      case "FRAME": return "FRAME";
      case "GROUP": return "GROUP";
      case "COMPONENT": return "COMPONENT";
      case "INSTANCE": return "INSTANCE";
      case "TEXT": return "TEXT";
      case "VECTOR": return "VECTOR";
      case "RECTANGLE": return "RECTANGLE";
      case "ELLIPSE": return "ELLIPSE";
      case "POLYGON": return "POLYGON";
      case "LINE": return "LINE";
      case "BOOLEAN_OPERATION": return "BOOLEAN_OPERATION";
      case "STAR": return "STAR";
      case "SLICE": return "SLICE";
      default: return "FRAME"; // Default to FRAME for unknown types
    }
  }
  
  /**
   * Map Figma fills to Model Context fills
   * @param figmaFills Figma fills
   * @returns Model Context fills
   */
  private mapFills(figmaFills: any[]): Fill[] {
    return figmaFills
      .filter(fill => fill.visible !== false)
      .map(fill => {
        if (fill.type === "SOLID") {
          return {
            type: "SOLID",
            color: {
              r: fill.color.r,
              g: fill.color.g,
              b: fill.color.b,
              a: fill.opacity || 1,
            },
            opacity: fill.opacity,
          };
        } else if (fill.type.startsWith("GRADIENT_")) {
          return {
            type: fill.type as "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND",
            gradientStops: fill.gradientStops.map((stop: any) => ({
              position: stop.position,
              color: {
                r: stop.color.r,
                g: stop.color.g,
                b: stop.color.b,
                a: stop.color.a || 1,
              },
            })),
            gradientHandlePositions: fill.gradientHandlePositions,
          };
        } else if (fill.type === "IMAGE") {
          return {
            type: "IMAGE",
            scaleMode: fill.scaleMode,
            imageRef: fill.imageRef,
            opacity: fill.opacity,
          };
        }
        
        // Default fallback
        return {
          type: "SOLID",
          color: { r: 0, g: 0, b: 0, a: 1 },
        };
      });
  }
  
  /**
   * Map Figma strokes to Model Context strokes
   * @param figmaStrokes Figma strokes
   * @param strokeWeight Stroke weight
   * @returns Model Context strokes
   */
  private mapStrokes(figmaStrokes: any[], strokeWeight: number): Stroke[] {
    return figmaStrokes
      .filter(stroke => stroke.visible !== false)
      .map(stroke => {
        const baseStroke: Stroke = {
          type: stroke.type,
          weight: strokeWeight,
        };
        
        if (stroke.type === "SOLID") {
          baseStroke.color = {
            r: stroke.color.r,
            g: stroke.color.g,
            b: stroke.color.b,
            a: stroke.opacity || 1,
          };
        } else if (stroke.type.startsWith("GRADIENT_")) {
          baseStroke.gradientStops = stroke.gradientStops.map((stop: any) => ({
            position: stop.position,
            color: {
              r: stop.color.r,
              g: stop.color.g,
              b: stop.color.b,
              a: stop.color.a || 1,
            },
          }));
        }
        
        if (stroke.opacity !== undefined) {
          baseStroke.opacity = stroke.opacity;
        }
        
        if (stroke.dashPattern) {
          baseStroke.dashPattern = stroke.dashPattern;
        }
        
        if (stroke.cap) {
          baseStroke.cap = stroke.cap;
        }
        
        if (stroke.join) {
          baseStroke.join = stroke.join;
        }
        
        if (stroke.miterLimit) {
          baseStroke.miterLimit = stroke.miterLimit;
        }
        
        return baseStroke;
      });
  }
  
  /**
   * Map Figma effects to Model Context effects
   * @param figmaEffects Figma effects
   * @returns Model Context effects
   */
  private mapEffects(figmaEffects: any[]): Effect[] {
    return figmaEffects
      .filter(effect => effect.visible !== false)
      .map(effect => {
        const baseEffect: Effect = {
          type: effect.type,
          visible: effect.visible !== false,
          radius: effect.radius,
        };
        
        if (effect.color) {
          baseEffect.color = {
            r: effect.color.r,
            g: effect.color.g,
            b: effect.color.b,
            a: effect.color.a || 1,
          };
        }
        
        if (effect.offset) {
          baseEffect.offset = {
            x: effect.offset.x,
            y: effect.offset.y,
          };
        }
        
        if (effect.spread !== undefined) {
          baseEffect.spread = effect.spread;
        }
        
        return baseEffect;
      });
  }
  
  /**
   * Map Figma text style to Model Context text style
   * @param figmaStyle Figma text style
   * @returns Model Context text style
   */
  private mapTextStyle(figmaStyle: any): TextStyle {
    const textStyle: TextStyle = {
      fontFamily: figmaStyle.fontFamily,
      fontWeight: figmaStyle.fontWeight,
      fontSize: figmaStyle.fontSize,
      letterSpacing: figmaStyle.letterSpacing,
      lineHeight: figmaStyle.lineHeight,
      paragraphSpacing: figmaStyle.paragraphSpacing,
      textCase: figmaStyle.textCase || "ORIGINAL",
      textDecoration: figmaStyle.textDecoration || "NONE",
      textAlignHorizontal: figmaStyle.textAlignHorizontal || "LEFT",
      textAlignVertical: figmaStyle.textAlignVertical || "TOP",
      fills: this.mapFills(figmaStyle.fills || []),
    };
    
    return textStyle;
  }
  
  /**
   * Process styles from Figma file
   * @param context Model Context to update
   * @param styles Figma styles
   */
  private processStyles(context: ModelContext, styles: Record<string, any>): void {
    for (const [id, style] of Object.entries(styles)) {
      const styleType = style.styleType;
      
      if (styleType === "FILL") {
        const colorStyle: ColorStyle = {
          id,
          name: style.name,
          description: style.description,
          fill: this.mapFills([style.style])[0],
        };
        
        context.design.styles.colors.push(colorStyle);
      } else if (styleType === "TEXT") {
        const textStyle: TextStyle = {
          id,
          name: style.name,
          description: style.description,
          ...this.mapTextStyle(style.style),
        };
        
        context.design.styles.text.push(textStyle);
      } else if (styleType === "EFFECT") {
        const effectStyle: EffectStyle = {
          id,
          name: style.name,
          description: style.description,
          effects: this.mapEffects(style.style.effects || []),
        };
        
        context.design.styles.effects.push(effectStyle);
      }
      // Grid styles are not directly accessible from the file response
    }
  }
  
  /**
   * Process variables from Figma file
   * @param context Model Context to update
   * @param fileKey Figma file key
   */
  private async processVariables(context: ModelContext, fileKey: string): Promise<void> {
    try {
      const variablesResponse = await this.variablesApi.getVariables(fileKey);
      
      if (variablesResponse.error) {
        console.warn("Failed to get variables:", variablesResponse.status);
        return;
      }
      
      const collections: VariableCollection[] = variablesResponse.meta.variables.collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        key: collection.key,
        modes: collection.modes,
        defaultModeId: collection.defaultModeId,
      }));
      
      const variables: Variable[] = variablesResponse.meta.variables.variables.map(variable => ({
        id: variable.id,
        name: variable.name,
        key: variable.key,
        variableCollectionId: variable.variableCollectionId,
        resolvedType: variable.resolvedType,
        valuesByMode: variable.valuesByMode,
        description: variable.description,
        scopes: variable.scopes,
      }));
      
      context.design.variables = {
        collections,
        variables,
      };
    } catch (error) {
      console.warn("Error processing variables:", error);
    }
  }
  
  /**
   * Process images from Figma file
   * @param context Model Context to update
   * @param fileKey Figma file key
   */
  private async processImages(context: ModelContext, fileKey: string): Promise<void> {
    try {
      // Get image fills
      const imageFills = await this.fileApi.getImageFills(fileKey);
      
      if (imageFills.err) {
        console.warn("Failed to get image fills:", imageFills.err);
        return;
      }
      
      // Find elements with image fills
      const elementsWithImages = context.design.elements.filter(element => 
        element.style?.fills?.some(fill => fill.type === "IMAGE")
      );
      
      // Create asset references
      const images = [];
      
      for (const element of elementsWithImages) {
        const imageFills = element.style!.fills!.filter(fill => fill.type === "IMAGE") as any[];
        
        for (const fill of imageFills) {
          const imageRef = fill.imageRef;
          const imageUrl = imageFills.images[imageRef];
          
          if (imageUrl) {
            images.push({
              id: imageRef,
              name: `Image from ${element.name}`,
              url: imageUrl,
              format: imageUrl.split('.').pop() || "png",
              dimensions: {
                width: element.position?.width || 0,
                height: element.position?.height || 0,
              },
              elementIds: [element.id],
            });
          }
        }
      }
      
      if (images.length > 0) {
        if (!context.assets) {
          context.assets = {
            images,
            icons: [],
            fonts: [],
          };
        } else {
          context.assets.images = images;
        }
      }
    } catch (error) {
      console.warn("Error processing images:", error);
    }
  }
  
  /**
   * Process component library
   * @param context Model Context to update
   * @param teamId Figma team ID
   */
  private async processComponentLibrary(context: ModelContext, teamId: string): Promise<void> {
    try {
      // Get team components
      const components = await this.componentsApi.getTeamComponents(teamId);
      
      if (components.error) {
        console.warn("Failed to get team components:", components.status);
        return;
      }
      
      // Add component information to extensions
      ModelContextProtocol.addExtension(context, "componentLibrary", {
        teamId,
        components: components.meta.components.map(component => ({
          key: component.key,
          name: component.name,
          description: component.description,
          thumbnailUrl: component.thumbnail_url,
          fileKey: component.file_key,
          nodeId: component.node_id,
          componentSetId: component.component_set_id,
        })),
      });
    } catch (error) {
      console.warn("Error processing component library:", error);
    }
  }
}
