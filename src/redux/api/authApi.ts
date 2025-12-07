import { baseApi } from "@/redux/api/baseApi";
import type { IBackendRes, IAccount, IUser, IGetAccount } from "@/types/backend";

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation<IBackendRes<IUser>, Partial<IUser>>({
            query: (body) => ({
                url: "/api/v1/auth/register",
                method: "POST",
                body,
            }),
        }),

        login: builder.mutation<IBackendRes<IAccount>, { username: string; password: string }>({
            query: (body) => ({
                url: "/api/v1/auth/login",
                method: "POST",
                body,
            }),
        }),

        fetchAccount: builder.query<IBackendRes<IGetAccount>, void>({
            query: () => "/api/v1/auth/account",
        }),

        refreshToken: builder.query<IBackendRes<IAccount>, void>({
            query: () => "/api/v1/auth/refresh",
        }),

        logout: builder.mutation<IBackendRes<string>, void>({
            query: () => ({
                url: "/api/v1/auth/logout",
                method: "POST",
            }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useFetchAccountQuery,
    useRefreshTokenQuery,
    useLogoutMutation,
} = authApi;
