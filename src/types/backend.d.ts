export interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
}

export interface IModelPaginate<T> {
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
    result: T[];
}

export interface IAccount {
    access_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        avatar?: string;
        active?: boolean;
        role: {
            id: string;
            name: string;
            permissions: {
                id: string;
                name: string;
                apiPath: string;
                method: string;
                module: string;
            }[];
        };
    };
}

export interface IGetAccount extends Omit<IAccount, "access_token"> { }


export interface IGetAccount extends Omit<IAccount, "access_token"> { }

export interface IUser {
    id?: string;
    name: string;
    email: string;
    password?: string;
    avatar?: string;
    role?: {
        id: string;
        name: string;
    };
    active: boolean;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPermission {
    id?: string;
    name?: string;
    apiPath?: string;
    method?: string;
    module?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IRole {
    id?: string;
    name: string;
    description: string;
    active: boolean;
    permissions: IPermission[] | string[];
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

// COMPANY
export enum COMPANY_STATUS {
    ACTIVE = 1,
    INACTIVE = 0,
}

export interface ICompany {
    id?: number;
    code?: string;
    name: string;
    englishName?: string;
    status?: COMPANY_STATUS;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}
// ===================== DEPARTMENT =====================

export enum DEPARTMENT_STATUS {
    ACTIVE = 1,
    INACTIVE = 0,
}

export interface IDepartment {
    id: number;
    code: string;
    name: string;
    englishName?: string;
    status?: DEPARTMENT_STATUS;
    company: {
        id: number;
        name: string;
    };
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}
// ===================== DEPARTMENT REQUEST =====================

export interface ICreateDepartmentReq {
    code: string;
    name: string;
    englishName?: string;
    companyId: number;
}

export interface IUpdateDepartmentReq {
    name?: string;
    englishName?: string;
    status?: number;
}
// === SECTION ====
export interface ISection {
    id?: number;
    code: string;
    name: string;
    department?: {
        id: number;
        name: string;
    };
    active: boolean;
    status: number;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

// === POSITION LEVEL ===
export interface IPositionLevel {
    id?: number;

    code: string;          // S1, M2...
    band: string;          // S / M / L
    levelNumber: number;   // 1, 2, 3
    bandOrder: number;     // thứ tự band

    status: number;        // 1 = active, 0 = inactive
    active: boolean;

    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}
/* ============================================
    JOB TITLE
============================================ */
export interface IJobTitle {
    id: number;
    nameVi: string;
    nameEn?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;

    positionCode?: string;
    band?: string;
    level?: number;

    positionLevel?: {
        id: number;
        code: string;
    };
}

/* ============================================
    COMPANY PROCEDURE
============================================ */
export interface ICompanyProcedure {
    id: number;

    // ===== Company =====
    companyCode?: string;
    companyName?: string;

    // ===== Department =====
    departmentId?: number;
    departmentName?: string;

    // ===== Section / Team =====
    sectionId?: number;
    sectionName?: string;

    // ===== Procedure Info =====
    procedureName: string;
    fileUrl?: string;
    status: "NEED_CREATE" | "IN_PROGRESS" | "NEED_UPDATE" | "TERMINATED";
    planYear?: number;
    note?: string;

    // ===== Activation =====
    active: boolean; // ✅ dùng boolean thay vì status int

    // ===== Audit =====
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}
// src/types/backend/career-path.ts
export interface ICareerPath {
    id?: number;

    departmentId: number;
    departmentName?: string;

    jobTitleId: number;
    jobTitleName?: string;

    positionLevelCode?: string;
    bandOrder?: number;
    levelNumber?: number;

    jobStandard?: string;
    trainingRequirement?: string;
    evaluationMethod?: string;
    requiredTime?: string;
    trainingOutcome?: string;
    performanceRequirement?: string;
    salaryNote?: string;

    status?: number;
    active: boolean;

    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IResCareerPathBandGroup {
    band: string;
    bandOrder: number;
    positions: ICareerPath[];
}
export interface ICareerPathRequest {
    departmentId: number;
    jobTitleId: number;

    jobStandard?: string;
    trainingRequirement?: string;
    evaluationMethod?: string;
    requiredTime?: string;
    trainingOutcome?: string;
    performanceRequirement?: string;
    salaryNote?: string;

    status?: number;
}



/* ============================================
   DEPARTMENT - JOB TITLE (Gán chức danh vào phòng ban)
============================================ */
export interface IDepartmentJobTitle {
    id: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;

    jobTitle: {
        id: number;
        nameVi: string;
        nameEn?: string;              // ← THÊM DÒNG NÀY (tên tiếng Anh)
        positionCode?: string;
        band?: string;
        level?: number;
        bandOrder?: number;
        levelNumber?: number;
        // Các field khác nếu có...
    };

    department: {
        id: number;
        name: string;
    };
}
/* ============================================
   SECTION - JOB TITLE (Gán chức danh vào bộ phận)
============================================ */
export interface ISectionJobTitle {
    id: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;

    jobTitle: {
        id: number;
        nameVi: string;

        // cấp bậc
        positionCode?: string;
        band?: string;
        level?: number;

        bandOrder?: number;
        levelNumber?: number;
    };

    section: {
        id: number;
        name: string;
    };
}
/* ============================================
   COMPANY - JOB TITLE (Gán chức danh vào công ty)
============================================ */

// Interface riêng cho JobTitleInfo (tái sử dụng)
export interface IJobTitleInfo {
    id: number;
    nameVi: string;

    // Cấp bậc
    positionCode?: string;
    band?: string;
    level?: number;

    bandOrder?: number;
    levelNumber?: number;
}

// Interface riêng cho CompanyInfo
export interface ICompanyInfo {
    id: number;
    name: string;
}

/* ===================== COMPANY SALARY GRADE ===================== */

export interface ICompanySalaryGrade {
    id: number;
    companyJobTitleId: number;
    gradeLevel: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface ICreateCompanySalaryGradeReq {
    companyJobTitleId: number;
    gradeLevel: number;
}

export interface IUpdateCompanySalaryGradeReq {
    gradeLevel: number;
}
/* ===================== DEPARTMENT SALARY GRADES ===================== */
export interface IDepartmentSalaryGrade {
    id: number;
    departmentJobTitleId: number;
    gradeLevel: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface ICreateDepartmentSalaryGradeReq {
    departmentJobTitleId: number;
    gradeLevel: number;
}

export interface IUpdateDepartmentSalaryGradeReq {
    gradeLevel: number;
}
/* ===================== SECTION SALARY GRADE ===================== */

export interface ISectionSalaryGrade {
    id: number;
    sectionJobTitleId: number;
    gradeLevel: number;
    active: boolean;
    createdBy?: string;
    createdAt?: string;
}

export interface ICreateSectionSalaryGradeReq {
    sectionJobTitleId: number;
    gradeLevel: number;
}

export interface IUpdateSectionSalaryGradeReq {
    gradeLevel: number;
}
/* ===================== JOB_TITLE_PERFORMANCE_CONTENT ===================== */

export interface IJobTitlePerformanceContent {
    id: number;

    ownerLevel: "COMPANY" | "DEPARTMENT" | "SECTION";
    ownerJobTitleId: number;

    salaryGradeId: number;        // ID của bậc lương
    salaryGradeNumber: number;    // ⭐ số thứ tự bậc: 1,2,3...

    contentA?: string;
    contentB?: string;
    contentC?: string;
    contentD?: string;

    active: boolean;

    createdAt?: string;
    updatedAt?: string;
}

/* ===== REQUEST BODY ===== */
export interface IReqJobTitlePerformanceContent {
    ownerLevel: "COMPANY" | "DEPARTMENT" | "SECTION";
    ownerJobTitleId: number;

    salaryGradeId: number; // FE chỉ gửi ID, backend tự tính salaryGradeNumber

    contentA?: string;
    contentB?: string;
    contentC?: string;
    contentD?: string;
}

/* ============================================
   SALARY MATRIX & STRUCTURE
============================================ */

/* ===============================
   MATRIX TỪ BACKEND
================================ */
export interface ISalaryMatrixGrade {
    gradeId: number;
    gradeLevel: number;
    structure: ISalaryStructure | null;
}

export interface ISalaryMatrix {
    jobTitleId: number;
    jobTitleName: string;
    band: string;
    level: string;
    source: "COMPANY" | "DEPARTMENT" | "SECTION";

    grades: ISalaryMatrixGrade[];
}

/* ===============================
   STRUCTURE
================================ */
export interface ISalaryStructure {
    id: number;

    ownerLevel: "COMPANY" | "DEPARTMENT" | "SECTION";
    ownerJobTitleId: number;
    salaryGradeId: number;

    /* ===== Tháng ===== */
    monthBaseSalary?: number | null;
    monthPositionAllowance?: number | null;
    monthMealAllowance?: number | null;
    monthFuelSupport?: number | null;
    monthPhoneSupport?: number | null;
    monthOtherSupport?: number | null;

    /* KPI Tháng: A B C D */
    monthKpiBonusA?: number | null;
    monthKpiBonusB?: number | null;
    monthKpiBonusC?: number | null;
    monthKpiBonusD?: number | null;

    /* ===== Giờ ===== */
    hourBaseSalary?: number | null;
    hourPositionAllowance?: number | null;
    hourMealAllowance?: number | null;
    hourFuelSupport?: number | null;
    hourPhoneSupport?: number | null;
    hourOtherSupport?: number | null;

    /* KPI Giờ: A B C D */
    hourKpiBonusA?: number | null;
    hourKpiBonusB?: number | null;
    hourKpiBonusC?: number | null;
    hourKpiBonusD?: number | null;

    createdAt?: string;
    updatedAt?: string;
}

/* ===============================
   REQUEST BODY UPSERT
================================ */
export interface IReqSalaryStructure {
    ownerLevel: "COMPANY" | "DEPARTMENT" | "SECTION";
    ownerJobTitleId: number;
    salaryGradeId: number;

    /* ===== Tháng ===== */
    monthBaseSalary?: number | null;
    monthPositionAllowance?: number | null;
    monthMealAllowance?: number | null;
    monthFuelSupport?: number | null;
    monthPhoneSupport?: number | null;
    monthOtherSupport?: number | null;

    monthKpiBonusA?: number | null;
    monthKpiBonusB?: number | null;
    monthKpiBonusC?: number | null;
    monthKpiBonusD?: number | null;

    /* ===== Giờ ===== */
    hourBaseSalary?: number | null;
    hourPositionAllowance?: number | null;
    hourMealAllowance?: number | null;
    hourFuelSupport?: number | null;
    hourPhoneSupport?: number | null;
    hourOtherSupport?: number | null;

    hourKpiBonusA?: number | null;
    hourKpiBonusB?: number | null;
    hourKpiBonusC?: number | null;
    hourKpiBonusD?: number | null;
}

export interface IProcessAction {
    id?: string;
    code: string;
    name: string;
    shortDescription?: string;
    description?: string;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}
/* ===================== PROCESS ACTIONS ===================== */

export interface IProcessAction {
    id?: number;
    code: string;
    name: string;
    shortDescription?: string;
    description?: string;
    active: boolean;

    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}


/* ======================================================
   PERMISSION CATEGORY
====================================================== */

export interface IPermissionCategory {
    id?: number;
    code: string;
    name: string;
    active?: boolean;

    departmentId: number;
    departmentName?: string;

    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

/* ===================== CREATE UPDATE REQUEST ===================== */
export interface IPermissionCategoryRequest {
    code: string;
    name: string;
    departmentId: number;
    active?: boolean;
}


/* ===================== PERMISSION CATEGORY MATRIX ===================== */
export interface IPermissionCategoryMatrix {
    category: {
        id: number;
        code: string;
        name: string;
    };
    contents: {
        contentId: number;
        contentName: string;
        jobTitles: {
            departmentJobTitleId: number;
            jobTitleId: number;
            jobTitleName: string;

            processActionId: number | null;   // ⭐ QUAN TRỌNG
            processActionCode?: string;        // để hiển thị
        }[];
    }[];
}

/* ===================== PERMISSION CONTENT ===================== */

export interface IPermissionContent {
    id: number;
    name: string;
    active: boolean;
}

/* ----- CREATE ----- */
export interface ICreatePermissionContentReq {
    name: string;
    categoryId: number;
}

/* ----- UPDATE ----- */
export interface IUpdatePermissionContentReq {
    name: string;
}
// dùng cho VIEW DETAIL
export interface IPermissionContentDetail {
    id: number;
    name: string;
    active: boolean;
    category: {
        id: number;
        code: string;
        name: string;
    };
}

// dùng cho CREATE / UPDATE FORM
export interface IPermissionContentForm {
    id?: number;
    name: string;
    categoryId: number;
}
/* ======================================================
   PERMISSION MATRIX (ASSIGNMENT)
====================================================== */

export interface IPermissionMatrix {
    contentId: number;
    contentName: string;

    category: {
        id: number;
        code: string;
        name: string;
    };

    departments: IPermissionMatrixDepartment[];
}

export interface IPermissionMatrixDepartment {
    departmentId: number;
    departmentName: string;
    jobTitles: IPermissionMatrixJobTitle[];
}

export interface IPermissionMatrixJobTitle {
    departmentJobTitleId: number;
    jobTitleId: number;
    jobTitleName: string;

    processActionId?: number; // 👈 thêm
    actionCode?: string;      // giữ lại để hiển thị
}


export interface IAssignPermissionReq {
    departmentJobTitleId: number;
    processActionId: number;
}
/* ===================== JOB DESCRIPTION ===================== */
export interface IJobDescription {
    id?: number;
    title: string;
    content?: string;
    status: string; // DRAFT | IN_REVIEW | PUBLIC
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IJobDescriptionList {
    id: number;
    title: string;
    status: "DRAFT" | "IN_REVIEW" | "PUBLIC";

    createdAt?: string;
    createdBy?: string;
}

/* ===================== REQUEST ===================== */

export interface ICreateJobDescriptionReq {
    title: string;
    content: string;
}

export interface IUpdateJobDescriptionReq {
    id: number;
    title: string;
    content: string;
}
// types/job-title.ts

export interface IJobTitleForm {
    nameVi: string;
    nameEn?: string;
    positionLevelId: number;
    active?: boolean;
}
