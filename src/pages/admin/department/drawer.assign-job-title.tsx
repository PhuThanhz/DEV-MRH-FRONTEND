import { useEffect, useMemo, useRef, useState } from "react";
import {
    Drawer, Table, Input, Checkbox, Space, Badge,
    Button, Tooltip, Tag, Select, Empty,
} from "antd";
import { IdcardOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
    useJobTitlesWithAssignStatusQuery,
    useCreateDepartmentJobTitleMutation,
} from "@/hooks/useDepartmentJobTitles";
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
const DRAWER_WIDTH = "calc(100vw - clamp(24px, 6vw, 96px))";
const MIN_TABLE_BODY_HEIGHT = 180;

const DrawerAssignJobTitle = ({
    open, onClose, departmentId, departmentName = "", onSuccess,
}: IProps) => {
    const [assigning, setAssigning] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [bandFilter, setBandFilter] = useState<string | undefined>(undefined);

    const [page, setPage] = useState(1);
    const [tableBodyHeight, setTableBodyHeight] = useState(420);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const queryParams = useMemo(() => ({
        search: search || undefined,
        status: statusFilter || undefined,
        band: bandFilter || undefined,
        page,
        size: PAGE_SIZE,
    }), [search, statusFilter, bandFilter, page]);

    const { data: paginateData, isLoading: loading } = useJobTitlesWithAssignStatusQuery(
        open ? departmentId : undefined,
        queryParams
    );

    const data = useMemo(() => paginateData?.result ?? [], [paginateData]);
    const total = paginateData?.meta?.total ?? 0;

    const createMutation = useCreateDepartmentJobTitleMutation();

    useEffect(() => {
        if (!open || !tableContainerRef.current) return;

        const container = tableContainerRef.current;
        let frameId = 0;

        const updateTableBodyHeight = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                const headerHeight = container.querySelector<HTMLElement>(".ant-table-thead")?.offsetHeight ?? 48;
                const paginationHeight = container.querySelector<HTMLElement>(".ant-table-pagination")?.offsetHeight ?? 0;
                const nextHeight = Math.max(
                    MIN_TABLE_BODY_HEIGHT,
                    container.clientHeight - headerHeight - paginationHeight - 2,
                );

                setTableBodyHeight((currentHeight) =>
                    Math.abs(currentHeight - nextHeight) > 1 ? nextHeight : currentHeight
                );
            });
        };

        updateTableBodyHeight();
        const resizeObserver = new ResizeObserver(updateTableBodyHeight);
        resizeObserver.observe(container);

        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
        };
    }, [open, total]);

    /* --------------------------------------------------
       HANDLERS
    -------------------------------------------------- */
    const handleSearch = (value: string) => {
        const trimmed = value.trim();
        setSearch(trimmed);
        setPage(1);
    };

    const handleStatusFilter = (value: string | undefined) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleBandFilter = (value: string | undefined) => {
        setBandFilter(value);
        setPage(1);
    };

    const handleResetFilter = () => {
        setSearchInput("");
        setSearch("");
        setStatusFilter(undefined);
        setBandFilter(undefined);
        setPage(1);
    };

    const handleAssign = async () => {
        if (selected.length === 0) return;
        setAssigning(true);
        try {
            await Promise.all(
                selected.map((jobTitleId) =>
                    createMutation.mutateAsync({ departmentId, jobTitleId })
                )
            );
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
            width: 64,
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
            width: 230,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <span className="font-semibold text-slate-800">{text}</span>
                    {record.nameEn && (
                        <span className="text-xs text-slate-500">{record.nameEn}</span>
                    )}
                </Space>
            ),
        },
        {
            title: "Mã chức danh",
            dataIndex: "positionCode",
            key: "positionCode",
            width: 100,
            align: "center",
        },
        {
            title: "Cấp bậc",
            key: "level",
            width: 96,
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
            width: 150,
            align: "center",
            render: (_, record) => {
                if (record.assigned) return <Badge status="success" text="Đã gán" />;
                if (record.assignSource === "COMPANY") return <Badge status="error" text="Đã gán ở Công ty" />;
                if (record.assignSource === "SECTION") return <Badge status="warning" text="Đã gán ở Bộ phận" />;
                return <Badge status="processing" text="Chưa gán" />;
            },
        },
        {
            title: "Phòng ban áp dụng",
            key: "usedIn",
            width: 260,
            render: (_, record) => {
                const departments = record.usedInDepartments || [];
                const count = departments.length;
                if (count === 0) return <span style={{ color: "#94a3b8" }}>—</span>;

                const displayTags = departments.slice(0, 2);
                const remaining = count - displayTags.length;

                return (
                    <Space wrap size={[6, 4]}>
                        {displayTags.map((deptName, index) => (
                            <Tag key={`${deptName}-${index}`} color="orange" style={{
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
                                        {departments.map((name, index) => (
                                            <Tag key={`${name}-${index}`} color="orange" style={{ fontSize: "11px" }}>
                                                {name}
                                            </Tag>
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
            title={
                <div className="flex min-w-0 items-center gap-3 pr-8">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-lg text-rose-500 ring-1 ring-rose-100">
                        <IdcardOutlined />
                    </span>
                    <div className="min-w-0">
                        <div className="truncate text-[16px] font-semibold leading-6 text-slate-900">
                            Gán chức danh vào phòng ban
                        </div>
                        <div className="truncate text-xs font-normal text-slate-500">
                            {departmentName || "Phòng ban đang chọn"}
                        </div>
                    </div>
                </div>
            }
            width={DRAWER_WIDTH}
            className="department-job-title-assign-drawer"
            destroyOnHidden
            maskClosable={!assigning}
            styles={{
                mask: {
                    background: "rgba(15, 23, 42, 0.42)",
                    backdropFilter: "blur(5px)",
                },
                content: {
                    overflow: "hidden",
                    borderRadius: "18px 0 0 18px",
                    borderLeft: "1px solid rgba(226, 232, 240, 0.9)",
                    boxShadow: "-20px 0 60px -28px rgba(15, 23, 42, 0.48)",
                },
                header: {
                    padding: "16px 20px",
                    borderBottom: "1px solid #e9edf3",
                },
                body: {
                    padding: 0,
                    overflow: "hidden",
                    background: "#f8fafc",
                },
                footer: {
                    padding: "12px 20px",
                    borderTop: "1px solid #e9edf3",
                    background: "rgba(255, 255, 255, 0.96)",
                },
            }}
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                        {selected.length > 0 ? (
                            <span>
                                Đã chọn <strong className="font-semibold text-[#e8637a]">{selected.length}</strong> chức danh
                            </span>
                        ) : (
                            "Chọn ít nhất một chức danh để tiếp tục"
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button className="!h-10 !rounded-lg !px-4" onClick={onClose} disabled={assigning}>
                            Hủy
                        </Button>
                        <Button
                            data-guide-id="department-job-title-assign-save-button"
                            type="primary"
                            disabled={selected.length === 0 || assigning}
                            loading={assigning}
                            onClick={handleAssign}
                            className="!h-10 !rounded-lg !border-[#e8637a] !bg-[#e8637a] !px-5 !font-semibold !text-white !shadow-[0_4px_12px_rgba(232,99,122,0.22)] hover:!border-[#d94c66] hover:!bg-[#d94c66] active:!translate-y-px disabled:!border-[#f3bdc7] disabled:!bg-[#f8d9df] disabled:!text-[#b96b78] disabled:!shadow-none"
                        >
                            Gán {selected.length > 0 ? `${selected.length} chức danh` : "chức danh"}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="flex h-full min-h-0 flex-col">
                <style>{`
                    .department-job-title-assign-drawer .ant-drawer-close {
                        margin-inline-end: 12px;
                        color: #64748b;
                    }

                    .department-job-title-assign-drawer .ant-table-wrapper .ant-table {
                        border-radius: 12px;
                    }

                    .department-job-title-assign-drawer .ant-table-thead > tr > th {
                        background: #f8fafc !important;
                        color: #334155 !important;
                        font-size: 12px;
                        font-weight: 650;
                        border-color: #e9edf3 !important;
                        padding-block: 11px !important;
                    }

                    .department-job-title-assign-drawer .ant-table-tbody > tr > td {
                        border-color: #eef2f6 !important;
                        padding-block: 11px !important;
                    }

                    .department-job-title-assign-drawer .ant-table-placeholder > td {
                        height: clamp(280px, calc(100dvh - 370px), 520px);
                        border-bottom: 0 !important;
                    }

                    .department-job-title-assign-drawer .ant-table-pagination {
                        margin: 0 !important;
                        padding: 12px 16px;
                        background: #ffffff;
                        border-top: 1px solid #e9edf3;
                    }

                    .department-job-title-assign-drawer [data-guide-id="department-job-title-assign-table"] > .ant-table-wrapper {
                        height: 100%;
                    }

                    .department-job-title-assign-drawer .ant-table-body {
                        overscroll-behavior: contain;
                        scrollbar-width: thin;
                        scrollbar-color: #cbd5e1 transparent;
                    }

                    .department-job-title-assign-drawer .ant-table-body::-webkit-scrollbar {
                        width: 6px;
                        height: 6px;
                    }

                    .department-job-title-assign-drawer .ant-table-body::-webkit-scrollbar-track {
                        background: transparent;
                    }

                    .department-job-title-assign-drawer .ant-table-body::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 999px;
                    }

                    .department-job-title-assign-drawer .ant-table-body::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8;
                    }
                `}</style>

                <section className="shrink-0 border-b border-slate-200/80 bg-white px-4 py-4 sm:px-5">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_180px_120px_auto]">
                        <Input.Search
                            data-guide-id="department-job-title-assign-search-input"
                            placeholder="Tìm theo tên chức danh, tên tiếng Anh hoặc mã..."
                            allowClear
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onSearch={handleSearch}
                            className="w-full"
                        />

                        <Select
                            allowClear
                            placeholder="Trạng thái"
                            value={statusFilter}
                            onChange={handleStatusFilter}
                            className="w-full"
                            options={[
                                { label: "Chưa gán", value: "AVAILABLE" },
                                { label: "Đã gán phòng này", value: "ASSIGNED" },
                                { label: "Đã áp dụng nơi khác", value: "USED" },
                            ]}
                        />

                        <Select
                            allowClear
                            placeholder="Band"
                            value={bandFilter}
                            onChange={handleBandFilter}
                            className="w-full"
                            options={bandOptions}
                        />

                        {hasFilter && (
                            <Button className="!rounded-lg" onClick={handleResetFilter}>Xóa lọc</Button>
                        )}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>Chỉ những chức danh khả dụng mới có thể chọn.</span>
                        <span className="shrink-0 tabular-nums">{total} kết quả</span>
                    </div>
                </section>

                <section className="min-h-0 flex-1 p-4 sm:p-5">
                    <div
                        ref={tableContainerRef}
                        className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_35px_-30px_rgba(15,23,42,0.55)]"
                        data-guide-id="department-job-title-assign-table"
                    >
                        <Table
                            rowKey="id"
                            dataSource={data}
                            columns={columns}
                            loading={loading}
                            size="middle"
                            scroll={{ x: 900, y: tableBodyHeight }}
                            locale={{
                                emptyText: (
                                    <Empty
                                        image={
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-400 ring-1 ring-rose-100">
                                                {hasFilter ? <SearchOutlined /> : <IdcardOutlined />}
                                            </div>
                                        }
                                        description={
                                            <div className="mx-auto max-w-sm px-4 text-center">
                                                <p className="mb-1 font-semibold text-slate-700">
                                                    {hasFilter ? "Không tìm thấy chức danh phù hợp" : "Chưa có chức danh để gán"}
                                                </p>
                                                <p className="m-0 text-xs leading-5 text-slate-500">
                                                    {hasFilter
                                                        ? "Thử thay đổi từ khóa hoặc xóa bớt bộ lọc."
                                                        : "Danh sách chức danh khả dụng sẽ xuất hiện tại đây."}
                                                </p>
                                            </div>
                                        }
                                    >
                                        {hasFilter && (
                                            <Button className="!rounded-lg" onClick={handleResetFilter}>
                                                Xóa bộ lọc
                                            </Button>
                                        )}
                                    </Empty>
                                ),
                            }}
                            pagination={total > 0
                                ? {
                                      current: page,
                                      pageSize: PAGE_SIZE,
                                      total: total,
                                      showSizeChanger: false,
                                      showTotal: (t) => `Tổng ${t} chức danh`,
                                      onChange: (p) => setPage(p),
                                  }
                                : false}
                        />
                    </div>
                </section>
            </div>
        </Drawer>
    );
};

export default DrawerAssignJobTitle;
