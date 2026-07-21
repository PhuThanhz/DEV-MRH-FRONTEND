import React, { useState, useEffect } from 'react';
import { Modal, Tree, Spin, Empty, Typography, Row, Col } from 'antd';
import { FolderOutlined, FolderOpenOutlined, FilePdfOutlined, FileExcelOutlined, FileImageOutlined, FileZipOutlined, FileTextOutlined, FileOutlined } from '@ant-design/icons';
import { callFetchFolderTree, callCreateDocumentShortcut, callFetchFolderDocuments } from '@/config/api';
import type { IDocumentFolder, IDocument } from '@/types/backend';
import { notify } from "@/components/common/notification/notify";
import { getModalWidth } from '@/utils/responsive';

const { Text } = Typography;

interface IProps {
    open: boolean;
    onClose: () => void;
    document?: IDocument | null;
}

const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return <FileImageOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
    if (['zip', 'rar', '7z'].includes(ext || '')) return <FileZipOutlined style={{ color: '#fa8c16', fontSize: 24 }} />;
    if (['doc', 'docx'].includes(ext || '')) return <FileTextOutlined style={{ color: '#2b579a', fontSize: 24 }} />;
    return <FileOutlined style={{ color: '#8c8c8c', fontSize: 24 }} />;
};

const ModalAddShortcut: React.FC<IProps> = ({ open, onClose, document }) => {
    const [treeData, setTreeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [folderDocs, setFolderDocs] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    useEffect(() => {
        if (open) {
            fetchTree();
            setSelectedKeys([]);
            setFolderDocs([]);
        }
    }, [open]);

    const fetchTree = async () => {
        setLoading(true);
        try {
            const res = await callFetchFolderTree();
            if (res.data) {
                setTreeData(formatTreeData(res.data));
            }
        } catch (error) {
            notify.error("Không thể tải cây thư mục");
        } finally {
            setLoading(false);
        }
    };

    const fetchDocsForFolder = async (folderId: number) => {
        setLoadingDocs(true);
        try {
            const res = await callFetchFolderDocuments(folderId);
            if (res.data) {
                setFolderDocs(res.data);
            } else {
                setFolderDocs([]);
            }
        } catch (error) {
            notify.error("Không thể tải danh sách tài liệu trong thư mục");
        } finally {
            setLoadingDocs(false);
        }
    };

    const formatTreeData = (folders: IDocumentFolder[]): any[] => {
        return folders.map(f => ({
            title: f.folderName,
            key: f.id as number,
            icon: ({ expanded }: any) => (expanded ? <FolderOpenOutlined style={{ color: '#faad14' }} /> : <FolderOutlined style={{ color: '#faad14' }} />),
            children: f.children && f.children.length > 0 ? formatTreeData(f.children) : undefined,
            isLeaf: !f.children || f.children.length === 0,
        }));
    };

    const handleSelect = (keys: React.Key[], info: any) => {
        setSelectedKeys(keys);
        if (keys.length > 0) {
            const folderId = Number(keys[0]);
            fetchDocsForFolder(folderId);
        } else {
            setFolderDocs([]);
        }
    };

    const handleOk = async () => {
        if (selectedKeys.length === 0) {
            notify.warning("Vui lòng chọn thư mục đích");
            return;
        }
        if (!document?.id) {
            notify.error("Không tìm thấy thông tin tài liệu. Vui lòng tải lại trang.");
            return;
        }

        setSubmitting(true);
        try {
            const folderId = Number(selectedKeys[0]);
            await callCreateDocumentShortcut(document.id, folderId);
            notify.success("Thêm lối tắt thành công.");
            onClose();
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Đã xảy ra lỗi khi thêm lối tắt";
            notify.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <style>{`
                .shortcut-modal .ant-modal-content {
                    border-radius: 16px;
                    padding: 0;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                }
                .shortcut-modal .ant-modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #f0f0f0;
                    margin-bottom: 0;
                }
                .shortcut-modal .ant-modal-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                }
                .shortcut-modal .ant-modal-body {
                    padding: 0;
                }
                .shortcut-modal .ant-modal-footer {
                    padding: 16px 24px;
                    border-top: 1px solid #f0f0f0;
                    margin-top: 0;
                }
                .folder-pane {
                    height: 400px;
                    overflow-y: auto;
                    padding: 16px 8px 16px 24px;
                    background: #fcfcfc;
                    border-right: 1px solid #f0f0f0;
                }
                .docs-pane {
                    height: 400px;
                    overflow-y: auto;
                    padding: 16px 24px 16px 16px;
                    background: #fff;
                }
                .doc-item {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .doc-item:hover {
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }
                .doc-icon {
                    margin-right: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: #f1f5f9;
                    border-radius: 8px;
                }
                .doc-info {
                    flex: 1;
                    min-width: 0;
                }
                .doc-title {
                    font-weight: 500;
                    color: #334155;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .doc-meta {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 2px;
                }
                .btn-ghim {
                    background: #1677ff;
                    border-color: #1677ff;
                    box-shadow: 0 2px 8px rgba(22, 119, 255, 0.25);
                    border-radius: 8px;
                    font-weight: 500;
                }
                .btn-ghim:hover {
                    background: #0958d9 !important;
                }
            `}</style>
            <Modal
                title={<span>Thêm lối tắt cho <Text strong style={{ color: '#1677ff' }}>{document?.documentCode || 'Tài liệu'}</Text></span>}
                open={open}
                onOk={handleOk}
                onCancel={onClose}
                confirmLoading={submitting}
                okText="Thêm lối tắt"
                cancelText="Hủy"
                width={getModalWidth(800)}
                className="shortcut-modal"
                okButtonProps={{ className: 'btn-ghim', disabled: selectedKeys.length === 0 }}
                destroyOnHidden
            >
                <Row>
                    <Col span={10} className="folder-pane">
                        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12, fontWeight: 600, letterSpacing: '0.5px' }}>
                            CÂY THƯ MỤC CỦA BẠN
                        </Text>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Spin />
                            </div>
                        ) : treeData.length > 0 ? (
                            <Tree
                                showIcon
                                defaultExpandAll
                                treeData={treeData}
                                onSelect={handleSelect}
                                selectedKeys={selectedKeys}
                                style={{ background: 'transparent' }}
                            />
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Kho cá nhân trống" />
                        )}
                    </Col>
                    <Col span={14} className="docs-pane">
                        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12, fontWeight: 600, letterSpacing: '0.5px' }}>
                            {selectedKeys.length > 0 ? "NỘI DUNG THƯ MỤC ĐÃ CHỌN" : "BẢN XEM TRƯỚC (CHƯA CHỌN THƯ MỤC)"}
                        </Text>
                        {selectedKeys.length === 0 ? (
                            <div style={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Vui lòng nhấp chọn một thư mục bên trái" />
                            </div>
                        ) : loadingDocs ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Spin />
                            </div>
                        ) : folderDocs.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {folderDocs.map(doc => (
                                    <div key={doc.id} className="doc-item">
                                        <div className="doc-icon">
                                            {doc.fileUrls?.[0] ? getFileIcon(doc.fileUrls[0]) : <FileOutlined style={{ fontSize: 24, color: "#94a3b8" }} />}
                                        </div>
                                        <div className="doc-info">
                                            <div className="doc-title">{doc.documentName}</div>
                                            <div className="doc-meta">
                                                {doc.documentCode} {doc.isShortcut ? ' • Lối tắt' : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Thư mục này đang trống" />
                            </div>
                        )}
                    </Col>
                </Row>
            </Modal>
        </>
    );
};

export default ModalAddShortcut;
