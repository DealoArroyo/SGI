import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true
});

export default api;
