import { useCallback, useContext, useSyncExternalStore } from "react";
import { HighlightStoreContext } from "./orgChartHighlightState";

export const useOrgChartHighlightStore = () => {
    const store = useContext(HighlightStoreContext);
    if (!store) throw new Error("OrgChartHighlightProvider is missing");
    return store;
};

export const useNodeHighlightState = (nodeId: string) => {
    const store = useOrgChartHighlightStore();
    const subscribe = useCallback((listener: () => void) => store.subscribeNode(nodeId, listener), [nodeId, store]);
    const getSnapshot = useCallback(() => store.getNodeState(nodeId), [nodeId, store]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export const useEdgeHighlightState = (edgeId: string) => {
    const store = useOrgChartHighlightStore();
    const subscribe = useCallback((listener: () => void) => store.subscribeEdge(edgeId, listener), [edgeId, store]);
    const getSnapshot = useCallback(() => store.getEdgeState(edgeId), [edgeId, store]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
