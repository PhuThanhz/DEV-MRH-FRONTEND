import React, { useEffect, useState } from "react";
import {
    ModalForm,
    ProFormText,
    ProFormSelect,
    ProFormSwitch,
} from "@ant-design/pro-components";

import {
    Col,
    Form,
    Row,
    message,
    Upload,
    Button,
    Radio,
    Input
} from "antd";

import { UploadOutlined, LinkOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";

import {
    callFetchCompany,
    callFetchDepartmentsByCompany,
    callFetchSectionsByDepartment
} from "@/config/api";

import type {
    ICompanyProcedure,
    ICompany,
    IDepartment,
    ISection,
} from "@/types/backend";

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

const ModalCompanyProcedure: React.FC<IProps> = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}) => {


    const [form] = Form.useForm();

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [fileMode, setFileMode] = useState<"upload" | "url">("upload");

    const [companyId, setCompanyId] = useState<number | null>(null);
    const [departmentId, setDepartmentId] = useState<number | null>(null);

    const isEdit = Boolean(dataInit?.id);

    const { mutate: createData, isPending: isCreating } =
        useCreateCompanyProcedureMutation();

    const { mutate: updateData, isPending: isUpdating } =
        useUpdateCompanyProcedureMutation();

    useEffect(() => {

        if (!openModal) return;

        if (dataInit?.id) {

            form.setFieldsValue({
                companyId: dataInit.companyId,
                departmentId: dataInit.departmentId,
                sectionId: dataInit.sectionId,
                procedureName: dataInit.procedureName,
                status: dataInit.status,
                planYear: dataInit.planYear,
                note: dataInit.note,
                fileUrl: dataInit.fileUrl,
                active: dataInit.active,
            });

            setCompanyId(dataInit.companyId ?? null);
            setDepartmentId(dataInit.departmentId ?? null);
            setFileMode(dataInit.fileUrl ? "url" : "upload");

        } else {

            form.resetFields();
            setFileList([]);
            setCompanyId(null);
            setDepartmentId(null);
            setFileMode("upload");

        }

    }, [openModal, dataInit]);

    const handleReset = () => {

        form.resetFields();
        setFileList([]);
        setFileMode("upload");

        setCompanyId(null);
        setDepartmentId(null);

        setDataInit(null);
        setOpenModal(false);

    };

    const submitForm = async (values: any) => {

        if (!values.fileUrl) {
            message.error("Vui lòng upload file PDF hoặc nhập link!");
            return;
        }

        const payload = {
            ...values,
            planYear: values.planYear ? parseInt(values.planYear) : undefined,
            sectionId: Number(values.sectionId),
        };

        if (isEdit) {

            updateData(
                { ...payload, id: dataInit?.id },
                { onSuccess: handleReset }
            );

        } else {

            createData(payload, { onSuccess: handleReset });

        }

    };

    const loadCompanies = async () => {

        const res = await callFetchCompany("page=1&size=500");

        return (
            res?.data?.result?.map((c: ICompany) => ({
                label: c.name,
                value: c.id,
            })) || []
        );

    };

    const loadDepartments = async ({ companyId }: any) => {

        if (!companyId) return [];

        const res = await callFetchDepartmentsByCompany(companyId);

        const departments: IDepartment[] = res?.data ?? [];

        return departments.map((d) => ({
            label: d.name,
            value: d.id,
        }));

    };

    const loadSections = async ({ departmentId }: any) => {

        if (!departmentId) return [];

        const res = await callFetchSectionsByDepartment(departmentId);

        const sections: ISection[] = res?.data ?? [];

        return sections.map((s) => ({
            label: s.name,
            value: s.id,
        }));

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
            form.setFieldValue("fileUrl", undefined);

        },

    };

    return (

        <ModalForm
            title={isEdit ? "Cập nhật quy trình" : "Tạo quy trình mới"}
            open={openModal}
            form={form}
            onFinish={submitForm}
            width={920}
            layout="vertical"
            modalProps={{
                onCancel: handleReset,
                destroyOnHidden: true,
                maskClosable: false,
                confirmLoading: isCreating || isUpdating,
            }}
        >

            <Row gutter={[20, 14]}>

                <Col xs={24} lg={12}>
                    {isEdit ? (
                        <Form.Item label="Công ty">
                            <Input
                                value={dataInit?.companyName}
                                disabled
                                style={{ background: "#f5f5f5", fontWeight: 500 }}
                            />
                        </Form.Item>
                    ) : (
                        <ProFormSelect
                            name="companyId"
                            label="Công ty"
                            request={loadCompanies}
                            rules={[{ required: true }]}
                            fieldProps={{
                                showSearch: true,
                                optionFilterProp: "label",
                                onChange: (val) => {

                                    setCompanyId(val as number);
                                    setDepartmentId(null);

                                    form.setFieldValue("departmentId", null);
                                    form.setFieldValue("sectionId", null);

                                },
                            }}
                        />
                    )}
                </Col>

                <Col xs={24} lg={12}>
                    {isEdit ? (
                        <Form.Item label="Phòng ban">
                            <Input
                                value={dataInit?.departmentName}
                                disabled
                                style={{ background: "#f5f5f5", fontWeight: 500 }}
                            />
                        </Form.Item>
                    ) : (
                        <ProFormSelect
                            name="departmentId"
                            label="Phòng ban"
                            request={loadDepartments}
                            params={{ companyId }}
                            rules={[{ required: true }]}
                            fieldProps={{
                                onChange: (val) => {

                                    setDepartmentId(val as number);
                                    form.setFieldValue("sectionId", null);

                                },
                            }}
                        />
                    )}
                </Col>

                <Col xs={24} lg={12}>
                    {isEdit ? (
                        <Form.Item label="Bộ phận">
                            <Input
                                value={dataInit?.sectionName}
                                disabled
                                style={{ background: "#f5f5f5", fontWeight: 500 }}
                            />
                        </Form.Item>
                    ) : (
                        <ProFormSelect
                            name="sectionId"
                            label="Bộ phận"
                            request={loadSections}
                            params={{ departmentId }}
                            rules={[{ required: true }]}
                        />
                    )}
                </Col>

                <Col xs={24} lg={12}>
                    <ProFormText
                        name="procedureName"
                        label="Tên quy trình"
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
                        initialValue={true}
                    />
                </Col>

                <Col xs={24}>
                    <Form.Item label="File quy trình (PDF)" required>

                        <div style={{ marginBottom: 10 }}>
                            <Radio.Group
                                value={fileMode}
                                onChange={(e) => setFileMode(e.target.value)}
                            >
                                <Radio.Button value="upload">Upload file</Radio.Button>
                                <Radio.Button value="url">Nhập link</Radio.Button>
                            </Radio.Group>
                        </div>

                        {fileMode === "upload" ? (
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined />} block>
                                    Chọn file PDF
                                </Button>
                            </Upload>
                        ) : (
                            <ProFormText
                                name="fileUrl"
                                placeholder="Nhập link file"
                                rules={[{ required: true }]}
                                fieldProps={{ prefix: <LinkOutlined /> }}
                            />
                        )}

                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <ProFormText
                        name="note"
                        label="Ghi chú"
                    />
                </Col>

            </Row>

        </ModalForm>

    );


};

export default ModalCompanyProcedure;
