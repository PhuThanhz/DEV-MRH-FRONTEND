import type {
    IBackendRes, IAccount, IUser, ICompany, IModelPaginate, IGetAccount, IPermission, IRole,
    IDepartment, ISection, IPositionLevel, IJobTitle, ICompanyProcedure, ICareerPath,
    IDepartmentJobTitle, IResCareerPathBandGroup, ICareerPathRequest,
    ICompanySalaryGrade, ICreateCompanySalaryGradeReq, IUpdateCompanySalaryGradeReq,
    IDepartmentSalaryGrade, ICreateDepartmentSalaryGradeReq, IUpdateDepartmentSalaryGradeReq, ISectionSalaryGrade,
    ICreateSectionSalaryGradeReq,
    IUpdateSectionSalaryGradeReq, IJobTitlePerformanceContent,
    IReqJobTitlePerformanceContent, ISalaryStructure,
    ISalaryMatrix, IReqSalaryStructure, IProcessAction, IPermissionCategory,
    IPermissionCategoryMatrix,
    IPermissionContent, IPermissionCategoryRequest, IUpdatePermissionContentReq, ICreatePermissionContentReq, IPermissionMatrix, IAssignPermissionReq, IJobDescriptionList,
    ICreateJobDescriptionReq,
    IUpdateJobDescriptionReq, IJobDescription,

} from '@/types/backend';

import axios from 'config/axios-customize';

export const callLogin = (username: string, password: string) => {
    return axios.post<IBackendRes<IAccount>>('/api/v1/auth/login', { username, password })
}

export const callFetchAccount = () => {
    return axios.get<IBackendRes<IGetAccount>>('/api/v1/auth/account')
}

export const callRefreshToken = () => {
    return axios.get<IBackendRes<IAccount>>('/api/v1/auth/refresh')
}

export const callLogout = () => {
    return axios.post<IBackendRes<string>>('/api/v1/auth/logout')
}


export const callUploadSingleFile = (file: any, folderType: string) => {
    const bodyFormData = new FormData();
    bodyFormData.append('file', file);
    bodyFormData.append('folder', folderType);

    return axios<IBackendRes<{ fileName: string }>>({
        method: 'post',
        url: '/api/v1/files',
        data: bodyFormData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const callCreateUser = (user: IUser) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/users', { ...user })
}

export const callUpdateUser = (user: IUser) => {
    return axios.put<IBackendRes<IUser>>(`/api/v1/users`, { ...user })
}

export const callDeleteUser = (id: string) => {
    return axios.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
}

export const callFetchUser = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
}


export const callCreatePermission = (permission: IPermission) => {
    return axios.post<IBackendRes<IPermission>>('/api/v1/permissions', { ...permission })
}

export const callUpdatePermission = (permission: IPermission, id: string) => {
    return axios.put<IBackendRes<IPermission>>(`/api/v1/permissions`, { id, ...permission })
}

export const callDeletePermission = (id: string) => {
    return axios.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
}

export const callFetchPermission = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${query}`);
}

export const callFetchPermissionById = (id: string) => {
    return axios.get<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
}


export const callCreateRole = (role: IRole) => {
    return axios.post<IBackendRes<IRole>>('/api/v1/roles', { ...role })
}

export const callUpdateRole = (role: IRole, id: string) => {
    return axios.put<IBackendRes<IRole>>(`/api/v1/roles`, { id, ...role })
}

export const callDeleteRole = (id: string) => {
    return axios.delete<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}

export const callFetchRole = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IRole>>>(`/api/v1/roles?${query}`);
}

export const callFetchRoleById = (id: string) => {
    return axios.get<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}


/* ===================== COMPANIES ===================== */

export const callFetchCompany = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ICompany>>>(
        `/api/v1/companies?${query}`
    );
};

export const callFetchCompanyById = (id: string) => {
    return axios.get<IBackendRes<ICompany>>(
        `/api/v1/companies/${id}`
    );
};

export const callCreateCompany = (company: ICompany) => {
    return axios.post<IBackendRes<ICompany>>(
        "/api/v1/companies",
        { ...company }
    );
};

export const callUpdateCompany = (company: ICompany) => {
    return axios.put<IBackendRes<ICompany>>(
        "/api/v1/companies",
        { ...company }
    );
};

// ===== INACTIVE =====
export const callInactiveCompany = (id: number) => {
    return axios.put<IBackendRes<void>>(
        `/api/v1/companies/${id}/inactive`
    );
};

// ===== ACTIVE =====
export const callActiveCompany = (id: number) => {
    return axios.put<IBackendRes<void>>(
        `/api/v1/companies/${id}/active`
    );
};

/* ===================== DEPARTMENTS ===================== */

export const callFetchDepartment = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IDepartment>>>(
        `/api/v1/departments?${query}`
    );
};

export const callFetchDepartmentById = (id: number) => {
    return axios.get<IBackendRes<IDepartment>>(
        `/api/v1/departments/${id}`
    );
};

export const callCreateDepartment = (data: {
    code: string;
    name: string;
    englishName?: string;
    companyId: number;
}) => {
    return axios.post<IBackendRes<IDepartment>>(
        `/api/v1/departments`,
        data
    );
};

export const callUpdateDepartment = (
    id: number,
    data: {
        name?: string;
        englishName?: string;
        status?: number;
    }
) => {
    return axios.put<IBackendRes<IDepartment>>(
        `/api/v1/departments/${id}`,
        data
    );
};

// SOFT DELETE = TẮT PHÒNG BAN
export const callDeleteDepartment = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/departments/${id}`
    );
};

