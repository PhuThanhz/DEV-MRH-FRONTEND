export interface GradeMetaItem {
    label: string;
    color: string;
    bg: string;
}

/**
 * Nguồn chân lý duy nhất cho xếp loại đánh giá A-E.
 * Dùng cho cả trang danh sách và trang chi tiết (trước đây trang chi tiết dùng
 * palette gradient riêng, khác màu với trang danh sách cho cùng 1 giá trị finalGrade).
 */
export const EVALUATION_GRADE_META: Record<string, GradeMetaItem> = {
    A: { color: "#389e0d", bg: "#f6ffed", label: "Xuất sắc" },
    B: { color: "#1677ff", bg: "#e6f4ff", label: "Tốt" },
    C: { color: "#d46b08", bg: "#fff7e6", label: "Khá" },
    D: { color: "#cf1322", bg: "#fff1f0", label: "Trung bình" },
    E: { color: "#8c8c8c", bg: "#f5f5f5", label: "Yếu" },
};
