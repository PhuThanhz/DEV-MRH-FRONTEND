// ViewDepartment.tsx

import { Modal, Descriptions, Badge } from "antd";
import dayjs from "dayjs";

import type { IDepartment } from "@/types/backend";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IDepartment | null;
    setDataInit: (v: any) => void;
}

const ViewDepartment = ({
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
            title="Chi tiết phòng ban"
            open={open}
            onCancel={handleClose}
            footer={null}
            width="70vw"
            centered
            destroyOnClose
        >
            <Descriptions
                bordered
                column={2}
                size="middle"
                layout="vertical"
                labelStyle={{
                    fontWeight: 600,
                    color: "#595959",
                    background: "#fafafa",
                }}
                contentStyle={{
                    fontSize: 14,
                    color: "#262626",
                }}
            >
                <Descriptions.Item label="Mã phòng ban">
                    {dataInit?.code || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Tên phòng ban">
                    {dataInit?.name || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Tên tiếng Anh">
                    {dataInit?.englishName || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Công ty">
                    {dataInit?.company?.name || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                    {dataInit?.status === 1 ? (
                        <Badge status="success" text="Hoạt động" />
                    ) : (
                        <Badge status="error" text="Ngừng hoạt động" />
                    )}
                </Descriptions.Item>

                <Descriptions.Item label="Người tạo">
                    {dataInit?.createdBy || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày tạo">
                    {dataInit?.createdAt
                        ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm:ss")
                        : "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày cập nhật">
                    {dataInit?.updatedAt
                        ? dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm:ss")
                        : "--"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ViewDepartment;