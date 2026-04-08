import type { IUser } from "@/types/backend";
import { Avatar, Modal, Typography, Tag } from "antd";
import {
    UserOutlined, MailOutlined, SafetyOutlined, CalendarOutlined,
    PhoneOutlined, IdcardOutlined, ApartmentOutlined,
    CheckCircleFilled, CloseCircleFilled, UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useUserPositionsQuery } from "@/hooks/useUserPositions";
import type { IUserPosition } from "@/types/backend";

const { Text } = Typography;

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IUser | null;
    setDataInit: (v: any) => void;
}

const ACCENT = "#f5317f";
const BORDER = "#f0f0f0";
const BORDER_MED = "#e5e7eb";
const TEXT_MAIN = "#111827";
const TEXT_LABEL = "#6b7280";
const TEXT_MUTED = "#9ca3af";
const BG_CARD = "#ffffff";
const BG_SUBTLE = "#fafafa";

const sourceTagConfig: Record<string, { antColor: string; label: string }> = {
    COMPANY: { antColor: "blue", label: "Công ty" },
    DEPARTMENT: { antColor: "cyan", label: "Phòng ban" },
    SECTION: { antColor: "orange", label: "Bộ phận" },
};

const genderLabel: Record<string, string> = {
    MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác",
};
// ── InfoRow ───────────────────────────────────────────────────────────────────
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
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "9px 0",
        borderBottom: noBorder ? "none" : `1px solid ${BORDER}`,
    }}>
        <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: BG_SUBTLE,
            border: `1px solid ${BORDER_MED}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
        }}>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>{icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 2, letterSpacing: "0.02em" }}>
                {label}
            </Text>
            <Text style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: highlight ? 600 : 400 }}>
                {value || "--"}
            </Text>
        </div>
    </div>
);
// ── SectionTitle ──────────────────────────────────────────────────────────────
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 2 }}>
        <Text style={{
            fontSize: 11, fontWeight: 700, color: TEXT_MUTED,
            textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap",
        }}>
            {children}
        </Text>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
);
// ── SquareBadge dùng Ant Tag ──────────────────────────────────────────────────
const SquareBadge = ({ label, antColor }: { label: string; antColor: string }) => (
    <Tag
        color={antColor}
        style={{ borderRadius: 6, fontWeight: 600, fontSize: 12, padding: "1px 10px", margin: 0 }}
    >
        {label}
    </Tag>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const ViewDetailUser = ({ open, onClose, dataInit, setDataInit }: IProps) => {

    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const userId = dataInit?.id ? Number(dataInit.id) : undefined;
    const { data: positions = [], isLoading } = useUserPositionsQuery(userId);

    const handleClose = () => { onClose(false); setDataInit(null); };

    // ── cùng URL pattern với UserPage ──
    const avatarSrc = dataInit?.avatar
        ? `${backendURL}/uploads/avatar/${dataInit.avatar}?t=${Date.now()}`
        : undefined;

    const info = dataInit?.userInfo;

    const hrFields = [
        { icon: <IdcardOutlined />, label: "Mã nhân viên", value: info?.employeeCode, highlight: true },
        { icon: <PhoneOutlined />, label: "Số điện thoại", value: info?.phone },
        { icon: <UserOutlined />, label: "Giới tính", value: genderLabel[info?.gender ?? ""] },
        {
            icon: <CalendarOutlined />, label: "Ngày sinh",
            value: info?.dateOfBirth ? dayjs(info.dateOfBirth).format("DD/MM/YYYY") : undefined,
        },
        {
            icon: <CalendarOutlined />, label: "Ngày vào làm",
            value: info?.startDate ? dayjs(info.startDate).format("DD/MM/YYYY") : undefined,
        },
        {
            icon: <CalendarOutlined />, label: "Ngày ký HĐ",
            value: info?.contractSignDate ? dayjs(info.contractSignDate).format("DD/MM/YYYY") : undefined,
        },
    ].filter((f) => f.value && f.value !== "--");
    return (
        <>
            <style>{`
                .detail-modal .ant-modal-content {
                    border-radius: 20px !important;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.05) !important;
                    overflow: hidden;
                    padding: 0 !important;
                }
                .detail-modal .ant-modal-header {
                    padding: 20px 24px 0 24px !important;
                    border-bottom: none !important;
                    background: #fff !important;
                    margin-bottom: 0 !important;
                }
                .detail-modal .ant-modal-title {
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    color: ${TEXT_MAIN} !important;
                    letter-spacing: -0.03em !important;
                }
                .detail-modal .ant-modal-body {
                    padding: 16px 24px 24px !important;
                    overflow-y: auto !important;
                    max-height: 85vh !important;
                }
                .detail-modal .ant-modal-close {
                    top: 18px !important; right: 20px !important;
                    width: 30px !important; height: 30px !important;
                    border-radius: 8px !important;
                    background: #f7f7f8 !important;
                    border: 1.5px solid #efefef !important;
                    display: flex !important; align-items: center !important;
                    justify-content: center !important; transition: all 0.2s !important;
                }
                .detail-modal .ant-modal-close:hover {
                    background: #f0f0f0 !important; border-color: #e0e0e0 !important;
                }
                .detail-modal .ant-modal-close .ant-modal-close-x {
                    width: 30px !important; height: 30px !important;
                    line-height: 30px !important; font-size: 12px !important;
                    color: #6b7280 !important;
                }

                /* zebra row hover */
                .detail-pos-row:hover td { background: #fafafa !important; }
            `}</style>
            <Modal
                title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết người dùng</span>}
                open={open}
                onCancel={handleClose}
                footer={null}
                width="72vw"
                centered
                className="detail-modal"
                styles={{
                    mask: { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.2)" },
                }}
            >
                {/* ══ PROFILE HEADER ══════════════════════════════════════════ */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "14px 18px",
                    background: BG_SUBTLE,
                    border: `1.5px solid ${BORDER_MED}`,
                    borderRadius: 14,
                    marginBottom: 16,
                }}>
                    <Avatar
                        size={80}
                        src={avatarSrc}
                        onError={() => true} // fallback nếu lỗi ảnh
                        style={{
                            border: "2px solid #e5e7eb",
                            outline: "3px solid #fff",
                            outlineOffset: "-1px",
                            background: "#f3f4f6",
                            color: "#9ca3af",
                            flexShrink: 0,
                        }}
                    >
                        {dataInit?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                            <Text style={{ fontSize: 16, fontWeight: 700, color: TEXT_MAIN, letterSpacing: "-0.03em" }}>
                                {dataInit?.name || "--"}
                            </Text>
                            {dataInit?.active ? (
                                <Tag
                                    icon={<CheckCircleFilled />}
                                    color="success"
                                    style={{ borderRadius: 20, margin: 0, fontWeight: 600, fontSize: 11 }}
                                >
                                    Hoạt động
                                </Tag>
                            ) : (
                                <Tag
                                    icon={<CloseCircleFilled />}
                                    color="error"
                                    style={{ borderRadius: 20, margin: 0, fontWeight: 600, fontSize: 11 }}
                                >
                                    Vô hiệu hóa
                                </Tag>
                            )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <Text style={{ fontSize: 13, color: TEXT_LABEL }}>
                                <MailOutlined style={{ marginRight: 5, color: TEXT_MUTED }} />
                                {dataInit?.email || "--"}
                            </Text>
                            {dataInit?.role?.name && (
                                <Tag
                                    style={{
                                        borderRadius: 20, margin: 0, fontWeight: 500, fontSize: 12,
                                        background: "transparent", border: `1px solid ${BORDER_MED}`,
                                        color: TEXT_LABEL,
                                    }}
                                >
                                    <SafetyOutlined style={{ marginRight: 4 }} />
                                    {dataInit.role.name}
                                </Tag>
                            )}
                            {info?.employeeCode && (
                                <Tag
                                    style={{
                                        borderRadius: 20, margin: 0, fontSize: 12,
                                        background: "transparent", border: `1px solid ${BORDER_MED}`,
                                        color: TEXT_MUTED,
                                    }}
                                >
                                    <IdcardOutlined style={{ marginRight: 4 }} />
                                    {info.employeeCode}
                                </Tag>
                            )}
                        </div>
                    </div>
                </div>
                {/* ══ TWO-COLUMN ══════════════════════════════════════════════ */}
                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 14, marginBottom: 16, alignItems: "start",
                }}>
                    {/* ── Tài khoản ── */}
                    <div style={{
                        background: BG_CARD, border: `1.5px solid ${BORDER_MED}`,
                        borderRadius: 14, padding: "14px 16px",
                    }}>
                        <SectionTitle>Tài khoản</SectionTitle>

                        <InfoRow icon={<MailOutlined />} label="Email" value={dataInit?.email} highlight />
                        <InfoRow
                            icon={<SafetyOutlined />}
                            label="Vai trò"
                            value={
                                dataInit?.role?.name
                                    ? <Tag style={{ borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 12 }}>{dataInit.role.name}</Tag>
                                    : "--"
                            }
                        />
                        {/* Người tạo / sửa */}
                        <div style={{
                            display: "flex", alignItems: "flex-start", gap: 10,
                            padding: "9px 0", borderBottom: `1px solid ${BORDER}`,
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: BG_SUBTLE, border: `1px solid ${BORDER_MED}`,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                            }}>
                                <UserAddOutlined style={{ fontSize: 12, color: TEXT_MUTED }} />
                            </div>
                            <div style={{ display: "flex", gap: 20 }}>
                                <div>
                                    <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 2 }}>Người tạo</Text>
                                    <Text style={{ fontSize: 13, color: TEXT_MAIN }}>{dataInit?.createdBy || "--"}</Text>
                                </div>
                                <div style={{ width: 1, height: 28, background: BORDER, alignSelf: "center" }} />
                                <div>
                                    <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 2 }}>Người sửa</Text>
                                    <Text style={{ fontSize: 13, color: TEXT_MAIN }}>{dataInit?.updatedBy || "--"}</Text>
                                </div>
                            </div>
                        </div>
                        {/* Ngày tạo / sửa — dùng nền xám cực nhạt, không có màu */}
                        <div style={{ display: "flex", gap: 10, paddingTop: 10 }}>
                            <div style={{
                                flex: 1, background: BG_SUBTLE, borderRadius: 8,
                                padding: "7px 10px", border: `1px solid ${BORDER}`,
                            }}>
                                <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 2 }}>Ngày tạo</Text>
                                <Text style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 500 }}>
                                    {dataInit?.createdAt ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm") : "--"}
                                </Text>
                            </div>
                            <div style={{
                                flex: 1, background: BG_SUBTLE, borderRadius: 8,
                                padding: "7px 10px", border: `1px solid ${BORDER}`,
                            }}>
                                <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 2 }}>Ngày sửa</Text>
                                <Text style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 500 }}>
                                    {dataInit?.updatedAt ? dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm") : "--"}
                                </Text>
                            </div>
                        </div>
                    </div>
                    {/* ── Nhân sự ── */}
                    <div style={{
                        background: BG_CARD, border: `1.5px solid ${BORDER_MED}`,
                        borderRadius: 14, padding: "14px 16px",
                    }}>
                        <SectionTitle>Nhân sự</SectionTitle>
                        {!info || hrFields.length === 0 ? (
                            <div style={{ padding: "20px 0", textAlign: "center" }}>
                                <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>Chưa có thông tin nhân sự</Text>
                            </div>
                        ) : (
                            hrFields.map((f, idx) => (
                                <InfoRow
                                    key={f.label}
                                    icon={f.icon}
                                    label={f.label}
                                    value={f.value}
                                    highlight={f.highlight}
                                    noBorder={idx === hrFields.length - 1}
                                />
                            ))
                        )}
                    </div>
                </div>
                {/* ══ POSITIONS TABLE ══════════════════════════════════════════ */}
                <div>
                    <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 10,
                    }}>
                        <Text style={{
                            fontSize: 11, fontWeight: 700, color: TEXT_MUTED,
                            textTransform: "uppercase", letterSpacing: "0.07em",
                        }}>
                            <ApartmentOutlined style={{ marginRight: 6 }} />
                            Chức danh đang giữ
                        </Text>
                        {positions.length > 0 && (
                            <Tag style={{
                                borderRadius: 20, margin: 0, fontWeight: 700, fontSize: 11,
                                background: "transparent", border: `1px solid ${ACCENT}`, color: ACCENT,
                            }}>
                                {positions.length} chức danh
                            </Tag>
                        )}
                    </div>

                    <table style={{
                        width: "100%", borderCollapse: "collapse",
                        borderRadius: 12, overflow: "hidden",
                        border: `1.5px solid ${BORDER_MED}`,
                    }}>
                        <thead>
                            <tr style={{ background: BG_SUBTLE }}>
                                {["Chức danh", "Mã bậc", "Cấp", "Công ty", "Phòng ban", "Bộ phận"].map(h => (
                                    <th key={h} style={{
                                        padding: "10px 14px", textAlign: "left",
                                        fontSize: 11, fontWeight: 700, color: TEXT_LABEL,
                                        textTransform: "uppercase", letterSpacing: "0.05em",
                                        borderBottom: `1.5px solid ${BORDER_MED}`,
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : positions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: "32px", textAlign: "center" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10,
                                                background: BG_SUBTLE, display: "flex",
                                                alignItems: "center", justifyContent: "center",
                                                border: `1px solid ${BORDER_MED}`,
                                            }}>
                                                <ApartmentOutlined style={{ fontSize: 18, color: "#d1d5db" }} />
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
                                        <td style={{ padding: "11px 14px" }}>
                                            <Text strong style={{ fontSize: 13, color: TEXT_MAIN }}>
                                                {r.jobTitle?.nameVi ?? "--"}
                                            </Text>
                                        </td>
                                        <td style={{ padding: "11px 14px" }}>
                                            <SquareBadge label={r.jobTitle?.positionCode ?? "--"} antColor="purple" />
                                        </td>
                                        <td style={{ padding: "11px 14px" }}>
                                            {cfg
                                                ? <SquareBadge label={cfg.label} antColor={cfg.antColor} />
                                                : <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>--</Text>
                                            }
                                        </td>
                                        <td style={{ padding: "11px 14px", fontSize: 13, color: TEXT_LABEL }}>
                                            {r.company?.name ?? "--"}
                                        </td>
                                        <td style={{ padding: "11px 14px", fontSize: 13, color: TEXT_MUTED }}>
                                            {r.department?.name ?? "--"}
                                        </td>
                                        <td style={{ padding: "11px 14px", fontSize: 13, color: TEXT_MUTED }}>
                                            {r.section?.name ?? "--"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </>
    );
};

export default ViewDetailUser;