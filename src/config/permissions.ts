export const ALL_PERMISSIONS = {
    /* ===================== DASHBOARD ===================== */
    DASHBOARD: {
        GET_OVERVIEW: { method: "GET", apiPath: "/api/v1/dashboard/overview", module: "DASHBOARD" },
        GET_STATISTICS: { method: "GET", apiPath: "/api/v1/dashboard/statistics", module: "DASHBOARD" },
    },

    /* ===================== PERMISSIONS ===================== */
    PERMISSIONS: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/permissions", module: "PERMISSIONS" },
        CREATE: { method: "POST", apiPath: "/api/v1/permissions", module: "PERMISSIONS" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/permissions", module: "PERMISSIONS" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/permissions/{id}", module: "PERMISSIONS" },
    },

    /* ===================== ROLES ===================== */
    ROLES: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/roles", module: "ROLES" },
        CREATE: { method: "POST", apiPath: "/api/v1/roles", module: "ROLES" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/roles", module: "ROLES" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/roles/{id}", module: "ROLES" },
    },

    /* ===================== USERS ===================== */
    USERS: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/users", module: "USERS" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/users/{id}", module: "USERS" },
        CREATE: { method: "POST", apiPath: "/api/v1/users", module: "USERS" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/users", module: "USERS" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/users/{id}", module: "USERS" },
    },
    /* ===================== COMPANIES ===================== */
    COMPANIES: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/companies",
            module: "COMPANIES",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/companies/{id}",
            module: "COMPANIES",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/companies",
            module: "COMPANIES",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/companies",
            module: "COMPANIES",
        },

        INACTIVE: {
            method: "PUT",
            apiPath: "/api/v1/companies/{id}/inactive",
            module: "COMPANIES",
        },

        ACTIVE: {
            method: "PUT",
            apiPath: "/api/v1/companies/{id}/active",
            module: "COMPANIES",
        },
    },
    /* ===================== DEPARTMENTS ===================== */
    DEPARTMENTS: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/departments", module: "DEPARTMENTS" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/departments/{id}", module: "DEPARTMENTS" },
        CREATE: { method: "POST", apiPath: "/api/v1/departments", module: "DEPARTMENTS" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/departments/{id}", module: "DEPARTMENTS" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/departments/{id}", module: "DEPARTMENTS" },
    },
    /* ===================== DEPARTMENT JOB TITLES ===================== */
    DEPARTMENT_JOB_TITLES: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/department-job-titles",
            module: "DEPARTMENT_JOB_TITLES",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/department-job-titles/{id}",
            module: "DEPARTMENT_JOB_TITLES",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/department-job-titles",
            module: "DEPARTMENT_JOB_TITLES",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/department-job-titles/{id}",
            module: "DEPARTMENT_JOB_TITLES",
        },
        GET_BY_DEPARTMENT: {
            method: "GET",
            apiPath: "/api/v1/departments/{id}/job-titles",
            module: "DEPARTMENT_JOB_TITLES",
        },
        RESTORE: {
            method: "PATCH",
            apiPath: "/api/v1/department-job-titles/{id}/restore",
            module: "DEPARTMENT_JOB_TITLES",
        },
        GET_CAREER_PATH_BY_BAND: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/career-paths/by-band",
            module: "DEPARTMENT_JOB_TITLES",
        },
        GET_GLOBAL_CAREER_PATH: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/career-paths/global",
            module: "DEPARTMENT_JOB_TITLES",
        },
    },

    /* ===================== SECTIONS ===================== */
    SECTIONS: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/sections", module: "SECTIONS" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/sections/{id}", module: "SECTIONS" },
        CREATE: { method: "POST", apiPath: "/api/v1/sections", module: "SECTIONS" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/sections", module: "SECTIONS" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/sections/{id}", module: "SECTIONS" },

        // Nếu backend có hỗ trợ active/inactive API (bạn có rồi)
        ACTIVE: { method: "PUT", apiPath: "/api/v1/sections/{id}/active", module: "SECTIONS" },
        INACTIVE: { method: "PUT", apiPath: "/api/v1/sections/{id}/inactive", module: "SECTIONS" },
    },

    /* ===================== POSITION LEVELS ===================== */
    POSITION_LEVELS: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/position-levels",
            module: "POSITION_LEVELS"
        },

        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/position-levels/{id}",
            module: "POSITION_LEVELS"
        },

        CREATE: {
            method: "POST",
            apiPath: "/api/v1/position-levels",
            module: "POSITION_LEVELS"
        },

        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/position-levels",
            module: "POSITION_LEVELS"
        },

        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/position-levels/{id}",
            module: "POSITION_LEVELS"
        },

        // ⭐ Bật lại (active) — PHẢI DÙNG PUT
        ACTIVE: {
            method: "PUT",
            apiPath: "/api/v1/position-levels/{id}/active",
            module: "POSITION_LEVELS"
        },
    },
    /* ===================== JOB TITLES ===================== */
    JOB_TITLES: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/job-titles", module: "JOB_TITLES" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/job-titles/{id}", module: "JOB_TITLES" },
        CREATE: { method: "POST", apiPath: "/api/v1/job-titles", module: "JOB_TITLES" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/job-titles", module: "JOB_TITLES" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/job-titles/{id}", module: "JOB_TITLES" },
    },
    /* ===================== COMPANY PROCEDURES ===================== */
    COMPANY_PROCEDURES: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/company-procedures",
            module: "COMPANY_PROCEDURES",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/company-procedures/{id}",
            module: "COMPANY_PROCEDURES",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/company-procedures",
            module: "COMPANY_PROCEDURES",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/company-procedures/{id}",
            module: "COMPANY_PROCEDURES",
        },
        TOGGLE: {
            method: "PUT",
            apiPath: "/api/v1/company-procedures/{id}/toggle",
            module: "COMPANY_PROCEDURES",
        },
    },
    /* ===================== CAREER PATHS ===================== */
    CAREER_PATHS: {
        // Tạo mới
        CREATE: { method: "POST", apiPath: "/api/v1/career-paths", module: "CAREER_PATHS" },

        // Cập nhật
        UPDATE: { method: "PUT", apiPath: "/api/v1/career-paths/{id}", module: "CAREER_PATHS" },

        // Vô hiệu hóa (soft delete)
        DEACTIVATE: {
            method: "PATCH",
            apiPath: "/api/v1/career-paths/{id}/deactivate",
            module: "CAREER_PATHS",
        },

        // Chi tiết theo ID
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/career-paths/{id}",
            module: "CAREER_PATHS",
        },

        // Danh sách theo phòng ban
        GET_BY_DEPARTMENT: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/career-paths",
            module: "CAREER_PATHS",
        },

        // Nhóm theo Band
        GET_GROUPED_BY_BAND: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/career-paths/by-band",
            module: "CAREER_PATHS",
        },

        // Lộ trình liên cấp Global
        GET_GLOBAL: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/career-paths/global",
            module: "CAREER_PATHS",
        },

        // Danh sách tất cả active (không phân trang)
        GET_ALL_ACTIVE: {
            method: "GET",
            apiPath: "/api/v1/career-paths/active",
            module: "CAREER_PATHS",
        },
    },

    /* ==== SECTION JOB TITLE */
    SECTION_JOB_TITLES: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/section-job-titles",
            module: "SECTION_JOB_TITLES",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/section-job-titles/{id}",
            module: "SECTION_JOB_TITLES",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/section-job-titles",
            module: "SECTION_JOB_TITLES",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/section-job-titles/{id}",
            module: "SECTION_JOB_TITLES",
        },
        RESTORE: {
            method: "PATCH",
            apiPath: "/api/v1/section-job-titles/{id}/restore",
            module: "SECTION_JOB_TITLES",
        },
        GET_BY_SECTION: {
            method: "GET",
            apiPath: "/api/v1/section-job-titles/sections/{sectionId}/job-titles",
            module: "SECTION_JOB_TITLES",
        },
    },

    /* ===================== COMPANY JOB - TITLES ===================== */

    COMPANY_JOB_TITLES: {
        GET_BY_COMPANY: {
            method: "GET",
            apiPath: "/api/v1/companies/{companyId}/job-titles",
            module: "COMPANY_JOB_TITLES",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/company-job-titles",
            module: "COMPANY_JOB_TITLES",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/company-job-titles/{id}",
            module: "COMPANY_JOB_TITLES",
        },
        RESTORE: {
            method: "PUT",
            apiPath: "/api/v1/company-salary-grades/{id}/restore",
            module: "COMPANY_SALARY_GRADES"
        },
    },

    /* ===================== COMPANY SALARY GRADES ===================== */
    COMPANY_SALARY_GRADES: {
        GET_BY_COMPANY: {
            method: "GET",
            apiPath: "/api/v1/company-salary-grades?companyJobTitleId={companyJobTitleId}",
            module: "COMPANY_SALARY_GRADES"
        },

        CREATE: {
            method: "POST",
            apiPath: "/api/v1/company-salary-grades",
            module: "COMPANY_SALARY_GRADES"
        },

        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/company-salary-grades/{id}",
            module: "COMPANY_SALARY_GRADES"
        },

        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/company-salary-grades/{id}",
            module: "COMPANY_SALARY_GRADES"
        },
        RESTORE: {
            method: "PUT",
            apiPath: "/api/v1/department-salary-grades/{id}/restore",
            module: "DEPARTMENT_SALARY_GRADES"
        },

    },


    /* ===================== SALARY GRADES ===================== */
    SALARY_GRADES: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/salary-grades", module: "SALARY_GRADES" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/salary-grades/{id}", module: "SALARY_GRADES" },
        CREATE: { method: "POST", apiPath: "/api/v1/salary-grades", module: "SALARY_GRADES" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/salary-grades/{id}", module: "SALARY_GRADES" },
    },
    /* ===================== DEPARTMENT SALARY GRADES ===================== */
    DEPARTMENT_SALARY_GRADES: {
        GET: { method: "GET", apiPath: "/api/v1/department-salary-grades", module: "DEPARTMENT_SALARY_GRADES" },
        CREATE: { method: "POST", apiPath: "/api/v1/department-salary-grades", module: "DEPARTMENT_SALARY_GRADES" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/department-salary-grades/{id}", module: "DEPARTMENT_SALARY_GRADES" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/department-salary-grades/{id}", module: "DEPARTMENT_SALARY_GRADES" },
        RESTORE: {
            method: "PUT",
            apiPath: "/api/v1/department-salary-grades/{id}/restore",
            module: "DEPARTMENT_SALARY_GRADES"
        },
    },

    /* ===================== SECTION SALARY GRADES ===================== */
    SECTION_SALARY_GRADES: {
        GET: { method: "GET", apiPath: "/api/v1/section-salary-grades", module: "SECTION_SALARY_GRADES" },
        CREATE: { method: "POST", apiPath: "/api/v1/section-salary-grades", module: "SECTION_SALARY_GRADES" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/section-salary-grades/{id}", module: "SECTION_SALARY_GRADES" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/section-salary-grades/{id}", module: "SECTION_SALARY_GRADES" },
        RESTORE: {
            method: "PUT",
            apiPath: "/api/v1/section-salary-grades/{id}/restore",
            module: "SECTION_SALARY_GRADES"
        },
    },
    /* ===================== JOB TITLE PERFORMANCE CONTENT ===================== */
    JOB_TITLE_PERFORMANCE_CONTENT: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/job-title-performance-contents",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/job-title-performance-contents/{id}",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/job-title-performance-contents",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/job-title-performance-contents/{id}",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/job-title-performance-contents/{id}",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        RESTORE: {
            method: "PUT",
            apiPath: "/api/v1/job-title-performance-contents/{id}/restore",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
    },
    // ============================================================
    //                  ⭐⭐ SALARY RANGE MODULE ⭐⭐
    // ============================================================

    // ------------------ KHUNG LƯƠNG 2 CHIỀU --------------------
    SALARY_RANGE: {
        VIEW: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/salary-matrix",
            module: "SALARY_RANGE",
        },
    },

    // ------------------ CẤU TRÚC LƯƠNG (Mức A/B/C/D) --------------------
    SALARY_STRUCTURE: {
        UPSERT: {
            method: "POST",
            apiPath: "/api/v1/salary-structures/upsert",
            module: "SALARY_STRUCTURE",
        },
        VIEW_DETAIL: {
            method: "GET",
            apiPath: "/api/v1/salary-structures/{id}",
            module: "SALARY_STRUCTURE",
        },
    },

    // ------------------ PERFORMANCE CONTENT (A/B/C/D) --------------------
    PERFORMANCE_CONTENT: {
        VIEW: {
            method: "GET",
            apiPath:
                "/api/v1/performance-content?ownerLevel={ownerLevel}&ownerJobTitleId={jobTitleId}&salaryGradeId={gradeId}",
            module: "PERFORMANCE_CONTENT",
        },
        UPSERT: {
            method: "POST",
            apiPath: "/api/v1/performance-content/upsert",
            module: "PERFORMANCE_CONTENT",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/performance-content/{id}",
            module: "PERFORMANCE_CONTENT",
        },
    },

    /* ===================== PROCESS ACTIONS ===================== */
    PROCESS_ACTIONS: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/process-actions", module: "PROCESS_ACTIONS" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/process-actions/{id}", module: "PROCESS_ACTIONS" },
        CREATE: { method: "POST", apiPath: "/api/v1/process-actions", module: "PROCESS_ACTIONS" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/process-actions", module: "PROCESS_ACTIONS" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/process-actions/{id}", module: "PROCESS_ACTIONS" },
    },
    /* ===================== PERMISSION CATEGORIES ===================== */

    PERMISSION_CATEGORY: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/permission-categories", module: "PERMISSION_CATEGORY" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/permission-categories/{id}", module: "PERMISSION_CATEGORY" },
        CREATE: { method: "POST", apiPath: "/api/v1/permission-categories", module: "PERMISSION_CATEGORY" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/permission-categories/{id}", module: "PERMISSION_CATEGORY" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/permission-categories/{id}", module: "PERMISSION_CATEGORY" },
    },

    PERMISSION_CONTENT: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/permission-contents", module: "PERMISSION_CONTENT" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/permission-contents/{id}", module: "PERMISSION_CONTENT" },
        CREATE: { method: "POST", apiPath: "/api/v1/permission-contents", module: "PERMISSION_CONTENT" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/permission-contents/{id}", module: "PERMISSION_CONTENT" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/permission-contents/{id}", module: "PERMISSION_CONTENT" },
        TOGGLE_ACTIVE: { // ⭐ BỔ SUNG
            method: "PATCH",
            apiPath: "/api/v1/permission-contents/{id}/toggle",
            module: "PERMISSION_CONTENT",
        },
    },
    /* ===================== PERMISSION ASSIGNMENT ===================== */
    PERMISSION_ASSIGNMENT: {
        GET_MATRIX: {
            method: "GET",
            apiPath: "/api/v1/permission-contents/{contentId}/matrix",
            module: "PERMISSION_ASSIGNMENT",
        },
        ASSIGN: {
            method: "POST",
            apiPath: "/api/v1/permission-contents/{contentId}/assign",
            module: "PERMISSION_ASSIGNMENT",
        },
    },
    /* ===================== JOB DESCRIPTIONS ===================== */
    JOB_DESCRIPTIONS: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/job-descriptions",
            module: "JOB_DESCRIPTIONS",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/job-descriptions/{id}",
            module: "JOB_DESCRIPTIONS",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/job-descriptions",
            module: "JOB_DESCRIPTIONS",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/job-descriptions",
            module: "JOB_DESCRIPTIONS",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/job-descriptions/{id}",
            module: "JOB_DESCRIPTIONS",
        },
        ISSUE: {
            method: "POST",
            apiPath: "/api/v1/job-descriptions/{id}/issue",
            module: "JOB_DESCRIPTIONS",
        },
    },




};



