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
    IPermissionContent, IPermissionCategoryRequest, IUpdatePermissionContentReq, ICreatePermissionContentReq, IPermissionMatrix, IAssignPermissionReq,
    IJobDescription, IDepartmentMissionTree,
    ICreateDepartmentMissionReq, IDepartmentProcedure, IReqUpdateProfileDTO, IOrgChart, IOrgNode, IUserPosition, IEmployeeCareerPath, IEmployeeCareerPathHistory, IReqAssignCareerPath
    , IReqPromoteEmployee, ICareerPathTemplate, ICareerPathTemplateRequest, IReqChangePasswordDTO, IDashboardSummary, IEmployee, ICreateEmployeeReq, IUpdateEmployeeReq, IDepartmentCompleteness, IJobTitleByLevel, ICareerPathPreviewResponse, ICareerPathBulkRequest
    , ICareerPathBulkResult, IJobTitleAssignStatus, IAccessDTO, IShareLogDTO, ICreateShareTokenRequest,
    IResShareTokenDTO,
    IResPublicProcedureDTO, IReqCreateNodeTree, IDocumentCategory,
    IDocument,
    IDocumentRequest,
    IAccountingDossier,
    IAccountingDossierAuditLog,
    IAccountingDossierCategory,
    IAccountingDossierCategoryRequest,
    IAccountingDossierRequest,
    IAccountingDossierDocument,
    IAccountingDossierDocumentRequest,
    IAccountingDocumentRequest,
    ProcedureType,
    IDocumentFolder,
    IAccountingDocumentCategory,
    IAccountingDocumentCategoryRequest,
    IDocumentAudit
} from '@/types/backend';

import axios from 'config/axios-customize';

export const callLogin = (username: string, password: string) => {
    return axios.post<IBackendRes<IAccount>>('/api/v1/auth/login', { username, password })
}

export const callFetchAccount = () => {
    return axios.get<IBackendRes<IGetAccount>>('/api/v1/auth/account')
}

export const callRefreshToken = () => {
    return axios.post<IBackendRes<IAccount>>('/api/v1/auth/refresh')
}

export const callLogout = () => {
    return axios.post<IBackendRes<string>>('/api/v1/auth/logout')
}

export const callUpdateProfile = (data: IReqUpdateProfileDTO) => {
    return axios.put<IBackendRes<IUser>>(
        "/api/v1/users/profile",
        data
    );
};

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
export const callFetchUserById = (id: string) => {
    return axios.get<IBackendRes<IUser>>(`/api/v1/users/${id}`);
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

/* ===================== EMPLOYEES ===================== */

export const callFetchEmployees = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IEmployee>>>(
        `/api/v1/employees?${query}`
    );
};

export const callFetchEmployeeById = (id: string) => {
    return axios.get<IBackendRes<IEmployee>>(
        `/api/v1/employees/${id}`
    );
};

export const callCreateEmployee = (data: ICreateEmployeeReq) => {
    return axios.post<IBackendRes<IEmployee>>(
        `/api/v1/employees`,
        data
    );
};

export const callUpdateEmployee = (data: IUpdateEmployeeReq) => {
    return axios.put<IBackendRes<IEmployee>>(
        `/api/v1/employees`,
        data
    );
};

export const callDeleteEmployee = (id: string) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/employees/${id}`
    );
};
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
/* ===================== USER POSITIONS ===================== */

export const callFetchUserPositions = (userId: string) => {
    return axios.get<IBackendRes<IUserPosition[]>>(
        `/api/v1/users/${userId}/positions`
    );
};

export const callCreateUserPosition = (
    userId: string,
    data: {
        source: string;
        companyJobTitleId?: number;
        departmentJobTitleId?: number;
        sectionJobTitleId?: number;
    }
) => {
    return axios.post<IBackendRes<IUserPosition>>(
        `/api/v1/users/${userId}/positions`,
        data
    );
};

export const callDeleteUserPosition = (id: string) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/users/positions/${id}`
    );
};


