import React from "react";
import { Breadcrumb, Space, Input, Select, Radio, Tooltip, Button } from "antd";
import {
    HomeOutlined,
    SearchOutlined,
    BarsOutlined,
    AppstoreOutlined,
    ReloadOutlined,
    DeleteOutlined,
} from "@ant-design/icons";

interface DocumentToolbarProps {
    activeFolderPath: { id: number; folderName: string }[];
    searchText: string;
    onSearchChange: (val: string) => void;
    fileTypeFilter: string;
    onFileTypeFilterChange: (val: string) => void;
    selectedCount: number;
    onBulkDelete: () => void;
    isReadOnly: boolean;
    viewMode: "table" | "grid";
    onViewModeChange: (mode: "table" | "grid") => void;
    onReload: () => void;
    onSelectFolder: (id: number) => void;
    onExpandFolderKey: (idStr: string) => void;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
    activeFolderPath,
    searchText,
    onSearchChange,
    fileTypeFilter,
    onFileTypeFilterChange,
    selectedCount,
    onBulkDelete,
    isReadOnly,
    viewMode,
    onViewModeChange,
    onReload,
    onSelectFolder,
    onExpandFolderKey,
}) => {
    const breadcrumbItems = [
        {
            title: (
                <Space size={4}>
                    <HomeOutlined style={{ color: "#db2777", fontSize: 14 }} />
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Kho lưu trữ</span>
                </Space>
            ),
        },
        ...activeFolderPath.map((folder, idx) => {
            const isLast = idx === activeFolderPath.length - 1;
            return {
                title: isLast ? (
                    <span style={{ color: "#0f172a", fontWeight: 600 }}>{folder.folderName}</span>
                ) : (
                    <span
                        className="breadcrumb-link"
                        style={{ color: "#475569", cursor: "pointer", fontWeight: 500, transition: "color 0.2s" }}
                        onClick={() => {
                            onSelectFolder(folder.id);
                            onExpandFolderKey(folder.id.toString());
                        }}
                    >
                        {folder.folderName}
                    </span>
                ),
            };
        }),
    ];

    return (
        <>
            <Breadcrumb
                className="drive-breadcrumb"
                separator={<span style={{ color: "#cbd5e1" }}>/</span>}
                items={breadcrumbItems}
            />

            <div className="drive-header-section">
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        Hồ sơ tài liệu
                    </h2>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                        Quản lý và lưu trữ tài liệu trong thư mục này
                    </div>
                </div>
                <Space size={10} wrap>
                    {selectedCount > 0 && !isReadOnly && (
                        <Button
                            danger
                            type="primary"
                            icon={<DeleteOutlined />}
                            onClick={onBulkDelete}
                            style={{ height: 38, borderRadius: 6 }}
                        >
                            Xóa ({selectedCount})
                        </Button>
                    )}
                    <Input
                        placeholder="Tìm tài liệu..."
                        prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                        value={searchText}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{ width: 180, borderRadius: 6, height: 38 }}
                        allowClear
                    />
                    <Select
                        value={fileTypeFilter}
                        onChange={onFileTypeFilterChange}
                        style={{ width: 140, height: 38 }}
                        options={[
                            { label: "Tất cả loại tệp", value: "ALL" },
                            { label: "Tệp PDF", value: "PDF" },
                            { label: "Tệp Excel", value: "EXCEL" },
                            { label: "Hình ảnh", value: "IMAGE" },
                            { label: "Văn bản Word", value: "DOC" },
                            { label: "Loại khác", value: "OTHER" },
                        ]}
                    />
                    <Radio.Group
                        value={viewMode}
                        onChange={(e) => onViewModeChange(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="table"><BarsOutlined /></Radio.Button>
                        <Radio.Button value="grid"><AppstoreOutlined /></Radio.Button>
                    </Radio.Group>
                    <Tooltip title="Làm mới dữ liệu">
                        <Button
                            icon={<ReloadOutlined style={{ color: "#64748b" }} />}
                            onClick={onReload}
                            style={{ height: 38, borderRadius: 6, border: "1px solid #e2e8f0" }}
                        />
                    </Tooltip>
                </Space>
            </div>
        </>
    );
};

export default React.memo(DocumentToolbar);
