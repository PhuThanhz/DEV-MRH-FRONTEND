import { Form, Input, DatePicker, Tooltip, Button, Select } from "antd";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { callCreateEvaluationPeriod, callUpdateEvaluationPeriod } from "@/config/api";
import type { IEvaluationPeriod } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";
import { fetchPeriodCompanyOptions, PERIOD_COMPANY_OPTIONS_QUERY_KEY } from "@/hooks/useEvaluationPeriodReferenceData";
import Access from '@/components/share/access';
import { ALL_PERMISSIONS } from '@/config/permissions';
import {
    CalendarOutlined,
    UserOutlined,
    TeamOutlined,
    AuditOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    reloadTable: () => void;
    dataInit?: IEvaluationPeriod | null;
    setDataInit?: (v: IEvaluationPeriod | null) => void;
}

// 4 mốc thời gian theo thứ tự
const DATE_FIELDS = [
    {
        name: "employeeStartDate",
        label: "Mở cổng nhân viên đánh giá",
        icon: <UserOutlined />,
        defaultHour: 8,
        defaultMinute: 0,
        placeholder: "Ngày bắt đầu",
        tip: "Nhân viên bắt đầu thực hiện đánh giá từ thời điểm này",
    },
    {
        name: "employeeDeadline",
        label: "Hạn nhân viên nộp",
        icon: <UserOutlined />,
        defaultHour: 23,
        defaultMinute: 59,
        placeholder: "Hạn chót",
        tip: "Nhân viên phải hoàn thành trước thời điểm này",
    },
    {
        name: "managerDeadline",
        label: "Hạn quản lý chấm",
        icon: <TeamOutlined />,
        defaultHour: 23,
        defaultMinute: 59,
        placeholder: "Hạn chót",
        tip: "Quản lý phải hoàn thành chấm điểm trước thời điểm này",
    },
    {
        name: "approvalDeadline",
        label: "Hạn lãnh đạo duyệt",
        icon: <AuditOutlined />,
        defaultHour: 23,
        defaultMinute: 59,
        placeholder: "Hạn chót",
        tip: "Ban lãnh đạo phê duyệt kết quả trước thời điểm này",
    },
];

