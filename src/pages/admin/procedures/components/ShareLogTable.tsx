import React, { useMemo, useState } from "react";
import { Tag, Avatar, Space, Tooltip, Button, Empty, Popconfirm, Dropdown } from "antd";
import { UserOutlined, EyeOutlined, StopOutlined, MoreOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { ProColumns } from "@ant-design/pro-components";

import {
    useSentShareLogQuery,
    useReceivedShareLogQuery,
    useAllShareLogQuery,
    useRevokeProcedureAccessMutation,
} from "@/hooks/useProcedure";
import { callFetchCompany, callFetchDepartmentsByCompany } from "@/config/api";
import type { IShareLogDTO, ICompany, IDepartment } from "@/types/backend";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import type { FilterField } from "@/components/common/filter/AdvancedFilterSelect";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface IProps {
    mode: "sent" | "received" | "audit";
    open?: boolean;
    onViewProcedure?: (procedureId: number) => void;
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const statusMap: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "green" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "gold" },
    TERMINATED: { label: "Hết hiệu lực", color: "red" },
};

// ─────────────────────────────────────────────
// SUB COMPONENTS
// ─────────────────────────────────────────────
const UserCell = ({ name, email, role }: { name?: string; email?: string; role?: string }) => (
    <Space size={8} align="start">
        <Avatar
            size={28}
            icon={<UserOutlined />}
            style={{
                background: "var(--color-background-info)",
                color: "var(--color-text-info)",
                fontSize: 11,
                flexShrink: 0,
            }}
        />
        <div style={{ minWidth: 0 }}>
            <div style={{
                fontWeight: 500, fontSize: 12,
                color: "var(--color-text-primary)", lineHeight: "17px",
                overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap", maxWidth: 140,
            }}>
                {name ?? "—"}
            </div>
            {role && (
                <div style={{ fontSize: 11, color: "var(--color-text-info)", lineHeight: "15px" }}>
                    {role}
                </div>
            )}
            <div style={{
                fontSize: 11, color: "var(--color-text-secondary)", lineHeight: "15px",
                overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap", maxWidth: 140,
            }}>
                {email ?? ""}
            </div>
        </div>
    </Space>
);

const TimeCell = ({ sentAt }: { sentAt?: string }) =>
    sentAt ? (
        <Tooltip title={dayjs(sentAt).format("DD/MM/YYYY HH:mm:ss")}>
            <div style={{ fontSize: 12, color: "var(--color-text-primary)" }}>
                {dayjs(sentAt).format("DD/MM/YYYY")}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                {dayjs(sentAt).format("HH:mm")}
            </div>
        </Tooltip>
    ) : (
        <span style={{ color: "var(--color-text-tertiary)" }}>—</span>
    );

