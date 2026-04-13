import { useState, useEffect } from "react";
import { Modal, Spin, Button } from "antd";
import { FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import type { IJobDescription, IOrgNode } from "@/types/backend";
import { useJobDescriptionByIdQuery } from "@/hooks/useJobDescriptions";
import { useJdFlowLogsQuery } from "@/hooks/useJdFlow";
import { callFetchOrgNodes, callFetchOrgCharts, callFetchCompanyJobTitlesOfDepartment } from "@/config/api";
import dayjs from "dayjs";
import dagre from "dagre";
import type { Node, Edge } from "reactflow";

import Tab1General from "./components/Tab1General";
import Tab2OrgChart from "./components/Tab2OrgChart";
import Tab3Tasks from "./components/Tab3Tasks";
import Tab4Requirements from "./components/Tab4Requirements";
import Tab5History from "./components/Tab5History";
import { ReactFlowProvider } from "reactflow";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { exportJdToExcel } from "../components/exportPublishedJd";

const ACCENT = "#e8637a";
const ACCENT_LIGHT = "#fff0f3";
const ACCENT_BORDER = "#ffd6dd";
const NODE_W = 200;
const NODE_H = 120;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
    DRAFT: { label: "Nháp", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
    IN_REVIEW: { label: "Đang duyệt", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
    ISSUED: { label: "Đã ban hành", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
    REJECTED: { label: "Từ chối", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
};

const BASE_TABS = [
    { key: "1", label: "Thông tin chung" },
    { key: "2", label: "Sơ đồ vị trí" },
    { key: "3", label: "Mô tả công việc" },
    { key: "4", label: "Yêu cầu vị trí" },
];

export type EnrichedJD = IJobDescription & {
    companyName?: string;
    departmentName?: string;
    jobTitleName?: string;
};

interface Props {
    open: boolean;
    onClose: () => void;
    record: EnrichedJD | null;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 55 });
    g.setDefaultEdgeLabel(() => ({}));
    nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
    edges.forEach((e) => g.setEdge(e.source, e.target));
    dagre.layout(g);
    return {
        nodes: nodes.map((n) => {
            const pos = g.node(n.id);
            return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
        }),
        edges,
    };
};

const normStr = (s?: string | null) => (s ?? "").toLowerCase().trim();

// ── Responsive hook ──
function useIsMobile(breakpoint = 640) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth < breakpoint : false
    );
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, [breakpoint]);
    return isMobile;
}

