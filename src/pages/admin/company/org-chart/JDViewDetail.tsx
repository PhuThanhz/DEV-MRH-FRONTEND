// src/modules/settings/job-description/components/JDViewDetail.tsx

import React, { useState, useMemo } from 'react';
import { Table } from 'antd';
import ReactFlow, {
    Background,
    Controls,
    type Node,
    type Edge,
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import jdTemplate from '../org-chart/jd-sample.json';

interface JobPosition {
    nameVN: string;
    departmentName?: string;
    companyName?: string;
    directManager?: string | null;
    levelCode?: string;
}

interface JDViewDetailProps {
    position: JobPosition;
}

const ACCENT = '#e8637a';
const ACCENT_LIGHT = '#fff0f3';
const ACCENT_BORDER = '#ffd6dd';

const toLines = (value: string | string[]): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value
        .split(/\n|•/)
        .map((x) => x.trim().replace(/^-\s*/, ''))
        .filter(Boolean);
};

const TABS = [
    { key: '1', label: 'Thông tin chung' },
    { key: '2', label: 'Sơ đồ vị trí' },
    { key: '3', label: 'Mô tả công việc' },
    { key: '4', label: 'Yêu cầu công việc' },
];

type OrgNodeVariant = 'manager' | 'current';

interface OrgNodeData {
    label: string;
    sublabel?: string;
    variant: OrgNodeVariant;
}

const variantStyles: Record<OrgNodeVariant, {
    bg: string; border: string; dot: string;
    labelColor: string; sublabelColor: string;
    shadow: string; accentBar: string;
}> = {
    manager: {
        bg: '#f0f7ff',
        border: '#93c5fd',
        dot: '#3b82f6',
        labelColor: '#1e40af',
        sublabelColor: '#60a5fa',
        shadow: '0 2px 12px rgba(59,130,246,.18)',
        accentBar: 'linear-gradient(90deg, #3b82f6, #93c5fd)',
    },
    current: {
        bg: '#fff',
        border: '#e5e7eb',
        dot: ACCENT,
        labelColor: '#111827',
        sublabelColor: '#9ca3af',
        shadow: '0 2px 12px rgba(0,0,0,.08)',
        accentBar: `linear-gradient(90deg, ${ACCENT}, #f9a8b5)`,
    },
};

const OrgFlowNode = ({ data }: { data: OrgNodeData }) => {
    const s = variantStyles[data.variant];
    const isCurrent = data.variant === 'current';

    return (
        <>
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: s.dot, width: 7, height: 7, border: '2px solid #fff' }}
            />
            <div style={{
                width: 200,
                background: s.bg,
                border: `1.5px solid ${s.border}`,
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: s.shadow,
                transform: isCurrent ? 'scale(1.05)' : 'none',
            }}>
                <div style={{ height: 3, background: s.accentBar }} />
                <div style={{ padding: '12px 16px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                        <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: s.dot, flexShrink: 0,
                        }} />
                        <span style={{
                            fontSize: 13, fontWeight: isCurrent ? 800 : 600,
                            color: s.labelColor, lineHeight: 1.4,
                        }}>
                            {data.label}
                        </span>
                    </div>
                    {data.sublabel && (
                        <div style={{
                            fontSize: 11, color: s.sublabelColor,
                            fontWeight: 500, paddingLeft: 14,
                        }}>
                            {data.sublabel}
                        </div>
                    )}
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: s.dot, width: 7, height: 7, border: '2px solid #fff' }}
            />
        </>
    );
};

