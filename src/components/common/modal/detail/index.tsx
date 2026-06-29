/**
 * @file detail/index.tsx
 * Shared building blocks cho tất cả "Chi tiết ..." modal trong toàn bộ app.
 *
 * Export:
 *  - useModalWidth()      — responsive modal width hook
 *  - useIsMobile()        — screen-size-based mobile detect hook
 *  - InfoRow              — icon + label + value row
 *  - SectionTitle         — divider-style section header
 *  - ProfileHeader        — avatar + name + badges header card
 *  - DetailModal          — styled Modal wrapper (border-radius, blur, CSS fixes)
 */

import { Modal, Typography, Avatar, Tag } from "antd";
import type { ModalProps } from "antd";
import { useBreakpoint, useIsMobile } from "@/hooks/useIsMobile";

const { Text } = Typography;

export { useIsMobile };

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const DETAIL_ACCENT     = "#f5317f";
export const DETAIL_BORDER     = "#f0f0f0";
export const DETAIL_BORDER_MED = "#e5e7eb";
export const DETAIL_TEXT_MAIN  = "#111827";
export const DETAIL_TEXT_LABEL = "#6b7280";
export const DETAIL_TEXT_MUTED = "#9ca3af";
export const DETAIL_BG_SUBTLE  = "#fafafa";

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Tính width cho Modal theo kích thước màn hình.
 * @param desktopWidth  - width trên desktop (default 640)
 * @param mobileRatio   - tỉ lệ vw trên mobile <768 (default 0.95)
 */
export const useModalWidth = (desktopWidth = 640, mobileRatio = 0.95): number => {
    const { width, isDesktop } = useBreakpoint();

    if (isDesktop) return desktopWidth;
    if (width < 480) return width * mobileRatio;
    return width * 0.92;
};

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value?: React.ReactNode;
    highlight?: boolean;
    /** Ẩn border dưới (dòng cuối mỗi section) */
    noBorder?: boolean;
    span?: number;
    style?: React.CSSProperties;
}