// ← THÊM
export const callFetchUsersByCompany = (companyId: number) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/users/by-company/${companyId}`
    );
};

export const callFetchUsersCrossCompany = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<any>>>(
        `/api/v1/users/cross-company?${query}`
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
// LẤY PHÒNG BAN THEO CÔNG TY
export const callFetchDepartmentsByCompany = (companyId: number) => {
    return axios.get<IBackendRes<IDepartment[]>>(
        `/api/v1/departments/by-company/${companyId}`
    );
};
/* FETCH JOB TITLES WITH ASSIGN STATUS (cho modal gán chức danh vào phòng ban) */
export const callFetchJobTitlesWithAssignStatus = (
    departmentId: number,
    params?: {
        search?: string;
        status?: string;
        band?: string;
        level?: number;
        page?: number;
        size?: number;
    }
) => {
    return axios.get<IBackendRes<IModelPaginate<IJobTitleAssignStatus>>>(
        `/api/v1/departments/${departmentId}/job-titles/assign-status`,
        { params }
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

// LẤY BỘ PHẬN THEO PHÒNG BAN
export const callFetchSectionsByDepartment = (departmentId: number) => {
    return axios.get<IBackendRes<ISection[]>>(
        `/api/v1/sections/by-department/${departmentId}`
    );
};
/* ===================== POSITION LEVELS ===================== */


export const callFetchPositionLevel = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPositionLevel>>>(
        `/api/v1/position-levels?${query}`
    );
};

// ⭐ THAY — thêm companyId vào payload
export const callCreatePositionLevel = (data: {
    code: string;
    bandOrder?: number;
    companyId: number; // ⭐ THÊM
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
export const callFetchPositionLevelById = (id: number) => {
    return axios.get<IBackendRes<IPositionLevel>>(
        `/api/v1/position-levels/${id}`
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

export const callFetchJobTitleById = (id: number) => {
    return axios.get<IBackendRes<IJobTitle>>(
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
export const callToggleActiveCompanyProcedure = (id: number) => {
    return axios.put<IBackendRes<void>>(
        `/api/v1/company-procedures/${id}/active`
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

/* ===================== CAREER PATH — BULK & PREVIEW (MỚI) ===================== */

export const callGetJobTitlesByLevel = (departmentId: number, levelCode: string) => {
    return axios.get<IBackendRes<IJobTitleByLevel[]>>(
        `/api/v1/departments/${departmentId}/job-titles/by-level/${levelCode}`
    );
};

export const callPreviewBulkCareerPath = (data: ICareerPathBulkRequest) => {
    return axios.post<IBackendRes<ICareerPathPreviewResponse>>(
        `/api/v1/career-paths/preview`,
        data
    );
};

export const callBulkCreateCareerPath = (data: ICareerPathBulkRequest) => {
    return axios.post<IBackendRes<ICareerPathBulkResult>>(
        `/api/v1/career-paths/bulk`,
        data
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
    return axios.put(
        `/api/v1/job-title-performance-contents/${id}/disable`
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
export const callFetchMySalaryMatrix = (departmentId: number) => {
    return axios.get<IBackendRes<ISalaryMatrix[]>>(
        `/api/v1/departments/${departmentId}/salary-matrix/my`
    );
};
// ======================================================================
// KHUNG LƯƠNG
// ======================================================================
// Khung lương cá nhân
export const callFetchMyCompanySalaryGrades = () => {
    return axios.get<IBackendRes<ICompanySalaryGrade[]>>(
        `/api/v1/company-salary-grades/my`
    );
};

export const callFetchMyDepartmentSalaryGrades = () => {
    return axios.get<IBackendRes<IDepartmentSalaryGrade[]>>(
        `/api/v1/department-salary-grades/my`
    );
};

export const callFetchMySectionSalaryGrades = () => {
    return axios.get<IBackendRes<ISectionSalaryGrade[]>>(
        `/api/v1/section-salary-grades/my`
    );
};

// Khung lương toàn công ty / phòng ban / bộ phận
export const callFetchMyCompanyAllSalaryGrades = () => {
    return axios.get<IBackendRes<ICompanySalaryGrade[]>>(
        `/api/v1/company-salary-grades/my-company`
    );
};

export const callFetchMyDepartmentAllSalaryGrades = () => {
    return axios.get<IBackendRes<IDepartmentSalaryGrade[]>>(
        `/api/v1/department-salary-grades/my-department`
    );
};

export const callFetchMySectionAllSalaryGrades = () => {
    return axios.get<IBackendRes<ISectionSalaryGrade[]>>(
        `/api/v1/section-salary-grades/my-section`
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
export const callFetchProcessActionById = (id: number) => {
    return axios.get<IBackendRes<IProcessAction>>(
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
export const callFetchPermissionContentById = (id: number | string) => {
    return axios.get<IBackendRes<IPermissionContent>>(
        `/api/v1/permission-contents/${id}`
    );
};
// ← THÊM DÒNG NÀY
export const callFetchPermissionCategoryById = (id: number | string) => {
    return axios.get<IBackendRes<IPermissionCategory>>(
        `/api/v1/permission-categories/${id}`
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


/* ===================== JOB DESCRIPTION ===================== */
export const callFetchJobDescriptions = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJobDescription>>>(
        `/api/v1/job-descriptions?${query}`
    );
};

export const callFetchJobDescriptionById = (id: number) => {
    return axios.get<IBackendRes<IJobDescription>>(
        `/api/v1/job-descriptions/${id}`
    );
};

export const callCreateJobDescription = (data: IJobDescription) => {
    return axios.post<IBackendRes<IJobDescription>>(
        "/api/v1/job-descriptions",
        { ...data }
    );
};

export const callUpdateJobDescription = (
    id: number,
    data: IJobDescription
) => {
    return axios.put<IBackendRes<IJobDescription>>(
        `/api/v1/job-descriptions/${id}`,
        { ...data }
    );
};

export const callDeleteJobDescription = (id: number) => {
    return axios.delete<IBackendRes<IJobDescription>>(
        `/api/v1/job-descriptions/${id}`
    );
};


export const callFetchMyJobDescriptions = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJobDescription>>>(
        `/api/v1/job-descriptions/my?${query}`
    );
};

export const callFetchPublishedJobDescriptions = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJobDescription>>>(
        `/api/v1/job-descriptions/published?${query}`
    );
};

export const callFetchRejectedJobDescriptions = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJobDescription>>>(
        `/api/v1/job-descriptions/rejected?${query}`
    );
};

export const callFetchAllJobDescriptions = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJobDescription>>>(
        `/api/v1/job-descriptions/all?${query}`
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

/* ===================== DEPARTMENT OBJECTIVES ===================== */

export const callFetchDepartmentObjectives = (departmentId: number) => {
    return axios.get(`/api/v1/departments/${departmentId}/objectives`)
}

export const callCreateDepartmentObjective = (data: any) => {
    return axios.post<IBackendRes<IDepartmentMissionTree>>(
        `/api/v1/department-objectives`, data
    );

}


export const callDeleteDepartmentObjective = (id: number) => {
    return axios.delete(`/api/v1/department-objectives/${id}`)
}
/* ===================== DEPARTMENT PROCEDURES ===================== */

export const callFetchDepartmentProcedures = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IDepartmentProcedure>>>(
        `/api/v1/department-procedures?${query}`
    );
};

export const callFetchDepartmentProcedureById = (id: number) => {
    return axios.get<IBackendRes<IDepartmentProcedure>>(
        `/api/v1/department-procedures/${id}`
    );
};

export const callCreateDepartmentProcedure = (data: IDepartmentProcedure) => {
    return axios.post<IBackendRes<IDepartmentProcedure>>(
        `/api/v1/department-procedures`,
        data
    );
};

export const callUpdateDepartmentProcedure = (data: IDepartmentProcedure) => {

    if (!data.id) {
        throw new Error("Thiếu ID khi cập nhật Department Procedure");
    }

    return axios.put<IBackendRes<IDepartmentProcedure>>(
        `/api/v1/department-procedures/${data.id}`,
        data
    );
};

export const callDeleteDepartmentProcedure = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/department-procedures/${id}`
    );
};


/* ===================== ORG CHARTS ===================== */

