import { API_ORIGIN } from "../api/axios";

export default function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  // handles '/uploads/xxx' -> 'http://localhost:5000/uploads/xxx'
  return `${API_ORIGIN}${url}`;
}
