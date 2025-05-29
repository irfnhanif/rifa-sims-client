const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${BEARER_TOKEN}`,
  },
} as const;

export default API_CONFIG;
