/**
 * manage.account.tsx — Light edition (updated)
 * - HeroBanner: light/white theme (bỏ dark)
 * - Bỏ "HĐ hết hạn"
 * - Bỏ "ID: x" trong Vai trò
 * - Fix nút "Đổi ảnh" dùng Ant Button thay native button
 */

import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Upload, message, Spin } from "antd";
import { UploadOutlined, EditOutlined } from "@ant-design/icons";
import { isMobile } from "react-device-detect";
import dayjs from "dayjs";

import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { callUploadSingleFile, callUpdateProfile } from "@/config/api";
import { updateUserProfile } from "@/redux/slice/accountSlide";
import type { IUserInfo } from "@/redux/slice/accountSlide";
import type { IReqUpdateProfileDTO } from "@/types/backend";
import { useUserPositionsQuery } from "@/hooks/useUserPositions";

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
}

/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const PINK = "#f5317f";
const PINK_LIGHT = "#fff0f6";
const PINK_BORDER = "rgba(245,49,127,0.2)";

const SOURCE_CFG = {
    COMPANY: {
        bg: "#EEF4FF", border: "#c7d9fd", color: "#4a7fef",
        icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4a7fef" strokeWidth="1.6">
                <rect x="2" y="6" width="12" height="8" rx="1" /><path d="M5 6V4a3 3 0 016 0v2" />
            </svg>
        ),
    },
    DEPARTMENT: {
        bg: "#EDFAF4", border: "#a5e6cc", color: "#3EBF8F",
        icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#3EBF8F" strokeWidth="1.6">
                <circle cx="8" cy="4" r="2" /><circle cx="3" cy="12" r="1.5" /><circle cx="13" cy="12" r="1.5" />
                <line x1="8" y1="6" x2="8" y2="9" /><line x1="8" y1="9" x2="3" y2="10.5" /><line x1="8" y1="9" x2="13" y2="10.5" />
            </svg>
        ),
    },
    SECTION: {
        bg: "#FFF4EE", border: "#fcc7a8", color: "#F08050",
        icon: (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#F08050" strokeWidth="1.6">
                <rect x="1" y="3" width="6" height="4" rx="1" /><rect x="9" y="3" width="6" height="4" rx="1" />
                <rect x="5" y="10" width="6" height="4" rx="1" />
                <line x1="4" y1="7" x2="4" y2="10" /><line x1="12" y1="7" x2="12" y2="10" /><line x1="4" y1="10" x2="12" y2="10" />
            </svg>
        ),
    },
} as const;

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
const getInitials = (name?: string) => {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};
const formatDate = (v?: string | null) => v ? dayjs(v).format("DD/MM/YYYY") : "—";
const genderLabel = (g?: string | null) => ({ MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" }[g ?? ""] ?? "—");

/* ═══════════════════════════════════════════
   SUB: AvatarLightbox
═══════════════════════════════════════════ */
interface AvatarLightboxProps {
    open: boolean; onClose: () => void;
    displayAvatar: string; initials: string;
    userName?: string; userEmail?: string;
    onFileSelect: (f: File) => false; disabled?: boolean;
}
const AvatarLightbox = ({ open, onClose, displayAvatar, initials, userName, userEmail, onFileSelect, disabled }: AvatarLightboxProps) => (
    <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={260}
        maskClosable
        closable={false}
        styles={{
            content: {
                borderRadius: 18,
                padding: 0,
                overflow: "hidden",
                boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
            },
            mask: { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.25)" },
        }}
    >
        <div style={{ padding: "24px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            {/* Nút X */}
            <button
                onClick={onClose}
                style={{
                    position: "absolute", top: 10, right: 10,
                    width: 24, height: 24, borderRadius: "50%",
                    border: "1px solid #e5e7eb", background: "#f9fafb",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 11, color: "#6b7280",
                    lineHeight: 1, padding: 0,
                }}
            >
                ✕
            </button>

            {/* Avatar */}
            {displayAvatar
                ? <img
                    src={displayAvatar}
                    alt="avatar"
                    style={{
                        width: 100, height: 100,
                        borderRadius: "50%", objectFit: "cover",
                        border: `3px solid ${PINK_BORDER}`,
                        boxShadow: "0 6px 20px rgba(245,49,127,0.15)",
                    }}
                />
                : <div style={{
                    width: 100, height: 100,
                    borderRadius: "50%",
                    background: `linear-gradient(145deg,#ff9dc4,${PINK})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 36, fontWeight: 700, color: "#fff",
                    boxShadow: "0 6px 20px rgba(245,49,127,0.2)",
                }}>
                    {initials}
                </div>
            }

            {/* Name & email */}
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: "#111827", textAlign: "center" }}>
                {userName}
            </div>
            <div style={{ marginTop: 2, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
                {userEmail}
            </div>

            {/* Divider */}
            <div style={{ width: 32, height: 1, background: "#f3f4f6", margin: "12px 0" }} />

            {/* Upload button */}
            <Upload showUploadList={false} beforeUpload={onFileSelect} accept="image/*" multiple={false}>
                <Button
                    disabled={disabled}
                    icon={<UploadOutlined />}
                    size="small"
                    style={{
                        borderRadius: 8, height: 32, fontSize: 12,
                        minWidth: 170, borderColor: "#e5e7eb", color: "#374151",
                    }}
                >
                    Tải ảnh mới lên
                </Button>
            </Upload>
        </div>
    </Modal>
);

/* ═══════════════════════════════════════════
   SUB: HeroBanner — LIGHT THEME
═══════════════════════════════════════════ */
interface HeroBannerProps {
    displayAvatar: string; initials: string;
    userName?: string; userEmail?: string; positionCount: number;
    onAvatarClick: () => void; onFileSelect: (f: File) => false; disabled?: boolean;
}
const HeroBanner = ({ displayAvatar, initials, userName, userEmail, positionCount, onAvatarClick, onFileSelect, disabled }: HeroBannerProps) => {
    const [hover, setHover] = useState(false);
    return (
        <div style={{
            background: "linear-gradient(135deg, #fff0f6 0%, #fce7f3 100%)",
            border: `1px solid ${PINK_BORDER}`,
            borderRadius: 14,
            padding: "18px 20px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
        }}>
            {/* Subtle decorative blob */}
            <div style={{
                position: "absolute", top: -30, right: -30,
                width: 120, height: 120, borderRadius: "50%",
                background: "rgba(245,49,127,0.07)",
                pointerEvents: "none",
            }} />

            {/* Avatar */}
            <div
                style={{ position: "relative", flexShrink: 0, cursor: "pointer", zIndex: 1 }}
                onClick={onAvatarClick}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {displayAvatar
                    ? <img src={displayAvatar} alt="avatar" style={{
                        width: 60, height: 60, borderRadius: "50%", objectFit: "cover",
                        border: `2px solid ${PINK_BORDER}`,
                        transition: "transform .2s",
                        transform: hover ? "scale(1.06)" : "scale(1)",
                        display: "block",
                        boxShadow: "0 4px 14px rgba(245,49,127,0.18)",
                    }} />
                    : <div style={{
                        width: 60, height: 60, borderRadius: "50%",
                        background: `linear-gradient(145deg,#ff9dc4,${PINK})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 700, color: "#fff",
                        border: `2px solid ${PINK_BORDER}`,
                        transition: "transform .2s",
                        transform: hover ? "scale(1.06)" : "scale(1)",
                        boxShadow: "0 4px 14px rgba(245,49,127,0.18)",
                    }}>{initials}</div>
                }
                {/* Camera overlay */}
                <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "rgba(245,49,127,0.55)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: hover ? 1 : 0, transition: "opacity .15s",
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                </div>
                {/* Online dot */}
                <div style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 10, height: 10, borderRadius: "50%",
                    background: "#3EBF8F", border: "2px solid #fce7f3",
                }} />
            </div>

            {/* Info */}
            <div style={{ zIndex: 1, flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 17, fontWeight: 700, color: "#111827",
                    letterSpacing: "-0.02em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{userName}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{userEmail}</div>
                <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
                    <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 20,
                        border: `1px solid ${PINK_BORDER}`, color: PINK,
                        background: "rgba(245,49,127,0.08)",
                    }}>{positionCount} chức danh</span>
                    <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 20,
                        border: "1px solid rgba(62,191,143,.35)", color: "#3EBF8F",
                        background: "rgba(62,191,143,.10)",
                    }}>● Đang hoạt động</span>
                </div>
            </div>

            {/* Đổi ảnh button — dùng Ant Upload + Button để trigger đúng */}
            <div style={{ zIndex: 1, flexShrink: 0 }}>
                <Upload
                    showUploadList={false}
                    beforeUpload={onFileSelect}
                    accept="image/*"
                    multiple={false}
                >
                    <Button
                        disabled={disabled}
                        icon={
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        }
                        style={{
                            display: "flex", alignItems: "center", gap: 4,
                            fontSize: 11, borderRadius: 20, height: 28,
                            paddingInline: 12,
                            border: `1px solid ${PINK_BORDER}`,
                            background: "#fff",
                            color: PINK,
                            boxShadow: "0 2px 8px rgba(245,49,127,0.10)",
                        }}
                    >
                        Đổi ảnh
                    </Button>
                </Upload>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════
   SUB: InfoItem
═══════════════════════════════════════════ */
const InfoItem = ({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 9, background: "#f9fafb", border: "1px solid #f0f0f5" }}>
        {icon && <span style={{ color: "#9ca3af", flexShrink: 0, display: "flex" }}>{icon}</span>}
        <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, color: "#9ca3af", letterSpacing: ".07em", textTransform: "uppercase" as const }}>{label}</div>
            <div style={{ fontSize: 12.5, fontWeight: value ? 500 : 400, color: value ? "#111827" : "#d1d5db", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</div>
        </div>
    </div>
);

/* ═══════════════════════════════════════════
   SUB: PositionCard
═══════════════════════════════════════════ */
const PositionCard = ({ record }: { record: any }) => {
    const cfg = SOURCE_CFG[record.source as keyof typeof SOURCE_CFG] ?? SOURCE_CFG.COMPANY;
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "8px 10px", borderRadius: 9,
                border: `1px solid ${hovered ? "#e5e7eb" : "#f3f4f6"}`,
                background: hovered ? "#fff" : "#fafafa",
                transition: "all .15s",
                transform: hovered ? "translateX(3px)" : "none",
                cursor: "default",
            }}
        >
            <div style={{
                width: 30, height: 30, borderRadius: 7,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>{cfg.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.jobTitle?.nameVi ?? "—"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2, flexWrap: "wrap" }}>
                    {record.company?.name && <span style={{ fontSize: 10, color: "#4a7fef" }}>{record.company.name}</span>}
                    {record.department?.name && <><span style={{ fontSize: 10, color: "#d1d5db" }}>›</span><span style={{ fontSize: 10, color: "#3EBF8F" }}>{record.department.name}</span></>}
                    {record.source === "SECTION" && record.section?.name && <><span style={{ fontSize: 10, color: "#d1d5db" }}>›</span><span style={{ fontSize: 10, color: "#F08050" }}>{record.section.name}</span></>}
                </div>
            </div>
            <span style={{
                fontSize: 9.5, padding: "1px 6px", borderRadius: 5,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                color: cfg.color, fontWeight: 600, flexShrink: 0, fontFamily: "monospace",
            }}>{record.jobTitle?.positionCode ?? "—"}</span>
        </div>
    );
};

