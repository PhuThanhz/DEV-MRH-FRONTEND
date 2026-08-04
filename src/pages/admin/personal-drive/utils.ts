import React from "react";
import {
    FilePdfOutlined,
    FileExcelOutlined,
    FileImageOutlined,
    FileZipOutlined,
    FileTextOutlined,
    FileOutlined,
} from "@ant-design/icons";
import type { IDocumentFolder, IDocument } from "@/types/backend";

export const buildDocumentFileUrl = (fileUrl: string, isPublic = true): string => {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    const clean = fileUrl.replace(/^\/+/, "").replace(/^(?:uploads|storage)\//, "");
    const folder = clean.includes("/") ? clean.split("/").slice(0, -1).join("/") : "documents";
    const name = clean.includes("/") ? clean.split("/").pop()! : clean;
    const path = isPublic ? "/api/v1/files/public" : "/api/v1/files";
    return `${import.meta.env.VITE_BACKEND_URL}${path}?fileName=${encodeURIComponent(name)}&folder=${encodeURIComponent(folder)}`;
};

export const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return React.createElement(FilePdfOutlined, { style: { color: '#ff4d4f', fontSize: 16 } });
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return React.createElement(FileExcelOutlined, { style: { color: '#52c41a', fontSize: 16 } });
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return React.createElement(FileImageOutlined, { style: { color: '#1890ff', fontSize: 16 } });
    if (['zip', 'rar', '7z'].includes(ext || '')) return React.createElement(FileZipOutlined, { style: { color: '#fa8c16', fontSize: 16 } });
    if (['doc', 'docx'].includes(ext || '')) return React.createElement(FileTextOutlined, { style: { color: '#2b579a', fontSize: 16 } });
    return React.createElement(FileOutlined, { style: { color: '#8c8c8c', fontSize: 16 } });
};

export const findFolderPath = (
    folders: IDocumentFolder[],
    targetId: number,
    currentPath: { id: number; folderName: string }[] = []
): { id: number; folderName: string }[] | null => {
    for (const f of folders) {
        const node = { id: f.id!, folderName: f.folderName };
        if (f.id === targetId) {
            return [...currentPath, node];
        }
        if (f.children && f.children.length > 0) {
            const p = findFolderPath(f.children, targetId, [...currentPath, node]);
            if (p) return p;
        }
    }
    return null;
};

export const getRecentDocs = (userId?: string): IDocument[] => {
    try {
        const raw = localStorage.getItem(`recent_docs_${userId || "guest"}`);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const addRecentDoc = (doc: IDocument, userId?: string) => {
    if (!doc || !doc.id) return;
    try {
        const current = getRecentDocs(userId);
        const filtered = current.filter((d) => d.id !== doc.id);
        const updated = [doc, ...filtered].slice(0, 6);
        localStorage.setItem(`recent_docs_${userId || "guest"}`, JSON.stringify(updated));
    } catch {
        // ignore storage errors
    }
};

