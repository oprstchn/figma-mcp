/**
 * Figma API Client
 * 
 * A client for interacting with the Figma API using Deno's standard library.
 * This implementation avoids external dependencies as requested.
 */

export interface FigmaClientConfig {
  /** Figma API base URL */
  baseUrl?: string;
  /** Figma API access token */
  accessToken?: string;
  /** Default request timeout in milliseconds */
  timeout?: number;
}

export interface RequestOptions {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Path to append to base URL */
  path: string;
  /** Query parameters */
  params?: Record<string, string>;
  /** Request body for POST/PUT requests */
  body?: unknown;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Main Figma API client class
 */
export class FigmaClient {
  private baseUrl: string;
  private accessToken: string | undefined;
  private timeout: number;

  /**
   * Creates a new Figma API client
   * @param config Client configuration
   */
  constructor(config: FigmaClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://api.figma.com/v1';
    this.accessToken = config.accessToken;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Sets the access token for authentication
   * @param token Figma API access token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Makes a request to the Figma API
   * @param options Request options
   * @returns Response data
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, params, body, headers = {}, timeout = this.timeout } = options;
    
    // Build URL with query parameters
    let url = `${this.baseUrl}${path}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        searchParams.append(key, value);
      }
      url += `?${searchParams.toString()}`;
    }

    // Set up headers
    const requestHeaders = new Headers(headers);
    
    // Add authorization header if access token is available
    if (this.accessToken) {
      requestHeaders.set('Authorization', `Bearer ${this.accessToken}`);
    }
    
    // Add content-type for requests with body
    if (body) {
      requestHeaders.set('Content-Type', 'application/json');
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestOptions.signal = controller.signal;

    try {
      // Make the request
      const response = await fetch(url, requestOptions);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Figma API error (${response.status}): ${errorData.message || 'Unknown error'}`);
      }
      
      // Parse and return response
      return await response.json() as T;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Helper method for GET requests
   * @param path API endpoint path
   * @param params Query parameters
   * @returns Response data
   */
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>({
      method: 'GET',
      path,
      params,
    });
  }

  /**
   * Helper method for POST requests
   * @param path API endpoint path
   * @param body Request body
   * @param params Query parameters
   * @returns Response data
   */
  async post<T>(path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
    return this.request<T>({
      method: 'POST',
      path,
      body,
      params,
    });
  }

  /**
   * Helper method for PUT requests
   * @param path API endpoint path
   * @param body Request body
   * @param params Query parameters
   * @returns Response data
   */
  async put<T>(path: string, body?: unknown, params?: Record<string, string>): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      path,
      body,
      params,
    });
  }

  /**
   * Helper method for DELETE requests
   * @param path API endpoint path
   * @param params Query parameters
   * @returns Response data
   */
  async delete<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      path,
      params,
    });
  }
}