export const callFetchOrgCharts = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IOrgChart>>>(
        `/api/v1/job-position-charts?${query}`
    );
};

export const callCreateOrgChart = (data: IOrgChart) => {
    return axios.post<IBackendRes<IOrgChart>>(
        `/api/v1/job-position-charts`,
        data
    );
};

export const callUpdateOrgChart = (data: IOrgChart) => {
    return axios.put<IBackendRes<IOrgChart>>(
        `/api/v1/job-position-charts`,
        data
    );
};

export const callDeleteOrgChart = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/job-position-charts/${id}`
    );
};


/* ===================== ORG NODES ===================== */

export const callFetchOrgNodes = (chartId: number) => {
    return axios.get<IBackendRes<IOrgNode[]>>(
        `/api/v1/job-position-nodes/chart/${chartId}`
    );
};

export const callCreateOrgNode = (data: any) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/job-position-nodes`,
        data
    );
};

export const callUpdateOrgNode = (data: any) => {
    return axios.put<IBackendRes<any>>(
        `/api/v1/job-position-nodes`,
        data
    );
};

export const callUpdateOrgNodePositions = (data: { id: number; posX: number; posY: number }[]) => {
    return axios.put<IBackendRes<any>>(
        `/api/v1/job-position-nodes/positions`,
        data
    );
};

export const callDeleteOrgNode = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/job-position-nodes/${id}`
    );
};
export const callCreateOrgNodeBulkTree = (data: IReqCreateNodeTree[]) => {
    return axios.post<IBackendRes<IOrgNode[]>>(
        `/api/v1/job-position-nodes/bulk-tree`,
        data
    );
};
/* ===================== JD FLOW API ===================== */

/**
 * Lấy trạng thái flow của JD
 * GET /api/v1/jd-flow/{jdId}
 */
export const callFetchJdFlow = (jdId: number) => {
    return axios.get<IBackendRes<any>>(
        `/api/v1/jd-flow/${jdId}`
    );
};

/**
 * Lấy danh sách JD đang chờ tôi duyệt
 * GET /api/v1/jd-flow/inbox
 */
export const callFetchJdFlowInbox = () => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/jd-flow/inbox`
    );
};

/**
 * Lấy danh sách user có quyền duyệt JD
 * GET /api/v1/jd-flow/approvers
 */
export const callFetchJdApprovers = (jdId?: number) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/jd-flow/approvers${jdId ? `?jdId=${jdId}` : ""}`
    );
};
/**
 * Lấy timeline duyệt JD
 * GET /api/v1/jd-flow/logs/{jdId}
 */
export const callFetchJdFlowLogs = (jdId: number) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/jd-flow/logs/${jdId}`
    );
};

/**
 * Gửi JD đi duyệt
 * POST /api/v1/jd-flow/submit
 */
export const callSubmitJdFlow = (data: {
    jdId: number;
    nextUserId?: string;
    comment?: string;
    returnToPrevious?: boolean; // ✅ THÊM DÒNG NÀY
    // ← thêm
}) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/jd-flow/submit`,
        data
    );
};

/**
 * Duyệt JD và chuyển tiếp
 * POST /api/v1/jd-flow/approve
 */
export const callApproveJdFlow = (data: {
    jdId: number;
    nextUserId?: string;
}) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/jd-flow/approve`,
        data
    );
};
export const callRecallJdFlow = (jdId: number) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/jd-flow/recall/${jdId}`
    );
};
/**
 * Từ chối JD
 * POST /api/v1/jd-flow/reject
 */
export const callRejectJdFlow = (data: {
    jdId: number;
    comment?: string;
}) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/jd-flow/reject`,
        data
    );
};

/**
 * Ban hành JD
 * POST /api/v1/jd-flow/issue
 */
export const callIssueJdFlow = (data: {
    jdId: number;
}) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/jd-flow/issue`,
        data
    );
};
/**
 * Lấy danh sách user có quyền ban hành JD
 * GET /api/v1/jd-flow/issuers
 */
export const callFetchJdIssuers = (jdId?: number) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/jd-flow/issuers${jdId ? `?jdId=${jdId}` : ""}`
    );
};
/* ===================== PASSWORD RESET ===================== */

export const callRequestPasswordCode = (email: string) => {
    return axios.post<IBackendRes<{
        success: boolean;
        message: string;
        mode: "activate" | "reset"; // 👈 THÊM DÒNG NÀY
    }>>(
        "/api/v1/users/request-password-code",
        { email }
    );
};
export const callConfirmResetPassword = (
    email: string,
    code: string,
    newPassword: string
) => {
    return axios.post<IBackendRes<{ success: boolean; message: string }>>(
        "/api/v1/users/confirm-reset-password",
        { email, code, newPassword }
    );
};
/* ===================== PROCEDURES (DÙNG CHUNG) ===================== */

// Tạo mới
export const callCreateProcedure = (
    type: ProcedureType, // ← ĐỔI
    data: {
        procedureName: string;
        status?: string;
        planYear?: number;
        fileUrls?: string[]; // ← đổi
        note?: string;
        departmentId?: number | null;
        sectionId?: number | null;
        userIds?: string[];   // ← THÊM

    }
) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/procedures?type=${type}`,
        data
    );
};

// Cập nhật
export const callUpdateProcedure = (
    type: ProcedureType, // ← ĐỔI
    id: number,
    data: {
        procedureName: string;
        status?: string;
        planYear?: number;
        fileUrls?: string[]; // ← đổi
        note?: string;
        departmentId?: number | null;
        sectionId?: number | null;
        userIds?: string[];   // ← THÊM
    }
) => {
    return axios.put<IBackendRes<any>>(
        `/api/v1/procedures/${id}?type=${type}`,
        data
    );
};

// Xoá
export const callDeleteProcedure = (
    type: ProcedureType, // ← ĐỔI
    id: number
) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/procedures/${id}?type=${type}`
    );
};

// Bật/tắt active
export const callToggleActiveProcedure = (
    type: ProcedureType, // ← ĐỔI
    id: number
) => {
    return axios.put<IBackendRes<void>>(
        `/api/v1/procedures/${id}/active?type=${type}`
    );
};

