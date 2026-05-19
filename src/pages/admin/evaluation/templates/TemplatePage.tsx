import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm, message } from "antd";
import {
    EditOutlined,
    EyeOutlined,
    DeleteOutlined,
    SettingOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import { useNavigate } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import type { IEvaluationTemplate } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { callFetchEvaluationTemplates, callPublishEvaluationTemplate } from "@/config/api";
import TemplateModal from "./TemplateModal";

const TemplatePage = () => {
    const navigate = useNavigate();
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IEvaluationTemplate | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    const [templates, setTemplates] = useState<IEvaluationTemplate[]>([]);
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

    const fetchTemplates = async (q: string) => {
        setLoading(true);
        try {
            const res = await callFetchEvaluationTemplates(q);
            if (res?.data) {
                setTemplates(res.data.result);
                setMeta({
                    page: res.data.meta.page,
                    pageSize: res.data.meta.pageSize,
                    total: res.data.meta.total,
                });
            }
        } catch (error) {
            message.error("Lỗi tải danh sách mẫu đánh giá");
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (id: number) => {
        setLoading(true);
        try {
            const res = await callPublishEvaluationTemplate(id);
            if (res?.data) {
                message.success("Kích hoạt mẫu đánh giá thành công!");
                fetchTemplates(query);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Lỗi kích hoạt mẫu đánh giá";
            message.error(msg);
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
        if (typeFilter !== null) {
            filters.push(`type='${typeFilter}'`);
        }
        if (filters.length > 0) {
            q.filter = filters.join(" and ");
        }
        const stringified = queryString.stringify(q, { encode: false });
        setQuery(stringified);
        fetchTemplates(stringified);
    }, [searchValue, statusFilter, typeFilter]);

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
        if (typeFilter !== null) {
            filters.push(`type='${typeFilter}'`);
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

    const columns: ProColumns<IEvaluationTemplate>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Tên mẫu đánh giá",
            dataIndex: "name",
            sorter: true,
            render: (val, record) => (
                <span 
                    style={{ fontWeight: 600, color: "#1677ff", cursor: "pointer" }}
                    onClick={() => navigate(`/admin/evaluation/templates/${record.id}`)}
                >
                    {val}
                </span>
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
                    <Tag style={{
                        borderRadius: 4, padding: "0px 8px", fontSize: 12,
                        fontWeight: 500, height: 22, lineHeight: "20px",
                        border: isStaff ? "1px solid #91caff" : "1px solid #AFA9EC", 
                        background: isStaff ? "#e6f4ff" : "#EEEDFE", 
                        color: isStaff ? "#0958d9" : "#3C3489",
                    }}>
                        {isStaff ? "Nhân viên" : "Quản lý"}
                    </Tag>
                );
            },
        },
        {
            title: "Công ty áp dụng",
            dataIndex: ["company", "name"],
            width: 180,
            render: (val) => {
                return val ? (
                    <span style={{ fontWeight: 500 }}>{val}</span>
                ) : (
                    <Tag color="default" style={{ borderRadius: 4 }}>Áp dụng chung</Tag>
                );
            },
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 150,
            align: "center",
            render: (val) => {
                let border = "#e5e7eb", bg = "#f9fafb", color = "#9ca3af", text = "Bản nháp";
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
                <Space size={12}>
                    <Access
                        permission={ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES}
                        hideChildren
                    >
                        <SettingOutlined
                            style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                            title="Cấu hình tiêu chí"
                            onClick={() => {
                                navigate(`/admin/evaluation/templates/${entity.id}`);
                            }}
                        />
                    </Access>

                    {entity.status === "DRAFT" && (
                        <Access
                            permission={ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES}
                            hideChildren
                        >
                            <EditOutlined
                                style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                                title="Chỉnh sửa thông tin"
                                onClick={() => {
                                    setDataInit(entity);
                                    setOpenModal(true);
                                }}
                            />
                        </Access>
                    )}

                    {entity.status === "DRAFT" && entity.id && (
                        <Access
                            permission={ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES}
                            hideChildren
                        >
                            <Popconfirm
                                title="Kích hoạt mẫu đánh giá?"
                                description="Lưu ý: Mẫu sau khi kích hoạt sẽ không thể chỉnh sửa cấu trúc nữa."
                                onConfirm={() => handlePublish(entity.id!)}
                                okText="Đồng ý"
                                cancelText="Hủy"
                            >
                                <CheckCircleOutlined
                                    style={{ fontSize: 18, color: "#389e0d", cursor: "pointer" }}
                                    title="Kích hoạt mẫu"
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
            title="Quản lý Mẫu đánh giá (Templates)"
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
                    loading={loading}
                    columns={columns}
                    dataSource={templates}
                    scroll={{ x: 1000 }}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        await fetchTemplates(q);
                        return {
                            data: templates,
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
                reloadTable={() => fetchTemplates(query)}
            />
        </PageContainer>
    );
};

export default TemplatePage;
