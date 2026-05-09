import { Badge, Descriptions, Modal, Spin } from "antd";
import dayjs from "dayjs";
import type { ISection } from "@/types/backend";
import { useSectionByIdQuery } from "@/hooks/useSections";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: ISection | null;
    setDataInit: (v: any) => void;
}

const ViewDetailSection = ({ open, onClose, dataInit, setDataInit }: IProps) => {

    const { data: detail, isLoading } = useSectionByIdQuery(
        open && dataInit?.id ? dataInit.id : undefined
    );

    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    return (
        <Modal
            title="Chi tiết bộ phận"
            open={open}
            onCancel={handleClose}
            footer={null}
            width="60vw"
            centered
            destroyOnHidden
        >
            <Spin spinning={isLoading}>
                <Descriptions
                    bordered
                    size="middle"
                    column={2}
                    layout="vertical"
                    labelStyle={{ fontWeight: 600, background: "#fafafa" }}
                    contentStyle={{ fontSize: 14 }}
                >
                    <Descriptions.Item label="Mã bộ phận">
                        {detail?.code || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên bộ phận">
                        {detail?.name || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Phòng ban">
                        {detail?.department?.name || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {detail?.active ? (
                            <Badge status="success" text="Hoạt động" />
                        ) : (
                            <Badge status="error" text="Vô hiệu hóa" />
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {detail?.createdAt
                            ? dayjs(detail.createdAt).format("DD-MM-YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {detail?.updatedAt
                            ? dayjs(detail.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {detail?.createdBy || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {detail?.updatedBy || "--"}
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </Modal>
    );
};

export default ViewDetailSection;