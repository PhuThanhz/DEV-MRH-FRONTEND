import axiosInstance from "@/config/axios-customize";

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