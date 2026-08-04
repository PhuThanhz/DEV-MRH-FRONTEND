import { Table } from "antd";
import type { IJobDescription, IJobDescriptionRequirementItem, RequirementCategory } from "@/types/backend";

const ACCENT = "#e8637a";
const ACCENT_LIGHT = "#fff0f3";
const ACCENT_BORDER = "#ffd6dd";

const byCategory = (items: IJobDescriptionRequirementItem[] | undefined, category: RequirementCategory) =>
    (items ?? [])
        .filter((item) => item.category === category)
        .slice()
        .sort((a, b) => a.orderNo - b.orderNo);

interface Props {
    requirements?: IJobDescription["requirements"];
}

const Tab4Requirements = ({ requirements }: Props) => {
    const rows = [
        { key: 1, title: "Kiến thức", items: byCategory(requirements?.items, "KNOWLEDGE") },
        { key: 2, title: "Kinh nghiệm", items: byCategory(requirements?.items, "EXPERIENCE") },
        { key: 3, title: "Kỹ năng", items: byCategory(requirements?.items, "SKILLS") },
        { key: 4, title: "Phẩm chất", items: byCategory(requirements?.items, "QUALITIES") },
        { key: 5, title: "Yêu cầu khác", items: byCategory(requirements?.items, "OTHER") },
    ].filter((r) => r.items.length > 0);

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
            title: "Chi tiết", dataIndex: "items",
            render: (items: IJobDescriptionRequirementItem[], row: { key: number }) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {items.map((item, i) => (
                        <div key={item.id ?? i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                            <span style={{ flexShrink: 0, fontWeight: 600, color: ACCENT, minWidth: 28 }}>
                                {row.key}.{i + 1}
                            </span>
                            <span>{item.content}</span>
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
                <Table
                    bordered={false}
                    pagination={false}
                    columns={columns}
                    dataSource={rows}
                    scroll={{ x: "max-content" }} // ← thêm
                    style={{ fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif" }}
                />
            )}
        </div>
    );
};

export default Tab4Requirements;