// ACTIVE = KÍCH HOẠT LẠI PHÒNG BAN
export const callActiveDepartment = (id: number) => {
    return axios.patch<IBackendRes<IDepartment>>(
        `/api/v1/departments/${id}/active`
    );
};
/* DEPARTMENT JOB TITLES (Gán chức danh – Phòng ban) */

// FETCH PAGINATE LIST (Giống User / Role) - Uncomment nếu cần dùng
// export const callFetchDepartmentJobTitlePaginate = (query: string) => {
//     return axios.get<IBackendRes<IModelPaginate<IDepartmentJobTitle>>>(
//         `/api/v1/department-job-titles?${query}`
//     );
// };

// FETCH DETAIL BY ID - Uncomment nếu cần dùng
// export const callFetchDepartmentJobTitleById = (id: number) => {
//     return axios.get<IBackendRes<IDepartmentJobTitle>>(
//         `/api/v1/department-job-titles/${id}`
//     );
// };

/* CREATE (Gán chức danh → phòng ban) - Tự động reactivate nếu đã inactive */
export const callCreateDepartmentJobTitle = (data: {
    departmentId: number;
    jobTitleId: number;
}) => {
    return axios.post<IBackendRes<IDepartmentJobTitle>>(
        `/api/v1/department-job-titles`,
        data
    );
};

/* DELETE (Hủy gán – Soft delete / Deactivate) */
export const callDeleteDepartmentJobTitle = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/department-job-titles/${id}`
    );
};

/* RESTORE (Khôi phục – Reactivate) - Bật lại active cho mapping đã deactivate */
export const callRestoreDepartmentJobTitle = (id: number) => {
    return axios.patch<IBackendRes<IDepartmentJobTitle>>(
        `/api/v1/department-job-titles/${id}/restore`
    );
};

/* FETCH ACTIVE LIST BY DEPARTMENT (Không phân trang) - Dùng cho UI hiển thị danh sách chức danh active */
export const callFetchCompanyJobTitlesOfDepartment = (departmentId: number) => {
    return axios.get<IBackendRes<IDepartmentJobTitle[]>>(
        `/api/v1/departments/${departmentId}/company-job-titles`
    );
};


/* ===================== SECTIONS ===================== */

export const callFetchSection = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ISection>>>(
        `/api/v1/sections?${query}`
    );
};

export const callFetchSectionById = (id: number) => {
    return axios.get<IBackendRes<ISection>>(
        `/api/v1/sections/${id}`
    );
};

export const callCreateSection = (data: {
    code: string;
    name: string;
    departmentId: number;
    status?: number;
}) => {
    return axios.post<IBackendRes<ISection>>(
        `/api/v1/sections`,
        data
    );
};

export const callUpdateSection = (data: {
    id: number;
    code?: string;
    name?: string;
    departmentId?: number;
    status?: number;
}) => {
    return axios.put<IBackendRes<ISection>>(
        `/api/v1/sections`,
        data
    );
};

export const callDeleteSection = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/sections/${id}`
    );
};

