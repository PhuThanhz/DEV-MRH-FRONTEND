export const PATHS = {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",           // ⭐ THÊM
    CONFIRM_RESET_PASSWORD: "/confirm-reset-password", // ⭐ THÊ
    ADMIN: {
        ROOT: "/admin",
        DASHBOARD: "/admin",
        USER: "/admin/user",
        ROLE: "/admin/role",
        PERMISSION: "/admin/permission",
        COMPANY: "/admin/company",
        DEPARTMENT: "/admin/departments",
        SECTION: "/admin/sections",
        POSITION_LEVEL: "/admin/position-levels",
        JOB_TITLE: "/admin/job-titles",
        COMPANY_PROCEDURE: "/admin/company-procedures",
        CAREER_PATH: "/admin/departments/:departmentId/career-paths",
        EVALUATION_CRITERIA: "/admin/evaluation-criteria",
        JOB_DESCRIPTIONS: "/admin/job-descriptions",
        COMPANY_JOB_TITLE: "/admin/companies/:companyId/job-titles",
        JOB_TITLE_PERFORMANCE_CONTENT: "/admin/job-title-performance-content",
        SALARY_RANGE: "/admin/departments/:departmentId/salary-range",
        PROCESS_ACTION: "/admin/process-action",
        PERMISSION_CATEGORIES: "/admin/permission-categories",
        PERMISSION_CONTENTS: "/admin/permission-categories/:categoryId/contents",
        PERMISSION_MATRIX: "/admin/permission-contents/:contentId/matrix",
        DEPARTMENT_PERMISSION: "/admin/departments/:departmentId/permissions",
        DEPARTMENT_OBJECTIVES: "/admin/departments/:departmentId/objectives-tasks",
        DEPARTMENT_PROCEDURES: "/admin/departments/:departmentId/procedures",
        ORG_CHART_COMPANY: "/admin/companies/:companyId/org-chart",
        ORG_CHART_DEPARTMENT: "/admin/departments/:departmentId/org-chart",
        // ===== PROCEDURES (DÙNG CHUNG) =====
        // type=COMPANY → quy trình công ty
        // type=DEPARTMENT → quy trình phòng ban
        PROCEDURES: "/admin/procedures",
        COMPANY_PROCEDURES: "/admin/companies/:companyId/procedures",
        CONFIDENTIAL_PROCEDURES: "/admin/confidential-procedures", // ← THÊM
        CHANGE_PASSWORD: "/change-password",  // ⭐ THÊM

    },
    CLIENT: {
        ROOT: "/",
    },
};
