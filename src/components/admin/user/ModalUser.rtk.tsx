import { ModalForm, ProForm, ProFormDigit, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row, message, notification } from "antd";
import { isMobile } from "react-device-detect";
import { useState, useEffect } from "react";
import type { IUser } from "@/types/backend";
import { DebounceSelect } from "./debouce.select";
import { useCreateUserMutation, useUpdateUserMutation } from "@/redux/api/userApi";
import { useGetRolesQuery } from "@/redux/api/roleApi";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IUser | null;
    setDataInit: (v: any) => void;
    reloadTable: () => void;
}

export interface ICompanySelect {
    label: string;
    value: string;
    key?: string;
}

const ModalUser = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [companies, setCompanies] = useState<ICompanySelect[]>([]);
    const [roles, setRoles] = useState<ICompanySelect[]>([]);
    const [form] = Form.useForm();

    // ✅ RTK hooks
    const [createUser, { isLoading: creating }] = useCreateUserMutation();
    const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
    const { data: rolesData } = useGetRolesQuery("page=1&size=100");

    // ✅ Map role list khi mở modal
    async function fetchRoleList(name: string): Promise<ICompanySelect[]> {
        const res = rolesData?.data?.result || [];
        const filtered = name
            ? res.filter((r: any) => r.name.toLowerCase().includes(name.toLowerCase()))
            : res;
        return filtered.map((item: any) => ({
            label: item.name,
            value: item.id,
        }));
    }

    // ✅ Load data khi sửa
    useEffect(() => {
        if (dataInit?.id) {
            if (dataInit.company) {
                setCompanies([
                    {
                        label: dataInit.company.name,
                        value: dataInit.company.id,
                        key: dataInit.company.id,
                    },
                ]);
            }
            if (dataInit.role) {
                setRoles([
                    {
                        label: dataInit.role?.name,
                        value: dataInit.role?.id,
                        key: dataInit.role?.id,
                    },
                ]);
            }
            form.setFieldsValue({
                ...dataInit,
                role: { label: dataInit.role?.name, value: dataInit.role?.id },
                company: { label: dataInit.company?.name, value: dataInit.company?.id },
            });
        }
    }, [dataInit]);

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setCompanies([]);
        setRoles([]);
        setOpenModal(false);
    };

    // ✅ Submit bằng RTK Query
    const submitUser = async (valuesForm: any) => {
        const { name, email, password, address, age, gender, role, company } = valuesForm;
        const payload = {
            name,
            email,
            password,
            age,
            gender,
            address,
            role: { id: role.value, name: "" },
            company: { id: company.value, name: company.label },
        };

        try {
            if (dataInit?.id) {
                const res: any = await updateUser({ ...payload, id: dataInit.id }).unwrap();
                if (res?.data) {
                    message.success("Cập nhật user thành công");
                    handleReset();
                    reloadTable();
                }
            } else {
                const res: any = await createUser(payload).unwrap();
                if (res?.data) {
                    message.success("Thêm mới user thành công");
                    handleReset();
                    reloadTable();
                }
            }
        } catch (error: any) {
            notification.error({
                message: "Có lỗi xảy ra",
                description: error?.data?.message ?? "Không xác định được lỗi",
            });
        }
    };

    return (
        <ModalForm
            title={<>{dataInit?.id ? "Cập nhật User" : "Tạo mới User"}</>}
            open={openModal}
            modalProps={{
                onCancel: handleReset,
                afterClose: handleReset,
                destroyOnClose: true,
                width: isMobile ? "100%" : 900,
                keyboard: false,
                maskClosable: false,
                okText: <>{dataInit?.id ? "Cập nhật" : "Tạo mới"}</>,
                cancelText: "Hủy",
                confirmLoading: creating || updating,
            }}
            scrollToFirstError
            preserve={false}
            form={form}
            onFinish={submitUser}
        >
            <Row gutter={16}>
                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProFormText
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Vui lòng không bỏ trống" },
                            { type: "email", message: "Vui lòng nhập email hợp lệ" },
                        ]}
                        placeholder="Nhập email"
                    />
                </Col>
                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProFormText.Password
                        disabled={!!dataInit?.id}
                        label="Password"
                        name="password"
                        rules={[
                            { required: !dataInit?.id, message: "Vui lòng không bỏ trống" },
                        ]}
                        placeholder="Nhập password"
                    />
                </Col>
                <Col lg={6} md={6} sm={24} xs={24}>
                    <ProFormText
                        label="Tên hiển thị"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng không bỏ trống" }]}
                        placeholder="Nhập tên hiển thị"
                    />
                </Col>
                <Col lg={6} md={6} sm={24} xs={24}>
                    <ProFormDigit
                        label="Tuổi"
                        name="age"
                        rules={[{ required: true, message: "Vui lòng không bỏ trống" }]}
                        placeholder="Nhập tuổi"
                    />
                </Col>
                <Col lg={6} md={6} sm={24} xs={24}>
                    <ProFormSelect
                        name="gender"
                        label="Giới tính"
                        valueEnum={{
                            MALE: "Nam",
                            FEMALE: "Nữ",
                            OTHER: "Khác",
                        }}
                        placeholder="Chọn giới tính"
                        rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
                    />
                </Col>
                <Col lg={6} md={6} sm={24} xs={24}>
                    <ProForm.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
                    >
                        <DebounceSelect
                            allowClear
                            showSearch
                            defaultValue={roles}
                            value={roles}
                            placeholder="Chọn vai trò"
                            fetchOptions={fetchRoleList}
                            onChange={(newValue: any) => {
                                if (newValue?.length === 0 || newValue?.length === 1) {
                                    setRoles(newValue as ICompanySelect[]);
                                }
                            }}
                            style={{ width: "100%" }}
                        />
                    </ProForm.Item>
                </Col>

                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProFormText
                        label="Địa chỉ"
                        name="address"
                        rules={[{ required: true, message: "Vui lòng không bỏ trống" }]}
                        placeholder="Nhập địa chỉ"
                    />
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalUser;
