import React, { useMemo } from "react";
import { Table, Space, Tag, Popconfirm } from "antd";
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    FileOutlined,
    LinkOutlined,
} from "@ant-design/icons";
import ActionButton from "@/components/common/ui/ActionButton";
import type { IDocument } from "@/types/backend";
import dayjs from "dayjs";
import { getFileIcon } from "../utils";
import { TABLE_STICKY } from "@/components/common/data-table/TableScrollbarController";

interface DocumentTableProps {
    loading: boolean;
    documents: IDocument[];
    isReadOnly: boolean;
    selectedRowKeys?: React.Key[];
    onSelectRowKeys?: (keys: React.Key[]) => void;
    onViewDetails: (doc: IDocument) => void;
    onEditDoc: (doc: IDocument) => void;
    onDeleteDoc: (doc: IDocument) => void;
}

const ACCOUNTING_DOC_CATEGORY_CODE = "ACCOUNTING_DOC";

export const DocumentTable: React.FC<DocumentTableProps> = ({
    loading,
    documents,
    isReadOnly,
    selectedRowKeys,
    onSelectRowKeys,
    onViewDetails,
    onEditDoc,
    onDeleteDoc,
}) => {
    const columns = useMemo(
        () => [
            {
                title: "Mã tài liệu",
                dataIndex: "documentCode",
                key: "documentCode",
                width: 180,
                sorter: (a: IDocument, b: IDocument) => a.documentCode.localeCompare(b.documentCode),
                render: (code: string) => (
                    <Tag
                        style={{
                            fontFamily: "monospace",
                            borderRadius: 4,
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                            padding: "2px 8px",
                            margin: 0,
                        }}
                    >
                        {code}
                    </Tag>
                ),
            },
            {
                title: "Tên tài liệu",
                dataIndex: "documentName",
                key: "documentName",
                sorter: (a: IDocument, b: IDocument) => a.documentName.localeCompare(b.documentName),
                render: (name: string, record: IDocument) => (
                    <Space size={8}>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            {record.fileUrls?.[0] ? getFileIcon(record.fileUrls[0]) : <FileOutlined />}
                            {record.isShortcut && (
                                <LinkOutlined
                                    style={{
                                        position: "absolute",
                                        bottom: -4,
                                        right: -6,
                                        fontSize: 10,
                                        color: "#1677ff",
                                        background: "#fff",
                                        borderRadius: "50%",
                                        padding: 1,
                                        border: "1px solid #1677ff",
                                    }}
                                />
                            )}
                        </div>
                        <div>
                            <span style={{ fontWeight: 500, color: "#1e293b" }}>{name}</span>
                            {record.note && (
                                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                                    {record.note}
                                </div>
                            )}
                        </div>
                    </Space>
                ),
            },
            {
                title: "Danh mục",
                dataIndex: ["category", "categoryName"],
                key: "category",
                width: 160,
                render: (catName: string, record: IDocument) => {
                    const isAccountingDoc = record.category?.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE;
                    const label = isAccountingDoc
                        ? record.accountingCategory?.categoryName || "Chứng từ kế toán"
                        : catName;

                    return label ? (
                        <Tag
                            color={isAccountingDoc ? "magenta" : undefined}
                            style={{
                                borderRadius: 4,
                                backgroundColor: isAccountingDoc ? "#fff0f6" : "#eff6ff",
                                color: isAccountingDoc ? "#c41d7f" : "#1d4ed8",
                                border: isAccountingDoc ? "1px solid #ffadd2" : "1px solid #bfdbfe",
                                padding: "2px 8px",
                                margin: 0,
                            }}
                        >
                            {isAccountingDoc ? "Kế toán: " : ""}{label}
                        </Tag>
                    ) : (
                        <span style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>Chưa phân loại</span>
                    );
                },
            },
            {
                title: "Ngày tải lên",
                dataIndex: "createdAt",
                key: "createdAt",
                width: 160,
                sorter: (a: IDocument, b: IDocument) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
                render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
            },
            {
                title: "Hành động",
                key: "actions",
                width: 120,
                align: "center" as const,
                render: (_: any, record: IDocument) => (
                    <Space size={4}>
                        <ActionButton
                            variant="view"
                            tooltip="Xem chi tiết"
                            icon={<EyeOutlined />}
                            aria-label="Xem chi tiết"
                            onClick={() => onViewDetails(record)}
                        />
                        {!isReadOnly ? (
                            <>
                                <ActionButton
                                    variant="edit"
                                    tooltip="Chỉnh sửa"
                                    icon={<EditOutlined />}
                                    aria-label="Chỉnh sửa"
                                    onClick={() => onEditDoc(record)}
                                />
                                <Popconfirm
                                    title={record.isShortcut ? "Xác nhận xóa lối tắt này khỏi thư mục?" : "Xác nhận xóa tài liệu này?"}
                                    onConfirm={() => onDeleteDoc(record)}
                                    okText="Xóa"
                                    cancelText="Huỷ"
                                >
                                    <ActionButton
                                        variant="danger"
                                        tooltip="Xóa tài liệu"
                                        icon={<DeleteOutlined />}
                                        aria-label="Xóa tài liệu"
                                    />
                                </Popconfirm>
                            </>
                        ) : (
                            <Tag color="default">Chỉ xem</Tag>
                        )}
                    </Space>
                ),
            },
        ],
        [isReadOnly, onViewDetails, onEditDoc, onDeleteDoc]
    );

    return (
        <Table
            sticky={TABLE_STICKY}
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={documents}
            scroll={{ x: "max-content" }}
            rowSelection={
                !isReadOnly && onSelectRowKeys
                    ? {
                          selectedRowKeys,
                          onChange: (keys) => onSelectRowKeys(keys),
                      }
                    : undefined
            }
            pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng số ${total} tài liệu`,
            }}
            onRow={(record) => ({
                draggable: !isReadOnly,
                onDragStart: (e) => {
                    e.dataTransfer.setData("documentId", record.id!.toString());
                    e.dataTransfer.effectAllowed = "move";
                },
            })}
        />
    );
};

export default React.memo(DocumentTable);
