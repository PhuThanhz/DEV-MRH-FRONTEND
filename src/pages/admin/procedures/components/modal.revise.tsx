import React, { useEffect, useState } from "react";
import {
    ModalForm,
    ProFormText,
    ProFormSelect,
} from "@ant-design/pro-components";

import {
    Col, Form, Row, message, Upload, Button, Input, Tag,
} from "antd";

import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";

import {
    callFetchDepartmentsByCompany,
    callFetchSectionsByDepartment,
    callUploadSingleFile,
} from "@/config/api";

import type {
    IProcedure, IProcedureRequest, ProcedureType, IDepartment, ISection,
} from "@/types/backend";

import { useReviseProcedureMutation } from "@/hooks/useProcedure";

interface IProps {
    type: ProcedureType;
    open: boolean;
    onClose: () => void;
    dataInit: IProcedure | null;
    refetch: () => void;
}

const ModalRevise: React.FC<IProps> = ({
    type,
    open,
    onClose,
    dataInit,
    refetch,
}) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [departmentId, setDepartmentId] = useState<number | null>(null);

    const reviseMutation = useReviseProcedureMutation(type);

    useEffect(() => {
        if (!open || !dataInit) return;

        const urls = dataInit.fileUrls ?? [];
        form.setFieldsValue({
            procedureCode: dataInit.procedureCode ?? "",  // ← THÊM MỚI
            departmentId: dataInit.departmentId,
            sectionId: dataInit.sectionId,
            procedureName: dataInit.procedureName,
            status: dataInit.status,
            planYear: dataInit.planYear,
            note: dataInit.note,
            fileUrls: urls,
        });
        setDepartmentId(dataInit.departmentId ?? null);
        setFileList(
            urls.map((name, i) => ({
                uid: String(i),
                name,
                status: "done" as const,
                url: `/api/v1/files?fileName=${encodeURIComponent(name)}&folder=procedures`,
                response: name,
            }))
        );
    }, [open, dataInit]);

    const handleReset = () => {
        form.resetFields();
        setFileList([]);
        setDepartmentId(null);
        onClose();
    };

    const submitForm = async (values: any) => {
        if (!dataInit?.id) return;

        const payload: IProcedureRequest = {
            procedureCode: (values.procedureCode ?? "").trim().toUpperCase(), // ← THÊM MỚI
            procedureName: values.procedureName,
            status: values.status,
            planYear: values.planYear ? Number(values.planYear) : undefined,
            fileUrls: values.fileUrls ?? [],
            note: values.note,
            departmentId: values.departmentId ?? dataInit.departmentId ?? null,
            sectionId: values.sectionId ?? null,
        };

        await reviseMutation.mutateAsync({ id: dataInit.id, data: payload });
        refetch();
        handleReset();
    };

    const loadDepartments = async ({ companyId }: any) => {
        if (!companyId) return [];
        const res = await callFetchDepartmentsByCompany(companyId);
        const departments: IDepartment[] = res?.data ?? [];
        return departments.map((d) => ({ label: d.name, value: d.id }));
    };

    const loadSections = async ({ departmentId }: any) => {
        if (!departmentId) return [];
        const res = await callFetchSectionsByDepartment(departmentId);
        const sections: ISection[] = res?.data ?? [];
        return sections.map((s) => ({ label: s.name, value: s.id }));
    };

    const uploadProps: UploadProps = {
        fileList,
        accept: ".pdf,.doc,.docx,.xls,.xlsx",
        beforeUpload: async (file) => {
            const allowed = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ];
            if (!allowed.includes(file.type)) {
                message.error("Chỉ chấp nhận file PDF, Word, Excel!");
                return Upload.LIST_IGNORE;
            }
            if (file.size / 1024 / 1024 >= 20) {
                message.error("File phải nhỏ hơn 20MB!");
                return Upload.LIST_IGNORE;
            }

            const tempUid = Date.now().toString();
            setFileList((prev) => [...prev, { uid: tempUid, name: file.name, status: "uploading" }]);

            try {
                setUploading(true);
                const res = await callUploadSingleFile(file, "procedures");
                const fileName = res?.data?.fileName;
                if (!fileName) throw new Error();

                setFileList((prev) =>
                    prev.map((f) =>
                        f.uid === tempUid
                            ? {
                                ...f,
                                status: "done" as const,
                                url: `/api/v1/files?fileName=${encodeURIComponent(fileName)}&folder=procedures`,
                                response: fileName,
                            }
                            : f
                    )
                );

                const current: string[] = form.getFieldValue("fileUrls") ?? [];
                form.setFieldValue("fileUrls", [...current, fileName]);
                message.success(`Upload ${file.name} thành công!`);
            } catch {
                setFileList((prev) => prev.filter((f) => f.uid !== tempUid));
                message.error("Upload file thất bại!");
            } finally {
                setUploading(false);
            }

            return false;
        },
        onRemove: (file) => {
            setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
            const removed = (file as any).response ?? file.name;
            const current: string[] = form.getFieldValue("fileUrls") ?? [];
            form.setFieldValue("fileUrls", current.filter((u) => u !== removed));
        },
    };

    const isLoading = reviseMutation.isPending || uploading;
    const currentVersion = dataInit?.version ?? 1;
    const nextVersion = currentVersion + 1;

    return (
        <ModalForm
            title={
                <span>
                    Cập nhật phiên bản{" "}
                    <Tag color="blue">v{currentVersion}</Tag>
                    →{" "}
                    <Tag color="green">v{nextVersion}</Tag>
                    {dataInit?.procedureName && (
                        <span style={{ fontWeight: 400, fontSize: 13, color: "#666", marginLeft: 8 }}>
                            {dataInit.procedureName}
                        </span>
                    )}
                </span>
            }
            open={open}
            form={form}
            onFinish={submitForm}
            width={920}
            layout="vertical"
            modalProps={{
                onCancel: handleReset,
                destroyOnHidden: true,
                maskClosable: false,
                confirmLoading: isLoading,
                okText: `Tạo phiên bản v${nextVersion}`,
            }}
        >
            {/* Hidden field lưu fileUrls */}
            <Form.Item name="fileUrls" hidden>
                <Input />
            </Form.Item>

            {/* Banner cảnh báo */}
            <div style={{
                background: "#fffbe6",
                border: "1px solid #ffe58f",
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#7c4f00",
            }}>
                Phiên bản hiện tại <strong>v{currentVersion}</strong> sẽ được lưu vào lịch sử.
                Vui lòng cập nhật thông tin và file tài liệu mới cho phiên bản <strong>v{nextVersion}</strong>.
            </div>

            <Row gutter={[20, 14]}>

                {/* Công ty */}
                <Col xs={24} lg={12}>
                    <Form.Item label="Công ty">
                        <Input
                            value={dataInit?.companyName}
                            disabled
                            style={{ background: "#f5f5f5", fontWeight: 500 }}
                        />
                    </Form.Item>
                </Col>

                {/* Phòng ban */}
                <Col xs={24} lg={12}>
                    <Form.Item label="Phòng ban">
                        <Input
                            value={dataInit?.departmentName}
                            disabled
                            style={{ background: "#f5f5f5", fontWeight: 500 }}
                        />
                    </Form.Item>
                </Col>

                {/* Bộ phận */}
                <Col xs={24} lg={12}>
                    <Form.Item label="Bộ phận">
                        <Input
                            value={dataInit?.sectionName || "--"}
                            disabled
                            style={{ background: "#f5f5f5" }}
                        />
                    </Form.Item>
                </Col>

                {/* Mã quy trình */}  {/* ← THÊM MỚI */}
                <Col xs={24} lg={12}>
                    <ProFormText
                        name="procedureCode"
                        label="Mã quy trình"
                        rules={[{ required: true, message: "Nhập mã quy trình" }]}
                        placeholder="VD: QT-001"
                        fieldProps={{
                            style: { textTransform: "uppercase" },
                            onChange: (e) =>
                                form.setFieldValue("procedureCode", e.target.value.toUpperCase()),
                        }}
                    />
                </Col>

                {/* Tên quy trình */}
                <Col xs={24} lg={12}>
                    <ProFormText
                        name="procedureName"
                        label="Tên quy trình"
                        rules={[{ required: true, message: "Nhập tên quy trình" }]}
                        placeholder="Nhập tên quy trình..."
                    />
                </Col>

                {/* Trạng thái */}
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

                {/* Năm kế hoạch */}
                <Col xs={24} lg={12}>
                    <ProFormText
                        name="planYear"
                        label="Kế hoạch năm"
                        fieldProps={{ type: "number" }}
                        placeholder="VD: 2026"
                    />
                </Col>

                {/* File quy trình */}
                <Col xs={24}>
                    <Form.Item
                        label={
                            <span>
                                File quy trình{" "}
                                <Tag color="green" style={{ marginLeft: 4 }}>
                                    Nên cập nhật file mới cho v{nextVersion}
                                </Tag>
                            </span>
                        }
                    >
                        <Upload {...uploadProps}>
                            <Button
                                icon={<UploadOutlined />}
                                loading={uploading}
                                disabled={uploading}
                            >
                                {uploading ? "Đang upload..." : "Thêm file PDF, Word, Excel"}
                            </Button>
                        </Upload>
                    </Form.Item>
                </Col>

                {/* Ghi chú */}
                <Col xs={24}>
                    <ProFormText
                        name="note"
                        label="Ghi chú thay đổi"
                        placeholder="Mô tả những thay đổi trong phiên bản mới..."
                    />
                </Col>

            </Row>
        </ModalForm>
    );
};

export default ModalRevise;