interface EnvConfig {
  API_BASE_URL?: string;
  API_BASE_URLS?: string[];
  APP_KEY: string;
  APP_ID: string;
}

export const ENV: Record<string, EnvConfig> = {
  development: {
    API_BASE_URL: 'http://localhost:18080',
    APP_KEY: '9882768ab9183051ea9ce724d1e6b645a0581492a5bbbf9b23ca88a3d8051f7e',
    APP_ID: 'primary'
  },
  production: {
    API_BASE_URLS: [
      'https://api.langbridge1.one',
      'https://langbridge.one/api', // 备用API地址
      // 可以继续添加更多备用地址
    ],
    APP_KEY: '9882768ab9183051ea9ce724d1e6b645a0581492a5bbbf9b23ca88a3d8051f7e',
    APP_ID: 'primary'
  }
}

export const getEnvConfig = (): EnvConfig => {
  return process.env.NODE_ENV === 'production' ? ENV.production : ENV.development
}

// 故障转移API客户端
export class FallbackApiClient {
  private urls: string[];
  private currentIndex = 0;
  private failedUrls = new Set<string>();

  constructor() {
    const config = getEnvConfig();
    this.urls = config.API_BASE_URLS || (config.API_BASE_URL ? [config.API_BASE_URL] : []);
  }

  private async request(url: string, options: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.warn(`API request failed for ${url}:`, error);
      this.failedUrls.add(url);
      throw error;
    }
  }

  async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const maxRetries = this.urls.length;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const currentUrl = this.urls[this.currentIndex];
      const fullUrl = `${currentUrl}${endpoint}`;

      try {
        const response = await this.request(fullUrl, options);
        // 成功请求，重置失败标记
        this.failedUrls.delete(currentUrl);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1} failed for ${fullUrl}`);
        
        // 切换到下一个URL
        this.currentIndex = (this.currentIndex + 1) % this.urls.length;
        
        // 如果所有URL都尝试过了，等待一下再重试
        if (attempt === maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError || new Error('All API endpoints failed');
  }

  // 获取当前活跃的API地址
  getCurrentUrl(): string {
    return this.urls[this.currentIndex];
  }

  // 获取所有失败的URL
  getFailedUrls(): string[] {
    return Array.from(this.failedUrls);
  }

  // 重置失败状态
  reset(): void {
    this.failedUrls.clear();
    this.currentIndex = 0;
  }
}

// 导出单例实例
export const fallbackApiClient = new FallbackApiClient(); 