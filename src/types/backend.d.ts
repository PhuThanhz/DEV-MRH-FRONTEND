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
            id: number;
            name: string;
            permissions: {
                id: string;
                name: string;
                apiPath: string;
                method: string;
                module: string;
            }[];
        };
        userInfo?: {
            employeeCode?: string | null;
            phone?: string | null;
            dateOfBirth?: string | null;
            gender?: "MALE" | "FEMALE" | "OTHER" | null;
            startDate?: string | null;
            contractSignDate?: string | null;
            contractExpireDate?: string | null;
        };
    };
}

export interface IGetAccount extends Omit<IAccount, "access_token"> { }



// ✅ ĐÚNG — đã có trong backend.ts mới
export interface IUser {
    id: string;      // ⭐ number
    name: string;
    email: string;
    password?: string;
    avatar?: string;
    role?: {
        id: number;     // ⭐ number
        name: string;
    };
    active: boolean;
    lastLoginAt?: string;
    lastLoginIp?: string;
    lastSeenStatus?: string; // ← THÊM
    userInfo?: {        // ⭐ THÊM
        employeeCode?: string;
        phone?: string;
        dateOfBirth?: string;
        gender?: "MALE" | "FEMALE" | "OTHER";
        startDate?: string;
        contractSignDate?: string;
        contractExpireDate?: string;
        // ✅ THÊM 2 DÒNG NÀY

    };

    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}
// ⭐ THÊM — dùng cho change password
export interface IReqChangePasswordDTO {
    oldPassword: string;
    newPassword: string;
}
// ===== USER POSITION =====
export interface IUserPosition {
    id: string;  // ✅ đã là string
    source: "COMPANY" | "DEPARTMENT" | "SECTION";
    active: boolean;

    // ← THÊM
    user?: {
        id: string; name: string;
        email: string;
        employeeCode?: string; // ← THÊM

    };

    jobTitle?: {
        id: number;
        nameVi: string;
        nameEn?: string;
        positionCode?: string;
        band?: string;
        levelNumber?: number;
        bandOrder?: number;
    };

    company?: { id: number; name: string };
    department?: { id: number; name: string };
    section?: { id: number; name: string };

    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}
export interface IReqUpdateProfileDTO {
    name: string;
    avatar?: string;
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

    // ⭐ THÊM MỚI — thông tin công ty
    companyId?: number;
    companyName?: string;

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
        companyId?: number;   // THÊM
        companyName?: string; // THÊM
    };
}

/* ============================================
    COMPANY PROCEDURE
============================================ */
export interface ICompanyProcedure {
    id: number;

    // ===== Company =====
    companyId?: number;      // thêm dòng này
    companyCode?: string;
    companyName?: string;

    // ===== Department =====
    departmentId?: number;
    departmentName?: string;

    // ===== Section =====
    sectionId?: number;
    sectionName?: string;

    // ===== Procedure Info =====
    procedureName: string;
    fileUrl?: string;
    status: "NEED_CREATE" | "IN_PROGRESS" | "NEED_UPDATE" | "TERMINATED";
    planYear?: number;
    note?: string;
    version?: number;

    // ===== Activation =====
    active: boolean;

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
// Thêm vào cuối phần career path types

export interface IJobTitleByLevel {
    id: number;
    nameVi: string;
    nameEn?: string;
    positionLevelCode?: string;
    bandOrder?: number;
    alreadyExists: boolean;
}

export interface ICareerPathPreviewResponse {
    willCreate: {
        jobTitleId: number;
        jobTitleName: string;
        positionLevelCode?: string;
        reason?: string | null;
    }[];
    willSkip: {
        jobTitleId: number;
        jobTitleName: string;
        positionLevelCode?: string;
        reason: string;
    }[];
}

export interface ICareerPathBulkRequest {
    departmentId: number;
    jobTitleIds: number[];
    jobStandard?: string;
    trainingRequirement?: string;
    evaluationMethod?: string;
    requiredTime?: string;
    trainingOutcome?: string;
    performanceRequirement?: string;
    salaryNote?: string;
    status?: number;
}

export interface ICareerPathBulkResult {
    created: ICareerPath[];
    skipped: {
        jobTitleId: number;
        jobTitleName: string;
        reason: string;
    }[];
    totalRequested: number;
    totalCreated: number;
    totalSkipped: number;
}
/* ===================== EMPLOYEE CAREER PATH ===================== */

// Thông tin 1 bước trong lộ trình (shortcut)
export interface IEmployeeCareerPathStepInfo {
    stepOrder: number;
    careerPathId: number;
    jobTitleName?: string;
    positionLevelCode?: string;
    durationMonths?: number;
}

// Thông tin từng bước có trạng thái (dùng cho allSteps)
export interface IEmployeeCareerPathStepProgress {
    stepOrder: number;
    careerPathId: number;
    jobTitleName?: string;
    positionLevelCode?: string;
    durationMonths?: number;
    // COMPLETED = đã qua, CURRENT = đang ở, UPCOMING = chưa đến
    stepStatus: "COMPLETED" | "CURRENT" | "UPCOMING";
    promotedAt?: string;    // chỉ có khi COMPLETED
    actualMonths?: number;  // số tháng thực tế ở bước này
}

export interface IEmployeeCareerPath {
    id: string;  // ✅ đã là string

