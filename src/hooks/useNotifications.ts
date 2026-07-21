import { createContext, createElement, startTransition, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJdFlowInboxQuery } from "@/hooks/useJdFlow";
import type { IJdInbox, IResNotificationDTO } from "@/types/backend";
import { useWebSocket } from "./useWebSocket";
import { callDeleteNotification, callFetchEvaluationNotifications, callReadEvaluationNotification, callReadAllEvaluationNotifications, callReadAllNotificationsByModule } from "@/config/api";
import { notify } from "@/components/common/notification/notify";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { DOCUMENT_NOTIFICATION_MODULES, PROCEDURE_NOTIFICATION_MODULES } from "@/config/notificationModules";

export interface UnifiedNotification {
    id: string;
    type: "jd" | "app";
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
    markAllReadByModules: (modules: string[]) => Promise<void>;
    markOneRead: (item: UnifiedNotification) => Promise<void>;
    deleteOne: (item: UnifiedNotification) => Promise<void>;
}

const EMPTY_NOTIFICATION_CONTEXT: NotificationContextValue = {
    items: [],
    unreadCount: 0,
    isLoading: false,
    soundEnabled: true,
    toggleSound: () => undefined,
    markAllRead: async () => undefined,
    markAllReadByModules: async () => undefined,
    markOneRead: async () => undefined,
    deleteOne: async () => undefined,
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = "notifications_seen_map";
const NOTIFICATION_SYNC_DELAY_MS = 500;
const QUERY_INVALIDATION_DELAY_MS = 500;

const EVALUATION_QUERY_KEYS = [
    ["evaluation-period"],
    ["evaluation-periods"],
    ["period-progress"],
    ["evaluation-record"],
    ["evaluation-task-counts"],
    ["my-evaluation-records"],
    ["manager-evaluation-records"],
    ["pending-manager-evaluation-records"],
    ["approval-evaluation-records"],
    ["pending-approval-evaluation-records"],
    ["evaluation-completed-summary"],
] as const;

const ACCOUNTING_DOSSIER_QUERY_KEYS = [
    ["accounting-dossiers"],
    ["accounting-dossiers-pending"],
    ["accounting-dossier"],
    ["accounting-dossier-approval-steps"],
    ["accounting-dossier-logs"],
    ["accounting-dossier-storage-summary"],
    ["accounting-dossier-pending-by-role"],
    ["accounting-dossier-report-by-status"],
    ["accounting-dossier-report-by-department"],
    ["accounting-dossier-report-by-category"],
    ["accounting-approval-delegations"],
] as const;

const DOCUMENT_QUERY_KEYS = [
    ["documents"],
    ["documents-by-category"],
    ["documents-by-department"],
] as const;

const scheduleIdleWork = (callback: () => void, timeout = 1200) => {
    if (typeof window === "undefined") {
        callback();
        return () => undefined;
    }

    if (window.requestIdleCallback) {
        const idleId = window.requestIdleCallback(callback, { timeout });
        return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(callback, 0);
    return () => window.clearTimeout(timeoutId);
};

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

const isNotificationDTO = (msg: Partial<IResNotificationDTO>): msg is IResNotificationDTO =>
    typeof msg.id === "number" &&
    typeof msg.module === "string" &&
    typeof msg.type === "string" &&
    typeof msg.content === "string" &&
    typeof msg.read === "boolean" &&
    typeof msg.createdAt === "string";

export const mapAppNotificationToUnified = (item: IResNotificationDTO): UnifiedNotification => {
    let title = "Thông báo hệ thống";
    if (item.module === "EVALUATION") {
        title = item.type === "REMINDER_DEADLINE" ? "Nhắc hạn đánh giá" : "Đánh giá năng lực";
    } else if (item.module === "JD_FLOW") {
        title = "Mô tả công việc";
    } else if (DOCUMENT_NOTIFICATION_MODULES.includes(item.module)) {
        title = item.module === "ACCOUNTING_DOCUMENTS" ? "Chứng từ kế toán" : "Văn bản";
    } else if (item.module === "ACCOUNTING_DOSSIERS") {
        title = "Bộ chứng từ kế toán";
    } else if (PROCEDURE_NOTIFICATION_MODULES.includes(item.module)) {
        title = item.module === "DEPARTMENT_PROCEDURES"
            ? "Quy trình phòng ban"
            : item.module === "CONFIDENTIAL_PROCEDURES"
                ? "Quy trình bảo mật"
                : "Quy trình công ty";
    } else if (item.module === "CAREER_PATHS") {
        title = "Lộ trình thăng tiến";
    }

    return {
        id: `app_${item.id}`,
        type: "app",
        module: item.module,
        title,
        subtitle: item.content,
        isRead: item.read,
        rawId: item.id,
        actionLink: item.actionLink,
        createdAt: item.createdAt
    };
};

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

        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const now = ctx.currentTime;

        const playTone = (freq: number, startTime: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);

            osc.onended = () => {
                osc.disconnect();
                gainNode.disconnect();
            };
        };

        playTone(987.77, now, 0.4);
        playTone(1318.51, now + 0.12, 0.6);
    } catch (err) {
        console.error("Failed to play notification sound", err);
    }
};