export const callInactiveSection = (id: number) => {
    return axios.put<IBackendRes<void>>(
        `/api/v1/sections/${id}/inactive`
    );
};

export const callActiveSection = (id: number) => {
    return axios.put<IBackendRes<void>>(
        `/api/v1/sections/${id}/active`
    );
};

/* ===================== POSITION LEVELS ===================== */


export const callFetchPositionLevel = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPositionLevel>>>(
        `/api/v1/position-levels?${query}`
    );
};

export const callCreatePositionLevel = (data: {
    code: string;
    bandOrder?: number;
}) => {
    return axios.post<IBackendRes<IPositionLevel>>(
        `/api/v1/position-levels`,
        data
    );
};

export const callUpdatePositionLevel = (data: any) => {
    return axios.put<IBackendRes<IPositionLevel>>(
        `/api/v1/position-levels`,
        data
    );
};

export const callDeletePositionLevel = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/position-levels/${id}`
    );
};

export const callActivePositionLevel = (id: number) => {
    return axios.put<IBackendRes<IPositionLevel>>(
        `/api/v1/position-levels/${id}/active`
    );
};

/* ===================== JOB TITLES ===================== */

export const callFetchJobTitle = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJobTitle>>>(
        `/api/v1/job-titles?${query}`
    );
};

export const callCreateJobTitle = (data: any) => {
    return axios.post<IBackendRes<IJobTitle>>(
        `/api/v1/job-titles`,
        data
    );
};

export const callUpdateJobTitle = (data: any) => {
    return axios.put<IBackendRes<IJobTitle>>(
        `/api/v1/job-titles`,
        data
    );
};

export const callDeleteJobTitle = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/job-titles/${id}`
    );
};


/* ===================== COMPANY PROCEDURES ===================== */



// Danh sách (có phân trang, filter)
export const callFetchCompanyProcedure = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ICompanyProcedure>>>(
        `/api/v1/company-procedures?${query}`
    );
};

// Tạo mới
export const callCreateCompanyProcedure = (data: ICompanyProcedure) => {
    return axios.post<IBackendRes<ICompanyProcedure>>(
        `/api/v1/company-procedures`,
        { ...data }
    );
};

// Cập nhật — cần có {id} trong URL (theo REST chuẩn và permission backend)
export const callUpdateCompanyProcedure = (data: ICompanyProcedure) => {
    if (!data.id) throw new Error("Thiếu ID khi cập nhật quy trình công ty");
    return axios.put<IBackendRes<ICompanyProcedure>>(
        `/api/v1/company-procedures/${data.id}`,
        { ...data }
    );
};

// Bật / Tắt (toggle active)
export const callToggleActiveCompanyProcedure = (id: string) => {
    return axios.put<IBackendRes<ICompanyProcedure>>(
        `/api/v1/company-procedures/${id}/toggle`
    );
};

/* =========================================================
   🧭 CAREER PATHS (LỘ TRÌNH THĂNG TIẾN)
========================================================= */

/* ===================== TẠO MỚI ===================== */
export const callCreateCareerPath = (data: ICareerPathRequest) => {
    return axios.post<IBackendRes<ICareerPath>>(
        `/api/v1/career-paths`,
        data
    );
};

/* ===================== CẬP NHẬT ===================== */
export const callUpdateCareerPath = (id: number | string, data: ICareerPathRequest) => {
    return axios.put<IBackendRes<ICareerPath>>(
        `/api/v1/career-paths/${id}`,
        data
    );
};

/* ===================== VÔ HIỆU HÓA (SOFT DELETE) ===================== */
export const callDeactivateCareerPath = (id: number | string) => {
    return axios.patch<IBackendRes<void>>(
        `/api/v1/career-paths/${id}/deactivate`
    );
};

