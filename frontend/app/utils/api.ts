import CryptoJS from 'crypto-js';
import { getEnvConfig, fallbackApiClient } from '../config/env';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

class ApiClient {
  private appKey: string;
  private appId: string;

  constructor() {
    const config = getEnvConfig();
    this.appKey = config.APP_KEY;
    this.appId = config.APP_ID;
  }

  private getHeaders(): HeadersInit {
    const timestamp = Math.floor(Date.now() / 1000); // 秒级时间戳
    const version = '1.0';
    const requestId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const inputString = `${this.appId}${requestId}${timestamp}${version}${this.appKey}`;
    const signature = CryptoJS.SHA256(inputString).toString(CryptoJS.enc.Hex);

    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') ||
              sessionStorage.getItem('token') ||
              Cookies.get('token') ||
              '';
    }
    let teacherToken = '';
    if (typeof window !== 'undefined') {
      teacherToken = localStorage.getItem('teacherToken') ||
              sessionStorage.getItem('teacherToken') ||
              Cookies.get('teacherToken') ||
              '';
    }
    let studentToken = '';
    if (typeof window !== 'undefined') {
      teacherToken = localStorage.getItem('studentToken') ||
              sessionStorage.getItem('studentToken') ||
              Cookies.get('studentToken') ||
              '';
    }

    return {
      'Content-Type': 'application/json',
      'APPID': this.appId,
      'TS': timestamp.toString(),
      'VER': version,
      'SIG': signature,
      'REQUESTID': requestId,
      'XAUTH': token,
      'TAUTH': teacherToken,
      'SAUTH': studentToken
    };
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    let url = endpoint;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    try {
      const response = await fallbackApiClient.fetch(url, {
        ...fetchOptions,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const result = await response.json();
      
      if (result && result.code === 15) {
        if (typeof window !== 'undefined') {
          toast.error(result.msg || 'Please login');
          if (window.location.pathname.startsWith('/tpa')) {
            // 清除老师端缓存
            localStorage.removeItem('teacherToken');
            localStorage.removeItem('teacherInfo');
            localStorage.removeItem('userType');
            localStorage.removeItem('teacherLoginName');
            localStorage.removeItem('teacherRemember');
            sessionStorage.removeItem('teacherToken');
            sessionStorage.removeItem('teacherInfo');
            sessionStorage.removeItem('userType');
            sessionStorage.removeItem('teacherLoginName');
            sessionStorage.removeItem('teacherRemember');
            Cookies.remove('teacherToken', { path: '/' });
            Cookies.remove('teacherInfo', { path: '/' });
            Cookies.remove('userType', { path: '/' });
            Cookies.remove('teacherLoginName', { path: '/' });
            Cookies.remove('teacherRemember', { path: '/' });
            window.location.href = '/tpa/login';
          } else {
            // 清除用户端缓存
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userInfo');
            Cookies.remove('token', { path: '/' });
            Cookies.remove('userInfo', { path: '/' });
            window.location.href = '/login';
          }
        }
        throw new Error(result.msg || 'Please login');
      }
      
      return result;
    } catch (error) {
      // 如果是网络错误，fallbackApiClient已经处理了重试逻辑
      // 这里只需要处理业务逻辑错误
      console.error('API request failed:', error);
      throw error;
    }
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

  // 获取当前活跃的API地址（用于调试）
  public getCurrentApiUrl(): string {
    return fallbackApiClient.getCurrentUrl();
  }

  // 获取失败的API地址列表（用于监控）
  public getFailedApiUrls(): string[] {
    return fallbackApiClient.getFailedUrls();
  }

  // 重置故障转移状态
  public resetFallback(): void {
    fallbackApiClient.reset();
  }
}

export const apiClient = new ApiClient(); 