const useNotificationsState = (): NotificationContextValue => {
    const queryClient = useQueryClient();
    const canFetchJdInbox = useAccess(ALL_PERMISSIONS.JD_FLOW.FETCH_INBOX);
    const { data: jdItems = [], isFetching: isJdFetching } = useJdFlowInboxQuery({ enabled: canFetchJdInbox });
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

    const [appNotifs, setAppNotifs] = useState<IResNotificationDTO[]>([]);
    const notificationSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingInvalidationModules = useRef<Set<string>>(new Set());
    const invalidationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cancelIdleInvalidation = useRef<(() => void) | null>(null);

    useEffect(() => () => {
        if (notificationSyncTimer.current) {
            clearTimeout(notificationSyncTimer.current);
        }
        if (invalidationTimer.current) {
            clearTimeout(invalidationTimer.current);
        }
        cancelIdleInvalidation.current?.();
    }, []);

    useEffect(() => {
        const fetchInitial = async () => {
            setIsAppFetching(true);
            try {
                const res = await callFetchEvaluationNotifications();
                if (res && Array.isArray(res.data)) {
                    setAppNotifs(res.data);
                }
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
            setIsAppFetching(false);
        };
        fetchInitial();
    }, []);

    const scheduleQueryInvalidation = (module: string, documentId?: number) => {
        pendingInvalidationModules.current.add(module);
        if (documentId) {
            pendingInvalidationModules.current.add(`DOCUMENT:${documentId}`);
        }

        if (invalidationTimer.current) {
            clearTimeout(invalidationTimer.current);
        }

        invalidationTimer.current = setTimeout(() => {
            invalidationTimer.current = null;
            cancelIdleInvalidation.current?.();
            cancelIdleInvalidation.current = scheduleIdleWork(() => {
                cancelIdleInvalidation.current = null;
                const modules = new Set(pendingInvalidationModules.current);
                pendingInvalidationModules.current.clear();

                if (modules.has("DOCUMENT")) {
                    DOCUMENT_QUERY_KEYS.forEach((queryKey) => {
                        queryClient.invalidateQueries({ queryKey, exact: false });
                    });
                    modules.forEach((key) => {
                        if (!key.startsWith("DOCUMENT:")) return;
                        const documentId = Number(key.slice("DOCUMENT:".length));
                        if (!Number.isFinite(documentId)) return;
                        queryClient.invalidateQueries({ queryKey: ["document", documentId] });
                        queryClient.invalidateQueries({ queryKey: ["document-share-tokens", documentId] });
                    });
                }

                if (modules.has("EVALUATION")) {
                    EVALUATION_QUERY_KEYS.forEach((queryKey) => {
                        queryClient.invalidateQueries({ queryKey, exact: false });
                    });
                }

                if (modules.has("ACCOUNTING_DOSSIERS")) {
                    ACCOUNTING_DOSSIER_QUERY_KEYS.forEach((queryKey) => {
                        queryClient.invalidateQueries({ queryKey, exact: false });
                    });
                }

                if (modules.has("JD_FLOW")) {
                    queryClient.invalidateQueries({ queryKey: ["jd-flow-inbox"] });
                }
            });
        }, QUERY_INVALIDATION_DELAY_MS);
    };

    useWebSocket((msg) => {
        const isDocumentRealtimeEvent = msg.module === "DOCUMENT" && !!msg.documentId && !msg.id;
        if (isDocumentRealtimeEvent) {
            scheduleQueryInvalidation("DOCUMENT", msg.documentId);
            return;
        }

        if (soundEnabled) {
            playNotificationSound();
        }
        pushGroupedNotification(msg.content ?? "Bạn có thông báo mới");

        startTransition(() => {
            setAppNotifs((prev) => {
                if (!isNotificationDTO(msg)) return prev;
                if (prev.some((n) => n.id === msg.id)) return prev;
                return [msg, ...prev];
            });
        });

        if (notificationSyncTimer.current) {
            clearTimeout(notificationSyncTimer.current);
        }
        notificationSyncTimer.current = setTimeout(() => {
            notificationSyncTimer.current = null;
            callFetchEvaluationNotifications().then(res => {
                const notifications = Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray((res?.data as any)?.data)
                        ? (res.data as any).data
                        : [];
                startTransition(() => {
                    setAppNotifs(notifications);
                });
            }).catch((e) => {
                console.error("Failed to sync notifications", e);
            });
        }, NOTIFICATION_SYNC_DELAY_MS);

        scheduleQueryInvalidation(msg.module);
    });

    const unifiedItems = useMemo<UnifiedNotification[]>(() => {
        const items: UnifiedNotification[] = [];
        const jdInboxIds = new Set(jdItems.map(item => item.jdId));

        jdItems.forEach(item => {
            const currentKey = getItemKey(item);
            const isRead = seenMap[item.jdId] === currentKey;
            items.push({
                id: `jd_${item.jdId}`,
                type: "jd",
                module: "JD_FLOW",
                title: `Mô tả công việc cần duyệt: #${item.code ?? item.jdId}`,
                subtitle: `Gửi bởi: ${item.fromUser?.name ?? "—"}`,
                isRead,
                rawId: item.jdId,
                actionLink: `/admin/job-descriptions?tab=inbox&viewId=${item.jdId}`,
                createdAt: item.updatedAt
            });
        });

        appNotifs.forEach(item => {
            const jdViewId = item.module === "JD_FLOW"
                ? Number(item.actionLink?.match(/[?&]viewId=(\d+)/)?.[1])
                : Number.NaN;
            if (Number.isInteger(jdViewId) && jdInboxIds.has(jdViewId)) return;
            items.push(mapAppNotificationToUnified(item));
        });

        return items;
    }, [appNotifs, jdItems, seenMap]);

    const unreadCount = useMemo(
        () => unifiedItems.filter(i => !i.isRead).length,
        [unifiedItems]
    );

    const markAllRead = async () => {
        const prevMap = seenMap;
        const prevAppNotifs = appNotifs;
        const newMap = { ...seenMap };
        jdItems.forEach((item) => {
            newMap[item.jdId] = getItemKey(item);
        });
        saveSeenMap(newMap);
        setSeenVersion(v => v + 1);
        setAppNotifs(prev => prev.map(n => ({ ...n, read: true })));

        try {
            await callReadAllEvaluationNotifications();
        } catch (e) {
            saveSeenMap(prevMap);
            setSeenVersion(v => v + 1);
            setAppNotifs(prevAppNotifs);
            notify.error("Không thể đánh dấu thông báo đã đọc. Vui lòng thử lại.");
            throw e;
        }
    };

    const markAllReadByModules = async (modules: string[]) => {
        const targetModules = Array.from(new Set(modules.filter(Boolean)));
        if (targetModules.length === 0) return;

        const prev = appNotifs;
        setAppNotifs(current => current.map(n =>
            targetModules.includes(n.module) ? { ...n, read: true } : n
        ));

        try {
            await Promise.all(targetModules.map(module => callReadAllNotificationsByModule(module)));
        } catch (e) {
            setAppNotifs(prev);
            notify.error("Không thể đánh dấu thông báo đã đọc. Vui lòng thử lại.");
            throw e;
        }
    };

    const markOneRead = async (item: UnifiedNotification) => {
        if (item.type === "jd") {
            const raw = jdItems.find((i) => i.jdId === item.rawId);
            if (raw) {
                const newMap = { ...seenMap, [raw.jdId]: getItemKey(raw) };
                saveSeenMap(newMap);
                setSeenVersion(v => v + 1);
            }
        } else {
            const prev = appNotifs;
            setAppNotifs(p => p.map(n => n.id === item.rawId ? { ...n, read: true } : n));
            try {
                await callReadEvaluationNotification(item.rawId);
            } catch (e) {
                setAppNotifs(prev);
                notify.error("Không thể đánh dấu thông báo đã đọc. Vui lòng thử lại.");
                throw e;
            }
        }
    };

    const deleteOne = async (item: UnifiedNotification) => {
        if (item.type !== "app") return;

        const prev = appNotifs;
        setAppNotifs(p => p.filter(n => n.id !== item.rawId));

        try {
            await callDeleteNotification(item.rawId);
        } catch (e) {
            setAppNotifs(prev);
            notify.error("Không thể xoá thông báo. Vui lòng thử lại.");
            throw e;
        }
    };

    return {
        items: unifiedItems,
        unreadCount,
        isLoading: isJdFetching || isAppFetching,
        soundEnabled,
        toggleSound,
        markAllRead,
        markAllReadByModules,
        markOneRead,
        deleteOne,
    };
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const value = useNotificationsState();
    return createElement(NotificationContext.Provider, { value }, children);
};

export const useNotifications = () => {
    return useContext(NotificationContext) ?? EMPTY_NOTIFICATION_CONTEXT;
};
