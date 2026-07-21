import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    callFetchUserAdminScopes,
    callUpdateUserAdminScopes,
} from "@/config/api";
import type { IReqUpsertUserAdminScopes, IUserAdminScope } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

export const useUserAdminScopesQuery = (userId?: string) => {
    return useQuery({
        queryKey: ["user-admin-scopes", userId],
        enabled: !!userId,
        queryFn: async () => {
            const res = await callFetchUserAdminScopes(userId!);
            return (res as any)?.data ?? [] as IUserAdminScope[];
        },
    });
};

export const useUpdateUserAdminScopesMutation = (userId?: string) => {
    const client = useQueryClient();

    return useMutation({
        mutationFn: async (data: IReqUpsertUserAdminScopes) => {
            if (!userId) throw new Error("Thiếu ID người dùng");
            const res = await callUpdateUserAdminScopes(userId, data);
            return (res as any)?.data ?? [];
        },
        onSuccess: () => {
            notify.updated("Cập nhật phạm vi quản trị thành công");
            client.invalidateQueries({ queryKey: ["user-admin-scopes", userId] });
        },
        onError: (err: any) => {
            notify.error(err?.response?.data?.message || err?.message || "Không thể cập nhật phạm vi quản trị");
        },
    });
};
