import React, { useEffect, useState } from "react";
import { Form, Tag, Avatar, Tooltip, Typography } from "antd";
import { UserOutlined, InfoCircleOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import UserPickerModal from "./UserPickerModal";
import { callFetchUsersByCompany, callFetchUsersCrossCompany } from "@/config/api";

const { Text } = Typography;

interface UserSelectFieldProps {
    companyId: number | null;
    selectedUserCount: number;
    onCountChange: (count: number) => void;
    isCrossCompany?: boolean;
    name?: string;
    label?: string;
    accentColor?: string;
    emptyText?: string;
}

interface UserOption {
    value: string;
    name: string;
    email: string;
    department?: string;
    departmentId?: number;
    section?: string;
    sectionId?: number;
    jobTitle?: string;
    positionLevel?: string;
    company?: string;
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

const pickFirst = (...values: any[]) =>
    values.find((v) => typeof v === "string" && v.trim())?.trim();

const getUserMeta = (user?: UserOption) =>
    [user?.jobTitle, user?.positionLevel, user?.section, user?.department || user?.company]
        .filter(Boolean)
        .join(" · ");

const getJobTitle = (raw: any) =>
    pickFirst(
        raw?.jobTitle,
        raw?.jobTitleName,
        raw?.jobTitle?.nameVi,
        raw?.jobTitle?.nameEn,
        raw?.jobTitle?.name,
        raw?.companyJobTitle?.jobTitle?.name,
        raw?.companyJobTitle?.jobTitle?.nameVi,
        raw?.departmentJobTitle?.jobTitle?.name,
        raw?.departmentJobTitle?.jobTitle?.nameVi,
        raw?.sectionJobTitle?.jobTitle?.name,
        raw?.sectionJobTitle?.jobTitle?.nameVi
    );

const getPositionLevel = (raw: any) =>
    pickFirst(
        raw?.positionLevel,
        raw?.positionLevelCode,
        raw?.levelCode,
        raw?.jobTitle?.positionCode,
        raw?.positionLevel?.code,
        raw?.companyJobTitle?.jobTitle?.positionLevel?.code,
        raw?.departmentJobTitle?.jobTitle?.positionLevel?.code,
        raw?.sectionJobTitle?.jobTitle?.positionLevel?.code,
        raw?.jobTitle?.band,
        raw?.jobTitle?.levelNumber ? `Cấp ${raw.jobTitle.levelNumber}` : undefined,
        raw?.levelNumber ? `Cấp ${raw.levelNumber}` : undefined
    );

const UserSelectField: React.FC<UserSelectFieldProps> = ({
    companyId,
    selectedUserCount,
    onCountChange,
    isCrossCompany,
    name = "userIds",
    label = "Người được xem",
    accentColor = "#ef4444",
    emptyText = "Nhấn để chọn người được xem...",
}) => {
    const form = Form.useFormInstance();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [userMap, setUserMap] = useState<Map<string, UserOption>>(new Map());
    const [loadingMap, setLoadingMap] = useState(false);

    const selectedIds: string[] = Form.useWatch(name, form) ?? [];

    // ✅ FIX CHÍNH: Load userMap ngay khi companyId có giá trị (hoặc isCrossCompany = true)
    // Không chờ user bấm mở picker → fix bug hiển thị UUID khi edit
    useEffect(() => {
        if (!isCrossCompany && !companyId) {
            setUserMap(new Map());
            return;
        }
        const load = async () => {
            setLoadingMap(true);
            try {
                if (isCrossCompany) {
                    const res = await callFetchUsersCrossCompany("page=1&size=9999");
                    const users = res?.data?.result ?? [];
                    const map = new Map<string, UserOption>();
                    users.forEach((u) => {
                        const user = u as any;
                        const uid = String(u.id);
                        map.set(uid, {
                            value: uid,
                            name: u.name ?? "",
                            email: u.email ?? "",
                            department: pickFirst(user.departmentName),
                            section: pickFirst(user.sectionName),
                            jobTitle: getJobTitle(user),
                            positionLevel: getPositionLevel(user),
                            company: pickFirst(user.companyName),
                        });
                    });
                    setUserMap(map);
                } else {
                    const res = await callFetchUsersByCompany(companyId!);
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
                                department: pickFirst(p.department?.name, p.departmentName, p.departmentJobTitle?.department?.name, p.sectionJobTitle?.section?.department?.name),
                                departmentId: p.department?.id,
                                section: pickFirst(p.section?.name, p.sectionName, p.sectionJobTitle?.section?.name),
                                sectionId: p.section?.id,
                                jobTitle: getJobTitle(p),
                                positionLevel: getPositionLevel(p),
                                company: pickFirst(p.company?.name, p.companyName, p.companyJobTitle?.company?.name),
                            });
                        }
                    });
                    setUserMap(map);
                }
            } catch {
                // ignore
            } finally {
                setLoadingMap(false);
            }
        };
        load();
    }, [companyId, isCrossCompany]); // re-load khi đổi công ty hoặc cờ crossCompany

    const handleChange = (ids: string[]) => {
        form.setFieldValue(name, ids);
        onCountChange(ids.length);
    };

    const removeUser = (id: string) => {
        const next = selectedIds.filter((x) => x !== id);
        form.setFieldValue(name, next);
        onCountChange(next.length);
    };

    const handleOpen = () => {
        setPickerOpen(true);
    };

    return (
        <>
            <Form.Item name={name} hidden />

            <Form.Item
                label={
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <UserOutlined style={{ color: accentColor, fontSize: 13 }} />
                        <span style={{ fontWeight: 500, color: "#111827" }}>{label}</span>
                        {selectedUserCount > 0 && (
                            <Tag
                                color={accentColor}
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
                    (!isCrossCompany && !companyId) ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <InfoCircleOutlined style={{ marginRight: 4 }} />
                            Chọn công ty để thêm người dùng
                        </Text>
                    ) : null
                }
                style={{ marginBottom: 0 }}
            >
                <div
                    onClick={() => (isCrossCompany || companyId) && !loadingMap && handleOpen()}
                    style={{
                        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
                        minHeight: 40, maxHeight: 96, overflowY: "auto",
                        padding: "6px 10px",
                        border: "1px solid #e5e7eb", borderRadius: 8,
                        cursor: (isCrossCompany || companyId) && !loadingMap ? "pointer" : "not-allowed",
                        background: (isCrossCompany || companyId) ? "#fff" : "#f9fafb",
                        transition: "border-color 0.15s",
                        opacity: loadingMap ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if ((isCrossCompany || companyId) && !loadingMap)
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
                            {(isCrossCompany || companyId) ? emptyText : "Vui lòng chọn công ty trước"}
                        </span>
                    ) : (
                        <>
                            {selectedIds.map((id) => {
                                const user = userMap.get(id);
                                const name = user?.name ?? (loadingMap ? "..." : `User #${id.slice(0, 6)}`);
                                const meta = getUserMeta(user);
                                return (
                                    <Tooltip key={id} title={meta || name}>
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
                isCrossCompany={isCrossCompany}
            />
        </>
    );
};

export default UserSelectField;
