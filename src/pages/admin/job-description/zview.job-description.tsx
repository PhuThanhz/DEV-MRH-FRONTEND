// import { useState, useMemo, useEffect } from "react";
// import { Modal, Table, Spin } from "antd";
// import { FileTextOutlined } from "@ant-design/icons";
// import type { IJobDescription, IOrgNode } from "@/types/backend";
// import { useJobDescriptionByIdQuery } from "@/hooks/useJobDescriptions";
// import {
//     callFetchOrgNodes,
//     callFetchOrgCharts,
//     callFetchCompanyJobTitlesOfDepartment,
// } from "@/config/api";
// import dayjs from "dayjs";
// import dagre from "dagre";
// import ReactFlow, {
//     Background,
//     Controls,
//     Handle,
//     Position,
//     type Node,
//     type Edge,
// } from "reactflow";
// import "reactflow/dist/style.css";

// // ─── Constants ────────────────────────────────────────────────────────────────
// const ACCENT = "#e8637a";
// const ACCENT_LIGHT = "#fff0f3";
// const ACCENT_BORDER = "#ffd6dd";
// const NODE_W = 200;
// const NODE_H = 120; // 4 + 80 + 36

// const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
//     DRAFT: { label: "Nháp", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },

//     IN_REVIEW: {
//         label: "Đang duyệt",
//         color: "#1d4ed8",
//         bg: "#eff6ff",
//         border: "#bfdbfe",
//     },

//     ISSUED: {
//         label: "Đã ban hành",
//         color: "#15803d",
//         bg: "#f0fdf4",
//         border: "#bbf7d0",
//     },

//     REJECTED: {
//         label: "Từ chối",
//         color: "#b91c1c",
//         bg: "#fef2f2",
//         border: "#fecaca",
//     },
// };

// const TABS = [
//     { key: "1", label: "Thông tin chung" },
//     { key: "2", label: "Sơ đồ vị trí" },
//     { key: "3", label: "Mô tả công việc" },
//     { key: "4", label: "Yêu cầu vị trí" },
// ];

// // ─── EnrichedJD (nhận từ JobDescriptionPage — đã có *Name sẵn) ───────────────
// type EnrichedJD = IJobDescription & {
//     companyName?: string;
//     departmentName?: string;
//     jobTitleName?: string;
// };

// // ─── Dagre layout ─────────────────────────────────────────────────────────────
// const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
//     const g = new dagre.graphlib.Graph();
//     g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 55 });
//     g.setDefaultEdgeLabel(() => ({}));
//     nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
//     edges.forEach((e) => g.setEdge(e.source, e.target));
//     dagre.layout(g);
//     return {
//         nodes: nodes.map((n) => {
//             const pos = g.node(n.id);
//             return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
//         }),
//         edges,
//     };
// };

// // ─── Elbow edge ───────────────────────────────────────────────────────────────
// const OrgEdge = ({ id, sourceX, sourceY, targetX, targetY }: any) => {
//     const midY = (sourceY + targetY) / 2;
//     const d = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
//     return <path id={id} d={d} fill="none" stroke="#d1d5db" strokeWidth={1.5} />;
// };

// // ─── Org node (style giống OrgNodeCard) ──────────────────────────────────────
// interface OrgNodeData {
//     label: string;
//     sublabel?: string;
//     variant: "current" | "default";
// }

// const TITLE_AREA_H = 80;
// const FOOTER_H = 36;

// const OrgFlowNode = ({ data }: { data: OrgNodeData }) => {
//     const isCurrent = data.variant === "current";

//     return (
//         <>
//             <Handle type="target" position={Position.Top}
//                 style={{ background: "transparent", border: "none", width: 1, height: 1, top: 0 }} />

