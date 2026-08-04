import { useQuery } from "@tanstack/react-query";
import { callFetchJdTasksByUser } from "@/config/api";

export const JD_TASKS_BY_USER_KEY = "jd-tasks-by-user";

export const useJdTasksByUserQuery = (userId: string | null | undefined) => {
    return useQuery({
        queryKey: [JD_TASKS_BY_USER_KEY, userId],
        queryFn: async () => {
            if (!userId) return [];
            const res = await callFetchJdTasksByUser(userId);
            if (res && res.data) {
                return res.data;
            }
            return [];
        },
        enabled: !!userId,
    });
};
