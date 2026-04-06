// src/hooks/useDeptNavPages.ts

import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";

export const useDeptNavPages = () => {
    // Sơ đồ tổ chức
    const canViewOrgChart = useAccess(ALL_PERMISSIONS.ORG_CHARTS.GET_PAGINATE);

    // Mục tiêu - Nhiệm vụ
    const canViewObjectives = useAccess(ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.VIEW);

    // Quy trình phòng ban
    const canViewProcedures = useAccess(ALL_PERMISSIONS.PROCEDURES.GET_BY_DEPARTMENT);

    // Phân quyền
    const canViewPermissions = useAccess(ALL_PERMISSIONS.PERMISSION_CONTENT.GET_PAGINATE);

    // Lộ trình thăng tiến
    const canViewCareerPathDept = useAccess(ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.GET_BY_DEPARTMENT);
    const canViewCareerPathOwn = useAccess(ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.GET_BY_USER);
    const canViewCareerPath = canViewCareerPathDept || canViewCareerPathOwn;
    const canViewSalaryMy = useAccess(ALL_PERMISSIONS.SALARY_RANGE.VIEW_MY); // ← thêm

    // Khung lương
    const canViewSalary = useAccess(ALL_PERMISSIONS.SALARY_RANGE.VIEW);

    // Bản đồ chức danh
    const canViewPositionChart = useAccess(ALL_PERMISSIONS.POSITION_CHART.VIEW);

    return [
        {
            label: "Sơ đồ tổ chức",
            pathTemplate: "/admin/departments/:departmentId/org-chart",
            visible: canViewOrgChart,
        },
        {
            label: "Mục tiêu - Nhiệm vụ",
            pathTemplate: "/admin/departments/:departmentId/objectives-tasks",
            visible: canViewObjectives,
        },
        {
            label: "Quy trình phòng ban",
            pathTemplate: "/admin/departments/:departmentId/procedures",
            visible: canViewProcedures,
        },
        {
            label: "Phân quyền",
            pathTemplate: "/admin/departments/:departmentId/permissions",
            visible: canViewPermissions,
        },
        {
            label: "Lộ trình thăng tiến",
            pathTemplate: "/admin/departments/:departmentId/career-paths",
            visible: canViewCareerPath,
        },
        // Trong useDeptNavPages.ts, sửa tạm mục Khung lương:
        {
            label: "Khung lương",
            pathTemplate: "/admin/departments/:departmentId/salary-range",
            visible: canViewSalary || canViewSalaryMy, // ← sửa
        },
        {
            label: "Bản đồ chức danh",
            pathTemplate: "/admin/departments/:departmentId/position-chart", // ← đổi
            visible: canViewPositionChart,
        },
    ];
};