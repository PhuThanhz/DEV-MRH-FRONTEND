import { Modal, Form, Input, Button, DatePicker } from "antd";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { callCreateEvaluationPeriod, callUpdateEvaluationPeriod } from "@/config/api";
import type { IEvaluationPeriod } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    reloadTable: () => void;
    dataInit?: IEvaluationPeriod | null;
    setDataInit?: (v: IEvaluationPeriod | null) => void;
}

const PeriodModal = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [form] = Form.useForm();
    const [isSubmit, setIsSubmit] = useState(false);

    useEffect(() => {
        if (openModal) {
            if (dataInit) {
                form.setFieldsValue({
                    name: dataInit.name,
                    description: dataInit.description,
                    employeeStartDate: dataInit.employeeStartDate ? dayjs(dataInit.employeeStartDate) : null,
                    employeeDeadline: dataInit.employeeDeadline ? dayjs(dataInit.employeeDeadline) : null,
                    managerDeadline: dataInit.managerDeadline ? dayjs(dataInit.managerDeadline) : null,
                    approvalDeadline: dataInit.approvalDeadline ? dayjs(dataInit.approvalDeadline) : null,
                });
            } else {
                form.resetFields();
            }
        }
    }, [openModal, dataInit, form]);

    const onFinish = async (values: any) => {
        const { employeeStartDate, employeeDeadline, managerDeadline, approvalDeadline } = values;

        // Strict chronological validation on Frontend
        if (employeeStartDate && employeeDeadline && employeeStartDate.isAfter(employeeDeadline)) {
            notify.error("Ngày mở cổng phải diễn ra trước Hạn chót Nhân viên nộp!");
            return;
        }
        if (employeeDeadline && managerDeadline && employeeDeadline.isAfter(managerDeadline)) {
            notify.error("Hạn chót Nhân viên nộp phải diễn ra trước Hạn chót Quản lý chấm xong!");
            return;
        }
        if (managerDeadline && approvalDeadline && managerDeadline.isAfter(approvalDeadline)) {
            notify.error("Hạn chót Quản lý chấm xong phải diễn ra trước Hạn chót Ban lãnh đạo duyệt!");
            return;
        }

        setIsSubmit(true);
        try {
            const payload: any = {
                name: values.name,
                description: values.description,
                employeeStartDate: values.employeeStartDate ? values.employeeStartDate.toISOString() : null,
                employeeDeadline: values.employeeDeadline ? values.employeeDeadline.toISOString() : null,
                managerDeadline: values.managerDeadline ? values.managerDeadline.toISOString() : null,
                approvalDeadline: values.approvalDeadline ? values.approvalDeadline.toISOString() : null,
            };

            let res;
            if (dataInit?.id) {
                res = await callUpdateEvaluationPeriod(dataInit.id, payload);
                if (res?.data) {
                    notify.success("Cập nhật kỳ đánh giá thành công");
                }
            } else {
                res = await callCreateEvaluationPeriod(payload);
                if (res?.data) {
                    notify.success("Tạo mới kỳ đánh giá thành công");
                }
            }

            if (res?.data) {
                setOpenModal(false);
                if (setDataInit) setDataInit(null);
                reloadTable();
            } else {
                notify.error("Có lỗi xảy ra");
            }
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || "Lỗi kết nối máy chủ";
            notify.error(errorMsg);
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <Modal
            title={dataInit ? "Cập nhật Kỳ đánh giá" : "Tạo mới Kỳ đánh giá"}
            open={openModal}
            onOk={() => form.submit()}
            onCancel={() => {
                setOpenModal(false);
                if (setDataInit) setDataInit(null);
            }}
            confirmLoading={isSubmit}
            width={700}
            destroyOnClose
            maskClosable={false}
        >
            <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
                <Form.Item
                    label="Tên kỳ đánh giá"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên kỳ đánh giá!" }]}
                >
                    <Input placeholder="VD: Đánh giá hiệu suất toàn công ty Năm 2025" />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <Input.TextArea rows={3} placeholder="Mô tả chi tiết về mục tiêu hoặc ghi chú của kỳ..." />
                </Form.Item>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <Form.Item
                        label="Ngày mở cổng (Nhân viên tự chấm)"
                        name="employeeStartDate"
                        rules={[{ required: true, message: "Vui lòng chọn ngày mở cổng!" }]}
                    >
                        <DatePicker showTime style={{ width: "100%" }} placeholder="Chọn thời gian" format="DD/MM/YYYY HH:mm" />
                    </Form.Item>

                    <Form.Item
                        label="Hạn chót Nhân viên nộp"
                        name="employeeDeadline"
                        rules={[{ required: true, message: "Vui lòng chọn hạn chót nhân viên!" }]}
                    >
                        <DatePicker showTime style={{ width: "100%" }} placeholder="Chọn thời gian" format="DD/MM/YYYY HH:mm" />
                    </Form.Item>

                    <Form.Item
                        label="Hạn chót Quản lý chấm xong"
                        name="managerDeadline"
                        rules={[{ required: true, message: "Vui lòng chọn hạn chót quản lý!" }]}
                    >
                        <DatePicker showTime style={{ width: "100%" }} placeholder="Chọn thời gian" format="DD/MM/YYYY HH:mm" />
                    </Form.Item>

                    <Form.Item
                        label="Hạn chót Ban lãnh đạo duyệt"
                        name="approvalDeadline"
                        rules={[{ required: true, message: "Vui lòng chọn hạn chót phê duyệt!" }]}
                    >
                        <DatePicker showTime style={{ width: "100%" }} placeholder="Chọn thời gian" format="DD/MM/YYYY HH:mm" />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};

export default PeriodModal;
