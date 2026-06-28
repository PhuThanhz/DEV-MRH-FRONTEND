import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJdFlowInboxQuery } from "@/hooks/useJdFlow";
import type { IJdInbox } from "@/types/backend";
import { useWebSocket } from "./useWebSocket";
import { callFetchEvaluationNotifications, callReadEvaluationNotification, callReadAllEvaluationNotifications } from "@/config/api";
import { notify } from "@/components/common/notification/notify";

export interface UnifiedNotification {
    id: string; // e.g. "jd_1" or "eval_2"
    type: "jd" | "eval";
    module?: string; // Bổ sung để dễ dàng phân loại các loại thông báo khác nhau
    title: string;
    subtitle: string;
    isRead: boolean;
    rawId: number;
    actionLink?: string;
    createdAt?: string;
}

interface NotificationContextValue {
    items: UnifiedNotification[];
    unreadCount: number;
    isLoading: boolean;
    soundEnabled: boolean;
    toggleSound: () => void;
    markAllRead: () => Promise<void>;
    markOneRead: (item: UnifiedNotification) => Promise<void>;
}

const EMPTY_NOTIFICATION_CONTEXT: NotificationContextValue = {
    items: [],
    unreadCount: 0,
    isLoading: false,
    soundEnabled: true,
    toggleSound: () => undefined,
    markAllRead: async () => undefined,
    markOneRead: async () => undefined,
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

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
let pendingToastCount = 0;
let pendingToastTimer: ReturnType<typeof setTimeout> | null = null;

const pushGroupedNotification = (content: string) => {
    pendingToastCount += 1;

    if (pendingToastTimer) return;

    pendingToastTimer = setTimeout(() => {
        const count = pendingToastCount;
        pendingToastCount = 0;
        pendingToastTimer = null;

        if (count <= 1) {
            notify.pushNotification("Thông báo mới", content);
            return;
        }

        notify.pushNotification(
            `${count} thông báo mới`,
            "Mở trung tâm thông báo để xem chi tiết."
        );
    }, 900);
};

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

        const now = ctx.currentTime;

        // Hàm tạo 1 nốt nhạc mượt mà
        const playTone = (freq: number, startTime: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            // Dùng sóng sine cho âm thanh tròn, êm ái
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            // Envelope: attack nhanh, decay mượt
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);

            // Dọn dẹp
            osc.onended = () => {
                osc.disconnect();
                gainNode.disconnect();
            };
        };

        // Tạo hiệu ứng chuông đôi (Double Chime) cực kỳ thanh lịch
        // Nốt thứ 1: B5
        playTone(987.77, now, 0.4);
        // Nốt thứ 2: E6 (vang lên sau 0.12s)
        playTone(1318.51, now + 0.12, 0.6);
    } catch (err) {
        console.error("Failed to play notification sound", err);
    }
};

