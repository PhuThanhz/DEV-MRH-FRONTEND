import { useRef, type PropsWithChildren } from "react";
import { HighlightStoreContext, OrgChartHighlightStore } from "./orgChartHighlightState";

export const OrgChartHighlightProvider = ({ children }: PropsWithChildren) => {
    const storeRef = useRef<OrgChartHighlightStore | null>(null);
    if (!storeRef.current) storeRef.current = new OrgChartHighlightStore();
    return <HighlightStoreContext.Provider value={storeRef.current}>{children}</HighlightStoreContext.Provider>;
};
