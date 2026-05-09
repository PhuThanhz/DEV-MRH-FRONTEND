import { Descriptions, Drawer, Tag, Badge, Space } from "antd";
import dayjs from "dayjs";

import type { IDocument } from "@/types/backend";

interface Props {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IDocument | null;
    setDataInit: (v: IDocument | null) => void;
}

const PROCEDURE_TYPE_LABEL: Record<string, string> = {
    COMPANY: "Công ty",
    DEPARTMENT: "Phòng ban",
    CONFIDENTIAL: "Bảo mật",
};

const STATUS_COLOR: Record<string, string> = {
    NEED_CREATE: "default",
    IN_PROGRESS: "processing",
    NEED_UPDATE: "warning",
    TERMINATED: "error",
};

const STATUS_LABEL: Record<string, string> = {
    NEED_CREATE: "Cần tạo",
    IN_PROGRESS: "Đang hiệu lực",
    NEED_UPDATE: "Cần cập nhật",
    TERMINATED: "Đã huỷ",
};

const ViewDetailDocument = ({ open, onClose, dataInit, setDataInit }: Props) => {
    return (
        <Drawer
            title="Chi tiết văn bản"
            open={open}
            onClose={() => {
                onClose(false);
                setDataInit(null);
            }}
            width={760}
        >
            {dataInit && (
                <Descriptions
                    column={2}
                    bordered
                    size="small"
                    labelStyle={{ width: 140 }}
                >
                    <Descriptions.Item label="Mã văn bản">
                        <Tag color="blue">{dataInit.documentCode}</Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên văn bản" span={2}>
                        {dataInit.documentName}
                    </Descriptions.Item>

                    <Descriptions.Item label="Loại văn bản">
                        {dataInit.category ? (
                            <Tag color="purple">
                                {dataInit.category.categoryName}
                            </Tag>
                        ) : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ký hiệu">
                        {dataInit.category?.symbol ? (
                            <Tag>{dataInit.category.symbol}</Tag>
                        ) : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Phòng ban">
                        {dataInit.department?.name || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Bộ phận">
                        {dataInit.section?.name || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {dataInit.status ? (
                            <Tag color={STATUS_COLOR[dataInit.status] || "default"}>
                                {STATUS_LABEL[dataInit.status] || dataInit.status}
                            </Tag>
                        ) : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Kế hoạch năm">
                        {dataInit.planYear || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày ban hành">
                        {dataInit.issuedDate
                            ? dayjs(dataInit.issuedDate).format("DD/MM/YYYY")
                            : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Kích hoạt">
                        {dataInit.active ? (
                            <Badge status="success" text="Hoạt động" />
                        ) : (
                            <Badge status="error" text="Tắt" />
                        )}
                    </Descriptions.Item>

                    {dataInit.category?.mappingProcedure && (
                        <>
                            <Descriptions.Item label="Loại quy trình">
                                <Tag color="geekblue">
                                    {PROCEDURE_TYPE_LABEL[dataInit.procedureType || ""] ||
                                        dataInit.procedureType || "—"}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="ID quy trình">
                                {dataInit.procedureId || "—"}
                            </Descriptions.Item>
                        </>
                    )}

                    {/* ← THÊM: hiển thị danh sách người được xem khi không mapping procedure */}
                    {!dataInit.category?.mappingProcedure && (
                        <Descriptions.Item label="Người được xem" span={2}>
                            {dataInit.userIds && dataInit.userIds.length > 0 ? (
                                <Space size={4} wrap>
                                    {dataInit.userIds.map((uid) => (
                                        <Tag key={uid} color="cyan">{uid}</Tag>
                                    ))}
                                </Space>
                            ) : "—"}
                        </Descriptions.Item>
                    )}

                    <Descriptions.Item label="Ghi chú" span={2}>
                        {dataInit.note || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dataInit.createdAt
                            ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm")
                            : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {dataInit.createdBy || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {dataInit.updatedAt
                            ? dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm")
                            : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {dataInit.updatedBy || "—"}
                    </Descriptions.Item>
                </Descriptions>
            )}
        </Drawer>
    );
};

export default ViewDetailDocument;