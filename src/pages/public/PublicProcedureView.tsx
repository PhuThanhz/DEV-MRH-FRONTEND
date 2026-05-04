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

// ─── Brand colours ────────────────────────────────────────────────────────────
const BRAND = "#e8457a";
const BRAND_SOFT = "#fff0f5";
const BRAND_MID = "#fce4ed";

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

// ─── FIX: build đường dẫn file đúng ──────────────────────────────────────────
const buildFileUrl = (fileName: string) =>
    `${BASE_URL}/uploads/${encodeURIComponent(fileName)}`;

function getFileIcon(ext: string) {
    return EXT_ICON[ext.toUpperCase()] ?? <FileOutlined style={{ color: "#6b7280", fontSize: 22 }} />;
}

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
                        boxShadow: "0 2px 24px rgba(232,69,122,0.10)",
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
                                src="/logo/LOGOFINAL.png"
                                alt="LOTUS HRM"
                                style={{ width: 38, height: 38, objectFit: "contain" }}
                            />
                        </div>
                        <Title level={4} style={{ margin: "4px 0 0", color: "#374151" }}>
                            Nhập mã PIN
                        </Title>
                        <Text style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
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
                            background: `linear-gradient(135deg, #f472b6, ${BRAND})`,
                            fontWeight: 600, fontSize: 15,
                            boxShadow: `0 4px 14px rgba(232,69,122,0.30)`,
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
            background: designToken.colorBgLayout,
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "32px 16px 72px",
        }}>
            <div style={{ width: "100%", maxWidth: 680 }}>

                {/* ── Nav bar ── */}
                <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                    <Flex align="center" gap={10}>
                        <img src="/logo/LOGOFINAL.png" alt="LOTUS HRM"
                            style={{ width: 30, height: 30, objectFit: "contain" }} />
                        <Text style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
                            textTransform: "uppercase", color: "#9ca3af",
                        }}>
                            Lotus HRM
                        </Text>
                    </Flex>
                    <Flex align="center" gap={6} style={{
                        padding: "4px 12px", borderRadius: 20,
                        background: designToken.colorBgContainer,
                        border: `1px solid ${designToken.colorBorderSecondary}`,
                    }}>
                        <SafetyCertificateOutlined style={{ fontSize: 11, color: "#9ca3af" }} />
                        <Text style={{ fontSize: 11, color: "#9ca3af" }}>Tài liệu nội bộ</Text>
                    </Flex>
                </Flex>

                {/* ── Header card ── */}
                <div style={{
                    borderRadius: 16,
                    marginBottom: 14,
                    overflow: "hidden",
                    background: designToken.colorBgContainer,
                    border: `1px solid ${designToken.colorBorderSecondary}`,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}>
                    <div style={{
                        height: 5,
                        background: `linear-gradient(90deg, ${BRAND} 0%, #f472b6 100%)`,
                    }} />

                    <div style={{ padding: "22px 24px 24px" }}>
                        <Flex gap={6} wrap="wrap" style={{ marginBottom: 14 }}>
                            <span style={{
                                display: "inline-flex", alignItems: "center",
                                padding: "3px 10px", borderRadius: 6,
                                background: designToken.colorFillAlter,
                                border: `1px solid ${designToken.colorBorderSecondary}`,
                                fontSize: 12, fontWeight: 600,
                                color: "#6b7280",
                            }}>
                                {data.procedureCode}
                            </span>

                            <span style={{
                                display: "inline-flex", alignItems: "center",
                                padding: "3px 10px", borderRadius: 6,
                                background: st.bg,
                                fontSize: 12, fontWeight: 600,
                                color: st.text,
                            }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    background: st.color,
                                    display: "inline-block", marginRight: 6,
                                }} />
                                {st.label}
                            </span>

                            {data.version && (
                                <span style={{
                                    display: "inline-flex", alignItems: "center",
                                    padding: "3px 10px", borderRadius: 6,
                                    background: designToken.colorFillAlter,
                                    border: `1px solid ${designToken.colorBorderSecondary}`,
                                    fontSize: 12, fontWeight: 600,
                                    color: "#9ca3af",
                                }}>
                                    Phiên bản {data.version}
                                </span>
                            )}
                        </Flex>

                        <Title level={3} style={{
                            margin: 0, lineHeight: 1.4,
                            color: "#1f2937",
                            fontWeight: 700,
                        }}>
                            {data.procedureName}
                        </Title>
                    </div>
                </div>

                {/* ── Info card ── */}
                <div style={{
                    borderRadius: 16, marginBottom: 14, overflow: "hidden",
                    background: designToken.colorBgContainer,
                    border: `1px solid ${designToken.colorBorderSecondary}`,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}>
                    {data.departmentName && (
                        <>
                            <div style={{ padding: "18px 22px" }}>
                                <MetaLabel icon={<BankOutlined />} text="Phòng ban" />
                                <Text style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
                                    {data.departmentName}
                                </Text>
                            </div>
                            <Divline token={designToken} />
                        </>
                    )}

                    {data.sectionName && (
                        <>
                            <div style={{ padding: "18px 22px" }}>
                                <MetaLabel icon={<TeamOutlined />} text="Bộ phận" />
                                <Text style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
                                    {data.sectionName}
                                </Text>
                            </div>
                            <Divline token={designToken} />
                        </>
                    )}

                    <Row>
                        {data.issuedDate && (
                            <Col span={data.expiresAt ? 12 : 24}>
                                <div style={{
                                    padding: "18px 22px",
                                    borderRight: data.expiresAt
                                        ? `1px solid ${designToken.colorBorderSecondary}`
                                        : "none",
                                }}>
                                    <MetaLabel icon={<CalendarOutlined />} text="Ngày ban hành" />
                                    <Text style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
                                        {dayjs(data.issuedDate).format("DD/MM/YYYY")}
                                    </Text>
                                </div>
                            </Col>
                        )}
                        {data.expiresAt && (
                            <Col span={data.issuedDate ? 12 : 24}>
                                <div style={{ padding: "18px 22px", background: "#fffbeb" }}>
                                    <MetaLabel icon={<ClockCircleOutlined />} text="Link hết hạn" />
                                    <Text style={{ fontSize: 15, fontWeight: 600, color: "#b45309" }}>
                                        {dayjs(data.expiresAt).format("DD/MM/YYYY HH:mm")}
                                    </Text>
                                </div>
                            </Col>
                        )}
                    </Row>
                </div>

                {/* ── Note card ── */}
                {data.note && (
                    <div style={{
                        borderRadius: 16, marginBottom: 14, overflow: "hidden",
                        background: designToken.colorBgContainer,
                        border: `1px solid ${designToken.colorBorderSecondary}`,
                        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                        padding: "18px 22px",
                    }}>
                        <MetaLabel text="Ghi chú" />
                        <Paragraph style={{
                            margin: 0, fontSize: 14, lineHeight: 1.7,
                            color: "#6b7280",
                        }}>
                            {data.note}
                        </Paragraph>
                    </div>
                )}

                {/* ── Attachments card ── */}
                {data.fileUrls && data.fileUrls.length > 0 && (
                    <div style={{
                        borderRadius: 16, marginBottom: 14, overflow: "hidden",
                        background: designToken.colorBgContainer,
                        border: `1px solid ${designToken.colorBorderSecondary}`,
                        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                        padding: "18px 22px",
                    }}>
                        <MetaLabel
                            icon={<PaperClipOutlined />}
                            text={`Tài liệu đính kèm (${data.fileUrls.length})`}
                        />
                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                            {data.fileUrls.map((fileName, idx) => {
                                // ── FIX: dùng fileName thay vì url ──────────
                                const fileUrl = buildFileUrl(fileName);
                                const name = decodeURIComponent(fileName.split("/").pop() ?? `Tài liệu ${idx + 1}`);
                                const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
                                return (
                                    <div key={idx} style={{
                                        display: "flex", alignItems: "center",
                                        justifyContent: "space-between",
                                        background: designToken.colorFillAlter,
                                        border: `1px solid ${designToken.colorBorderSecondary}`,
                                        borderRadius: 12, padding: "12px 14px", gap: 10,
                                    }}>
                                        <Flex align="center" gap={12} style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 10,
                                                background: designToken.colorBgContainer,
                                                border: `1px solid ${designToken.colorBorderSecondary}`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                {getFileIcon(ext)}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 13, fontWeight: 600,
                                                        display: "block", color: "#374151",
                                                    }}
                                                    ellipsis={{ tooltip: name }}
                                                >
                                                    {name}
                                                </Text>
                                                <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                                                    {ext} · Tài liệu đính kèm
                                                </Text>
                                            </div>
                                        </Flex>
                                        <Flex gap={6} style={{ flexShrink: 0 }}>
                                            <Button
                                                size="small"
                                                icon={<EyeOutlined />}
                                                href={fileUrl}      // ← FIX
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    borderRadius: 8, height: 32,
                                                    fontSize: 12, fontWeight: 500,
                                                }}
                                            >
                                                Xem
                                            </Button>
                                            {data.allowDownload && (
                                                <Button
                                                    size="small"
                                                    icon={<DownloadOutlined />}
                                                    href={fileUrl}  // ← FIX
                                                    download={name}
                                                    style={{
                                                        borderRadius: 8, height: 32,
                                                        fontSize: 12, fontWeight: 600,
                                                        background: BRAND,
                                                        color: "#fff",
                                                        border: "none",
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

                {/* ── Footer ── */}
                <Flex justify="center" align="center" gap={8} style={{ paddingTop: 12 }}>
                    <img src="/logo/LOGOFINAL.png" alt="" style={{ width: 14, height: 14, objectFit: "contain", opacity: 0.4 }} />
                    <Text style={{ fontSize: 11, color: "#c4c7ce", letterSpacing: "0.03em" }}>
                        © Lotus HRM · Tài liệu nội bộ · Không sao chép hoặc phân phối trái phép
                    </Text>
                </Flex>

            </div>
        </div>
    );
};

export default PublicProcedureView;