/* ===================== CHI TIẾT THEO ID ===================== */
export const callGetCareerPathById = (id: number | string) => {
    return axios.get<IBackendRes<ICareerPath>>(
        `/api/v1/career-paths/${id}`
    );
};

/* ===================== LẤY THEO PHÒNG BAN ===================== */
export const callGetCareerPathByDepartment = (departmentId: number | string) => {
    return axios.get<IBackendRes<ICareerPath[]>>(
        `/api/v1/departments/${departmentId}/career-paths`
    );
};

/* ===================== GROUPED BY BAND ===================== */
export const callGetCareerPathGroupedByBand = (departmentId: number | string) => {
    return axios.get<IBackendRes<IResCareerPathBandGroup[]>>(
        `/api/v1/departments/${departmentId}/career-paths/by-band`
    );
};

/* ===================== GLOBAL SORT ===================== */
export const callGetCareerPathGlobal = (departmentId: number | string) => {
    return axios.get<IBackendRes<ICareerPath[]>>(
        `/api/v1/departments/${departmentId}/career-paths/global`
    );
};

/* ===================== TẤT CẢ ACTIVE ===================== */
export const callGetAllActiveCareerPaths = () => {
    return axios.get<IBackendRes<ICareerPath[]>>(
        `/api/v1/career-paths/active`
    );
};

/* ===================== SECTION JOB TITLES ===================== */

/* FETCH ACTIVE LIST BY SECTION (Không phân trang)  
   → Dùng cho UI hiển thị danh sách chức danh đã gán active trong bộ phận */
export const callFetchJobTitlesBySection = (sectionId: number) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/sections/${sectionId}/section-job-titles`
    );
};


/* CREATE (Gán chức danh → bộ phận)  
   → Tự động reactivate nếu đã inactive */
export const callCreateSectionJobTitle = (data: { sectionId: number; jobTitleId: number }) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/section-job-titles`,
        data
    );
};

/* DELETE (Hủy gán – Soft delete / Deactivate) */
export const callDeleteSectionJobTitle = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/section-job-titles/${id}`
    );
};

/* RESTORE (Khôi phục – Reactivate)  
   → Bật lại active cho mapping đã bị deactivate */
export const callRestoreSectionJobTitle = (id: number) => {
    return axios.patch<IBackendRes<any>>(
        `/api/v1/section-job-titles/${id}/restore`
    );
};


/* ===================== COMPANY JOB TITLES ===================== */

/* FETCH PAGINATE LIST (danh sách phân trang bảng company_job_titles riêng) */
export const callFetchCompanyJobTitles = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<any>>>(
        `/api/v1/company-job-titles?${query}`
    );
};

/* FETCH DETAIL BY ID */
export const callFetchCompanyJobTitleById = (id: number) => {
    return axios.get<IBackendRes<any>>(
        `/api/v1/company-job-titles/${id}`
    );
};

/* FETCH ALL JOB TITLES OF COMPANY  
   (tổng hợp đổ từ company + department + section, có source) */
export const callFetchCompanyJobTitlesByCompany = (companyId: number) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/companies/${companyId}/job-titles`
    );
};

/* FETCH UNASSIGNED JOB TITLES OF COMPANY  
   (danh sách chức danh chưa được gán ở bất kỳ cấp nào thuộc công ty) */
export const callFetchUnassignedJobTitlesByCompany = (companyId: number) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/companies/${companyId}/job-titles/unassigned`
    );
};

/* CREATE (Gán chức danh → công ty, tự động reactivate nếu đã inactive) */
export const callCreateCompanyJobTitle = (data: {
    companyId: number;
    jobTitleId: number;
}) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/company-job-titles`,
        data
    );
};

