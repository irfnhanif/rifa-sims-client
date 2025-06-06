import apiConfig from "../config/api";

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = apiConfig.getBaseUrl();
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...apiConfig.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
      apiConfig.clearToken();
      window.location.href = "/auth/login";
    }

    return response;
  }

  async get(endpoint: string, params?: URLSearchParams): Promise<Response> {
    const url = params ? `${endpoint}?${params.toString()}` : endpoint;
    return this.request(url, { method: "GET" });
  }

  async post(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
