import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJdFlowInboxQuery } from "@/hooks/useJdFlow";
import type { IJdInbox } from "@/types/backend";
import { useWebSocket } from "./useWebSocket";
import { callFetchEvaluationNotifications, callReadEvaluationNotification, callReadAllEvaluationNotifications } from "@/config/api";
import { notify } from "@/components/common/notification/notify";

export interface UnifiedNotification {
    id: string; // e.g. "jd_1" or "eval_2"
    type: "jd" | "eval";
    title: string;
    subtitle: string;
    isRead: boolean;
    rawId: number;
    actionLink?: string;
}

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

const getItemKey = (item: IJdInbox): string =>
    `${item.status}_${item.updatedAt ?? ""}`;

// Reuse a single AudioContext to avoid browser limits
let _audioCtx: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    if (!_audioCtx || _audioCtx.state === 'closed') {
        _audioCtx = new AC();
    }
    return _audioCtx;
};

const playNotificationSound = async () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Resume if browser suspended it (autoplay policy)
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        // "Ding" sound: sine wave at A5
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);

        // Envelope: quick attack, smooth decay
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);

        // Cleanup nodes after done
        osc.onended = () => {
            osc.disconnect();
            gainNode.disconnect();
        };
    } catch (err) {
        console.error("Failed to play notification sound", err);
    }
};

export const useNotifications = () => {
    const queryClient = useQueryClient();
    const { data: jdItems = [], refetch: refetchJd } = useJdFlowInboxQuery();
    const seenMap = getSeenMap();

    // State for Evaluation Notifications
    const [appNotifs, setAppNotifs] = useState<any[]>([]);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                // Đổi thành fetch toàn bộ (cả read và unread) để giữ lịch sử
                const res = await callFetchEvaluationNotifications();
                if (res && res.data) {
                    setAppNotifs(res.data);
                }
            } catch (e) { }
        };
        fetchInitial();
    }, []);

    useWebSocket((msg) => {
        // Play "ding" sound
        playNotificationSound();
        // Show popup toast
        notify.info("Thông báo mới: " + msg.content);
        // Append to unread list
        setAppNotifs((prev) => [msg, ...prev]);
        // Real-time invalidate JD Inbox query to trigger fetch only when there's an actual update!
        queryClient.invalidateQueries({ queryKey: ["jd-flow-inbox"] });
    });

    // Merge logic
    const unifiedItems: UnifiedNotification[] = [];

    // 1. JD Flow Items
    jdItems.forEach(item => {
        const currentKey = getItemKey(item);
        const isRead = seenMap[item.jdId] === currentKey;
        unifiedItems.push({
            id: `jd_${item.jdId}`,
            type: "jd",
            title: `JD cần duyệt: #${item.code ?? item.jdId}`,
            subtitle: `Gửi bởi: ${item.fromUser?.name ?? "—"}`,
            isRead,
            rawId: item.jdId,
        });
    });

    // 2. Generic App Items
    appNotifs.forEach(item => {
        let title = "Thông báo hệ thống";
        if (item.module === "EVALUATION") {
            title = item.type === 'REMINDER_DEADLINE' ? 'Nhắc nhở Đánh giá' : 'Thông báo Đánh giá';
        } else if (item.module === "JD_FLOW") {
            title = "Thông báo Mô tả công việc";
        }

        unifiedItems.push({
            id: `app_${item.id}`,
            type: "eval", // Giữ nguyên "eval" để dùng chung logic click cũ
            title: title,
            subtitle: item.content,
            isRead: item.read,
            rawId: item.id,
            actionLink: item.actionLink
        });
    });

    const unreadCount = unifiedItems.filter(i => !i.isRead).length;

    const markAllRead = async () => {
        // JD
        const newMap = { ...seenMap };
        jdItems.forEach((item) => {
            newMap[item.jdId] = getItemKey(item);
        });
        saveSeenMap(newMap);
        
        // App
        try {
            await callReadAllEvaluationNotifications();
            setAppNotifs(prev => prev.map(n => ({ ...n, read: true })));
        } catch(e) {}
    };

    const markOneRead = async (item: UnifiedNotification) => {
        if (item.type === "jd") {
            const raw = jdItems.find((i) => i.jdId === item.rawId);
            if (raw) {
                const newMap = { ...seenMap, [raw.jdId]: getItemKey(raw) };
                saveSeenMap(newMap);
            }
        } else if (item.type === "eval") {
            try {
                await callReadEvaluationNotification(item.rawId);
                setAppNotifs(prev => prev.map(n => n.id === item.rawId ? { ...n, read: true } : n));
            } catch(e) {}
        }
    };

    return {
        items: unifiedItems,
        unreadCount,
        markAllRead,
        markOneRead,
    };
};