// Danh sách (phân trang)
export const callFetchProcedures = (
    type: ProcedureType, // ← THÊM
    query: string
) => {
    return axios.get<IBackendRes<IModelPaginate<any>>>(
        `/api/v1/procedures?type=${type}&${query}`
    );
};

// Chi tiết
export const callFetchProcedureById = (
    type: ProcedureType, // ← THÊM
    id: number
) => {
    return axios.get<IBackendRes<any>>(
        `/api/v1/procedures/${id}?type=${type}`
    );
};

// Theo phòng ban
export const callFetchProceduresByDepartment = (
    type: ProcedureType, // ← THÊM
    departmentId: number
) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/procedures/by-department/${departmentId}?type=${type}`
    );
};

// Theo bộ phận
export const callFetchProceduresBySection = (
    type: ProcedureType, // ← THÊM
    sectionId: number
) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/procedures/by-section/${sectionId}?type=${type}`
    );
};

// Xem lịch sử version
export const callFetchProcedureHistory = (
    type: ProcedureType, // ← THÊM
    id: number
) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/procedures/${id}/history?type=${type}`
    );
};

// Theo công ty
export const callFetchProceduresByCompany = (
    type: ProcedureType, // ← ĐỔI
    companyId: number
) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/procedures/by-company/${companyId}?type=${type}`
    );
};

// Danh sách công ty CÓ FILTER
export const callFetchCompanyProceduresWithFilter = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<any>>>(
        `/api/v1/procedures/company?${query}`
    );
};

// Danh sách phòng ban CÓ FILTER
export const callFetchDepartmentProceduresWithFilter = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<any>>>(
        `/api/v1/procedures/department?${query}`
    );
};

// ← THÊM: Danh sách bảo mật CÓ FILTER
export const callFetchConfidentialProceduresWithFilter = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<any>>>(
        `/api/v1/procedures/confidential?${query}`
    );
};

// Tạo phiên bản mới
export const callReviseProcedure = (
    type: ProcedureType, // ← ĐỔI
    id: number,
    data: {
        procedureName: string;
        status?: string;
        planYear?: number;
        fileUrls?: string[]; // ← đổi
        note?: string;
        departmentId?: number | null;
        sectionId?: number | null;
        userIds?: string[];   // ← THÊM
    }
) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/procedures/${id}/revise?type=${type}`,
        data
    );
};
/* ===================== EMPLOYEE CAREER PATH ===================== */

export const callAssignEmployeeCareerPath = (data: IReqAssignCareerPath) => {
    return axios.post<IBackendRes<IEmployeeCareerPath>>(
        `/api/v1/employee-career-paths`,
        data
    );
};

export const callUpdateEmployeeCareerPath = (id: string, data: IReqAssignCareerPath) => {
    return axios.put<IBackendRes<IEmployeeCareerPath>>(
        `/api/v1/employee-career-paths/${id}`,
        data
    );
};

export const callPromoteEmployee = (id: string, data: IReqPromoteEmployee) => {
    return axios.post<IBackendRes<IEmployeeCareerPath>>(
        `/api/v1/employee-career-paths/${id}/promote`,
        data
    );
};

export const callSetEmployeeCareerPathStatus = (id: number, status: number) => {
    return axios.patch<IBackendRes<void>>(
        `/api/v1/employee-career-paths/${id}/status`,
        null,
        { params: { status } }
    );
};

export const callGetEmployeeCareerPathByUser = (userId: string) => {
    return axios.get<IBackendRes<IEmployeeCareerPath>>(
        `/api/v1/employee-career-paths/user/${userId}`
    );
};

export const callGetEmployeeCareerPathsByDepartment = (departmentId: number) => {
    return axios.get<IBackendRes<IEmployeeCareerPath[]>>(
        `/api/v1/employee-career-paths/department/${departmentId}`
    );
};

export const callGetUpcomingPromotions = (withinDays: number = 30) => {
    return axios.get<IBackendRes<IEmployeeCareerPath[]>>(
        `/api/v1/employee-career-paths/upcoming-promotions`,
        { params: { withinDays } }
    );
};

export const callGetEmployeeCareerPathHistory = (userId: string) => {
    return axios.get<IBackendRes<IEmployeeCareerPathHistory[]>>(
        `/api/v1/employee-career-paths/history/${userId}`
    );
};
/* ===================== CAREER PATH TEMPLATES ===================== */
export const callCreateCareerPathTemplate = (data: ICareerPathTemplateRequest) => {
    return axios.post<IBackendRes<ICareerPathTemplate>>(`/api/v1/career-path-templates`, data);
};

export const callUpdateCareerPathTemplate = (id: number, data: ICareerPathTemplateRequest) => {
    return axios.put<IBackendRes<ICareerPathTemplate>>(`/api/v1/career-path-templates/${id}`, data);
};

export const callDeactivateCareerPathTemplate = (id: number) => {
    return axios.patch<IBackendRes<void>>(`/api/v1/career-path-templates/${id}/deactivate`);
};

export const callActivateCareerPathTemplate = (id: number) => {
    return axios.patch<IBackendRes<void>>(`/api/v1/career-path-templates/${id}/activate`);
};

export const callGetCareerPathTemplateById = (id: number) => {
    return axios.get<IBackendRes<ICareerPathTemplate>>(`/api/v1/career-path-templates/${id}`);
};

export const callGetAllCareerPathTemplates = () => {
    return axios.get<IBackendRes<ICareerPathTemplate[]>>(`/api/v1/career-path-templates`);
};

export const callGetActiveCareerPathTemplates = () => {
    return axios.get<IBackendRes<ICareerPathTemplate[]>>(`/api/v1/career-path-templates/active`);
};

export const callGetCareerPathTemplatesByDepartment = (departmentId: number) => {
    return axios.get<IBackendRes<ICareerPathTemplate[]>>(
        `/api/v1/career-path-templates/by-department/${departmentId}`
    );
};

// ← thêm deactivate employee career path
export const callDeactivateEmployeeCareerPath = (id: number) => {
    return axios.patch<IBackendRes<void>>(`/api/v1/employee-career-paths/${id}/deactivate`);
};
// ⭐ THÊM VÀO CUỐI FILE
export const callChangePassword = (data: IReqChangePasswordDTO) => {
    return axios.post<IBackendRes<void>>(
        "/api/v1/auth/change-password",
        data
    );
};
/* ===================== DASHBOARD ===================== */

export const callFetchDashboardSummary = () => {
    return axios.get<IBackendRes<IDashboardSummary>>(
        "/api/v1/dashboard/summary"
    );
};
export const callFetchDepartmentCompleteness = () => {
    return axios.get<IBackendRes<IDepartmentCompleteness[]>>(
        "/api/v1/dashboard/department-completeness"
    );
};
export const callFetchUsersUnassignedCareerPath = (departmentId: number) => {
    return axios.get<IBackendRes<IUser[]>>(
        `/api/v1/departments/${departmentId}/users/unassigned-career-path`
    );
};
// SHARE quy trình bảo mật
export const callShareProcedure = (id: number, userIds: string[]) => {
    return axios.post<IBackendRes<void>>(
        `/api/v1/procedures/${id}/share`,
        { userIds }
    );
};

// Lấy danh sách người có quyền
export const callFetchProcedureAccessList = (id: number) => {
    return axios.get<IBackendRes<IAccessDTO[]>>(
        `/api/v1/procedures/${id}/access-list`
    );
};

// Thu hồi quyền
export const callRevokeProcedureAccess = (id: number, userId: string) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/procedures/${id}/access/${userId}`
    );
};
// Lịch sử tôi đã gửi
export const callFetchSentShareLog = () => {
    return axios.get<IBackendRes<IShareLogDTO[]>>(
        `/api/v1/procedures/share-log/sent`
    );
};

