import { useState } from "react";
import { Button, Space, message, Modal, Input, Badge } from "antd";
import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import dayjs from "dayjs";

// IMPORT ĐÚNG — dùng alias '@'
import { jobDescriptions } from "@/pages/admin/job-description/job_descriptions";

// USER GIẢ — người duyệt hiện tại
const CURRENT_REVIEWER = "Lê Thị B";

const JobDescriptionReviewPage = () => {
    const [openRejectModal, setOpenRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedJD, setSelectedJD] = useState<any | null>(null);

    // Enrich data không sửa interface
    const enriched = jobDescriptions.map((jd: any) => ({
        ...jd,
        reviewStatus: jd.reviewStatus ?? "DRAFT",
        reviewHistory: jd.reviewHistory ?? [],
        currentReviewer: jd.currentReviewer ?? null,
        rejectReason: jd.rejectReason ?? null,
    }));

    const [data, setData] = useState<any[]>(enriched);

    // Lấy JD giao cho LÊ THỊ B
    const listForReviewer = data.filter(
        (jd: any) =>
            jd.reviewStatus === "IN_REVIEW" &&
            jd.currentReviewer === CURRENT_REVIEWER
    );

    // --------------------------------------
    // Reviewer DUYỆT
    // --------------------------------------
    const handleApprove = (record: any) => {
        const updated = data.map((jd: any) =>
            jd.id === record.id
                ? {
                    ...jd,
                    currentReviewer: null, // reviewer duyệt xong → trả về admin
                    reviewHistory: jd.reviewHistory.map((h: any) =>
                        h.reviewer === CURRENT_REVIEWER
                            ? {
                                ...h,
                                status: "APPROVED",
                                date: new Date().toISOString(),
                            }
                            : h
                    ),
                }
                : jd
        );

        setData(updated);
        message.success("Đã duyệt thành công!");
    };

    // --------------------------------------
    // Reviewer TỪ CHỐI
    // --------------------------------------
    const submitReject = () => {
        if (!selectedJD) return;

        const updated = data.map((jd: any) =>
            jd.id === selectedJD.id
                ? {
                    ...jd,
                    reviewStatus: "REJECTED",
                    currentReviewer: null,
                    rejectReason,
                    reviewHistory: jd.reviewHistory.map((h: any) =>
                        h.reviewer === CURRENT_REVIEWER
                            ? {
                                ...h,
                                status: "REJECTED",
                                date: new Date().toISOString(),
                                comment: rejectReason,
                            }
                            : h
                    ),
                }
                : jd
        );

        setData(updated);
        message.error("Đã từ chối JD!");
        setOpenRejectModal(false);
        setRejectReason("");
    };

    // --------------------------------------
    // TABLE COLUMNS
    // --------------------------------------
    const columns: any[] = [
        {
            title: "Tiêu đề",
            dataIndex: "title",
        },
        {
            title: "Phòng ban",
            dataIndex: "department",
        },
        {
            title: "Ngày tạo",
            render: (_: any, r: any) =>
                dayjs(r.createdAt).format("DD/MM/YYYY HH:mm"),
        },
        {
            title: "Trạng thái",
            render: (_: any, r: any) => (
                <Badge
                    status="processing"
                    text="Đang chờ bạn duyệt"
                />
            ),
        },
        {
            title: "Hành động",
            width: 200,
            render: (_: any, record: any) => (
                <Space>
                    <Button type="primary" onClick={() => handleApprove(record)}>
                        Duyệt
                    </Button>

                    <Button
                        danger
                        onClick={() => {
                            setSelectedJD(record);
                            setOpenRejectModal(true);
                        }}
                    >
                        Từ chối
                    </Button>
                </Space>
            ),
        },
    ];

    // --------------------------------------
    // RENDER PAGE
    // --------------------------------------
    return (
        <PageContainer title="Danh sách JD bạn cần duyệt">
            <DataTable
                rowKey="id"
                dataSource={listForReviewer}
                columns={columns}
                pagination={false}
            />

            {/* MODAL TỪ CHỐI */}
            <Modal
                open={openRejectModal}
                title="Nhập lý do từ chối"
                okText="Gửi"
                cancelText="Hủy"
                onCancel={() => setOpenRejectModal(false)}
                onOk={submitReject}
            >
                <Input.TextArea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do..."
                />
            </Modal>
        </PageContainer>
    );
};

export default JobDescriptionReviewPage;
