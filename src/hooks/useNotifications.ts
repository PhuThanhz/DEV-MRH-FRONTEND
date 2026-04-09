import { useEffect, useRef } from "react";
import { useJdFlowInboxQuery } from "@/hooks/useJdFlow";
import type { IJdInbox } from "@/types/backend";

const STORAGE_KEY = "notifications_seen_map";

const getSeenMap = (): Record<number, string> => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
};

const saveSeenMap = (map: Record<number, string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

// key = status + updatedAt — đổi 1 trong 2 là unread lại
const getItemKey = (item: IJdInbox): string =>
    `${item.status}_${item.updatedAt ?? ""}`;

export const useNotifications = () => {
    const { data: inboxItems = [], refetch } = useJdFlowInboxQuery();

    // auto refetch mỗi 30s
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        intervalRef.current = setInterval(() => refetch(), 30_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [refetch]);

    const seenMap = getSeenMap();

    const unreadItems = inboxItems.filter((item) => {
        const currentKey = getItemKey(item);
        return seenMap[item.jdId] !== currentKey;
    });

    const unreadCount = unreadItems.length;

    const markAllRead = () => {
        const newMap = { ...seenMap };
        inboxItems.forEach((item) => {
            newMap[item.jdId] = getItemKey(item);
        });
        saveSeenMap(newMap);
    };

    const markOneRead = (jdId: number) => {
        const item = inboxItems.find((i) => i.jdId === jdId);
        if (!item) return;
        const newMap = { ...seenMap, [jdId]: getItemKey(item) };
        saveSeenMap(newMap);
    };

    return {
        items: inboxItems,
        unreadItems,
        unreadCount,
        markAllRead,
        markOneRead,
        refetch,
    };
};