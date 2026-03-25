import { Handle, Position } from "reactflow";

const ACCENT = "#e8637a";
const NODE_W = 200;
const TITLE_AREA_H = 80;
const FOOTER_H = 36;

interface OrgNodeData {
    label: string;
    sublabel?: string;
    variant: "current" | "default";
}

const OrgFlowNode = ({ data }: { data: OrgNodeData }) => {
    const isCurrent = data.variant === "current";

    return (
        <>
            <Handle type="target" position={Position.Top}
                style={{ background: "transparent", border: "none", width: 1, height: 1, top: 0 }} />

            <div style={{
                width: NODE_W,
                background: "#ffffff",
                borderRadius: 14,
                border: `1.5px solid ${isCurrent ? ACCENT : "#eeeff2"}`,
                boxShadow: isCurrent
                    ? `0 10px 32px rgba(232,99,122,.22), 0 2px 8px rgba(0,0,0,.06)`
                    : "0 2px 12px rgba(0,0,0,.06)",
                overflow: "hidden",
                transform: isCurrent ? "scale(1.05)" : "none",
                transition: "all 0.22s ease",
                height: 4 + TITLE_AREA_H + FOOTER_H,
                display: "flex",
                flexDirection: "column",
            }}>
                <div style={{
                    height: 4, flexShrink: 0,
                    background: isCurrent
                        ? `linear-gradient(90deg, ${ACCENT} 0%, #f9a8b8 100%)`
                        : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%)",
                }} />

                <div style={{
                    height: TITLE_AREA_H, flexShrink: 0,
                    padding: "10px 12px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                }}>
                    <div style={{
                        background: isCurrent
                            ? "linear-gradient(135deg, #fff5f7 0%, #fff0f3 100%)"
                            : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                        border: `1px solid ${isCurrent ? "#ffd6e0" : "#e9ecf0"}`,
                        borderRadius: 10, padding: "0 12px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: "100%", height: "100%",
                    }}>
                        <span style={{
                            fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                            fontWeight: 600, fontSize: 12.5,
                            color: isCurrent ? "#be123c" : "#374151",
                            lineHeight: 1.5, textAlign: "center",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}>
                            {data.label}
                        </span>
                    </div>
                </div>

                <div style={{
                    height: FOOTER_H, flexShrink: 0,
                    borderTop: "1px solid #f3f4f6", background: "#fafafa",
                    padding: "0 12px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                }}>
                    {data.sublabel && (
                        <span style={{
                            fontSize: 9.5, fontWeight: 600,
                            fontFamily: "'JetBrains Mono','Courier New',monospace",
                            letterSpacing: "0.1em", color: ACCENT,
                            background: "linear-gradient(135deg, #fff0f3 0%, #ffe4ea 100%)",
                            border: "1px solid #ffd6e0", borderRadius: 5,
                            padding: "2px 8px", textTransform: "uppercase",
                            maxWidth: 120, overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                            {data.sublabel}
                        </span>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom}
                style={{ background: "transparent", border: "none", width: 1, height: 1, bottom: 0 }} />
        </>
    );
};

export default OrgFlowNode;