import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm, Button } from "antd";
import { notify } from "@/components/common/notification/notify";
import {
    EditOutlined,
    SettingOutlined,
    CheckCircleOutlined,
    PoweroffOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import dayjs from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IEvaluationPeriod } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import {
    callFetchEvaluationPeriods,
    callActivateEvaluationPeriod,
    callCloseEvaluationPeriod,
} from "@/config/api";
import PeriodModal from "./PeriodModal";
import PeriodDetailDrawer from "./PeriodDetailDrawer";

const PeriodPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [dataInit, setDataInit] = useState<IEvaluationPeriod | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<IEvaluationPeriod | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [periods, setPeriods] = useState<IEvaluationPeriod[]>([]);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState({
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    });

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);

    const fetchPeriods = async (q: string) => {
        setLoading(true);
        try {
            const res = await callFetchEvaluationPeriods(q);
            if (res?.data) {
                setPeriods(res.data.result);
                setMeta({
                    page: res.data.meta.page,
                    pageSize: res.data.meta.pageSize,
                    total: res.data.meta.total,
                });
            }
        } catch {
            notify.error("Lỗi tải danh sách kỳ đánh giá");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters: string[] = [];
        if (searchValue) {
            filters.push(`name~'${searchValue}'`);
        }
        if (statusFilter !== null) {
            filters.push(`status='${statusFilter}'`);
        }
        if (filters.length > 0) {
            q.filter = filters.join(" and ");
        }
        const stringified = queryString.stringify(q, { encode: false });
        setQuery(stringified);
        fetchPeriods(stringified);
    }, [searchValue, statusFilter]);

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters: string[] = [];
        if (searchValue) {
            filters.push(`name~'${searchValue}'`);
        }
        if (statusFilter !== null) {
            filters.push(`status='${statusFilter}'`);
        }
        if (filters.length > 0) {
            q.filter = filters.join(" and ");
        }

        let temp = queryString.stringify(q, { encode: false });
        let sortBy = "sort=createdAt,desc";
        if (sort?.name) {
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        }
        return `${temp}&${sortBy}`;
    };

    const handleActivate = async (id: number) => {
        try {
            const res = await callActivateEvaluationPeriod(id);
            if (res?.data) {
                notify.success("Kích hoạt kỳ đánh giá thành công! Tất cả biểu mẫu cá nhân đã được tự động sinh.");
                fetchPeriods(query);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Lỗi kích hoạt kỳ đánh giá";
            notify.error(msg);
        }
    };

    const handleClose = async (id: number) => {
        try {
            const res = await callCloseEvaluationPeriod(id);
            if (res?.data) {
                notify.success("Đã đóng kỳ đánh giá an toàn.");
                fetchPeriods(query);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Lỗi đóng kỳ đánh giá";
            notify.error(msg);
        }
    };

    const columns: ProColumns<IEvaluationPeriod>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Tên kỳ đánh giá",
            dataIndex: "name",
            render: (val, record) => (
                <span
                    style={{ fontWeight: 600, color: "#1677ff", cursor: "pointer" }}
                    onClick={() => {
                        setSelectedPeriod(record);
                        setOpenDrawer(true);
                    }}
                >
                    {val}
                </span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 140,
            align: "center",
            render: (val) => {
                let border = "#e5e7eb", bg = "#f9fafb", color = "#9ca3af", text = "Bản nháp";
                if (val === "ACTIVE") {
                    border = "#b7eb8f"; bg = "#f6ffed"; color = "#389e0d"; text = "Đang diễn ra";
                } else if (val === "CLOSED") {
                    border = "#ffccc7"; bg = "#fff2f0"; color = "#cf1322"; text = "Đã kết thúc";
                }
                return (
                    <Tag style={{
                        borderRadius: 4, padding: "0px 8px", fontSize: 12,
                        fontWeight: 500, height: 22, lineHeight: "20px",
                        border: `1px solid ${border}`,
                        background: bg,
                        color: color,
                    }}>
                        {text}
                    </Tag>
                );
            },
        },
        {
            title: "Tự đánh giá (Nhân viên)",
            key: "employeeTimeline",
            width: 260,
            render: (_, record) => {
                if (!record.employeeStartDate || !record.employeeDeadline) return <span style={{ color: "#9ca3af" }}>Chưa cấu hình</span>;
                return (
                    <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 2 }}>
                        <div><Tag color="cyan">Mở</Tag> {dayjs(record.employeeStartDate).format("DD/MM/YYYY HH:mm")}</div>
                        <div><Tag color="volcano">Hạn</Tag> {dayjs(record.employeeDeadline).format("DD/MM/YYYY HH:mm")}</div>
                    </div>
                );
            }
        },
        {
            title: "Quản lý chấm",
            dataIndex: "managerDeadline",
            width: 160,
            render: (_, record) => record.managerDeadline ? dayjs(record.managerDeadline).format("DD/MM/YYYY HH:mm") : <span style={{ color: "#9ca3af" }}>Chưa cấu hình</span>,
        },
        {
            title: "BLĐ phê duyệt",
            dataIndex: "approvalDeadline",
            width: 160,
            render: (_, record) => record.approvalDeadline ? dayjs(record.approvalDeadline).format("DD/MM/YYYY HH:mm") : <span style={{ color: "#9ca3af" }}>Chưa cấu hình</span>,
        },
        {
            title: "Hành động",
            align: "center",
            width: 180,
            fixed: "right",
            render: (_, entity) => {
                const isDraft = entity.status === "DRAFT";
                const isActive = entity.status === "ACTIVE";

                return (
                    <Space size={14}>
                        <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PERIODS} hideChildren>
                            <SettingOutlined
                                style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                                title="Cấu hình Biểu mẫu & Nhân sự"
                                onClick={() => {
                                    setSelectedPeriod(entity);
                                    setOpenDrawer(true);
                                }}
                            />
                        </Access>

                        {isDraft && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PERIODS} hideChildren>
                                <EditOutlined
                                    style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                                    title="Chỉnh sửa kỳ đánh giá"
                                    onClick={() => {
                                        setDataInit(entity);
                                        setOpenModal(true);
                                    }}
                                />
                            </Access>
                        )}

                        {isDraft && entity.id && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PERIODS} hideChildren>
                                <Popconfirm
                                    title="Bạn có chắc chắn muốn KÍCH HOẠT kỳ đánh giá này?"
                                    description="Hành động này sẽ gửi thông báo và tự động sinh bản chấm điểm cho toàn bộ nhân viên tham gia."
                                    onConfirm={() => handleActivate(entity.id!)}
                                    okText="Đồng ý"
                                    cancelText="Hủy"
                                >
                                    <CheckCircleOutlined
                                        style={{ fontSize: 18, color: "#389e0d", cursor: "pointer" }}
                                        title="Kích hoạt kỳ đánh giá"
                                    />
                                </Popconfirm>
                            </Access>
                        )}

                        {isActive && entity.id && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PERIODS} hideChildren>
                                <Popconfirm
                                    title="Bạn có chắc chắn muốn ĐÓNG kỳ đánh giá này?"
                                    description="Hành động này sẽ khóa toàn bộ cổng chấm điểm."
                                    onConfirm={() => handleClose(entity.id!)}
                                    okText="Đồng ý"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                >
                                    <PoweroffOutlined
                                        style={{ fontSize: 17, color: "#cf1322", cursor: "pointer" }}
                                        title="Đóng kỳ đánh giá"
                                    />
                                </Popconfirm>
                            </Access>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <PageContainer
            title="Quản lý Kỳ đánh giá (Periods)"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên kỳ đánh giá..."
                        addLabel="Thêm mới"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={() => {
                            setSearchValue("");
                            setStatusFilter(null);
                        }}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "status",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Bản nháp", value: "DRAFT", color: "default" },
                                        { label: "Đang diễn ra", value: "ACTIVE", color: "green" },
                                        { label: "Đã kết thúc", value: "CLOSED", color: "red" },
                                    ],
                                },
                            ]}
                            onChange={(filters) => {
                                setStatusFilter(filters.status !== undefined ? filters.status : null);
                            }}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PERIODS}>
                <DataTable<IEvaluationPeriod>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={periods}
                    scroll={{ x: 1200 }}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        await fetchPeriods(q);
                        return {
                            data: periods,
                            success: true,
                            total: meta.total,
                        };
                    }}
                    pagination={{
                        defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
                        current: meta.page,
                        pageSize: meta.pageSize,
                        total: meta.total,
                        showQuickJumper: true,
                        showTotal: (total, range) => (
                            <div style={{ fontSize: 13 }}>
                                <span style={{ fontWeight: 500 }}>
                                    {range[0]}–{range[1]}
                                </span>{" "}
                                trên{" "}
                                <span style={{ fontWeight: 600, color: "#1677ff" }}>
                                    {total.toLocaleString()}
                                </span>{" "}
                                kỳ đánh giá
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            <PeriodModal
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={() => fetchPeriods(query)}
            />

            <PeriodDetailDrawer
                open={openDrawer}
                onClose={() => {
                    setOpenDrawer(false);
                    setSelectedPeriod(null);
                    fetchPeriods(query);
                }}
                period={selectedPeriod}
            />
        </PageContainer>
    );
};

export default PeriodPage;