// Lịch sử tôi đã nhận
export const callFetchReceivedShareLog = () => {
    return axios.get<IBackendRes<IShareLogDTO[]>>(
        `/api/v1/procedures/share-log/received`
    );
};

// Toàn bộ log — admin
export const callFetchAllShareLog = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IShareLogDTO>>>(
        `/api/v1/procedures/share-log/all?${query}`
    );
};
/* ===================== PROCEDURE SHARE TOKEN ===================== */

// Tạo share token
export const callCreateShareToken = (
    procedureId: number,
    data: ICreateShareTokenRequest
) => {
    return axios.post<IBackendRes<IResShareTokenDTO>>(
        `/api/v1/procedures/${procedureId}/share-tokens`,
        data
    );
};

// Danh sách share token của 1 quy trình
export const callFetchShareTokens = (
    procedureId: number,
    procedureType: string
) => {
    return axios.get<IBackendRes<IResShareTokenDTO[]>>(
        `/api/v1/procedures/${procedureId}/share-tokens`,
        { params: { procedureType } }
    );
};

// Thu hồi share token
export const callRevokeShareToken = (tokenId: number) => {
    return axios.patch<IBackendRes<void>>(
        `/api/v1/procedures/share-tokens/${tokenId}/revoke`
    );
};

// Public view — không cần JWT
export const callPublicViewProcedure = (token: string) => {
    return axios.get<IBackendRes<IResPublicProcedureDTO | { requirePin: boolean }>>(
        `/public/view/${token}`
    );
};

