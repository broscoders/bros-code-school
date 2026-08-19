import axios from "axios";

const platformApi = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/platform",
});

platformApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("platform_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default platformApi;
