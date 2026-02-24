import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callFetchJobDescriptions,
    callCreateJobDescription,
    callUpdateJobDescription,
    callDeleteJobDescription,
    callGetJobDescriptionById,
    callSubmitJobDescription,
    callIssueJobDescription,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";

/* ===================== QUERY ===================== */

export const useJobDescriptionsQuery = (query: string) =>
    useQuery({
        queryKey: ["job-descriptions", query],
        queryFn: async () => {
            const res = await callFetchJobDescriptions(query);
            if (!res?.data)
                throw new Error("Không thể lấy danh sách JD");
            return res.data;
        },
    });

export const useJobDescriptionByIdQuery = (id?: number) =>
    useQuery({
        queryKey: ["job-description", id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) throw new Error("Thiếu ID JD");
            const res = await callGetJobDescriptionById(id);
            if (!res?.data) throw new Error("Không tìm thấy JD");
            return res.data;
        },
    });

/* ===================== MUTATION ===================== */

export const useCreateJobDescriptionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callCreateJobDescription,
        onSuccess: () => {
            notify.created("Tạo JD thành công");
            qc.invalidateQueries({ queryKey: ["job-descriptions"] });
        },
        onError: (e: any) => notify.error(e.message),
    });
};

export const useUpdateJobDescriptionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callUpdateJobDescription,
        onSuccess: () => {
            notify.updated("Cập nhật JD thành công");
            qc.invalidateQueries({ queryKey: ["job-descriptions"] });
        },
        onError: (e: any) => notify.error(e.message),
    });
};

export const useDeleteJobDescriptionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callDeleteJobDescription,
        onSuccess: () => {
            notify.deleted("Xoá JD thành công");
            qc.invalidateQueries({ queryKey: ["job-descriptions"] });
        },
        onError: (e: any) => notify.error(e.message),
    });
};

export const useSubmitJobDescriptionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callSubmitJobDescription,
        onSuccess: () => {
            notify.updated("Đã gửi JD vào quy trình");
            qc.invalidateQueries({ queryKey: ["job-descriptions"] });
        },
        onError: (e: any) => notify.error(e.message),
    });
};

export const useIssueJobDescriptionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: callIssueJobDescription,
        onSuccess: () => {
            notify.updated("Ban hành JD thành công");
            qc.invalidateQueries({ queryKey: ["job-descriptions"] });
        },
        onError: (e: any) => notify.error(e.message),
    });
};
