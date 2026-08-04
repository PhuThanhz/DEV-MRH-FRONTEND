import React from "react";
import { Layout, Row, Col } from "antd";
import PageContainer from "@/components/common/data-table/PageContainer";
import { CloudUploadOutlined } from "@ant-design/icons";
import { usePersonalDriveState } from "./hooks/usePersonalDriveState";
import FolderTreeSider from "./components/FolderTreeSider";
import DocumentToolbar from "./components/DocumentToolbar";
import DocumentTable from "./components/DocumentTable";
import DocumentGrid from "./components/DocumentGrid";
import FolderCard from "./components/FolderCard";
import EmptyState from "./components/EmptyState";
import FolderModal from "./modals/FolderModal";
import DocumentFormModal from "./modals/DocumentFormModal";
import DocumentEditModal from "./modals/DocumentEditModal";
import DocumentPreviewModal from "./modals/DocumentPreviewModal";
import DocumentDetailsDrawer from "./DocumentDetailsDrawer";
import ModalSelectEmployee from "./ModalSelectEmployee";
import { buildDocumentFileUrl } from "./utils";
import type { IDocument, IDocumentFolder } from "@/types/backend";

const { Content } = Layout;

const PersonalDrivePage: React.FC = () => {
    const drive = usePersonalDriveState();

    return (
        <PageContainer title="Kho lưu trữ tài liệu cá nhân">
            <style>{`
                .personal-drive-layout {
                    --pd-primary: #db2777;
                    --pd-primary-hover: #be185d;
                    --pd-primary-soft: #fdf2f8;
                    --pd-primary-border: #fbcfe8;
                    --pd-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    background: transparent;
                    margin-top: 10px;
                }
                .drive-sider {
                    background: #ffffff !important;
                    border-radius: 8px;
                    padding: 20px 12px;
                    box-shadow: var(--pd-shadow);
                    border: 1px solid #e2e8f0;
                    margin-right: 20px;
                }
                .drive-content {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 24px;
                    min-height: 600px;
                    box-shadow: var(--pd-shadow);
                    border: 1px solid #e2e8f0;
                    position: relative;
                }
                .subordinate-selector-wrapper {
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px dashed #e2e8f0;
                }
                .sider-header {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 700;
                    color: #64748b;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 8px;
                }
                .ant-tree { background: transparent !important; }
                .ant-tree-node-content-wrapper:hover { background: var(--pd-primary-soft) !important; }
                .ant-tree-node-selected { background: var(--pd-primary-soft) !important; color: var(--pd-primary-hover) !important; font-weight: 600 !important; }
                .folder-actions { opacity: 0; transition: opacity 0.2s ease; }
                .ant-tree-treenode:hover .folder-actions { opacity: 1; }
                .drive-breadcrumb { background: transparent; padding: 0; margin-bottom: 20px; border: none; }
                .drive-header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
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
                    border-radius: 6px !important; 
                    margin-bottom: 2px !important; 
                    transition: all 0.2s ease; 
                }
                .ant-tree-switcher { line-height: 32px !important; }
                .grid-document-card { transition: all 0.2s ease; }
                .grid-document-card:hover { transform: translateY(-2px); box-shadow: var(--pd-shadow); }

                /* Custom style for "+ Mới" button */
                .btn-google-new {
                    transition: all 0.2s ease-in-out !important;
                }
                .btn-google-new:hover, .btn-google-new:focus, .btn-google-new:active, .btn-google-new:focus-visible {
                    background: var(--pd-primary-soft) !important;
                    border-color: var(--pd-primary-border) !important;
                    color: var(--pd-primary) !important;
                    box-shadow: var(--pd-shadow) !important;
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
                    border-radius: 6px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    height: 36px !important;
                }
                .ant-radio-button-wrapper {
                    background: transparent !important;
                    border: none !important;
                    color: #64748b !important;
                    border-radius: 4px !important;
                    height: 30px !important;
                    line-height: 30px !important;
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
                    display: none !important;
                }
                .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
                    background: #ffffff !important;
                    color: var(--pd-primary) !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
                }
                .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover {
                    color: var(--pd-primary-hover) !important;
                }
                .ant-btn-primary {
                    background: var(--pd-primary) !important;
                    border-color: var(--pd-primary) !important;
                    border-radius: 6px !important;
                }
                .ant-btn-primary:hover, .ant-btn-primary:focus {
                    background: var(--pd-primary-hover) !important;
                    border-color: var(--pd-primary-hover) !important;
                }
                .ant-pagination-item,
                .ant-pagination-prev,
                .ant-pagination-next {
                    margin-right: 6px !important;
                    border-radius: 6px !important;
                }
                .ant-pagination-item-active {
                    border-color: var(--pd-primary) !important;
                }
                .ant-pagination-item-active a {
                    color: var(--pd-primary) !important;
                }
                .ant-pagination-item:hover {
                    border-color: var(--pd-primary) !important;
                }
                .ant-pagination-item:hover a {
                    color: var(--pd-primary) !important;
                }
                .ant-pagination-next:hover .ant-pagination-item-link,
                .ant-pagination-prev:hover .ant-pagination-item-link {
                    color: var(--pd-primary) !important;
                    border-color: var(--pd-primary) !important;
                }
                .ant-select-single.ant-select-open .ant-select-selection-item {
                    color: var(--pd-primary) !important;
                }
                .ant-select:hover .ant-select-selector {
                    border-color: var(--pd-primary) !important;
                }
                .ant-select-focused .ant-select-selector {
                    border-color: var(--pd-primary) !important;
                    box-shadow: 0 0 0 2px rgba(219, 39, 119, 0.1) !important;
                }
                .ant-input:hover, .ant-input:focus, .ant-input-focused {
                    border-color: var(--pd-primary) !important;
                    box-shadow: 0 0 0 2px rgba(219, 39, 119, 0.1) !important;
                }
                .ant-form-item-has-error .ant-input:focus,
                .ant-form-item-has-error .ant-input-focused {
                    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1) !important;
                }

                .ant-select-selection-item, 
                .ant-select-selection-item span,
                .ant-select-selection-item .anticon {
                    color: #334155 !important;
                }
                .breadcrumb-link:hover {
                    color: var(--pd-primary) !important;
                    text-decoration: underline;
                }
            `}</style>

            <Layout className="personal-drive-layout">
                <FolderTreeSider
                    subordinates={drive.subordinates}
                    isAdmin={drive.isAdmin}
                    isReadOnly={drive.isReadOnly}
                    selectedSubordinateId={drive.selectedSubordinateId}
                    selectedEmployeeName={drive.selectedEmployeeName}
                    onOpenEmployeeModal={() => drive.setOpenEmployeeModal(true)}
                    onResetSubordinate={() => {
                        drive.setSelectedSubordinateId(undefined);
                        drive.setSelectedEmployeeName("");
                        drive.setSelectedFolderId(null);
                        drive.setActiveFolderPath([]);
                    }}
                    uploading={drive.uploading}
                    selectedFolderId={drive.selectedFolderId}
                    treeDataKeys={drive.treeDataKeys}
                    customUploadRequest={drive.customUploadRequest}
                    onOpenFolderModalForCreate={(parentId) => {
                        drive.setEditingFolder(null);
                        drive.setParentFolderId(parentId);
                        drive.folderForm.setFieldsValue({ folderName: "" });
                        drive.setFolderModalOpen(true);
                    }}
                    onOpenFolderModalForEdit={(folder) => {
                        drive.setEditingFolder(folder);
                        drive.setParentFolderId(folder.parentId || null);
                        drive.folderForm.setFieldsValue({ folderName: folder.folderName });
                        drive.setFolderModalOpen(true);
                    }}
                    onDeleteFolder={drive.handleDeleteFolder}
                    onMoveDocument={drive.handleMoveDocument}
                    selectedYear={drive.selectedYear}
                    onYearChange={drive.handleYearChange}
                    yearOptions={drive.yearOptions}
                    rawFolders={drive.rawFolders}
                    loadingTree={drive.loadingTree}
                    expandedKeys={drive.expandedKeys}
                    onExpandKeys={drive.setExpandedKeys}
                    onSelectFolder={drive.handleSelectFolder}
                />

                <Content
                    className="drive-content"
                    style={{ position: "relative" }}
                    onDragEnter={(e) => {
                        if (drive.isReadOnly) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.types.includes("Files")) {
                            drive.dragCounter.current++;
                            if (!drive.dragActive) {
                                drive.setDragActive(true);
                            }
                        }
                    }}
                    onDragOver={(e) => {
                        if (drive.isReadOnly) return;
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDragLeave={(e) => {
                        if (drive.isReadOnly) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.types.includes("Files")) {
                            drive.dragCounter.current--;
                            if (drive.dragCounter.current <= 0) {
                                drive.dragCounter.current = 0;
                                drive.setDragActive(false);
                            }
                        }
                    }}
                    onDrop={async (e) => {
                        if (drive.isReadOnly) return;
                        e.preventDefault();
                        e.stopPropagation();
                        drive.dragCounter.current = 0;
                        drive.setDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            const file = e.dataTransfer.files[0];
                            await drive.handleDirectFileUpload(file);
                        }
                    }}
                >
                    {drive.dragActive && (
                        <div
                            style={{
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
                                pointerEvents: "none",
                            }}
                        >
                            <CloudUploadOutlined style={{ fontSize: 64, color: "#db2777", marginBottom: 16 }} />
                            <span style={{ fontSize: 18, fontWeight: 600, color: "#db2777" }}>
                                Thả file vào đây để tải lên thư mục hiện tại
                            </span>
                        </div>
                    )}

                    {drive.selectedFolderId ? (
                        <div>
                            <DocumentToolbar
                                activeFolderPath={drive.activeFolderPath}
                                searchText={drive.searchText}
                                onSearchChange={drive.setSearchText}
                                fileTypeFilter={drive.fileTypeFilter}
                                onFileTypeFilterChange={drive.setFileTypeFilter}
                                selectedCount={drive.selectedRowKeys.length}
                                onBulkDelete={drive.handleBulkDelete}
                                isReadOnly={drive.isReadOnly}
                                viewMode={drive.viewMode}
                                onViewModeChange={drive.setViewMode}
                                onReload={drive.handleReload}
                                onSelectFolder={(id) => {
                                    drive.setSelectedFolderId(id);
                                }}
                                onExpandFolderKey={(idStr) => {
                                    drive.setExpandedKeys((prev) => [...new Set([...prev, idStr])]);
                                }}
                            />

                            {drive.recentDocs.length > 0 && (
                                <div style={{ marginBottom: 24, padding: "16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 12 }}>
                                        TRUY CẬP GẦN ĐÂY
                                    </div>
                                    <Row gutter={[12, 12]}>
                                        {drive.recentDocs.map((doc) => (
                                            <Col xs={24} sm={12} md={8} lg={4} key={`recent-${doc.id}`}>
                                                <div
                                                    style={{
                                                        padding: "10px 12px",
                                                        background: "#ffffff",
                                                        borderRadius: 6,
                                                        border: "1px solid #cbd5e1",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        overflow: "hidden",
                                                    }}
                                                    onClick={() => {
                                                        drive.handleRecordAccess(doc);
                                                        drive.setSelectedDocDetails(doc);
                                                        drive.setDetailsDrawerOpen(true);
                                                    }}
                                                >
                                                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {doc.documentName}
                                                    </span>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}

                            {drive.subfolders.length > 0 && (
                                <div style={{ marginBottom: 32 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>
                                        Thư mục
                                    </div>
                                    <Row gutter={[16, 16]}>
                                        {drive.subfolders.map((f: IDocumentFolder) => (
                                            <Col xs={24} sm={12} md={8} lg={6} key={f.id}>
                                                <FolderCard
                                                    folder={f}
                                                    onClick={(id) => {
                                                        drive.setSelectedFolderId(id);
                                                        drive.setExpandedKeys((prev) => [...new Set([...prev, id.toString()])]);
                                                    }}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}

                            {drive.viewMode === "table" ? (
                                <DocumentTable
                                    loading={drive.loadingDocs}
                                    documents={drive.filteredDocuments}
                                    isReadOnly={drive.isReadOnly}
                                    selectedRowKeys={drive.selectedRowKeys}
                                    onSelectRowKeys={drive.setSelectedRowKeys}
                                    onViewDetails={(doc) => {
                                        drive.handleRecordAccess(doc);
                                        drive.setSelectedDocDetails(doc);
                                        drive.setDetailsDrawerOpen(true);
                                    }}
                                    onEditDoc={(doc) => {
                                        drive.setEditingDoc(doc);
                                        drive.editDocForm.setFieldsValue({
                                            documentName: doc.documentName,
                                            documentCode: doc.documentCode,
                                            categoryId: doc.category?.id,
                                            accountingCategoryId: doc.accountingCategory?.id,
                                            note: doc.note,
                                        });
                                        drive.setEditDocModalOpen(true);
                                    }}
                                    onDeleteDoc={drive.handleDeleteDoc}
                                />
                            ) : (
                                <DocumentGrid
                                    loading={drive.loadingDocs}
                                    documents={drive.filteredDocuments}
                                    isReadOnly={drive.isReadOnly}
                                    selectedRowKeys={drive.selectedRowKeys}
                                    onSelectRowKeys={drive.setSelectedRowKeys}
                                    onCardClick={(doc: IDocument) => {
                                        drive.handleRecordAccess(doc);
                                        const firstFile = doc.fileUrls?.[0] || "";
                                        drive.setPreviewUrl(firstFile ? buildDocumentFileUrl(firstFile, true) : "");
                                        drive.setPreviewTitle(doc.documentName);
                                        drive.setPreviewOpen(true);
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        <EmptyState type="no-folder-selected" />
                    )}
                </Content>
            </Layout>

            <FolderModal
                open={drive.folderModalOpen}
                editingFolder={drive.editingFolder}
                parentFolderId={drive.parentFolderId}
                onCancel={() => drive.setFolderModalOpen(false)}
                onSubmit={drive.handleFolderSubmit}
            />

            <DocumentFormModal
                open={drive.docModalOpen}
                form={drive.docForm}
                categories={drive.categories}
                accountingCategories={drive.accountingCategories}
                uploadedFiles={drive.uploadedFiles}
                onCancel={() => {
                    drive.setDocModalOpen(false);
                    drive.setUploadedFiles([]);
                }}
                onSubmit={drive.handleCreateDocumentSubmit}
            />

            <DocumentEditModal
                open={drive.editDocModalOpen}
                editingDoc={drive.editingDoc}
                categories={drive.categories}
                accountingCategories={drive.accountingCategories}
                onCancel={() => {
                    drive.setEditDocModalOpen(false);
                    drive.setEditingDoc(null);
                }}
                onSubmit={drive.handleEditDocumentSubmit}
            />

            <DocumentPreviewModal
                open={drive.previewOpen}
                previewTitle={drive.previewTitle}
                previewUrl={drive.previewUrl}
                onCancel={() => drive.setPreviewOpen(false)}
            />

            <DocumentDetailsDrawer
                open={drive.detailsDrawerOpen}
                selectedDocDetails={drive.selectedDocDetails}
                onClose={() => drive.setDetailsDrawerOpen(false)}
                onPreview={(url, title) => {
                    drive.setPreviewUrl(url);
                    drive.setPreviewTitle(title);
                    drive.setPreviewOpen(true);
                }}
            />

            <ModalSelectEmployee
                open={drive.openEmployeeModal}
                onClose={() => drive.setOpenEmployeeModal(false)}
                isAdmin={drive.isAdmin}
                currentSelectedId={drive.selectedSubordinateId}
                onSelectEmployee={(id, name) => {
                    if (id) {
                        drive.setSelectedSubordinateId(id);
                        drive.setSelectedEmployeeName(name);
                    } else {
                        drive.setSelectedSubordinateId(undefined);
                        drive.setSelectedEmployeeName("");
                    }
                    drive.setSelectedFolderId(null);
                    drive.setActiveFolderPath([]);
                }}
            />
        </PageContainer>
    );
};

export default PersonalDrivePage;
