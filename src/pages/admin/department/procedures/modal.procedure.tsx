// import { Modal, Form, Input, InputNumber, Select, Switch, Row, Col } from "antd";
// import { useEffect } from "react";
// import { useParams } from "react-router-dom";

// import type { IDepartmentProcedure } from "@/types/backend";

// import {
//     useCreateDepartmentProcedureMutation,
//     useUpdateDepartmentProcedureMutation,
// } from "@/hooks/useDepartmentProcedures";

// import { useSectionsByDepartmentQuery } from "@/hooks/useSections";

// interface IProps {
//     open: boolean;
//     onClose: () => void;
//     dataInit: IDepartmentProcedure | null;
//     refetch: () => void;
// }

// const ModalProcedure = ({ open, onClose, dataInit, refetch }: IProps) => {

//     const { departmentId } = useParams();
//     const [form] = Form.useForm();

//     const createMutation = useCreateDepartmentProcedureMutation();
//     const updateMutation = useUpdateDepartmentProcedureMutation();

//     const { data: sections } = useSectionsByDepartmentQuery(
//         departmentId ? Number(departmentId) : undefined
//     );

//     useEffect(() => {

//         if (dataInit) {
//             form.setFieldsValue(dataInit);
//         } else {
//             form.resetFields();
//             form.setFieldsValue({
//                 departmentId: Number(departmentId),
//                 active: true,
//             });
//         }

//     }, [dataInit, departmentId, form]);

//     const onFinish = async (values: any) => {

//         const payload: IDepartmentProcedure = {
//             ...values,
//             departmentId: Number(departmentId),
//             companyId: values.companyId ?? dataInit?.companyId ?? 1,
//         };

//         if (dataInit?.id) {
//             await updateMutation.mutateAsync({
//                 ...payload,
//                 id: dataInit.id,
//             });
//         } else {
//             await createMutation.mutateAsync(payload);
//         }

//         refetch();
//         onClose();
//         form.resetFields();
//     };

//     return (
//         <Modal
//             open={open}
//             title={dataInit ? "Cập nhật quy trình phòng ban" : "Thêm quy trình phòng ban"}
//             onCancel={onClose}
//             onOk={() => form.submit()}
//             width={700}
//             destroyOnClose
//             okText={dataInit ? "Cập nhật" : "Tạo mới"}
//             cancelText="Hủy"
//         >
//             <Form
//                 layout="vertical"
//                 form={form}
//                 onFinish={onFinish}
//             >

//                 <Row gutter={16}>

//                     <Col span={24}>
//                         <Form.Item
//                             label="Tên quy trình"
//                             name="procedureName"
//                             rules={[
//                                 { required: true, message: "Nhập tên quy trình" },
//                             ]}
//                         >
//                             <Input
//                                 placeholder="Nhập tên quy trình..."
//                             />
//                         </Form.Item>
//                     </Col>

//                     <Col span={12}>
//                         <Form.Item
//                             label="Bộ phận"
//                             name="sectionId"
//                             rules={[
//                                 { required: true, message: "Chọn bộ phận" },
//                             ]}
//                         >
//                             <Select
//                                 placeholder="Chọn bộ phận"
//                                 allowClear
//                                 showSearch
//                                 optionFilterProp="label"
//                                 options={
//                                     sections?.map((s) => ({
//                                         label: s.name,
//                                         value: s.id,
//                                     })) || []
//                                 }
//                             />
//                         </Form.Item>
//                     </Col>

//                     <Col span={12}>
//                         <Form.Item
//                             label="Năm kế hoạch"
//                             name="planYear"
//                             rules={[
//                                 {
//                                     type: "number",
//                                     min: 2000,
//                                     max: 2100,
//                                     message: "Năm không hợp lệ",
//                                 },
//                             ]}
//                         >
//                             <InputNumber
//                                 style={{ width: "100%" }}
//                                 placeholder="VD: 2026"
//                             />
//                         </Form.Item>
//                     </Col>

//                     <Col span={12}>
//                         <Form.Item
//                             label="Trạng thái"
//                             name="status"
//                         >
//                             <Select
//                                 placeholder="Chọn trạng thái"
//                                 options={[
//                                     { label: "Cần tạo", value: "NEED_CREATE" },
//                                     { label: "Đang thực hiện", value: "IN_PROGRESS" },
//                                     { label: "Cần cập nhật", value: "NEED_UPDATE" },
//                                     { label: "Kết thúc", value: "TERMINATED" },
//                                 ]}
//                             />
//                         </Form.Item>
//                     </Col>

//                     <Col span={12}>
//                         <Form.Item
//                             label="Hoạt động"
//                             name="active"
//                             valuePropName="checked"
//                         >
//                             <Switch />
//                         </Form.Item>
//                     </Col>

//                     <Col span={24}>
//                         <Form.Item
//                             label="File quy trình"
//                             name="fileUrl"
//                         >
//                             <Input
//                                 placeholder="Link file quy trình..."
//                             />
//                         </Form.Item>
//                     </Col>

//                     <Col span={24}>
//                         <Form.Item
//                             label="Ghi chú"
//                             name="note"
//                         >
//                             <Input.TextArea
//                                 rows={3}
//                                 placeholder="Nhập ghi chú..."
//                             />
//                         </Form.Item>
//                     </Col>

//                 </Row>

//             </Form>
//         </Modal>
//     );
// };

// export default ModalProcedure;