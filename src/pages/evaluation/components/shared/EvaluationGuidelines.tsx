import React from "react";
import { BookOutlined } from "@ant-design/icons";

export const EvaluationGuidelines: React.FC = () => {
    return (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexWrap: "wrap", gap: 24 }}>
            <div style={{ flex: "2 1 400px" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
                    <BookOutlined style={{ color: "#f43f5e", marginRight: 8 }} />Hướng dẫn thực hiện
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                    <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>1. Cột Nội dung đánh giá:</strong> Phản ánh các nội dung đánh giá chính liên quan đến người lao động.</div>
                    <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>2. Cột Phương pháp đo lường:</strong> Thể hiện phương pháp được sử dụng để đo lường nội dung đánh giá.</div>
                    <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>3. Tiêu chí đánh giá theo thang điểm:</strong> Định nghĩa cụ thể, phù hợp với từng nội dung đánh giá.</div>
                    <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>4. Cột trọng số:</strong> Tổng trọng số của mỗi phần là 100%, trọng số cao thể hiện mức độ quan trọng.</div>
                    <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>5. Cột đánh giá:</strong> Cá nhân, quản lý ghi số điểm chi tiết cho từng nội dung đánh giá.</div>
                    <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>6. Cột kết quả:</strong> Là điểm qui đổi = Điểm đánh giá × Trọng số.</div>
                </div>
            </div>
            <div style={{ flex: "1 1 300px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, textAlign: "center" }}>Thang điểm đánh giá</div>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                    <tbody>
                        {[
                            { score: 5, desc: "Hoàn thành công việc ở mức độ xuất sắc" },
                            { score: 4, desc: "Hoàn thành công việc ở mức độ tốt" },
                            { score: 3, desc: "Hoàn thành công việc ở mức độ khá" },
                            { score: 2, desc: "Hoàn thành công việc ở mức độ trung bình" },
                            { score: 1, desc: "Chưa đáp ứng được một số yêu cầu" }
                        ].map(item => (
                            <tr key={item.score} style={{ borderBottom: item.score > 1 ? "1px solid #e5e7eb" : "none" }}>
                                <td style={{ padding: "8px 12px", fontWeight: 800, color: "#f43f5e", textAlign: "center", borderRight: "1px solid #e5e7eb", width: 40 }}>{item.score}</td>
                                <td style={{ padding: "8px 12px", color: "#374151", fontWeight: 500 }}>{item.desc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
