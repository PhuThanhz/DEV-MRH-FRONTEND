import {
    ModalForm,
    ProFormText,
    ProFormTextArea,
    ProFormSelect,
} from "@ant-design/pro-components";
import { Col, Row, Form, Button, Space, Tag, Divider, Typography, Switch } from "antd";
import {
    BankOutlined,
    UserSwitchOutlined,
    ClockCircleOutlined,
    AuditOutlined,
    ReadOutlined,
    BarChartOutlined,
    DollarOutlined,
    CheckCircleFilled,
    StopOutlined,
    EyeOutlined,
    SendOutlined,
    PoweroffOutlined,
    SolutionOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import {
    useCreateCareerPathMutation,
    useUpdateCareerPathMutation,
    usePreviewBulkCareerPathMutation,
    useBulkCreateCareerPathMutation,
    useActiveJobTitlesByDepartment,
} from "@/hooks/useCareerPaths";

import type { ICareerPath, ICareerPathPreviewResponse } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

const { Text } = Typography;

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ICareerPath | null;
    setDataInit: (v: any) => void;
}

/* ─────────────────────────────────────────
   Tokens — monochrome + single blue accent
───────────────────────────────────────── */
const T = {
    white: "#ffffff",
    bg: "#f7f8fa",
    line: "#e8eaed",
    lineLight: "#f0f2f5",
    icon: "#9aa3af",
    sub: "#5f6b7a",
    text: "#1a1f27",

    blue: "#2563eb",
    blueFaint: "#f0f4ff",

    green: "#16a34a",
    greenFaint: "#f0fdf4",
    greenLine: "#d1fae5",
    amber: "#b45309",
    amberFaint: "#fefce8",
    amberLine: "#fef3c7",

    r: "8px",
    rs: "6px",
};

/* ─────────────────────────────────────────
   Label component
───────────────────────────────────────── */
const Lbl = ({ children }: { children: React.ReactNode }) => (
    <span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, letterSpacing: "0.01em" }}>
        {children}
    </span>
);

