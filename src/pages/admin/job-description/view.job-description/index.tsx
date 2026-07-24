import { useState, useEffect } from "react";
import { Button, Skeleton } from "antd";
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
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";

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

export default function ViewJobDescription({ open, onClose, record }: Props) {
    const [activeTab, setActiveTab] = useState("1");
    const [rfNodes, setRfNodes] = useState<Node[]>([]);
    const [rfEdges, setRfEdges] = useState<Edge[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
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
    }, [jd, open]);

    const handleClose = () => {
        onClose();
        setActiveTab("1");
        setRfNodes([]);
        setRfEdges([]);
    };

    return (
        <LotusDetailDrawer
            open={open}
            onClose={handleClose}
            closeAriaLabel="Đóng chi tiết mô tả công việc"
        >
            <div className="job-description-view-drawer flex h-full flex-col bg-white font-['Outfit','Nunito','Segoe_UI',sans-serif]">
                {isLoading ? (
                    <div className="flex-1 overflow-hidden bg-[#f8f9fb] px-5 py-7 sm:px-8">
                        <div className="mb-7 border-b border-gray-100 bg-white pb-6">
                            <Skeleton active paragraph={{ rows: 2 }} title={{ width: "34%" }} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="rounded-xl bg-white p-5">
                                    <Skeleton active paragraph={{ rows: 3 }} title={{ width: "48%" }} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : !jd ? (
                    <div className="flex flex-1 flex-col items-center justify-center bg-[#f8f9fb] px-6 text-center text-gray-400">
                        <FileTextOutlined className="mb-3 text-4xl text-gray-300" />
                        <span className="text-sm font-medium">Không có dữ liệu mô tả công việc</span>
                    </div>
                ) : (
                    <>
                        <header className="shrink-0 border-b border-gray-100 bg-white px-5 pb-5 pt-5 sm:px-8 sm:pb-6">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#e8637a]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#e8637a]" />
                                        Mô tả công việc
                                    </div>

                                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                                        <h2 className="m-0 min-w-0 text-[26px] font-bold leading-8 tracking-[-0.02em] text-gray-950 sm:text-[32px] sm:leading-10">
                                            {record?.jobTitleName ?? jd.jobTitleName ?? "—"}
                                        </h2>
                                        {statusInfo ? (
                                            <span
                                                className="shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold"
                                                style={{
                                                    color: statusInfo.color,
                                                    background: statusInfo.bg,
                                                    borderColor: statusInfo.border,
                                                }}
                                            >
                                                {statusInfo.label}
                                            </span>
                                        ) : null}
                                    </div>

                                    {(record?.companyName || record?.departmentName) ? (
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-gray-500">
                                            {record?.companyName ? <span>{record.companyName}</span> : null}
                                            {record?.companyName && record?.departmentName ? <span className="text-gray-300">/</span> : null}
                                            {record?.departmentName ? <span className="font-medium text-gray-700">{record.departmentName}</span> : null}
                                        </div>
                                    ) : null}

                                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-gray-500">
                                        <span className="font-mono font-semibold tabular-nums text-[#d94c66]">{jd.code ?? "—"}</span>
                                        {jd.reportTo ? <span>Báo cáo: <strong className="font-semibold text-gray-800">{jd.reportTo}</strong></span> : null}
                                        {jd.version != null ? <span>Phiên bản <strong className="font-semibold text-gray-800">{jd.version}</strong></span> : null}
                                        {jd.effectiveDate ? <span>Hiệu lực <strong className="font-semibold text-gray-800">{dayjs(jd.effectiveDate).format("DD/MM/YYYY")}</strong></span> : null}
                                        {jd.createdAt ? <span>Tạo {dayjs(jd.createdAt).format("DD/MM/YYYY HH:mm")}</span> : null}
                                    </div>
                                </div>

                                <Button
                                    icon={<DownloadOutlined />}
                                    onClick={() => exportJdToExcel(jd, logs ?? [])}
                                    className="!h-10 !shrink-0 !rounded-lg !border-[#e8637a] !bg-[#e8637a] !px-4 !font-semibold !text-white !shadow-sm hover:!border-[#d94c66] hover:!bg-[#d94c66]"
                                >
                                    Xuất Excel
                                </Button>
                            </div>
                        </header>

                        <nav className="shrink-0 border-b border-gray-100 bg-white px-3 sm:px-8" aria-label="Nội dung mô tả công việc">
                            <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {TABS.map((tab) => {
                                    const isActive = activeTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`relative min-w-fit border-0 bg-transparent px-4 py-4 text-[13px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8637a]/30 ${
                                                isActive
                                                    ? "font-semibold text-gray-950 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#e8637a]"
                                                    : "font-medium text-gray-500 hover:text-gray-900"
                                            }`}
                                            aria-current={isActive ? "page" : undefined}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        <main className="min-h-0 flex-1 overflow-auto bg-[#f8f9fb] px-4 pb-14 pt-5 sm:px-8 sm:pt-7">
                            <div className="mx-auto w-full max-w-[1440px]">
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
                        </main>
                    </>
                )}
            </div>
        </LotusDetailDrawer>
    );
}
