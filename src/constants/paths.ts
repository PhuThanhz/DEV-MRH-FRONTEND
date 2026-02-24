export const PATHS = {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",

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
        PERMISSION_MATRIX: "/admin/permission-contents/:contentId/matrix", // ⭐ BỔ SUNG


    },
    CLIENT: {
        ROOT: "/",
    },
};
