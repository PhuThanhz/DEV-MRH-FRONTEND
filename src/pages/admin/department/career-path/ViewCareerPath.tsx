import { Modal, Descriptions, Tag, Grid } from "antd";
import { useEffect } from "react";
import dayjs from "dayjs";

import type { ICareerPath } from "@/types/backend";

const { useBreakpoint } = Grid;

interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: ICareerPath | null;
    setDataInit: (v: any) => void;
}

const ViewCareerPath = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const screens = useBreakpoint();
    const column = screens.md ? 2 : 1;

    useEffect(() => {
        if (!open) setDataInit(null);
    }, [open]);

    return (
        <Modal
            title="Chi tiết lộ trình thăng tiến"
            open={open}
            onCancel={onClose}
            footer={null}
            width={screens.md ? 1000 : "100%"}
            style={
                screens.md
                    ? undefined
                    : {
                        top: 20,          // cách đỉnh 20px
                        margin: "0 auto",
                        maxWidth: "100vw",
                        paddingBottom: 40, // ← thêm khoảng thở ở đáy
                    }
            }
            styles={
                screens.md
                    ? undefined
                    : {
                        body: {
                            padding: "12px 8px",
                            maxHeight: "80vh",   // giới hạn chiều cao
                            overflowY: "auto",   // cuộn nội dung thay vì tràn
                        },
                    }
            }
            destroyOnClose
        >
            {dataInit ? (
                <Descriptions
                    bordered
                    column={column}
                    size={screens.md ? "default" : "small"}
                >
                    <Descriptions.Item label="Phòng ban" span={column}>
                        {dataInit.departmentName}
                    </Descriptions.Item>

                    <Descriptions.Item label="Chức danh" span={column}>
                        {dataInit.jobTitleName} ({dataInit.positionLevelCode})
                    </Descriptions.Item>

                    <Descriptions.Item label="Tiêu chuẩn chức danh" span={column}>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                            {dataInit.jobStandard || "—"}
                        </div>
                    </Descriptions.Item>

                    <Descriptions.Item label="Yêu cầu đào tạo" span={column}>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                            {dataInit.trainingRequirement || "—"}
                        </div>
                    </Descriptions.Item>

                    <Descriptions.Item label="Phương pháp đánh giá" span={column}>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                            {dataInit.evaluationMethod || "—"}
                        </div>
                    </Descriptions.Item>

                    <Descriptions.Item label="Kết quả đào tạo" span={column}>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                            {dataInit.trainingOutcome || "—"}
                        </div>
                    </Descriptions.Item>

                    <Descriptions.Item label="Yêu cầu hiệu quả công việc" span={column}>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                            {dataInit.performanceRequirement || "—"}
                        </div>
                    </Descriptions.Item>

                    <Descriptions.Item label="Ghi chú về lương" span={column}>
                        <div style={{ whiteSpace: "pre-wrap" }}>
                            {dataInit.salaryNote || "—"}
                        </div>
                    </Descriptions.Item>

                    <Descriptions.Item label="Thời gian giữ vị trí">
                        {dataInit.requiredTime || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {dataInit.active ? (
                            <Tag color="success">Hoạt động</Tag>
                        ) : (
                            <Tag color="error">Vô hiệu hóa</Tag>
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dataInit.createdAt
                            ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm")
                            : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {dataInit.createdBy || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {dataInit.updatedAt
                            ? dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm")
                            : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {dataInit.updatedBy || "—"}
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <p>Không có dữ liệu</p>
            )}
        </Modal>
    );
};

export default ViewCareerPath;