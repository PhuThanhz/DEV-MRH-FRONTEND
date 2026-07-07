import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import type { IResPublicProcedureDTO } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

import {
    Button, Card, Col, Divider, Row, Skeleton,
    Space, Tag, Typography, theme, Flex,
} from "antd";
import {
    BankOutlined, CalendarOutlined, ClockCircleOutlined,
    DownloadOutlined, EyeOutlined, FilePdfOutlined, FileWordOutlined,
    FileExcelOutlined, FileImageOutlined, FileOutlined, LockOutlined,
    PaperClipOutlined, TeamOutlined, SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

// ─── Brand colours (Luxury Lotus Rose & Quartz Gray Corporate Theme) ────────────
const BRAND = "#c83b6c";      // Elegant Luxury Lotus Rose
const BRAND_SOFT = "#fdf2f8"; // Soft Rose Cream
const BRAND_MID = "#fbcfe8";  // Rose Quartz Border Gray
const BRAND_BLUE = "#3b82f6"; // Standard blue

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; text: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "#b45309", bg: "#fffbeb", text: "#92400e" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "#059669", bg: "#ecfdf5", text: "#065f46" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "#2563eb", bg: "#eff6ff", text: "#1e40af" },
    TERMINATED: { label: "Hết hiệu lực", color: "#dc2626", bg: "#fef2f2", text: "#991b1b" },
};

