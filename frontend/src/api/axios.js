import axios from "axios";

export const API_ORIGIN = "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
});

export default api;
