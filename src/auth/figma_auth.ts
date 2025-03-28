/**
 * Figma Authentication Module
 * 
 * Implementation of authentication methods for Figma API.
 * Supports both personal access tokens and OAuth2.
 */

// Type definitions for authentication
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
}

export interface OAuth2TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Class for handling Figma API authentication
 */
export class FigmaAuth {
  private static readonly OAUTH_BASE_URL = "https://www.figma.com/oauth";
  private static readonly DEFAULT_SCOPES = ["files:read"];
  
  /**
   * Generate a personal access token URL
   * @returns URL to generate a personal access token
   */
  static getPersonalAccessTokenUrl(): string {
    return "https://www.figma.com/settings/user-profile/personal-access-tokens";
  }
  
  /**
   * Generate an OAuth2 authorization URL
   * @param config OAuth2 configuration
   * @returns Authorization URL to redirect the user to
   */
  static getOAuth2AuthorizationUrl(config: OAuth2Config): string {
    const scopes = config.scope || this.DEFAULT_SCOPES;
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: scopes.join(" "),
      response_type: "code",
      state: crypto.randomUUID(), // Generate a random state for CSRF protection
    });
    
    return `${this.OAUTH_BASE_URL}?${params.toString()}`;
  }
  
  /**
   * Exchange an authorization code for an access token
   * @param config OAuth2 configuration
   * @param code Authorization code from the redirect
   * @returns OAuth2 token response
   */
  static async exchangeCodeForToken(
    config: OAuth2Config,
    code: string
  ): Promise<OAuth2TokenResponse> {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
      grant_type: "authorization_code",
    });
    
    const response = await fetch(`${this.OAUTH_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`OAuth2 token exchange error: ${errorData.message || "Unknown error"}`);
    }
    
    return await response.json() as OAuth2TokenResponse;
  }
  
  /**
   * Refresh an OAuth2 access token
   * @param config OAuth2 configuration
   * @param refreshToken Refresh token
   * @returns New OAuth2 token response
   */
  static async refreshToken(
    config: OAuth2Config,
    refreshToken: string
  ): Promise<OAuth2TokenResponse> {
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });
    
    const response = await fetch(`${this.OAUTH_BASE_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`OAuth2 token refresh error: ${errorData.message || "Unknown error"}`);
    }
    
    return await response.json() as OAuth2TokenResponse;
  }
  
  /**
   * Validate an access token by making a test API call
   * @param accessToken Access token to validate
   * @returns Whether the token is valid
   */
  static async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.figma.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
