import { Typography } from "antd";
import { T } from "../constants";

const { Text } = Typography;

const EmptyState = ({ label }: { label: string }) => (
    <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "52px 24px",
        background: T.s1,
        borderRadius: 12,
        border: `1px dashed ${T.lineMed}`,
        gap: 8,
    }}>
        <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.s2, border: `1px solid ${T.line}`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke={T.ink4} strokeWidth="1.2" />
                <path d="M5 8h6M8 5v6" stroke={T.ink4} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        </div>
        <Text style={{ fontSize: 13, color: T.ink4, fontWeight: 500 }}>{label}</Text>
    </div>
);

export default EmptyState;