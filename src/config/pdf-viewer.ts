import type { PdfJs } from "@react-pdf-viewer/core";
import { PDF_WORKER_URL } from "@/config/pdf-worker";

export interface PdfViewerSource {
    fileUrl: string;
    httpHeaders?: Record<string, string>;
}

type OptimizedGetDocumentParams = PdfJs.GetDocumentParams & {
    disableRange: boolean;
    disableStream: boolean;
    rangeChunkSize: number;
};

// Larger chunks reduce sequential HTTP round-trips when the file server is remote.
const PDF_RANGE_CHUNK_SIZE = 1024 * 1024;
let workerPreloadPromise: Promise<void> | null = null;

export const optimizePdfDocumentParams = (
    params: PdfJs.GetDocumentParams
): OptimizedGetDocumentParams => ({
    ...params,
    disableRange: false,
    disableStream: false,
    rangeChunkSize: PDF_RANGE_CHUNK_SIZE,
});

export const resolvePdfViewerSource = (url: string): PdfViewerSource => {
    const token = localStorage.getItem("access_token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

    if (url.includes("/api/v1/files/public")) {
        return { fileUrl: url };
    }

    if (url.includes("/api/v1/files/view")) {
        return { fileUrl: url, httpHeaders: authHeaders };
    }

    const match = url.match(/\/(?:uploads|storage)\/(.+)$/);
    if (match) {
        const parts = match[1].split("/");
        const fileName = parts.pop()!;
        const folder = parts.join("/");
        const viewUrl = `${import.meta.env.VITE_BACKEND_URL}/api/v1/files/view?fileName=${encodeURIComponent(fileName)}&folder=${encodeURIComponent(folder)}`;
        return { fileUrl: viewUrl, httpHeaders: authHeaders };
    }

    return { fileUrl: url };
};

export const preloadPdfWorker = (): Promise<void> => {
    if (!workerPreloadPromise) {
        workerPreloadPromise = fetch(PDF_WORKER_URL, {
            cache: "force-cache",
            credentials: "same-origin",
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Unable to preload PDF worker (${response.status})`);
                }
                await response.arrayBuffer();
            })
            .catch((error) => {
                workerPreloadPromise = null;
                throw error;
            });
    }

    return workerPreloadPromise;
};
