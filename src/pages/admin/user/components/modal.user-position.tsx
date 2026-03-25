import { useEffect, useState } from "react";
import {
    Col, Row, Button, Select, Table, Popconfirm, message, Typography, Tooltip,
} from "antd";
import {
    DeleteOutlined, PlusOutlined, ApartmentOutlined,
    BankOutlined, TeamOutlined, AppstoreOutlined, TagsOutlined,
} from "@ant-design/icons";

import type { IUserPosition } from "@/types/backend";
import {
    useUserPositionsQuery,
    useCreateUserPositionMutation,
    useDeleteUserPositionMutation,
} from "@/hooks/useUserPositions";
import {
    callFetchCompany,
    callFetchDepartmentsByCompany,
    callFetchSectionsByDepartment,
    callFetchCompanyJobTitles,
    callFetchCompanyJobTitlesOfDepartment,
    callFetchJobTitlesBySection,
} from "@/config/api";

const { Text } = Typography;

interface IProps {
    activeUserId?: number;
}

const SOURCE_OPTIONS = [
    { label: "Cấp Công ty", value: "COMPANY" },
    { label: "Cấp Phòng ban", value: "DEPARTMENT" },
    { label: "Cấp Bộ phận", value: "SECTION" },
];

const ACCENT = "#f5317f";
const ACCENT_SOFT = "#fff0f6";
const BORDER = "#e5e7eb";
const TEXT_MAIN = "#111827";
const TEXT_LABEL = "#374151";
const TEXT_MUTED = "#9ca3af";

// ─── step config ────────────────────────────────────────────────────────────
type StepKey = "company" | "source" | "department" | "section" | "jobTitle";

const STEPS: { key: StepKey; label: string; icon: React.ReactNode }[] = [
    { key: "company", label: "Công ty", icon: <BankOutlined /> },
    { key: "source", label: "Cấp gán", icon: <ApartmentOutlined /> },
    { key: "department", label: "Phòng ban", icon: <TeamOutlined /> },
    { key: "section", label: "Bộ phận", icon: <AppstoreOutlined /> },
    { key: "jobTitle", label: "Chức danh", icon: <TagsOutlined /> },
];

const sourceTagConfig: Record<string, { color: string; bg: string; label: string }> = {
    COMPANY: { color: "#1d4ed8", bg: "#eff6ff", label: "Công ty" },
    DEPARTMENT: { color: "#15803d", bg: "#f0fdf4", label: "Phòng ban" },
    SECTION: { color: "#c2410c", bg: "#fff7ed", label: "Bộ phận" },
};

