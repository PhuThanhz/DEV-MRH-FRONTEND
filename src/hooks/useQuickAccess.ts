import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { findQuickAccessByPath, QUICK_ACCESS_ITEMS, type QuickAccessItem } from "@/config/quickAccess";

const RECENT_KEY = "lotus_quick_recent";
const FAVORITES_KEY = "lotus_quick_favorites";
const CHANGE_EVENT = "lotusQuickAccessChange";

const readJson = <T,>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const writeJson = (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(CHANGE_EVENT));
};

const normalize = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

export const getRecentQuickItems = (): QuickAccessItem[] => {
    const ids = readJson<string[]>(RECENT_KEY, []);
    return ids
        .map((id) => QUICK_ACCESS_ITEMS.find((item) => item.id === id))
        .filter(Boolean) as QuickAccessItem[];
};

export const getFavoriteQuickItems = (): QuickAccessItem[] => {
    const ids = readJson<string[]>(FAVORITES_KEY, []);
    return ids
        .map((id) => QUICK_ACCESS_ITEMS.find((item) => item.id === id))
        .filter(Boolean) as QuickAccessItem[];
};

export const useTrackRecentQuickAccess = () => {
    const location = useLocation();

    useEffect(() => {
        const item = findQuickAccessByPath(location.pathname);
        if (!item) return;

        const current = readJson<string[]>(RECENT_KEY, []);
        const next = [item.id, ...current.filter((id) => id !== item.id)].slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(CHANGE_EVENT));
    }, [location.pathname]);
};

export const useQuickAccess = () => {
    const [version, setVersion] = useState(0);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const refresh = () => setVersion((value) => value + 1);
        window.addEventListener(CHANGE_EVENT, refresh);
        window.addEventListener("storage", refresh);
        return () => {
            window.removeEventListener(CHANGE_EVENT, refresh);
            window.removeEventListener("storage", refresh);
        };
    }, []);

    const favoriteIds = useMemo(() => readJson<string[]>(FAVORITES_KEY, []), [version]);
    const recentItems = useMemo(() => getRecentQuickItems(), [version]);
    const favoriteItems = useMemo(() => getFavoriteQuickItems(), [version]);

    const isFavorite = useCallback(
        (id: string) => favoriteIds.includes(id),
        [favoriteIds]
    );

    const toggleFavorite = useCallback((item: QuickAccessItem) => {
        const current = readJson<string[]>(FAVORITES_KEY, []);
        const next = current.includes(item.id)
            ? current.filter((id) => id !== item.id)
            : [item.id, ...current].slice(0, 12);
        writeJson(FAVORITES_KEY, next);
    }, []);

    const searchResults = useMemo(() => {
        const term = normalize(query.trim());
        if (!term) return QUICK_ACCESS_ITEMS;
        return QUICK_ACCESS_ITEMS.filter((item) => {
            const haystack = normalize([
                item.title,
                item.subtitle,
                item.module,
                item.path,
                ...item.keywords,
            ].join(" "));
            return haystack.includes(term);
        });
    }, [query]);

    return {
        allItems: QUICK_ACCESS_ITEMS,
        query,
        setQuery,
        searchResults,
        recentItems,
        favoriteItems,
        isFavorite,
        toggleFavorite,
    };
};
