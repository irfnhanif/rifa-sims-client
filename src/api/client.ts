import API_CONFIG from "../config/api";

export const apiClient = {
  get: async (url: string, params?: URLSearchParams) => {
    let fullUrl = `${API_CONFIG.BASE_URL}${url}`;

    if (params && params.toString()) {
      fullUrl += `?${params.toString()}`;
    }

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: API_CONFIG.DEFAULT_HEADERS,
    });
    return response;
  },

  post: async (url: string, data: unknown) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
      method: "POST",
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });
    return response;
  },

  put: async (url: string, data: unknown) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
      method: "PUT",
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });
    return response;
  },

  patch: async (url: string, data: unknown) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
      method: "PATCH",
      headers: API_CONFIG.DEFAULT_HEADERS,
      body: JSON.stringify(data),
    });
    return response;
  },

  delete: async (url: string) => {
    const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
      method: "DELETE",
      headers: API_CONFIG.DEFAULT_HEADERS,
    });
    return response;
  },
};
