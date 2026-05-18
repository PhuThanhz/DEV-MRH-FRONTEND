import { useEffect, useRef, useState } from "react";
import {
    Modal, Button, Typography, theme, Flex, Slider,
} from "antd";
import {
    QrcodeOutlined, ReloadOutlined,
    WarningFilled, StopOutlined, CheckCircleFilled,
    BulbOutlined, ZoomInOutlined, ZoomOutOutlined,
} from "@ant-design/icons";
import { Html5Qrcode } from "html5-qrcode";
import axios from "@/config/axios-customize";
import ViewProcedure from "@/pages/admin/procedures/view.procedure";
import ViewDetailDocument from "@/pages/admin/document/view.document";
import type { IDocument } from "@/types/backend";

const { Text } = Typography;
const { useToken } = theme;

const C = {
    primary: "#be185d",
    primaryLight: "#ec4899",
    primarySoft: "#fdf2f8",
    primaryBorder: "#fbcfe8",
    warning: "#d97706",
    warningBg: "#fffbeb",
    warningBorder: "#fde68a",
};

const BOX = 200; // Tăng lên 200px giúp vùng quét rộng hơn, cực nhạy
const ARM = 24;
const THICK = 4; // Bo góc dày dặn hơn

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

const Corners = () => (
    <>
        <div style={{ position: "absolute", top: `calc(50% - ${BOX / 2}px)`, left: `calc(50% - ${BOX / 2}px)` }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: ARM, height: THICK, background: "#ec4899", borderRadius: 4, boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)" }} />
            <div style={{ position: "absolute", top: 0, left: 0, width: THICK, height: ARM, background: "#ec4899", borderRadius: 4, boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)" }} />
        </div>
        <div style={{ position: "absolute", top: `calc(50% - ${BOX / 2}px)`, right: `calc(50% - ${BOX / 2}px)` }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: ARM, height: THICK, background: "#ec4899", borderRadius: 4, boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)" }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: THICK, height: ARM, background: "#ec4899", borderRadius: 4, boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)" }} />
        </div>
        <div style={{ position: "absolute", bottom: `calc(50% - ${BOX / 2}px)`, left: `calc(50% - ${BOX / 2}px)` }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: ARM, height: THICK, background: "#ec4899", borderRadius: 4, boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: THICK, height: ARM, background: "#ec4899", borderRadius: 4, boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)" }} />
        </div>
        <div style={{ position: "absolute", bottom: `calc(50% - ${BOX / 2}px)`, right: `calc(50% - ${BOX / 2}px)` }}>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: ARM, height: THICK, background: "#ec4899", borderRadius: 4, boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: THICK, height: ARM, background: "#ec4899", borderRadius: 4, boxShadow: "0 0 10px rgba(236, 72, 153, 0.8)" }} />
        </div>
    </>
);

