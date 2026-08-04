import { useQuery, useMutation } from "@tanstack/react-query";
import {
    callFetchSubordinates,
    callFetchDocumentCategoryActive,
    callFetchAccountingDocumentCategoryActive,
    callUploadSingleFile,
} from "@/config/api";
import type { IUser } from "@/types/backend";

export const useSubordinatesQuery = (enabled = true) => {
    return useQuery({
        queryKey: ["subordinates"],
        enabled,
        queryFn: async () => {
            const res = await callFetchSubordinates();
            return (res.data as IUser[]) ?? [];
        },
    });
};

export const useDocumentCategoryActiveQuery = () => {
    return useQuery({
        queryKey: ["document-categories-active"],
        queryFn: async () => {
            const res = await callFetchDocumentCategoryActive();
            return res.data ?? [];
        },
    });
};

export const useAccountingDocumentCategoryActiveQuery = () => {
    return useQuery({
        queryKey: ["accounting-document-categories-active"],
        queryFn: async () => {
            const res = await callFetchAccountingDocumentCategoryActive();
            return res.data ?? [];
        },
    });
};

export const useUploadFileMutation = () => {
    return useMutation({
        mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
            const res = await callUploadSingleFile(file, folder);
            if (!res?.data?.fileName) {
                throw new Error(res?.message || "Upload thất bại");
            }
            return res.data.fileName;
        },
    });
};
