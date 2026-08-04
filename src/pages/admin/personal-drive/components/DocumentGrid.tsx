import React from "react";
import { Spin, Row, Col, Card, Checkbox } from "antd";
import {
    FilePdfOutlined,
    FileExcelOutlined,
    FileZipOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import type { IDocument } from "@/types/backend";
import dayjs from "dayjs";
import EmptyState from "./EmptyState";
import { buildDocumentFileUrl } from "../utils";

interface DocumentGridProps {
    loading: boolean;
    documents: IDocument[];
    isReadOnly: boolean;
    selectedRowKeys?: React.Key[];
    onSelectRowKeys?: (keys: React.Key[]) => void;
    onCardClick: (doc: IDocument) => void;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({
    loading,
    documents,
    isReadOnly,
    selectedRowKeys,
    onSelectRowKeys,
    onCardClick,
}) => {
    return (
        <Spin spinning={loading}>
            {documents.length === 0 ? (
                <EmptyState type="no-documents" />
            ) : (
                <Row gutter={[16, 16]}>
                    {documents.map((doc) => {
                        const isSelected = selectedRowKeys?.includes(doc.id!);
                        return (
                            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={doc.id}>
                                <Card
                                    hoverable
                                    className="grid-document-card"
                                    style={{
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        position: "relative",
                                        border: isSelected ? "2px solid #db2777" : "1px solid #e2e8f0",
                                    }}
                                    styles={{ body: { padding: 12 } }}
                                    draggable={!isReadOnly}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData("documentId", doc.id!.toString());
                                        e.dataTransfer.effectAllowed = "move";
                                    }}
                                    onClick={() => onCardClick(doc)}
                                    cover={
                                        <div style={{ height: 120, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #f1f5f9", position: "relative" }}>
                                            {!isReadOnly && onSelectRowKeys && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: 8,
                                                        left: 8,
                                                        zIndex: 10,
                                                        background: "rgba(255, 255, 255, 0.9)",
                                                        borderRadius: 4,
                                                        padding: "2px 6px",
                                                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            const current = selectedRowKeys || [];
                                                            if (checked) {
                                                                onSelectRowKeys([...current, doc.id!]);
                                                            } else {
                                                                onSelectRowKeys(current.filter((k) => k !== doc.id!));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {doc.fileUrls?.[0]?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                                <img alt="preview" src={buildDocumentFileUrl(doc.fileUrls[0], true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : doc.fileUrls?.[0]?.match(/\.(pdf)$/i) ? (
                                                <FilePdfOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />
                                            ) : doc.fileUrls?.[0]?.match(/\.(xlsx|xls|csv)$/i) ? (
                                                <FileExcelOutlined style={{ fontSize: 48, color: "#52c41a" }} />
                                            ) : doc.fileUrls?.[0]?.match(/\.(zip|rar|7z)$/i) ? (
                                                <FileZipOutlined style={{ fontSize: 48, color: "#faad14" }} />
                                            ) : (
                                                <FileTextOutlined style={{ fontSize: 48, color: "#db2777" }} />
                                            )}
                                        </div>
                                    }
                                >
                                    <Card.Meta
                                        title={<span style={{ fontSize: 13 }} title={doc.documentName}>{doc.documentName}</span>}
                                        description={<span style={{ fontSize: 11, color: "#94a3b8" }}>{dayjs(doc.createdAt).format("DD/MM/YYYY")}</span>}
                                    />
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Spin>
    );
};

export default React.memo(DocumentGrid);
