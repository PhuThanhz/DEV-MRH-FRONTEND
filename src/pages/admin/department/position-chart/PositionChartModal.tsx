// src/pages/admin/department/position-chart/PositionChartModal.tsx
import { useEffect, useState } from "react";
import { Modal, Table, Spin, Empty, Tag } from "antd";
import { TeamOutlined, CalendarOutlined, BankOutlined } from "@ant-design/icons";
import { callFetchCompanyJobTitlesOfDepartment } from "@/config/api";
import type { IDepartmentJobTitle } from "@/types/backend";

interface PositionChartModalProps {
    open: boolean;
    onClose: () => void;
    departmentId: number;
    departmentName?: string;
    companyName?: string;
}

const getBandStyle = (code: string): { bg: string; border: string; color: string } => {
    const prefix = code?.charAt(0)?.toUpperCase();
    const map: Record<string, { bg: string; border: string; color: string }> = {
        M: { bg: "#fdf2f8", border: "1.5px solid #f9a8d4", color: "#9d174d" }, // Rose — match theme header
        S: { bg: "#faf5ff", border: "1.5px solid #d8b4fe", color: "#6b21a8" }, // Violet — chuyên môn
        P: { bg: "#f0fdf4", border: "1.5px solid #86efac", color: "#166534" }, // Green — dự án
        E: { bg: "#fff7ed", border: "1.5px solid #fdba74", color: "#9a3412" }, // Orange — điều hành
        T: { bg: "#eff6ff", border: "1.5px solid #93c5fd", color: "#1e40af" }, // Blue — kỹ thuật
    };
    return map[prefix] ?? { bg: "#f8fafc", border: "1.5px solid #cbd5e1", color: "#475569" };
};

