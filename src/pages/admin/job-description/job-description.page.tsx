import { useState } from "react";
import { Space, Badge, Button, message, Modal, Input } from "antd";
import { EyeOutlined, EditOutlined, PlusOutlined, SendOutlined } from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import dayjs from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";

import ModalJobDescription from "./modal.job-description";
import ViewJobDescription from "./view.job-description";
import ModalSelectReviewer from "./modal.select-reviewer";

import { jobDescriptions } from "./job_descriptions";

const JobDescriptionPage = () => {
    // MODAL
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openSelectReviewer, setOpenSelectReviewer] = useState(false);

    // TỪ CHỐI
    const [openRejectModal, setOpenRejectModal] = useState(false);
    const [rejectReasonInput, setRejectReasonInput] = useState("");

    // DATA INIT
    const [dataInit, setDataInit] = useState<any | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);

    // MOCK FLOW FIELD (không sửa interface)
    const enriched = jobDescriptions.map((jd: any) => ({
        ...jd,
        reviewStatus: "DRAFT",
        reviewHistory: [],
        currentReviewer: null,
        rejectReason: null,
    })) as any[];

    const [data, setData] = useState<any[]>(enriched);

    // Lọc
    const filteredList = data.filter((item: any) => {
        let ok = true;
        if (searchValue) ok = item.title.toLowerCase().includes(searchValue.toLowerCase());

        if (createdAtFilter) {
            const [from, to] = createdAtFilter.split(",");
            const created = dayjs(item.createdAt);
            if (from && created.isBefore(dayjs(from))) ok = false;
            if (to && created.isAfter(dayjs(to).endOf("day"))) ok = false;
        }
        return ok;
    });

    // ==============================
    //  ADMIN: GỬI DUYỆT LẦN ĐẦU
    // ==============================
    const handleSendReview = (record: any) => {
        setDataInit(record);
        setOpenSelectReviewer(true);
    };

    const handleSelectReviewer = (reviewer: any) => {
        const updated = data.map((item: any) =>
            item.id === dataInit.id
                ? {
                    ...item,
                    reviewStatus: "IN_REVIEW",
                    currentReviewer: reviewer.name,
                    rejectReason: null,
                    reviewHistory: [
                        ...item.reviewHistory,
                        {
                            reviewer: reviewer.name,
                            title: reviewer.title,
                            status: "PENDING",
                            comment: null,
                            date: null,
                        },
                    ],
                }
                : item
        );

        setData(updated);
        setOpenSelectReviewer(false);
        message.success("Đã gửi tới người duyệt!");
    };

    // ==============================
    //  ADMIN: GỬI TIẾP SAU KHI REVIEWER DUYỆT
    // ==============================
    const handleSendNextReviewer = (record: any) => {
        setDataInit(record);
        setOpenSelectReviewer(true);
    };

    // ==============================
    //  ADMIN: GỬI LẠI SAU KHI BỊ TỪ CHỐI
    // ==============================
    const handleResend = (record: any) => {
        setDataInit(record);
        setOpenSelectReviewer(true);
    };

    // ==============================
    //  REVIEWER TỪ CHỐI (mock)
    // ==============================
    const handleRejectFromReviewer = (record: any, reason: string) => {
        const updated = data.map((item: any) =>
            item.id === record.id
                ? {
                    ...item,
                    reviewStatus: "REJECTED",
                    rejectReason: reason,
                    currentReviewer: null,
                    reviewHistory: item.reviewHistory.map((h: any) =>
                        h.reviewer === item.currentReviewer
                            ? {
                                ...h,
                                status: "REJECTED",
                                comment: reason,
                                date: new Date().toISOString(),
                            }
                            : h
                    ),
                }
                : item
        );

        setData(updated);
        setOpenRejectModal(false);
        message.error("JD đã bị từ chối!");
    };

    // ==============================
    //  CEO DUYỆT → BAN HÀNH
    // ==============================
    const handlePublish = (record: any) => {
        const updated = data.map((item: any) =>
            item.id === record.id
                ? {
                    ...item,
                    reviewStatus: "PUBLIC",
                    currentReviewer: null,
                    issuedDate: dayjs().toISOString(),
                    reviewHistory: item.reviewHistory.map((h: any) =>
                        h.reviewer === "CEO"
                            ? { ...h, status: "APPROVED", date: new Date().toISOString() }
                            : h
                    ),
                }
                : item
        );

        setData(updated);
        message.success("JD đã được CEO ban hành!");
    };

    // ==============================
    //  TABLE COLUMNS (ADMIN)
    // ==============================
    const columns: ProColumns<any>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        {
            title: "Tiêu đề",
            dataIndex: "title",
            ellipsis: true,
        },
        {
            title: "Phòng ban",
            dataIndex: "department",
        },
        {
            title: "Người duyệt hiện tại",
            render: (_, r: any) => r.currentReviewer || "Chưa gửi",
        },
        {
            title: "Trạng thái",
            render: (_, r: any) => {
                if (r.reviewStatus === "DRAFT") return <Badge status="default" text="Nháp" />;
                if (r.reviewStatus === "IN_REVIEW") return <Badge status="processing" text="Đang duyệt" />;
                if (r.reviewStatus === "REJECTED") return <Badge status="error" text="Bị từ chối" />;
                if (r.reviewStatus === "PUBLIC") return <Badge status="success" text="Đã ban hành" />;
            },
        },
        {
            title: "Hành động",
            width: 380,
            fixed: "right",
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setDataInit(record);
                            setOpenView(true);
                        }}
                    />

                    <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                            setDataInit(record);
                            setOpenModal(true);
                        }}
                    />

                    {record.reviewStatus === "DRAFT" && (
                        <Button
                            icon={<SendOutlined />}
                            onClick={() => handleSendReview(record)}
                            style={{
                                backgroundColor: "#ff5fa2",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: 6,
                                boxShadow: "0 2px 6px rgba(255, 95, 162, 0.35)",
                                fontWeight: 500,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#ff4b97";
                                e.currentTarget.style.boxShadow = "0 4px 10px rgba(255, 95, 162, 0.45)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#ff5fa2";
                                e.currentTarget.style.boxShadow = "0 2px 6px rgba(255, 95, 162, 0.35)";
                            }}
                        >
                            Gửi duyệt
                        </Button>
                    )}

                    {record.reviewStatus === "IN_REVIEW" && !record.currentReviewer && (
                        <Button type="primary" onClick={() => handleSendNextReviewer(record)}>
                            Chọn người duyệt tiếp
                        </Button>
                    )}

                    {record.reviewStatus === "REJECTED" && (
                        <Button type="primary" onClick={() => handleResend(record)}>
                            Gửi lại
                        </Button>
                    )}

                    {record.reviewHistory?.length > 0 &&
                        record.reviewHistory.at(-1)?.reviewer === "CEO" &&
                        record.reviewHistory.at(-1)?.status === "PENDING" &&
                        record.reviewStatus === "IN_REVIEW" && (
                            <Button type="primary" danger onClick={() => handlePublish(record)}>
                                Ban hành
                            </Button>
                        )}
                </Space>
            ),
        },
    ];

    // ==============================
    //         LỊCH SỬ DUYỆT
    // ==============================
    const renderReviewHistory = (item: any) => (
        <div style={{ fontSize: 13, marginTop: 10 }}>
            <strong>Lịch sử duyệt:</strong>
            {item.reviewHistory.length === 0 && <div>Chưa có</div>}
            {item.reviewHistory.map((h: any, idx: number) => (
                <div key={idx} style={{ marginTop: 4 }}>
                    • {h.reviewer} ({h.title}) —{" "}
                    {h.status === "PENDING" && (
                        <span style={{ color: "#faad14" }}>Đang chờ</span>
                    )}
                    {h.status === "APPROVED" && (
                        <span style={{ color: "#52c41a" }}>Đã duyệt</span>
                    )}
                    {h.status === "REJECTED" && (
                        <span style={{ color: "red" }}>Từ chối: {h.comment}</span>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <PageContainer title="Quản lý Mô tả Công việc (JD)">
            {/* BỘ LỌC + NÚT TẠO JD */}
            <div className="flex flex-col gap-3 mb-3">
                <SearchFilter
                    searchPlaceholder="Tìm theo tên..."
                    onSearch={setSearchValue}
                    onReset={() => setSearchValue("")}
                    showAddButton={true}
                    addLabel="Tạo JD"
                    onAddClick={() => {
                        setDataInit(null);
                        setOpenModal(true);
                    }}
                />
                <DateRangeFilter fieldName="createdAt" onChange={setCreatedAtFilter} />
            </div>

            {/* DANH SÁCH JD */}
            <DataTable
                rowKey="id"
                columns={columns}
                dataSource={filteredList}
                pagination={{
                    pageSize: 10,
                    total: filteredList.length,
                    showSizeChanger: false,
                }}
                expandable={{
                    expandedRowRender: renderReviewHistory,
                }}
            />

            {/* XEM JD */}
            <ViewJobDescription
                open={openView}
                onClose={() => setOpenView(false)}
                dataInit={dataInit}
            />

            {/* SỬA/TẠO JD */}
            <ModalJobDescription
                open={openModal}
                onOpenChange={setOpenModal}
                dataInit={dataInit}
                onFinish={(values) => {
                    if (dataInit) {
                        // EDIT: Cập nhật JD đã có
                        const updated = data.map((item: any) =>
                            item.id === dataInit.id
                                ? { ...item, ...values }
                                : item
                        );
                        setData(updated);
                        message.success("Cập nhật JD thành công!");
                    } else {
                        // CREATE: Tạo JD mới
                        const newJD = {
                            id: Date.now().toString(),
                            ...values,
                            createdAt: new Date().toISOString(),
                            reviewStatus: "DRAFT",
                            reviewHistory: [],
                            currentReviewer: null,
                            rejectReason: null,
                        };
                        setData([newJD, ...data]);
                        message.success("Tạo JD thành công!");
                    }
                    setOpenModal(false);
                }}
            />

            {/* CHỌN NGƯỜI DUYỆT */}
            <ModalSelectReviewer
                open={openSelectReviewer}
                onCancel={() => setOpenSelectReviewer(false)}
                onSubmit={handleSelectReviewer}
            />

            {/* LÝ DO TỪ CHỐI */}
            <Modal
                title="Lý do từ chối"
                open={openRejectModal}
                onCancel={() => setOpenRejectModal(false)}
                okText="Từ chối"
                onOk={() => handleRejectFromReviewer(dataInit, rejectReasonInput)}
            >
                <Input.TextArea
                    rows={4}
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                />
            </Modal>
        </PageContainer>
    );
};

export default JobDescriptionPage;