export default function ViewJobDescription({ open, onClose, record }: Props) {
    const [activeTab, setActiveTab] = useState("1");
    const [rfNodes, setRfNodes] = useState<Node[]>([]);
    const [rfEdges, setRfEdges] = useState<Edge[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const isMobile = useIsMobile();

    // ── Permission check ──
    const canViewHistory = useAccess(ALL_PERMISSIONS.JD_FLOW.FETCH_LOGS);

    // ── Tabs động theo permission ──
    const TABS = [
        ...BASE_TABS,
        ...(canViewHistory ? [{ key: "5", label: "Lịch sử duyệt" }] : []),
    ];

    const jdId = open && record ? (record.id ?? (record as any).jdId) : undefined;

    const { data, isLoading } = useJobDescriptionByIdQuery(jdId);

    // ── Chỉ fetch logs khi có quyền ──
    const { data: logs } = useJdFlowLogsQuery(canViewHistory ? jdId : undefined);

    const jd: EnrichedJD | null = (data as EnrichedJD) ?? record;
    const statusInfo = jd?.status
        ? (STATUS_MAP[jd.status] ?? { label: jd.status, color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" })
        : null;

    useEffect(() => { if (open) setActiveTab("1"); }, [open]);

    useEffect(() => {
        if (!open || !jd) return;

        const buildAndSet = (raw: IOrgNode[], isHighlighted: (n: IOrgNode) => boolean) => {
            if (!raw.length) return;
            const nodes: Node[] = raw.map((n) => ({
                id: String(n.id), type: "orgFlowNode", position: { x: 0, y: 0 },
                data: { label: n.name ?? n.title ?? `Node #${n.id}`, sublabel: n.levelCode ?? n.level ?? "", variant: isHighlighted(n) ? "current" : "default" },
            }));
            const edges: Edge[] = raw.filter((n) => n.parentId).map((n) => ({
                id: `e-${n.parentId}-${n.id}`, source: String(n.parentId!), target: String(n.id), type: "orgEdge",
            }));
            const { nodes: laid, edges: laidEdges } = getLayoutedElements(nodes, edges);
            const finalNodes = laid.map((node) => {
                const saved = raw.find((n) => String(n.id) === node.id);
                if (saved?.posX != null && saved?.posY != null)
                    return { ...node, position: { x: saved.posX, y: saved.posY } };
                return node;
            });
            setRfNodes(finalNodes);
            setRfEdges(laidEdges);
        };

        const run = async () => {
            setLoadingChart(true);
            setRfNodes([]);
            setRfEdges([]);
            try {
                if (jd.positions?.length && jd.positions[0].chartId) {
                    const res = await callFetchOrgNodes(jd.positions[0].chartId) as any;
                    const raw: IOrgNode[] = res?.data ?? [];
                    const posNodeIds = new Set(jd.positions.map((p) => p.nodeId));
                    buildAndSet(raw, (n) => posNodeIds.has(n.id));
                    return;
                }
                if (!jd.departmentId) return;
                let matchName: string | null = record?.jobTitleName ?? null;
                if (!matchName && jd.departmentJobTitleId) {
                    const jtRes = await callFetchCompanyJobTitlesOfDepartment(jd.departmentId) as any;
                    const jts: any[] = jtRes?.data ?? [];
                    const matched = jts.find((jt) => jt.id === jd.departmentJobTitleId);
                    matchName = matched?.jobTitle?.nameVi ?? null;
                }
                const chartRes = await callFetchOrgCharts(`filter=departmentId='${jd.departmentId}'&page=1&pageSize=50`) as any;
                const charts: any[] = chartRes?.data?.result ?? [];
                if (!charts.length) return;
                const res = await callFetchOrgNodes(charts[0].id) as any;
                const raw: IOrgNode[] = res?.data ?? [];
                buildAndSet(raw, (n) => matchName ? normStr(n.name ?? n.title) === normStr(matchName) : false);
            } finally {
                setLoadingChart(false);
            }
        };

        run();
    }, [jd, open]); // eslint-disable-line

    const handleClose = () => {
        onClose();
        setActiveTab("1");
        setRfNodes([]);
        setRfEdges([]);
    };

    // ── Modal width: full trên mobile, giới hạn trên desktop ──
    const modalWidth = typeof window !== "undefined"
        ? (window.innerWidth < 640
            ? window.innerWidth - 24   // mobile: cách mép 12px mỗi bên
            : Math.min(900, window.innerWidth - 32))
        : 900;

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            width={modalWidth}
            style={{
                top: isMobile ? 16 : 20,   // cách top 16px thay vì 0
                maxWidth: "calc(100vw - 24px)",
            }}
            styles={{
                body: {
                    padding: 0,
                    background: "#f5f6fa",
                    borderRadius: 12,
                    overflow: "hidden",
                },
                content: {
                    borderRadius: 12,       // luôn có bo góc, kể cả mobile
                    padding: 0,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                },
            }}
            title={null}
            destroyOnClose
            getContainer={document.body}
        >
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                    <Spin size="large" />
                </div>
            ) : !jd ? (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: 60 }}>Không có dữ liệu</div>
            ) : (
                <div style={{
                    fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif",
                    background: "#f5f6fa",
                    borderRadius: 12,
                }}>

                    {/* ── HEADER ── */}
                    <div style={{
                        background: "#fff",
                        padding: isMobile ? "14px 14px 12px" : "18px 24px 14px",
                        borderBottom: "1px solid #eef0f5",
                    }}>
                        {/* Badge */}
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                            borderRadius: 20, padding: "3px 10px",
                            fontSize: 10, fontWeight: 700, color: ACCENT,
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            marginBottom: 8,
                        }}>
                            <FileTextOutlined style={{ fontSize: 10 }} /> Mô tả công việc
                        </span>

                        {/* Title */}
                        <h2 style={{
                            fontSize: isMobile ? 17 : 20,
                            fontWeight: 800,
                            color: "#111827",
                            margin: "0 0 6px",
                            lineHeight: 1.3,
                            wordBreak: "break-word",
                        }}>
                            {record?.jobTitleName ?? jd?.jobTitleName ?? "—"}
                        </h2>

                        {/* Company › Department */}
                        {(record?.companyName || record?.departmentName) && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 5,
                                fontSize: 12, flexWrap: "wrap", marginBottom: 8,
                            }}>
                                {record?.companyName && (
                                    <span style={{ color: "#6b7280", fontWeight: 500 }}>{record.companyName}</span>
                                )}
                                {record?.companyName && record?.departmentName && (
                                    <span style={{ color: "#d1d5db" }}>›</span>
                                )}
                                {record?.departmentName && (
                                    <span style={{ color: "#6b7280", fontWeight: 500 }}>{record.departmentName}</span>
                                )}
                            </div>
                        )}

                        {/* Code + Status + ReportTo */}
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            flexWrap: "wrap", marginBottom: 10,
                        }}>
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: "#1677ff",
                                background: "#e6f4ff", border: "1px solid #91caff",
                                borderRadius: 20, padding: "2px 10px", fontFamily: "monospace",
                            }}>
                                {jd.code ?? "—"}
                            </span>
                            {statusInfo && (
                                <span style={{
                                    fontSize: 12, fontWeight: 700,
                                    color: statusInfo.color, background: statusInfo.bg,
                                    border: `1px solid ${statusInfo.border}`,
                                    borderRadius: 20, padding: "2px 10px",
                                }}>
                                    {statusInfo.label}
                                </span>
                            )}
                            {jd.reportTo && (
                                <span style={{ fontSize: 12, color: "#6b7280" }}>
                                    Báo cáo: <b style={{ color: "#374151" }}>{jd.reportTo}</b>
                                </span>
                            )}
                        </div>

                        {/* Version + Date + Export button */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                        }}>
                            {jd.version != null && (
                                <span style={{
                                    fontSize: 11, fontWeight: 600, color: "#9ca3af",
                                    background: "#f9fafb", border: "1px solid #e5e7eb",
                                    borderRadius: 8, padding: "3px 10px",
                                }}>
                                    Phiên bản: {jd.version}
                                </span>
                            )}
                            {jd.effectiveDate && (
                                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                    Hiệu lực: {dayjs(jd.effectiveDate).format("DD/MM/YYYY")}
                                </span>
                            )}
                            {jd.createdAt && (
                                <span style={{ fontSize: 11, color: "#d1d5db" }}>
                                    Tạo: {dayjs(jd.createdAt).format("DD/MM/YYYY HH:mm")}
                                </span>
                            )}
                            <Button
                                icon={<DownloadOutlined />}
                                size="small"
                                onClick={() => exportJdToExcel(jd, logs ?? [])}
                                style={{
                                    background: ACCENT,
                                    borderColor: ACCENT,
                                    color: "#fff",
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    marginLeft: "auto", // đẩy button về cuối dòng
                                }}
                            >
                                Xuất Excel
                            </Button>
                        </div>
                    </div>

                    {/* ── BODY ── */}
                    <div style={{ padding: isMobile ? "12px 10px 24px" : "16px 20px 24px" }}>

                        {/* Tab bar — scroll ngang, không bị cắt */}
                        <div style={{
                            display: "flex",
                            gap: 4,
                            marginBottom: 16,
                            background: "#fff",
                            borderRadius: 12,
                            padding: 5,
                            border: "1px solid #eef0f5",
                            boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                            overflowX: "auto",
                            WebkitOverflowScrolling: "touch",
                            // Ẩn scrollbar nhưng vẫn scroll được
                            scrollbarWidth: "none",          // Firefox
                            msOverflowStyle: "none",         // IE/Edge
                        } as React.CSSProperties}>
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        style={{
                                            // Không dùng flex:1 khi mobile vì sẽ ép tab quá hẹp
                                            flex: isMobile ? "0 0 auto" : "1",
                                            padding: isMobile ? "8px 14px" : "9px 10px",
                                            borderRadius: 8,
                                            fontSize: isMobile ? 12 : 13,
                                            fontWeight: isActive ? 700 : 500,
                                            color: isActive ? "#fff" : "#6b7280",
                                            background: isActive ? ACCENT : "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            transition: "all 0.18s ease",
                                            boxShadow: isActive ? "0 2px 8px rgba(232,99,122,.35)" : "none",
                                            whiteSpace: "nowrap",
                                            minWidth: "fit-content",
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* CSS để ẩn scrollbar trên webkit */}
                        <style>{`
                            div::-webkit-scrollbar { display: none; }
                        `}</style>

                        {activeTab === "1" && <Tab1General jd={jd} statusInfo={statusInfo} />}
                        {activeTab === "2" && (
                            <ReactFlowProvider>
                                <Tab2OrgChart loading={loadingChart} nodes={rfNodes} edges={rfEdges} />
                            </ReactFlowProvider>
                        )}
                        {activeTab === "3" && <Tab3Tasks tasks={jd.tasks} />}
                        {activeTab === "4" && <Tab4Requirements requirements={jd.requirements} />}
                        {activeTab === "5" && canViewHistory && <Tab5History logs={logs} />}
                    </div>
                </div>
            )}
        </Modal>
    );
}