//             <div style={{
//                 width: NODE_W,
//                 background: "#ffffff",
//                 borderRadius: 14,
//                 border: `1.5px solid ${isCurrent ? ACCENT : "#eeeff2"}`,
//                 boxShadow: isCurrent
//                     ? `0 10px 32px rgba(232,99,122,.22), 0 2px 8px rgba(0,0,0,.06)`
//                     : "0 2px 12px rgba(0,0,0,.06)",
//                 overflow: "hidden",
//                 transform: isCurrent ? "scale(1.05)" : "none",
//                 transition: "all 0.22s ease",
//                 height: 4 + TITLE_AREA_H + FOOTER_H,
//                 display: "flex",
//                 flexDirection: "column",
//             }}>
//                 {/* Header bar */}
//                 <div style={{
//                     height: 4,
//                     flexShrink: 0,
//                     background: isCurrent
//                         ? `linear-gradient(90deg, ${ACCENT} 0%, #f9a8b8 100%)`
//                         : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 100%)",
//                 }} />

//                 {/* Title area */}
//                 <div style={{
//                     height: TITLE_AREA_H,
//                     flexShrink: 0,
//                     padding: "10px 12px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                 }}>
//                     <div style={{
//                         background: isCurrent
//                             ? "linear-gradient(135deg, #fff5f7 0%, #fff0f3 100%)"
//                             : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
//                         border: `1px solid ${isCurrent ? "#ffd6e0" : "#e9ecf0"}`,
//                         borderRadius: 10,
//                         padding: "0 12px",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         width: "100%",
//                         height: "100%",
//                         boxShadow: isCurrent
//                             ? "inset 0 1px 3px rgba(232,99,122,.08)"
//                             : "inset 0 1px 3px rgba(0,0,0,.03)",
//                     }}>
//                         <span style={{
//                             fontFamily: "'Be Vietnam Pro','Segoe UI',sans-serif",
//                             fontWeight: 600,
//                             fontSize: 12.5,
//                             color: isCurrent ? "#be123c" : "#374151",
//                             lineHeight: 1.5,
//                             textAlign: "center",
//                             letterSpacing: "0.01em",
//                             display: "-webkit-box",
//                             WebkitLineClamp: 3,
//                             WebkitBoxOrient: "vertical",
//                             overflow: "hidden",
//                         }}>
//                             {data.label}
//                         </span>
//                     </div>
//                 </div>

//                 {/* Footer */}
//                 <div style={{
//                     height: FOOTER_H,
//                     flexShrink: 0,
//                     borderTop: "1px solid #f3f4f6",
//                     background: "#fafafa",
//                     padding: "0 12px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                 }}>
//                     {data.sublabel && (
//                         <span style={{
//                             fontSize: 9.5,
//                             fontWeight: 600,
//                             fontFamily: "'JetBrains Mono','Courier New',monospace",
//                             letterSpacing: "0.1em",
//                             color: "#e8637a",
//                             background: "linear-gradient(135deg, #fff0f3 0%, #ffe4ea 100%)",
//                             border: "1px solid #ffd6e0",
//                             borderRadius: 5,
//                             padding: "2px 8px",
//                             textTransform: "uppercase",
//                             flexShrink: 0,
//                             maxWidth: 120,
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             whiteSpace: "nowrap",
//                         }}>
//                             {data.sublabel}
//                         </span>
//                     )}
//                 </div>
//             </div>

//             <Handle type="source" position={Position.Bottom}
//                 style={{ background: "transparent", border: "none", width: 1, height: 1, bottom: 0 }} />
//         </>
//     );
// };


// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const toLines = (val?: string): string[] => {
//     if (!val) return [];
//     return val.split(/\n|•/).map((x) => x.trim().replace(/^-\s*/, "")).filter(Boolean);
// };

// const normStr = (s?: string | null) => (s ?? "").toLowerCase().trim();

// // ─── Props ────────────────────────────────────────────────────────────────────
// interface Props {
//     open: boolean;
//     onClose: () => void;
//     record: EnrichedJD | null;
// }

// // ─── Component ────────────────────────────────────────────────────────────────
// export default function ViewJobDescription({ open, onClose, record }: Props) {
//     const [activeTab, setActiveTab] = useState("1");
//     useEffect(() => {
//         if (open) {
//             setActiveTab("1");
//         }
//     }, [open]);
//     // Fetch full JD (tasks, requirements, positions mới nhất)
//     const { data, isLoading } = useJobDescriptionByIdQuery(
//         open && record
//             ? (record.id ?? (record as any).jdId)
//             : undefined
//     );
//     const jd: EnrichedJD | null = (data as EnrichedJD) ?? record;