// Public verify PIN — không cần JWT
export const callPublicVerifyPin = (token: string, pin: string) => {
    return axios.post<IBackendRes<IResPublicProcedureDTO>>(
        `/public/view/${token}/verify-pin`,
        { pin }
    );
};
// Lịch sử truy cập của 1 share token
export const callFetchShareTokenAccessLogs = (tokenId: number) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/procedures/share-tokens/${tokenId}/access-logs`
    );
};
// Gửi email chia sẻ token (PIN + QR)
export const callSendShareEmail = (tokenId: number, email: string) => {
    return axios.post<IBackendRes<void>>(
        `/api/v1/procedures/share-tokens/${tokenId}/send-email`,
        { email }
    );
};
/* ===================== DOCUMENT CATEGORIES ===================== */

export const callFetchDocumentCategory = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<IDocumentCategory>>>(
        `/api/v1/document-categories?${query}`
    );

export const callFetchDocumentCategoryActive = () =>
    axios.get<IBackendRes<IDocumentCategory[]>>(
        `/api/v1/document-categories/active`
    );

export const callFetchDocumentCategoryMappingProcedure = () =>
    axios.get<IBackendRes<IDocumentCategory[]>>(
        `/api/v1/document-categories/mapping-procedure`
    );

export const callCreateDocumentCategory = (data: IDocumentCategory) =>
    axios.post<IBackendRes<IDocumentCategory>>(
        `/api/v1/document-categories`,
        data
    );

export const callUpdateDocumentCategory = (id: number, data: IDocumentCategory) =>
    axios.put<IBackendRes<IDocumentCategory>>(
        `/api/v1/document-categories/${id}`,
        data
    );

export const callToggleActiveDocumentCategory = (id: number) =>
    axios.put<IBackendRes<void>>(
        `/api/v1/document-categories/${id}/active`
    );



/* ===================== ACCOUNTING DOCUMENTS ===================== */
export const callFetchAccountingDossiers = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<IAccountingDossier>>>(
        `/api/v1/accounting-dossiers?${query}`
    );

export const callFetchAccountingDossierById = (id: number) =>
    axios.get<IBackendRes<IAccountingDossier>>(
        `/api/v1/accounting-dossiers/${id}`
    );

export const callCreateAccountingDossier = (data: IAccountingDossierRequest) =>
    axios.post<IBackendRes<IAccountingDossier>>(
        `/api/v1/accounting-dossiers`,
        data
    );

export const callUpdateAccountingDossier = (id: number, data: IAccountingDossierRequest) =>
    axios.put<IBackendRes<IAccountingDossier>>(
        `/api/v1/accounting-dossiers/${id}`,
        data
    );

export const callDeleteAccountingDossier = (id: number) =>
    axios.delete<IBackendRes<void>>(`/api/v1/accounting-dossiers/${id}`);

export const callSubmitAccountingDossier = (id: number) =>
    axios.post<IBackendRes<IAccountingDossier>>(`/api/v1/accounting-dossiers/${id}/submit`);

export const callRequestReturnAccountingDossier = (id: number, note?: string) =>
    axios.post<IBackendRes<IAccountingDossier>>(`/api/v1/accounting-dossiers/${id}/request-return`, { note });

export const callFetchAccountingDossierLogs = (id: number) =>
    axios.get<IBackendRes<IAccountingDossierAuditLog[]>>(`/api/v1/accounting-dossiers/${id}/logs`);

export const callFetchAccountingDossierCategories = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<IAccountingDossierCategory>>>(
        `/api/v1/accounting-dossiers/categories?${query}`
    );

export const callFetchAccountingDossierCategoryActive = () =>
    axios.get<IBackendRes<IAccountingDossierCategory[]>>(`/api/v1/accounting-dossiers/categories/active`);

export const callCreateAccountingDossierCategory = (data: IAccountingDossierCategoryRequest) =>
    axios.post<IBackendRes<IAccountingDossierCategory>>(`/api/v1/accounting-dossiers/categories`, data);

export const callUpdateAccountingDossierCategory = (id: number, data: IAccountingDossierCategoryRequest) =>
    axios.put<IBackendRes<IAccountingDossierCategory>>(`/api/v1/accounting-dossiers/categories/${id}`, data);

export const callToggleAccountingDossierCategoryActive = (id: number, active: boolean) =>
    axios.put<IBackendRes<IAccountingDossierCategory>>(`/api/v1/accounting-dossiers/categories/${id}/active`, { active });

export const callFetchDossierDocuments = (dossierId: number) =>
    axios.get<IBackendRes<IAccountingDossierDocument[]>>(`/api/v1/accounting-dossiers/${dossierId}/documents`);

export const callAddDossierDocument = (dossierId: number, data: IAccountingDossierDocumentRequest) =>
    axios.post<IBackendRes<IAccountingDossierDocument>>(`/api/v1/accounting-dossiers/${dossierId}/documents`, data);

export const callUpdateDossierDocument = (dossierId: number, docId: number, data: IAccountingDossierDocumentRequest) =>
    axios.put<IBackendRes<IAccountingDossierDocument>>(`/api/v1/accounting-dossiers/${dossierId}/documents/${docId}`, data);

export const callDeleteDossierDocument = (dossierId: number, docId: number) =>
    axios.delete<IBackendRes<void>>(`/api/v1/accounting-dossiers/${dossierId}/documents/${docId}`);

export const callFetchAccountingDocuments = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<IDocument>>>(
        `/api/v1/accounting-documents?${query}`
    );

export const callFetchAccountingDocumentById = (id: number) =>
    axios.get<IBackendRes<IDocument>>(
        `/api/v1/accounting-documents/${id}`
    );

export const callCreateAccountingDocument = (data: IAccountingDocumentRequest) =>
    axios.post<IBackendRes<IDocument>>(
        `/api/v1/accounting-documents`,
        data
    );

export const callUpdateAccountingDocument = (id: number, data: IAccountingDocumentRequest) =>
    axios.put<IBackendRes<IDocument>>(
        `/api/v1/accounting-documents/${id}`,
        data
    );

export const callLockAccountingDocument = (id: number, lockStatus: boolean) =>
    axios.put<IBackendRes<void>>(
        `/api/v1/accounting-documents/${id}/lock?lockStatus=${lockStatus}`
    );

export const callDeleteAccountingDocument = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/accounting-documents/${id}`
    );
};

export const callFetchAccountingDocumentAudits = (id: number) => {
    return axios.get<IBackendRes<IDocumentAudit[]>>(
        `/api/v1/accounting-documents/${id}/audits`
    );
};

export const callExportAccountingDocuments = (query: string) => {
    return axios.get<IBackendRes<IDocument[]>>(
        `/api/v1/accounting-documents/export?${query}`
    );
};
export const callFetchAccountingFolderTree = (companyId: number) =>
    axios.get<IBackendRes<IDocumentFolder[]>>(
        `/api/v1/folders/accounting/tree?companyId=${companyId}`
    );

export const callCreateAccountingFolder = (data: any) =>
    axios.post<IBackendRes<IDocumentFolder>>(
        `/api/v1/folders`,
        { ...data, folderType: "ACCOUNTING" }
    );

export const callUpdateAccountingFolder = (id: number, data: any) =>
    axios.put<IBackendRes<IDocumentFolder>>(
        `/api/v1/folders/${id}`,
        { ...data, folderType: "ACCOUNTING" }
    );

export const callDeleteAccountingFolder = (id: number) =>
    axios.delete<IBackendRes<void>>(
        `/api/v1/folders/${id}`
    );

/* ===================== DOCUMENTS ===================== */

export const callFetchDocuments = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<IDocument>>>(
        `/api/v1/documents?${query}`
    );

export const callFetchDocumentById = (id: number) =>
    axios.get<IBackendRes<IDocument>>(
        `/api/v1/documents/${id}`
    );

export const callMarkDocumentRead = (id: number) =>
    axios.put<IBackendRes<void>>(
        `/api/v1/documents/${id}/read`
    );

export const callCreateDocument = (data: IDocumentRequest) =>
    axios.post<IBackendRes<IDocument>>(
        `/api/v1/documents`,
        data
    );

export const callUpdateDocument = (id: number, data: IDocumentRequest) =>
    axios.put<IBackendRes<IDocument>>(
        `/api/v1/documents/${id}`,
        data
    );


export const callToggleActiveDocument = (id: number) =>
    axios.put<IBackendRes<void>>(
        `/api/v1/documents/${id}/active`
    );

export const callDeleteDocument = (id: number) =>
    axios.delete<IBackendRes<void>>(
        `/api/v1/documents/${id}`
    );

export const callCreateDocumentShortcut = (documentId: number, folderId: number) =>
    axios.post<IBackendRes<void>>(
        `/api/v1/documents/${documentId}/shortcut?folderId=${folderId}`
    );

export const callDeleteDocumentShortcut = (documentId: number, folderId: number) =>
    axios.delete<IBackendRes<void>>(
        `/api/v1/documents/${documentId}/shortcut?folderId=${folderId}`
    );

