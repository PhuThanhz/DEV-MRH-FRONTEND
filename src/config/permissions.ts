export const ALL_PERMISSIONS = {
    /* ===================== DASHBOARD ===================== */
    // DASHBOARD: {
    //     GET_OVERVIEW: { method: "GET", apiPath: "/api/v1/dashboard/overview", module: "DASHBOARD" },
    //     GET_STATISTICS: { method: "GET", apiPath: "/api/v1/dashboard/statistics", module: "DASHBOARD" },
    // },
    DASHBOARD: {
        GET_SUMMARY: {
            method: "GET",
            apiPath: "/api/v1/dashboard/summary",
            module: "DASHBOARD",
        },
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
    /* ===================== USER POSITIONS ===================== */
    USER_POSITIONS: {
        GET_BY_USER: {
            method: "GET",
            apiPath: "/api/v1/users/{userId}/positions",
            module: "USERS",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/users/{userId}/positions",
            module: "USERS",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/users/positions/{id}",
            module: "USERS",
        },
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
        GET_BY_COMPANY: { method: "GET", apiPath: "/api/v1/departments/by-company/{companyId}", module: "DEPARTMENTS" },

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
        GET_BY_DEPARTMENT: { method: "GET", apiPath: "/api/v1/sections/by-department/{departmentId}", module: "SECTIONS" },

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
        ACTIVE: {
            method: "PUT",
            apiPath: "/api/v1/company-procedures/{id}/active",
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
        },   // ← THÊM MỚI
        GET_MY: {
            method: "GET",
            apiPath: "/api/v1/company-salary-grades/my",
            module: "COMPANY_SALARY_GRADES"
        },
        GET_MY_COMPANY: {
            method: "GET",
            apiPath: "/api/v1/company-salary-grades/my-company",
            module: "COMPANY_SALARY_GRADES"
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
        // ← THÊM MỚI
        GET_MY: {
            method: "GET",
            apiPath: "/api/v1/department-salary-grades/my",
            module: "DEPARTMENT_SALARY_GRADES"
        },
        GET_MY_DEPARTMENT: {
            method: "GET",
            apiPath: "/api/v1/department-salary-grades/my-department",
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
        GET_MY: {
            method: "GET",
            apiPath: "/api/v1/section-salary-grades/my",
            module: "SECTION_SALARY_GRADES"
        },
        GET_MY_SECTION: {
            method: "GET",
            apiPath: "/api/v1/section-salary-grades/my-section",
            module: "SECTION_SALARY_GRADES"
        },
    },
    /* ===================== JOB TITLE PERFORMANCE CONTENT ===================== */
    JOB_TITLE_PERFORMANCE_CONTENT: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/job-title-performance-content",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/job-title-performance-content/{id}",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/job-title-performance-content",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/job-title-performance-content/{id}",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        DISABLE: {
            method: "PUT",
            apiPath: "/api/v1/job-title-performance-content/{id}/disable",
            module: "JOB_TITLE_PERFORMANCE_CONTENT",
        },
        RESTORE: {
            method: "PUT",
            apiPath: "/api/v1/job-title-performance-content/{id}/restore",
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
        VIEW_MY: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/salary-matrix/my",
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
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/job-descriptions", module: "JOB_DESCRIPTIONS" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/job-descriptions/{id}", module: "JOB_DESCRIPTIONS" },
        CREATE: { method: "POST", apiPath: "/api/v1/job-descriptions", module: "JOB_DESCRIPTIONS" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/job-descriptions/{id}", module: "JOB_DESCRIPTIONS" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/job-descriptions/{id}", module: "JOB_DESCRIPTIONS" },
        GET_MY: {                                   // thêm dòng này
            method: "GET",
            apiPath: "/api/v1/job-descriptions/my",
            module: "JOB_DESCRIPTIONS"
        },
        GET_PUBLISHED: { method: "GET", apiPath: "/api/v1/job-descriptions/published", module: "JOB_DESCRIPTIONS" },
        GET_REJECTED: { method: "GET", apiPath: "/api/v1/job-descriptions/rejected", module: "JOB_DESCRIPTIONS" },
        GET_ALL: { method: "GET", apiPath: "/api/v1/job-descriptions/all", module: "JOB_DESCRIPTIONS" },
    },

    /* ===================== DEPARTMENT OBJECTIVES ===================== */
    DEPARTMENT_OBJECTIVES: {
        VIEW: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/objectives",
            module: "DEPARTMENT_OBJECTIVES",
        },

        CREATE: {
            method: "POST",
            apiPath: "/api/v1/department-objectives",
            module: "DEPARTMENT_OBJECTIVES",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/department-objectives",
            module: "DEPARTMENT_OBJECTIVES",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/department-objectives/{id}",
            module: "DEPARTMENT_OBJECTIVES",
        },

        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/department-objectives",
            module: "DEPARTMENT_OBJECTIVES",
        },

        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/department-objectives/{id}",
            module: "DEPARTMENT_OBJECTIVES",
        },
    },

    /* ===================== DEPARTMENT PROCEDURES ===================== */
    DEPARTMENT_PROCEDURES: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/department-procedures",
            module: "DEPARTMENT_PROCEDURES",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/department-procedures/{id}",
            module: "DEPARTMENT_PROCEDURES",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/department-procedures",
            module: "DEPARTMENT_PROCEDURES",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/department-procedures",
            module: "DEPARTMENT_PROCEDURES",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/department-procedures/{id}",
            module: "DEPARTMENT_PROCEDURES",
        },
    },

    /* ===================== ORG CHARTS ===================== */

    ORG_CHARTS: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/job-position-charts",
            module: "ORG_CHARTS",
        },

        CREATE: {
            method: "POST",
            apiPath: "/api/v1/job-position-charts",
            module: "ORG_CHARTS",
        },

        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/job-position-charts",
            module: "ORG_CHARTS",
        },

        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/job-position-charts/{id}",
            module: "ORG_CHARTS",
        },
    },

    /* ===================== ORG NODES ===================== */

    ORG_NODES: {
        GET_BY_CHART: {
            method: "GET",
            apiPath: "/api/v1/job-position-nodes/chart/{chartId}",
            module: "ORG_CHARTS",
        },

        CREATE: {
            method: "POST",
            apiPath: "/api/v1/job-position-nodes",
            module: "ORG_CHARTS",
        },

        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/job-position-nodes",
            module: "ORG_CHARTS",
        },

        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/job-position-nodes/{id}",
            module: "ORG_CHARTS",
        },
    },
    /* ===================== JD FLOW ===================== */
    JD_FLOW: {
        FETCH_FLOW: {
            method: "GET",
            apiPath: "/api/v1/jd-flow/{jdId}",
            module: "JD_FLOW",
        },

        FETCH_INBOX: {
            method: "GET",
            apiPath: "/api/v1/jd-flow/inbox",
            module: "JD_FLOW",
        },

        FETCH_APPROVERS: {
            method: "GET",
            apiPath: "/api/v1/jd-flow/approvers",
            module: "JD_FLOW",
        },

        FETCH_LOGS: {
            method: "GET",
            apiPath: "/api/v1/jd-flow/logs/{jdId}",
            module: "JD_FLOW",
        },

        SUBMIT: {
            method: "POST",
            apiPath: "/api/v1/jd-flow/submit",
            module: "JD_FLOW",
        },

        APPROVE: {
            method: "POST",
            apiPath: "/api/v1/jd-flow/approve",
            module: "JD_FLOW",
        },

        REJECT: {
            method: "POST",
            apiPath: "/api/v1/jd-flow/reject",
            module: "JD_FLOW",
        },

        ISSUE: {
            method: "POST",
            apiPath: "/api/v1/jd-flow/issue",
            module: "JD_FLOW",
        },
    },
    /* ===================== PROCEDURES (DÙNG CHUNG) ===================== */
    PROCEDURES: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/procedures",
            module: "PROCEDURES",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/procedures/{id}",
            module: "PROCEDURES",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/procedures",
            module: "PROCEDURES",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/procedures/{id}",
            module: "PROCEDURES",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/procedures/{id}",
            module: "PROCEDURES",
        },
        TOGGLE_ACTIVE: {
            method: "PUT",
            apiPath: "/api/v1/procedures/{id}/active",
            module: "PROCEDURES",
        },
        GET_BY_DEPARTMENT: {
            method: "GET",
            apiPath: "/api/v1/procedures/by-department/{departmentId}",
            module: "PROCEDURES",
        },
        GET_BY_SECTION: {
            method: "GET",
            apiPath: "/api/v1/procedures/by-section/{sectionId}",
            module: "PROCEDURES",
        },
        GET_HISTORY: {
            method: "GET",
            apiPath: "/api/v1/procedures/{id}/history",
            module: "PROCEDURES",
        },
        // ← THÊM
        GET_CONFIDENTIAL: {
            method: "GET",
            apiPath: "/api/v1/procedures/confidential",
            module: "PROCEDURES",
        },
        // ← THÊM 3 CREATE RIÊNG
        CREATE_COMPANY: {
            method: "POST",
            apiPath: "/api/v1/procedures/company",
            module: "PROCEDURES",
        },
        CREATE_DEPARTMENT: {
            method: "POST",
            apiPath: "/api/v1/procedures/department",
            module: "PROCEDURES",
        },
        CREATE_CONFIDENTIAL: {
            method: "POST",
            apiPath: "/api/v1/procedures/confidential",
            module: "PROCEDURES",
        },
        // ← THÊM
        REVISE: {
            method: "POST",
            apiPath: "/api/v1/procedures/{id}/revise",
            module: "PROCEDURES",
        },
    },
    /* ===================== EMPLOYEE CAREER PATH ===================== */
    EMPLOYEE_CAREER_PATHS: {
        ASSIGN: {
            method: "POST",
            apiPath: "/api/v1/employee-career-paths",
            module: "EMPLOYEE_CAREER_PATHS",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/employee-career-paths/{id}",
            module: "EMPLOYEE_CAREER_PATHS",
        },
        PROMOTE: {
            method: "POST",
            apiPath: "/api/v1/employee-career-paths/{id}/promote",
            module: "EMPLOYEE_CAREER_PATHS",
        },
        SET_STATUS: {
            method: "PATCH",
            apiPath: "/api/v1/employee-career-paths/{id}/status",
            module: "EMPLOYEE_CAREER_PATHS",
        },
        GET_BY_USER: {
            method: "GET",
            apiPath: "/api/v1/employee-career-paths/user/{userId}",
            module: "EMPLOYEE_CAREER_PATHS",
        },
        GET_BY_DEPARTMENT: {
            method: "GET",
            apiPath: "/api/v1/employee-career-paths/department/{departmentId}",
            module: "EMPLOYEE_CAREER_PATHS",
        },
        GET_UPCOMING: {
            method: "GET",
            apiPath: "/api/v1/employee-career-paths/upcoming-promotions",
            module: "EMPLOYEE_CAREER_PATHS",
        },
        GET_HISTORY: {
            method: "GET",
            apiPath: "/api/v1/employee-career-paths/history/{userId}",
            module: "EMPLOYEE_CAREER_PATHS",
        },
        DEACTIVATE: {
            method: "PATCH",
            apiPath: "/api/v1/employee-career-paths/{id}/deactivate",
            module: "EMPLOYEE_CAREER_PATHS",
        },
    },
    /* ===================== CAREER PATH TEMPLATES ===================== */
    CAREER_PATH_TEMPLATES: {
        CREATE: { method: "POST", apiPath: "/api/v1/career-path-templates", module: "CAREER_PATH_TEMPLATES" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/career-path-templates/{id}", module: "CAREER_PATH_TEMPLATES" },
        DEACTIVATE: { method: "PATCH", apiPath: "/api/v1/career-path-templates/{id}/deactivate", module: "CAREER_PATH_TEMPLATES" },
        ACTIVATE: { method: "PATCH", apiPath: "/api/v1/career-path-templates/{id}/activate", module: "CAREER_PATH_TEMPLATES" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/career-path-templates/{id}", module: "CAREER_PATH_TEMPLATES" },
        GET_ALL: { method: "GET", apiPath: "/api/v1/career-path-templates", module: "CAREER_PATH_TEMPLATES" },
        GET_ACTIVE: { method: "GET", apiPath: "/api/v1/career-path-templates/active", module: "CAREER_PATH_TEMPLATES" },
    },
    /* ===================== USER INFO ===================== */
    USER_INFO: {
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/users/{userId}/info",
            module: "USERS",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/users/{userId}/info",
            module: "USERS",
        },
        GET_BY_USER: {
            method: "GET",
            apiPath: "/api/v1/users/{userId}/info",
            module: "USERS",
        },
    },
    PROCEDURE_COMPANY: {
        GET_PAGINATE: { // ← THÊM DÒNG NÀY
            method: "GET",
            apiPath: "/api/v1/procedures",
            module: "PROCEDURE_COMPANY",
        },
        CREATE: { method: "POST", apiPath: "/api/v1/procedures/company", module: "PROCEDURE_COMPANY" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/procedures/{id}", module: "PROCEDURE_COMPANY" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/procedures/{id}", module: "PROCEDURE_COMPANY" },
        REVISE: { method: "POST", apiPath: "/api/v1/procedures/{id}/revise", module: "PROCEDURE_COMPANY" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/procedures/{id}", module: "PROCEDURE_COMPANY" },
    },
    PROCEDURE_DEPARTMENT: {
        GET_PAGINATE: { // ← THÊM
            method: "GET",
            apiPath: "/api/v1/procedures",
            module: "PROCEDURE_DEPARTMENT",
        },
        CREATE: { method: "POST", apiPath: "/api/v1/procedures/department", module: "PROCEDURE_DEPARTMENT" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/procedures/{id}", module: "PROCEDURE_DEPARTMENT" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/procedures/{id}", module: "PROCEDURE_DEPARTMENT" },
        REVISE: { method: "POST", apiPath: "/api/v1/procedures/{id}/revise", module: "PROCEDURE_DEPARTMENT" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/procedures/{id}", module: "PROCEDURE_DEPARTMENT" },
    },

    PROCEDURE_CONFIDENTIAL: {
        GET_PAGINATE: { // ← THÊM
            method: "GET",
            apiPath: "/api/v1/procedures",
            module: "PROCEDURE_CONFIDENTIAL",
        },
        CREATE: { method: "POST", apiPath: "/api/v1/procedures/confidential", module: "PROCEDURE_CONFIDENTIAL" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/procedures/{id}", module: "PROCEDURE_CONFIDENTIAL" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/procedures/{id}", module: "PROCEDURE_CONFIDENTIAL" },
        REVISE: { method: "POST", apiPath: "/api/v1/procedures/{id}/revise", module: "PROCEDURE_CONFIDENTIAL" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/procedures/{id}", module: "PROCEDURE_CONFIDENTIAL" },
    },
    /* ===================== EMPLOYEES ===================== */
    EMPLOYEES: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/employees",
            module: "EMPLOYEES",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/employees/{id}",
            module: "EMPLOYEES",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/employees",
            module: "EMPLOYEES",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/employees",
            module: "EMPLOYEES",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/employees/{id}",
            module: "EMPLOYEES",
        },
    },
    POSITION_CHART: {
        VIEW: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/company-job-titles",
            module: "POSITION_CHART",
        },
    },
};



