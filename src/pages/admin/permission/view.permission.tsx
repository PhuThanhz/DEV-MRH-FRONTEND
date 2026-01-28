import type { IPermission } from "@/types/backend";
import { Descriptions, Modal, Spin } from "antd";
import dayjs from "dayjs";
import { isMobile } from "react-device-detect";
import { usePermissionByIdQuery } from "@/hooks/usePermissions";

interface IProps {
    onClose: (v: boolean) => void;
    open: boolean;
    dataInit: IPermission | null;
    setDataInit: (v: any) => void;
}

const ViewDetailPermission = (props: IProps) => {
    const { onClose, open, dataInit, setDataInit } = props;

    const { data, isFetching } = usePermissionByIdQuery(dataInit?.id);

    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    return (
        <Modal
            title="Thông Tin Permission"
            open={open}
            onCancel={handleClose}
            footer={null}
            width={isMobile ? "100%" : 700}
            maskClosable={false}
            destroyOnClose
            centered
        >
            {isFetching ? (
                <div style={{ textAlign: "center", marginTop: 50 }}>
                    <Spin tip="Đang tải dữ liệu..." />
                </div>
            ) : (
                <Descriptions bordered column={2} layout="vertical">
                    <Descriptions.Item label="Tên Permission">
                        {data?.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="API Path">
                        {data?.apiPath}
                    </Descriptions.Item>

                    <Descriptions.Item label="Method">
                        {data?.method}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thuộc Module">
                        {data?.module}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {data?.createdAt
                            ? dayjs(data.createdAt).format("DD-MM-YYYY HH:mm:ss")
                            : ""}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày sửa">
                        {data?.updatedAt
                            ? dayjs(data.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                            : ""}
                    </Descriptions.Item>
                </Descriptions>
            )}
        </Modal>
    );
};

export default ViewDetailPermission;
