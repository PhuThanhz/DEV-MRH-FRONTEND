import { Badge, Descriptions, Modal, Spin } from "antd";
import dayjs from "dayjs";
import type { IJobTitle } from "@/types/backend";
import { useJobTitleByIdQuery } from "@/hooks/useJobTitles";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IJobTitle | null;
    setDataInit: (v: any) => void;
}

const ViewDetailJobTitle = ({ open, onClose, dataInit, setDataInit }: IProps) => {

    const { data: detail, isLoading } = useJobTitleByIdQuery(
        open && dataInit?.id ? dataInit.id : undefined
    );

    const handleClose = () => {
        setDataInit(null);
        onClose(false);
    };

    return (
        <Modal
            title="Chi tiết chức danh"
            open={open}
            onCancel={handleClose}
            footer={null}
            width={{ xs: "95vw", sm: "80vw", md: "60vw", lg: "50vw", xl: "45vw" }}
            centered
            destroyOnHidden
            styles={{
                mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.2)" },
            }}
        >
            <Spin spinning={isLoading}>
                <Descriptions
                    bordered
                    column={{ xs: 1, sm: 2 }}
                    size="middle"
                    layout="vertical"
                    labelStyle={{ fontWeight: 600, color: "#6b7280", background: "#fafafa", fontSize: 12 }}
                    contentStyle={{ fontSize: 13, color: "#111827" }}
                >
                    <Descriptions.Item label="Tên VI">
                        {detail?.nameVi || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên EN">
                        {detail?.nameEn || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Bậc chức danh">
                        {detail?.positionLevel?.code || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Công ty">
                        {detail?.positionLevel?.companyName || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái" span={2}>
                        {detail?.active ? (
                            <Badge status="success" text="Đang hoạt động" />
                        ) : (
                            <Badge status="error" text="Ngừng hoạt động" />
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

export default ViewDetailJobTitle;