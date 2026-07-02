import { memo, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Button, message, Tooltip, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { LockOutlined, UnlockOutlined, PlusOutlined, ReloadOutlined, ApartmentOutlined, SaveOutlined, AppstoreOutlined, BarsOutlined, FullscreenOutlined, FullscreenExitOutlined, SettingOutlined, EyeOutlined, EyeInvisibleOutlined, CloseOutlined } from "@ant-design/icons";
import { unstable_batchedUpdates } from "react-dom";

import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    addEdge,
    useReactFlow,
    ReactFlowProvider,
    type Node,
    type Edge,
    type Connection,
    type NodeChange,
    type EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    type EdgeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

import { useOrgChartsQuery, useCreateOrgChartMutation } from "@/hooks/useOrgCharts";
import {
    useCreateOrgNodeMutation,
    useCreateOrgNodeBulkTreeMutation,
    useUpdateOrgNodeMutation,
    useDeleteOrgNodeMutation,
    useUpdateOrgNodePositionsMutation,
} from "@/hooks/useOrgNodes";
import Access from "@/components/share/access";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useBreakpoint } from "@/hooks/useIsMobile";
import {
    callFetchOrgNodes,
    callUpdateOrgNode,
    callFetchJobDescriptions,
    callFetchJobTitle,
    callFetchCompanyJobTitlesByCompany,
    callFetchCompanyJobTitlesOfDepartment,
} from "@/config/api";
import ModalNode, { type AddNodeMode, type BulkNodeItem, type NodeKind, type SmartJobTitleOption, type SmartJdOption } from "./modal.node";
import OrgNodeCard, { type OrgNodeData } from "./OrgNodeCard";
import SearchBar from "./SearchBar";
import MiniPanel from "./MiniPanel";
import type { IReqCreateNodeTree } from "@/types/backend";
import { ORG_CHART_NODE_SIZE } from "./orgChartConstants";

import ViewJobDescription, { type EnrichedJD } from "../../job-description/view.job-description/index";

interface Props {
    ownerType: "COMPANY" | "DEPARTMENT";
    ownerId: number;
    chartTitle?: string;
    onClose?: () => void;
}

interface IOrgNode {
    id: number;
    name?: string | null;
    level?: string | null;
    holderName?: string | null;
    isGoal?: boolean;
    parentId?: number | null;
    posX?: number | null;
    posY?: number | null;
    jobDescriptionId?: number | null;
}

const getPositionCode = (jobTitle: any) =>
    jobTitle?.positionCode ||
    jobTitle?.positionLevel?.code ||
    (jobTitle?.band && (jobTitle?.level ?? jobTitle?.levelNumber)
        ? `${jobTitle.band}${jobTitle.level ?? jobTitle.levelNumber}`
        : "");

const toSmartJobTitleOption = (item: any): SmartJobTitleOption | null => {
    const jobTitle = item?.jobTitle ?? item;
    if (!jobTitle?.id || !jobTitle?.nameVi) return null;

    return {
        value: Number(jobTitle.id),
        title: jobTitle.nameVi,
        levelCode: getPositionCode(jobTitle),
        source: item?.source,
    };
};

const extractList = (res: any): any[] => {
    const data = res?.data ?? res;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.result)) return data.result;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.result)) return data.data.result;
    return [];
};



// ── Edge renderer ─────────────────────────────────────────────────────────────
const OrgEdge = memo(({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) => {
    const midY = (sourceY + targetY) / 2;
    const d = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
    const edgeType: string = data?.edgeType ?? "none";
    const stroke =
        edgeType === "ancestor" ? "#60a5fa" :
            edgeType === "descendant" ? "#f59e0b" :
                "#cbd5e1";
    const strokeWidth = edgeType === "none" ? 1.25 : 2.25;
    const strokeOpacity = edgeType === "none" && data?.dimmed ? 0.14 : edgeType === "none" ? 0.9 : 1;
    const strokeDasharray = edgeType === "ancestor" ? "6 4" : undefined;
    return (
        <path id={id} d={d} fill="none"
            stroke={stroke} strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity} strokeDasharray={strokeDasharray}
            style={{ transition: "stroke 0.15s, stroke-width 0.15s, stroke-opacity 0.15s" }}
        />
    );
});

// ── Layout ────────────────────────────────────────────────────────────────────
const getLayoutedElements = (
    nodes: Node[],
    edges: Edge[],
    nodeW = 220,
    nodeH = 185,
    direction: "TB" | "LR" = "TB"
) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: direction, ranksep: 110, nodesep: 75 });
    g.setDefaultEdgeLabel(() => ({}));
    nodes.forEach((n) => {
        const isDepartment = !n.data?.levelCode;
        const actualNodeH = isDepartment ? nodeH - 46 : nodeH;
        g.setNode(n.id, { width: nodeW, height: actualNodeH });
    });
    edges.forEach((e) => g.setEdge(e.source, e.target));
    dagre.layout(g);
    return {
        nodes: nodes.map((n) => {
            const pos = g.node(n.id);
            const isDepartment = !n.data?.levelCode;
            const actualNodeH = isDepartment ? nodeH - 46 : nodeH;
            return { ...n, position: { x: pos.x - nodeW / 2, y: pos.y - actualNodeH / 2 } };
        }),
        edges,
    };
};

const EDGE_DEFAULTS = { type: "orgEdge" } satisfies Partial<Edge>;

// ── Graph traversal ───────────────────────────────────────────────────────────
const getAncestorIds = (nodeId: string, edges: Edge[]): Set<string> => {
    const result = new Set<string>();
    let current = nodeId;
    for (; ;) {
        const p = edges.find((e) => e.target === current);
        if (!p || result.has(p.source)) break;
        result.add(p.source);
        current = p.source;
    }
    return result;
};

const getDescendantIds = (nodeId: string, edges: Edge[]): Set<string> => {
    const result = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const e of edges) {
            if (e.source === cur && !result.has(e.target)) {
                result.add(e.target);
                queue.push(e.target);
            }
        }
    }
    return result;
};

