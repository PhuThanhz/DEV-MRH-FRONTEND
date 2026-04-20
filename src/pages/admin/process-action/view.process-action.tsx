/* ===================== PROCESS ACTION VIEW ===================== */

import { Modal, Descriptions, Badge } from "antd";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import type { IProcessAction } from "@/types/backend";

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
            <Descriptions
                bordered
                column={isMobile ? 1 : 2}
                layout="vertical"
                size={isMobile ? "small" : "middle"}
            >
                <Descriptions.Item label="Mã hành động">
                    {dataInit?.code || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Đầu mục">
                    {dataInit?.name || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Giải thích tên đầu mục" span={isMobile ? 1 : 2}>
                    {dataInit?.shortDescription || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Định nghĩa" span={isMobile ? 1 : 2}>
                    {renderDefinition(dataInit?.description)}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                    {dataInit?.active ? (
                        <Badge status="success" text="Hoạt động" />
                    ) : (
                        <Badge status="error" text="Ngừng hoạt động" />
                    )}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày tạo">
                    {dataInit?.createdAt
                        ? dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm:ss")
                        : "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày cập nhật" span={isMobile ? 1 : 2}>
                    {dataInit?.updatedAt
                        ? dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                        : "--"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ViewProcessAction;