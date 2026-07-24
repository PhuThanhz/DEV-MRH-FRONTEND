import { useCallback, useState } from "react";
import { buildPublicFileUrl } from "@/config/file-utils";

const FAILED_AVATARS_STORAGE_KEY = "hrm.failed-avatars";

const loadFailedAvatars = () => {
    if (typeof window === "undefined") return new Set<string>();

    try {
        const storedAvatars = JSON.parse(window.sessionStorage.getItem(FAILED_AVATARS_STORAGE_KEY) || "[]");
        return new Set<string>(
            Array.isArray(storedAvatars)
                ? storedAvatars.filter((value): value is string => typeof value === "string")
                : []
        );
    } catch {
        return new Set<string>();
    }
};

const failedAvatars = loadFailedAvatars();

const rememberFailedAvatar = (avatar: string) => {
    failedAvatars.add(avatar);

    try {
        window.sessionStorage.setItem(
            FAILED_AVATARS_STORAGE_KEY,
            JSON.stringify(Array.from(failedAvatars).slice(-50))
        );
    } catch {
        // Vẫn giữ cache trong bộ nhớ nếu trình duyệt chặn sessionStorage.
    }
};

export const useAvatarSrc = (avatar?: string) => {
    const [failedAvatar, setFailedAvatar] = useState<string>();
    const hasFailed = Boolean(avatar && (failedAvatar === avatar || failedAvatars.has(avatar)));
    const src = avatar && !hasFailed
        ? buildPublicFileUrl(avatar, "avatar")
        : undefined;

    const onError = useCallback(() => {
        if (avatar) {
            rememberFailedAvatar(avatar);
            setFailedAvatar(avatar);
        }
        return true;
    }, [avatar]);

    return { src, onError };
};
