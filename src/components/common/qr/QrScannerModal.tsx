import { useEffect, useRef, useState } from "react";
import {
    Modal, Button, Typography, theme, Flex,
} from "antd";
import {
    QrcodeOutlined, ReloadOutlined,
    WarningFilled, CameraOutlined, StopOutlined, CheckCircleFilled,
} from "@ant-design/icons";
import { Html5Qrcode } from "html5-qrcode";
import axios from "@/config/axios-customize";
import ViewProcedure from "@/pages/admin/procedures/view.procedure";

const { Text } = Typography;
const { useToken } = theme;

// ── Design tokens ──────────────────────────────────────────────
// QrScannerModal.tsx

const C = {
    primary: "#be185d",       // ← đổi ở đây
    primaryLight: "#ec4899",  // ← đổi ở đây
    primarySoft: "#fdf2f8",   // ← đổi ở đây
    primaryBorder: "#fbcfe8", // ← đổi ở đây
    warning: "#d97706",       // giữ nguyên
    warningBg: "#fffbeb",     // giữ nguyên
    warningBorder: "#fde68a", // giữ nguyên
};

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

/* ── Corner-bracket viewfinder overlay ─────────────────────── */
const ScanOverlay = () => (
    <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
    }}>
        {/* dimmed border outside box */}
        <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.42)",
            maskImage: "radial-gradient(ellipse 200px 200px at 50% 50%, transparent 96px, black 97px)",
            WebkitMaskImage: "radial-gradient(ellipse 200px 200px at 50% 50%, transparent 96px, black 97px)",
        }} />
        {/* 4 corner brackets */}
        {[
            { top: "calc(50% - 84px)", left: "calc(50% - 84px)", borderTop: `2.5px solid ${C.primaryLight}`, borderLeft: `2.5px solid ${C.primaryLight}`, borderRadius: "3px 0 0 0" },
            { top: "calc(50% - 84px)", right: "calc(50% - 84px)", borderTop: `2.5px solid ${C.primaryLight}`, borderRight: `2.5px solid ${C.primaryLight}`, borderRadius: "0 3px 0 0" },
            { bottom: "calc(50% - 84px)", left: "calc(50% - 84px)", borderBottom: `2.5px solid ${C.primaryLight}`, borderLeft: `2.5px solid ${C.primaryLight}`, borderRadius: "0 0 0 3px" },
            { bottom: "calc(50% - 84px)", right: "calc(50% - 84px)", borderBottom: `2.5px solid ${C.primaryLight}`, borderRight: `2.5px solid ${C.primaryLight}`, borderRadius: "0 0 3px 0" },
        ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 20, height: 20, ...s }} />
        ))}
        {/* animated scanline */}
        <div style={{
            position: "absolute",
            left: "calc(50% - 84px)", width: 168, height: 2,
            background: `linear-gradient(90deg, transparent, ${C.primaryLight}, transparent)`,
            animation: "qr-scanline 2s ease-in-out infinite",
            borderRadius: 2,
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
                { fps: 10, qrbox: { width: 200, height: 200 } },
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
                    0%   { top: calc(50% - 84px); opacity: 0; }
                    5%   { opacity: 1; }
                    95%  { opacity: 1; }
                    100% { top: calc(50% + 84px); opacity: 0; }
                }
                @keyframes qr-pulse-dot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50%      { transform: scale(1.6); opacity: 0.5; }
                }
                @keyframes qr-spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes qr-fadein {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                #qr-modal-reader video {
                    width: 100% !important;
                    height: auto !important;
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

                <div style={{ padding: "16px 20px 22px" }}>

                    {/* ── Camera + scanning state ── */}
                    {!result && !error && !loading && (
                        <div style={{ animation: "qr-fadein 0.3s ease" }}>
                            {/* Viewport */}
                            <div style={{
                                position: "relative",
                                borderRadius: 12,
                                overflow: "hidden",
                                background: scanning ? "#000" : token.colorFillQuaternary,
                                minHeight: scanning ? 260 : 0,
                                border: scanning ? "none" : `1.5px dashed ${C.primaryBorder}`,
                            }}>
                                {/* Placeholder when not scanning */}
                                {!scanning && (
                                    <Flex vertical align="center" gap={8} style={{ padding: "32px 20px" }}>
                                        <div style={{
                                            width: 68, height: 68, borderRadius: 16,
                                            background: C.primarySoft,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <CameraOutlined style={{ fontSize: 30, color: C.primaryLight, opacity: 0.75 }} />
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 12, textAlign: "center" }}>
                                            Camera sẽ tự động mở để quét mã QR
                                        </Text>
                                    </Flex>
                                )}

                                {/* Camera feed */}
                                <div
                                    id="qr-modal-reader"
                                    style={{ width: "100%", display: scanning ? "block" : "none" }}
                                />

                                {/* Overlay brackets + scanline */}
                                {scanning && <ScanOverlay />}
                            </div>

                            {/* Status / controls */}
                            {!scanning ? (
                                <Button
                                    type="primary" block size="large"
                                    icon={<QrcodeOutlined />}
                                    onClick={startScan}
                                    style={{
                                        marginTop: 14, borderRadius: 10, height: 46,
                                        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                                        border: "none", fontWeight: 600, fontSize: 14,
                                        boxShadow: `0 4px 14px ${C.primary}55`,
                                    }}
                                >
                                    Mở camera
                                </Button>
                            ) : (
                                <Flex vertical gap={8} style={{ marginTop: 12 }}>
                                    <Flex align="center" justify="center" gap={7}>
                                        <span style={{
                                            width: 7, height: 7, borderRadius: "50%",
                                            background: C.primaryLight,
                                            display: "inline-block",
                                            animation: "qr-pulse-dot 1.3s ease-in-out infinite",
                                        }} />
                                        <Text style={{ fontSize: 12, color: C.primary, fontWeight: 500 }}>
                                            Đang quét… Hướng camera vào mã QR
                                        </Text>
                                    </Flex>
                                    <Button
                                        block onClick={stopScan}
                                        icon={<StopOutlined />}
                                        style={{ borderRadius: 10, height: 40, fontWeight: 500 }}
                                    >
                                        Dừng quét
                                    </Button>
                                </Flex>
                            )}
                        </div>
                    )}

                    {/* ── Loading ── */}
                    {loading && (
                        <Flex vertical align="center" justify="center" gap={14} style={{ padding: "40px 0" }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: "50%",
                                border: `3px solid ${C.primarySoft}`,
                                borderTop: `3px solid ${C.primary}`,
                                animation: "qr-spin 0.75s linear infinite",
                            }} />
                            <div style={{ textAlign: "center" }}>
                                <Text strong style={{ fontSize: 14, display: "block", marginBottom: 3 }}>
                                    Đang tải thông tin…
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>Vui lòng chờ trong giây lát</Text>
                            </div>
                        </Flex>
                    )}

                    {/* ── Success (before opening detail) ── */}
                    {result && !openDetail && !loading && (
                        <Flex vertical align="center" gap={10} style={{ padding: "28px 0 12px", animation: "qr-fadein 0.3s ease" }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: "50%",
                                background: "#f0fdf4",
                                border: "1.5px solid #bbf7d0",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <CheckCircleFilled style={{ fontSize: 26, color: "#16a34a" }} />
                            </div>
                            <Text strong style={{ fontSize: 14 }}>Quét thành công!</Text>
                            <Text type="secondary" style={{ fontSize: 12, textAlign: "center" }}>
                                Đang mở thông tin quy trình…
                            </Text>
                        </Flex>
                    )}

                    {/* ── Error ── */}
                    {error && !loading && (
                        <Flex vertical align="center" gap={10} style={{ padding: "28px 0 8px", animation: "qr-fadein 0.3s ease" }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: "50%",
                                background: C.warningBg,
                                border: `1.5px solid ${C.warningBorder}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <WarningFilled style={{ fontSize: 24, color: C.warning }} />
                            </div>
                            <Text strong style={{ fontSize: 14 }}>Không thể xem quy trình</Text>
                            <Text type="secondary" style={{ fontSize: 12, textAlign: "center" }}>{error}</Text>
                            <Button
                                block icon={<ReloadOutlined />} onClick={handleReset}
                                style={{
                                    borderRadius: 10, height: 42, marginTop: 6,
                                    fontWeight: 500,
                                    borderColor: C.primaryBorder, color: C.primary,
                                }}
                            >
                                Quét lại
                            </Button>
                        </Flex>
                    )}

                </div>
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