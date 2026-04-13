import { Modal, Typography } from "antd";
import {
    ExclamationCircleFilled,
    DeleteFilled,
    CheckCircleFilled,
    InfoCircleFilled,
} from "@ant-design/icons";

const { Text } = Typography;

// ── Theme tokens (dùng chung với project) ──────────────────────────────────
const T = {
    ink: "#0f172a",
    ink2: "#1e293b",
    ink3: "#64748b",
    ink4: "#94a3b8",
    line: "#e2e8f0",
    s1: "#f8fafc",
    s2: "#f1f5f9",
    white: "#ffffff",

    // accent (blue)
    acc: "#3b82f6",
    accSoft: "#eff6ff",
    accBord: "#bfdbfe",

    // danger (red)
    red: "#ef4444",
    redSoft: "#fef2f2",
    redBord: "#fecaca",

    // warning (amber)
    amber: "#f59e0b",
    amberSoft: "#fffbeb",
    amberBord: "#fde68a",

    // success (green)
    green: "#22c55e",
    greenSoft: "#f0fdf4",
    greenBord: "#bbf7d0",
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
        defaultTitle: string;
        defaultDesc: string;
    }
> = {
    danger: {
        icon: <DeleteFilled style={{ fontSize: 22 }} />,
        color: T.red,
        soft: T.redSoft,
        border: T.redBord,
        okBg: T.red,
        okHover: "#dc2626",
        defaultTitle: "Xác nhận xóa",
        defaultDesc: "Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.",
    },
    warning: {
        icon: <ExclamationCircleFilled style={{ fontSize: 22 }} />,
        color: T.amber,
        soft: T.amberSoft,
        border: T.amberBord,
        okBg: T.amber,
        okHover: "#d97706",
        defaultTitle: "Cảnh báo",
        defaultDesc: "Bạn có chắc chắn muốn thực hiện thao tác này không?",
    },
    info: {
        icon: <InfoCircleFilled style={{ fontSize: 22 }} />,
        color: T.acc,
        soft: T.accSoft,
        border: T.accBord,
        okBg: T.acc,
        okHover: "#2563eb",
        defaultTitle: "Xác nhận",
        defaultDesc: "Bạn có chắc chắn muốn tiếp tục không?",
    },
    success: {
        icon: <CheckCircleFilled style={{ fontSize: 22 }} />,
        color: T.green,
        soft: T.greenSoft,
        border: T.greenBord,
        okBg: T.green,
        okHover: "#16a34a",
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
            width="min(420px, 95vw)"
            centered
            footer={null}          // custom footer bên dưới
            styles={{
                content: { borderRadius: 14, padding: 0, overflow: "hidden" },
            }}
        >
            {/* ── Body ── */}
            <div style={{ padding: "28px 24px 20px" }}>
                {/* Icon circle */}
                <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: v.soft,
                    border: `1px solid ${v.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: v.color,
                    marginBottom: 16,
                }}>
                    {v.icon}
                </div>

                {/* Title */}
                <Text style={{
                    display: "block",
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.ink,
                    marginBottom: 8,
                    lineHeight: 1.4,
                }}>
                    {title ?? v.defaultTitle}
                </Text>

                {/* Description */}
                <Text style={{
                    display: "block",
                    fontSize: 14,
                    color: T.ink3,
                    lineHeight: 1.6,
                }}>
                    {description ?? v.defaultDesc}
                </Text>

                {/* Target name highlight (nếu có) */}
                {targetName && (
                    <div style={{
                        marginTop: 14,
                        padding: "9px 13px",
                        background: v.soft,
                        border: `1px solid ${v.border}`,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}>
                        <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: v.color,
                            flexShrink: 0,
                        }} />
                        <Text style={{
                            fontSize: 13,
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

            {/* ── Divider ── */}
            <div style={{ height: 1, background: T.line }} />

            {/* ── Footer ── */}
            <div style={{
                padding: "14px 20px",
                background: T.s1,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
            }}>
                {/* Hủy */}
                <button
                    onClick={onCancel}
                    disabled={loading}
                    style={{
                        height: 36,
                        paddingInline: 18,
                        borderRadius: 8,
                        border: `1px solid ${T.line}`,
                        background: T.white,
                        color: T.ink3,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 1,
                        transition: "opacity .15s",
                    }}
                >
                    {cancelText}
                </button>

                {/* Xác nhận */}
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    style={{
                        height: 36,
                        paddingInline: 18,
                        borderRadius: 8,
                        border: "none",
                        background: v.okBg,
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.75 : 1,
                        transition: "opacity .15s, background .15s",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => {
                        if (!loading)
                            (e.currentTarget as HTMLButtonElement).style.background = v.okHover;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = v.okBg;
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

            {/* Spin keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Modal>
    );
};

export default ConfirmModal;

// ── Usage examples ─────────────────────────────────────────────────────────
/*
// 1. Xóa nhân viên
<ConfirmModal
    open={openDelete}
    variant="danger"
    targetName={employee.name}
    title="Xóa nhân viên"
    description="Dữ liệu của nhân viên này sẽ bị xóa vĩnh viễn."
    okText="Xóa ngay"
    onConfirm={handleDelete}
    onCancel={() => setOpenDelete(false)}
    loading={isDeleting}
/>

// 2. Thăng tiến (dùng thay cho confirm cuối)
<ConfirmModal
    open={openPromote}
    variant="success"
    targetName={employee.name}
    title="Xác nhận thăng tiến"
    description={`Nhân viên sẽ được chuyển lên bước tiếp theo trong lộ trình.`}
    okText="Thăng tiến"
    onConfirm={handlePromote}
    onCancel={() => setOpenPromote(false)}
    loading={isPending}
/>

// 3. Cảnh báo hành động không thể hoàn tác
<ConfirmModal
    open={openWarn}
    variant="warning"
    title="Lưu ý quan trọng"
    description="Hành động này sẽ ảnh hưởng đến toàn bộ nhóm. Tiếp tục?"
    onConfirm={handleAction}
    onCancel={() => setOpenWarn(false)}
/>
*/