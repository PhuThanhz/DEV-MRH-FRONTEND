import React, { useMemo } from "react";
import {
    Layout,
    Button,
    Space,
    Avatar,
    Dropdown,
    Select,
    Tree,
    Empty,
    Spin,
    Badge,
    Modal,
    Upload,
} from "antd";
import {
    UserOutlined,
    SwapOutlined,
    RollbackOutlined,
    PlusOutlined,
    FolderAddOutlined,
    UploadOutlined,
    EditOutlined,
    DeleteOutlined,
    MoreOutlined,
    FolderFilled,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import type { IDocumentFolder } from "@/types/backend";

const { Sider } = Layout;

interface FolderTreeSiderProps {
    subordinates: any[];
    isAdmin: boolean;
    isReadOnly: boolean;
    selectedSubordinateId?: string;
    selectedEmployeeName: string;
    onOpenEmployeeModal: () => void;
    onResetSubordinate: () => void;
    uploading: boolean;
    selectedFolderId: number | null;
    treeDataKeys: React.Key[];
    customUploadRequest: (options: any) => Promise<void>;
    onOpenFolderModalForCreate: (parentId: number | null) => void;
    onOpenFolderModalForEdit: (folder: IDocumentFolder) => void;
    onDeleteFolder: (folderId: number) => Promise<void>;
    onMoveDocument: (documentId: number, targetFolderId: number) => Promise<void>;
    selectedYear: string;
    onYearChange: (year: string) => void;
    yearOptions: string[];
    rawFolders: IDocumentFolder[];
    loadingTree: boolean;
    expandedKeys: React.Key[];
    onExpandKeys: (keys: React.Key[]) => void;
    onSelectFolder: (keys: React.Key[]) => void;
}

export const FolderTreeSider: React.FC<FolderTreeSiderProps> = ({
    subordinates,
    isAdmin,
    isReadOnly,
    selectedSubordinateId,
    selectedEmployeeName,
    onOpenEmployeeModal,
    onResetSubordinate,
    uploading,
    selectedFolderId,
    treeDataKeys,
    customUploadRequest,
    onOpenFolderModalForCreate,
    onOpenFolderModalForEdit,
    onDeleteFolder,
    onMoveDocument,
    selectedYear,
    onYearChange,
    yearOptions,
    rawFolders,
    loadingTree,
    expandedKeys,
    onExpandKeys,
    onSelectFolder,
}) => {
    const buildTreeNodes = (folders: IDocumentFolder[]): DataNode[] => {
        return folders.map((f) => {
            const isYear = f.folderName.startsWith("Năm ");
            return {
                key: f.id!,
                title: (
                    <div
                        className="folder-node-wrapper"
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", overflow: "hidden" }}
                        onDragOver={(e) => {
                            if (!isReadOnly) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                                e.currentTarget.style.background = "#e6f7ff";
                            }
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                        }}
                        onDrop={(e) => {
                            if (!isReadOnly) {
                                e.preventDefault();
                                e.currentTarget.style.background = "transparent";
                                const docId = e.dataTransfer.getData("documentId");
                                if (docId && f.id) {
                                    onMoveDocument(Number(docId), f.id);
                                }
                            }
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", flex: 1, overflow: "hidden" }}>
                            <span
                                title={f.folderName}
                                style={{
                                    fontSize: 14,
                                    fontWeight: isYear ? 600 : 400,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    paddingRight: 8,
                                }}
                            >
                                {f.folderName}
                            </span>
                            {f.documentCount !== undefined && f.documentCount > 0 && (
                                <Badge
                                    count={f.documentCount}
                                    style={{
                                        backgroundColor: "#1890ff",
                                        color: "#fff",
                                        boxShadow: "none",
                                        transform: "scale(0.85)",
                                        marginTop: -2,
                                    }}
                                />
                            )}
                        </div>
                        {!isReadOnly && (
                            <span className="folder-actions" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                                <Dropdown
                                    trigger={["click"]}
                                    menu={{
                                        items: [
                                            {
                                                key: "add",
                                                icon: <PlusOutlined style={{ color: "#64748b" }} />,
                                                label: "Thêm thư mục con",
                                                onClick: () => onOpenFolderModalForCreate(f.id!),
                                            },
                                            ...(isYear
                                                ? []
                                                : [
                                                      {
                                                          key: "edit",
                                                          icon: <EditOutlined style={{ color: "#faad14" }} />,
                                                          label: "Đổi tên thư mục",
                                                          onClick: () => onOpenFolderModalForEdit(f),
                                                      },
                                                      { type: "divider" as const },
                                                      {
                                                          key: "delete",
                                                          icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
                                                          danger: true,
                                                          label: "Xóa thư mục",
                                                          onClick: () => {
                                                              Modal.confirm({
                                                                  title: "Xác nhận xóa",
                                                                  content: "Bạn có chắc chắn muốn xóa thư mục này?",
                                                                  okText: "Xóa",
                                                                  okType: "danger",
                                                                  cancelText: "Hủy",
                                                                  onOk: async () => {
                                                                      await onDeleteFolder(f.id!);
                                                                  },
                                                              });
                                                          },
                                                      },
                                                  ]),
                                        ],
                                    }}
                                >
                                    <Button type="text" size="small" icon={<MoreOutlined />} />
                                </Dropdown>
                            </span>
                        )}
                    </div>
                ),
                children: f.children && f.children.length > 0 ? buildTreeNodes(f.children) : [],
                icon: ({ expanded }: any) =>
                    expanded ? (
                        <FolderFilled style={{ color: "#fbbf24", fontSize: 16 }} />
                    ) : (
                        <FolderFilled style={{ color: "#fcd34d", fontSize: 16 }} />
                    ),
            };
        });
    };

    const treeData = useMemo(
        () => buildTreeNodes(rawFolders),
        [rawFolders, isReadOnly, onMoveDocument, onOpenFolderModalForCreate, onOpenFolderModalForEdit, onDeleteFolder]
    );

    const isRootFolder = selectedFolderId !== null && treeDataKeys.includes(selectedFolderId);
    const isUploadDisabled = uploading || !selectedFolderId || isRootFolder;

    return (
        <Sider
            width={320}
            className="drive-sider"
            breakpoint="lg"
            collapsedWidth={0}
            style={{ display: "flex", flexDirection: "column" }}
        >
            <div style={{ flex: 1, overflowY: "auto" }}>
                {(subordinates.length > 0 || isAdmin) && (
                    <div className="subordinate-selector-wrapper">
                        <div className="sider-header" style={{ marginBottom: 8 }}>
                            <span>Chế độ quản lý</span>
                        </div>
                        <Button
                            block
                            size="large"
                            onClick={onOpenEmployeeModal}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0 16px",
                                height: 44,
                                borderRadius: 8,
                                background: selectedSubordinateId ? "#eff6ff" : "#fff",
                                borderColor: selectedSubordinateId ? "#bfdbfe" : "#e2e8f0",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                            }}
                        >
                            <Space>
                                <Avatar
                                    size="small"
                                    icon={<UserOutlined />}
                                    style={{
                                        background: selectedSubordinateId ? "#3b82f6" : "#db2777",
                                        color: "#fff",
                                    }}
                                />
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: selectedSubordinateId ? "#1e3a8a" : "#1e293b",
                                        fontSize: 14,
                                    }}
                                >
                                    {selectedSubordinateId ? selectedEmployeeName : "Drive của tôi"}
                                </span>
                            </Space>
                            <SwapOutlined style={{ color: "#94a3b8" }} />
                        </Button>

                        {selectedSubordinateId && (
                            <div style={{ marginTop: 12 }}>
                                <Button
                                    block
                                    danger
                                    type="dashed"
                                    size="middle"
                                    icon={<RollbackOutlined />}
                                    onClick={onResetSubordinate}
                                    style={{
                                        height: 38,
                                        borderRadius: 8,
                                        fontWeight: 500,
                                    }}
                                >
                                    Quay về Drive của tôi
                                </Button>
                            </div>
                        )}
                    </div>
                )}
                {!isReadOnly && (
                    <div style={{ paddingBottom: 16 }}>
                        <Dropdown
                            trigger={["click"]}
                            menu={{
                                items: [
                                    {
                                        key: "new-folder",
                                        icon: <FolderAddOutlined />,
                                        label: "Thư mục mới",
                                        onClick: () => onOpenFolderModalForCreate(selectedFolderId || null),
                                    },
                                    { type: "divider" },
                                    {
                                        key: "upload-file",
                                        icon: <UploadOutlined />,
                                        disabled: isUploadDisabled,
                                        label: (
                                            <Upload
                                                customRequest={customUploadRequest}
                                                showUploadList={false}
                                                disabled={isUploadDisabled}
                                            >
                                                <div style={{ width: "100%" }}>Tải tệp lên</div>
                                            </Upload>
                                        ),
                                    },
                                ],
                            }}
                        >
                            <Button
                                type="default"
                                size="large"
                                icon={<PlusOutlined style={{ fontSize: 18, color: "#db2777" }} />}
                                className="btn-google-new"
                                style={{
                                    width: "calc(100% - 8px)",
                                    margin: "4px",
                                    borderRadius: 24,
                                    height: 48,
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: "#475569",
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                }}
                            >
                                Mới
                            </Button>
                        </Dropdown>
                    </div>
                )}
                <div className="sider-header"><span>Danh mục thư mục</span></div>
                <Select
                    style={{ width: "100%", marginBottom: 12 }}
                    value={selectedYear}
                    onChange={onYearChange}
                    options={[
                        { label: "Tất cả các năm", value: "ALL" },
                        ...yearOptions.map((y) => ({ label: `Năm ${y}`, value: y })),
                    ]}
                />
                {loadingTree ? (
                    <div style={{ textAlign: "center" }}><Spin /></div>
                ) : treeData.length > 0 ? (
                    <Tree
                        showIcon
                        blockNode
                        expandedKeys={expandedKeys}
                        onExpand={onExpandKeys}
                        selectedKeys={selectedFolderId ? [selectedFolderId] : []}
                        onSelect={onSelectFolder}
                        treeData={treeData}
                    />
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </div>
        </Sider>
    );
};

export default React.memo(FolderTreeSider);
