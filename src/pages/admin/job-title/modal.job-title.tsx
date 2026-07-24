/* ===================== JOB TITLE DRAWER (LOTUS DETAIL DRAWER) ===================== */

import { useEffect, useMemo, useState } from "react";
import {
    ProFormText,
    ProFormSelect,
    ProFormSwitch,
} from "@ant-design/pro-components";
import { Col, Form, Row, Button, Input, Select, Tooltip, Divider, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, UploadOutlined, SolutionOutlined, BankOutlined } from "@ant-design/icons";

import type { IJobTitle, IPositionLevel, ICompany } from "@/types/backend";
import type { IJobTitleForm } from "@/types/backend";
import {
    useCreateJobTitleMutation,
    useUpdateJobTitleMutation,
} from "@/hooks/useJobTitles";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { usePositionLevelsQuery } from "@/hooks/usePositionLevels";
import { notify } from "@/components/common/notification/notify";
import { useIsMobile } from "@/hooks/useIsMobile";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";

const { Text } = Typography;

const LOTUS_PINK = "#e8637a";
const LOTUS_PINK_HOVER = "#d94f67";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IJobTitle | null;
    setDataInit: (v: IJobTitle | null) => void;
}

interface IJobRow {
    key: number;
    nameVi: string;
    nameEn: string;
    positionLevelId: number | null;
    touched: boolean;
}

let rowKey = 0;
const newRow = (): IJobRow => ({
    key: ++rowKey,
    nameVi: "",
    nameEn: "",
    positionLevelId: null,
    touched: false,
});

