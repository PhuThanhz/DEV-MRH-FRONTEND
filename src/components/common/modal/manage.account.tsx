import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Upload, Avatar, message, Spin } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { isMobile } from "react-device-detect";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { callUploadSingleFile, callUpdateProfile } from "@/config/api";
import { updateUserProfile } from "@/redux/slice/accountSlide";
import type { IReqUpdateProfileDTO } from "@/types/backend";
import { useUserPositionsQuery } from "@/hooks/useUserPositions";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
}

const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1
        ? parts[0][0].toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Icon SVG nhỏ theo cấp ──
const IconCompany = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#3b82f6" strokeWidth="1.4">
        <rect x="2" y="6" width="12" height="8" rx="1" />
        <path d="M5 6V4a3 3 0 016 0v2" />
    </svg>
);
const IconDepartment = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth="1.4">
        <circle cx="8" cy="4" r="2" />
        <circle cx="3" cy="12" r="1.5" />
        <circle cx="13" cy="12" r="1.5" />
        <line x1="8" y1="6" x2="8" y2="9" />
        <line x1="8" y1="9" x2="3" y2="10.5" />
        <line x1="8" y1="9" x2="13" y2="10.5" />
    </svg>
);
const IconSection = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#f97316" strokeWidth="1.4">
        <rect x="1" y="3" width="6" height="4" rx="1" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <rect x="5" y="10" width="6" height="4" rx="1" />
        <line x1="4" y1="7" x2="4" y2="10" />
        <line x1="12" y1="7" x2="12" y2="10" />
        <line x1="4" y1="10" x2="12" y2="10" />
        <line x1="8" y1="10" x2="8" y2="10" />
    </svg>
);

// ── Card 1 chức danh ──
const PositionCard = ({ record, isLast }: { record: any; isLast: boolean }) => {
    const cfgMap: Record<string, { bg: string; icon: React.ReactNode; coColor: string; dpColor: string; scColor: string }> = {
        COMPANY: { bg: "#eff6ff", icon: <IconCompany />, coColor: "#3b82f6", dpColor: "#22c55e", scColor: "#f97316" },
        DEPARTMENT: { bg: "#f0fdf4", icon: <IconDepartment />, coColor: "#3b82f6", dpColor: "#22c55e", scColor: "#f97316" },
        SECTION: { bg: "#fff7ed", icon: <IconSection />, coColor: "#3b82f6", dpColor: "#22c55e", scColor: "#f97316" },
    };
    const cfg = cfgMap[record.source] ?? cfgMap.COMPANY;

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "9px 0",
            borderBottom: isLast ? "none" : "0.5px solid rgba(0,0,0,0.06)",
        }}>
            {/* Icon dot */}
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: cfg.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
            }}>
                {cfg.icon}
            </div>

            {/* Tên + breadcrumb */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(0,0,0,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {record.jobTitle?.nameVi ?? "--"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", marginTop: 2, display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {record.company?.name && (
                        <span style={{ color: "#3b82f6" }}>{record.company.name}</span>
                    )}
                    {record.department?.name && (
                        <>
                            <span>›</span>
                            <span style={{ color: "#22c55e" }}>{record.department.name}</span>
                        </>
                    )}
                    {record.source === "SECTION" && record.section?.name && (
                        <>
                            <span>›</span>
                            <span style={{ color: "#f97316" }}>{record.section.name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Mã bậc */}
            <span style={{
                fontSize: 11, padding: "2px 7px", borderRadius: 5,
                background: "#f5f5f5", color: "#666",
                border: "0.5px solid #e8e8e8",
                fontWeight: 500, flexShrink: 0,
            }}>
                {record.jobTitle?.positionCode ?? "--"}
            </span>
        </div>
    );
};

// ── Section card wrapper ──
const SectionCard = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{
        background: "#fff",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: 12,
        padding: "1.1rem 1.25rem",
        marginBottom: 10,
    }}>
        <div style={{
            fontSize: 11, fontWeight: 500,
            color: "rgba(0,0,0,0.3)",
            textTransform: "uppercase", letterSpacing: ".07em",
            marginBottom: 14,
        }}>
            {label}
        </div>
        {children}
    </div>
);

