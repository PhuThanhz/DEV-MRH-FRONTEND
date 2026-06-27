import React from "react";
import {
    FileDoneOutlined,
    StarOutlined,
    CheckSquareOutlined,
    SwapOutlined,
    FolderOpenOutlined,
    NotificationOutlined
} from "@ant-design/icons";
import type { UnifiedNotification } from "@/hooks/useNotifications";

import { ALL_PERMISSIONS } from "./permissions";

export interface NotificationModuleConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: "pink" | "rose";
    link: string;
    requiredPermission: any; // Added for role permission check
    moduleKey: string;
    filterUnread: (items: UnifiedNotification[]) => number;
}

// Cấu hình các module hiển thị trên Notification Grid. 
// Sau này có thêm module nào mới, bạn chỉ cần thêm 1 object vào mảng này là xong.
export const PENDING_ACTION_MODULES: NotificationModuleConfig[] = [
    {
        id: "jd_approval",
        label: "Duyệt MTCV",
        icon: <FileDoneOutlined />,
        color: "pink",
        link: "/admin/job-descriptions?tab=inbox",
        requiredPermission: ALL_PERMISSIONS.JD_FLOW.FETCH_INBOX,
        moduleKey: "JD_FLOW",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "JD_FLOW").length
    },
    {
        id: "evaluation",
        label: "Đánh giá năng lực",
        icon: <StarOutlined />,
        color: "rose",
        link: "/admin/evaluation/process",
        requiredPermission: ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS,
        moduleKey: "EVALUATION",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "EVALUATION").length
    },
    {
        id: "procedures",
        label: "Quy trình nội bộ",
        icon: <CheckSquareOutlined />,
        color: "pink",
        link: "/admin/procedures",
        requiredPermission: ALL_PERMISSIONS.PROCEDURE_COMPANY.GET_PAGINATE,
        moduleKey: "COMPANY_PROCEDURES",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "COMPANY_PROCEDURES").length
    },
    {
        id: "career_paths",
        label: "Duyệt Thăng tiến",
        icon: <SwapOutlined />,
        color: "rose",
        link: "/admin/career-paths",
        requiredPermission: ALL_PERMISSIONS.CAREER_PATHS.GET_ALL_ACTIVE,
        moduleKey: "CAREER_PATHS",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "CAREER_PATHS").length
    },
    {
        id: "documents",
        label: "Văn bản & Chứng từ",
        icon: <FolderOpenOutlined />,
        color: "pink",
        link: "/admin/documents",
        requiredPermission: ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE,
        moduleKey: "DOCUMENTS",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "DOCUMENTS").length
    },
    {
        id: "system_alerts",
        label: "Thông báo khác",
        icon: <NotificationOutlined />,
        color: "rose",
        link: "#", 
        requiredPermission: null, 
        moduleKey: "SYSTEM_ALERTS",
        // Lấy các thông báo hệ thống còn lại chưa đọc
        filterUnread: (items) => items.filter(i => !i.isRead && !["JD_FLOW", "EVALUATION", "COMPANY_PROCEDURES", "CAREER_PATHS", "DOCUMENTS"].includes(i.module || "")).length
    }
];