const getHiddenNodeIds = (collapsedIds: Set<string>, edges: Edge[]): Set<string> => {
    const hidden = new Set<string>();
    const queue = Array.from(collapsedIds);
    while (queue.length > 0) {
        const parentId = queue.shift()!;
        for (const e of edges) {
            if (e.source === parentId) {
                if (!hidden.has(e.target)) {
                    hidden.add(e.target);
                    queue.push(e.target);
                }
            }
        }
    }
    return hidden;
};

const getDepthHiddenNodeIds = (nodes: Node[], edges: Edge[], maxDepth: number): Set<string> => {
    const hidden = new Set<string>();
    const nodeIds = new Set(nodes.map((node) => node.id));
    const childMap = new Map<string, string[]>();
    const targets = new Set<string>();

    edges.forEach((edge) => {
        targets.add(edge.target);
        const children = childMap.get(edge.source) ?? [];
        children.push(edge.target);
        childMap.set(edge.source, children);
    });

    const roots = Array.from(nodeIds).filter((id) => !targets.has(id));
    const queue = roots.map((id) => ({ id, depth: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) continue;
        visited.add(current.id);

        if (current.depth > maxDepth) {
            hidden.add(current.id);
        }

        for (const childId of childMap.get(current.id) ?? []) {
            queue.push({ id: childId, depth: current.depth + 1 });
        }
    }

    return hidden;
};

// ── Pure highlight calculator ─────────────────────────────────────────────────
const applyHighlight = (
    nodes: Node[], edges: Edge[], hoveredId: string | null,
): { nodes: Node[]; edges: Edge[] } => {
    if (!hoveredId) {
        return {
            nodes: nodes.map((n) =>
                n.data.highlightState === "idle" ? n : { ...n, data: { ...n.data, highlightState: "idle" } }
            ),
            edges: edges.map((e) =>
                !e.data?.edgeType || (e.data.edgeType === "none" && !e.data.dimmed)
                    ? e : { ...e, data: { edgeType: "none", dimmed: false } }
            ),
        };
    }
    const ancestorIds = getAncestorIds(hoveredId, edges);
    const descendantIds = getDescendantIds(hoveredId, edges);
    const relatedIds = new Set([hoveredId, ...ancestorIds, ...descendantIds]);

    const newNodes = nodes.map((n) => {
        const hs: OrgNodeData["highlightState"] =
            n.id === hoveredId ? "active" :
                ancestorIds.has(n.id) ? "ancestor" :
                    descendantIds.has(n.id) ? "descendant" : "dimmed";
        return n.data.highlightState === hs ? n : { ...n, data: { ...n.data, highlightState: hs } };
    });

    const newEdges = edges.map((e) => {
        const isAnc =
            (ancestorIds.has(e.source) || e.source === hoveredId) &&
            (ancestorIds.has(e.target) || e.target === hoveredId) &&
            !descendantIds.has(e.source);
        const isDes =
            (descendantIds.has(e.target) || e.target === hoveredId) &&
            (descendantIds.has(e.source) || e.source === hoveredId) &&
            !ancestorIds.has(e.target);
        const edgeType = isAnc ? "ancestor" : isDes ? "descendant" : "none";
        const dimmed = !relatedIds.has(e.source) && !relatedIds.has(e.target);
        if (e.data?.edgeType === edgeType && e.data?.dimmed === dimmed) return e;
        return { ...e, data: { edgeType, dimmed } };
    });

    return { nodes: newNodes, edges: newEdges };
};

// ─────────────────────────────────────────────────────────────────────────────

const OrgChartInner = ({ ownerType, ownerId, chartTitle, onClose }: Props) => {
    const query = ownerType === "COMPANY" ? `filter=companyId:${ownerId}` : `filter=departmentId:${ownerId}`;
    const { fitView, setCenter } = useReactFlow();
    const { isMobile, isTablet, isSmallLaptop } = useBreakpoint();
    const isCompactViewport = isMobile || isTablet || isSmallLaptop;

    const canEdit = useAccess(ALL_PERMISSIONS.ORG_NODES.UPDATE);
    const canDelete = useAccess(ALL_PERMISSIONS.ORG_NODES.DELETE);
    const canCreate = useAccess(ALL_PERMISSIONS.ORG_NODES.CREATE);

    const [jdOpen, setJdOpen] = useState(false);
    const [jdRecord, setJdRecord] = useState<EnrichedJD | null>(null);
    const [jdOptions, setJdOptions] = useState<SmartJdOption[]>([]);
    const [jobTitleOptions, setJobTitleOptions] = useState<SmartJobTitleOption[]>([]);

    // ⭐ View mode state — "compact" = Tổng quan, "full" = Chi tiết
    const [viewMode, setViewMode] = useState<"compact" | "full">("full");
    const viewModeRef = useRef<"compact" | "full">("full");
    viewModeRef.current = viewMode;

    const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB");
    const layoutDirectionRef = useRef<"TB" | "LR">("TB");
    layoutDirectionRef.current = layoutDirection;

    const { data } = useOrgChartsQuery(query);
    const createChart = useCreateOrgChartMutation();
    const createNode = useCreateOrgNodeMutation();
    const bulkTreeNode = useCreateOrgNodeBulkTreeMutation();
    const updateNode = useUpdateOrgNodeMutation();
    const deleteNode = useDeleteOrgNodeMutation();
    const updateNodePositions = useUpdateOrgNodePositionsMutation();

    const [chartId, setChartId] = useState<number | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isClosing, setIsClosing] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [prefilledParentId, setPrefilledParentId] = useState<number | null>(null);
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [modalInitialMode, setModalInitialMode] = useState<AddNodeMode>("single");
    const [modalInitialNodeKind, setModalInitialNodeKind] = useState<NodeKind>("position");
    const [pendingSaves, setPendingSaves] = useState<Map<string, { x: number; y: number }>>(new Map());
    const [isSaving, setIsSaving] = useState(false);
    const [isDragLocked, setIsDragLocked] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const flowViewportRef = useRef<HTMLDivElement>(null);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
    const collapsedNodeIdsRef = useRef<Set<string>>(new Set());
    collapsedNodeIdsRef.current = collapsedNodeIds;

    const nodesRef = useRef<Node[]>([]);
    const edgesRef = useRef<Edge[]>([]);
    const rafRef = useRef<number | null>(null);
    const fitDebounceRef = useRef<number | null>(null);
    const fitFirstRafRef = useRef<number | null>(null);
    const fitSecondRafRef = useRef<number | null>(null);
    const pendingHoverRef = useRef<string | null>(null);
    nodesRef.current = nodes;
    edgesRef.current = edges;

    const nodeSize = isMobile
        ? ORG_CHART_NODE_SIZE.mobile
        : isTablet
            ? ORG_CHART_NODE_SIZE.tablet
            : isSmallLaptop
                ? ORG_CHART_NODE_SIZE.smallLaptop
                : ORG_CHART_NODE_SIZE.desktop;
    const compactNodeSize = isMobile
        ? ORG_CHART_NODE_SIZE.compactMobile
        : isTablet
            ? ORG_CHART_NODE_SIZE.compactTablet
            : isSmallLaptop
                ? ORG_CHART_NODE_SIZE.compactSmallLaptop
                : ORG_CHART_NODE_SIZE.compactDesktop;
    const layoutNodeW = nodeSize.width;
    const layoutNodeH = nodeSize.height;
    const compactLayoutNodeW = compactNodeSize.width;
    const compactLayoutNodeH = compactNodeSize.height;
    const fitPadding = isMobile ? 0.05 : 0.02;
    const fitMinZoom = isMobile ? 0.16 : 0.18;

    const nodeTypes = useMemo(() => ({ orgNode: OrgNodeCard }), []);
    const edgeTypes = useMemo(() => ({ orgEdge: OrgEdge }), []);

    const scheduleFitView = useCallback((options?: Parameters<typeof fitView>[0], debounceMs = 80) => {
        if (fitDebounceRef.current !== null) {
            window.clearTimeout(fitDebounceRef.current);
        }

        fitDebounceRef.current = window.setTimeout(() => {
            fitDebounceRef.current = null;

            if (fitFirstRafRef.current !== null) cancelAnimationFrame(fitFirstRafRef.current);
            if (fitSecondRafRef.current !== null) cancelAnimationFrame(fitSecondRafRef.current);

            fitFirstRafRef.current = requestAnimationFrame(() => {
                fitFirstRafRef.current = null;
                fitSecondRafRef.current = requestAnimationFrame(() => {
                    fitSecondRafRef.current = null;
                    const visibleNodes = nodesRef.current.filter((node) => !node.hidden);
                    if (visibleNodes.length === 0) return;

                    fitView({
                        nodes: visibleNodes,
                        padding: fitPadding,
                        minZoom: fitMinZoom,
                        maxZoom: 1.05,
                        duration: 400,
                        ...options,
                    });
                });
            });
        }, debounceMs);
    }, [fitMinZoom, fitPadding, fitView]);

    const applyHighlightNow = useCallback((hoveredId: string | null) => {
        pendingHoverRef.current = hoveredId;
        if (rafRef.current !== null) return;

        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const { nodes: n, edges: e } = applyHighlight(nodesRef.current, edgesRef.current, pendingHoverRef.current);
            unstable_batchedUpdates(() => { setNodes(n); setEdges(e); });
        });
    }, [setNodes, setEdges]);

    useEffect(() => () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        if (fitDebounceRef.current !== null) window.clearTimeout(fitDebounceRef.current);
        if (fitFirstRafRef.current !== null) cancelAnimationFrame(fitFirstRafRef.current);
        if (fitSecondRafRef.current !== null) cancelAnimationFrame(fitSecondRafRef.current);
    }, []);

    useEffect(() => {
        const el = flowViewportRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;

        let lastWidth = 0;
        let lastHeight = 0;

        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            if (width <= 0 || height <= 0) return;

            const sizeChanged = Math.abs(width - lastWidth) > 1 || Math.abs(height - lastHeight) > 1;
            lastWidth = width;
            lastHeight = height;

            if (sizeChanged && nodesRef.current.length > 0) {
                scheduleFitView();
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, [scheduleFitView]);

    useEffect(() => {
        setNodes((prev) =>
            prev.map((n) => {
                const shouldBeSelected = n.id === selectedNodeId;
                if (n.data.isSelected === shouldBeSelected) return n;
                return { ...n, data: { ...n.data, isSelected: shouldBeSelected } };
            })
        );

        if (!selectedNodeId) {
            return;
        }

        const found = nodesRef.current.find(n => n.id === selectedNodeId);
        if (!found) return;

        // Smooth fly to the clicked node (with offset so MiniPanel fits)
        setCenter(
            found.position.x + (layoutNodeW / 2),
            found.position.y + (layoutNodeH / 2) + (isMobile ? 100 : 150),
            { duration: 500, zoom: 1.2 }
        );

    }, [selectedNodeId, setCenter, layoutNodeW, layoutNodeH, isMobile]);

    useEffect(() => {
        if (nodesRef.current.length === 0) return;

        if (layoutDirection === "TB") {
            setNodes((prev) =>
                prev.map((node) => ({
                    ...node,
                    data: {
                        ...node.data,
                        viewMode,
                        layoutDirection,
                    },
                }))
            );
            setPendingSaves(new Map());
            scheduleFitView();
            return;
        }

        const lW = viewMode === "compact" ? compactLayoutNodeW : layoutNodeW;
        const lH = viewMode === "compact" ? compactLayoutNodeH : layoutNodeH;

        const { nodes: laid } = getLayoutedElements(
            nodesRef.current.map((n) => ({ ...n, position: { x: 0, y: 0 } })),
            edgesRef.current,
            lW,
            lH,
            layoutDirection
        );

        setNodes(laid.map((node) => {
            const originalNode = nodesRef.current.find((n) => n.id === node.id);
            return {
                ...node,
                data: {
                    ...(originalNode?.data ?? node.data),
                    viewMode,
                    layoutDirection
                }
            };
        }));

        setPendingSaves(new Map());
        scheduleFitView();
    }, [viewMode, layoutDirection, compactLayoutNodeW, compactLayoutNodeH, layoutNodeW, layoutNodeH, scheduleFitView]);

    useEffect(() => {
        callFetchJobDescriptions("filter=status='PUBLISHED'&page=1&pageSize=200")
            .then((res) => {
                const list = (res.data as any)?.result ?? [];
                setJdOptions(list.map((jd: any) => ({
                    value: jd.id,
                    label: `${jd.code}${jd.jobTitleName ? " — " + jd.jobTitleName : ""}`,
                    jobTitleName: jd.jobTitleName,
                })));
            }).catch(() => { });
    }, []);

    useEffect(() => {
        const assignedRequest = ownerType === "COMPANY"
            ? callFetchCompanyJobTitlesByCompany(ownerId)
            : callFetchCompanyJobTitlesOfDepartment(ownerId);

        Promise.all([
            assignedRequest.catch(() => null),
            callFetchJobTitle("page=1&size=500&filter=active:true").catch(() => null),
        ])
            .then(([assignedRes, masterRes]) => {
                const assignedOptions = extractList(assignedRes)
                    .map(toSmartJobTitleOption)
                    .filter((option): option is SmartJobTitleOption => Boolean(option));

                const masterOptions = extractList(masterRes)
                    .map((jobTitle) => toSmartJobTitleOption({ jobTitle, source: "DANH MỤC" }))
                    .filter((option): option is SmartJobTitleOption => Boolean(option));

                const byJobTitleId = new Map<number, SmartJobTitleOption>();
                [...masterOptions, ...assignedOptions].forEach((option) => {
                    byJobTitleId.set(option.value, option);
                });

                const options = Array.from(byJobTitleId.values())
                    .sort((a, b) => (a.levelCode || "").localeCompare(b.levelCode || "") || a.title.localeCompare(b.title));

                setJobTitleOptions(options);
            })
            .catch(() => setJobTitleOptions([]));
    }, [ownerType, ownerId]);

    useEffect(() => {
        if (nodes.length === 0) return;
        scheduleFitView();
    }, [nodes.length, scheduleFitView]);

    useEffect(() => {
        if (nodes.length === 0) return;
        const hiddenNodeIds = getHiddenNodeIds(collapsedNodeIds, edges);

        unstable_batchedUpdates(() => {
            setNodes((prev) =>
                prev.map((n) => {
                    const isHidden = hiddenNodeIds.has(n.id);
                    const isCollapsed = collapsedNodeIds.has(n.id);
                    if (n.hidden === isHidden && n.data.isCollapsed === isCollapsed) return n;
                    return {
                        ...n,
                        hidden: isHidden,
                        data: {
                            ...n.data,
                            isCollapsed,
                        },
                    };
                })
            );

            setEdges((prev) =>
                prev.map((e) => {
                    const isHidden = hiddenNodeIds.has(e.source) || hiddenNodeIds.has(e.target);
                    if (e.hidden === isHidden) return e;
                    return {
                        ...e,
                        hidden: isHidden,
                    };
                })
            );
        });
    }, [collapsedNodeIds]);

    useEffect(() => {
        setChartId(null); setNodes([]); setEdges([]);
        setPendingSaves(new Map());
        setSelectedNodeId(null);
        setCollapsedNodeIds(new Set());
    }, [ownerId]);

    useEffect(() => {
        if (!data) return;
        const chart = data?.result?.[0];
        if (chart?.id) { setChartId(chart.id); loadNodes(chart.id); }
        else if (data?.meta !== undefined) handleCreateChart();
    }, [data]); // eslint-disable-line

    const handleCreateChart = useCallback(async () => {
        try {
            const res = await createChart.mutateAsync({
                name: "Sơ đồ tổ chức", chartType: ownerType,
                ...(ownerType === "COMPANY" ? { companyId: ownerId } : { departmentId: ownerId }),
            });
            const id = (res as any)?.id ?? (res as any)?.data?.id ?? (res as any)?.result?.id;
            if (id) { setChartId(id); setNodes([]); setEdges([]); }
        } catch { }
    }, [ownerType, ownerId]); // eslint-disable-line

    const loadNodes = useCallback(async (id: number) => {
        const res = await callFetchOrgNodes(id);
        const raw = res.data as any;
        const nodeList: IOrgNode[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

        const rfNodes: Node[] = nodeList.map((n) => ({
            id: String(n.id), type: "orgNode", position: { x: 0, y: 0 },
            data: {
                title: n.name ?? "Position",
                levelCode: n.level ?? "",
                holderName: n.holderName ?? "",
                isGoal: n.isGoal ?? false,
                jobDescriptionId: n.jobDescriptionId ?? null,
                highlightState: "idle",
                isSelected: false,
                onEdit: () => { }, onDelete: () => { }, onJD: () => { },
                onSelect: () => { }, onMouseEnter: () => { }, onMouseLeave: () => { },
            } as OrgNodeData,
        }));

        const rfEdges: Edge[] = nodeList.filter((n) => n.parentId).map((n) => ({
            id: `e-${n.parentId}-${n.id}`, source: String(n.parentId), target: String(n.id),
            ...EDGE_DEFAULTS, data: { edgeType: "none", dimmed: false },
        }));

        const hiddenNodeIds = getHiddenNodeIds(collapsedNodeIdsRef.current, rfEdges);

        const lW = viewModeRef.current === "compact" ? compactLayoutNodeW : layoutNodeW;
        const lH = viewModeRef.current === "compact" ? compactLayoutNodeH : layoutNodeH;

        const { nodes: dagreNodes, edges: dagreEdges } = getLayoutedElements(rfNodes, rfEdges, lW, lH, layoutDirectionRef.current);
        const finalNodes = dagreNodes.map((node) => {
            const saved = nodeList.find((n) => String(n.id) === node.id);
            return saved?.posX != null && saved?.posY != null && layoutDirectionRef.current === "TB"
                ? { ...node, position: { x: saved.posX, y: saved.posY } }
                : node;
        });

        const withCbs = finalNodes.map((node) => {
            const jdId = node.data.jobDescriptionId as number | null;
            const directChildren = rfEdges.filter((e) => e.source === node.id);
            const childCount = directChildren.length;
            const isHidden = hiddenNodeIds.has(node.id);

            return {
                ...node,
                hidden: isHidden,
                data: {
                    ...node.data,
                    allowEdit: canEdit,
                    allowDelete: canDelete,
                    allowCreate: canCreate,
                    isSelected: selectedNodeId === node.id,
                    isMobile,
                    isTablet,
                    isSmallLaptop,
                    viewMode: viewModeRef.current,
                    layoutDirection: layoutDirectionRef.current,
                    childCount,
                    isCollapsed: collapsedNodeIdsRef.current.has(node.id),
                    onToggleCollapse: () => {
                        setCollapsedNodeIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(node.id)) {
                                next.delete(node.id);
                            } else {
                                next.add(node.id);
                            }
                            return next;
                        });
                    },
                    onEdit: () => handleOpenEdit(node),
                    onAddChild: (action) => handleOpenAddChild(node.id, action),
                    onDelete: () => handleDeleteNode(Number(node.id), id),
                    onJD: () => {
                        if (jdId) {
                            setJdRecord({ id: jdId } as EnrichedJD);
                            setJdOpen(true);
                        } else {
                            message.info("Vị trí này chưa được gắn JD nào.");
                        }
                    },
                    onSelect: () => {
                        setSelectedNodeId((prev) => prev === node.id ? null : node.id);
                    },
                    onMouseEnter: () => applyHighlightNow(node.id),
                    onMouseLeave: () => applyHighlightNow(null),
                } as OrgNodeData,
            };
        });

        const withEdgesCbs = dagreEdges.map((e) => ({
            ...e,
            hidden: hiddenNodeIds.has(e.source) || hiddenNodeIds.has(e.target),
        }));

        unstable_batchedUpdates(() => { setNodes(withCbs); setEdges(withEdgesCbs); });
        scheduleFitView();
    }, [ownerType, applyHighlightNow, canEdit, canDelete, canCreate, selectedNodeId, layoutNodeW, layoutNodeH, isMobile, isTablet, isSmallLaptop, scheduleFitView]); // eslint-disable-line

    const handleSearchSelect = (nodeId: string) => {
        setSelectedNodeId(nodeId);
        const found = nodesRef.current.find((n) => n.id === nodeId);
        if (found) {
            fitView({ nodes: [found], padding: 0.35, duration: 500, maxZoom: 1.2 });
        }
    };

    const handleNodeDragStop = useCallback((_: unknown, node: Node) => {
        setPendingSaves((prev) => { const next = new Map(prev); next.set(node.id, { x: node.position.x, y: node.position.y }); return next; });
    }, []);

    const handleSavePositions = useCallback(async () => {
        if (!chartId || pendingSaves.size === 0) return;
        setIsSaving(true);
        const count = pendingSaves.size;
        try {
            const payload = Array.from(pendingSaves.entries()).map(([nodeId, pos]) => ({
                id: Number(nodeId),
                posX: Math.round(pos.x),
                posY: Math.round(pos.y),
            }));
            await updateNodePositions.mutateAsync(payload);
            setPendingSaves(new Map());
        } catch {
            message.error("Lưu vị trí thất bại, thử lại nhé!");
        } finally {
            setIsSaving(false);
        }
    }, [chartId, pendingSaves, updateNodePositions]);

    const handleResetPositions = useCallback(async () => {
        if (!chartId) return;
        setPendingSaves(new Map());
        await loadNodes(chartId);
        message.success("Đã khôi phục vị trí đã lưu!");
    }, [chartId, loadNodes]);

    const handleAutoLayout = useCallback(() => {
        if (nodes.length === 0) return;
        const lW = viewModeRef.current === "compact" ? compactLayoutNodeW : layoutNodeW;
        const lH = viewModeRef.current === "compact" ? compactLayoutNodeH : layoutNodeH;
        const { nodes: laid } = getLayoutedElements(
            nodes.map((n) => ({ ...n, position: { x: 0, y: 0 } })),
            edges,
            lW,
            lH,
            layoutDirectionRef.current
        );
        setNodes(laid.map((node) => ({ ...node, data: nodesRef.current.find((n) => n.id === node.id)?.data ?? node.data })));
        setPendingSaves((prev) => { const next = new Map(prev); laid.forEach((n) => next.set(n.id, { x: n.position.x, y: n.position.y })); return next; });
        scheduleFitView();
        message.success("Đã căn chỉnh sơ đồ!");
    }, [nodes, edges, scheduleFitView, layoutNodeW, layoutNodeH, compactLayoutNodeW, compactLayoutNodeH]);

    const handleConnect = useCallback(async (connection: Connection) => {
        if (!chartId || !connection.source || !connection.target) return;

        // Chặn tạo vòng lặp ngay tại UI
        const ancestors = getAncestorIds(connection.source, edgesRef.current);
        if (ancestors.has(connection.target) || connection.source === connection.target) {
            message.error("Không thể tạo vòng lặp! Node đích không thể là tổ tiên của node nguồn.");
            return;
        }

        setEdges((eds) => addEdge({ ...connection, ...EDGE_DEFAULTS }, eds));
        try {
            await updateNode.mutateAsync({ id: Number(connection.target), parentId: Number(connection.source) });
            message.success("Đã kết nối node!");
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Kết nối thất bại!");
            loadNodes(chartId); // Reload để xóa edge vừa nối tạm trên UI
        }
    }, [chartId, updateNode, loadNodes]);

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

    const handleDeleteNode = useCallback(async (nodeId: number, cId: number) => {
        if (!nodesRef.current.some(n => n.id === selectedNodeId)) {
            setSelectedNodeId(null);
        }
        await deleteNode.mutateAsync(nodeId); loadNodes(cId);
    }, [deleteNode, loadNodes, selectedNodeId]);

    const handleOpenCreateRoot = useCallback((kind: NodeKind = "position", mode: AddNodeMode = "single") => {
        setEditingNode(null);
        setPrefilledParentId(null);
        setModalInitialMode(mode);
        setModalInitialNodeKind(kind);
        setOpenModal(true);
    }, []);

    const handleOpenEdit = useCallback((node: Node) => {
        setEditingNode(node);
        setModalInitialMode("single");
        setModalInitialNodeKind(!node.data.levelCode ? "department" : "position");
        setOpenModal(true);
    }, []);

    const handleOpenAddChild = useCallback((parentId: string, action: "department" | "position" | "bulk" = "position") => {
        setEditingNode(null);
        setPrefilledParentId(Number(parentId));
        setModalInitialMode(action === "bulk" ? "bulk" : "single");
        setModalInitialNodeKind(action === "department" ? "department" : "position");
        setOpenModal(true);
    }, []);

    const handleSubmit = useCallback(async (values: {
        title: string; levelCode: string; holderName?: string;
        parentId?: number | null; isGoal?: boolean; jobDescriptionId?: number | null;
    }) => {
        if (!chartId) return;
        try {
            if (editingNode) {
                await updateNode.mutateAsync({
                    id: Number(editingNode.id), name: values.title, level: values.levelCode,
                    holderName: values.holderName ?? null, parentId: values.parentId ?? null,
                    isGoal: values.isGoal ?? false, jobDescriptionId: values.jobDescriptionId ?? null,
                });
            } else {
                await createNode.mutateAsync({
                    chartId, name: values.title, level: values.levelCode,
                    holderName: values.holderName ?? null, parentId: values.parentId ?? null,
                    isGoal: values.isGoal ?? false, jobDescriptionId: values.jobDescriptionId ?? null,
                });
            }
            setOpenModal(false);
            setEditingNode(null);
            loadNodes(chartId);
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Lưu thất bại!");
        }
    }, [chartId, editingNode, createNode, updateNode, loadNodes]);

    const handleBulkSubmit = useCallback(async (items: BulkNodeItem[]) => {
        if (!chartId) return;
        setOpenModal(false);

        const buildChildren = (
            items: BulkNodeItem[],
            parentRowIndex: number,
        ): IReqCreateNodeTree[] => {
            return items
                .map((item, i) => ({ item, i }))
                .filter(({ item }) => item.parentIndex === parentRowIndex && item.existingParentId === null)
                .map(({ item, i }) => ({
                    chartId: chartId!,
                    name: item.title,
                    level: item.levelCode || undefined,
                    holderName: item.holderName || undefined,
                    isGoal: false,
                    jobDescriptionId: item.jobDescriptionId ?? null,
                    children: buildChildren(items, i),
                } as IReqCreateNodeTree));
        };

        const roots: IReqCreateNodeTree[] = items
            .map((item, i) => ({ item, i }))
            .filter(({ item }) => item.parentIndex === null && item.existingParentId === null)
            .map(({ item, i }) => ({
                chartId: chartId!,
                name: item.title,
                level: item.levelCode || undefined,
                holderName: item.holderName || undefined,
                isGoal: false,
                jobDescriptionId: item.jobDescriptionId ?? null,
                children: buildChildren(items, i),
            }));

        const withExistingParent: IReqCreateNodeTree[] = items
            .map((item, i) => ({ item, i }))
            .filter(({ item }) => item.existingParentId != null)
            .map(({ item, i }) => ({
                chartId: chartId!,
                name: item.title,
                level: item.levelCode || undefined,
                holderName: item.holderName || undefined,
                isGoal: false,
                jobDescriptionId: item.jobDescriptionId ?? null,
                parentId: item.existingParentId!,
                children: buildChildren(items, i),
            }));

        const payload = [...roots, ...withExistingParent];
        if (payload.length === 0) return;

        try {
            await bulkTreeNode.mutateAsync(payload);
            loadNodes(chartId);
        } catch {
            message.error("Tạo hàng loạt thất bại, thử lại nhé!");
        }
    }, [chartId, bulkTreeNode, loadNodes]);

    const handleCloseModal = useCallback(() => {
        setOpenModal(false);
        setEditingNode(null);
        setPrefilledParentId(null);
        setModalInitialMode("single");
        setModalInitialNodeKind("position");
    }, []);



    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    const btnBase: React.CSSProperties = {
        borderColor: "#d1d5db",
        color: "#6b7280",
        fontWeight: 500,
        padding: isMobile ? "0 8px" : isSmallLaptop ? "0 10px" : undefined,
        fontSize: isMobile ? 12 : isSmallLaptop ? 13 : 14,
    };

    // "compact" = Tổng quan, "full" = Chi tiết
    const viewModeBtnStyle: React.CSSProperties = viewMode === "compact"
        ? { borderColor: "#6366f1", color: "#6366f1", fontWeight: 600, fontSize: isMobile ? 12 : isSmallLaptop ? 13 : 14, background: "#eef2ff" }
        : { ...btnBase };

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        if (e.key === "reload") handleResetPositions();
        else if (e.key === "layout") handleAutoLayout();
        else if (e.key === "overview") {
            setViewMode("compact");
            setIsToolbarCollapsed(true);
            scheduleFitView(undefined, 120);
        }
        else if (e.key === "lock") {
            setIsDragLocked(!isDragLocked);
            if (isDragLocked) {
                message.info("Đã mở khóa di chuyển. Bạn có thể kéo thả để sắp xếp các vị trí!");
            } else {
                message.success("Đã khóa di chuyển. Vị trí các node hiện đã được cố định!");
            }
        }
        else if (e.key === "viewMode") setViewMode((v) => (v === "full" ? "compact" : "full"));
        else if (e.key === "layoutDirection") setLayoutDirection((d) => (d === "TB" ? "LR" : "TB"));
        else if (e.key === "fullscreen") toggleFullscreen();
    };

    const handleCloseWithAnimation = useCallback(() => {
        if (!onClose) return;
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 350); // wait for animation
    }, [onClose]);

    const settingMenu: MenuProps = {
        items: [
            canEdit ? { key: "reload", icon: <ReloadOutlined />, label: "Hoàn tác" } : null,
            canEdit ? { key: "layout", icon: <ApartmentOutlined />, label: "Tự căn chỉnh" } : null,
            canEdit ? { key: "lock", icon: isDragLocked ? <UnlockOutlined /> : <LockOutlined />, label: isDragLocked ? "Mở khóa di chuyển" : "Khóa di chuyển" } : null,
            { key: "overview", icon: <EyeInvisibleOutlined />, label: "Xem bao quát" },
            { key: "viewMode", icon: viewMode === "full" ? <BarsOutlined /> : <AppstoreOutlined />, label: viewMode === "full" ? "Chế độ: Chi tiết" : "Chế độ: Tổng quan" },
            { key: "layoutDirection", icon: <ApartmentOutlined style={{ transform: layoutDirection === 'LR' ? 'rotate(-90deg)' : 'none' }} />, label: layoutDirection === "TB" ? "Hướng sơ đồ: Dọc" : "Hướng sơ đồ: Ngang" },
            { key: "fullscreen", icon: isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />, label: isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình" }
        ].filter(Boolean) as MenuProps['items'],
        onClick: handleMenuClick,
    };

    const chartName = (chartTitle ?? "").replace(/^Sơ đồ tổ chức\s*[-—]\s*/i, "").trim();

    return (
        <>
            <style>{`
                @keyframes slideUpOrgChart {
                    0% { transform: translateY(100vh); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeInBackdrop {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                @keyframes slideDownOrgChart {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
                @keyframes fadeOutBackdrop {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
            <div style={{ 
                position: "fixed", inset: 0, zIndex: 2499, 
                background: "rgba(15, 23, 42, 0.45)", 
                backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)",
                animation: isClosing ? "fadeOutBackdrop 0.4s ease-in forwards" : "fadeInBackdrop 0.4s ease-out" 
            }} onClick={handleCloseWithAnimation} />
            <div
                ref={containerRef}
                data-guide-id="dept-org-chart-canvas"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "#f8f9fb",
                    borderRadius: isMobile ? 18 : 24,
                    position: "fixed",
                    top: isMobile ? 8 : 16,
                    bottom: isMobile ? 8 : 16,
                    left: isMobile ? 8 : 16,
                    right: isMobile ? 8 : 16,
                    zIndex: 2500,
                    border: "1px solid rgba(226, 232, 240, 0.95)",
                    boxShadow: "0 26px 80px -28px rgba(15, 23, 42, 0.48), 0 8px 24px rgba(15, 23, 42, 0.10)",
                    overflow: "hidden",
                    animation: isClosing ? "slideDownOrgChart 0.4s cubic-bezier(0.4, 0, 1, 1) forwards" : "slideUpOrgChart 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
            {/* ── Floating Toolbar ── */}
            <div style={{
                position: "absolute",
                top: isMobile ? 8 : 12,
                left: isMobile ? 8 : 12,
                right: isMobile ? 8 : 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 0,
                background: "transparent",
                zIndex: 20,
                flexWrap: isMobile ? "wrap" : "nowrap",
                gap: 12,
                pointerEvents: "none",
            }}>
                {/* ── Title & Search ── */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: onClose ? 0 : 12,
                    flex: 1,
                    minWidth: 0,
                    pointerEvents: "auto",
                }}>
                    {onClose && (
                        <div
                            onClick={handleCloseWithAnimation}
                            style={{
                                width: isMobile ? 38 : isToolbarCollapsed ? 44 : 48,
                                height: isMobile ? 32 : isToolbarCollapsed ? 36 : 40,
                                background: "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)",
                                color: "white",
                                borderRadius: "20px 0 0 20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingRight: 12,
                                boxShadow: "-4px 4px 16px rgba(236, 72, 153, 0.25)",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                zIndex: 1,
                                flexShrink: 0,
                            }}
                        >
                            <CloseOutlined style={{ fontSize: isMobile ? 15 : 17 }} />
                        </div>
                    )}
                    {chartTitle && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            minHeight: isMobile ? 32 : isToolbarCollapsed ? 36 : 40,
                            padding: isMobile ? "4px 12px" : isToolbarCollapsed ? "4px 14px" : "5px 16px",
                            background: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid rgba(203, 213, 225, 0.75)",
                            borderLeftColor: onClose ? "transparent" : "rgba(203, 213, 225, 0.75)",
                            borderRadius: isToolbarCollapsed ? 16 : 20,
                            boxShadow: "4px 4px 16px rgba(15, 23, 42, 0.06)",
                            backdropFilter: "blur(10px)",
                            marginLeft: onClose ? -16 : 0,
                            zIndex: 2,
                            maxWidth: isMobile ? "calc(100% - 30px)" : "none",
                        }}>
                            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{
                                    color: "#64748b",
                                    fontSize: isMobile ? 8 : 9,
                                    fontWeight: 600,
                                    lineHeight: "11px",
                                    textTransform: "uppercase",
                                }}>
                                    Sơ đồ tổ chức
                                </span>
                                <span style={{
                                    color: "#1e293b",
                                    fontSize: isMobile ? 11 : isToolbarCollapsed ? 12 : 14,
                                    fontWeight: 700,
                                    lineHeight: isMobile ? "15px" : isToolbarCollapsed ? "16px" : "19px",
                                    overflow: "hidden",
                                    display: "-webkit-box",
                                    WebkitBoxOrient: "vertical",
                                    WebkitLineClamp: 2,
                                    overflowWrap: "anywhere",
                                }}>
                                    {chartName || chartTitle}
                                </span>
                            </div>

                            {!isToolbarCollapsed && (
                                <SearchBar
                                    nodes={nodes}
                                    onSelect={(id) => handleSearchSelect(id)}
                                    onClear={() => setSelectedNodeId(null)}
                                    isMobile={isMobile}
                                    isTablet={isTablet}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* ── Toolbar (right) ── */}
                <div style={{
                    display: "flex",
                    gap: isMobile ? 4 : isSmallLaptop ? 6 : 8,
                    flexWrap: "nowrap",
                    justifyContent: "flex-end",
                    pointerEvents: "auto",
                }}>
                    <Tooltip title={isToolbarCollapsed ? "Hiện công cụ" : "Ẩn công cụ để xem bao quát"}>
                        <Button
                            icon={isToolbarCollapsed ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            onClick={() => {
                                setIsToolbarCollapsed((prev) => !prev);
                                scheduleFitView(undefined, 120);
                            }}
                            size={isMobile ? "small" : "middle"}
                            style={{
                                ...btnBase,
                                background: "rgba(255, 255, 255, 0.9)",
                                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                            }}
                        >
                            {isToolbarCollapsed || isCompactViewport ? "" : "Bao quát"}
                        </Button>
                    </Tooltip>
                    {!isToolbarCollapsed && (
                    <>
                    {/* ── Lưu vị trí ── */}
                    <Access permission={ALL_PERMISSIONS.ORG_NODES.UPDATE} hideChildren>
                        {pendingSaves.size > 0 && (
                            isMobile ? (
                                <Tooltip title={`Lưu vị trí (${pendingSaves.size})`}>
                                    <Button
                                        loading={isSaving}
                                        icon={<SaveOutlined />}
                                        onClick={handleSavePositions}
                                        size="small"
                                        style={{ borderColor: "#faad14", color: "#faad14", fontWeight: 600 }}
                                    />
                                </Tooltip>
                            ) : (
                                <Button
                                    loading={isSaving}
                                    onClick={handleSavePositions}
                                    style={{ borderColor: "#faad14", color: "#faad14", fontWeight: 600 }}
                                >
                                    {isCompactViewport ? `Lưu (${pendingSaves.size})` : `Lưu vị trí (${pendingSaves.size})`}
                                </Button>
                            )
                        )}
                    </Access>

                    {/* ── Tùy chỉnh (Gom các tính năng phụ) ── */}
                    <Dropdown
                        menu={settingMenu}
                        trigger={["click"]}
                        placement="bottomRight"
                        overlayStyle={{ zIndex: 2600 }}
                        popupRender={(menu) => (
                            <div data-guide-id="org-chart-settings-dropdown">
                                {menu}
                            </div>
                        )}
                    >
                        {isMobile ? (
                            <Tooltip title="Tùy chỉnh">
                                <Button data-guide-id="org-chart-settings-button" icon={<SettingOutlined />} size="small" style={btnBase} />
                            </Tooltip>
                        ) : (
                            <Button data-guide-id="org-chart-settings-button" icon={<SettingOutlined />} style={btnBase}>
                                {isCompactViewport ? "" : "Tùy chỉnh"}
                            </Button>
                        )}
                    </Dropdown>

                    {/* ── Thêm vị trí ── */}
                    <Access permission={ALL_PERMISSIONS.ORG_NODES.CREATE} hideChildren>
                        {isMobile ? (
                            <Tooltip title="Thêm vị trí">
                                <Button
                                    data-guide-id="org-chart-add-button"
                                    icon={<PlusOutlined />}
                                    onClick={() => handleOpenCreateRoot("position", "single")}
                                    size="small"
                                    style={{
                                        background: "#e8637a", borderColor: "#e8637a",
                                        color: "#fff", fontWeight: 600,
                                        boxShadow: "0 2px 8px rgba(232,99,122,.3)",
                                    }}
                                />
                            </Tooltip>
                        ) : (
                            <Button
                                data-guide-id="org-chart-add-button"
                                icon={<PlusOutlined />}
                                onClick={() => handleOpenCreateRoot("position", "single")}
                                style={{
                                    background: "#e8637a", borderColor: "#e8637a",
                                    color: "#fff", fontWeight: 600,
                                    boxShadow: "0 2px 8px rgba(232,99,122,.3)",
                                    fontSize: isCompactViewport ? 13 : 14,
                                }}
                            >
                                {isCompactViewport ? "Thêm" : "Thêm vị trí"}
                            </Button>
                        )}
                    </Access>
                    </>
                    )}
                </div>
            </div>

            {/* ── React Flow Area ── */}
            <div
                ref={flowViewportRef}
                style={{
                    flex: 1,
                    position: "relative",
                    background: "#f6f8fb",
                }}
            >
                <ReactFlow
                nodes={nodes} edges={edges}
                nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                nodesDraggable={!isMobile && !isDragLocked}
                nodesConnectable={!isMobile}
                elementsSelectable
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={handleNodeDragStop}
                onConnect={handleConnect}
                minZoom={0.15}
                maxZoom={2}
                fitView
                fitViewOptions={{ padding: fitPadding, minZoom: fitMinZoom, maxZoom: 1.05 }}
                defaultEdgeOptions={EDGE_DEFAULTS}
                onPaneClick={() => setSelectedNodeId(null)}
                onMoveStart={() => setSelectedNodeId(null)}
            >
                {!isMobile && !isSmallLaptop && (
                    <MiniMap
                        nodeColor="#fda4af"
                        maskColor="rgba(0,0,0,0.04)"
                        style={{ borderRadius: 8, bottom: 20 }}
                    />
                )}
                <Controls
                    showInteractive={false}
                    style={{ bottom: isMobile ? 8 : 20, left: isMobile ? 8 : 20 }}
                />
                <Background
                    variant={BackgroundVariant.Dots}
                    color={isFullscreen ? "#cbd5e1" : "#e2e8f0"}
                    gap={22}
                    size={isFullscreen ? 1.3 : 1}
                />
                
                {/* ── MiniPanel ── */}
                <MiniPanel
                    nodeId={selectedNodeId}
                    nodes={nodes}
                    edges={edges}
                    isMobile={isMobile}
                    isTablet={isTablet}
                    isSmallLaptop={isSmallLaptop}
                    onClose={() => setSelectedNodeId(null)}
                />
            </ReactFlow>
            </div>

            <ModalNode
                open={openModal} onClose={handleCloseModal}
                onSubmit={handleSubmit}
                onBulkSubmit={handleBulkSubmit}
                nodes={nodes} jdOptions={jdOptions}
                jobTitleOptions={jobTitleOptions}
                initialValues={editingNode ? {
                    title: editingNode.data.title as string,
                    levelCode: editingNode.data.levelCode as string,
                    holderName: (editingNode.data.holderName as string) ?? "",
                    isGoal: (editingNode.data.isGoal as boolean) ?? false,
                    jobDescriptionId: (editingNode.data.jobDescriptionId as number) ?? null,
                    nodeKind: !editingNode.data.levelCode ? "department" : "position",
                    parentId: (() => {
                        const pe = edges.find((e) => e.target === editingNode.id);
                        return pe ? Number(pe.source) : null;
                    })(),
                } : (prefilledParentId ? {
                    title: "",
                    levelCode: "",
                    parentId: prefilledParentId,
                    nodeKind: modalInitialNodeKind,
                } : undefined)}
                isEditing={!!editingNode}
                initialMode={modalInitialMode}
                initialNodeKind={modalInitialNodeKind}
            />

            <ViewJobDescription
                open={jdOpen}
                onClose={() => { setJdOpen(false); setJdRecord(null); }}
                record={jdRecord}
            />
        </div>
        </>
    );
};

const OrgChartFlow = (props: Props) => (
    <ReactFlowProvider><OrgChartInner {...props} /></ReactFlowProvider>
);

export default OrgChartFlow;