const ScanOverlay = () => (
    <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
    }}>
        {/* Lớp phủ kính mờ (Frosted Glass) xung quanh tạo hiệu ứng Focus chuyên nghiệp */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `calc(50% - ${BOX / 2}px)`, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(6px)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `calc(50% - ${BOX / 2}px)`, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(6px)" }} />
        <div style={{ position: "absolute", top: `calc(50% - ${BOX / 2}px)`, bottom: `calc(50% - ${BOX / 2}px)`, left: 0, width: `calc(50% - ${BOX / 2}px)`, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(6px)" }} />
        <div style={{ position: "absolute", top: `calc(50% - ${BOX / 2}px)`, bottom: `calc(50% - ${BOX / 2}px)`, right: 0, width: `calc(50% - ${BOX / 2}px)`, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(6px)" }} />

        {/* Khung quét trung tâm có viền màu thương hiệu Lotus Pink cực kỳ tinh tế */}
        <div style={{
            position: "absolute",
            width: BOX,
            height: BOX,
            border: "1px solid rgba(236, 72, 153, 0.4)",
            borderRadius: 16,
            boxShadow: "0 0 25px rgba(236, 72, 153, 0.12), inset 0 0 15px rgba(236, 72, 153, 0.05)",
        }} />

        <Corners />

        {/* Laser quét dạng Neon Hồng phát sáng chuyển động cực kỳ sang trọng */}
        <div style={{
            position: "absolute",
            left: `calc(50% - ${BOX / 2}px)`,
            width: BOX,
            height: 4,
            background: "linear-gradient(90deg, transparent, #ec4899, #f472b6, #ec4899, transparent)",
            boxShadow: "0 0 12px #ec4899, 0 0 4px #ec4899",
            animation: "qr-scanline 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            borderRadius: "50%",
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
    const [hasTorch, setHasTorch] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [hasZoom, setHasZoom] = useState(false);
    const [zoomMin, setZoomMin] = useState(1);
    const [zoomMax, setZoomMax] = useState(4);
    const [zoomStep, setZoomStep] = useState(0.1);
    const [zoomValue, setZoomValue] = useState(1);

    // ✅ FIX: stopScan thêm .clear() + null ref để release hoàn toàn camera stream
    const stopScan = async () => {
        try {
            if (scannerRef.current) {
                if (torchOn) {
                    try {
                        await scannerRef.current.applyVideoConstraints({
                            advanced: [{ torch: false } as any]
                        });
                    } catch {}
                }
                await scannerRef.current.stop();
                try { scannerRef.current.clear(); } catch { }
                scannerRef.current = null;
            }
        } catch { }
        setScanning(false);
        setHasTorch(false);
        setTorchOn(false);
        setHasZoom(false);
        setZoomValue(1);
    };

    const toggleTorch = async () => {
        if (!scannerRef.current) return;
        const nextState = !torchOn;
        try {
            await scannerRef.current.applyVideoConstraints({
                advanced: [{ torch: nextState } as any]
            });
            setTorchOn(nextState);
        } catch {
            try {
                const track = (scannerRef.current as any).getRunningTrack();
                await track.applyConstraints({
                    advanced: [{ torch: nextState } as any]
                });
                setTorchOn(nextState);
            } catch {}
        }
    };

    const playSuccessFeedback = () => {
        // 1. Web Audio API bíp âm thanh chất lượng cao
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(987.77, ctx.currentTime); // Tần số nốt B5 trong trẻo
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch {}

        // 2. Rung phản hồi haptic trên thiết bị di động
        if (navigator.vibrate) {
            try { navigator.vibrate(60); } catch {}
        }
    };


    const handleZoomChange = async (value: number) => {
        setZoomValue(value);
        
        // 1. Áp dụng Hardware zoom của camera phần cứng (nếu điện thoại hỗ trợ)
        if (scannerRef.current) {
            try {
                const track = (scannerRef.current as any).getRunningTrack();
                if (track) {
                    await track.applyConstraints({
                        advanced: [{ zoom: value } as any]
                    });
                }
            } catch {}
        }

        // 2. Luôn áp dụng CSS digital zoom trên thẻ <video> để hoạt động hoàn hảo trên mọi thiết bị (Macbook, Laptop, PC, iOS/Android)
        try {
            const videoElem = document.querySelector("#qr-modal-reader video") as HTMLVideoElement;
            if (videoElem) {
                videoElem.style.transform = `scale(${value})`;
                videoElem.style.transformOrigin = "center center";
                videoElem.style.transition = "transform 0.1s ease-out";
            }
        } catch {}
    };

    const startScan = async () => {
        setError(null);
        setResult(null);
        setHasTorch(false);
        setTorchOn(false);
        // Bật Zoom Slider theo mặc định (CSS Zoom luôn khả dụng trên mọi thiết bị)
        setHasZoom(true);
        setZoomMin(1);
        setZoomMax(3);
        setZoomStep(0.1);
        setZoomValue(1);
        const scanner = new Html5Qrcode("qr-modal-reader");
        scannerRef.current = scanner;

        const onSuccess = async (decodedText: string) => {
            playSuccessFeedback();
            await scanner.stop();
            try { scanner.clear(); } catch { }
            scannerRef.current = null;
            setScanning(false);
            setHasTorch(false);
            setTorchOn(false);
            setHasZoom(false);
            setZoomValue(1);
            handleScanSuccess(decodedText);
        };

        try {
            // Mở camera với cấu hình tương thích cao nhất, tăng FPS lên 25 và thu hẹp vùng quét (qrbox) để tối ưu CPU tối đa
            await scanner.start(
                { facingMode: "environment" },
                { 
                    fps: 25,
                    qrbox: (width, height) => {
                        const size = Math.min(width, height) * 0.7;
                        return { width: size, height: size };
                    }
                },
                onSuccess,
                () => { }
            );
            setScanning(true);
        } catch (err) {
            try {
                // Fallback nếu máy tính chỉ có camera trước (laptop/PC)
                await scanner.start(
                    { facingMode: "user" },
                    { 
                        fps: 25,
                        qrbox: (width, height) => {
                            const size = Math.min(width, height) * 0.7;
                            return { width: size, height: size };
                        }
                    },
                    onSuccess,
                    () => { }
                );
                setScanning(true);
            } catch (fallbackErr) {
                setError("Không thể mở camera. Kiểm tra quyền truy cập camera.");
            }
        }

        // Kiểm tra khả năng bật Đèn pin và Thu phóng của camera sau khi mở thành công
        if (scannerRef.current) {
            setTimeout(() => {
                try {
                    const capabilities = scanner.getRunningTrackCapabilities() as any;
                    if (capabilities) {
                        if (capabilities.torch) {
                            setHasTorch(true);
                        }
                        if (capabilities.zoom) {
                            // Nếu thiết bị có hardware zoom xịn, nâng cấp giới hạn tối đa theo phần cứng
                            setZoomMin(capabilities.zoom.min || 1);
                            setZoomMax(capabilities.zoom.max || 4);
                            setZoomStep(capabilities.zoom.step || 0.1);
                        }
                    }
                } catch {}
            }, 800);
        }
    };

    const handleScanSuccess = async (decodedText: string) => {
        setLoading(true);
        try {
            // Trường hợp 1: Quét mã liên kết chia sẻ công khai (Public view QR)
            if (decodedText.includes("/public/view/")) {
                const token = decodedText.split("/public/view/")[1]?.split("?")[0];
                if (!token) throw new Error("Mã QR không hợp lệ");
                window.open(`/public/view/${token}`, "_blank");
                handleClose();
                return;
            }

            // Trường hợp 2: Quét mã QR nội bộ hệ thống (Internal view QR)
            if (decodedText.includes("/qr/")) {
                const t = decodedText.split("/qr/")[1]?.split("?")[0];
                if (!t) throw new Error("QR không hợp lệ");
                const res: any = await axios.get(`/api/v1/procedures/qr/${t}`);
                setResult(res?.data);
                setOpenDetail(true);
                return;
            }
            throw new Error("Mã QR không thuộc hệ thống hoặc không hợp lệ");
        } catch (err: any) {
            const serverMsg = err?.response?.data?.message ?? err?.message ?? "Không có quyền xem quy trình này";
            let userFriendlyMsg = serverMsg;
            // Dịch thông báo kỹ thuật "endpoint" của backend thành thông báo thân thiện dễ hiểu với người dùng doanh nghiệp
            if (serverMsg.includes("endpoint") || serverMsg.includes("quyền truy cập")) {
                userFriendlyMsg = "Bạn không có quyền xem thông tin quy trình/văn bản này. Vui lòng liên hệ Quản trị viên để được cấp quyền.";
            }
            setError(userFriendlyMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        await stopScan();
        setResult(null);
        setError(null);
    };

    const handleClose = async () => {
        await stopScan();
        setResult(null);
        setError(null);
        setOpenDetail(false);
        onClose();
    };

    const handleCloseDetail = async () => {
        setOpenDetail(false);
        setResult(null);
        setError(null);
    };

    // ✅ FIX: chỉ theo dõi `open`, không có result/error trong deps để tránh re-trigger
    useEffect(() => {
        if (open) {
            setTimeout(() => startScan(), 300);
        } else {
            stopScan();
        }
    }, [open]);

    // ✅ FIX: cleanup khi unmount — dùng finally để đảm bảo luôn chạy
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

    const getProcedureType = (r: any) => {
        if (r?.type) return r.type;
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

                /* Ẩn hoàn toàn khung nét đứt màu trắng mặc định của thư viện */
                #qr-modal-reader div[style*="border"],
                #qr-modal-reader .qr-shaded-region,
                #qr-modal-reader #qr-shaded-region,
                #qr-modal-reader div[id*="shaded-region"] {
                    border: none !important;
                }
                #qr-modal-reader div[id*="shaded-region"] > div {
                    display: none !important;
                }
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
                        <Text strong style={{ fontSize: 14 }}>Quét mã QR tài liệu</Text>
                    </Flex>
                }
                destroyOnHidden
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
                    height: 2,
                    background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
                }} />

                {/* ══ CAMERA / SCANNING STATE ══ */}
                {!result && !error && !loading && (
                    <div style={{ animation: "qr-fadein 0.3s ease" }}>
                        <div style={{
                            position: "relative",
                            background: "#000",
                            height: 280,
                            overflow: "hidden",
                        }}>
                            {/* ✅ FIX: dùng visibility thay display:none để tránh Html5Qrcode mất DOM */}
                            <div
                                id="qr-modal-reader"
                                style={{
                                    position: "absolute", inset: 0,
                                    visibility: scanning ? "visible" : "hidden",
                                }}
                            />

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

                            {scanning && <ScanOverlay />}

                            {scanning && hasTorch && (
                                <button
                                    onClick={toggleTorch}
                                    style={{
                                        position: "absolute",
                                        top: 14,
                                        right: 14,
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background: torchOn ? "#eab308" : "rgba(15, 23, 42, 0.6)",
                                        border: torchOn ? "1px solid #facc15" : "1px solid rgba(255, 255, 255, 0.2)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        color: "#fff",
                                        boxShadow: torchOn ? "0 0 15px rgba(234, 179, 8, 0.6)" : "0 4px 12px rgba(0, 0, 0, 0.25)",
                                        backdropFilter: "blur(6px)",
                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        zIndex: 10,
                                        padding: 0
                                    }}
                                >
                                    <BulbOutlined style={{ fontSize: 16, color: torchOn ? "#fff" : "#e2e8f0" }} />
                                </button>
                            )}

                            {scanning && hasZoom && (
                                <div style={{
                                    position: "absolute",
                                    bottom: 54,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: "80%",
                                    maxWidth: 240,
                                    background: "rgba(15, 23, 42, 0.65)",
                                    backdropFilter: "blur(8px)",
                                    borderRadius: 20,
                                    padding: "6px 14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    zIndex: 10,
                                    border: "1px solid rgba(255, 255, 255, 0.12)",
                                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.35)",
                                }}>
                                    <ZoomOutOutlined style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }} />
                                    <Slider
                                        min={zoomMin}
                                        max={zoomMax}
                                        step={zoomStep}
                                        value={zoomValue}
                                        onChange={handleZoomChange}
                                        tooltip={{ formatter: (v) => `${Number(v).toFixed(1)}x` }}
                                        style={{ flex: 1, margin: "0 4px" }}
                                        styles={{
                                            track: { background: "linear-gradient(90deg, #ec4899, #f472b6)" },
                                            handle: { border: "2px solid #ec4899", background: "#fff", boxShadow: "0 0 8px #ec4899" }
                                        }}
                                    />
                                    <ZoomInOutlined style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }} />
                                    <span style={{
                                        color: "#fff",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        minWidth: 26,
                                        textAlign: "right",
                                        fontFamily: "monospace"
                                    }}>
                                        {zoomValue.toFixed(1)}x
                                    </span>
                                </div>
                            )}

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
                        style={{ padding: "52px 24px", background: "#fff" }}
                    >
                        <div style={{
                            width: 44, height: 44, borderRadius: "50%",
                            border: "3px solid rgba(236, 72, 153, 0.1)",
                            borderTop: `3px solid ${C.primary}`,
                            animation: "qr-spin 0.75s linear infinite",
                        }} />
                        <div style={{ textAlign: "center" }}>
                            <Text strong style={{ fontSize: 14, color: token.colorText, display: "block", marginBottom: 3 }}>
                                Đang tải thông tin…
                            </Text>
                            <Text style={{ fontSize: 12, color: token.colorTextDescription }}>
                                Vui lòng chờ trong giây lát
                            </Text>
                        </div>
                    </Flex>
                )}

                {/* ══ SUCCESS ══ */}
                {result && !openDetail && !loading && (
                    <Flex vertical align="center" gap={10}
                        style={{
                            padding: "36px 24px 28px",
                            background: "#fff",
                            animation: "qr-fadein 0.3s ease",
                        }}
                    >
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "rgba(22, 163, 74, 0.08)",
                            border: "1.5px solid rgba(22, 163, 74, 0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <CheckCircleFilled style={{ fontSize: 28, color: "#16a34a" }} />
                        </div>
                        <Text strong style={{ fontSize: 15, color: token.colorText }}>Quét thành công!</Text>
                        <Text style={{ fontSize: 12, color: token.colorTextDescription, textAlign: "center" }}>
                            Đang mở thông tin chi tiết…
                        </Text>
                    </Flex>
                )}

                {/* ══ ERROR ══ */}
                {error && !loading && (
                    <Flex vertical align="center" gap={10}
                        style={{
                            padding: "36px 24px 28px",
                            background: "#fff",
                            animation: "qr-fadein 0.3s ease",
                        }}
                    >
                        <div style={{
                            width: 56, height: 56, borderRadius: "50%",
                            background: "rgba(217, 119, 6, 0.08)",
                            border: "1.5px solid rgba(217, 119, 6, 0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <WarningFilled style={{ fontSize: 26, color: "#d97706" }} />
                        </div>
                        <Text strong style={{ fontSize: 14, color: token.colorText }}>Không thể xem thông tin</Text>
                        <Text style={{ fontSize: 12, color: token.colorTextDescription, textAlign: "center", maxWidth: 290, lineHeight: 1.5 }}>
                            {error}
                        </Text>
                        <Button
                            block icon={<ReloadOutlined />} onClick={handleReset}
                            style={{
                                borderRadius: 10, height: 42, marginTop: 10,
                                fontWeight: 500,
                                background: "#fff",
                                border: `1px solid ${token.colorBorder}`,
                                color: token.colorText,
                            }}
                        >
                            Quét lại
                        </Button>
                    </Flex>
                )}
            </Modal>

            {/* ── Procedure/Document detail modal ── */}
            {result && !result.isTextOnly && (
                getProcedureType(result) === "DOCUMENT" ? (
                    <ViewDetailDocument
                        open={openDetail}
                        onClose={handleCloseDetail}
                        dataInit={result as IDocument}
                        setDataInit={setResult}
                    />
                ) : (
                    <ViewProcedure
                        type={getProcedureType(result)}
                        open={openDetail}
                        onClose={handleCloseDetail}
                        dataInit={result}
                    />
                )
            )}
        </>
    );
};

export default QrScannerModal;