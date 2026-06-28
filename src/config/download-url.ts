export const getFileNameFromUrl = (url: string, fallback = "document.pdf") => {
    const cleanUrl = url.split("#")[0].split("?")[0];
    const rawName = cleanUrl.split("/").pop();
    if (!rawName) return fallback;
    try {
        return decodeURIComponent(rawName);
    } catch {
        return rawName || fallback;
    }
};

export const downloadUrlAsBlob = async (url: string, fileName = getFileNameFromUrl(url)) => {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
};