export const ALL_MODULES = {
    DASHBOARD: "DASHBOARD",
    PERMISSIONS: "PERMISSIONS",
    ROLES: "ROLES",
    USERS: "USERS",
    JD_FLOW: "JD_FLOW",
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
    SALARY_RANGE: "SALARY_RANGE",
    SALARY_STRUCTURE: "SALARY_STRUCTURE",
    PROCESS_ACTIONS: "PROCESS_ACTIONS",
    PERMISSION_CATEGORY: "PERMISSION_CATEGORY",
    PERMISSION_CONTENTS: "PERMISSION_CONTENTS",
    PERMISSION_ASSIGNMENT: "PERMISSION_ASSIGNMENT",
    JOB_DESCRIPTIONS: "JOB_DESCRIPTIONS",
    DEPARTMENT_OBJECTIVES: "DEPARTMENT_OBJECTIVES",
    DEPARTMENT_PROCEDURES: "DEPARTMENT_PROCEDURES",
    USER_POSITIONS: "USERS",
    PROCEDURES: "PROCEDURES",
    EMPLOYEE_CAREER_PATHS: "EMPLOYEE_CAREER_PATHS",
    CAREER_PATH_TEMPLATES: "CAREER_PATH_TEMPLATES",
    PROCEDURE_COMPANY: "PROCEDURE_COMPANY",
    PROCEDURE_DEPARTMENT: "PROCEDURE_DEPARTMENT",
    PROCEDURE_CONFIDENTIAL: "PROCEDURE_CONFIDENTIAL",
    EMPLOYEES: "EMPLOYEES",
    POSITION_CHART: "POSITION_CHART",
};
