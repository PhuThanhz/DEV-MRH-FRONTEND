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
        GET_DEPARTMENT_COMPLETENESS: {  // ← THÊM
            method: "GET",
            apiPath: "/api/v1/dashboard/department-completeness",
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
    /* ===================== ACCOUNTING DOCUMENTS ===================== */
    ACCOUNTING_DOCUMENTS: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/accounting-documents", module: "ACCOUNTING_DOCUMENTS" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/accounting-documents/{id}", module: "ACCOUNTING_DOCUMENTS" },
        CREATE: { method: "POST", apiPath: "/api/v1/accounting-documents", module: "ACCOUNTING_DOCUMENTS" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/accounting-documents/{id}", module: "ACCOUNTING_DOCUMENTS" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/accounting-documents/{id}", module: "ACCOUNTING_DOCUMENTS" },
    },
    /* ===================== ACCOUNTING DOSSIERS ===================== */
    ACCOUNTING_DOSSIERS: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/accounting-dossiers", module: "ACCOUNTING_DOSSIERS" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/accounting-dossiers/{id}", module: "ACCOUNTING_DOSSIERS" },
        GET_BY_QR_TOKEN: { method: "GET", apiPath: "/api/v1/accounting-dossiers/qr/{token}", module: "ACCOUNTING_DOSSIERS" },
        CREATE: { method: "POST", apiPath: "/api/v1/accounting-dossiers", module: "ACCOUNTING_DOSSIERS" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/accounting-dossiers/{id}", module: "ACCOUNTING_DOSSIERS" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/accounting-dossiers/{id}", module: "ACCOUNTING_DOSSIERS" },
        SUBMIT: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/submit", module: "ACCOUNTING_DOSSIERS" },
        REQUEST_RETURN: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/request-return", module: "ACCOUNTING_DOSSIERS" },
        GET_LOGS: { method: "GET", apiPath: "/api/v1/accounting-dossiers/{id}/logs", module: "ACCOUNTING_DOSSIERS" },
        GET_CATEGORIES: { method: "GET", apiPath: "/api/v1/accounting-dossiers/categories", module: "ACCOUNTING_DOSSIERS" },
        GET_ACTIVE_CATEGORIES: { method: "GET", apiPath: "/api/v1/accounting-dossiers/categories/active", module: "ACCOUNTING_DOSSIERS" },
        CREATE_CATEGORY: { method: "POST", apiPath: "/api/v1/accounting-dossiers/categories", module: "ACCOUNTING_DOSSIERS" },
        UPDATE_CATEGORY: { method: "PUT", apiPath: "/api/v1/accounting-dossiers/categories/{categoryId}", module: "ACCOUNTING_DOSSIERS" },
        DELETE_CATEGORY: { method: "DELETE", apiPath: "/api/v1/accounting-dossiers/categories/{categoryId}", module: "ACCOUNTING_DOSSIERS" },
        TOGGLE_CATEGORY_ACTIVE: { method: "PUT", apiPath: "/api/v1/accounting-dossiers/categories/{categoryId}/active", module: "ACCOUNTING_DOSSIERS" },
        GET_DOCUMENTS: { method: "GET", apiPath: "/api/v1/accounting-dossiers/{id}/documents", module: "ACCOUNTING_DOSSIERS" },
        CREATE_DOCUMENT: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/documents", module: "ACCOUNTING_DOSSIERS" },
        UPDATE_DOCUMENT: { method: "PUT", apiPath: "/api/v1/accounting-dossiers/{id}/documents/{docId}", module: "ACCOUNTING_DOSSIERS" },
        DELETE_DOCUMENT: { method: "DELETE", apiPath: "/api/v1/accounting-dossiers/{id}/documents/{docId}", module: "ACCOUNTING_DOSSIERS" },
        GET_APPROVAL_STEPS: { method: "GET", apiPath: "/api/v1/accounting-dossiers/{id}/approval-steps", module: "ACCOUNTING_DOSSIERS" },
        GET_DASHBOARD_SUMMARY: { method: "GET", apiPath: "/api/v1/accounting-dossiers/dashboard/summary", module: "ACCOUNTING_DOSSIERS" },
        GET_DASHBOARD_PENDING_BY_ROLE: { method: "GET", apiPath: "/api/v1/accounting-dossiers/dashboard/pending-by-role", module: "ACCOUNTING_DOSSIERS" },
        REPORT_BY_STATUS: { method: "GET", apiPath: "/api/v1/accounting-dossiers/reports/by-status", module: "ACCOUNTING_DOSSIERS" },
        REPORT_BY_DEPARTMENT: { method: "GET", apiPath: "/api/v1/accounting-dossiers/reports/by-department", module: "ACCOUNTING_DOSSIERS" },
        REPORT_BY_CATEGORY: { method: "GET", apiPath: "/api/v1/accounting-dossiers/reports/by-category", module: "ACCOUNTING_DOSSIERS" },
        REFRESH_EXPIRED_STORAGE: { method: "POST", apiPath: "/api/v1/accounting-dossiers/storage/refresh-expired", module: "ACCOUNTING_DOSSIERS" },
        GLOBAL_DOCUMENTS: { method: "GET", apiPath: "/api/v1/accounting-dossiers/documents", module: "ACCOUNTING_DOSSIERS" },
        SCAN_APPROVAL_OVERDUE: { method: "POST", apiPath: "/api/v1/accounting-approval-sla/scan-overdue", module: "ACCOUNTING_DOSSIERS" },
        CHECK_DOCUMENT: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/documents/{docId}/check", module: "ACCOUNTING_DOSSIERS" },
        BULK_CHECK_DOCUMENTS: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/documents/bulk-check", module: "ACCOUNTING_DOSSIERS" },
        BULK_CHECK_DOCUMENTS_ROUTE: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/documents/bulk/check", module: "ACCOUNTING_DOSSIERS" },
        PENDING_MY_APPROVAL: { method: "GET", apiPath: "/api/v1/accounting-dossiers/pending-my-approval", module: "ACCOUNTING_DOSSIERS" },
        APPROVE: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/approve", module: "ACCOUNTING_DOSSIERS" },
        REJECT: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/reject", module: "ACCOUNTING_DOSSIERS" },
        BULK_APPROVE: { method: "POST", apiPath: "/api/v1/accounting-dossiers/bulk-approve", module: "ACCOUNTING_DOSSIERS" },
        BULK_APPROVE_ROUTE: { method: "POST", apiPath: "/api/v1/accounting-dossiers/bulk/approve", module: "ACCOUNTING_DOSSIERS" },
        BULK_REJECT: { method: "POST", apiPath: "/api/v1/accounting-dossiers/bulk/reject", module: "ACCOUNTING_DOSSIERS" },
        CLAIM: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/claim", module: "ACCOUNTING_DOSSIERS" },
        REASSIGN_DIRECTOR: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/reassign-director", module: "ACCOUNTING_DOSSIERS" },
        TERMINATE: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/terminate", module: "ACCOUNTING_DOSSIERS" },
        REOPEN: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/reopen", module: "ACCOUNTING_DOSSIERS" },
        ARCHIVE: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/archive", module: "ACCOUNTING_DOSSIERS" },
        RETURN_RESPONSE: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/return-response", module: "ACCOUNTING_DOSSIERS" },
        SYNC_TEMPLATE_REJECT: { method: "POST", apiPath: "/api/v1/accounting-dossiers/{id}/sync-template/reject", module: "ACCOUNTING_DOSSIERS" },
    },
    /* ===================== ACCOUNTING WORKFLOWS ===================== */
    ACCOUNTING_WORKFLOWS: {
        VIEW: { method: "GET", apiPath: "/api/v1/accounting-approval-workflows", module: "ACCOUNTING_WORKFLOWS" },
        CREATE_DRAFT: { method: "POST", apiPath: "/api/v1/accounting-approval-workflows", module: "ACCOUNTING_WORKFLOWS" },
        UPDATE_DRAFT: { method: "PUT", apiPath: "/api/v1/accounting-approval-workflows/{id}/draft", module: "ACCOUNTING_WORKFLOWS" },
        VALIDATE: { method: "POST", apiPath: "/api/v1/accounting-approval-workflows/{id}/validate", module: "ACCOUNTING_WORKFLOWS" },
        PUBLISH: { method: "POST", apiPath: "/api/v1/accounting-approval-workflows/{id}/publish", module: "ACCOUNTING_WORKFLOWS" },
        DEACTIVATE: { method: "POST", apiPath: "/api/v1/accounting-approval-workflows/{id}/deactivate", module: "ACCOUNTING_WORKFLOWS" },
        REACTIVATE: { method: "POST", apiPath: "/api/v1/accounting-approval-workflows/{id}/reactivate", module: "ACCOUNTING_WORKFLOWS" },
        COPY_DRAFT: { method: "POST", apiPath: "/api/v1/accounting-approval-workflows/{id}/copy", module: "ACCOUNTING_WORKFLOWS" },
        PREVIEW: { method: "POST", apiPath: "/api/v1/accounting-approval-workflows/dossiers/{dossierId}/preview", module: "ACCOUNTING_WORKFLOWS" },
    },
    /* ===================== ACCOUNTING DELEGATIONS ===================== */
    ACCOUNTING_DELEGATIONS: {
        VIEW: { method: "GET", apiPath: "/api/v1/accounting-approval-delegations", module: "ACCOUNTING_DELEGATIONS" },
        CREATE: { method: "POST", apiPath: "/api/v1/accounting-approval-delegations", module: "ACCOUNTING_DELEGATIONS" },
        ACTIVATE: { method: "POST", apiPath: "/api/v1/accounting-approval-delegations/{id}/activate", module: "ACCOUNTING_DELEGATIONS" },
        REVOKE: { method: "POST", apiPath: "/api/v1/accounting-approval-delegations/{id}/revoke", module: "ACCOUNTING_DELEGATIONS" },
    },
    /* ===================== ACCOUNTING DOCUMENT CATEGORIES ===================== */
    ACCOUNTING_DOCUMENT_CATEGORIES: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/accounting-document-categories", module: "ACCOUNTING_DOCUMENT_CATEGORIES" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/accounting-document-categories/{id}", module: "ACCOUNTING_DOCUMENT_CATEGORIES" },
        GET_ACTIVE: { method: "GET", apiPath: "/api/v1/accounting-document-categories/active", module: "ACCOUNTING_DOCUMENT_CATEGORIES" },
        CREATE: { method: "POST", apiPath: "/api/v1/accounting-document-categories", module: "ACCOUNTING_DOCUMENT_CATEGORIES" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/accounting-document-categories/{id}", module: "ACCOUNTING_DOCUMENT_CATEGORIES" },
        TOGGLE_ACTIVE: { method: "PUT", apiPath: "/api/v1/accounting-document-categories/{id}/active", module: "ACCOUNTING_DOCUMENT_CATEGORIES" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/accounting-document-categories/{id}", module: "ACCOUNTING_DOCUMENT_CATEGORIES" },
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
        GET_ADMIN_SCOPES: { method: "GET", apiPath: "/api/v1/users/{userId}/admin-scopes", module: "USERS" },
        UPDATE_ADMIN_SCOPES: { method: "PUT", apiPath: "/api/v1/users/{userId}/admin-scopes", module: "USERS" },
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
        GET_USERS_UNASSIGNED_CAREER_PATH: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/users/unassigned-career-path",
            module: "DEPARTMENTS",
        },

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
        GET_PAGINATE: {   // 👈 THÊM DÒNG NÀY
            method: "GET",
            apiPath: "/api/v1/company-job-titles",
            module: "COMPANY_JOB_TITLES",
        },

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

        RESTORE: {   // ⚠️ tiện sửa luôn cái này
            method: "PATCH",   // hoặc PUT tùy BE
            apiPath: "/api/v1/company-job-titles/{id}/restore",
            module: "COMPANY_JOB_TITLES"
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

        GET_SUMMARY: {
            method: "GET",
            apiPath: "/api/v1/department-objectives/summary",
            module: "DEPARTMENT_OBJECTIVES",
        },

        GET_VERSIONS: {
            method: "GET",
            apiPath: "/api/v1/departments/{departmentId}/objectives/versions",
            module: "DEPARTMENT_OBJECTIVES",
        },

        PUBLISH: {
            method: "POST",
            apiPath: "/api/v1/department-objectives/publish",
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
        // ⭐ THÊM
        BULK_CREATE_TREE: {
            method: "POST",
            apiPath: "/api/v1/job-position-nodes/bulk-tree",
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
        SHARE_LOG_SENT: {
            method: "GET",
            apiPath: "/api/v1/procedures/share-log/sent",
            module: "PROCEDURES",
        },
        SHARE_LOG_RECEIVED: {
            method: "GET",
            apiPath: "/api/v1/procedures/share-log/received",
            module: "PROCEDURES",
        },
        SHARE_LOG_ALL: {
            method: "GET",
            apiPath: "/api/v1/procedures/share-log/all",
            module: "PROCEDURES",
        },
        CREATE_SHARE_TOKEN: {
            method: "POST",
            apiPath: "/api/v1/procedures/*/share-tokens",
            module: "PROCEDURES",
        },
        GET_SHARE_TOKENS: {
            method: "GET",
            apiPath: "/api/v1/procedures/*/share-tokens",
            module: "PROCEDURES",
        },
        REVOKE_SHARE_TOKEN: {
            method: "PATCH",
            apiPath: "/api/v1/procedures/share-tokens/*/revoke",
            module: "PROCEDURES",
        },
        GET_SHARE_TOKEN_ACCESS_LOGS: {
            method: "GET",
            apiPath: "/api/v1/procedures/share-tokens/*/access-logs",
            module: "PROCEDURES",
        },
        SEND_SHARE_EMAIL: {
            method: "POST",
            apiPath: "/api/v1/procedures/share-tokens/*/send-email",
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
        SHARE: {
            method: "POST",
            apiPath: "/api/v1/procedures/*/share",
            module: "PROCEDURE_CONFIDENTIAL",
        },

        ACCESS_LIST: {
            method: "GET",
            apiPath: "/api/v1/procedures/*/access-list",
            module: "PROCEDURE_CONFIDENTIAL",
        },
        REVOKE: {
            method: "DELETE",
            apiPath: "/api/v1/procedures/{id}/access/{userId}",
            module: "PROCEDURE_CONFIDENTIAL",
        },
        SHARE_LOG_SENT: {
            method: "GET",
            apiPath: "/api/v1/procedures/share-log/sent",
            module: "PROCEDURE_CONFIDENTIAL",
        },
        SHARE_LOG_RECEIVED: {
            method: "GET",
            apiPath: "/api/v1/procedures/share-log/received",
            module: "PROCEDURE_CONFIDENTIAL",
        },
        SHARE_LOG_ALL: {
            method: "GET",
            apiPath: "/api/v1/procedures/share-log/all",
            module: "PROCEDURE_CONFIDENTIAL",
        },
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
    /* ===================== DOCUMENT CATEGORIES ===================== */
    DOCUMENT_CATEGORIES: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/document-categories",
            module: "DOCUMENT_CATEGORIES",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/document-categories/{id}",
            module: "DOCUMENT_CATEGORIES",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/document-categories",
            module: "DOCUMENT_CATEGORIES",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/document-categories/{id}",
            module: "DOCUMENT_CATEGORIES",
        },
        TOGGLE_ACTIVE: {
            method: "PUT",
            apiPath: "/api/v1/document-categories/{id}/active",
            module: "DOCUMENT_CATEGORIES",
        },

    },

    /* ===================== DOCUMENTS ===================== */
    DOCUMENTS: {
        GET_PAGINATE: {
            method: "GET",
            apiPath: "/api/v1/documents",
            module: "DOCUMENTS",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/documents/{id}",
            module: "DOCUMENTS",
        },
        CREATE: {
            method: "POST",
            apiPath: "/api/v1/documents",
            module: "DOCUMENTS",
        },
        UPDATE: {
            method: "PUT",
            apiPath: "/api/v1/documents/{id}",
            module: "DOCUMENTS",
        },

        TOGGLE_ACTIVE: {
            method: "PUT",
            apiPath: "/api/v1/documents/{id}/active",
            module: "DOCUMENTS",
        },
        DELETE: {
            method: "DELETE",
            apiPath: "/api/v1/documents/{id}",
            module: "DOCUMENTS",
        },

        GET_BY_CATEGORY: {
            method: "GET",
            apiPath: "/api/v1/documents/by-category/{categoryId}",
            module: "DOCUMENTS",
        },
        GET_BY_DEPARTMENT: {
            method: "GET",
            apiPath: "/api/v1/documents/by-department/{departmentId}",
            module: "DOCUMENTS",
        },
        CREATE_SHARE_TOKEN: {
            method: "POST",
            apiPath: "/api/v1/documents/*/share-tokens",
            module: "DOCUMENTS",
        },
        GET_SHARE_TOKENS: {
            method: "GET",
            apiPath: "/api/v1/documents/*/share-tokens",
            module: "DOCUMENTS",
        },
        REVOKE_SHARE_TOKEN: {
            method: "PATCH",
            apiPath: "/api/v1/documents/share-tokens/*/revoke",
            module: "DOCUMENTS",
        },
        GET_SHARE_TOKEN_ACCESS_LOGS: {
            method: "GET",
            apiPath: "/api/v1/documents/share-tokens/*/access-logs",
            module: "DOCUMENTS",
        },
        SEND_SHARE_EMAIL: {
            method: "POST",
            apiPath: "/api/v1/documents/share-tokens/*/send-email",
            module: "DOCUMENTS",
        },
        MARK_READ: {
            method: "PUT",
            apiPath: "/api/v1/documents/{id}/read",
            module: "DOCUMENTS",
        },
    },
    /* ===================== EVALUATION ===================== */
    EVALUATION: {
        // TEMPLATES
        CREATE_TEMPLATE: { method: "POST", apiPath: "/api/v1/evaluation/templates", module: "EVALUATION_TEMPLATE" },
        UPDATE_TEMPLATE: { method: "PUT", apiPath: "/api/v1/evaluation/templates/{id}", module: "EVALUATION_TEMPLATE" },
        PUBLISH_TEMPLATE: { method: "PATCH", apiPath: "/api/v1/evaluation/templates/{id}/publish", module: "EVALUATION_TEMPLATE" },
        ARCHIVE_TEMPLATE: { method: "PATCH", apiPath: "/api/v1/evaluation/templates/{id}/archive", module: "EVALUATION_TEMPLATE" },
        DELETE_TEMPLATE: { method: "DELETE", apiPath: "/api/v1/evaluation/templates/{id}", module: "EVALUATION_TEMPLATE" },
        GET_TEMPLATE_BY_ID: { method: "GET", apiPath: "/api/v1/evaluation/templates/{id}", module: "EVALUATION_TEMPLATE" },
        GET_TEMPLATES: { method: "GET", apiPath: "/api/v1/evaluation/templates", module: "EVALUATION_TEMPLATE" },
        GET_ACTIVE_TEMPLATES: { method: "GET", apiPath: "/api/v1/evaluation/templates/active", module: "EVALUATION_TEMPLATE" },

        // SECTIONS
        CREATE_SECTION: { method: "POST", apiPath: "/api/v1/evaluation/templates/{templateId}/sections", module: "EVALUATION_TEMPLATE" },
        UPDATE_SECTION: { method: "PUT", apiPath: "/api/v1/evaluation/sections/{sectionId}", module: "EVALUATION_TEMPLATE" },
        DELETE_SECTION: { method: "DELETE", apiPath: "/api/v1/evaluation/sections/{sectionId}", module: "EVALUATION_TEMPLATE" },
        GET_SECTIONS: { method: "GET", apiPath: "/api/v1/evaluation/templates/{templateId}/sections", module: "EVALUATION_TEMPLATE" },

        // CRITERIA
        CREATE_CRITERIA: { method: "POST", apiPath: "/api/v1/evaluation/sections/{sectionId}/criteria", module: "EVALUATION_TEMPLATE" },
        UPDATE_CRITERIA: { method: "PUT", apiPath: "/api/v1/evaluation/criteria/{criteriaId}", module: "EVALUATION_TEMPLATE" },
        DELETE_CRITERIA: { method: "DELETE", apiPath: "/api/v1/evaluation/criteria/{criteriaId}", module: "EVALUATION_TEMPLATE" },

        // LEVELS
        CREATE_LEVEL: { method: "POST", apiPath: "/api/v1/evaluation/criteria/{criteriaId}/levels", module: "EVALUATION_TEMPLATE" },
        UPDATE_LEVEL: { method: "PUT", apiPath: "/api/v1/evaluation/levels/{levelId}", module: "EVALUATION_TEMPLATE" },
        GET_LEVELS: { method: "GET", apiPath: "/api/v1/evaluation/criteria/{criteriaId}/levels", module: "EVALUATION_TEMPLATE" },

        // PERIODS
        CREATE_PERIOD: { method: "POST", apiPath: "/api/v1/evaluation/periods", module: "EVALUATION_PERIOD" },
        UPDATE_PERIOD: { method: "PUT", apiPath: "/api/v1/evaluation/periods/{id}", module: "EVALUATION_PERIOD" },
        GET_PERIOD_BY_ID: { method: "GET", apiPath: "/api/v1/evaluation/periods/{id}", module: "EVALUATION_PERIOD" },
        GET_PERIOD_PROGRESS: { method: "GET", apiPath: "/api/v1/evaluation/periods/{id}/progress", module: "EVALUATION_PERIOD" },
        GET_PERIODS: { method: "GET", apiPath: "/api/v1/evaluation/periods", module: "EVALUATION_PERIOD" },
        ADD_TEMPLATE_TO_PERIOD: { method: "POST", apiPath: "/api/v1/evaluation/periods/{periodId}/templates", module: "EVALUATION_PERIOD" },
        GET_TEMPLATES_IN_PERIOD: { method: "GET", apiPath: "/api/v1/evaluation/periods/{periodId}/templates", module: "EVALUATION_PERIOD" },
        ADD_EMPLOYEE_TO_PERIOD: { method: "POST", apiPath: "/api/v1/evaluation/periods/{periodId}/employees", module: "EVALUATION_PERIOD" },
        CANCEL_PERIOD_EMPLOYEE: { method: "PATCH", apiPath: "/api/v1/evaluation/period-employees/{id}/cancel", module: "EVALUATION_PERIOD" },
        GET_EMPLOYEES_IN_PERIOD: { method: "GET", apiPath: "/api/v1/evaluation/periods/{periodId}/employees", module: "EVALUATION_PERIOD" },
        ACTIVATE_PERIOD: { method: "PATCH", apiPath: "/api/v1/evaluation/periods/{id}/activate", module: "EVALUATION_PERIOD" },
        CLOSE_PERIOD: { method: "PATCH", apiPath: "/api/v1/evaluation/periods/{id}/close", module: "EVALUATION_PERIOD" },
        GET_UNFINISHED_RECORDS: { method: "GET", apiPath: "/api/v1/evaluation/periods/{id}/unfinished-records", module: "EVALUATION_PERIOD" },

        // RECORDS & WORKFLOW
        GET_RECORD_BY_ID: { method: "GET", apiPath: "/api/v1/evaluation/records/{id}", module: "EVALUATION_MANAGER" },
        GET_MY_RECORDS: { method: "GET", apiPath: "/api/v1/evaluation/my-records", module: "EVALUATION_EMPLOYEE" },
        GET_MANAGER_RECORDS: { method: "GET", apiPath: "/api/v1/evaluation/manager/periods/{periodId}/records", module: "EVALUATION_MANAGER" },
        GET_PENDING_MANAGER_RECORDS: { method: "GET", apiPath: "/api/v1/evaluation/manager/pending", module: "EVALUATION_MANAGER" },
        GET_MANAGER_HISTORY: { method: "GET", apiPath: "/api/v1/evaluation/manager/records", module: "EVALUATION_MANAGER" },
        GET_APPROVAL_RECORDS: { method: "GET", apiPath: "/api/v1/evaluation/approval/periods/{periodId}/records", module: "EVALUATION_MANAGER" },
        GET_PENDING_APPROVAL_RECORDS: { method: "GET", apiPath: "/api/v1/evaluation/approval/pending", module: "EVALUATION_MANAGER" },
        GET_APPROVAL_HISTORY: { method: "GET", apiPath: "/api/v1/evaluation/approval/records", module: "EVALUATION_MANAGER" },

        EMPLOYEE_SCORE: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/employee-scores", module: "EVALUATION_EMPLOYEE" },
        EMPLOYEE_SUBMIT: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/employee-submit", module: "EVALUATION_EMPLOYEE" },
        EMPLOYEE_SELF_REVIEW: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/self-review", module: "EVALUATION_EMPLOYEE" },
        EMPLOYEE_CONFIRM: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/employee-confirm", module: "EVALUATION_EMPLOYEE" },

        MANAGER_SCORE: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/manager-scores", module: "EVALUATION_MANAGER" },
        MANAGER_SUBMIT: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/manager-submit", module: "EVALUATION_MANAGER" },
        APPROVER_SCORE: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/approver-scores", module: "EVALUATION_MANAGER" },
        MANAGER_FEEDBACK: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/manager-feedback", module: "EVALUATION_MANAGER" },
        SAVE_TRAINING_PLAN: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/training-plans", module: "EVALUATION_MANAGER" },

        APPROVE_RECORD: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/approve", module: "EVALUATION_MANAGER" },
        REJECT_RECORD: { method: "POST", apiPath: "/api/v1/evaluation/records/{recordId}/reject", module: "EVALUATION_MANAGER" },
        BATCH_APPROVE_RECORDS: { method: "POST", apiPath: "/api/v1/evaluation/records/batch-approve", module: "EVALUATION_MANAGER" },
        REASSIGN_EVALUATOR: { method: "PATCH", apiPath: "/api/v1/evaluation/records/reassign-evaluator", module: "EVALUATION_MANAGER" },
        EXTEND_RECORD_DEADLINE: { method: "PATCH", apiPath: "/api/v1/evaluation/records/deadline-extension", module: "EVALUATION_PERIOD" },
        GET_COMPLETED_SUMMARY: { method: "GET", apiPath: "/api/v1/evaluation/summary/completed", module: "EVALUATION_PERIOD" },

        GET_RECORD_HISTORY: { method: "GET", apiPath: "/api/v1/evaluation/records/{recordId}/history", module: "EVALUATION_MANAGER" },
        GET_SCORE_AUDITS: { method: "GET", apiPath: "/api/v1/evaluation/records/{recordId}/score-audits", module: "EVALUATION_MANAGER" },
        GET_REJECTION_COUNT: { method: "GET", apiPath: "/api/v1/evaluation/records/{recordId}/rejection-count", module: "EVALUATION_MANAGER" },
        GET_STATUS_DISTRIBUTION: { method: "GET", apiPath: "/api/v1/evaluation/periods/{periodId}/status-distribution", module: "EVALUATION_PERIOD" },
        GET_GRADE_DISTRIBUTION: { method: "GET", apiPath: "/api/v1/evaluation/periods/{periodId}/grade-distribution", module: "EVALUATION_PERIOD" },

    },
    DOCUMENT_FOLDERS: {
        GET_PAGINATE: { method: "GET", apiPath: "/api/v1/folders", module: "DOCUMENT_FOLDERS" },
        CREATE: { method: "POST", apiPath: "/api/v1/folders", module: "DOCUMENT_FOLDERS" },
        GET_BY_ID: { method: "GET", apiPath: "/api/v1/folders/{id}", module: "DOCUMENT_FOLDERS" },
        UPDATE: { method: "PUT", apiPath: "/api/v1/folders/{id}", module: "DOCUMENT_FOLDERS" },
        DELETE: { method: "DELETE", apiPath: "/api/v1/folders/{id}", module: "DOCUMENT_FOLDERS" },
        GET_TREE: { method: "GET", apiPath: "/api/v1/folders/tree", module: "DOCUMENT_FOLDERS" },
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
    DOCUMENT_CATEGORIES: "DOCUMENT_CATEGORIES",
    DOCUMENTS: "DOCUMENTS",
    ACCOUNTING_DOSSIERS: "ACCOUNTING_DOSSIERS",
    EVALUATION: "EVALUATION",
    DOCUMENT_FOLDERS: "DOCUMENT_FOLDERS",
};
