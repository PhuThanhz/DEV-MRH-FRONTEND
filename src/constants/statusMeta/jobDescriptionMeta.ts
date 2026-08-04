import type { StatusMetaMap } from "@/components/common/tag/StatusTag";

/**
 * Nguồn chân lý duy nhất cho trạng thái JD (Job Description).
 * Giá trị khớp với enum backend: DRAFT | IN_REVIEW | APPROVED | REJECTED | PUBLISHED.
 */
export const JOB_DESCRIPTION_STATUS_META: StatusMetaMap = {
    DRAFT: { label: "Nháp", color: "default", hex: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
    IN_REVIEW: { label: "Đang duyệt", color: "processing", hex: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
    APPROVED: { label: "Đã duyệt", color: "warning", hex: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    REJECTED: { label: "Từ chối", color: "error", hex: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
    PUBLISHED: { label: "Đã ban hành", color: "success", hex: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
};
