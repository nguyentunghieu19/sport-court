import axios from "axios";

const baseURL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const publicApiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export default publicApiClient;