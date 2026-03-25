import type { IJobDescription } from "@/types/backend";

const ACCENT = "#e8637a";
const ACCENT_LIGHT = "#fff0f3";
const ACCENT_BORDER = "#ffd6dd";

interface Props {
    tasks?: IJobDescription["tasks"];
}

const Tab3Tasks = ({ tasks }: Props) => {
    if (!tasks?.length) return (
        <div style={{
            background: "#fff", borderRadius: 14, padding: 40,
            textAlign: "center", color: "#9ca3af", border: "1px solid #eef0f5",
        }}>
            Chưa có nhiệm vụ nào
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tasks.slice().sort((a, b) => a.orderNo - b.orderNo).map((task, index) => (
                <div key={index} style={{
                    background: "#fff", borderRadius: 12, overflow: "hidden",
                    border: "1px solid #eef0f5", boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                }}>
                    <div style={{
                        padding: "12px 20px", background: "#fafafa",
                        borderBottom: "1px solid #f3f4f6",
                        display: "flex", alignItems: "center", gap: 12,
                    }}>
                        <span style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800, color: ACCENT, flexShrink: 0,
                        }}>
                            {index + 1}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                            {task.title}
                        </span>
                    </div>
                    <div style={{ padding: "14px 20px 16px" }}>
                        <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                            {task.content}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Tab3Tasks;