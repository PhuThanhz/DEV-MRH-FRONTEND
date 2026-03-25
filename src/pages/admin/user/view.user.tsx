import type { IUser } from "@/types/backend";
import { Avatar, Modal, Typography, Tag } from "antd";
import {
    UserOutlined, MailOutlined, SafetyOutlined, CalendarOutlined,
    PhoneOutlined, IdcardOutlined, TeamOutlined, ApartmentOutlined,
    CheckCircleFilled, CloseCircleFilled, EditOutlined, UserAddOutlined,
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

// ─── constants ────────────────────────────────────────────────────────────────
const ACCENT = "#f5317f";
const ACCENT_SOFT = "#fff0f6";
const BORDER = "#f0f0f0";
const TEXT_MAIN = "#111827";
const TEXT_LABEL = "#6b7280";
const TEXT_MUTED = "#9ca3af";

const sourceTagConfig: Record<string, { color: string; bg: string; label: string }> = {
    COMPANY: { color: "#1d4ed8", bg: "#eff6ff", label: "Công ty" },
    DEPARTMENT: { color: "#15803d", bg: "#f0fdf4", label: "Phòng ban" },
    SECTION: { color: "#c2410c", bg: "#fff7ed", label: "Bộ phận" },
};

const genderLabel: Record<string, string> = {
    MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác",
};

// ─── sub-components ───────────────────────────────────────────────────────────
const InfoRow = ({
    icon, label, value, highlight = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    highlight?: boolean;
}) => (
    <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 0",
        borderBottom: `1px solid ${BORDER}`,
    }}>
        <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "#f7f7f8",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
        }}>
            <span style={{ fontSize: 13, color: TEXT_MUTED }}>{icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 1, letterSpacing: "0.02em" }}>
                {label}
            </Text>
            <Text style={{
                fontSize: 13, color: highlight ? TEXT_MAIN : TEXT_MAIN,
                fontWeight: highlight ? 600 : 400,
                wordBreak: "break-all",
            }}>
                {value || "--"}
            </Text>
        </div>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 4, marginTop: 4,
    }}>
        <Text style={{
            fontSize: 11, fontWeight: 700, color: TEXT_MUTED,
            textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
            {children}
        </Text>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
);

// ─── main ─────────────────────────────────────────────────────────────────────
const ViewDetailUser = ({ open, onClose, dataInit, setDataInit }: IProps) => {

    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const userId = dataInit?.id ? Number(dataInit.id) : undefined;
    const { data: positions = [], isLoading } = useUserPositionsQuery(userId);

    const handleClose = () => { onClose(false); setDataInit(null); };

    const avatarSrc = dataInit?.avatar
        ? `${backendURL}/storage/AVATAR/${dataInit.avatar}`
        : undefined;

    return (
        <>
            <style>{`
                .detail-modal .ant-modal-content {
                    border-radius: 20px !important;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06) !important;
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

                /* position table */
                .detail-pos-table .ant-table {
                    border-radius: 12px !important;
                    overflow: hidden !important;
                    border: 1.5px solid #f0f0f0 !important;
                    font-size: 13px !important;
                }
                .detail-pos-table .ant-table-thead > tr > th {
                    background: #fafafa !important;
                    color: #6b7280 !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    border-bottom: 1.5px solid #f0f0f0 !important;
                    padding: 9px 14px !important;
                }
                .detail-pos-table .ant-table-tbody > tr > td {
                    padding: 11px 14px !important;
                    border-bottom: 1px solid #f7f7f8 !important;
                }
                .detail-pos-table .ant-table-tbody > tr:last-child > td {
                    border-bottom: none !important;
                }
                .detail-pos-table .ant-table-tbody > tr:hover > td {
                    background: #fafafa !important;
                }
                .detail-pos-table .ant-table-placeholder td {
                    border-bottom: none !important;
                }
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
                    mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.25)" },
                }}
            >
                {/* ══ PROFILE HEADER ══════════════════════════════════════════ */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "14px 18px",
                    background: "#fafafa",
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 14,
                    marginBottom: 18,
                }}>
                    <Avatar
                        size={64}
                        src={avatarSrc}
                        icon={<UserOutlined />}
                        style={{
                            border: "3px solid #fff",
                            boxShadow: "0 4px 14px rgba(245,49,127,0.15)",
                            background: "#f5f5f5",
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                            <Text style={{ fontSize: 17, fontWeight: 700, color: TEXT_MAIN, letterSpacing: "-0.03em" }}>
                                {dataInit?.name || "--"}
                            </Text>
                            {dataInit?.active ? (
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 11, fontWeight: 600, color: "#15803d",
                                    background: "#f0fdf4", padding: "2px 9px", borderRadius: 20,
                                    border: "1px solid #bbf7d0",
                                }}>
                                    <CheckCircleFilled style={{ fontSize: 10 }} /> Hoạt động
                                </span>
                            ) : (
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    fontSize: 11, fontWeight: 600, color: "#dc2626",
                                    background: "#fef2f2", padding: "2px 9px", borderRadius: 20,
                                    border: "1px solid #fecaca",
                                }}>
                                    <CloseCircleFilled style={{ fontSize: 10 }} /> Vô hiệu hóa
                                </span>
                            )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                            <Text style={{ fontSize: 13, color: TEXT_LABEL }}>
                                <MailOutlined style={{ marginRight: 5, color: TEXT_MUTED }} />
                                {dataInit?.email || "--"}
                            </Text>
                            {dataInit?.role && (
                                <span style={{
                                    fontSize: 12, fontWeight: 500, color: ACCENT,
                                    background: ACCENT_SOFT, padding: "1px 10px", borderRadius: 20,
                                    border: `1px solid #fbb6ce`,
                                }}>
                                    <SafetyOutlined style={{ marginRight: 4, fontSize: 11 }} />
                                    {dataInit.role.name}
                                </span>
                            )}
                            {dataInit?.userInfo?.employeeCode && (
                                <Text style={{ fontSize: 12, color: TEXT_MUTED }}>
                                    <IdcardOutlined style={{ marginRight: 4 }} />
                                    {dataInit.userInfo.employeeCode}
                                </Text>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══ TWO-COLUMN LAYOUT ═══════════════════════════════════════ */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>

                    {/* ── col 1: Tài khoản ── */}
                    <div style={{
                        background: "#fff", border: `1.5px solid ${BORDER}`,
                        borderRadius: 14, padding: "14px 16px",
                    }}>
                        <SectionTitle>Tài khoản</SectionTitle>
                        <InfoRow icon={<MailOutlined />} label="Email" value={dataInit?.email} highlight />
                        <InfoRow icon={<SafetyOutlined />} label="Vai trò" value={dataInit?.role?.name} />
                        <div style={{ paddingTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 7, background: "#f7f7f8",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                                <UserAddOutlined style={{ fontSize: 13, color: TEXT_MUTED }} />
                            </div>
                            <div>
                                <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block" }}>Người tạo</Text>
                                <Text style={{ fontSize: 13 }}>{dataInit?.createdBy || "--"}</Text>
                            </div>
                            <div style={{ width: 1, height: 30, background: BORDER, margin: "0 4px" }} />
                            <div>
                                <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block" }}>Người sửa</Text>
                                <Text style={{ fontSize: 13 }}>{dataInit?.updatedBy || "--"}</Text>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                            <div style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 1 }}>Ngày tạo</Text>
                                <Text style={{ fontSize: 12, color: TEXT_LABEL }}>
                                    {dataInit?.createdAt ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm") : "--"}
                                </Text>
                            </div>
                            <div style={{ flex: 1 }}>
                                <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 1 }}>Ngày sửa</Text>
                                <Text style={{ fontSize: 12, color: TEXT_LABEL }}>
                                    {dataInit?.updatedAt ? dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm") : "--"}
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* ── col 2: Thông tin nhân sự ── */}
                    <div style={{
                        background: "#fff", border: `1.5px solid ${BORDER}`,
                        borderRadius: 14, padding: "14px 16px",
                    }}>
                        <SectionTitle>Nhân sự</SectionTitle>
                        {dataInit?.userInfo ? (
                            <>
                                <InfoRow icon={<IdcardOutlined />} label="Mã nhân viên" value={dataInit.userInfo.employeeCode} highlight />
                                <InfoRow icon={<PhoneOutlined />} label="Số điện thoại" value={dataInit.userInfo.phone} />
                                <InfoRow
                                    icon={<UserOutlined />}
                                    label="Giới tính"
                                    value={genderLabel[dataInit.userInfo.gender ?? ""] ?? "--"}
                                />
                                <InfoRow
                                    icon={<CalendarOutlined />}
                                    label="Ngày sinh"
                                    value={dataInit.userInfo.dateOfBirth
                                        ? dayjs(dataInit.userInfo.dateOfBirth).format("DD/MM/YYYY")
                                        : "--"}
                                />
                                <InfoRow
                                    icon={<CalendarOutlined />}
                                    label="Ngày vào làm"
                                    value={dataInit.userInfo.startDate
                                        ? dayjs(dataInit.userInfo.startDate).format("DD/MM/YYYY")
                                        : "--"}
                                />
                                <div style={{ paddingTop: 10, borderTop: `1px solid ${BORDER}`, marginTop: 2 }}>
                                    <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 3 }}>
                                        Ngày ký hợp đồng
                                    </Text>
                                    <Text style={{ fontSize: 13, color: TEXT_MAIN }}>
                                        {dataInit.userInfo.contractSignDate
                                            ? dayjs(dataInit.userInfo.contractSignDate).format("DD/MM/YYYY")
                                            : "--"}
                                    </Text>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: "24px 0", textAlign: "center" }}>
                                <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>Chưa có thông tin nhân sự</Text>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ POSITIONS TABLE ══════════════════════════════════════════ */}
                <div className="detail-pos-table">
                    <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 8,
                    }}>
                        <Text style={{
                            fontSize: 11, fontWeight: 700, color: TEXT_MUTED,
                            textTransform: "uppercase", letterSpacing: "0.07em",
                        }}>
                            <ApartmentOutlined style={{ marginRight: 6 }} />
                            Chức danh đang giữ
                        </Text>
                        {positions.length > 0 && (
                            <span style={{
                                fontSize: 11, fontWeight: 700, color: ACCENT,
                                background: ACCENT_SOFT, padding: "2px 10px", borderRadius: 20,
                            }}>
                                {positions.length} chức danh
                            </span>
                        )}
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, overflow: "hidden", border: `1.5px solid ${BORDER}` }}>
                        <thead>
                            <tr style={{ background: "#fafafa" }}>
                                {["Chức danh", "Mã bậc", "Cấp", "Công ty", "Phòng ban", "Bộ phận"].map(h => (
                                    <th key={h} style={{
                                        padding: "9px 14px", textAlign: "left",
                                        fontSize: 11, fontWeight: 600, color: TEXT_LABEL,
                                        textTransform: "uppercase", letterSpacing: "0.05em",
                                        borderBottom: `1.5px solid ${BORDER}`,
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
                                                background: "#f7f7f8", display: "flex",
                                                alignItems: "center", justifyContent: "center",
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
                                    <tr key={r.id} style={{ borderBottom: idx < positions.length - 1 ? `1px solid #f7f7f8` : "none" }}>
                                        <td style={{ padding: "11px 14px" }}>
                                            <Text strong style={{ fontSize: 13, color: TEXT_MAIN }}>{r.jobTitle?.nameVi ?? "--"}</Text>
                                        </td>
                                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                            <span style={{
                                                display: "inline-block", padding: "2px 10px", borderRadius: 20,
                                                background: "#f5f0ff", color: "#6d28d9", fontSize: 12, fontWeight: 600,
                                            }}>
                                                {r.jobTitle?.positionCode ?? "--"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                                            {cfg ? (
                                                <span style={{
                                                    display: "inline-block", padding: "2px 10px", borderRadius: 20,
                                                    background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 500,
                                                }}>
                                                    {cfg.label}
                                                </span>
                                            ) : "--"}
                                        </td>
                                        <td style={{ padding: "11px 14px", fontSize: 13, color: TEXT_LABEL }}>{r.company?.name ?? "--"}</td>
                                        <td style={{ padding: "11px 14px", fontSize: 13, color: TEXT_MUTED }}>{r.department?.name ?? "--"}</td>
                                        <td style={{ padding: "11px 14px", fontSize: 13, color: TEXT_MUTED }}>{r.section?.name ?? "--"}</td>
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