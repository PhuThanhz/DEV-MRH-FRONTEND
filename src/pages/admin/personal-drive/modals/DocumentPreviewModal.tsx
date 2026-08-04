import React from "react";
import { Modal } from "antd";
import { getModalWidth } from "@/utils/responsive";

interface DocumentPreviewModalProps {
    open: boolean;
    previewTitle: string;
    previewUrl: string;
    onCancel: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    open,
    previewTitle,
    previewUrl,
    onCancel,
}) => {
    const isPdf = previewUrl.toLowerCase().endsWith(".pdf");

    return (
        <Modal
            title={previewTitle}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={getModalWidth(850)}
            styles={{ body: { height: "min(600px, 80vh)", padding: 0 } }}
            destroyOnHidden
        >
            {isPdf ? (
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
    );
};

export default React.memo(DocumentPreviewModal);
