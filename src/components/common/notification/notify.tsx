import toast from "react-hot-toast";

export const notify = {
    success: (msg: string) =>
        toast.success(msg, {
            duration: 3000,
            style: {
                background: "#10b981",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "10px",
                padding: "10px 16px",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
            },
            iconTheme: { primary: "#fff", secondary: "#10b981" },
        }),

    error: (msg: string) =>
        toast.error(msg, {
            duration: 4000,
            style: {
                background: "#ef4444",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "10px",
                padding: "10px 16px",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
            },
            iconTheme: { primary: "#fff", secondary: "#ef4444" },
        }),

    info: (msg: string) =>
        toast(msg, {
            duration: 3500,
            style: {
                background: "#3b82f6",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "10px",
                padding: "10px 16px",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
            },
        }),

    created: (msg: string) =>
        toast.success(msg, {
            duration: 3000,
            style: {
                background: "#16a34a",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "10px",
                padding: "10px 16px",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.4)",
            },
            iconTheme: { primary: "#fff", secondary: "#16a34a" },
        }),

    updated: (msg: string) =>
        toast.success(msg, {
            duration: 3000,
            style: {
                background: "#0ea5e9",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "10px",
                padding: "10px 16px",
                boxShadow: "0 4px 12px rgba(14, 165, 233, 0.4)",
            },
            iconTheme: { primary: "#fff", secondary: "#0ea5e9" },
        }),

    deleted: (msg: string) =>
        toast.error(msg, {
            duration: 3000,
            style: {
                background: "#dc2626",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "10px",
                padding: "10px 16px",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
            },
            iconTheme: { primary: "#fff", secondary: "#dc2626" },
        }),
    warning: (msg: string) =>
        toast(msg, {
            duration: 3500,
            style: {
                background: "#f59e0b",
                color: "#fff",
                fontWeight: 500,
                borderRadius: "10px",
                padding: "10px 16px",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
            },
            iconTheme: { primary: "#fff", secondary: "#f59e0b" },
        }),
};