    user?: {
        id: string;
        name: string;
        email: string;
    };

    // Thông tin template lộ trình
    template?: {
        id: number;
        name: string;
        departmentId?: number;
        departmentName?: string;
    };

    // Toàn bộ lộ trình với trạng thái từng bước
    allSteps?: IEmployeeCareerPathStepProgress[];

    // Shortcut bước hiện tại + tiếp theo
    currentStep?: IEmployeeCareerPathStepInfo;
    nextStep?: IEmployeeCareerPathStepInfo;

    // Tiến độ
    currentStepOrder?: number;
    totalSteps?: number;
    stepStartedAt?: string;
    daysInCurrentStep?: number;
    durationMonths?: number;  // dự kiến bước hiện tại
    overdue?: boolean;        // có quá hạn dự kiến không

    // 0 = Đang tiến hành, 1 = Đã hoàn thành lộ trình, 2 = Tạm dừng
    progressStatus?: number;
    progressStatusLabel?: string;

    note?: string;
    active?: boolean;

    histories?: IEmployeeCareerPathHistory[];

    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface IEmployeeCareerPathHistory {
    id?: number;
    fromStepOrder?: number;   // ← thêm
    fromPositionCode?: string;
    fromPositionName?: string;
    toStepOrder?: number;     // ← thêm
    toPositionCode?: string;
    toPositionName?: string;
    promotedAt?: string;
    note?: string;
    createdAt?: string;
    createdBy?: string;

}

// Gán lộ trình — đơn giản hơn, dùng templateId thay vì targetCareerPathId
export interface IReqAssignCareerPath {
    userId: string;
    templateId: number;           // ← thay targetCareerPathId
    currentCareerPathId: number;  // chức danh hiện tại → tìm bước bắt đầu
    startDate?: string;
    note?: string;
}

// Promote — đơn giản hơn, backend tự tìm bước tiếp theo
export interface IReqPromoteEmployee {
    promotedAt?: string;
    note?: string;
}
/* ===================== CAREER PATH TEMPLATE ===================== */
export interface ICareerPathTemplate {
    id?: number;
    name: string;
    description?: string;
    departmentId: number;
    departmentName?: string;
    active: boolean;
    steps: ICareerPathTemplateStep[];
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface ICareerPathTemplateStep {
    id?: number;
    stepOrder: number;
    careerPathId: number;
    bandOrder?: number;
    jobTitleName?: string;
    positionLevelCode?: string;
    levelNumber?: number;
    departmentId?: number;
    departmentName?: string;
    durationMonths?: number;
    description?: string;
}

export interface ICareerPathTemplateRequest {
    name: string;
    description?: string;
    departmentId: number;
    steps: {
        stepOrder: number;
        careerPathId: number;
        durationMonths?: number;
        description?: string;
    }[];
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
   DEPARTMENT JOB TITLE - ASSIGN STATUS (Modal gán)
============================================ */
export interface IJobTitleAssignStatus {
    id: number;
    nameVi: string;
    nameEn?: string;
    positionCode?: string;
    band?: string;
    level?: number;
    bandOrder?: number;
    levelNumber?: number;

    assigned: boolean;
    assignSource?: "DEPARTMENT" | "SECTION" | "COMPANY" | null;  // ← enum đầy đủ
    usedInDepartments: string[];
    canAssign: boolean;  // ← THÊM
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
    companyId?: number;      // ← THÊM
    companyName?: string;    // ← THÊM
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
    categoryId: number;
    categoryName: string;
    departmentName: string;

