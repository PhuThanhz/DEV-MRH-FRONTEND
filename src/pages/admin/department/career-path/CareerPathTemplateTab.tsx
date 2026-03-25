import { useState } from "react";
import { Typography, Button, Modal, Tooltip, Space, Skeleton } from "antd";
import {
    PlusOutlined,
    EditOutlined,
    CheckCircleOutlined,
    StopOutlined,
    ApartmentOutlined,
    EyeOutlined,
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
    ink: "#0a0a0b",
    ink2: "#2c2c2e",
    ink3: "#636366",
    ink4: "#aeaeb2",
    ink5: "#d1d1d6",
    white: "#ffffff",
    s1: "#fafafa",
    s2: "#f5f5f7",
    line: "rgba(0,0,0,0.06)",
    lineMed: "rgba(0,0,0,0.10)",
    acc: "#0066ff",
    accSoft: "rgba(0,102,255,0.07)",
    accBord: "rgba(0,102,255,0.15)",
    green: "#1a7a3a",
    greenBg: "rgba(26,122,58,0.06)",
    greenBd: "rgba(26,122,58,0.16)",
    red: "#c0392b",
    redBg: "rgba(192,57,43,0.06)",
    redBd: "rgba(192,57,43,0.13)",
};

// ── Empty state ───────────────────────────────────────────────────
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
    <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "80px 24px",
        background: T.white, borderRadius: 16,
        border: `1px dashed ${T.lineMed}`, gap: 12,
    }}>
        <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: T.s1, border: `1px solid ${T.line}`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <ApartmentOutlined style={{ fontSize: 22, color: T.ink4 }} />
        </div>
        <div style={{ textAlign: "center" }}>
            <Text style={{ fontSize: 14, color: T.ink2, fontWeight: 600, display: "block" }}>
                Chưa có lộ trình thăng tiến
            </Text>
            <Text style={{ fontSize: 12.5, color: T.ink4, marginTop: 4, display: "block" }}>
                Tạo khung lộ trình để định hướng phát triển cho nhân viên
            </Text>
        </div>
        <Button
            type="primary" icon={<PlusOutlined />} onClick={onAdd}
            style={{ marginTop: 4, borderRadius: 8, background: T.acc, borderColor: T.acc, fontWeight: 500, height: 36 }}
        >
            Tạo lộ trình thăng tiến
        </Button>
    </div>
);

// ── Step chip ─────────────────────────────────────────────────────
const StepChip = ({ step, isLast }: { step: any; isLast: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 7,
            background: T.white, border: `1px solid ${T.line}`,
            fontSize: 12, color: T.ink3,
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}>
            {step.positionLevelCode && (
                <span style={{
                    padding: "0px 5px", borderRadius: 4,
                    background: T.accSoft, border: `1px solid ${T.accBord}`,
                    fontSize: 10, fontWeight: 700, color: T.acc,
                    letterSpacing: 0.3,
                }}>
                    {step.positionLevelCode}
                </span>
            )}
            <span style={{ fontWeight: 500, color: T.ink2 }}>{step.jobTitleName}</span>
            {step.durationMonths && (
                <span style={{
                    fontSize: 10.5, color: T.ink4, fontWeight: 400,
                    borderLeft: `1px solid ${T.line}`, paddingLeft: 6, marginLeft: 2,
                }}>
                    {step.durationMonths}th
                </span>
            )}
        </div>
        {!isLast && (
            <span style={{ color: T.ink5, fontSize: 11, userSelect: "none" }}>→</span>
        )}
    </div>
);