// ─────────────────────────────────────────────
// BUILD COLUMNS
// ─────────────────────────────────────────────
const buildColumns = (
    mode: "sent" | "received" | "audit",
    currentPage: number,
    pageSize: number,
    onViewProcedure?: (id: number) => void,
    onRevoke?: (procedureId: number, userId: string, userName: string) => void,
    revokingKey?: string | null,
): ProColumns<IShareLogDTO>[] => {
    const columns: ProColumns<IShareLogDTO>[] = [
        {
            title: "STT",
            width: 52,
            align: "center",
            render: (_, __, index) => (
                <span style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>
                    {(currentPage - 1) * pageSize + index + 1}
                </span>
            ),
        },
        {
            title: "Mã quy trình",
            width: 130,
            align: "center",
            render: (_, record) => (
                <Tag color="purple" style={{ fontSize: 11, borderRadius: 4 }}>
                    {record.procedureCode ?? "—"}
                </Tag>
            ),
        },
        {
            title: "Tên quy trình",
            render: (_, record) => (
                <span style={{ fontSize: 12, color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {record.procedureName ?? "—"}
                </span>
            ),
        },
        {
            title: "Trạng thái",
            width: 140,
            align: "center",
            render: (_, record) => {
                const s = statusMap[record.procedureStatus ?? ""] ?? {
                    label: record.procedureStatus || "—",
                    color: "default",
                };
                return <Tag color={s.color}>{s.label}</Tag>;
            },
        },
    ];

    if (mode === "sent") {
        columns.push({
            title: "Người nhận",
            width: 190,
            render: (_, r) => (
                <UserCell name={r.receiverName} email={r.receiverEmail} role={r.receiverRole} />
            ),
        });
    }

    if (mode === "received") {
        columns.push({
            title: "Người gửi",
            width: 190,
            render: (_, r) => (
                <UserCell name={r.senderName} email={r.senderEmail} role={r.senderRole} />
            ),
        });
    }

    if (mode === "audit") {
        columns.push(
            {
                title: "Người gửi",
                width: 190,
                render: (_, r) => (
                    <UserCell name={r.senderName} email={r.senderEmail} role={r.senderRole} />
                ),
            },
            {
                title: "Người nhận",
                width: 190,
                render: (_, r) => (
                    <UserCell name={r.receiverName} email={r.receiverEmail} role={r.receiverRole} />
                ),
            },
            {
                title: "Loại hành động",
                width: 130,
                align: "center",
                render: (_, record) => {
                    if (record.action === "SHARE") return <Tag color="green">Chia sẻ</Tag>;
                    if (record.action === "REVOKE") return <Tag color="red">Thu hồi</Tag>;
                    return <Tag>—</Tag>;
                },
            },
        );
    }

    columns.push({
        title: "Thời gian",
        width: 110,
        align: "center",
        render: (_, record) => <TimeCell sentAt={record.sentAt} />,
    });

    // ─────────────────────────────────────────────
    // CỘT HÀNH ĐỘNG — đồng bộ với ProcedureTable:
    // - Icon mắt (EyeOutlined) để xem chi tiết
    // - Dropdown (⋯) chứa các action còn lại (Thu hồi)
    // ─────────────────────────────────────────────
    const hasActions = onViewProcedure || (mode === "sent" && onRevoke);

    if (hasActions) {
        const actionColumn: ProColumns<IShareLogDTO> = {
            title: "Hành động",
            width: mode === "sent" ? 100 : 72,
            align: "center",
            fixed: "right",
            render: (_, record: IShareLogDTO) => {
                const revokeKey = `${record.procedureId}-${record.receiverId}`;
                const isRevoking = revokingKey === revokeKey;

                // Dropdown items — chỉ có Thu hồi ở tab Đã gửi
                const menuItems = [];

                if (mode === "sent" && record.action === "SHARE" && onRevoke) {
                    menuItems.push({
                        key: "revoke",
                        icon: <StopOutlined style={{ color: "#ef4444" }} />,
                        label: (
                            <Popconfirm
                                title="Thu hồi quyền truy cập"
                                description={
                                    <span>
                                        Bạn có chắc muốn thu hồi quyền của{" "}
                                        <b>{record.receiverName}</b>?
                                    </span>
                                }
                                onConfirm={() =>
                                    onRevoke(record.procedureId, record.receiverId, record.receiverName)
                                }
                                okText="Thu hồi"
                                cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                            >
                                <span style={{ color: "#ef4444" }}>Thu hồi quyền</span>
                            </Popconfirm>
                        ),
                    });
                }

                return (
                    <Space size="small">
                        {/* Nút Xem — giống ProcedureTable */}
                        {onViewProcedure && (
                            <Tooltip title="Xem quy trình">
                                <EyeOutlined
                                    style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                                    onClick={() => onViewProcedure(record.procedureId)}
                                />
                            </Tooltip>
                        )}

                        {/* Dropdown ⋯ — chỉ hiện nếu có ít nhất 1 item */}
                        {menuItems.length > 0 && (
                            <Dropdown
                                menu={{ items: menuItems }}
                                trigger={["click"]}
                                disabled={isRevoking}
                            >
                                <MoreOutlined
                                    style={{
                                        fontSize: 20,
                                        cursor: isRevoking ? "not-allowed" : "pointer",
                                        opacity: isRevoking ? 0.5 : 1,
                                    }}
                                />
                            </Dropdown>
                        )}
                    </Space>
                );
            },
        };

        columns.push(actionColumn);
    }

    return columns;
};

// ─────────────────────────────────────────────
// FILTER FIELDS BUILDER
// ─────────────────────────────────────────────
const buildFilterFields = (includeAction = false): FilterField[] => {
    const fields: FilterField[] = [
        {
            key: "companyId",
            label: "Công ty",
            asyncOptions: async () => {
                const res = await callFetchCompany("page=1&size=500&sort=name,asc");
                const list: ICompany[] = (res?.data as any)?.result ?? [];
                return list.map((c) => ({ label: c.name, value: c.id, color: "blue" }));
            },
        },
        {
            key: "departmentId",
            label: "Phòng ban",
            dependsOn: "companyId",
            asyncOptions: async (parentCompanyId: number) => {
                if (!parentCompanyId) return [];
                const res = await callFetchDepartmentsByCompany(parentCompanyId);
                const list: IDepartment[] = (res?.data as any) ?? [];
                return list.map((d) => ({ label: d.name, value: d.id, color: "cyan" }));
            },
        },
        {
            key: "status",
            label: "Trạng thái",
            options: [
                { label: "Cần xây dựng mới", value: "NEED_CREATE", color: "orange" },
                { label: "Đang hiệu lực", value: "IN_PROGRESS", color: "green" },
                { label: "Đang cập nhật", value: "NEED_UPDATE", color: "gold" },
                { label: "Hết hiệu lực", value: "TERMINATED", color: "red" },
            ],
        },
    ];

    if (includeAction) {
        fields.push({
            key: "action",
            label: "Loại hành động",
            options: [
                { label: "Chia sẻ", value: "SHARE", color: "green" },
                { label: "Thu hồi", value: "REVOKE", color: "red" },
            ],
        });
    }

    return fields;
};

// ─────────────────────────────────────────────
// SENT & RECEIVED TABLE
// ─────────────────────────────────────────────
const SentReceivedTable: React.FC<{
    mode: "sent" | "received";
    open: boolean;
    onViewProcedure?: (id: number) => void;
}> = ({ mode, open, onViewProcedure }) => {
    const [searchValue, setSearchValue] = useState("");
    const [companyIdFilter, setCompanyIdFilter] = useState<number | null>(null);
    const [departmentIdFilter, setDepartmentIdFilter] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [resetSignal, setResetSignal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [revokingKey, setRevokingKey] = useState<string | null>(null);
    const pageSize = 10;

    const sentQuery = useSentShareLogQuery(open && mode === "sent");
    const receivedQuery = useReceivedShareLogQuery(open && mode === "received");
    const revokeMutation = useRevokeProcedureAccessMutation();

    const query = mode === "sent" ? sentQuery : receivedQuery;
    const { data: rawData = [], isFetching } = query;

    const filterFields = useMemo(() => buildFilterFields(false), []);

    // ─────────────────────────────────────────────
    // REVOKE HANDLER
    // Dùng chung callRevokeProcedureAccess (DELETE /api/v1/procedures/{id}/access/{userId})
    // Backend sẽ:
    //   1. Xoá access record
    //   2. Ghi log REVOKE vào ProcedureShareLog
    // → Audit log tự động cập nhật sau khi revoke ✅
    // ─────────────────────────────────────────────
    const handleRevoke = async (procedureId: number, userId: string, _userName: string) => {
        const key = `${procedureId}-${userId}`;
        setRevokingKey(key);
        try {
            await revokeMutation.mutateAsync({ id: procedureId, userId });
            // useRevokeProcedureAccessMutation đã invalidate:
            // - share-log-sent → tab Đã gửi tự refresh (dòng bị xoá)
            // - share-log-all  → tab Audit tự cập nhật (thêm dòng REVOKE)
        } finally {
            setRevokingKey(null);
        }
    };

    const filteredData = useMemo(
        () =>
            rawData.filter((item: IShareLogDTO) => {
                if (mode === "sent" && item.action !== "SHARE") return false;

                const matchSearch =
                    !searchValue ||
                    (item.procedureName || "").toLowerCase().includes(searchValue.toLowerCase()) ||
                    (item.procedureCode || "").toLowerCase().includes(searchValue.toLowerCase()) ||
                    (mode === "sent"
                        ? (item.receiverName || "").toLowerCase().includes(searchValue.toLowerCase()) ||
                        (item.receiverEmail || "").toLowerCase().includes(searchValue.toLowerCase())
                        : (item.senderName || "").toLowerCase().includes(searchValue.toLowerCase()) ||
                        (item.senderEmail || "").toLowerCase().includes(searchValue.toLowerCase())
                    );
                const matchCompany = !companyIdFilter || item.companyId === companyIdFilter;
                const matchDept = !departmentIdFilter || item.departmentId === departmentIdFilter;
                const matchStatus = !statusFilter || item.procedureStatus === statusFilter;

                return matchSearch && matchCompany && matchDept && matchStatus;
            }),
        [rawData, searchValue, companyIdFilter, departmentIdFilter, statusFilter, mode],
    );

    const hasActiveFilter = !!(searchValue || companyIdFilter || departmentIdFilter || statusFilter);

    const handleReset = () => {
        setSearchValue("");
        setCompanyIdFilter(null);
        setDepartmentIdFilter(null);
        setStatusFilter(null);
        setCurrentPage(1);
        setResetSignal((s) => s + 1);
    };

    const columns = useMemo(
        () => buildColumns(mode, currentPage, pageSize, onViewProcedure, handleRevoke, revokingKey),
        [mode, currentPage, pageSize, onViewProcedure, revokingKey],
    );

    return (
        <>
            <div className="flex flex-col gap-3 mb-4">
                <SearchFilter
                    // ✅ SỬA THÀNH
                    searchPlaceholder={
                        mode === "sent"
                            ? "Tìm theo tên quy trình, mã hoặc tên người nhận..."
                            : "Tìm theo tên quy trình, mã hoặc tên người gửi..."
                    }
                    showAddButton={false}
                    showFilterButton={false}
                    onSearch={(val) => { setSearchValue(val); setCurrentPage(1); }}
                    onReset={handleReset}
                />
                <AdvancedFilterSelect
                    resetSignal={resetSignal}
                    fields={filterFields}
                    onChange={(filters) => {
                        setCompanyIdFilter(filters.companyId ?? null);
                        setDepartmentIdFilter(filters.departmentId ?? null);
                        setStatusFilter(filters.status ?? null);
                        setCurrentPage(1);
                    }}
                />
            </div>

            <DataTable<IShareLogDTO>
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={filteredData}
                scroll={{ x: "max-content" }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                hasActiveFilter
                                    ? "Không tìm thấy kết quả phù hợp với bộ lọc"
                                    : mode === "sent"
                                        ? "Bạn chưa chia sẻ quy trình nào"
                                        : "Chưa có quy trình nào được chia sẻ với bạn"
                            }
                        >
                            {hasActiveFilter && (
                                <Button size="small" onClick={handleReset}>Xóa bộ lọc</Button>
                            )}
                        </Empty>
                    ),
                }}
                pagination={{
                    current: currentPage,
                    pageSize,
                    showSizeChanger: false,
                    showTotal: (total) => (
                        <span style={{ fontSize: 12 }}>Tổng <b>{total}</b> bản ghi</span>
                    ),
                    onChange: (page) => setCurrentPage(page),
                }}
                rowSelection={false}
            />
        </>
    );
};

