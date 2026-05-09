import { Modal, Descriptions, Badge, Spin } from "antd";
import dayjs from "dayjs";

import type { IDepartment } from "@/types/backend";
import { useDepartmentByIdQuery } from "@/hooks/useDepartments";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IDepartment | null;
    setDataInit: (v: any) => void;
}

const ViewDepartment = ({ open, onClose, dataInit, setDataInit }: IProps) => {

    const { data: detail, isLoading } = useDepartmentByIdQuery(
        open && dataInit?.id ? dataInit.id : undefined
    );

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
            destroyOnHidden
        >
            <Spin spinning={isLoading}>
                <Descriptions
                    bordered
                    column={2}
                    size="middle"
                    layout="vertical"
                    labelStyle={{ fontWeight: 600, color: "#595959", background: "#fafafa" }}
                    contentStyle={{ fontSize: 14, color: "#262626" }}
                >
                    <Descriptions.Item label="Mã phòng ban">
                        {detail?.code || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tên phòng ban">
                        {detail?.name || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tên tiếng Anh">
                        {detail?.englishName || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Công ty">
                        {detail?.company?.name || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {detail?.status === 1 ? (
                            <Badge status="success" text="Hoạt động" />
                        ) : (
                            <Badge status="error" text="Ngừng hoạt động" />
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {detail?.createdBy || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                        {detail?.createdAt
                            ? dayjs(detail.createdAt).format("DD/MM/YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">
                        {detail?.updatedAt
                            ? dayjs(detail.updatedAt).format("DD/MM/YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </Modal>
    );
};

export default ViewDepartment;