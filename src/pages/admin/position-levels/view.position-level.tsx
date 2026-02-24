import type { IPositionLevel } from "@/types/backend";
import { Badge, Descriptions, Modal } from "antd";
import dayjs from "dayjs";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IPositionLevel | null;
    setDataInit: (v: any) => void;
}

const ViewDetailPositionLevel = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const close = () => {
        onClose(false);
        setDataInit(null);
    };

    return (
        <Modal
            title="Chi tiết bậc chức danh"
            open={open}
            onCancel={close}
            footer={null}
            width="45vw"
            centered
        >
            <Descriptions bordered column={2} layout="vertical">
                <Descriptions.Item label="Code">
                    {dataInit?.code ?? "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Band">
                    {dataInit?.band ?? "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Level">
                    {dataInit?.levelNumber ?? "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Band Order">
                    {dataInit?.bandOrder ?? "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                    {dataInit?.status === 1 ? (
                        <Badge status="success" text="Đang hoạt động" />
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

                <Descriptions.Item label="Người tạo">
                    {dataInit?.createdBy ?? "--"}
                </Descriptions.Item>

                <Descriptions.Item label="Người cập nhật">
                    {dataInit?.updatedBy ?? "--"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ViewDetailPositionLevel;
