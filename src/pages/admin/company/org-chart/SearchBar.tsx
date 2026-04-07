import { useEffect, useRef, useState } from "react";
import { SearchOutlined, CloseOutlined } from "@ant-design/icons";
import type { Node } from "reactflow";

interface Props {
    nodes: Node[];
    onSelect: (nodeId: string) => void;   // zoom + highlight node được chọn
    onClear: () => void;                  // xóa selection
}

interface Result {
    id: string;
    title: string;
    holderName?: string;
    levelCode?: string;
}

const SearchBar = ({ nodes, onSelect, onClear }: Props) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Result[]>([]);
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // filter nodes theo query
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

    const handleSelect = (id: string) => {
        onSelect(id);
        setQuery("");
        setOpen(false);
    };

    const handleClear = () => {
        setQuery("");
        setOpen(false);
        onClear();
        inputRef.current?.focus();
    };

    // keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
        if (e.key === "Enter" && activeIdx >= 0) handleSelect(results[activeIdx].id);
        if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    };

    // highlight matched text
    const highlight = (text: string, q: string) => {
        if (!q) return <>{text}</>;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return <>{text}</>;
        return (
            <>
                {text.slice(0, idx)}
                <mark style={{ background: "#fde68a", color: "#92400e", borderRadius: 2, padding: "0 1px" }}>
                    {text.slice(idx, idx + q.length)}
                </mark>
                {text.slice(idx + q.length)}
            </>
        );
    };

    const q = query.trim().toLowerCase();

    return (
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 20, width: 260 }}>
            {/* Input */}
            <div style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "#ffffff",
                border: "1px solid #e8ecf0",
                borderRadius: 10,
                padding: "0 10px",
                height: 34,
                boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                transition: "border-color 0.15s, box-shadow 0.15s",
            }}>
                <SearchOutlined style={{ fontSize: 13, color: "#9ca3af", flexShrink: 0 }} />
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (results.length > 0) setOpen(true); }}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder="Tìm vị trí, tên người..."
                    style={{
                        flex: 1, border: "none", outline: "none",
                        fontSize: 12, color: "#374151",
                        fontFamily: "'Be Vietnam Pro',sans-serif",
                        background: "transparent",
                    }}
                />
                {query && (
                    <button
                        onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#9ca3af", padding: 0, display: "flex",
                            alignItems: "center", flexShrink: 0,
                        }}
                    >
                        <CloseOutlined style={{ fontSize: 10 }} />
                    </button>
                )}
            </div>

            {/* Dropdown kết quả */}
            {open && results.length > 0 && (
                <div
                    ref={listRef}
                    style={{
                        position: "absolute", top: 38, left: 0, right: 0,
                        background: "#ffffff",
                        border: "1px solid #e8ecf0",
                        borderRadius: 10,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        overflow: "hidden",
                    }}
                >
                    {results.map((r, i) => (
                        <div
                            key={r.id}
                            onMouseDown={() => handleSelect(r.id)}
                            style={{
                                padding: "8px 12px",
                                cursor: "pointer",
                                background: i === activeIdx ? "#fff5f6" : "transparent",
                                borderBottom: i < results.length - 1 ? "1px solid #f3f4f6" : "none",
                                transition: "background 0.1s",
                            }}
                            onMouseEnter={() => setActiveIdx(i)}
                        >
                            {/* Tên vị trí */}
                            <div style={{
                                fontSize: 12, fontWeight: 600,
                                fontFamily: "'Be Vietnam Pro',sans-serif",
                                color: "#111827",
                                lineHeight: 1.4,
                            }}>
                                {highlight(r.title, q)}
                            </div>

                            {/* Holder + level */}
                            {(r.holderName || r.levelCode) && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 6, marginTop: 2,
                                }}>
                                    {r.holderName && (
                                        <span style={{
                                            fontSize: 10.5, color: "#6b7280",
                                            fontFamily: "'Be Vietnam Pro',sans-serif",
                                        }}>
                                            {highlight(r.holderName, q)}
                                        </span>
                                    )}
                                    {r.levelCode && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 600,
                                            fontFamily: "'JetBrains Mono',monospace",
                                            color: "#e8637a",
                                            background: "#fff0f3",
                                            border: "1px solid #ffd6e0",
                                            borderRadius: 4, padding: "1px 5px",
                                            textTransform: "uppercase",
                                        }}>
                                            {r.levelCode}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Không tìm thấy */}
            {open && results.length === 0 && query.trim() && (
                <div style={{
                    position: "absolute", top: 38, left: 0, right: 0,
                    background: "#ffffff",
                    border: "1px solid #e8ecf0",
                    borderRadius: 10,
                    padding: "10px 12px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    fontSize: 12, color: "#9ca3af",
                    fontFamily: "'Be Vietnam Pro',sans-serif",
                    textAlign: "center",
                }}>
                    Không tìm thấy kết quả
                </div>
            )}
        </div>
    );
};

export default SearchBar;