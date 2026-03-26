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

import { exportJdToExcel } from "../components/exportPublishedJd"; // ← thêm mới

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

const TABS = [
    { key: "1", label: "Thông tin chung" },
    { key: "2", label: "Sơ đồ vị trí" },
    { key: "3", label: "Mô tả công việc" },
    { key: "4", label: "Yêu cầu vị trí" },
    { key: "5", label: "Lịch sử duyệt" },
];

type EnrichedJD = IJobDescription & {
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

export default function ViewJobDescription({ open, onClose, record }: Props) {
    const [activeTab, setActiveTab] = useState("1");
    const [rfNodes, setRfNodes] = useState<Node[]>([]);
    const [rfEdges, setRfEdges] = useState<Edge[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);

    const jdId = open && record ? (record.id ?? (record as any).jdId) : undefined;

    const { data, isLoading } = useJobDescriptionByIdQuery(jdId);
    const { data: logs } = useJdFlowLogsQuery(jdId); // ← bỏ điều kiện activeTab === "5" để luôn fetch

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

    return (
        <Modal
            open={open} onCancel={handleClose} footer={null}
            width={900} style={{ top: 20 }}
            styles={{ body: { padding: 0, background: "#f5f6fa", borderRadius: 12, overflow: "hidden" } }}
            title={null} destroyOnClose
        >
            {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                    <Spin size="large" />
                </div>
            ) : !jd ? (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: 60 }}>Không có dữ liệu</div>
            ) : (
                <div style={{ fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif", background: "#f5f6fa", borderRadius: 12 }}>

                    {/* HEADER */}
                    <div style={{
                        background: "#fff", padding: "22px 28px 18px",
                        borderBottom: "1px solid #eef0f5",
                        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20,
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                                borderRadius: 20, padding: "3px 12px",
                                fontSize: 10, fontWeight: 700, color: ACCENT,
                                letterSpacing: "0.08em", textTransform: "uppercase", width: "fit-content",
                            }}>
                                <FileTextOutlined /> Mô tả công việc
                            </span>

                            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.3 }}>
                                {record?.jobTitleName ?? jd?.jobTitleName ?? "—"}
                            </h2>

                            {(record?.companyName || record?.departmentName) && (
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                                    {record?.companyName && <span style={{ color: "#6b7280", fontWeight: 500 }}>{record.companyName}</span>}
                                    {record?.companyName && record?.departmentName && <span style={{ color: "#d1d5db" }}>›</span>}
                                    {record?.departmentName && <span style={{ color: "#6b7280", fontWeight: 500 }}>{record.departmentName}</span>}
                                </div>
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span style={{
                                    fontSize: 12, fontWeight: 700, color: "#1677ff",
                                    background: "#e6f4ff", border: "1px solid #91caff",
                                    borderRadius: 20, padding: "2px 12px", fontFamily: "monospace",
                                }}>
                                    {jd.code ?? "—"}
                                </span>
                                {statusInfo && (
                                    <span style={{
                                        fontSize: 12, fontWeight: 700,
                                        color: statusInfo.color, background: statusInfo.bg,
                                        border: `1px solid ${statusInfo.border}`,
                                        borderRadius: 20, padding: "2px 12px",
                                    }}>
                                        {statusInfo.label}
                                    </span>
                                )}
                                {jd.reportTo && (
                                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                                        Báo cáo: <b style={{ color: "#374151" }}>{jd.reportTo}</b>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ← THAY ĐỔI: thêm nút Xuất Excel vào góc phải header */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                            {jd.version != null && (
                                <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 12px" }}>
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
                                    marginTop: 4,
                                    background: "#e8637a",
                                    borderColor: "#e8637a",
                                    color: "#fff",
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                            >
                                Xuất Excel
                            </Button>
                        </div>
                    </div>

                    {/* BODY */}
                    <div style={{ padding: "20px 28px 28px" }}>

                        {/* Tab bar */}
                        <div style={{
                            display: "flex", gap: 4, marginBottom: 20,
                            background: "#fff", borderRadius: 12, padding: 6,
                            border: "1px solid #eef0f5", boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                        }}>
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                        flex: 1, padding: "9px 12px", borderRadius: 8,
                                        fontSize: 13, fontWeight: isActive ? 700 : 500,
                                        color: isActive ? "#fff" : "#6b7280",
                                        background: isActive ? ACCENT : "transparent",
                                        border: "none", cursor: "pointer",
                                        transition: "all 0.18s ease",
                                        boxShadow: isActive ? "0 2px 8px rgba(232,99,122,.35)" : "none",
                                    }}>
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {activeTab === "1" && <Tab1General jd={jd} statusInfo={statusInfo} />}
                        {activeTab === "2" && <Tab2OrgChart loading={loadingChart} nodes={rfNodes} edges={rfEdges} />}
                        {activeTab === "3" && <Tab3Tasks tasks={jd.tasks} />}
                        {activeTab === "4" && <Tab4Requirements requirements={jd.requirements} />}
                        {activeTab === "5" && <Tab5History logs={logs} />}

                    </div>
                </div>
            )}
        </Modal>
    );
}