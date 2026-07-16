import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Avoid multiplying traffic while the proxy/backend is already unavailable.
            retry: 0,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            staleTime: 30 * 1000,
        },
        mutations: {
            retry: 0,
        },
    },
});
