import {
    Modal,
    Descriptions,
    Badge,
    Tabs,
    Space,
} from "antd";
import { BranchesOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import type { IDepartment } from "@/types/backend";
import DepartmentJobTitleTab from "./tab.department-job-title";
import JobTitleOrgChartTable from "./JobTitleOrgChartTable";  // ← Component mới tách ra

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
    const departmentId = dataInit?.id;

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
            width="85vw"
            centered
            destroyOnClose
        >
            <Tabs
                defaultActiveKey="1"
                items={[
                    {
                        key: "1",
                        label: "Thông tin chung",
                        children: (
                            <Descriptions bordered column={2} size="middle" layout="vertical">
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
                        ),
                    },
                    {
                        key: "2",
                        label: "Chức danh trong phòng ban",
                        children: <DepartmentJobTitleTab departmentId={departmentId} />,
                    },
                    {
                        key: "3",
                        label: (
                            <Space>
                                <BranchesOutlined />
                                Bản đồ chức danh
                            </Space>
                        ),
                        children: departmentId ? (
                            <JobTitleOrgChartTable departmentId={departmentId} />
                        ) : (
                            <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
                                Không có thông tin phòng ban
                            </div>
                        ),
                    },
                ]}
            />
        </Modal>
    );
};

export default ViewDepartment;