const OrgChartTab: React.FC<{ position: JobPosition }> = ({ position }) => {
    const nodeTypes = useMemo(() => ({ orgFlowNode: OrgFlowNode }), []);
    const hasManager = !!position.directManager;

    const nodes: Node[] = [
        ...(hasManager ? [{
            id: 'manager',
            type: 'orgFlowNode',
            position: { x: 100, y: 0 },
            data: {
                label: position.directManager!,
                sublabel: 'Cấp quản lý trực tiếp',
                variant: 'manager',
            } as OrgNodeData,
        }] : []),
        {
            id: 'current',
            type: 'orgFlowNode',
            position: { x: 100, y: hasManager ? 180 : 0 },
            data: {
                label: position.nameVN,
                sublabel: position.levelCode,
                variant: 'current',
            } as OrgNodeData,
        },
    ];

    const edges: Edge[] = hasManager ? [{
        id: 'e-manager-current',
        source: 'manager',
        target: 'current',
        type: 'smoothstep',
        style: { stroke: '#93c5fd', strokeWidth: 2, strokeDasharray: '6,3' },
    }] : [];

    const legend = [
        { color: '#3b82f6', label: 'Cấp quản lý trực tiếp' },
        { color: ACCENT, label: 'Vị trí hiện tại' },
    ];

    return (
        <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid #eef0f5', boxShadow: '0 2px 10px rgba(0,0,0,.045)',
            overflow: 'hidden',
        }}>
            <div style={{
                padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <span style={{
                    fontSize: 11, fontWeight: 700, color: '#9ca3af',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                    Sơ đồ vị trí công việc
                </span>
                <div style={{ display: 'flex', gap: 16 }}>
                    {legend.map((item) => (
                        <div key={item.label} style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 11, color: '#6b7280',
                        }}>
                            <span style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: item.color, display: 'inline-block',
                            }} />
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ height: 460, background: '#fff' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.35 }}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    zoomOnScroll={false}
                    panOnScroll={false}
                    panOnDrag={false}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#f3f4f6" gap={20} />
                    <Controls showInteractive={false} />
                </ReactFlow>
            </div>
        </div>
    );
};

