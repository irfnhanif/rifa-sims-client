class ApiConfig {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_API_BASE_URL;
    this.token = this.getStoredToken();
  }

  private getStoredToken(): string | null {
    return (
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token")
    );
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem("access_token", token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("access_token");
  }

  getToken(): string | null {
    return this.token || this.getStoredToken();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    return headers;
  }
}

const apiConfig = new ApiConfig();
export default apiConfig;