const PeriodModal = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [form] = Form.useForm();
    const [isSubmit, setIsSubmit] = useState(false);
    const { data: companies = [], isFetching: isFetchingCompanies } = useQuery({
        queryKey: PERIOD_COMPANY_OPTIONS_QUERY_KEY,
        queryFn: fetchPeriodCompanyOptions,
        enabled: openModal,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (openModal) {
            if (dataInit) {
                const parse = (dateStr: string | undefined, h: number, m: number) => {
                    if (!dateStr) return null;
                    const d = dayjs(dateStr);
                    return d.hour() === 0 && d.minute() === 0 ? d.hour(h).minute(m).second(0) : d;
                };
                form.setFieldsValue({
                    name: dataInit.name,
                    description: dataInit.description,
                    employeeStartDate: parse(dataInit.employeeStartDate, 8, 0),
                    employeeDeadline: parse(dataInit.employeeDeadline, 23, 59),
                    managerDeadline: parse(dataInit.managerDeadline, 23, 59),
                    approvalDeadline: parse(dataInit.approvalDeadline, 23, 59),
                    companyId: dataInit.company?.id || null,
                });
            } else {
                form.resetFields();
            }
        }
    }, [openModal, dataInit, form]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        const { employeeStartDate, employeeDeadline, managerDeadline, approvalDeadline } = values;
        
        if (employeeStartDate?.isBefore(dayjs(), 'minute')) {
            notify.error("Ngày mở cổng không được nằm trong quá khứ!");
            return;
        }
        
        if (employeeStartDate?.isAfter(employeeDeadline)) {
            notify.error("Ngày mở cổng phải trước hạn nhân viên nộp!");
            return;
        }
        if (employeeDeadline?.isAfter(managerDeadline)) {
            notify.error("Hạn nhân viên nộp phải trước hạn quản lý chấm!");
            return;
        }
        if (managerDeadline?.isAfter(approvalDeadline)) {
            notify.error("Hạn quản lý chấm phải trước hạn lãnh đạo duyệt!");
            return;
        }

        setIsSubmit(true);
        try {
            const payload = {
                name: values.name,
                description: values.description,
                employeeStartDate: employeeStartDate?.toISOString() ?? null,
                employeeDeadline: employeeDeadline?.toISOString() ?? null,
                managerDeadline: managerDeadline?.toISOString() ?? null,
                approvalDeadline: approvalDeadline?.toISOString() ?? null,
                company: { id: Number(values.companyId) },
            };
            let res;
            if (dataInit?.id) {
                res = await callUpdateEvaluationPeriod(dataInit.id, payload);
                if (res?.data) notify.success("Cập nhật kỳ đánh giá thành công");
            } else {
                res = await callCreateEvaluationPeriod(payload);
                if (res?.data) notify.success("Tạo kỳ đánh giá thành công");
            }
            if (res?.data) {
                setOpenModal(false);
                if (setDataInit) setDataInit(null);
                reloadTable();
            } else {
                notify.error("Có lỗi xảy ra");
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            notify.error(error?.response?.data?.message || "Lỗi kết nối máy chủ");
        } finally {
            setIsSubmit(false);
        }
    };

    const isEdit = !!dataInit?.id;
    const handleClose = () => {
        setOpenModal(false);
        setDataInit?.(null);
    };

    return (
        <LotusDetailDrawer
            open={openModal}
            onClose={handleClose}
            height="min(760px, calc(100vh - 16px))"
            destroyOnClose
            maskClosable={false}
            closeAriaLabel={isEdit ? "Đóng chỉnh sửa kỳ đánh giá" : "Đóng tạo kỳ đánh giá"}
        >
            <div className="period-form-drawer">
                <header className="period-form-drawer__header">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: isEdit ? "#fff7e6" : "#e6f4ff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, color: isEdit ? "#fa8c16" : "#1677ff",
                    }}>
                        <CalendarOutlined />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: "20px" }}>
                            {isEdit ? "Chỉnh sửa kỳ đánh giá" : "Tạo kỳ đánh giá mới"}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>
                            {isEdit ? "Cập nhật thông tin và mốc thời gian" : "Thiết lập thông tin và lịch trình"}
                        </div>
                    </div>
                    </div>
                </header>
                <main className="period-form-drawer__body">
                    <Form form={form} layout="vertical" onFinish={onFinish}>

                {/* Tên + Mô tả + Công ty — 2 cột ngang */}
                <div className="period-form-grid period-form-grid--details">
                    <Form.Item
                        label={<span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>Tên kỳ đánh giá</span>}
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
                        style={{ marginBottom: 14 }}
                    >
                        <Input
                            placeholder="VD: Đánh giá hiệu suất Năm 2025"
                            style={{ borderRadius: 6 }}
                        />
                    </Form.Item>
                    <Form.Item
                        label={<span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>Công ty áp dụng</span>}
                        name="companyId"
                        rules={[{ required: true, message: "Vui lòng chọn công ty!" }]}
                        style={{ marginBottom: 14 }}
                    >
                        <Select
                            placeholder="Chọn công ty áp dụng..."
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={companies}
                            loading={isFetchingCompanies}
                            style={{ borderRadius: 6, width: "100%" }}
                        />
                    </Form.Item>
                    <Form.Item
                        className="period-form-description"
                        label={<span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>Mô tả</span>}
                        name="description"
                        style={{ marginBottom: 16, gridColumn: "1 / -1" }}
                    >
                        <Input.TextArea
                            rows={2}
                            placeholder="Ghi chú mục tiêu hoặc phạm vi kỳ đánh giá..."
                            style={{ borderRadius: 6, resize: "none" }}
                        />
                    </Form.Item>
                </div>

                {/* Divider + label lịch trình */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                        Lịch trình đánh giá
                    </span>
                    <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                    <Tooltip title="Các mốc phải theo thứ tự tăng dần: Mở cổng → Hạn NV → Hạn QL → Hạn duyệt">
                        <InfoCircleOutlined style={{ color: "#94a3b8", fontSize: 13, cursor: "help" }} />
                    </Tooltip>
                </div>

                {/* 4 mốc thời gian — grid 2×2 */}
                <div className="period-form-grid period-form-grid--timeline">
                    {DATE_FIELDS.map((field, idx) => (
                        <div key={field.name} style={{
                            background: "#f8fafc",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "10px 12px",
                            position: "relative",
                        }}>
                            {/* Step badge */}
                            <div style={{
                                position: "absolute", top: -1, right: -1,
                                width: 18, height: 18, borderRadius: "0 8px 0 6px",
                                background: "#1677ff",
                                color: "#fff", fontSize: 10, fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {idx + 1}
                            </div>

                            {/* Label */}
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                                <span style={{ color: "#1677ff", fontSize: 12 }}>{field.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{field.label}</span>
                                <Tooltip title={field.tip}>
                                    <InfoCircleOutlined style={{ color: "#cbd5e1", fontSize: 11, cursor: "help" }} />
                                </Tooltip>
                            </div>

                            <Form.Item
                                name={field.name}
                                rules={[{ required: true, message: "Bắt buộc!" }]}
                                style={{ marginBottom: 0 }}
                            >
                                <DatePicker
                                    showTime={{
                                        format: "HH:mm",
                                        minuteStep: 15,
                                        defaultValue: dayjs().hour(field.defaultHour).minute(field.defaultMinute).second(0),
                                    }}
                                    style={{ width: "100%", borderRadius: 6 }}
                                    placeholder={field.placeholder}
                                    format="DD/MM/YY HH:mm"
                                    size="small"
                                />
                            </Form.Item>
                        </div>
                    ))}
                </div>

                {/* Flow indicator */}
                <div className="period-form-flow" style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 4, marginTop: 10, marginBottom: 4,
                }}>
                    {["Mở cổng", "Hạn NV", "Hạn QL", "Hạn duyệt"].map((label, i, arr) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{
                                fontSize: 10, color: "#94a3b8", fontWeight: 500,
                                background: "#f1f5f9", borderRadius: 4, padding: "1px 6px",
                            }}>
                                {label}
                            </span>
                            {i < arr.length - 1 && (
                                <span style={{ color: "#cbd5e1", fontSize: 10 }}>→</span>
                            )}
                        </div>
                    ))}
                </div>

                    </Form>
                </main>
                <footer className="period-form-drawer__footer">
                    <Button onClick={handleClose}>Hủy</Button>
                    <Access
                        permission={isEdit ? ALL_PERMISSIONS.EVALUATION.UPDATE_PERIOD : ALL_PERMISSIONS.EVALUATION.CREATE_PERIOD}
                        hideChildren
                    >
                        <Button type="primary" onClick={() => form.submit()} loading={isSubmit}>
                            {isEdit ? "Lưu thay đổi" : "Tạo kỳ đánh giá"}
                        </Button>
                    </Access>
                </footer>
                <style>{`
                    .period-form-drawer { height: 100%; min-height: 0; display: flex; flex-direction: column; background: #fff; }
                    .period-form-drawer__header { flex: 0 0 auto; padding: 18px 28px; border-bottom: 1px solid #e7edf4; background: #fff; }
                    .period-form-drawer__body { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 22px max(24px, calc((100% - 720px) / 2)); background: #fafbfd; }
                    .period-form-drawer__body form { padding: 22px; border: 1px solid #e7edf4; border-radius: 8px; background: #fff; }
                    .period-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .period-form-grid--details { gap: 0 16px; }
                    .period-form-grid--timeline { gap: 12px 16px; }
                    .period-form-flow { flex-wrap: wrap; }
                    .period-form-drawer__footer { flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 28px; border-top: 1px solid #e7edf4; background: #fff; }
                    @media (max-width: 767px) {
                        .period-form-drawer__header { padding: 16px 18px; }
                        .period-form-drawer__body { padding: 16px; }
                        .period-form-drawer__body form { padding: 16px; }
                        .period-form-grid { grid-template-columns: minmax(0, 1fr); }
                        .period-form-description { grid-column: auto !important; }
                        .period-form-drawer__footer { padding: 12px 16px; }
                    }
                `}</style>
            </div>
        </LotusDetailDrawer>
    );
};

export default PeriodModal;
