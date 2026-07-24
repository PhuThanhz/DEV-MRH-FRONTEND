/* ===================== PROCESS ACTION MODAL (CLEAN & SEAMLESS) ===================== */

import { ModalForm, ProFormText, ProFormSwitch, ProFormTextArea } from "@ant-design/pro-components";
import { Form, Row, Col } from "antd";
import {
    TagOutlined,
    BarcodeOutlined,
    EditOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    AppstoreAddOutlined,
    FileTextOutlined
} from "@ant-design/icons";

import type { IProcessAction } from "@/types/backend";
import {
    useCreateProcessActionMutation,
    useUpdateProcessActionMutation,
} from "@/hooks/useProcessActions";
import { useModalWidth } from "@/components/common/modal/detail";

const LOTUS_PINK = "#e8637a";
const LOTUS_PINK_HOVER = "#d94f67";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IProcessAction | null;
    setDataInit: (v: IProcessAction | null) => void;
}

const ModalProcessAction = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);
    const width = useModalWidth(640);

    const { mutate: create, isPending: isCreating } = useCreateProcessActionMutation();
    const { mutate: update, isPending: isUpdating } = useUpdateProcessActionMutation();
    const isLoading = isCreating || isUpdating;

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    const onFinish = async (values: any) => {
        const payload: IProcessAction = { ...values, id: dataInit?.id };
        return new Promise<void>((resolve) => {
            if (isEdit) {
                update(payload, { onSuccess: () => { handleReset(); resolve(); } });
            } else {
                create(payload, { onSuccess: () => { handleReset(); resolve(); } });
            }
        });
    };

    return (
        <ModalForm
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
                        border: "1px solid #FECDD3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <TagOutlined style={{ fontSize: 18, color: LOTUS_PINK }} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#0F172A",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.3,
                        }}>
                            {isEdit ? "Cập nhật hành động quy trình" : "Tạo mới hành động quy trình"}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: 400 }}>
                            {isEdit ? `Mã định danh: ${dataInit?.code ?? ""}` : "Cấu hình thông tin chuẩn hóa cho ma trận phân quyền RACI"}
                        </div>
                    </div>
                </div>
            }
            open={openModal}
            form={form}
            onFinish={onFinish}
            width={width}
            initialValues={
                dataInit
                    ? {
                        code: dataInit.code,
                        name: dataInit.name,
                        shortDescription: dataInit.shortDescription,
                        description: dataInit.description,
                        active: dataInit.active ?? true,
                    }
                    : { active: true }
            }
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Lưu thay đổi" : "Tạo hành động mới",
                    resetText: "Hủy bỏ",
                },
                resetButtonProps: {
                    style: {
                        borderRadius: 8,
                        borderColor: "#CBD5E1",
                        color: "#334155",
                        fontWeight: 500,
                        height: 38,
                        paddingLeft: 20,
                        paddingRight: 20,
                    },
                },
                submitButtonProps: {
                    loading: isLoading,
                    style: {
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #E8637A 0%, #D94F67 100%)",
                        borderColor: LOTUS_PINK,
                        fontWeight: 600,
                        height: 38,
                        paddingLeft: 22,
                        paddingRight: 22,
                        boxShadow: "0 3px 8px rgba(232, 99, 122, 0.25)",
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = LOTUS_PINK_HOVER;
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #E8637A 0%, #D94F67 100%)";
                    },
                },
            }}
            modalProps={{
                onCancel: handleReset,
                destroyOnHidden: true,
                maskClosable: false,
                className: "process-action-form-modal",
                styles: {
                    body: { padding: "20px 24px 16px" },
                    header: { padding: "16px 24px 14px", borderBottom: "1px solid #F1F5F9" },
                    footer: { padding: "14px 24px", borderTop: "1px solid #F1F5F9", background: "#FAFAFA" },
                },
            }}
        >
            <style>{`
                .process-action-form-modal .ant-modal-content {
                    border-radius: 12px !important;
                    overflow: hidden !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
                }
                .process-action-form-modal .ant-form-item {
                    margin-bottom: 16px !important;
                }
                .process-action-form-modal .ant-form-item-label > label {
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    color: #1E293B !important;
                }
                .process-action-form-modal .ant-input,
                .process-action-form-modal .ant-input-affix-wrapper,
                .process-action-form-modal .ant-input-textarea textarea {
                    border-radius: 8px !important;
                    border-color: #CBD5E1 !important;
                    background: #FFFFFF !important;
                    font-size: 13px !important;
                    padding: 7px 12px !important;
                    transition: all 0.15s ease !important;
                }
                .process-action-form-modal .ant-input-affix-wrapper:hover,
                .process-action-form-modal .ant-input:hover,
                .process-action-form-modal .ant-input-textarea textarea:hover {
                    border-color: #94A3B8 !important;
                }
                .process-action-form-modal .ant-input-affix-wrapper-focused,
                .process-action-form-modal .ant-input:focus,
                .process-action-form-modal .ant-input-focused,
                .process-action-form-modal .ant-input-textarea textarea:focus {
                    border-color: ${LOTUS_PINK} !important;
                    box-shadow: 0 0 0 3px rgba(232, 99, 122, 0.12) !important;
                }
                .process-action-form-modal .ant-switch-checked {
                    background-color: ${LOTUS_PINK} !important;
                }
            `}</style>

            {/* Section 1: Thông tin định danh */}
            <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#2563EB",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
            }}>
                <AppstoreAddOutlined style={{ color: "#2563EB" }} />
                <span>THÔNG TIN ĐỊNH DANH</span>
            </div>

            <Row gutter={16}>
                <Col xs={24} sm={9}>
                    <ProFormText
                        name="code"
                        label="Mã hành động"
                        placeholder="Mã định danh (ví dụ: ACT_01)"
                        rules={[{ required: true, message: "Vui lòng nhập mã hành động" }]}
                        disabled={isEdit}
                        fieldProps={{
                            prefix: <BarcodeOutlined style={{ color: "#94A3B8", marginRight: 4 }} />,
                            style: isEdit ? { background: "#F1F5F9", color: "#64748B" } : undefined,
                        }}
                    />
                </Col>
                <Col xs={24} sm={15}>
                    <ProFormText
                        name="name"
                        label="Tên đầu mục công việc"
                        placeholder="Tên đầu mục (ví dụ: Phê duyệt hồ sơ nhân sự)"
                        rules={[{ required: true, message: "Vui lòng nhập tên đầu mục" }]}
                        fieldProps={{
                            prefix: <EditOutlined style={{ color: "#94A3B8", marginRight: 4 }} />,
                        }}
                    />
                </Col>
            </Row>

            <ProFormText
                name="shortDescription"
                label="Giải thích tên đầu mục"
                placeholder="Giải thích tóm tắt ngắn gọn ý nghĩa của hành động"
                fieldProps={{
                    prefix: <InfoCircleOutlined style={{ color: "#94A3B8", marginRight: 4 }} />,
                }}
            />

            {/* Divider */}
            <div style={{ height: 1, background: "#F1F5F9", margin: "16px 0 14px" }} />

            {/* Section 2: Định nghĩa & Trạng thái */}
            <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#2563EB",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
            }}>
                <FileTextOutlined style={{ color: "#2563EB" }} />
                <span>MÔ TẢ CHI TIẾT & KÍCH HOẠT</span>
            </div>

            <ProFormTextArea
                name="description"
                label="Định nghĩa chi tiết"
                placeholder="Mô tả cụ thể nội dung thực hiện (mỗi dòng 1 ý)..."
                fieldProps={{
                    rows: 3,
                    autoSize: { minRows: 3, maxRows: 5 },
                }}
            />

            {/* Clean Status Row (No bulky inner card borders) */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#F8FAFC",
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                marginTop: 4,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircleOutlined style={{ fontSize: 16, color: "#2563EB" }} />
                    <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                            Trạng thái kích hoạt:
                        </span>
                        <span style={{ fontSize: 12, color: "#64748B", marginLeft: 6 }}>
                            Bật để cho phép áp dụng hành động này ngay vào hệ thống quy trình RACI
                        </span>
                    </div>
                </div>

                <ProFormSwitch
                    name="active"
                    noStyle
                    checkedChildren="Bật"
                    unCheckedChildren="Tắt"
                />
            </div>
        </ModalForm>
    );
};

export default ModalProcessAction;
