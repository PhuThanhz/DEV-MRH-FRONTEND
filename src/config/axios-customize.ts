import type { IBackendRes } from "@/types/backend";
import axios from "axios";
import { Mutex } from "async-mutex";
import { store } from "@/redux/store";
import { setRefreshTokenAction } from "@/redux/slice/accountSlide";
import { notification } from "antd";

interface AccessTokenResponse {
    access_token: string;
}


const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL as string,
    withCredentials: true,
});

const mutex = new Mutex();
const NO_RETRY_HEADER = "x-no-retry";


const isAuthEndpoint = (url?: string) => {
    if (!url) return false;
    return (
        url === "/api/v1/auth/login" ||
        url === "/api/v1/auth/refresh"
    );
};

const handleRefreshToken = async (): Promise<string | null> => {
    return mutex.runExclusive(async () => {
        try {
            const res = await instance.post<IBackendRes<AccessTokenResponse>>(
                "/api/v1/auth/refresh",
                null, // body rỗng
                {
                    headers: {
                        [NO_RETRY_HEADER]: "true",
                    },
                }
            );

            return res?.data?.access_token ?? null;
        } catch {
            return null;
        }
    });
};


instance.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("access_token");

    if (
        accessToken &&
        !isAuthEndpoint(config.url) &&
        !config.headers?.[NO_RETRY_HEADER]
    ) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (!config.headers.Accept) {
        config.headers.Accept = "application/json";
    }

    return config;
});


instance.interceptors.response.use(
    (res) => {
        // download file
        if (res.config.responseType === "blob") {
            return res;
        }
        return res.data;
    },
    async (error) => {
        const originalRequest = error.config;

        if (
            originalRequest &&
            error.response?.status === 401 &&
            !isAuthEndpoint(originalRequest.url) &&
            !originalRequest.headers?.[NO_RETRY_HEADER]
        ) {
            const newAccessToken = await handleRefreshToken();

            originalRequest.headers[NO_RETRY_HEADER] = "true";

            if (newAccessToken) {
                localStorage.setItem("access_token", newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return instance.request(originalRequest);
            }
        }


        if (
            originalRequest &&
            error.response?.status === 400 &&
            originalRequest.url === "/api/v1/auth/refresh" &&
            location.pathname.startsWith("/admin")
        ) {
            localStorage.removeItem("access_token");

            const message =
                error?.response?.data?.error ??
                "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";

            store.dispatch(
                setRefreshTokenAction({
                    status: true,
                    message,
                })
            );
        }


        if (error.response?.status === 403) {
            notification.error({
                message: error?.response?.data?.message ?? "",
                description: error?.response?.data?.error ?? "",
            });
        }

        return error?.response?.data ?? Promise.reject(error);
    }
);

export default instance;


