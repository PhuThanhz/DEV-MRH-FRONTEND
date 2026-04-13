import { useState, useMemo } from "react";
import { Typography, Tooltip, Tag, Badge, Space } from "antd";
import {
    EyeOutlined,
    EditOutlined,
    WarningOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import type { ProColumns } from "@ant-design/pro-components";

import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { PAGINATION_CONFIG } from "@/config/pagination";

import {
    useEmployeeCareerPathsByDepartmentQuery,
    useEmployeeCareerPathByUserQuery,
} from "@/hooks/useEmployeeCareerPaths";
import { useAppSelector } from "@/redux/hooks";
import type { IEmployeeCareerPath } from "@/types/backend";
import ModalAssignCareerPath from "./ModalAssignCareerPath";
import ModalPromoteEmployee from "./ModalPromoteEmployee";
import DrawerEmployeeDetail from "./ModalEmployeeDetail";

const { Text } = Typography;

// ── Avatar ───────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    "#0066ff", "#5856d6", "#34aadc",
    "#1db954", "#ff9500", "#ff3b30", "#af52de",
];
const avatarColor = (name?: string) =>
    name ? AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] : AVATAR_COLORS[0];

const UserAvatar = ({ name }: { name?: string }) => {
    const initials = (name ?? "U")
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase())
        .slice(0, 2)
        .join("");
    return (
        <div
            style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: avatarColor(name),
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 13,
                flexShrink: 0,
                border: "1px solid rgba(0,0,0,0.06)",
            }}
        >
            {initials}
        </div>
    );
};

// ── LevelBadge ───────────────────────────────────────────────────────────
const LevelBadge = ({
    code,
    color = "#0066ff",
    bg = "rgba(0,102,255,0.07)",
    border = "rgba(0,102,255,0.18)",
}: {
    code?: string;
    color?: string;
    bg?: string;
    border?: string;
}) =>
    code ? (
        <span
            style={{
                padding: "1px 7px",
                borderRadius: 4,
                background: bg,
                border: `1px solid ${border}`,
                fontSize: 11,
                fontWeight: 700,
                color,
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
            }}
        >
            {code}
        </span>
    ) : null;

// ── ProgressBar ──────────────────────────────────────────────────────────
const ProgressBar = ({
    current,
    total,
}: {
    current?: number;
    total?: number;
}) => {
    if (current === undefined || !total) return null;
    const pct = Math.min(Math.round((current / total) * 100), 100);
    return (
        <div style={{ marginTop: 5 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 2,
                }}
            >
                <Text style={{ fontSize: 10, color: "#86868b" }}>Tiến độ</Text>
                <Text style={{ fontSize: 10, fontWeight: 600, color: "#424245" }}>
                    {pct}%
                </Text>
            </div>
            <div
                style={{
                    height: 4,
                    background: "#f0f0f0",
                    borderRadius: 2,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "#0066ff",
                        borderRadius: 2,
                        transition: "width 0.5s ease",
                    }}
                />
            </div>
        </div>
    );
};

// ── Promote Button ───────────────────────────────────────────────────────
const PromoteButton = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={onClick}
        style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 10px",
            borderRadius: 4,
            border: "1px solid #13c2c2",
            background: "#e6fffb",
            color: "#13c2c2",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            lineHeight: "20px",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = "#13c2c2";
            e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = "#e6fffb";
            e.currentTarget.style.color = "#13c2c2";
        }}
    >
        Bổ nhiệm
    </button>
);

// ── Props ─────────────────────────────────────────────────────────────────
interface Props {
    viewMode: "department" | "own";
}

