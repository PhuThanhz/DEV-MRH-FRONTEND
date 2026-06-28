import toast from "react-hot-toast";
import { BellFilled, CloseOutlined } from "@ant-design/icons";

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

    pushNotification: (title: string, msg: string) =>
        toast.custom(
            (t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'} relative w-[360px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.12)] rounded-[16px] pointer-events-auto overflow-hidden ring-1 ring-gray-100 p-4 transition-all`}
                >
                    <div className="relative flex items-start gap-4">
                        {/* Premium Icon Box */}
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="h-10 w-10 rounded-[12px] bg-[#eb2f7a] flex items-center justify-center shadow-[0_4px_12px_rgba(235,47,122,0.3)]">
                                <BellFilled style={{ color: "white", fontSize: "18px" }} />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-[15px] font-bold text-gray-900 m-0 leading-tight">
                                    {title}
                                </p>
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="flex-shrink-0 ml-4 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-6 h-6 transition-colors cursor-pointer border-none bg-transparent outline-none"
                                >
                                    <CloseOutlined className="text-[11px]" />
                                </button>
                            </div>
                            <p className="mt-1.5 text-[13.5px] text-gray-600 m-0 leading-relaxed font-medium">
                                {msg}
                            </p>

                            {/* Footer / Metadata */}
                            <div className="mt-3 flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wider uppercase bg-pink-50 text-pink-600 border border-pink-100">
                                    MỚI NHẤT
                                </span>
                                <span className="text-[11px] text-gray-400 font-medium">Vừa xong</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            { duration: 6000, position: "top-right" }
        ),
};
