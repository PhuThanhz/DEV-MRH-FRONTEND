import type { IUser } from "@/types/backend";
import { Badge, Descriptions, Modal } from "antd";
import dayjs from "dayjs";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IUser | null;
    setDataInit: (v: any) => void;
}

const ViewDetailUser = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    return (
        <Modal
            title="Chi tiết người dùng"
            open={open}
            onCancel={handleClose}
            footer={null}
            width="50vw"
            centered
        >
            <Descriptions bordered column={2} size="middle" layout="vertical">
                <Descriptions.Item label="Tên hiển thị">
                    {dataInit?.name || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Email">
                    {dataInit?.email || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Vai trò">
                    {dataInit?.role ? (
                        <Badge status="processing" text={dataInit.role.name} />
                    ) : (
                        <Badge status="default" text="Chưa có vai trò" />
                    )}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                    {dataInit?.active ? (
                        <Badge status="success" text="Hoạt động" />
                    ) : (
                        <Badge status="error" text="Vô hiệu hóa" />
                    )}
                </Descriptions.Item>

                <Descriptions.Item label="Người tạo">
                    {dataInit?.createdBy || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Người cập nhật">
                    {dataInit?.updatedBy || "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày tạo">
                    {dataInit?.createdAt
                        ? dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm:ss")
                        : "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày sửa">
                    {dataInit?.updatedAt
                        ? dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                        : "--"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ViewDetailUser;
