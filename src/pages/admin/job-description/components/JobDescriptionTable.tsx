import { useRef, useState } from "react";
import { Space, Tag, Popconfirm } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import dayjs from "dayjs";
import DataTable from "@/components/common/data-table";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import type { IJobDescription, IJdInbox } from "@/types/backend";
import { useDeleteJobDescriptionMutation } from "@/hooks/useJobDescriptions";
import {
    useRejectJdFlowMutation,
    useIssueJdFlowMutation,
} from "@/hooks/useJdFlow";
import ModalJobDescription from "../modal.job-description";
import ViewJobDescription from "../view.job-description/index";
import ModalJdFlow from "../modal.jd-flow";
import ModalIssueJd from "./modal-issue-jd";
import ModalRejectJd from "./modal-reject-jd";

const ACCENT = "#e8637a";
const ACCENT_HOVER = "#d4506a";

const STATUS_COLOR: Record<string, string> = {
    DRAFT: "default",
    IN_REVIEW: "processing",
    APPROVED: "warning",
    REJECTED: "error",
    PUBLISHED: "success",
};

const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Nháp",
    IN_REVIEW: "Đang duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    PUBLISHED: "Đã ban hành",
};

const ActionBtn = ({
    children,
    onClick,
    variant = "primary",
}: {
    children: React.ReactNode;
    onClick: () => void;
    variant?: "primary" | "approve" | "reject" | "ghost" | "issue";
}) => {
    const [hovered, setHovered] = useState(false);

    const styleMap: Record<string, React.CSSProperties> = {
        primary: {
            background: hovered ? ACCENT_HOVER : ACCENT,
            color: "#fff",
            border: "none",
        },
        approve: {
            background: hovered ? "#e6f7f0" : "#f0faf6",
            color: "#0f8a5f",
            border: "1px solid #a3d9c3",
        },
        reject: {
            background: hovered ? "#fef0e6" : "#fef6f0",
            color: "#c4621a",
            border: "1px solid #f5c49a",
        },
        ghost: {
            background: hovered ? "#fdf2f4" : "transparent",
            color: ACCENT,
            border: `1px solid ${hovered ? ACCENT : "#f5c4d1"}`,
        },
        issue: {
            background: hovered ? "#f0eafa" : "#f7f3fd",
            color: "#7c3abf",
            border: "1px solid #d4b8f0",
        },
    };

    return (
        <button
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 28,
                padding: "0 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                letterSpacing: "0.02em",
                ...styleMap[variant],
            }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </button>
    );
};

type TableRecord = IJobDescription | IJdInbox;

interface Props {
    records?: TableRecord[];
    loading?: boolean;
    mode: "MY" | "INBOX" | "PUBLISHED" | "ALL";
    meta?: { page: number; pageSize: number; total: number };
    onQueryChange?: (query: string) => void;
}

