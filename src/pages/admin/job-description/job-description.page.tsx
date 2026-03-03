import { useState, useMemo, useCallback, useEffect } from "react";
import {
    Space,
    Badge,
    Button,
    message,
    Modal,
    Input,
    Tooltip,
    Tag,
    Timeline,
    Alert,
    Dropdown,
    Menu,
} from "antd";
import {
    EyeOutlined,
    EditOutlined,
    SendOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    MoreOutlined,
} from "@ant-design/icons";
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
    positions?: string[];
    createdAt: string;
    status: "DRAFT" | "IN_REVIEW" | "REJECTED" | "PUBLIC";
    currentReviewer: string | null;
    rejectReason: string | null;
    reviewHistory: ReviewHistory[];
    issuedDate?: string;
    issuedBy?: string;
}

const JobDescriptionPage = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openSelectReviewer, setOpenSelectReviewer] = useState(false);
    const [openRejectModal, setOpenRejectModal] = useState(false);

    const [dataInit, setDataInit] = useState<JobDescription | null>(null);
    const [rejectReasonInput, setRejectReasonInput] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);

    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    const [tableKey, setTableKey] = useState(0);

    useEffect(() => {
        const handleResize = () => setTableKey((prev) => prev + 1);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ==================== MOCK DATA ====================
    const initialData: JobDescription[] = useMemo(() => {
        return jobDescriptions.map((jd: any) => ({
            ...jd,
            id: String(jd.id),
            status: jd.status,
            positions: jd.positions || [],
            reviewHistory: jd.reviewHistory || [],
            currentReviewer: jd.currentReviewer || null,
            rejectReason: jd.rejectReason || null,
            issuedDate: jd.issuedDate || undefined,
            issuedBy: jd.issuedBy || undefined,
        }));
    }, []);

    const [data, setData] = useState<JobDescription[]>(initialData);

    // ==================== FILTER ====================
    const filteredList = useMemo(() => {
        return data.filter((item) => {
            let ok = true;
            if (searchValue) {
                ok = item.title.toLowerCase().includes(searchValue.toLowerCase());
            }
            if (createdAtFilter) {
                const [from, to] = createdAtFilter.split(",");
                const created = dayjs(item.createdAt);
                if (from && created.isBefore(dayjs(from))) ok = false;
                if (to && created.isAfter(dayjs(to).endOf("day"))) ok = false;
            }
            return ok;
        });
    }, [data, searchValue, createdAtFilter]);

    // ==================== HELPER ====================
    const updateJD = useCallback((id: string, updater: (item: JobDescription) => JobDescription) => {
        setData((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
    }, []);

    const simulateAPI = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleAsyncAction = async (id: string, actionFn: () => Promise<void>) => {
        setActionLoading((prev) => ({ ...prev, [id]: true }));
        try {
            await simulateAPI();
            await actionFn();
        } catch {
            message.error("Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: false }));
        }
    };

    // ==================== UI HELPERS ====================
    const getStatusTag = (record: JobDescription) => {
        const config: Record<string, { text: string; color: string }> = {
            DRAFT: { text: "Nháp", color: "blue" },
            IN_REVIEW: { text: record.currentReviewer ? `Chờ ${record.currentReviewer}` : "Đang chờ duyệt", color: "orange" },
            PUBLIC: { text: "Đã ban hành", color: "green" },
            REJECTED: { text: "Bị từ chối", color: "red" },
        };

        const c = config[record.status] || config.IN_REVIEW;

        return (
            <Tag color={c.color} style={{ minWidth: 140, textAlign: "center", fontWeight: 500 }}>
                {c.text}
            </Tag>
        );
    };

    // ==================== MORE ACTIONS DROPDOWN ====================
    const getMoreActionsMenu = (record: JobDescription) => {
        const isPublished = record.status === "PUBLIC";

        return (
            <Menu>
                <Menu.Item
                    key="assign-position"
                    icon={<SendOutlined />}
                    disabled={!isPublished}
                    onClick={() => {
                        if (!isPublished) {
                            message.warning("Chỉ JD đã ban hành mới được phép gán!");
                            return;
                        }
                        message.success(`Đã gán JD "${record.title}" cho chức danh`);
                    }}
                >
                    Gán cho chức danh
                </Menu.Item>

                <Menu.Item
                    key="assign-employee"
                    icon={<SendOutlined />}
                    disabled={!isPublished}
                    onClick={() => {
                        if (!isPublished) {
                            message.warning("Chỉ JD đã ban hành mới được phép gán!");
                            return;
                        }
                        message.success(`Đã gán JD "${record.title}" cho nhân viên`);
                    }}
                >
                    Gán cho nhân viên
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                    key="send-candidate"
                    icon={<SendOutlined />}
                    disabled={!isPublished}
                    onClick={() => {
                        if (!isPublished) {
                            message.warning("Chỉ JD đã ban hành mới được gửi cho ứng viên!");
                            return;
                        }
                        message.success(`Đã gửi JD "${record.title}" cho ứng viên`);
                    }}
                >
                    Gửi cho ứng viên / Đăng tuyển
                </Menu.Item>
            </Menu>
        );
    };

    // ==================== ACTIONS ====================
    const handleSendReview = (record: JobDescription) => {
        setDataInit(record);
        setOpenSelectReviewer(true);
    };

    const handleSelectReviewer = (reviewer: { name: string; title: string }) => {
        if (!dataInit) return;

        handleAsyncAction(dataInit.id, async () => {
            updateJD(dataInit.id, (item) => ({
                ...item,
                status: "IN_REVIEW",
                currentReviewer: reviewer.name,
                rejectReason: null,
                reviewHistory: [
                    ...item.reviewHistory,
                    {
                        reviewer: reviewer.name,
                        title: reviewer.title,
                        status: "PENDING",
                        comment: null,
                        date: dayjs().toISOString(),
                    },
                ],
            }));
            message.success(`Đã gửi duyệt cho ${reviewer.name}`);
        });

        setOpenSelectReviewer(false);
    };

    const handleResend = (record: JobDescription) => {
        setDataInit(record);
        setOpenSelectReviewer(true);
    };

    const handleReject = (record: JobDescription) => {
        setDataInit(record);
        setRejectReasonInput("");
        setOpenRejectModal(true);
    };

    const handleConfirmReject = () => {
        if (!dataInit || !rejectReasonInput.trim()) {
            message.warning("Vui lòng nhập lý do từ chối!");
            return;
        }

        handleAsyncAction(dataInit.id, async () => {
            updateJD(dataInit.id, (item) => ({
                ...item,
                status: "REJECTED",
                currentReviewer: null,
                rejectReason: rejectReasonInput.trim(),
                reviewHistory: item.reviewHistory.map((h) =>
                    h.status === "PENDING"
                        ? { ...h, status: "REJECTED", comment: rejectReasonInput.trim(), date: dayjs().toISOString() }
                        : h
                ),
            }));
            message.error("JD đã bị từ chối!");
        });

        setOpenRejectModal(false);
    };

    const handlePublish = (record: JobDescription) => {
        handleAsyncAction(record.id, async () => {
            updateJD(record.id, (item) => ({
                ...item,
                status: "PUBLIC",
                currentReviewer: null,
                issuedDate: dayjs().toISOString(),
                issuedBy: "CEO",
                reviewHistory: item.reviewHistory.map((h) =>
                    h.reviewer === "CEO" && h.status === "PENDING"
                        ? { ...h, status: "APPROVED", date: dayjs().toISOString() }
                        : h
                ),
            }));
            message.success("JD đã được CEO ban hành thành công!");
        });
    };

    // ==================== COLUMNS ====================
    const columns: ProColumns<JobDescription>[] = [
        { title: "STT", width: 60, align: "center", render: (_, __, index) => index + 1 },
        {
            title: "Tiêu đề",
            dataIndex: "title",
            ellipsis: true,
            sorter: (a, b) => a.title.localeCompare(b.title),
        },
        { title: "Phòng ban", dataIndex: "department", width: 160 },
        {
            title: "Người duyệt hiện tại",
            render: (_, r) => r.currentReviewer || <span style={{ color: "#999" }}>—</span>,
            ellipsis: true,
            width: 180,
        },
        {
            title: "Trạng thái",
            width: 220,
            render: (_, record) => {
                const lastHistory = record.reviewHistory[record.reviewHistory.length - 1];
                let tooltip = "";

                if (record.status === "PUBLIC") {
                    tooltip = record.issuedBy
                        ? `Ban hành bởi ${record.issuedBy} lúc ${dayjs(record.issuedDate).format("DD/MM/YYYY HH:mm")}`
                        : `Ban hành lúc ${dayjs(record.issuedDate).format("DD/MM/YYYY HH:mm")}`;
                } else if (record.status === "IN_REVIEW" && lastHistory?.date) {
                    tooltip = `Gửi duyệt: ${dayjs(lastHistory.date).format("DD/MM/YYYY HH:mm")}`;
                }

                return (
                    <Tooltip title={tooltip}>
                        {getStatusTag(record)}
                    </Tooltip>
                );
            },
        },
        {
            title: "Hành động",
            width: 420,
            fixed: "right",
            render: (_, record) => {
                const loading = actionLoading[record.id];
                const lastHistory = record.reviewHistory.at(-1);
                const isPendingCEO =
                    record.status === "IN_REVIEW" &&
                    lastHistory?.reviewer === "CEO" &&
                    lastHistory?.status === "PENDING";

                return (
                    <Space size="middle" wrap>
                        <Tooltip title="Xem chi tiết">
                            <Button type="text" icon={<EyeOutlined />} onClick={() => { setDataInit(record); setOpenView(true); }} />
                        </Tooltip>

                        <Tooltip title="Chỉnh sửa">
                            <Button type="text" icon={<EditOutlined />} onClick={() => { setDataInit(record); setOpenModal(true); }} />
                        </Tooltip>

                        {record.status === "DRAFT" && (
                            <Button
                                icon={<SendOutlined />}
                                loading={loading}
                                onClick={() => handleSendReview(record)}
                                style={{
                                    background: "linear-gradient(90deg, #ff5fa2, #ff85c0)",
                                    color: "#fff",
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(255, 95, 162, 0.3)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 95, 162, 0.4)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 95, 162, 0.3)";
                                }}
                            >
                                Gửi duyệt
                            </Button>
                        )}

                        {record.status === "IN_REVIEW" && (
                            <>
                                <Button
                                    danger
                                    icon={<CloseCircleOutlined />}
                                    loading={loading}
                                    onClick={() => handleReject(record)}
                                >
                                    Từ chối
                                </Button>

                                {isPendingCEO && (
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        loading={loading}
                                        onClick={() => handlePublish(record)}
                                    >
                                        Ban hành
                                    </Button>
                                )}
                            </>
                        )}

                        {record.status === "REJECTED" && (
                            <Button
                                icon={<SendOutlined />}
                                loading={loading}
                                onClick={() => handleResend(record)}
                                style={{
                                    background: "linear-gradient(90deg, #ff5fa2, #ff85c0)",
                                    color: "#fff",
                                    border: "none",
                                }}
                            >
                                Gửi lại duyệt
                            </Button>
                        )}

                        {/* Nút More (ba chấm) */}
                        {/* Chỉ hiển thị More nếu đã ban hành */}
                        {record.status === "PUBLIC" && (
                            <Dropdown overlay={getMoreActionsMenu(record)} trigger={["click"]}>
                                <Button type="text" icon={<MoreOutlined />} />
                            </Dropdown>
                        )}
                    </Space>
                );
            },
        },
    ];

    // ==================== EXPANDED ROW ====================
    const renderReviewHistory = (item: JobDescription) => (
        <div style={{ padding: "12px 0" }}>
            <Timeline mode="left" style={{ margin: 0 }}>
                {item.reviewHistory.map((h, idx) => (
                    <Timeline.Item
                        key={idx}
                        color={h.status === "APPROVED" ? "green" : h.status === "REJECTED" ? "red" : "blue"}
                        label={h.date ? dayjs(h.date).format("DD/MM/YYYY HH:mm") : undefined}
                    >
                        <Space align="center">
                            <strong>{h.reviewer}</strong>
                            <Tag
                                color={
                                    h.status === "APPROVED" ? "success" : h.status === "REJECTED" ? "error" : "warning"
                                }
                            >
                                {h.status === "PENDING" ? "Đang chờ" : h.status === "APPROVED" ? "Đã duyệt" : "Từ chối"}
                            </Tag>
                            {h.comment && <span style={{ color: "#595959" }}>— {h.comment}</span>}
                        </Space>
                    </Timeline.Item>
                ))}

                {item.status === "IN_REVIEW" && item.currentReviewer && (
                    <Timeline.Item color="blue" dot={<ClockCircleOutlined style={{ fontSize: 16 }} />}>
                        Đang chờ <strong>{item.currentReviewer}</strong> duyệt
                    </Timeline.Item>
                )}

                {item.issuedDate && (
                    <Timeline.Item color="green" dot={<CheckCircleOutlined style={{ fontSize: 16 }} />}>
                        Ban hành ngày {dayjs(item.issuedDate).format("DD/MM/YYYY HH:mm")}
                        {item.issuedBy && (
                            <>
                                {" "}
                                bởi <strong>{item.issuedBy}</strong>
                            </>
                        )}
                    </Timeline.Item>
                )}
            </Timeline>

            {item.rejectReason && item.status === "REJECTED" && (
                <Alert
                    style={{ marginTop: 16 }}
                    message="Lý do từ chối lần cuối"
                    description={item.rejectReason}
                    type="error"
                    showIcon
                />
            )}
        </div>
    );

    // ==================== CREATE / EDIT ====================
    const handleFinishModal = async (values: any) => {
        await simulateAPI(600);

        if (dataInit) {
            updateJD(dataInit.id, (item) => ({ ...item, ...values }));
            message.success("Cập nhật JD thành công!");
        } else {
            const newJD: JobDescription = {
                id: `JD_${Date.now()}`,
                title: values.title || "JD mới",
                department: values.department || "Chưa xác định",
                positions: values.positions || [],
                createdAt: new Date().toISOString(),
                status: "DRAFT",
                reviewHistory: [],
                currentReviewer: null,
                rejectReason: null,
                issuedBy: undefined,
            };
            setData((prev) => [newJD, ...prev]);
            message.success("Tạo JD mới thành công!");
        }
        setOpenModal(false);
        setDataInit(null);
    };

    return (
        <PageContainer title="Quản lý Mô tả Công việc (JD)">
            <div className="flex flex-col gap-3 mb-4">
                <SearchFilter
                    searchPlaceholder="Tìm theo tiêu đề JD..."
                    onSearch={setSearchValue}
                    onReset={() => setSearchValue("")}
                    showAddButton
                    addLabel="Tạo JD mới"
                    onAddClick={() => {
                        setDataInit(null);
                        setOpenModal(true);
                    }}
                />
                <DateRangeFilter fieldName="createdAt" onChange={setCreatedAtFilter} />
            </div>

            <DataTable
                key={tableKey}
                rowKey="id"
                columns={columns}
                dataSource={filteredList}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                expandable={{ expandedRowRender: renderReviewHistory }}
                scroll={{ x: "max-content" }}
                style={{ width: "100%", minWidth: "100%" }}
                className="custom-ant-table"
            />

            <ViewJobDescription open={openView} onClose={() => setOpenView(false)} dataInit={dataInit} />

            <ModalJobDescription
                open={openModal}
                onOpenChange={setOpenModal}
                dataInit={dataInit}
                onFinish={handleFinishModal}
            />

            <ModalSelectReviewer
                open={openSelectReviewer}
                onCancel={() => setOpenSelectReviewer(false)}
                onSubmit={handleSelectReviewer}
            />

            <Modal
                title="Lý do từ chối JD"
                open={openRejectModal}
                onCancel={() => setOpenRejectModal(false)}
                okText="Xác nhận từ chối"
                okButtonProps={{ danger: true }}
                onOk={handleConfirmReject}
            >
                <Input.TextArea
                    rows={5}
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    placeholder="Nhập lý do từ chối chi tiết..."
                />
            </Modal>
        </PageContainer>
    );
};

export default JobDescriptionPage;