export const callFetchDocumentsByCategory = (categoryId: number) =>
    axios.get<IBackendRes<IDocument[]>>(
        `/api/v1/documents/by-category/${categoryId}`
    );

export const callFetchDocumentsByDepartment = (departmentId: number) =>
    axios.get<IBackendRes<IDocument[]>>(
        `/api/v1/documents/by-department/${departmentId}`
    );
/* ===================== DOCUMENT SHARE TOKEN ===================== */

// Tạo share token cho văn bản
export const callCreateDocumentShareToken = (
    documentId: number,
    data: Omit<ICreateShareTokenRequest, 'procedureType'>
) =>
    axios.post<IBackendRes<IResShareTokenDTO>>(
        `/api/v1/documents/${documentId}/share-tokens`,
        data
    );

// Danh sách share token của văn bản
export const callFetchDocumentShareTokens = (documentId: number) =>
    axios.get<IBackendRes<IResShareTokenDTO[]>>(
        `/api/v1/documents/${documentId}/share-tokens`
    );

// Thu hồi share token
export const callRevokeDocumentShareToken = (tokenId: number) =>
    axios.patch<IBackendRes<void>>(
        `/api/v1/documents/share-tokens/${tokenId}/revoke`
    );

// Lịch sử truy cập
export const callFetchDocumentShareTokenAccessLogs = (tokenId: number) =>
    axios.get<IBackendRes<any[]>>(
        `/api/v1/documents/share-tokens/${tokenId}/access-logs`
    );

// Gửi email chia sẻ
export const callSendDocumentShareEmail = (tokenId: number, email: string) =>
    axios.post<IBackendRes<void>>(
        `/api/v1/documents/share-tokens/${tokenId}/send-email`,
        { email }
    );

/* ===================== DOCUMENT FOLDERS ===================== */

export const callFetchFolderTree = (ownerId?: string) => {
    return axios.get<IBackendRes<IDocumentFolder[]>>(
        `/api/v1/folders/tree${ownerId ? `?ownerId=${ownerId}` : ""}`
    );
};

export const callCreateFolder = (data: { folderName: string; parentId?: number | null; ownerId?: string }) => {
    return axios.post<IBackendRes<IDocumentFolder>>(
        `/api/v1/folders`,
        data
    );
};

export const callUpdateFolder = (id: number, data: { folderName: string; parentId?: number | null }) => {
    return axios.put<IBackendRes<IDocumentFolder>>(
        `/api/v1/folders/${id}`,
        data
    );
};

export const callDeleteFolder = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/folders/${id}`
    );
};

export const callFetchSubordinates = () => {
    return axios.get<IBackendRes<IUser[]>>(
        `/api/v1/folders/subordinates`
    );
};

export const callFetchFolderDocuments = (folderId: number) => {
    return axios.get<IBackendRes<IDocument[]>>(
        `/api/v1/folders/${folderId}/documents`
    );
};

/* ===================== EVALUATION HQCV ===================== */

// TEMPLATES
export const callFetchEvaluationTemplates = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<any>>>(`/api/v1/evaluation/templates?${query}`);

export const callFetchActiveEvaluationTemplates = () =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/templates/active`);

export const callFetchEvaluationTemplateById = (id: number) =>
    axios.get<IBackendRes<any>>(`/api/v1/evaluation/templates/${id}`);

export const callCreateEvaluationTemplate = (data: any) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/templates`, data);

export const callUpdateEvaluationTemplate = (id: number, data: any) =>
    axios.put<IBackendRes<any>>(`/api/v1/evaluation/templates/${id}`, data);

export const callPublishEvaluationTemplate = (id: number) =>
    axios.patch<IBackendRes<any>>(`/api/v1/evaluation/templates/${id}/publish`);

export const callArchiveEvaluationTemplate = (id: number) =>
    axios.patch<IBackendRes<any>>(`/api/v1/evaluation/templates/${id}/archive`);

// SECTIONS
export const callCreateTemplateSection = (templateId: number, data: any) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/templates/${templateId}/sections`, data);

export const callUpdateTemplateSection = (sectionId: number, data: any) =>
    axios.put<IBackendRes<any>>(`/api/v1/evaluation/sections/${sectionId}`, data);

export const callDeleteTemplateSection = (sectionId: number) =>
    axios.delete<IBackendRes<void>>(`/api/v1/evaluation/sections/${sectionId}`);

export const callFetchTemplateSections = (templateId: number) =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/templates/${templateId}/sections`);

// CRITERIA
export const callCreateTemplateCriteria = (sectionId: number, data: any) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/sections/${sectionId}/criteria`, data);

export const callUpdateTemplateCriteria = (criteriaId: number, data: any) =>
    axios.put<IBackendRes<any>>(`/api/v1/evaluation/criteria/${criteriaId}`, data);

export const callDeleteTemplateCriteria = (criteriaId: number) =>
    axios.delete<IBackendRes<void>>(`/api/v1/evaluation/criteria/${criteriaId}`);

// LEVELS
export const callCreateCriteriaLevel = (criteriaId: number, data: any) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/criteria/${criteriaId}/levels`, data);

export const callUpdateCriteriaLevel = (levelId: number, data: any) =>
    axios.put<IBackendRes<any>>(`/api/v1/evaluation/levels/${levelId}`, data);

export const callFetchCriteriaLevels = (criteriaId: number) =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/criteria/${criteriaId}/levels`);

// PERIODS
export const callFetchEvaluationPeriods = (query: string) =>
    axios.get<IBackendRes<IModelPaginate<any>>>(`/api/v1/evaluation/periods?${query}`);

export const callFetchEvaluationPeriodById = (id: number) =>
    axios.get<IBackendRes<any>>(`/api/v1/evaluation/periods/${id}`);

export const callCreateEvaluationPeriod = (data: any) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/periods`, data);

export const callUpdateEvaluationPeriod = (id: number, data: any) =>
    axios.put<IBackendRes<any>>(`/api/v1/evaluation/periods/${id}`, data);

export const callAddTemplateToPeriod = (periodId: number, templateId: number) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/periods/${periodId}/templates`, { templateId });