export const InfoRow = ({ icon, label, value, highlight = false, noBorder = false, span, style }: InfoRowProps) => (
    <div 
        className={`detail-modal-info-row ${span === 2 ? "info-row-span-2" : ""}`}
        style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "9px 0",
            borderBottom: noBorder ? "none" : `1px solid ${DETAIL_BORDER}`,
            gridColumn: span === 2 ? "1 / -1" : undefined,
            ...style,
        }}
    >
        <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: DETAIL_BG_SUBTLE, border: `1px solid ${DETAIL_BORDER_MED}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
        }}>
            <span style={{ fontSize: 12, color: DETAIL_TEXT_MUTED }}>{icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{
                fontSize: 11, color: DETAIL_TEXT_MUTED, display: "block",
                marginBottom: 2, letterSpacing: "0.02em",
            }}>
                {label}
            </Text>
            <Text style={{
                fontSize: 13, color: DETAIL_TEXT_MAIN,
                fontWeight: highlight ? 600 : 400,
                wordBreak: "break-word",
            }}>
                {value ?? "--"}
            </Text>
        </div>
    </div>
);

// ─── SectionTitle ─────────────────────────────────────────────────────────────
export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 2 }}>
        <Text style={{
            fontSize: 11, fontWeight: 700, color: DETAIL_TEXT_MUTED,
            textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap",
        }}>
            {children}
        </Text>
        <div style={{ flex: 1, height: 1, background: DETAIL_BORDER }} />
    </div>
);

// ─── InfoCard (section wrapper) ───────────────────────────────────────────────
export const InfoCard = ({
    children,
    style,
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
}) => (
    <div 
        className="detail-modal-info-card"
        style={{
            background: "#fff",
            border: `1.5px solid ${DETAIL_BORDER_MED}`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 14,
            ...style,
        }}
    >
        {children}
    </div>
);

// ─── ProfileHeader ────────────────────────────────────────────────────────────
export interface ProfileHeaderProps {
    /** Avatar src URL — nếu không có sẽ hiện initials hoặc icon */
    avatarSrc?: string;
    /** Ký tự đầu tên (initials) khi không có avatar */
    initials?: string;
    /** Icon fallback khi không có avatar và initials */
    avatarIcon?: React.ReactNode;
    /** Avatar background (gradient string hoặc màu) */
    avatarBg?: string;
    /** Tiêu đề chính */
    title: React.ReactNode;
    /** Badges bên cạnh tiêu đề (e.g. active/inactive tag) */
    badges?: React.ReactNode[];
    /** Dòng phụ dưới tiêu đề */
    subtitle?: React.ReactNode;
    /** Extra tags/info dưới subtitle */
    tags?: React.ReactNode[];
}

export const ProfileHeader = ({
    avatarSrc, initials, avatarIcon, avatarBg,
    title, badges = [], subtitle, tags = [],
}: ProfileHeaderProps) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px",
        background: DETAIL_BG_SUBTLE,
        border: `1.5px solid ${DETAIL_BORDER_MED}`,
        borderRadius: 14,
        marginBottom: 14,
        flexWrap: "wrap",
    }}>
        <Avatar
            size={52}
            src={avatarSrc}
            onError={() => true}
            icon={!avatarSrc && !initials ? avatarIcon : undefined}
            style={{
                background: avatarBg ?? `linear-gradient(135deg, ${DETAIL_ACCENT}22, ${DETAIL_ACCENT}44)`,
                border: `2px solid ${DETAIL_BORDER_MED}`,
                outline: avatarSrc ? "3px solid #fff" : undefined,
                outlineOffset: avatarSrc ? "-1px" : undefined,
                flexShrink: 0,
                fontSize: 22,
                color: DETAIL_ACCENT,
            }}
        >
            {!avatarSrc && initials}
        </Avatar>

        <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title + badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                <Text style={{
                    fontSize: 15, fontWeight: 700, color: DETAIL_TEXT_MAIN,
                    letterSpacing: "-0.02em", wordBreak: "break-word",
                }}>
                    {title}
                </Text>
                {badges}
            </div>

            {/* Subtitle */}
            {subtitle && (
                <Text style={{ fontSize: 13, color: DETAIL_TEXT_LABEL, display: "block", marginBottom: tags.length ? 4 : 0 }}>
                    {subtitle}
                </Text>
            )}

            {/* Extra tags */}
            {tags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0, overflow: "hidden" }}>
                    {tags.map((tag, i) => (
                        <span key={i} style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>{tag}</span>
                    ))}
                </div>
            )}
        </div>
    </div>
);

// ─── ActiveBadge / InactiveBadge ──────────────────────────────────────────────
export const ActiveTag = ({ label = "Hoạt động" }: { label?: string }) => (
    <Tag color="success" style={{ borderRadius: 20, margin: 0, fontWeight: 600, fontSize: 11 }}>
        {label}
    </Tag>
);

export const InactiveTag = ({ label = "Ngừng hoạt động" }: { label?: string }) => (
    <Tag color="error" style={{ borderRadius: 20, margin: 0, fontWeight: 600, fontSize: 11 }}>
        {label}
    </Tag>
);

export const OutlineTag = ({ icon, label }: { icon?: React.ReactNode; label: string }) => (
    <Tag style={{
        borderRadius: 20, margin: 0, fontSize: 11,
        background: "transparent", border: `1px solid ${DETAIL_BORDER_MED}`,
        color: DETAIL_TEXT_LABEL,
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
    }}>
        {icon && <span style={{ marginRight: 4, flexShrink: 0 }}>{icon}</span>}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {label}
        </span>
    </Tag>
);

// ─── DetailModal wrapper ──────────────────────────────────────────────────────
const MODAL_CLASS = "detail-modal-shared";

export interface DetailModalProps extends Omit<ModalProps, "width"> {
    /** Tên module để scope CSS (default: "shared") */
    moduleClass?: string;
    /** Desktop width (default: 640) */
    desktopWidth?: number;
    children: React.ReactNode;
}

export const DetailModal = ({
    moduleClass = "shared",
    desktopWidth = 640,
    children,
    className,
    ...rest
}: DetailModalProps) => {
    const width = useModalWidth(desktopWidth);
    const cls = `${MODAL_CLASS} ${MODAL_CLASS}--${moduleClass} ${className ?? ""}`.trim();

    return (
        <>
            <style>{`
                .${MODAL_CLASS} .ant-modal-content {
                    border-radius: 20px !important;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.05) !important;
                    overflow: hidden;
                    padding: 0 !important;
                }
                .${MODAL_CLASS} .ant-modal-header {
                    padding: 20px 24px 0 !important;
                    border-bottom: none !important;
                    background: #fff !important;
                    margin-bottom: 0 !important;
                }
                .${MODAL_CLASS} .ant-modal-title {
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    color: ${DETAIL_TEXT_MAIN} !important;
                    letter-spacing: -0.03em !important;
                }
                .${MODAL_CLASS} .ant-modal-body {
                    padding: 16px 24px 24px !important;
                    overflow-y: auto !important;
                    max-height: 85vh !important;
                }
                .${MODAL_CLASS} .ant-modal-body::-webkit-scrollbar { width: 0; }
                .${MODAL_CLASS} .ant-modal-body { scrollbar-width: none; }
                .${MODAL_CLASS} .ant-modal-close {
                    top: 12px !important; right: 20px !important;
                    width: 30px !important; height: 30px !important;
                    border-radius: 8px !important;
                    background: #f7f7f8 !important;
                    border: 1.5px solid #efefef !important;
                    display: flex !important; align-items: center !important;
                    justify-content: center !important; transition: all 0.2s !important;
                }
                .${MODAL_CLASS} .ant-modal-close:hover {
                    background: #f0f0f0 !important; border-color: #e0e0e0 !important;
                }
                .${MODAL_CLASS} .ant-modal-close .ant-modal-close-x {
                    width: 30px !important; height: 30px !important;
                    line-height: 30px !important; font-size: 12px !important;
                    color: #6b7280 !important;
                }
                @media (min-width: 769px) {
                    .${MODAL_CLASS} .detail-modal-info-card {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 0 24px !important;
                    }
                    .${MODAL_CLASS} .detail-modal-info-card > :first-child {
                        grid-column: 1 / -1 !important;
                    }
                    .${MODAL_CLASS} .detail-modal-info-card > .info-row-span-2 {
                        grid-column: 1 / -1 !important;
                    }
                }
                @media (max-width: 768px) {
                    .${MODAL_CLASS} .ant-modal-body { padding: 12px 14px 18px !important; }
                    .${MODAL_CLASS} .ant-modal-header { padding: 14px 14px 0 !important; }
                }
                @media (max-width: 480px) {
                    .${MODAL_CLASS} .ant-modal-content { border-radius: 14px !important; }
                    .${MODAL_CLASS} .ant-modal-body { padding: 10px 12px 16px !important; }
                }
            `}</style>

            <Modal
                width={width}
                centered
                footer={null}
                className={cls}
                styles={{
                    mask: { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.18)" },
                }}
                {...rest}
            >
                {children}
            </Modal>
        </>
    );
};
