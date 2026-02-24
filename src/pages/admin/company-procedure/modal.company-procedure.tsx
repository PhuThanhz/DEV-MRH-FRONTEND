import { useEffect, useState } from "react";
import {
    ModalForm,
    ProFormText,
    ProFormSelect,
    ProFormSwitch,
    ProFormRadio,
} from "@ant-design/pro-components";
import { Col, Form, Row, message, Upload, Button, Radio, Input } from "antd";
import { UploadOutlined, LinkOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { callFetchSection } from "@/config/api";
import type { ICompanyProcedure, ISection } from "@/types/backend";
import {
    useCreateCompanyProcedureMutation,
    useUpdateCompanyProcedureMutation,
} from "@/hooks/useCompanyProcedures";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: ICompanyProcedure | null;
    setDataInit: (v: any) => void;
}

const ModalCompanyProcedure = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [fileMode, setFileMode] = useState<"upload" | "url">("upload");

    const isEdit = Boolean(dataInit?.id);

    const { mutate: createData, isPending: isCreating } = useCreateCompanyProcedureMutation();
    const { mutate: updateData, isPending: isUpdating } = useUpdateCompanyProcedureMutation();

    useEffect(() => {
        if (dataInit?.id) {
            form.setFieldsValue({
                procedureName: dataInit.procedureName,
                fileUrl: dataInit.fileUrl,
                status: dataInit.status,
                planYear: dataInit.planYear,
                note: dataInit.note,
                sectionId: dataInit.sectionId,
                active: dataInit.active,
            });

            // Detect mode khi edit
            if (dataInit.fileUrl) {
                setFileMode("url");
                // Không set fileList vì đây là link thủ công
            } else {
                setFileMode("upload");
            }
        } else {
            form.resetFields();
            setFileList([]);
            setFileMode("upload");
        }
    }, [dataInit, form]);

    const handleReset = () => {
        form.resetFields();
        setFileList([]);
        setFileMode("upload");
        setDataInit(null);
        setOpenModal(false);
    };

    const submitForm = async (values: any) => {
        // Validate thủ công: phải có fileUrl (từ upload hoặc nhập tay)
        if (!values.fileUrl) {
            message.error("Vui lòng upload file PDF hoặc nhập link URL!");
            return;
        }

        const payload: any = {
            ...values,
            planYear: Number(values.planYear),
            sectionId: Number(values.sectionId),
            // fileUrl đã có từ form
        };

        if (isEdit) {
            payload.id = dataInit?.id;
            updateData(payload, {
                onSuccess: handleReset,
                onError: (err: any) =>
                    message.error(err?.response?.data?.message || "Lỗi cập nhật quy trình"),
            });
        } else {
            createData(payload, {
                onSuccess: handleReset,
                onError: (err: any) =>
                    message.error(err?.response?.data?.message || "Lỗi tạo quy trình"),
            });
        }
    };

    const loadSections = async () => {
        const res = await callFetchSection(`page=1&size=500`);
        return (
            res?.data?.result?.map((s: ISection) => ({
                label: `${s.name} (${s.department?.name})`,
                value: s.id,
            })) || []
        );
    };

    const uploadProps: UploadProps = {
        fileList,
        maxCount: 1,
        accept: ".pdf",
        beforeUpload: (file) => {
            const isPDF = file.type === "application/pdf";
            if (!isPDF) {
                message.error("Chỉ được upload file PDF!");
                return Upload.LIST_IGNORE;
            }
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error("File phải nhỏ hơn 10MB!");
                return Upload.LIST_IGNORE;
            }

            // ----------------- THAY BẰNG API UPLOAD THẬT NẾU CÓ -----------------
            // Hiện tại giả lập URL
            const fakeUrl = URL.createObjectURL(file); // hoặc gọi API upload rồi lấy url thật

            setFileList([
                {
                    uid: Date.now().toString(),
                    name: file.name,
                    status: "done",
                    url: fakeUrl,
                },
            ]);

            form.setFieldValue("fileUrl", fakeUrl); // hoặc url từ server
            message.success("File đã được chọn thành công!");

            return false; // Ngăn auto upload
        },
        onRemove: () => {
            setFileList([]);
            form.setFieldValue("fileUrl", "");
        },
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật quy trình" : "Tạo quy trình mới"}
            open={openModal}
            form={form}
            onFinish={submitForm}
            modalProps={{
                onCancel: handleReset,
                destroyOnClose: true,
                maskClosable: false,
                confirmLoading: isCreating || isUpdating,
            }}
            width={700}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo mới",
                    resetText: "Hủy",
                },
            }}
        >
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <ProFormText
                        name="procedureName"
                        label="Tên quy trình"
                        rules={[{ required: true, message: "Vui lòng nhập tên quy trình!" }]}
                    />
                </Col>

                <Col span={12}>
                    <ProFormSelect
                        name="sectionId"
                        label="Bộ phận"
                        request={loadSections}
                        rules={[{ required: true, message: "Vui lòng chọn bộ phận!" }]}
                    />
                </Col>

                <Col span={12}>
                    <ProFormSelect
                        name="status"
                        label="Trạng thái"
                        valueEnum={{
                            NEED_CREATE: "Cần xây dựng mới",
                            IN_PROGRESS: "Đang xây dựng",
                            NEED_UPDATE: "Cần cập nhật",
                            TERMINATED: "Chấm dứt",
                        }}
                    />
                </Col>

                <Col span={12}>
                    <ProFormSwitch
                        name="active"
                        label="Kích hoạt"
                        checkedChildren="Bật"
                        unCheckedChildren="Tắt"
                        initialValue={dataInit?.active ?? true}
                    />
                </Col>

                <Col span={12}>
                    <ProFormText
                        name="planYear"
                        label="Kế hoạch năm"
                        placeholder="VD: 2026"
                        fieldProps={{ type: "number" }}
                    />
                </Col>

                <Col span={24}>
                    <Form.Item
                        label="File quy trình (PDF)"
                        required
                        tooltip="Chọn upload file hoặc nhập link URL đã có sẵn"
                    >
                        <Radio.Group
                            value={fileMode}
                            onChange={(e) => {
                                setFileMode(e.target.value);
                                // Reset field kia khi đổi mode
                                if (e.target.value === "upload") {
                                    form.setFieldValue("fileUrl", "");
                                } else {
                                    setFileList([]);
                                    form.setFieldValue("fileUrl", dataInit?.fileUrl || "");
                                }
                            }}
                            buttonStyle="solid"
                            className="mb-3"
                        >
                            <Radio.Button value="upload">Upload file PDF</Radio.Button>
                            <Radio.Button value="url">Nhập link URL</Radio.Button>
                        </Radio.Group>

                        {fileMode === "upload" && (
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined />}>Chọn file PDF (tối đa 10MB)</Button>
                            </Upload>
                        )}

                        {fileMode === "url" && (
                            <ProFormText
                                name="fileUrl"
                                placeholder="https://example.com/files/quy-trinh.pdf"
                                rules={[
                                    { required: true, message: "Vui lòng nhập link URL!" },
                                    { type: "url", message: "Link không hợp lệ!" },
                                ]}
                                fieldProps={{
                                    prefix: <LinkOutlined />,
                                    addonAfter: "PDF",
                                }}
                            />
                        )}
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <ProFormText name="note" label="Ghi chú" />
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalCompanyProcedure;