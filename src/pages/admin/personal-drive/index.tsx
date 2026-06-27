import React, { useEffect, useState, useRef } from "react";
import {
    Layout,
    Tree,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Upload,
    Popconfirm,
    Breadcrumb,
    Space,
    Tag,
    Avatar,
    Tooltip,
    Card,
    Empty,
    Spin,
    message,
    Dropdown,
    Radio,
    Row,
    Col,
    Progress,
    Badge,
    Drawer,
    Descriptions
} from "antd";
import {
    FolderOutlined,
    FolderOpenOutlined,
    FileOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    DownloadOutlined,
    EyeOutlined,
    UserOutlined,
    ReloadOutlined,
    FolderAddOutlined,
    ArrowLeftOutlined,
    LeftOutlined,
    FilePdfOutlined,
    FileExcelOutlined,
    FileZipOutlined,
    FileTextOutlined,
    MoreOutlined,
    CloudUploadOutlined,
    FolderFilled,
    AppstoreOutlined,
    BarsOutlined,
    PictureOutlined,
    FileImageOutlined,
    SearchOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    LinkOutlined,
    SwapOutlined,
    RollbackOutlined
} from "@ant-design/icons";
import type { UploadFile, MenuProps } from "antd";
import type { DataNode } from "antd/es/tree";
import { useAppSelector } from "@/redux/hooks";
import {
    callFetchFolderTree,
    callCreateFolder,
    callUpdateFolder,
    callDeleteFolder,
    callFetchSubordinates,
    callFetchDocuments,
    callCreateDocument,
    callDeleteDocument,
    callFetchDocumentCategoryActive,
    callUploadSingleFile,
    callUpdateDocument,
    callFetchUser,
    callFetchFolderDocuments,
    callDeleteDocumentShortcut,
    callFetchAccountingDocumentCategoryActive
} from "@/config/api";
import type { IDocument, IDocumentFolder } from "@/types/backend";
import PageContainer from "@/components/common/data-table/PageContainer";
import dayjs from "dayjs";
import ModalSelectEmployee from "./ModalSelectEmployee";

const { Sider, Content } = Layout;
const ACCOUNTING_DOC_CATEGORY_CODE = "ACCOUNTING_DOC";
const DEFAULT_DOCUMENT_KIND = "NORMAL";

const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />;
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return <FileImageOutlined style={{ color: '#1890ff', fontSize: 16 }} />;
    if (['zip', 'rar', '7z'].includes(ext || '')) return <FileZipOutlined style={{ color: '#fa8c16', fontSize: 16 }} />;
    if (['doc', 'docx'].includes(ext || '')) return <FileTextOutlined style={{ color: '#2b579a', fontSize: 16 }} />;
    return <FileOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />;
};

