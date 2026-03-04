import axios from "axios";

const rawBaseURL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api"
).trim();

const baseURL =
  rawBaseURL.startsWith("http") &&
  !/\/api\/?$/.test(rawBaseURL)
    ? `${rawBaseURL.replace(/\/+$/, "")}/api`
    : rawBaseURL;

const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
