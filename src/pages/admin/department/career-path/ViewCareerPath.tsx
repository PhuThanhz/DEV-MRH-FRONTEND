import { Modal, Descriptions, Tag } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";

import type { ICareerPath } from "@/types/backend";

interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: ICareerPath | null;
    setDataInit: (v: any) => void;
}

const ViewCareerPath = ({ open, onClose, dataInit, setDataInit }: IProps) => {

    useEffect(() => {
        if (!open) setDataInit(null);
    }, [open]);

    return (
        <Modal
            title="Chi tiết lộ trình thăng tiến"
            open={open}
            onCancel={onClose}
            footer={null}
            width={1000}
            destroyOnClose
        >
            {dataInit ? (
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Phòng ban" span={2}>
                        {dataInit.departmentName}
                    </Descriptions.Item>

                    <Descriptions.Item label="Chức danh" span={2}>
                        {dataInit.jobTitleName} ({dataInit.positionLevelCode})
                    </Descriptions.Item>

                    <Descriptions.Item label="Tiêu chuẩn" span={2}>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                            {dataInit.jobStandard}
                        </div>
                    </Descriptions.Item>

                    <Descriptions.Item label="Yêu cầu đào tạo" span={2}>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                            {dataInit.trainingRequirement}
                        </div>
                    </Descriptions.Item>

                    <Descriptions.Item label="Phương pháp đánh giá" span={2}>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                            {dataInit.evaluationMethod}
                        </div>
                    </Descriptions.Item>

                    <Descriptions.Item label="Thời gian giữ vị trí">
                        {dataInit.requiredTime}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {dataInit.active ? (
                            <Tag color="success">Hoạt động</Tag>
                        ) : (
                            <Tag color="error">Vô hiệu hóa</Tag>
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {dataInit.createdBy}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm")}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {dataInit.updatedBy}
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <p>Không có dữ liệu</p>
            )}
        </Modal>
    );
};

export default ViewCareerPath;
