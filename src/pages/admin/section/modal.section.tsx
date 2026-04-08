import { useEffect, useState } from "react";
import { ModalForm, ProFormText, ProFormSwitch, ProForm } from "@ant-design/pro-components";
import { Col, Form, Row, Tag } from "antd";
import type { ISection } from "@/types/backend";
import { DebounceSelect } from "@/components/common/debouce.select";
import { useCreateSectionMutation, useUpdateSectionMutation } from "@/hooks/useSections";
import { callFetchCompany, callFetchDepartmentsByCompany } from "@/config/api";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ISection | null;
    setDataInit: (v: any) => void;
    onSuccess?: () => void;
}

export interface ISelectOption {
    label: string;
    value: number;
}

const ModalSection = ({ openModal, setOpenModal, dataInit, setDataInit, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const { mutate: createSection, isPending: isCreating } = useCreateSectionMutation();
    const { mutate: updateSection, isPending: isUpdating } = useUpdateSectionMutation();

    const [selectedCompany, setSelectedCompany] = useState<ISelectOption | null>(null);
    const [selectedDept, setSelectedDept] = useState<ISelectOption | null>(null);
    const [deptOptions, setDeptOptions] = useState<ISelectOption[]>([]);
    const [loadingDept, setLoadingDept] = useState(false);

    // Khi chọn công ty → load phòng ban ngay, reset dept cũ
    const handleCompanyChange = async (v: any) => {
        setSelectedCompany(v ?? null);
        setSelectedDept(null);
        setDeptOptions([]);
        form.setFieldValue("department", undefined);

        if (v?.value) {
            setLoadingDept(true);
            try {
                const res = await callFetchDepartmentsByCompany(v.value);
                const opts = (res?.data ?? []).map((d: any) => ({
                    label: d.name,
                    value: d.id,
                }));
                setDeptOptions(opts);
            } finally {
                setLoadingDept(false);
            }
        }
    };

    /** Prefill form khi edit */
    useEffect(() => {
        if (dataInit?.id) {
            const dept: ISelectOption = {
                label: dataInit.department?.name ?? "",
                value: dataInit.department?.id ?? 0,
            };
            setSelectedDept(dept);
            form.setFieldsValue({
                code: dataInit.code,
                name: dataInit.name,
                department: dept,
                active: dataInit.active,
            });
        } else {
            form.resetFields();
            setSelectedCompany(null);
            setSelectedDept(null);
            setDeptOptions([]);
        }
    }, [dataInit, form]);

    /** Reset và đóng modal */
    const handleReset = () => {
        form.resetFields();
        setSelectedCompany(null);
        setSelectedDept(null);
        setDeptOptions([]);
        setDataInit(null);
        setOpenModal(false);
    };

    /** Load danh sách công ty (debounce search) */
    async function fetchCompanyList(input: string): Promise<ISelectOption[]> {
        const res = await callFetchCompany(`page=1&size=200&name=/${input}/i`);
        return (
            res?.data?.result?.map((c: any) => ({
                label: c.name,
                value: c.id,
            })) ?? []
        );
    }

    /** Submit */
    const submitForm = async (values: any) => {
        const payload = {
            id: dataInit?.id,
            code: values.code,
            name: values.name,
            departmentId: values.department?.value ?? selectedDept?.value,
            status: values.active ? 1 : 0,
        };

        if (isEdit) {
            updateSection(payload, {
                onSuccess: () => {
                    onSuccess?.();
                    handleReset();
                },
            });
        } else {
            createSection(payload, {
                onSuccess: () => {
                    onSuccess?.();
                    handleReset();
                },
            });
        }
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật bộ phận" : "Tạo mới bộ phận"}
            open={openModal}
            modalProps={{
                onCancel: handleReset,
                destroyOnClose: true,
                maskClosable: false,
                okText: isEdit ? "Cập nhật" : "Tạo mới",
                cancelText: "Hủy",
                confirmLoading: isCreating || isUpdating,
                width: 640,
            }}
            form={form}
            onFinish={submitForm}
        >
            <Row gutter={[16, 4]}>

                {/* ── BƯỚC 1: Chọn Công ty (chỉ hiện khi tạo mới) ── */}
                {!isEdit && (
                    <Col span={24}>
                        <ProForm.Item
                            name="company"
                            label="Công ty"
                            rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                        >
                            <DebounceSelect
                                allowClear
                                placeholder="🔍 Tìm và chọn công ty..."
                                fetchOptions={fetchCompanyList}
                                value={selectedCompany as any}
                                onChange={handleCompanyChange}
                                style={{ width: "100%" }}
                            />
                        </ProForm.Item>
                    </Col>
                )}

                {/* ── BƯỚC 2: Chọn Phòng ban (load theo công ty) ── */}
                <Col span={24}>
                    <ProForm.Item
                        name="department"
                        label={
                            <span>
                                Phòng ban{" "}
                                {!isEdit && selectedCompany && deptOptions.length > 0 && (
                                    <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>
                                        {deptOptions.length} phòng ban
                                    </Tag>
                                )}
                            </span>
                        }
                        rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
                    >
                        {isEdit ? (
                            // Khi edit: dùng DebounceSelect bình thường (không cần filter theo công ty)
                            <DebounceSelect
                                allowClear
                                placeholder="Chọn phòng ban"
                                fetchOptions={async (input) => {
                                    // Khi edit chỉ fetch lại dept list bình thường
                                    const res = await callFetchDepartmentsByCompany(
                                        dataInit?.department?.id ?? 0
                                    );
                                    return (res?.data ?? [])
                                        .filter((d: any) =>
                                            !input || d.name.toLowerCase().includes(input.toLowerCase())
                                        )
                                        .map((d: any) => ({ label: d.name, value: d.id }));
                                }}
                                value={selectedDept as any}
                                onChange={(v: any) => setSelectedDept(v ?? null)}
                                style={{ width: "100%" }}
                            />
                        ) : (
                            // Khi tạo mới: dùng Select thường từ deptOptions đã load sẵn
                            <DebounceSelect
                                allowClear
                                placeholder={
                                    !selectedCompany
                                        ? "← Chọn công ty trước"
                                        : loadingDept
                                            ? "Đang tải phòng ban..."
                                            : deptOptions.length === 0
                                                ? "Công ty chưa có phòng ban"
                                                : "Chọn phòng ban"
                                }
                                // Không fetch từ API, chỉ filter từ deptOptions đã có
                                fetchOptions={async (input) =>
                                    deptOptions.filter((d) =>
                                        !input || d.label.toLowerCase().includes(input.toLowerCase())
                                    )
                                }
                                value={selectedDept as any}
                                onChange={(v: any) => setSelectedDept(v ?? null)}
                                disabled={!selectedCompany || loadingDept}
                                style={{ width: "100%" }}
                                key={selectedCompany?.value ?? "no-company"}
                            />
                        )}
                    </ProForm.Item>
                </Col>

                {/* ── Mã & Tên bộ phận ── */}
                <Col span={12}>
                    <ProFormText
                        label="Mã bộ phận"
                        name="code"
                        rules={[{ required: true, message: "Vui lòng nhập mã bộ phận" }]}
                        placeholder="Nhập mã bộ phận"
                        disabled={isEdit}
                    />
                </Col>

                <Col span={12}>
                    <ProFormText
                        label="Tên bộ phận"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên bộ phận" }]}
                        placeholder="Nhập tên bộ phận"
                    />
                </Col>

                {/* ── Kích hoạt ── */}
                <Col span={24}>
                    <ProFormSwitch
                        name="active"
                        label="Kích hoạt"
                        initialValue={dataInit?.active ?? true}
                        checkedChildren="Bật"
                        unCheckedChildren="Tắt"
                    />
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalSection;