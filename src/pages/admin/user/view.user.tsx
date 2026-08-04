import type { IUser } from "@/types/backend";
import { Typography, Tag, Tabs } from "antd";
import {
    UserOutlined, MailOutlined, SafetyOutlined, CalendarOutlined,
    PhoneOutlined, IdcardOutlined, ApartmentOutlined,
    UserAddOutlined, InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useUserPositionsQuery } from "@/hooks/useUserPositions";
import { useUserByIdQuery } from "@/hooks/useUsers";
import type { IUserPosition } from "@/types/backend";
import { buildPublicFileUrl } from "@/config/file-utils";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import LotusProfileBanner from "@/components/common/banner/LotusProfileBanner";

const { Text } = Typography;

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IUser | null;
    setDataInit: (v: any) => void;
}

const ACCENT = "#f5317f";
const BORDER = "#e2e8f0";
const BORDER_MED = "#cbd5e1";
const TEXT_MAIN = "#0f172a";
const TEXT_LABEL = "#334155";
const TEXT_MUTED = "#64748b";
const BG_CARD = "#ffffff";
const BG_SUBTLE = "#f8fafc";

const sourceTagConfig: Record<string, { antColor: string; label: string }> = {
    COMPANY: { antColor: "blue", label: "Công ty" },
    DEPARTMENT: { antColor: "cyan", label: "Phòng ban" },
    SECTION: { antColor: "orange", label: "Bộ phận" },
};

const genderLabel: Record<string, string> = {
    MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác",
};

const InfoRow = ({
    icon, label, value, highlight = false, noBorder = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    highlight?: boolean;
    noBorder?: boolean;
}) => (
    <div style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "11px 0",
        borderBottom: noBorder ? "none" : `1px solid ${BORDER}`,
    }}>
        <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: BG_SUBTLE, border: `1px solid ${BORDER_MED}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
        }}>
            <span style={{ fontSize: 14, color: "#475569" }}>{icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 12, color: "#475569", fontWeight: 600, display: "block", marginBottom: 2, letterSpacing: "0.01em" }}>
                {label}
            </Text>
            <Text style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: 600, wordBreak: "break-word" }}>
                {value || "--"}
            </Text>
        </div>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ marginBottom: 14, marginTop: 2 }}>
        <Text style={{
            fontSize: 12, fontWeight: 800, color: "#1e293b",
            textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
        }}>
            {children}
        </Text>
    </div>
);

const SquareBadge = ({ label, antColor }: { label: string; antColor: string }) => (
    <Tag
        color={antColor}
        style={{ borderRadius: 6, fontWeight: 600, fontSize: 12, padding: "1px 10px", margin: 0 }}
    >
        {label}
    </Tag>
);

const PositionsTable = ({ positions, isLoading }: { positions: IUserPosition[]; isLoading: boolean }) => (
    <table style={{
        width: "100%", borderCollapse: "collapse",
        borderRadius: 12, overflow: "hidden",
        border: `1px solid ${BORDER_MED}`,
    }}>
        <thead>
            <tr style={{ background: BG_SUBTLE }}>
                {["Chức danh", "Mã bậc", "Cấp", "Công ty", "Phòng ban", "Bộ phận"].map(h => (
                    <th key={h} style={{
                        padding: "11px 14px", textAlign: "left",
                        fontSize: 11, fontWeight: 700, color: TEXT_LABEL,
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        borderBottom: `1px solid ${BORDER_MED}`,
                    }}>{h}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {isLoading ? (
                <tr>
                    <td colSpan={6} style={{ padding: "28px", textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>
                        Đang tải...
                    </td>
                </tr>
            ) : positions.length === 0 ? (
                <tr>
                    <td colSpan={6} style={{ padding: "36px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: BG_SUBTLE, display: "flex",
                                alignItems: "center", justifyContent: "center",
                                border: `1px solid ${BORDER_MED}`,
                            }}>
                                <ApartmentOutlined style={{ fontSize: 20, color: "#cbd5e1" }} />
                            </div>
                            <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>Chưa có chức danh nào</Text>
                        </div>
                    </td>
                </tr>
            ) : positions.map((r: IUserPosition, idx: number) => {
                const cfg = sourceTagConfig[r.source];
                return (
                    <tr
                        key={r.id}
                        className="detail-pos-row"
                        style={{
                            borderBottom: idx < positions.length - 1 ? `1px solid ${BORDER}` : "none",
                            background: "#fff",
                        }}
                    >
                        <td style={{ padding: "12px 14px" }}>
                            <Text strong style={{ fontSize: 13, color: TEXT_MAIN }}>
                                {r.jobTitle?.nameVi ?? "--"}
                            </Text>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                            <SquareBadge label={r.jobTitle?.positionCode ?? "--"} antColor="purple" />
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                            {cfg
                                ? <SquareBadge label={cfg.label} antColor={cfg.antColor} />
                                : <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>--</Text>
                            }
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: TEXT_LABEL }}>
                            {r.company?.name ?? "--"}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: TEXT_MUTED }}>
                            {r.department?.name ?? "--"}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: TEXT_MUTED }}>
                            {r.section?.name ?? "--"}
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>
);

const PositionCards = ({ positions, isLoading }: { positions: IUserPosition[]; isLoading: boolean }) => {
    if (isLoading) {
        return (
            <div style={{ padding: "24px", textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>
                Đang tải...
            </div>
        );
    }
    if (positions.length === 0) {
        return (
            <div style={{ padding: "32px", textAlign: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: BG_SUBTLE, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        border: `1px solid ${BORDER_MED}`,
                    }}>
                        <ApartmentOutlined style={{ fontSize: 18, color: "#cbd5e1" }} />
                    </div>
                    <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>Chưa có chức danh nào</Text>
                </div>
            </div>
        );
    }
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {positions.map((r: IUserPosition) => {
                const cfg = sourceTagConfig[r.source];
                return (
                    <div key={r.id} style={{
                        border: `1px solid ${BORDER_MED}`,
                        borderRadius: 12,
                        padding: "12px 14px",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                            <Text strong style={{ fontSize: 13, color: TEXT_MAIN }}>
                                {r.jobTitle?.nameVi ?? "--"}
                            </Text>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <SquareBadge label={r.jobTitle?.positionCode ?? "--"} antColor="purple" />
                                {cfg && <SquareBadge label={cfg.label} antColor={cfg.antColor} />}
                            </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                            {r.company?.name && (
                                <Text style={{ fontSize: 12, color: TEXT_LABEL }}>
                                    🏢 {r.company.name}
                                </Text>
                            )}
                            {r.department?.name && (
                                <Text style={{ fontSize: 12, color: TEXT_MUTED }}>
                                    📂 {r.department.name}
                                </Text>
                            )}
                            {r.section?.name && (
                                <Text style={{ fontSize: 12, color: TEXT_MUTED }}>
                                    📌 {r.section.name}
                                </Text>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const ViewDetailUser = ({ open, onClose, dataInit, setDataInit }: IProps) => {

    const userId = dataInit?.id ? String(dataInit.id) : undefined;

    const { data: fullUser } = useUserByIdQuery(open ? userId : undefined);

    const user = fullUser ?? dataInit;
    const info = user?.userInfo;

    const { data: positions = [], isLoading } = useUserPositionsQuery(userId);

    const handleClose = () => { onClose(false); setDataInit(null); };

    const avatarSrc = user?.avatar
        ? buildPublicFileUrl(user.avatar, "avatar")
        : undefined;

    const accountFields = [
        { icon: <MailOutlined />, label: "Email tài khoản", value: user?.email, highlight: true },
        {
            icon: <SafetyOutlined />,
            label: "Vai trò hệ thống",
            value: user?.role?.name ? (
                <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 12 }}>
                    {user.role.name}
                </Tag>
            ) : "--",
        },
        {
            icon: <UserOutlined />,
            label: "Quản lý trực tiếp",
            value: user?.directManager ? `${user.directManager.name} (${user.directManager.email})` : "--",
        },
        {
            icon: <UserOutlined />,
            label: "Quản lý gián tiếp",
            value: user?.indirectManager ? `${user.indirectManager.name} (${user.indirectManager.email})` : "--",
        },
        {
            icon: <UserAddOutlined />,
            label: "Trạng thái tài khoản",
            value: user?.active ? (
                <Tag color="success" style={{ borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 12 }}>
                    Đang hoạt động
                </Tag>
            ) : (
                <Tag color="error" style={{ borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 12 }}>
                    Vô hiệu hóa
                </Tag>
            ),
        },
    ];

    const personnelFields = [
        { icon: <IdcardOutlined />, label: "Mã nhân viên", value: info?.employeeCode, highlight: true },
        { icon: <PhoneOutlined />, label: "Số điện thoại", value: info?.phone || "--" },
        { icon: <UserOutlined />, label: "Giới tính", value: genderLabel[info?.gender ?? ""] || "--" },
        {
            icon: <CalendarOutlined />, label: "Ngày sinh",
            value: info?.dateOfBirth ? dayjs(info.dateOfBirth).format("DD/MM/YYYY") : "--",
        },
        {
            icon: <CalendarOutlined />, label: "Ngày vào làm",
            value: info?.startDate ? dayjs(info.startDate).format("DD/MM/YYYY") : "--",
        },
        {
            icon: <CalendarOutlined />, label: "Ngày ký HĐ",
            value: info?.contractSignDate ? dayjs(info.contractSignDate).format("DD/MM/YYYY") : "--",
        },
        {
            icon: <CalendarOutlined />, label: "Hết hạn HĐ",
            value: info?.contractExpireDate ? dayjs(info.contractExpireDate).format("DD/MM/YYYY") : "--",
        },
    ];

    const tabItems = [
        {
            key: "overview",
            label: (
                <span style={{ fontSize: 13, fontWeight: 700, padding: "0 4px" }}>
                    <InfoCircleOutlined style={{ marginRight: 6 }} />
                    Thông tin tổng quan
                </span>
            ),
            children: (
                <div className="detail-two-col" style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 16, alignItems: "start",
                }}>
                    {/* Account Box */}
                    <div style={{
                        background: BG_CARD, border: `1px solid ${BORDER_MED}`,
                        borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}>
                        <SectionTitle>Tài khoản & Phân quyền</SectionTitle>
                        {accountFields.map((f, idx) => (
                            <InfoRow
                                key={f.label}
                                icon={f.icon}
                                label={f.label}
                                value={f.value}
                                highlight={f.highlight}
                                noBorder={idx === accountFields.length - 1}
                            />
                        ))}
                    </div>

                    {/* Personnel Box */}
                    <div style={{
                        background: BG_CARD, border: `1px solid ${BORDER_MED}`,
                        borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}>
                        <SectionTitle>Thông tin nhân sự</SectionTitle>
                        {personnelFields.map((f, idx) => (
                            <InfoRow
                                key={f.label}
                                icon={f.icon}
                                label={f.label}
                                value={f.value}
                                highlight={f.highlight}
                                noBorder={idx === personnelFields.length - 1}
                            />
                        ))}
                    </div>
                </div>
            ),
        },
        {
            key: "positions",
            label: (
                <span style={{ fontSize: 13, fontWeight: 700, padding: "0 4px" }}>
                    <ApartmentOutlined style={{ marginRight: 6 }} />
                    Chức danh đang giữ ({positions.length})
                </span>
            ),
            children: (
                <div style={{
                    background: BG_CARD, border: `1px solid ${BORDER_MED}`,
                    borderRadius: 16, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}>
                    <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 14,
                    }}>
                        <Text style={{
                            fontSize: 12, fontWeight: 800, color: "#1e293b",
                            textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                            <ApartmentOutlined style={{ marginRight: 8, color: ACCENT }} />
                            Danh sách chức danh tổ chức
                        </Text>
                        {positions.length > 0 && (
                            <Tag style={{
                                borderRadius: 20, margin: 0, fontWeight: 700, fontSize: 11,
                                background: "rgba(245, 49, 127, 0.08)", border: `1px solid ${ACCENT}`, color: ACCENT,
                            }}>
                                {positions.length} chức danh
                            </Tag>
                        )}
                    </div>
                    <div className="pos-table-wrap" style={{ overflowX: "auto" }}>
                        <PositionsTable positions={positions} isLoading={isLoading} />
                    </div>
                    <div className="pos-cards-wrap">
                        <PositionCards positions={positions} isLoading={isLoading} />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <LotusDetailDrawer
            open={open}
            onClose={handleClose}
        >
            <style>{`
                .detail-user-tabs .ant-tabs-nav {
                    margin-bottom: 16px !important;
                    background: #ffffff !important;
                    padding: 0 16px !important;
                    border-radius: 12px !important;
                    border: 1px solid ${BORDER_MED} !important;
                }
                .detail-pos-row:hover td { background: #f8fafc !important; }
                .pos-cards-wrap { display: none; }
                .pos-table-wrap { display: block; }
                @media (max-width: 768px) {
                    .detail-two-col { grid-template-columns: 1fr !important; }
                    .pos-table-wrap { display: none !important; }
                    .pos-cards-wrap { display: block !important; }
                }
            `}</style>
            <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
                {/* ── 1. HEADER BAR ── */}
                <div style={{
                    padding: "16px 24px",
                    background: "#ffffff",
                    borderBottom: `1px solid ${BORDER_MED}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: "rgba(245, 49, 127, 0.08)",
                            border: "1px solid rgba(245, 49, 127, 0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <UserOutlined style={{ fontSize: 20, color: ACCENT }} />
                        </div>
                        <div>
                            <Text style={{ fontSize: 16, fontWeight: 700, color: TEXT_MAIN, display: "block", letterSpacing: "-0.02em" }}>
                                Chi tiết người dùng
                            </Text>
                            <Text style={{ fontSize: 12, color: TEXT_LABEL, fontWeight: 500 }}>
                                Hồ sơ nhân sự & phân quyền hệ thống HRM-LOTUS
                            </Text>
                        </div>
                    </div>
                </div>

                {/* ── 2. SCROLLABLE BODY ── */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                    {/* Shared Lotus Profile Hero Banner */}
                    <LotusProfileBanner
                        avatarSrc={avatarSrc}
                        name={user?.name}
                        subtitle="HỒ SƠ NGƯỜI DÙNG"
                        email={user?.email}
                        roleName={user?.role?.name}
                        employeeCode={info?.employeeCode}
                        active={user?.active}
                        positionsCount={positions.length}
                    />

                    {/* Tabs Navigation & Content */}
                    <Tabs
                        className="detail-user-tabs"
                        defaultActiveKey="overview"
                        items={tabItems}
                    />
                </div>

                {/* ── 3. FOOTER BAR ── */}
                <div style={{
                    padding: "12px 100px 12px 24px",
                    background: "#ffffff",
                    borderTop: `1px solid ${BORDER_MED}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                }}>
                    <Text style={{ fontSize: 12, color: TEXT_LABEL, fontWeight: 500 }}>
                        Tạo bởi: <strong style={{ color: TEXT_MAIN, fontWeight: 700 }}>{user?.createdBy || "--"}</strong>
                        {user?.createdAt && ` (${dayjs(user.createdAt).format("DD/MM/YYYY HH:mm")})`}
                    </Text>
                    <Text style={{ fontSize: 12, color: TEXT_LABEL, fontWeight: 500 }}>
                        Cập nhật bởi: <strong style={{ color: TEXT_MAIN, fontWeight: 700 }}>{user?.updatedBy || "--"}</strong>
                        {user?.updatedAt && ` (${dayjs(user.updatedAt).format("DD/MM/YYYY HH:mm")})`}
                    </Text>
                </div>
            </div>
        </LotusDetailDrawer>
    );
};

export default ViewDetailUser;