const JobDescriptionTable = ({ records = [], loading, mode, meta, onQueryChange }: Props) => {
    const tableRef = useRef<ActionType | null>(null);
    const deleteMutation = useDeleteJobDescriptionMutation();
    const rejectMutation = useRejectJdFlowMutation();
    const issueMutation = useIssueJdFlowMutation();

    const [openModal, setOpenModal] = useState(false);
    const [editRecord, setEditRecord] = useState<IJobDescription | null>(null);

    const [openView, setOpenView] = useState(false);
    const [viewRecord, setViewRecord] = useState<TableRecord | null>(null);

    const [openFlowModal, setOpenFlowModal] = useState(false);
    const [flowRecord, setFlowRecord] = useState<any | null>(null);

    const [openIssueModal, setOpenIssueModal] = useState(false);
    const [issueRecord, setIssueRecord] = useState<IJdInbox | null>(null);

    const [openRejectModal, setOpenRejectModal] = useState(false);
    const [rejectRecord, setRejectRecord] = useState<IJdInbox | null>(null);
    const [isResubmitReject, setIsResubmitReject] = useState(false);

    const handleIssueConfirm = () => {
        if (!issueRecord) return;
        const jdId = (issueRecord as any).jdId ?? (issueRecord as any).id;
        issueMutation.mutate(
            { jdId },
            {
                onSuccess: () => {
                    tableRef.current?.reload?.();
                    setOpenIssueModal(false);
                    setIssueRecord(null);
                },
            }
        );
    };

    const handleRejectConfirm = (reason: string) => {
        if (!rejectRecord) return;
        rejectMutation.mutate(
            { jdId: rejectRecord.jdId, comment: reason },
            {
                onSuccess: () => {
                    tableRef.current?.reload?.();
                    setOpenRejectModal(false);
                    setRejectRecord(null);
                    setIsResubmitReject(false);
                },
            }
        );
    };

    const columns: ProColumns<TableRecord>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, index) => index + 1,
        },
        { title: "Mã JD", dataIndex: "code", width: 150 },
        ...(mode === "INBOX"
            ? [
                {
                    title: "Người gửi",
                    width: 200,
                    render: (_: any, record: any) => record.fromUser?.name ?? "--",
                },
            ]
            : []),
        {
            title: "Công ty",
            dataIndex: "companyName",
            width: 200,
            render: (value) => value ?? "--",
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            width: 200,
            render: (value) => value ?? "--",
        },
        {
            title: "Chức danh",
            dataIndex: "jobTitleName",
            width: 200,
            render: (value) => value ?? "--",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 150,
            align: "center",
            render: (_, record: any) => (
                <Tag color={STATUS_COLOR[record.status] ?? "default"}>
                    {STATUS_LABEL[record.status] ?? record.status}
                </Tag>
            ),
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updatedAt",
            width: 150,
            align: "center",
            render: (_, record: any) =>
                record.updatedAt
                    ? dayjs(record.updatedAt).format("DD-MM-YYYY")
                    : "--",
        },
        {
            title: "Hành động",
            width: 320,
            align: "center",
            render: (_, record: any) => {
                return (
                    <Space size={6}>

                        {/* VIEW */}
                        <EyeOutlined
                            style={{ fontSize: 17, color: "#aaa", cursor: "pointer" }}
                            onClick={() => {
                                setViewRecord(record);
                                setOpenView(true);
                            }}
                        />

                        {/* EDIT — DRAFT hoặc REJECTED */}
                        {(mode === "MY" || mode === "ALL") &&
                            (record.status === "DRAFT" || record.status === "REJECTED") &&
                            record.id && (
                                <Access permission={ALL_PERMISSIONS.JOB_DESCRIPTIONS.UPDATE} hideChildren>
                                    <EditOutlined
                                        style={{ fontSize: 17, color: "#fa8c16", cursor: "pointer" }}
                                        onClick={() => {
                                            setEditRecord(record);
                                            setOpenModal(true);
                                        }}
                                    />
                                </Access>
                            )}

                        {/* DELETE — chỉ DRAFT */}
                        {(mode === "MY" || mode === "ALL") &&
                            record.status === "DRAFT" &&
                            record.id && (
                                <Access permission={ALL_PERMISSIONS.JOB_DESCRIPTIONS.DELETE} hideChildren>
                                    <Popconfirm
                                        title="Xóa JD?"
                                        description="Bạn có chắc chắn muốn xóa bản mô tả công việc này không?"
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        okButtonProps={{ danger: true }}
                                        onConfirm={() => deleteMutation.mutate(record.id)}
                                    >
                                        <DeleteOutlined
                                            style={{ fontSize: 17, color: "#ff4d4f", cursor: "pointer" }}
                                        />
                                    </Popconfirm>
                                </Access>
                            )}

                        {/* SUBMIT — DRAFT hoặc REJECTED */}
                        {mode === "MY" &&
                            (record.status === "DRAFT" || record.status === "REJECTED") &&
                            record.id && (
                                <Access permission={ALL_PERMISSIONS.JD_FLOW.SUBMIT} hideChildren>
                                    <ActionBtn
                                        variant="primary"
                                        onClick={() => {
                                            setFlowRecord({
                                                id: record.id,
                                                status: record.status,
                                                isApprover: false,
                                            });
                                            setOpenFlowModal(true);
                                        }}
                                    >
                                        {record.status === "REJECTED" ? "Gửi lại duyệt" : "Gửi duyệt"}
                                    </ActionBtn>
                                </Access>
                            )}

                        {/* RESUBMIT — INBOX REJECTED */}
                        {mode === "INBOX" &&
                            record.status === "REJECTED" &&
                            (record.jdId ?? record.id) && (
                                <ActionBtn
                                    variant="ghost"
                                    onClick={() => {
                                        setFlowRecord({
                                            id: record.jdId ?? record.id,
                                            status: record.status,
                                            isApprover: false,
                                        });
                                        setOpenFlowModal(true);
                                    }}
                                >
                                    Gửi lại duyệt
                                </ActionBtn>
                            )}

                        {/* TRẢ LẠI — INBOX REJECTED */}
                        {mode === "INBOX" &&
                            record.status === "REJECTED" &&
                            (record.jdId ?? record.id) && (
                                <Access permission={ALL_PERMISSIONS.JD_FLOW.REJECT} hideChildren>
                                    <ActionBtn
                                        variant="reject"
                                        onClick={() => {
                                            setRejectRecord(record);
                                            setIsResubmitReject(true);
                                            setOpenRejectModal(true);
                                        }}
                                    >
                                        Trả lại
                                    </ActionBtn>
                                </Access>
                            )}

                        {/* APPROVE */}
                        {mode === "INBOX" && record.status === "IN_REVIEW" && (
                            <Access permission={ALL_PERMISSIONS.JD_FLOW.APPROVE} hideChildren>
                                <ActionBtn
                                    variant="approve"
                                    onClick={() => {
                                        setFlowRecord({
                                            id: record.jdId ?? record.id,
                                            status: record.status,
                                            isApprover: true,
                                        });
                                        setOpenFlowModal(true);
                                    }}
                                >
                                    Duyệt
                                </ActionBtn>
                            </Access>
                        )}
                        {/* ISSUE */}
                        {mode === "INBOX" && record.status === "APPROVED" && (
                            <Access permission={ALL_PERMISSIONS.JD_FLOW.ISSUE} hideChildren>
                                <ActionBtn
                                    variant="issue"
                                    onClick={() => {
                                        setIssueRecord(record);
                                        setOpenIssueModal(true);
                                    }}
                                >
                                    Ban hành
                                </ActionBtn>
                            </Access>
                        )}
                        {/* TỪ CHỐI — INBOX IN_REVIEW */}
                        {mode === "INBOX" && record.status === "IN_REVIEW" && (
                            <Access permission={ALL_PERMISSIONS.JD_FLOW.REJECT} hideChildren>
                                <ActionBtn
                                    variant="reject"
                                    onClick={() => {
                                        setRejectRecord(record);
                                        setIsResubmitReject(false);
                                        setOpenRejectModal(true);
                                    }}
                                >
                                    Từ chối
                                </ActionBtn>
                            </Access>
                        )}

                    </Space>
                );
            },
        },
    ];
    return (
        <>
            <DataTable<TableRecord>
                actionRef={tableRef}
                rowKey={(record: any) => record.id || record.jdId}
                loading={loading}
                columns={columns}
                dataSource={records}
                pagination={meta ? {
                    current: meta.page,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => (
                        <span>
                            <b>{range[0]}–{range[1]}</b> trên{" "}
                            <b style={{ color: "#1677ff" }}>{total.toLocaleString()}</b> JD
                        </span>
                    ),
                } : { pageSize: 20 }}
                request={onQueryChange ? async (params) => {
                    const q = `page=${params.current}&size=${params.pageSize}&sort=createdAt,desc`;
                    onQueryChange(q);
                    return { data: records, success: true, total: meta?.total ?? 0 };
                } : undefined}
            />

            <ModalJobDescription
                open={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setEditRecord(null);
                }}
                editRecord={editRecord}
            />

            <ViewJobDescription
                open={openView}
                onClose={() => {
                    setOpenView(false);
                    setViewRecord(null);
                }}
                record={viewRecord as any}
            />

            <ModalJdFlow
                open={openFlowModal}
                onClose={() => setOpenFlowModal(false)}
                record={flowRecord}
            />

            <ModalIssueJd
                open={openIssueModal}
                record={issueRecord}
                loading={issueMutation.isPending}
                onConfirm={handleIssueConfirm}
                onCancel={() => {
                    setOpenIssueModal(false);
                    setIssueRecord(null);
                }}
            />

            <ModalRejectJd
                open={openRejectModal}
                record={rejectRecord}
                loading={rejectMutation.isPending}
                isResubmit={isResubmitReject}
                onConfirm={handleRejectConfirm}
                onCancel={() => {
                    setOpenRejectModal(false);
                    setRejectRecord(null);
                    setIsResubmitReject(false);
                }}
            />
        </>
    );
};

export default JobDescriptionTable;