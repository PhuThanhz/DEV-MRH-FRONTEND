import { useEffect, useState } from "react";
import {
    ModalForm,
    ProFormText,
    ProFormSelect,
    ProFormSwitch,
} from "@ant-design/pro-components";
import { Col, Form, Row, message, Upload, Button, Radio } from "antd";
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

const ModalCompanyProcedure = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: IProps) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [fileMode, setFileMode] = useState<"upload" | "url">("upload");

    const isEdit = Boolean(dataInit?.id);

    const { mutate: createData, isPending: isCreating } =
        useCreateCompanyProcedureMutation();
    const { mutate: updateData, isPending: isUpdating } =
        useUpdateCompanyProcedureMutation();

    useEffect(() => {
        if (dataInit?.id) {
            form.setFieldsValue(dataInit);
            setFileMode(dataInit.fileUrl ? "url" : "upload");
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
        if (!values.fileUrl) {
            message.error("Vui lòng upload file PDF hoặc nhập dữ liệu!");
            return;
        }

        const payload = {
            ...values,
            planYear: values.planYear ? Number(values.planYear) : undefined,
            sectionId: Number(values.sectionId),
        };

        if (isEdit) {
            updateData({ ...payload, id: dataInit?.id }, { onSuccess: handleReset });
        } else {
            createData(payload, { onSuccess: handleReset });
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
            if (file.type !== "application/pdf") {
                message.error("Chỉ được upload file PDF!");
                return Upload.LIST_IGNORE;
            }
            if (file.size / 1024 / 1024 >= 10) {
                message.error("File phải nhỏ hơn 10MB!");
                return Upload.LIST_IGNORE;
            }

            const fakeUrl = URL.createObjectURL(file);
            setFileList([
                {
                    uid: Date.now().toString(),
                    name: file.name,
                    status: "done",
                    url: fakeUrl,
                },
            ]);

            form.setFieldValue("fileUrl", fakeUrl);
            return false;
        },
        onRemove: () => {
            setFileList([]);
            form.setFieldValue("fileUrl", "");
        },
    };

    return (
        <>
            <style>
                {`
        .ant-modal-content { border-radius:16px !important; }
        .ant-modal-body { padding:22px 28px 8px !important; }

        .file-box{
          background:#fafafa;
          border:1px solid #eef2f6;
          border-radius:12px;
          padding:12px;
          margin-top:4px;
        }

        .pink-submit-btn{
          background:linear-gradient(135deg,#ec4899,#db2777)!important;
          border:none!important;
          border-radius:8px!important;
          height:36px!important;
        }
        `}
            </style>

            <ModalForm
                title={isEdit ? "Cập nhật quy trình" : "Tạo quy trình mới"}
                open={openModal}
                form={form}
                onFinish={submitForm}
                width={920}
                style={{ maxWidth: "95vw" }}
                layout="vertical"
                modalProps={{
                    onCancel: handleReset,
                    destroyOnClose: true,
                    maskClosable: false,
                    confirmLoading: isCreating || isUpdating,
                }}
                submitter={{
                    render: (props) => [
                        <Button key="cancel" onClick={handleReset}>
                            Hủy
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={isCreating || isUpdating}
                            onClick={() => props?.form?.submit?.()}
                            className="pink-submit-btn"
                        >
                            {isEdit ? "Cập nhật" : "Tạo mới"}
                        </Button>,
                    ],
                }}
            >
                <Row gutter={[20, 14]}>

                    <Col xs={24} lg={12}>
                        <ProFormText
                            name="procedureName"
                            label="Tên quy trình"
                            rules={[{ required: true }]}
                        />
                    </Col>

                    <Col xs={24} lg={12}>
                        <ProFormSelect
                            name="sectionId"
                            label="Bộ phận"
                            request={loadSections}
                            rules={[{ required: true }]}
                        />
                    </Col>

                    <Col xs={24} lg={12}>
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

                    <Col xs={24} lg={12}>
                        <ProFormText
                            name="planYear"
                            label="Kế hoạch năm"
                            fieldProps={{ type: "number" }}
                        />
                    </Col>

                    <Col xs={24}>
                        <ProFormSwitch
                            name="active"
                            label="Kích hoạt"
                            initialValue={dataInit?.active ?? true}
                        />
                    </Col>

                    <Col xs={24}>
                        <Form.Item label="File quy trình (PDF)" required>
                            <div className="file-box">

                                <div style={{ marginBottom: 10 }}>
                                    <Radio.Group
                                        value={fileMode}
                                        onChange={(e) => setFileMode(e.target.value)}
                                    >
                                        <Radio.Button value="upload">Upload file</Radio.Button>
                                        <Radio.Button value="url">Nhập dữ liệu</Radio.Button>
                                    </Radio.Group>
                                </div>

                                {fileMode === "upload" ? (
                                    <Upload {...uploadProps}>
                                        <Button icon={<UploadOutlined />} block>
                                            Chọn file PDF (≤ 10MB)
                                        </Button>
                                    </Upload>
                                ) : (
                                    <ProFormText
                                        name="fileUrl"
                                        placeholder="Nhập dữ liệu"
                                        rules={[{ required: true }]}
                                        fieldProps={{ prefix: <LinkOutlined /> }}
                                    />
                                )}

                            </div>
                        </Form.Item>
                    </Col>

                    <Col xs={24}>
                        <ProFormText name="note" label="Ghi chú" />
                    </Col>

                </Row>
            </ModalForm>
        </>
    );
};

export default ModalCompanyProcedure;