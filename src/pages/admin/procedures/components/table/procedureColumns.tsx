import React from "react";
import { Tag, Space, Popconfirm, Tooltip } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, ShareAltOutlined } from "@ant-design/icons";
import { MoreOutlined } from "@ant-design/icons";
import { Dropdown } from "antd";
import type { ProColumns } from "@ant-design/pro-components";
import dayjs from "dayjs";

import type { IProcedure, ProcedureType } from "@/types/backend";
import ActionButton from "@/components/common/ui/ActionButton";

export const statusMap: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "green" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "gold" },
    TERMINATED: { label: "Hết hiệu lực", color: "red" },
};

// Static style definitions to avoid object recreation on every render
const AVATAR_STYLE: React.CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#eef2ff",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
};

const NAME_STYLE: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
    lineHeight: "18px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 140,
};

const EMAIL_STYLE: React.CSSProperties = {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: "16px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 140,
};

const CONTAINER_GAP_STYLE: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
};

const MIN_WIDTH_STYLE: React.CSSProperties = {
    minWidth: 0,
};

interface BuildColumnsParams {
    type: ProcedureType;
    companyId?: number;
    departmentId?: number;
    isAdmin: boolean;
    canShare: boolean;
    canView: boolean;
    canUpdate: boolean;
    canRevise: boolean;
    canDelete: boolean;
    meta: { page?: number; pageSize?: number };
    permission: Record<string, any>;
    deleteMutation: { mutateAsync: (id: number) => Promise<any> };
    onView: (record: IProcedure) => void;
    onEdit: (record: IProcedure) => void;
    onRevise: (record: IProcedure) => void;
    onQrClick: (record: IProcedure) => void;
    onShare: (record: IProcedure) => void;
}

export const buildProcedureColumns = ({
    type,
    companyId,
    departmentId,
    isAdmin,
    canShare,
    canView,
    canUpdate,
    canRevise,
    canDelete,
    meta,
    permission,
    deleteMutation,
    onView,
    onEdit,
    onRevise,
    onQrClick,
    onShare,
}: BuildColumnsParams): ProColumns<IProcedure>[] => [
        {
            title: "STT",
            width: 55,
            align: "center",
            render: (_, __, index) =>
                index + 1 + ((meta.page || 1) - 1) * (meta.pageSize || 10),
        },
        {
            title: "Mã quy trình",
            dataIndex: "procedureCode",
            align: "left",
            width: 160,
            render: (_, record) => <Tag color="purple">{record.procedureCode ?? "--"}</Tag>,
        },
        {
            title: "Mã công ty",
            dataIndex: "companyCode",
            align: "center",
            width: 100,
            hideInTable: !!companyId || !!departmentId,
            render: (_, record) => (
                <Tag color="blue">
                    {record.departments?.[0]?.companyCode ?? record.companyCode ?? "--"}
                </Tag>
            ),
        },
        {
            title: "Công ty",
            dataIndex: "companyName",
            align: "left",
            width: 220,
            ellipsis: { showTitle: true },
            hideInTable: !!companyId || !!departmentId,
            render: (_, record) =>
                record.departments?.[0]?.companyName ?? record.companyName ?? "--",
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            render: (_, record) => {
                if (type === "DEPARTMENT") {
                    const departments = record.departments ?? [];
                    if (departments.length === 0) return <Tag color="cyan">--</Tag>;
                    return (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {departments.map((d) => (
                                <Tag key={d.id} color="cyan">{d.name}</Tag>
                            ))}
                        </div>
                    );
                }
                return record.departmentName
                    ? <Tag color="cyan">{record.departmentName}</Tag>
                    : <Tag color="cyan">--</Tag>;
            },
        },
        {
            title: "Bộ phận",
            dataIndex: "sectionName",
            align: "left",
            width: 150,
            hideInTable: true,
            render: (_, record) => <Tag color="geekblue">{record.sectionName || "--"}</Tag>,
        },
        {
            title: "Tên quy trình",
            dataIndex: "procedureName",
            sorter: true,
            align: "left",
            render: (_, record) => (
                <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                    {record.procedureName}
                </span>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            align: "center",
            width: 140,
            render: (_, record) => {
                const s = statusMap[record.status ?? ""] ?? { label: record.status, color: "default" };
                return <Tag color={s.color}>{s.label}</Tag>;
            },
        },
        {
            title: "Năm KH",
            dataIndex: "planYear",
            align: "center",
            width: 85,
            hideInTable: true,
        },
        {
            title: "Version",
            dataIndex: "version",
            align: "center",
            width: 80,
            hideInTable: type === "COMPANY",
            render: (_, record) => <Tag color="blue">v{record.version ?? 1}</Tag>,
        },
        {
            title: <span style={{ whiteSpace: "nowrap" }}>Ngày ban hành</span>,
            dataIndex: "issuedDate",
            align: "center",
            width: 130,
            render: (_, record) =>
                record.issuedDate ? dayjs(record.issuedDate).format("DD-MM-YYYY") : "--",
        },
        {
            title: "Người tạo",
            dataIndex: "createdBy",
            align: "left",
            width: 220,
            hideInTable: type !== "CONFIDENTIAL" || !isAdmin,
            render: (_, record) => {
                const name = record.createdByName ?? record.createdBy ?? "—";
                const email = record.createdBy ?? "";
                return (
                    <div style={CONTAINER_GAP_STYLE}>
                        <div style={AVATAR_STYLE}>
                            {name !== "—" ? name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div style={MIN_WIDTH_STYLE}>
                            <div style={NAME_STYLE}>
                                {name}
                            </div>
                            <div style={EMAIL_STYLE}>
                                {email || "—"}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "QR",
            align: "center",
            width: 60,
            render: (_, record) => (
                <ActionButton
                    variant="settings"
                    tooltip="Xem mã QR nội bộ"
                    tooltipPlacement="top"
                    icon={<QrcodeOutlined />}
                    aria-label="Xem mã QR nội bộ"
                    onClick={() => onQrClick(record)}
                />
            ),
        },
        {
            title: "Hành động",
            align: "center",
            width: type === "CONFIDENTIAL" ? 120 : 100,
            fixed: "right",
            render: (_, record) => {
                const guideKey = `${type.toLowerCase()}-procedure`;
                const menuItems = [];

                if (canUpdate) {
                    menuItems.push({
                        key: "edit",
                        icon: <EditOutlined style={{ color: "#fa8c16" }} />,
                        label: (
                            <Tooltip title="Chỉnh sửa">
                                <span data-guide-id={`${type.toLowerCase()}-procedure-edit-menu-item`} onClick={() => onEdit(record)}>Chỉnh sửa</span>
                            </Tooltip>
                        ),
                    });
                }

                if (canRevise) {
                    menuItems.push({
                        key: "revise",
                        icon: (
                            <Tag color="green" style={{ margin: 0, borderRadius: 6, padding: "0 6px", fontSize: 12 }}>
                                v{(record.version ?? 1) + 1}
                            </Tag>
                        ),
                        label: (
                            <Tooltip title={`Tạo phiên bản v${(record.version ?? 1) + 1}`}>
                                <span data-guide-id={`${type.toLowerCase()}-procedure-revise-menu-item`} onClick={() => onRevise(record)}>
                                    Tạo version v{(record.version ?? 1) + 1}
                                </span>
                            </Tooltip>
                        ),
                    });
                }

                if (canShare) {
                    menuItems.push({
                        key: "share",
                        icon: <ShareAltOutlined style={{ color: "#f0226e" }} />,
                        label: (
                            <span data-guide-id={`${type.toLowerCase()}-procedure-share-menu-item`} onClick={() => onShare(record)}>Chia sẻ công khai</span>
                        ),
                    });
                }

                if (canDelete) {
                    menuItems.push({
                        key: "delete",
                        icon: <DeleteOutlined style={{ color: "red" }} />,
                        label: (
                            <Popconfirm
                                title="Xác nhận xoá quy trình này?"
                                onConfirm={() => deleteMutation.mutateAsync(record.id!)}
                                okText="Xoá"
                                cancelText="Huỷ"
                                placement="topRight"
                            >
                                <Tooltip title="Xóa">
                                    <span data-guide-id={`${type.toLowerCase()}-procedure-delete-menu-item`} style={{ color: "red" }}>Xóa</span>
                                </Tooltip>
                            </Popconfirm>
                        ),
                    });
                }

                return (
                    <Space size="small">
                        {canView && (
                            <ActionButton
                                variant="view"
                                tooltip="Xem chi tiết"
                                icon={<EyeOutlined />}
                                data-guide-id={`${guideKey}-detail-button`}
                                aria-label="Xem chi tiết"
                                onClick={() => onView(record)}
                            />
                        )}
                        {menuItems.length > 0 && (
                            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                                <ActionButton
                                    variant="default"
                                    tooltip="Thao tác khác"
                                    icon={<MoreOutlined />}
                                    data-guide-id={`${guideKey}-more-button`}
                                    aria-label="Thao tác khác"
                                />
                            </Dropdown>
                        )}
                    </Space>
                );
            },
        },
    ];
