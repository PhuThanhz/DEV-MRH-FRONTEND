import { Badge, Descriptions, Modal, Tabs } from "antd";
import dayjs from "dayjs";
import type { ISection } from "@/types/backend";
import SectionJobTitleTab from "./tab.section-job-title"; // ⭐ Thêm tab

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: ISection | null;
    setDataInit: (v: any) => void;
}

const ViewDetailSection = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    if (!dataInit) return null;

    const infoTab = (
        <Descriptions bordered size="middle" column={2} layout="vertical">
            <Descriptions.Item label="Mã bộ phận">{dataInit.code}</Descriptions.Item>
            <Descriptions.Item label="Tên bộ phận">{dataInit.name}</Descriptions.Item>

            <Descriptions.Item label="Phòng ban">
                {dataInit.department?.name}
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
    );

    return (
        <Modal
            title="Chi tiết bộ phận"
            open={open}
            onCancel={handleClose}
            footer={null}
            width="65vw"
            centered
        >
            <Tabs
                defaultActiveKey="info"
                items={[
                    {
                        key: "info",
                        label: "Thông tin",
                        children: infoTab,
                    },
                    {
                        key: "jobtitle",
                        label: "Chức danh bộ phận",
                        children: (
                            <SectionJobTitleTab
                                sectionId={dataInit.id}
                                departmentId={dataInit.department?.id}
                            />
                        ),
                    },
                ]}
            />
        </Modal>
    );
};

export default ViewDetailSection;
