import { Modal, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Text } = Typography;

// ── Project Brand Color Config ────────────────────────────────────────────
const BRAND_COLOR = "#e8637a";
const BRAND_HOVER = "#d94c66";
const BRAND_SHADOW = "0 4px 12px rgba(232, 99, 122, 0.2)";

const T = {
    ink: "#0f172a",
    ink2: "#1e293b",
    ink3: "#475569",
    ink4: "#94a3b8",
    line: "#e2e8f0",
    white: "#ffffff",
    s1: "#f8fafc",

    // accent (blue)
    acc: "#2563eb",
    accSoft: "#eff6ff",
    accBord: "rgba(37, 99, 235, 0.12)",

    // danger (red)
    red: "#ef4444",
    redSoft: "#fef2f2",
    redBord: "rgba(239, 68, 68, 0.12)",

    // warning (amber)
    amber: "#d97706",
    amberSoft: "#fffbeb",
    amberBord: "rgba(217, 119, 6, 0.12)",

    // success (green)
    green: "#16a34a",
    greenSoft: "#f0fdf4",
    greenBord: "rgba(22, 163, 74, 0.12)",
} as const;

// ── Variant config ─────────────────────────────────────────────────────────
type Variant = "danger" | "warning" | "info" | "success";

const VARIANT_MAP: Record<
    Variant,
    {
        icon: React.ReactNode;
        color: string;
        soft: string;
        border: string;
        okBg: string;
        okHover: string;
        okShadow: string;
        defaultTitle: string;
        defaultDesc: string;
    }
> = {
    danger: {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
        ),
        color: T.red,
        soft: T.redSoft,
        border: T.redBord,
        okBg: T.red,
        okHover: "#dc2626",
        okShadow: "0 4px 12px rgba(239, 68, 68, 0.16)",
        defaultTitle: "Xác nhận xóa",
        defaultDesc: "Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.",
    },
    warning: {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        color: T.amber,
        soft: T.amberSoft,
        border: T.amberBord,
        okBg: T.amber,
        okHover: "#b45309",
        okShadow: "0 4px 12px rgba(217, 119, 6, 0.16)",
        defaultTitle: "Cảnh báo",
        defaultDesc: "Bạn có chắc chắn muốn thực hiện thao tác này không?",
    },
    info: {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        ),
        color: T.acc,
        soft: T.accSoft,
        border: T.accBord,
        okBg: BRAND_COLOR,
        okHover: BRAND_HOVER,
        okShadow: BRAND_SHADOW,
        defaultTitle: "Xác nhận",
        defaultDesc: "Bạn có chắc chắn muốn tiếp tục không?",
    },
    success: {
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        ),
        color: T.green,
        soft: T.greenSoft,
        border: T.greenBord,
        okBg: BRAND_COLOR,
        okHover: BRAND_HOVER,
        okShadow: BRAND_SHADOW,
        defaultTitle: "Xác nhận hoàn thành",
        defaultDesc: "Bạn có chắc chắn muốn xác nhận không?",
    },
};

// ── Props ──────────────────────────────────────────────────────────────────
interface ConfirmModalProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;

    variant?: Variant;

    /** Tên / thông tin nổi bật của item đang thao tác */
    targetName?: string;

    /** Ghi đè title */
    title?: string;
    /** Ghi đè description */
    description?: string;

    /** Label nút xác nhận */
    okText?: string;
    /** Label nút hủy */
    cancelText?: string;

    loading?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────
const ConfirmModal = ({
    open,
    onConfirm,
    onCancel,
    variant = "info",
    targetName,
    title,
    description,
    okText = "Xác nhận",
    cancelText = "Hủy",
    loading = false,
}: ConfirmModalProps) => {
    const v = VARIANT_MAP[variant];

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            onOk={onConfirm}
            confirmLoading={loading}
            maskClosable={false}
            width="360px"
            centered
            footer={null}
            closeIcon={<CloseOutlined style={{ fontSize: 12, color: T.ink4 }} />}
            styles={{
                mask: {
                    backdropFilter: "blur(8px)",
                    backgroundColor: "rgba(15, 23, 42, 0.25)"
                },
                content: {
                    borderRadius: 20,
                    padding: 0,
                    overflow: "hidden",
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.01)"
                },
            }}
        >
            {/* ── Content Body (Centered Layout) ── */}
            <div style={{
                padding: "36px 30px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
            }}>
                {/* Modern Squircle Icon Container */}
                <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 14,
                    background: v.soft,
                    border: `1px solid ${v.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: v.color,
                    marginBottom: 18,
                }}>
                    {v.icon}
                </div>

                {/* Title */}
                <Text style={{
                    display: "block",
                    fontSize: 18,
                    fontWeight: 800,
                    color: T.ink,
                    marginBottom: 8,
                    lineHeight: 1.4,
                    letterSpacing: "-0.025em",
                }}>
                    {title ?? v.defaultTitle}
                </Text>

                {/* Description */}
                <Text style={{
                    display: "block",
                    fontSize: 14,
                    color: T.ink3,
                    lineHeight: 1.6,
                    fontWeight: 500,
                }}>
                    {description ?? v.defaultDesc}
                </Text>

                {/* Target name highlight box */}
                {targetName && (
                    <div style={{
                        marginTop: 14,
                        padding: "8px 12px",
                        background: T.s1,
                        border: `1px solid ${T.line}`,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        width: "100%",
                        boxSizing: "border-box"
                    }}>
                        <div style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: T.ink4,
                            flexShrink: 0,
                        }} />
                        <Text style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: T.ink2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}>
                            {targetName}
                        </Text>
                    </div>
                )}
            </div>

            {/* ── Action Buttons Footer (Side-by-Side Horizontal Layout) ── */}
            <div style={{
                padding: "0 30px 32px",
                display: "flex",
                justifyContent: "center",
                gap: 12,
                width: "100%",
                boxSizing: "border-box"
            }}>
                {/* Hủy Button (Left) */}
                <button
                    onClick={onCancel}
                    disabled={loading}
                    className="confirm-modal-btn is-cancel"
                    style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 10,
                        border: "none",
                        background: "#f1f5f9",
                        color: "#475569",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    {cancelText}
                </button>

                {/* Xác nhận Button (Right) */}
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="confirm-modal-btn is-ok"
                    style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 10,
                        border: "none",
                        background: v.okBg,
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.9 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        whiteSpace: "nowrap",
                        boxShadow: v.okShadow
                    }}
                >
                    {loading && (
                        <svg
                            style={{ animation: "spin 1s linear infinite" }}
                            width="14" height="14" viewBox="0 0 24 24" fill="none"
                        >
                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.35)" strokeWidth="3" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    )}
                    {okText}
                </button>
            </div>

            {/* Micro-Interactions & Styling */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .confirm-modal-btn {
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .confirm-modal-btn:active {
                    transform: scale(0.96) !important;
                }
                .confirm-modal-btn.is-cancel:hover:not(:disabled) {
                    background: #e2e8f0 !important;
                    color: #1e293b !important;
                }
                .confirm-modal-btn.is-ok:hover:not(:disabled) {
                    background: ${v.okHover} !important;
                    transform: translateY(-1px);
                }
            `}</style>
        </Modal>
    );
};

export default ConfirmModal;