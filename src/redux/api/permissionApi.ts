import { baseApi } from "@/redux/api/baseApi";
import type { IBackendRes, IPermission, IModelPaginate } from "@/types/backend";

export const permissionApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getPermissions: builder.query<IBackendRes<IModelPaginate<IPermission>>, string | void>({
            query: (query = "") => `/api/v1/permissions?${query}`,
            providesTags: ["Permission"],
        }),

        getPermissionById: builder.query<IBackendRes<IPermission>, string>({
            query: (id) => `/api/v1/permissions/${id}`,
            providesTags: ["Permission"],
        }),

        createPermission: builder.mutation<IBackendRes<IPermission>, IPermission>({
            query: (body) => ({
                url: "/api/v1/permissions",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Permission"],
        }),

        updatePermission: builder.mutation<IBackendRes<IPermission>, IPermission>({
            query: (body) => ({
                url: "/api/v1/permissions",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Permission"],
        }),

        deletePermission: builder.mutation<IBackendRes<IPermission>, string>({
            query: (id) => ({
                url: `/api/v1/permissions/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Permission"],
        }),
    }),
});

export const {
    useGetPermissionsQuery,
    useGetPermissionByIdQuery,
    useCreatePermissionMutation,
    useUpdatePermissionMutation,
    useDeletePermissionMutation,
} = permissionApi;
