/**
 * manage.account.content.tsx
 * Sub-components + UserUpdateInfo logic
 */

import { useEffect, useState } from "react";
import { Form, Input, Button, Upload, Spin, Modal } from "antd";
import { CloseOutlined, EditOutlined } from "@ant-design/icons";

import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { callUploadSingleFile, callUpdateProfile } from "@/config/api";
import { updateUserProfile } from "@/redux/slice/accountSlide";
import { notify } from "@/components/common/notification/notify";
import type { IUserInfo } from "@/redux/slice/accountSlide";
import type { IReqUpdateProfileDTO } from "@/types/backend";
import { useUserPositionsQuery } from "@/hooks/useUserPositions";
import { getModalWidth } from "@/utils/responsive";
import dayjs from "dayjs";
import { useBreakpoint } from "@/hooks/useIsMobile";
import backgroundTrangCaNhan from "../../../../backgroundtrangcanhan.webp";

/* ═══════════════════════════════════════════
   CONSTANTS & STYLES (Awwwards-Tier)
   ═══════════════════════════════════════════ */
export const PINK = "#f5317f";
export const PINK_LIGHT = "#fff0f6";
export const PINK_BORDER = "rgba(245,49,127,0.2)";

// Custom spring transition
export const TASTE_TRANSITION = "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)";

export const SOURCE_CFG = {
    COMPANY: {
        bg: "#EEF4FF", border: "#c7d9fd", color: "#4a7fef",
        icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4a7fef" strokeWidth="1.6">
                <rect x="2" y="6" width="12" height="8" rx="1" />
                <path d="M5 6V4a3 3 0 016 0v2" />
            </svg>
        ),
    },
    DEPARTMENT: {
        bg: "#EDFAF4", border: "#a5e6cc", color: "#3EBF8F",
        icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#3EBF8F" strokeWidth="1.6">
                <circle cx="8" cy="4" r="2" />
                <circle cx="3" cy="12" r="1.5" /><circle cx="13" cy="12" r="1.5" />
                <line x1="8" y1="6" x2="8" y2="9" />
                <line x1="8" y1="9" x2="3" y2="10.5" />
                <line x1="8" y1="9" x2="13" y2="10.5" />
            </svg>
        ),
    },
    SECTION: {
        bg: "#FFF4EE", border: "#fcc7a8", color: "#F08050",
        icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#F08050" strokeWidth="1.6">
                <rect x="1" y="3" width="6" height="4" rx="1" /><rect x="9" y="3" width="6" height="4" rx="1" />
                <rect x="5" y="10" width="6" height="4" rx="1" />
                <line x1="4" y1="7" x2="4" y2="10" /><line x1="12" y1="7" x2="12" y2="10" />
                <line x1="4" y1="10" x2="12" y2="10" />
            </svg>
        ),
    },
} as const;

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
export const getInitials = (name?: string) => {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length === 1
        ? p[0][0].toUpperCase()
        : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};
