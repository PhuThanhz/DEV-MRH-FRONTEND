// /* ============================================================
//    COMPANY JOB TITLE - SALARY GRADES HOOKS
// ============================================================ */

// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//     callFetchCompanyJobTitleSalaryGrades,
//     callCreateCompanyJobTitleSalaryGrade,
//     callUpdateCompanyJobTitleSalaryGrade,
//     callDeleteCompanyJobTitleSalaryGrade,
// } from "@/config/api";
// import { notify } from "@/components/common/notification/notify";

// import type { ICompanyJobTitleSalaryGrade } from "@/types/backend";

// /* =====================================================
//    1. FETCH LIST SALARY GRADES
// ===================================================== */
// export const useCompanyJobTitleSalaryGradesQuery = (companyJobTitleId?: number) => {
//     return useQuery({
//         queryKey: ["company-job-title-salary-grades", companyJobTitleId],
//         enabled: !!companyJobTitleId && companyJobTitleId > 0,
//         queryFn: async () => {
//             const res = await callFetchCompanyJobTitleSalaryGrades(companyJobTitleId!);

//             if (!res?.data) throw new Error("Không thể lấy danh sách bậc lương");

//             return res.data as ICompanyJobTitleSalaryGrade[];
//         },
//     });
// };

// /* =====================================================
//    2. CREATE SALARY GRADE
// ===================================================== */
// export const useCreateCompanyJobTitleSalaryGradeMutation = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: async (payload: { companyJobTitleId: number; gradeLevel: number }) => {
//             const res = await callCreateCompanyJobTitleSalaryGrade(payload);

//             if (!res?.data) {
//                 throw new Error("Không thể tạo bậc lương");
//             }

//             return res.data;
//         },

//         onSuccess: (_res, payload) => {
//             notify.created("Tạo bậc lương thành công");

//             queryClient.invalidateQueries({
//                 queryKey: ["company-job-title-salary-grades", payload.companyJobTitleId],
//             });
//         },

//         onError: (error: any) => {
//             notify.error(error.message || "Lỗi khi tạo bậc lương");
//         },
//     });
// };

// /* =====================================================
//    3. UPDATE SALARY GRADE
// ===================================================== */
// export const useUpdateCompanyJobTitleSalaryGradeMutation = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: async (payload: { id: number; gradeLevel: number; companyJobTitleId: number }) => {
//             const res = await callUpdateCompanyJobTitleSalaryGrade(payload.id, {
//                 gradeLevel: payload.gradeLevel,
//             });

//             if (!res?.data) {
//                 throw new Error("Không thể cập nhật bậc lương");
//             }

//             return res.data;
//         },

//         onSuccess: (_res, payload) => {
//             notify.updated("Cập nhật bậc lương thành công");

//             queryClient.invalidateQueries({
//                 queryKey: ["company-job-title-salary-grades", payload.companyJobTitleId],
//             });
//         },

//         onError: (error: any) => {
//             notify.error(error.message || "Lỗi khi cập nhật bậc lương");
//         },
//     });
// };

// /* =====================================================
//    4. DELETE SALARY GRADE
// ===================================================== */
// export const useDeleteCompanyJobTitleSalaryGradeMutation = () => {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: async (payload: { id: number; companyJobTitleId: number }) => {
//             const res = await callDeleteCompanyJobTitleSalaryGrade(payload.id);

//             // DELETE Salary Grade có dạng IBackendRes<{ }> nhưng 204 No Content
//             if (!res?.statusCode || res.statusCode !== 200) {
//                 throw new Error("Không thể xóa bậc lương");
//             }

//             return true;
//         },

//         onSuccess: (_res, payload) => {
//             notify.deleted("Xóa bậc lương thành công");

//             queryClient.invalidateQueries({
//                 queryKey: ["company-job-title-salary-grades", payload.companyJobTitleId],
//             });
//         },

//         onError: (error: any) => {
//             notify.error(error.message || "Lỗi khi xóa bậc lương");
//         },
//     });
// };
