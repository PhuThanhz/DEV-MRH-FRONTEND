import { useQuery } from "@tanstack/react-query";
import { callFetchMyCalendarActions } from "@/config/api";

export const UNIFIED_CALENDAR_KEY = "unified-calendar-my-actions";

export const useMyCalendarActionsQuery = (from?: string, to?: string) => {
    return useQuery({
        queryKey: [UNIFIED_CALENDAR_KEY, from, to],
        queryFn: async () => {
            const res = await callFetchMyCalendarActions(from, to);
            if (res && res.data) {
                return res.data;
            }
            return [];
        },
    });
};
