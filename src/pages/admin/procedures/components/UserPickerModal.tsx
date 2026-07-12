import React, { useEffect, useMemo, useState } from "react";
import {
    Drawer, Input, Checkbox, Avatar, Button,
    Spin, Empty, Select,
} from "antd";
import {
    SearchOutlined, CloseOutlined, CheckOutlined, TeamOutlined, UserOutlined,
} from "@ant-design/icons";
import { callFetchUsersByCompany, callFetchUsersCrossCompany, callFetchCompany, callFetchDepartmentsByCompany, callFetchSectionsByDepartment } from "@/config/api";

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
    maxSelect?: number;
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

const pickFirst = (...values: any[]) =>
    values.find((v) => typeof v === "string" && v.trim())?.trim();

const getUserId = (raw: any) => String(raw?.user?.id ?? raw?.id ?? "");
const getUserName = (raw: any) => raw?.user?.name ?? raw?.name ?? "";
const getUserEmail = (raw: any) => raw?.user?.email ?? raw?.email ?? "";
const getUserDepartment = (raw: any) =>
    pickFirst(raw?.department?.name, raw?.departmentName, raw?.departmentJobTitle?.department?.name, raw?.sectionJobTitle?.section?.department?.name);
const getUserSection = (raw: any) =>
    pickFirst(raw?.section?.name, raw?.sectionName, raw?.sectionJobTitle?.section?.name);
const getUserJobTitle = (raw: any) =>
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
const getUserLevel = (raw: any) =>
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
const getUserCompany = (raw: any) =>
    pickFirst(raw?.company?.name, raw?.companyName, raw?.companyJobTitle?.company?.name);
const formatOrgUnit = (user: UserOption) =>
    [user.section, user.department || user.company]
        .filter(Boolean)
        .join(" · ");

const UserPickerModal: React.FC<UserPickerModalProps> = ({
    open,
    onClose,
    companyId,
    selectedIds,
    onChange,
    cachedUsers, // ← nhận prop nhưng trước đây không dùng → fix ở đây
    isCrossCompany,
    maxSelect,
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
            } catch { }
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
            } catch { }
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
                    department: getUserDepartment(u),
                    section: getUserSection(u),
                    jobTitle: getUserJobTitle(u),
                    positionLevel: getUserLevel(u),
                    company: getUserCompany(u),
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
                        const uid = getUserId(p);
                        if (seen.has(uid)) return false;
                        seen.add(uid);
                        return true;
                    })
                    .map((p) => ({
                        value: getUserId(p),
                        name: getUserName(p),
                        email: getUserEmail(p),
                        department: getUserDepartment(p),
                        departmentId: p.department?.id,
                        section: getUserSection(p),
                        sectionId: p.section?.id,
                        jobTitle: getUserJobTitle(p),
                        positionLevel: getUserLevel(p),
                        company: getUserCompany(p),
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
                u.jobTitle?.toLowerCase().includes(q) ||
                u.positionLevel?.toLowerCase().includes(q) ||
                u.section?.toLowerCase().includes(q) ||
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
        if (maxSelect === 1) {
            setLocalSelected((prev) => prev.includes(id) ? [] : [id]);
            return;
        }
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
        <Drawer
            open={open}
            onClose={onClose}
            placement="right"
            width="min(800px, calc(100vw - 32px))"
            title={null}
            closable={false}
            mask
            styles={{
                mask: { background: "rgba(15, 23, 42, 0.3)", backdropFilter: "blur(2px)" },
                content: {
                    boxShadow: "-20px 0 48px rgba(15, 23, 42, 0.16)",
                    borderTopLeftRadius: 16,
                    borderBottomLeftRadius: 16,
                    overflow: "hidden",
                },
                body: {
                    padding: 0,
                    height: "100%",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    background: "#f8fafc",
                },
            }}
        >
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                background: "#fff",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 16,
                    }}>
                        <TeamOutlined />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
                            Chọn người được xem
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {isCrossCompany ? total : allUsers.length} người dùng {isCrossCompany ? "trên hệ thống" : "trong công ty"}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0",
                        background: "#f8fafc", cursor: "pointer", color: "#64748b",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
                >
                    <CloseOutlined />
                </button>
            </div>

            {/* Body */}
            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
                {/* Left panel */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", borderRight: "1px solid #e2e8f0" }}>
                    {/* Search + Filters */}
                    <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #f1f5f9", background: "#fff" }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                            placeholder="Tìm theo tên, chức danh, phòng ban..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            allowClear
                            size="middle"
                            style={{ borderRadius: 8, borderColor: "#e2e8f0", background: "#f8fafc" }}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: isCrossCompany ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8, marginTop: 10 }}>
                            {isCrossCompany && (
                                <Select
                                    placeholder="Công ty"
                                    allowClear
                                    value={selectedCompanyId}
                                    onChange={(val) => {
                                        setSelectedCompanyId(val);
                                        setSelectedDepartmentId(null);
                                        setSelectedSectionId(null);
                                        setPage(1);
                                    }}
                                    options={companies.map(c => ({ label: c.name, value: c.id }))}
                                    style={{ width: "100%" }}
                                />
                            )}
                            {(isCrossCompany ? selectedCompanyId : companyId) && (
                                <>
                                    <Select
                                        placeholder="Phòng ban"
                                        allowClear
                                        value={selectedDepartmentId}
                                        onChange={(val) => {
                                            setSelectedDepartmentId(val);
                                            setSelectedSectionId(null);
                                            setPage(1);
                                        }}
                                        options={departments.map(d => ({ label: d.name, value: d.id }))}
                                        style={{ width: "100%" }}
                                    />
                                    <Select
                                        placeholder="Bộ phận"
                                        allowClear
                                        value={selectedSectionId}
                                        onChange={(val) => { setSelectedSectionId(val); setPage(1); }}
                                        options={sections.map(s => ({ label: s.name, value: s.id }))}
                                        disabled={!selectedDepartmentId}
                                        style={{ width: "100%" }}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Select-all bar */}
                    {!loading && paginated.length > 0 && (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: maxSelect === 1 ? "flex-end" : "space-between",
                            padding: "8px 16px",
                            background: "#f8fafc",
                            borderBottom: "1px solid #f1f5f9",
                        }}>
                            {maxSelect !== 1 && (
                                <Checkbox
                                    checked={allPageSelected}
                                    indeterminate={somePageSelected}
                                    onChange={toggleAll}
                                >
                                    <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>
                                        Chọn tất cả trang này ({paginated.length})
                                    </span>
                                </Checkbox>
                            )}
                            <span style={{
                                fontSize: 11, color: "#94a3b8",
                                background: "#e2e8f0", borderRadius: 99, padding: "2px 8px", fontWeight: 500,
                            }}>
                                {isCrossCompany ? total : filtered.length} kết quả
                            </span>
                        </div>
                    )}

                    {/* User list */}
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {loading ? (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", gap: 12 }}>
                                <Spin size="default" />
                                <span style={{ fontSize: 12, color: "#94a3b8" }}>Đang tải danh sách...</span>
                            </div>
                        ) : paginated.length === 0 ? (
                            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
                                <Empty
                                    description={<span style={{ color: "#94a3b8", fontSize: 13 }}>Không tìm thấy người dùng phù hợp</span>}
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            </div>
                        ) : (
                            paginated.map((user) => {
                                const isSelected = localSelected.includes(user.value);
                                const orgUnit = formatOrgUnit(user);
                                return (
                                    <div
                                        key={user.value}
                                        onClick={() => toggle(user.value)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            padding: "11px 16px",
                                            cursor: "pointer",
                                            background: isSelected ? "#eff6ff" : "#fff",
                                            borderBottom: "1px solid #f1f5f9",
                                            transition: "background 0.1s",
                                            borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#f8fafc";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.background = isSelected ? "#eff6ff" : "#fff";
                                        }}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={() => toggle(user.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <Avatar
                                            size={36}
                                            style={{ background: getColor(user.value), flexShrink: 0, fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}
                                        >
                                            {getInitials(user.name)}
                                        </Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                                                    {user.name}
                                                </span>
                                                {user.positionLevel && (
                                                    <span style={{
                                                        padding: "1px 7px", borderRadius: 99,
                                                        background: "#eef2ff", color: "#4f46e5",
                                                        fontSize: 10, fontWeight: 700, lineHeight: "17px",
                                                        flexShrink: 0,
                                                    }}>
                                                        {user.positionLevel}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {user.jobTitle || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>Chưa có chức danh</span>}
                                            </div>
                                            {orgUnit && (
                                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {orgUnit}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <div style={{
                                                width: 20, height: 20, borderRadius: 99,
                                                background: "#3b82f6", display: "flex",
                                                alignItems: "center", justifyContent: "center", flexShrink: 0,
                                            }}>
                                                <CheckOutlined style={{ color: "#fff", fontSize: 10 }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {displayedTotalPages > 1 && (
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "10px 16px",
                            borderTop: "1px solid #f1f5f9",
                            background: "#fff",
                        }}>
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0",
                                    background: page === 1 ? "#f8fafc" : "#fff",
                                    cursor: page === 1 ? "not-allowed" : "pointer",
                                    color: page === 1 ? "#cbd5e1" : "#374151",
                                    fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >‹</button>
                            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                                Trang {page} / {displayedTotalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(displayedTotalPages, p + 1))}
                                disabled={page === displayedTotalPages}
                                style={{
                                    width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0",
                                    background: page === displayedTotalPages ? "#f8fafc" : "#fff",
                                    cursor: page === displayedTotalPages ? "not-allowed" : "pointer",
                                    color: page === displayedTotalPages ? "#cbd5e1" : "#374151",
                                    fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >›</button>
                        </div>
                    )}
                </div>

                {/* Right panel - Selected list */}
                <div style={{ width: 280, display: "flex", flexDirection: "column", background: "#f8fafc" }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 16px",
                        borderBottom: "1px solid #e2e8f0",
                        background: "#fff",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Đã chọn</span>
                            {localSelected.length > 0 && (
                                <span style={{
                                    minWidth: 20, height: 20, borderRadius: 99,
                                    background: "#3b82f6", color: "#fff",
                                    fontSize: 11, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    padding: "0 6px",
                                }}>
                                    {localSelected.length}
                                </span>
                            )}
                        </div>
                        {localSelected.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                style={{
                                    border: "none", background: "none", cursor: "pointer",
                                    color: "#ef4444", fontSize: 11, fontWeight: 500, padding: 0,
                                }}
                            >
                                Xóa tất cả
                            </button>
                        )}
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: localSelected.length === 0 ? 0 : "10px 12px" }}>
                        {localSelected.length === 0 ? (
                            <div style={{
                                height: "100%", display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                padding: "0 24px", textAlign: "center",
                            }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14,
                                    background: "#f1f5f9",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    marginBottom: 12, color: "#cbd5e1", fontSize: 22,
                                }}>
                                    <UserOutlined />
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                                    Chưa chọn ai
                                </div>
                                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                                    Tick vào người dùng bên trái để thêm vào danh sách
                                </div>
                            </div>
                        ) : (
                            selectedUsers.map((user) => {
                                const orgUnit = formatOrgUnit(user);
                                return (
                                    <div
                                        key={user.value}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            padding: "8px 10px", marginBottom: 6,
                                            border: "1px solid #e2e8f0", borderRadius: 10,
                                            background: "#fff",
                                            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                                        }}
                                    >
                                        <Avatar
                                            size={28}
                                            style={{ background: getColor(user.value), flexShrink: 0, fontSize: 10, fontWeight: 700 }}
                                        >
                                            {getInitials(user.name)}
                                        </Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {user.name}
                                                {user.positionLevel && (
                                                    <span style={{
                                                        marginLeft: 5, padding: "0 5px", borderRadius: 99,
                                                        background: "#eef2ff", color: "#4f46e5",
                                                        fontSize: 9, fontWeight: 700, lineHeight: "15px",
                                                        verticalAlign: "middle",
                                                    }}>
                                                        {user.positionLevel}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                                                {user.jobTitle || orgUnit || "—"}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggle(user.value)}
                                            title="Bỏ chọn"
                                            style={{
                                                width: 20, height: 20, borderRadius: 6,
                                                border: "1px solid #e2e8f0",
                                                background: "#f8fafc", cursor: "pointer",
                                                color: "#94a3b8",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 9, flexShrink: 0, padding: 0,
                                                transition: "all 0.1s",
                                            }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fee2e2"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5"; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; }}
                                        >
                                            <CloseOutlined />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 20px",
                borderTop: "1px solid #e2e8f0",
                background: "#fff",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {localSelected.length > 0 ? (
                        <>
                            <span style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: 22, height: 22, borderRadius: 99, background: "#3b82f6",
                                color: "#fff", fontSize: 11, fontWeight: 700,
                            }}>
                                {localSelected.length}
                            </span>
                            <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                                người đã được chọn
                            </span>
                        </>
                    ) : (
                        <span style={{ fontSize: 13, color: "#94a3b8" }}>Chưa chọn người dùng nào</span>
                    )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button
                        onClick={onClose}
                        style={{ borderRadius: 8, height: 36, paddingInline: 16, fontWeight: 500 }}
                    >
                        Huỷ
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleConfirm}
                        style={{ borderRadius: 8, height: 36, paddingInline: 16, fontWeight: 600 }}
                    >
                        Xác nhận{localSelected.length > 0 ? ` (${localSelected.length})` : ""}
                    </Button>
                </div>
            </div>
        </Drawer>
    );
};

export default UserPickerModal;
