import { useEffect, useRef, useState } from "react";
import type { Client } from "@stomp/stompjs";
import { useAppSelector } from "@/redux/hooks";

interface IWebSocketMessage {
    id?: number;
    module: string;
    type: string;
    content?: string;
    actionLink?: string;
    read?: boolean;
    createdAt: string;
    documentId?: number;
    documentCode?: string;
}

const WS_RECONNECT_BASE_DELAY_MS = 5000;
const WS_RECONNECT_MAX_DELAY_MS = 60_000;
const WS_CONNECTION_TIMEOUT_MS = 10_000;
const WS_MAX_RECONNECT_ATTEMPTS = 8;
const WS_RECONNECT_COOLDOWN_MS = 120_000;
const TOKEN_UPDATED_EVENT = "hrm:access-token-updated";

export const useWebSocket = (onMessageReceived: (msg: IWebSocketMessage) => void) => {
    const userId = useAppSelector((state) => state.account.user?.id);
    const clientRef = useRef<Client | null>(null);
    const [connected, setConnected] = useState(false);
    const [tokenVersion, setTokenVersion] = useState(0);

    // Keep the latest callback reference to prevent stale closures in the STOMP subscription
    const onMessageReceivedRef = useRef(onMessageReceived);
    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        const handleTokenUpdate = () => setTokenVersion((version) => version + 1);
        const handleStorage = (event: StorageEvent) => {
            if (event.key === "access_token") handleTokenUpdate();
        };

        window.addEventListener(TOKEN_UPDATED_EVENT, handleTokenUpdate);
        window.addEventListener("storage", handleStorage);
        return () => {
            window.removeEventListener(TOKEN_UPDATED_EVENT, handleTokenUpdate);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    useEffect(() => {
        const initialToken = localStorage.getItem("access_token");
        if (!userId || !initialToken || isJwtExpired(initialToken)) {
            setConnected(false);
            return;
        }

        let isCancelled = false;
        let authBlocked = false;
        let client: Client | null = null;
        let reconnectFailures = 0;
        let cooldownTimer: number | undefined;

        const stopReconnect = () => {
            authBlocked = true;
            if (client) {
                client.reconnectDelay = 0;
                void client.deactivate();
            }
        };

        const isAuthError = (value?: string) => {
            if (!value) return false;
            const normalized = value.toLowerCase();
            return (
                normalized.includes("unauthorized") ||
                normalized.includes("forbidden") ||
                normalized.includes("invalid token") ||
                normalized.includes("expired")
            );
        };

        const pauseReconnect = () => {
            if (cooldownTimer !== undefined) return;

            if (client) {
                client.reconnectDelay = 0;
                void client.deactivate();
            }

            cooldownTimer = window.setTimeout(() => {
                cooldownTimer = undefined;
                reconnectFailures = 0;

                if (!isCancelled && !authBlocked && !isJwtExpired(localStorage.getItem("access_token"))) {
                    void connect();
                }
            }, WS_RECONNECT_COOLDOWN_MS);
        };

        const connect = async () => {
            const { Client, ReconnectionTimeMode, TickerStrategy } = await import("@stomp/stompjs");
            if (isCancelled) return;

            if (isJwtExpired(localStorage.getItem("access_token"))) {
                stopReconnect();
                return;
            }

            const baseUrl = import.meta.env.VITE_BACKEND_URL?.trim() || window.location.origin;
            const endpoint = baseUrl.endsWith('/api/v1')
                ? `${baseUrl}/ws-endpoint`
                : `${baseUrl}/api/v1/ws-endpoint`;
            const brokerURL = endpoint.replace(/^http/, "ws");

            client = new Client({
                brokerURL,
                beforeConnect: () => {
                    const latestToken = localStorage.getItem("access_token");
                    if (!latestToken || isJwtExpired(latestToken)) {
                        stopReconnect();
                        throw new Error("Missing access token for WebSocket connection");
                    }
                    client!.connectHeaders = {
                        Authorization: `Bearer ${latestToken}`
                    };
                },
                reconnectDelay: WS_RECONNECT_BASE_DELAY_MS + Math.floor(Math.random() * 1500),
                maxReconnectDelay: WS_RECONNECT_MAX_DELAY_MS,
                reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
                connectionTimeout: WS_CONNECTION_TIMEOUT_MS,
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                heartbeatStrategy: TickerStrategy.Worker,
                heartbeatToleranceMultiplier: 3,
                discardWebsocketOnCommFailure: true,
                debug: () => undefined,
                onConnect: () => {
                    reconnectFailures = 0;
                    setConnected(true);
                    client?.subscribe('/user/queue/notifications', (message) => {
                        if (message.body) {
                            try {
                                onMessageReceivedRef.current(JSON.parse(message.body) as IWebSocketMessage);
                            } catch (e) {
                                console.error("Failed to parse STOMP message", e);
                            }
                        }
                    });
                    client?.subscribe('/topic/documents', (message) => {
                        if (message.body) {
                            try {
                                onMessageReceivedRef.current(JSON.parse(message.body) as IWebSocketMessage);
                            } catch (e) {
                                console.error("Failed to parse document STOMP message", e);
                            }
                        }
                    });
                },
                onStompError: (frame) => {
                    setConnected(false);
                    const message = frame.headers['message'];
                    if (isAuthError(message) || isAuthError(frame.body)) {
                        stopReconnect();
                    }
                    console.error('Broker reported error: ' + message);
                    console.error('Additional details: ' + frame.body);
                },
                onWebSocketClose: () => {
                    setConnected(false);
                    if (isJwtExpired(localStorage.getItem("access_token"))) {
                        stopReconnect();
                        return;
                    }

                    reconnectFailures += 1;
                    if (reconnectFailures >= WS_MAX_RECONNECT_ATTEMPTS) {
                        pauseReconnect();
                    }
                }
            });

            client.activate();
            clientRef.current = client;
        };

        const runWhenIdle = () => void connect();
        const idleCallback = window.requestIdleCallback?.(runWhenIdle, { timeout: 1200 });
        const timeoutId = idleCallback === undefined
            ? window.setTimeout(runWhenIdle, 500)
            : undefined;

        return () => {
            isCancelled = true;
            if (idleCallback !== undefined) {
                window.cancelIdleCallback?.(idleCallback);
            }
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
            if (cooldownTimer !== undefined) {
                window.clearTimeout(cooldownTimer);
            }
            client?.deactivate();
            clientRef.current = null;
        };
    }, [userId, tokenVersion]);

    return { connected };
};

const isJwtExpired = (token: string | null) => {
    if (!token) return true;

    try {
        const payload = token.split(".")[1];
        if (!payload) return true;

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = normalizedPayload.padEnd(
            Math.ceil(normalizedPayload.length / 4) * 4,
            "="
        );
        const payloadBytes = Uint8Array.from(
            window.atob(paddedPayload),
            (character) => character.charCodeAt(0)
        );
        const decodedPayload = JSON.parse(new TextDecoder().decode(payloadBytes));

        if (!decodedPayload.exp) return false;

        return decodedPayload.exp * 1000 <= Date.now() + 30_000;
    } catch {
        return true;
    }
};
