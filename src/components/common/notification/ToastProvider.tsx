import { Toaster } from "react-hot-toast";

export const ToastProvider = () => {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    fontFamily: "Inter, sans-serif",
                    borderRadius: "10px",
                    fontWeight: 500,
                    padding: "10px 16px",
                },
                success: {
                    style: {
                        background: "#10b981",
                        color: "#fff",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                    },
                    iconTheme: { primary: "#fff", secondary: "#10b981" },
                },
                error: {
                    style: {
                        background: "#ef4444",
                        color: "#fff",
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
                    },
                    iconTheme: { primary: "#fff", secondary: "#ef4444" },
                },
                loading: {
                    style: {
                        background: "#f59e0b",
                        color: "#fff",
                        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
                    },
                },
            }}
            containerStyle={{
                top: 16,
                right: 16,
            }}
            reverseOrder={false}
        />
    );
};
