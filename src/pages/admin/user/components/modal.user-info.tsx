import { useState } from "react";
import dayjs from "dayjs";
import {
    ProForm,
    ProFormText,
    ProFormSwitch,
    ProFormDatePicker,
    ProFormSelect,
} from "@ant-design/pro-components";
import { Col, Row, Upload, Avatar, Typography, Tabs, Form } from "antd";
import { CameraOutlined, UserOutlined, IdcardOutlined, LockOutlined, CloseOutlined } from "@ant-design/icons";

import { DebounceSelect } from "@/components/common/debouce.select";
import { callFetchRole } from "@/config/api";
import ManagerPickerModal from "./ManagerPickerModal";
import { useUserPositionsQuery } from "@/hooks/useUserPositions";

const { Text } = Typography;

export interface IRoleSelect {
    label?: string;
    value: string | number;
    key?: string | number;
}

interface IProps {
    isEdit: boolean;
    avatarFile: File | null;
    previewUrl: string;
    selectedRole: IRoleSelect | null;
    setSelectedRole: (v: IRoleSelect | null) => void;
    selectedDirectManager: any | null;
    setSelectedDirectManager: (v: any | null) => void;
    onFileSelect: (file: File) => false;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    activeUserId?: string;
}

const ACCENT = "#f5317f";
const ACCENT_SOFT = "#fff0f6";
const BORDER = "#f0f0f0";
const TEXT_MAIN = "#111827";
const TEXT_MUTED = "#9ca3af";