const JDViewDetail: React.FC<JDViewDetailProps> = ({ position }) => {
    const [activeTab, setActiveTab] = useState('1');

    if (!position) return null;

    const meta = (jdTemplate as any).meta || {};
    const sec = (jdTemplate as any).sections || {};
    const req = sec.requirements || {};
    const responsibilities: string[] = sec.responsibilities || [];

    const descItems = [
        { label: 'Chức vụ', value: position.nameVN },
        { label: 'Mã cấp bậc', value: position.levelCode || '—' },
        { label: 'Cấp quản lý trực tiếp', value: position.directManager || '—' },
        { label: 'Ngày hiệu lực', value: meta.effectiveDate || '—' },
    ];

    const requirementRows = [
        { key: 1, title: 'Kiến thức', content: toLines(req.knowledge) },
        { key: 2, title: 'Kinh nghiệm', content: toLines(req.experience) },
        { key: 3, title: 'Kỹ năng', content: toLines(req.skills) },
        { key: 4, title: 'Phẩm chất', content: toLines(req.qualities) },
        { key: 5, title: 'Yêu cầu khác', content: toLines(req.other) },
    ];

    const reqColumns = [
        {
            title: 'STT',
            dataIndex: 'key',
            width: 60,
            align: 'center' as const,
            render: (v: number) => (
                <span style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: ACCENT,
                }}>
                    {v}
                </span>
            ),
        },
        {
            title: 'Nhóm yêu cầu',
            dataIndex: 'title',
            width: 180,
            render: (t: string) => (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{t}</span>
            ),
        },
        {
            title: 'Chi tiết',
            dataIndex: 'content',
            render: (arr: string[]) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {arr.map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                            fontSize: 13.5, color: '#374151', lineHeight: 1.65,
                        }}>
                            <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: ACCENT, flexShrink: 0, marginTop: 8,
                            }} />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div style={{
            fontFamily: "'Outfit', 'Nunito', 'Segoe UI', sans-serif",
            background: '#f5f6fa',
            minHeight: '100%',
            padding: '28px 32px 48px',
            maxWidth: 1100,
            margin: '0 auto',
        }}>
            {/* ── HEADER ── */}
            <div style={{
                background: '#fff', borderRadius: 16, padding: '24px 28px', marginBottom: 20,
                border: '1px solid #eef0f5', boxShadow: '0 2px 12px rgba(0,0,0,.05)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24,
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                        borderRadius: 20, padding: '3px 12px',
                        fontSize: 11, fontWeight: 700, color: ACCENT,
                        letterSpacing: '0.08em', textTransform: 'uppercase', width: 'fit-content',
                    }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT }} />
                        Mô tả công việc
                    </span>
                    <h2 style={{
                        fontSize: 24, fontWeight: 800, color: '#111827',
                        margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em',
                    }}>
                        {position.nameVN}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {position.directManager && (
                            <span style={{ fontSize: 13, color: '#6b7280' }}>
                                Báo cáo cho: <b style={{ color: '#374151' }}>{position.directManager}</b>
                            </span>
                        )}
                        {position.levelCode && (
                            <span style={{
                                fontSize: 11, fontWeight: 700, color: ACCENT,
                                background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                                borderRadius: 20, padding: '2px 12px',
                            }}>
                                {position.levelCode}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 600, color: '#9ca3af',
                        background: '#f9fafb', border: '1px solid #e5e7eb',
                        borderRadius: 8, padding: '4px 12px',
                    }}>
                        Lần ban hành: {meta.version || '—'}
                    </span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        Hiệu lực: {meta.effectiveDate || '—'}
                    </span>
                </div>
            </div>

            {/* ── TAB BAR ── */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 20,
                background: '#fff', borderRadius: 12, padding: 6,
                border: '1px solid #eef0f5', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
            }}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1, padding: '9px 16px', borderRadius: 8,
                                fontSize: 13, fontWeight: isActive ? 700 : 500,
                                color: isActive ? '#fff' : '#6b7280',
                                background: isActive ? ACCENT : 'transparent',
                                border: 'none', cursor: 'pointer',
                                transition: 'all 0.18s ease', textAlign: 'center',
                                letterSpacing: '0.01em',
                                boxShadow: isActive ? '0 2px 8px rgba(232,99,122,.35)' : 'none',
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ── TAB 1: Thông tin chung ── */}
            {activeTab === '1' && (
                <div style={{
                    background: '#fff', borderRadius: 14, overflow: 'hidden',
                    border: '1px solid #eef0f5', boxShadow: '0 2px 10px rgba(0,0,0,.045)',
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#f3f4f6' }}>
                        {descItems.map((item, i) => (
                            <div key={i} style={{ background: '#fff', padding: '16px 22px' }}>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: '#9ca3af',
                                    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
                                }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.5 }}>
                                    {item.value || '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TAB 2: Sơ đồ vị trí ── */}
            {activeTab === '2' && (
                <OrgChartTab position={position} />
            )}

            {/* ── TAB 3: Mô tả công việc ── */}
            {activeTab === '3' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {responsibilities.map((item: string, index: number) => {
                        const colonIdx = item.indexOf(':');
                        const rawTitle = colonIdx > -1 ? item.slice(0, colonIdx) : item;
                        const rawBody = colonIdx > -1 ? item.slice(colonIdx + 1) : '';
                        const title = rawTitle.replace(/^\d+\.\s*/, '').trim();
                        const bullets = toLines(rawBody);

                        return (
                            <div key={index} style={{
                                background: '#fff', borderRadius: 12, overflow: 'hidden',
                                border: '1px solid #eef0f5', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                            }}>
                                <div style={{
                                    padding: '12px 20px', background: '#fafafa',
                                    borderBottom: '1px solid #f3f4f6',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                }}>
                                    <span style={{
                                        width: 26, height: 26, borderRadius: 8,
                                        background: ACCENT_LIGHT, border: `1px solid ${ACCENT_BORDER}`,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 800, color: ACCENT, flexShrink: 0,
                                    }}>
                                        {index + 1}
                                    </span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                                        {title}
                                    </span>
                                </div>
                                <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    {bullets.map((line, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: 10, alignItems: 'flex-start',
                                            fontSize: 13.5, color: '#374151', lineHeight: 1.65,
                                        }}>
                                            <span style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: ACCENT, flexShrink: 0, marginTop: 8,
                                            }} />
                                            <span>{line}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── TAB 4: Yêu cầu công việc ── */}
            {activeTab === '4' && (
                <div style={{
                    background: '#fff', borderRadius: 14, overflow: 'hidden',
                    border: '1px solid #eef0f5', boxShadow: '0 2px 10px rgba(0,0,0,.045)',
                }}>
                    <Table
                        bordered={false}
                        pagination={false}
                        columns={reqColumns}
                        dataSource={requirementRows}
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                    />
                </div>
            )}
        </div>
    );
};

export default JDViewDetail;