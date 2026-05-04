import { useEffect, useRef, useState } from "react";
import {
    Modal, Button, Typography, theme, Flex,
} from "antd";
import {
    QrcodeOutlined, ReloadOutlined,
    WarningFilled, StopOutlined, CheckCircleFilled,
} from "@ant-design/icons";
import { Html5Qrcode } from "html5-qrcode";
import axios from "@/config/axios-customize";
import ViewProcedure from "@/pages/admin/procedures/view.procedure";

const { Text } = Typography;
const { useToken } = theme;

// ── Design tokens ───────────────────────────────────────────────
const C = {
    primary: "#be185d",
    primaryLight: "#ec4899",
    primarySoft: "#fdf2f8",
    primaryBorder: "#fbcfe8",
    warning: "#d97706",
    warningBg: "#fffbeb",
    warningBorder: "#fde68a",
};

// Kích thước khung quét
const BOX = 180;
const ARM = 22;
const THICK = 3;

interface IProps {
    open: boolean;
    onClose: () => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "warning" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "success" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "processing" },
    TERMINATED: { label: "Hết hiệu lực", color: "error" },
};

/* ── L-bracket corners ─────────────────────────────────────── */
const Corners = () => (
    <>
        {/* Top-left */}
        <div style={{ position: "absolute", top: `calc(50% - ${BOX / 2}px)`, left: `calc(50% - ${BOX / 2}px)` }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: ARM, height: THICK, background: "#fff", borderRadius: 2 }} />
            <div style={{ position: "absolute", top: 0, left: 0, width: THICK, height: ARM, background: "#fff", borderRadius: 2 }} />
        </div>
        {/* Top-right */}
        <div style={{ position: "absolute", top: `calc(50% - ${BOX / 2}px)`, right: `calc(50% - ${BOX / 2}px)` }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: ARM, height: THICK, background: "#fff", borderRadius: 2 }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: THICK, height: ARM, background: "#fff", borderRadius: 2 }} />
        </div>
        {/* Bottom-left */}
        <div style={{ position: "absolute", bottom: `calc(50% - ${BOX / 2}px)`, left: `calc(50% - ${BOX / 2}px)` }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: ARM, height: THICK, background: "#fff", borderRadius: 2 }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: THICK, height: ARM, background: "#fff", borderRadius: 2 }} />
        </div>
        {/* Bottom-right */}
        <div style={{ position: "absolute", bottom: `calc(50% - ${BOX / 2}px)`, right: `calc(50% - ${BOX / 2}px)` }}>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: ARM, height: THICK, background: "#fff", borderRadius: 2 }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: THICK, height: ARM, background: "#fff", borderRadius: 2 }} />
        </div>
    </>
);

/* ── Dark mask + brackets + scanline overlay ───────────────── */
const ScanOverlay = () => (
    <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
    }}>
        {/* 4 dark rects around the clear box */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `calc(50% - ${BOX / 2}px)`, background: "rgba(0,0,0,0.58)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `calc(50% - ${BOX / 2}px)`, background: "rgba(0,0,0,0.58)" }} />
        <div style={{ position: "absolute", top: `calc(50% - ${BOX / 2}px)`, bottom: `calc(50% - ${BOX / 2}px)`, left: 0, width: `calc(50% - ${BOX / 2}px)`, background: "rgba(0,0,0,0.58)" }} />
        <div style={{ position: "absolute", top: `calc(50% - ${BOX / 2}px)`, bottom: `calc(50% - ${BOX / 2}px)`, right: 0, width: `calc(50% - ${BOX / 2}px)`, background: "rgba(0,0,0,0.58)" }} />

        {/* L-corner brackets */}
        <Corners />

        {/* Scanline */}
        <div style={{
            position: "absolute",
            left: `calc(50% - ${BOX / 2}px)`,
            width: BOX,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
            animation: "qr-scanline 2s ease-in-out infinite",
        }} />
    </div>
);