//     const statusInfo = jd?.status
//         ? (STATUS_MAP[jd.status] ?? { label: jd.status, color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" })
//         : null;

//     // ── Org chart state ───────────────────────────────────────────────────────
//     const [rfNodes, setRfNodes] = useState<Node[]>([]);
//     const [rfEdges, setRfEdges] = useState<Edge[]>([]);
//     const [loadingChart, setLoadingChart] = useState(false);

//     const nodeTypes = useMemo(() => ({ orgFlowNode: OrgFlowNode }), []);
//     const edgeTypes = useMemo(() => ({ orgEdge: OrgEdge }), []);

//     // ── Fetch org chart + highlight node của chức danh ────────────────────────
//     useEffect(() => {
//         if (!open || !jd) return;

//         // Helper: build ReactFlow nodes từ raw IOrgNode[]
//         const buildAndSet = (raw: IOrgNode[], isHighlighted: (n: IOrgNode) => boolean) => {
//             if (!raw.length) return;

//             const nodes: Node[] = raw.map((n) => ({
//                 id: String(n.id),
//                 type: "orgFlowNode",
//                 position: { x: 0, y: 0 },
//                 data: {
//                     label: n.name ?? n.title ?? `Node #${n.id}`,
//                     sublabel: n.levelCode ?? n.level ?? "",
//                     variant: isHighlighted(n) ? "current" : "default",
//                 } as OrgNodeData,
//             }));

//             const edges: Edge[] = raw
//                 .filter((n) => n.parentId)
//                 .map((n) => ({
//                     id: `e-${n.parentId}-${n.id}`,
//                     source: String(n.parentId!),
//                     target: String(n.id),
//                     type: "orgEdge",
//                 }));

//             const { nodes: laid, edges: laidEdges } = getLayoutedElements(nodes, edges);

//             // Ưu tiên posX/posY đã lưu
//             const finalNodes = laid.map((node) => {
//                 const saved = raw.find((n) => String(n.id) === node.id);
//                 if (saved?.posX != null && saved?.posY != null)
//                     return { ...node, position: { x: saved.posX, y: saved.posY } };
//                 return node;
//             });

//             setRfNodes(finalNodes);
//             setRfEdges(laidEdges);
//         };

//         const run = async () => {
//             setLoadingChart(true);
//             setRfNodes([]);
//             setRfEdges([]);
//             try {
//                 // ── Case 1: positions có data → highlight theo nodeId ─────────
//                 if (jd.positions?.length && jd.positions[0].chartId) {
//                     const res = await callFetchOrgNodes(jd.positions[0].chartId) as any;
//                     const raw: IOrgNode[] = res?.data ?? [];
//                     const posNodeIds = new Set(jd.positions.map((p) => p.nodeId));
//                     buildAndSet(raw, (n) => posNodeIds.has(n.id));
//                     return;
//                 }

//                 // ── Case 2: positions rỗng → fallback dùng departmentId ───────
//                 if (!jd.departmentId) return;

//                 // Lấy tên chức danh để match tên node
//                 let matchName: string | null = record?.jobTitleName ?? null;

//                 if (!matchName && jd.departmentJobTitleId) {
//                     // Fetch job titles của phòng ban để lấy tên
//                     const jtRes = await callFetchCompanyJobTitlesOfDepartment(jd.departmentId) as any;
//                     const jts: any[] = jtRes?.data ?? [];
//                     const matched = jts.find((jt) => jt.id === jd.departmentJobTitleId);
//                     matchName = matched?.jobTitle?.nameVi ?? null;
//                 }

//                 // Lấy org chart đầu tiên của phòng ban
//                 const chartRes = await callFetchOrgCharts(
//                     `filter=departmentId='${jd.departmentId}'&page=1&pageSize=50`
//                 ) as any;
//                 const charts: any[] = chartRes?.data?.result ?? [];
//                 if (!charts.length) return;

//                 const res = await callFetchOrgNodes(charts[0].id) as any;
//                 const raw: IOrgNode[] = res?.data ?? [];

//                 // Highlight node có tên khớp chức danh (so sánh lowercase)
//                 buildAndSet(raw, (n) =>
//                     matchName
//                         ? normStr(n.name ?? n.title) === normStr(matchName)
//                         : false
//                 );
//             } finally {
//                 setLoadingChart(false);
//             }
//         };