const PositionChartModal: React.FC<PositionChartModalProps> = ({
    open,
    onClose,
    departmentId,
    departmentName = "",
    companyName = "",
}) => {
    const [data, setData] = useState<IDepartmentJobTitle[]>([]);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!open || !departmentId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await callFetchCompanyJobTitlesOfDepartment(departmentId);
                const list = (res?.data ?? [])
                    .filter((x: any) => x.source === "DEPARTMENT")
                    .map((x: any) => ({
                        ...x,
                        jobTitle: {
                            ...x.jobTitle,
                            nameEn: x.jobTitle?.nameEn || "",
                            positionCode: x.jobTitle?.positionCode || "",
                        },
                    }));
                const sorted = [...list].sort((a, b) => {
                    const orderA = a.jobTitle?.bandOrder ?? 999;
                    const orderB = b.jobTitle?.bandOrder ?? 999;
                    if (orderA !== orderB) return orderA - orderB;
                    return (a.jobTitle?.levelNumber ?? 0) - (b.jobTitle?.levelNumber ?? 0);
                });
                setData(sorted);
            } catch (err) {
                console.error("Lỗi tải bản đồ chức danh:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [open, departmentId]);

    const today = new Date();
    const formattedDate = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

    const columns = [
        {
            title: "STT",
            width: 64,
            align: "center" as const,
            onHeaderCell: () => ({ style: { textAlign: "center" as const } }),
            render: (_: any, __: any, index: number) => (
                <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#f3f4f6",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#6b7280",
                }}>
                    {index + 1}
                </span>
            ),
        },
        {
            title: "Bậc chức danh",
            dataIndex: ["jobTitle", "positionCode"],
            width: isMobile ? 110 : 150,
            align: "center" as const,
            onHeaderCell: () => ({ style: { textAlign: "center" as const } }),
            render: (v: string) => {
                if (!v) return <span style={{ color: "#d1d5db" }}>--</span>;
                const s = getBandStyle(v);
                return (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <Tag style={{
                            fontWeight: 700,
                            fontSize: 12,
                            padding: "3px 14px",
                            borderRadius: 20,
                            background: s.bg,
                            border: s.border,
                            color: s.color,
                            letterSpacing: "0.3px",
                            margin: 0,
                        }}>
                            {v}
                        </Tag>
                    </div>
                );
            },
        },
        {
            title: "Chức danh Tiếng Việt",
            dataIndex: ["jobTitle", "nameVi"],
            onHeaderCell: () => ({ style: { textAlign: "left" as const } }),
            render: (v: string) => (
                <span style={{
                    fontWeight: 600,
                    color: "#111827",
                    fontSize: isMobile ? 13 : 14,
                }}>
                    {v || "--"}
                </span>
            ),
        },
        ...(!isMobile ? [{
            title: "Chức danh Tiếng Anh",
            dataIndex: ["jobTitle", "nameEn"],
            onHeaderCell: () => ({ style: { textAlign: "left" as const } }),
            render: (v: string) => (
                <span style={{ color: "#6b7280", fontSize: 13 }}>
                    {v || "--"}
                </span>
            ),
        }] : []),
    ];

    return (
        <Modal
            title={null}
            open={open}
            onCancel={onClose}
            footer={null}
            width="min(92vw, 1100px)"
            centered
            destroyOnClose
            styles={{
                mask: {
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    background: "rgba(255, 255, 255, 0.45)",
                },
                body: {
                    padding: 0,
                    borderRadius: 16,
                    overflow: "hidden",
                },
                content: {
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 32px 80px rgba(190,24,93,0.12), 0 8px 24px rgba(0,0,0,0.08)",
                    padding: 0,
                },
            }}
        >
            {/* ── HEADER ── */}
            <div style={{
                background: "linear-gradient(135deg, #831843 0%, #be185d 55%, #ec4899 100%)",
                padding: isMobile ? "24px 24px 20px" : "32px 48px 28px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                position: "relative",
                overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute", top: -40, right: -40,
                    width: 180, height: 180, borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)", pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: -60, right: 80,
                    width: 240, height: 240, borderRadius: "50%",
                    background: "rgba(255,255,255,0.04)", pointerEvents: "none",
                }} />

                <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <span style={{
                            fontSize: 11, fontWeight: 600,
                            textTransform: "uppercase", letterSpacing: "1.5px",
                            color: "rgba(255,255,255,0.75)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                            {companyName}                        </span>
                    </div>
                    <div style={{
                        fontSize: isMobile ? 20 : 24, fontWeight: 800,
                        color: "#fff", lineHeight: 1.2,
                        textShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}>
                        Bản đồ chức danh
                    </div>
                    <div style={{
                        fontSize: isMobile ? 13 : 14, fontWeight: 500,
                        color: "rgba(255,255,255,0.85)", marginTop: 5,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {departmentName || "—"}
                    </div>
                </div>

                {!loading && data.length > 0 && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: 14,
                        padding: isMobile ? "10px 16px" : "12px 22px",
                        flexShrink: 0, position: "relative", zIndex: 1,
                    }}>
                        <TeamOutlined style={{ color: "#fff", fontSize: isMobile ? 20 : 22 }} />
                        <div>
                            <div style={{
                                fontSize: isMobile ? 22 : 26,
                                fontWeight: 800, color: "#fff", lineHeight: 1,
                            }}>
                                {data.length}
                            </div>
                            <div style={{
                                fontSize: 10, color: "rgba(255,255,255,0.75)",
                                marginTop: 3, textTransform: "uppercase", letterSpacing: "0.5px",
                            }}>
                                Chức danh
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── BODY ── */}
            <div style={{
                padding: isMobile ? "20px 16px" : "28px 48px",
                maxHeight: "60vh",
                overflow: "auto",
                background: "#fff",
            }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <Spin size="large" />
                    </div>
                ) : data.length > 0 ? (
                    <Table
                        dataSource={data}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        bordered={false}
                        size="middle"
                        scroll={{ x: "max-content" }}
                        style={{
                            borderRadius: 10,
                            overflow: "hidden",
                            border: "1px solid #f3f4f6",
                        }}
                        components={{
                            header: {
                                cell: (props: any) => (
                                    <th
                                        {...props}
                                        style={{
                                            background: "#f9fafb",
                                            color: "#374151",
                                            fontWeight: 700,
                                            borderBottom: "1px solid #e5e7eb",
                                            padding: isMobile ? "12px 12px" : "13px 20px",
                                            fontSize: "12px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.6px",
                                            whiteSpace: "nowrap",
                                            ...props.style,
                                        }}
                                    />
                                ),
                            },
                            body: {
                                row: (props: any) => (
                                    <tr
                                        {...props}
                                        onMouseEnter={e =>
                                            (e.currentTarget.style.background = "#f9fafb")
                                        }
                                        onMouseLeave={e =>
                                            (e.currentTarget.style.background = "")
                                        }
                                        style={{ transition: "background 0.15s" }}
                                    />
                                ),
                                cell: (props: any) => (
                                    <td
                                        {...props}
                                        style={{
                                            padding: isMobile ? "12px 12px" : "14px 20px",
                                            verticalAlign: "middle",
                                            borderBottom: "1px solid #f3f4f6",
                                            fontSize: "14px",
                                            background: "transparent",
                                        }}
                                    />
                                ),
                            },
                        }}
                    />
                ) : (
                    <Empty
                        description={
                            <span style={{ color: "#9ca3af" }}>
                                Chưa có chức danh nào được gán cho phòng ban này
                            </span>
                        }
                        style={{ margin: "60px 0" }}
                    />
                )}
            </div>

            {/* ── FOOTER ── */}
            <div style={{
                padding: isMobile ? "12px 16px" : "13px 48px",
                borderTop: "1px solid #f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6,
                background: "#fafafa",
            }}>
                <CalendarOutlined style={{ color: "#9ca3af", fontSize: 13 }} />
                <span style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
                    {formattedDate}
                </span>
            </div>
        </Modal>
    );
};

export default PositionChartModal;