import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button, Typography, Tag, Space, Divider, theme, Flex, Card } from "antd";
import {
    QrcodeOutlined, ReloadOutlined, CheckCircleFilled,
    WarningFilled, BankOutlined, CalendarOutlined, TeamOutlined,
    CameraOutlined, StopOutlined,
} from "@ant-design/icons";
import axios from "@/config/axios-customize";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { useToken } = theme;

const C = {
    primary: "#1d4ed8",
    primaryLight: "#3b82f6",
    primarySoft: "#eff6ff",
    primaryBorder: "#bfdbfe",
    success: "#16a34a",
    successBg: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#d97706",
    warningBg: "#fffbeb",
    warningBorder: "#fde68a",
    scan: "#60a5fa",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "warning" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "success" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "processing" },
    TERMINATED: { label: "Hết hiệu lực", color: "error" },
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => {
    const { token } = useToken();
    return (
        <Flex align="center" gap={12} style={{
            padding: "11px 14px",
            background: token.colorFillAlter,
            borderRadius: 10,
            border: `1px solid ${token.colorBorderSecondary}`,
            transition: "background 0.2s",
        }}>
            <span style={{
                width: 32, height: 32, borderRadius: 8,
                background: C.primarySoft,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: C.primary, flexShrink: 0,
            }}>{icon}</span>
            <div style={{ minWidth: 0 }}>
                <Text type="secondary" style={{
                    fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.08em", display: "block",
                }}>
                    {label}
                </Text>
                <Text strong style={{ fontSize: 13 }}>{value}</Text>
            </div>
        </Flex>
    );
};

const ScanOverlay = () => (
    <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
    }}>
        <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.45)",
            maskImage: "radial-gradient(ellipse 220px 220px at 50% 50%, transparent 100px, black 101px)",
            WebkitMaskImage: "radial-gradient(ellipse 220px 220px at 50% 50%, transparent 100px, black 101px)",
        }} />
        {[
            { top: "calc(50% - 90px)", left: "calc(50% - 90px)", borderTop: `3px solid ${C.primary}`, borderLeft: `3px solid ${C.primary}`, borderRadius: "4px 0 0 0" },
            { top: "calc(50% - 90px)", right: "calc(50% - 90px)", borderTop: `3px solid ${C.primary}`, borderRight: `3px solid ${C.primary}`, borderRadius: "0 4px 0 0" },
            { bottom: "calc(50% - 90px)", left: "calc(50% - 90px)", borderBottom: `3px solid ${C.primary}`, borderLeft: `3px solid ${C.primary}`, borderRadius: "0 0 0 4px" },
            { bottom: "calc(50% - 90px)", right: "calc(50% - 90px)", borderBottom: `3px solid ${C.primary}`, borderRight: `3px solid ${C.primary}`, borderRadius: "0 0 4px 0" },
        ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 22, height: 22, ...s }} />
        ))}
        <div style={{
            position: "absolute",
            left: "calc(50% - 90px)", width: 180, height: 2,
            background: `linear-gradient(90deg, transparent, ${C.primary}, transparent)`,
            animation: "scanline 2s ease-in-out infinite",
            borderRadius: 2,
        }} />
    </div>
);

const PulseIcon = () => (
    <div style={{ position: "relative", display: "inline-flex" }}>
        <div style={{
            position: "absolute", inset: -6,
            borderRadius: "50%",
            border: `2px solid ${C.primaryLight}`,
            animation: "ripple 1.8s ease-out infinite",
        }} />
        <QrcodeOutlined style={{ fontSize: 22 }} />
    </div>
);

