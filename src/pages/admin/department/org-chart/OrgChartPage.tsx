// src/pages/OrgChartPage.tsx

import { useCallback, useMemo, useState } from 'react';

// Import types riêng để fix lỗi verbatimModuleSyntax
import type {
    Node,
    Edge,
    NodeProps,
    NodeChange,
    EdgeChange,
} from 'reactflow';

// Import runtime exports
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    applyNodeChanges,
    applyEdgeChanges,
    ReactFlowProvider,
} from 'reactflow';

import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Modal } from 'antd';
import JDViewDetail from '@/pages/admin/department/org-chart/JDViewDetail'; // điều chỉnh path nếu cần

// ────────────────────────────────────────────────
// TYPE CHO DEPARTMENT_DESCRIPTIONS
interface DescriptionSection {
    subtitle: string;
    items: string[];
}

interface DepartmentDescription {
    title: string;
    sections: DescriptionSection[];
}

const DEPARTMENT_DESCRIPTIONS: Record<string, DepartmentDescription> = {
    descAdmin: {
        title: 'A. Hành chính',
        sections: [
            {
                subtitle: '1. Hành chính Văn phòng',
                items: [
                    'Thực hiện các công tác hành chính, văn thư và quản trị văn phòng cho toàn Công ty; tổ chức các dịch vụ hỗ trợ nội bộ, đảm bảo môi trường làm việc an toàn cho nhân viên.',
                    'Quản lý tài sản, trang thiết bị và vật tư hành chính; triển khai mua sắm, kiểm soát sử dụng và tối ưu chi phí.',
                    'Thực hiện thanh toán các khoản chi phí hành chính, dịch vụ và hợp đồng; kiểm soát tính hợp lệ, đầy đủ và tuân thủ ngân sách.',
                ],
            },
            {
                subtitle: '2. Hỗ trợ Vận hành',
                items: [
                    'Thực hiện các thủ tục và hồ sơ hành chính phục vụ hoạt động kinh doanh – vận hành.',
                    'Là đầu mối tiếp đoàn kiểm tra và làm việc với cơ quan chức năng về PCCC, ATTP, vệ sinh môi trường và các yêu cầu tuân thủ liên quan.',
                ],
            },
        ],
    },
    descCnb: {
        title: 'C. Tiền lương và Phúc lợi',
        sections: [
            { subtitle: '1. Chế độ, phúc lợi', items: ['Xây dựng, điều chỉnh, cập nhật các chính sách lương, thưởng, KPIs, phúc lợi phù hợp với từng công việc của Phòng ban, Quản trị hệ thống phần mềm nhân sự, tính thưởng,…'] },
            { subtitle: '2. Tiền lương', items: ['Thực hiện tính lương, bảo hiểm xã hội, khai báo thuế, tư vấn về các chế độ bảo hiểm sức khỏe – tai nạn.'] },
            { subtitle: '3. Dịch vụ Nhân sự', items: ['Các công việc liên quan Hợp đồng lao động, hợp đồng đào tạo nghề; chấm công; quản lý hồ sơ/dữ liệu nhân viên.'] },
            { subtitle: '4. Quan hệ lao động', items: ['Triển khai công tác đánh giá khen thưởng/kỷ luật, sắp xếp nhân sự (bao gồm nhưng không giới hạn: điều chuyển, bổ nhiệm, miễn nhiệm, thay đổi lương, xử lý kỷ luật), Chế độ Công đoàn.'] },
        ],
    },
    descRec: {
        title: 'B. Tuyển dụng',
        sections: [
            { subtitle: '1. Tạo nguồn & Thương hiệu Tuyển dụng', items: ['Xây dựng và triển khai chiến lược thương hiệu tuyển dụng, thu hút nhân tài.', 'Chuẩn hóa quy trình và công cụ tuyển dụng.', 'Phát triển nguồn ứng viên phù hợp với nhu cầu kinh doanh.'] },
            { subtitle: '2. Tuyển dụng', items: ['Lập kế hoạch và triển khai tuyển dụng đáp ứng nhu cầu nhân sự.', 'Quản lý và tối ưu ngân sách tuyển dụng.', 'Tổ chức quy trình tuyển chọn ứng viên.'] },
        ],
    },
    descTraining: {
        title: 'D. Đào tạo & Phát triển',
        sections: [
            { subtitle: '1. Hoạch định Đào tạo', items: ['Xây dựng chiến lược, mục tiêu và kế hoạch đào tạo hằng năm.', 'Đánh giá nhu cầu đào tạo toàn Công ty/nhà hàng và triển khai các chương trình trọng tâm.', 'Thiết lập tiêu chí đánh giá hiệu quả đào tạo và cải tiến phương pháp.', 'Đề xuất mô hình đào tạo phù hợp môi trường F&B và vận hành thực tế.', 'Chuẩn hóa và quản lý tài liệu đào tạo nội bộ.', 'Xây dựng lộ trình học tập theo từng vị trí tại nhà hàng.'] },
            { subtitle: '2. Triển khai Đào tạo', items: ['Tổ chức và cập nhật chương trình đào tạo vận hành (OJT, lớp tập trung, coaching).', 'Kiểm tra áp dụng đào tạo và hiệu chỉnh tại nhà hàng.', 'Tổ chức các cuộc thi và đánh giá chuyên môn nâng cao tay nghề OPS.'] },
            { subtitle: '3. Phát triển văn hóa và gắn kết', items: ['Xây dựng kế hoạch và chủ trì triển khai các hoạt động nhằm phát triển văn hóa doanh nghiệp.', 'Vận hành truyền thông nội bộ nhằm lan tỏa văn hóa.', 'Thực hiện khảo sát, phân tích và đề xuất giải pháp nâng cao trải nghiệm & mức độ gắn kết nhân viên.'] },
        ],
    },
};

