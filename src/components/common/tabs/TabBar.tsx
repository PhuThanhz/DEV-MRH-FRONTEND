import type React from "react";
import Access from "@/components/share/access";

type Permission = {
    method: string;
    apiPath: string;
    module: string;
};

export type TabItem<T extends string = string> = {
    key: T;
    label: string;
    icon?: React.ReactNode;
    permission?: Permission;
    hidden?: boolean;
};

type Props<T extends string> = {
    tabs: TabItem<T>[];
    activeKey: T;
    onChange: (key: T) => void;
};

const getTabStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 18px",
    borderRadius: 8,
    border: `1.5px solid ${active ? "#E8356D" : "transparent"}`,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? "#E8356D" : "#636366",
    background: active ? "#ffffff" : "transparent",
    outline: "none",
    transition: "all 0.15s cubic-bezier(.4,0,.2,1)",
    letterSpacing: -0.1,
    whiteSpace: "nowrap",
});

function TabBar<T extends string>({ tabs, activeKey, onChange }: Props<T>) {
    return (
        <div style={{
            display: "inline-flex",
            background: "#f2f2f7",
            borderRadius: 10,
            padding: 3,
            gap: 2,
        }}>
            {tabs.map((tab) => {
                if (tab.hidden) return null;

                const button = (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        style={getTabStyle(activeKey === tab.key)}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                );

                return tab.permission ? (
                    <Access key={tab.key} permission={tab.permission} hideChildren>
                        {button}
                    </Access>
                ) : button;
            })}
        </div>
    );
}

export default TabBar;