export const callFetchTemplatesInPeriod = (periodId: number) =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/periods/${periodId}/templates`);

export const callAddEmployeeToPeriod = (periodId: number, data: any) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/periods/${periodId}/employees`, data);

export const callCancelPeriodEmployee = (id: number) =>
    axios.patch<IBackendRes<any>>(`/api/v1/evaluation/period-employees/${id}/cancel`);

export const callFetchEmployeesInPeriod = (periodId: number) =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/periods/${periodId}/employees`);

export const callActivateEvaluationPeriod = (id: number) =>
    axios.patch<IBackendRes<any>>(`/api/v1/evaluation/periods/${id}/activate`);

export const callCloseEvaluationPeriod = (id: number) =>
    axios.patch<IBackendRes<any>>(`/api/v1/evaluation/periods/${id}/close`);

// RECORDS
export const callFetchEvaluationRecordById = (id: number) =>
    axios.get<IBackendRes<any>>(`/api/v1/evaluation/records/${id}`);

export const callFetchMyEvaluationRecords = () =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/my-records`);

export const callFetchManagerRecordsByPeriod = (periodId: number) =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/manager/periods/${periodId}/records`);

export const callFetchManagerRecords = () =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/manager/records`);

export const callFetchPendingManagerRecords = () => {
    return axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/manager/pending`);
};

export const callFetchApprovalRecordsByPeriod = (periodId: number) =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/approval/periods/${periodId}/records`);

export const callFetchApprovalRecords = () =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/approval/records`);

export const callFetchPendingApprovalRecords = () =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/approval/pending`);

// WORKFLOW ACTIONS
export const callEmployeeSaveScore = (recordId: number, criteriaId: number, score: number) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/employee-scores`, { criteriaId, score });

export const callEmployeeSubmitRecord = (recordId: number) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/employee-submit`);

export const callEmployeeSaveSelfReview = (recordId: number, content: string) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/self-review`, { content });

export const callManagerSaveScore = (recordId: number, criteriaId: number, score: number) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/manager-scores`, { criteriaId, score });

export const callManagerSubmitRecord = (recordId: number) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/manager-submit`);

export const callManagerSaveFeedback = (recordId: number, content: string) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/manager-feedback`, { content });

export const callSaveTrainingPlan = (recordId: number, data: any) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/training-plans`, data);

export const callApproverSaveScore = (recordId: number, criteriaId: number, score: number) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/approver-scores`, { criteriaId, score });

export const callApproveRecord = (recordId: number) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/approve`);

export const callRejectRecord = (recordId: number, reason: string) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/reject`, { reason });

export const callBatchApproveRecords = (ids: number[]) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/batch-approve`, { recordIds: ids });

export const callExtendEvaluationRecordDeadline = (data: {
    recordIds: number[];
    phase: "EMPLOYEE" | "MANAGER" | "APPROVAL";
    deadline: string;
    reason?: string;
    cascade?: boolean;
}) =>
    axios.patch<IBackendRes<any[]>>(`/api/v1/evaluation/records/deadline-extension`, data);

export const callFetchCompletedSummary = (periodId?: number, departmentId?: number, companyId?: number, sectionId?: number) => {
    let url = `/api/v1/evaluation/summary/completed`;
    const params = new URLSearchParams();
    if (periodId) params.append("periodId", periodId.toString());
    if (departmentId) params.append("departmentId", departmentId.toString());
    if (companyId) params.append("companyId", companyId.toString());
    if (sectionId) params.append("sectionId", sectionId.toString());
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    return axios.get<IBackendRes<any[]>>(url);
};

export const callEmployeeConfirmRecord = (recordId: number) =>
    axios.post<IBackendRes<any>>(`/api/v1/evaluation/records/${recordId}/employee-confirm`);

export const callFetchRecordHistory = (recordId: number) =>
    axios.get<IBackendRes<any[]>>(`/api/v1/evaluation/records/${recordId}/history`);

// NOTIFICATIONS
export const callFetchEvaluationNotifications = () =>
    axios.get<IBackendRes<any[]>>(`/api/v1/notifications`);

export const callFetchUnreadEvaluationNotifications = () =>
    axios.get<IBackendRes<any[]>>(`/api/v1/notifications/unread`);

export const callCountUnreadEvaluationNotifications = () =>
    axios.get<IBackendRes<any>>(`/api/v1/notifications/unread/count`);

export const callReadEvaluationNotification = (id: number) =>
    axios.patch<IBackendRes<any>>(`/api/v1/notifications/${id}/read`);

export const callReadAllEvaluationNotifications = () =>
    axios.patch<IBackendRes<void>>(`/api/v1/notifications/read-all`);

/* ===================== ACCOUNTING DOCUMENT CATEGORIES ===================== */

export const callFetchAccountingDocumentCategories = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IAccountingDocumentCategory>>>(
        `/api/v1/accounting-document-categories?${query}`
    );
};

export const callFetchAccountingDocumentCategoryActive = () => {
    return axios.get<IBackendRes<IAccountingDocumentCategory[]>>(
        `/api/v1/accounting-document-categories/active`
    );
};

export const callFetchAccountingDocumentCategoryById = (id: number) => {
    return axios.get<IBackendRes<IAccountingDocumentCategory>>(
        `/api/v1/accounting-document-categories/${id}`
    );
};

export const callCreateAccountingDocumentCategory = (data: IAccountingDocumentCategoryRequest) => {
    return axios.post<IBackendRes<IAccountingDocumentCategory>>(
        `/api/v1/accounting-document-categories`,
        data
    );
};

export const callUpdateAccountingDocumentCategory = (id: number, data: IAccountingDocumentCategoryRequest) => {
    return axios.put<IBackendRes<IAccountingDocumentCategory>>(
        `/api/v1/accounting-document-categories/${id}`,
        data
    );
};

export const callToggleActiveAccountingDocumentCategory = (id: number) => {
    return axios.put<IBackendRes<void>>(
        `/api/v1/accounting-document-categories/${id}/active`
    );
};

export const callDeleteAccountingDocumentCategory = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/accounting-document-categories/${id}`
    );
};
