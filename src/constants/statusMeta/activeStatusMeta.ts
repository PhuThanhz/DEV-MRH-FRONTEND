import type { StatusMetaMap } from "@/components/common/tag/StatusTag";

/**
 * Nguồn chân lý duy nhất cho badge Hoạt động/Ngừng hoạt động
 * (User, Employee, Department...).
 */
export const ACTIVE_STATUS_META: StatusMetaMap = {
    true: { label: "Đang hoạt động", color: "success", hex: "#389e0d", bg: "#f6ffed", border: "#b7eb8f" },
    false: { label: "Ngừng hoạt động", color: "error", hex: "#cf1322", bg: "#fff2f0", border: "#ffccc7" },
};

export const getActiveStatusMeta = (active?: boolean | null) =>
    ACTIVE_STATUS_META[String(!!active)];
