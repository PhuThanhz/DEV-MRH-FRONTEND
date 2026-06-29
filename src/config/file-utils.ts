import axiosInstance from "@/config/axios-customize";

const BACKEND = import.meta.env.VITE_BACKEND_URL as string;

/**
 * Build a public file URL (no auth required).
 * Only works for whitelisted folders: avatar, procedures.
 */
export const buildPublicFileUrl = (fileName: string, folder: string): string => {
    return `${BACKEND}/api/v1/files/public?fileName=${encodeURIComponent(fileName)}&folder=${encodeURIComponent(folder)}`;
};

/**
 * Build an auth-gated file URL for PDF viewer (pass as httpHeaders to @react-pdf-viewer).
 */
export const buildAuthFileUrl = (fileName: string, folder: string): string => {
    return `${BACKEND}/api/v1/files/view?fileName=${encodeURIComponent(fileName)}&folder=${encodeURIComponent(folder)}`;
};

export const downloadFile = async (fileUrl: string, fileName: string) => {
    const response = await axiosInstance.get(fileUrl, { responseType: "blob" }) as any;
    const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] ?? "application/octet-stream",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
};