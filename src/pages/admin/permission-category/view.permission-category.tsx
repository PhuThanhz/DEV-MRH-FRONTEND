import { Modal, Descriptions, Tag, Spin } from "antd";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import type { IPermissionCategory } from "@/types/backend";
import { usePermissionCategoryByIdQuery } from "@/hooks/usePermissionCategory";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataInit: IPermissionCategory | null;
    setDataInit: (v: IPermissionCategory | null) => void;
}

const ViewCategory = ({ open, setOpen, dataInit, setDataInit }: IProps) => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    const { data: detail, isLoading } = usePermissionCategoryByIdQuery(
        open && dataInit?.id ? Number(dataInit.id) : null
    );

    const handleClose = () => {
        setOpen(false);
        setDataInit(null);
    };

    return (
        <Modal
            title="Chi tiết danh mục phân quyền"
            open={open}
            onCancel={handleClose}
            footer={null}
            width={isMobile ? "95vw" : "50vw"}
            centered
        >
            <Spin spinning={isLoading}>
                <Descriptions
                    bordered
                    column={isMobile ? 1 : 2}
                    layout="vertical"
                    size={isMobile ? "small" : "middle"}
                >
                    <Descriptions.Item label="Mã danh mục">
                        {detail?.code || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên danh mục">
                        {detail?.name || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Công ty" span={isMobile ? 1 : 2}>
                        {detail?.companyName ? (
                            <Tag
                                style={{
                                    borderRadius: 4,
                                    padding: "0px 8px",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    height: 22,
                                    lineHeight: "20px",
                                    border: "1px solid #d3adf7",
                                    background: "#f9f0ff",
                                    color: "#531dab",
                                }}
                            >
                                {detail.companyName}
                            </Tag>
                        ) : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Phòng ban" span={isMobile ? 1 : 2}>
                        {detail?.departmentName ? (
                            <Tag
                                style={{
                                    borderRadius: 4,
                                    padding: "0px 8px",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    height: 22,
                                    lineHeight: "20px",
                                    border: "1px solid #91caff",
                                    background: "#e6f4ff",
                                    color: "#0958d9",
                                }}
                            >
                                {detail.departmentName}
                            </Tag>
                        ) : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {detail?.active ? (
                            <Tag color="green">Hoạt động</Tag>
                        ) : (
                            <Tag color="red">Ngừng hoạt động</Tag>
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {detail?.createdBy || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {detail?.createdAt
                            ? dayjs(detail.createdAt).format("DD-MM-YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {detail?.updatedBy || "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật" span={isMobile ? 1 : 2}>
                        {detail?.updatedAt
                            ? dayjs(detail.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </Modal>
    );
};

export default ViewCategory;