const EmployeeCareerPathTab = ({ viewMode }: Props) => {
    const { departmentId } = useParams();
    const currentUser = useAppSelector((state) => state.account.user);

    const [searchValue, setSearchValue] = useState("");
    const [openAssign, setOpenAssign] = useState(false);
    const [openPromote, setOpenPromote] = useState(false);
    const [openDetail, setOpenDetail] = useState(false);
    const [selected, setSelected] = useState<IEmployeeCareerPath | null>(null);

    // ── Queries ───────────────────────────────────────────────────────────
    const deptQuery = useEmployeeCareerPathsByDepartmentQuery(
        viewMode === "department" ? Number(departmentId) : undefined
    );
    const ownQuery = useEmployeeCareerPathByUserQuery(
        viewMode === "own" ? currentUser?.id : undefined
    );

    const data: IEmployeeCareerPath[] =
        viewMode === "department"
            ? (deptQuery.data ?? [])
            : ownQuery.data
                ? [ownQuery.data]
                : [];

    const isFetching = deptQuery.isFetching || ownQuery.isFetching;
    const refetch =
        viewMode === "department" ? deptQuery.refetch : ownQuery.refetch;

    // ── Filter ────────────────────────────────────────────────────────────
    const filtered = useMemo(
        () =>
            data.filter(
                (item) =>
                    !searchValue ||
                    [
                        item.user?.name,
                        (item.user as any)?.employeeCode,
                        item.template?.name,
                    ].some((s) =>
                        s?.toLowerCase().includes(searchValue.toLowerCase())
                    )
            ),
        [data, searchValue]
    );

    const overdueCount = useMemo(
        () => data.filter((d) => d.overdue).length,
        [data]
    );

    // ── Columns ───────────────────────────────────────────────────────────
    const columns: ProColumns<IEmployeeCareerPath>[] = [
        {
            title: "STT",
            key: "index",
            width: 55,
            align: "center",
            render: (_text, _record, index) => index + 1,
        },
        {
            title: "Mã NV",
            key: "employeeCode",
            width: 100,
            align: "center",
            render: (_, record) => {
                const employeeCode = (record.user as any)?.employeeCode;
                return employeeCode ? (
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#424245",
                            fontFamily: "monospace",
                        }}
                    >
                        #{employeeCode}
                    </Text>
                ) : (
                    <Text style={{ fontSize: 12, color: "#d1d1d6" }}>—</Text>
                );
            },
        },
        {
            title: "Nhân viên",
            key: "user",
            width: 180,   // giảm từ 200 → 180, vừa hơn trên tablet
            ellipsis: true,
            render: (_, record) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UserAvatar name={record.user?.name} />
                    <Text
                        strong
                        ellipsis
                        style={{ fontSize: 13, color: "#1d1d1f", minWidth: 0 }}
                    >
                        {record.user?.name}
                    </Text>
                </div>
            ),
        },
        {
            title: "Lộ trình",
            key: "template",
            ellipsis: true,
            render: (_, record) => (
                <div>
                    <Text strong style={{ fontSize: 13, color: "#1d1d1f" }}>
                        {record.template?.name}
                    </Text>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 3,
                            flexWrap: "wrap",   // wrap trên màn hình nhỏ
                        }}
                    >
                        <LevelBadge code={record.currentStep?.positionLevelCode} />
                        <Text
                            ellipsis
                            style={{ fontSize: 12, color: "#424245", minWidth: 0 }}
                        >
                            {record.currentStep?.jobTitleName}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: "Vị trí kế tiếp",
            key: "nextStep",
            ellipsis: true,
            render: (_, record) =>
                record.nextStep ? (
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                flexWrap: "wrap",   // wrap trên màn hình nhỏ
                            }}
                        >
                            <ArrowRightOutlined
                                style={{ fontSize: 10, color: "#aeaeb2" }}
                            />
                            <LevelBadge
                                code={record.nextStep.positionLevelCode}
                                color="#af52de"
                                bg="#f5ebfa"
                                border="#e8d5f2"
                            />
                            <Text
                                ellipsis
                                style={{
                                    fontSize: 12,
                                    color: "#424245",
                                    fontWeight: 500,
                                    minWidth: 0,
                                }}
                            >
                                {record.nextStep.jobTitleName}
                            </Text>
                        </div>
                        <ProgressBar
                            current={record.currentStepOrder}
                            total={record.totalSteps}
                        />
                    </div>
                ) : (
                    <Text style={{ fontSize: 12, color: "#d1d1d6" }}>—</Text>
                ),
        },
        {
            title: "Dự kiến bổ nhiệm",
            key: "expectedDate",
            align: "center",
            width: 145,
            render: (_, record) => {
                const expectedDate =
                    record.stepStartedAt && record.durationMonths
                        ? dayjs(record.stepStartedAt).add(
                            record.durationMonths,
                            "month"
                        )
                        : null;
                const daysLeft = expectedDate
                    ? expectedDate.diff(dayjs(), "day")
                    : null;
                const isOverdue =
                    record.overdue || (daysLeft !== null && daysLeft < 0);
                if (!expectedDate)
                    return <Text style={{ color: "#d1d1d6" }}>—</Text>;
                return (
                    <div>
                        <Text
                            strong
                            style={{
                                fontSize: 13,
                                color: isOverdue ? "#ff3b30" : "#1d1d1f",
                            }}
                        >
                            {expectedDate.format("DD/MM/YYYY")}
                        </Text>
                        {isOverdue && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 4,
                                    color: "#ff3b30",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    marginTop: 2,
                                }}
                            >
                                <WarningOutlined /> Trễ {Math.abs(daysLeft!)} ngày
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            title: "Trạng thái",
            key: "status",
            align: "center",
            width: 145,
            render: (_, record) => {
                const status = record.progressStatus;
                const cfg =
                    status === 1
                        ? {
                            label: "Hoàn thành",
                            color: "#52c41a",
                            bg: "#f6ffed",
                            border: "#b7eb8f",
                        }
                        : status === 2
                            ? {
                                label: "Tạm dừng",
                                color: "#fa8c16",
                                bg: "#fff7e6",
                                border: "#ffd591",
                            }
                            : {
                                label: "Đang phát triển",
                                color: "#0066ff",
                                bg: "rgba(0,102,255,0.05)",
                                border: "rgba(0,102,255,0.2)",
                            };
                return (
                    <Tag
                        style={{
                            borderRadius: 4,
                            padding: "0px 8px",
                            fontSize: 12,
                            fontWeight: 500,
                            height: 22,
                            lineHeight: "20px",
                            border: `1px solid ${cfg.border}`,
                            background: cfg.bg,
                            color: cfg.color,
                        }}
                    >
                        <Badge
                            color={cfg.color}
                            status="processing"
                            style={{ fontSize: 8, marginRight: 4 }}
                        />
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: "Hành động",
            align: "center",
            width: 160,
            fixed: "right",             // ← sticky bên phải khi cuộn ngang
            render: (_, entity) => (
                <Space size={8}>
                    <Tooltip title="Xem chi tiết">
                        <EyeOutlined
                            style={{ fontSize: 18, color: "#1677ff", cursor: "pointer" }}
                            onClick={() => {
                                setSelected(entity);
                                setOpenDetail(true);
                            }}
                        />
                    </Tooltip>
                    {viewMode !== "own" && (
                        <Access
                            permission={ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.UPDATE}
                            hideChildren
                        >
                            <Tooltip title="Chỉnh sửa">
                                <EditOutlined
                                    style={{
                                        fontSize: 18,
                                        color: "#fa8c16",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => {
                                        setSelected(entity);
                                        setOpenAssign(true);
                                    }}
                                />
                            </Tooltip>
                        </Access>
                    )}
                    {viewMode !== "own" && entity.nextStep && (
                        <Access
                            permission={ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.PROMOTE}
                            hideChildren
                        >
                            <PromoteButton
                                onClick={() => {
                                    setSelected(entity);
                                    setOpenPromote(true);
                                }}
                            />
                        </Access>
                    )}
                </Space>
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div>
            {/* Toolbar */}
            <div style={{ marginBottom: 12 }}>
                <SearchFilter
                    searchPlaceholder="Tìm tên nhân viên, mã NV hoặc lộ trình..."
                    addLabel="Gán lộ trình"
                    showFilterButton={false}
                    onSearch={(val) => setSearchValue(val)}
                    onReset={refetch}
                    onAddClick={() => {
                        setSelected(null);
                        setOpenAssign(true);
                    }}
                    addPermission={ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.ASSIGN}
                />
                {overdueCount > 0 && (
                    <Tag
                        color="error"
                        style={{
                            marginTop: 8,
                            width: "fit-content",
                            borderRadius: 6,
                            padding: "2px 10px",
                            fontWeight: 600,
                            border: "none",
                        }}
                    >
                        <WarningOutlined style={{ marginRight: 4 }} />
                        {overdueCount} nhân viên trễ hạn
                    </Tag>
                )}
            </div>

            {/* Table */}
            <Access permission={ALL_PERMISSIONS.EMPLOYEE_CAREER_PATHS.GET_BY_DEPARTMENT}>
                <DataTable<IEmployeeCareerPath>
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={filtered}
                    scroll={{ x: "max-content" }}   // ← bắt buộc để fixed: "right" hoạt động
                    request={async () =>
                        Promise.resolve({
                            data: filtered,
                            success: true,
                            total: filtered.length,
                        })
                    }
                    pagination={{
                        defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
                        showQuickJumper: true,
                        showTotal: (total, range) => (
                            <div style={{ fontSize: 13 }}>
                                <span style={{ fontWeight: 500 }}>
                                    {range[0]}–{range[1]}
                                </span>{" "}
                                trên{" "}
                                <span
                                    style={{ fontWeight: 600, color: "#1677ff" }}
                                >
                                    {total.toLocaleString()}
                                </span>{" "}
                                lộ trình
                            </div>
                        ),
                    }}
                    rowSelection={false}
                />
            </Access>

            <ModalAssignCareerPath
                open={openAssign}
                onClose={() => {
                    setOpenAssign(false);
                    setSelected(null);
                }}
                dataInit={selected}
                departmentId={Number(departmentId)}
                onSuccess={() => {
                    setOpenAssign(false);
                    refetch();
                }}
            />
            <ModalPromoteEmployee
                open={openPromote}
                onClose={() => {
                    setOpenPromote(false);
                    setSelected(null);
                }}
                dataInit={selected}
                onSuccess={() => {
                    setOpenPromote(false);
                    refetch();
                }}
            />
            <DrawerEmployeeDetail
                open={openDetail}
                onClose={() => {
                    setOpenDetail(false);
                    setSelected(null);
                }}
                dataInit={selected}
            />
        </div>
    );
};

export default EmployeeCareerPathTab;