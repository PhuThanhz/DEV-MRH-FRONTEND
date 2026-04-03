import { AppstoreOutlined, ApartmentOutlined } from "@ant-design/icons";
import { T } from "../constants";

type ViewMode = "department" | "band";

interface SegmentedControlProps {
    value: ViewMode;
    onChange: (v: ViewMode) => void;
}

const SegmentedControl = ({ value, onChange }: SegmentedControlProps) => {
    const options = [
        { value: "department" as ViewMode, label: "Phòng ban", icon: <AppstoreOutlined /> },
        { value: "band" as ViewMode, label: "Cấp bậc (Band)", icon: <ApartmentOutlined /> },
    ];

    return (
        <div style={{
            display: "inline-flex",
            background: T.s2,
            borderRadius: 9,
            padding: 3,
            gap: 2,
            border: `1px solid ${T.line}`,
        }}>
            {options.map((o) => {
                const active = value === o.value;
                return (
                    <button
                        key={o.value}
                        onClick={() => onChange(o.value)}
                        style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "6px 14px",
                            borderRadius: 7,
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12.5,
                            fontWeight: active ? 600 : 400,
                            color: active ? T.ink : T.ink3,
                            background: active ? T.white : "transparent",
                            boxShadow: active
                                ? "0 1px 4px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.07)"
                                : "none",
                            transition: "all 0.15s cubic-bezier(.4,0,.2,1)",
                            letterSpacing: -0.1,
                        }}
                    >
                        <span style={{ fontSize: 12, opacity: active ? 0.8 : 0.45 }}>{o.icon}</span>
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
};

export default SegmentedControl;