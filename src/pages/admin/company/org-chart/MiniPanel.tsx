import { useMemo, useState } from "react";
import { CloseOutlined, UserOutlined, SearchOutlined, PushpinOutlined, DoubleRightOutlined } from "@ant-design/icons";
import { type Node, type Edge } from "reactflow";
import "./org-chart.css";

interface Props {
    nodeId: string | null;
    nodes: Node[];
    edges: Edge[];

    onClose: () => void;
    isMobile?: boolean;
    isTablet?: boolean;
    isSmallLaptop?: boolean;
}

type PanelPerson = {
    id: string;
    name: string;
    caption: string;
    badge?: string;
    muted?: boolean;
};

const MiniPanel = ({ nodeId, nodes, edges, onClose, isMobile = false, isTablet = false, isSmallLaptop = false }: Props) => {
    const [activeTab, setActiveTab] = useState<"people" | "communication">("people");
    const [searchText, setSearchText] = useState("");

    const PANEL_W = isMobile ? 320 : isTablet || isSmallLaptop ? 360 : 400;
    const node = useMemo(() => nodeId ? nodes.find((n) => n.id === nodeId) : null, [nodeId, nodes]);
    const childNodes = useMemo(() => {
        if (!nodeId) return [];
        const childIds = new Set(edges.filter((e) => e.source === nodeId).map((e) => e.target));
        return nodes.filter((n) => childIds.has(n.id));
    }, [edges, nodeId, nodes]);

    if (!nodeId || !node) return null;

    const { title, levelCode, holderName } = node.data as {
        title: string; levelCode?: string; holderName?: string;
    };
    const isDepartment = !levelCode && !holderName;

    const supervisors: PanelPerson[] = holderName
        ? [{
            id: `${nodeId}-holder`,
            name: holderName,
            caption: isDepartment ? title : levelCode ? `${title}` : "Giám sát viên",
            badge: "Giám sát viên",
        }]
        : [{
            id: `${nodeId}-empty-holder`,
            name: "Chưa bổ nhiệm",
            caption: isDepartment ? "Phòng ban chưa có người đại diện" : "Chức vụ chưa có người đảm nhiệm",
            muted: true,
        }];

    const employees: PanelPerson[] = childNodes.map((child) => {
        const childData = child.data as { title?: string; levelCode?: string; holderName?: string };
        const childBadge = childData.levelCode || (!childData.holderName ? "Phòng ban" : undefined);
        return {
            id: child.id,
            name: childData.holderName || childData.title || "Chưa cập nhật",
            caption: childData.holderName ? childData.title || "Chức vụ chưa cập nhật" : "Chức vụ chưa được quy định",
            badge: childBadge,
            muted: !childData.holderName,
        };
    });

    const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const keyword = normalize(searchText.trim());
    const filterPeople = (items: PanelPerson[]) => keyword
        ? items.filter((item) => normalize(`${item.name} ${item.caption} ${item.badge ?? ""}`).includes(keyword))
        : items;
    const filteredSupervisors = filterPeople(supervisors);
    const filteredEmployees = filterPeople(employees);
    const visiblePeopleCount = supervisors.filter((item) => !item.muted).length + employees.length;

    const fs = {
        title: isMobile ? 18 : 22,
        tab: isMobile ? 12 : 14,
        section: isMobile ? 14 : 16,
        name: isMobile ? 14 : 16,
        caption: isMobile ? 12 : 14,
    };

    const PersonRow = ({ person }: { person: PanelPerson }) => (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 10 : 14,
            padding: isMobile ? "10px 0" : "12px 0",
        }}>
            <div style={{
                width: isMobile ? 36 : 44,
                height: isMobile ? 36 : 44,
                borderRadius: "50%",
                background: person.muted ? "#eef1f5" : "#64748b",
                color: person.muted ? "#a1a8b3" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontWeight: 850,
                fontSize: isMobile ? 13 : 16,
                boxShadow: person.muted ? "none" : "0 6px 16px -10px rgba(15, 23, 42, 0.45)",
            }}>
                {person.muted ? <UserOutlined style={{ fontSize: isMobile ? 16 : 19 }} /> : person.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{
                        fontSize: fs.name,
                        fontWeight: 650,
                        color: person.muted ? "#6b7280" : "#333333",
                        lineHeight: 1.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}>
                        {person.name}
                    </span>
                    {person.badge && (
                        <span style={{
                            flexShrink: 0,
                            maxWidth: isMobile ? 92 : 130,
                            borderRadius: 999,
                            background: "#f1f5f9",
                            color: "#64748b",
                            border: "1px solid #e2e8f0",
                            fontSize: isMobile ? 10 : 11,
                            fontWeight: 800,
                            padding: "3px 8px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}>
                            {person.badge}
                        </span>
                    )}
                </div>
                <div style={{
                    fontSize: fs.caption,
                    color: "#9ca3af",
                    lineHeight: 1.3,
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}>
                    {person.caption}
                </div>
            </div>
        </div>
    );

    const EmptyState = ({ text }: { text: string }) => (
        <div style={{
            padding: isMobile ? "18px 0" : "24px 0",
            color: "#a8b0bb",
            fontSize: fs.caption,
            textAlign: "center",
        }}>
            {text}
        </div>
    );

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                zIndex: 100,
                width: `min(${PANEL_W}px, 100vw)`,
                background: "#ffffff",
                boxShadow: "-8px 0 28px rgba(15, 23, 42, 0.12)",
                overflow: "hidden",
                animation: "orgPanelSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                pointerEvents: "auto",
                display: "flex",
                flexDirection: "column",
                borderRadius: isMobile ? 0 : "24px 0 0 24px",
            }}
        >
                <div style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                padding: isMobile ? "16px 16px 14px" : "22px 24px 20px",
            }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: isMobile ? 14 : 22 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                            fontSize: fs.title,
                            fontWeight: 750,
                            color: "#333333",
                            lineHeight: 1.22,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                        }}>
                            {title}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: isMobile ? 12 : 20 }}>
                    {([
                        { key: "people", label: `Tổng số nhân viên ${visiblePeopleCount}` },
                    ] as const).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                height: isMobile ? 36 : 42,
                                minWidth: 0,
                                padding: isMobile ? "0 10px" : "0 18px",
                                borderRadius: 5,
                                border: activeTab === tab.key ? "1px solid #b8c0cb" : "1px solid #e4e7eb",
                                background: "#ffffff",
                                color: activeTab === tab.key ? "#737b87" : "#b7bdc6",
                                cursor: "pointer",
                                fontSize: fs.tab,
                                fontWeight: 750,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === "people" ? (
                    <>
                        <div style={{
                            height: isMobile ? 40 : 48,
                            borderRadius: 999,
                            background: "#f4f5f7",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: isMobile ? "0 14px" : "0 18px",
                            marginBottom: isMobile ? 16 : 22,
                            flexShrink: 0,
                        }}>
                            <SearchOutlined style={{ fontSize: isMobile ? 16 : 20, color: "#b6bdc7" }} />
                            <input
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Tìm theo tên hoặc chức vụ"
                                style={{
                                    border: "none",
                                    outline: "none",
                                    background: "transparent",
                                    width: "100%",
                                    fontSize: isMobile ? 13 : 16,
                                    color: "#4b5563",
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>

                        <div style={{ overflowY: "auto", minHeight: 0, paddingRight: 4 }}>
                            <div style={{
                                fontSize: fs.section,
                                fontWeight: 750,
                                color: "#3f3f46",
                                lineHeight: 1.3,
                                marginBottom: isMobile ? 6 : 10,
                            }}>
                                Giám sát viên <span style={{ color: "#c4c9d1" }}>{supervisors.filter((item) => !item.muted).length}</span>
                            </div>
                            {filteredSupervisors.length ? filteredSupervisors.map((person) => (
                                <PersonRow key={person.id} person={person} />
                            )) : <EmptyState text="Không tìm thấy giám sát viên" />}

                            <div style={{
                                fontSize: fs.section,
                                fontWeight: 750,
                                color: "#3f3f46",
                                lineHeight: 1.3,
                                marginTop: isMobile ? 14 : 20,
                                marginBottom: isMobile ? 6 : 10,
                            }}>
                                Nhân viên <span style={{ color: "#c4c9d1" }}>{employees.length}</span>
                            </div>
                            {filteredEmployees.length ? filteredEmployees.map((person) => (
                                <PersonRow key={person.id} person={person} />
                            )) : <EmptyState text={searchText ? "Không tìm thấy nhân viên" : "Chưa có node con trực tiếp"} />}
                        </div>
                    </>
                ) : (
                    <div style={{
                        flex: 1,
                        borderRadius: 12,
                        background: "#f7f8fa",
                        color: "#9ca3af",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        textAlign: "center",
                        padding: 24,
                    }}>
                        <PushpinOutlined style={{ fontSize: isMobile ? 20 : 24 }} />
                        <div style={{ fontSize: fs.caption, lineHeight: 1.45 }}>
                            Chưa có dữ liệu truyền thông cho node này.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MiniPanel;
