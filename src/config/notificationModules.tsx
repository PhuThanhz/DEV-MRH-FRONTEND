import React from "react";
import {
    AuditOutlined,
    BellOutlined,
    FileDoneOutlined,
    FileSearchOutlined,
    FolderOpenOutlined,
    ReadOutlined,
    RiseOutlined,
} from "@ant-design/icons";
import type { UnifiedNotification } from "@/hooks/useNotifications";
import { ALL_PERMISSIONS } from "./permissions";

export const DOCUMENT_NOTIFICATION_MODULES = ["DOCUMENT", "DOCUMENTS", "ACCOUNTING_DOCUMENTS"];
export const ACCOUNTING_DOSSIER_NOTIFICATION_MODULES = ["ACCOUNTING_DOSSIERS"];
export const PROCEDURE_NOTIFICATION_MODULES = ["COMPANY_PROCEDURES", "DEPARTMENT_PROCEDURES", "CONFIDENTIAL_PROCEDURES"];
export const KNOWN_NOTIFICATION_MODULES = [
    "JD_FLOW",
    "EVALUATION",
    "CAREER_PATHS",
    ...ACCOUNTING_DOSSIER_NOTIFICATION_MODULES,
    ...PROCEDURE_NOTIFICATION_MODULES,
    ...DOCUMENT_NOTIFICATION_MODULES,
];

export interface NotificationModuleConfig {
    id: string;
    label: string;
    icon: React.ReactNode;
    link: string;
    requiredPermissions: any[];
    moduleKey: string;
    filterUnread: (items: UnifiedNotification[]) => number;
}

// Cấu hình các nhóm nghiệp vụ hiển thị trong khu vực thông báo.
export const PENDING_ACTION_MODULES: NotificationModuleConfig[] = [
    {
        id: "jd_approval",
        label: "Duyệt mô tả công việc",
        icon: <FileSearchOutlined className="text-[20px]" />,
        link: "/admin/job-descriptions?tab=inbox",
        requiredPermissions: [ALL_PERMISSIONS.JD_FLOW.FETCH_INBOX],
        moduleKey: "JD_FLOW",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "JD_FLOW").length
    },
    {
        id: "evaluation",
        label: "Đánh giá năng lực",
        icon: <AuditOutlined className="text-[20px]" />,
        link: "/admin/evaluation/process",
        requiredPermissions: [
            ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS,
            ALL_PERMISSIONS.EVALUATION.GET_PENDING_MANAGER_RECORDS,
            ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS,
        ],
        moduleKey: "EVALUATION",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "EVALUATION").length
    },
    {
        id: "accounting_dossiers",
        label: "Duyệt chứng từ",
        icon: <FileDoneOutlined className="text-[20px]" />,
        link: "/admin/accounting-dossiers?viewMode=PENDING_ME",
        requiredPermissions: [ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_PAGINATE],
        moduleKey: "ACCOUNTING_DOSSIERS",
        filterUnread: (items) => items.filter(i => !i.isRead && ACCOUNTING_DOSSIER_NOTIFICATION_MODULES.includes(i.module || "")).length
    },
    {
        id: "procedures",
        label: "Quy trình nội bộ",
        icon: <ReadOutlined className="text-[20px]" />,
        link: "/admin/procedures",
        requiredPermissions: [
            ALL_PERMISSIONS.PROCEDURE_COMPANY.GET_PAGINATE,
            ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.GET_PAGINATE,
            ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.GET_PAGINATE,
        ],
        moduleKey: "COMPANY_PROCEDURES",
        filterUnread: (items) => items.filter(i => !i.isRead && PROCEDURE_NOTIFICATION_MODULES.includes(i.module || "")).length
    },
    {
        id: "career_paths",
        label: "Lộ trình thăng tiến",
        icon: <RiseOutlined className="text-[20px]" />,
        link: "/admin/career-paths",
        requiredPermissions: [ALL_PERMISSIONS.CAREER_PATHS.GET_ALL_ACTIVE],
        moduleKey: "CAREER_PATHS",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "CAREER_PATHS").length
    },
    {
        id: "documents",
        label: "Văn bản, chứng từ",
        icon: <FolderOpenOutlined className="text-[20px]" />,
        link: "/admin/documents",
        requiredPermissions: [
            ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE,
            ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_PAGINATE,
        ],
        moduleKey: "DOCUMENTS",
        filterUnread: (items) => items.filter(i => !i.isRead && DOCUMENT_NOTIFICATION_MODULES.includes(i.module || "")).length
    },
    {
        id: "system_alerts",
        label: "Thông báo hệ thống",
        icon: <BellOutlined className="text-[20px]" />,
        link: "#",
        requiredPermissions: [],
        moduleKey: "SYSTEM_ALERTS",
        filterUnread: (items) => items.filter(i => !i.isRead && !KNOWN_NOTIFICATION_MODULES.includes(i.module || "")).length
    }
];
