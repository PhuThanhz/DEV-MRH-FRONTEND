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
    , ICareerPathBulkResult, IJobTitleAssignStatus

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

export const callDeleteUser = (id: number) => {
    return axios.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
}

export const callFetchUser = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
}
export const callFetchUserById = (id: number) => {
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

export const callFetchEmployeeById = (id: number) => {
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

export const callDeleteEmployee = (id: number) => {
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

export const callFetchUserPositions = (userId: number) => {
    return axios.get<IBackendRes<IUserPosition[]>>(
        `/api/v1/users/${userId}/positions`
    );
};

export const callCreateUserPosition = (
    userId: number,
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

export const callDeleteUserPosition = (id: number) => {
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

export const callDeleteOrgNode = (id: number) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/job-position-nodes/${id}`
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
export const callFetchJdApprovers = () => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/jd-flow/approvers`
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
    nextUserId?: number;  // ← đã optional ✅
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
    nextUserId?: number;
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
export const callFetchJdIssuers = () => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/jd-flow/issuers`
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
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    data: {
        procedureName: string;
        status?: string;
        planYear?: number;
        fileUrls?: string[]; // ← đổi
        note?: string;
        departmentId?: number | null;
        sectionId?: number | null;
        userIds?: number[];   // ← THÊM

    }
) => {
    return axios.post<IBackendRes<any>>(
        `/api/v1/procedures?type=${type}`,
        data
    );
};

// Cập nhật
export const callUpdateProcedure = (
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    id: number,
    data: {
        procedureName: string;
        status?: string;
        planYear?: number;
        fileUrls?: string[]; // ← đổi
        note?: string;
        departmentId?: number | null;
        sectionId?: number | null;
        userIds?: number[];   // ← THÊM
    }
) => {
    return axios.put<IBackendRes<any>>(
        `/api/v1/procedures/${id}?type=${type}`,
        data
    );
};

// Xoá
export const callDeleteProcedure = (
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    id: number
) => {
    return axios.delete<IBackendRes<void>>(
        `/api/v1/procedures/${id}?type=${type}`
    );
};

// Bật/tắt active
export const callToggleActiveProcedure = (
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    id: number
) => {
    return axios.put<IBackendRes<void>>(
        `/api/v1/procedures/${id}/active?type=${type}`
    );
};

// Danh sách (phân trang)
export const callFetchProcedures = (
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    query: string
) => {
    return axios.get<IBackendRes<IModelPaginate<any>>>(
        `/api/v1/procedures?type=${type}&${query}`
    );
};

// Chi tiết
export const callFetchProcedureById = (
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    id: number
) => {
    return axios.get<IBackendRes<any>>(
        `/api/v1/procedures/${id}?type=${type}`
    );
};

// Theo phòng ban
export const callFetchProceduresByDepartment = (
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    departmentId: number
) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/procedures/by-department/${departmentId}?type=${type}`
    );
};

// Theo bộ phận
export const callFetchProceduresBySection = (
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    sectionId: number
) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/procedures/by-section/${sectionId}?type=${type}`
    );
};

// Xem lịch sử version
export const callFetchProcedureHistory = (
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    id: number
) => {
    return axios.get<IBackendRes<any[]>>(
        `/api/v1/procedures/${id}/history?type=${type}`
    );
};

// Theo công ty
export const callFetchProceduresByCompany = (
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
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
    type: 'COMPANY' | 'DEPARTMENT' | 'CONFIDENTIAL', // ← THÊM
    id: number,
    data: {
        procedureName: string;
        status?: string;
        planYear?: number;
        fileUrls?: string[]; // ← đổi
        note?: string;
        departmentId?: number | null;
        sectionId?: number | null;
        userIds?: number[];   // ← THÊM
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

export const callUpdateEmployeeCareerPath = (id: number, data: IReqAssignCareerPath) => {
    return axios.put<IBackendRes<IEmployeeCareerPath>>(
        `/api/v1/employee-career-paths/${id}`,
        data
    );
};

export const callPromoteEmployee = (id: number, data: IReqPromoteEmployee) => {
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

export const callGetEmployeeCareerPathByUser = (userId: number) => {
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

export const callGetEmployeeCareerPathHistory = (userId: number) => {
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
