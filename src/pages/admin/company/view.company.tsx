import { Modal, Descriptions, Badge, Tabs } from "antd";
import type { TabsProps } from "antd";
import dayjs from "dayjs"; // thêm nếu chưa có

import type { ICompany } from "@/types/backend";
import CompanyJobTitleTab from "./company-job-title/company-job-title.tab";

interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit: ICompany | null;
}

const ViewCompany = ({ open, onClose, dataInit }: IProps) => {
    if (!dataInit) return null;

    const handleClose = () => {
        onClose();
    };

    const items: TabsProps["items"] = [
        {
            key: "1",
            label: "Thông tin chung",
            children: (
                <Descriptions bordered column={2} size="middle" layout="vertical">
                    <Descriptions.Item label="Mã công ty">
                        {dataInit.code || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên công ty">
                        {dataInit.name || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên tiếng Anh">
                        {dataInit.englishName || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {dataInit.status === 1 ? (
                            <Badge status="success" text="Hoạt động" />
                        ) : (
                            <Badge status="error" text="Ngừng hoạt động" />
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {dataInit.createdBy || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dataInit.createdAt
                            ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {dataInit.updatedAt
                            ? dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {dataInit.updatedBy || "--"}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: "2",
            label: "Chức danh công ty",
            children: <CompanyJobTitleTab companyId={dataInit.id!} />,
        },
    ];

    return (
        <Modal
            title={`Chi tiết công ty: ${dataInit.name}`}
            open={open}
            onCancel={handleClose}
            footer={null}
            width="70vw"           // giống ViewDepartment
            centered
            destroyOnClose
        >
            <Tabs defaultActiveKey="1" items={items} />
        </Modal>
    );
};

export default ViewCompany;