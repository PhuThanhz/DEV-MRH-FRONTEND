import React from "react";
import { Tag } from "antd";

export interface StatusMetaItem {
    label: string;
    color: string;
    icon?: React.ReactNode;
    /** Màu hex tương ứng, dùng cho những nơi tự vẽ badge custom (không phải antd Tag) nhưng vẫn cần khớp cùng 1 nguồn màu. */
    hex?: string;
    bg?: string;
    border?: string;
}

export type StatusMetaMap<T extends string = string> = Record<T, StatusMetaItem>;

interface StatusTagProps<T extends string = string> {
    value?: T | string | null;
    meta: StatusMetaMap<T>;
    style?: React.CSSProperties;
}

/**
 * Component Tag dùng chung cho mọi loại trạng thái/độ ưu tiên trong hệ thống.
 * Mỗi domain (Task, JD, Dossier, Procedure...) khai báo 1 bảng meta riêng trong
 * src/constants/statusMeta/ và truyền vào đây để đảm bảo màu/label đồng bộ ở mọi trang.
 */
export function StatusTag<T extends string = string>({ value, meta, style }: StatusTagProps<T>) {
    const item: StatusMetaItem = (value != null && meta[value as T]) || {
        label: value != null ? String(value) : "—",
        color: "default",
    };

    return (
        <Tag color={item.color} icon={item.icon} style={{ borderRadius: 6, margin: 0, ...style }}>
            {item.label}
        </Tag>
    );
}

export default StatusTag;
