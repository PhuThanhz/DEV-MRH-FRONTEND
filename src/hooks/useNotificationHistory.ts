import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { callFetchNotificationsPaginate } from "@/config/api";
import { notify } from "@/components/common/notification/notify";
import type { IResNotificationDTO } from "@/types/backend";
import { mapAppNotificationToUnified, type UnifiedNotification, useNotifications } from "@/hooks/useNotifications";

const PAGE_SIZE = 20;

const sortByCreatedAtDesc = (a: UnifiedNotification, b: UnifiedNotification) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
};

export const useNotificationHistory = (enabled: boolean) => {
    const {
        items: realtimeItems,
        unreadCount,
        soundEnabled,
        toggleSound,
        markAllRead: markRealtimeAllRead,
        markOneRead: markRealtimeOneRead,
        deleteOne: deleteRealtimeOne,
    } = useNotifications();
    const [appNotifs, setAppNotifs] = useState<IResNotificationDTO[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const isFetchingRef = useRef(false);

    const fetchPage = useCallback(async (nextPage: number, replace = false) => {
        if (isFetchingRef.current) return;

        isFetchingRef.current = true;
        if (replace) {
            setIsInitialLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const res = await callFetchNotificationsPaginate(nextPage, PAGE_SIZE);
            const payload = res.data;
            const nextItems = payload?.result ?? [];
            const meta = payload?.meta;

            setAppNotifs(prev => replace ? nextItems : [...prev, ...nextItems]);
            setPage(nextPage);
            setHasMore(meta ? nextPage < meta.pages - 1 : nextItems.length === PAGE_SIZE);
        } catch {
            notify.error("Không thể tải lịch sử thông báo. Vui lòng thử lại.");
        } finally {
            isFetchingRef.current = false;
            setIsInitialLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        fetchPage(0, true);
    }, [enabled, fetchPage]);

    const jdItems = useMemo(
        () => realtimeItems.filter(item => item.type === "jd"),
        [realtimeItems]
    );

    const items = useMemo(() => {
        const jdInboxIds = new Set(jdItems.map(item => item.rawId));
        const appItems = appNotifs
            .filter(item => {
                if (item.module !== "JD_FLOW") return true;
                const viewId = Number(item.actionLink?.match(/[?&]viewId=(\d+)/)?.[1]);
                return !Number.isInteger(viewId) || !jdInboxIds.has(viewId);
            })
            .map(mapAppNotificationToUnified);

        return [...jdItems, ...appItems].sort(sortByCreatedAtDesc);
    }, [appNotifs, jdItems]);

    const loadMore = useCallback(() => {
        if (isInitialLoading || isLoadingMore || !hasMore) return;
        fetchPage(page + 1);
    }, [fetchPage, hasMore, isInitialLoading, isLoadingMore, page]);

    const refresh = useCallback(() => {
        fetchPage(0, true);
    }, [fetchPage]);

    const markOneRead = useCallback(async (item: UnifiedNotification) => {
        if (item.type === "jd") {
            await markRealtimeOneRead(item);
            return;
        }

        const prev = appNotifs;
        setAppNotifs(current => current.map(n => n.id === item.rawId ? { ...n, read: true } : n));
        try {
            await markRealtimeOneRead(item);
        } catch {
            setAppNotifs(prev);
        }
    }, [appNotifs, markRealtimeOneRead]);

    const markAllRead = useCallback(async () => {
        const prev = appNotifs;
        setAppNotifs(current => current.map(n => ({ ...n, read: true })));

        try {
            await markRealtimeAllRead();
        } catch {
            setAppNotifs(prev);
        }
    }, [appNotifs, markRealtimeAllRead]);

    const deleteOne = useCallback(async (item: UnifiedNotification) => {
        if (item.type !== "app") return;

        const prev = appNotifs;
        setAppNotifs(current => current.filter(n => n.id !== item.rawId));
        try {
            await deleteRealtimeOne(item);
        } catch {
            setAppNotifs(prev);
        }
    }, [appNotifs, deleteRealtimeOne]);

    return {
        items,
        unreadCount,
        isLoading: isInitialLoading,
        isLoadingMore,
        hasMore,
        soundEnabled,
        toggleSound,
        markAllRead,
        markOneRead,
        deleteOne,
        loadMore,
        refresh,
    };
};
