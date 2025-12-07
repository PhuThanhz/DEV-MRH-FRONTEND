import { baseApi } from "@/redux/api/baseApi";
import type { IBackendRes, IRole, IModelPaginate } from "@/types/backend";

export const roleApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getRoles: builder.query<IBackendRes<IModelPaginate<IRole>>, string | void>({
            query: (query = "") => `/api/v1/roles?${query}`,
            providesTags: ["Role"],
        }),

        getRoleById: builder.query<IBackendRes<IRole>, string>({
            query: (id) => `/api/v1/roles/${id}`,
            providesTags: ["Role"],
        }),

        createRole: builder.mutation<IBackendRes<IRole>, IRole>({
            query: (body) => ({
                url: "/api/v1/roles",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Role"],
        }),

        updateRole: builder.mutation<IBackendRes<IRole>, IRole>({
            query: (body) => ({
                url: "/api/v1/roles",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Role"],
        }),

        deleteRole: builder.mutation<IBackendRes<IRole>, string>({
            query: (id) => ({
                url: `/api/v1/roles/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Role"],
        }),
    }),
});

export const {
    useGetRolesQuery,
    useGetRoleByIdQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
} = roleApi;
