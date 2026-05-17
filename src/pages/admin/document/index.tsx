import { useEffect, useRef, useState } from "react";
import { Space, Tag, Popconfirm, Modal, Image, Button, Dropdown } from "antd";
import {
    EditOutlined,
    EyeOutlined,
    DeleteOutlined,
    PoweroffOutlined,
    QrcodeOutlined,
    ShareAltOutlined,
    DownloadOutlined,
    LockOutlined,
    MoreOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import dayjs from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";

import type { IDocument } from "@/types/backend";
import Access from "@/components/share/access";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import {
    useDocumentsQuery,
    useToggleActiveDocumentMutation,
    useDeleteDocumentMutation,
} from "@/hooks/useDocuments";
import { useDocumentCategoriesActiveQuery } from "@/hooks/useDocumentCategories";

import ModalDocument from "./modal.document";
import ViewDetailDocument from "./view.document";
import ModalDocumentShareToken from "./ModalDocumentShareToken";

const STATUS_COLOR: Record<string, string> = {
    NEED_CREATE: "default",
    IN_PROGRESS: "processing",
    NEED_UPDATE: "warning",
    TERMINATED: "error",
};

const STATUS_LABEL: Record<string, string> = {
    NEED_CREATE: "Cần tạo",
    IN_PROGRESS: "Đang hiệu lực",
    NEED_UPDATE: "Cần cập nhật",
    TERMINATED: "Đã huỷ",
};

const DocumentPage = () => {
    const canShare = useAccess(ALL_PERMISSIONS.DOCUMENTS.CREATE_SHARE_TOKEN);

    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<IDocument | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState(false);

    const [openQrModal, setOpenQrModal] = useState(false);
    const [openShareModal, setOpenShareModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [issuedDateFilter, setIssuedDateFilter] = useState<string | null>(null);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const tableRef = useRef<ActionType>(null);
    const { data, isFetching, refetch } = useDocumentsQuery(query);
    const toggleMutation = useToggleActiveDocumentMutation();
    const deleteMutation = useDeleteDocumentMutation();
    const { data: categoriesActive } = useDocumentCategoriesActiveQuery();

    const categoryOptions =
        categoriesActive?.map((c) => ({
            label: c.categoryName,
            value: String(c.id),
            color: "blue",
        })) ?? [];

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters: string[] = [];
        if (searchValue)
            filters.push(`(documentCode~'${searchValue}' or documentName~'${searchValue}')`);
        if (activeFilter !== null) filters.push(`active=${activeFilter}`);
        if (categoryFilter) filters.push(`category.id=${categoryFilter}`);
        if (issuedDateFilter) filters.push(issuedDateFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, activeFilter, categoryFilter, issuedDateFilter]);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const documents = data?.result ?? [];

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters: string[] = [];
        if (searchValue)
            filters.push(`(documentCode~'${searchValue}' or documentName~'${searchValue}')`);
        if (activeFilter !== null) filters.push(`active=${activeFilter}`);
        if (categoryFilter) filters.push(`category.id=${categoryFilter}`);
        if (issuedDateFilter) filters.push(issuedDateFilter);
        if (filters.length > 0) q.filter = filters.join(" and ");

        let temp = queryString.stringify(q, { encode: false });
        let sortBy = "sort=createdAt,desc";
        if (sort?.documentCode)
            sortBy = sort.documentCode === "ascend" ? "sort=documentCode,asc" : "sort=documentCode,desc";
        else if (sort?.documentName)
            sortBy = sort.documentName === "ascend" ? "sort=documentName,asc" : "sort=documentName,desc";
        return `${temp}&${sortBy}`;
    };

    const columns: ProColumns<IDocument>[] = [
        {
            title: "STT",
            key: "index",
            width: 60,
            align: "center",
            render: (_text, _record, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã văn bản",
            dataIndex: "documentCode",
            sorter: true,
            width: 150,
            render: (_, record) => <Tag color="blue">{record.documentCode}</Tag>,
        },
        {
            title: "Mã công ty",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Tag color="blue">
                    {record.department?.companyCode || "--"}
                </Tag>
            ),
        },
        {
            title: "Công ty",
            width: 220,
            ellipsis: true,
            render: (_, record) =>
                record.department?.companyName || "—",
        },
        {
            title: "Phòng ban",
            width: 180,
            render: (_, record) =>
                record.department?.name ? (
                    <Tag color="cyan">
                        {record.department.name}
                    </Tag>
                ) : (
                    "—"
                ),
        },
        {
            title: "Tên văn bản",
            dataIndex: "documentName",
            sorter: true,
            width: 320,
            render: (_, record) => (
                <span
                    style={{
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        fontWeight: 500,
                    }}
                >
                    {record.documentName}
                </span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 140,
            align: "center",
            render: (_, record) =>
                record.status ? (
                    <Tag color={STATUS_COLOR[record.status] || "default"}>
                        {STATUS_LABEL[record.status] || record.status}
                    </Tag>
                ) : "—",
        },
        {
            title: "Ngày ban hành",
            dataIndex: "issuedDate",
            width: 140,
            align: "center",
            render: (_, record) =>
                record.issuedDate ? dayjs(record.issuedDate).format("DD/MM/YYYY") : "—",
        },
        // {
        //     title: "Kích hoạt",
        //     dataIndex: "active",
        //     width: 120,
        //     align: "center",
        //     render: (_, record) =>
        //         record.active ? (
        //             <Badge status="success" text="Hoạt động" />
        //         ) : (
        //             <Badge status="error" text="Tắt" />
        //         ),
        // },
        {
            title: "QR",
            align: "center",
            width: 60,
            render: (_, record) => (
                <div
                    onClick={() => { setSelectedDocument(record); setOpenQrModal(true); }}
                    style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                        background: "linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%)",
                        border: "1.5px solid #ff85c0", transition: "all 0.2s ease",
                        boxShadow: "0 1px 4px rgba(255,133,192,0.15)",
                    }}
                    onMouseEnter={e => {
                        const el = e.currentTarget;
                        el.style.background = "linear-gradient(135deg, #ff4d94 0%, #eb2f7a 100%)";
                        el.style.boxShadow = "0 4px 12px rgba(235,47,122,0.35)";
                        el.style.transform = "scale(1.1)";
                        (el.querySelector("span") as HTMLElement).style.color = "#fff";
                    }}
                    onMouseLeave={e => {
                        const el = e.currentTarget;
                        el.style.background = "linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%)";
                        el.style.boxShadow = "0 1px 4px rgba(255,133,192,0.15)";
                        el.style.transform = "scale(1)";
                        (el.querySelector("span") as HTMLElement).style.color = "#eb2f7a";
                    }}
                >
                    <QrcodeOutlined style={{ fontSize: 18, color: "#eb2f7a", transition: "color 0.2s ease" }} />
                </div>
            ),
        },
        {
            title: "Hành động",
            align: "center",
            width: 100,
            fixed: "right",
            render: (_, entity) => {
                const menuItems = [
                    {
                        key: "edit",
                        icon: <EditOutlined style={{ color: "#fa8c16" }} />,
                        label: (
                            <Access permission={ALL_PERMISSIONS.DOCUMENTS.UPDATE} hideChildren>
                                <span onClick={() => { setDataInit(entity); setOpenModal(true); }}>
                                    Chỉnh sửa
                                </span>
                            </Access>
                        ),
                    },
                    {
                        key: "toggle",
                        icon: (
                            <PoweroffOutlined
                                style={{ color: (entity.active && entity.status !== "TERMINATED") ? "#52c41a" : "#d9d9d9" }}
                            />
                        ),
                        label: (
                            <Access permission={ALL_PERMISSIONS.DOCUMENTS.TOGGLE_ACTIVE} hideChildren>
                                <Popconfirm
                                    title={(entity.active && entity.status !== "TERMINATED") ? "Xác nhận ngưng hoạt động văn bản này?" : "Xác nhận kích hoạt văn bản này?"}
                                    okText="Xác nhận"
                                    cancelText="Huỷ"
                                    onConfirm={() => entity.id && toggleMutation.mutate(entity.id)}
                                >
                                    <span>{(entity.active && entity.status !== "TERMINATED") ? "Ngưng hoạt động" : "Kích hoạt"}</span>
                                </Popconfirm>
                            </Access>
                        ),
                    },
                    // 👇 chỉ hiện khi có quyền share
                    ...(canShare ? [{
                        key: "share",
                        icon: <ShareAltOutlined style={{ color: "#f0226e" }} />,
                        label: (
                            <span onClick={() => {
                                setSelectedDocument(entity);
                                setOpenShareModal(true);
                            }}>
                                Chia sẻ công khai
                            </span>
                        ),
                    }] : []),
                ];

                return (
                    <Space size="small">
                        <Access permission={ALL_PERMISSIONS.DOCUMENTS.GET_BY_ID} hideChildren>
                            <EyeOutlined
                                style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                                onClick={() => { setDataInit(entity); setOpenViewDetail(true); }}
                            />
                        </Access>
                        <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                            <MoreOutlined style={{ fontSize: 20, cursor: "pointer" }} />
                        </Dropdown>
                    </Space>
                );
            },
        },
    ];

    return (
        <PageContainer
            title="Quản lý văn bản"
            filter={
                <div className="flex flex-col gap-3">
                    <SearchFilter
                        searchPlaceholder="Tìm theo mã hoặc tên văn bản..."
                        addLabel="Thêm văn bản"
                        showFilterButton={false}
                        onSearch={(val) => setSearchValue(val)}
                        onReset={() => refetch()}
                        onAddClick={() => { setDataInit(null); setOpenModal(true); }}
                    />
                    <div className="flex flex-wrap gap-3 items-center">
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "category",
                                    label: "Loại văn bản",
                                    options: categoryOptions,
                                },
                                {
                                    key: "active",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Hoạt động", value: true, color: "green" },
                                        { label: "Ngưng hoạt động", value: false, color: "red" },
                                    ],
                                },
                            ]}
                            onChange={(filters) => {
                                setCategoryFilter(filters.category || null);
                                setActiveFilter(filters.active !== undefined ? filters.active : null);
                            }}
                        />
                        <DateRangeFilter
                            fieldName="issuedDate"
                            onChange={(filter) => setIssuedDateFilter(filter)}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE}>
                <DataTable<IDocument>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={documents}
                    request={async (params, sort) => {
                        const q = buildQuery(params, sort);
                        setQuery(q);
                        return Promise.resolve({ data: documents, success: true, total: meta.total });
                    }}
                    pagination={{
                        defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
                        current: meta.page,
                        pageSize: meta.pageSize,
                        total: meta.total,
                        showQuickJumper: true,
                        showTotal: (total, range) => (
                            <div style={{ fontSize: 13 }}>
                                <span style={{ fontWeight: 500 }}>{range[0]}–{range[1]}</span>{" "}
                                trên{" "}
                                <span style={{ fontWeight: 600, color: "#1677ff" }}>
                                    {total.toLocaleString()}
                                </span>{" "}
                                văn bản
                            </div>
                        ),
                    }}
                    rowSelection={false}
                    scroll={{ x: 'max-content' }}
                />
            </Access>

            <ModalDocument
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            <ViewDetailDocument
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
            />

            {/* Modal QR nội bộ */}
            <Modal
                open={openQrModal}
                onCancel={() => setOpenQrModal(false)}
                footer={null}
                closable={false}
                width={420}
                centered
                styles={{
                    content: { padding: 0, borderRadius: 28, overflow: "hidden" },
                    mask: { backdropFilter: "blur(6px)" },
                }}
            >
                {selectedDocument && (
                    <>
                        <div style={{
                            background: "linear-gradient(135deg,#f0226e 0%,#ff5fa0 60%,#ff85bc 100%)",
                            padding: "22px 20px 26px", position: "relative",
                        }}>
                            <button
                                onClick={() => setOpenQrModal(false)}
                                style={{
                                    position: "absolute", top: 14, right: 14,
                                    width: 32, height: 32,
                                    background: "rgba(255,255,255,0.18)",
                                    border: "1.5px solid rgba(255,255,255,0.28)",
                                    borderRadius: 10, color: "rgba(255,255,255,0.9)",
                                    fontSize: 18, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    outline: "none", lineHeight: 1,
                                }}
                            >×</button>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                                <div style={{
                                    width: 52, height: 52, background: "rgba(255,255,255,0.2)",
                                    borderRadius: 14, display: "flex", alignItems: "center",
                                    justifyContent: "center", flexShrink: 0,
                                }}>
                                    <QrcodeOutlined style={{ fontSize: 26, color: "white" }} />
                                </div>
                                <div>
                                    <div style={{
                                        color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: 500,
                                        letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 3,
                                    }}>
                                        Mã QR nội bộ
                                    </div>
                                    <div style={{ color: "white", fontSize: 17, fontWeight: 500, lineHeight: 1.35 }}>
                                        {selectedDocument.documentName}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                background: "white", color: "#e8256b",
                                fontSize: 13, fontWeight: 600, padding: "5px 14px", borderRadius: 30,
                            }}>
                                <QrcodeOutlined style={{ fontSize: 11 }} />
                                {selectedDocument.documentCode}
                            </div>
                        </div>

                        <div style={{ padding: 24 }}>
                            <div style={{
                                border: "1.5px solid #ffe0ee", borderRadius: 20, padding: 20,
                                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
                            }}>
                                {selectedDocument.qrCode ? (
                                    <Image
                                        src={`data:image/png;base64,${selectedDocument.qrCode}`}
                                        width={190} height={190} preview={false}
                                        style={{ borderRadius: 4, display: "block" }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 190, height: 190, display: "flex",
                                        alignItems: "center", justifyContent: "center",
                                        background: "#f9fafb", borderRadius: 4, color: "#ccc", fontSize: 13,
                                    }}>Chưa có mã QR</div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                                <Button
                                    icon={<DownloadOutlined />}
                                    style={{ flex: 1, height: 42, borderRadius: 14, fontWeight: 500, borderColor: "#fcc", color: "#e8256b" }}
                                    onClick={() => {
                                        if (!selectedDocument.qrCode) return;
                                        const a = document.createElement("a");
                                        a.href = `data:image/png;base64,${selectedDocument.qrCode}`;
                                        a.download = `QR_${selectedDocument.documentCode}.png`;
                                        a.click();
                                    }}
                                >Tải xuống</Button>

                                {canShare && (
                                    <Button
                                        icon={<ShareAltOutlined />}
                                        style={{
                                            flex: 1, height: 42, borderRadius: 14, fontWeight: 500,
                                            background: "linear-gradient(135deg,#f0226e,#ff5fa0)",
                                            border: "none", color: "white",
                                            boxShadow: "0 4px 14px rgba(240,34,110,0.3)",
                                        }}
                                        onClick={() => { setOpenQrModal(false); setOpenShareModal(true); }}
                                    >Chia sẻ công khai</Button>
                                )}
                            </div>

                            <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "11px 14px", background: "#fff7fa",
                                border: "1px solid #fce4ef", borderRadius: 12,
                            }}>
                                <LockOutlined style={{ fontSize: 13, color: "#e8256b", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: "#c0537a" }}>
                                    Mã QR chỉ dùng nội bộ — quét bằng ứng dụng nội bộ
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </Modal>

            <ModalDocumentShareToken
                open={openShareModal}
                onClose={() => setOpenShareModal(false)}
                document={selectedDocument}
            />
        </PageContainer>
    );
};

export default DocumentPage;