const useNotificationsState = (): NotificationContextValue => {
    const queryClient = useQueryClient();
    const { data: jdItems = [], isFetching: isJdFetching, refetch: refetchJd } = useJdFlowInboxQuery();
    const [seenVersion, setSeenVersion] = useState(0);
    const seenMap = useMemo(() => getSeenMap(), [seenVersion]);

    const [isAppFetching, setIsAppFetching] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem("notification_sound_disabled") !== "true";
    });

    const toggleSound = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        localStorage.setItem("notification_sound_disabled", (!next).toString());
    };

    // State for Evaluation Notifications
    const [appNotifs, setAppNotifs] = useState<any[]>([]);

    useEffect(() => {
        const fetchInitial = async () => {
            setIsAppFetching(true);
            try {
                // Đổi thành fetch toàn bộ (cả read và unread) để giữ lịch sử
                const res = await callFetchEvaluationNotifications();
                if (res && res.data) {
                    setAppNotifs(res.data);
                }
            } catch (e) { }
            setIsAppFetching(false);
        };
        fetchInitial();
    }, []);

    useWebSocket((msg) => {
        const isDocumentRealtimeEvent = msg.module === "DOCUMENT" && !!msg.documentId && !msg.id;
        if (isDocumentRealtimeEvent) {
            queryClient.invalidateQueries({ queryKey: ["documents"], exact: false });
            queryClient.invalidateQueries({ queryKey: ["documents-by-category"], exact: false });
            queryClient.invalidateQueries({ queryKey: ["documents-by-department"], exact: false });
            if (msg.documentId) {
                queryClient.invalidateQueries({ queryKey: ["document", msg.documentId] });
                queryClient.invalidateQueries({ queryKey: ["document-share-tokens", msg.documentId] });
            }
            return;
        }

        // Play "ding" sound
        if (soundEnabled) {
            playNotificationSound();
        }
        // Gom toast realtime để người dùng không bị spam khi nhiều module cập nhật cùng lúc.
        pushGroupedNotification(msg.content ?? "Bạn có thông báo mới");
        // Append to unread list
        setAppNotifs((prev) => [msg, ...prev]);
        // Real-time invalidate JD Inbox query to trigger fetch only when there's an actual update!
        queryClient.invalidateQueries({ queryKey: ["jd-flow-inbox"] });
    });

    const unifiedItems = useMemo<UnifiedNotification[]>(() => {
        const items: UnifiedNotification[] = [];

        jdItems.forEach(item => {
            const currentKey = getItemKey(item);
            const isRead = seenMap[item.jdId] === currentKey;
            items.push({
                id: `jd_${item.jdId}`,
                type: "jd",
                module: "JD_FLOW",
                title: `JD cần duyệt: #${item.code ?? item.jdId}`,
                subtitle: `Gửi bởi: ${item.fromUser?.name ?? "—"}`,
                isRead,
                rawId: item.jdId,
                actionLink: `/admin/job-descriptions?tab=inbox&viewId=${item.jdId}`,
                createdAt: item.updatedAt
            });
        });

        appNotifs.forEach(item => {
            let title = "Thông báo hệ thống";
            if (item.module === "EVALUATION") {
                title = item.type === 'REMINDER_DEADLINE' ? 'Nhắc nhở Đánh giá' : 'Thông báo Đánh giá';
            } else if (item.module === "JD_FLOW") {
                title = "Thông báo Mô tả công việc";
            } else if (item.module === "DOCUMENT") {
                title = "Thông báo Văn bản";
            }

            items.push({
                id: `app_${item.id}`,
                type: "eval", // Vẫn giữ "eval" tạm thời để không lỗi logic click cũ
                module: item.module,
                title: title,
                subtitle: item.content,
                isRead: item.read,
                rawId: item.id,
                actionLink: item.actionLink,
                createdAt: item.createdAt
            });
        });

        return items;
    }, [appNotifs, jdItems, seenMap]);

    const unreadCount = useMemo(
        () => unifiedItems.filter(i => !i.isRead).length,
        [unifiedItems]
    );

    const markAllRead = async () => {
        // JD
        const newMap = { ...seenMap };
        jdItems.forEach((item) => {
            newMap[item.jdId] = getItemKey(item);
        });
        saveSeenMap(newMap);
        setSeenVersion(v => v + 1);

        // App
        try {
            await callReadAllEvaluationNotifications();
            setAppNotifs(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) { }
    };

    const markOneRead = async (item: UnifiedNotification) => {
        if (item.type === "jd") {
            const raw = jdItems.find((i) => i.jdId === item.rawId);
            if (raw) {
                const newMap = { ...seenMap, [raw.jdId]: getItemKey(raw) };
                saveSeenMap(newMap);
                setSeenVersion(v => v + 1);
            }
        } else if (item.type === "eval") {
            try {
                await callReadEvaluationNotification(item.rawId);
                setAppNotifs(prev => prev.map(n => n.id === item.rawId ? { ...n, read: true } : n));
            } catch (e) { }
        }
    };

    return {
        items: unifiedItems,
        unreadCount,
        isLoading: isJdFetching || isAppFetching,
        soundEnabled,
        toggleSound,
        markAllRead,
        markOneRead,
    };
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const value = useNotificationsState();
    return createElement(NotificationContext.Provider, { value }, children);
};

export const useNotifications = () => {
    return useContext(NotificationContext) ?? EMPTY_NOTIFICATION_CONTEXT;
};
