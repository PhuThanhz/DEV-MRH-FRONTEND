// src/hooks/usePermissionMatrixByCategory.ts

import { useQuery } from "@tanstack/react-query";
import {
    callFetchPermissionCategoriesByDepartment,
    callFetchPermissionMatrixByCategory,
} from "@/config/api";

import type {
    IPermissionCategory,
    IPermissionCategoryMatrix,
} from "@/types/backend";

/* ============================================================
   DANH MỤC THEO PHÒNG BAN
============================================================ */
export const usePermissionCategoriesByDepartment = (
    departmentId?: number
) =>
    useQuery<IPermissionCategory[]>({
        queryKey: ["permission-categories-by-department", departmentId],
        enabled: !!departmentId,
        queryFn: async () => {
            if (!departmentId) return [];

            const backend =
                await callFetchPermissionCategoriesByDepartment(departmentId);

            if (backend.statusCode !== 200) {
                throw new Error(
                    backend.message || "Không thể lấy danh mục phân quyền"
                );
            }

            return backend.data ?? [];
        },
    });

/* ============================================================
   MATRIX THEO CATEGORY
============================================================ */
export const usePermissionMatrixByCategory = (
    categoryId?: number | null
) =>
    useQuery<IPermissionCategoryMatrix | null>({
        queryKey: ["permission-matrix-by-category", categoryId],
        enabled: !!categoryId,
        queryFn: async () => {
            if (!categoryId) return null;

            const backend =
                await callFetchPermissionMatrixByCategory(categoryId);

            if (backend.statusCode !== 200) {
                throw new Error(
                    backend.message || "Không thể lấy ma trận phân quyền"
                );
            }

            return backend.data ?? null;
        },
    });