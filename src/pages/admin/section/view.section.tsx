// ViewDetailSection.tsx

import { Badge, Descriptions, Modal } from "antd";
import dayjs from "dayjs";
import type { ISection } from "@/types/backend";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: ISection | null;
    setDataInit: (v: any) => void;
}

const ViewDetailSection = ({
    open,
    onClose,
    dataInit,
    setDataInit,
}: IProps) => {

    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    if (!dataInit) return null;

    return (
        <Modal
            title="Chi tiết bộ phận"
            open={open}
            onCancel={handleClose}
            footer={null}
            width="60vw"
            centered
            destroyOnClose
        >
            <Descriptions
                bordered
                size="middle"
                column={2}
                layout="vertical"
                labelStyle={{
                    fontWeight: 600,
                    background: "#fafafa",
                }}
                contentStyle={{
                    fontSize: 14,
                }}
            >
                <Descriptions.Item label="Mã bộ phận">
                    {dataInit.code || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Tên bộ phận">
                    {dataInit.name || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Phòng ban">
                    {dataInit.department?.name || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                    {dataInit.active ? (
                        <Badge status="success" text="Hoạt động" />
                    ) : (
                        <Badge status="error" text="Vô hiệu hóa" />
                    )}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày tạo">
                    {dataInit.createdAt
                        ? dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm:ss")
                        : "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày cập nhật">
                    {dataInit.updatedAt
                        ? dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                        : "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Người tạo">
                    {dataInit.createdBy || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Người cập nhật">
                    {dataInit.updatedBy || "--"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ViewDetailSection;