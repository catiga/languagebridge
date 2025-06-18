import CryptoJS from 'crypto-js';
import { getEnvConfig } from '../config/env';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

class ApiClient {
  private baseUrl: string;
  private appKey: string;
  private appId: string;

  constructor() {
    const config = getEnvConfig();
    this.baseUrl = config.API_BASE_URL;
    this.appKey = config.APP_KEY;
    this.appId = config.APP_ID;
  }

  private getHeaders(): HeadersInit {
    const timestamp = Math.floor(Date.now() / 1000); // 秒级时间戳
    const version = '1.0';
    const requestId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const inputString = `${this.appId}${requestId}${timestamp}${version}${this.appKey}`;
    const signature = CryptoJS.SHA256(inputString).toString(CryptoJS.enc.Hex);

    return {
      'Content-Type': 'application/json',
      'APPID': this.appId,
      'TS': timestamp.toString(),
      'VER': version,
      'SIG': signature,
      'REQUESTID': requestId
    };
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  public async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  public async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(); 