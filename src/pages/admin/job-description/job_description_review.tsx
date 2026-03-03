import { useState, useMemo, useCallback } from "react";
import { Space, Badge, Button, message, Modal, Input, Tooltip } from "antd";
import {
    EyeOutlined,
    CheckOutlined,
    CloseOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import dayjs from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";

import { jobDescriptions } from "@/pages/admin/job-description/job_descriptions";
import ViewJobDescription from "@/pages/admin/job-description/view.job-description"; // giả sử bạn có component này

// ==================== TYPES ====================
export interface ReviewHistory {
    reviewer: string;
    title: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    comment: string | null;
    date: string | null;
}

export interface JobDescription {
    id: string;
    title: string;
    department: string;
    createdAt: string;
    reviewStatus: "DRAFT" | "IN_REVIEW" | "REJECTED" | "PUBLIC";
    currentReviewer: string | null;
    rejectReason: string | null;
    reviewHistory: ReviewHistory[];
    issuedDate?: string;
    // ... các field nội dung JD khác
}

// USER GIẢ — người đang đăng nhập (reviewer)
const CURRENT_REVIEWER = "Lê Thị B"; // Sau này lấy từ auth context

const JobDescriptionReviewPage = () => {
    const [openRejectModal, setOpenRejectModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [selectedJD, setSelectedJD] = useState<JobDescription | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    // Enrich data
    const enriched = useMemo<JobDescription[]>(
        () =>
            jobDescriptions.map((jd: any) => ({
                ...jd,
                reviewStatus: jd.reviewStatus ?? "DRAFT",
                reviewHistory: jd.reviewHistory ?? [],
                currentReviewer: jd.currentReviewer ?? null,
                rejectReason: jd.rejectReason ?? null,
            })),
        []
    );

    const [data, setData] = useState<JobDescription[]>(enriched);

    // JD được giao cho reviewer hiện tại
    const listForReviewer = useMemo(
        () =>
            data.filter(
                (jd) =>
                    jd.reviewStatus === "IN_REVIEW" && jd.currentReviewer === CURRENT_REVIEWER
            ),
        [data]
    );

    // Helper update
    const updateJD = useCallback(
        (id: string, updater: (item: JobDescription) => JobDescription) => {
            setData((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
        },
        []
    );

    const simulateAPI = (ms = 800) => new Promise((r) => setTimeout(r, ms));

    const handleAsyncAction = async (id: string, action: () => Promise<void>) => {
        setActionLoading((prev) => ({ ...prev, [id]: true }));
        try {
            await simulateAPI();
            await action();
        } catch {
            message.error("Có lỗi xảy ra!");
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    // Duyệt
    const handleApprove = (record: JobDescription) => {
        handleAsyncAction(record.id, async () => {
            updateJD(record.id, (item) => ({
                ...item,
                currentReviewer: null, // trả về admin để tiếp tục luồng
                reviewHistory: item.reviewHistory.map((h) =>
                    h.reviewer === CURRENT_REVIEWER && h.status === "PENDING"
                        ? { ...h, status: "APPROVED", date: new Date().toISOString() }
                        : h
                ),
            }));
            message.success("Đã duyệt JD thành công!");
        });
    };

    // Từ chối
    const handleReject = () => {
        if (!selectedJD || !rejectReason.trim()) {
            message.warning("Vui lòng nhập lý do từ chối!");
            return;
        }

        handleAsyncAction(selectedJD.id, async () => {
            updateJD(selectedJD.id, (item) => ({
                ...item,
                reviewStatus: "REJECTED",
                currentReviewer: null,
                rejectReason: rejectReason.trim(),
                reviewHistory: item.reviewHistory.map((h) =>
                    h.reviewer === CURRENT_REVIEWER && h.status === "PENDING"
                        ? {
                            ...h,
                            status: "REJECTED",
                            comment: rejectReason.trim(),
                            date: new Date().toISOString(),
                        }
                        : h
                ),
            }));
            message.error("Đã từ chối JD!");
            setOpenRejectModal(false);
            setRejectReason("");
            setSelectedJD(null);
        });
    };

    // Columns
    const columns: ProColumns<JobDescription>[] = [
        {
            title: "Tiêu đề",
            dataIndex: "title",
            ellipsis: true,
        },
        {
            title: "Phòng ban",
            dataIndex: "department",
            width: 140,
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            width: 160,
            render: (_, r) => dayjs(r.createdAt).format("DD/MM/YYYY HH:mm"),
            sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
        },
        {
            title: "Trạng thái",
            width: 180,
            render: () => (
                <Badge
                    status="processing"
                    text={
                        <Space size={6}>
                            <ClockCircleOutlined />
                            Đang chờ bạn duyệt
                        </Space>
                    }
                />
            ),
        },
        {
            title: "Hành động",
            width: 220,
            fixed: "right",
            render: (_, record) => {
                const loading = actionLoading[record.id];

                return (
                    <Space>
                        <Tooltip title="Xem chi tiết JD">
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => {
                                    setSelectedJD(record);
                                    setOpenView(true);
                                }}
                            />
                        </Tooltip>

                        <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            loading={loading}
                            onClick={() => handleApprove(record)}
                        >
                            Duyệt
                        </Button>

                        <Button
                            danger
                            icon={<CloseOutlined />}
                            loading={loading}
                            onClick={() => {
                                setSelectedJD(record);
                                setRejectReason("");
                                setOpenRejectModal(true);
                            }}
                        >
                            Từ chối
                        </Button>
                    </Space>
                );
            },
        },
    ];

    // Expanded row: lịch sử duyệt
    const expandedRowRender = (record: JobDescription) => (
        <div style={{ padding: "8px 24px", fontSize: 13 }}>
            <strong>Lịch sử duyệt:</strong>
            {record.reviewHistory.length === 0 ? (
                <div style={{ color: "#999", marginTop: 8 }}>Chưa có lịch sử</div>
            ) : (
                record.reviewHistory.map((h, idx) => (
                    <div key={idx} style={{ marginTop: 6 }}>
                        • {h.reviewer} ({h.title}) —{" "}
                        {h.status === "PENDING" && <span style={{ color: "#faad14" }}>Đang chờ</span>}
                        {h.status === "APPROVED" && <span style={{ color: "#52c41a" }}>Đã duyệt</span>}
                        {h.status === "REJECTED" && (
                            <span style={{ color: "red" }}>
                                Từ chối: {h.comment || "Không có lý do"} (
                                {h.date ? dayjs(h.date).format("DD/MM/YY HH:mm") : "—"})
                            </span>
                        )}
                    </div>
                ))
            )}
        </div>
    );

    return (
        <PageContainer title="Danh sách JD bạn cần duyệt">
            <DataTable
                rowKey="id"
                columns={columns}
                dataSource={listForReviewer}
                pagination={false}
                expandable={{ expandedRowRender }}
                locale={{
                    emptyText: (
                        <div style={{ padding: "40px 0", color: "#999" }}>
                            Hiện tại không có mô tả công việc nào được giao cho bạn duyệt.
                        </div>
                    ),
                }}
                scroll={{ x: 1000 }}
            />

            {/* Modal từ chối */}
            <Modal
                title="Nhập lý do từ chối"
                open={openRejectModal}
                onCancel={() => {
                    setOpenRejectModal(false);
                    setRejectReason("");
                }}
                okText="Gửi từ chối"
                okButtonProps={{ danger: true }}
                onOk={handleReject}
            >
                <Input.TextArea
                    rows={5}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Vui lòng nhập lý do từ chối chi tiết..."
                />
            </Modal>

            {/* Modal xem chi tiết */}
            <ViewJobDescription
                open={openView}
                onClose={() => setOpenView(false)}
                dataInit={selectedJD}
            />
        </PageContainer>
    );
};

export default JobDescriptionReviewPage;