/* ══════════════════════════════════════════════════════════════ */
const QrScannerModal = ({ open, onClose }: IProps) => {
    const { token } = useToken();
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [openDetail, setOpenDetail] = useState(false);

    const startScan = async () => {
        setError(null); setResult(null);
        const scanner = new Html5Qrcode("qr-modal-reader");
        scannerRef.current = scanner;
        try {
            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: BOX, height: BOX } },
                async (decodedText) => {
                    await scanner.stop();
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

    const stopScan = async () => {
        try {
            if (scannerRef.current) { await scannerRef.current.stop(); scannerRef.current = null; }
        } catch { }
        setScanning(false);
    };

    const handleScanSuccess = async (decodedText: string) => {
        setLoading(true);
        try {
            if (decodedText.includes("/qr/")) {
                const t = decodedText.split("/qr/")[1]?.split("?")[0];
                if (!t) throw new Error("QR không hợp lệ");
                const res: any = await axios.get(`/api/v1/procedures/qr/${t}`);
                setResult(res?.data);
                setOpenDetail(true);
                return;
            }
            throw new Error("QR không hợp lệ");
        } catch (err: any) {
            setError(err?.message ?? "Không có quyền xem quy trình này");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => { await stopScan(); setResult(null); setError(null); };
    const handleClose = async () => {
        await stopScan(); setResult(null); setError(null); setOpenDetail(false); onClose();
    };
    const handleCloseDetail = async () => {
        setOpenDetail(false); setResult(null); setError(null);
    };

    useEffect(() => {
        if (open && !result && !error) setTimeout(() => startScan(), 300);
        if (!open) stopScan();
    }, [open, result, error]);

    const getProcedureType = (r: any) => {
        if (r?.accessList !== undefined) return "CONFIDENTIAL";
        if (r?.departments !== undefined) return "DEPARTMENT";
        return "COMPANY";
    };

    return (
        <>
            <style>{`
                @keyframes qr-scanline {
                    0%   { top: calc(50% - ${BOX / 2}px); opacity: 0; }
                    5%   { opacity: 1; }
                    95%  { opacity: 1; }
                    100% { top: calc(50% + ${BOX / 2}px); opacity: 0; }
                }
                @keyframes qr-pulse-dot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50%      { transform: scale(1.6); opacity: 0.5; }
                }
                @keyframes qr-spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes qr-fadein {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                #qr-modal-reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    display: block !important;
                    border-radius: 0 !important;
                }
                #qr-modal-reader { border-radius: 0 !important; }
                #qr-modal-reader__scan_region { border: none !important; }
                #qr-modal-reader__scan_region img { display: none !important; }
                #qr-modal-reader__dashboard { display: none !important; }
            `}</style>

            <Modal
                open={open}
                onCancel={handleClose}
                footer={null}
                centered
                width={400}
                title={
                    <Flex align="center" gap={10}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: `0 3px 10px ${C.primary}44`,
                        }}>
                            <QrcodeOutlined style={{ color: "#fff", fontSize: 15 }} />
                        </div>
                        <Text strong style={{ fontSize: 14 }}>Quét mã QR quy trình</Text>
                    </Flex>
                }
                destroyOnClose
                styles={{
                    header: {
                        paddingBottom: 12,
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    },
                    body: { padding: 0 },
                    content: { borderRadius: 16, overflow: "hidden" },
                }}
            >
                {/* ── Top accent bar ── */}
                <div style={{
                    height: 3,
                    background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight}, #93c5fd)`,
                }} />

                {/* ══ CAMERA / SCANNING STATE ══ */}
                {!result && !error && !loading && (
                    <div style={{ animation: "qr-fadein 0.3s ease" }}>
                        {/* Camera viewport — dark full-width */}
                        <div style={{
                            position: "relative",
                            background: "#000",
                            height: 280,
                            overflow: "hidden",
                        }}>
                            <div
                                id="qr-modal-reader"
                                style={{
                                    position: "absolute", inset: 0,
                                    display: scanning ? "block" : "none",
                                }}
                            />

                            {/* Placeholder khi chưa scan */}
                            {!scanning && (
                                <Flex vertical align="center" justify="center" gap={10}
                                    style={{ height: "100%", opacity: 0.5 }}
                                >
                                    <QrcodeOutlined style={{ fontSize: 48, color: "#fff" }} />
                                    <Text style={{ color: "#fff", fontSize: 12 }}>
                                        Đang khởi động camera…
                                    </Text>
                                </Flex>
                            )}

                            {/* Dark overlay + L-brackets + scanline */}
                            {scanning && <ScanOverlay />}

                            {/* Bottom hint khi đang scan */}
                            {scanning && (
                                <div style={{
                                    position: "absolute", bottom: 0, left: 0, right: 0,
                                    padding: "12px 16px 14px",
                                    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                                    textAlign: "center",
                                }}>
                                    <Flex align="center" justify="center" gap={7}>
                                        <span style={{
                                            width: 7, height: 7, borderRadius: "50%",
                                            background: "#4ade80",
                                            display: "inline-block",
                                            animation: "qr-pulse-dot 1.3s ease-in-out infinite",
                                            boxShadow: "0 0 6px #4ade80",
                                        }} />
                                        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 500 }}>
                                            Đang quét… Hướng camera vào mã QR
                                        </Text>
                                    </Flex>
                                </div>
                            )}
                        </div>

                        {/* Controls bên dưới camera */}
                        <div style={{ padding: "14px 20px 18px" }}>
                            {scanning ? (
                                <Button
                                    block
                                    icon={<StopOutlined />}
                                    onClick={stopScan}
                                    style={{ borderRadius: 10, height: 42, fontWeight: 500 }}
                                >
                                    Dừng quét
                                </Button>
                            ) : (
                                <Button
                                    type="primary" block
                                    icon={<QrcodeOutlined />}
                                    onClick={startScan}
                                    style={{
                                        borderRadius: 10, height: 42,
                                        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                                        border: "none", fontWeight: 600,
                                        boxShadow: `0 4px 14px ${C.primary}55`,
                                    }}
                                >
                                    Mở camera
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* ══ LOADING ══ */}
                {loading && (
                    <Flex vertical align="center" justify="center" gap={14}
                        style={{ padding: "52px 24px", background: "#0f172a" }}
                    >
                        <div style={{
                            width: 44, height: 44, borderRadius: "50%",
                            border: "3px solid rgba(255,255,255,0.1)",
                            borderTop: "3px solid #fff",
                            animation: "qr-spin 0.75s linear infinite",
                        }} />
                        <div style={{ textAlign: "center" }}>
                            <Text strong style={{ fontSize: 14, color: "#fff", display: "block", marginBottom: 3 }}>
                                Đang tải thông tin…
                            </Text>
                            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                                Vui lòng chờ trong giây lát
                            </Text>
                        </div>
                    </Flex>
                )}

                {/* ══ SUCCESS (trước khi mở detail) ══ */}
                {result && !openDetail && !loading && (
                    <Flex vertical align="center" gap={10}
                        style={{
                            padding: "36px 24px 28px",
                            background: "#0f172a",
                            animation: "qr-fadein 0.3s ease",
                        }}
                    >
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "rgba(74,222,128,0.1)",
                            border: "1.5px solid rgba(74,222,128,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <CheckCircleFilled style={{ fontSize: 28, color: "#4ade80" }} />
                        </div>
                        <Text strong style={{ fontSize: 15, color: "#fff" }}>Quét thành công!</Text>
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textAlign: "center" }}>
                            Đang mở thông tin quy trình…
                        </Text>
                    </Flex>
                )}

                {/* ══ ERROR ══ */}
                {error && !loading && (
                    <Flex vertical align="center" gap={10}
                        style={{
                            padding: "36px 24px 28px",
                            background: "#0f172a",
                            animation: "qr-fadein 0.3s ease",
                        }}
                    >
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "rgba(251,191,36,0.1)",
                            border: "1.5px solid rgba(251,191,36,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <WarningFilled style={{ fontSize: 26, color: "#fbbf24" }} />
                        </div>
                        <Text strong style={{ fontSize: 14, color: "#fff" }}>Không thể xem quy trình</Text>
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textAlign: "center" }}>
                            {error}
                        </Text>
                        <Button
                            block icon={<ReloadOutlined />} onClick={handleReset}
                            style={{
                                borderRadius: 10, height: 42, marginTop: 4,
                                fontWeight: 500,
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "#fff",
                            }}
                        >
                            Quét lại
                        </Button>
                    </Flex>
                )}
            </Modal>

            {/* ── Procedure detail modal ── */}
            {result && !result.isTextOnly && (
                <ViewProcedure
                    type={getProcedureType(result)}
                    open={openDetail}
                    onClose={handleCloseDetail}
                    dataInit={result}
                />
            )}
        </>
    );
};

export default QrScannerModal;