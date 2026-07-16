import React from "react";
import type { UnifiedNotification } from "@/hooks/useNotifications";
import { ALL_PERMISSIONS } from "./permissions";

export const DOCUMENT_NOTIFICATION_MODULES = ["DOCUMENT", "DOCUMENTS", "ACCOUNTING_DOCUMENTS"];
export const ACCOUNTING_DOSSIER_NOTIFICATION_MODULES = ["ACCOUNTING_DOSSIERS"];
export const PROCEDURE_NOTIFICATION_MODULES = ["COMPANY_PROCEDURES", "CONFIDENTIAL_PROCEDURES"];
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
    color: "blue" | "emerald" | "amber" | "violet" | "cyan" | "slate";
    link: string;
    requiredPermission: any;
    moduleKey: string;
    filterUnread: (items: UnifiedNotification[]) => number;
}

// Cấu hình các module hiển thị trên Notification Grid với các icon SVG cao cấp.
export const PENDING_ACTION_MODULES: NotificationModuleConfig[] = [
    {
        id: "jd_approval",
        label: "Duyệt mô tả CV",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <circle cx="10" cy="13" r="2.5" />
                <line x1="12" y1="15" x2="16" y2="19" />
            </svg>
        ),
        color: "blue",
        link: "/admin/job-descriptions?tab=inbox",
        requiredPermission: ALL_PERMISSIONS.JD_FLOW.FETCH_INBOX,
        moduleKey: "JD_FLOW",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "JD_FLOW").length
    },
    {
        id: "evaluation",
        label: "Đánh giá năng lực",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 11 2 2 4-4" />
            </svg>
        ),
        color: "emerald",
        link: "/admin/evaluation/process",
        requiredPermission: ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS,
        moduleKey: "EVALUATION",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "EVALUATION").length
    },
    {
        id: "accounting_dossiers",
        label: "Duyệt chứng từ",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l2 2 4-4" />
                <path d="M20 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8l6 6" />
                <path d="M14 4v6h6" />
            </svg>
        ),
        color: "amber",
        link: "/admin/accounting-dossiers?viewMode=PENDING_ME",
        requiredPermission: ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_PAGINATE,
        moduleKey: "ACCOUNTING_DOSSIERS",
        filterUnread: (items) => items.filter(i => !i.isRead && ACCOUNTING_DOSSIER_NOTIFICATION_MODULES.includes(i.module || "")).length
    },
    {
        id: "procedures",
        label: "Quy trình nội bộ",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
        color: "amber",
        link: "/admin/procedures",
        requiredPermission: ALL_PERMISSIONS.PROCEDURE_COMPANY.GET_PAGINATE,
        moduleKey: "COMPANY_PROCEDURES",
        filterUnread: (items) => items.filter(i => !i.isRead && PROCEDURE_NOTIFICATION_MODULES.includes(i.module || "")).length
    },
    {
        id: "career_paths",
        label: "Lộ trình thăng tiến",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
            </svg>
        ),
        color: "violet",
        link: "/admin/career-paths",
        requiredPermission: ALL_PERMISSIONS.CAREER_PATHS.GET_ALL_ACTIVE,
        moduleKey: "CAREER_PATHS",
        filterUnread: (items) => items.filter(i => !i.isRead && i.module === "CAREER_PATHS").length
    },
    {
        id: "documents",
        label: "Văn bản, chứng từ",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
        ),
        color: "cyan",
        link: "/admin/documents",
        requiredPermission: ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE,
        moduleKey: "DOCUMENTS",
        filterUnread: (items) => items.filter(i => !i.isRead && DOCUMENT_NOTIFICATION_MODULES.includes(i.module || "")).length
    },
    {
        id: "system_alerts",
        label: "Thông báo hệ thống",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
        ),
        color: "slate",
        link: "#",
        requiredPermission: null,
        moduleKey: "SYSTEM_ALERTS",
        filterUnread: (items) => items.filter(i => !i.isRead && !KNOWN_NOTIFICATION_MODULES.includes(i.module || "")).length
    }
];
