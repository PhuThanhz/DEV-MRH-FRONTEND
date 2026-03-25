import dayjs from "dayjs";
import type { IJobDescription } from "@/types/backend";

const ACCENT = "#e8637a";
const ACCENT_LIGHT = "#fff0f3";
const ACCENT_BORDER = "#ffd6dd";

interface Props {
    jd: IJobDescription & { companyName?: string; departmentName?: string; jobTitleName?: string };
    statusInfo?: { label: string; color: string; bg: string; border: string } | null;
}

const Tab1General = ({ jd, statusInfo }: Props) => (
    <div style={{
        background: "#fff", borderRadius: 14,
        border: "1px solid #eef0f5", overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,.045)",
    }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#f3f4f6" }}>
            {[
                { label: "Mã JD", value: jd.code },
                { label: "Trạng thái", value: statusInfo?.label },
                { label: "Cấp quản lý trực tiếp", value: jd.reportTo },
                { label: "Trực thuộc bộ phận", value: jd.belongsTo },
                { label: "Phối hợp công tác với", value: jd.collaborateWith },
                { label: "Ngày hiệu lực", value: jd.effectiveDate ? dayjs(jd.effectiveDate).format("DD/MM/YYYY") : undefined },
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

        {jd.positions && jd.positions.length > 0 && (
            <div style={{ padding: "16px 22px", borderTop: "1px solid #f3f4f6" }}>
                <div style={{
                    fontSize: 10, fontWeight: 700, color: "#9ca3af",
                    letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
                }}>
                    Vị trí trong sơ đồ ({jd.positions.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {jd.positions.map((pos, idx) => (
                        <div key={idx} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                            borderRadius: 8, padding: "7px 14px",
                        }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: ACCENT }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#9f1239" }}>
                                {pos.nodeName ?? `Node #${pos.nodeId}`}
                            </span>
                            {pos.levelCode && (
                                <span style={{
                                    fontSize: 10, color: ACCENT,
                                    background: "#fff", border: `1px solid ${ACCENT_BORDER}`,
                                    borderRadius: 20, padding: "1px 8px", fontWeight: 700,
                                }}>
                                    {pos.levelCode}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export default Tab1General;