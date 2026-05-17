import { useEffect, useState } from "react";
import { ModalForm, ProFormText, ProFormSwitch, ProForm } from "@ant-design/pro-components";
import { Col, Form, Row, Tag } from "antd";

import type { ISection } from "@/types/backend";
import { DebounceSelect } from "@/components/common/debouce.select";
import { useCreateSectionMutation, useUpdateSectionMutation } from "@/hooks/useSections";
import { callFetchCompany, callFetchDepartmentsByCompany } from "@/config/api";
import { useIsMobile, useModalWidth } from "@/components/common/modal/detail";

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
    const [form]      = Form.useForm() as any; // keep existing Form hook pattern
    const isEdit      = Boolean(dataInit?.id);
    const isMobile    = useIsMobile();
    const modalWidth  = useModalWidth(600);

    const { mutate: createSection, isPending: isCreating } = useCreateSectionMutation();
    const { mutate: updateSection, isPending: isUpdating } = useUpdateSectionMutation();

    const [selectedCompany, setSelectedCompany] = useState<ISelectOption | null>(null);
    const [selectedDept,    setSelectedDept]    = useState<ISelectOption | null>(null);
    const [deptOptions,     setDeptOptions]     = useState<ISelectOption[]>([]);
    const [loadingDept,     setLoadingDept]     = useState(false);

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
                const opts = (res?.data ?? []).map((d: any) => ({ label: d.name, value: d.id }));
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
            res?.data?.result?.map((c: any) => ({ label: c.name, value: c.id })) ?? []
        );
    }

    /** Submit — giữ nguyên logic gốc */
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
                onSuccess: () => { onSuccess?.(); handleReset(); },
            });
        } else {
            createSection(payload, {
                onSuccess: () => { onSuccess?.(); handleReset(); },
            });
        }
    };

    return (
        <>
            <style>{`
                .section-form-modal .ant-modal-content {
                    border-radius: 16px !important;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.06) !important;
                    overflow: hidden; padding: 0 !important;
                }
                .section-form-modal .ant-modal-header {
                    padding: ${isMobile ? "14px 16px 0" : "18px 24px 0"} !important;
                    border-bottom: none !important;
                    background: #fff !important; margin-bottom: 0 !important;
                }
                .section-form-modal .ant-modal-title {
                    font-size: 15px !important; font-weight: 700 !important;
                    color: #111827 !important; letter-spacing: -0.03em !important;
                }
                .section-form-modal .ant-modal-body {
                    padding: ${isMobile ? "14px 16px 4px" : "16px 24px 4px"} !important;
                }
                .section-form-modal .ant-modal-footer {
                    padding: ${isMobile ? "10px 16px 14px" : "10px 24px 18px"} !important;
                    border-top: 1.5px solid #f3f4f6 !important; margin-top: 0 !important;
                }
                .section-form-modal .ant-modal-close {
                    top: 12px !important; right: 18px !important;
                    width: 28px !important; height: 28px !important;
                    border-radius: 8px !important; background: #f7f7f8 !important;
                    border: 1.5px solid #efefef !important;
                    display: flex !important; align-items: center !important;
                    justify-content: center !important; transition: all 0.2s !important;
                }
                .section-form-modal .ant-modal-close:hover {
                    background: #f0f0f0 !important; border-color: #e0e0e0 !important;
                }
                .section-form-modal .ant-modal-close .ant-modal-close-x {
                    width: 28px !important; height: 28px !important;
                    line-height: 28px !important; font-size: 12px !important; color: #6b7280 !important;
                }
                .section-form-modal .ant-btn-primary {
                    background: #f5317f !important; border-color: #f5317f !important;
                    border-radius: 8px !important; font-weight: 600 !important;
                    box-shadow: 0 2px 8px rgba(245,49,127,0.25) !important;
                }
                .section-form-modal .ant-btn-primary:hover {
                    background: #d4206a !important; border-color: #d4206a !important;
                }
                .section-form-modal .ant-btn-default {
                    border-radius: 8px !important; border-color: #e5e7eb !important; color: #6b7280 !important;
                }
                .section-form-modal .ant-form-item-label > label {
                    font-size: 13px !important; font-weight: 500 !important; color: #374151 !important;
                }
                .section-form-modal .ant-input,
                .section-form-modal .ant-select-selector {
                    border-radius: 8px !important; border-color: #e5e7eb !important;
                }
                .section-form-modal .ant-input:focus,
                .section-form-modal .ant-select-focused .ant-select-selector {
                    border-color: #f5317f !important;
                    box-shadow: 0 0 0 3px rgba(245,49,127,0.10) !important;
                }
                .section-form-modal .ant-switch-checked {
                    background: #f5317f !important;
                }
            `}</style>

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
                    width: modalWidth,
                    centered: true,
                    className: "section-form-modal",
                    styles: {
                        mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.2)" },
                    },
                }}
                form={form}
                onFinish={submitForm}
            >
                <Row gutter={[16, 4]}>

                    {/* ── Chọn Công ty (chỉ hiện khi tạo mới) ── */}
                    {!isEdit && (
                        <Col span={24}>
                            <ProForm.Item
                                name="company"
                                label="Công ty"
                                rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                            >
                                <DebounceSelect
                                    allowClear
                                    size="large"
                                    placeholder="🔍 Tìm và chọn công ty..."
                                    fetchOptions={fetchCompanyList}
                                    value={selectedCompany as any}
                                    onChange={handleCompanyChange}
                                    style={{ width: "100%" }}
                                />
                            </ProForm.Item>
                        </Col>
                    )}

                    {/* ── Chọn Phòng ban (load theo công ty) ── */}
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
                                <DebounceSelect
                                    allowClear
                                    size="large"
                                    placeholder="Chọn phòng ban"
                                    fetchOptions={async (input) => {
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
                                <DebounceSelect
                                    allowClear
                                    size="large"
                                    placeholder={
                                        !selectedCompany
                                            ? "← Chọn công ty trước"
                                            : loadingDept
                                                ? "Đang tải phòng ban..."
                                                : deptOptions.length === 0
                                                    ? "Công ty chưa có phòng ban"
                                                    : "Chọn phòng ban"
                                    }
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
                    <Col xs={24} sm={12}>
                        <ProFormText
                            label="Mã bộ phận"
                            name="code"
                            rules={[{ required: true, message: "Vui lòng nhập mã bộ phận" }]}
                            placeholder="Nhập mã bộ phận"
                            disabled={isEdit}
                            fieldProps={{ size: "large" }}
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <ProFormText
                            label="Tên bộ phận"
                            name="name"
                            rules={[{ required: true, message: "Vui lòng nhập tên bộ phận" }]}
                            placeholder="Nhập tên bộ phận"
                            fieldProps={{ size: "large" }}
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
        </>
    );
};

export default ModalSection;