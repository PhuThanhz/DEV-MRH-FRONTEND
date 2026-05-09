/* ===================== PROCESS ACTION VIEW ===================== */

import { Modal, Descriptions, Badge, Spin } from "antd";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import type { IProcessAction } from "@/types/backend";
import { useProcessActionByIdQuery } from "@/hooks/useProcessActions";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IProcessAction | null;
    setDataInit: (v: IProcessAction | null) => void;
}

const renderDefinition = (text?: string | null) => {
    if (!text) return "--";

    const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length <= 1) return text;

    return (
        <ul style={{ margin: 0, paddingLeft: 16, listStyle: "none" }}>
            {lines.map((line, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                    {line.startsWith("-") ? line : `- ${line}`}
                </li>
            ))}
        </ul>
    );
};

const ViewProcessAction = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    // ← Fetch chi tiết khi modal mở và có id
    const { data: detail, isLoading } = useProcessActionByIdQuery(
        open && dataInit?.id ? dataInit.id : null
    );

    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    return (
        <Modal
            title="Chi tiết Process Action"
            open={open}
            onCancel={handleClose}
            footer={null}
            width={isMobile ? "95vw" : "50vw"}
            centered
        >
            <Spin spinning={isLoading}>
                <Descriptions
                    bordered
                    column={isMobile ? 1 : 2}
                    layout="vertical"
                    size={isMobile ? "small" : "middle"}
                >
                    <Descriptions.Item label="Mã hành động">
                        {detail?.code || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Đầu mục">
                        {detail?.name || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Giải thích tên đầu mục" span={isMobile ? 1 : 2}>
                        {detail?.shortDescription || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Định nghĩa" span={isMobile ? 1 : 2}>
                        {renderDefinition(detail?.description)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {detail?.active ? (
                            <Badge status="success" text="Hoạt động" />
                        ) : (
                            <Badge status="error" text="Ngừng hoạt động" />
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {detail?.createdAt
                            ? dayjs(detail.createdAt).format("DD-MM-YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật" span={isMobile ? 1 : 2}>
                        {detail?.updatedAt
                            ? dayjs(detail.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </Modal>
    );
};

export default ViewProcessAction;