import { Table } from "antd";
import type { IJobDescription } from "@/types/backend";

const ACCENT = "#e8637a";
const ACCENT_LIGHT = "#fff0f3";
const ACCENT_BORDER = "#ffd6dd";

const toLines = (val?: string): string[] => {
    if (!val) return [];
    return val.split(/\n|•/).map((x) => x.trim().replace(/^-\s*/, "")).filter(Boolean);
};

interface Props {
    requirements?: IJobDescription["requirements"];
}

const Tab4Requirements = ({ requirements }: Props) => {
    const rows = [
        { key: 1, title: "Kiến thức", lines: toLines(requirements?.knowledge) },
        { key: 2, title: "Kinh nghiệm", lines: toLines(requirements?.experience) },
        { key: 3, title: "Kỹ năng", lines: toLines(requirements?.skills) },
        { key: 4, title: "Phẩm chất", lines: toLines(requirements?.qualities) },
        { key: 5, title: "Yêu cầu khác", lines: toLines(requirements?.otherRequirements) },
    ].filter((r) => r.lines.length > 0);

    const columns = [
        {
            title: "STT", dataIndex: "key", width: 56, align: "center" as const,
            render: (v: number) => (
                <span style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: ACCENT,
                }}>{v}</span>
            ),
        },
        {
            title: "Nhóm yêu cầu", dataIndex: "title", width: 160,
            render: (t: string) => (
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{t}</span>
            ),
        },
        {
            title: "Chi tiết", dataIndex: "lines",
            render: (lines: string[]) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {lines.map((line, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, flexShrink: 0, marginTop: 7 }} />
                            <span>{line}</span>
                        </div>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div style={{
            background: "#fff", borderRadius: 14, overflow: "hidden",
            border: "1px solid #eef0f5", boxShadow: "0 2px 10px rgba(0,0,0,.045)",
        }}>
            {rows.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Chưa có yêu cầu nào</div>
            ) : (
                <Table bordered={false} pagination={false} columns={columns} dataSource={rows}
                    style={{ fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif" }} />
            )}
        </div>
    );
};

export default Tab4Requirements;