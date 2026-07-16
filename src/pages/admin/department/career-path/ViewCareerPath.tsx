import { Modal, Tag, Grid } from "antd";
import { TrophyOutlined, FileTextOutlined, BookOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import type { ICareerPath } from "@/types/backend";

const { useBreakpoint } = Grid;

interface IProps {
    open: boolean;
    onClose: () => void;
    dataInit?: ICareerPath | null;
    setDataInit: (v: any) => void;
}

const ViewCareerPath = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const screens = useBreakpoint();
    const column = screens.md ? 2 : 1;
    const [activeTab, setActiveTab] = useState("1");

    useEffect(() => {
        if (!open) {
            setDataInit(null);
            setActiveTab("1");
        }
    }, [open]);

    const renderLongText = (text?: string) => {
        if (!text) return <span style={{ color: "#bfbfbf" }}>—</span>;
        const cleanText = text.replace(/^["']|["']$/g, "").trim();
        const lines = cleanText.split('\n');

        let currentIndent = 0;

        return (
            <div style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#374151"
            }}>
                {lines.map((line, idx) => {
                    const t = line.trim();
                    if (!t) return <div key={idx} style={{ height: 8 }} />;

                    // Xử lý gạch đầu dòng / chấm tròn
                    if (t.startsWith('-') || t.startsWith('•') || t.startsWith('+')) {
                        currentIndent = 24; // 8px padding + 6px bullet + 10px gap

                        let content = t.substring(1).trim();
                        let label = "";
                        let value = "";

                        const colonIdx = content.indexOf(':');
                        if (colonIdx >= 0) {
                            label = content.substring(0, colonIdx + 1);
                            value = content.substring(colonIdx + 1).trim();
                        } else {
                            value = content;
                        }

                        return (
                            <div key={idx} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: value ? 8 : 4, paddingLeft: 8 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e8637a", flexShrink: 0, marginTop: 8 }} />
                                <div>
                                    {label && <span style={{ fontWeight: 600, color: "#111827", marginRight: 4 }}>{label}</span>}
                                    {value && <span>{value}</span>}
                                </div>
                            </div>
                        );
                    }

                    // Xử lý dòng có dấu ":" (Label: Value) ở cấp ngoài cùng
                    const colonIdx = t.indexOf(':');
                    if (colonIdx > 0 && colonIdx < t.length - 1) {
                        currentIndent = 0;
                        const label = t.substring(0, colonIdx);
                        const value = t.substring(colonIdx + 1);
                        return (
                            <div key={idx} style={{ marginBottom: 12, display: "flex", gap: 6, alignItems: "baseline" }}>
                                <span style={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{label}:</span>
                                <span>{value}</span>
                            </div>
                        );
                    }

                    // Dòng thường là tiêu đề con như "Kiến thức:"
                    if (t.endsWith(':')) {
                        currentIndent = 0;
                        return <div key={idx} style={{ fontWeight: 700, color: "#111827", marginTop: 16, marginBottom: 8 }}>{t}</div>;
                    }

                    // Dòng văn bản thông thường (có thể thụt lề nếu đi sau bullet)
                    return <div key={idx} style={{ marginBottom: 10, paddingLeft: currentIndent }}>{t}</div>;
                })}
            </div>
        );
    };

    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            width={screens.md ? 900 : "100%"}
            closeIcon={null}
            style={{ top: 20 }}
            styles={{
                body: { padding: 0, borderRadius: 12, overflow: "hidden" },
                content: { padding: 0, borderRadius: 12, overflow: "hidden" }
            }}
            destroyOnHidden
        >
            {dataInit ? (
                <div style={{ fontFamily: "'Outfit','Inter','Segoe UI',sans-serif", background: "#f5f6fa" }}>

                    {/* ── HEADER ── */}
                    <div style={{
                        background: "#fff",
                        padding: screens.md ? "24px 32px 20px" : "16px",
                        borderBottom: "1px solid #eef0f5",
                        position: "relative"
                    }}>
                        {/* Nút Đóng Custom */}
                        <div
                            onClick={onClose}
                            style={{
                                position: "absolute", top: 16, right: 20, cursor: "pointer",
                                color: "#9ca3af", fontSize: 24, lineHeight: 1, padding: 4
                            }}
                            title="Đóng"
                        >
                            ×
                        </div>

                        {/* Badge */}
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: "#fff0f3", border: `1px solid #ffd6dd`,
                            borderRadius: 20, padding: "4px 12px",
                            fontSize: 10, fontWeight: 700, color: "#e8637a",
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            marginBottom: 12,
                        }}>
                            <FileTextOutlined style={{ fontSize: 10 }} /> LỘ TRÌNH THĂNG TIẾN
                        </span>

                        {/* Title */}
                        <h2 style={{
                            fontSize: screens.md ? 22 : 18,
                            fontWeight: 800,
                            color: "#111827",
                            margin: "0 0 6px",
                            lineHeight: 1.3,
                        }}>
                            {dataInit.jobTitleName}
                        </h2>

                        {/* Dept */}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, marginBottom: 14 }}>
                            <span style={{ color: "#6b7280", fontWeight: 500, textTransform: "uppercase" }}>CÔNG TY CỔ PHẦN V LOTUS HOLDINGS</span>
                            <span style={{ color: "#d1d5db" }}>›</span>
                            <span style={{ color: "#6b7280", fontWeight: 500 }}>{dataInit.departmentName}</span>
                        </div>

                        {/* Tags */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: "#1677ff",
                                background: "#e6f4ff", border: "1px solid #91caff",
                                borderRadius: 20, padding: "2px 10px", fontFamily: "monospace",
                            }}>
                                {dataInit.positionLevelCode || "—"}
                            </span>
                            <span style={{
                                fontSize: 12, fontWeight: 700,
                                color: dataInit.active ? "#15803d" : "#6b7280",
                                background: dataInit.active ? "#f0fdf4" : "#f9fafb",
                                border: `1px solid ${dataInit.active ? "#bbf7d0" : "#e5e7eb"}`,
                                borderRadius: 20, padding: "2px 10px",
                            }}>
                                {dataInit.active ? "Đang hoạt động" : "Nháp"}
                            </span>
                            {dataInit.requiredTime && (
                                <span style={{ fontSize: 12, color: "#6b7280" }}>
                                    Thời gian giữ vị trí: <b style={{ color: "#374151" }}>{dataInit.requiredTime}</b>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ── BODY ── */}
                    <div style={{ padding: screens.md ? "20px 24px" : "16px", maxHeight: "70vh", overflowY: "auto" }}>

                        {/* ── CUSTOM TAB BAR ── */}
                        <div style={{
                            display: "flex",
                            gap: 4,
                            marginBottom: 20,
                            background: "#fff",
                            borderRadius: 12,
                            padding: 6,
                            border: "1px solid #eef0f5",
                            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                            overflowX: "auto",
                            WebkitOverflowScrolling: "touch",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                        }}>
                            {[
                                { key: "1", label: "Thông tin chung" },
                                { key: "2", label: "Tiêu chuẩn & Yêu cầu" },
                                { key: "3", label: "Đào tạo & Đánh giá" },
                                { key: "4", label: "Ghi chú" },
                            ].map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        style={{
                                            border: "none",
                                            outline: "none",
                                            background: isActive ? "#e8637a" : "transparent",
                                            color: isActive ? "#fff" : "#6b7280",
                                            padding: "9px 20px",
                                            borderRadius: 8,
                                            fontSize: 14,
                                            fontWeight: isActive ? 700 : 500,
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            boxShadow: isActive ? "0 2px 8px rgba(232,99,122,.35)" : "none",
                                            flex: screens.md ? 1 : "none",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = "#f3f4f6";
                                                e.currentTarget.style.color = "#111827";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = "transparent";
                                                e.currentTarget.style.color = "#4b5563";
                                            }
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                        {/* ── CONTENT ── */}
                        {activeTab === "1" && (
                            <div style={{
                                background: "#fff", borderRadius: 12,
                                border: "1px solid #eef0f5", overflow: "hidden",
                                boxShadow: "0 2px 10px rgba(0,0,0,.045)",
                            }}>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: 1,
                                    background: "#f3f4f6",
                                }}>
                                    {[
                                        { label: "Người tạo", value: dataInit.createdBy },
                                        { label: "Ngày tạo", value: dataInit.createdAt ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm") : null },
                                        { label: "Người cập nhật", value: dataInit.updatedBy },
                                        { label: "Ngày cập nhật", value: dataInit.updatedAt ? dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm") : null },
                                    ].map((item, i) => (
                                        <div key={i} style={{ background: "#fff", padding: "16px 22px" }}>
                                            <div style={{
                                                fontSize: 10, fontWeight: 700, color: "#9ca3af",
                                                letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6,
                                            }}>
                                                {item.label}
                                            </div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                                                {item.value || "—"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "2" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ background: "#fff", padding: "20px 24px", borderRadius: 12, border: "1px solid #eef0f5", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: "#e8637a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
                                        <TrophyOutlined /> Tiêu chuẩn chức danh
                                    </div>
                                    {renderLongText(dataInit.jobStandard)}
                                </div>
                                <div style={{ background: "#fff", padding: "20px 24px", borderRadius: 12, border: "1px solid #eef0f5", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: "#e8637a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
                                        <TrophyOutlined /> Yêu cầu hiệu quả công việc
                                    </div>
                                    {renderLongText(dataInit.performanceRequirement)}
                                </div>
                            </div>
                        )}

                        {activeTab === "3" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ background: "#fff", padding: "20px 24px", borderRadius: 12, border: "1px solid #eef0f5", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: "#e8637a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
                                        <BookOutlined /> Yêu cầu đào tạo
                                    </div>
                                    {renderLongText(dataInit.trainingRequirement)}
                                </div>
                                <div style={{ background: "#fff", padding: "20px 24px", borderRadius: 12, border: "1px solid #eef0f5", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: "#e8637a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
                                        <InfoCircleOutlined /> Phương pháp đánh giá
                                    </div>
                                    {renderLongText(dataInit.evaluationMethod)}
                                </div>
                                <div style={{ background: "#fff", padding: "20px 24px", borderRadius: 12, border: "1px solid #eef0f5", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: "#e8637a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
                                        <TrophyOutlined /> Kết quả đào tạo
                                    </div>
                                    {renderLongText(dataInit.trainingOutcome)}
                                </div>
                            </div>
                        )}

                        {activeTab === "4" && (
                            <div style={{ background: "#fff", padding: "20px 24px", borderRadius: 12, border: "1px solid #eef0f5", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontWeight: 700, fontSize: 16, color: "#e8637a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em" }}>
                                    <FileTextOutlined /> Ghi chú về lương
                                </div>
                                {renderLongText(dataInit.salaryNote)}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>Không có dữ liệu</div>
            )}
        </Modal>
    );
};

export default ViewCareerPath;