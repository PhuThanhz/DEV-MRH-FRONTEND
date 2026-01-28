// src/components/common/DateRangeFilter.tsx
import { DatePicker, Typography, Space } from "antd";
import type { DatePickerProps } from "antd/es/date-picker";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";

dayjs.extend(utc);
const { Text } = Typography;

interface DateRangeFilterProps {
    label?: string;
    defaultValue?: [string | null, string | null];
    onChange?: (filter: string | null) => void;
    format?: string;
    fieldName?: string;
    width?: number;
    size?: "small" | "middle" | "large";
    className?: string;
}

const DateRangeFilter = ({
    defaultValue,
    onChange,
    format = "YYYY-MM-DD",
    fieldName = "createdAt",
    width = 150,
    size = "middle",
    className,
}: DateRangeFilterProps) => {
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);

    useEffect(() => {
        if (defaultValue) {
            setStartDate(defaultValue[0] ? dayjs(defaultValue[0]) : null);
            setEndDate(defaultValue[1] ? dayjs(defaultValue[1]) : null);
        }
    }, [defaultValue]);

    const handleStartChange: DatePickerProps["onChange"] = (date) => {
        setStartDate(date);
        updateFilter(date, endDate);
    };

    const handleEndChange: DatePickerProps["onChange"] = (date) => {
        setEndDate(date);
        updateFilter(startDate, date);
    };

    const updateFilter = (start: Dayjs | null, end: Dayjs | null) => {
        if (!start && !end) {
            onChange?.(null);
            return;
        }

        const startISO = start?.startOf("day").utc().toISOString() ?? null;
        const endISO = end?.endOf("day").utc().toISOString() ?? null;

        if (startISO && endISO) {
            const filter = `(${fieldName}>='${startISO}' and ${fieldName}<='${endISO}')`;
            onChange?.(filter);
        } else if (startISO) {
            const filter = `(${fieldName}>='${startISO}')`;
            onChange?.(filter);
        } else if (endISO) {
            const filter = `(${fieldName}<='${endISO}')`;
            onChange?.(filter);
        } else {
            onChange?.(null);
        }
    };

    const disabledStartDate = (current: Dayjs) => {
        if (!endDate) return false;
        return current && current.isAfter(endDate, "day");
    };

    const disabledEndDate = (current: Dayjs) => {
        if (!startDate) return false;
        return current && current.isBefore(startDate, "day");
    };

    return (
        <div className={className} style={{ display: "flex", alignItems: "center" }}>
            {<Text style={{ margin: 0, whiteSpace: "nowrap" }}>{ }</Text>}
            <Space.Compact>
                <DatePicker
                    size={size}
                    format={format}
                    placeholder="Ngày bắt đầu"
                    style={{ width }}
                    value={startDate}
                    onChange={handleStartChange}
                    disabledDate={disabledStartDate}
                    allowClear
                    inputReadOnly
                />
                <DatePicker
                    size={size}
                    format={format}
                    placeholder="Ngày kết thúc"
                    style={{ width }}
                    value={endDate}
                    onChange={handleEndChange}
                    disabledDate={disabledEndDate}
                    allowClear
                    inputReadOnly
                />
            </Space.Compact>
        </div>
    );
};

export default DateRangeFilter;