const ModalJobTitle = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const [form] = Form.useForm<IJobTitleForm>();
    const isEdit = Boolean(dataInit?.id);
    const isMobile = useIsMobile();

    const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);
    const [editCompanyId, setEditCompanyId] = useState<number | null>(null);
    const [rows, setRows] = useState<IJobRow[]>([newRow()]);
    const [submitted, setSubmitted] = useState(false);

    const { mutateAsync: createData, isPending: isCreating } = useCreateJobTitleMutation();
    const { mutateAsync: updateData, isPending: isUpdating } = useUpdateJobTitleMutation();

    const { data: companiesRes, isLoading: loadingCompany } = useCompaniesQuery("page=1&size=100&sort=name,asc", openModal);
    const companies = useMemo(
        () => (companiesRes?.result ?? [])
            .filter((c: ICompany) => c.id !== undefined)
            .map((c: ICompany) => ({ label: c.name ?? "", value: c.id as number })),
        [companiesRes]
    );

    const activeCid = isEdit
        ? (editCompanyId ?? dataInit?.positionLevel?.companyId ?? null)
        : filterCompanyId;

    const { data: plRes, isLoading: loadingPL } = usePositionLevelsQuery(
        `page=1&size=500&sort=bandOrder,asc&sort=code,asc&filter=company.id:${activeCid}`,
        openModal && !!activeCid
    );
    const positionLevels = useMemo(
        () => (plRes?.result ?? []).map((pl: IPositionLevel) => ({
            label: `${pl.code}`,
            value: pl.id as number,
        })),
        [plRes]
    );

    // ─── Prefill edit / reset create ───
    useEffect(() => {
        if (!openModal) return;
        if (isEdit && dataInit) {
            const cid = dataInit.positionLevel?.companyId;
            setEditCompanyId(cid ?? null);
            form.setFieldsValue({
                nameVi: dataInit.nameVi,
                nameEn: dataInit.nameEn,
                active: dataInit.active,
                companyId: cid,
                positionLevelId: dataInit.positionLevel?.id,
            });
        } else {
            form.resetFields();
            setRows([newRow()]);
            setFilterCompanyId(null);
            setEditCompanyId(null);
            setSubmitted(false);
        }
    }, [openModal, dataInit]);

    const handleClose = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
        setSubmitted(false);
    };

    // ─── Submit EDIT ───
    const submitEdit = async (values: IJobTitleForm): Promise<boolean> => {
        try {
            await updateData({
                id: dataInit!.id,
                nameVi: values.nameVi,
                nameEn: values.nameEn,
                positionLevelId: values.positionLevelId,
                active: values.active,
            });
            handleClose();
            return true;
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Không thể cập nhật chức danh");
            return false;
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── Submit CREATE (nhiều rows) ───
    const submitCreate = async (): Promise<void> => {
        if (isSubmitting || isCreating) return;
        setSubmitted(true);
        if (!filterCompanyId) {
            notify.warning("Vui lòng chọn công ty trước khi tạo chức danh");
            return;
        }
        for (const row of rows) {
            if (!row.nameVi.trim()) { notify.warning("Vui lòng nhập tên tiếng Việt cho tất cả chức danh"); return; }
            if (!row.positionLevelId) { notify.warning("Vui lòng chọn bậc cho tất cả chức danh"); return; }
        }
        setIsSubmitting(true);
        try {
            const results = await Promise.allSettled(
                rows.map(async (row) => {
                    try {
                        await createData({
                            nameVi: row.nameVi.trim(),
                            nameEn: row.nameEn.trim() || undefined,
                            positionLevelId: row.positionLevelId!,
                            active: true,
                        });
                        return { success: true, row };
                    } catch (err: any) {
                        return { success: false, row, message: err?.response?.data?.message || err?.message || "Có lỗi khi tạo chức danh" };
                    }
                })
            );
            const succeeded = results.filter((r) => r.status === "fulfilled").length;
            const failed = results.filter((r) => r.status === "rejected");
            if (succeeded > 0) notify.success(`Đã tạo ${succeeded} chức danh`);
            failed.forEach((r) => {
                if (r.status === "rejected") notify.error(r.reason?.response?.data?.message || "Không thể tạo chức danh");
            });
            if (failed.length === 0) handleClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Row helpers ───
    const updateRow = (key: number, field: keyof IJobRow, value: any) =>
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value, touched: true } : r)));
    const addRow = () => setRows((prev) => [...prev, newRow()]);
    const removeRow = (key: number) => {
        if (rows.length === 1) return;
        setRows((prev) => prev.filter((r) => r.key !== key));
    };
    const handleFilterCompanyChange = (cid: number) => {
        setFilterCompanyId(cid);
        setRows((prev) => prev.map((r) => ({ ...r, positionLevelId: null })));
    };

    return (
        <LotusDetailDrawer
            open={openModal}
            onClose={handleClose}
            height="calc(100dvh - 32px)"
        >
            <div style={styles.container}>
                {/* ── 1. HEADER ── */}
                <div style={styles.header}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={styles.iconBox}>
                            <SolutionOutlined style={{ fontSize: 20, color: LOTUS_PINK }} />
                        </div>
                        <div>
                            <div style={styles.title}>
                                {isEdit ? "Cập nhật chức danh" : "Thêm mới chức danh hệ thống"}
                            </div>
                            <div style={styles.subtitle}>
                                {isEdit
                                    ? `Đang chỉnh sửa chức danh: ${dataInit?.nameVi ?? ""}`
                                    : "Chọn công ty và khởi tạo danh sách chức danh theo bậc tương ứng"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2. BODY CONTENT (SCROLLABLE) ── */}
                <div style={styles.body}>
                    {isEdit ? (
                        /* EDIT MODE FORM */
                        <Form form={form} layout="vertical" onFinish={submitEdit}>
                            <Row gutter={[16, 8]}>
                                <Col xs={24} sm={12}>
                                    <ProFormText
                                        name="nameVi"
                                        label="Tên chức danh (VI)"
                                        rules={[{ required: true, message: "Vui lòng nhập tên tiếng Việt" }]}
                                    />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <ProFormText
                                        name="nameEn"
                                        label="Tên chức danh (EN)"
                                        placeholder="Tên tiếng Anh (nếu có)"
                                    />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <ProFormSelect
                                        name="companyId"
                                        label="Công ty"
                                        options={companies}
                                        fieldProps={{
                                            disabled: true,
                                            showSearch: true,
                                            optionFilterProp: "label",
                                            loading: loadingCompany,
                                            placeholder: "Chọn công ty...",
                                            onChange: (cid: number) => {
                                                form.setFieldValue("positionLevelId", undefined);
                                                setEditCompanyId(cid);
                                            },
                                        }}
                                        rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                                    />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <ProFormSelect
                                        name="positionLevelId"
                                        label="Bậc chức danh"
                                        options={positionLevels}
                                        fieldProps={{
                                            showSearch: true,
                                            optionFilterProp: "label",
                                            loading: loadingPL,
                                            placeholder: "Chọn bậc...",
                                        }}
                                        rules={[{ required: true, message: "Vui lòng chọn bậc" }]}
                                    />
                                </Col>
                                <Col xs={24}>
                                    <div style={styles.statusBox}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                                Trạng thái hoạt động
                                            </div>
                                            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                                                Cho phép gán chức danh này cho nhân sự trong công ty
                                            </div>
                                        </div>
                                        <ProFormSwitch
                                            name="active"
                                            noStyle
                                            checkedChildren="Bật"
                                            unCheckedChildren="Tắt"
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </Form>
                    ) : (
                        /* CREATE MODE FORM (MULTI-ROW) */
                        <div>
                            {/* Filter Select Company */}
                            <div style={styles.companySelectBox}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                                    <BankOutlined style={{ color: LOTUS_PINK }} />
                                    <span>Chọn Công ty áp dụng <span style={{ color: "#EF4444" }}>*</span></span>
                                </div>
                                <Select
                                    style={{ width: "100%" }}
                                    size="large"
                                    placeholder="Chọn công ty để tải danh sách Bậc chức danh tương ứng..."
                                    showSearch
                                    optionFilterProp="label"
                                    loading={loadingCompany}
                                    options={companies}
                                    value={filterCompanyId}
                                    onChange={handleFilterCompanyChange}
                                />
                            </div>

                            <Divider style={{ margin: "18px 0 14px" }} />

                            {/* Header grid */}
                            {!isMobile && (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 220px 40px",
                                    gap: 12,
                                    marginBottom: 8,
                                    padding: "0 4px",
                                }}>
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                        Tên Tiếng Việt <span style={{ color: "#EF4444" }}>*</span>
                                    </Text>
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                        Tên Tiếng Anh
                                    </Text>
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                        Bậc chức danh <span style={{ color: "#EF4444" }}>*</span>
                                    </Text>
                                    <span />
                                </div>
                            )}

                            {/* Multi-Rows Container */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {rows.map((row) => {
                                    const showNameViError = submitted && row.nameVi.trim() === "";
                                    const showPlError = submitted && !row.positionLevelId;

                                    return (
                                        <div key={row.key} style={{
                                            display: "grid",
                                            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 220px 40px",
                                            gap: 10,
                                            alignItems: "center",
                                            background: "#F8FAFC",
                                            padding: "10px 12px",
                                            borderRadius: 8,
                                            border: "1px solid #E2E8F0",
                                        }}>
                                            <Input
                                                placeholder="Tên chức danh (VI)"
                                                value={row.nameVi}
                                                status={showNameViError ? "error" : ""}
                                                onChange={(e) => updateRow(row.key, "nameVi", e.target.value)}
                                                style={{ borderRadius: 6 }}
                                            />
                                            <Input
                                                placeholder="Tên tiếng Anh (EN)"
                                                value={row.nameEn}
                                                onChange={(e) => updateRow(row.key, "nameEn", e.target.value)}
                                                style={{ borderRadius: 6 }}
                                            />
                                            <Select
                                                style={{ width: "100%" }}
                                                placeholder="Chọn bậc..."
                                                showSearch
                                                optionFilterProp="label"
                                                loading={loadingPL}
                                                options={positionLevels}
                                                value={row.positionLevelId}
                                                disabled={!filterCompanyId}
                                                status={showPlError ? "error" : ""}
                                                onChange={(val) => updateRow(row.key, "positionLevelId", val)}
                                            />
                                            <Tooltip title="Xóa dòng này">
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    disabled={rows.length === 1}
                                                    onClick={() => removeRow(row.key)}
                                                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                                />
                                            </Tooltip>
                                        </div>
                                    );
                                })}
                            </div>

                            <Button
                                type="dashed"
                                icon={<PlusOutlined />}
                                onClick={addRow}
                                disabled={!filterCompanyId}
                                style={{
                                    width: "100%",
                                    marginTop: 14,
                                    borderRadius: 8,
                                    height: 40,
                                    fontWeight: 600,
                                    borderColor: "#CBD5E1",
                                    color: "#475569",
                                }}
                            >
                                Thêm dòng mới
                            </Button>

                            {rows.length > 1 && (
                                <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
                                    • Đã tạo danh sách gồm {rows.length} chức danh mới
                                </Text>
                            )}
                        </div>
                    )}
                </div>

                {/* ── 3. FOOTER ── */}
                <div style={styles.footer}>
                    <div style={{ display: "flex", gap: 8 }}>
                        {!isEdit && (
                            <Button icon={<UploadOutlined />} style={{ borderRadius: 8 }}>
                                Import từ Excel
                            </Button>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                        <Button onClick={handleClose} style={{ borderRadius: 8, height: 38, paddingLeft: 18, paddingRight: 18 }}>
                            Hủy bỏ
                        </Button>
                        <Button
                            type="primary"
                            loading={isCreating || isUpdating || isSubmitting}
                            disabled={isCreating || isUpdating || isSubmitting}
                            onClick={isEdit ? () => form.submit() : submitCreate}
                            style={styles.submitBtn}
                        >
                            {isEdit ? "Lưu thay đổi" : `Lưu chức danh${rows.length > 1 ? ` (${rows.length})` : ""}`}
                        </Button>
                    </div>
                </div>
            </div>
        </LotusDetailDrawer>
    );
};