const PersonalDrivePage: React.FC = () => {
    const currentUser = useAppSelector(state => state.account.user);
    const isSuperAdmin = currentUser?.role?.name === "SUPER_ADMIN";
    const isSubAdmin = currentUser?.role?.name === "ADMIN_SUB_1";
    const isCompanyAdmin = currentUser?.role?.name === "ADMIN_SUB_2";
    const isAdmin = isSuperAdmin || isSubAdmin || isCompanyAdmin;

    // Subordinate state
    const [subordinates, setSubordinates] = useState<any[]>([]);
    const [selectedSubordinateId, setSelectedSubordinateId] = useState<string | undefined>(undefined);

    // Folder tree state
    const [treeData, setTreeData] = useState<any[]>([]);
    const [rawFolders, setRawFolders] = useState<IDocumentFolder[]>([]);
    const [loadingTree, setLoadingTree] = useState(false);
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [activeFolderPath, setActiveFolderPath] = useState<{ id: number, folderName: string }[]>([]);
    const [yearOptions, setYearOptions] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>("ALL");

    // Documents state
    const [documents, setDocuments] = useState<IDocument[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [searchText, setSearchText] = useState("");
    const [dragActive, setDragActive] = useState(false);

    const filteredDocuments = documents.filter(doc => 
        doc.documentName.toLowerCase().includes(searchText.toLowerCase()) || 
        doc.documentCode.toLowerCase().includes(searchText.toLowerCase())
    );

    // Categories
    const [categories, setCategories] = useState<any[]>([]);
    const [accountingCategories, setAccountingCategories] = useState<any[]>([]);
    const [accountingSystemCategoryId, setAccountingSystemCategoryId] = useState<number | undefined>();

    // Modals
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [folderForm] = Form.useForm();
    const [editingFolder, setEditingFolder] = useState<IDocumentFolder | null>(null);
    const [parentFolderId, setParentFolderId] = useState<number | null>(null);

    // Upload Document Modal
    const [docModalOpen, setDocModalOpen] = useState(false);
    const [docForm] = Form.useForm();
    const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);

    // Edit Document
    const [editDocModalOpen, setEditDocModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<IDocument | null>(null);
    const [editDocForm] = Form.useForm();

    // Document Details Drawer
    const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
    const [selectedDocDetails, setSelectedDocDetails] = useState<IDocument | null>(null);

    // Preview
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");

    // Modal select employee
    const [openEmployeeModal, setOpenEmployeeModal] = useState(false);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

    // Read-only state
    const isReadOnly = !!selectedSubordinateId;
    const activeOwnerId = selectedSubordinateId || currentUser?.id;
    const dragCounter = useRef(0);

    // Fetch subordinates or all users for admin on mount
    useEffect(() => {
        const fetchSubs = async () => {
            try {
                const res = await callFetchSubordinates();
                if (res?.data) {
                    setSubordinates(res.data);
                }
            } catch (err) {
                console.error("Lỗi khi lấy danh sách người dùng:", err);
            }
        };
        if (currentUser?.id) {
            fetchSubs();
        }

        const fetchCats = async () => {
            try {
                const res = await callFetchDocumentCategoryActive();
                if (res?.data) {
                    const accountingSystemCategory = res.data.find((c: any) => c.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE);
                    setAccountingSystemCategoryId(accountingSystemCategory?.id);
                    const normalCats = res.data.filter((c: any) => 
                        !c.mappingProcedure &&
                        !c.isCrossCompany &&
                        c.categoryCode !== ACCOUNTING_DOC_CATEGORY_CODE
                    );
                    setCategories(normalCats);
                }
            } catch (err) {
                console.error("Lỗi khi lấy danh mục văn bản:", err);
            }
        };
        fetchCats();

        const fetchAccountingCats = async () => {
            try {
                const res = await callFetchAccountingDocumentCategoryActive();
                if (res?.data) {
                    setAccountingCategories(res.data);
                }
            } catch (err) {
                console.error("Lỗi khi lấy loại chứng từ kế toán:", err);
            }
        };
        fetchAccountingCats();
    }, [currentUser]);

    // Fetch folder tree when activeOwnerId changes
    const loadFolderTree = async (ownerId?: string) => {
        if (!ownerId) return;
        setLoadingTree(true);
        try {
            const res = await callFetchFolderTree(ownerId);
            if (res?.data) {
                setRawFolders(res.data);
                const years = res.data
                    .map(f => f.folderName)
                    .filter(name => name.startsWith("Năm "))
                    .map(name => name.replace("Năm ", ""));
                setYearOptions(Array.from(new Set(years)).sort((a, b) => b.localeCompare(a)));

                const formattedTree = buildTreeNodes(res.data);
                setTreeData(formattedTree);

                if (res.data.length > 0 && !selectedFolderId) {
                    const firstNode = res.data[0];
                    setSelectedFolderId(firstNode.id!);
                    setActiveFolderPath([{ id: firstNode.id!, folderName: firstNode.folderName }]);
                }
            }
        } catch (err) {
            message.error("Không thể tải cấu trúc thư mục");
        } finally {
            setLoadingTree(false);
        }
    };

    useEffect(() => {
        if (activeOwnerId) {
            loadFolderTree(activeOwnerId);
        }
    }, [activeOwnerId]);

    const loadFolderDocuments = async (folderId: number) => {
        setLoadingDocs(true);
        try {
            const res = await callFetchFolderDocuments(folderId);
            if (res?.data) {
                setDocuments(res.data);
            } else {
                setDocuments([]);
            }
        } catch (err) {
            message.error("Lỗi khi lấy danh sách tài liệu");
        } finally {
            setLoadingDocs(false);
        }
    };

    useEffect(() => {
        if (selectedFolderId) {
            loadFolderDocuments(selectedFolderId);
        } else {
            setDocuments([]);
        }
    }, [selectedFolderId]);

    const handleMoveDocument = async (documentId: number, targetFolderId: number) => {
        if (selectedFolderId === targetFolderId) return;

        try {
            const docToMove = documents.find(d => d.id === documentId);
            if (!docToMove) return;

            await callUpdateDocument(documentId, {
                documentCode: docToMove.documentCode,
                documentName: docToMove.documentName,
                categoryId: docToMove.category?.id || 0,
                folderId: targetFolderId,
                note: docToMove.note,
                fileUrls: docToMove.fileUrls
            });
            message.success("Di chuyển tệp thành công!");

            if (selectedFolderId) {
                loadFolderDocuments(selectedFolderId);
            }
        } catch (err: any) {
            message.error(err.message || "Lỗi khi di chuyển tài liệu");
        }
    };

    const buildTreeNodes = (folders: IDocumentFolder[]): DataNode[] => {
        return folders.map(f => {
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
                                    handleMoveDocument(Number(docId), f.id);
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
                                    paddingRight: 8
                                }}
                            >
                                {f.folderName}
                            </span>
                            {f.documentCount !== undefined && f.documentCount > 0 && (
                                <Badge
                                    count={f.documentCount}
                                    style={{
                                        backgroundColor: '#1890ff',
                                        color: '#fff',
                                        boxShadow: 'none',
                                        transform: 'scale(0.85)',
                                        marginTop: -2
                                    }}
                                />
                            )}
                        </div>
                        {!isReadOnly && (
                            <span className="folder-actions" onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                                <Dropdown
                                    trigger={['click']}
                                    menu={{
                                        items: [
                                            {
                                                key: 'add',
                                                icon: <PlusOutlined style={{ color: "#64748b" }} />,
                                                label: 'Thêm thư mục con',
                                                onClick: () => {
                                                    setEditingFolder(null);
                                                    setParentFolderId(f.id!);
                                                    folderForm.setFieldsValue({ folderName: "" });
                                                    setFolderModalOpen(true);
                                                }
                                            },
                                            ...(isYear ? [] : [
                                                {
                                                    key: 'edit',
                                                    icon: <EditOutlined style={{ color: "#faad14" }} />,
                                                    label: 'Đổi tên thư mục',
                                                    onClick: () => {
                                                        setEditingFolder(f);
                                                        setParentFolderId(f.parentId || null);
                                                        folderForm.setFieldsValue({ folderName: f.folderName });
                                                        setFolderModalOpen(true);
                                                    }
                                                },
                                                { type: 'divider' as const },
                                                {
                                                    key: 'delete',
                                                    icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
                                                    danger: true,
                                                    label: 'Xóa thư mục',
                                                    onClick: () => {
                                                        Modal.confirm({
                                                            title: 'Xác nhận xóa',
                                                            content: 'Bạn có chắc chắn muốn xóa thư mục này?',
                                                            okText: 'Xóa',
                                                            okType: 'danger',
                                                            cancelText: 'Hủy',
                                                            onOk: async () => {
                                                                try {
                                                                    await callDeleteFolder(f.id!);
                                                                    message.success("Xóa thư mục thành công");
                                                                    if (selectedFolderId === f.id) {
                                                                        setSelectedFolderId(null);
                                                                        setActiveFolderPath([]);
                                                                    }
                                                                    loadFolderTree(activeOwnerId);
                                                                } catch (err: any) {
                                                                    message.error(err.message || "Xóa thư mục thất bại");
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                            ])
                                        ]
                                    }}
                                >
                                    <Button type="text" size="small" icon={<MoreOutlined />} />
                                </Dropdown>
                            </span>
                        )}
                    </div>
                ),
                children: f.children && f.children.length > 0 ? buildTreeNodes(f.children) : [],
                icon: ({ expanded }: any) => expanded ? <FolderFilled style={{ color: "#fbbf24", fontSize: 16 }} /> : <FolderFilled style={{ color: "#fcd34d", fontSize: 16 }} />
            };
        });
    };

    const findFolderPath = (
        folders: IDocumentFolder[], 
        targetId: number, 
        currentPath: { id: number, folderName: string }[] = []
    ): { id: number, folderName: string }[] | null => {
        for (const f of folders) {
            const node = { id: f.id!, folderName: f.folderName };
            if (f.id === targetId) {
                return [...currentPath, node];
            }
            if (f.children && f.children.length > 0) {
                const p = findFolderPath(f.children, targetId, [...currentPath, node]);
                if (p) return p;
            }
        }
        return null;
    };

    useEffect(() => {
        if (selectedFolderId && rawFolders.length > 0) {
            const path = findFolderPath(rawFolders, selectedFolderId);
            if (path) {
                setActiveFolderPath(path);
            }
        } else if (selectedFolderId === null) {
            setActiveFolderPath([]);
        }
    }, [selectedFolderId, rawFolders]);

    const handleSelectFolder = (selectedKeys: React.Key[], info: any) => {
        if (selectedKeys.length > 0) {
            const folderId = Number(selectedKeys[0]);
            setSelectedFolderId(folderId);
            const path = findFolderPath(rawFolders, folderId);
            if (path) {
                setActiveFolderPath(path);
            }
        }
    };

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        if (year === "ALL") {
            setExpandedKeys([]);
            return;
        }
        const matched = rawFolders.find(f => f.folderName === `Năm ${year}`);
        if (matched) {
            setExpandedKeys([matched.id!]);
            setSelectedFolderId(matched.id!);
            setActiveFolderPath([{ id: matched.id!, folderName: matched.folderName }]);
        }
    };

    const handleFolderSubmit = async (values: any) => {
        try {
            if (editingFolder) {
                await callUpdateFolder(editingFolder.id!, {
                    folderName: values.folderName,
                    parentId: parentFolderId
                });
                message.success("Đổi tên thư mục thành công");
            } else {
                await callCreateFolder({
                    folderName: values.folderName,
                    parentId: parentFolderId,
                    ownerId: activeOwnerId
                });
                message.success("Tạo thư mục thành công");
            }
            setFolderModalOpen(false);
            loadFolderTree(activeOwnerId);
        } catch (err: any) {
            message.error(err.message || "Thao tác thư mục thất bại");
        }
    };

    const customUploadRequest = async (options: any) => {
        const { file, onSuccess, onError } = options;
        setUploading(true);
        const hideLoading = message.loading(`Đang tải tệp "${file.name}" lên máy chủ...`, 0);
        try {
            const res = await callUploadSingleFile(file, "documents");
            if (res?.data?.fileName) {
                const fileName = res.data.fileName;
                onSuccess(fileName);
                setUploadedFiles([{
                    uid: "-1",
                    name: file.name,
                    status: "done",
                    url: `/api/v1/files?fileName=${encodeURIComponent(fileName)}&folder=documents`,
                    response: fileName
                }]);

                const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                docForm.setFieldsValue({
                    documentKind: DEFAULT_DOCUMENT_KIND,
                    documentName: cleanName,
                    documentCode: `PERS-${dayjs().format("YYYY")}-${dayjs().format("HHmmss")}`,
                    categoryId: categories.length > 0 ? categories[0].id : undefined,
                    accountingCategoryId: accountingCategories.length > 0 ? accountingCategories[0].id : undefined,
                    note: ""
                });
                hideLoading();
                message.success(`Tải tệp "${file.name}" lên thành công!`);
                setDocModalOpen(true);
            } else {
                hideLoading();
                onError(new Error("Upload thất bại"));
                message.error("Tải tệp lên thất bại");
            }
        } catch (err) {
            hideLoading();
            onError(err);
            message.error("Lỗi khi tải file lên hệ thống");
        } finally {
            setUploading(false);
        }
    };

    const handleDirectFileUpload = async (file: File) => {
        if (!selectedFolderId) {
            message.warning("Vui lòng chọn thư mục trước khi tải tệp lên!");
            return;
        }
        const isRoot = treeData.some(root => root.key === selectedFolderId);
        if (isRoot) {
            message.warning("Vui lòng chọn thư mục con để tải tệp lên!");
            return;
        }

        setUploading(true);
        const hideLoading = message.loading(`Đang tải tệp "${file.name}" lên máy chủ...`, 0);
        try {
            const res = await callUploadSingleFile(file, "documents");
            if (res?.data?.fileName) {
                const fileName = res.data.fileName;
                setUploadedFiles([{
                    uid: "-1",
                    name: file.name,
                    status: "done",
                    url: `/api/v1/files?fileName=${encodeURIComponent(fileName)}&folder=documents`,
                    response: fileName
                }]);
                
                const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                docForm.setFieldsValue({
                    documentKind: DEFAULT_DOCUMENT_KIND,
                    documentName: cleanName,
                    documentCode: `PERS-${dayjs().format("YYYY")}-${dayjs().format("HHmmss")}`,
                    categoryId: categories.length > 0 ? categories[0].id : undefined,
                    accountingCategoryId: accountingCategories.length > 0 ? accountingCategories[0].id : undefined,
                    note: ""
                });
                hideLoading();
                message.success(`Tải tệp "${file.name}" lên thành công!`);
                setDocModalOpen(true);
            } else {
                hideLoading();
                message.error("Tải tệp lên thất bại");
            }
        } catch (err) {
            hideLoading();
            message.error("Lỗi khi tải file lên hệ thống");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateDocumentSubmit = async (values: any) => {
        if (uploadedFiles.length === 0 || !uploadedFiles[0].response) {
            message.warning("Vui lòng tải lên file đính kèm trước!");
            return;
        }

        const isAccountingDoc = values.documentKind === "ACCOUNTING";

        if (isAccountingDoc && !accountingSystemCategoryId) {
            message.error("Chưa cấu hình danh mục hệ thống ACCOUNTING_DOC cho chứng từ kế toán");
            return;
        }

        const payload = {
            documentCode: values.documentCode.trim().toUpperCase(),
            documentName: values.documentName.trim(),
            categoryId: isAccountingDoc ? accountingSystemCategoryId! : values.categoryId,
            accountingCategoryId: isAccountingDoc ? values.accountingCategoryId : undefined,
            note: values.note,
            fileUrls: [uploadedFiles[0].response],
            folderId: selectedFolderId!,
            status: isAccountingDoc ? "PENDING_ACCOUNTING_REVIEW" : "IN_PROGRESS"
        };

        try {
            await callCreateDocument(payload);
            message.success("Tải tài liệu và lưu hồ sơ thành công");
            setDocModalOpen(false);
            docForm.resetFields();
            setUploadedFiles([]);
            if (selectedFolderId) {
                loadFolderDocuments(selectedFolderId);
            }
        } catch (err: any) {
            message.error(err.message || "Không thể tạo hồ sơ tài liệu");
        }
    };

    const handleEditDocumentSubmit = async (values: any) => {
        if (!editingDoc || !editingDoc.id) return;
        try {
            await callUpdateDocument(editingDoc.id, {
                documentCode: values.documentCode.trim().toUpperCase(),
                documentName: values.documentName.trim(),
                categoryId: editingDoc.category?.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE
                    ? editingDoc.category.id
                    : values.categoryId,
                accountingCategoryId: editingDoc.category?.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE
                    ? values.accountingCategoryId
                    : undefined,
                note: values.note,
                fileUrls: editingDoc.fileUrls || [],
                folderId: selectedFolderId!,
                status: editingDoc.status,
            });
            message.success("Cập nhật tài liệu thành công");
            setEditDocModalOpen(false);
            setEditingDoc(null);
            if (selectedFolderId) {
                loadFolderDocuments(selectedFolderId);
            }
        } catch (err: any) {
            message.error(err.message || "Lỗi khi cập nhật tài liệu");
        }
    };

    const handleDeleteDoc = async (record: IDocument) => {
        try {
            if (record.isShortcut) {
                await callDeleteDocumentShortcut(record.id!, selectedFolderId!);
                message.success("Xóa lối tắt thành công");
            } else {
                await callDeleteDocument(record.id!);
                message.success("Xóa tài liệu khỏi kho thành công");
            }
            if (selectedFolderId) {
                loadFolderDocuments(selectedFolderId);
            }
        } catch (err: any) {
            message.error(err.message || "Xóa tài liệu thất bại");
        }
    };

    const columns = [
        {
            title: "Mã tài liệu",
            dataIndex: "documentCode",
            key: "documentCode",
            width: 180,
            render: (code: string) => (
                <Tag
                    style={{
                        fontFamily: "monospace",
                        borderRadius: 6,
                        backgroundColor: "#f1f5f9",
                        color: "#475569",
                        border: "1px solid #cbd5e1",
                        padding: "2px 8px",
                        margin: 0
                    }}
                >
                    {code}
                </Tag>
            )
        },
        {
            title: "Tên tài liệu",
            dataIndex: "documentName",
            key: "documentName",
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
                                    border: "1px solid #1677ff"
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
            )
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
                            borderRadius: 6,
                            backgroundColor: isAccountingDoc ? "#fff0f6" : "#eff6ff",
                            color: isAccountingDoc ? "#c41d7f" : "#1d4ed8",
                            border: isAccountingDoc ? "1px solid #ffadd2" : "1px solid #bfdbfe",
                            padding: "2px 8px",
                            margin: 0
                        }}
                    >
                        {isAccountingDoc ? "Kế toán: " : ""}{label}
                    </Tag>
                ) : <span style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic" }}>Chưa phân loại</span>;
            }
        },
        {
            title: "Ngày tải lên",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 160,
            render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm")
        },

        {
            title: "Hành động",
            key: "actions",
            width: 120,
            align: "center" as const,
            render: (_: any, record: IDocument) => {
                return (
                    <Space size={4}>
                        <Tooltip title="Xem chi tiết">
                            <Button
                                type="text"
                                icon={<EyeOutlined style={{ color: "#3b82f6" }} />}
                                size="small"
                                onClick={() => {
                                    setSelectedDocDetails(record);
                                    setDetailsDrawerOpen(true);
                                }}
                            />
                        </Tooltip>
                        {!isReadOnly ? (
                            <>
                                <Tooltip title="Chỉnh sửa">
                                    <Button
                                        type="text"
                                        icon={<EditOutlined style={{ color: "#d97706" }} />}
                                        size="small"
                                        onClick={() => {
                                            setEditingDoc(record);
                                            editDocForm.setFieldsValue({
                                                documentName: record.documentName,
                                                documentCode: record.documentCode,
                                                categoryId: record.category?.id,
                                                accountingCategoryId: record.accountingCategory?.id,
                                                note: record.note
                                            });
                                            setEditDocModalOpen(true);
                                        }}
                                    />
                                </Tooltip>
                                <Popconfirm
                                    title={record.isShortcut ? "Xác nhận xóa lối tắt này khỏi thư mục?" : "Xác nhận xóa tài liệu này?"}
                                    onConfirm={() => handleDeleteDoc(record)}
                                    okText="Xóa"
                                    cancelText="Huỷ"
                                >
                                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                </Popconfirm>
                            </>
                        ) : (
                            <Tag color="default">Chỉ xem</Tag>
                        )}
                    </Space>
                );
            }
        }
    ];

    const findFolderById = (folders: IDocumentFolder[], id: number): IDocumentFolder | null => {
        for (const f of folders) {
            if (f.id === id) return f;
            if (f.children && f.children.length > 0) {
                const found = findFolderById(f.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const selectedFolderNode = selectedFolderId ? findFolderById(rawFolders, selectedFolderId) : null;
    const subfolders = selectedFolderNode?.children || [];

    return (
        <PageContainer title="Kho lưu trữ tài liệu cá nhân">
            <style>{`
                .personal-drive-layout { background: transparent; margin-top: 10px; }
                .drive-sider { background: #ffffff !important; border-radius: 16px; padding: 20px 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #f1f5f9; margin-right: 20px; }
                .drive-content { background: #ffffff; border-radius: 16px; padding: 24px; min-height: 600px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #f1f5f9; position: relative; }
                .subordinate-selector-wrapper { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px dashed #e2e8f0; }
                .sider-header { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #94a3b8; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; padding: 0 8px; }
                .ant-tree { background: transparent !important; }
                .ant-tree-node-content-wrapper:hover { background: #f1f5f9 !important; }
                .ant-tree-node-selected { background: #e2e8f0 !important; color: #0f172a !important; font-weight: 600 !important; }
                .folder-actions { opacity: 0; transition: opacity 0.2s ease; }
                .ant-tree-treenode:hover .folder-actions { opacity: 1; }
                .drive-breadcrumb { background: transparent; padding: 0; margin-bottom: 20px; border: none; }
                .drive-header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9; }
                .ant-table-thead > tr > th { background: #f8fafc !important; }
                .ant-tree .ant-tree-title {
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    display: inline-block;
                }
                .ant-tree .ant-tree-node-content-wrapper { 
                    display: flex !important; 
                    align-items: center;
                    padding: 4px 8px !important; 
                    border-radius: 8px !important; 
                    margin-bottom: 2px !important; 
                    transition: all 0.2s ease; 
                }
                .ant-tree-switcher { line-height: 32px !important; }
                .grid-document-card { transition: all 0.3s ease; }
                .grid-document-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }

                /* Custom style for "+ Mới" button in Google Drive style */
                .btn-google-new {
                    transition: all 0.2s ease-in-out !important;
                }
                .btn-google-new:hover, .btn-google-new:focus, .btn-google-new:active, .btn-google-new:focus-visible {
                    background: #fdf2f8 !important;
                    border-color: #f472b6 !important;
                    color: #db2777 !important;
                    box-shadow: 0 4px 16px rgba(219, 39, 119, 0.15) !important;
                    transform: translateY(-1px);
                    outline: none !important;
                }
                .btn-google-new:active {
                    background: #fce7f3 !important;
                    transform: translateY(0);
                }

                /* Segmented/Radio Control style for list/grid toggle */
                .ant-radio-group {
                    background: #f1f5f9 !important;
                    border: none !important;
                    padding: 3px !important;
                    border-radius: 8px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    height: 38px !important;
                }
                .ant-radio-button-wrapper {
                    background: transparent !important;
                    border: none !important;
                    color: #64748b !important;
                    border-radius: 6px !important;
                    height: 32px !important;
                    line-height: 32px !important;
                    padding: 0 12px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s ease !important;
                    box-shadow: none !important;
                }
                .ant-radio-button-wrapper:hover {
                    color: #334155 !important;
                }
                .ant-radio-button-wrapper::before {
                    display: none !important; /* Remove vertical line divider */
                }
                .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
                    background: #ffffff !important;
                    color: #db2777 !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) !important;
                }
                .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover {
                    color: #be185d !important;
                }
                .ant-btn-primary {
                    background: #db2777 !important;
                    border-color: #db2777 !important;
                }
                .ant-btn-primary:hover, .ant-btn-primary:focus {
                    background: #be185d !important;
                    border-color: #be185d !important;
                }
                .ant-pagination-item,
                .ant-pagination-prev,
                .ant-pagination-next {
                    margin-right: 8px !important;
                }
                .ant-pagination-item-active {
                    border-color: #db2777 !important;
                }
                .ant-pagination-item-active a {
                    color: #db2777 !important;
                }
                .ant-pagination-item:hover {
                    border-color: #db2777 !important;
                }
                .ant-pagination-item:hover a {
                    color: #db2777 !important;
                }
                .ant-pagination-next:hover .ant-pagination-item-link,
                .ant-pagination-prev:hover .ant-pagination-item-link {
                    color: #db2777 !important;
                    border-color: #db2777 !important;
                }
                .ant-select-single.ant-select-open .ant-select-selection-item {
                    color: #db2777 !important;
                }
                .ant-select:hover .ant-select-selector {
                    border-color: #db2777 !important;
                }
                .ant-select-focused .ant-select-selector {
                    border-color: #db2777 !important;
                    box-shadow: 0 0 0 2px rgba(219, 39, 119, 0.1) !important;
                }
                .ant-input:hover, .ant-input:focus, .ant-input-focused {
                    border-color: #db2777 !important;
                    box-shadow: 0 0 0 2px rgba(219, 39, 119, 0.1) !important;
                }
                .ant-form-item-has-error .ant-input:focus,
                .ant-form-item-has-error .ant-input-focused {
                    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1) !important;
                }

                /* Override selected dropdown selection value and text/icon colors to slate */
                .ant-select-selection-item, 
                .ant-select-selection-item span,
                .ant-select-selection-item .anticon {
                    color: #334155 !important;
                }
                .breadcrumb-link:hover {
                    color: #db2777 !important;
                    text-decoration: underline;
                }
            `}</style>

            <Layout className="personal-drive-layout">
                <Sider width={320} className="drive-sider" breakpoint="lg" collapsedWidth={0} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {(subordinates.length > 0 || isAdmin) && (
                            <div className="subordinate-selector-wrapper">
                                <div className="sider-header" style={{ marginBottom: 8 }}>
                                    <span>Chế độ quản lý</span>
                                </div>
                                <Button
                                    block
                                    size="large"
                                    onClick={() => setOpenEmployeeModal(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0 16px',
                                        height: 44,
                                        borderRadius: 8,
                                        background: selectedSubordinateId ? '#eff6ff' : '#fff',
                                        borderColor: selectedSubordinateId ? '#bfdbfe' : '#e2e8f0',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                    }}
                                >
                                    <Space>
                                        <Avatar 
                                            size="small" 
                                            icon={<UserOutlined />} 
                                            style={{ 
                                                background: selectedSubordinateId ? '#3b82f6' : '#db2777',
                                                color: '#fff'
                                            }}
                                        />
                                        <span style={{ 
                                            fontWeight: 600, 
                                            color: selectedSubordinateId ? '#1e3a8a' : '#1e293b',
                                            fontSize: 14
                                        }}>
                                            {selectedSubordinateId ? selectedEmployeeName : "Drive của tôi"}
                                        </span>
                                    </Space>
                                    <SwapOutlined style={{ color: '#94a3b8' }} />
                                </Button>
                                
                                {selectedSubordinateId && (
                                    <div style={{ marginTop: 12 }}>
                                        <Button 
                                            block
                                            danger
                                            type="dashed"
                                            size="middle"
                                            icon={<RollbackOutlined />}
                                            onClick={() => {
                                                setSelectedSubordinateId(undefined);
                                                setSelectedEmployeeName("");
                                                setSelectedFolderId(null);
                                                setActiveFolderPath([]);
                                            }}
                                            style={{ 
                                                height: 38,
                                                borderRadius: 8,
                                                fontWeight: 500
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
                                    trigger={['click']}
                                    menu={{
                                        items: [
                                            {
                                                key: 'new-folder',
                                                icon: <FolderAddOutlined />,
                                                label: 'Thư mục mới',
                                                onClick: () => {
                                                    setEditingFolder(null);
                                                    setParentFolderId(selectedFolderId || null);
                                                    folderForm.setFieldsValue({ folderName: "" });
                                                    setFolderModalOpen(true);
                                                }
                                            },
                                            { type: 'divider' },
                                            {
                                                key: 'upload-file',
                                                icon: <UploadOutlined />,
                                                disabled: uploading || !selectedFolderId || treeData.some(root => root.key === selectedFolderId),
                                                label: (
                                                    <Upload
                                                        customRequest={customUploadRequest}
                                                        showUploadList={false}
                                                        disabled={uploading || !selectedFolderId || treeData.some(root => root.key === selectedFolderId)}
                                                    >
                                                        <div style={{ width: '100%' }}>Tải tệp lên</div>
                                                    </Upload>
                                                ),
                                            }
                                        ]
                                    }}
                                >
                                    <Button
                                        type="default"
                                        size="large"
                                        icon={<PlusOutlined style={{ fontSize: 18, color: "#db2777" }} />}
                                        className="btn-google-new"
                                        style={{
                                            width: 'calc(100% - 8px)',
                                            margin: '4px',
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
                                            gap: 8
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
                            onChange={handleYearChange}
                            options={[{ label: "Tất cả các năm", value: "ALL" }, ...yearOptions.map(y => ({ label: `Năm ${y}`, value: y }))]}
                        />
                        {loadingTree ? <div style={{ textAlign: "center" }}><Spin /></div> : treeData.length > 0 ? (
                            <Tree showIcon blockNode expandedKeys={expandedKeys} onExpand={setExpandedKeys} selectedKeys={selectedFolderId ? [selectedFolderId] : []} onSelect={handleSelectFolder} treeData={treeData} />
                        ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                    </div>
                </Sider>
                <Content 
                    className="drive-content"
                    style={{ position: "relative" }}
                    onDragEnter={(e) => {
                        if (isReadOnly) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.types.includes("Files")) {
                            dragCounter.current++;
                            if (!dragActive) {
                                setDragActive(true);
                            }
                        }
                    }}
                    onDragOver={(e) => {
                        if (isReadOnly) return;
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDragLeave={(e) => {
                        if (isReadOnly) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.types.includes("Files")) {
                            dragCounter.current--;
                            if (dragCounter.current <= 0) {
                                dragCounter.current = 0;
                                setDragActive(false);
                            }
                        }
                    }}
                    onDrop={async (e) => {
                        if (isReadOnly) return;
                        e.preventDefault();
                        e.stopPropagation();
                        dragCounter.current = 0;
                        setDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            const file = e.dataTransfer.files[0];
                            await handleDirectFileUpload(file);
                        }
                    }}
                >
                    {dragActive && (
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(253, 242, 248, 0.9)",
                            border: "2px dashed #db2777",
                            borderRadius: 16,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 50,
                            transition: "all 0.3s ease",
                            pointerEvents: "none"
                        }}>
                            <CloudUploadOutlined style={{ fontSize: 64, color: "#db2777", marginBottom: 16 }} />
                            <span style={{ fontSize: 18, fontWeight: 600, color: "#db2777" }}>
                                Thả file vào đây để tải lên thư mục hiện tại
                            </span>
                        </div>
                    )}
                    {selectedFolderId ? (
                        <div>
                            <Breadcrumb 
                                className="drive-breadcrumb"
                                separator={<span style={{ color: "#cbd5e1" }}>/</span>}
                            >
                                <Breadcrumb.Item>
                                    <Space size={4}>
                                        <HomeOutlined style={{ color: "#db2777", fontSize: 14 }} />
                                        <span style={{ color: "#64748b", fontWeight: 500 }}>Kho lưu trữ</span>
                                    </Space>
                                </Breadcrumb.Item>
                                {activeFolderPath.map((folder, idx) => {
                                    const isLast = idx === activeFolderPath.length - 1;
                                    return (
                                        <Breadcrumb.Item key={idx}>
                                            {isLast ? (
                                                <span style={{ color: "#0f172a", fontWeight: 600 }}>{folder.folderName}</span>
                                            ) : (
                                                <span 
                                                    className="breadcrumb-link"
                                                    style={{ 
                                                        color: "#475569", 
                                                        cursor: "pointer", 
                                                        fontWeight: 500,
                                                        transition: "color 0.2s"
                                                    }}
                                                    onClick={() => {
                                                        setSelectedFolderId(folder.id);
                                                        setExpandedKeys(prev => [...new Set([...prev, folder.id.toString()])]);
                                                    }}
                                                >
                                                    {folder.folderName}
                                                </span>
                                            )}
                                        </Breadcrumb.Item>
                                    );
                                })}
                            </Breadcrumb>

                            {/* Files Table Section */}
                            <div className="drive-header-section">
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        Hồ sơ tài liệu
                                    </h2>
                                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                                        Quản lý và lưu trữ tài liệu trong thư mục này
                                    </div>
                                </div>
                                <Space size={12}>
                                    <Input
                                        placeholder="Tìm tài liệu..."
                                        prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        style={{ width: 220, borderRadius: 8, height: 40 }}
                                        allowClear
                                    />
                                    <Radio.Group
                                        value={viewMode}
                                        onChange={(e) => setViewMode(e.target.value)}
                                        optionType="button"
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="table"><BarsOutlined /></Radio.Button>
                                        <Radio.Button value="grid"><AppstoreOutlined /></Radio.Button>
                                    </Radio.Group>
                                    <Tooltip title="Làm mới dữ liệu">
                                        <Button
                                            icon={<ReloadOutlined style={{ color: "#64748b" }} />}
                                            onClick={() => loadFolderDocuments(selectedFolderId)}
                                            style={{ height: 40, borderRadius: 8, border: "1px solid #e2e8f0" }}
                                        />
                                    </Tooltip>
                                </Space>
                            </div>

                            {subfolders.length > 0 && (
                                <div style={{ marginBottom: 32 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Thư mục</div>
                                    <Row gutter={[16, 16]}>
                                        {subfolders.map(f => (
                                            <Col xs={24} sm={12} md={8} lg={6} key={f.id}>
                                                <div
                                                    className="grid-document-card"
                                                    style={{ background: "#f8fafc", padding: "16px", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", border: "1px solid #e2e8f0" }}
                                                    onClick={() => {
                                                        setSelectedFolderId(f.id!);
                                                        setExpandedKeys(prev => [...new Set([...prev, f.id!.toString()])]);
                                                    }}
                                                >
                                                    <FolderFilled style={{ fontSize: 24, color: "#fbbf24", marginRight: 12 }} />
                                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#334155" }}>{f.folderName}</div>
                                                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{f.documentCount || 0} tài liệu</div>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}

                            {viewMode === "table" ? (
                                <Table
                                    rowKey="id"
                                    loading={loadingDocs}
                                    columns={columns}
                                    dataSource={filteredDocuments}
                                    scroll={{ x: 'max-content' }}
                                    pagination={{
                                        defaultPageSize: 10,
                                        showSizeChanger: true,
                                        showTotal: (total) => `Tổng số ${total} tài liệu`
                                    }}
                                    onRow={(record) => ({
                                        draggable: !isReadOnly,
                                        onDragStart: (e) => {
                                            e.dataTransfer.setData("documentId", record.id!.toString());
                                            e.dataTransfer.effectAllowed = "move";
                                        }
                                    })}
                                />
                            ) : (
                                <Spin spinning={loadingDocs}>
                                    {filteredDocuments.length === 0 ? (
                                        <Empty description="Không có tài liệu nào" style={{ margin: "50px 0" }} />
                                    ) : (
                                        <Row gutter={[16, 16]}>
                                            {filteredDocuments.map((doc) => (
                                                <Col xs={24} sm={12} md={8} lg={6} xl={4} key={doc.id}>
                                                    <Card
                                                        hoverable
                                                        className="grid-document-card"
                                                        style={{ borderRadius: 12, overflow: "hidden" }}
                                                        styles={{ body: { padding: 12 } }}
                                                        draggable={!isReadOnly}
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData("documentId", doc.id!.toString());
                                                            e.dataTransfer.effectAllowed = "move";
                                                        }}
                                                        onClick={() => {
                                                             const firstFile = doc.fileUrls?.[0] || "";
                                                             setPreviewUrl(firstFile ? `/api/v1/files?fileName=${encodeURIComponent(firstFile)}&folder=documents` : "");
                                                             setPreviewTitle(doc.documentName);
                                                             setPreviewOpen(true);
                                                         }}
                                                         cover={
                                                             <div style={{ height: 120, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #f1f5f9" }}>
                                                                 {doc.fileUrls?.[0]?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                                                     <img alt="preview" src={`/api/v1/files?fileName=${encodeURIComponent(doc.fileUrls[0])}&folder=documents`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                 ) : doc.fileUrls?.[0]?.match(/\.(pdf)$/i) ? (
                                                                     <FilePdfOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />
                                                                 ) : doc.fileUrls?.[0]?.match(/\.(xlsx|xls|csv)$/i) ? (
                                                                     <FileExcelOutlined style={{ fontSize: 48, color: "#52c41a" }} />
                                                                 ) : doc.fileUrls?.[0]?.match(/\.(zip|rar|7z)$/i) ? (
                                                                     <FileZipOutlined style={{ fontSize: 48, color: "#faad14" }} />
                                                                 ) : (
                                                                     <FileTextOutlined style={{ fontSize: 48, color: "#ec4899" }} />
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
                                            ))}
                                        </Row>
                                    )}
                                </Spin>
                            )}
                        </div>
                    ) : (
                        <div style={{ 
                            display: "flex", 
                            flexDirection: "column", 
                            justifyContent: "center", 
                            alignItems: "center", 
                            height: "100%", 
                            minHeight: 450,
                            background: "#f8fafc",
                            borderRadius: 16,
                            border: "1px dashed #cbd5e1",
                            padding: 24,
                            textAlign: "center"
                        }}>
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                backgroundColor: "#eff6ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 20,
                                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.1)"
                            }}>
                                <FolderOpenOutlined style={{ fontSize: 36, color: "#3b82f6" }} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>
                                Chọn thư mục làm việc
                            </h3>
                            <p style={{ fontSize: 13, color: "#64748b", maxWidth: 320, margin: 0, lineHeight: 1.6 }}>
                                Vui lòng chọn một thư mục từ danh sách bên trái để bắt đầu quản lý và lưu trữ tài liệu cá nhân của bạn.
                            </p>
                        </div>
                    )}
                </Content>
            </Layout>

            {/* Folder Edit Modal */}
            <Modal
                title={editingFolder ? "Đổi tên thư mục" : "Tạo thư mục mới"}
                open={folderModalOpen}
                onCancel={() => setFolderModalOpen(false)}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={folderForm}
                    layout="vertical"
                    onFinish={handleFolderSubmit}
                    style={{ marginTop: 12 }}
                >
                    <Form.Item
                        name="folderName"
                        label="Tên thư mục"
                        rules={[
                            { required: true, message: "Vui lòng nhập tên thư mục" },
                            { whitespace: true, message: "Tên thư mục không được chỉ chứa khoảng trắng" }
                        ]}
                    >
                        <Input placeholder="Nhập tên thư mục" maxLength={100} autoFocus />
                    </Form.Item>
                    <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setFolderModalOpen(false)}>Huỷ</Button>
                            <Button type="primary" htmlType="submit">Lưu lại</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Document Creation Info Form Modal */}
            <Modal
                title="Khởi tạo hồ sơ tài liệu lưu trữ"
                open={docModalOpen}
                onCancel={() => {
                    setDocModalOpen(false);
                    setUploadedFiles([]);
                }}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={docForm}
                    layout="vertical"
                    onFinish={handleCreateDocumentSubmit}
                    style={{ marginTop: 12 }}
                >
                    <Form.Item
                        name="documentName"
                        label="Tên tài liệu"
                        rules={[
                            { required: true, message: "Vui lòng nhập tên tài liệu" },
                            { whitespace: true, message: "Tên tài liệu không được chỉ chứa khoảng trắng" }
                        ]}
                    >
                        <Input placeholder="Tên hiển thị của tài liệu" maxLength={250} />
                    </Form.Item>

                    <Form.Item
                        name="documentCode"
                        label="Mã tài liệu (Tự sinh)"
                        rules={[
                            { required: true, message: "Vui lòng nhập mã tài liệu" },
                            { whitespace: true, message: "Mã tài liệu không được chỉ chứa khoảng trắng" },
                            { pattern: /^[A-Z0-9_-]+$/i, message: "Mã tài liệu chỉ chứa chữ, số, dấu gạch ngang (-) và gạch dưới (_)" }
                        ]}
                    >
                        <Input placeholder="Mã định danh duy nhất" maxLength={100} />
                    </Form.Item>

                    <Form.Item
                        name="documentKind"
                        label="Loại hồ sơ"
                        rules={[{ required: true, message: "Vui lòng chọn loại hồ sơ" }]}
                    >
                        <Radio.Group
                            optionType="button"
                            buttonStyle="solid"
                            options={[
                                { label: "Tài liệu cá nhân", value: DEFAULT_DOCUMENT_KIND },
                                { label: "Chứng từ kế toán", value: "ACCOUNTING" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.documentKind !== cur.documentKind}>
                        {({ getFieldValue }) => getFieldValue("documentKind") === "ACCOUNTING" ? (
                            <Form.Item
                                name="accountingCategoryId"
                                label="Loại chứng từ kế toán"
                                rules={[{ required: true, message: "Vui lòng chọn loại chứng từ kế toán" }]}
                            >
                                <Select placeholder="Chọn loại chứng từ kế toán">
                                    {accountingCategories.map(c => (
                                        <Select.Option key={c.id} value={c.id}>
                                            {c.symbol ? `[${c.symbol}] ` : ""}{c.categoryName}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        ) : (
                            <Form.Item
                                name="categoryId"
                                label="Danh mục tài liệu"
                                rules={[{ required: true, message: "Vui lòng chọn danh mục tài liệu" }]}
                            >
                                <Select placeholder="Chọn danh mục tài liệu">
                                    {categories.map(c => (
                                        <Select.Option key={c.id} value={c.id}>
                                            [{c.categoryCode}] {c.categoryName}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}
                    </Form.Item>

                    <Form.Item
                        name="note"
                        label="Ghi chú thêm"
                    >
                        <Input.TextArea rows={3} placeholder="Mô tả nội dung tài liệu..." maxLength={500} />
                    </Form.Item>

                    {uploadedFiles.length > 0 && (
                        <div style={{ padding: "8px 12px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, marginBottom: 20 }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>File đã upload: </span>
                            <span style={{ fontWeight: 500, fontSize: 13 }}>{uploadedFiles[0].name}</span>
                        </div>
                    )}

                    <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => {
                                setDocModalOpen(false);
                                setUploadedFiles([]);
                            }}>Huỷ</Button>
                            <Button type="primary" htmlType="submit">Xác nhận Lưu trữ</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Document Preview Modal */}
            <Modal
                title={previewTitle}
                open={previewOpen}
                onCancel={() => setPreviewOpen(false)}
                footer={null}
                width={850}
                styles={{ body: { height: 600, padding: 0 } }}
                destroyOnHidden
            >
                {previewUrl.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                        src={previewUrl}
                        width="100%"
                        height="100%"
                        title="PDF Preview"
                        style={{ border: "none" }}
                    />
                ) : (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "#f1f5f9" }}>
                        <img src={previewUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                )}
            </Modal>

            {/* Edit Document Modal */}
            <Modal
                title={
                    <Space>
                        <EditOutlined style={{ color: "#d97706" }} />
                        <span>Chỉnh sửa hồ sơ tài liệu</span>
                    </Space>
                }
                open={editDocModalOpen}
                onCancel={() => {
                    setEditDocModalOpen(false);
                    setEditingDoc(null);
                }}
                footer={null}
                destroyOnHidden
            >
                <Form
                    form={editDocForm}
                    layout="vertical"
                    onFinish={handleEditDocumentSubmit}
                    style={{ marginTop: 12 }}
                >
                    <Form.Item
                        name="documentName"
                        label="Tên tài liệu"
                        rules={[
                            { required: true, message: "Vui lòng nhập tên tài liệu" },
                            { whitespace: true, message: "Tên tài liệu không được chỉ chứa khoảng trắng" }
                        ]}
                    >
                        <Input placeholder="Tên hiển thị của tài liệu" maxLength={250} />
                    </Form.Item>

                    <Form.Item
                        name="documentCode"
                        label="Mã tài liệu"
                        rules={[
                            { required: true, message: "Vui lòng nhập mã tài liệu" },
                            { whitespace: true, message: "Mã tài liệu không được chỉ chứa khoảng trắng" },
                            { pattern: /^[A-Z0-9_-]+$/i, message: "Mã tài liệu chỉ chứa chữ, số, dấu gạch ngang (-) và gạch dưới (_)" }
                        ]}
                    >
                        <Input placeholder="Mã định danh duy nhất" maxLength={100} />
                    </Form.Item>

                    {editingDoc?.category?.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE ? (
                        <>
                            <Form.Item label="Nhóm hồ sơ">
                                <Tag style={{ backgroundColor: "#fff0f6", color: "#c41d7f", border: "1px solid #ffadd2", borderRadius: 6, margin: 0 }}>
                                    Chứng từ kế toán
                                </Tag>
                            </Form.Item>
                            <Form.Item
                                name="accountingCategoryId"
                                label="Loại chứng từ kế toán"
                                rules={[{ required: true, message: "Vui lòng chọn loại chứng từ kế toán" }]}
                            >
                                <Select placeholder="Chọn loại chứng từ kế toán">
                                    {accountingCategories.map(c => (
                                        <Select.Option key={c.id} value={c.id}>
                                            {c.symbol ? `[${c.symbol}] ` : ""}{c.categoryName}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </>
                    ) : (
                        <Form.Item
                            name="categoryId"
                            label="Danh mục phân loại"
                            rules={[{ required: true, message: "Vui lòng chọn danh mục phân loại" }]}
                        >
                            <Select placeholder="Chọn danh mục loại tài liệu">
                                {categories.map(c => (
                                    <Select.Option key={c.id} value={c.id}>
                                        [{c.categoryCode}] {c.categoryName}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    <Form.Item
                        name="note"
                        label="Ghi chú thêm"
                    >
                        <Input.TextArea rows={3} placeholder="Mô tả nội dung tài liệu..." maxLength={500} />
                    </Form.Item>

                    <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => {
                                setEditDocModalOpen(false);
                                setEditingDoc(null);
                            }}>Huỷ</Button>
                            <Button type="primary" htmlType="submit">Cập nhật</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Document Details Drawer */}
            <Drawer
                title={
                    <Space>
                        <InfoCircleOutlined style={{ color: "#3b82f6" }} />
                        <span>Chi tiết tài liệu</span>
                    </Space>
                }
                placement="right"
                width={420}
                onClose={() => setDetailsDrawerOpen(false)}
                open={detailsDrawerOpen}
                destroyOnClose
            >
                {selectedDocDetails ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "24px 16px",
                            background: "#f8fafc",
                            borderRadius: 12,
                            border: "1px solid #f1f5f9",
                            textAlign: "center"
                        }}>
                            <div style={{ marginBottom: 12 }}>
                                {selectedDocDetails.fileUrls?.[0] ? getFileIcon(selectedDocDetails.fileUrls[0]) : <FileOutlined style={{ fontSize: 48, color: "#94a3b8" }} />}
                            </div>
                            <h4 style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: 0, wordBreak: "break-all" }}>
                                {selectedDocDetails.documentName}
                            </h4>
                        </div>

                        <Descriptions title="Thông tin chi tiết" column={1} size="small" bordered>
                            <Descriptions.Item label="Mã tài liệu">
                                <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#475569" }}>
                                    {selectedDocDetails.documentCode}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Danh mục">
                                {selectedDocDetails.category?.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE ? (
                                    <Tag style={{ backgroundColor: "#fff0f6", color: "#c41d7f", border: "1px solid #ffadd2", borderRadius: 4, margin: 0 }}>
                                        Kế toán: {selectedDocDetails.accountingCategory?.categoryName || "Chứng từ kế toán"}
                                    </Tag>
                                ) : selectedDocDetails.category?.categoryName ? (
                                    <Tag style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 4, margin: 0 }}>
                                        {selectedDocDetails.category.categoryName}
                                    </Tag>
                                ) : (
                                    <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Chưa phân loại</span>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tải lên">
                                {dayjs(selectedDocDetails.createdAt).format("DD/MM/YYYY HH:mm")}
                            </Descriptions.Item>
                            <Descriptions.Item label="Người tải lên">
                                {selectedDocDetails.createdBy || "Hệ thống"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ghi chú">
                                <span style={{ whiteSpace: "pre-line" }}>
                                    {selectedDocDetails.note || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Không có ghi chú</span>}
                                </span>
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
                            {selectedDocDetails.fileUrls?.[0] && (
                                <>
                                    <Button
                                        type="primary"
                                        icon={<EyeOutlined />}
                                        style={{ flex: 1 }}
                                        onClick={() => {
                                            const firstFile = selectedDocDetails.fileUrls?.[0] || "";
                                            setPreviewUrl(firstFile ? `/api/v1/files?fileName=${encodeURIComponent(firstFile)}&folder=documents` : "");
                                            setPreviewTitle(selectedDocDetails.documentName);
                                            setPreviewOpen(true);
                                        }}
                                    >
                                        Xem trước tệp
                                    </Button>
                                    <Button
                                        icon={<DownloadOutlined />}
                                        href={`/api/v1/files?fileName=${encodeURIComponent(selectedDocDetails.fileUrls[0])}&folder=documents`}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Tải về
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <Empty description="Không tìm thấy thông tin tài liệu" />
                )}
            </Drawer>
            <ModalSelectEmployee
                open={openEmployeeModal}
                onClose={() => setOpenEmployeeModal(false)}
                isAdmin={isAdmin}
                currentSelectedId={selectedSubordinateId}
                onSelectEmployee={(id, name) => {
                    if (id) {
                        setSelectedSubordinateId(id);
                        setSelectedEmployeeName(name);
                    } else {
                        setSelectedSubordinateId(undefined);
                        setSelectedEmployeeName("");
                    }
                    setSelectedFolderId(null);
                    setActiveFolderPath([]);
                }}
            />
        </PageContainer>
    );
};

export default PersonalDrivePage;
