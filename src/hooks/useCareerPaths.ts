/* =========================================================
   🧭 CAREER PATHS HOOKS (LỘ TRÌNH THĂNG TIẾN)
========================================================= */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    callCreateCareerPath,
    callUpdateCareerPath,
    callDeactivateCareerPath,
    callGetCareerPathById,
    callGetCareerPathByDepartment,
    callGetCareerPathGroupedByBand,
    callGetCareerPathGlobal,
    callGetAllActiveCareerPaths,

    // ✅ API MỚI – NGUỒN SỰ THẬT
    callFetchCompanyJobTitlesOfDepartment,
} from "@/config/api";

import type {
    ICareerPath,
    ICareerPathRequest,
    IResCareerPathBandGroup,
    IBackendRes,
} from "@/types/backend";

import { notify } from "@/components/common/notification/notify";

/* =========================================================
   📌 LẤY DANH SÁCH LỘ TRÌNH THEO PHÒNG BAN
========================================================= */
export const useCareerPathsByDepartmentQuery = (departmentId?: number | string) => {
    return useQuery<ICareerPath[]>({
        queryKey: ["career-paths-department", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            const res = (await callGetCareerPathByDepartment(
                Number(departmentId)
            )) as IBackendRes<ICareerPath[]>;

            return res.data ?? [];
        },
    });
};

/* =========================================================
   📌 LẤY LỘ TRÌNH THEO BAND
========================================================= */
export const useCareerPathsGroupedByBandQuery = (departmentId?: number | string) => {
    return useQuery<IResCareerPathBandGroup[]>({
        queryKey: ["career-paths-band", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            const res = (await callGetCareerPathGroupedByBand(
                Number(departmentId)
            )) as IBackendRes<IResCareerPathBandGroup[]>;

            return res.data ?? [];
        },
    });
};

/* =========================================================
   📌 LẤY LỘ TRÌNH GLOBAL
========================================================= */
export const useCareerPathGlobalQuery = (departmentId?: number | string) => {
    return useQuery<ICareerPath[]>({
        queryKey: ["career-paths-global", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            const res = (await callGetCareerPathGlobal(
                Number(departmentId)
            )) as IBackendRes<ICareerPath[]>;

            return res.data ?? [];
        },
    });
};

/* =========================================================
   📌 CHI TIẾT LỘ TRÌNH
========================================================= */
export const useCareerPathByIdQuery = (id?: number | string) => {
    return useQuery<ICareerPath>({
        queryKey: ["career-path", id],
        enabled: !!id,
        queryFn: async () => {
            const res = (await callGetCareerPathById(
                Number(id)
            )) as IBackendRes<ICareerPath>;

            return res.data ?? ({} as ICareerPath);
        },
    });
};

/* =========================================================
   📌 ACTIVE TOÀN HỆ THỐNG
========================================================= */
export const useAllActiveCareerPathsQuery = () => {
    return useQuery<ICareerPath[]>({
        queryKey: ["career-paths-active"],
        queryFn: async () => {
            const res = (await callGetAllActiveCareerPaths()) as IBackendRes<ICareerPath[]>;
            return res.data ?? [];
        },
    });
};

/* =========================================================
   🟢 TẠO LỘ TRÌNH
========================================================= */
export const useCreateCareerPathMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ICareerPathRequest) => {
            const res = (await callCreateCareerPath(
                payload
            )) as IBackendRes<ICareerPath>;

            return res.data!;
        },
        onSuccess: () => {
            notify.created("Tạo lộ trình thăng tiến thành công");
            qc.invalidateQueries({ queryKey: ["career-paths-department"] });
        },
        onError: (err: any) =>
            notify.error(err.message || "Lỗi khi tạo lộ trình"),
    });
};

/* =========================================================
   🟡 CẬP NHẬT LỘ TRÌNH
========================================================= */
export const useUpdateCareerPathMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ICareerPathRequest & { id: number }) => {
            const { id, ...body } = payload;

            const res = (await callUpdateCareerPath(
                Number(id),
                body
            )) as IBackendRes<ICareerPath>;

            return res.data!;
        },
        onSuccess: (_, payload) => {
            notify.updated("Cập nhật lộ trình thành công");
            qc.invalidateQueries({ queryKey: ["career-path", payload.id] });
            qc.invalidateQueries({ queryKey: ["career-paths-department"] });
        },
        onError: (err: any) =>
            notify.error(err.message || "Lỗi khi cập nhật lộ trình"),
    });
};

/* =========================================================
   🔴 VÔ HIỆU HÓA LỘ TRÌNH
========================================================= */
export const useDeactivateCareerPathMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (id: number | string) => {
            await callDeactivateCareerPath(id);
        },
        onSuccess: () => {
            notify.deleted("Đã vô hiệu hóa lộ trình");
            qc.invalidateQueries({ queryKey: ["career-paths-department"] });
        },
        onError: (err: any) =>
            notify.error(err.message || "Không thể vô hiệu hóa"),
    });
};

/* =========================================================
   ✅ CHỨC DANH CÓ HIỆU LỰC TẠI PHÒNG BAN (COMPANY + DEPT + SECTION)
========================================================= */
export const useActiveJobTitlesByDepartment = (departmentId?: number | string) => {
    return useQuery({
        queryKey: ["effective-job-titles-by-dept", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            const res = await callFetchCompanyJobTitlesOfDepartment(
                Number(departmentId)
            );

            // chỉ trả jobTitleInfo cho Career Path dùng
            return (res.data ?? []).map((x: any) => x.jobTitle);
        },
    });
};
