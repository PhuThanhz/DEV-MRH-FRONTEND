import React, { useEffect, useMemo, useState } from "react";
import {
    Modal, Input, Checkbox, Avatar, Badge, Button,
    Spin, Empty, Tag, Tooltip,
} from "antd";
import {
    SearchOutlined, UserOutlined, CloseOutlined, CheckOutlined,
} from "@ant-design/icons";
import { callFetchUsersByCompany } from "@/config/api";

interface UserOption {
    value: number;
    name: string;
    email: string;
    department?: string;
    avatar?: string;
}

interface UserPickerModalProps {
    open: boolean;
    onClose: () => void;
    companyId: number | null;
    selectedIds: number[];
    onChange: (ids: number[]) => void;
}

const PAGE_SIZE = 10;

const UserPickerModal: React.FC<UserPickerModalProps> = ({
    open,
    onClose,
    companyId,
    selectedIds,
    onChange,
}) => {
    const [search, setSearch] = useState("");
    const [allUsers, setAllUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [localSelected, setLocalSelected] = useState<number[]>([]);

    // Load users khi mở modal
    useEffect(() => {
        if (!open || !companyId) return;
        setLocalSelected(selectedIds);
        setSearch("");
        setPage(1);
        loadUsers();
    }, [open, companyId]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await callFetchUsersByCompany(companyId!);
            const positions: any[] = res?.data ?? [];
            const seen = new Set<number>();
            const users: UserOption[] = positions
                .filter((p) => {
                    const uid = p.user?.id ?? p.id;
                    if (seen.has(uid)) return false;
                    seen.add(uid);
                    return true;
                })
                .map((p) => ({
                    value: p.user?.id ?? p.id,
                    name: p.user?.name ?? p.name ?? "",
                    email: p.user?.email ?? p.email ?? "",
                    department: p.department?.name,
                }));
            setAllUsers(users);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return allUsers;
        return allUsers.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.department?.toLowerCase().includes(q)
        );
    }, [allUsers, search]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const toggle = (id: number) => {
        setLocalSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        const pageIds = paginated.map((u) => u.value);
        const allSelected = pageIds.every((id) => localSelected.includes(id));
        if (allSelected) {
            setLocalSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
        } else {
            setLocalSelected((prev) => [...new Set([...prev, ...pageIds])]);
        }
    };

    const handleConfirm = () => {
        onChange(localSelected);
        onClose();
    };

    const handleClearAll = () => setLocalSelected([]);

    const selectedUsers = allUsers.filter((u) => localSelected.includes(u.value));
    const pageIds = paginated.map((u) => u.value);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => localSelected.includes(id));
    const somePageSelected = pageIds.some((id) => localSelected.includes(id)) && !allPageSelected;

    const getInitials = (name: string) =>
        name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();

    const AVATAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
    const getColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={680}
            title={null}
            closable={false}
            styles={{
                content: { padding: 0, borderRadius: 16, overflow: "hidden" },
                mask: { backdropFilter: "blur(2px)" },
            }}
        >
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 20px 14px",
                borderBottom: "1px solid #f3f4f6",
            }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                        Chọn người được xem
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                        {allUsers.length} người dùng trong công ty
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: 32, height: 32, borderRadius: 8, border: "none",
                        background: "#f3f4f6", cursor: "pointer", color: "#6b7280",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14,
                    }}
                >
                    <CloseOutlined />
                </button>
            </div>

            <div style={{ display: "flex", height: 460 }}>
                {/* Left: danh sách */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #f3f4f6" }}>
                    {/* Search */}
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                            placeholder="Tìm theo tên, email, phòng ban..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            allowClear
                            style={{ borderRadius: 8, borderColor: "#e5e7eb" }}
                        />
                    </div>

                    {/* Select all row */}
                    {!loading && paginated.length > 0 && (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "8px 16px",
                            background: "#fafafa",
                            borderBottom: "1px solid #f3f4f6",
                        }}>
                            <Checkbox
                                checked={allPageSelected}
                                indeterminate={somePageSelected}
                                onChange={toggleAll}
                            >
                                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                                    Trang này ({paginated.length})
                                </span>
                            </Checkbox>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                {filtered.length} kết quả
                            </span>
                        </div>
                    )}

                    {/* List */}
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {loading ? (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                                <Spin />
                            </div>
                        ) : paginated.length === 0 ? (
                            <Empty description="Không tìm thấy người dùng" style={{ marginTop: 60 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            paginated.map((user) => {
                                const isSelected = localSelected.includes(user.value);
                                return (
                                    <div
                                        key={user.value}
                                        onClick={() => toggle(user.value)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            padding: "10px 16px",
                                            cursor: "pointer",
                                            background: isSelected ? "#eff6ff" : "transparent",
                                            borderBottom: "1px solid #f9fafb",
                                            transition: "background 0.12s",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#f9fafb";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.background = isSelected ? "#eff6ff" : "transparent";
                                        }}
                                    >
                                        <Checkbox checked={isSelected} onChange={() => toggle(user.value)} onClick={(e) => e.stopPropagation()} />
                                        <Avatar
                                            size={34}
                                            style={{ background: getColor(user.value), flexShrink: 0, fontSize: 12, fontWeight: 600 }}
                                        >
                                            {getInitials(user.name)}
                                        </Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", lineHeight: 1.3 }}>
                                                {user.name}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {user.email}
                                                {user.department && (
                                                    <span style={{ marginLeft: 6, color: "#d1d5db" }}>·</span>
                                                )}
                                                {user.department && (
                                                    <span style={{ marginLeft: 6, color: "#6b7280" }}>{user.department}</span>
                                                )}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <CheckOutlined style={{ color: "#3b82f6", fontSize: 13, flexShrink: 0 }} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "10px 16px",
                            borderTop: "1px solid #f3f4f6",
                        }}>
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb",
                                    background: page === 1 ? "#f9fafb" : "#fff",
                                    cursor: page === 1 ? "not-allowed" : "pointer",
                                    color: page === 1 ? "#d1d5db" : "#374151",
                                    fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >‹</button>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{
                                    width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb",
                                    background: page === totalPages ? "#f9fafb" : "#fff",
                                    cursor: page === totalPages ? "not-allowed" : "pointer",
                                    color: page === totalPages ? "#d1d5db" : "#374151",
                                    fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >›</button>
                        </div>
                    )}
                </div>

                {/* Right: đã chọn */}
                <div style={{ width: 220, display: "flex", flexDirection: "column" }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px",
                        borderBottom: "1px solid #f3f4f6",
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                            Đã chọn
                        </span>
                        {localSelected.length > 0 && (
                            <Badge
                                count={localSelected.length}
                                style={{ background: "#3b82f6", fontSize: 11, height: 18, lineHeight: "18px", minWidth: 18 }}
                            />
                        )}
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                        {localSelected.length === 0 ? (
                            <div style={{ textAlign: "center", marginTop: 40, color: "#d1d5db", fontSize: 12 }}>
                                Chưa chọn ai
                            </div>
                        ) : (
                            selectedUsers.map((user) => (
                                <div
                                    key={user.value}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        padding: "7px 14px",
                                        borderRadius: 0,
                                    }}
                                >
                                    <Avatar
                                        size={26}
                                        style={{ background: getColor(user.value), flexShrink: 0, fontSize: 10, fontWeight: 600 }}
                                    >
                                        {getInitials(user.name)}
                                    </Avatar>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {user.name}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggle(user.value)}
                                        style={{
                                            width: 18, height: 18, borderRadius: 4, border: "none",
                                            background: "#fee2e2", cursor: "pointer", color: "#ef4444",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 10, flexShrink: 0, padding: 0,
                                        }}
                                    >
                                        <CloseOutlined />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {localSelected.length > 0 && (
                        <div style={{ padding: "8px 14px", borderTop: "1px solid #f3f4f6" }}>
                            <button
                                onClick={handleClearAll}
                                style={{
                                    width: "100%", padding: "5px 0", borderRadius: 6,
                                    border: "1px solid #fee2e2", background: "#fff",
                                    color: "#ef4444", fontSize: 12, cursor: "pointer",
                                    fontWeight: 500,
                                }}
                            >
                                Xoá tất cả
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderTop: "1px solid #f3f4f6",
                background: "#fafafa",
            }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {localSelected.length > 0
                        ? `Đã chọn ${localSelected.length} người`
                        : "Chưa chọn người dùng nào"}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button onClick={onClose} style={{ borderRadius: 8, height: 36 }}>
                        Huỷ
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleConfirm}
                        style={{ borderRadius: 8, height: 36, fontWeight: 500 }}
                    >
                        Xác nhận {localSelected.length > 0 && `(${localSelected.length})`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default UserPickerModal;