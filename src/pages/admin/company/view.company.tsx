// ViewCompany.tsx — FULL CODE

import { Modal, Descriptions, Badge, Tabs, Spin, Empty } from "antd";
import type { TabsProps } from "antd";
import dayjs from "dayjs";
import { isMobile } from "react-device-detect";

import { useCompanyByIdQuery } from "@/hooks/useCompanies";
import CompanyJobTitleTab from "./company-job-title/company-job-title.tab";

interface IProps {
    open: boolean;
    onClose: () => void;
    companyId?: string | number | null;
}

const ViewCompany = ({ open, onClose, companyId }: IProps) => {
    const {
        data: company,
        isLoading,
        isError,
    } = useCompanyByIdQuery(companyId ? String(companyId) : undefined);

    const items: TabsProps["items"] = [
        {
            key: "1",
            label: "Thông tin chung",
            children: (
                <Descriptions
                    bordered
                    column={2}
                    size="middle"
                    layout="vertical"
                    labelStyle={{
                        fontWeight: 600,
                        color: "#595959",
                        background: "#fafafa",
                    }}
                    contentStyle={{
                        fontSize: 14,
                        color: "#262626",
                    }}
                >
                    <Descriptions.Item label="Mã công ty">
                        {company?.code || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên công ty">
                        {company?.name || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên tiếng Anh">
                        {company?.englishName || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {company?.status === 1 ? (
                            <Badge status="success" text="Hoạt động" />
                        ) : (
                            <Badge status="error" text="Ngừng hoạt động" />
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {company?.createdBy || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {company?.createdAt
                            ? dayjs(company.createdAt).format("DD/MM/YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {company?.updatedAt
                            ? dayjs(company.updatedAt).format("DD/MM/YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {company?.updatedBy || "--"}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
        {
            key: "2",
            label: "Chức danh công ty",
            children: company?.id ? (
                <CompanyJobTitleTab companyId={company.id} />
            ) : null,
        },
    ];

    return (
        <Modal
            title={`Chi tiết công ty${company?.name ? `: ${company.name}` : ""}`}
            open={open}
            onCancel={onClose}
            footer={null}
            width={isMobile ? "100%" : "70vw"}
            centered
            destroyOnClose
            maskClosable={false}
        >
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                    <Spin size="large" />
                </div>
            ) : isError || !company ? (
                <Empty description="Không tìm thấy thông tin công ty" />
            ) : (
                <Tabs defaultActiveKey="1" items={items} />
            )}
        </Modal>
    );
};

export default ViewCompany;