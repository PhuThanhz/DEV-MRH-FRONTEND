import type { IEmployee } from "@/types/backend";
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
    dataInit: IEmployee | null;
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

/* ─── tiny sub-components (logic unchanged) ─── */

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
            background: BG_SUBTLE, border: `1px solid ${BORDER_MED}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
        }}>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>{icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 2, letterSpacing: "0.02em" }}>
                {label}
            </Text>
            <Text style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: highlight ? 600 : 400, wordBreak: "break-word" }}>
                {value || "--"}
            </Text>
        </div>
    </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 2 }}>
        <Text style={{
            fontSize: 11, fontWeight: 700, color: TEXT_MUTED,
            textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap",
        }}>
            {children}
        </Text>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
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

/* ─── main component ─── */

const ViewDetailEmployee = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    const userId = dataInit?.id ? String(dataInit.id) : undefined;
    const { data: positions = [], isLoading } = useUserPositionsQuery(userId);

    const handleClose = () => { onClose(false); setDataInit(null); };

    const avatarSrc = dataInit?.avatar
        ? `${backendURL}/api/v1/files?fileName=${dataInit.avatar}&folder=avatar`
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
        {
            icon: <CalendarOutlined />, label: "Hết hạn HĐ",
            value: info?.contractExpireDate ? dayjs(info.contractExpireDate).format("DD/MM/YYYY") : undefined,
        },
    ].filter((f) => f.value && f.value !== "--");

    /* width: dùng JS để đảm bảo override hoàn toàn trên mọi thiết bị */
    const modalWidth = typeof window !== "undefined"
        ? window.innerWidth <= 600
            ? "calc(100vw - 16px)"
            : window.innerWidth <= 900
                ? "calc(100vw - 32px)"
                : "72vw"
        : "72vw";

    return (
        <>
            <style>{`
                /* ── Modal chrome ── */
                .employee-detail-modal .ant-modal-content {
                    border-radius: 20px !important;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.05) !important;
                    overflow: hidden;
                    padding: 0 !important;
                }
                .employee-detail-modal .ant-modal-header {
                    padding: 18px 20px 0 20px !important;
                    border-bottom: none !important;
                    background: #fff !important;
                    margin-bottom: 0 !important;
                }
                .employee-detail-modal .ant-modal-title {
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    color: ${TEXT_MAIN} !important;
                    letter-spacing: -0.03em !important;
                }
                .employee-detail-modal .ant-modal-body {
                    padding: 14px 20px 22px !important;
                    overflow-y: auto !important;
                    max-height: 90vh !important;
                }
                .employee-detail-modal .ant-modal-close {
                    top: 16px !important; right: 18px !important;
                    width: 28px !important; height: 28px !important;
                    border-radius: 8px !important;
                    background: #f7f7f8 !important;
                    border: 1.5px solid #efefef !important;
                    display: flex !important; align-items: center !important;
                    justify-content: center !important; transition: all 0.2s !important;
                }
                .employee-detail-modal .ant-modal-close:hover {
                    background: #f0f0f0 !important; border-color: #e0e0e0 !important;
                }
                .employee-detail-modal .ant-modal-close .ant-modal-close-x {
                    width: 28px !important; height: 28px !important;
                    line-height: 28px !important; font-size: 11px !important;
                    color: #6b7280 !important;
                }

                /* ── force modal width override on mobile ── */
                @media (max-width: 900px) {
                    .employee-detail-modal.ant-modal,
                    .employee-detail-modal {
                        width: calc(100vw - 32px) !important;
                        max-width: calc(100vw - 32px) !important;
                        margin: 16px auto !important;
                    }
                }
                @media (max-width: 600px) {
                    .employee-detail-modal.ant-modal,
                    .employee-detail-modal {
                        width: calc(100vw - 16px) !important;
                        max-width: calc(100vw - 16px) !important;
                        margin: 8px auto !important;
                    }
                    .employee-detail-modal .ant-modal-body {
                        padding: 12px 14px 18px !important;
                    }
                    .employee-detail-modal .ant-modal-header {
                        padding: 14px 14px 0 14px !important;
                    }
                }

                /* ── row hover ── */
                .emp-pos-row:hover td { background: #fafafa !important; }

                /* ── two-column grid: 2 col desktop → 1 col mobile ── */
                .emp-two-col {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 14px;
                    align-items: start;
                }
                @media (max-width: 600px) {
                    .emp-two-col { grid-template-columns: 1fr !important; }
                }

                /* ── date boxes always side by side ── */
                .emp-date-boxes {
                    display: flex;
                    gap: 8px;
                    padding-top: 10px;
                }
                .emp-date-box {
                    flex: 1;
                    min-width: 0;
                    background: ${BG_SUBTLE};
                    border-radius: 8px;
                    padding: 7px 10px;
                    border: 1px solid ${BORDER};
                }

                /* ── positions: scroll on tablet, cards on mobile ── */
                .emp-positions-wrapper {
                    overflow-x: auto;
                    border-radius: 12px;
                    border: 1.5px solid ${BORDER_MED};
                }
                .emp-positions-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 480px;
                }
                @media (max-width: 600px) {
                    .emp-positions-wrapper {
                        border: none !important;
                        overflow-x: visible !important;
                        border-radius: 0 !important;
                    }
                    .emp-positions-table {
                        min-width: unset !important;
                        width: 100% !important;
                    }
                    .emp-positions-table thead { display: none !important; }
                    .emp-positions-table tbody tr.emp-pos-row {
                        display: block !important;
                        border: 1.5px solid ${BORDER_MED} !important;
                        border-radius: 10px !important;
                        margin-bottom: 10px !important;
                        overflow: hidden;
                        background: #fff !important;
                    }
                    .emp-positions-table tbody tr.emp-pos-row:last-child { margin-bottom: 0 !important; }
                    .emp-positions-table td {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        padding: 8px 12px !important;
                        border-bottom: 1px solid ${BORDER} !important;
                        font-size: 12px !important;
                    }
                    .emp-positions-table td:last-child { border-bottom: none !important; }
                    .emp-positions-table td::before {
                        content: attr(data-label);
                        font-size: 11px;
                        color: ${TEXT_MUTED};
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        flex-shrink: 0;
                        margin-right: 8px;
                    }
                }
            `}</style>

            <Modal
                title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết nhân viên</span>}
                open={open}
                onCancel={handleClose}
                footer={null}
                width={modalWidth}
                centered
                className="employee-detail-modal"
                styles={{
                    mask: { backdropFilter: "blur(6px)", background: "rgba(0,0,0,0.2)" },
                }}
            >
                {/* ══ PROFILE HEADER ══ */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 14px",
                    background: BG_SUBTLE,
                    border: `1.5px solid ${BORDER_MED}`,
                    borderRadius: 14,
                    marginBottom: 14,
                }}>
                    <Avatar
                        size={52}
                        src={avatarSrc}
                        icon={<UserOutlined />}
                        style={{
                            border: "2px solid #e5e7eb",
                            background: "#f3f4f6",
                            color: "#9ca3af",
                            flexShrink: 0,
                        }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Tên + trạng thái */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                            <Text style={{
                                fontSize: 14, fontWeight: 700, color: TEXT_MAIN,
                                letterSpacing: "-0.02em", wordBreak: "break-word",
                            }}>
                                {dataInit?.name || "--"}
                            </Text>
                            {dataInit?.active ? (
                                <Tag icon={<CheckCircleFilled />} color="success"
                                    style={{ borderRadius: 20, margin: 0, fontWeight: 600, fontSize: 11, flexShrink: 0 }}>
                                    Hoạt động
                                </Tag>
                            ) : (
                                <Tag icon={<CloseCircleFilled />} color="error"
                                    style={{ borderRadius: 20, margin: 0, fontWeight: 600, fontSize: 11, flexShrink: 0 }}>
                                    Vô hiệu hóa
                                </Tag>
                            )}
                        </div>
                        {/* Email + role + mã */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <Text style={{ fontSize: 12, color: TEXT_LABEL, wordBreak: "break-all" }}>
                                <MailOutlined style={{ marginRight: 4, color: TEXT_MUTED }} />
                                {dataInit?.email || "--"}
                            </Text>
                            {dataInit?.role?.name && (
                                <Tag style={{
                                    borderRadius: 20, margin: 0, fontWeight: 500, fontSize: 11,
                                    background: "transparent", border: `1px solid ${BORDER_MED}`,
                                    color: TEXT_LABEL, flexShrink: 0,
                                }}>
                                    <SafetyOutlined style={{ marginRight: 3 }} />
                                    {dataInit.role.name}
                                </Tag>
                            )}
                            {info?.employeeCode && (
                                <Tag style={{
                                    borderRadius: 20, margin: 0, fontSize: 11,
                                    background: "transparent", border: `1px solid ${BORDER_MED}`,
                                    color: TEXT_MUTED, flexShrink: 0,
                                }}>
                                    <IdcardOutlined style={{ marginRight: 3 }} />
                                    {info.employeeCode}
                                </Tag>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══ TWO-COLUMN ══ */}
                <div className="emp-two-col">

                    {/* ── Tài khoản ── */}
                    <div style={{
                        background: BG_CARD, border: `1.5px solid ${BORDER_MED}`,
                        borderRadius: 14, padding: "14px 14px",
                    }}>
                        <SectionTitle>Tài khoản</SectionTitle>

                        <InfoRow icon={<MailOutlined />} label="Email" value={dataInit?.email} highlight />
                        <InfoRow
                            icon={<SafetyOutlined />}
                            label="Vai trò"
                            value={
                                dataInit?.role?.name
                                    ? <Tag style={{ borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 12 }}>
                                        {dataInit.role.name}
                                    </Tag>
                                    : "--"
                            }
                        />

                        {/* Người tạo / Người sửa */}
                        <div style={{
                            display: "flex", alignItems: "flex-start", gap: 10,
                            padding: "9px 0", borderBottom: `1px solid ${BORDER}`,
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: BG_SUBTLE, border: `1px solid ${BORDER_MED}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0, marginTop: 1,
                            }}>
                                <UserAddOutlined style={{ fontSize: 12, color: TEXT_MUTED }} />
                            </div>
                            <div style={{ display: "flex", flex: 1, minWidth: 0, gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 2 }}>Người tạo</Text>
                                    <Text style={{ fontSize: 13, color: TEXT_MAIN, wordBreak: "break-word" }}>
                                        {dataInit?.createdBy || "--"}
                                    </Text>
                                </div>
                                <div style={{ width: 1, background: BORDER, alignSelf: "stretch", flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 2 }}>Người sửa</Text>
                                    <Text style={{ fontSize: 13, color: TEXT_MAIN, wordBreak: "break-word" }}>
                                        {dataInit?.updatedBy || "--"}
                                    </Text>
                                </div>
                            </div>
                        </div>

                        {/* Ngày tạo / Ngày sửa */}
                        <div className="emp-date-boxes">
                            <div className="emp-date-box">
                                <Text style={{ fontSize: 11, color: TEXT_MUTED, display: "block", marginBottom: 2 }}>Ngày tạo</Text>
                                <Text style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 500 }}>
                                    {dataInit?.createdAt ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm") : "--"}
                                </Text>
                            </div>
                            <div className="emp-date-box">
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
                        borderRadius: 14, padding: "14px 14px",
                    }}>
                        <SectionTitle>Thông tin nhân sự</SectionTitle>
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

                {/* ══ POSITIONS ══ */}
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

                    <div className="emp-positions-wrapper">
                        <table className="emp-positions-table">
                            <thead>
                                <tr style={{ background: BG_SUBTLE }}>
                                    {["Chức danh", "Mã bậc", "Cấp", "Công ty", "Phòng ban", "Bộ phận"].map(h => (
                                        <th key={h} style={{
                                            padding: "10px 12px", textAlign: "left",
                                            fontSize: 11, fontWeight: 700, color: TEXT_LABEL,
                                            textTransform: "uppercase", letterSpacing: "0.05em",
                                            borderBottom: `1.5px solid ${BORDER_MED}`,
                                            whiteSpace: "nowrap",
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
                                                    background: BG_SUBTLE,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
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
                                            className="emp-pos-row"
                                            style={{
                                                borderBottom: idx < positions.length - 1 ? `1px solid ${BORDER}` : "none",
                                                background: "#fff",
                                            }}
                                        >
                                            <td data-label="Chức danh" style={{ padding: "10px 12px" }}>
                                                <Text strong style={{ fontSize: 13, color: TEXT_MAIN }}>
                                                    {r.jobTitle?.nameVi ?? "--"}
                                                </Text>
                                            </td>
                                            <td data-label="Mã bậc" style={{ padding: "10px 12px" }}>
                                                <SquareBadge label={r.jobTitle?.positionCode ?? "--"} antColor="purple" />
                                            </td>
                                            <td data-label="Cấp" style={{ padding: "10px 12px" }}>
                                                {cfg
                                                    ? <SquareBadge label={cfg.label} antColor={cfg.antColor} />
                                                    : <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>--</Text>
                                                }
                                            </td>
                                            <td data-label="Công ty" style={{ padding: "10px 12px", fontSize: 13, color: TEXT_LABEL }}>
                                                {r.company?.name ?? "--"}
                                            </td>
                                            <td data-label="Phòng ban" style={{ padding: "10px 12px", fontSize: 13, color: TEXT_MUTED }}>
                                                {r.department?.name ?? "--"}
                                            </td>
                                            <td data-label="Bộ phận" style={{ padding: "10px 12px", fontSize: 13, color: TEXT_MUTED }}>
                                                {r.section?.name ?? "--"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ViewDetailEmployee;