import React, { useEffect, useState } from "react";
import { Form, Tag, Avatar, Tooltip, Typography } from "antd";
import { UserOutlined, InfoCircleOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import UserPickerModal from "./UserPickerModal";
import { callFetchUsersByCompany } from "@/config/api";

const { Text } = Typography;

interface UserSelectFieldProps {
    companyId: number | null;
    selectedUserCount: number;
    onCountChange: (count: number) => void;
}

interface UserOption {
    value: string;
    name: string;
    email: string;
    department?: string;
}

const AVATAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const getColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();

const UserSelectField: React.FC<UserSelectFieldProps> = ({
    companyId,
    selectedUserCount,
    onCountChange,
}) => {
    const form = Form.useFormInstance();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [userMap, setUserMap] = useState<Map<string, UserOption>>(new Map());
    const [loadingMap, setLoadingMap] = useState(false);

    const selectedIds: string[] = Form.useWatch("userIds", form) ?? [];

    // ✅ FIX CHÍNH: Load userMap ngay khi companyId có giá trị
    // Không chờ user bấm mở picker → fix bug hiển thị UUID khi edit
    useEffect(() => {
        if (!companyId) {
            setUserMap(new Map());
            return;
        }
        const load = async () => {
            setLoadingMap(true);
            try {
                const res = await callFetchUsersByCompany(companyId);
                const positions: any[] = res?.data ?? [];
                const seen = new Set<string>();
                const map = new Map<string, UserOption>();
                positions.forEach((p) => {
                    const uid = String(p.user?.id ?? p.id);
                    if (!seen.has(uid)) {
                        seen.add(uid);
                        map.set(uid, {
                            value: uid,
                            name: p.user?.name ?? p.name ?? "",
                            email: p.user?.email ?? p.email ?? "",
                            department: p.department?.name,
                        });
                    }
                });
                setUserMap(map);
            } catch {
                // ignore
            } finally {
                setLoadingMap(false);
            }
        };
        load();
    }, [companyId]); // re-load khi đổi công ty

    const handleChange = (ids: string[]) => {
        form.setFieldValue("userIds", ids);
        onCountChange(ids.length);
    };

    const removeUser = (id: string) => {
        const next = selectedIds.filter((x) => x !== id);
        form.setFieldValue("userIds", next);
        onCountChange(next.length);
    };

    const handleOpen = () => {
        setPickerOpen(true);
    };

    return (
        <>
            <Form.Item name="userIds" hidden />

            <Form.Item
                label={
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <UserOutlined style={{ color: "#ef4444", fontSize: 13 }} />
                        <span style={{ fontWeight: 500, color: "#111827" }}>Người được xem</span>
                        {selectedUserCount > 0 && (
                            <Tag
                                color="red"
                                style={{
                                    fontSize: 11, borderRadius: 999,
                                    padding: "0 8px", lineHeight: "20px", border: "none",
                                }}
                            >
                                {selectedUserCount} người
                            </Tag>
                        )}
                    </span>
                }
                extra={
                    !companyId ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <InfoCircleOutlined style={{ marginRight: 4 }} />
                            Chọn công ty để thêm người dùng
                        </Text>
                    ) : null
                }
                style={{ marginBottom: 0 }}
            >
                <div
                    onClick={() => companyId && !loadingMap && handleOpen()}
                    style={{
                        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8,
                        minHeight: 40, padding: "8px 12px",
                        border: "1px solid #e5e7eb", borderRadius: 8,
                        cursor: companyId && !loadingMap ? "pointer" : "not-allowed",
                        background: companyId ? "#fff" : "#f9fafb",
                        transition: "border-color 0.15s",
                        opacity: loadingMap ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if (companyId && !loadingMap)
                            (e.currentTarget as HTMLElement).style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
                    }}
                >
                    {loadingMap ? (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>Đang tải danh sách...</span>
                    ) : selectedIds.length === 0 ? (
                        <span style={{ color: "#9ca3af", fontSize: 13 }}>
                            {companyId ? "Nhấn để chọn người được xem..." : "Vui lòng chọn công ty trước"}
                        </span>
                    ) : (
                        <>
                            {selectedIds.slice(0, 6).map((id) => {
                                const user = userMap.get(id);
                                // ✅ FIX: nếu chưa có trong map thì hiện "Đang tải..."
                                // thay vì hiện UUID
                                const name = user?.name ?? (loadingMap ? "..." : `User #${id.slice(0, 6)}`);
                                return (
                                    <Tooltip key={id} title={user?.email ?? id}>
                                        <Tag
                                            style={{
                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                padding: "2px 8px 2px 4px",
                                                borderRadius: 999, margin: 0,
                                                border: "1px solid #e5e7eb",
                                                background: "#f9fafb",
                                                fontSize: 12, fontWeight: 500,
                                            }}
                                            closeIcon={
                                                <CloseOutlined
                                                    style={{ fontSize: 10, color: "#9ca3af" }}
                                                    onClick={(e) => { e.stopPropagation(); removeUser(id); }}
                                                />
                                            }
                                            closable
                                            onClose={(e) => { e.preventDefault(); removeUser(id); }}
                                        >
                                            <Avatar
                                                size={18}
                                                style={{
                                                    background: getColor(id),
                                                    fontSize: 9, fontWeight: 700, flexShrink: 0,
                                                }}
                                            >
                                                {getInitials(name)}
                                            </Avatar>
                                            {name}
                                        </Tag>
                                    </Tooltip>
                                );
                            })}
                            {selectedIds.length > 6 && (
                                <Tag style={{
                                    borderRadius: 999, fontSize: 12,
                                    background: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8",
                                }}>
                                    +{selectedIds.length - 6} người
                                </Tag>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpen(); }}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "2px 8px", borderRadius: 999,
                                    border: "1px dashed #d1d5db", background: "transparent",
                                    color: "#6b7280", fontSize: 12, cursor: "pointer",
                                }}
                            >
                                <PlusOutlined style={{ fontSize: 10 }} /> Thêm
                            </button>
                        </>
                    )}
                </div>
            </Form.Item>

            <UserPickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                companyId={companyId}
                selectedIds={selectedIds}
                onChange={handleChange}
                // ✅ Truyền userMap xuống để picker không phải load lại
                cachedUsers={userMap}
            />
        </>
    );
};

export default UserSelectField;