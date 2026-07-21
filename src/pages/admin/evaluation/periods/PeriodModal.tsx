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

const ACCENT = "#e8637a";
const ACCENT_DARK = "#c2185b";
const ACCENT_SOFT = "#fff0f3";
const ACCENT_BORDER = "#ffd6dd";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    reloadTable: () => void;
    dataInit?: IEvaluationPeriod | null;
    setDataInit?: (v: IEvaluationPeriod | null) => void;
    onCreated?: (period: IEvaluationPeriod) => void;
    onSaved?: (period: IEvaluationPeriod) => void;
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
        label: "Hạn QL gián tiếp duyệt",
        icon: <AuditOutlined />,
        defaultHour: 23,
        defaultMinute: 59,
        placeholder: "Hạn chót",
        tip: "Quản lý gián tiếp duyệt kết quả trước thời điểm này",
    },
];

const PeriodModal = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit, onCreated, onSaved } = props;
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
        const periodName = String(values.name ?? "").trim();
        
        const now = dayjs();
        if (employeeStartDate?.isBefore(now, "minute")) {
            notify.warning("Ngày mở cổng không được nằm trong quá khứ.");
            return;
        }
        if (employeeDeadline?.isBefore(now, "minute")) {
            notify.warning("Hạn nhân viên nộp không được nằm trong quá khứ.");
            return;
        }
        if (managerDeadline?.isBefore(now, "minute")) {
            notify.warning("Hạn quản lý chấm không được nằm trong quá khứ.");
            return;
        }
        if (approvalDeadline?.isBefore(now, "minute")) {
            notify.warning("Hạn quản lý gián tiếp duyệt không được nằm trong quá khứ.");
            return;
        }
        
        if (employeeStartDate && employeeDeadline && !employeeStartDate.isBefore(employeeDeadline)) {
            notify.warning("Ngày mở cổng phải trước hạn nhân viên nộp.");
            return;
        }
        if (employeeDeadline && managerDeadline && !employeeDeadline.isBefore(managerDeadline)) {
            notify.warning("Hạn nhân viên nộp phải trước hạn quản lý chấm.");
            return;
        }
        if (managerDeadline && approvalDeadline && !managerDeadline.isBefore(approvalDeadline)) {
            notify.warning("Hạn quản lý chấm phải trước hạn quản lý gián tiếp duyệt.");
            return;
        }

        setIsSubmit(true);
        try {
            const payload = {
                name: periodName,
                description: values.description?.trim?.() || values.description,
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
                onSaved?.(res.data);
                if (!dataInit?.id) {
                    onCreated?.(res.data);
                }
            } else {
                notify.error("Không thể lưu kỳ đánh giá. Vui lòng thử lại.");
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            notify.error(error?.response?.data?.message || "Không thể kết nối máy chủ");
        } finally {
            setIsSubmit(false);
        }
    };

    const isEdit = !!dataInit?.id;
    const handleClose = () => {
        setOpenModal(false);
        setDataInit?.(null);
    };
    const watchedValues = Form.useWatch([], form) || {};
    useEffect(() => {
        const employeeStartDate = watchedValues.employeeStartDate ? dayjs(watchedValues.employeeStartDate) : null;
        const employeeDeadline = watchedValues.employeeDeadline ? dayjs(watchedValues.employeeDeadline) : null;
        const managerDeadline = watchedValues.managerDeadline ? dayjs(watchedValues.managerDeadline) : null;
        const approvalDeadline = watchedValues.approvalDeadline ? dayjs(watchedValues.approvalDeadline) : null;
        const nextValues: Record<string, null> = {};

        if (employeeStartDate && employeeDeadline && !employeeStartDate.isBefore(employeeDeadline)) {
            nextValues.employeeDeadline = null;
        }
        if (employeeDeadline && managerDeadline && !employeeDeadline.isBefore(managerDeadline)) {
            nextValues.managerDeadline = null;
        }
        if (managerDeadline && approvalDeadline && !managerDeadline.isBefore(approvalDeadline)) {
            nextValues.approvalDeadline = null;
        }
        if (Object.keys(nextValues).length > 0) {
            form.setFieldsValue(nextValues);
        }
    }, [
        form,
        watchedValues.employeeStartDate,
        watchedValues.employeeDeadline,
        watchedValues.managerDeadline,
        watchedValues.approvalDeadline,
    ]);
    const previewItems = DATE_FIELDS.map((field) => {
        const value = watchedValues?.[field.name];
        return {
            ...field,
            value: value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "Chưa chọn",
            isEmpty: !value,
        };
    });
    const getMinDateForField = (fieldName: string) => {
        if (fieldName === "employeeDeadline") return watchedValues.employeeStartDate ? dayjs(watchedValues.employeeStartDate) : null;
        if (fieldName === "managerDeadline") return watchedValues.employeeDeadline ? dayjs(watchedValues.employeeDeadline) : null;
        if (fieldName === "approvalDeadline") return watchedValues.managerDeadline ? dayjs(watchedValues.managerDeadline) : null;
        return null;
    };
    const getCurrentMinute = () => dayjs().second(0).millisecond(0);
    const getEffectiveMinDateForField = (fieldName: string) => {
        const now = getCurrentMinute();
        const previous = getMinDateForField(fieldName)?.second(0).millisecond(0);

        if (!previous) return now;
        return previous.isAfter(now) ? previous : now;
    };
    const isDateBeforeMinimum = (current: dayjs.Dayjs, minimum?: dayjs.Dayjs | null) => (
        Boolean(current && minimum && current.isBefore(minimum.startOf("day"), "day"))
    );
    const getDisabledTimeAfterMinimum = (current?: dayjs.Dayjs | null, minimum?: dayjs.Dayjs | null) => {
        if (!current || !minimum || !current.isSame(minimum, "day")) return {};

        return {
            disabledHours: () => Array.from({ length: minimum.hour() }, (_, hour) => hour),
            disabledMinutes: (selectedHour: number) => {
                if (selectedHour !== minimum.hour()) return [];
                return Array.from({ length: minimum.minute() + 1 }, (_, minute) => minute);
            },
        };
    };
    const getDisabledDateForField = (fieldName: string) => (current: dayjs.Dayjs) => {
        return isDateBeforeMinimum(current, getEffectiveMinDateForField(fieldName));
    };
    const getDisabledTimeForField = (fieldName: string) => (current?: dayjs.Dayjs | null) => {
        return getDisabledTimeAfterMinimum(current, getEffectiveMinDateForField(fieldName));
    };

    return (
        <LotusDetailDrawer
            open={openModal}
            onClose={handleClose}
            height="calc(100vh - 16px)"
            destroyOnClose
            maskClosable={false}
            closeAriaLabel={isEdit ? "Đóng chỉnh sửa kỳ đánh giá" : "Đóng tạo kỳ đánh giá"}
        >
            <div className="period-form-drawer">
                <header className="period-form-drawer__header">
                    <div className="period-form-drawer__title-wrap">
                        <div className={`period-form-drawer__icon ${isEdit ? "is-edit" : ""}`}>
                            <CalendarOutlined />
                        </div>
                        <div>
                            <div className="period-form-drawer__title">
                                {isEdit ? "Chỉnh sửa kỳ đánh giá" : "Tạo kỳ đánh giá mới"}
                            </div>
                            <div className="period-form-drawer__subtitle">
                                {isEdit ? "Cập nhật thông tin và lịch trình đánh giá" : "Thiết lập kỳ, công ty áp dụng và các mốc xử lý"}
                            </div>
                        </div>
                    </div>
                </header>
                <main className="period-form-drawer__body">
                    <Form form={form} layout="vertical" onFinish={onFinish} className="period-form-shell">
                        <section className="period-form-card period-form-card--main">
                            <div className="period-section-heading">
                                <span>Thông tin kỳ đánh giá</span>
                            </div>
                            <div className="period-form-grid period-form-grid--details">
                                <Form.Item
                                    label="Tên kỳ đánh giá"
                                    name="name"
                                    normalize={(value) => typeof value === "string" ? value.replace(/\s+/g, " ") : value}
                                    rules={[
                                        { required: true, whitespace: true, message: "Vui lòng nhập tên kỳ đánh giá" },
                                        { max: 120, message: "Tên kỳ đánh giá không vượt quá 120 ký tự" },
                                        {
                                            validator: (_, value) => {
                                                const trimmed = String(value ?? "").trim();
                                                if (!trimmed) return Promise.resolve();
                                                if (trimmed.length < 3) {
                                                    return Promise.reject(new Error("Tên kỳ đánh giá cần ít nhất 3 ký tự"));
                                                }
                                                return Promise.resolve();
                                            },
                                        },
                                    ]}
                                >
                                    <Input placeholder="VD: Đánh giá hiệu suất tháng 7/2026" />
                                </Form.Item>
                                <Form.Item
                                    label="Công ty áp dụng"
                                    name="companyId"
                                    rules={[{ required: true, message: "Vui lòng chọn công ty!" }]}
                                >
                                    <Select
                                        className="period-company-select"
                                        popupClassName="period-company-select-popup"
                                        placeholder="Chọn công ty áp dụng"
                                        allowClear
                                        showSearch
                                        optionFilterProp="label"
                                        options={companies}
                                        loading={isFetchingCompanies}
                                        popupMatchSelectWidth={false}
                                        dropdownStyle={{
                                            minWidth: 560,
                                            maxWidth: "min(760px, calc(100vw - 48px))",
                                        }}
                                        optionRender={(option) => {
                                            const label = String(option.label ?? "");
                                            return (
                                                <div className="period-company-select-option" title={label}>
                                                    {label}
                                                </div>
                                            );
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    className="period-form-description"
                                    label="Mô tả"
                                    name="description"
                                >
                                    <Input.TextArea
                                        rows={4}
                                        placeholder="Ghi chú mục tiêu, phạm vi hoặc lưu ý cho kỳ đánh giá"
                                    />
                                </Form.Item>
                            </div>
                        </section>

                        <section className="period-form-card period-form-card--schedule">
                            <div className="period-section-heading">
                                <span>Lịch trình đánh giá</span>
                                <Tooltip title="Các mốc phải theo thứ tự: Mở cổng, hạn nhân viên, hạn quản lý, hạn duyệt">
                                    <InfoCircleOutlined />
                                </Tooltip>
                            </div>
                            <div className="period-date-list">
                                {DATE_FIELDS.map((field, idx) => (
                                    <div key={field.name} className="period-date-row">
                                        <div className="period-date-row__step">{idx + 1}</div>
                                        <div className="period-date-row__content">
                                            <div className="period-date-row__label">
                                                <span className="period-date-row__icon">{field.icon}</span>
                                                <span>{field.label}</span>
                                                <Tooltip title={field.tip}>
                                                    <InfoCircleOutlined className="period-date-row__info" />
                                                </Tooltip>
                                            </div>
                                            <Form.Item
                                                name={field.name}
                                                rules={[{ required: true, message: "Vui lòng chọn mốc thời gian" }]}
                                            >
                                                <DatePicker
                                                    disabledDate={getDisabledDateForField(field.name)}
                                                    disabledTime={getDisabledTimeForField(field.name)}
                                                    showTime={{
                                                        format: "HH:mm",
                                                        defaultValue: dayjs().hour(field.defaultHour).minute(field.defaultMinute).second(0),
                                                    }}
                                                    placeholder={field.placeholder}
                                                    format="DD/MM/YYYY HH:mm"
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <aside className="period-form-card period-form-card--preview">
                            <div className="period-section-heading">
                                <span>Tóm tắt lịch trình</span>
                            </div>
                            <div className="period-preview-list">
                                {previewItems.map((item, idx) => (
                                    <div key={item.name} className="period-preview-row">
                                        <div className="period-preview-row__marker">{idx + 1}</div>
                                        <div>
                                            <div className="period-preview-row__label">{item.label}</div>
                                            <div className={item.isEmpty ? "period-preview-row__empty" : "period-preview-row__value"}>
                                                {item.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="period-preview-note">
                                Luồng xử lý luôn đi theo thứ tự nhân viên đánh giá, quản lý trực tiếp chấm, rồi quản lý gián tiếp duyệt.
                            </div>
                            {!isEdit && (
                                <div className="period-next-step-card">
                                    <div className="period-next-step-card__icon"><TeamOutlined /></div>
                                    <div>
                                        <div className="period-next-step-card__title">Bước tiếp theo: thêm nhân sự áp dụng</div>
                                        <div className="period-next-step-card__text">
                                            Sau khi tạo kỳ, hệ thống sẽ mở ngay màn quản trị để chọn biểu mẫu và thêm nhân viên vào kỳ.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </aside>
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
                    .period-form-drawer { height: 100%; min-height: 0; display: flex; flex-direction: column; background: #f7f9fc; color: #0f172a; }
                    .period-form-drawer__header { flex: 0 0 auto; padding: 22px 44px; border-bottom: 1px solid #e5ebf3; background: #fff; }
                    .period-form-drawer__title-wrap { display: flex; align-items: center; gap: 12px; }
                    .period-form-drawer__icon { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; background: ${ACCENT_SOFT}; border: 1px solid ${ACCENT_BORDER}; display: flex; align-items: center; justify-content: center; font-size: 18px; color: ${ACCENT}; }
                    .period-form-drawer__icon.is-edit { background: #fff7e6; color: #fa8c16; }
                    .period-form-drawer__title { font-size: 20px; font-weight: 800; line-height: 26px; color: #0f172a; }
                    .period-form-drawer__subtitle { margin-top: 2px; font-size: 13px; color: #64748b; font-weight: 500; }
                    .period-form-drawer__body { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: clamp(18px, 2vh, 30px) clamp(18px, 2vw, 32px); }
                    .period-form-shell { width: 100%; margin: 0; display: grid; grid-template-columns: minmax(460px, 1fr) minmax(420px, 0.92fr); grid-template-areas: "main schedule" "preview schedule"; gap: clamp(14px, 1.4vw, 22px); align-items: start; }
                    .period-form-card { border: 1px solid #eef0f5; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
                    .period-form-card--main { grid-area: main; padding: 18px 20px 20px; }
                    .period-form-card--schedule { grid-area: schedule; padding: 18px 20px 20px; }
                    .period-form-card--preview { grid-area: preview; padding: 18px 20px; }
                    .period-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; color: #334155; font-size: 13px; font-weight: 800; text-transform: uppercase; }
                    .period-section-heading .anticon { color: #94a3b8; }
                    .period-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
                    .period-form-description { grid-column: 1 / -1; }
                    .period-form-drawer .ant-form-item { margin-bottom: 16px; }
                    .period-form-drawer .ant-form-item-label > label { color: #334155; font-size: 13px; font-weight: 700; }
                    .period-form-drawer .ant-input,
                    .period-form-drawer .ant-select-selector,
                    .period-form-drawer .ant-picker { border-radius: 8px !important; border-color: #e5e7eb !important; min-height: 40px; }
                    .period-company-select .ant-select-selector {
                        height: auto !important;
                        align-items: center;
                        padding-top: 5px !important;
                        padding-bottom: 5px !important;
                    }
                    .period-company-select .ant-select-selection-item {
                        white-space: normal;
                        line-height: 18px;
                        overflow: visible;
                        text-overflow: initial;
                    }
                    .period-company-select-popup .ant-select-item-option {
                        min-height: auto;
                        padding: 10px 12px;
                        align-items: flex-start;
                    }
                    .period-company-select-popup .ant-select-item-option-content {
                        white-space: normal;
                        overflow: visible;
                        text-overflow: initial;
                    }
                    .period-company-select-option {
                        width: 100%;
                        color: #111827;
                        font-size: 14px;
                        font-weight: 700;
                        line-height: 20px;
                        white-space: normal;
                        overflow-wrap: anywhere;
                    }
                    .period-form-drawer .ant-input:hover,
                    .period-form-drawer .ant-select-selector:hover,
                    .period-form-drawer .ant-picker:hover { border-color: ${ACCENT_BORDER} !important; }
                    .period-form-drawer .ant-input:focus,
                    .period-form-drawer .ant-input-focused,
                    .period-form-drawer .ant-select-focused .ant-select-selector,
                    .period-form-drawer .ant-picker-focused { border-color: ${ACCENT} !important; box-shadow: 0 0 0 3px rgba(232,99,122,.12) !important; }
                    .period-form-drawer textarea.ant-input { min-height: 116px; resize: none; }
                    .period-date-list { display: flex; flex-direction: column; gap: 12px; }
                    .period-date-row { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; padding: 14px; border: 1px solid ${ACCENT_BORDER}; border-radius: 10px; background: #fffafd; }
                    .period-date-row__step { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: ${ACCENT}; color: #fff; font-size: 13px; font-weight: 800; box-shadow: 0 2px 8px rgba(232,99,122,.28); }
                    .period-date-row__content { min-width: 0; }
                    .period-date-row__label { min-height: 24px; display: flex; align-items: center; gap: 7px; margin-bottom: 8px; color: #1e293b; font-size: 14px; font-weight: 800; }
                    .period-date-row__label span:nth-child(2) { min-width: 0; overflow-wrap: anywhere; }
                    .period-date-row__icon { color: ${ACCENT}; font-size: 14px; }
                    .period-date-row__info { color: #b6c2d2; font-size: 12px; }
                    .period-date-row .ant-picker { width: 100%; }
                    .period-date-row .ant-form-item { margin-bottom: 0; }
                    .period-preview-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
                    .period-preview-row { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 10px; align-items: start; padding: 12px; border-radius: 10px; background: #ffffff; border: 1px solid #e5eaf0; }
                    .period-preview-row__marker { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #334155; border: 1px solid #dbe3ec; font-size: 12px; font-weight: 800; }
                    .period-preview-row__label { color: #475569; font-size: 12px; font-weight: 700; line-height: 16px; }
                    .period-preview-row__value,
                    .period-preview-row__empty { margin-top: 4px; font-size: 13px; font-weight: 800; line-height: 18px; color: #0f172a; }
                    .period-preview-row__empty { color: #94a3b8; font-weight: 600; }
                    .period-preview-note { margin-top: 12px; padding: 12px 14px; border-radius: 10px; background: #f8fafc; border: 1px solid #e5eaf0; color: #475569; font-size: 13px; line-height: 20px; font-weight: 600; }
                    .period-next-step-card { margin-top: 12px; display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 10px; padding: 12px 14px; border-radius: 10px; background: #fff7fb; border: 1px solid #ffd6dd; }
                    .period-next-step-card__icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #fff; color: ${ACCENT}; border: 1px solid ${ACCENT_BORDER}; font-size: 16px; }
                    .period-next-step-card__title { color: #1e293b; font-size: 13px; font-weight: 800; line-height: 18px; }
                    .period-next-step-card__text { margin-top: 3px; color: #64748b; font-size: 12px; font-weight: 600; line-height: 18px; }
                    .period-form-drawer__footer { flex: 0 0 auto; display: flex; justify-content: flex-end; gap: 10px; padding: 14px 44px; border-top: 1px solid #e5ebf3; background: #fff; }
                    .period-form-drawer__footer .ant-btn { min-width: 96px; height: 38px; border-radius: 8px; font-weight: 700; }
                    .period-form-drawer__footer .ant-btn-primary { background: ${ACCENT}; border-color: ${ACCENT}; box-shadow: 0 2px 8px rgba(232,99,122,.28); }
                    .period-form-drawer__footer .ant-btn-primary:hover { background: ${ACCENT_DARK} !important; border-color: ${ACCENT_DARK} !important; }
                    @media (min-width: 1600px) {
                        .period-form-shell { grid-template-columns: minmax(620px, 1fr) minmax(520px, 0.86fr); }
                        .period-preview-list { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                    }
                    @media (max-width: 1100px) {
                        .period-form-drawer__header { padding: 18px 24px; }
                        .period-form-drawer__body { padding: 18px 20px; }
                        .period-form-shell { grid-template-columns: minmax(0, 1fr); grid-template-areas: "main" "schedule" "preview"; }
                        .period-date-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    }
                    @media (max-width: 767px) {
                        .period-form-drawer__header { padding: 16px 20px; }
                        .period-form-drawer__title { font-size: 17px; line-height: 23px; }
                        .period-form-drawer__body { padding: 16px; }
                        .period-form-shell { grid-template-columns: minmax(0, 1fr); grid-template-areas: "main" "schedule" "preview"; }
                        .period-date-list { display: flex; }
                        .period-form-grid { grid-template-columns: minmax(0, 1fr); }
                        .period-form-description { grid-column: auto !important; }
                        .period-preview-list { grid-template-columns: minmax(0, 1fr); }
                        .period-form-drawer__footer { padding: 12px 16px; }
                    }
                `}</style>
            </div>
        </LotusDetailDrawer>
    );
};

export default PeriodModal;