//         run();
//     }, [jd, open]); // eslint-disable-line

//     // ── Reset khi đóng ────────────────────────────────────────────────────────
//     const handleClose = () => {
//         onClose();
//         setActiveTab("1");
//         setRfNodes([]);
//         setRfEdges([]);
//     };

//     // ── Requirement table ─────────────────────────────────────────────────────
//     const reqRows = useMemo(() => {
//         if (!jd?.requirements) return [];
//         return [
//             { key: 1, title: "Kiến thức", lines: toLines(jd.requirements.knowledge) },
//             { key: 2, title: "Kinh nghiệm", lines: toLines(jd.requirements.experience) },
//             { key: 3, title: "Kỹ năng", lines: toLines(jd.requirements.skills) },
//             { key: 4, title: "Phẩm chất", lines: toLines(jd.requirements.qualities) },
//             { key: 5, title: "Yêu cầu khác", lines: toLines(jd.requirements.otherRequirements) },
//         ].filter((r) => r.lines.length > 0);
//     }, [jd]);

//     const reqColumns = [
//         {
//             title: "STT", dataIndex: "key", width: 56, align: "center" as const,
//             render: (v: number) => (
//                 <span style={{
//                     width: 26, height: 26, borderRadius: 8,
//                     background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
//                     display: "inline-flex", alignItems: "center", justifyContent: "center",
//                     fontSize: 11, fontWeight: 800, color: ACCENT,
//                 }}>{v}</span>
//             ),
//         },
//         {
//             title: "Nhóm yêu cầu", dataIndex: "title", width: 160,
//             render: (t: string) => (
//                 <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{t}</span>
//             ),
//         },
//         {
//             title: "Chi tiết", dataIndex: "lines",
//             render: (lines: string[]) => (
//                 <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
//                     {lines.map((line, i) => (
//                         <div key={i} style={{
//                             display: "flex", gap: 10, alignItems: "flex-start",
//                             fontSize: 13, color: "#374151", lineHeight: 1.6,
//                         }}>
//                             <span style={{
//                                 width: 6, height: 6, borderRadius: "50%",
//                                 background: ACCENT, flexShrink: 0, marginTop: 7,
//                             }} />
//                             <span>{line}</span>
//                         </div>
//                     ))}
//                 </div>
//             ),
//         },
//     ];

//     // ─────────────────────────────────────────────────────────────────────────
//     return (
//         <Modal
//             open={open}
//             onCancel={handleClose}
//             footer={null}
//             width={900}
//             style={{ top: 20 }}
//             styles={{ body: { padding: 0, background: "#f5f6fa", borderRadius: 12, overflow: "hidden" } }}
//             title={null}
//             destroyOnClose
//         >
//             {isLoading ? (
//                 <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
//                     <Spin size="large" />
//                 </div>
//             ) : !jd ? (
//                 <div style={{ textAlign: "center", color: "#9ca3af", padding: 60 }}>Không có dữ liệu</div>
//             ) : (
//                 <div style={{ fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif", background: "#f5f6fa", borderRadius: 12 }}>

//                     {/* ── HEADER ── */}
//                     <div style={{
//                         background: "#fff",
//                         padding: "22px 28px 18px",
//                         borderBottom: "1px solid #eef0f5",
//                         display: "flex",
//                         alignItems: "flex-start",
//                         justifyContent: "space-between",
//                         gap: 20,
//                     }}>
//                         <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//                             {/* Label pill */}
//                             <span style={{
//                                 display: "inline-flex", alignItems: "center", gap: 6,
//                                 background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
//                                 borderRadius: 20, padding: "3px 12px",
//                                 fontSize: 10, fontWeight: 700, color: ACCENT,
//                                 letterSpacing: "0.08em", textTransform: "uppercase", width: "fit-content",
//                             }}>
//                                 <FileTextOutlined /> Mô tả công việc
//                             </span>

//                             {/* Tên chức danh — TO NHẤT */}
//                             <h2 style={{
//                                 fontSize: 22, fontWeight: 800, color: "#111827",
//                                 margin: 0, lineHeight: 1.3,
//                             }}>
//                                 {record?.jobTitleName ?? jd?.jobTitleName ?? "—"}                            </h2>

