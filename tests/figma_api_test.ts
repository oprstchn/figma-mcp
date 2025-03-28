/**
 * Figma API Integration Test
 * 
 * Tests for the Figma API client implementation.
 */

import { FigmaClient } from "../src/api/figma_client.ts";
import { FigmaFileAPI } from "../src/api/figma_file_api.ts";
import { FigmaComponentsAPI } from "../src/api/figma_components_api.ts";
import { FigmaCommentsAPI } from "../src/api/figma_comments_api.ts";
import { FigmaWebhooksAPI } from "../src/api/figma_webhooks_api.ts";
import { FigmaVariablesAPI } from "../src/api/figma_variables_api.ts";
import { FigmaAuth } from "../src/auth/figma_auth.ts";

/**
 * Main test function
 */
async function runTests() {
  console.log("=== Figma API Integration Tests ===");
  
  // Test configuration
  const accessToken = Deno.env.get("FIGMA_ACCESS_TOKEN") || "";
  const fileKey = Deno.env.get("FIGMA_TEST_FILE_KEY") || "";
  const teamId = Deno.env.get("FIGMA_TEAM_ID") || "";
  
  if (!accessToken) {
    console.error("Error: FIGMA_ACCESS_TOKEN environment variable is required");
    Deno.exit(1);
  }
  
  if (!fileKey) {
    console.warn("Warning: FIGMA_TEST_FILE_KEY environment variable is not set, some tests will be skipped");
  }
  
  if (!teamId) {
    console.warn("Warning: FIGMA_TEAM_ID environment variable is not set, some tests will be skipped");
  }
  
  // Initialize client
  const client = new FigmaClient({ accessToken });
  
  // Test authentication
  console.log("\n--- Testing Authentication ---");
  try {
    const isValid = await FigmaAuth.validateToken(accessToken);
    console.log(`Token validation: ${isValid ? "Valid" : "Invalid"}`);
    
    if (!isValid) {
      console.error("Error: Invalid access token");
      Deno.exit(1);
    }
  } catch (error) {
    console.error("Error validating token:", error);
    Deno.exit(1);
  }
  
  // Test file API
  if (fileKey) {
    console.log("\n--- Testing File API ---");
    const fileApi = new FigmaFileAPI(client);
    
    try {
      console.log("Getting file...");
      const file = await fileApi.getFile(fileKey);
      console.log(`File name: ${file.name}`);
      console.log(`Document ID: ${file.document.id}`);
      console.log(`Number of canvases: ${file.document.children.length}`);
      
      if (file.document.children.length > 0) {
        const firstCanvas = file.document.children[0];
        console.log(`First canvas name: ${firstCanvas.name}`);
        
        if (firstCanvas.children && firstCanvas.children.length > 0) {
          const nodeIds = [firstCanvas.children[0].id];
          console.log(`Testing getFileNodes with node ID: ${nodeIds[0]}`);
          
          const nodes = await fileApi.getFileNodes(fileKey, nodeIds);
          console.log(`Retrieved ${Object.keys(nodes.nodes).length} nodes`);
          
          console.log("Testing getImage...");
          const images = await fileApi.getImage(fileKey, nodeIds);
          console.log(`Retrieved ${Object.keys(images.images).length} images`);
        }
      }
      
      console.log("Testing getImageFills...");
      const imageFills = await fileApi.getImageFills(fileKey);
      console.log(`Retrieved ${Object.keys(imageFills.images || {}).length} image fills`);
      
    } catch (error) {
      console.error("Error testing File API:", error);
    }
  }
  
  // Test components API
  if (teamId) {
    console.log("\n--- Testing Components API ---");
    const componentsApi = new FigmaComponentsAPI(client);
    
    try {
      console.log("Getting team components...");
      const components = await componentsApi.getTeamComponents(teamId);
      console.log(`Retrieved ${components.meta.components.length} components`);
      
      console.log("Getting team component sets...");
      const componentSets = await componentsApi.getTeamComponentSets(teamId);
      console.log(`Retrieved ${componentSets.meta.component_sets.length} component sets`);
      
      console.log("Getting team styles...");
      const styles = await componentsApi.getTeamStyles(teamId);
      console.log(`Retrieved ${styles.meta.styles.length} styles`);
      
      // Test individual component/style if available
      if (components.meta.components.length > 0) {
        const firstComponent = components.meta.components[0];
        console.log(`Testing getComponent with key: ${firstComponent.key}`);
        
        const component = await componentsApi.getComponent(firstComponent.key);
        console.log(`Retrieved component: ${component.name}`);
      }
      
      if (componentSets.meta.component_sets.length > 0) {
        const firstComponentSet = componentSets.meta.component_sets[0];
        console.log(`Testing getComponentSet with key: ${firstComponentSet.key}`);
        
        const componentSet = await componentsApi.getComponentSet(firstComponentSet.key);
        console.log(`Retrieved component set: ${componentSet.name}`);
      }
      
      if (styles.meta.styles.length > 0) {
        const firstStyle = styles.meta.styles[0];
        console.log(`Testing getStyle with key: ${firstStyle.key}`);
        
        const style = await componentsApi.getStyle(firstStyle.key);
        console.log(`Retrieved style: ${style.name}`);
      }
    } catch (error) {
      console.error("Error testing Components API:", error);
    }
  }
  
  // Test comments API
  if (fileKey) {
    console.log("\n--- Testing Comments API ---");
    const commentsApi = new FigmaCommentsAPI(client);
    
    try {
      console.log("Getting comments...");
      const comments = await commentsApi.getComments(fileKey);
      console.log(`Retrieved ${comments.comments.length} comments`);
      
      // Only test posting comments if explicitly enabled
      const enableCommentCreation = Deno.env.get("ENABLE_COMMENT_CREATION") === "true";
      if (enableCommentCreation) {
        console.log("Testing postComment...");
        const newComment = await commentsApi.postComment(fileKey, {
          message: "Test comment from API integration test",
        });
        console.log(`Created comment with ID: ${newComment.id}`);
        
        // Test reply
        console.log("Testing postCommentReply...");
        const reply = await commentsApi.postCommentReply(
          fileKey,
          newComment.id,
          "Test reply from API integration test"
        );
        console.log(`Created reply with ID: ${reply.id}`);
        
        // Test resolve/unresolve
        console.log("Testing resolveComment...");
        await commentsApi.resolveComment(fileKey, newComment.id);
        console.log("Comment resolved");
        
        console.log("Testing unresolveComment...");
        await commentsApi.unresolveComment(fileKey, newComment.id);
        console.log("Comment unresolved");
        
        // Test delete
        console.log("Testing deleteComment...");
        await commentsApi.deleteComment(fileKey, newComment.id);
        console.log("Comment deleted");
      }
    } catch (error) {
      console.error("Error testing Comments API:", error);
    }
  }
  
  // Test webhooks API
  if (teamId) {
    console.log("\n--- Testing Webhooks API ---");
    const webhooksApi = new FigmaWebhooksAPI(client);
    
    try {
      console.log("Getting webhooks...");
      const webhooks = await webhooksApi.getWebhooks(teamId);
      console.log(`Retrieved ${webhooks.webhooks.length} webhooks`);
      
      // Only test creating webhooks if explicitly enabled
      const enableWebhookCreation = Deno.env.get("ENABLE_WEBHOOK_CREATION") === "true";
      if (enableWebhookCreation) {
        console.log("Testing createWebhook...");
        const newWebhook = await webhooksApi.createWebhook(teamId, {
          event_type: "FILE_UPDATE",
          endpoint: "https://example.com/webhook",
          passcode: "test-passcode",
          description: "Test webhook from API integration test",
        });
        console.log(`Created webhook with ID: ${newWebhook.id}`);
        
        // Test update
        console.log("Testing updateWebhook...");
        const updatedWebhook = await webhooksApi.updateWebhook(newWebhook.id, {
          description: "Updated test webhook",
        });
        console.log(`Updated webhook description: ${updatedWebhook.description}`);
        
        // Test delete
        console.log("Testing deleteWebhook...");
        await webhooksApi.deleteWebhook(newWebhook.id);
        console.log("Webhook deleted");
      }
    } catch (error) {
      console.error("Error testing Webhooks API:", error);
    }
  }
  
  // Test variables API (Enterprise only)
  if (fileKey) {
    console.log("\n--- Testing Variables API (Enterprise only) ---");
    const variablesApi = new FigmaVariablesAPI(client);
    
    try {
      console.log("Getting variables...");
      const variables = await variablesApi.getVariables(fileKey);
      console.log(`Retrieved ${variables.meta.variables.variables.length} variables`);
      console.log(`Retrieved ${variables.meta.variables.collections.length} variable collections`);
      
      // Only test creating variables if explicitly enabled
      const enableVariableCreation = Deno.env.get("ENABLE_VARIABLE_CREATION") === "true";
      if (enableVariableCreation && variables.meta.variables.collections.length > 0) {
        const firstCollection = variables.meta.variables.collections[0];
        
        console.log("Testing createVariable...");
        const newVariable = await variablesApi.createVariable(fileKey, {
          name: "Test Variable",
          variableCollectionId: firstCollection.id,
          resolvedType: "COLOR",
          valuesByMode: {
            [firstCollection.defaultModeId]: {
              type: "COLOR",
              value: { r: 1, g: 0, b: 0, a: 1 },
            },
          },
        });
        console.log(`Created variable with ID: ${newVariable.id}`);
        
        // Test update
        console.log("Testing updateVariable...");
        const updatedVariable = await variablesApi.updateVariable(fileKey, newVariable.id, {
          name: "Updated Test Variable",
        });
        console.log(`Updated variable name: ${updatedVariable.name}`);
        
        // Test delete
        console.log("Testing deleteVariable...");
        await variablesApi.deleteVariable(fileKey, newVariable.id);
        console.log("Variable deleted");
      }
    } catch (error) {
      console.error("Error testing Variables API:", error);
    }
  }
  
  console.log("\n=== Tests Completed ===");
}

// Run tests
if (import.meta.main) {
  runTests();
}