// ────────────────────────────────────────────────
// DỮ LIỆU ORG & POSITIONS
const POSITIONS = [
    { id: 'chro', nameVN: 'Giám đốc Nhân sự', levelCode: 'M2' },
    { id: 'hrDirector', nameVN: 'Trưởng phòng Hành chính Nhân sự', levelCode: 'M3' },
    { id: 'hrAssistant', nameVN: 'Trợ lý Trưởng phòng HCNS', levelCode: 'S1' },
    { id: 'hrDeputy', nameVN: 'Phó phòng Hành chính Nhân sự', levelCode: 'S2' },

    { id: 'adminLead', nameVN: 'Trưởng nhóm Hành chính', levelCode: 'S1' },
    { id: 'cnbLead', nameVN: 'Trưởng nhóm Tiền lương & Phúc lợi', levelCode: 'S1' },
    { id: 'recLead', nameVN: 'Trưởng nhóm Tuyển dụng', levelCode: 'S1' },
    { id: 'trainingLead', nameVN: 'Trưởng nhóm Đào tạo & Phát triển', levelCode: 'S1' },

    { id: 'adminExec', nameVN: 'Chuyên viên Hành chính', levelCode: 'E2' },
    { id: 'cnbExec', nameVN: 'Chuyên viên Tiền lương & Phúc lợi', levelCode: 'E2' },
    { id: 'recExec', nameVN: 'Chuyên viên Tuyển dụng', levelCode: 'E2' },
    { id: 'cultureExec', nameVN: 'Chuyên viên Phát triển văn hoá & Gắn kết', levelCode: 'E2' },
    { id: 'trainingExec', nameVN: 'Chuyên viên Đào tạo & Phát triển', levelCode: 'E2' },

    { id: 'adminStaff', nameVN: 'Nhân viên Hành chính', levelCode: 'E1' },
    { id: 'cnbStaff', nameVN: 'Nhân viên Tiền lương & Phúc lợi', levelCode: 'E1' },
    { id: 'recStaff', nameVN: 'Nhân viên Tuyển dụng', levelCode: 'E1' },
    { id: 'cultureStaff', nameVN: 'Nhân viên Phát triển văn hoá & Gắn kết', levelCode: 'E1' },
    { id: 'trainingStaff', nameVN: 'Nhân viên Đào tạo & Phát triển', levelCode: 'E1' },

    { id: 'janitor', nameVN: 'Nhân viên Tạp vụ', levelCode: 'E0' },
    { id: 'cnbAdmin', nameVN: 'Admin Tiền lương & Phúc lợi', levelCode: 'E1' },

    { id: 'descAdmin', nameVN: '', levelCode: '' },
    { id: 'descCnb', nameVN: '', levelCode: '' },
    { id: 'descRec', nameVN: '', levelCode: '' },
    { id: 'descTraining', nameVN: '', levelCode: '' },
];

