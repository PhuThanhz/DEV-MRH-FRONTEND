import type { IBackendRes } from "@/types/backend";
import axios from "axios";
import { Mutex } from "async-mutex";
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
        url.includes("/api/v1/auth/login") ||
        url.includes("/api/v1/auth/refresh")
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
            } else {
                // Refresh token fail -> Bắt buộc logout
                const { store } = await import("@/redux/store");
                const { setLogoutAction } = await import("@/redux/slice/accountSlide");
                store.dispatch(setLogoutAction());
                localStorage.removeItem("access_token");
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }


        // Xử lý lỗi khi API refresh token thất bại (Refresh Token hết hạn trả về 400 hoặc lỗi khác)
        if (
            originalRequest &&
            originalRequest.url?.includes("/api/v1/auth/refresh")
        ) {
            // 1. Xóa sạch mọi token lưu trong localStorage và reset Redux
            const { store } = await import("@/redux/store");
            const { setLogoutAction } = await import("@/redux/slice/accountSlide");
            store.dispatch(setLogoutAction());
            localStorage.removeItem("access_token");

            // 2. Ép người dùng văng thẳng về trang Đăng nhập
            window.location.href = '/login';

            return Promise.reject(error?.response?.data ?? error);
        }


        if (error.response?.status === 403) {
            notification.error({
                message: error?.response?.data?.message ?? "",
                description: error?.response?.data?.error ?? "",
            });
        }

        if (error.response?.status === 409) {
            notification.error({
                message: "Dữ liệu đã bị thay đổi",
                description: "Dữ liệu đã bị thay đổi bởi người khác, vui lòng tải lại trang",
            });
        }

        if (error.response?.status === 400 && error.response?.data?.message === "Mã đã tồn tại") {
            notification.error({
                message: "Lỗi dữ liệu",
                description: "Mã đã tồn tại, vui lòng kiểm tra lại",
            });
        }

        return Promise.reject(error?.response?.data ?? error);
    }
);

export default instance;


