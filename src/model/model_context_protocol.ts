/**
 * Model Context Protocol Core
 * 
 * Core implementation of the Model Context Protocol for sharing design context
 * between Figma and AI models like RooCode and Cline.
 */

// Type definitions for Model Context Protocol

// Metadata
export interface ContextMetadata {
  version: string;
  source: {
    type: "figma";
    fileKey: string;
    fileName: string;
    lastModified: string;
    url?: string;
  };
  timestamp: string;
  generator: string;
}

// Design Structure
export type ElementType = 
  | "DOCUMENT"
  | "CANVAS"
  | "FRAME"
  | "GROUP"
  | "COMPONENT"
  | "INSTANCE"
  | "TEXT"
  | "VECTOR"
  | "RECTANGLE"
  | "ELLIPSE"
  | "POLYGON"
  | "LINE"
  | "BOOLEAN_OPERATION"
  | "STAR"
  | "SLICE";

export interface HierarchyNode {
  id: string;
  name: string;
  type: ElementType;
  children?: string[]; // 子要素のID配列
  parent?: string; // 親要素のID
}

export interface DesignStructure {
  root: string; // ルート要素のID
  hierarchy: HierarchyNode[];
}

// Design Elements
export type BlendMode = 
  | "NORMAL"
  | "MULTIPLY"
  | "SCREEN"
  | "OVERLAY"
  | "DARKEN"
  | "LIGHTEN"
  | "COLOR_DODGE"
  | "COLOR_BURN"
  | "HARD_LIGHT"
  | "SOFT_LIGHT"
  | "DIFFERENCE"
  | "EXCLUSION"
  | "HUE"
  | "SATURATION"
  | "COLOR"
  | "LUMINOSITY";

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface GradientStop {
  position: number;
  color: Color;
}

export interface GradientPaint {
  type: "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND";
  gradientStops: GradientStop[];
  gradientHandlePositions: [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number }
  ];
}

export interface SolidPaint {
  type: "SOLID";
  color: Color;
  opacity?: number;
}

export interface ImagePaint {
  type: "IMAGE";
  scaleMode: "FILL" | "FIT" | "CROP" | "TILE";
  imageRef: string;
  opacity?: number;
}

export type Fill = SolidPaint | GradientPaint | ImagePaint;

export interface Stroke {
  type: "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND";
  color?: Color;
  gradientStops?: GradientStop[];
  opacity?: number;
  weight: number;
  dashPattern?: number[];
  cap?: "NONE" | "ROUND" | "SQUARE" | "ARROW_LINES" | "ARROW_EQUILATERAL";
  join?: "MITER" | "BEVEL" | "ROUND";
  miterLimit?: number;
}

export interface Effect {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  visible: boolean;
  radius: number;
  color?: Color;
  offset?: { x: number; y: number };
  spread?: number;
}

export interface TextStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number | { value: number; unit: "PIXELS" | "PERCENT" };
  paragraphSpacing: number;
  textCase: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
  textDecoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
  textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  textAlignVertical: "TOP" | "CENTER" | "BOTTOM";
  fills: Fill[];
}

export interface ComponentProperty {
  type: string;
  value: unknown;
  defaultValue: unknown;
  variantOptions?: string[];
}

export interface Constraints {
  horizontal: "LEFT" | "RIGHT" | "CENTER" | "SCALE" | "STRETCH";
  vertical: "TOP" | "BOTTOM" | "CENTER" | "SCALE" | "STRETCH";
}

export interface LayoutProperties {
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  counterAxisSizingMode?: "FIXED" | "AUTO";
  primaryAxisSizingMode?: "FIXED" | "AUTO";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
}

export interface DesignElement {
  id: string;
  name: string;
  type: ElementType;
  visible: boolean;
  locked: boolean;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };
  style?: {
    fills?: Fill[];
    strokes?: Stroke[];
    effects?: Effect[];
    opacity?: number;
    blendMode?: BlendMode;
  };
  text?: {
    characters: string;
    style: TextStyle;
  };
  componentProperties?: Record<string, ComponentProperty>;
  constraints?: Constraints;
  layoutProperties?: LayoutProperties;
  [key: string]: unknown; // 拡張プロパティ
}

// Design Styles
export interface ColorStyle {
  id: string;
  name: string;
  description?: string;
  fill: Fill;
}

export interface TextStyle {
  id: string;
  name: string;
  description?: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number | { value: number; unit: "PIXELS" | "PERCENT" };
  paragraphSpacing: number;
  fills: Fill[];
}

export interface EffectStyle {
  id: string;
  name: string;
  description?: string;
  effects: Effect[];
}

export interface GridStyle {
  id: string;
  name: string;
  description?: string;
  pattern: "COLUMNS" | "ROWS" | "GRID";
  sectionSize: number;
  gutterSize?: number;
  alignment: "MIN" | "MAX" | "CENTER" | "STRETCH";
  count: number;
  color: Color;
}

