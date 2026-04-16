import { useEffect, useState } from "react";
import {
    Drawer, Table, Input, Checkbox, Space, Badge,
    Button, Spin, Tooltip, Tag, Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    callFetchJobTitlesWithAssignStatus,
    callCreateDepartmentJobTitle,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";
import type { IJobTitleAssignStatus } from "@/types/backend";

interface IProps {
    open: boolean;
    onClose: () => void;
    departmentId: number;
    departmentName?: string;
    onSuccess: () => void;
}

const PAGE_SIZE = 10;

const DrawerAssignJobTitle = ({
    open, onClose, departmentId, departmentName = "", onSuccess,
}: IProps) => {
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [data, setData] = useState<IJobTitleAssignStatus[]>([]);
    const [selected, setSelected] = useState<number[]>([]);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [bandFilter, setBandFilter] = useState<string | undefined>(undefined);

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    /* --------------------------------------------------
       FETCH
    -------------------------------------------------- */
    const fetchData = async (
        currentPage: number,
        currentSearch: string,
        currentStatus?: string,
        currentBand?: string,
    ) => {
        setLoading(true);
        try {
            const res = await callFetchJobTitlesWithAssignStatus(departmentId, {
                search: currentSearch || undefined,
                status: currentStatus || undefined,
                band: currentBand || undefined,
                page: currentPage,
                size: PAGE_SIZE,
            });
            const paginate = res?.data;
            setData(paginate?.result ?? []);
            setTotal(paginate?.meta?.total ?? 0);
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Không thể tải danh sách chức danh");
            setData([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    // Reset khi mở Drawer
    useEffect(() => {
        if (open) {
            setSelected([]);
            setSearchInput("");
            setSearch("");
            setStatusFilter(undefined);
            setBandFilter(undefined);
            setPage(1);
            fetchData(1, "", undefined, undefined);
        }
    }, [open, departmentId]);

    // Fetch khi đổi page
    useEffect(() => {
        if (open) fetchData(page, search, statusFilter, bandFilter);
    }, [page]);

    /* --------------------------------------------------
       HANDLERS
    -------------------------------------------------- */
    const handleSearch = (value: string) => {
        const trimmed = value.trim();
        setSearch(trimmed);
        setPage(1);
        fetchData(1, trimmed, statusFilter, bandFilter);
    };

    const handleStatusFilter = (value: string | undefined) => {
        setStatusFilter(value);
        setPage(1);
        fetchData(1, search, value, bandFilter);
    };

    const handleBandFilter = (value: string | undefined) => {
        setBandFilter(value);
        setPage(1);
        fetchData(1, search, statusFilter, value);
    };

    const handleResetFilter = () => {
        setSearchInput("");
        setSearch("");
        setStatusFilter(undefined);
        setBandFilter(undefined);
        setPage(1);
        fetchData(1, "", undefined, undefined);
    };

    const handleAssign = async () => {
        if (selected.length === 0) return;
        setAssigning(true);
        try {
            for (const jobTitleId of selected) {
                await callCreateDepartmentJobTitle({ departmentId, jobTitleId });
            }
            notify.success(`Đã gán ${selected.length} chức danh thành công`);
            onSuccess();
            onClose();
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Không thể gán chức danh");
        } finally {
            setAssigning(false);
        }
    };

    /* --------------------------------------------------
       HELPER
    -------------------------------------------------- */
    const isDisabled = (record: IJobTitleAssignStatus) => !record.canAssign;

    const getTooltip = (record: IJobTitleAssignStatus): string => {
        if (record.assigned) return "Chức danh này đã được gán trực tiếp vào phòng ban";
        if (record.assignSource === "COMPANY") return "Chức danh đã được gán ở cấp Công ty";
        if (record.assignSource === "SECTION") return "Chức danh đã được gán ở Bộ phận";
        return "Có thể gán chức danh này";
    };

    const hasFilter = !!search || !!statusFilter || !!bandFilter;
    // 👉 THÊM Ở ĐÂY
    const bandOptions = Array.from(
        new Set(data.map(item => item.band).filter(Boolean))
    ).map(band => ({
        label: `Band ${band}`,
        value: band
    }));
    /* --------------------------------------------------
       COLUMNS
    -------------------------------------------------- */
    const columns: ColumnsType<IJobTitleAssignStatus> = [
        {
            title: "Chọn",
            width: 70,
            align: "center",
            render: (_, record) => (
                <Tooltip title={getTooltip(record)}>
                    <Checkbox
                        disabled={isDisabled(record)}
                        checked={selected.includes(record.id)}
                        onChange={(e) => {
                            setSelected((prev) =>
                                e.target.checked
                                    ? [...prev, record.id]
                                    : prev.filter((id) => id !== record.id)
                            );
                        }}
                    />
                </Tooltip>
            ),
        },
        {
            title: "Tên chức danh",
            dataIndex: "nameVi",
            key: "nameVi",
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <span>{text}</span>
                    {record.nameEn && (
                        <span style={{ fontSize: "12px", color: "#666" }}>{record.nameEn}</span>
                    )}
                </Space>
            ),
        },
        {
            title: "Mã chức danh",
            dataIndex: "positionCode",
            key: "positionCode",
            width: 110,
            align: "center",
        },
        {
            title: "Cấp bậc",
            key: "level",
            width: 120,
            align: "center",
            render: (_, record) => {
                const levelText = record.band
                    ? `${record.band}${record.levelNumber || record.level || ""}`
                    : record.levelNumber || record.level || "—";
                return <Tag color="blue" style={{ fontWeight: 500 }}>{levelText}</Tag>;
            },
        },
        {
            title: "Trạng thái",
            key: "status",
            width: 180,
            align: "center",
            render: (_, record) => {
                if (record.assigned) return <Badge status="success" text="Đã gán" />;
                if (record.assignSource === "COMPANY") return <Badge status="error" text="Đã gán ở Công ty" />;
                if (record.assignSource === "SECTION") return <Badge status="warning" text="Đã gán ở Bộ phận" />;
                return <Badge status="processing" text="Chưa gán" />;
            },
        },
        {
            title: "Đang dùng ở phòng ban khác",
            key: "usedIn",
            width: 390,
            render: (_, record) => {
                const departments = record.usedInDepartments || [];
                const count = departments.length;
                if (count === 0) return <span style={{ color: "#999" }}>-</span>;

                const displayTags = departments.slice(0, 3);
                const remaining = count - 3;

                return (
                    <div>
                        <Badge color="orange" text={`${count} PB khác`} style={{ marginBottom: 10, fontWeight: 500 }} />
                        <Space wrap size={[6, 4]}>
                            {displayTags.map((deptName, index) => (
                                <Tag key={index} color="orange" style={{
                                    margin: 0, fontSize: "11px", padding: "1px 8px",
                                    lineHeight: "18px", height: "20px",
                                    display: "inline-flex", alignItems: "center", borderRadius: "3px",
                                }}>
                                    {deptName}
                                </Tag>
                            ))}
                            {remaining > 0 && (
                                <Tooltip
                                    title={
                                        <Space wrap size={[6, 6]} style={{ maxWidth: 460 }}>
                                            {departments.map((name, i) => (
                                                <Tag key={i} color="orange" style={{ fontSize: "11px" }}>{name}</Tag>
                                            ))}
                                        </Space>
                                    }
                                    placement="left"
                                >
                                    <Tag color="gold" style={{
                                        cursor: "pointer", fontWeight: 600, margin: 0,
                                        fontSize: "11px", padding: "1px 8px", lineHeight: "18px",
                                        height: "20px", display: "inline-flex", alignItems: "center",
                                    }}>
                                        +{remaining}
                                    </Tag>
                                </Tooltip>
                            )}
                        </Space>
                    </div>
                );
            },
        },
    ];

    /* --------------------------------------------------
       RENDER
    -------------------------------------------------- */
    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={`Gán chức danh vào phòng ban${departmentName ? ` - ${departmentName}` : ""}`}
            width={1150}
            footer={
                <div style={{ textAlign: "right" }}>
                    <Button onClick={onClose} disabled={assigning}>Hủy</Button>
                    <Button
                        type="primary"
                        disabled={selected.length === 0 || assigning}
                        loading={assigning}
                        onClick={handleAssign}
                        style={{ marginLeft: 12 }}
                    >
                        Gán ({selected.length})
                    </Button>
                </div>
            }
        >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">

                {/* ── SEARCH + FILTER BAR ── */}
                <Space wrap style={{ width: "100%" }} size="small">
                    <Input.Search
                        placeholder="Tìm theo tên chức danh, tên tiếng Anh hoặc mã..."
                        allowClear
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onSearch={handleSearch}
                        style={{ width: 380 }}
                    />

                    {/* Filter trạng thái */}
                    <Select
                        allowClear
                        placeholder="Trạng thái"
                        value={statusFilter}
                        onChange={handleStatusFilter}
                        style={{ width: 180 }}
                        options={[
                            { label: "Chưa gán", value: "AVAILABLE" },
                            { label: "Đã gán phòng này", value: "ASSIGNED" },
                            { label: "Đang dùng ở phòng khác", value: "USED" },
                        ]}
                    />

                    {/* Filter band */}
                    <Select
                        allowClear
                        placeholder="Band"
                        value={bandFilter}
                        onChange={handleBandFilter}
                        style={{ width: 120 }}
                        options={bandOptions}
                    />

                    {/* Reset filter */}
                    {hasFilter && (
                        <Button onClick={handleResetFilter}>Xóa bộ lọc</Button>
                    )}
                </Space>

                {/* ── TABLE ── */}
                <Spin spinning={loading}>
                    <Table
                        rowKey="id"
                        dataSource={data}
                        columns={columns}
                        scroll={{ x: 1100 }}
                        pagination={{
                            current: page,
                            pageSize: PAGE_SIZE,
                            total: total,
                            showSizeChanger: false,
                            showTotal: (t) => `Tổng ${t} chức danh`,
                            onChange: (p) => setPage(p),
                        }}
                    />
                </Spin>
            </Space>
        </Drawer>
    );
};

export default DrawerAssignJobTitle;