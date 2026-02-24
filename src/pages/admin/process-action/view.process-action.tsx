/* ===================== PROCESS ACTION VIEW ===================== */

import { Modal, Descriptions, Badge } from "antd";
import dayjs from "dayjs";
import type { IProcessAction } from "@/types/backend";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IProcessAction | null;
    setDataInit: (v: IProcessAction | null) => void;
}

const ViewProcessAction = ({
    open,
    onClose,
    dataInit,
    setDataInit,
}: IProps) => {
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
            width="50vw"
            centered
        >
            <Descriptions bordered column={2} layout="vertical">
                <Descriptions.Item label="Mã hành động">
                    {dataInit?.code || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Tên hành động">
                    {dataInit?.name || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Mô tả ngắn">
                    {dataInit?.shortDescription || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Mô tả chi tiết">
                    {dataInit?.description || "--"}
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

                <Descriptions.Item label="Ngày cập nhật">
                    {dataInit?.updatedAt
                        ? dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                        : "--"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ViewProcessAction;
