// src/axiosInstance.ts
// src/axiosInstance.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

const axiosInstance: AxiosInstance = axios.create({
    baseURL: BACKEND_URL,
    timeout: 10000, // Устанавливаем таймаут в 10 секунд
    headers: {
        "Content-Type": "application/json",
    },
});

// Интерсептор запросов
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Расширяем интерфейс InternalAxiosRequestConfig
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// Интерсептор ответов
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Здесь можно реализовать логику обновления токена
                const newToken = await refreshToken();
                localStorage.setItem("token", newToken);
                if (originalRequest.headers) {
                    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                }
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Если не удалось обновить токен, выполняем выход пользователя
                localStorage.removeItem("token");
                window.location.href = "/login"; // Перенаправляем на страницу входа
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Функция для обновления токена (нужно реализовать)
async function refreshToken(): Promise<string> {
    // Здесь должна быть логика обновления токена
    // Например, запрос к серверу для получения нового токена
    throw new Error("Функция обновления токена не реализована");
}

export default axiosInstance;