/* DELETE (Huỷ gán – Soft delete) */
export const callDeleteCompanyJobTitle = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/company-job-titles/${id}`
    );
};

/* RESTORE (Khôi phục – Reactivate) */
export const callRestoreCompanyJobTitle = (id: number) => {
    return axios.patch<IBackendRes<any>>(
        `/api/v1/company-job-titles/${id}/restore`
    );
};


/* ===================== COMPANY SALARY GRADE ===================== */

/**
 * Danh sách bậc lương theo companyJobTitleId
 */
export const callFetchCompanySalaryGrades = (companyJobTitleId: number) => {
    return axios.get<IBackendRes<ICompanySalaryGrade[]>>(
        `/api/v1/company-salary-grades?companyJobTitleId=${companyJobTitleId}`
    );
};

/**
 * Tạo bậc lương
 */
export const callCreateCompanySalaryGrade = (data: ICreateCompanySalaryGradeReq) => {
    return axios.post<IBackendRes<ICompanySalaryGrade>>(
        `/api/v1/company-salary-grades`,
        data
    );
};

/**
 * Cập nhật bậc lương
 */
export const callUpdateCompanySalaryGrade = (
    id: number,
    data: IUpdateCompanySalaryGradeReq
) => {
    return axios.put<IBackendRes<ICompanySalaryGrade>>(
        `/api/v1/company-salary-grades/${id}`,
        data
    );
};

/**
 * Xóa bậc lương (soft delete)
 */
export const callDeleteCompanySalaryGrade = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/company-salary-grades/${id}`
    );
};

export const callRestoreCompanySalaryGrade = (id: number) => {
    return axios.put<IBackendRes<any>>(
        `/api/v1/company-salary-grades/${id}/restore`
    );
};

/* ===================== DEPARTMENT SALARY GRADES ===================== */
export const callFetchDepartmentSalaryGrades = (departmentJobTitleId: number) => {
    return axios.get<IBackendRes<IDepartmentSalaryGrade[]>>(
        `/api/v1/department-salary-grades?departmentJobTitleId=${departmentJobTitleId}`
    );
};

export const callCreateDepartmentSalaryGrade = (
    data: ICreateDepartmentSalaryGradeReq
) => {
    return axios.post<IBackendRes<IDepartmentSalaryGrade>>(
        "/api/v1/department-salary-grades",
        data
    );
};

export const callUpdateDepartmentSalaryGrade = (
    id: number,
    data: { gradeLevel: number }
) => {
    return axios.put<IBackendRes<IDepartmentSalaryGrade>>(
        `/api/v1/department-salary-grades/${id}`,
        data
    );
};

export const callDeleteDepartmentSalaryGrade = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/department-salary-grades/${id}`
    );
};


export const callRestoreDepartmentSalaryGrade = (id: number) => {
    return axios.put<IBackendRes<any>>(
        `/api/v1/department-salary-grades/${id}/restore`
    );
};

/* ===================== SECTION SALARY GRADES ===================== */
export const callFetchSectionSalaryGrades = (sectionJobTitleId: number) => {
    return axios.get<IBackendRes<ISectionSalaryGrade[]>>(
        `/api/v1/section-salary-grades?sectionJobTitleId=${sectionJobTitleId}`
    );
};

export const callCreateSectionSalaryGrade = (data: ICreateSectionSalaryGradeReq) => {
    return axios.post<IBackendRes<ISectionSalaryGrade>>(
        "/api/v1/section-salary-grades",
        data
    );
};

export const callUpdateSectionSalaryGrade = (
    id: number,
    data: IUpdateSectionSalaryGradeReq
) => {
    return axios.put<IBackendRes<ISectionSalaryGrade>>(
        `/api/v1/section-salary-grades/${id}`,
        data
    );
};

export const callDeleteSectionSalaryGrade = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/section-salary-grades/${id}`
    );
};


export const callRestoreSectionSalaryGrade = (id: number) => {
    return axios.put<IBackendRes<any>>(
        `/api/v1/section-salary-grades/${id}/restore`
    );
};
/* ===================== JOB TITLE PERFORMANCE CONTENT ===================== */

/**
 * Fetch nội dung đánh giá theo OwnerLevel + OwnerJobTitleId
 * GET /api/v1/job-title-performance-contents/by-owner?ownerLevel=COMPANY&ownerJobTitleId=1
 */
