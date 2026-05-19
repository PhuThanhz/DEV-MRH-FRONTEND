import React, { useEffect, useState } from "react";
import { Modal, Input, Table, Select } from "antd";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import { callFetchUsersCrossCompany, callFetchCompany } from "@/config/api";

interface ManagerPickerModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (user: { id: string; name: string; departmentName?: string; companyName?: string }) => void;
    title?: string;
    description?: string;
}

const PAGE_SIZE = 10;
const ACCENT = "#f5317f";
const ACCENT_SOFT = "#fff0f6";

const ManagerPickerModal: React.FC<ManagerPickerModalProps> = ({ open, onClose, onSelect, title, description }) => {
    const [search, setSearch] = useState("");
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Fetch company options
    useEffect(() => {
        if (!open) return;
        callFetchCompany("page=1&size=100&sort=name,asc")
            .then((res: any) => {
                setCompanies(res?.data?.result ?? []);
            })
            .catch(() => { });
    }, [open]);

    // Fetch users (managers)
    const loadUsers = async () => {
        setLoading(true);
        try {
            let query = `page=${page}&size=${PAGE_SIZE}`;
            if (search.trim()) {
                query += `&search=${encodeURIComponent(search.trim())}`;
            }
            if (selectedCompanyId) {
                query += `&companyId=${selectedCompanyId}`;
            }

            const res = await callFetchUsersCrossCompany(query);
            setUsers(res?.data?.result ?? []);
            setTotal(res?.data?.meta?.total ?? 0);
        } catch (err) {
            console.error("ManagerPickerModal - Failed to fetch managers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadUsers();
        }
    }, [open, page, search, selectedCompanyId]);

    const handleSelect = (record: any) => {
        onSelect({
            id: record.id,
            name: record.name,
            departmentName: record.departmentName,
            companyName: record.companyName,
        });
        onClose();
    };

    const columns = [
        {
            title: "Mã nhân viên",
            dataIndex: "employeeCode",
            key: "employeeCode",
            width: 140,
            render: (code: string) => code ? (
                <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: 12,
                    fontWeight: 600,
                    border: "1px solid #bfdbfe"
                }}>
                    {code}
                </span>
            ) : (
                <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "#f3f4f6",
                    color: "#9ca3af",
                    fontSize: 11,
                    fontWeight: 500,
                    border: "1px solid #e5e7eb"
                }}>
                    N/A
                </span>
            ),
        },
        {
            title: "Họ & Tên",
            key: "name",
            render: (_: any, record: any) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontWeight: 600, color: "#111827", fontSize: 13, letterSpacing: "-0.010em" }}>{record.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 11 }}>{record.email}</div>
                </div>
            ),
        },
        {
            title: "Chức danh",
            dataIndex: "jobTitle",
            key: "jobTitle",
            render: (jt: string) => jt ? (
                <span style={{ color: "#111827", fontWeight: 500, fontSize: 13 }}>{jt}</span>
            ) : (
                <span style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    fontWeight: 400,
                    background: "#f9fafb",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid #f3f4f6"
                }}>Chưa gán</span>
            ),
        },
        {
            title: "Cấp bậc",
            dataIndex: "positionLevel",
            key: "positionLevel",
            width: 100,
            render: (lvl: string) => lvl ? (
                <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "#faf5ff",
                    color: "#6b21a8",
                    fontSize: 11,
                    fontWeight: 600,
                    border: "1px solid #f3e8ff"
                }}>
                    {lvl}
                </span>
            ) : (
                <span style={{ color: "#d1d5db" }}>—</span>
            ),
        },
        {
            title: "Đơn vị / Phòng ban",
            key: "unit",
            render: (_: any, record: any) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {record.departmentName ? (
                        <span style={{ color: "#374151", fontSize: 12, fontWeight: 600 }}>
                            {record.departmentName}
                        </span>
                    ) : (
                        <span style={{ color: "#9ca3af", fontSize: 11, fontStyle: "italic" }}>Không thuộc phòng ban</span>
                    )}
                    {record.companyName && (
                        <span style={{ color: "#9ca3af", fontSize: 11 }}>
                            {record.companyName}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            width: 110,
            align: "center" as const,
            render: (_: any, record: any) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(record);
                    }}
                    style={{
                        padding: "5px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        border: "1px solid #fbb6ce",
                        background: "#fff0f6",
                        color: "#f5317f",
                        cursor: "pointer",
                        transition: "all 0.18s ease-in-out",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f5317f";
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.borderColor = "#f5317f";
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 10px rgba(245,49,127,0.25)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff0f6";
                        e.currentTarget.style.color = "#f5317f";
                        e.currentTarget.style.borderColor = "#fbb6ce";
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                    Chọn
                </button>
            ),
        },
    ];

    return (
        <Modal
            zIndex={1100}
            open={open}
            onCancel={onClose}
            footer={null}
            width={960}
            title={null}
            closable={false}
            className="manager-picker-modal"
            styles={{
                content: { padding: 0, borderRadius: 16, overflow: "hidden" },
                mask: { backdropFilter: "blur(4px)" },
            }}
        >
            <style>{`
                 .manager-picker-modal {
                     top: 40px !important;
                     padding-bottom: 0 !important;
                 }
                 .manager-picker-modal .ant-modal-content {
                     height: 680px !important; /* Majestic fixed height */
                     max-height: 85vh !important;
                     padding: 0 !important;
                     overflow: hidden !important;
                     display: flex !important;
                     flex-direction: column !important;
                 }
                 .picker-table {
                     height: 100% !important;
                     display: flex !important;
                     flex-direction: column !important;
                     overflow: hidden !important;
                 }
                 .picker-table-content {
                     padding: 0 24px 20px;
                     flex: 1 !important;
                     display: flex !important;
                     flex-direction: column !important;
                     overflow: hidden !important;
                     min-height: 0 !important;
                 }
                 /* Border and frame on the table wrapper */
                 .picker-table-content .ant-table-wrapper {
                     border: 1.5px solid #f0f0f0 !important;
                     border-radius: 12px !important;
                     overflow: hidden !important;
                     background: #fff !important;
                     margin-top: 16px !important;
                     flex: 1 !important;
                     display: flex !important;
                     flex-direction: column !important;
                     min-height: 0 !important;
                 }
                 .picker-table-content .ant-spin-nested-loading,
                 .picker-table-content .ant-spin-container,
                 .picker-table-content .ant-table,
                 .picker-table-content .ant-table-container {
                     flex: 1 !important;
                     display: flex !important;
                     flex-direction: column !important;
                     overflow: hidden !important;
                     min-height: 0 !important;
                 }
                 /* Force table scroll body height */
                 .picker-table-content .ant-table-body {
                     flex: 1 !important;
                     overflow-y: auto !important;
                 }
                 /* Force identical height on placeholder */
                 .picker-table-content .ant-table-placeholder {
                     flex: 1 !important;
                     display: flex !important;
                     align-items: center !important;
                     justify-content: center !important;
                 }
                 /* Th and Td padding and formatting */
                 .picker-table-content .ant-table-thead > tr > th {
                     background: #fcfcfd !important;
                     color: #4b5563 !important;
                     font-size: 11px !important;
                     font-weight: 600 !important;
                     text-transform: uppercase !important;
                     letter-spacing: 0.05em !important;
                     border-bottom: 1.5px solid #e5e7eb !important;
                     padding: 14px 16px !important;
                     line-height: 1.5 !important;
                 }
                 .picker-table-content .ant-table-tbody > tr > td {
                     padding: 14px 16px !important; /* Premium and high-end padding */
                     border-bottom: 1px solid #f3f4f6 !important;
                     transition: all 0.2s !important;
                 }
                 .picker-table-content .ant-table-tbody > tr:last-child > td {
                     border-bottom: none !important;
                 }
                 .picker-table-content .ant-table-tbody > tr:hover > td {
                     background: ${ACCENT_SOFT} !important;
                 }
                .picker-table .ant-input-affix-wrapper {
                    border-radius: 8px !important;
                    border-color: #e5e7eb !important;
                    padding: 8px 12px !important;
                }
                .picker-table .ant-input-affix-wrapper:hover {
                    border-color: #d1d5db !important;
                }
                .picker-table .ant-input-affix-wrapper-focused {
                    border-color: ${ACCENT} !important;
                    box-shadow: 0 0 0 3px ${ACCENT_SOFT} !important;
                }
                .picker-table .ant-select-selector {
                    border-radius: 8px !important;
                    border-color: #e5e7eb !important;
                    height: 40px !important;
                    align-items: center !important;
                }
                .picker-table .ant-select:hover .ant-select-selector {
                    border-color: #d1d5db !important;
                }
                .picker-table .ant-select-focused .ant-select-selector {
                    border-color: ${ACCENT} !important;
                    box-shadow: 0 0 0 3px ${ACCENT_SOFT} !important;
                }
                .picker-table .ant-pagination {
                    margin: 16px 0 0 0 !important;
                    flex-shrink: 0 !important;
                }
                .picker-table .ant-pagination-item {
                    border-radius: 6px !important;
                }
                .picker-table .ant-pagination-item-active {
                    border-color: ${ACCENT} !important;
                    background-color: ${ACCENT_SOFT} !important;
                }
                .picker-table .ant-pagination-item-active a {
                    color: ${ACCENT} !important;
                }
                .picker-table .ant-pagination-prev .ant-pagination-item-link,
                .picker-table .ant-pagination-next .ant-pagination-item-link {
                    border-radius: 6px !important;
                }
            `}</style>

            <div className="picker-table">
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "18px 24px 14px",
                        borderBottom: "1px solid #f3f4f6",
                        background: "#fff",
                        flexShrink: 0
                    }}
                >
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
                            {title || "Danh sách Quản lý trực tiếp"}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                            {description || "Chọn người dùng làm Quản lý trực tiếp của nhân viên"}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: "none",
                            background: "#f3f4f6",
                            cursor: "pointer",
                            color: "#6b7280",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.color = "#1f2937";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#f3f4f6";
                            e.currentTarget.style.color = "#6b7280";
                        }}
                    >
                        <CloseOutlined />
                    </button>
                </div>

                {/* Filters */}
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        padding: "16px 24px",
                        background: "#f9fafb",
                        borderBottom: "1px solid #f3f4f6",
                        flexShrink: 0
                    }}
                >
                    <Input
                        prefix={<SearchOutlined style={{ color: "#9ca3af", marginRight: 4 }} />}
                        placeholder="Tìm theo Mã NV, Tên, Email, Chức danh..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        allowClear
                        style={{ flex: 2 }}
                    />
                    <Select
                        placeholder="Lọc theo Công ty"
                        allowClear
                        value={selectedCompanyId}
                        onChange={(val) => {
                            setSelectedCompanyId(val);
                            setPage(1);
                        }}
                        style={{ flex: 1, height: 40 }}
                        options={companies.map((c) => ({ label: c.name, value: c.id }))}
                    />
                </div>

                {/* Table */}
                <div className="picker-table-content">
                    <Table
                        dataSource={users}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        onRow={(record) => ({
                            onClick: () => handleSelect(record),
                        })}
                        scroll={{ y: "100%" }}
                        pagination={{
                            current: page,
                            pageSize: PAGE_SIZE,
                            total: total,
                            onChange: (p) => setPage(p),
                            showSizeChanger: false,
                        }}
                        style={{ marginTop: 16 }}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ManagerPickerModal;
