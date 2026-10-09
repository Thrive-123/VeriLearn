
import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
});

// Add the JWT token to authenticated requests.
// Do not set a global Content-Type header here;
// Axios must handle FormData uploads automatically.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