//                             {/* Breadcrumb: Công ty › Phòng ban */}
//                             {(record?.companyName || record?.departmentName) && (
//                                 <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
//                                     {record?.companyName && (
//                                         <span style={{ color: "#6b7280", fontWeight: 500 }}>
//                                             {record.companyName}
//                                         </span>
//                                     )}
//                                     {record?.companyName && record?.departmentName && (
//                                         <span style={{ color: "#d1d5db" }}>›</span>
//                                     )}
//                                     {record?.departmentName && (
//                                         <span style={{ color: "#6b7280", fontWeight: 500 }}>
//                                             {record.departmentName}
//                                         </span>
//                                     )}
//                                 </div>
//                             )}

//                             {/* Mã JD + trạng thái + báo cáo */}
//                             <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//                                 <span style={{
//                                     fontSize: 12, fontWeight: 700,
//                                     color: "#1677ff", background: "#e6f4ff",
//                                     border: "1px solid #91caff",
//                                     borderRadius: 20, padding: "2px 12px",
//                                     fontFamily: "monospace",
//                                 }}>
//                                     {jd.code ?? "—"}
//                                 </span>
//                                 {statusInfo && (
//                                     <span style={{
//                                         fontSize: 12, fontWeight: 700,
//                                         color: statusInfo.color, background: statusInfo.bg,
//                                         border: `1px solid ${statusInfo.border}`,
//                                         borderRadius: 20, padding: "2px 12px",
//                                     }}>
//                                         {statusInfo.label}
//                                     </span>
//                                 )}
//                                 {jd.reportTo && (
//                                     <span style={{ fontSize: 13, color: "#6b7280" }}>
//                                         Báo cáo: <b style={{ color: "#374151" }}>{jd.reportTo}</b>
//                                     </span>
//                                 )}
//                             </div>
//                         </div>

//                         {/* Right meta */}
//                         <div style={{
//                             display: "flex", flexDirection: "column",
//                             alignItems: "flex-end", gap: 6, flexShrink: 0,
//                         }}>
//                             {jd.version != null && (
//                                 <span style={{
//                                     fontSize: 11, fontWeight: 600, color: "#9ca3af",
//                                     background: "#f9fafb", border: "1px solid #e5e7eb",
//                                     borderRadius: 8, padding: "4px 12px",
//                                 }}>
//                                     Phiên bản: {jd.version}
//                                 </span>
//                             )}
//                             {jd.effectiveDate && (
//                                 <span style={{ fontSize: 12, color: "#9ca3af" }}>
//                                     Hiệu lực: {dayjs(jd.effectiveDate).format("DD/MM/YYYY")}
//                                 </span>
//                             )}
//                             {jd.createdAt && (
//                                 <span style={{ fontSize: 11, color: "#d1d5db" }}>
//                                     Tạo: {dayjs(jd.createdAt).format("DD/MM/YYYY HH:mm")}
//                                 </span>
//                             )}
//                         </div>
//                     </div>

//                     {/* ── BODY ── */}
//                     <div style={{ padding: "20px 28px 28px" }}>

//                         {/* Tab bar */}
//                         <div style={{
//                             display: "flex", gap: 4, marginBottom: 20,
//                             background: "#fff", borderRadius: 12, padding: 6,
//                             border: "1px solid #eef0f5", boxShadow: "0 1px 4px rgba(0,0,0,.04)",
//                         }}>
//                             {TABS.map((tab) => {
//                                 const isActive = activeTab === tab.key;
//                                 return (
//                                     <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
//                                         flex: 1, padding: "9px 12px", borderRadius: 8,
//                                         fontSize: 13, fontWeight: isActive ? 700 : 500,
//                                         color: isActive ? "#fff" : "#6b7280",
//                                         background: isActive ? ACCENT : "transparent",
//                                         border: "none", cursor: "pointer",
//                                         transition: "all 0.18s ease",
//                                         fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif",
//                                         boxShadow: isActive ? "0 2px 8px rgba(232,99,122,.35)" : "none",
//                                     }}>
//                                         {tab.label}
//                                     </button>
//                                 );
//                             })}
//                         </div>