/* ── Clean Styles for LotusDetailDrawer ── */
const styles: Record<string, React.CSSProperties> = {
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#FFFFFF",
    },
    header: {
        padding: "20px 28px",
        borderBottom: "1px solid #F1F5F9",
        background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
        flexShrink: 0,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        background: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)",
        border: "1px solid #FECDD3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    title: {
        fontSize: 17,
        fontWeight: 700,
        color: "#0F172A",
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
    },
    subtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 3,
        fontWeight: 400,
    },
    body: {
        flex: 1,
        overflowY: "auto",
        padding: "24px 28px",
    },
    companySelectBox: {
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        padding: "14px 16px",
    },
    statusBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#F8FAFC",
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid #E2E8F0",
        marginTop: 10,
    },
    footer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 28px",
        borderTop: "1px solid #F1F5F9",
        background: "#FAFAFA",
        flexShrink: 0,
    },
    submitBtn: {
        borderRadius: 8,
        background: "linear-gradient(135deg, #E8637A 0%, #D94F67 100%)",
        borderColor: LOTUS_PINK,
        fontWeight: 600,
        height: 38,
        paddingLeft: 22,
        paddingRight: 22,
        boxShadow: "0 3px 8px rgba(232, 99, 122, 0.25)",
    },
};

export default ModalJobTitle;
