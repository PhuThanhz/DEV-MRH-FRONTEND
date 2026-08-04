import React from "react";
import { FolderFilled } from "@ant-design/icons";
import type { IDocumentFolder } from "@/types/backend";

interface FolderCardProps {
    folder: IDocumentFolder;
    onClick: (id: number) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, onClick }) => {
    return (
        <div
            className="grid-document-card"
            style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                border: "1px solid #e2e8f0",
            }}
            onClick={() => onClick(folder.id!)}
        >
            <FolderFilled style={{ fontSize: 24, color: "#fbbf24", marginRight: 12 }} />
            <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                    style={{
                        fontWeight: 600,
                        fontSize: 14,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#334155",
                    }}
                >
                    {folder.folderName}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {folder.documentCount || 0} tài liệu
                </div>
            </div>
        </div>
    );
};

export default React.memo(FolderCard);
