import type { IBackendRes } from "@/types/backend";
import axios, { AxiosError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { notification } from "antd";

interface AccessTokenResponse {
    access_token: string;
}


const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL as string,
    withCredentials: true,
    timeout: 30000,
});

const TOKEN_UPDATED_EVENT = "hrm:access-token-updated";
const MAX_CONCURRENT_API_REQUESTS = 8;
const GATEWAY_FAILURE_THRESHOLD = 3;
const GATEWAY_FAILURE_WINDOW_MS = 10_000;
const GATEWAY_COOLDOWN_MS = 15_000;
const GATEWAY_ERROR_STATUSES = new Set([502, 503, 504]);
let refreshPromise: Promise<string | null> | null = null;
let logoutInProgress = false;
let activeRequestCount = 0;
let gatewayUnavailableUntil = 0;
let recentGatewayFailures: number[] = [];
const requestQueue: Array<() => void> = [];
const inFlightGetRequests = new Map<string, Promise<AxiosResponse>>();

interface LimitedRequestConfig extends InternalAxiosRequestConfig {
    __requestSlotAcquired?: boolean;
    __authRetryAttempted?: boolean;
}

const defaultAdapter = axios.getAdapter(instance.defaults.adapter);
instance.defaults.adapter = async (config) => {
    const method = config.method?.toLowerCase();
    const canCoalesce = method === "get"
        && !config.signal
        && !config.cancelToken
        && !config.onDownloadProgress;

    if (!canCoalesce) {
        return defaultAdapter(config);
    }

    const authorization = config.headers?.get?.("Authorization") ?? "";
    const requestKey = [
        axios.getUri(config),
        authorization,
        config.responseType ?? "json",
    ].join("|");

    let request = inFlightGetRequests.get(requestKey);
    const ownsRequest = !request;

    if (!request) {
        request = defaultAdapter(config);
        inFlightGetRequests.set(requestKey, request);
    }

    try {
        const response = await request;
        return { ...response, config };
    } finally {
        if (ownsRequest && inFlightGetRequests.get(requestKey) === request) {
            inFlightGetRequests.delete(requestKey);
        }
    }
};

const isGatewayCircuitOpen = () => Date.now() < gatewayUnavailableUntil;

const createGatewayCircuitError = (config: InternalAxiosRequestConfig) =>
    new AxiosError(
        "Máy chủ đang tạm quá tải. Vui lòng thử lại sau ít giây.",
        "ERR_GATEWAY_COOLDOWN",
        config
    );

const recordGatewayFailure = () => {
    const now = Date.now();
    recentGatewayFailures = recentGatewayFailures.filter(
        (timestamp) => now - timestamp <= GATEWAY_FAILURE_WINDOW_MS
    );
    recentGatewayFailures.push(now);

    if (recentGatewayFailures.length >= GATEWAY_FAILURE_THRESHOLD) {
        gatewayUnavailableUntil = now + GATEWAY_COOLDOWN_MS;
        recentGatewayFailures = [];
    }
};

const recordGatewaySuccess = () => {
    recentGatewayFailures = [];
    if (!isGatewayCircuitOpen()) {
        gatewayUnavailableUntil = 0;
    }
};

const acquireRequestSlot = () => new Promise<void>((resolve) => {
    const grant = () => {
        activeRequestCount += 1;
        resolve();
    };

    if (activeRequestCount < MAX_CONCURRENT_API_REQUESTS) {
        grant();
        return;
    }

    requestQueue.push(grant);
});

const releaseRequestSlot = (config?: LimitedRequestConfig) => {
    if (!config?.__requestSlotAcquired) return;

    config.__requestSlotAcquired = false;
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    requestQueue.shift()?.();
};


const isAuthEndpoint = (url?: string) => {
    if (!url) return false;
    return (
        url.includes("/api/v1/auth/login") ||
        url.includes("/api/v1/auth/refresh")
    );
};

const requestRefreshToken = async (): Promise<string | null> => {
    try {
        const res = await instance.post<IBackendRes<AccessTokenResponse>>(
            "/api/v1/auth/refresh",
            null
        );

        return res?.data?.access_token ?? null;
    } catch {
        return null;
    }
};

const isRefreshEndpoint = (url?: string) =>
    !!url?.includes("/api/v1/auth/refresh");

const handleRefreshToken = async (): Promise<string | null> => {
    if (!refreshPromise) {
        refreshPromise = requestRefreshToken().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
};

const redirectToLoginOnce = async () => {
    if (logoutInProgress) return;
    logoutInProgress = true;

    const { store } = await import("@/redux/store");
    const { setLogoutAction } = await import("@/redux/slice/accountSlide");

    store.dispatch(setLogoutAction());
    localStorage.removeItem("access_token");

    if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
    }
};


instance.interceptors.request.use(async (config: LimitedRequestConfig) => {
    if (isGatewayCircuitOpen() && !isRefreshEndpoint(config.url)) {
        throw createGatewayCircuitError(config);
    }

    await acquireRequestSlot();
    config.__requestSlotAcquired = true;

    if (isGatewayCircuitOpen() && !isRefreshEndpoint(config.url)) {
        releaseRequestSlot(config);
        throw createGatewayCircuitError(config);
    }

    const accessToken = localStorage.getItem("access_token");

    if (
        accessToken &&
        !isAuthEndpoint(config.url)
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
        releaseRequestSlot(res.config as LimitedRequestConfig);
        recordGatewaySuccess();

        // download file
        if (res.config.responseType === "blob") {
            return res;
        }
        return res.data;
    },
    async (error) => {
        const originalRequest = error.config as LimitedRequestConfig | undefined;
        releaseRequestSlot(originalRequest);

        if (GATEWAY_ERROR_STATUSES.has(error.response?.status)) {
            recordGatewayFailure();
        }

        if (
            originalRequest &&
            error.response?.status === 401 &&
            !isAuthEndpoint(originalRequest.url) &&
            !originalRequest.__authRetryAttempted
        ) {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.__authRetryAttempted = true;

            const newAccessToken = await handleRefreshToken();

            if (newAccessToken) {
                localStorage.setItem("access_token", newAccessToken);
                window.dispatchEvent(new Event(TOKEN_UPDATED_EVENT));
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return instance.request(originalRequest);
            } else {
                // Refresh token fail -> Bắt buộc logout
                await redirectToLoginOnce();
                return Promise.reject(error);
            }
        }

        if (originalRequest?.__authRetryAttempted && error.response?.status === 401) {
            await redirectToLoginOnce();
            return Promise.reject(error);
        }


        // Xử lý lỗi khi API refresh token thất bại (Refresh Token hết hạn trả về 400 hoặc lỗi khác)
        if (
            originalRequest &&
            originalRequest.url?.includes("/api/v1/auth/refresh")
        ) {
            await redirectToLoginOnce();

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