    columns: {
        departmentJobTitleId: number;
        jobTitleName: string;
    }[];

    rows: {
        contentId: number;
        contentName: string;
        cells: {
            departmentJobTitleId: number;
            processActionCode: string | null;
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
// export interface IJobDescription {
//     id?: number

//     code: string
//     reportTo: string
//     belongsTo: string
//     collaborateWith: string

//     status: string
//     version?: number

//     effectiveDate?: string

//     companyId?: number
//     departmentId?: number

//     companyJobTitleId?: number
//     departmentJobTitleId?: number
//     sectionJobTitleId?: number

//     requirements?: {
//         knowledge?: string
//         experience?: string
//         skills?: string
//         qualities?: string
//         otherRequirements?: string
//     }

//     tasks?: {
//         id?: number
//         orderNo: number
//         title: string
//         content: string
//     }[]

//     positions?: {
//         chartId: number
//         nodeId: number
//         nodeName?: string
//         levelCode?: string
//     }[]

//     createdAt?: string
//     updatedAt?: string
// }
/* ===================== JOB DESCRIPTION ===================== */
export interface IJobDescription {
    id?: number

    code: string
    reportTo: string
    belongsTo: string
    collaborateWith: string

    status?: JD_STATUS
    version?: number

    effectiveDate?: string

    companyId?: number
    departmentId?: number

    companyJobTitleId?: number
    departmentJobTitleId?: number
    sectionJobTitleId?: number

    /* ===== join fields từ backend ===== */

    companyName?: string
    departmentName?: string
    jobTitleName?: string

    /* ===== requirement ===== */

    requirements?: {
        knowledge?: string
        experience?: string
        skills?: string
        qualities?: string
        otherRequirements?: string
    }

    /* ===== tasks ===== */

    tasks?: {
        id?: number
        orderNo: number
        title: string
        content: string
    }[]

    /* ===== org chart positions ===== */

    positions?: {
        chartId: number
        nodeId: number
        nodeName?: string
        levelCode?: string
    }[]

    createdAt?: string
    updatedAt?: string
    createdBy?: string
    updatedBy?: string
}
// types/job-title.ts

export interface IJobTitleForm {
    nameVi: string;
    nameEn?: string;
    companyId?: number;      // THÊM — chỉ dùng filter UI
    positionLevelId: number;
    active?: boolean;
}
/* ===================== DEPARTMENT OBJECTIVES ===================== */

export interface IDepartmentMissionTree {
    department: {
        id: number
        name: string
    }

    issueDate: string

    // FE dùng flag này để biết render list thẳng hay nhóm theo bộ phận
    hasSections: boolean

    objectives: IDepartmentObjectiveItem[]

    // Có bộ phận → dùng tasks
    tasks: IDepartmentSectionTask[]

    // Không có bộ phận → dùng generalTasks
    generalTasks: IDepartmentTaskItem[]

    // Quyền hạn — null/empty thì không hiển thị
    authorities: IDepartmentAuthorityItem[]
}

export interface IDepartmentObjectiveItem {
    id: number
    content: string
}

export interface IDepartmentSectionTask {
    sectionId: number
    sectionName: string
    tasks: IDepartmentTaskItem[]
}

export interface IDepartmentTaskItem {
    id: number
    content: string
}

// THÊM MỚI
export interface IDepartmentAuthorityItem {
    id: number
    content: string
}

export interface ICreateDepartmentMissionReq {
    departmentId: number
    issueDate?: string
    objectives?: ICreateObjectiveItem[]
    tasks?: ICreateSectionTask[]
    // THÊM MỚI
    authorities?: ICreateAuthorityItem[]
}

export interface ICreateObjectiveItem {
    content: string
    orderNo?: number
}

export interface ICreateSectionTask {
    sectionId?: number   // null = không có bộ phận
    items: ICreateTaskItem[]
}

export interface ICreateTaskItem {
    content: string
    orderNo?: number
}

// THÊM MỚI
export interface ICreateAuthorityItem {
    content: string
    orderNo?: number
}

export interface IUpdateDepartmentObjectiveReq {
    id: number
    content: string
    orderNo?: number
}

export interface IDeleteDepartmentObjectiveReq {
    id: number
}
/* ============================================
    DEPARTMENT PROCEDURE
============================================ */
export interface IDepartmentProcedure {
    id?: number;

    // ===== Company =====
    companyId?: number;
    companyName?: string;

    // ===== Department =====
    departmentId?: number;
    departmentName?: string;

    // ===== Section =====
    sectionId?: number;
    sectionName?: string;
    version?: number;

    // ===== Procedure Info =====
    procedureName: string;
    fileUrl?: string;
    status: "NEED_CREATE" | "IN_PROGRESS" | "NEED_UPDATE" | "TERMINATED";
    planYear?: number;
    note?: string;

    // ===== Activation =====
    active: boolean;

    // ===== Audit =====
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}
/* ===================== ORG CHART ===================== */

// THÀNH:
export interface IOrgChart {
    id?: number;
    name: string;
    chartType?: "COMPANY" | "DEPARTMENT";  // ← ĐÚNG khớp backend
    companyId?: number;
    departmentId?: number;
    createdAt?: string;
}
/* ===================== ORG NODE ===================== */

export interface IOrgNode {
    id: number
    chartId: number
    title?: string
    name?: string
    parentId?: number | null
    levelCode?: string
    level?: string
    posX?: number
    posY?: number
    holderName?: string        // ← thêm
    isGoal?: boolean           // ← thêm
    jobDescriptionId?: number  // ← thêm
    jobDescriptionCode?: string // ← thêm (backend trả về ResJobPositionNodeDTO có field này)
    jobDescriptionStatus?: string // ← thêm
}
/* ======================================================
   JD FLOW TYPES
====================================================== */

/* ===================== JD STATUS ===================== */

export type JD_STATUS =
    | "DRAFT"
    | "IN_REVIEW"
    | "REJECTED"
    | "RETURNED"   // ← THÊM
    | "APPROVED"
    | "PUBLISHED";
/* ===================== JD FLOW REQUEST ===================== */

export interface IReqSubmitJdFlow {
    jdId: number;
    nextUserId?: string;           // optional
    returnToPrevious?: boolean;    // ← THÊM
    comment?: string;              // ← THÊM (dùng khi gửi về trước)
}
export interface IReqApproveJdFlow {
    jdId: number;
    nextUserId: string;
}

export interface IReqRejectJdFlow {
    jdId: number;
    comment?: string;
}

export interface IReqIssueJdFlow {
    jdId: number;
}


/* ===================== JD FLOW HISTORY ===================== */

export interface IJDFlowLog {
    id: number;

    jdId: number;

    action: "SUBMIT" | "APPROVE" | "REJECT" | "ISSUE"

    fromUser?: {
        id: string
        name: string
    }

    toUser?: {
        id: string
        name: string
    }

    comment?: string

    createdAt?: string
}

/* ===================== JD APPROVER ===================== */

export interface IJDApprover {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isFinal: boolean;
    positions: {
        companyName: string;
        departmentName?: string;
        jobTitleName: string;
        positionCode?: string;
        source: string;
    }[];
}
export interface IJDFlowItem {
    jdId: number
    code: string
    status: JD_STATUS

    updatedAt?: string

    currentUserIsFinal?: boolean // ✅ thêm field này

    fromUser?: {
        id: string;
        name: string;
    }

    currentUser?: {
        id: string;
        name: string;
    }
}

export interface IJdInbox {
    jdId: number;
    code: string;

    companyName?: string;
    departmentName?: string;
    jobTitleName?: string;

    status: string;

    fromUser?: {
        id: string;
        name: string;
    };

    currentUser?: {
        id: string;
        name: string;
    };

    updatedAt?: string;

    // ── THÊM 2 FIELD NÀY ──
    rejectComment?: string;
    rejectorName?: string;
    rejectorPosition?: string;    // ← THÊM
    rejectorDepartment?: string;  // ← THÊM
    rejectorPositionCode?: string;  // ← THÊM
    canReturnToPrevious?: boolean;  // ← THIẾU CÁI NÀY


}
/* ============================================
    PROCEDURE (DÙNG CHUNG CHO COMPANY & DEPARTMENT)
============================================ */
export type ProcedureType = "COMPANY" | "DEPARTMENT" | "CONFIDENTIAL";

export interface IProcedure {
    procedureCode?: string;
    id?: number;
    type?: ProcedureType;
    companyId?: number;   // ✅ THÊM

    companyCode?: string;
    companyName?: string;
    companyId?: number;

    departmentId?: number;
    departmentName?: string;

    // ✅ THÊM — dùng cho DEPARTMENT type (nhiều phòng ban)
    departments?: {
        id: number;
        name: string;

        companyId?: number;    // ✅ THÊM
        companyName?: string;
        companyCode?: string;
    }[];

    sectionId?: number;
    sectionName?: string;

    procedureName: string;
    fileUrls?: string[];
    status?: string;
    planYear?: number;
    issuedDate?: string;
    note?: string;
    version?: number;

    userIds?: string[];
    assignedByList?: string[];

    active: boolean;
    createdByName?: string;

    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface IProcedureHistory {
    procedureCode?: string; // 🔥 THÊM
    id?: number;
    procedureId?: number;
    version?: number;
    procedureName?: string;
    status?: string;
    issuedDate?: string; // ← THÊM

    planYear?: number;
    fileUrls?: string[]; // ← đổi từ fileUrl?: string
    note?: string;
    departmentName?: string;
    sectionName?: string;
    action?: string;      // ← THÊM: "EDIT" hoặc 
    changedAt?: string;
    changedBy?: string;
}

export interface IProcedureRequest {
    procedureCode: string; // 🔥 BẮT BUỘC

    procedureName: string;
    status?: string;
    planYear?: number;
    issuedDate?: string; // ← THÊM

    fileUrls?: string[]; // ← đổi từ fileUrl?: string
    note?: string;
    active?: boolean;  // ← thêm dòng này
    departmentId?: number | null;    // ← giữ cho COMPANY & CONFIDENTIAL
    departmentIds?: number[] | null; // ← thêm cho DEPARTMENT
    sectionId?: number | null;
    // ← THÊM: dùng cho CONFIDENTIAL
    userIds?: string[];
}
export interface IDashboardSummary {
    totalCompany: number;
    totalDepartment: number;
    totalSection: number;
}

// THÊM interface này vào:
export interface IDepartmentCompleteness {
    departmentId: number;
    departmentName: string;
    companyName: string;
    orgChart: boolean;
    objectives: boolean;
    departmentProcedure: boolean;
    permissions: boolean;
    careerPath: boolean;
    salaryGrade: boolean;
    jobTitleMap: boolean;
    score: number;
}
/* ===================== EMPLOYEE ===================== */

export interface IEmployee {
    id: string;  // ❌ đang là number → string
    name: string;
    email: string;
    avatar?: string;
    active: boolean;

    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;

    role?: {
        id: number;
        name: string;
    };

    userInfo?: {
        employeeCode?: string;
        phone?: string;
        dateOfBirth?: string;
        gender?: "MALE" | "FEMALE" | "OTHER";
        startDate?: string;
        contractSignDate?: string;
        contractExpireDate?: string;
    };

    positions?: {
        id: string;
        source: "COMPANY" | "DEPARTMENT" | "SECTION";

        companyName?: string;
        departmentName?: string;
        sectionName?: string;

        jobTitleNameVi?: string;
    }[];
}
export interface ICreateEmployeeReq {
    name: string;
    email: string;
    active?: boolean;

    employeeCode?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    startDate?: string;
    contractSignDate?: string;
    contractExpireDate?: string;
}

export interface IUpdateEmployeeReq {
    id: string;  // ❌ đang là number → string

    name?: string;
    active?: boolean;

    employeeCode?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    startDate?: string;
    contractSignDate?: string;
    contractExpireDate?: string;
}


// hoàn thiện bộ hồ sơ 
export interface IAccessDTO {
    userId: string;
    name?: string;
    email?: string;
    assignedByName?: string;
    assignedAt?: string;
}
export interface IShareLogDTO {
    id: number;
    procedureId: number;
    procedureCode: string;
    procedureName: string;
    procedureStatus: string;
    procedureVersion: number;
    procedureIssuedDate?: string;

    // ← thêm 2 cái này để filter client-side
    companyId?: number;
    departmentId?: number;

    senderId: string;
    senderName: string;
    senderEmail: string;
    senderRole: string;

    receiverId: string;
    receiverName: string;
    receiverEmail: string;
    receiverRole: string;

    action: "SHARE" | "REVOKE";
    sentAt: string;
}