// ── Template Card ─────────────────────────────────────────────────
const TemplateCard = ({
    template, onView, onEdit, onDeactivate, onActivate,
}: {
    template: ICareerPathTemplate;
    onView: (t: ICareerPathTemplate) => void;
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
                borderRadius: 14,
                transition: "box-shadow 0.18s, border-color 0.18s",
                boxShadow: hov ? "0 6px 24px rgba(0,0,0,0.07)" : "0 1px 4px rgba(0,0,0,0.04)",
                opacity: isActive ? 1 : 0.5,
                overflow: "hidden",
            }}
        >
            {/* Active indicator bar on left */}
            <div style={{
                display: "flex", alignItems: "stretch",
            }}>
                <div style={{
                    width: 3, flexShrink: 0,
                    background: isActive ? "#ff6b9d" : T.ink5,
                    opacity: isActive ? 0.7 : 0.3,
                    borderRadius: "3px 0 0 3px",
                }} />

                <div style={{ flex: 1, padding: "14px 16px" }}>

                    {/* ── Header ── */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                            <Text style={{
                                fontSize: 13.5, fontWeight: 600,
                                color: T.ink, letterSpacing: -0.2,
                            }}>
                                {template.name}
                            </Text>
                            <Text style={{ fontSize: 11.5, color: T.ink4, fontWeight: 400 }}>
                                · {steps.length} cấp bậc
                            </Text>
                            {template.description && (
                                <Text style={{
                                    fontSize: 12, color: T.ink4,
                                    fontWeight: 400, marginLeft: 2,
                                }} ellipsis>
                                    — {template.description}
                                </Text>
                            )}
                        </div>

                        {/* Action buttons */}
                        <Space
                            size={4}
                            style={{
                                flexShrink: 0,
                                opacity: hov ? 1 : 0,
                                transform: hov ? "translateX(0)" : "translateX(6px)",
                                transition: "opacity 0.15s, transform 0.15s",
                                pointerEvents: hov ? "auto" : "none",
                            }}
                        >
                            <Tooltip title="Xem chi tiết" mouseEnterDelay={0.4}>
                                <Button type="text" size="small"
                                    icon={<EyeOutlined style={{ fontSize: 13 }} />}
                                    onClick={() => onView(template)}
                                    style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.line}`, color: T.ink3, background: T.s1, display: "flex", alignItems: "center", justifyContent: "center" }} />
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa" mouseEnterDelay={0.4}>
                                <Button type="text" size="small"
                                    icon={<EditOutlined style={{ fontSize: 13 }} />}
                                    onClick={() => onEdit(template)}
                                    style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.line}`, color: T.ink3, background: T.s1, display: "flex", alignItems: "center", justifyContent: "center" }} />
                            </Tooltip>
                            <Tooltip title={isActive ? "Tạm tắt" : "Kích hoạt lại"} mouseEnterDelay={0.4}>
                                <Button type="text" size="small"
                                    icon={isActive
                                        ? <StopOutlined style={{ fontSize: 13 }} />
                                        : <CheckCircleOutlined style={{ fontSize: 13 }} />}
                                    onClick={() => isActive ? onDeactivate(template) : onActivate(template)}
                                    style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${isActive ? T.redBd : T.greenBd}`, color: isActive ? T.red : T.green, background: isActive ? T.redBg : T.greenBg, display: "flex", alignItems: "center", justifyContent: "center" }} />
                            </Tooltip>
                        </Space>
                    </div>

                    {/* ── Steps ── */}
                    {steps.length > 0 && (
                        <div style={{
                            marginTop: 10,
                            display: "flex", alignItems: "center",
                            flexWrap: "wrap", gap: 4,
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

                    {/* ── Footer ── */}
                    {(template.createdBy || template.updatedAt) && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 12,
                            marginTop: 10, paddingTop: 8,
                            borderTop: `1px solid ${T.line}`,
                        }}>
                            {template.createdBy && (
                                <Text style={{ fontSize: 11, color: T.ink5 }}>
                                    Tạo bởi <span style={{ color: T.ink4 }}>{template.createdBy}</span>
                                </Text>
                            )}
                            {template.updatedAt && (
                                <Text style={{ fontSize: 11, color: T.ink5, marginLeft: "auto" }}>
                                    Cập nhật {new Date(template.updatedAt).toLocaleDateString("vi-VN")}
                                </Text>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────
const CareerPathTemplateTab = () => {
    const { departmentId } = useParams();

    const [searchValue, setSearchValue] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [selected, setSelected] = useState<ICareerPathTemplate | null>(null);

    const { data: templates = [], isFetching, refetch } = useCareerPathTemplatesByDepartmentQuery(Number(departmentId));
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
    const openViewDetail = (t: ICareerPathTemplate) => { setSelected(t); setOpenView(true); };
    const closeModal = () => { setOpenModal(false); setSelected(null); };

    return (
        <div>
            {/* ── Toolbar ── */}
            <div style={{
                background: T.white, border: `1px solid ${T.line}`,
                borderRadius: 12, padding: "14px 18px", marginBottom: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
                <SearchFilter
                    searchPlaceholder="Tìm lộ trình thăng tiến..."
                    addLabel="Tạo lộ trình"
                    showFilterButton={false}
                    onSearch={setSearchValue}
                    onReset={() => { setSearchValue(""); refetch(); }}
                    onAddClick={openCreate}
                />
            </div>

            {/* ── List ── */}
            {isFetching ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.line}`, padding: "16px 18px" }}>
                            <Skeleton active paragraph={{ rows: 2 }} />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 && !searchValue ? (
                <EmptyState onAdd={openCreate} />
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "56px 0", background: T.s1, borderRadius: 12, border: `1px dashed ${T.lineMed}` }}>
                    <Text style={{ color: T.ink4, fontSize: 13 }}>Không tìm thấy lộ trình phù hợp</Text>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.map((t) => (
                        <TemplateCard
                            key={t.id} template={t}
                            onView={openViewDetail} onEdit={openEdit}
                            onDeactivate={handleDeactivate} onActivate={handleActivate}
                        />
                    ))}
                </div>
            )}

            <ModalCareerPathTemplate
                open={openModal} onClose={closeModal} dataInit={selected}
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