//                         {/* ── TAB 1: Thông tin chung ── */}
//                         {activeTab === "1" && (
//                             <div style={{
//                                 background: "#fff", borderRadius: 14,
//                                 border: "1px solid #eef0f5", overflow: "hidden",
//                                 boxShadow: "0 2px 10px rgba(0,0,0,.045)",
//                             }}>
//                                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#f3f4f6" }}>
//                                     {[
//                                         { label: "Mã JD", value: jd.code },
//                                         { label: "Trạng thái", value: statusInfo?.label },
//                                         { label: "Cấp quản lý trực tiếp", value: jd.reportTo },
//                                         { label: "Trực thuộc bộ phận", value: jd.belongsTo },
//                                         { label: "Phối hợp công tác với", value: jd.collaborateWith },
//                                         {
//                                             label: "Ngày hiệu lực",
//                                             value: jd.effectiveDate ? dayjs(jd.effectiveDate).format("DD/MM/YYYY") : undefined,
//                                         },
//                                     ].map((item, i) => (
//                                         <div key={i} style={{ background: "#fff", padding: "16px 22px" }}>
//                                             <div style={{
//                                                 fontSize: 10, fontWeight: 700, color: "#9ca3af",
//                                                 letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6,
//                                             }}>
//                                                 {item.label}
//                                             </div>
//                                             <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
//                                                 {item.value || "—"}
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>

//                                 {/* Positions */}
//                                 {jd.positions && jd.positions.length > 0 && (
//                                     <div style={{ padding: "16px 22px", borderTop: "1px solid #f3f4f6" }}>
//                                         <div style={{
//                                             fontSize: 10, fontWeight: 700, color: "#9ca3af",
//                                             letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
//                                         }}>
//                                             Vị trí trong sơ đồ ({jd.positions.length})
//                                         </div>
//                                         <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
//                                             {jd.positions.map((pos, idx) => (
//                                                 <div key={idx} style={{
//                                                     display: "flex", alignItems: "center", gap: 8,
//                                                     background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
//                                                     borderRadius: 8, padding: "7px 14px",
//                                                 }}>
//                                                     <span style={{ width: 7, height: 7, borderRadius: "50%", background: ACCENT }} />
//                                                     <span style={{ fontSize: 13, fontWeight: 600, color: "#9f1239" }}>
//                                                         {pos.nodeName ?? `Node #${pos.nodeId}`}
//                                                     </span>
//                                                     {pos.levelCode && (
//                                                         <span style={{
//                                                             fontSize: 10, color: ACCENT,
//                                                             background: "#fff", border: `1px solid ${ACCENT_BORDER}`,
//                                                             borderRadius: 20, padding: "1px 8px", fontWeight: 700,
//                                                         }}>
//                                                             {pos.levelCode}
//                                                         </span>
//                                                     )}
//                                                 </div>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         {/* ── TAB 2: Sơ đồ vị trí ── */}
//                         {activeTab === "2" && (
//                             <div style={{
//                                 background: "#fff", borderRadius: 14,
//                                 border: "1px solid #eef0f5",
//                                 boxShadow: "0 2px 10px rgba(0,0,0,.045)", overflow: "hidden",
//                             }}>
//                                 {/* Header + legend */}
//                                 <div style={{
//                                     padding: "14px 20px", borderBottom: "1px solid #f3f4f6",
//                                     display: "flex", alignItems: "center", justifyContent: "space-between",
//                                 }}>
//                                     <span style={{
//                                         fontSize: 11, fontWeight: 700, color: "#9ca3af",
//                                         letterSpacing: "0.1em", textTransform: "uppercase",
//                                     }}>
//                                         Sơ đồ tổ chức
//                                     </span>
//                                     <div style={{ display: "flex", gap: 14 }}>
//                                         {[
//                                             { color: "#9ca3af", label: "Vị trí khác" },
//                                             { color: ACCENT, label: "Vị trí JD này" },
//                                         ].map((item) => (
//                                             <div key={item.label} style={{
//                                                 display: "flex", alignItems: "center",
//                                                 gap: 5, fontSize: 11, color: "#6b7280",
//                                             }}>
//                                                 <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.color }} />
//                                                 {item.label}
//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>

