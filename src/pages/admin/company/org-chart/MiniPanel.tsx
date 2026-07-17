import { memo, useMemo, useState } from "react";
import { CloseOutlined, UserOutlined, SearchOutlined } from "@ant-design/icons";
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

const PersonRow = memo(({
    person,
    isMobile,
    nameSize,
    captionSize,
}: {
    person: PanelPerson;
    isMobile: boolean;
    nameSize: number;
    captionSize: number;
}) => (
    <div style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 10 : 12,
        padding: isMobile ? 10 : 12,
        border: `1px solid ${person.muted ? "#e5e7eb" : "#edf1f5"}`,
        borderRadius: 8,
        background: person.muted ? "#f8fafc" : "#ffffff",
    }}>
        <div style={{
            width: isMobile ? 36 : 38,
            height: isMobile ? 36 : 38,
            borderRadius: "50%",
            background: person.muted ? "#eef1f5" : "#64748b",
            color: person.muted ? "#a1a8b3" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontWeight: 850,
            fontSize: isMobile ? 13 : 16,
            boxShadow: person.muted ? "none" : "0 6px 14px -9px rgba(15, 23, 42, 0.42)",
        }}>
            {person.muted ? <UserOutlined style={{ fontSize: isMobile ? 16 : 19 }} /> : person.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, minWidth: 0 }}>
                <span style={{
                    fontSize: nameSize,
                    fontWeight: 650,
                    color: person.muted ? "#6b7280" : "#333333",
                    lineHeight: 1.3,
                    width: "100%",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                }}>
                    {person.name}
                </span>
                {person.badge && (
                    <span style={{
                        flexShrink: 0,
                        maxWidth: "100%",
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
                fontSize: captionSize,
                color: "#9ca3af",
                lineHeight: 1.3,
                marginTop: 3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
            }}>
                {person.caption}
            </div>
        </div>
    </div>
));

const EmptyState = ({ text, isMobile, fontSize }: { text: string; isMobile: boolean; fontSize: number }) => (
    <div style={{
        padding: isMobile ? "14px" : "16px",
        border: "1px dashed #d8dee7",
        borderRadius: 8,
        background: "#fafbfc",
        color: "#98a2b1",
        fontSize,
        textAlign: "center",
    }}>
        {text}
    </div>
);

const MiniPanel = ({ nodeId, nodes, edges, onClose, isMobile = false, isTablet = false, isSmallLaptop = false }: Props) => {
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
            caption: title,
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
    const showSearch = visiblePeopleCount > 5;
    const fs = {
        title: isMobile ? 18 : 20,
        section: isMobile ? 14 : 16,
        name: isMobile ? 14 : 16,
        caption: isMobile ? 12 : 14,
    };

    return (
        <div
            style={{
                position: "absolute",
                top: isMobile ? 0 : 16,
                right: isMobile ? 0 : 16,
                bottom: isMobile ? 0 : 16,
                zIndex: 100,
                width: `min(${PANEL_W}px, 100vw)`,
                height: "auto",
                background: "#ffffff",
                border: "1px solid rgba(203, 213, 225, 0.9)",
                boxShadow: "0 18px 48px -18px rgba(15, 23, 42, 0.28), 0 4px 14px rgba(15, 23, 42, 0.06)",
                overflow: "hidden",
                animation: "orgPanelSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
                pointerEvents: "auto",
                display: "flex",
                flexDirection: "column",
                borderRadius: isMobile ? 0 : 12,
            }}
        >
                <div style={{
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                padding: isMobile ? "16px 16px 14px" : "18px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: isMobile ? 14 : 16 }}>
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
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng thông tin node"
                        title="Đóng"
                        style={{
                            width: 34,
                            height: 34,
                            flex: "0 0 auto",
                            display: "grid",
                            placeItems: "center",
                            padding: 0,
                            border: "1px solid #fecdd6",
                            borderRadius: 7,
                            background: "#fff1f4",
                            color: "#d94c66",
                            cursor: "pointer",
                            fontSize: isMobile ? 14 : 16,
                        }}
                    >
                        <CloseOutlined />
                    </button>
                </div>

                <>
                        {showSearch && <div style={{
                            height: isMobile ? 40 : 42,
                            borderRadius: 8,
                            background: "#f4f5f7",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: isMobile ? "0 14px" : "0 18px",
                            marginBottom: isMobile ? 16 : 18,
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
                        </div>}

                        <div style={{ overflowY: "auto", minHeight: 0, paddingRight: 2 }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: isMobile ? 12 : 13,
                                fontWeight: 750,
                                color: "#475569",
                                lineHeight: 1.3,
                                marginBottom: isMobile ? 6 : 10,
                            }}>
                                <span>Người phụ trách</span>
                                <span style={{ minWidth: 22, height: 22, display: "grid", placeItems: "center", padding: "0 6px", borderRadius: 999, background: "#f1f5f9", color: "#64748b", fontSize: 11 }}>{supervisors.filter((item) => !item.muted).length}</span>
                            </div>
                            {filteredSupervisors.length ? filteredSupervisors.map((person) => (
                                <PersonRow key={person.id} person={person} isMobile={isMobile} nameSize={fs.name} captionSize={fs.caption} />
                            )) : <EmptyState text="Không tìm thấy người phụ trách" isMobile={isMobile} fontSize={fs.caption} />}

                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: isMobile ? 12 : 13,
                                fontWeight: 750,
                                color: "#475569",
                                lineHeight: 1.3,
                                marginTop: isMobile ? 14 : 16,
                                marginBottom: isMobile ? 6 : 10,
                            }}>
                                <span>Nhân viên trực thuộc</span>
                                <span style={{ minWidth: 22, height: 22, display: "grid", placeItems: "center", padding: "0 6px", borderRadius: 999, background: "#f1f5f9", color: "#64748b", fontSize: 11 }}>{employees.length}</span>
                            </div>
                            {filteredEmployees.length ? filteredEmployees.map((person) => (
                                <PersonRow key={person.id} person={person} isMobile={isMobile} nameSize={fs.name} captionSize={fs.caption} />
                            )) : <EmptyState text={searchText ? "Không tìm thấy nhân viên" : "Chưa có node con trực tiếp"} isMobile={isMobile} fontSize={fs.caption} />}
                        </div>
                </>
            </div>
        </div>
    );
};

export default MiniPanel;
