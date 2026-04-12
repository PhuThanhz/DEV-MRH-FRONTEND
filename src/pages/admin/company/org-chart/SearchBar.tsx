import { useEffect, useRef, useState } from "react";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import type { Node } from "reactflow";

interface Props {
    nodes: Node[];
    onSelect: (nodeId: string) => void;
    onSelectWithPos?: (nodeId: string, pos: { x: number; y: number } | null) => void;
    onClear: () => void;
    isMobile?: boolean;
    isTablet?: boolean;
}

interface Result {
    id: string;
    title: string;
    holderName?: string;
    levelCode?: string;
}

const SearchBar = ({ nodes, onSelect, onSelectWithPos, onClear, isMobile = false, isTablet = false }: Props) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Result[]>([]);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    const barW = isMobile ? 180 : isTablet ? 220 : 260;
    const barH = isMobile ? 30 : 34;
    const fontSize = isMobile ? 11 : 12;

    useEffect(() => {
        const q = query.trim().toLowerCase();
        if (!q) { setResults([]); setOpen(false); return; }

        const matched = nodes
            .filter((n) => {
                const title = (n.data.title as string ?? "").toLowerCase();
                const holder = (n.data.holderName as string ?? "").toLowerCase();
                const level = (n.data.levelCode as string ?? "").toLowerCase();
                return title.includes(q) || holder.includes(q) || level.includes(q);
            })
            .slice(0, 8)
            .map((n) => ({
                id: n.id,
                title: n.data.title as string,
                holderName: n.data.holderName as string | undefined,
                levelCode: n.data.levelCode as string | undefined,
            }));

        setResults(matched);
        setOpen(matched.length > 0);
        setActiveIdx(-1);
    }, [query, nodes]);

    // ── Tính anchorPos từ DOM node của ReactFlow ──────────────────────────────
    const getNodePos = (nodeId: string): { x: number; y: number } | null => {
        const el = document.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
        const container = el?.closest(".react-flow");
        if (!el || !container) return null;
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return {
            x: elRect.right - containerRect.left + 8,
            y: elRect.top - containerRect.top,
        };
    };

    const handleSelect = (id: string) => {
        setQuery("");
        setOpen(false);

        if (onSelectWithPos) {
            const posImmediate = getNodePos(id);
            onSelectWithPos(id, posImmediate);
            setTimeout(() => {
                const posAfter = getNodePos(id);
                onSelectWithPos(id, posAfter);
            }, 600);
        } else {
            onSelect(id);
        }
    };
    const handleClear = () => {
        setQuery("");
        setOpen(false);
        onClear();
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
        if (e.key === "Enter" && activeIdx >= 0) handleSelect(results[activeIdx].id);
        if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    };

    const highlight = (text: string, q: string) => {
        if (!q) return <>{text}</>;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return <>{text}</>;
        return (
            <>
                {text.slice(0, idx)}
                <mark style={{
                    background: "#fde68a", color: "#92400e",
                    borderRadius: 2, padding: "0 1px",
                }}>
                    {text.slice(idx, idx + q.length)}
                </mark>
                {text.slice(idx + q.length)}
            </>
        );
    };

    const q = query.trim().toLowerCase();

    return (
        <div
            ref={wrapRef}
            style={{
                position: "absolute",
                top: isMobile ? 8 : 12,
                left: isMobile ? 8 : 12,
                zIndex: 20,
                width: barW,
            }}
        >
            {/* ── Input ── */}
            <div style={{
                display: "flex", alignItems: "center", gap: isMobile ? 5 : 7,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: isMobile ? 8 : 10,
                padding: isMobile ? "0 8px" : "0 10px",
                height: barH,
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                transition: "border-color 0.15s, box-shadow 0.15s",
            }}>
                <SearchOutlined style={{ fontSize: isMobile ? 11 : 13, color: "#9ca3af", flexShrink: 0 }} />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (results.length > 0) setOpen(true); }}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder={isMobile ? "Tìm vị trí..." : "Tìm vị trí, tên người..."}
                    style={{
                        flex: 1, border: "none", outline: "none",
                        fontSize: fontSize,
                        color: "#374151",
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                        background: "transparent",
                        minWidth: 0,
                    }}
                />
                {query && (
                    <button
                        onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
                        style={{
                            background: "#f1f5f9",
                            border: "none",
                            cursor: "pointer",
                            color: "#94a3b8",
                            padding: 0,
                            width: 16, height: 16,
                            borderRadius: 4,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                    >
                        <CloseOutlined style={{ fontSize: 8 }} />
                    </button>
                )}
            </div>

            {/* ── Dropdown kết quả ── */}
            {open && results.length > 0 && (
                <div
                    ref={listRef}
                    style={{
                        position: "absolute",
                        top: barH + 5,
                        left: 0, right: 0,
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: isMobile ? 8 : 10,
                        boxShadow: "0 8px 24px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)",
                        overflow: "hidden",
                        maxHeight: isMobile ? 200 : 260,
                        overflowY: "auto",
                    }}
                >
                    {/* Header count */}
                    <div style={{
                        padding: isMobile ? "5px 10px 4px" : "6px 12px 5px",
                        borderBottom: "1px solid #f1f5f9",
                        background: "#fafafa",
                        fontSize: isMobile ? 9 : 10,
                        color: "#94a3b8",
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                        fontWeight: 500,
                    }}>
                        {results.length} kết quả
                    </div>

                    {results.map((r, i) => (
                        <div
                            key={r.id}
                            onMouseDown={() => handleSelect(r.id)}
                            style={{
                                padding: isMobile ? "7px 10px" : "8px 12px",
                                cursor: "pointer",
                                background: i === activeIdx ? "#fff5f6" : "#fff",
                                borderBottom: i < results.length - 1 ? "1px solid #f8fafc" : "none",
                                transition: "background 0.1s",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                            onMouseEnter={() => setActiveIdx(i)}
                        >
                            {/* Icon tròn nhỏ */}
                            <div style={{
                                width: isMobile ? 28 : 32,
                                height: isMobile ? 28 : 32,
                                borderRadius: isMobile ? 7 : 8,
                                flexShrink: 0,
                                background: i === activeIdx
                                    ? "linear-gradient(135deg,#f43f5e,#fb923c)"
                                    : "#f1f5f9",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.15s",
                            }}>
                                <span style={{
                                    fontSize: isMobile ? 9 : 10,
                                    fontWeight: 700,
                                    fontFamily: "'Be Vietnam Pro',sans-serif",
                                    color: i === activeIdx ? "#fff" : "#94a3b8",
                                    textTransform: "uppercase",
                                }}>
                                    {r.title.charAt(0)}
                                </span>
                            </div>

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: isMobile ? 11.5 : 12.5,
                                    fontWeight: 700,
                                    fontFamily: "'Be Vietnam Pro',sans-serif",
                                    color: "#0f172a",
                                    lineHeight: 1.3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}>
                                    {highlight(r.title, q)}
                                </div>

                                <div style={{
                                    display: "flex", alignItems: "center",
                                    gap: 5, marginTop: 2, flexWrap: "wrap",
                                }}>
                                    {r.holderName && (
                                        <span style={{
                                            fontSize: isMobile ? 9.5 : 10.5,
                                            color: "#64748b",
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                            fontWeight: 500,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            maxWidth: isMobile ? 90 : 120,
                                        }}>
                                            {highlight(r.holderName, q)}
                                        </span>
                                    )}
                                    {r.levelCode && (
                                        <span style={{
                                            fontSize: isMobile ? 8 : 8.5,
                                            fontWeight: 700,
                                            fontFamily: "'JetBrains Mono',monospace",
                                            color: "#e8637a",
                                            background: "#fff0f3",
                                            border: "1px solid #fecdd3",
                                            borderRadius: 4,
                                            padding: "1px 5px",
                                            textTransform: "uppercase",
                                            flexShrink: 0,
                                        }}>
                                            {r.levelCode}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Arrow hint */}
                            <div style={{
                                fontSize: 10, color: "#cbd5e1",
                                flexShrink: 0,
                                opacity: i === activeIdx ? 1 : 0,
                                transition: "opacity 0.1s",
                            }}>
                                ↗
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Không tìm thấy ── */}
            {open && results.length === 0 && query.trim() && (
                <div style={{
                    position: "absolute",
                    top: barH + 5,
                    left: 0, right: 0,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: isMobile ? 8 : 10,
                    padding: isMobile ? "10px" : "12px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                    textAlign: "center",
                }}>
                    <div style={{ fontSize: isMobile ? 18 : 20, marginBottom: 4 }}>🔍</div>
                    <div style={{
                        fontSize: isMobile ? 11 : 12,
                        color: "#94a3b8",
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                    }}>
                        Không tìm thấy kết quả
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;