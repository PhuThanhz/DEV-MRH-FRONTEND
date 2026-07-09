import type { IDepartmentCompleteness } from "@/types/backend";

export interface DepartmentProfileCriterionConfig {
    label: string;
    pathTemplate: string;
    priority: number;
}

export const CRITERIA_MAP: Record<keyof IDepartmentCompleteness, DepartmentProfileCriterionConfig> = {
    orgChart: {
        label: "Sơ đồ tổ chức",
        pathTemplate: "/admin/departments/:departmentId/org-chart",
        priority: 1,
    },
    jobTitleMap: {
        label: "Bản đồ chức danh",
        pathTemplate: "/admin/departments/:departmentId/position-chart",
        priority: 2,
    },
    objectives: {
        label: "Mục tiêu - Nhiệm vụ",
        pathTemplate: "/admin/departments/:departmentId/objectives-tasks",
        priority: 3,
    },
    departmentProcedure: {
        label: "Quy trình phòng ban",
        pathTemplate: "/admin/departments/:departmentId/procedures",
        priority: 4,
    },
    permissions: {
        label: "Phân quyền",
        pathTemplate: "/admin/departments/:departmentId/permissions",
        priority: 5,
    },
    careerPath: {
        label: "Lộ trình thăng tiến",
        pathTemplate: "/admin/departments/:departmentId/career-paths",
        priority: 6,
    },
    salaryGrade: {
        label: "Khung lương",
        pathTemplate: "/admin/departments/:departmentId/salary-range",
        priority: 7,
    },
} as any;

export const PRIORITIZED_KEYS: (keyof IDepartmentCompleteness)[] = [
    "orgChart",
    "jobTitleMap",
    "objectives",
    "departmentProcedure",
    "permissions",
    "careerPath",
    "salaryGrade",
];

export interface ScoreStyle {
    color: string;
    bg: string;
    border: string;
    barColor: string;
    label: string;
    priorityLabel: string;
}

export const getScoreStyle = (score: number): ScoreStyle => {
    if (score === 7) {
        return {
            color: "#389e0d",
            bg: "#f6ffed",
            border: "#b7eb8f",
            barColor: "#52c41a",
            label: "Hoàn chỉnh",
            priorityLabel: "Đủ hồ sơ"
        };
    } else if (score >= 4) {
        return {
            color: "#d48806",
            bg: "#fffbe6",
            border: "#ffe58f",
            barColor: "#1677ff",
            label: "Khá hoàn thiện",
            priorityLabel: "Bổ sung thêm"
        };
    } else if (score > 0) {
        return {
            color: "#d46b08",
            bg: "#fff7e6",
            border: "#ffd591",
            barColor: "#faad14",
            label: "Cần bổ sung",
            priorityLabel: "Cần bổ sung"
        };
    } else {
        return {
            color: "#cf1322",
            bg: "#fff1f0",
            border: "#ffccc7",
            barColor: "#ff4d4f",
            label: "Chưa thiết lập",
            priorityLabel: "Khẩn"
        };
    }
};

export const BADGE_BASE_STYLE = {
    fontWeight: 700,
    borderRadius: 20,
    padding: "0 10px",
    fontSize: 12,
    margin: 0,
    lineHeight: "22px",
    whiteSpace: "nowrap" as const,
};

export const PIE_COLORS = {
    "Hoàn chỉnh (7/7)": "#52c41a",
    "Đang bổ sung": "#faad14",
    "Chưa có hồ sơ": "#ff4d4f",
};