interface OrgItem {
    id: string;
    pos: string;
    parent: string | null;
    groupLeadId?: string;
}

const ORG: OrgItem[] = [
    { id: 'n1', pos: 'chro', parent: null },
    { id: 'n2', pos: 'hrDirector', parent: 'n1' },
    { id: 'n3', pos: 'hrAssistant', parent: 'n2' },
    { id: 'n4', pos: 'hrDeputy', parent: 'n2' },

    { id: 'n5', pos: 'adminLead', parent: 'n4' },
    { id: 'n6', pos: 'cnbLead', parent: 'n4' },
    { id: 'n7', pos: 'recLead', parent: 'n4' },
    { id: 'n8', pos: 'trainingLead', parent: 'n4' },

    { id: 'n9', pos: 'adminExec', parent: 'n5' },
    { id: 'n10', pos: 'cnbExec', parent: 'n6' },
    { id: 'n11', pos: 'recExec', parent: 'n7' },
    { id: 'n12', pos: 'cultureExec', parent: 'n7' },
    { id: 'n13', pos: 'trainingExec', parent: 'n8' },

    { id: 'n14', pos: 'adminStaff', parent: 'n9' },
    { id: 'n15', pos: 'cnbStaff', parent: 'n10' },
    { id: 'n16', pos: 'recStaff', parent: 'n11' },
    { id: 'n17', pos: 'cultureStaff', parent: 'n12' },
    { id: 'n18', pos: 'trainingStaff', parent: 'n13' },

    { id: 'n19', pos: 'janitor', parent: 'n5' },
    { id: 'n20', pos: 'cnbAdmin', parent: 'n6' },

    { id: 'desc1', pos: 'descAdmin', parent: null, groupLeadId: 'n5' },
    { id: 'desc2', pos: 'descCnb', parent: null, groupLeadId: 'n6' },
    { id: 'desc3', pos: 'descRec', parent: null, groupLeadId: 'n7' },
    { id: 'desc4', pos: 'descTraining', parent: null, groupLeadId: 'n8' },
];

// ────────────────────────────────────────────────
// HELPER
const getRelatedNodes = (nodeId: string) => {
    const ancestors = new Set<string>();
    const descendants = new Set<string>();

    let node = ORG.find((n: OrgItem) => n.id === nodeId);
    while (node?.parent) {
        ancestors.add(node.parent);
        node = ORG.find((n: OrgItem) => n.id === node?.parent);
    }

    const queue = [nodeId];
    while (queue.length) {
        const currentId = queue.shift()!;
        const children = ORG.filter((n: OrgItem) => n.parent === currentId);
        children.forEach((child: OrgItem) => {
            descendants.add(child.id);
            queue.push(child.id);
        });
    }

    return { current: nodeId, ancestors, descendants };
};