//                                 {loadingChart ? (
//                                     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 420 }}>
//                                         <Spin tip="Đang tải sơ đồ..." />
//                                     </div>
//                                 ) : rfNodes.length === 0 ? (
//                                     <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
//                                         Phòng ban này chưa có sơ đồ tổ chức
//                                     </div>
//                                 ) : (
//                                     <div style={{ height: 460 }}>
//                                         <ReactFlow
//                                             nodes={rfNodes}
//                                             edges={rfEdges}
//                                             nodeTypes={nodeTypes}
//                                             edgeTypes={edgeTypes}
//                                             fitView
//                                             fitViewOptions={{ padding: 0.25 }}
//                                             nodesDraggable={false}
//                                             nodesConnectable={false}
//                                             elementsSelectable={false}
//                                             zoomOnScroll={true}
//                                             panOnDrag={true}
//                                             minZoom={0.3}
//                                             maxZoom={1.5}
//                                             proOptions={{ hideAttribution: true }}
//                                         >
//                                             <Background color="#f3f4f6" gap={20} />
//                                             <Controls showInteractive={false} />
//                                         </ReactFlow>
//                                     </div>
//                                 )}
//                             </div>
//                         )}

//                         {/* ── TAB 3: Mô tả công việc (Tasks) ── */}
//                         {activeTab === "3" && (
//                             <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//                                 {!jd.tasks?.length ? (
//                                     <div style={{
//                                         background: "#fff", borderRadius: 14, padding: 40,
//                                         textAlign: "center", color: "#9ca3af", border: "1px solid #eef0f5",
//                                     }}>
//                                         Chưa có nhiệm vụ nào
//                                     </div>
//                                 ) : (
//                                     jd.tasks
//                                         .slice()
//                                         .sort((a, b) => a.orderNo - b.orderNo)
//                                         .map((task, index) => (
//                                             <div key={index} style={{
//                                                 background: "#fff", borderRadius: 12, overflow: "hidden",
//                                                 border: "1px solid #eef0f5", boxShadow: "0 1px 4px rgba(0,0,0,.04)",
//                                             }}>
//                                                 <div style={{
//                                                     padding: "12px 20px", background: "#fafafa",
//                                                     borderBottom: "1px solid #f3f4f6",
//                                                     display: "flex", alignItems: "center", gap: 12,
//                                                 }}>
//                                                     <span style={{
//                                                         width: 28, height: 28, borderRadius: 8,
//                                                         background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
//                                                         display: "inline-flex", alignItems: "center", justifyContent: "center",
//                                                         fontSize: 11, fontWeight: 800, color: ACCENT, flexShrink: 0,
//                                                     }}>
//                                                         {index + 1}
//                                                     </span>
//                                                     <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
//                                                         {task.title}
//                                                     </span>
//                                                 </div>
//                                                 <div style={{ padding: "14px 20px 16px" }}>
//                                                     <p style={{
//                                                         fontSize: 13.5, color: "#374151",
//                                                         lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap",
//                                                     }}>
//                                                         {task.content}
//                                                     </p>
//                                                 </div>
//                                             </div>
//                                         ))
//                                 )}
//                             </div>
//                         )}

//                         {/* ── TAB 4: Yêu cầu vị trí ── */}
//                         {activeTab === "4" && (
//                             <div style={{
//                                 background: "#fff", borderRadius: 14, overflow: "hidden",
//                                 border: "1px solid #eef0f5", boxShadow: "0 2px 10px rgba(0,0,0,.045)",
//                             }}>
//                                 {reqRows.length === 0 ? (
//                                     <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
//                                         Chưa có yêu cầu nào
//                                     </div>
//                                 ) : (
//                                     <Table
//                                         bordered={false}
//                                         pagination={false}
//                                         columns={reqColumns}
//                                         dataSource={reqRows}
//                                         style={{ fontFamily: "'Outfit','Nunito','Segoe UI',sans-serif" }}
//                                     />
//                                 )}
//                             </div>
//                         )}

//                     </div>
//                 </div>
//             )}
//         </Modal>
//     );
// }