import React, { useState, useRef } from "react";
import { Space, Tag, Popconfirm, Typography } from "antd";
import { notify } from "@/components/common/notification/notify";
import {
    EditOutlined,
    EyeOutlined,
    SettingOutlined,
    CheckCircleOutlined,
    BankOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";

import type { IEvaluationTemplate } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { callFetchEvaluationTemplates, callPublishEvaluationTemplate } from "@/config/api";
import TemplateDetailPage from "./TemplateDetailPage";
import TemplateModal from "./TemplateModal";
import ActionButton from "@/components/common/ui/ActionButton";

const toTitleCase = (str: string) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/(?:^|\s|-)\S/g, (m) => m.toUpperCase())
        .replace(/\bTnhh\b/g, "TNHH")
        .replace(/\bCp\b/g, "CP")
        .replace(/\bJsc\b/g, "JSC")
        .replace(/\bLtd\b/g, "LTD");
};

const TemplatePage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const parsedDetailTemplateId = id ? Number(id) : null;
    const detailTemplateId = parsedDetailTemplateId && Number.isFinite(parsedDetailTemplateId)
        ? parsedDetailTemplateId
        : null;
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IEvaluationTemplate | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    const tableRef = useRef<ActionType>(null);
    const paginationRef = useRef({
        current: 1,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE || 10,
    });

    const handlePublish = async (id: number) => {
        try {
            const res = await callPublishEvaluationTemplate(id);
            if (res?.data) {
                notify.success("Kích hoạt mẫu đánh giá thành công.");
                tableRef.current?.reload();
            }
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            const msg = error?.message || error?.response?.data?.message || "Lỗi kích hoạt mẫu đánh giá";
            notify.error(msg);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildQuery = (params: any, sort: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        if (typeFilter !== null) {
            filters.push(`type='${typeFilter}'`);
        }
        if (filters.length > 0) {
            q.filter = filters.join(" and ");
        }

        const temp = queryString.stringify(q, { encode: false });
        let sortBy = "sort=id,desc";
        if (sort?.name) {
            sortBy = sort.name === "ascend" ? "sort=name,asc" : "sort=name,desc";
        }
        return `${temp}&${sortBy}`;
    };

    const openDetailDrawer = (templateId?: number) => {
        if (!templateId) return;
        navigate(`/admin/evaluation/templates/${templateId}`);
    };

    const closeDetailDrawer = () => {
        navigate("/admin/evaluation/templates");
        tableRef.current?.reload();
    };

    const columns: ProColumns<IEvaluationTemplate>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + (paginationRef.current.current - 1) * paginationRef.current.pageSize,
        },
        {
            title: "Tên mẫu đánh giá",
            dataIndex: "name",
            sorter: true,
            render: (val, record) => (
                <Typography.Link 
                    style={{ fontWeight: 500, fontSize: "14px", color: "#262626" }}
                    onClick={() => openDetailDrawer(record.id)}
                >
                    {val}
                </Typography.Link>
            ),
        },
        {
            title: "Đối tượng",
            dataIndex: "type",
            width: 140,
            align: "center",
            render: (val) => {
                const isStaff = val === "STAFF";
                return (
                    <Tag 
                        color={isStaff ? "blue" : "purple"}
                        style={{ borderRadius: 4, fontWeight: 500, padding: "0px 8px", fontSize: 12 }}
                    >
                        {isStaff ? "Nhân viên" : "Quản lý"}
                    </Tag>
                );
            },
        },
        {
            title: "Công ty áp dụng",
            dataIndex: ["company", "name"],
            width: 380,
            render: (_, record) => {
                const compName = record.company?.name;
                return compName ? (
                    <span style={{ fontWeight: 500, color: "#262626", fontSize: 13, whiteSpace: "nowrap" }}>
                        {toTitleCase(compName)}
                    </span>
                ) : (
                    <span style={{ color: "#bfbfbf", fontStyle: "italic" }}>—</span>
                );
            },
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updatedAt",
            width: 140,
            align: "center",
            render: (val, record) => {
                const date = (typeof val === "string" || typeof val === "number" || val instanceof Date) ? val : record.createdAt;
                if (!date || date === "null") return <span style={{ color: "#bfbfbf" }}>—</span>;
                const d = dayjs(date);
                if (!d.isValid()) return <span style={{ color: "#bfbfbf" }}>—</span>;
                
                return (
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                        {d.format("DD/MM/YYYY HH:mm")}
                    </span>
                );
            },
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 150,
            align: "center",
            render: (val) => {
                let border = "#cbd5e1", bg = "#f1f5f9", color = "#475569", text = "Bản nháp";
                if (val === "ACTIVE") {
                    border = "#b7eb8f"; bg = "#f6ffed"; color = "#389e0d"; text = "Đang áp dụng";
                } else if (val === "ARCHIVED") {
                    border = "#ffccc7"; bg = "#fff2f0"; color = "#cf1322"; text = "Đã lưu trữ";
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
            title: "Hành động",
            align: "center",
            width: 120,
            fixed: "right",
            render: (_, entity) => (
                <Space size={8}>
                    {entity.status !== "DRAFT" && (
                        <Access
                            permission={ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES}
                            hideChildren
                        >
                            <ActionButton
                                variant="view"
                                tooltip="Xem chi tiết"
                                icon={<EyeOutlined />}
                                onClick={() => openDetailDrawer(entity.id)}
                                aria-label="Xem chi tiết"
                            />
                        </Access>
                    )}

                    {entity.status === "DRAFT" && (
                        <Access
                            permission={ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES}
                            hideChildren
                        >
                            <ActionButton
                                variant="settings"
                                tooltip="Cấu hình tiêu chí"
                                icon={<SettingOutlined />}
                                onClick={() => openDetailDrawer(entity.id)}
                                aria-label="Cấu hình tiêu chí"
                            />
                        </Access>
                    )}

                    {entity.status === "DRAFT" && (
                        <Access
                            permission={ALL_PERMISSIONS.EVALUATION.UPDATE_TEMPLATE}
                            hideChildren
                        >
                            <ActionButton
                                variant="edit"
                                tooltip="Chỉnh sửa thông tin"
                                icon={<EditOutlined />}
                                onClick={() => {
                                    setDataInit(entity);
                                    setOpenModal(true);
                                }}
                                aria-label="Chỉnh sửa thông tin"
                            />
                        </Access>
                    )}

                    {entity.status === "DRAFT" && entity.id && (
                        <Access
                            permission={ALL_PERMISSIONS.EVALUATION.PUBLISH_TEMPLATE}
                            hideChildren
                        >
                            <Popconfirm
                                title="Kích hoạt mẫu đánh giá?"
                                description="Lưu ý: Mẫu sau khi kích hoạt sẽ không thể chỉnh sửa cấu trúc nữa."
                                onConfirm={() => handlePublish(entity.id!)}
                                okText="Đồng ý"
                                cancelText="Hủy"
                            >
                                <ActionButton
                                    variant="success"
                                    tooltip="Kích hoạt mẫu"
                                    icon={<CheckCircleOutlined />}
                                    aria-label="Kích hoạt mẫu"
                                />
                            </Popconfirm>
                        </Access>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title="Quản lý mẫu đánh giá"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên mẫu đánh giá..."
                        addLabel="Thêm mới"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={() => {
                            setSearchValue("");
                            setStatusFilter(null);
                            setTypeFilter(null);
                        }}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                        addPermission={ALL_PERMISSIONS.EVALUATION.CREATE_TEMPLATE}
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "type",
                                    label: "Đối tượng",
                                    options: [
                                        { label: "Nhân viên", value: "STAFF", color: "blue" },
                                        { label: "Quản lý", value: "MANAGER", color: "purple" },
                                    ],
                                },
                                {
                                    key: "status",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Bản nháp", value: "DRAFT", color: "default" },
                                        { label: "Đang áp dụng", value: "ACTIVE", color: "green" },
                                        { label: "Đã lưu trữ", value: "ARCHIVED", color: "red" },
                                    ],
                                },
                            ]}
                            onChange={(filters) => {
                                setTypeFilter(filters.type !== undefined ? filters.type : null);
                                setStatusFilter(filters.status !== undefined ? filters.status : null);
                            }}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES}>
                <DataTable<IEvaluationTemplate>
                    actionRef={tableRef}
                    rowKey="id"
                    columns={columns}
                    scroll={{ x: "max-content" }}
                    params={{ searchValue, statusFilter, typeFilter }}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        paginationRef.current = {
                            current: params.current || 1,
                            pageSize: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE || 10,
                        };
                        const res = await callFetchEvaluationTemplates(q);
                        if (res?.data) {
                            return {
                                data: res.data.result ?? [],
                                success: true,
                                total: res.data.meta.total ?? 0,
                            };
                        }
                        return { data: [], success: false };
                    }}
                    pagination={{
                        defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
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
                                mẫu đánh giá
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            <TemplateModal
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={() => tableRef.current?.reload()}
            />

            <LotusDetailDrawer
                open={!!detailTemplateId}
                onClose={closeDetailDrawer}
                keyboard={false}
                destroyOnClose={false}
            >
                {detailTemplateId && (
                    <TemplateDetailPage
                        templateIdOverride={detailTemplateId}
                        embedded
                        onClose={closeDetailDrawer}
                    />
                )}
            </LotusDetailDrawer>
        </PageContainer>
    );
};

export default TemplatePage;
