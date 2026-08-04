import type { StatusMetaMap } from "@/components/common/tag/StatusTag";

/**
 * Nguồn chân lý duy nhất cho trạng thái Quy trình duyệt & Ủy quyền kế toán.
 * INACTIVE dùng cho Workflow (tắt thủ công); REVOKED/EXPIRED dùng cho Delegation.
 */
export const ACCOUNTING_WORKFLOW_STATUS_META: StatusMetaMap = {
    DRAFT: { label: "Nháp", color: "warning" },
    ACTIVE: { label: "Đang hiệu lực", color: "success" },
    INACTIVE: { label: "Ngưng dùng", color: "default" },
    REVOKED: { label: "Đã thu hồi", color: "default" },
    EXPIRED: { label: "Hết hạn", color: "error" },
};