// ────────────────────────────────────────────────
// CUSTOM NODE - BUTTON "Xem JD" CHÍNH GIỮA DƯỚI TÊN & CẤP BẬC
const GlassOrgNode = ({ data, id }: NodeProps<{
    label: string;
    level?: string;
    isDesc?: boolean;
    isHighlighted?: boolean | null;
    highlightType?: 'current' | 'ancestor' | 'descendant' | null;
    onHover?: (id: string | null) => void;
    descId?: keyof typeof DEPARTMENT_DESCRIPTIONS;
    onJDClick?: () => void;
}>) => {
    const isDesc = !!data.isDesc;
    const isCHRO = id === 'n1';

    const nodeStyle = (() => {
        if (data.isHighlighted === false) return { opacity: 0.3, transform: 'scale(1)' };
        if (data.isHighlighted == null) return { opacity: 1, transform: 'scale(1)' };

        switch (data.highlightType) {
            case 'current':
                return { transform: 'scale(1.08)', border: '3px solid #3b82f6', boxShadow: '0 0 20px rgba(59,130,246,0.6)' };
            case 'ancestor':
                return { transform: 'scale(1.04)', border: '2.5px solid #fbbf24', boxShadow: '0 0 16px rgba(251,191,36,0.5)' };
            case 'descendant':
                return { transform: 'scale(1.02)', border: '2px solid #60a5fa', boxShadow: '0 0 12px rgba(96,165,250,0.4)' };
            default:
                return { transform: 'scale(1)' };
        }
    })();

    const descContent = data.descId ? DEPARTMENT_DESCRIPTIONS[data.descId] : null;

    return (
        <>
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <div
                onMouseEnter={() => data.onHover?.(id)}
                onMouseLeave={() => data.onHover?.(null)}
                style={{
                    width: isDesc ? 420 : 280,
                    minHeight: isDesc ? 520 : 220, // Tăng chiều cao để chứa button
                    padding: isDesc ? '24px' : '24px 24px 80px', // Padding dưới lớn hơn để button nằm giữa
                    background: isDesc ? 'rgba(254,242,242,0.88)' : 'rgba(255,255,255,0.58)',
                    backdropFilter: 'blur(14px)',
                    borderRadius: 24,
                    border: data.isHighlighted ? nodeStyle.border : `2.5px solid ${isDesc ? '#fca5a5' : 'rgba(226,232,240,0.7)'}`,
                    boxShadow: nodeStyle.boxShadow || '0 12px 48px rgba(0,0,0,0.12)',
                    transform: nodeStyle.transform,
                    opacity: nodeStyle.opacity,
                    transition: 'all 0.35s ease',
                    color: '#1e293b',
                    textAlign: 'center',
                    cursor: 'grab',
                    userSelect: 'none',
                    position: 'relative',
                }}
            >
                {/* Button "Xem JD" - Chính giữa, dưới tên & cấp bậc */}
                {isCHRO && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Ngăn drag node khi click button
                            data.onJDClick?.();
                        }}
                        title="Xem mô tả công việc chi tiết"
                        style={{
                            position: 'absolute',
                            left: '50%',
                            bottom: 30,                    // Cách đáy node 30px để nằm giữa phần dưới
                            transform: 'translateX(-50%)',
                            padding: '10px 28px',
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#ffffff',
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: 30,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
                            zIndex: 10,
                            transition: 'all 0.25s ease',
                            minWidth: 140,
                            pointerEvents: 'auto',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                            e.currentTarget.style.transform = 'translateX(-50%) scale(1.08)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#3b82f6';
                            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)';
                        }}
                    >
                        Xem JD
                    </button>
                )}

                <div style={{ fontWeight: 800, fontSize: isDesc ? 20 : 18, marginBottom: 12, letterSpacing: '-0.02em' }}>
                    {data.label || ' '}
                </div>

                {!isDesc && data.level && (
                    <div
                        style={{
                            background: 'rgba(255,255,255,0.75)',
                            borderRadius: 16,
                            padding: '6px 18px',
                            fontSize: 14,
                            fontWeight: 700,
                            display: 'inline-block',
                            marginBottom: 40, // Khoảng cách lớn hơn để button nằm giữa phần dưới
                            border: '1.5px solid rgba(226,232,240,0.6)',
                        }}
                    >
                        {data.level}
                    </div>
                )}

                {isDesc && descContent && (
                    <div style={{ fontSize: 13.5, lineHeight: 1.7, textAlign: 'left', marginTop: 20 }}>
                        <div style={{ fontWeight: 900, color: '#991b1b', fontSize: 18, marginBottom: 16 }}>{descContent.title}</div>
                        {descContent.sections.map((sec: DescriptionSection, i: number) => (
                            <div key={i} style={{ marginBottom: 20 }}>
                                <div style={{ fontWeight: 700, fontStyle: 'italic', marginBottom: 10, color: '#444' }}>{sec.subtitle}</div>
                                {sec.items.map((item: string, j: number) => (
                                    <div key={j} style={{ marginBottom: 8, paddingLeft: 12 }}>• {item}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {!isDesc && <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />}
        </>
    );
};

const nodeTypes = { glass: GlassOrgNode };

// ────────────────────────────────────────────────
// LAYOUT DAGRE
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
        rankdir: 'TB',
        nodesep: 160,
        ranksep: 240,
        align: 'DL',
        ranker: 'tight-tree',
    });

    const regularNodes = nodes.filter((n) => !n.id.startsWith('desc'));
    const descNodes = nodes.filter((n) => n.id.startsWith('desc'));

    regularNodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 280, height: 180 });
    });

    edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));

    dagre.layout(dagreGraph);

    const layoutedRegular = regularNodes.map((node) => {
        const pos = dagreGraph.node(node.id);
        return {
            ...node,
            position: { x: pos.x - 140, y: pos.y - 90 },
        };
    });

    const maxY = Math.max(...layoutedRegular.map((n) => n.position.y));
    const descY = maxY + 600;

    const groupLeads = {
        desc1: layoutedRegular.find((n) => n.id === 'n5')?.position,
        desc2: layoutedRegular.find((n) => n.id === 'n6')?.position,
        desc3: layoutedRegular.find((n) => n.id === 'n7')?.position,
        desc4: layoutedRegular.find((n) => n.id === 'n8')?.position,
    };

    const layoutedDesc = descNodes.map((node) => {
        let x = 0;
        switch (node.id) {
            case 'desc1':
                x = groupLeads.desc1 ? groupLeads.desc1.x - 70 : -400;
                break;
            case 'desc2':
                x = groupLeads.desc2 ? groupLeads.desc2.x - 70 : -100;
                break;
            case 'desc3':
                x = groupLeads.desc3 ? groupLeads.desc3.x - 70 : 200;
                break;
            case 'desc4':
                x = groupLeads.desc4 ? groupLeads.desc4.x - 70 : 500;
                break;
            default:
                x = 0;
        }
        return {
            ...node,
            position: { x, y: descY },
        };
    });

    return { nodes: [...layoutedRegular, ...layoutedDesc], edges };
};

