import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Form, Modal } from "antd";
import type { UploadFile } from "antd";
import type { IDocument, IDocumentFolder } from "@/types/backend";
import { useAppSelector } from "@/redux/hooks";
import { notify } from "@/components/common/notification/notify";
import dayjs from "dayjs";
import {
    useFolderTreeQuery,
    useFolderDocumentsQuery,
    useCreateFolderMutation,
    useUpdateFolderMutation,
    useDeleteFolderMutation,
    useCreateDocumentMutation,
    useUpdateDocumentMutation,
    useDeleteDocumentMutation,
    useDeleteDocumentShortcutMutation,
} from "@/hooks/useDocuments";
import {
    useSubordinatesQuery,
    useDocumentCategoryActiveQuery,
    useAccountingDocumentCategoryActiveQuery,
    useUploadFileMutation,
} from "@/hooks/usePersonalDriveMeta";
import { findFolderPath, getRecentDocs, addRecentDoc } from "../utils";
import { useQueryClient } from "@tanstack/react-query";

const ACCOUNTING_DOC_CATEGORY_CODE = "ACCOUNTING_DOC";
const DEFAULT_DOCUMENT_KIND = "NORMAL";

export const usePersonalDriveState = () => {
    const currentUser = useAppSelector((state) => state.account.user);
    const isSuperAdmin = currentUser?.role?.name === "SUPER_ADMIN";
    const isSubAdmin = currentUser?.role?.name === "ADMIN_SUB_1";
    const isCompanyAdmin = currentUser?.role?.name === "ADMIN_SUB_2";
    const isAdmin = isSuperAdmin || isSubAdmin || isCompanyAdmin;

    const queryClient = useQueryClient();

    // Subordinate state
    const [selectedSubordinateId, setSelectedSubordinateId] = useState<string | undefined>(undefined);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
    const [openEmployeeModal, setOpenEmployeeModal] = useState(false);

    // Folder tree state
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [activeFolderPath, setActiveFolderPath] = useState<{ id: number; folderName: string }[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>("ALL");

    // View, search, filter, bulk selection & recent docs
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [searchText, setSearchText] = useState("");
    const [fileTypeFilter, setFileTypeFilter] = useState<string>("ALL");
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [recentDocs, setRecentDocs] = useState<IDocument[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const dragCounter = useRef(0);

    // Load recent docs when currentUser changes
    useEffect(() => {
        setRecentDocs(getRecentDocs(currentUser?.id));
    }, [currentUser?.id]);

    const handleRecordAccess = useCallback((doc: IDocument) => {
        if (!doc) return;
        addRecentDoc(doc, currentUser?.id);
        setRecentDocs(getRecentDocs(currentUser?.id));
    }, [currentUser?.id]);

    // Modals & Form states
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [folderForm] = Form.useForm();
    const [editingFolder, setEditingFolder] = useState<IDocumentFolder | null>(null);
    const [parentFolderId, setParentFolderId] = useState<number | null>(null);

    const [docModalOpen, setDocModalOpen] = useState(false);
    const [docForm] = Form.useForm();
    const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);

    const [editDocModalOpen, setEditDocModalOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<IDocument | null>(null);
    const [editDocForm] = Form.useForm();

    const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
    const [selectedDocDetails, setSelectedDocDetails] = useState<IDocument | null>(null);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");

    // Read-only state
    const isReadOnly = !!selectedSubordinateId;
    const activeOwnerId = selectedSubordinateId || currentUser?.id;

    // React Query Hooks
    const { data: subordinates = [] } = useSubordinatesQuery(!!currentUser?.id);
    const { data: rawFolders = [], isLoading: loadingTree } = useFolderTreeQuery(activeOwnerId, !!activeOwnerId);
    const { data: documents = [], isLoading: loadingDocs } = useFolderDocumentsQuery(selectedFolderId ?? undefined, !!selectedFolderId);
    const { data: rawCategories = [] } = useDocumentCategoryActiveQuery();
    const { data: accountingCategories = [] } = useAccountingDocumentCategoryActiveQuery();

    const createFolderMutation = useCreateFolderMutation();
    const updateFolderMutation = useUpdateFolderMutation();
    const deleteFolderMutation = useDeleteFolderMutation();
    const createDocumentMutation = useCreateDocumentMutation();
    const updateDocumentMutation = useUpdateDocumentMutation();
    const deleteDocumentMutation = useDeleteDocumentMutation();
    const deleteDocumentShortcutMutation = useDeleteDocumentShortcutMutation();
    const uploadFileMutation = useUploadFileMutation();

    // Derived memoized states
    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const matchSearch =
                doc.documentName.toLowerCase().includes(searchText.toLowerCase()) ||
                doc.documentCode.toLowerCase().includes(searchText.toLowerCase());
            if (!matchSearch) return false;

            if (fileTypeFilter === "ALL") return true;
            const ext = doc.fileUrls?.[0]?.split(".").pop()?.toLowerCase() || "";
            if (fileTypeFilter === "PDF") return ext === "pdf";
            if (fileTypeFilter === "EXCEL") return ["xlsx", "xls", "csv"].includes(ext);
            if (fileTypeFilter === "IMAGE") return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
            if (fileTypeFilter === "DOC") return ["doc", "docx"].includes(ext);
            if (fileTypeFilter === "OTHER") {
                return !["pdf", "xlsx", "xls", "csv", "png", "jpg", "jpeg", "gif", "webp", "svg", "doc", "docx"].includes(ext);
            }
            return true;
        });
    }, [documents, searchText, fileTypeFilter]);

    const accountingSystemCategoryId = useMemo(() => {
        const cat = rawCategories.find((c: any) => c.categoryCode === ACCOUNTING_DOC_CATEGORY_CODE);
        return cat?.id;
    }, [rawCategories]);

    const categories = useMemo(() => {
        return rawCategories.filter(
            (c: any) =>
                !c.mappingProcedure &&
                !c.isCrossCompany &&
                c.categoryCode !== ACCOUNTING_DOC_CATEGORY_CODE
        );
    }, [rawCategories]);

    const yearOptions = useMemo(() => {
        const years = rawFolders
            .map((f) => f.folderName)
            .filter((name) => name.startsWith("Năm "))
            .map((name) => name.replace("Năm ", ""));
        return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
    }, [rawFolders]);

    const treeDataKeys = useMemo(() => {
        return rawFolders.map((f) => f.id!);
    }, [rawFolders]);

    const findFolderById = useCallback((folders: IDocumentFolder[], id: number): IDocumentFolder | null => {
        for (const f of folders) {
            if (f.id === id) return f;
            if (f.children && f.children.length > 0) {
                const found = findFolderById(f.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const selectedFolderNode = useMemo(() => {
        return selectedFolderId ? findFolderById(rawFolders, selectedFolderId) : null;
    }, [selectedFolderId, rawFolders, findFolderById]);

    const subfolders = useMemo(() => {
        return selectedFolderNode?.children || [];
    }, [selectedFolderNode]);

    // Initial default folder selection
    useEffect(() => {
        if (rawFolders.length > 0 && selectedFolderId === null) {
            const firstNode = rawFolders[0];
            setSelectedFolderId(firstNode.id!);
            setActiveFolderPath([{ id: firstNode.id!, folderName: firstNode.folderName }]);
        }
    }, [rawFolders, selectedFolderId]);

    // Reset selected rows on folder change
    useEffect(() => {
        setSelectedRowKeys([]);
    }, [selectedFolderId]);

    // Breadcrumb path update
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

    // Action handlers
    const handleSelectFolder = useCallback((selectedKeys: React.Key[]) => {
        if (selectedKeys.length > 0) {
            const folderId = Number(selectedKeys[0]);
            setSelectedFolderId(folderId);
            const path = findFolderPath(rawFolders, folderId);
            if (path) {
                setActiveFolderPath(path);
            }
        }
    }, [rawFolders]);

    const handleYearChange = useCallback((year: string) => {
        setSelectedYear(year);
        if (year === "ALL") {
            setExpandedKeys([]);
            return;
        }
        const matched = rawFolders.find((f) => f.folderName === `Năm ${year}`);
        if (matched) {
            setExpandedKeys([matched.id!]);
            setSelectedFolderId(matched.id!);
            setActiveFolderPath([{ id: matched.id!, folderName: matched.folderName }]);
        }
    }, [rawFolders]);

    const handleMoveDocument = useCallback(async (documentId: number, targetFolderId: number) => {
        if (selectedFolderId === targetFolderId) return;
        const docToMove = documents.find((d) => d.id === documentId);
        if (!docToMove) return;

        try {
            await updateDocumentMutation.mutateAsync({
                id: documentId,
                data: {
                    documentCode: docToMove.documentCode,
                    documentName: docToMove.documentName,
                    categoryId: docToMove.category?.id || 0,
                    folderId: targetFolderId,
                    note: docToMove.note,
                    fileUrls: docToMove.fileUrls,
                },
            });
            notify.success("Di chuyển tệp thành công.");
        } catch (err: any) {
            // error handled by mutation
        }
    }, [selectedFolderId, documents, updateDocumentMutation]);

    const handleFolderSubmit = useCallback(async (values: { folderName: string }) => {
        try {
            if (editingFolder) {
                await updateFolderMutation.mutateAsync({
                    id: editingFolder.id!,
                    data: {
                        folderName: values.folderName,
                        parentId: parentFolderId,
                    },
                });
            } else {
                await createFolderMutation.mutateAsync({
                    folderName: values.folderName,
                    parentId: parentFolderId,
                    ownerId: activeOwnerId,
                });
            }
            setFolderModalOpen(false);
        } catch (err: any) {
            // error handled by mutation
        }
    }, [editingFolder, parentFolderId, activeOwnerId, updateFolderMutation, createFolderMutation]);

    const handleDeleteFolder = useCallback(async (folderId: number) => {
        try {
            await deleteFolderMutation.mutateAsync(folderId);
            if (selectedFolderId === folderId) {
                setSelectedFolderId(null);
                setActiveFolderPath([]);
            }
        } catch (err: any) {
            // error handled by mutation
        }
    }, [deleteFolderMutation, selectedFolderId]);

    const customUploadRequest = useCallback(async (options: any) => {
        const { file, onSuccess, onError } = options;
        setUploading(true);
        const hideLoading = notify.loading(`Đang tải tệp "${file.name}" lên máy chủ.`);
        try {
            const fileName = await uploadFileMutation.mutateAsync({ file, folder: "documents" });
            if (fileName) {
                onSuccess(fileName);
                setUploadedFiles([
                    {
                        uid: "-1",
                        name: file.name,
                        status: "done",
                        url: `/api/v1/files?fileName=${encodeURIComponent(fileName)}&folder=documents`,
                        response: fileName,
                    },
                ]);

                const cleanName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
                docForm.setFieldsValue({
                    documentKind: DEFAULT_DOCUMENT_KIND,
                    documentName: cleanName,
                    documentCode: `PERS-${dayjs().format("YYYY")}-${dayjs().format("HHmmss")}`,
                    categoryId: categories.length > 0 ? categories[0].id : undefined,
                    accountingCategoryId: accountingCategories.length > 0 ? accountingCategories[0].id : undefined,
                    note: "",
                });
                hideLoading();
                notify.success(`Tải tệp "${file.name}" lên thành công.`);
                setDocModalOpen(true);
            } else {
                hideLoading();
                onError(new Error("Upload thất bại"));
            }
        } catch (err) {
            hideLoading();
            onError(err);
        } finally {
            setUploading(false);
        }
    }, [uploadFileMutation, docForm, categories, accountingCategories]);

    const handleDirectFileUpload = useCallback(async (file: File) => {
        if (!selectedFolderId) {
            notify.warning("Vui lòng chọn thư mục trước khi tải tệp lên.");
            return;
        }
        const isRoot = treeDataKeys.includes(selectedFolderId);
        if (isRoot) {
            notify.warning("Vui lòng chọn thư mục con để tải tệp lên.");
            return;
        }

        setUploading(true);
        const hideLoading = notify.loading(`Đang tải tệp "${file.name}" lên máy chủ.`);
        try {
            const fileName = await uploadFileMutation.mutateAsync({ file, folder: "documents" });
            if (fileName) {
                setUploadedFiles([
                    {
                        uid: "-1",
                        name: file.name,
                        status: "done",
                        url: `/api/v1/files?fileName=${encodeURIComponent(fileName)}&folder=documents`,
                        response: fileName,
                    },
                ]);

                const cleanName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
                docForm.setFieldsValue({
                    documentKind: DEFAULT_DOCUMENT_KIND,
                    documentName: cleanName,
                    documentCode: `PERS-${dayjs().format("YYYY")}-${dayjs().format("HHmmss")}`,
                    categoryId: categories.length > 0 ? categories[0].id : undefined,
                    accountingCategoryId: accountingCategories.length > 0 ? accountingCategories[0].id : undefined,
                    note: "",
                });
                hideLoading();
                notify.success(`Tải tệp "${file.name}" lên thành công.`);
                setDocModalOpen(true);
            } else {
                hideLoading();
            }
        } catch (err) {
            hideLoading();
        } finally {
            setUploading(false);
        }
    }, [selectedFolderId, treeDataKeys, uploadFileMutation, docForm, categories, accountingCategories]);

    const handleCreateDocumentSubmit = useCallback(async (values: any) => {
        if (uploadedFiles.length === 0 || !uploadedFiles[0].response) {
            notify.warning("Vui lòng tải lên tệp đính kèm trước.");
            return;
        }

        const isAccountingDoc = values.documentKind === "ACCOUNTING";

        if (isAccountingDoc && !accountingSystemCategoryId) {
            notify.error("Chưa cấu hình danh mục hệ thống ACCOUNTING_DOC cho chứng từ kế toán");
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
            status: isAccountingDoc ? "PENDING_ACCOUNTING_REVIEW" : "IN_PROGRESS",
        };

        try {
            await createDocumentMutation.mutateAsync(payload);
            setDocModalOpen(false);
            docForm.resetFields();
            setUploadedFiles([]);
        } catch (err: any) {
            // error handled in mutation
        }
    }, [uploadedFiles, accountingSystemCategoryId, selectedFolderId, createDocumentMutation, docForm]);

    const handleEditDocumentSubmit = useCallback(async (values: any) => {
        if (!editingDoc || !editingDoc.id) return;
        try {
            await updateDocumentMutation.mutateAsync({
                id: editingDoc.id,
                data: {
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
                },
            });
            setEditDocModalOpen(false);
            setEditingDoc(null);
        } catch (err: any) {
            // error handled in mutation
        }
    }, [editingDoc, selectedFolderId, updateDocumentMutation]);

    const handleDeleteDoc = useCallback(async (record: IDocument) => {
        try {
            if (record.isShortcut) {
                await deleteDocumentShortcutMutation.mutateAsync({ documentId: record.id!, folderId: selectedFolderId! });
            } else {
                await deleteDocumentMutation.mutateAsync(record.id!);
            }
        } catch (err: any) {
            // error handled in mutation
        }
    }, [deleteDocumentShortcutMutation, deleteDocumentMutation, selectedFolderId]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedRowKeys.length === 0) return;
        const keysToDelete = [...selectedRowKeys];
        Modal.confirm({
            title: "Xác nhận xóa hàng loạt",
            content: `Bạn có chắc chắn muốn xóa ${keysToDelete.length} tài liệu đã chọn?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    for (const key of keysToDelete) {
                        const doc = documents.find((d) => d.id === Number(key));
                        if (doc) {
                            if (doc.isShortcut) {
                                await deleteDocumentShortcutMutation.mutateAsync({ documentId: doc.id!, folderId: selectedFolderId! });
                            } else {
                                await deleteDocumentMutation.mutateAsync(doc.id!);
                            }
                        }
                    }
                    setSelectedRowKeys([]);
                } catch (err: any) {
                    // handled
                }
            },
        });
    }, [selectedRowKeys, documents, deleteDocumentShortcutMutation, deleteDocumentMutation, selectedFolderId]);

    const handleReload = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["folder-documents"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["folder-tree"], exact: false });
    }, [queryClient]);

    return {
        currentUser,
        isAdmin,
        isReadOnly,
        activeOwnerId,
        subordinates,
        selectedSubordinateId,
        setSelectedSubordinateId,
        selectedEmployeeName,
        setSelectedEmployeeName,
        openEmployeeModal,
        setOpenEmployeeModal,
        rawFolders,
        loadingTree,
        expandedKeys,
        setExpandedKeys,
        selectedFolderId,
        setSelectedFolderId,
        activeFolderPath,
        setActiveFolderPath,
        selectedYear,
        yearOptions,
        treeDataKeys,
        subfolders,
        documents,
        loadingDocs,
        filteredDocuments,
        viewMode,
        setViewMode,
        searchText,
        setSearchText,
        fileTypeFilter,
        setFileTypeFilter,
        selectedRowKeys,
        setSelectedRowKeys,
        recentDocs,
        handleRecordAccess,
        handleBulkDelete,
        dragActive,
        setDragActive,
        dragCounter,
        categories,
        accountingCategories,
        accountingSystemCategoryId,
        folderModalOpen,
        setFolderModalOpen,
        folderForm,
        editingFolder,
        setEditingFolder,
        parentFolderId,
        setParentFolderId,
        docModalOpen,
        setDocModalOpen,
        docForm,
        uploadedFiles,
        setUploadedFiles,
        uploading,
        editDocModalOpen,
        setEditDocModalOpen,
        editingDoc,
        setEditingDoc,
        editDocForm,
        detailsDrawerOpen,
        setDetailsDrawerOpen,
        selectedDocDetails,
        setSelectedDocDetails,
        previewOpen,
        setPreviewOpen,
        previewUrl,
        setPreviewUrl,
        previewTitle,
        setPreviewTitle,
        handleSelectFolder,
        handleYearChange,
        handleMoveDocument,
        handleFolderSubmit,
        handleDeleteFolder,
        customUploadRequest,
        handleDirectFileUpload,
        handleCreateDocumentSubmit,
        handleEditDocumentSubmit,
        handleDeleteDoc,
        handleReload,
    };
};