export interface DesignStyles {
  colors: ColorStyle[];
  text: TextStyle[];
  effects: EffectStyle[];
  grids: GridStyle[];
}

// Design Variables
export interface VariableMode {
  modeId: string;
  name: string;
}

export interface VariableCollection {
  id: string;
  name: string;
  key: string;
  modes: VariableMode[];
  defaultModeId: string;
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
  description?: string;
  scopes?: string[];
}

export interface DesignVariables {
  collections: VariableCollection[];
  variables: Variable[];
}

export interface DesignContext {
  structure: DesignStructure;
  elements: DesignElement[];
  styles: DesignStyles;
  variables?: DesignVariables;
}

// Semantic Context
export interface AccessibilityInfo {
  role: string;
  label?: string;
  description?: string;
  keyboardShortcut?: string;
}

export interface SemanticElement {
  elementId: string;
  role: string; // "header", "button", "navigation", "content", etc.
  importance: "primary" | "secondary" | "tertiary";
  state?: string[]; // "hover", "pressed", "disabled", etc.
  accessibility?: AccessibilityInfo;
}

export interface SemanticRelationship {
  type: "contains" | "connects" | "references" | "depends-on";
  sourceId: string;
  targetId: string;
  description?: string;
}

export interface SemanticAnnotation {
  elementId: string;
  text: string;
  author?: string;
  timestamp?: string;
}

export interface SemanticContext {
  elements: SemanticElement[];
  relationships: SemanticRelationship[];
  annotations: SemanticAnnotation[];
}

// Interaction Context
export interface FlowStep {
  id: string;
  name: string;
  elementId: string;
  nextSteps?: string[]; // 次のステップのID配列
  conditions?: string[];
}

export interface UserFlow {
  id: string;
  name: string;
  description?: string;
  steps: FlowStep[];
}

export interface ElementInteraction {
  elementId: string;
  type: "click" | "hover" | "drag" | "input" | "scroll";
  response: {
    type: "navigate" | "toggle" | "expand" | "submit" | "custom";
    target?: string; // ターゲット要素のID
    action?: string;
  };
}

export interface Transition {
  sourceId: string;
  targetId: string;
  trigger: string;
  animation?: {
    type: string;
    duration: number;
    easing: string;
  };
}

export interface InteractionContext {
  flows: UserFlow[];
  interactions: ElementInteraction[];
  transitions: Transition[];
}

// Asset References
export interface ImageAsset {
  id: string;
  name: string;
  url: string;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  elementIds: string[]; // この画像を使用する要素のID配列
}

export interface IconAsset {
  id: string;
  name: string;
  url: string;
  format: string;
  elementIds: string[]; // このアイコンを使用する要素のID配列
}

export interface FontAsset {
  family: string;
  style: string;
  url?: string;
  elementIds: string[]; // このフォントを使用する要素のID配列
}

export interface AssetReferences {
  images: ImageAsset[];
  icons: IconAsset[];
  fonts: FontAsset[];
}

// Main Model Context
export interface ModelContext {
  metadata: ContextMetadata;
  design: DesignContext;
  semantics?: SemanticContext;
  interactions?: InteractionContext;
  assets?: AssetReferences;
  extensions?: Record<string, unknown>;
}

/**
 * Model Context Protocol Core Class
 */
export class ModelContextProtocol {
  /**
   * Create a new empty Model Context
   * @param source Source information
   * @returns Empty Model Context
   */
  static createEmptyContext(source: {
    type: "figma";
    fileKey: string;
    fileName: string;
    lastModified: string;
    url?: string;
  }): ModelContext {
    return {
      metadata: {
        version: "1.0.0",
        source,
        timestamp: new Date().toISOString(),
        generator: "model-context-protocol",
      },
      design: {
        structure: {
          root: "",
          hierarchy: [],
        },
        elements: [],
        styles: {
          colors: [],
          text: [],
          effects: [],
          grids: [],
        },
      },
    };
  }

  /**
   * Validate a Model Context
   * @param context Model Context to validate
   * @returns Validation result
   */
  static validateContext(context: ModelContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!context.metadata) {
      errors.push("Missing metadata");
    } else {
      if (!context.metadata.version) errors.push("Missing metadata.version");
      if (!context.metadata.source) errors.push("Missing metadata.source");
      if (!context.metadata.timestamp) errors.push("Missing metadata.timestamp");
      if (!context.metadata.generator) errors.push("Missing metadata.generator");
    }

    if (!context.design) {
      errors.push("Missing design");
    } else {
      if (!context.design.structure) errors.push("Missing design.structure");
      if (!context.design.elements) errors.push("Missing design.elements");
      if (!context.design.styles) errors.push("Missing design.styles");
    }

