// src/lib/api/client.ts
import { BASE_URL } from '@/constant/BaseURL';

interface RequestConfig extends RequestInit {
    headers?: Record<string, string>;
}

class APIClient {
    private baseURL: string;

    constructor() {
        this.baseURL = BASE_URL || 'http://localhost:8000/api';
        console.log('API Client initialized with baseURL:', this.baseURL);
    }

  private getAuthHeaders(hasBody: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Only add Content-Type for requests with body
    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }    async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Check if request has body
    const hasBody = Boolean(config.body);
    
    const finalConfig: RequestConfig = {
      ...config,
      headers: {
        ...this.getAuthHeaders(hasBody),
        ...config.headers,
      },
    };

    console.log('API Request:', {
      url,
      method: config.method || 'GET',
      headers: finalConfig.headers,
      body: config.body,
      hasBody
    });        try {
            const response = await fetch(url, finalConfig);
            console.log('API Response status:', response.status, response.statusText);

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            console.log('Response content-type:', contentType);

            if (!contentType?.includes('application/json')) {
                const textResponse = await response.text();
                console.log('Non-JSON response:', textResponse);
                throw new Error('Server error: Invalid response format');
            }

            const data = await response.json();
            console.log('Response data:', data);

                if (!response.ok) {
                    console.log('Response not ok:', response.status, data);
                    // Handle 401 Unauthorized - auto logout
                    if (response.status === 401) {
                        this.handleUnauthorized();
                    }

                    // Format backend error message: check common shapes
                    let errMsg = `HTTP error! status: ${response.status}`;
                    if (data) {
                        if (typeof data.message === 'string') errMsg = data.message;
                        else if (typeof data.errors === 'string') errMsg = data.errors;
                        else if (Array.isArray(data.errors) && data.errors.length) errMsg = data.errors.join(', ');
                        else if (typeof data.detail === 'string') errMsg = data.detail;
                        else if (typeof data.error === 'string') errMsg = data.error;
                    }

                    throw new Error(errMsg);
                }

            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);

            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to server. Please check your connection and try again.');
            }

            throw error;
        }
    }

    private handleUnauthorized() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('proto_auth');

            // Redirect to login if not already there
            if (window.location.pathname !== '/auth') {
                window.location.href = '/auth';
            }
        }
    }

    // HTTP Methods
    async get<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', ...config });
    }

    async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
            ...config,
        });
    }

    async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
            ...config,
        });
    }

    async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
            ...config,
        });
    }

    async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE', ...config });
    }
}

export const apiClient = new APIClient();