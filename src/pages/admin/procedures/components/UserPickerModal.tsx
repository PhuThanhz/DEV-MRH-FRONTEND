import React, { useEffect, useMemo, useState } from "react";
import {
    Modal, Input, Checkbox, Avatar, Badge, Button,
    Spin, Empty, Select,
} from "antd";
import {
    SearchOutlined, CloseOutlined, CheckOutlined,
} from "@ant-design/icons";
import { callFetchUsersByCompany, callFetchUsersCrossCompany, callFetchCompany, callFetchDepartmentsByCompany, callFetchSectionsByDepartment } from "@/config/api";

interface UserOption {
    value: string;
    name: string;
    email: string;
    department?: string;
    departmentId?: number;
    sectionId?: number;
    avatar?: string;
}

interface UserPickerModalProps {
    open: boolean;
    onClose: () => void;
    companyId: number | null;
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    cachedUsers?: Map<string, UserOption>;
    isCrossCompany?: boolean;
}

const PAGE_SIZE = 10;

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

const UserPickerModal: React.FC<UserPickerModalProps> = ({
    open,
    onClose,
    companyId,
    selectedIds,
    onChange,
    cachedUsers, // ← nhận prop nhưng trước đây không dùng → fix ở đây
    isCrossCompany,
}) => {
    const [search, setSearch] = useState("");
    const [allUsers, setAllUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [localSelected, setLocalSelected] = useState<string[]>([]);

    const [companies, setCompanies] = useState<any[]>([]); // Danh sách công ty cho dropdown
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null); // Công ty đang chọn để lọc
    
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

    const [total, setTotal] = useState(0); // Tổng số kết quả từ backend
    const [totalPages, setTotalPages] = useState(0); // Tổng số trang từ backend

    // Reset states when modal is opened
    useEffect(() => {
        if (!open) return;
        setLocalSelected(selectedIds);
        setSearch("");
        setPage(1);
        setSelectedCompanyId(null);
        setSelectedDepartmentId(null);
        setSelectedSectionId(null);
    }, [open]);

    // Load companies when cross-company is true and modal is open
    useEffect(() => {
        if (!open || !isCrossCompany) return;
        const fetchCompanies = async () => {
            try {
                const res = await callFetchCompany("page=1&size=100");
                setCompanies(res?.data?.result ?? []);
            } catch {
                // ignore
            }
        };
        fetchCompanies();
    }, [open, isCrossCompany]);

    const effectiveCompanyId = isCrossCompany ? selectedCompanyId : companyId;

    // Load departments when company changes
    useEffect(() => {
        if (!open || !effectiveCompanyId) {
            setDepartments([]);
            setSelectedDepartmentId(null);
            return;
        }
        const fetchDepts = async () => {
            try {
                const res = await callFetchDepartmentsByCompany(effectiveCompanyId);
                setDepartments(res?.data ?? []);
            } catch {}
        };
        fetchDepts();
    }, [open, effectiveCompanyId]);

    // Load sections when department changes
    useEffect(() => {
        if (!open || !selectedDepartmentId) {
            setSections([]);
            setSelectedSectionId(null);
            return;
        }
        const fetchSections = async () => {
            try {
                const res = await callFetchSectionsByDepartment(selectedDepartmentId);
                setSections(res?.data ?? []);
            } catch {}
        };
        fetchSections();
    }, [open, selectedDepartmentId]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            if (isCrossCompany) {
                // Chuẩn bị query params gửi lên Backend
                let query = `page=${page}&size=${PAGE_SIZE}`;
                if (search.trim()) {
                    query += `&search=${encodeURIComponent(search.trim())}`;
                }
                if (selectedCompanyId) {
                    query += `&companyId=${selectedCompanyId}`;
                }
                if (selectedDepartmentId) {
                    query += `&departmentId=${selectedDepartmentId}`;
                }
                if (selectedSectionId) {
                    query += `&sectionId=${selectedSectionId}`;
                }

                // Gọi API mới
                const res = await callFetchUsersCrossCompany(query);
                
                // Map kết quả
                const users: UserOption[] = (res?.data?.result ?? []).map((u) => ({
                    value: String(u.id),
                    name: u.name ?? "",
                    email: u.email ?? "",
                    department: u.departmentName ?? u.companyName, // Hiển thị phòng ban hoặc tên công ty
                }));
                
                setAllUsers(users);
                
                // Cập nhật thông tin phân trang từ Backend
                if (res?.data?.meta) {
                    setTotal(res.data.meta.total);
                    setTotalPages(res.data.meta.pages);
                }
            } else {
                // Giữ nguyên logic tải user theo công ty hiện tại (Non cross-company)
                const res = await callFetchUsersByCompany(companyId!);
                const positions: any[] = res?.data ?? [];
                const seen = new Set<string>();
                const users: UserOption[] = positions
                    .filter((p) => {
                        const uid = String(p.user?.id ?? p.id);
                        if (seen.has(uid)) return false;
                        seen.add(uid);
                        return true;
                    })
                    .map((p) => ({
                        value: String(p.user?.id ?? p.id),
                        name: p.user?.name ?? p.name ?? "",
                        email: p.user?.email ?? p.email ?? "",
                        department: p.department?.name,
                        departmentId: p.department?.id,
                        sectionId: p.section?.id,
                    }));
                setAllUsers(users);
                setTotal(users.length);
                setTotalPages(Math.ceil(users.length / PAGE_SIZE));
            }
        } finally {
            setLoading(false);
        }
    };

    // Load users based on dependencies
    useEffect(() => {
        if (!open) return;
        if (!isCrossCompany && !companyId) return;

        // If not cross-company and cachedUsers is available, use it (avoid duplicate API call)
        if (!isCrossCompany && cachedUsers && cachedUsers.size > 0 && allUsers.length === 0) {
            const users = Array.from(cachedUsers.values());
            setAllUsers(users);
            setTotal(users.length);
            setTotalPages(Math.ceil(users.length / PAGE_SIZE));
            return;
        }

        loadUsers();
    }, [open, page, search, selectedCompanyId, companyId, isCrossCompany, selectedDepartmentId, selectedSectionId]);

    const filtered = useMemo(() => {
        let list = allUsers;
        if (!isCrossCompany) {
            if (selectedDepartmentId) {
                list = list.filter((u) => u.departmentId === selectedDepartmentId);
            }
            if (selectedSectionId) {
                list = list.filter((u) => u.sectionId === selectedSectionId);
            }
        }
        
        if (isCrossCompany) {
            return list;
        }
        
        const q = search.toLowerCase().trim();
        if (!q) return list;
        return list.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.department?.toLowerCase().includes(q)
        );
    }, [allUsers, search, isCrossCompany, selectedDepartmentId, selectedSectionId]);

    const paginated = useMemo(() => {
        if (isCrossCompany) {
            return filtered;
        }
        return filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    }, [filtered, page, isCrossCompany]);

    const displayedTotalPages = isCrossCompany ? totalPages : Math.ceil(filtered.length / PAGE_SIZE);

    const toggle = (id: string) => {
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

    // ✅ FIX: selectedUsers lấy từ allUsers (đã có tên đầy đủ)
    // Nếu user không có trong allUsers (vd: user bị xoá khỏi công ty)
    // thì fallback về cachedUsers để vẫn hiện tên thay vì UUID
    const selectedUsers = localSelected.map((id) => {
        const fromList = allUsers.find((u) => u.value === id);
        if (fromList) return fromList;
        const fromCache = cachedUsers?.get(id);
        if (fromCache) return fromCache;
        return { value: id, name: `User #${id.slice(0, 6)}`, email: id, department: undefined };
    });

    const pageIds = paginated.map((u) => u.value);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => localSelected.includes(id));
    const somePageSelected = pageIds.some((id) => localSelected.includes(id)) && !allPageSelected;

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
                        {isCrossCompany ? total : allUsers.length} người dùng {isCrossCompany ? "trên hệ thống" : "trong công ty"}
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
                {/* Left: danh sách chọn */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #f3f4f6" }}>
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

                    {isCrossCompany && (
                        <div style={{ padding: "8px 16px", borderBottom: "1px solid #f3f4f6" }}>
                            <Select
                                placeholder="Lọc theo công ty"
                                allowClear
                                style={{ width: "100%" }}
                                value={selectedCompanyId}
                                onChange={(val) => {
                                    setSelectedCompanyId(val);
                                    setSelectedDepartmentId(null);
                                    setSelectedSectionId(null);
                                    setPage(1); // Reset về trang 1 khi đổi bộ lọc
                                }}
                                options={companies.map(c => ({ label: c.name, value: c.id }))}
                            />
                        </div>
                    )}
                    
                    {(isCrossCompany ? selectedCompanyId : companyId) && (
                        <div style={{ padding: "8px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 8 }}>
                            <Select
                                placeholder="Lọc theo phòng ban"
                                allowClear
                                style={{ flex: 1 }}
                                value={selectedDepartmentId}
                                onChange={(val) => {
                                    setSelectedDepartmentId(val);
                                    setSelectedSectionId(null);
                                    setPage(1);
                                }}
                                options={departments.map(d => ({ label: d.name, value: d.id }))}
                            />
                            <Select
                                placeholder="Lọc theo bộ phận"
                                allowClear
                                style={{ flex: 1 }}
                                value={selectedSectionId}
                                onChange={(val) => {
                                    setSelectedSectionId(val);
                                    setPage(1);
                                }}
                                options={sections.map(s => ({ label: s.name, value: s.id }))}
                                disabled={!selectedDepartmentId}
                            />
                        </div>
                    )}

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
                                {isCrossCompany ? total : filtered.length} kết quả
                            </span>
                        </div>
                    )}

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
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={() => toggle(user.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
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
                                                {user.department && <span style={{ marginLeft: 6, color: "#d1d5db" }}>·</span>}
                                                {user.department && <span style={{ marginLeft: 6, color: "#6b7280" }}>{user.department}</span>}
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

                    {displayedTotalPages > 1 && (
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
                            <span style={{ fontSize: 12, color: "#6b7280" }}>{page} / {displayedTotalPages}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(displayedTotalPages, p + 1))}
                                disabled={page === displayedTotalPages}
                                style={{
                                    width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb",
                                    background: page === displayedTotalPages ? "#f9fafb" : "#fff",
                                    cursor: page === displayedTotalPages ? "not-allowed" : "pointer",
                                    color: page === displayedTotalPages ? "#d1d5db" : "#374151",
                                    fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >›</button>
                        </div>
                    )}
                </div>

                {/* Right: đã chọn — hiện tên đầy đủ nhờ selectedUsers đã fix */}
                <div style={{ width: 220, display: "flex", flexDirection: "column" }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px",
                        borderBottom: "1px solid #f3f4f6",
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Đã chọn</span>
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
                                        <div style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {user.email !== user.value ? user.email : ""}
                                        </div>
                                    </div>
                                    {/* Bỏ người này khỏi danh sách = thu hồi quyền khi save */}
                                    <button
                                        onClick={() => toggle(user.value)}
                                        title="Bỏ khỏi danh sách (sẽ thu hồi quyền khi lưu)"
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
                    <Button onClick={onClose} style={{ borderRadius: 8, height: 36 }}>Huỷ</Button>
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