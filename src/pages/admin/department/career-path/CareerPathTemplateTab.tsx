import { useState } from "react";
import { Typography, Button, Modal, Tooltip, Space, Skeleton } from "antd";
import {
    PlusOutlined,
    EditOutlined,
    CheckCircleOutlined,
    StopOutlined,
    ApartmentOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";

import SearchFilter from "@/components/common/filter/SearchFilter";
import {
    useCareerPathTemplatesByDepartmentQuery,
    useDeactivateCareerPathTemplateMutation,
    useActivateCareerPathTemplateMutation,
} from "@/hooks/useCareerPathTemplates";
import type { ICareerPathTemplate } from "@/types/backend";
import ModalCareerPathTemplate from "./ModalCareerPathTemplate";
import ViewCareerPath from "./ViewCareerPath";

const { Text } = Typography;

const T = {
    ink: "#0d0d10",
    ink2: "#232329",
    ink3: "#4a4a54",
    ink4: "#8a8a96",
    ink5: "#b8b8c2",
    ink6: "#dcdce6",
    white: "#ffffff",
    s1: "#f7f7fa",
    s2: "#efeff4",
    line: "rgba(0,0,0,0.06)",
    lineMed: "rgba(0,0,0,0.10)",

    acc: "#2563eb",
    accSoft: "rgba(37,99,235,0.06)",
    accBord: "rgba(37,99,235,0.16)",

    violet: "#6d28d9",
    violetSoft: "rgba(109,40,217,0.06)",
    violetBord: "rgba(109,40,217,0.16)",

    amber: "#b45309",
    amberSoft: "rgba(180,83,9,0.06)",
    amberBord: "rgba(180,83,9,0.18)",

    red: "#dc2626",
    redSoft: "rgba(220,38,38,0.06)",
    redBord: "rgba(220,38,38,0.16)",

    green: "#16a34a",
    greenSoft: "rgba(22,163,74,0.06)",
    greenBord: "rgba(22,163,74,0.16)",

    slate: "#475569",
    slateSoft: "rgba(71,85,105,0.06)",
    slateBord: "rgba(71,85,105,0.16)",
};

const LEVEL_COLOR: Record<string, { bg: string; bd: string; txt: string }> = {
    S: { bg: T.accSoft, bd: T.accBord, txt: T.acc },
    M: { bg: T.violetSoft, bd: T.violetBord, txt: T.violet },
    T: { bg: T.greenSoft, bd: T.greenBord, txt: T.green },
    D: { bg: T.amberSoft, bd: T.amberBord, txt: T.amber },
};

const levelBadgeStyle = (code?: string): React.CSSProperties => {
    const c = LEVEL_COLOR[code?.[0]?.toUpperCase() ?? ""] ?? {
        bg: T.slateSoft, bd: T.slateBord, txt: T.slate,
    };
    return {
        display: "inline-flex", alignItems: "center",
        padding: "2px 6px", borderRadius: 5,
        background: c.bg, border: `1px solid ${c.bd}`,
        fontSize: 10, fontWeight: 700, color: c.txt,
        letterSpacing: 0.3, whiteSpace: "nowrap", lineHeight: "16px",
        flexShrink: 0,
    };
};

// ── Icon action button ────────────────────────────────────────────────
const IconBtn = ({
    icon, tooltip, onClick, variant,
}: {
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
    variant?: "danger" | "success" | "default";
}) => {
    const colors = {
        danger: { bg: T.redSoft, bd: T.redBord, color: T.red },
        success: { bg: T.greenSoft, bd: T.greenBord, color: T.green },
        default: { bg: T.white, bd: T.ink6, color: T.ink4 },
    }[variant ?? "default"];
    return (
        <Tooltip title={tooltip} mouseEnterDelay={0.3}>
            <button
                onClick={onClick}
                style={{
                    width: 28, height: 28, borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${colors.bd}`,
                    background: colors.bg, color: colors.color,
                    cursor: "pointer", fontSize: 13,
                    transition: "opacity 0.15s",
                }}
            >
                {icon}
            </button>
        </Tooltip>
    );
};

// ── Step chip — chip trung tính, chỉ badge có màu ─────────────────────
const StepChip = ({ step, isLast }: { step: any; isLast: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px 4px 6px", borderRadius: 8,
            background: T.white,
            border: `1px solid ${T.ink6}`,   // ← border rõ hơn thay vì T.line
        }}>
            {step.positionLevelCode && (
                <span style={levelBadgeStyle(step.positionLevelCode)}>
                    {step.positionLevelCode}
                </span>
            )}
            <Text style={{
                fontSize: 12.5, fontWeight: 500,
                color: T.ink2, whiteSpace: "nowrap",
            }}>
                {step.jobTitleName}
            </Text>
            {/* Thời gian — chỉ hiện nếu không phải bước cuối */}
            {step.durationMonths && !isLast && (
                <span style={{
                    padding: "1px 5px", borderRadius: 4,
                    background: T.s2, border: `1px solid ${T.ink6}`,
                    fontSize: 10, fontWeight: 600, color: T.ink4,
                    whiteSpace: "nowrap",
                }}>
                    {step.durationMonths}th
                </span>
            )}
        </div>
        {!isLast && (
            <Text style={{
                fontSize: 11, color: T.ink5,
                userSelect: "none", lineHeight: 1, flexShrink: 0,
            }}>
                →
            </Text>
        )}
    </div>
);

// ── Empty state ───────────────────────────────────────────────────────
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
    <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "72px 24px",
        background: T.white, borderRadius: 14,
        border: `1px dashed ${T.ink6}`, gap: 14,
    }}>
        <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: T.accSoft, border: `1px solid ${T.accBord}`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <ApartmentOutlined style={{ fontSize: 22, color: T.acc }} />
        </div>
        <div style={{ textAlign: "center" }}>
            <Text style={{ fontSize: 14, color: T.ink2, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Chưa có lộ trình thăng tiến
            </Text>
            <Text style={{ fontSize: 12.5, color: T.ink4, display: "block" }}>
                Tạo khung lộ trình để định hướng phát triển cho nhân viên
            </Text>
        </div>
        <Button
            type="primary" icon={<PlusOutlined />} onClick={onAdd}
            style={{ borderRadius: 8, fontWeight: 600, height: 36, background: T.acc, borderColor: T.acc }}
        >
            Tạo lộ trình thăng tiến
        </Button>
    </div>
);

// ── Template card ─────────────────────────────────────────────────────
const TemplateCard = ({
    template, onEdit, onDeactivate, onActivate,
}: {
    template: ICareerPathTemplate;
    onEdit: (t: ICareerPathTemplate) => void;
    onDeactivate: (t: ICareerPathTemplate) => void;
    onActivate: (t: ICareerPathTemplate) => void;
}) => {
    const [hov, setHov] = useState(false);
    const isActive = template.active;
    const steps = [...(template.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: T.white,
                border: `1px solid ${hov ? T.lineMed : T.line}`,
                borderRadius: 12,
                overflow: "hidden",
                opacity: isActive ? 1 : 0.55,
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: hov ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
            }}
        >
            <div style={{ display: "flex", alignItems: "stretch" }}>
                {/* Left accent bar — luôn dùng màu xanh accent, không đổi theo level */}
                <div style={{
                    width: 3, flexShrink: 0,
                    background: isActive ? T.acc : T.ink6,
                }} />

                <div style={{ flex: 1, padding: "14px 18px", minWidth: 0 }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                display: "flex", alignItems: "center",
                                gap: 8, flexWrap: "wrap", marginBottom: 3,
                            }}>
                                <Text style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
                                    {template.name}
                                </Text>
                                {/* Badge cấp bậc — xám trung tính */}
                                <span style={{
                                    display: "inline-flex", alignItems: "center",
                                    padding: "2px 8px", borderRadius: 6,
                                    background: T.s2, border: `1px solid ${T.ink6}`,
                                    fontSize: 11, fontWeight: 600, color: T.ink4,
                                }}>
                                    {steps.length} cấp bậc
                                </span>
                                {!isActive && (
                                    <span style={{
                                        display: "inline-flex", alignItems: "center",
                                        padding: "2px 8px", borderRadius: 6,
                                        background: T.slateSoft, border: `1px solid ${T.slateBord}`,
                                        fontSize: 11, fontWeight: 600, color: T.slate,
                                    }}>
                                        Đã tắt
                                    </span>
                                )}
                            </div>
                            {template.description && (
                                <Text style={{ fontSize: 12.5, color: T.ink4, lineHeight: 1.5 }}>
                                    {template.description}
                                </Text>
                            )}
                        </div>

                        {/* Action buttons */}
                        <Space
                            size={4}
                            style={{
                                flexShrink: 0,
                                opacity: hov ? 1 : 0,
                                transition: "opacity 0.15s",
                                pointerEvents: hov ? "auto" : "none",
                            }}
                        >
                            <IconBtn
                                icon={<EditOutlined style={{ fontSize: 12 }} />}
                                tooltip="Chỉnh sửa"
                                onClick={() => onEdit(template)}
                            />
                            <IconBtn
                                icon={isActive
                                    ? <StopOutlined style={{ fontSize: 12 }} />
                                    : <CheckCircleOutlined style={{ fontSize: 12 }} />}
                                tooltip={isActive ? "Tạm tắt" : "Kích hoạt lại"}
                                onClick={() => isActive ? onDeactivate(template) : onActivate(template)}
                                variant={isActive ? "danger" : "success"}
                            />
                        </Space>
                    </div>

                    {/* Steps — nền s1, wrap gọn */}
                    {steps.length > 0 && (
                        <div style={{
                            display: "flex", alignItems: "center",
                            flexWrap: "wrap", gap: 5,
                            padding: "9px 11px",
                            background: T.s1,
                            borderRadius: 8,
                            border: `1px solid ${T.line}`,
                            marginBottom: 10,
                        }}>
                            {steps.map((step, i) => (
                                <StepChip
                                    key={step.id ?? step.stepOrder}
                                    step={step}
                                    isLast={i === steps.length - 1}
                                />
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        paddingTop: 8, borderTop: `1px solid ${T.line}`,
                    }}>
                        {template.createdBy && (
                            <Text style={{ fontSize: 11, color: T.ink5 }}>
                                Tạo bởi{" "}
                                <strong style={{ color: T.ink4, fontWeight: 600 }}>
                                    {template.createdBy}
                                </strong>
                            </Text>
                        )}
                        {template.updatedAt && (
                            <Text style={{ fontSize: 11, color: T.ink5, marginLeft: "auto" }}>
                                Cập nhật {new Date(template.updatedAt).toLocaleDateString("vi-VN")}
                            </Text>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────
const CareerPathTemplateTab = () => {
    const { departmentId } = useParams();

    const [searchValue, setSearchValue] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [selected, setSelected] = useState<ICareerPathTemplate | null>(null);

    const { data: templates = [], isFetching, refetch } =
        useCareerPathTemplatesByDepartmentQuery(Number(departmentId));
    const deactivateMutation = useDeactivateCareerPathTemplateMutation();
    const activateMutation = useActivateCareerPathTemplateMutation();

    const filtered = templates.filter((t) =>
        !searchValue || t.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    const handleDeactivate = (template: ICareerPathTemplate) => {
        Modal.confirm({
            title: "Tạm tắt lộ trình thăng tiến?",
            content: `"${template.name}" sẽ không thể dùng để gán cho nhân viên.`,
            okText: "Xác nhận tắt", okType: "danger", cancelText: "Hủy",
            onOk: () => deactivateMutation.mutate(template.id!),
        });
    };

    const handleActivate = (template: ICareerPathTemplate) => {
        Modal.confirm({
            title: "Kích hoạt lại lộ trình thăng tiến?",
            content: `"${template.name}" sẽ được kích hoạt và có thể gán cho nhân viên.`,
            okText: "Kích hoạt", cancelText: "Hủy",
            onOk: () => activateMutation.mutate(template.id!),
        });
    };

    const openCreate = () => { setSelected(null); setOpenModal(true); };
    const openEdit = (t: ICareerPathTemplate) => { setSelected(t); setOpenModal(true); };
    const closeModal = () => { setOpenModal(false); setSelected(null); };

    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <SearchFilter
                    searchPlaceholder="Tìm lộ trình thăng tiến..."
                    addLabel="Tạo lộ trình"
                    showFilterButton={false}
                    onSearch={setSearchValue}
                    onReset={() => { setSearchValue(""); refetch(); }}
                    onAddClick={openCreate}
                />
            </div>

            {isFetching ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{
                            background: T.white, borderRadius: 12,
                            border: `1px solid ${T.line}`, padding: "16px 18px",
                        }}>
                            <Skeleton active paragraph={{ rows: 2 }} />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 && !searchValue ? (
                <EmptyState onAdd={openCreate} />
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "56px 0",
                    background: T.s1, borderRadius: 12,
                    border: `1px dashed ${T.ink6}`,
                }}>
                    <Text style={{ color: T.ink4, fontSize: 13 }}>
                        Không tìm thấy lộ trình phù hợp
                    </Text>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.map((t) => (
                        <TemplateCard
                            key={t.id}
                            template={t}
                            onEdit={openEdit}
                            onDeactivate={handleDeactivate}
                            onActivate={handleActivate}
                        />
                    ))}
                </div>
            )}

            <ModalCareerPathTemplate
                open={openModal}
                onClose={closeModal}
                dataInit={selected}
                onSuccess={() => { closeModal(); refetch(); }}
            />

            <ViewCareerPath
                open={openView}
                onClose={() => { setOpenView(false); setSelected(null); }}
                dataInit={selected as any}
                setDataInit={setSelected}
            />
        </div>
    );
};

export default CareerPathTemplateTab;