export const ALL_MODULES = {
    DASHBOARD: "DASHBOARD",
    PERMISSIONS: "PERMISSIONS",
    ROLES: "ROLES",
    USERS: "USERS",
    JD_FLOW: "JD",
    COMPANIES: "COMPANIES",
    DEPARTMENTS: "DEPARTMENTS",
    SECTIONS: "SECTIONS",
    POSITION_LEVELS: "POSITION_LEVELS",
    JOB_TITLES: "JOB_TITLES",
    COMPANY_PROCEDURES: "COMPANY_PROCEDURES",
    CAREER_PATHS: "CAREER_PATHS",
    DEPARTMENT_JOB_TITLES: "DEPARTMENT_JOB_TITLES",
    SECTION_JOB_TITLES: "SECTION_JOB_TITLES",
    ORG_CHARTS: "ORG_CHARTS",
    COMPANY_JOB_TITLES: "COMPANY_JOB_TITLES",
    SALARY_GRADES: "SALARY_GRADES",
    COMPANY_SALARY_GRADES: "COMPANY_SALARY_GRADES",
    SECTION_SALARY_GRADES: "SECTION_SALARY_GRADES",
    JOB_TITLE_PERFORMANCE_CONTENT: "JOB_TITLE_PERFORMANCE_CONTENT",
    SALARY_RANGE: "SALARY_RANGE",                // xem khung lương theo tháng/giờ
    SALARY_STRUCTURE: "SALARY_STRUCTURE",        // cấu trúc lương A/B/C/D
    PROCESS_ACTIONS: "PROCESS_ACTIONS",
    PERMISSION_CATEGORY: "PERMISSION_CATEGORY",
    PERMISSION_CONTENTS: "PERMISSION_CONTENTS",
    PERMISSION_ASSIGNMENT: "PERMISSION_ASSIGNMENT", // ⭐ BỔ SUNG
    JOB_DESCRIPTIONS: "JOB_DESCRIPTIONS",

};
