import React from "react";
import { UserOutlined } from "@ant-design/icons";

interface IEvaluationUserInfoProps {
    record: {
        employee?: any;
        directManager?: any;
        indirectManager?: any;
    };
}

export const EvaluationUserInfo: React.FC<IEvaluationUserInfoProps> = ({ record }) => {
    return (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
                <UserOutlined style={{ color: "#f43f5e", marginRight: 8 }} />Thông tin nhân sự
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {[
                    { label: "Nhân viên", info: record.employee },
                    { label: "Quản lý đánh giá", info: record.directManager },
                    { label: "Cấp phê duyệt", info: record.indirectManager },
                ].map(({ label, info }) => info?.id ? (
                    <div key={label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", border: "1px solid #f3f4f6" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 6 }}>{label}</div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{info.fullName || info.username}</div>
                        <div style={{ fontSize: 12, color: "#374151", fontWeight: 500, marginTop: 4 }}>
                            {info.jobTitle || "Chưa cập nhật chức danh"} {info.positionLevel ? `(${info.positionLevel})` : ""}
                        </div>
                    </div>
                ) : null)}
            </div>
        </div>
    );
};
