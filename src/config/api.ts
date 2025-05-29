const BEARER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJFTVBMT1lFRSJdLCJzdWIiOiJhY2NlcHRlZGVtcCIsImlhdCI6MTc0ODQ4OTQ0NywiZXhwIjoxNzQ4NTc1ODQ3fQ.uKcO2i6Sgb41DTjMJV7Jq5wL0uhE_iCbqFiWYCqCPV8";

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${BEARER_TOKEN}`,
  },
} as const;

export default API_CONFIG;
