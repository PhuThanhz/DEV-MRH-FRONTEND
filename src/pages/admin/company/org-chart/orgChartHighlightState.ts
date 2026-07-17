import { createContext } from "react";

export type NodeHighlightState = "idle" | "active" | "ancestor" | "descendant";
export type EdgeHighlightState = "none" | "ancestor" | "descendant";

type GraphEdge = { id: string; source: string; target: string };
type Listener = () => void;

export class OrgChartHighlightStore {
    private parentByNode = new Map<string, { nodeId: string; edgeId: string }>();
    private childrenByNode = new Map<string, Array<{ nodeId: string; edgeId: string }>>();
    private nodeStates = new Map<string, NodeHighlightState>();
    private edgeStates = new Map<string, EdgeHighlightState>();
    private nodeListeners = new Map<string, Set<Listener>>();
    private edgeListeners = new Map<string, Set<Listener>>();
    private hoveredId: string | null = null;

    setGraph(edges: GraphEdge[]) {
        this.parentByNode.clear();
        this.childrenByNode.clear();
        for (const edge of edges) {
            this.parentByNode.set(edge.target, { nodeId: edge.source, edgeId: edge.id });
            const children = this.childrenByNode.get(edge.source) ?? [];
            children.push({ nodeId: edge.target, edgeId: edge.id });
            this.childrenByNode.set(edge.source, children);
        }
        this.hoveredId = null;
        this.replaceStates(new Map(), new Map());
    }

    setHovered(hoveredId: string | null) {
        if (hoveredId === this.hoveredId) return;
        this.hoveredId = hoveredId;

        const nextNodeStates = new Map<string, NodeHighlightState>();
        const nextEdgeStates = new Map<string, EdgeHighlightState>();

        if (hoveredId) {
            nextNodeStates.set(hoveredId, "active");

            const visitedAncestors = new Set<string>();
            let currentId = hoveredId;
            let parent = this.parentByNode.get(currentId);
            while (parent && !visitedAncestors.has(parent.nodeId)) {
                visitedAncestors.add(parent.nodeId);
                nextNodeStates.set(parent.nodeId, "ancestor");
                nextEdgeStates.set(parent.edgeId, "ancestor");
                currentId = parent.nodeId;
                parent = this.parentByNode.get(currentId);
            }

            const visitedDescendants = new Set<string>();
            const queue = [hoveredId];
            while (queue.length > 0) {
                const nodeId = queue.shift()!;
                for (const child of this.childrenByNode.get(nodeId) ?? []) {
                    if (visitedDescendants.has(child.nodeId)) continue;
                    visitedDescendants.add(child.nodeId);
                    nextNodeStates.set(child.nodeId, "descendant");
                    nextEdgeStates.set(child.edgeId, "descendant");
                    queue.push(child.nodeId);
                }
            }
        }

        this.replaceStates(nextNodeStates, nextEdgeStates);
    }

    getNodeState = (nodeId: string): NodeHighlightState => this.nodeStates.get(nodeId) ?? "idle";
    getEdgeState = (edgeId: string): EdgeHighlightState => this.edgeStates.get(edgeId) ?? "none";

    subscribeNode = (nodeId: string, listener: Listener) => this.subscribe(this.nodeListeners, nodeId, listener);
    subscribeEdge = (edgeId: string, listener: Listener) => this.subscribe(this.edgeListeners, edgeId, listener);

    private subscribe(registry: Map<string, Set<Listener>>, id: string, listener: Listener) {
        const listeners = registry.get(id) ?? new Set<Listener>();
        listeners.add(listener);
        registry.set(id, listeners);
        return () => {
            listeners.delete(listener);
            if (listeners.size === 0) registry.delete(id);
        };
    }

    private replaceStates(
        nextNodeStates: Map<string, NodeHighlightState>,
        nextEdgeStates: Map<string, EdgeHighlightState>,
    ) {
        const nodeIds = new Set([...this.nodeStates.keys(), ...nextNodeStates.keys()]);
        const edgeIds = new Set([...this.edgeStates.keys(), ...nextEdgeStates.keys()]);
        const previousNodeStates = this.nodeStates;
        const previousEdgeStates = this.edgeStates;
        this.nodeStates = nextNodeStates;
        this.edgeStates = nextEdgeStates;

        for (const id of nodeIds) {
            if ((previousNodeStates.get(id) ?? "idle") !== (nextNodeStates.get(id) ?? "idle")) {
                this.nodeListeners.get(id)?.forEach((listener) => listener());
            }
        }
        for (const id of edgeIds) {
            if ((previousEdgeStates.get(id) ?? "none") !== (nextEdgeStates.get(id) ?? "none")) {
                this.edgeListeners.get(id)?.forEach((listener) => listener());
            }
        }
    }
}

export const HighlightStoreContext = createContext<OrgChartHighlightStore | null>(null);