const QrScanPage = () => {
    const { token } = useToken();
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    // ✅ FIX: cleanup đúng cách khi unmount (clear DOM + null ref)
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop()
                    .catch(() => { })
                    .finally(() => {
                        try { scannerRef.current?.clear(); } catch { }
                        scannerRef.current = null;
                    });
            }
        };
    }, []);

    const startScan = async () => {
        setError(null);
        setResult(null);
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        try {
            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 200, height: 200 } },
                async (decodedText) => {
                    await scanner.stop();
                    try { scanner.clear(); } catch { }
                    scannerRef.current = null;
                    setScanning(false);
                    handleScanSuccess(decodedText);
                },
                () => { }
            );
            setScanning(true);
        } catch {
            setError("Không thể mở camera. Kiểm tra quyền truy cập camera.");
        }
    };

    // ✅ FIX: thêm .clear() để release DOM và camera stream hoàn toàn
    const stopScan = async () => {
        try {
            if (scannerRef.current) {
                await scannerRef.current.stop();
                try { scannerRef.current.clear(); } catch { }
                scannerRef.current = null;
            }
        } catch { }
        setScanning(false);
    };

    const handleScanSuccess = async (url: string) => {
        setLoading(true);
        try {
            const t = url.split("/qr/")[1]?.split("?")[0];
            if (!t) throw new Error("QR không hợp lệ");
            const res = await axios.get(`/api/v1/procedures/qr/${t}`);
            setResult(res.data?.data);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err.message ?? "Không có quyền xem quy trình này");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        await stopScan();
        setResult(null);
        setError(null);
    };

    const statusObj = result
        ? (STATUS_MAP[result.status ?? ""] ?? (result.active
            ? { label: "Đang hiệu lực", color: "success" }
            : { label: "Không hoạt động", color: "error" }))
        : null;

    return (
        <>
            <style>{`
                @keyframes scanline {
                    0%   { top: calc(50% - 90px); opacity: 0; }
                    5%   { opacity: 1; }
                    95%  { opacity: 1; }
                    100% { top: calc(50% + 90px); opacity: 0; }
                }
                @keyframes ripple {
                    0%   { transform: scale(1); opacity: 0.7; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-dot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50%      { transform: scale(1.5); opacity: 0.6; }
                }
                @keyframes spin-ring {
                    to { transform: rotate(360deg); }
                }
                #qr-reader { border-radius: 0 !important; }
                #qr-reader video { width: 100% !important; height: auto !important; border-radius: 0 !important; display: block; }
                #qr-reader__scan_region { border: none !important; }
                #qr-reader__scan_region img { display: none !important; }
                #qr-reader__dashboard { display: none !important; }
            `}</style>

            <div style={{
                minHeight: "100vh",
                background: token.colorBgLayout,
                padding: "36px 16px 72px",
            }}>
                <div style={{
                    maxWidth: 460,
                    margin: "0 auto",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "none" : "translateY(16px)",
                    transition: "opacity 0.45s ease, transform 0.45s ease",
                }}>

                    {/* ── Header ─────────────────────────────────── */}
                    <Flex vertical align="center" gap={6} style={{ marginBottom: 32 }}>
                        <div style={{
                            width: 58, height: 58, borderRadius: 16,
                            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 6,
                            boxShadow: `0 8px 24px ${C.primary}44`,
                        }}>
                            <QrcodeOutlined style={{ fontSize: 26, color: "#fff" }} />
                        </div>
                        <Title level={4} style={{ margin: 0, letterSpacing: "-0.3px" }}>
                            Quét mã QR quy trình
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13, textAlign: "center", maxWidth: 280 }}>
                            Quét mã QR nội bộ để xem thông tin quy trình nhanh chóng
                        </Text>
                    </Flex>

                    {/* ── Camera card ────────────────────────────── */}
                    {!result && !error && !loading && (
                        <Card
                            style={{
                                borderRadius: 20, marginBottom: 16,
                                overflow: "hidden",
                                border: `1px solid ${token.colorBorderSecondary}`,
                                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                            }}
                            styles={{ body: { padding: 0 } }}
                        >
                            <div style={{
                                height: 3,
                                background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight}, #a5b4fc)`,
                            }} />

                            <div style={{
                                position: "relative",
                                background: scanning ? "#000" : token.colorFillQuaternary,
                                minHeight: scanning ? 280 : 0,
                                overflow: "hidden",
                            }}>
                                {/* ✅ FIX: luôn render #qr-reader trong DOM, chỉ ẩn bằng visibility */}
                                <div
                                    id="qr-reader"
                                    style={{
                                        width: "100%",
                                        visibility: scanning ? "visible" : "hidden",
                                        height: scanning ? "auto" : 0,
                                        overflow: "hidden",
                                    }}
                                />
                                {scanning && <ScanOverlay />}
                            </div>

                            <div style={{ padding: "20px 20px 24px" }}>
                                {!scanning ? (
                                    <>
                                        <Flex vertical align="center" gap={8} style={{ marginBottom: 20, paddingTop: 8 }}>
                                            <div style={{
                                                width: 80, height: 80, borderRadius: 20,
                                                background: C.primarySoft,
                                                border: `1.5px dashed ${C.primaryBorder}`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                                <CameraOutlined style={{ fontSize: 34, color: C.primary, opacity: 0.7 }} />
                                            </div>
                                            <Text type="secondary" style={{ fontSize: 12, textAlign: "center" }}>
                                                Nhấn bên dưới để bật camera và quét mã QR
                                            </Text>
                                        </Flex>

                                        <Button
                                            type="primary" block size="large"
                                            icon={<PulseIcon />}
                                            onClick={startScan}
                                            style={{
                                                borderRadius: 12, height: 50,
                                                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                                                border: "none", fontWeight: 600, fontSize: 15,
                                                boxShadow: `0 4px 16px ${C.primary}55`,
                                                letterSpacing: "0.01em",
                                            }}
                                        >
                                            Mở camera quét QR
                                        </Button>
                                    </>
                                ) : (
                                    <div>
                                        <Flex align="center" justify="center" gap={8} style={{ margin: "4px 0 12px" }}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: "50%",
                                                background: C.primaryLight,
                                                display: "inline-block",
                                                animation: "pulse-dot 1.2s ease-in-out infinite",
                                            }} />
                                            <Text style={{ fontSize: 13, color: C.primary, fontWeight: 500 }}>
                                                Đang quét… Hướng camera vào mã QR
                                            </Text>
                                        </Flex>
                                        <Button
                                            block onClick={stopScan}
                                            icon={<StopOutlined />}
                                            style={{ borderRadius: 12, height: 44, fontWeight: 500 }}
                                        >
                                            Dừng quét
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* ── Loading ─────────────────────────────────── */}
                    {loading && (
                        <Card
                            style={{
                                borderRadius: 20, border: `1px solid ${token.colorBorderSecondary}`,
                                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                            }}
                            styles={{ body: { padding: "52px 24px" } }}
                        >
                            <Flex vertical align="center" gap={16}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: "50%",
                                    border: `3px solid ${C.primarySoft}`,
                                    borderTop: `3px solid ${C.primary}`,
                                    animation: "spin-ring 0.8s linear infinite",
                                }} />
                                <div style={{ textAlign: "center" }}>
                                    <Text strong style={{ fontSize: 15, display: "block", marginBottom: 4 }}>
                                        Đang tải thông tin…
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Vui lòng chờ trong giây lát
                                    </Text>
                                </div>
                            </Flex>
                        </Card>
                    )}

                    {/* ── Error ───────────────────────────────────── */}
                    {error && !loading && (
                        <Card
                            style={{
                                borderRadius: 20,
                                border: `1px solid ${C.warningBorder}`,
                                background: C.warningBg,
                                boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
                            }}
                            styles={{ body: { padding: "36px 24px 28px" } }}
                        >
                            <Flex vertical align="center" gap={10} style={{ marginBottom: 24 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: "50%",
                                    background: "#fff",
                                    border: `1.5px solid ${C.warningBorder}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                }}>
                                    <WarningFilled style={{ fontSize: 26, color: C.warning }} />
                                </div>
                                <Text strong style={{ fontSize: 15 }}>Không thể xem quy trình</Text>
                                <Text type="secondary" style={{ fontSize: 13, textAlign: "center" }}>{error}</Text>
                            </Flex>
                            <Button
                                block icon={<ReloadOutlined />}
                                onClick={handleReset}
                                style={{
                                    borderRadius: 12, height: 44, fontWeight: 500,
                                    background: "#fff", borderColor: C.warningBorder,
                                }}
                            >
                                Quét lại
                            </Button>
                        </Card>
                    )}

                    {/* ── Result ─────────────────────────────────── */}
                    {result && !loading && (
                        <Card
                            style={{
                                borderRadius: 20, overflow: "hidden",
                                border: `1px solid ${token.colorBorderSecondary}`,
                                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                                animation: "fadeUp 0.35s ease",
                            }}
                            styles={{ body: { padding: 0 } }}
                        >
                            <div style={{
                                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                                padding: "20px 20px 18px",
                            }}>
                                <Flex align="center" gap={7} style={{ marginBottom: 14 }}>
                                    <CheckCircleFilled style={{ color: "#a5f3af", fontSize: 14 }} />
                                    <Text style={{ fontSize: 12, color: "#e0e7ff", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                        Quét thành công
                                    </Text>
                                </Flex>

                                <Title level={5} style={{ margin: "0 0 10px", color: "#fff", lineHeight: 1.4 }}>
                                    {result.procedureName}
                                </Title>

                                <Space size={6} wrap>
                                    <Tag style={{
                                        borderRadius: 6, fontWeight: 700, fontSize: 11,
                                        background: "rgba(255,255,255,0.18)", border: "none", color: "#fff",
                                        letterSpacing: "0.03em",
                                    }}>
                                        {result.procedureCode}
                                    </Tag>
                                    {result.version && (
                                        <Tag style={{
                                            borderRadius: 6, fontWeight: 600, fontSize: 11,
                                            background: "rgba(255,255,255,0.18)", border: "none", color: "#e0e7ff",
                                        }}>
                                            v{result.version}
                                        </Tag>
                                    )}
                                    {statusObj && (
                                        <Tag color={statusObj.color} style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}>
                                            {statusObj.label}
                                        </Tag>
                                    )}
                                </Space>
                            </div>

                            <div style={{ padding: "18px 20px 24px" }}>
                                <Flex vertical gap={8} style={{ marginBottom: 20 }}>
                                    {result.departmentName && (
                                        <InfoRow icon={<BankOutlined />} label="Phòng ban" value={result.departmentName} />
                                    )}
                                    {result.sectionName && (
                                        <InfoRow icon={<TeamOutlined />} label="Bộ phận" value={result.sectionName} />
                                    )}
                                    {result.issuedDate && (
                                        <InfoRow
                                            icon={<CalendarOutlined />}
                                            label="Ngày ban hành"
                                            value={dayjs(result.issuedDate).format("DD/MM/YYYY")}
                                        />
                                    )}
                                    {result.note && (
                                        <InfoRow icon={<CalendarOutlined />} label="Ghi chú" value={result.note} />
                                    )}
                                </Flex>

                                <Divider style={{ margin: "0 0 16px" }} />

                                <Button
                                    block icon={<ReloadOutlined />}
                                    onClick={handleReset}
                                    style={{
                                        borderRadius: 12, height: 44, fontWeight: 500,
                                        borderColor: C.primaryBorder, color: C.primary,
                                    }}
                                >
                                    Quét quy trình khác
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* ── Footer hint ────────────────────────────── */}
                    {!result && !error && !loading && (
                        <Flex align="center" justify="center" gap={6} style={{ marginTop: 20 }}>
                            <div style={{
                                width: 4, height: 4, borderRadius: "50%",
                                background: token.colorTextQuaternary,
                            }} />
                            <Text type="secondary" style={{ fontSize: 11, letterSpacing: "0.05em" }}>
                                Chỉ dành cho mã QR nội bộ Lotus HRM
                            </Text>
                            <div style={{
                                width: 4, height: 4, borderRadius: "50%",
                                background: token.colorTextQuaternary,
                            }} />
                        </Flex>
                    )}

                </div>
            </div>
        </>
    );
};

export default QrScanPage;