// ── Form nội dung ──
const UserUpdateInfo = ({ onClose }: { onClose: (v: boolean) => void }) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.account.user);
    const [form] = Form.useForm();

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const currentAvatar = user?.avatar
        ? `${backendURL}/uploads/avatar/${user.avatar}`
        : "";

    const userId = user?.id ? Number(user.id) : undefined;
    const { data: positions = [], isLoading: loadingPositions } = useUserPositionsQuery(userId);

    useEffect(() => {
        return () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const handleFileSelect = (file: File): false => {
        if (!file.type.startsWith("image/")) { message.error("Vui lòng chọn file ảnh!"); return false; }
        if (file.size > 5 * 1024 * 1024) { message.error("Kích thước file không vượt quá 5MB!"); return false; }
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        return false;
    };

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            let finalAvatar = user?.avatar || "";
            if (avatarFile) {
                const uploadRes = await callUploadSingleFile(avatarFile, "AVATAR");
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

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}
            initialValues={{ name: user?.name, email: user?.email }}
            style={{ paddingTop: 8 }}
        >
            {/* ── Avatar row ── */}
            <div style={{
                display: "flex", alignItems: "center", gap: 16,
                background: "#fff",
                border: "0.5px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: "1.1rem 1.25rem",
                marginBottom: 10,
            }}>
                {/* Avatar */}
                {displayAvatar ? (
                    <Avatar size={56} src={displayAvatar}
                        style={{ border: "1.5px solid #e8e8e8", flexShrink: 0 }}
                    />
                ) : (
                    <div style={{
                        width: 56, height: 56, borderRadius: "50%",
                        background: "#f0f0f0",
                        border: "1.5px solid #e8e8e8",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 500, color: "#888",
                        flexShrink: 0,
                    }}>
                        {initials}
                    </div>
                )}

                {/* Tên + email + nút đổi ảnh */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "rgba(0,0,0,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user?.name}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", marginTop: 2 }}>
                        {user?.email}
                    </div>
                    <Upload showUploadList={false} beforeUpload={handleFileSelect} accept="image/*" multiple={false}>
                        <Button
                            size="small" icon={<UploadOutlined />} disabled={submitting}
                            style={{ marginTop: 8, fontSize: 12, borderRadius: 6, height: 26 }}
                        >
                            Đổi ảnh đại diện
                        </Button>
                    </Upload>
                    {avatarFile && (
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                            {avatarFile.name} · {(avatarFile.size / 1024).toFixed(1)} KB
                        </div>
                    )}
                </div>
            </div>

            {/* ── Fields ── */}
            <SectionCard label="Thông tin cá nhân">
                <Form.Item label="Họ và tên" name="name" style={{ marginBottom: 12 }}
                    rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
                >
                    <Input disabled={submitting} style={{ borderRadius: 8 }} />
                </Form.Item>
                <Form.Item label="Email" name="email" style={{ marginBottom: 0 }}>
                    <Input disabled style={{ borderRadius: 8, background: "#fafafa" }} />
                </Form.Item>
            </SectionCard>

            {/* ── Nút lưu ── */}
            <Button type="primary" htmlType="submit" loading={submitting} block
                style={{
                    background: "#ff85c0", borderColor: "#ff85c0",
                    borderRadius: 8, height: 40,
                    fontWeight: 500, fontSize: 13,
                    marginBottom: 10,
                }}
            >
                Lưu thay đổi
            </Button>

            {/* ── Chức danh ── */}
            <SectionCard label="Chức danh đang giữ">
                {loadingPositions ? (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <Spin size="small" />
                    </div>
                ) : positions.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "16px",
                        fontSize: 13, color: "rgba(0,0,0,0.3)",
                        border: "0.5px dashed rgba(0,0,0,0.1)",
                        borderRadius: 8,
                    }}>
                        Chưa có chức danh nào được gán
                    </div>
                ) : (
                    positions.map((record: any, idx: number) => (
                        <PositionCard
                            key={record.id}
                            record={record}
                            isLast={idx === positions.length - 1}
                        />
                    ))
                )}
            </SectionCard>
        </Form>
    );
};

// ── Modal wrapper ──
const ManageAccount = ({ open, onClose }: IProps) => {
    return (
        <Modal
            title="Quản lý tài khoản"
            open={open}
            onCancel={() => onClose(false)}
            footer={null}
            destroyOnClose
            maskClosable={false}
            width={isMobile ? "100%" : 480}
            styles={{ body: { maxHeight: "85vh", overflowY: "auto" } }}
        >
            <UserUpdateInfo onClose={onClose} />
        </Modal>
    );
};

export default ManageAccount;