export const callFetchJobTitlePerformanceContent = (
    ownerLevel: string,
    ownerJobTitleId: number
) => {
    return axios.get<IBackendRes<IJobTitlePerformanceContent[]>>(
        `/api/v1/job-title-performance-contents/by-owner`,
        {
            params: { ownerLevel, ownerJobTitleId },
        }
    );
};

/**
 * Tạo nội dung đánh giá
 * POST /api/v1/job-title-performance-contents
 */
export const callCreateJobTitlePerformanceContent = (
    body: IReqJobTitlePerformanceContent
) => {
    return axios.post<IBackendRes<IJobTitlePerformanceContent>>(
        `/api/v1/job-title-performance-contents`,
        body
    );
};

/**
 * Cập nhật nội dung đánh giá
 * PUT /api/v1/job-title-performance-contents/{id}
 */
export const callUpdateJobTitlePerformanceContent = (
    id: number,
    body: IReqJobTitlePerformanceContent
) => {
    return axios.put<IBackendRes<IJobTitlePerformanceContent>>(
        `/api/v1/job-title-performance-contents/${id}`,
        body
    );
};

/**
 * Vô hiệu nội dung đánh giá
 * DELETE /api/v1/job-title-performance-contents/{id}
 */
export const callDisableJobTitlePerformanceContent = (id: number) => {
    return axios.delete<IBackendRes<any>>(
        `/api/v1/job-title-performance-contents/${id}`
    );
};

/**
 * Khôi phục nội dung đánh giá
 * PUT /api/v1/job-title-performance-contents/{id}/restore
 */
export const callRestoreJobTitlePerformanceContent = (id: number) => {
    return axios.put<IBackendRes<any>>(
        `/api/v1/job-title-performance-contents/${id}/restore`
    );
};


// ======================================================================
// LẤY BẢNG KHUNG LƯƠNG (BẢNG 2 CHIỀU) THEO PHÒNG BAN
// ======================================================================

export const callFetchSalaryMatrix = (departmentId: number) => {
    return axios.get<IBackendRes<ISalaryMatrix[]>>(
        `/api/v1/departments/${departmentId}/salary-matrix`
    );
};

// ======================================================================
// CẤU TRÚC LƯƠNG — UPSERT
// ======================================================================

export const callUpsertSalaryStructure = (body: IReqSalaryStructure) => {
    return axios.post<IBackendRes<ISalaryStructure>>(
        `/api/v1/salary-structures/upsert`,
        body
    );
};

// ======================================================================
// LẤY CHI TIẾT 1 CẤU TRÚC
// ======================================================================

export const callGetSalaryStructure = (id: number) => {
    return axios.get<IBackendRes<ISalaryStructure>>(
        `/api/v1/salary-structures/${id}`
    );
};

// ======================================================================
// PERFORMANCE CONTENT
// ======================================================================

export const callGetPerformanceContent = (
    ownerLevel: "COMPANY" | "DEPARTMENT" | "SECTION",
    ownerJobTitleId: number,
    salaryGradeId: number
) => {
    return axios.get<IBackendRes<IJobTitlePerformanceContent>>(
        `/api/v1/performance-content?ownerLevel=${ownerLevel}&ownerJobTitleId=${ownerJobTitleId}&salaryGradeId=${salaryGradeId}`
    );
};

export const callUpsertPerformanceContent = (
    body: IReqJobTitlePerformanceContent
) => {
    return axios.post<IBackendRes<IJobTitlePerformanceContent>>(
        `/api/v1/performance-content/upsert`,
        body
    );
};

export const callDeletePerformanceContent = (id: number) => {
    return axios.delete<IBackendRes<any>>(
        `/api/v1/performance-content/${id}`
    );
};
/* ===================== PROCESS ACTIONS ===================== */


export const callFetchProcessActions = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IProcessAction>>>(
        `/api/v1/process-actions?${query}`
    );
};

export const callCreateProcessAction = (data: IProcessAction) => {
    return axios.post<IBackendRes<IProcessAction>>(
        "/api/v1/process-actions",
        data
    );
};

export const callUpdateProcessAction = (data: IProcessAction) => {
    return axios.put<IBackendRes<IProcessAction>>(
        "/api/v1/process-actions",
        data
    );
};