/* ─────────────────────────────────────────
   Section with horizontal rule title
───────────────────────────────────────── */
const Section = ({
    icon, title, children, last = false,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    last?: boolean;
}) => (
    <div style={{ marginBottom: last ? 0 : 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <span style={{ color: T.icon, fontSize: 13, display: "flex" }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: "nowrap" }}>{title}</span>
            <span style={{ flex: 1, height: 1, background: T.line, marginLeft: 2 }} />
        </div>
        {children}
    </div>
);

/* textarea fieldProps helper */
const ta = (rows = 3) => ({
    rows,
    style: { borderRadius: T.rs, fontSize: 13, resize: "none" as const, borderColor: T.line },
});

/* ─────────────────────────────────────────
   Preview list
───────────────────────────────────────── */
const ChipList = ({
    color, faint, line, icon, label, items, renderItem,
}: {
    color: string; faint: string; line: string;
    icon: React.ReactNode; label: string;
    items: any[]; renderItem: (item: any) => React.ReactNode;
}) => (
    <div style={{ border: `1px solid ${line}`, borderRadius: T.r, overflow: "hidden" }}>
        <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 12px", background: faint, borderBottom: `1px solid ${line}`,
        }}>
            <span style={{ color, fontSize: 13 }}>{icon}</span>
            <Text strong style={{ color, fontSize: 12.5, flex: 1 }}>{label}</Text>
            <span style={{
                fontSize: 11.5, fontWeight: 700, color,
                background: line, borderRadius: 20, padding: "0 8px", lineHeight: "20px",
            }}>
                {items.length}
            </span>
        </div>
        <div style={{ padding: "8px 12px", background: T.white }}>
            {items.map((item: any, idx: number) => (
                <div key={item.jobTitleId ?? idx} style={{
                    display: "flex", alignItems: "baseline", gap: 6,
                    padding: "3px 0",
                    borderBottom: idx < items.length - 1 ? `1px solid ${T.lineLight}` : "none",
                }}>
                    <span style={{
                        width: 4, height: 4, borderRadius: "50%",
                        background: color, flexShrink: 0, marginTop: 7,
                    }} />
                    <span style={{ fontSize: 13, color: T.text, lineHeight: "22px" }}>
                        {renderItem(item)}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
const ModalCareerPath = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "Không xác định";

    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const [selectedJobTitleIds, setSelectedJobTitleIds] = useState<number[]>([]);
    const [previewData, setPreviewData] = useState<ICareerPathPreviewResponse | null>(null);
    const [activeState, setActiveState] = useState(true);

    const { data: jobTitles = [], isFetching: loadingJobTitles } =
        useActiveJobTitlesByDepartment(Number(departmentId));

    const { mutate: createCareerPath, isPending: isCreating } = useCreateCareerPathMutation();
    const { mutate: updateCareerPath, isPending: isUpdating } = useUpdateCareerPathMutation();
    const { mutateAsync: previewBulk, isPending: isPreviewing } = usePreviewBulkCareerPathMutation();
    const { mutateAsync: bulkCreate, isPending: isBulkCreating } = useBulkCreateCareerPathMutation();

    useEffect(() => {
        if (isEdit && dataInit) {
            form.setFieldsValue({ ...dataInit, active: dataInit.active ?? true });
            setActiveState(dataInit.active ?? true);
        } else {
            form.resetFields();
            form.setFieldValue("departmentId", Number(departmentId));
            setActiveState(true);
            setSelectedJobTitleIds([]);
            setPreviewData(null);
        }
    }, [dataInit, isEdit, departmentId, form]);

    const handleReset = () => {
        form.resetFields();
        setSelectedJobTitleIds([]);
        setPreviewData(null);
        setDataInit(null);
        setOpenModal(false);
    };

    const handlePreview = async () => {
        try {
            const values = await form.validateFields();
            const jobTitleIds: number[] = form.getFieldValue("jobTitleIds") || [];
            if (jobTitleIds.length === 0) {
                notify.warning("Vui lòng chọn ít nhất một chức danh");
                return;
            }
            const payload = {
                departmentId: Number(departmentId),
                jobTitleIds,
                jobStandard: values.jobStandard,
                trainingRequirement: values.trainingRequirement,
                evaluationMethod: values.evaluationMethod,
                requiredTime: values.requiredTime,
                trainingOutcome: values.trainingOutcome,
                performanceRequirement: values.performanceRequirement,
                salaryNote: values.salaryNote,
                active: activeState,
            };
            const preview = await previewBulk(payload);
            setPreviewData(preview);
            setSelectedJobTitleIds(jobTitleIds);
        } catch (err: any) {
            notify.error(err?.message || "Không thể xem trước");
        }
    };

    const handleConfirmCreate = async () => {
        if (!previewData) return;
        const values = form.getFieldsValue();
        const payload = {
            departmentId: Number(departmentId),
            jobTitleIds: selectedJobTitleIds,
            ...values,
            active: activeState,
        };
        try {
            if (selectedJobTitleIds.length === 1) {
                createCareerPath({ ...payload, jobTitleId: selectedJobTitleIds[0] });
            } else {
                await bulkCreate(payload);
            }
            handleReset();
        } catch (err: any) {
            notify.error(err?.message || "Có lỗi xảy ra");
        }
    };

    const handleEditSubmit = async () => {
        try {
            const values = await form.validateFields();
            updateCareerPath({ id: dataInit!.id, ...values, active: activeState });
            handleReset();
        } catch (err: any) {
            notify.error(err?.message || "Cập nhật thất bại");
        }
    };

    const actionBtn: React.CSSProperties = {
        borderRadius: T.rs, fontWeight: 600, fontSize: 13, height: 36,
        background: T.blue, border: "none",
        boxShadow: "0 1px 4px rgba(37,99,235,.2)",
    };

    return (
        <ModalForm
            title={
                <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                        {isEdit ? "Cập nhật lộ trình thăng tiến" : "Tạo lộ trình thăng tiến"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        <BankOutlined style={{ fontSize: 11, color: T.icon }} />
                        <span style={{ fontSize: 12.5, color: T.sub }}>{departmentName}</span>
                    </div>
                </div>
            }
            open={openModal}
            form={form}
            modalProps={{
                onCancel: handleReset,
                afterClose: handleReset,
                destroyOnClose: true,
                width: "min(960px, 96vw)",
                maskClosable: false,
                styles: {
                    body: {
                        padding: "24px 24px 16px",
                        background: T.white,
                        maxHeight: "74vh",
                        overflowY: "auto",
                    },
                    header: {
                        padding: "18px 24px 16px",
                        borderBottom: `1px solid ${T.line}`,
                        background: T.white,
                        borderRadius: "10px 10px 0 0",
                    },
                    footer: {
                        padding: "12px 24px",
                        borderTop: `1px solid ${T.line}`,
                        background: T.white,
                    },
                },
            }}
            submitter={{
                render: () => (
                    <Space size={8}>
                        <Button
                            onClick={handleReset}
                            style={{
                                borderRadius: T.rs, fontWeight: 500,
                                fontSize: 13, height: 36,
                                color: T.sub, borderColor: T.line,
                            }}
                        >
                            Hủy
                        </Button>
                        {isEdit ? (
                            <Button
                                type="primary" loading={isUpdating}
                                onClick={handleEditSubmit} icon={<SendOutlined />}
                                style={actionBtn}
                            >
                                Lưu thay đổi
                            </Button>
                        ) : (
                            <Button
                                type="primary" loading={isPreviewing}
                                onClick={handlePreview} icon={<EyeOutlined />}
                                style={actionBtn}
                            >
                                Xem trước
                            </Button>
                        )}
                    </Space>
                ),
            }}
        >
            {/* ── 1. Thông tin cơ bản ── */}
            <Section icon={<SolutionOutlined />} title="Thông tin cơ bản">
                <Row gutter={[16, 0]} align="bottom">
                    {/* Phòng ban – readonly */}
                    <Col xs={24} sm={7}>
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ marginBottom: 6 }}><Lbl>Phòng ban</Lbl></div>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 7,
                                border: `1px solid ${T.line}`, borderRadius: T.rs,
                                padding: "6px 11px", background: T.bg,
                                fontSize: 13, fontWeight: 500, color: T.sub, minHeight: 34,
                            }}>
                                <BankOutlined style={{ fontSize: 12, color: T.icon, flexShrink: 0 }} />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {departmentName}
                                </span>
                            </div>
                            <ProFormText name="departmentId" hidden />
                        </div>
                    </Col>

                    {/* Chức danh */}
                    <Col xs={24} sm={11}>
                        <ProFormSelect
                            name="jobTitleIds"
                            label={
                                <Lbl>
                                    Chức danh{" "}
                                    <span style={{ fontWeight: 400, color: T.icon }}>(một hoặc nhiều)</span>
                                </Lbl>
                            }
                            mode="multiple"
                            placeholder="Tìm và chọn chức danh..."
                            rules={[{ required: true, message: "Vui lòng chọn ít nhất một chức danh" }]}
                            options={jobTitles.map((jt: any) => ({
                                label: (
                                    <Space size={5}>
                                        <UserSwitchOutlined style={{ color: T.icon, fontSize: 11 }} />
                                        <span style={{ fontSize: 13 }}>{jt.nameVi}</span>
                                        {jt.alreadyExists && (
                                            <Tag style={{
                                                fontSize: 10, lineHeight: "15px", padding: "0 5px",
                                                margin: 0, borderRadius: 3,
                                                color: T.amber, background: T.amberFaint,
                                                border: `1px solid ${T.amberLine}`,
                                            }}>
                                                Đã tồn tại
                                            </Tag>
                                        )}
                                    </Space>
                                ),
                                value: jt.id,
                                disabled: jt.alreadyExists,
                            }))}
                            fieldProps={{
                                loading: loadingJobTitles,
                                showSearch: true,
                                filterOption: false,
                                onSearch: () => { },
                                onChange: () => setPreviewData(null),
                                maxTagCount: "responsive",
                                style: { borderRadius: T.rs },
                            }}
                        />
                    </Col>

                    {/* Thời gian */}
                    <Col xs={24} sm={6}>
                        <ProFormText
                            name="requiredTime"
                            label={<Lbl>Thời gian giữ vị trí</Lbl>}
                            placeholder="12, 18, 24..."
                            fieldProps={{
                                suffix: <span style={{ color: T.icon, fontSize: 12 }}>tháng</span>,
                                prefix: <ClockCircleOutlined style={{ color: T.icon, fontSize: 12 }} />,
                                style: { borderRadius: T.rs, fontSize: 13 },
                            }}
                        />
                    </Col>
                </Row>
            </Section>

            <Divider style={{ margin: "4px 0 22px", borderColor: T.lineLight }} />

            {/* ── 2. Yêu cầu & Tiêu chuẩn ── */}
            <Section icon={<AuditOutlined />} title="Yêu cầu & Tiêu chuẩn">
                <Row gutter={[16, 0]}>
                    <Col xs={24} sm={12}>
                        <ProFormTextArea
                            name="jobStandard"
                            label={<Lbl>Tiêu chuẩn chức danh</Lbl>}
                            placeholder="Năng lực, kinh nghiệm cần đạt để lên vị trí này..."
                            fieldProps={ta(4)}
                        />
                    </Col>
                    <Col xs={24} sm={12}>
                        <ProFormTextArea
                            name="trainingRequirement"
                            label={<Lbl>Yêu cầu đào tạo</Lbl>}
                            placeholder="Khóa học, chứng chỉ, kỹ năng cần hoàn thành..."
                            fieldProps={ta(4)}
                        />
                    </Col>
                </Row>
            </Section>

            <Divider style={{ margin: "4px 0 22px", borderColor: T.lineLight }} />

            {/* ── 3. Đánh giá & Kết quả ── */}
            <Section icon={<BarChartOutlined />} title="Đánh giá & Kết quả mong đợi">
                <Row gutter={[16, 0]}>
                    <Col xs={24} sm={8}>
                        <ProFormTextArea
                            name="evaluationMethod"
                            label={<Lbl>Phương pháp đánh giá</Lbl>}
                            placeholder="KPI, 360 độ, phỏng vấn hội đồng..."
                            fieldProps={ta(4)}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <ProFormTextArea
                            name="trainingOutcome"
                            label={<Lbl>Kết quả đào tạo mong đợi</Lbl>}
                            placeholder="Kỹ năng, kiến thức đạt được sau đào tạo..."
                            fieldProps={ta(4)}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <ProFormTextArea
                            name="performanceRequirement"
                            label={<Lbl>Yêu cầu hiệu quả công việc</Lbl>}
                            placeholder="Mức KPI tối thiểu, chỉ số hiệu suất..."
                            fieldProps={ta(4)}
                        />
                    </Col>
                </Row>
            </Section>

            <Divider style={{ margin: "4px 0 22px", borderColor: T.lineLight }} />

            {/* ── 4. Ghi chú & Cài đặt ── */}
            <Section icon={<DollarOutlined />} title="Ghi chú & Cài đặt" last>
                <Row gutter={[16, 0]} align="middle">
                    <Col xs={24} sm={17}>
                        <ProFormTextArea
                            name="salaryNote"
                            label={<Lbl>Ghi chú về lương & đãi ngộ</Lbl>}
                            placeholder="Mức lương, phụ cấp, thưởng theo lộ trình thăng tiến..."
                            fieldProps={ta(3)}
                        />
                    </Col>

                    {/* Active toggle */}
                    <Col xs={24} sm={7}>
                        <div
                            onClick={() => setActiveState(v => !v)}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                border: `1px solid ${activeState ? "#86efac" : T.line}`,
                                borderRadius: T.r, padding: "11px 14px",
                                cursor: "pointer", userSelect: "none", marginTop: 4,
                                transition: "border-color .15s",
                            }}
                        >
                            <div>
                                <div style={{
                                    fontSize: 13, fontWeight: 600, color: T.text,
                                    display: "flex", alignItems: "center", gap: 6,
                                }}>
                                    <PoweroffOutlined style={{ color: T.icon, fontSize: 12 }} />
                                    Kích hoạt lộ trình
                                </div>
                                <div style={{ fontSize: 12, marginTop: 3, color: activeState ? T.green : T.icon }}>
                                    {activeState ? "Hoạt động ngay sau khi tạo" : "Lưu nháp, chưa kích hoạt"}
                                </div>
                            </div>
                            <Switch
                                checked={activeState}
                                onChange={(v, e) => { e.stopPropagation(); setActiveState(v); }}
                                style={{ background: activeState ? T.green : undefined, flexShrink: 0 }}
                            />
                        </div>
                        <Form.Item name="active" noStyle>
                            <input type="hidden" value={activeState ? "true" : "false"} />
                        </Form.Item>
                    </Col>
                </Row>
            </Section>

            {/* ══ PREVIEW PANEL ══ */}
            {previewData && !isEdit && (
                <>
                    <Divider style={{ margin: "20px 0 16px", borderColor: T.line }} />

                    {/* Preview section header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                        <ReadOutlined style={{ color: T.icon, fontSize: 13 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                            Kết quả xem trước
                        </span>
                        <span style={{ flex: 1, height: 1, background: T.line, marginLeft: 2 }} />
                        <span style={{
                            fontSize: 12, color: T.sub, background: T.bg,
                            border: `1px solid ${T.line}`, borderRadius: 20, padding: "1px 10px",
                        }}>
                            {selectedJobTitleIds.length} chức danh
                        </span>
                    </div>

                    <Row gutter={[12, 12]}>
                        {previewData.willCreate?.length > 0 && (
                            <Col xs={24} sm={previewData.willSkip?.length > 0 ? 12 : 24}>
                                <ChipList
                                    color={T.green} faint={T.greenFaint} line={T.greenLine}
                                    icon={<CheckCircleFilled />} label="Sẽ được tạo mới"
                                    items={previewData.willCreate}
                                    renderItem={(item) => item.jobTitleName || item.nameVi}
                                />
                            </Col>
                        )}
                        {previewData.willSkip?.length > 0 && (
                            <Col xs={24} sm={previewData.willCreate?.length > 0 ? 12 : 24}>
                                <ChipList
                                    color={T.amber} faint={T.amberFaint} line={T.amberLine}
                                    icon={<StopOutlined />} label="Bỏ qua (đã tồn tại)"
                                    items={previewData.willSkip}
                                    renderItem={(item) => (
                                        <>
                                            {item.jobTitleName}
                                            <Text style={{ fontSize: 11.5, color: T.icon, marginLeft: 6 }}>
                                                — {item.reason}
                                            </Text>
                                        </>
                                    )}
                                />
                            </Col>
                        )}
                    </Row>

                    <Button
                        type="primary" size="large" block
                        loading={isBulkCreating || isCreating}
                        onClick={handleConfirmCreate}
                        disabled={!previewData.willCreate || previewData.willCreate.length === 0}
                        icon={<SendOutlined />}
                        style={{
                            marginTop: 14, height: 42, borderRadius: T.rs,
                            fontWeight: 600, fontSize: 13.5,
                            background: previewData.willCreate?.length > 0 ? T.blue : undefined,
                            border: "none",
                            boxShadow: previewData.willCreate?.length > 0
                                ? "0 2px 8px rgba(37,99,235,.2)" : undefined,
                        }}
                    >
                        Xác nhận tạo {previewData.willCreate?.length || 0} lộ trình thăng tiến
                    </Button>
                </>
            )}
        </ModalForm>
    );
};

export default ModalCareerPath;