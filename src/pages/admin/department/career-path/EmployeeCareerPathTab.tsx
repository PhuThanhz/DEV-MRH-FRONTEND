import { useState, useMemo } from "react";
import { Typography, Button, Tooltip, Skeleton, Tag, Badge } from "antd";
import {
    RiseOutlined,
    EyeOutlined,
    EditOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    ArrowRightOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";

import SearchFilter from "@/components/common/filter/SearchFilter";
import {
    useEmployeeCareerPathsByDepartmentQuery,
} from "@/hooks/useEmployeeCareerPaths";
import type { IEmployeeCareerPath } from "@/types/backend";
import ModalAssignCareerPath from "./ModalAssignCareerPath";
import ModalPromoteEmployee from "./ModalPromoteEmployee";
import DrawerEmployeeDetail from "./DrawerEmployeeDetail";

const { Text, Title } = Typography;

// ── Design tokens ───────────────────────────────────────────────────
const T = {
    ink: "#1d1d1f",
    ink2: "#424245",
    ink3: "#86868b",
    ink4: "#aeaeb2",
    ink5: "#d1d1d6",
    white: "#ffffff",
    s1: "#fafafa",
    s2: "#f5f5f7",
    line: "rgba(0,0,0,0.04)",
    lineMed: "rgba(0,0,0,0.08)",
    acc: "#0066ff",
    accSoft: "rgba(0,102,255,0.05)",
    accBord: "rgba(0,102,255,0.12)",
    green: "#24b24b",
    greenSoft: "#e8f7ed",
    greenBord: "#c3e6cb",
    orange: "#f59e0b",
    orangeSoft: "#fef3c7",
    orangeBord: "#fde68a",
    red: "#ff3b30",
    redSoft: "#fff1f0",
    purple: "#af52de",
    purpleSoft: "#f5ebfa",
    purpleBord: "#e8d5f2",
};

const STATUS_CFG = {
    0: { label: "Đang phát triển", color: T.acc, bg: T.accSoft, border: T.accBord, icon: <ClockCircleOutlined /> },
};
const getSt = (s?: number) => STATUS_CFG[0];

const AVATAR_COLORS = ["#0066ff", "#5856d6", "#34aadc", "#1db954", "#ff9500", "#ff3b30", "#af52de"];
const avatarColor = (name?: string) =>
    name ? AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] : AVATAR_COLORS[0];

// ── Components ──────────────────────────────────────────────────────
const ColLabel = ({ children }: { children: React.ReactNode }) => (
    <Text style={{ fontSize: 10, color: T.ink4, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 2 }}>
        {children}
    </Text>
);

const LevelBadge = ({ code, color = T.acc, bg = T.accSoft, border = T.accBord }: any) => (
    <span style={{ padding: "1px 6px", borderRadius: 4, background: bg, border: `1px solid ${border}`, fontSize: 10, fontWeight: 700, color, letterSpacing: 0.2 }}>
        {code}
    </span>
);

