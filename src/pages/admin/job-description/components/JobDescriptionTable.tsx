import { useRef, useState } from "react";
import { Space, Tag, Popconfirm, Button, Dropdown } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";
import dayjs from "dayjs";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import DateRangeFilter from "@/components/common/filter/DateRangeFilter";
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
import ModalRejectReasonJd from "./modal-reject-reason-jd";

const ACCENT = "#e8637a";
const ACCENT_HOVER = "#d4506a";

const STATUS_COLOR: Record<string, string> = {
    DRAFT: "default",
    IN_REVIEW: "processing",
    APPROVED: "warning",
    REJECTED: "error",
    RETURNED: "warning",
    PUBLISHED: "success",
};

const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Nháp",
    IN_REVIEW: "Đang duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    RETURNED: "Hoàn trả",
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
    onSearch?: (value: string) => void;
    onReset?: () => void;
    onFilterChange?: (filters: Record<string, any>) => void;
    onDateChange?: (filter: string | null) => void;
    resetSignal?: number;
    showAdd?: boolean;
    hideStatusFilter?: boolean;
}

const JobDescriptionTable = ({
    records = [],
    loading,
    mode,
    meta,
    onQueryChange,
    onSearch,
    onReset,
    onFilterChange,
    onDateChange,
    resetSignal,
    showAdd = false,
    hideStatusFilter = false,
}: Props) => {
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

    const [openRejectReasonModal, setOpenRejectReasonModal] = useState(false);
    const [rejectReasonRecord, setRejectReasonRecord] = useState<any>(null);

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

    // ===================== BUILD DROPDOWN ITEMS =====================
    const buildDropdownItems = (record: any) => {
        const items: any[] = [];

        // ── Gửi duyệt / Gửi lại duyệt (mode MY) ──
        if (mode === "MY" &&
            (record.status === "DRAFT" || record.status === "REJECTED") &&
            record.id) {
            items.push({
                key: "submit",
                label: (
                    <Access permission={ALL_PERMISSIONS.JD_FLOW.SUBMIT} hideChildren>
                        <span onClick={() => {
                            setFlowRecord({ id: record.id, status: record.status, isApprover: false });
                            setOpenFlowModal(true);
                        }}>
                            {record.status === "REJECTED" ? "Gửi lại duyệt" : "Gửi duyệt"}
                        </span>
                    </Access>
                ),
            });
        }

        // ── Gửi lại duyệt (INBOX RETURNED) ──
        if (mode === "INBOX" && record.status === "RETURNED" && (record.jdId ?? record.id)) {
            items.push({
                key: "resubmit",
                label: (
                    <Access permission={ALL_PERMISSIONS.JD_FLOW.SUBMIT} hideChildren>
                        <span onClick={() => {
                            setFlowRecord({ id: record.jdId ?? record.id, status: record.status, isApprover: false });
                            setOpenFlowModal(true);
                        }}>
                            Gửi lại duyệt
                        </span>
                    </Access>
                ),
            });
        }

        // ── Duyệt (INBOX IN_REVIEW) ──
        if (mode === "INBOX" && record.status === "IN_REVIEW") {
            items.push({
                key: "approve",
                label: (
                    <Access permission={ALL_PERMISSIONS.JD_FLOW.APPROVE} hideChildren>
                        <span style={{ color: "#0f8a5f" }} onClick={() => {
                            setFlowRecord({ id: record.jdId ?? record.id, status: record.status, isApprover: true });
                            setOpenFlowModal(true);
                        }}>
                            Duyệt
                        </span>
                    </Access>
                ),
            });
        }

        // ── Ban hành (INBOX APPROVED) ──
        if (mode === "INBOX" && record.status === "APPROVED") {
            items.push({
                key: "issue",
                label: (
                    <Access permission={ALL_PERMISSIONS.JD_FLOW.ISSUE} hideChildren>
                        <span style={{ color: "#7c3abf" }} onClick={() => {
                            setIssueRecord(record);
                            setOpenIssueModal(true);
                        }}>
                            Ban hành
                        </span>
                    </Access>
                ),
            });
        }

        // ── Từ chối (INBOX IN_REVIEW) ──
        if (mode === "INBOX" && record.status === "IN_REVIEW") {
            items.push({
                key: "reject",
                label: (
                    <Access permission={ALL_PERMISSIONS.JD_FLOW.REJECT} hideChildren>
                        <span style={{ color: "#c4621a" }} onClick={() => {
                            setRejectRecord(record);
                            setIsResubmitReject(false);
                            setOpenRejectModal(true);
                        }}>
                            Từ chối
                        </span>
                    </Access>
                ),
            });
        }

        // ── Hoàn trả (INBOX RETURNED) ──
        if (mode === "INBOX" && record.status === "RETURNED" && (record.jdId ?? record.id)) {
            items.push({
                key: "hoantra",
                label: (
                    <Access permission={ALL_PERMISSIONS.JD_FLOW.REJECT} hideChildren>
                        <span style={{ color: "#c4621a" }} onClick={() => {
                            setRejectRecord(record);
                            setIsResubmitReject(true);
                            setOpenRejectModal(true);
                        }}>
                            Hoàn trả
                        </span>
                    </Access>
                ),
            });
        }

        // ── Xóa (chỉ DRAFT) ──
        if ((mode === "MY" || mode === "ALL") && record.status === "DRAFT" && record.id) {
            if (items.length > 0) items.push({ type: "divider" });
            items.push({
                key: "delete",
                danger: true,
                label: (
                    <Access permission={ALL_PERMISSIONS.JOB_DESCRIPTIONS.DELETE} hideChildren>
                        <Popconfirm
                            title="Xóa JD?"
                            description="Bạn có chắc chắn muốn xóa bản mô tả công việc này không?"
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => deleteMutation.mutate(record.id)}
                        >
                            <span>Xóa JD</span>
                        </Popconfirm>
                    </Access>
                ),
            });
        }

        return items;
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
                    width: 180,
                    render: (_: any, record: any) => record.fromUser?.name ?? "--",
                },
            ]
            : []),
        {
            title: "Công ty",
            dataIndex: "companyName",
            width: 180,
            render: (value) => value ?? "--",
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            width: 180,
            render: (value) => value ?? "--",
        },
        {
            title: "Chức danh",
            dataIndex: "jobTitleName",
            width: 180,
            render: (value) => value ?? "--",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 160,
            align: "center",
            render: (_, record: any) => {
                const isRejected = record.status === "REJECTED";
                const isReturned = record.status === "RETURNED";

                if ((isRejected || isReturned) && record.rejectComment) {
                    const btnStyle: React.CSSProperties = isReturned
                        ? {
                            color: "#b45309",
                            border: "1px solid #fcd34d",
                            background: "#fffbeb",
                        }
                        : {
                            color: "#b91c1c",
                            border: "1px solid #fca5a5",
                            background: "#fff1f2",
                        };

                    return (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <Tag color={STATUS_COLOR[record.status]}>
                                {STATUS_LABEL[record.status]}
                            </Tag>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    borderRadius: 4,
                                    padding: "1px 8px",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    lineHeight: "20px",
                                    ...btnStyle,
                                }}
                                onClick={() => {
                                    setRejectReasonRecord(record);
                                    setOpenRejectReasonModal(true);
                                }}
                            >
                                Xem lý do
                            </span>
                        </div>
                    );
                }

                return (
                    <Tag color={STATUS_COLOR[record.status] ?? "default"}>
                        {STATUS_LABEL[record.status] ?? record.status}
                    </Tag>
                );
            },
        },
        {
            title: "Ngày cập nhật",
            dataIndex: "updatedAt",
            width: 130,
            align: "center",
            render: (_, record: any) =>
                record.updatedAt ? dayjs(record.updatedAt).format("DD-MM-YYYY") : "--",
        },
        {
            title: "Hành động",
            width: 120,
            align: "center",
            fixed: "right",
            render: (_, record: any) => {
                const dropdownItems = buildDropdownItems(record);

                return (
                    <Space size={4} align="center">
                        {/* Xem chi tiết */}
                        <Access permission={ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_BY_ID} hideChildren>
                            <Button
                                type="text"
                                size="small"
                                icon={<EyeOutlined style={{ color: "#1677ff", fontSize: 16 }} />}
                                onClick={() => {
                                    setViewRecord(record);
                                    setOpenView(true);
                                }}
                            />
                        </Access>

                        {/* Chỉnh sửa */}
                        {(mode === "MY" || mode === "ALL" ||
                            (mode === "INBOX" && record.status === "RETURNED")) &&
                            (record.status === "DRAFT" || record.status === "REJECTED" ||
                                record.status === "RETURNED") &&
                            (record.id ?? record.jdId) && (
                                <Access permission={ALL_PERMISSIONS.JOB_DESCRIPTIONS.UPDATE} hideChildren>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined style={{ color: "#fa8c16", fontSize: 16 }} />}
                                        onClick={() => {
                                            setEditRecord(record as IJobDescription);
                                            setOpenModal(true);
                                        }}
                                    />
                                </Access>
                            )}

                        {/* Dropdown 3 chấm */}
                        {dropdownItems.length > 0 && (
                            <Dropdown
                                menu={{ items: dropdownItems }}
                                trigger={["click"]}
                                placement="bottomRight"
                            >
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<MoreOutlined style={{ color: "#595959", fontSize: 16 }} />}
                                />
                            </Dropdown>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            {/* ===================== SEARCH FILTER ===================== */}
            <div className="flex flex-col gap-3">
                <SearchFilter
                    searchPlaceholder="Tìm theo mã JD..."
                    addLabel="Thêm JD"
                    showFilterButton={false}
                    onSearch={onSearch ?? (() => { })}
                    onReset={onReset ?? (() => { })}
                    onAddClick={showAdd ? () => setOpenModal(true) : undefined}
                    addPermission={showAdd ? ALL_PERMISSIONS.JOB_DESCRIPTIONS.CREATE : undefined}
                />

                <div className="flex flex-wrap gap-3 items-center">
                    {!hideStatusFilter && (
                        <AdvancedFilterSelect
                            resetSignal={resetSignal}
                            fields={[
                                {
                                    key: "status",
                                    label: "Trạng thái",
                                    options: [
                                        { label: "Nháp", value: "DRAFT", color: "default" },
                                        { label: "Đang duyệt", value: "IN_REVIEW", color: "blue" },
                                        { label: "Đã duyệt", value: "APPROVED", color: "gold" },
                                        { label: "Từ chối", value: "REJECTED", color: "red" },
                                        { label: "Hoàn trả", value: "RETURNED", color: "orange" },
                                        { label: "Đã ban hành", value: "PUBLISHED", color: "green" },
                                    ],
                                },
                            ]}
                            onChange={onFilterChange ?? (() => { })}
                        />
                    )}
                    <DateRangeFilter
                        fieldName="createdAt"
                        onChange={onDateChange ?? (() => { })}
                    />
                </div>
            </div>

            {/* ===================== TABLE ===================== */}
            <div style={{ marginTop: 16 }}>
                <DataTable<TableRecord>
                    actionRef={tableRef}
                    rowKey={(record: any) => record.id || record.jdId}
                    loading={loading}
                    columns={columns}
                    dataSource={records}
                    scroll={{ x: "max-content" }}
                    pagination={
                        meta
                            ? {
                                current: meta.page,
                                pageSize: meta.pageSize,
                                total: meta.total,
                                showSizeChanger: true,
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
                                        JD
                                    </div>
                                ),
                            }
                            : { pageSize: 20 }
                    }
                    request={
                        onQueryChange
                            ? async (params) => {
                                const q = `page=${params.current}&size=${params.pageSize}&sort=createdAt,desc`;
                                onQueryChange(q);
                                return { data: records, success: true, total: meta?.total ?? 0 };
                            }
                            : undefined
                    }
                />
            </div>

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

            <ModalRejectReasonJd
                open={openRejectReasonModal}
                record={rejectReasonRecord}
                onClose={() => {
                    setOpenRejectReasonModal(false);
                    setRejectReasonRecord(null);
                }}
            />
        </>
    );
};

export default JobDescriptionTable;