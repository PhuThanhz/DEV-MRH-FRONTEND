import type { IPositionLevel } from "@/types/backend";
import { Badge, Descriptions, Modal } from "antd";
import dayjs from "dayjs";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IPositionLevel | null;
    setDataInit: (v: any) => void;
}

const ViewDetailPositionLevel = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const close = () => {
        onClose(false);
        setDataInit(null);
    };

    return (
        <>
            <style>{`
                /* ── Modal chrome ── */
                .position-level-modal .ant-modal-content {
                    border-radius: 16px !important;
                    padding: 0 !important;
                    overflow: hidden;
                }
                .position-level-modal .ant-modal-header {
                    padding: 18px 24px 0 24px !important;
                    border-bottom: none !important;
                    background: #fff !important;
                    margin-bottom: 0 !important;
                }
                .position-level-modal .ant-modal-title {
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    color: #111827 !important;
                    letter-spacing: -0.02em !important;
                }
                .position-level-modal .ant-modal-body {
                    padding: 16px 24px 24px !important;
                    overflow-y: auto !important;
                    max-height: 85vh !important;
                }
                .position-level-modal .ant-modal-close {
                    top: 16px !important;
                    right: 18px !important;
                    width: 28px !important;
                    height: 28px !important;
                    border-radius: 8px !important;
                    background: #f7f7f8 !important;
                    border: 1.5px solid #efefef !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s !important;
                }
                .position-level-modal .ant-modal-close:hover {
                    background: #f0f0f0 !important;
                    border-color: #e0e0e0 !important;
                }
                .position-level-modal .ant-modal-close .ant-modal-close-x {
                    width: 28px !important;
                    height: 28px !important;
                    line-height: 28px !important;
                    font-size: 11px !important;
                    color: #6b7280 !important;
                }

                /* ── Descriptions styling ── */
                .position-level-modal .ant-descriptions-bordered .ant-descriptions-item-label {
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    color: #6b7280 !important;
                    background: #fafafa !important;
                    padding: 10px 14px !important;
                    white-space: nowrap;
                }
                .position-level-modal .ant-descriptions-bordered .ant-descriptions-item-content {
                    font-size: 13px !important;
                    color: #111827 !important;
                    padding: 10px 14px !important;
                }

                /* ── Desktop: giữ min-width để không quá hẹp ── */
                .position-level-modal.ant-modal {
                    min-width: 560px !important;
                }

                /* ── Tablet ── */
                @media (max-width: 768px) {
                    .position-level-modal.ant-modal {
                        min-width: unset !important;
                        width: calc(100vw - 32px) !important;
                        max-width: 600px !important;
                        margin: 16px auto !important;
                    }
                }

                /* ── Mobile: full width, vẫn giữ layout 2 cột ── */
                @media (max-width: 480px) {
                    .position-level-modal.ant-modal {
                        width: calc(100vw - 24px) !important;
                        max-width: unset !important;
                        margin: 12px auto !important;
                    }
                    .position-level-modal .ant-modal-body {
                        padding: 12px 12px 20px !important;
                    }
                    .position-level-modal .ant-modal-header {
                        padding: 14px 12px 0 12px !important;
                    }
                    .position-level-modal .ant-descriptions-bordered .ant-descriptions-item-label {
                        font-size: 11px !important;
                        padding: 8px 10px !important;
                    }
                    .position-level-modal .ant-descriptions-bordered .ant-descriptions-item-content {
                        font-size: 12px !important;
                        padding: 8px 10px !important;
                    }
                }
            `}</style>

            <Modal
                title="Chi tiết bậc chức danh"
                open={open}
                onCancel={close}
                footer={null}
                width="45vw"
                centered
                className="position-level-modal"
                styles={{
                    mask: { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.2)" },
                }}
            >
                <Descriptions bordered column={{ xs: 2, sm: 2, md: 2 }} layout="vertical">
                    <Descriptions.Item label="Code">
                        {dataInit?.code ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Band">
                        {dataInit?.band ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Level">
                        {dataInit?.levelNumber ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Band Order">
                        {dataInit?.bandOrder ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Công ty" span={2}>
                        {dataInit?.companyName ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái" span={2}>
                        {dataInit?.status === 1 ? (
                            <Badge status="success" text="Đang hoạt động" />
                        ) : (
                            <Badge status="error" text="Ngừng hoạt động" />
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dataInit?.createdAt
                            ? dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {dataInit?.updatedAt
                            ? dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                            : "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {dataInit?.createdBy ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {dataInit?.updatedBy ?? "--"}
                    </Descriptions.Item>
                </Descriptions>
            </Modal>
        </>
    );
};

export default ViewDetailPositionLevel;