export const formatDate = (v?: string | null) => v ? dayjs(v).format("DD/MM/YYYY") : "—";
export const genderLabel = (g?: string | null) =>
    ({ MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" }[g ?? ""] ?? "—");

/* ═══════════════════════════════════════════
   AvatarLightbox
   ═══════════════════════════════════════════ */
interface AvatarLightboxProps {
    open: boolean;
    onClose: () => void;
    displayAvatar: string;
    initials: string;
    userName?: string;
    userEmail?: string;
    onFileSelect: (f: File) => false;
    disabled?: boolean;
    positions?: any[];
}

export const AvatarLightbox = ({
    open, onClose, displayAvatar, initials,
    userName, userEmail, onFileSelect, disabled, positions = [],
}: AvatarLightboxProps) => {
    const [uploadHover, setUploadHover] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        setAvatarError(false);
    }, [displayAvatar]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={getModalWidth(440)}
            maskClosable
            closable={false}
            styles={{
                content: {
                    borderRadius: 24,
                    padding: 0,
                    overflow: "hidden",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
                },
                mask: {
                    backdropFilter: "blur(8px)",
                    background: "rgba(0,0,0,0.3)",
                },
            }}
        >
            {/* Top gradient band */}
            <div style={{
                background: "linear-gradient(145deg, #fff0f6 0%, #fce7f3 100%)",
                padding: "32px 24px 48px",
                display: "flex", flexDirection: "column", alignItems: "center",
                position: "relative",
            }}>
                <div style={{
                    position: "absolute", top: -20, right: -20,
                    width: 100, height: 100, borderRadius: "50%",
                    background: "rgba(245,49,127,0.08)", pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: -10, left: -10,
                    width: 70, height: 70, borderRadius: "50%",
                    background: "rgba(245,49,127,0.05)", pointerEvents: "none",
                }} />

                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: 12, right: 12,
                        width: 28, height: 28, borderRadius: "50%",
                        border: "1px solid rgba(245,49,127,0.2)",
                        background: "rgba(255,255,255,0.8)",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 12, color: "#9ca3af",
                        backdropFilter: "blur(4px)",
                    }}
                >✕</button>

                {/* Avatar with ring */}
                <div style={{ position: "relative" }}>
                    <div style={{
                        position: "absolute", inset: -6, borderRadius: "50%",
                        background: `conic-gradient(${PINK}, #ff9dc4, ${PINK})`,
                        opacity: 0.3,
                        animation: "spin 4s linear infinite",
                    }} />
                    <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

                    {displayAvatar && !avatarError
                        ? <img src={displayAvatar} alt="avatar" onError={() => setAvatarError(true)} style={{
                            width: 160, height: 160, borderRadius: "50%", objectFit: "cover",
                            border: "4px solid #fff",
                            boxShadow: "0 8px 32px rgba(245,49,127,0.25)",
                            position: "relative", zIndex: 1, display: "block",
                        }} />
                        : <div style={{
                            width: 160, height: 160, borderRadius: "50%",
                            background: `linear-gradient(145deg, #ff9dc4, ${PINK})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 56, fontWeight: 700, color: "#fff",
                            border: "4px solid #fff",
                            boxShadow: "0 8px 32px rgba(245,49,127,0.25)",
                            position: "relative", zIndex: 1,
                        }}>{initials}</div>
                    }


                </div>
            </div>

            {/* Bottom white card */}
            <div style={{
                background: "#fff", padding: "0 24px 28px",
                display: "flex", flexDirection: "column", alignItems: "center",
                marginTop: -24, borderRadius: "24px 24px 0 0",
                position: "relative", zIndex: 2,
            }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "#f0f0f0", margin: "12px 0 16px" }} />

                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", textAlign: "center", letterSpacing: "-0.02em" }}>
                    {userName}
                </div>
                <div style={{
                    marginTop: 6, fontSize: 12, color: "#9ca3af",
                    background: "#f9fafb", border: "1px solid #f0f0f0",
                    borderRadius: 20, padding: "3px 12px",
                    maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {userEmail}
                </div>
                {/* Job title badges */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 14 }}>
                    {positions.length > 0 ? (
                        <>
                            {/* Combined Title & Level Capsule */}
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                fontSize: 12, padding: "5px 16px", borderRadius: 999,
                                background: "#f8fafc", border: "1px solid #e2e8f0",
                                maxWidth: "100%", boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                            }}>
                                <span style={{
                                    fontWeight: 600, color: "#334155",
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    maxWidth: 240
                                }}>
                                    {positions[0]?.jobTitle?.nameVi ?? positions[0]?.name ?? "—"}
                                </span>
                                {(positions[0]?.jobTitle?.positionCode || positions[0]?.levelCode) && (
                                    <>
                                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />
                                        <span style={{ color: PINK, fontWeight: 700 }}>
                                            {positions[0]?.jobTitle?.positionCode ?? positions[0]?.levelCode}
                                        </span>
                                    </>
                                )}
                            </span>
                            
                            {/* Extra count badge */}
                            {positions.length > 1 && (
                                <span style={{
                                    display: "inline-flex", alignItems: "center",
                                    fontSize: 11, fontWeight: 700,
                                    padding: "5px 10px", borderRadius: 999,
                                    background: "#fff1f2", color: "#e11d48",
                                    border: "1px solid #ffe4e6",
                                }}>
                                    +{positions.length - 1}
                                </span>
                            )}
                        </>
                    ) : (
                        <span style={{
                            fontSize: 11, color: "#cbd5e1", fontStyle: "italic",
                        }}>Chưa có chức danh</span>
                    )}
                </div>

                <div style={{
                    width: "100%", height: 1,
                    background: "linear-gradient(90deg, transparent, #f0f0f0, transparent)",
                    margin: "18px 0",
                }} />

                <Upload showUploadList={false} beforeUpload={onFileSelect} accept="image/*" multiple={false}>
                    <button
                        disabled={disabled}
                        onMouseEnter={() => setUploadHover(true)}
                        onMouseLeave={() => setUploadHover(false)}
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            width: 220, height: 42, borderRadius: 12,
                            border: `1.5px solid ${uploadHover ? PINK : "rgba(245,49,127,0.25)"}`,
                            background: uploadHover
                                ? "linear-gradient(135deg, #fff0f6, #fce7f3)"
                                : "#fff",
                            color: PINK, fontSize: 13, fontWeight: 600,
                            cursor: disabled ? "not-allowed" : "pointer",
                            transition: "all .15s",
                            boxShadow: uploadHover ? "0 4px 16px rgba(245,49,127,0.15)" : "none",
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Tải ảnh mới lên
                    </button>
                </Upload>
                <div style={{ marginTop: 8, fontSize: 10, color: "#d1d5db" }}>JPG, PNG tối đa 5MB</div>
            </div>
        </Modal>
    );
};

/* ═══════════════════════════════════════════
   InfoItem
   ═══════════════════════════════════════════ */
export const InfoItem = ({
    label, value, icon,
}: {
    label: string; value?: string | null; icon?: React.ReactNode;
}) => (
    <div className="taste-info-item">
        <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
                fontSize: 12, fontWeight: 500, color: "#888888",
            }}>{label}</div>
            <div style={{
                fontSize: 14, fontWeight: 500,
                color: value ? "#111111" : "#cbd5e1", marginTop: 4,
                display: "flex", alignItems: "center", gap: 6,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
                <span>{value || "—"}</span>
                {icon && <span style={{ display: "inline-flex", flexShrink: 0 }}>{icon}</span>}
            </div>
        </div>
    </div>
);

/* ═══════════════════════════════════════════
   PositionCard
   ═══════════════════════════════════════════ */
export const PositionCard = ({ record }: { record: any }) => {
    const cfg = SOURCE_CFG[record.source as keyof typeof SOURCE_CFG] ?? SOURCE_CFG.COMPANY;
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${hovered ? cfg.border : "#f1f5f9"}`,
                background: hovered ? cfg.bg : "#fafafa",
                transition: TASTE_TRANSITION,
                cursor: "default",
                borderLeft: `3px solid ${cfg.color}`,
            }}
        >
            {/* Row 1: Title + badge */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{
                    fontSize: 13, fontWeight: 700, color: "#0f172a",
                    lineHeight: 1.45, flex: 1,
                }}>
                    {record.jobTitle?.nameVi ?? "—"}
                </div>
                {record.jobTitle?.positionCode && (
                    <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 6,
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        color: cfg.color, fontWeight: 700, flexShrink: 0,
                        fontFamily: "monospace", whiteSpace: "nowrap", marginTop: 2,
                    }}>
                        {record.jobTitle.positionCode}
                    </span>
                )}
            </div>

            {/* Row 2: Company › Dept › Section breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px 4px", marginTop: 6 }}>
                {record.company?.name && (
                    <span style={{ fontSize: 11, color: "#4a7fef", fontWeight: 500 }}>
                        {record.company.name}
                    </span>
                )}
                {record.department?.name && (
                    <>
                        <span style={{ fontSize: 11, color: "#cbd5e1" }}>›</span>
                        <span style={{ fontSize: 11, color: "#3EBF8F", fontWeight: 500 }}>
                            {record.department.name}
                        </span>
                    </>
                )}
                {record.source === "SECTION" && record.section?.name && (
                    <>
                        <span style={{ fontSize: 11, color: "#cbd5e1" }}>›</span>
                        <span style={{ fontSize: 11, color: "#F08050", fontWeight: 500 }}>
                            {record.section.name}
                        </span>
                    </>
                )}
            </div>
        </div>
    );

};

/* ═══════════════════════════════════════════
   SectionLabel
   ═══════════════════════════════════════════ */
export const SectionLabel = ({
    children, extra,
}: {
    children: React.ReactNode; extra?: React.ReactNode;
}) => (
    <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 10,
    }}>
        <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: ".12em",
            textTransform: "uppercase" as const, color: "#94a3b8",
        }}>{children}</span>
        {extra}
    </div>
);

