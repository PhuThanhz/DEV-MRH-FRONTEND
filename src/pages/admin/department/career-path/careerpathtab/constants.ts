// ── Design System ─────────────────────────────────────────────────
export const T = {
    ink: "#0a0a0b",
    ink2: "#2c2c2e",
    ink3: "#636366",
    ink4: "#6e6e73",       // đậm hơn (was #8e8e93)
    ink5: "#8e8e93",       // đậm hơn (was #b0b0b8)
    white: "#ffffff",
    s1: "#f0f0f2",         // đậm hơn (was #f5f5f7)
    s2: "#e5e5e8",         // đậm hơn (was #ebebed)
    line: "rgba(0,0,0,0.12)",      // đậm hơn (was 0.09)
    lineMed: "rgba(0,0,0,0.18)",   // đậm hơn (was 0.14)
    lineStr: "rgba(0,0,0,0.26)",   // đậm hơn (was 0.20)
    acc: "#0066ff",
    accSoft: "rgba(0,102,255,0.07)",
    accBord: "rgba(0,102,255,0.18)",
    accText: "#0044cc",
};

export const STEP_HUE: {
    dot: string;
    chip: string;
    chipBg: string;
    chipBorder: string;
    stripe: string;
}[] = [
        { dot: "#0066ff", chip: "#0044cc", chipBg: "rgba(0,102,255,0.10)", chipBorder: "rgba(0,102,255,0.25)", stripe: "#0066ff" },
        { dot: "#5856d6", chip: "#3a38b0", chipBg: "rgba(88,86,214,0.10)", chipBorder: "rgba(88,86,214,0.25)", stripe: "#5856d6" },
        { dot: "#007aff", chip: "#0055cc", chipBg: "rgba(0,122,255,0.10)", chipBorder: "rgba(0,122,255,0.25)", stripe: "#007aff" },
        { dot: "#34aadc", chip: "#1a7fa8", chipBg: "rgba(52,170,220,0.10)", chipBorder: "rgba(52,170,220,0.25)", stripe: "#34aadc" },
        { dot: "#30b94e", chip: "#1a7a32", chipBg: "rgba(52,199,89,0.10)", chipBorder: "rgba(52,199,89,0.25)", stripe: "#30b94e" },
        { dot: "#ff9500", chip: "#7a4400", chipBg: "rgba(255,149,0,0.10)", chipBorder: "rgba(255,149,0,0.25)", stripe: "#ff9500" },
        { dot: "#ff6b00", chip: "#8a3000", chipBg: "rgba(255,107,0,0.10)", chipBorder: "rgba(255,107,0,0.25)", stripe: "#ff6b00" },
        { dot: "#ff3b30", chip: "#a01a12", chipBg: "rgba(255,59,48,0.10)", chipBorder: "rgba(255,59,48,0.25)", stripe: "#ff3b30" },
        { dot: "#af52de", chip: "#6a1a9a", chipBg: "rgba(175,82,222,0.10)", chipBorder: "rgba(175,82,222,0.25)", stripe: "#af52de" },
    ];

export const PREFIX_RANK: Record<string, number> = {
    M: 1,
    S: 2,
};

export const getHue = (i: number) => STEP_HUE[i % STEP_HUE.length];

// ── Utils ─────────────────────────────────────────────────────────
export const parseBandNumber = (band: string): number => {
    const match = band?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
};

export const parseLevelNumber = (code?: string | null): number => {
    if (!code) return 999;
    const match = code.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
};

export const getPrefixRank = (code?: string | null): number => {
    if (!code) return 999;
    const prefix = code.replace(/\d+/g, "").toUpperCase();
    return PREFIX_RANK[prefix] ?? 500;
};

export const compareLevelCode = (a?: string | null, b?: string | null): number => {
    const rankA = getPrefixRank(a);
    const rankB = getPrefixRank(b);
    if (rankA !== rankB) return rankA - rankB;
    return parseLevelNumber(a) - parseLevelNumber(b);
};