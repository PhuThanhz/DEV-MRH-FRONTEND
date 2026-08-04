import type { StatusMetaMap } from "@/components/common/tag/StatusTag";

/**
 * Nguồn chân lý duy nhất cho trạng thái Quy trình & Tài liệu.
 * Dùng chung bởi trang danh sách, chi tiết, trang public và màn quét QR.
 */
export const PROCEDURE_DOCUMENT_STATUS_META: StatusMetaMap = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange", hex: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "success", hex: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "gold", hex: "#ca8a04", bg: "#fefce8", border: "#fef08a" },
    TERMINATED: { label: "Hết hiệu lực", color: "error", hex: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};