export const callDeleteProcessAction = (id: string) => {
    return axios.delete<IBackendRes<string>>(
        `/api/v1/process-actions/${id}`
    );
};

/* ===================== PERMISSION CONTENT API ===================== */

export const callFetchPermissionContent = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPermissionContent>>>(
        `/api/v1/permission-contents?${query}`
    );
};

export const callCreatePermissionContent = (data: ICreatePermissionContentReq) => {
    return axios.post<IBackendRes<any>>(`/api/v1/permission-contents`, data);
};

export const callUpdatePermissionContent = (
    id: number | string,
    data: IUpdatePermissionContentReq
) => {
    return axios.put<IBackendRes<any>>(`/api/v1/permission-contents/${id}`, data);
};

export const callDeletePermissionContent = (id: number | string) => {
    return axios.delete<IBackendRes<any>>(`/api/v1/permission-contents/${id}`);
};

export const callTogglePermissionContent = (id: number | string) => {
    return axios.patch<IBackendRes<any>>(
        `/api/v1/permission-contents/${id}/toggle`
    );
};



/* ===================== PERMISSION CATEGORY ===================== */

export const callFetchPermissionCategory = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPermissionCategory>>>(
        `/api/v1/permission-categories?${query}`
    );
};

export const callCreatePermissionCategory = (data: IPermissionCategoryRequest) => {
    return axios.post<IBackendRes<IPermissionCategory>>(
        `/api/v1/permission-categories`,
        data
    );
};

export const callUpdatePermissionCategory = (
    id: string | number,
    data: IPermissionCategoryRequest
) => {
    return axios.put<IBackendRes<IPermissionCategory>>(
        `/api/v1/permission-categories/${id}`,
        data
    );
};

export const callDeletePermissionCategory = (id: string | number) => {
    return axios.delete<IBackendRes<any>>(
        `/api/v1/permission-categories/${id}`
    );
};
/* ======================================================
   PERMISSION MATRIX API
====================================================== */

export const callGetPermissionMatrix = (contentId: number) => {
    return axios.get<IBackendRes<IPermissionMatrix>>(
        `/api/v1/permission-contents/${contentId}/matrix`
    );
};

export const callAssignPermission = (
    contentId: number,
    data: IAssignPermissionReq
) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/permission-contents/${contentId}/assign`,
        data
    );
};


/* ===================== JD ===================== */

export const callFetchJobDescriptions = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJobDescriptionList>>>(
        `/api/v1/job-descriptions?${query}`
    );
};

export const callGetJobDescriptionById = (id: number) => {
    return axios.get<IBackendRes<IJobDescription>>(
        `/api/v1/job-descriptions/${id}`
    );
};

export const callCreateJobDescription = (data: ICreateJobDescriptionReq) => {
    return axios.post<IBackendRes<IJobDescription>>(
        "/api/v1/job-descriptions",
        data
    );
};

export const callUpdateJobDescription = (data: IUpdateJobDescriptionReq) => {
    return axios.put<IBackendRes<IJobDescription>>(
        "/api/v1/job-descriptions",
        data
    );
};

export const callDeleteJobDescription = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/job-descriptions/${id}`
    );
};

export const callSubmitJobDescription = (id: number) => {
    return axios.post<IBackendRes<IJobDescription>>(
        `/api/v1/job-descriptions/${id}/submit`
    );
};

export const callIssueJobDescription = (id: number) => {
    return axios.post<IBackendRes<IJobDescription>>(
        `/api/v1/job-descriptions/${id}/issue`
    );
};
/* ===================== PERMISSION MATRIX REAL API ===================== */
export const callFetchPermissionCategoriesByDepartment = (departmentId: number) => {
    return axios.get<IBackendRes<IPermissionCategory[]>>(
        `/api/v1/permission-categories/by-department/${departmentId}`
    );
};

export const callFetchPermissionMatrixByCategory = (categoryId: number) => {
    return axios.get<IBackendRes<IPermissionCategoryMatrix>>(
        `/api/v1/permission-categories/${categoryId}/matrix`
    );
};