// ────────────────────────────────────────────────────────────────────────────
const UserPositionForm = ({ activeUserId }: IProps) => {

    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [selectedJobTitleId, setSelectedJobTitleId] = useState<number | null>(null);

    const [companyOptions, setCompanyOptions] = useState<{ label: string; value: number }[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: number }[]>([]);
    const [sectionOptions, setSectionOptions] = useState<{ label: string; value: number }[]>([]);
    const [jobTitleOptions, setJobTitleOptions] = useState<{ label: string; value: number }[]>([]);

    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loadingJobTitles, setLoadingJobTitles] = useState(false);

    const { data: positions = [], isLoading: loadingPositions } = useUserPositionsQuery(activeUserId);
    const { mutate: createPosition, isPending: isCreatingPosition } = useCreateUserPositionMutation();
    const { mutate: deletePosition } = useDeleteUserPositionMutation(activeUserId);

    // ── derived state: which steps are "active" ──────────────────────────────
    const showDepartment = selectedSource === "DEPARTMENT" || selectedSource === "SECTION";
    const showSection = selectedSource === "SECTION";
    const showJobTitle = Boolean(selectedSource) && (
        (selectedSource === "COMPANY" && Boolean(selectedCompanyId)) ||
        (selectedSource === "DEPARTMENT" && Boolean(selectedDepartmentId)) ||
        (selectedSource === "SECTION" && Boolean(selectedSectionId))
    );

    const activeStep: StepKey =
        !selectedCompanyId ? "company" :
            !selectedSource ? "source" :
                showDepartment && !selectedDepartmentId ? "department" :
                    showSection && !selectedSectionId ? "section" :
                        "jobTitle";

    // ── data fetching ─────────────────────────────────────────────────────────
    useEffect(() => {
        setLoadingCompanies(true);
        callFetchCompany("page=1&size=100&sort=name,asc")
            .then((res: any) => {
                const list = res?.data?.result ?? [];
                setCompanyOptions(list.map((c: any) => ({ label: c.name, value: Number(c.id) })));
            })
            .finally(() => setLoadingCompanies(false));
    }, []);

    useEffect(() => {
        if (!selectedCompanyId || !selectedSource || selectedSource === "COMPANY") {
            setDepartmentOptions([]); return;
        }
        setSelectedDepartmentId(null); setSelectedSectionId(null); setSelectedJobTitleId(null);
        setDepartmentOptions([]); setSectionOptions([]); setJobTitleOptions([]);
        setLoadingDepartments(true);
        callFetchDepartmentsByCompany(selectedCompanyId)
            .then((res: any) => {
                setDepartmentOptions((res?.data ?? []).map((d: any) => ({ label: d.name, value: Number(d.id) })));
            })
            .finally(() => setLoadingDepartments(false));
    }, [selectedCompanyId, selectedSource]);

    useEffect(() => {
        if (!selectedDepartmentId || selectedSource !== "SECTION") { setSectionOptions([]); return; }
        setSelectedSectionId(null); setSelectedJobTitleId(null);
        setSectionOptions([]); setJobTitleOptions([]);
        setLoadingSections(true);
        callFetchSectionsByDepartment(selectedDepartmentId)
            .then((res: any) => {
                setSectionOptions((res?.data ?? []).map((s: any) => ({ label: s.name, value: Number(s.id) })));
            })
            .finally(() => setLoadingSections(false));
    }, [selectedDepartmentId, selectedSource]);

    useEffect(() => {
        setSelectedJobTitleId(null); setJobTitleOptions([]);
        const map = (item: any) => ({
            label: `${item.jobTitle?.nameVi ?? "--"} (${item.jobTitle?.positionCode ?? ""})`,
            value: Number(item.id),
        });
        if (selectedSource === "COMPANY" && selectedCompanyId) {
            setLoadingJobTitles(true);
            callFetchCompanyJobTitles(`page=1&size=200&filter=company.id:${selectedCompanyId} and active:true`)
                .then((res: any) => setJobTitleOptions((res?.data?.result ?? []).map(map)))
                .finally(() => setLoadingJobTitles(false));
        } else if (selectedSource === "DEPARTMENT" && selectedDepartmentId) {
            setLoadingJobTitles(true);
            callFetchCompanyJobTitlesOfDepartment(selectedDepartmentId)
                .then((res: any) => setJobTitleOptions((res?.data ?? []).map(map)))
                .finally(() => setLoadingJobTitles(false));
        } else if (selectedSource === "SECTION" && selectedSectionId) {
            setLoadingJobTitles(true);
            callFetchJobTitlesBySection(selectedSectionId)
                .then((res: any) => setJobTitleOptions((res?.data ?? []).map(map)))
                .finally(() => setLoadingJobTitles(false));
        }
    }, [selectedSource, selectedCompanyId, selectedDepartmentId, selectedSectionId]);

    // ── actions ───────────────────────────────────────────────────────────────
    const resetCascade = () => {
        setSelectedCompanyId(null); setSelectedSource(null);
        setSelectedDepartmentId(null); setSelectedSectionId(null); setSelectedJobTitleId(null);
        setDepartmentOptions([]); setSectionOptions([]); setJobTitleOptions([]);
    };

    const handleAddPosition = () => {
        if (!selectedCompanyId) { message.warning("Vui lòng chọn công ty"); return; }
        if (!selectedSource) { message.warning("Vui lòng chọn cấp gán"); return; }
        if (selectedSource === "DEPARTMENT" && !selectedDepartmentId) { message.warning("Vui lòng chọn phòng ban"); return; }
        if (selectedSource === "SECTION" && !selectedSectionId) { message.warning("Vui lòng chọn bộ phận"); return; }
        if (!selectedJobTitleId) { message.warning("Vui lòng chọn chức danh"); return; }
        if (!activeUserId) return;

        const data: any = { source: selectedSource };
        if (selectedSource === "COMPANY") data.companyJobTitleId = selectedJobTitleId;
        if (selectedSource === "DEPARTMENT") data.departmentJobTitleId = selectedJobTitleId;
        if (selectedSource === "SECTION") data.sectionJobTitleId = selectedJobTitleId;

        createPosition({ userId: activeUserId, data }, { onSuccess: () => resetCascade() });
    };

    // ── table columns ─────────────────────────────────────────────────────────
    const positionColumns = [
        {
            title: "Chức danh",
            render: (_: any, r: IUserPosition) => (
                <Text strong style={{ fontSize: 13, color: TEXT_MAIN }}>{r.jobTitle?.nameVi ?? "--"}</Text>
            ),
        },
        {
            title: "Mã bậc",
            align: "center" as const,
            width: 100,
            render: (_: any, r: IUserPosition) => (
                <span style={{
                    display: "inline-block", padding: "2px 10px", borderRadius: 20,
                    background: "#f5f0ff", color: "#6d28d9", fontSize: 12, fontWeight: 600,
                }}>
                    {r.jobTitle?.positionCode ?? "--"}
                </span>
            ),
        },
        {
            title: "Cấp",
            align: "center" as const,
            width: 110,
            render: (_: any, r: IUserPosition) => {
                const cfg = sourceTagConfig[r.source];
                return cfg ? (
                    <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 20,
                        background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 500,
                    }}>{cfg.label}</span>
                ) : "--";
            },
        },
        {
            title: "Công ty",
            render: (_: any, r: IUserPosition) => (
                <Text style={{ fontSize: 13, color: TEXT_LABEL }}>{r.company?.name ?? "--"}</Text>
            ),
        },
        {
            title: "Phòng ban",
            render: (_: any, r: IUserPosition) => (
                <Text style={{ fontSize: 13, color: TEXT_MUTED }}>{r.department?.name ?? "--"}</Text>
            ),
        },
        {
            title: "Bộ phận",
            render: (_: any, r: IUserPosition) => (
                <Text style={{ fontSize: 13, color: TEXT_MUTED }}>{r.section?.name ?? "--"}</Text>
            ),
        },
        {
            title: "",
            width: 44,
            render: (_: any, r: IUserPosition) => (
                <Popconfirm
                    title="Xóa chức danh này?"
                    onConfirm={() => deletePosition(r.id!)}
                    okText="Xóa" cancelText="Hủy"
                    okButtonProps={{ danger: true, size: "small" }}
                >
                    <Tooltip title="Xóa">
                        <button style={{
                            width: 30, height: 30, borderRadius: 8,
                            border: "1.5px solid #fee2e2", background: "#fff5f5",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "#ef4444", fontSize: 13, transition: "all 0.18s",
                        }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "#fca5a5";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "#fff5f5";
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "#fee2e2";
                            }}
                        >
                            <DeleteOutlined />
                        </button>
                    </Tooltip>
                </Popconfirm>
            ),
        },
    ];

    // ── step indicator ────────────────────────────────────────────────────────
    const visibleSteps = STEPS.filter(s => {
        if (s.key === "department") return showDepartment;
        if (s.key === "section") return showSection;
        return true;
    });

    const stepDone = (key: StepKey) => {
        if (key === "company") return Boolean(selectedCompanyId);
        if (key === "source") return Boolean(selectedSource);
        if (key === "department") return Boolean(selectedDepartmentId);
        if (key === "section") return Boolean(selectedSectionId);
        if (key === "jobTitle") return Boolean(selectedJobTitleId);
        return false;
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                /* ── selects ── */
                .pos-form .ant-select-selector {
                    border-radius: 10px !important;
                    border-color: ${BORDER} !important;
                    min-height: 40px !important;
                    align-items: center !important;
                    font-size: 13px !important;
                    transition: border-color 0.2s, box-shadow 0.2s !important;
                }
                .pos-form .ant-select:not(.ant-select-disabled):hover .ant-select-selector {
                    border-color: #d1d5db !important;
                }
                .pos-form .ant-select-focused .ant-select-selector {
                    border-color: ${ACCENT} !important;
                    box-shadow: 0 0 0 3px ${ACCENT_SOFT} !important;
                }
                .pos-form .ant-select-disabled .ant-select-selector {
                    background: #f9fafb !important;
                    opacity: 0.6 !important;
                }

                /* ── table ── */
                .pos-form .ant-table {
                    border-radius: 12px !important;
                    overflow: hidden !important;
                    border: 1.5px solid #f0f0f0 !important;
                }
                .pos-form .ant-table-thead > tr > th {
                    background: #fafafa !important;
                    color: #6b7280 !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    border-bottom: 1.5px solid #f0f0f0 !important;
                    padding: 10px 14px !important;
                }
                .pos-form .ant-table-tbody > tr > td {
                    padding: 12px 14px !important;
                    border-bottom: 1px solid #f7f7f8 !important;
                }
                .pos-form .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
                .pos-form .ant-table-tbody > tr:hover > td { background: #fafafa !important; }
                .pos-form .ant-table-placeholder td { border-bottom: none !important; }

                /* ── add btn ── */
                .btn-pos-add {
                    height: 40px !important;
                    border-radius: 10px !important;
                    background: ${ACCENT} !important;
                    border-color: ${ACCENT} !important;
                    color: #fff !important;
                    font-weight: 600 !important;
                    font-size: 13px !important;
                    padding: 0 20px !important;
                    box-shadow: 0 4px 12px rgba(245,49,127,0.25) !important;
                    transition: all 0.2s ease !important;
                    letter-spacing: -0.01em !important;
                }
                .btn-pos-add:hover {
                    background: #d4206a !important;
                    border-color: #d4206a !important;
                    box-shadow: 0 6px 16px rgba(245,49,127,0.35) !important;
                    transform: translateY(-1px) !important;
                }
                .btn-pos-add:disabled, .btn-pos-add[disabled] {
                    opacity: 0.45 !important;
                    transform: none !important;
                    box-shadow: none !important;
                }

                /* ── progress breadcrumb ── */
                .pos-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 0;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                    gap: 4px;
                }
                .pos-crumb {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    border: 1.5px solid transparent;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .pos-crumb.done {
                    background: #f0fdf4;
                    color: #15803d;
                    border-color: #bbf7d0;
                }
                .pos-crumb.active {
                    background: ${ACCENT_SOFT};
                    color: ${ACCENT};
                    border-color: #fbb6ce;
                }
                .pos-crumb.waiting {
                    background: #f7f7f8;
                    color: ${TEXT_MUTED};
                    border-color: #f0f0f0;
                }
                .pos-crumb-arrow {
                    color: #d1d5db;
                    font-size: 10px;
                    margin: 0 2px;
                }
            `}</style>

            <div className="pos-form">

                {/* ══ PANEL ══════════════════════════════════════════════════ */}
                <div style={{
                    background: "#fff",
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: 16,
                    padding: "18px 20px 16px",
                    marginBottom: 16,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}>

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: ACCENT_SOFT, display: "flex",
                                alignItems: "center", justifyContent: "center",
                            }}>
                                <ApartmentOutlined style={{ color: ACCENT, fontSize: 14 }} />
                            </div>
                            <div>
                                <Text style={{ fontSize: 13, fontWeight: 700, color: TEXT_MAIN, letterSpacing: "-0.02em", display: "block", lineHeight: 1.2 }}>
                                    Gán chức danh mới
                                </Text>
                                <Text style={{ fontSize: 11, color: TEXT_MUTED }}>Chọn lần lượt theo thứ tự</Text>
                            </div>
                        </div>

                        {/* reset link */}
                        {selectedCompanyId && (
                            <button onClick={resetCascade} style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontSize: 12, color: TEXT_MUTED, padding: "4px 8px",
                                borderRadius: 6, transition: "color 0.15s",
                            }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#374151")}
                                onMouseLeave={e => (e.currentTarget.style.color = TEXT_MUTED)}
                            >
                                Đặt lại
                            </button>
                        )}
                    </div>

                    {/* Progress breadcrumb */}
                    <div className="pos-breadcrumb">
                        {visibleSteps.map((s, i) => {
                            const done = stepDone(s.key);
                            const active = activeStep === s.key;
                            const cls = done ? "done" : active ? "active" : "waiting";
                            return (
                                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    {i > 0 && <span className="pos-crumb-arrow">›</span>}
                                    <span className={`pos-crumb ${cls}`}>
                                        {done
                                            ? <span style={{ fontSize: 10 }}>✓</span>
                                            : <span style={{ opacity: 0.7 }}>{s.icon}</span>
                                        }
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Fields — all inline, 2-col then full-width for job title */}
                    <Row gutter={[12, 12]}>

                        {/* Công ty */}
                        <Col xs={24} sm={12}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_LABEL, marginBottom: 5 }}>
                                <BankOutlined style={{ marginRight: 5, color: TEXT_MUTED }} />
                                Công ty <span style={{ color: ACCENT }}>*</span>
                            </div>
                            <Select
                                placeholder="Chọn công ty..."
                                options={companyOptions}
                                value={selectedCompanyId ?? undefined}
                                onChange={(v) => {
                                    setSelectedCompanyId(v ? Number(v) : null);
                                    setSelectedSource(null);
                                    setSelectedDepartmentId(null); setSelectedSectionId(null); setSelectedJobTitleId(null);
                                    setDepartmentOptions([]); setSectionOptions([]); setJobTitleOptions([]);
                                }}
                                loading={loadingCompanies}
                                showSearch optionFilterProp="label"
                                style={{ width: "100%" }}
                                size="large"
                            />
                        </Col>

                        {/* Cấp gán */}
                        <Col xs={24} sm={12}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_LABEL, marginBottom: 5 }}>
                                <ApartmentOutlined style={{ marginRight: 5, color: TEXT_MUTED }} />
                                Cấp gán <span style={{ color: ACCENT }}>*</span>
                            </div>
                            <Select
                                placeholder={selectedCompanyId ? "Chọn cấp gán..." : "Chọn công ty trước"}
                                options={SOURCE_OPTIONS}
                                value={selectedSource ?? undefined}
                                onChange={(v) => {
                                    setSelectedSource(v);
                                    setSelectedDepartmentId(null); setSelectedSectionId(null); setSelectedJobTitleId(null);
                                    setDepartmentOptions([]); setSectionOptions([]); setJobTitleOptions([]);
                                }}
                                disabled={!selectedCompanyId}
                                style={{ width: "100%" }}
                                size="large"
                            />
                        </Col>

                        {/* Phòng ban */}
                        {showDepartment && (
                            <Col xs={24} sm={12}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_LABEL, marginBottom: 5 }}>
                                    <TeamOutlined style={{ marginRight: 5, color: TEXT_MUTED }} />
                                    Phòng ban <span style={{ color: ACCENT }}>*</span>
                                </div>
                                <Select
                                    placeholder="Chọn phòng ban..."
                                    options={departmentOptions}
                                    value={selectedDepartmentId ?? undefined}
                                    onChange={(v) => {
                                        setSelectedDepartmentId(v ? Number(v) : null);
                                        setSelectedSectionId(null); setSelectedJobTitleId(null);
                                        setSectionOptions([]); setJobTitleOptions([]);
                                    }}
                                    loading={loadingDepartments}
                                    showSearch optionFilterProp="label"
                                    style={{ width: "100%" }}
                                    size="large"
                                />
                            </Col>
                        )}

                        {/* Bộ phận */}
                        {showSection && (
                            <Col xs={24} sm={12}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_LABEL, marginBottom: 5 }}>
                                    <AppstoreOutlined style={{ marginRight: 5, color: TEXT_MUTED }} />
                                    Bộ phận <span style={{ color: ACCENT }}>*</span>
                                </div>
                                <Select
                                    placeholder="Chọn bộ phận..."
                                    options={sectionOptions}
                                    value={selectedSectionId ?? undefined}
                                    onChange={(v) => {
                                        setSelectedSectionId(v ? Number(v) : null);
                                        setSelectedJobTitleId(null); setJobTitleOptions([]);
                                    }}
                                    loading={loadingSections}
                                    disabled={!selectedDepartmentId}
                                    showSearch optionFilterProp="label"
                                    style={{ width: "100%" }}
                                    size="large"
                                />
                            </Col>
                        )}

                        {/* Chức danh + nút gán */}
                        {selectedSource && (
                            <Col span={24}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: TEXT_LABEL, marginBottom: 5 }}>
                                    <TagsOutlined style={{ marginRight: 5, color: TEXT_MUTED }} />
                                    Chức danh <span style={{ color: ACCENT }}>*</span>
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <Select
                                            key={`jt-${selectedSource}-${selectedCompanyId}-${selectedDepartmentId}-${selectedSectionId}`}
                                            placeholder={showJobTitle ? "Tìm và chọn chức danh..." : "Hoàn thành các bước trên trước"}
                                            options={jobTitleOptions}
                                            value={selectedJobTitleId ?? undefined}
                                            onChange={(v) => setSelectedJobTitleId(v ? Number(v) : null)}
                                            loading={loadingJobTitles}
                                            disabled={!showJobTitle}
                                            showSearch optionFilterProp="label"
                                            style={{ width: "100%" }}
                                            size="large"
                                        />
                                    </div>
                                    <Button
                                        className="btn-pos-add"
                                        icon={<PlusOutlined />}
                                        loading={isCreatingPosition}
                                        onClick={handleAddPosition}
                                        disabled={!selectedJobTitleId}
                                        size="large"
                                    >
                                        Gán chức danh
                                    </Button>
                                </div>
                            </Col>
                        )}
                    </Row>
                </div>

                {/* ══ TABLE ══════════════════════════════════════════════════ */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{
                        fontSize: 11, fontWeight: 700, color: TEXT_MUTED,
                        textTransform: "uppercase", letterSpacing: "0.07em",
                    }}>
                        Danh sách đã gán
                    </Text>
                    {positions.length > 0 && (
                        <span style={{
                            fontSize: 11, fontWeight: 700, color: ACCENT,
                            background: ACCENT_SOFT, padding: "2px 10px", borderRadius: 20,
                        }}>
                            {positions.length} chức danh
                        </span>
                    )}
                </div>

                <Table
                    columns={positionColumns}
                    dataSource={positions}
                    rowKey="id"
                    loading={loadingPositions}
                    size="small"
                    pagination={false}
                    locale={{
                        emptyText: (
                            <div style={{ padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    background: "#f7f7f8", display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                }}>
                                    <ApartmentOutlined style={{ fontSize: 22, color: "#d1d5db" }} />
                                </div>
                                <Text style={{ color: TEXT_MUTED, fontSize: 13 }}>Chưa có chức danh nào được gán</Text>
                                <Text style={{ color: "#d1d5db", fontSize: 12 }}>Dùng form phía trên để gán chức danh cho người dùng</Text>
                            </div>
                        ),
                    }}
                    scroll={{ x: "max-content" }}
                />
            </div>
        </>
    );
};

export default UserPositionForm;