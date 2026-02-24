import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { Col, Row } from "antd";
import { isMobile } from "react-device-detect";

import type { ICompany } from "@/types/backend";
import {
    useCreateCompanyMutation,
    useUpdateCompanyMutation,
} from "@/hooks/useCompanies";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ICompany | null;
    setDataInit: (v: any) => void;
}

const ModalCompany = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: IProps) => {
    const isEdit = Boolean(dataInit?.id);

    const createMutation = useCreateCompanyMutation();
    const updateMutation = useUpdateCompanyMutation();

    const handleClose = () => {
        setDataInit(null);
        setOpenModal(false);
    };

    const submitCompany = async (values: any) => {
        if (isEdit) {
            updateMutation.mutate(
                {
                    id: dataInit!.id,
                    name: values.name,
                    englishName: values.englishName,
                },
                { onSuccess: handleClose }
            );
        } else {
            createMutation.mutate(values, {
                onSuccess: handleClose,
            });
        }
    };

    return (
        <ModalForm
            key={dataInit?.id ?? "create"} // ⭐ CỰC KỲ QUAN TRỌNG
            title={isEdit ? "Cập nhật công ty" : "Tạo mới công ty"}
            open={openModal}
            onFinish={submitCompany}
            initialValues={
                isEdit
                    ? {
                        code: dataInit?.code,
                        name: dataInit?.name,
                        englishName: dataInit?.englishName,
                    }
                    : {}
            }
            preserve={false}
            modalProps={{
                onCancel: handleClose,
                afterClose: handleClose,
                destroyOnClose: true,
                width: isMobile ? "100%" : 600,
                maskClosable: false,
                okText: isEdit ? "Cập nhật" : "Tạo mới",
                cancelText: "Hủy",
                confirmLoading:
                    createMutation.isPending || updateMutation.isPending,
            }}
        >
            <Row gutter={[16, 12]}>
                {/* MÃ CÔNG TY */}
                <Col span={24}>
                    <ProFormText
                        label="Mã công ty"
                        name="code"
                        disabled={isEdit}
                        rules={[
                            { required: true, message: "Vui lòng nhập mã công ty" },
                        ]}
                        placeholder="VD: LOTUS, HRM, ABC_CORP"
                    />
                </Col>

                {/* TÊN VI */}
                <Col span={24}>
                    <ProFormText
                        label="Tên công ty (Tiếng Việt)"
                        name="name"
                        rules={[
                            { required: true, message: "Vui lòng nhập tên công ty" },
                        ]}
                        placeholder="VD: Công ty TNHH Hoa Sen"
                    />
                </Col>

                {/* TÊN EN */}
                <Col span={24}>
                    <ProFormText
                        label="Tên công ty (Tiếng Anh)"
                        name="englishName"
                        placeholder="VD: Hoa Sen Company Limited"
                    />
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalCompany;
