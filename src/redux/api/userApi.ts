import { baseApi } from "@/redux/api/baseApi";
import type { IBackendRes, IUser, IModelPaginate } from "@/types/backend";

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({


        getUsers: builder.query<IBackendRes<IModelPaginate<IUser>>, string | void>({
            query: (query = "") => `/api/v1/users?${query}`,
            providesTags: ["User"],
        }),

        getUserById: builder.query<IBackendRes<IUser>, string>({
            query: (id) => `/api/v1/users/${id}`,
            providesTags: ["User"],
        }),

        createUser: builder.mutation<IBackendRes<IUser>, IUser>({
            query: (body) => ({
                url: "/api/v1/users",
                method: "POST",
                body,
            }),
            invalidatesTags: ["User"],
        }),

        updateUser: builder.mutation<IBackendRes<IUser>, IUser>({
            query: (body) => ({
                url: "/api/v1/users",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["User"],
        }),

        deleteUser: builder.mutation<IBackendRes<IUser>, string>({
            query: (id) => ({
                url: `/api/v1/users/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["User"],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useGetUserByIdQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = userApi;
