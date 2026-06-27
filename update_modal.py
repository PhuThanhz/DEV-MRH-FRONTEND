import re

with open("src/components/common/navigation/LotusCharmAssistant.tsx", "r") as f:
    content = f.read()

# Find the start of the body div
start_marker = '<div style={{ padding: "18px 18px 0" }}>'
end_marker = '</Modal>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    new_body = """                <div style={{ display: "flex", height: "min(70vh, 600px)" }}>
                    {/* SIDEBAR TRÁI */}
                    <div style={{ width: 250, background: "#f8fafc", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: "24px 20px 16px" }}>
                            <div style={{ color: ACCENT, fontSize: 11, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                                Lotus Hướng Dẫn
                            </div>
                            <div style={{ color: "#0f172a", fontSize: 18, fontWeight: 900 }}>
                                Trung tâm hỗ trợ
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 16px" }}>
                            <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>
                                Danh mục
                            </div>
                            {Object.entries(
                                LOTUS_GUIDES
                                    .filter(guide => hasPermission(guide.requiredPermission))
                                    .reduce((acc, guide) => {
                                        if (!acc[guide.module]) acc[guide.module] = [];
                                        acc[guide.module].push(guide);
                                        return acc;
                                    }, {} as Record<string, typeof LOTUS_GUIDES>)
                            ).map(([moduleName, guides]) => {
                                const isActive = activeGuideModule === moduleName && !guideSearchQuery;
                                return (
                                    <div
                                        key={moduleName}
                                        onClick={() => {
                                            setActiveGuideModule(moduleName);
                                            setGuideSearchQuery("");
                                        }}
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: 10,
                                            background: isActive ? "#fff" : "transparent",
                                            color: isActive ? ACCENT : "#475569",
                                            fontWeight: isActive ? 800 : 600,
                                            fontSize: 14,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            marginBottom: 4
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <span>{moduleName}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* NỘI DUNG PHẢI */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", minWidth: 0 }}>
                        <div style={{ padding: "24px 24px 16px", borderBottom: guideSearchQuery ? "1px solid #f1f5f9" : "none" }}>
                            <Input 
                                prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 16 }} />}
                                placeholder="Tìm kiếm tính năng, phòng ban, công ty..."
                                size="large"
                                variant="filled"
                                value={guideSearchQuery}
                                onChange={(e) => setGuideSearchQuery(e.target.value)}
                                style={{ borderRadius: 12, background: "#f1f5f9", border: "none" }}
                            />
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
                            {guideSearchQuery.trim() !== "" ? (
                                <div>
                                    <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>
                                        Kết quả tìm kiếm
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                                        {LOTUS_GUIDES.filter(guide => hasPermission(guide.requiredPermission))
                                            .filter(guide => guide.title.toLowerCase().includes(guideSearchQuery.toLowerCase()) || guide.module.toLowerCase().includes(guideSearchQuery.toLowerCase()))
                                            .map((guide) => (
                                                <div
                                                    key={guide.id}
                                                    onClick={() => {
                                                        setIsGuideOpen(false);
                                                        setGuideSearchQuery("");
                                                        startGuide(guide.id);
                                                    }}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "flex-start",
                                                        gap: 14,
                                                        padding: 16,
                                                        borderRadius: 16,
                                                        background: "#fff",
                                                        border: "1px solid #e2e8f0",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = ACCENT;
                                                        e.currentTarget.style.boxShadow = "0 10px 20px rgba(232,99,122,0.1)";
                                                        e.currentTarget.style.transform = "translateY(-2px)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = "#e2e8f0";
                                                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                                                        e.currentTarget.style.transform = "none";
                                                    }}
                                                >
                                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1px solid #f1f5f9" }}>
                                                        {guide.icon}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 800, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guide.title}</div>
                                                        <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, marginTop: 4 }}>{guide.steps.length} bước · {guide.module}</div>
                                                    </div>
                                                </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {currentGuides.length > 0 && activeGuideModule === (LOTUS_GUIDES.find(g => location.pathname.startsWith(g.routePrefix))?.module || LOTUS_GUIDES[0]?.module) && (
                                        <div style={{ marginBottom: 24 }}>
                                            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                                                Gợi ý cho bạn
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                                {currentGuides.map((guide) => (
                                                    <div
                                                        key={guide.id}
                                                        onClick={() => {
                                                            setIsGuideOpen(false);
                                                            startGuide(guide.id);
                                                        }}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 8,
                                                            padding: "8px 16px",
                                                            borderRadius: 99,
                                                            background: "#f8fafc",
                                                            border: "1px solid #e2e8f0",
                                                            cursor: "pointer",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = "#fff";
                                                            e.currentTarget.style.borderColor = ACCENT;
                                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(232,99,122,0.1)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = "#f8fafc";
                                                            e.currentTarget.style.borderColor = "#e2e8f0";
                                                            e.currentTarget.style.boxShadow = "none";
                                                        }}
                                                    >
                                                        <div style={{ color: "#64748b", display: "flex", alignItems: "center", fontSize: 15 }}>
                                                            {guide.icon}
                                                        </div>
                                                        <div style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>
                                                            {guide.title}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeGuideModule && (() => {
                                        const guidesInModule = LOTUS_GUIDES.filter(g => g.module === activeGuideModule && hasPermission(g.requiredPermission));
                                        
                                        const subGroups = guidesInModule.reduce((subAcc, g) => {
                                            const sub = g.subModule || 'Chức năng chung';
                                            if (!subAcc[sub]) subAcc[sub] = [];
                                            subAcc[sub].push(g);
                                            return subAcc;
                                        }, {} as Record<string, typeof LOTUS_GUIDES>);
                                        
                                        const subGroupEntries = Object.entries(subGroups);
                                        const hideSubHeader = subGroupEntries.length === 1;

                                        return (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                                                {subGroupEntries.map(([subModuleName, subGuides]) => (
                                                    <div key={subModuleName}>
                                                        {!hideSubHeader && (
                                                            <div style={{ 
                                                                color: "#64748b", 
                                                                fontSize: 12, 
                                                                fontWeight: 800, 
                                                                letterSpacing: 0.5,
                                                                marginBottom: 16,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 10,
                                                                textTransform: "uppercase"
                                                            }}>
                                                                {subModuleName}
                                                                <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                                                            </div>
                                                        )}
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                                                            {subGuides.map((guide) => (
                                                                <div
                                                                    key={guide.id}
                                                                    onClick={() => {
                                                                        setIsGuideOpen(false);
                                                                        startGuide(guide.id);
                                                                    }}
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "flex-start",
                                                                        gap: 14,
                                                                        padding: 16,
                                                                        borderRadius: 16,
                                                                        background: "#fff",
                                                                        border: "1px solid #e2e8f0",
                                                                        cursor: "pointer",
                                                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.borderColor = ACCENT;
                                                                        e.currentTarget.style.boxShadow = "0 10px 20px rgba(232,99,122,0.1)";
                                                                        e.currentTarget.style.transform = "translateY(-2px)";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.borderColor = "#e2e8f0";
                                                                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                                                                        e.currentTarget.style.transform = "none";
                                                                    }}
                                                                >
                                                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f8fafc", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1px solid #f1f5f9" }}>
                                                                        {guide.icon}
                                                                    </div>
                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                        <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 800, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guide.title}</div>
                                                                        <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, marginTop: 4 }}>{guide.steps.length} bước</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </>
                            )}
                        </div>
                    </div>
                </div>
"""
    updated_content = content[:start_idx] + new_body + content[end_idx:]
    with open("src/components/common/navigation/LotusCharmAssistant.tsx", "w") as f:
        f.write(updated_content)
    print("Updated successfully")
else:
    print("Markers not found")