    // Check structure consistency
    if (context.design?.structure) {
      const { root, hierarchy } = context.design.structure;
      
      // Check if root exists in hierarchy
      if (root && !hierarchy.some(node => node.id === root)) {
        errors.push(`Root node ${root} not found in hierarchy`);
      }

      // Check parent-child consistency
      const nodeMap = new Map<string, HierarchyNode>();
      hierarchy.forEach(node => nodeMap.set(node.id, node));

      hierarchy.forEach(node => {
        // Check if parent exists
        if (node.parent && !nodeMap.has(node.parent)) {
          errors.push(`Parent ${node.parent} of node ${node.id} not found in hierarchy`);
        }

        // Check if children exist
        if (node.children) {
          node.children.forEach(childId => {
            if (!nodeMap.has(childId)) {
              errors.push(`Child ${childId} of node ${node.id} not found in hierarchy`);
            }
          });
        }
      });
    }

    // Check element references
    if (context.design?.elements && context.design?.structure) {
      const elementIds = new Set(context.design.elements.map(el => el.id));
      const hierarchyIds = new Set(context.design.structure.hierarchy.map(node => node.id));

      // Check if all elements are in hierarchy
      elementIds.forEach(id => {
        if (!hierarchyIds.has(id)) {
          errors.push(`Element ${id} not found in hierarchy`);
        }
      });

      // Check if all hierarchy nodes have elements
      hierarchyIds.forEach(id => {
        if (!elementIds.has(id)) {
          errors.push(`Hierarchy node ${id} has no corresponding element`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Serialize a Model Context to JSON
   * @param context Model Context to serialize
   * @returns JSON string
   */
  static serializeContext(context: ModelContext): string {
    return JSON.stringify(context, null, 2);
  }

  /**
   * Parse a JSON string to Model Context
   * @param json JSON string
   * @returns Model Context
   */
  static parseContext(json: string): ModelContext {
    return JSON.parse(json) as ModelContext;
  }

  /**
   * Find an element by ID in a Model Context
   * @param context Model Context
   * @param id Element ID
   * @returns Element or undefined if not found
   */
  static findElementById(context: ModelContext, id: string): DesignElement | undefined {
    return context.design.elements.find(element => element.id === id);
  }

  /**
   * Find elements by name in a Model Context
   * @param context Model Context
   * @param name Element name
   * @returns Array of matching elements
   */
  static findElementsByName(context: ModelContext, name: string): DesignElement[] {
    return context.design.elements.filter(element => element.name === name);
  }

  /**
   * Find elements by type in a Model Context
   * @param context Model Context
   * @param type Element type
   * @returns Array of matching elements
   */
  static findElementsByType(context: ModelContext, type: ElementType): DesignElement[] {
    return context.design.elements.filter(element => element.type === type);
  }

  /**
   * Get children of an element
   * @param context Model Context
   * @param id Parent element ID
   * @returns Array of child elements
   */
  static getElementChildren(context: ModelContext, id: string): DesignElement[] {
    const node = context.design.structure.hierarchy.find(node => node.id === id);
    if (!node || !node.children || node.children.length === 0) {
      return [];
    }
    
    return context.design.elements.filter(element => node.children!.includes(element.id));
  }

  /**
   * Get parent of an element
   * @param context Model Context
   * @param id Child element ID
   * @returns Parent element or undefined if not found
   */
  static getElementParent(context: ModelContext, id: string): DesignElement | undefined {
    const node = context.design.structure.hierarchy.find(node => node.id === id);
    if (!node || !node.parent) {
      return undefined;
    }
    
    return context.design.elements.find(element => element.id === node.parent);
  }

  /**
   * Get semantic information for an element
   * @param context Model Context
   * @param id Element ID
   * @returns Semantic element or undefined if not found
   */
  static getElementSemantics(context: ModelContext, id: string): SemanticElement | undefined {
    if (!context.semantics) {
      return undefined;
    }
    
    return context.semantics.elements.find(semantic => semantic.elementId === id);
  }

  /**
   * Get interactions for an element
   * @param context Model Context
   * @param id Element ID
   * @returns Array of element interactions
   */
  static getElementInteractions(context: ModelContext, id: string): ElementInteraction[] {
    if (!context.interactions) {
      return [];
    }
    
    return context.interactions.interactions.filter(interaction => interaction.elementId === id);
  }

  /**
   * Add an extension to the Model Context
   * @param context Model Context
   * @param name Extension name
   * @param data Extension data
   * @returns Updated Model Context
   */
  static addExtension(context: ModelContext, name: string, data: unknown): ModelContext {
    if (!context.extensions) {
      context.extensions = {};
    }
    
    context.extensions[name] = data;
    return context;
  }

  /**
   * Get an extension from the Model Context
   * @param context Model Context
   * @param name Extension name
   * @returns Extension data or undefined if not found
   */
  static getExtension(context: ModelContext, name: string): unknown | undefined {
    if (!context.extensions) {
      return undefined;
    }
    
    return context.extensions[name];
  }
}