// ────────────────────────────────────────────────
// COMPONENT CHÍNH
const OrgChartPage = () => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<any | null>(null);

    const initialNodes = useMemo(() => {
        return ORG.map((item) => {
            const posInfo = POSITIONS.find((p) => p.id === item.pos)!;
            const isDesc = item.pos.startsWith('desc');

            return {
                id: item.id,
                type: 'glass',
                position: { x: 0, y: 0 },
                data: {
                    label: posInfo.nameVN,
                    level: posInfo.levelCode,
                    isDesc,
                    descId: isDesc ? item.pos : undefined,
                    groupLeadId: item.groupLeadId,
                    onJDClick: () => {
                        if (item.id !== 'n1') return;
                        const posId = item.pos;
                        const positionInfo = POSITIONS.find((p) => p.id === posId);
                        if (!positionInfo) return;

                        setSelectedPosition({
                            id: posId,
                            nameVN: positionInfo.nameVN,
                            departmentName: 'Phòng Hành chính - Nhân sự',
                            companyName: 'Công ty ABC',
                        });
                    },
                },
                draggable: true,
            };
        });
    }, []);

    const initialEdges = useMemo(() => {
        return ORG.filter((d) => d.parent).map((d) => ({
            id: `e-${d.parent}-${d.id}`,
            source: d.parent!,
            target: d.id,
            type: 'smoothstep',
            style: { stroke: '#cbd5e1', strokeWidth: 2.5 },
        }));
    }, []);

    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
        () => getLayoutedElements(initialNodes, initialEdges),
        [initialNodes, initialEdges]
    );

    const [nodes, setNodes] = useState<Node[]>(layoutedNodes);
    const [edges, setEdges] = useState<Edge[]>(layoutedEdges);

    const related = useMemo(() => (hoveredId ? getRelatedNodes(hoveredId) : null), [hoveredId]);

    const displayedNodes = useMemo(() => {
        return nodes.map((node) => {
            let isHighlighted: boolean | null = null;
            let highlightType: 'current' | 'ancestor' | 'descendant' | null = null;

            if (related) {
                if (node.id === related.current) {
                    isHighlighted = true;
                    highlightType = 'current';
                } else if (related.ancestors.has(node.id)) {
                    isHighlighted = true;
                    highlightType = 'ancestor';
                } else if (related.descendants.has(node.id)) {
                    isHighlighted = true;
                    highlightType = 'descendant';
                } else {
                    isHighlighted = false;
                }
            }

            return {
                ...node,
                data: {
                    ...node.data,
                    isHighlighted,
                    highlightType,
                    onHover: setHoveredId,
                },
            };
        });
    }, [nodes, related]);

    const highlightedEdges = useMemo(() => {
        return edges.map((edge) => {
            let style = { ...edge.style };
            let animated = false;

            if (related) {
                const isSourceCurrent = edge.source === related.current;
                const isTargetCurrent = edge.target === related.current;
                const isSourceAncestor = related.ancestors.has(edge.source);
                const isTargetAncestor = related.ancestors.has(edge.target);
                const isSourceDescendant = related.descendants.has(edge.source);
                const isTargetDescendant = related.descendants.has(edge.target);

                if ((isSourceAncestor && isTargetCurrent) || (isSourceAncestor && isTargetAncestor)) {
                    style = { ...style, stroke: '#fbbf24', strokeWidth: 3.5 };
                    animated = true;
                } else if (isSourceCurrent && isTargetDescendant) {
                    style = { ...style, stroke: '#3b82f6', strokeWidth: 3.5 };
                    animated = true;
                } else if (isSourceDescendant && isTargetDescendant) {
                    style = { ...style, stroke: '#60a5fa', strokeWidth: 3 };
                    animated = true;
                } else {
                    style = { ...style, opacity: 0.18 };
                }
            }

            return { ...edge, style, animated };
        });
    }, [edges, related]);

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes((nds) => applyNodeChanges(changes, nds));
    }, []);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, []);

    return (
        <ReactFlowProvider>
            <div style={{ width: '100%', height: '90vh', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }}>
                <style>{`
          .react-flow__node-glass .react-flow__handle { opacity: 0; }
          .react-flow__node { cursor: grab !important; }
        `}</style>

                <ReactFlow
                    nodes={displayedNodes}
                    edges={highlightedEdges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    minZoom={0.1}
                    maxZoom={1.8}
                    nodesDraggable={true}
                    nodesConnectable={false}
                    panOnDrag={true}
                    zoomOnScroll={true}
                >
                    <Background gap={30} color="#e2e8f0" />
                    <Controls />
                    <MiniMap />
                </ReactFlow>

                {/* Modal hiển thị JD */}
                <Modal
                    title={`Mô tả công việc - ${selectedPosition?.nameVN || ''}`}
                    open={!!selectedPosition}
                    onCancel={() => setSelectedPosition(null)}
                    footer={null}
                    width={1100}
                    styles={{ body: { padding: 0 } }}
                >
                    {selectedPosition && <JDViewDetail position={selectedPosition} />}
                </Modal>
            </div>
        </ReactFlowProvider>
    );
};

export default OrgChartPage;