import React, { useEffect, useState } from "react";
import { Modal, Input, Table, Select, Button, Space, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { callFetchUsersCrossCompany, callFetchCompany } from "@/config/api";

const { Text } = Typography;

interface ManagerPickerModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (user: { id: string; name: string; departmentName?: string; companyName?: string }) => void;
    title?: string;
    description?: string;
}

const PAGE_SIZE = 10;

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

    // Fetch users
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
            width: 130,
            render: (code: string) => code ? <Tag color="processing">{code}</Tag> : <Text type="secondary">N/A</Text>,
        },
        {
            title: "Họ & Tên",
            key: "name",
            width: 220,
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
                </Space>
            ),
        },
        {
            title: "Chức danh",
            dataIndex: "jobTitle",
            key: "jobTitle",
            width: 180,
            render: (jt: string) => jt ? <Text>{jt}</Text> : <Text type="secondary" italic>Chưa gán</Text>,
        },
        {
            title: "Cấp bậc",
            dataIndex: "positionLevel",
            key: "positionLevel",
            width: 100,
            render: (lvl: string) => lvl ? <Tag color="purple">{lvl}</Tag> : <Text type="secondary">—</Text>,
        },
        {
            title: "Đơn vị / Công ty",
            key: "unit",
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    {record.departmentName ? (
                        <Text strong style={{ fontSize: 13 }}>{record.departmentName}</Text>
                    ) : (
                        <Text type="secondary" italic style={{ fontSize: 13 }}>Không thuộc phòng ban</Text>
                    )}
                    {record.companyName && (
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.companyName}</Text>
                    )}
                </Space>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            width: 100,
            align: "center" as const,
            render: (_: any, record: any) => (
                <Button 
                    type="primary" 
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(record);
                    }}
                >
                    Chọn
                </Button>
            ),
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={900}
            title={
                <div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{title || "Danh sách Quản lý trực tiếp"}</div>
                    <div style={{ fontSize: 13, fontWeight: 400, color: "#6b7280", marginTop: 4 }}>
                        {description || "Chọn người dùng làm Quản lý trực tiếp của nhân viên"}
                    </div>
                </div>
            }
            centered
            destroyOnClose
        >
            <Space direction="vertical" style={{ width: "100%", marginTop: 16 }} size="middle">
                <div style={{ display: "flex", gap: 12 }}>
                    <Input
                        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
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
                        style={{ flex: 1 }}
                        options={companies.map((c) => ({ label: c.name, value: c.id }))}
                    />
                </div>

                <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    onRow={(record) => ({
                        onClick: () => handleSelect(record),
                        style: { cursor: "pointer" }
                    })}
                    scroll={{ y: 400 }}
                    pagination={{
                        current: page,
                        pageSize: PAGE_SIZE,
                        total: total,
                        onChange: (p) => setPage(p),
                        showSizeChanger: false,
                        showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} người`,
                    }}
                    size="middle"
                    bordered
                />
            </Space>
        </Modal>
    );
};

export default ManagerPickerModal;
