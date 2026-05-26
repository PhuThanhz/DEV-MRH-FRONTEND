import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAppSelector } from "@/redux/hooks";

interface IWebSocketMessage {
    id: number;
    module: string;
    type: string;
    content: string;
    actionLink: string;
    read: boolean;
    createdAt: string;
}

export const useWebSocket = (onMessageReceived: (msg: IWebSocketMessage) => void) => {
    const user = useAppSelector((state) => state.account.user);
    const clientRef = useRef<Client | null>(null);
    const [connected, setConnected] = useState(false);

    // Keep the latest callback reference to prevent stale closures in the STOMP subscription
    const onMessageReceivedRef = useRef(onMessageReceived);
    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        if (!user || !user.id) return;

        const token = localStorage.getItem("access_token");
        if (!token) return;

        const client = new Client({
            // Fallback to SockJS if native WS fails
            webSocketFactory: () => {
                const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
                const wsPath = baseUrl.endsWith('/api/v1') ? '/ws-endpoint' : '/api/v1/ws-endpoint';
                return new SockJS(`${baseUrl}${wsPath}`);
            },
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (msg) => {
                // console.log("[STOMP]", msg);
            },
            onConnect: () => {
                setConnected(true);
                // Subscribe to user queue (Spring UserDestinationPrefix is /user)
                client.subscribe('/user/queue/notifications', (message) => {
                    if (message.body) {
                        try {
                            const payload = JSON.parse(message.body) as IWebSocketMessage;
                            onMessageReceivedRef.current(payload);
                        } catch (e) {
                            console.error("Failed to parse STOMP message", e);
                        }
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
            onWebSocketClose: () => {
                setConnected(false);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            clientRef.current = null;
        };
    }, [user]);

    return { connected };
};