/* ═══════════════════════════════════════════
   UserUpdateInfo — main content (Bento Double-Bezel)
   ═══════════════════════════════════════════ */
export const UserUpdateInfo = ({ onClose }: { onClose: (v: boolean) => void }) => {
    const { isMobile } = useBreakpoint();
    const dispatch = useAppDispatch();
    const user = useAppSelector((s) => s.account.user);
    const [form] = Form.useForm();

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [panelAvatarError, setPanelAvatarError] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const currentAvatar = user?.avatar
        ? `${backendURL}/api/v1/files/public?fileName=${encodeURIComponent(user.avatar)}&folder=avatar&t=${Date.now()}`
        : "";
    const userId = user?.id ? String(user.id) : undefined;

    const { data: positions = [], isLoading: loadingPositions } = useUserPositionsQuery(userId);

    useEffect(
        () => () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); },
        [previewUrl],
    );

    useEffect(() => {
        setPanelAvatarError(false);
    }, [previewUrl, currentAvatar]);

    const handleFileSelect = (file: File): false => {
        if (!file.type.startsWith("image/")) { notify.warning("Vui lòng chọn tệp ảnh."); return false; }
        if (file.size > 5 * 1024 * 1024) { notify.warning("Kích thước tối đa 5MB."); return false; }
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        return false;
    };

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            let finalAvatar = user?.avatar || "";
            if (avatarFile) {
                const uploadRes = await callUploadSingleFile(avatarFile, "avatar");
                const fileName = uploadRes?.data?.fileName;
                if (fileName) finalAvatar = fileName;
                else { notify.error("Không thể tải ảnh lên."); return; }
            }
            const payload: IReqUpdateProfileDTO = { name: values.name ?? user?.name ?? "", avatar: finalAvatar };
            const res = await callUpdateProfile(payload);
            if (res?.data) {
                dispatch(updateUserProfile(res.data));
                notify.success("Cập nhật thành công.");
                setIsEditing(false);
                setAvatarFile(null);
                setPreviewUrl("");
                onClose(false);
            } else {
                notify.error("Không thể cập nhật.");
            }
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Không thể hoàn tất thao tác. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    const displayAvatar = previewUrl || currentAvatar;
    const initials = getInitials(user?.name);
    const info: IUserInfo | null | undefined = user?.userInfo;

    return (
        <>
            <style>{`
                @keyframes pulse-dot {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(132, 204, 22, 0.4); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(132, 204, 22, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(132, 204, 22, 0); }
                }
                .online-indicator-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #84cc16;
                    display: inline-block;
                    animation: pulse-dot 2s infinite ease-in-out;
                }
                
                /* Double-Bezel nested architecture styles */
                .double-bezel-outer-pink {
                    background: rgba(245, 49, 127, 0.02);
                    border: 1px solid rgba(245, 49, 127, 0.08);
                    padding: 10px;
                    border-radius: 22px;
                    transition: ${TASTE_TRANSITION};
                }
                .double-bezel-outer-pink:hover {
                    border-color: rgba(245, 49, 127, 0.2);
                    background: rgba(245, 49, 127, 0.04);
                }
                
                .double-bezel-outer {
                    background: #ffffff;
                    border: 1px solid #eef2f7;
                    padding: 10px;
                    border-radius: 22px;
                    transition: ${TASTE_TRANSITION};
                }
                .double-bezel-outer:hover {
                    border-color: rgba(245, 49, 127, 0.15);
                    background: rgba(245, 49, 127, 0.01);
                }

                .double-bezel-inner {
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: inset 0 1px 2px rgba(255,255,255,1), 0 4px 16px rgba(15, 23, 42, 0.015);
                    height: 100%;
                }

                .taste-info-item {
                    display: block;
                    padding: 0;
                    background: transparent;
                    border: none;
                    transition: ${TASTE_TRANSITION};
                }
                .taste-info-item:hover {
                    background: transparent;
                    border-color: transparent;
                }
                
                .taste-input {
                    border-radius: 10px !important;
                    font-size: 13px !important;
                    height: 40px !important;
                    border-color: #cbd5e1 !important;
                    transition: ${TASTE_TRANSITION} !important;
                    box-shadow: none !important;
                }
                .taste-input:hover {
                    border-color: #94a3b8 !important;
                }
                .taste-input:focus, .taste-input-focused {
                    border-color: ${PINK} !important;
                    box-shadow: 0 0 0 3px ${PINK_LIGHT} !important;
                }
                
                .taste-close-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
                    transition: ${TASTE_TRANSITION};
                }
                .taste-close-btn:hover {
                    border-color: ${PINK};
                    color: ${PINK};
                    transform: rotate(90deg);
                    background: ${PINK_LIGHT};
                }
                
                .taste-avatar-ring {
                    position: absolute;
                    inset: -5px;
                    border-radius: 50%;
                    background: conic-gradient(${PINK}, #ff9dc4, ${PINK});
                    opacity: 0.3;
                    animation: spin-avatar 6s linear infinite;
                }
                @keyframes spin-avatar {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .manage-account-hero {
                    position: relative;
                    overflow: hidden;
                    isolation: isolate;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
                    background-size: cover;
                    background-position: center 72%;
                }
                .manage-account-hero::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(90deg, rgba(126, 12, 70, 0.64) 0%, rgba(170, 24, 91, 0.24) 34%, rgba(255, 255, 255, 0) 68%),
                        linear-gradient(180deg, rgba(70, 9, 42, 0.04) 0%, rgba(70, 9, 42, 0.10) 100%);
                    pointer-events: none;
                }
                .manage-account-hero::after {
                    content: "";
                    position: absolute;
                    inset: auto 0 0 0;
                    height: 1px;
                    background: linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0.08));
                    pointer-events: none;
                }
                .manage-account-hero-grid {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 20px;
                }
                .manage-account-hero-card {
                    display: none;
                }
                .manage-account-content-shell {
                    width: 100%;
                    max-width: 90rem;
                    margin-inline: auto;
                }
                .manage-account-bitrix-grid {
                    display: grid;
                    grid-template-columns: minmax(16rem, 0.72fr) minmax(0, 2fr);
                    gap: clamp(1rem, 2vw, 1.5rem);
                    align-items: start;
                }
                @media (max-width: 60rem) {
                    .manage-account-bitrix-grid {
                        grid-template-columns: minmax(0, 1fr);
                    }
                }
            `}</style>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ name: user?.name, email: user?.email }}
                style={{
                    height: "100%",
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    background: "#f8fafc",
                }}
            >
                <div
                    className="manage-account-hero"
                    style={{
                        padding: isMobile
                            ? "1rem 1.25rem 0.875rem"
                            : "clamp(1.25rem, 2.4vw, 2rem) clamp(1.25rem, 2.5vw, 2rem) clamp(1rem, 2vw, 1.5rem)",
                        backgroundImage: `url(${backgroundTrangCaNhan})`,
                        color: "#ffffff",
                        boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.12)",
                    }}
                >
                    <div className="manage-account-hero-grid">
                        <div style={{ minWidth: 0, width: "100%" }}>
                            <div style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: "rgba(255,255,255,0.72)",
                                letterSpacing: ".16em",
                                textTransform: "uppercase",
                            }}>
                                Hồ sơ nhân sự
                            </div>
                            <div style={{
                                marginTop: 4,
                                fontSize: isMobile ? 18 : 24,
                                fontWeight: 800,
                                color: "#ffffff",
                                letterSpacing: 0,
                                textShadow: "0 1px 2px rgba(0,0,0,0.12)",
                            }}>
                                {user?.name || "Tài khoản"}
                            </div>

                            <div style={{
                                marginTop: 11,
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: 8,
                            }}>
                                <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    width: 38,
                                    height: 38,
                                    borderRadius: 12,
                                    background: "rgba(255,255,255,0.16)",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    backdropFilter: "blur(10px)",
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                                }}>
                                    <span style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        margin: "0 auto",
                                        background: "#dcfce7",
                                        boxShadow: "0 0 0 5px rgba(220,252,231,0.14)",
                                    }} />
                                </span>
                            </div>
                        </div>

                        {isMobile && (
                            <button
                                type="button"
                                onClick={() => onClose(false)}
                                aria-label="Đóng"
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    border: "1px solid rgba(255,255,255,0.25)",
                                    background: "rgba(255,255,255,0.1)",
                                    color: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                }}
                            >
                                <CloseOutlined style={{ fontSize: 12 }} />
                            </button>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        minHeight: 0,
                        flex: 1,
                        overflowY: "auto",
                        padding: isMobile
                            ? "1rem"
                            : "clamp(1rem, 2.2vw, 1.75rem)",
                        background: "#f8fafc",
                    }}
                >
                    <div className="manage-account-content-shell">
                            <div className="manage-account-bitrix-grid">
                                {/* Left Column: Avatar & Position */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                    {/* Double-Bezel Avatar Card */}
                                    <div className="double-bezel-outer-pink">
                                        <div className="double-bezel-inner" style={{ padding: "20px 16px 20px" }}>


                                            <div style={{ position: "relative", width: 160, height: 160, margin: "14px auto 16px" }}>
                                                <div className="taste-avatar-ring" />
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxOpen(true)}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        borderRadius: "50%",
                                                        border: "4px solid #ffffff",
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        background: `linear-gradient(145deg, #ff8fbd 0%, ${PINK} 58%, #b83280 100%)`,
                                                        color: "#fff",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: 48,
                                                        fontWeight: 800,
                                                        boxShadow: "0 10px 24px rgba(245, 49, 127, 0.16)",
                                                        position: "relative",
                                                        zIndex: 1,
                                                    }}
                                                    aria-label="Xem ảnh đại diện"
                                                >
                                                    {displayAvatar && !panelAvatarError ? (
                                                        <img
                                                            src={displayAvatar}
                                                            alt="avatar"
                                                            onError={() => setPanelAvatarError(true)}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                        />
                                                    ) : initials}
                                                </button>
                                            </div>

                                            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", textAlign: "center" }}>
                                                {user?.name || "—"}
                                            </div>


                                            <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                                                <span style={{
                                                    fontSize: 10.5,
                                                    padding: "3px 8px",
                                                    borderRadius: 999,
                                                    border: `1px solid ${PINK_BORDER}`,
                                                    color: PINK,
                                                    background: "rgba(245, 49, 127, 0.04)",
                                                    fontWeight: 700,
                                                }}>
                                                    {positions.length} chức danh
                                                </span>
                                            </div>


                                        </div>
                                    </div>

                                    {/* Double-Bezel Positions Card */}
                                    <div className="double-bezel-outer">
                                        <div className="double-bezel-inner" style={{ padding: 18 }}>
                                            <SectionLabel
                                                extra={
                                                    <span style={{
                                                        fontSize: 9,
                                                        padding: "1px 6px",
                                                        borderRadius: 20,
                                                        background: "#f1f5f9",
                                                        color: "#475569",
                                                        border: "1px solid #e2e8f0",
                                                        fontWeight: 700,
                                                    }}>
                                                        {positions.length} vị trí
                                                    </span>
                                                }
                                            >
                                                Chức danh
                                            </SectionLabel>

                                            {loadingPositions ? (
                                                <div style={{ textAlign: "center", padding: "10px 0" }}>
                                                    <Spin size="small" />
                                                </div>
                                            ) : positions.length === 0 ? (
                                                <div
                                                    style={{
                                                        textAlign: "center",
                                                        padding: "14px 10px",
                                                        fontSize: 11,
                                                        color: "#cbd5e1",
                                                        border: "1px dashed #dbe4ef",
                                                        borderRadius: 10,
                                                        background: "#fbfdff",
                                                    }}
                                                >
                                                    Chưa có chức danh nào
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                    {positions.map((r: any) => <PositionCard key={r.id} record={r} />)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Double-Bezel Contact Form */}
                                <div className="double-bezel-outer">
                                    <div className="double-bezel-inner" style={{ padding: 24 }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 14, marginBottom: 20 }}>
                                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                                                Thông tin liên hệ
                                            </h3>
                                            {!isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(true)}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 5,
                                                        padding: "5px 12px",
                                                        borderRadius: 999,
                                                        border: `1px solid ${PINK_BORDER}`,
                                                        background: "rgba(245,49,127,0.04)",
                                                        color: PINK,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        transition: "all 0.18s ease",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = PINK;
                                                        e.currentTarget.style.color = "#fff";
                                                        e.currentTarget.style.borderColor = PINK;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = "rgba(245,49,127,0.04)";
                                                        e.currentTarget.style.color = PINK;
                                                        e.currentTarget.style.borderColor = PINK_BORDER;
                                                    }}
                                                >
                                                    <EditOutlined style={{ fontSize: 11 }} />
                                                    Chỉnh sửa
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", columnGap: 24, rowGap: 18, marginBottom: 20 }}>
                                            <InfoItem label="Mã NV" value={info?.employeeCode} />
                                            <InfoItem label="Giới tính" value={genderLabel(info?.gender)} />
                                            <InfoItem label="Ngày sinh" value={formatDate(info?.dateOfBirth)} />
                                            <InfoItem label="Điện thoại" value={info?.phone} />
                                            <InfoItem label="Vào làm" value={formatDate(info?.startDate)} />
                                            <InfoItem label="Ký HĐ" value={formatDate(info?.contractSignDate)} />
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", columnGap: 24, rowGap: 18, marginBottom: 24 }}>
                                            {isEditing ? (
                                                <Form.Item
                                                    label={<span style={{ fontSize: 12, fontWeight: 500, color: "#888888" }}>Họ và tên</span>}
                                                    name="name"
                                                    style={{ marginBottom: 0 }}
                                                    preserve
                                                    rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
                                                >
                                                    <Input
                                                        disabled={submitting}
                                                        className="taste-input"
                                                        autoFocus
                                                        style={{ height: 38, borderRadius: 8 }}
                                                    />
                                                </Form.Item>
                                            ) : (
                                                <div style={{ cursor: "pointer" }} onClick={() => setIsEditing(true)}>
                                                    <InfoItem 
                                                        label="Họ và tên" 
                                                        value={user?.name} 
                                                        icon={<EditOutlined style={{ fontSize: 12, color: PINK, marginLeft: 4 }} />} 
                                                    />
                                                </div>
                                            )}

                                            {isEditing ? (
                                                <Form.Item
                                                    label={<span style={{ fontSize: 12, fontWeight: 500, color: "#888888" }}>Email</span>}
                                                    name="email"
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Input
                                                        disabled
                                                        className="taste-input"
                                                        style={{ background: "#f8fafc", color: "#94a3b8", height: 38, borderRadius: 8 }}
                                                    />
                                                </Form.Item>
                                            ) : (
                                                <InfoItem label="Email" value={user?.email} />
                                            )}
                                        </div>



                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                {/* Sticky Footer Actions (Bitrix Style) - only shown when form is modified */}
                {(isEditing || avatarFile !== null) && (
                    <div style={{
                        padding: isMobile ? "12px 20px" : "16px 30px",
                        background: "#ffffff",
                        borderTop: "1px solid #eef2f7",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 12,
                        boxShadow: "0 -4px 12px rgba(15, 23, 42, 0.03)",
                        zIndex: 10,
                    }}>
                        <Button
                            onClick={() => {
                                form.resetFields();
                                setAvatarFile(null);
                                setPreviewUrl("");
                                setIsEditing(false);
                            }}
                            disabled={submitting}
                            className="taste-btn-cancel"
                            style={{
                                borderRadius: 8,
                                height: 38,
                                paddingInline: 22,
                                fontSize: 13,
                                borderColor: "#cbd5e1",
                                color: "#475569",
                                transition: TASTE_TRANSITION,
                            }}
                        >
                            Huỷ
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            className="taste-btn-primary"
                            icon={<EditOutlined />}
                            style={{
                                background: `linear-gradient(135deg, ${PINK} 0%, #ff4d91 100%)`,
                                borderColor: PINK,
                                borderRadius: 8,
                                height: 38,
                                paddingInline: 26,
                                fontWeight: 700,
                                fontSize: 13,
                                boxShadow: "0 4px 14px rgba(245, 49, 127, 0.16)",
                                transition: TASTE_TRANSITION,
                            }}
                        >
                            Lưu thay đổi
                        </Button>
                    </div>
                )}
            </Form>

            <AvatarLightbox
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                displayAvatar={displayAvatar}
                initials={initials}
                userName={user?.name}
                userEmail={user?.email}
                positions={positions}
                onFileSelect={(f) => {
                    setLightboxOpen(false);
                    return handleFileSelect(f);
                }}
                disabled={submitting}
            />
        </>
    );
};