/* ═══════════════════════════════════════════
   SUB: SectionLabel
═══════════════════════════════════════════ */
const SectionLabel = ({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "#9ca3af" }}>{children}</span>
        {extra}
    </div>
);

/* ═══════════════════════════════════════════
   MAIN: UserUpdateInfo
═══════════════════════════════════════════ */
const UserUpdateInfo = ({ onClose }: { onClose: (v: boolean) => void }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((s) => s.account.user);
    const [form] = Form.useForm();

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const currentAvatar = user?.avatar ? `${backendURL}/uploads/avatar/${user.avatar}?t=${Date.now()}` : "";
    const userId = user?.id ? Number(user.id) : undefined;

    const { data: positions = [], isLoading: loadingPositions } = useUserPositionsQuery(userId);

    useEffect(() => () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

    const handleFileSelect = (file: File): false => {
        if (!file.type.startsWith("image/")) { message.error("Vui lòng chọn file ảnh!"); return false; }
        if (file.size > 5 * 1024 * 1024) { message.error("Kích thước tối đa 5MB!"); return false; }
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
                else { message.error("Upload ảnh thất bại!"); return; }
            }
            const payload: IReqUpdateProfileDTO = { name: values.name, avatar: finalAvatar };
            const res = await callUpdateProfile(payload);
            if (res?.data) {
                dispatch(updateUserProfile(res.data));
                message.success("Cập nhật thành công!");
                onClose(false);
            } else {
                message.error("Cập nhật thất bại!");
            }
        } catch (err: any) {
            message.error(err?.response?.data?.message || "Đã xảy ra lỗi!");
        } finally {
            setSubmitting(false);
        }
    };

    const displayAvatar = previewUrl || currentAvatar;
    const initials = getInitials(user?.name);
    const info: IUserInfo | null | undefined = user?.userInfo;

    return (
        <>
            <Form form={form} layout="vertical" onFinish={handleSubmit}
                initialValues={{ name: user?.name, email: user?.email }}>

                {/* ── Hero (light) ── */}
                <HeroBanner
                    displayAvatar={displayAvatar} initials={initials}
                    userName={user?.name} userEmail={user?.email}
                    positionCount={positions.length}
                    onAvatarClick={() => setLightboxOpen(true)}
                    onFileSelect={handleFileSelect}
                    disabled={submitting}
                />

                {/* ── 2-col body ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

                    {/* ──────── LEFT ──────── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Thông tin cá nhân — bỏ "HĐ hết hạn" */}
                        <div>
                            <SectionLabel>Thông tin cá nhân</SectionLabel>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                <InfoItem label="Mã NV" value={info?.employeeCode}
                                    icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2" /><line x1="5" y1="8" x2="11" y2="8" /><line x1="5" y1="5" x2="11" y2="5" /><line x1="5" y1="11" x2="8" y2="11" /></svg>}
                                />
                                <InfoItem label="Giới tính" value={genderLabel(info?.gender)}
                                    icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="6" r="3.5" /><line x1="8" y1="9.5" x2="8" y2="13.5" /><line x1="6" y1="11.5" x2="10" y2="11.5" /></svg>}
                                />
                                <InfoItem label="Ngày sinh" value={formatDate(info?.dateOfBirth)}
                                    icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5" /><line x1="5" y1="1.5" x2="5" y2="4.5" /><line x1="11" y1="1.5" x2="11" y2="4.5" /><line x1="2" y1="7" x2="14" y2="7" /></svg>}
                                />
                                <InfoItem label="Điện thoại" value={info?.phone}
                                    icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 10.5c0 .28-.06.55-.19.8-.13.25-.31.48-.54.67-.38.34-.8.5-1.25.5-.31 0-.65-.08-1-.24a10.7 10.7 0 01-1-.54 16.8 16.8 0 01-.96-.75 16.5 16.5 0 01-.75-.96 10.5 10.5 0 01-.54-1C6.57 8.65 6.5 8.31 6.5 7.98c0-.44.15-.86.46-1.23.31-.37.69-.55 1.1-.55.16 0 .32.03.46.1.15.07.28.17.38.31L9.86 8c.1.14.15.3.15.45 0 .19-.06.37-.17.54l-.42.48-.17.2c-.05.07-.08.14-.08.2l.03.12.07.12.88 1.46.1.09.12.03c.06 0 .13-.03.2-.08l.2-.17c.15-.17.31-.3.49-.41.17-.1.35-.16.54-.16.16 0 .31.04.45.12.14.08.25.19.33.33l1.08 1.52c.1.14.14.3.14.48z" /></svg>}
                                />
                                <InfoItem label="Vào làm" value={formatDate(info?.startDate)}
                                    icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5" /><line x1="5" y1="1.5" x2="5" y2="4.5" /><line x1="11" y1="1.5" x2="11" y2="4.5" /><line x1="2" y1="7" x2="14" y2="7" /><path d="M6 10l1.5 1.5L10 9" /></svg>}
                                />
                                <InfoItem label="Ký HĐ" value={formatDate(info?.contractSignDate)}
                                    icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5l-3-3z" /><polyline points="10 2 10 5 13 5" /><line x1="5" y1="9" x2="11" y2="9" /><line x1="5" y1="12" x2="8" y2="12" /></svg>}
                                />
                                {/* ĐÃ XOÁ: HĐ hết hạn */}
                            </div>
                        </div>

                        {/* Chức danh */}
                        <div>
                            <SectionLabel extra={
                                <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                                    {positions.length} vị trí
                                </span>
                            }>
                                Chức danh
                            </SectionLabel>
                            {loadingPositions ? (
                                <div style={{ textAlign: "center", padding: "12px 0" }}><Spin size="small" /></div>
                            ) : positions.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "12px", fontSize: 12, color: "#d1d5db", border: "1px dashed #e5e7eb", borderRadius: 9 }}>
                                    Chưa có chức danh nào
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                    {positions.map((r: any) => <PositionCard key={r.id} record={r} />)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ──────── RIGHT ──────── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Form chỉnh sửa */}
                        <div>
                            <SectionLabel>Chỉnh sửa thông tin</SectionLabel>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <Form.Item
                                    label={<span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".07em" }}>Họ và tên</span>}
                                    name="name"
                                    style={{ marginBottom: 0 }}
                                    rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
                                >
                                    <Input disabled={submitting} style={{ borderRadius: 9, fontSize: 13, height: 38, borderColor: "#e5e7eb" }} />
                                </Form.Item>
                                <Form.Item
                                    label={<span style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".07em" }}>Email</span>}
                                    name="email"
                                    style={{ marginBottom: 0 }}
                                >
                                    <Input disabled style={{ borderRadius: 9, fontSize: 13, height: 38, background: "#f9fafb", borderColor: "#f0f0f0", color: "#9ca3af" }} />
                                </Form.Item>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button
                                onClick={() => onClose(false)}
                                disabled={submitting}
                                style={{ borderRadius: 9, height: 38, fontSize: 13, borderColor: "#e5e7eb", color: "#6b7280" }}
                            >
                                Huỷ
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                icon={<EditOutlined />}
                                style={{
                                    flex: 1, background: PINK, borderColor: PINK,
                                    borderRadius: 9, height: 38, fontWeight: 600, fontSize: 13,
                                    boxShadow: "0 4px 14px rgba(245,49,127,0.25)",
                                }}
                            >
                                Lưu thay đổi
                            </Button>
                        </div>

                        {/* Vai trò — BỎ ID */}
                        <div style={{ padding: "12px 14px", borderRadius: 11, background: PINK_LIGHT, border: `1px solid ${PINK_BORDER}` }}>
                            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase" as const, color: PINK, marginBottom: 8 }}>Vai trò</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 9,
                                    background: "#fff", border: `1px solid ${PINK_BORDER}`,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={PINK} strokeWidth="1.6">
                                        <circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                                    </svg>
                                </div>
                                <div>
                                    {/* ĐÃ XOÁ: ID dòng bên dưới */}
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{user?.role?.name || "—"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>

            <AvatarLightbox
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                displayAvatar={displayAvatar}
                initials={initials}
                userName={user?.name}
                userEmail={user?.email}
                onFileSelect={(f) => { setLightboxOpen(false); return handleFileSelect(f); }}
                disabled={submitting}
            />
        </>
    );
};

/* ═══════════════════════════════════════════
   ROOT EXPORT: ManageAccount
═══════════════════════════════════════════ */
const ManageAccount = ({ open, onClose }: IProps) => (
    <Modal
        title={
            <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: ".12em", textTransform: "uppercase" }}>
                Tài khoản
            </span>
        }
        open={open}
        onCancel={() => onClose(false)}
        footer={null}
        destroyOnClose
        maskClosable={false}
        width={isMobile ? "100%" : 800}
        styles={{
            body: { padding: "0 24px 24px", maxHeight: "82vh", overflowY: "auto" },
            content: { borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" },
            header: { padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6" },
            mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.18)" },
        }}
    >
        <style>{`
            .ant-modal-body::-webkit-scrollbar { width: 4px; }
            .ant-modal-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        `}</style>
        <UserUpdateInfo onClose={onClose} />
    </Modal>
);

export default ManageAccount;