const UserInfoForm = ({
    isEdit,
    avatarFile,
    previewUrl,
    selectedRole,
    setSelectedRole,
    selectedDirectManager,
    setSelectedDirectManager,
    onFileSelect,
    activeTab,
    setActiveTab,
    activeUserId,
}: IProps) => {
    const form = Form.useFormInstance();
    const [managerPickerOpen, setManagerPickerOpen] = useState(false);

    const { data: positions = [] } = useUserPositionsQuery(activeUserId);
    const activePositions = positions.filter((p: any) => p.active === true);
    const displayPositions = activePositions.length > 0 ? activePositions : (positions.length > 0 ? [positions[0]] : []);

    async function fetchRoleList(name: string): Promise<IRoleSelect[]> {
        const res = await callFetchRole(`page=1&size=100&name=/${name}/i`);
        if (res?.data) {
            return res.data.result.map((item: any) => ({
                label: item.name,
                value: item.id,
            }));
        }
        return [];
    }

    const avatarBlock = (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "18px 20px",
            borderRadius: 16,
            background: "#fafafa",
            border: `1.5px dashed ${BORDER}`,
            marginBottom: 24,
            transition: "border-color 0.2s",
        }}>
            <Upload showUploadList={false} accept="image/*" beforeUpload={onFileSelect}>
                <div style={{ position: "relative", cursor: "pointer" }}>
                    <Avatar
                        size={72}
                        src={previewUrl || undefined}
                        icon={<UserOutlined />}
                        style={{
                            border: `3px solid #fff`,
                            boxShadow: "0 4px 14px rgba(245,49,127,0.15)",
                            background: "#f5f5f5",
                            color: TEXT_MUTED,
                            fontSize: 28,
                            transition: "box-shadow 0.2s",
                        }}
                    />
                    <div style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: ACCENT,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2.5px solid #fff",
                        boxShadow: "0 2px 8px rgba(245,49,127,0.30)",
                    }}>
                        <CameraOutlined style={{ fontSize: 11, color: "#fff" }} />
                    </div>
                </div>
            </Upload>
            <div>
                <Text strong style={{
                    display: "block",
                    marginBottom: 3,
                    fontSize: 14,
                    color: TEXT_MAIN,
                    letterSpacing: "-0.01em",
                }}>
                    {avatarFile ? avatarFile.name : "Ảnh đại diện"}
                </Text>
                <Text style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: "1.5" }}>
                    {avatarFile
                        ? `${(avatarFile.size / 1024).toFixed(1)} KB`
                        : "Nhấn vào ảnh để tải lên · PNG, JPG tối đa 5MB"}
                </Text>
            </div>
        </div>
    );

    const labelStyle: React.CSSProperties = {
        fontSize: 13,
        fontWeight: 500,
        color: TEXT_MAIN,
        letterSpacing: "-0.01em",
    };

    const tabAccount = (
        <Row gutter={[16, 4]}>
            <Col span={24}>{avatarBlock}</Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProFormText
                    label={<span style={labelStyle}>Email</span>}
                    name="email"
                    disabled={isEdit}
                    rules={[
                        { required: !isEdit, message: "Vui lòng nhập email" },
                        { type: "email", message: "Email không hợp lệ" },
                    ]}
                    placeholder="Nhập email"
                    fieldProps={{ size: "large" }}
                />
            </Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProFormText.Password
                    label={<span style={labelStyle}>Mật khẩu</span>}
                    name="password"
                    disabled={isEdit}
                    placeholder={isEdit ? "••••••••" : "Nhập mật khẩu"}
                    fieldProps={{ size: "large" }}
                />
            </Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProFormText
                    label={<span style={labelStyle}>Tên hiển thị</span>}
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                    placeholder="Nhập tên hiển thị"
                    fieldProps={{ size: "large" }}
                />
            </Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProForm.Item
                    name="role"
                    label={<span style={labelStyle}>Vai trò</span>}
                    rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
                >
                    <DebounceSelect
                        allowClear
                        showSearch
                        size="large"
                        placeholder="Chọn vai trò" fetchOptions={fetchRoleList}
                        value={selectedRole as any}
                        onChange={(newValue: any) => setSelectedRole(newValue as IRoleSelect)}
                        style={{ width: "100%" }}
                    />
                </ProForm.Item>
            </Col>

            <Col span={24} style={{ marginTop: 4, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
                <ProFormSwitch
                    name="active"
                    label={<span style={labelStyle}>Kích hoạt tài khoản</span>}
                    checkedChildren="Bật"
                    unCheckedChildren="Tắt"
                    fieldProps={{ size: "default" }}
                />
            </Col>
        </Row>
    );

    const tabHR = (
        <Row gutter={[16, 4]}>
            <Col lg={12} md={12} sm={24} xs={24}>
                <ProFormText
                    label={<span style={labelStyle}>Mã nhân viên</span>}
                    name="employeeCode"
                    placeholder="Nhập mã nhân viên" fieldProps={{ size: "large" }}
                />
            </Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProFormText
                    label={<span style={labelStyle}>Số điện thoại</span>}
                    name="phone"
                    placeholder="Nhập số điện thoại"
                    fieldProps={{ size: "large" }}
                />
            </Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProFormSelect
                    label={<span style={labelStyle}>Giới tính</span>}
                    name="gender"
                    options={[
                        { label: "Nam", value: "MALE" },
                        { label: "Nữ", value: "FEMALE" },
                        { label: "Khác", value: "OTHER" },
                    ]}
                    placeholder="Chọn giới tính"
                    fieldProps={{ size: "large" }}
                />
            </Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProFormDatePicker
                    label={<span style={labelStyle}>Ngày sinh</span>}
                    name="dateOfBirth"
                    placeholder="DD-MM-YYYY"
                    fieldProps={{
                        format: "DD-MM-YYYY",
                        size: "large",
                        style: { width: "100%" },
                        defaultPickerValue: dayjs().subtract(25, "year"),
                        disabledDate: (d) => d && d > dayjs().endOf("day"),
                    }}
                />
            </Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProFormDatePicker
                    label={<span style={labelStyle}>Ngày vào làm</span>}
                    name="startDate"
                    placeholder="DD-MM-YYYY"
                    fieldProps={{
                        format: "DD-MM-YYYY",
                        size: "large",
                        style: { width: "100%" },
                    }}
                />
            </Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProFormDatePicker
                    label={<span style={labelStyle}>Ngày ký hợp đồng</span>}
                    name="contractSignDate"
                    placeholder="DD-MM-YYYY"
                    fieldProps={{
                        format: "DD-MM-YYYY",
                        size: "large",
                        style: { width: "100%" },
                    }}
                />
            </Col>

            <Col lg={12} md={12} sm={24} xs={24}>
                <ProForm.Item
                    name="directManagerId"
                    label={<span style={labelStyle}>Quản lý trực tiếp</span>}
                >
                    <div
                        onClick={() => setManagerPickerOpen(true)}
                        style={{
                            background: "#fff",
                            border: "1px solid #d9d9d9",
                            borderRadius: "8px",
                            padding: "10px 16px",
                            height: "42px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: 500,
                            color: selectedDirectManager ? "#111827" : "#9ca3af",
                            transition: "all 0.2s",
                            position: "relative"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = ACCENT}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "#d9d9d9"}
                    >
                        <span>
                            {selectedDirectManager ? selectedDirectManager.label.split(" - [")[0] : "Chọn quản lý trực tiếp"}
                        </span>
                        {selectedDirectManager && (
                            <CloseOutlined
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDirectManager(null);
                                    form.setFieldsValue({ directManagerId: undefined });
                                }}
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    color: "#9ca3af",
                                    fontSize: 12,
                                    cursor: "pointer"
                                }}
                            />
                        )}
                    </div>
                </ProForm.Item>
            </Col>

            <Col span={24} style={{ marginTop: 8 }}>
                <Form.Item label={<span style={labelStyle}>Chức danh & Đơn vị công tác</span>}>
                    {displayPositions.length === 0 ? (
                        <div style={{
                            background: "#fafafa",
                            border: "1px dashed #d9d9d9",
                            borderRadius: "8px",
                            padding: "14px 20px",
                            minHeight: "48px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            color: TEXT_MUTED,
                            textAlign: "center"
                        }}>
                            Chưa gán chức danh (Bạn có thể cấu hình ở bước "Gán chức danh" tiếp theo)
                        </div>
                    ) : (
                        displayPositions.map((pos: any, idx: number) => {
                            const jobTitle = pos.jobTitle?.nameVi || "Chưa gán";
                            const companyName = pos.company?.name || "";
                            const deptName = pos.department?.name || "";
                            const secName = pos.section?.name || "";
                            const unit = [companyName, deptName ? `${deptName}${secName ? ` (${secName})` : ""}` : secName].filter(Boolean).join(" / ") || "Chưa gán";
                            const sourceLabel = pos.source === "COMPANY" ? "Cấp Công ty" : pos.source === "DEPARTMENT" ? "Cấp Phòng ban" : "Cấp Bộ phận";

                            return (
                                <div key={pos.id || idx} style={{
                                    background: "#fafafa",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "10px",
                                    padding: "12px 16px",
                                    marginBottom: idx < displayPositions.length - 1 ? 8 : 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{jobTitle}</span>
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 500,
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            background: pos.source === "COMPANY" ? "#e6f4ff" : pos.source === "DEPARTMENT" ? "#f6ffed" : "#fff7e6",
                                            color: pos.source === "COMPANY" ? "#0958d9" : pos.source === "DEPARTMENT" ? "#389e0d" : "#d46b08",
                                            border: `1px solid ${pos.source === "COMPANY" ? "#91caff" : pos.source === "DEPARTMENT" ? "#b7eb8f" : "#ffd591"}`
                                        }}>
                                            {sourceLabel}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 13, color: "#6b7280" }}>{unit}</span>
                                </div>
                            );
                        })
                    )}
                </Form.Item>
            </Col>
        </Row>
    );

    return (
        <>
            <style>{`
    /* ===== Pill Tabs ===== */
    .elegant-tabs .ant-tabs-nav::before { border: none !important; }

    .elegant-tabs .ant-tabs-nav {
        background: #f7f7f8;
        border-radius: 12px;
        padding: 4px;
        margin-bottom: 24px;
        border: 1.5px solid #efefef;
    }

    .elegant-tabs .ant-tabs-nav-wrap {
        padding: 0;
        overflow: hidden !important;
    }

    .elegant-tabs .ant-tabs-nav-list {
        display: flex !important;
        width: 100%;
        flex-wrap: nowrap !important;
    }

    .elegant-tabs .ant-tabs-ink-bar {
        display: none !important;
    }

    /* ===== FIX CHÍNH Ở ĐÂY ===== */
    .elegant-tabs .ant-tabs-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 36px;

        border-radius: 8px !important;
        padding: 7px 0 !important; /* QUAN TRỌNG: bỏ padding ngang */
        margin: 0 !important;

        transition: all 0.22s ease;
        gap: 6px;
        box-sizing: border-box;
    }

    .elegant-tabs .ant-tabs-tab-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        color: #9ca3af;
        font-weight: 400;
        font-size: 13px;
        letter-spacing: -0.01em;
    }

    .elegant-tabs .ant-tabs-tab.ant-tabs-tab-active {
        background: #ffffff;
        box-shadow: 0 1px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
    }

    .elegant-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
        color: #111827 !important;
        font-weight: 600 !important;
    }

    .elegant-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
        color: #374151 !important;
    }

    /* ===== Form fields ===== */
    .elegant-form .ant-input-affix-wrapper,
    .elegant-form .ant-input,
    .elegant-form .ant-select-selector,
    .elegant-form .ant-picker {
        border-radius: 10px !important;
        border-color: #e5e7eb !important;
        background: #fff !important;
        transition: all 0.2s;
    }

    .elegant-form .ant-input-affix-wrapper:hover,
    .elegant-form .ant-input:hover,
    .elegant-form .ant-select-selector:hover,
    .elegant-form .ant-picker:hover {
        border-color: #d1d5db !important;
    }

    .elegant-form .ant-input-affix-wrapper:focus-within,
    .elegant-form .ant-input:focus,
    .elegant-form .ant-select-focused .ant-select-selector,
    .elegant-form .ant-picker-focused {
        border-color: ${ACCENT} !important;
        box-shadow: 0 0 0 3px ${ACCENT_SOFT} !important;
    }

    .elegant-form .ant-form-item-label > label {
        height: auto !important;
        margin-bottom: 4px;
    }

    /* ===== Switch ===== */
    .ant-switch-checked {
        background: ${ACCENT} !important;
    }

    /* ===== Upload hover ===== */
    .ant-upload:hover .ant-avatar {
        box-shadow: 0 6px 20px rgba(245,49,127,0.25) !important;
    }
`}</style>

            <div className="elegant-form">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    size="middle"
                    className="elegant-tabs"
                    style={{ marginTop: -4 }}
                    items={[
                        {
                            key: "account",
                            forceRender: true,
                            label: (
                                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                                    <LockOutlined style={{ fontSize: 13 }} />
                                    Tài khoản
                                </span>
                            ),
                            children: tabAccount,
                        },
                        {
                            key: "hr",
                            forceRender: true,
                            label: (
                                <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                                    <IdcardOutlined style={{ fontSize: 13 }} />
                                    Thông tin nhân sự
                                </span>
                            ),
                            children: tabHR,
                        },
                    ]}
                />
            </div>
            <ManagerPickerModal
                open={managerPickerOpen}
                onClose={() => setManagerPickerOpen(false)}
                title="Danh sách Quản lý trực tiếp"
                description="Chọn người dùng làm Quản lý trực tiếp của nhân viên"
                onSelect={(mgr: any) => {
                    const deptOrComp = [mgr.departmentName, mgr.companyName].filter(Boolean).join(" - ");
                    const label = `${mgr.name}${deptOrComp ? ` - [${deptOrComp}]` : ""}`;
                    const newValue = { label, value: mgr.id };
                    setSelectedDirectManager(newValue);
                    form.setFieldsValue({ directManagerId: newValue });
                }}
            />
        </>
    );
};

export default UserInfoForm;