// ─────────────────────────────────────────────
// AUDIT TABLE (admin)
// ─────────────────────────────────────────────
const AuditTable: React.FC<{
    open: boolean;
    onViewProcedure?: (id: number) => void;
}> = ({ open, onViewProcedure }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValue, setSearchValue] = useState("");
    const [companyIdFilter, setCompanyIdFilter] = useState<number | null>(null);
    const [departmentIdFilter, setDepartmentIdFilter] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [actionFilter, setActionFilter] = useState<string | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const queryString = useMemo(() => {
        const params = new URLSearchParams({
            page: String(page),
            size: String(pageSize),
            sort: "sentAt,desc",
        });
        if (searchValue) params.set("search", searchValue);
        if (companyIdFilter) params.set("companyId", String(companyIdFilter));
        if (departmentIdFilter) params.set("departmentId", String(departmentIdFilter));
        if (statusFilter) params.set("status", statusFilter);
        if (actionFilter) params.set("action", actionFilter);
        return params.toString();
    }, [page, pageSize, searchValue, companyIdFilter, departmentIdFilter, statusFilter, actionFilter]);

    const { data, isFetching } = useAllShareLogQuery(queryString, open);
    const list = data?.result ?? [];
    const meta = data?.meta ?? { total: 0, page: 1, pageSize: 10 };

    const filterFields = useMemo(() => buildFilterFields(true), []);

    const columns = useMemo(
        () => buildColumns("audit", page, pageSize, onViewProcedure),
        [page, pageSize, onViewProcedure],
    );

    const hasActiveFilter = !!(searchValue || companyIdFilter || departmentIdFilter || statusFilter || actionFilter);

    const handleReset = () => {
        setSearchValue("");
        setCompanyIdFilter(null);
        setDepartmentIdFilter(null);
        setStatusFilter(null);
        setActionFilter(null);
        setPage(1);
        setResetSignal((s) => s + 1);
    };

    return (
        <>
            <div className="flex flex-col gap-3 mb-4">
                <SearchFilter
                    searchPlaceholder="Tìm theo tên hoặc mã quy trình..."
                    showAddButton={false}
                    showFilterButton={false}
                    onSearch={(val) => { setSearchValue(val); setPage(1); }}
                    onReset={handleReset}
                />
                <AdvancedFilterSelect
                    resetSignal={resetSignal}
                    fields={filterFields}
                    onChange={(filters) => {
                        setCompanyIdFilter(filters.companyId ?? null);
                        setDepartmentIdFilter(filters.departmentId ?? null);
                        setStatusFilter(filters.status ?? null);
                        setActionFilter(filters.action ?? null);
                        setPage(1);
                    }}
                />
            </div>

            <DataTable<IShareLogDTO>
                rowKey="id"
                loading={isFetching}
                columns={columns}
                dataSource={list}
                scroll={{ x: "max-content" }}
                locale={{
                    emptyText: (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                hasActiveFilter
                                    ? "Không tìm thấy kết quả phù hợp với bộ lọc"
                                    : "Chưa có lịch sử chia sẻ nào"
                            }
                        >
                            {hasActiveFilter && (
                                <Button size="small" onClick={handleReset}>Xóa bộ lọc</Button>
                            )}
                        </Empty>
                    ),
                }}
                pagination={{
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total) => (
                        <span style={{ fontSize: 12 }}>Tổng <b>{total}</b> bản ghi</span>
                    ),
                    onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                }}
                rowSelection={false}
            />
        </>
    );
};

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
const ShareLogTable: React.FC<IProps> = ({ mode, open = true, onViewProcedure }) => (
    <div>
        {mode === "audit" ? (
            <AuditTable open={open} onViewProcedure={onViewProcedure} />
        ) : (
            <SentReceivedTable mode={mode} open={open} onViewProcedure={onViewProcedure} />
        )}
    </div>
);

export default ShareLogTable;