const EXT_ICON: Record<string, React.ReactNode> = {
    PDF: <FilePdfOutlined style={{ color: "#ef4444", fontSize: 22 }} />,
    DOCX: <FileWordOutlined style={{ color: "#3b82f6", fontSize: 22 }} />,
    DOC: <FileWordOutlined style={{ color: "#3b82f6", fontSize: 22 }} />,
    XLSX: <FileExcelOutlined style={{ color: "#10b981", fontSize: 22 }} />,
    XLS: <FileExcelOutlined style={{ color: "#10b981", fontSize: 22 }} />,
    PNG: <FileImageOutlined style={{ color: "#8b5cf6", fontSize: 22 }} />,
    JPG: <FileImageOutlined style={{ color: "#8b5cf6", fontSize: 22 }} />,
    JPEG: <FileImageOutlined style={{ color: "#8b5cf6", fontSize: 22 }} />,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL as string;

const buildFileUrl = (fileName: string) => {
    // Strip legacy /uploads/ or /storage/ prefix stored in DB
    const cleaned = fileName.replace(/^\/+/, "").replace(/^(?:uploads|storage)\//, "");
    const name = cleaned.includes("/") ? cleaned.split("/").pop()! : cleaned;
    const folder = cleaned.includes("/") ? cleaned.split("/").slice(0, -1).join("/") : "procedures";
    return `${BASE_URL}/api/v1/files/public?fileName=${encodeURIComponent(name)}&folder=${encodeURIComponent(folder)}`;
};

function getFileIcon(ext: string) {
    return EXT_ICON[ext.toUpperCase()] ?? <FileOutlined style={{ color: "#6b7280", fontSize: 22 }} />;
}

const decodeFileName = (fileName?: string): string => {
    if (!fileName) return "";
    const name = fileName.replace(/^\d{10,}-/, "");
    const dotIdx = name.lastIndexOf(".");
    const ext = dotIdx !== -1 ? name.slice(dotIdx) : "";
    const base = dotIdx !== -1 ? name.slice(0, dotIdx) : name;
    let decoded = base;
    try { decoded = decodeURIComponent(base); } catch { decoded = base; }
    decoded = decoded.replace(/_/g, " ").replace(/\s+/g, " ").trim();
    return decoded + ext;
};

// ─── PIN styles ───────────────────────────────────────────────────────────────
const PIN_BASE: React.CSSProperties = {
    width: 48, height: 56,
    textAlign: "center",
    fontSize: 22, fontWeight: 600,
    borderRadius: 12,
    border: "1.5px solid #e8e8e8",
    background: "#fafafa",
    color: "#3d3d3d",
    outline: "none",
    caretColor: BRAND,
    transition: "border-color 0.15s, background 0.15s",
    MozAppearance: "textfield",
};

const PIN_FILLED: React.CSSProperties = {
    ...PIN_BASE,
    border: `1.5px solid ${BRAND_MID}`,
    background: BRAND_SOFT,
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const MetaLabel = ({ icon, text }: { icon?: React.ReactNode; text: string }) => (
    <Flex align="center" gap={5} style={{ marginBottom: 6 }}>
        {icon && <span style={{ color: "#adb5bd", fontSize: 12 }}>{icon}</span>}
        <Text style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#adb5bd"
        }}>
            {text}
        </Text>
    </Flex>
);

const Divline = ({ token }: { token: any }) => (
    <div style={{ height: 1, background: token.colorBorderSecondary, margin: "0 20px" }} />
);

// ─── Component ────────────────────────────────────────────────────────────────
const PublicProcedureView = () => {
    const { token: routeToken } = useParams<{ token: string }>();
    const { token: designToken } = useToken();

    const [loading, setLoading] = useState(true);
    const [requirePin, setRequirePin] = useState(false);
    const [pin, setPin] = useState(["", "", "", "", "", ""]);
    const [pinLoading, setPinLoading] = useState(false);
    const [data, setData] = useState<IResPublicProcedureDTO | null>(null);
    const [error, setError] = useState<string | null>(null);

    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => { if (routeToken) fetchView(); }, [routeToken]);

    const fetchView = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${BASE_URL}/api/public/view/${routeToken}`);
            const json = await res.json();
            if (!res.ok) { setError(json?.message ?? "Không thể xem quy trình"); return; }
            if (json?.data?.requirePin) { setRequirePin(true); return; }
            setData(json?.data);
        } catch { setError("Không thể kết nối đến máy chủ"); }
        finally { setLoading(false); }
    };

    // ── PIN handlers ──────────────────────────────────────────────────────────
    const handlePinInput = (idx: number, val: string) => {
        const digit = val.replace(/\D/g, "").slice(-1);
        const next = [...pin]; next[idx] = digit; setPin(next);
        if (digit && idx < 5) pinRefs.current[idx + 1]?.focus();
    };

    const handlePinKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { handleVerifyPin(); return; }
        if (e.key === "Backspace") {
            if (pin[idx]) {
                const next = [...pin]; next[idx] = ""; setPin(next);
            } else if (idx > 0) {
                const next = [...pin]; next[idx - 1] = ""; setPin(next);
                pinRefs.current[idx - 1]?.focus();
            }
        }
        if (e.key === "ArrowLeft" && idx > 0) pinRefs.current[idx - 1]?.focus();
        if (e.key === "ArrowRight" && idx < 5) pinRefs.current[idx + 1]?.focus();
    };

    const handlePinFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

    const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>, startIdx: number) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6 - startIdx);
        if (!pasted) return;
        const next = [...pin];
        pasted.split("").forEach((ch, j) => { next[startIdx + j] = ch; });
        setPin(next);
        pinRefs.current[Math.min(startIdx + pasted.length, 5)]?.focus();
    };

    const handleVerifyPin = async () => {
        const code = pin.join("");
        if (code.length !== 6) { notify.warning("Vui lòng nhập đủ 6 số"); return; }
        setPinLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/public/view/${routeToken}/verify-pin`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: code }),
            });
            const json = await res.json();
            if (!res.ok) { notify.error(json?.message ?? "Mã PIN không đúng"); return; }
            setData(json?.data); setRequirePin(false);
        } catch { notify.error("Không thể kết nối đến máy chủ"); }
        finally { setPinLoading(false); }
    };

    // ── Shared page wrapper ───────────────────────────────────────────────────
    const centeredPage: React.CSSProperties = {
        minHeight: "100vh",
        background: designToken.colorBgLayout,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={centeredPage}>
            <div style={{ width: "100%", maxWidth: 640 }}>
                <Card style={{ borderRadius: 16 }}>
                    <Skeleton active paragraph={{ rows: 5 }} />
                </Card>
            </div>
        </div>
    );

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) return (
        <div style={centeredPage}>
            <div style={{ width: "100%", maxWidth: 420 }}>
                <Card
                    style={{
                        borderRadius: 20, textAlign: "center",
                        borderTop: `3px solid #ef4444`,
                        boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
                    }}
                    styles={{ body: { padding: "40px 32px" } }}
                >
                    <div style={{
                        width: 52, height: 52, borderRadius: "50%",
                        background: "#fef2f2",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px",
                    }}>
                        <LockOutlined style={{ fontSize: 22, color: "#ef4444" }} />
                    </div>
                    <Title level={4} style={{ margin: "0 0 6px", color: "#374151" }}>
                        Không thể truy cập
                    </Title>
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>{error}</Text>
                    <Divider style={{ margin: "20px 0 12px" }} />
                    <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                        Liên hệ người chia sẻ để được hỗ trợ.
                    </Text>
                </Card>
            </div>
        </div>
    );

    // ── PIN screen ────────────────────────────────────────────────────────────
    if (requirePin) return (
        <div style={centeredPage}>
            <div style={{ width: "100%", maxWidth: 400 }}>
                <Card
                    style={{
                        borderRadius: 20,
                        borderTop: `3px solid ${BRAND}`,
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                        border: `1px solid ${BRAND_MID}`,
                    }}
                    styles={{ body: { padding: "40px 36px" } }}
                >
                    {/* Logo + title */}
                    <Flex vertical align="center" gap={6} style={{ marginBottom: 32 }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: "50%",
                            background: BRAND_SOFT,
                            border: `1.5px solid ${BRAND_MID}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            overflow: "hidden",
                        }}>
                            <img
                                src="/logo/LOGOFINAL.webp"
                                alt="LOTUS HRM"
                                style={{ width: 38, height: 38, objectFit: "contain" }}
                            />
                        </div>
                        <Title level={4} style={{ margin: "4px 0 0", color: "#1e293b", fontWeight: 700 }}>
                            Nhập mã PIN
                        </Title>
                        <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", fontWeight: 500 }}>
                            Tài liệu được bảo vệ bằng mã PIN 6 số
                        </Text>
                    </Flex>

                    {/* PIN inputs */}
                    <Flex justify="center" gap={8} style={{ marginBottom: 28 }}>
                        {pin.map((v, i) => (
                            <input
                                key={i}
                                ref={el => { pinRefs.current[i] = el; }}
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                autoComplete="off"
                                value={v}
                                style={v ? PIN_FILLED : PIN_BASE}
                                onChange={e => handlePinInput(i, e.target.value)}
                                onKeyDown={e => handlePinKey(i, e)}
                                onFocus={handlePinFocus}
                                onPaste={e => handlePinPaste(e, i)}
                            />
                        ))}
                    </Flex>

                    {/* Confirm button */}
                    <Button
                        type="primary" block size="large"
                        loading={pinLoading}
                        onClick={handleVerifyPin}
                        style={{
                            height: 48, borderRadius: 12, border: "none",
                            background: BRAND,
                            fontWeight: 600, fontSize: 15,
                            boxShadow: `0 4px 12px rgba(15, 23, 42, 0.15)`,
                        }}
                    >
                        Xác nhận
                    </Button>

                    <div style={{ textAlign: "center", marginTop: 20 }}>
                        <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                            Liên hệ người chia sẻ nếu quên mã
                        </Text>
                    </div>
                </Card>
            </div>
        </div>
    );

    if (!data) return null;

    const st = STATUS_MAP[data.status ?? ""] ?? { label: data.status ?? "--", bg: "#f3f4f6", text: "#374151", color: "#374151" };

    // ── Main view ─────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "36px 16px 80px",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif"
        }}>
            <div style={{ width: "100%", maxWidth: 680 }}>

                {/* ── Brand & Verified Bar ── */}
                <Flex justify="space-between" align="center" style={{ marginBottom: 20, padding: "0 4px" }}>
                    <Flex align="center" gap={10}>
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.04)", border: "0.5px solid #e2e8f0"
                        }}>
                            <img src="/logo/LOGOFINAL.webp" alt="LOTUS HRM"
                                style={{ width: 22, height: 22, objectFit: "contain" }} />
                        </div>
                        <div>
                            <div style={{
                                fontSize: 13, fontWeight: 800, letterSpacing: "0.08em",
                                textTransform: "uppercase", color: "#1e293b", lineHeight: 1.2
                            }}>
                                Lotus HRM
                            </div>
                            <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, letterSpacing: "0.05em" }}>
                                HỆ THỐNG QUẢN TRỊ DOANH NGHIỆP
                            </div>
                        </div>
                    </Flex>
                    <Flex align="center" gap={6} style={{
                        padding: "5px 12px", borderRadius: 30,
                        background: "#ecfdf5",
                        border: "1.5px solid #a7f3d0",
                        boxShadow: "0 2px 6px rgba(16, 185, 129, 0.05)"
                    }}>
                        <SafetyCertificateOutlined style={{ fontSize: 12, color: "#059669" }} />
                        <span style={{ fontSize: 10, color: "#047857", fontWeight: 700, letterSpacing: "0.03em" }}>XÁC THỰC</span>
                    </Flex>
                </Flex>

                {/* ── Main Unified Document Passport Card ── */}
                <div style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.03), 0 8px 10px -6px rgba(15, 23, 42, 0.03)",
                    marginBottom: 24
                }}>
                    {/* Top Accent Line */}
                    <div style={{
                        height: 4,
                        background: BRAND,
                    }} />

                    {/* Header Title Section */}
                    <div style={{ padding: "26px 28px 22px", borderBottom: "1px solid #e2e8f0" }}>
                        <Flex gap={8} wrap="wrap" style={{ marginBottom: 14 }}>
                            <span style={{
                                display: "inline-flex", alignItems: "center",
                                padding: "4px 10px", borderRadius: 4,
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                fontSize: 11, fontWeight: 700,
                                color: BRAND,
                                letterSpacing: "0.03em"
                            }}>
                                MÃ: {data.procedureCode}
                            </span>

                            <span style={{
                                display: "inline-flex", alignItems: "center",
                                padding: "4px 10px", borderRadius: 4,
                                background: st.bg,
                                border: `1px solid ${st.color}30`,
                                fontSize: 11, fontWeight: 700,
                                color: st.text,
                            }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    background: st.color,
                                    display: "inline-block", marginRight: 6,
                                }} />
                                {st.label.toUpperCase()}
                            </span>


                        </Flex>

                        <Title level={3} style={{
                            margin: 0, lineHeight: 1.45,
                            color: "#1e293b",
                            fontWeight: 800,
                            fontSize: "22px",
                            letterSpacing: "-0.015em"
                        }}>
                            {data.procedureName}
                        </Title>
                    </div>

                    {/* Unified Metadata Datasheet Grid */}
                    <div style={{ background: "#f8fafc", padding: "26px 28px", borderBottom: "1px solid #e2e8f0" }}>
                        <Row gutter={[24, 20]}>
                            {data.departmentName && (
                                <Col xs={24} sm={12}>
                                    <div>
                                        <MetaLabel icon={<BankOutlined style={{ color: "#64748b" }} />} text="Phòng ban ban hành" />
                                        <Text style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                                            {data.departmentName}
                                        </Text>
                                    </div>
                                </Col>
                            )}

                            {data.sectionName && (
                                <Col xs={24} sm={12}>
                                    <div>
                                        <MetaLabel icon={<TeamOutlined style={{ color: "#64748b" }} />} text="Bộ phận / Phân nhóm" />
                                        <Text style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                                            {data.sectionName}
                                        </Text>
                                    </div>
                                </Col>
                            )}

                            {data.issuedDate && (
                                <Col xs={12} sm={12}>
                                    <div>
                                        <MetaLabel icon={<CalendarOutlined style={{ color: "#64748b" }} />} text="Ngày ban hành" />
                                        <Text style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                                            {dayjs(data.issuedDate).format("DD/MM/YYYY")}
                                        </Text>
                                    </div>
                                </Col>
                            )}

                            {data.expiresAt && (
                                <Col xs={12} sm={12}>
                                    <div>
                                        <MetaLabel icon={<ClockCircleOutlined style={{ color: "#d97706" }} />} text="Hiệu lực liên kết" />
                                        <Text style={{ fontSize: 14, fontWeight: 700, color: "#b45309" }}>
                                            {dayjs(data.expiresAt).format("DD/MM/YYYY HH:mm")}
                                        </Text>
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </div>

                    {/* Note Box Section */}
                    {data.note && (
                        <div style={{ padding: "20px 28px", borderBottom: "1px solid #e2e8f0" }}>
                            <MetaLabel text="Ghi chú hệ thống" />
                            <div style={{
                                background: "#f8fafc",
                                borderLeft: `3.5px solid ${BRAND}`,
                                padding: "12px 16px",
                                borderRadius: "0 6px 6px 0"
                            }}>
                                <Paragraph style={{
                                    margin: 0, fontSize: 13, lineHeight: 1.65,
                                    color: "#334155",
                                    fontWeight: 500
                                }}>
                                    {data.note}
                                </Paragraph>
                            </div>
                        </div>
                    )}

                    {/* Attachments Section */}
                    {data.fileUrls && data.fileUrls.length > 0 && (
                        <div style={{ padding: "26px 28px 28px" }}>
                            <MetaLabel
                                icon={<PaperClipOutlined style={{ color: "#475569" }} />}
                                text={`Tài liệu đính kèm chính thức (${data.fileUrls.length})`}
                            />
                            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                                {data.fileUrls.map((fileName, idx) => {
                                    const fileUrl = buildFileUrl(fileName);
                                    const name = decodeFileName(fileName);
                                    const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
                                    return (
                                        <div key={idx} style={{
                                            display: "flex", alignItems: "center",
                                            justifyContent: "space-between",
                                            background: "#ffffff",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 8, padding: "14px 18px", gap: 12,
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.01)",
                                            transition: "all 0.15s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                            const el = e.currentTarget as HTMLDivElement;
                                            el.style.borderColor = "#94a3b8";
                                            el.style.background = "#f8fafc";
                                        }}
                                        onMouseLeave={(e) => {
                                            const el = e.currentTarget as HTMLDivElement;
                                            el.style.borderColor = "#e2e8f0";
                                            el.style.background = "#ffffff";
                                        }}
                                        >
                                            <Flex align="center" gap={12} style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 8,
                                                    background: "#f8fafc",
                                                    border: "1px solid #e2e8f0",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    flexShrink: 0,
                                                }}>
                                                    {getFileIcon(ext)}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 13, fontWeight: 700,
                                                            display: "block", color: "#1e293b",
                                                        }}
                                                        ellipsis={{ tooltip: name }}
                                                    >
                                                        {name}
                                                    </Text>
                                                    <Text style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                                                        {ext} · Tài liệu lưu trữ hệ thống
                                                    </Text>
                                                </div>
                                            </Flex>
                                            <Flex gap={8} style={{ flexShrink: 0 }}>
                                                <Button
                                                    size="middle"
                                                    icon={<EyeOutlined />}
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{
                                                        borderRadius: 6,
                                                        fontSize: 12, fontWeight: 600,
                                                        color: "#475569",
                                                        borderColor: "#cbd5e1",
                                                        height: 32
                                                    }}
                                                >
                                                    Xem
                                                </Button>
                                                {data.allowDownload && (
                                                    <Button
                                                        size="middle"
                                                        icon={<DownloadOutlined />}
                                                        href={fileUrl}
                                                        download={name}
                                                        style={{
                                                            borderRadius: 6,
                                                            fontSize: 12, fontWeight: 600,
                                                            background: BRAND,
                                                            color: "#fff",
                                                            border: "none",
                                                            height: 32
                                                        }}
                                                    >
                                                        Tải về
                                                    </Button>
                                                )}
                                            </Flex>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── System Footer ── */}
                <Flex justify="center" align="center" gap={6} style={{ paddingTop: 8, opacity: 0.5 }}>
                    <img src="/logo/LOGOFINAL.webp" alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                    <Text style={{ fontSize: 11, color: "#64748b", fontWeight: 500, letterSpacing: "0.02em" }}>
                        © Lotus HRM · Tài liệu nội bộ
                    </Text>
                </Flex>

            </div>
        </div>
    );
};

export default PublicProcedureView;