const ProgressBar = ({ current, total }: { current?: number; total?: number }) => {
    if (current === undefined || !total) return null;
    const pct = Math.min(Math.round((current / total) * 100), 100);
    return (
        <div style={{ marginTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <Text style={{ fontSize: 10, color: T.ink3 }}>Tiến độ</Text>
                <Text style={{ fontSize: 10, fontWeight: 600, color: T.ink2 }}>{pct}%</Text>
            </div>
            <div style={{ height: 4, background: T.s2, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: T.acc, borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
        </div>
    );
};

// ── Employee Card ───────────────────────────────────────────────────
const EmployeeCard = ({ item, onView, onEdit, onPromote }: any) => {
    const [hov, setHov] = useState(false);
    const st = getSt(item.progressStatus);

    const expectedDate = item.stepStartedAt && item.durationMonths
        ? dayjs(item.stepStartedAt).add(item.durationMonths, "month")
        : null;
    const daysLeft = expectedDate ? expectedDate.diff(dayjs(), "day") : null;
    const isOverdue = item.overdue || (daysLeft !== null && daysLeft < 0);

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: T.white,
                borderRadius: 16,
                padding: "16px 20px",
                border: `1px solid ${hov ? T.accBord : T.line}`,
                boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.04)" : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "grid",
                gridTemplateColumns: "240px 1fr 1fr 140px 130px 40px",
                alignItems: "center",
                gap: 20,
            }}
        >
            {/* 1. User Info */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: avatarColor(item.user?.name), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 15 }}>
                    {item.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                    <Text strong ellipsis style={{ display: "block", color: T.ink, fontSize: 14 }}>{item.user?.name}</Text>
                    <Text ellipsis style={{ display: "block", color: T.ink3, fontSize: 12 }}>{item.user?.email}</Text>
                </div>
            </div>

            {/* 2. Current Path */}
            <div style={{ minWidth: 0 }}>
                <ColLabel>Lộ trình hiện tại</ColLabel>
                <Text strong style={{ fontSize: 13, color: T.ink2 }}>{item.template?.name}</Text>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <LevelBadge code={item.currentStep?.positionLevelCode} />
                    <Text ellipsis style={{ fontSize: 12, color: T.ink2 }}>{item.currentStep?.jobTitleName}</Text>
                </div>
            </div>

            {/* 3. Next Position */}
            <div>
                <ColLabel>Vị trí kế tiếp</ColLabel>
                {item.nextStep ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <ArrowRightOutlined style={{ fontSize: 10, color: T.ink4 }} />
                        <LevelBadge code={item.nextStep.positionLevelCode} color={T.purple} bg={T.purpleSoft} border={T.purpleBord} />
                        <Text ellipsis style={{ fontSize: 12, color: T.ink2, fontWeight: 500 }}>{item.nextStep.jobTitleName}</Text>
                    </div>
                ) : (
                    <Text style={{ fontSize: 12, color: T.ink4 }}>—</Text>
                )}
                <ProgressBar current={item.currentStepOrder} total={item.totalSteps} />
            </div>

            {/* 4. Timeline */}
            <div>
                <ColLabel>Dự kiến bổ nhiệm</ColLabel>
                {expectedDate ? (
                    <>
                        <Text strong style={{ fontSize: 13, color: isOverdue ? T.red : T.ink }}>{expectedDate.format("DD/MM/YYYY")}</Text>
                        {isOverdue && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, color: T.red, fontSize: 11, fontWeight: 600 }}>
                                <WarningOutlined /> Trễ {Math.abs(daysLeft!)} ngày
                            </div>
                        )}
                    </>
                ) : <Text style={{ color: T.ink5 }}>—</Text>}
            </div>

            {/* 5. Status */}
            <div style={{ textAlign: "right" }}>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20,
                    background: st.bg, color: st.color, fontSize: 11, fontWeight: 600, border: `1px solid ${st.border}`
                }}>
                    <Badge color={st.color} status="processing" style={{ fontSize: 8 }} /> {st.label}
                </div>
            </div>

            {/* 6. Actions Menu */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Tooltip title="Xem chi tiết">
                    <Button type="text" shape="circle" icon={<EyeOutlined />} onClick={() => onView(item)} style={{ color: T.ink3 }} />
                </Tooltip>

                {hov && (
                    <div style={{ position: "absolute", right: 24, background: T.white, border: `1px solid ${T.lineMed}`, borderRadius: 10, padding: 4, display: "flex", gap: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 10 }}>
                        <Tooltip title="Sửa"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(item)} /></Tooltip>
                        {item.nextStep && (
                            <Tooltip title="Bổ nhiệm"><Button type="text" size="small" icon={<RiseOutlined />} onClick={() => onPromote(item)} style={{ color: T.green }} /></Tooltip>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Main Component ──────────────────────────────────────────────────
const EmployeeCareerPathTab = () => {
    const { departmentId } = useParams();
    const [searchValue, setSearchValue] = useState("");
    const [openAssign, setOpenAssign] = useState(false);
    const [openPromote, setOpenPromote] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [selected, setSelected] = useState<IEmployeeCareerPath | null>(null);

    const { data = [], isFetching, refetch } = useEmployeeCareerPathsByDepartmentQuery(Number(departmentId));

    const stats = useMemo(() => ({
        total: data.length,
        overdue: data.filter(d => d.overdue).length,
    }), [data]);

    const filtered = useMemo(() => {
        return data.filter(item => {
            const matchSearch =
                !searchValue ||
                [item.user?.name, item.user?.email, item.template?.name]
                    .some(s => s?.toLowerCase().includes(searchValue.toLowerCase()));

            return matchSearch;
        });
    }, [data, searchValue]);

    return (
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Header & Filter */}
            <div style={{ background: T.white, padding: "20px 24px", borderRadius: 20, border: `1px solid ${T.line}`, marginBottom: 20 }}>
                <SearchFilter
                    searchPlaceholder="Tìm tên nhân viên, vị trí hoặc tên lộ trình..."
                    onSearch={setSearchValue}
                    onAddClick={() => { setSelected(null); setOpenAssign(true); }}
                    addLabel="Gán lộ trình"
                />

                <div style={{ display: "flex", gap: 12, marginTop: 20, alignItems: "center" }}>
                    {stats.overdue > 0 && (
                        <Tag color="error" style={{ borderRadius: 6, padding: "2px 10px", fontWeight: 600, border: "none" }}>
                            {stats.overdue} NHÂN VIÊN TRỄ HẠN
                        </Tag>
                    )}
                </div>
            </div>

            {/* List Content */}
            {isFetching ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1, 2, 3, 4].map(k => <Skeleton key={k} active avatar paragraph={{ rows: 1 }} style={{ background: T.white, padding: 20, borderRadius: 16 }} />)}
                </div>
            ) : filtered.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filtered.map(item => (
                        <EmployeeCard
                            key={item.id}
                            item={item}
                            onView={(r: any) => { setSelected(r); setOpenDetail(true); }}
                            onEdit={(r: any) => { setSelected(r); setOpenAssign(true); }}
                            onPromote={(r: any) => { setSelected(r); setOpenPromote(true); }}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "100px 0", background: T.s1, borderRadius: 20, border: `1px dashed ${T.lineMed}` }}>
                    <UserOutlined style={{ fontSize: 40, color: T.ink5, marginBottom: 16 }} />
                    <Title level={5} style={{ color: T.ink2 }}>Không có dữ liệu</Title>
                    <Text style={{ color: T.ink4 }}>Thử thay đổi bộ lọc hoặc thêm lộ trình mới cho nhân viên</Text>
                </div>
            )}

            {/* Modals & Drawer */}
            <ModalAssignCareerPath open={openAssign} onClose={() => { setOpenAssign(false); setSelected(null); }} dataInit={selected} departmentId={Number(departmentId)} onSuccess={() => { setOpenAssign(false); refetch(); }} />
            <ModalPromoteEmployee open={openPromote} onClose={() => { setOpenPromote(false); setSelected(null); }} dataInit={selected} onSuccess={() => { setOpenPromote(false); refetch(); }} />
            <DrawerEmployeeDetail open={openDetail} onClose={() => { setOpenDetail(false); setSelected(null); }} dataInit={selected} />
        </div>
    );
};

export default EmployeeCareerPathTab;