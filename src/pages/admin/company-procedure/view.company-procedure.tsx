import { Descriptions, Modal, Badge } from "antd";
import type { ICompanyProcedure } from "@/types/backend";
import dayjs from "dayjs";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: ICompanyProcedure | null;
    setDataInit: (v: any) => void;
}

const ViewDetailCompanyProcedure = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    return (
        <Modal
            title="Chi tiết quy trình công ty"
            open={open}
            onCancel={handleClose}
            footer={null}
            width="60vw"
            centered
        >
            <Descriptions bordered column={2} size="middle" layout="vertical">
                <Descriptions.Item label="Tên quy trìxnh">{dataInit?.procedureName || "--"}</Descriptions.Item>
                <Descriptions.Item label="Bộ phận">{dataInit?.sectionName || "--"}</Descriptions.Item>
                <Descriptions.Item label="Phòng ban">{dataInit?.departmentName || "--"}</Descriptions.Item>
                <Descriptions.Item label="Công ty">{dataInit?.companyName || "--"}</Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                    <Badge status="processing" text={dataInit?.status} />
                </Descriptions.Item>
                <Descriptions.Item label="Hoạt động">
                    {dataInit?.active ? (
                        <Badge status="success" text="Đang bật" />
                    ) : (
                        <Badge status="error" text="Tắt" />
                    )}
                </Descriptions.Item>

                <Descriptions.Item label="Kế hoạch năm">{dataInit?.planYear || "--"}</Descriptions.Item>
                <Descriptions.Item label="File URL">{dataInit?.fileUrl || "--"}</Descriptions.Item>
                <Descriptions.Item label="Ghi chú" span={2}>{dataInit?.note || "--"}</Descriptions.Item>

                <Descriptions.Item label="Tạo bởi">{dataInit?.createdBy || "--"}</Descriptions.Item>
                <Descriptions.Item label="Cập nhật bởi">{dataInit?.updatedBy || "--"}</Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                    {dataInit?.createdAt ? dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm") : "--"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày sửa">
                    {dataInit?.updatedAt ? dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm") : "--"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ViewDetailCompanyProcedure;
