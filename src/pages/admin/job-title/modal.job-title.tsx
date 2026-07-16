import { useEffect, useState, useCallback } from "react";
import {
    ModalForm,
    ProFormText,
    ProFormSelect,
    ProFormSwitch,
} from "@ant-design/pro-components";
import { Col, Form, Row, message, Button, Input, Select, Tooltip, Divider, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";

import type { IJobTitle, IPositionLevel, ICompany } from "@/types/backend";
import type { IJobTitleForm } from "@/types/backend";
import {
    useCreateJobTitleMutation,
    useUpdateJobTitleMutation,
} from "@/hooks/useJobTitles";
import { callFetchCompany, callFetchPositionLevel } from "@/config/api";
import { useIsMobile, useModalWidth } from "@/components/common/modal/detail";

const { Text } = Typography;

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

const plCache = new Map<number, { label: string; value: number }[]>();

let rowKey = 0;
const newRow = (): IJobRow => ({
    key: ++rowKey,
    nameVi: "",
    nameEn: "",
    positionLevelId: null,
    touched: false,
});

// ── Shared form CSS ──────────────────────────────────────────────────────────
const FORM_CSS = (cls: string, isMobile: boolean) => `
    .${cls} .ant-modal-content {
        border-radius: 16px !important;
        box-shadow: 0 12px 40px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.06) !important;
        overflow: hidden; padding: 0 !important;
    }
    .${cls} .ant-modal-header {
        padding: ${isMobile ? "14px 16px 0" : "18px 24px 0"} !important;
        border-bottom: none !important; background: #fff !important; margin-bottom: 0 !important;
    }
    .${cls} .ant-modal-title {
        font-size: 15px !important; font-weight: 700 !important;
        color: #111827 !important; letter-spacing: -0.03em !important;
    }
    .${cls} .ant-modal-body { padding: ${isMobile ? "14px 16px 4px" : "16px 24px 4px"} !important; }
    .${cls} .ant-modal-footer {
        padding: ${isMobile ? "10px 16px 14px" : "10px 24px 18px"} !important;
        border-top: 1.5px solid #f3f4f6 !important; margin-top: 0 !important;
    }
    .${cls} .ant-modal-close {
        top: 12px !important; right: 18px !important;
        width: 28px !important; height: 28px !important;
        border-radius: 8px !important; background: #f7f7f8 !important;
        border: 1.5px solid #efefef !important;
        display: flex !important; align-items: center !important;
        justify-content: center !important; transition: all 0.2s !important;
    }
    .${cls} .ant-modal-close:hover { background: #f0f0f0 !important; border-color: #e0e0e0 !important; }
    .${cls} .ant-modal-close .ant-modal-close-x {
        width: 28px !important; height: 28px !important;
        line-height: 28px !important; font-size: 12px !important; color: #6b7280 !important;
    }
    .${cls} .ant-btn-primary {
        background: #f5317f !important; border-color: #f5317f !important;
        border-radius: 8px !important; font-weight: 600 !important;
        box-shadow: 0 2px 8px rgba(245,49,127,0.25) !important;
    }
    .${cls} .ant-btn-primary:hover { background: #d4206a !important; border-color: #d4206a !important; }
    .${cls} .ant-btn-default { border-radius: 8px !important; border-color: #e5e7eb !important; color: #6b7280 !important; }
    .${cls} .ant-form-item-label > label { font-size: 13px !important; font-weight: 500 !important; color: #374151 !important; }
    .${cls} .ant-input, .${cls} .ant-select-selector { border-radius: 8px !important; border-color: #e5e7eb !important; }
    .${cls} .ant-input:focus, .${cls} .ant-select-focused .ant-select-selector {
        border-color: #f5317f !important; box-shadow: 0 0 0 3px rgba(245,49,127,0.10) !important;
    }
    .${cls} .ant-switch-checked { background: #f5317f !important; }
`;

const MODAL_MASK = { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.2)" };

const ModalJobTitle = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const [form]      = Form.useForm<IJobTitleForm>();
    const isEdit      = Boolean(dataInit?.id);
    const isMobile    = useIsMobile();
    const editWidth   = useModalWidth(600);
    const createWidth = useModalWidth(760);

    const [companies, setCompanies]           = useState<{ label: string; value: number }[]>([]);
    const [positionLevels, setPositionLevels] = useState<{ label: string; value: number }[]>([]);
    const [loadingCompany, setLoadingCompany] = useState(false);
    const [loadingPL, setLoadingPL]           = useState(false);
    const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);
    const [rows, setRows]       = useState<IJobRow[]>([newRow()]);
    const [submitted, setSubmitted] = useState(false);

    const { mutateAsync: createData, isPending: isCreating } = useCreateJobTitleMutation();
    const { mutateAsync: updateData, isPending: isUpdating } = useUpdateJobTitleMutation();

    // ─── Load companies 1 lần khi mở modal ───
    useEffect(() => {
        if (!openModal) return;
        setLoadingCompany(true);
        callFetchCompany("page=1&size=100&sort=name,asc")
            .then((res: any) => {
                setCompanies(
                    (res?.data?.result ?? [])
                        .filter((c: ICompany) => c.id !== undefined)
                        .map((c: ICompany) => ({ label: c.name ?? "", value: c.id as number }))
                );
            })
            .finally(() => setLoadingCompany(false));
    }, [openModal]);

    // ─── Load bậc theo công ty (có cache) ───
    const loadPL = useCallback(async (cid: number) => {
        if (plCache.has(cid)) { setPositionLevels(plCache.get(cid)!); return; }
        setLoadingPL(true);
        try {
            const res = await callFetchPositionLevel(
                `page=1&size=500&sort=bandOrder,asc&sort=code,asc&filter=company.id:${cid}`
            ) as any;
            const opts = (res?.data?.result ?? []).map((pl: IPositionLevel) => ({
                label: `${pl.code}`,
                value: pl.id as number,
            }));
            plCache.set(cid, opts);
            setPositionLevels(opts);
        } finally { setLoadingPL(false); }
    }, []);

    // ─── Prefill edit / reset create ───
    useEffect(() => {
        if (!openModal) return;
        if (isEdit && dataInit) {
            const cid = dataInit.positionLevel?.companyId;
            if (cid) loadPL(cid);
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
            setPositionLevels([]);
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
            message.error(err?.response?.data?.message || "Có lỗi khi cập nhật chức danh");
            return false;
        }
    };

    // ─── Submit CREATE (nhiều rows, Promise.all) ───
    const submitCreate = async (): Promise<void> => {
        setSubmitted(true);
        for (const row of rows) {
            if (!row.nameVi.trim()) { message.warning("Vui lòng nhập tên VI cho tất cả chức danh"); return; }
            if (!row.positionLevelId) { message.warning("Vui lòng chọn bậc cho tất cả chức danh"); return; }
        }
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
        const failed    = results.filter((r) => r.status === "rejected");
        if (succeeded > 0) message.success(`Đã tạo ${succeeded} chức danh`);
        failed.forEach((r) => {
            if (r.status === "rejected") message.error(r.reason?.response?.data?.message || "Có lỗi khi tạo chức danh");
        });
        if (failed.length === 0) handleClose();
    };

    // ─── Row helpers ───
    const updateRow = (key: number, field: keyof IJobRow, value: any) =>
        setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value, touched: true } : r)));
    const addRow    = () => setRows((prev) => [...prev, newRow()]);
    const removeRow = (key: number) => {
        if (rows.length === 1) return;
        setRows((prev) => prev.filter((r) => r.key !== key));
    };
    const handleFilterCompanyChange = (cid: number) => {
        setFilterCompanyId(cid);
        setPositionLevels([]);
        setRows((prev) => prev.map((r) => ({ ...r, positionLevelId: null })));
        loadPL(cid);
    };

    // ===================== EDIT MODE =====================
    if (isEdit) {
        return (
            <>
                <style>{FORM_CSS("job-title-edit-modal", isMobile)}</style>
                <ModalForm<IJobTitleForm>
                    title="Cập nhật chức danh"
                    open={openModal}
                    onOpenChange={setOpenModal}
                    form={form}
                    onFinish={submitEdit}
                    modalProps={{ className: "job-title-form-modal", 
                        destroyOnHidden: true,
                        maskClosable: false,
                        confirmLoading: isUpdating,
                        width: editWidth,
                        centered: true,
                        styles: { mask: MODAL_MASK },
                    }}
                >
                    <Row gutter={[16, 4]}>
                        <Col xs={24} sm={12}>
                            <ProFormText
                                name="nameVi"
                                label="Tên chức danh (VI)"
                                rules={[{ required: true, message: "Vui lòng nhập tên VI" }]}
                                fieldProps={{ size: "large" }}
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <ProFormText name="nameEn" label="Tên chức danh (EN)" fieldProps={{ size: "large" }} />
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
                                    size: "large",
                                    onChange: (cid: number) => {
                                        form.setFieldValue("positionLevelId", undefined);
                                        loadPL(cid);
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
                                    disabled: true,
                                    showSearch: true,
                                    optionFilterProp: "label",
                                    loading: loadingPL,
                                    placeholder: "Chọn bậc...",
                                    size: "large",
                                }}
                                rules={[{ required: true, message: "Vui lòng chọn bậc" }]}
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <ProFormSwitch
                                name="active"
                                label="Trạng thái"
                                checkedChildren="Hoạt động"
                                unCheckedChildren="Ngừng"
                            />
                        </Col>
                    </Row>
                </ModalForm>
            </>
        );
    }

    // ===================== CREATE MODE (multi-row) =====================
    return (
        <>
            <style>{FORM_CSS("job-title-create-modal", isMobile)}</style>
            <ModalForm
                title="Thêm chức danh"
                open={openModal}
                onOpenChange={setOpenModal}
                submitter={{
                    render: () => (
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <Button onClick={handleClose}>Hủy</Button>
                            <Button icon={<UploadOutlined />}>Import Excel</Button>
                            <Button
                                type="primary"
                                loading={isCreating}
                                onClick={submitCreate}
                            >
                                {`Lưu${rows.length > 1 ? ` (${rows.length})` : ""}`}
                            </Button>
                        </div>
                    ),
                }}
                modalProps={{
                    destroyOnHidden: true,
                    maskClosable: false,
                    width: createWidth,
                    centered: true,
                    className: "job-title-create-modal",
                    styles: { mask: MODAL_MASK },
                }}
            >
                {/* Chọn công ty để filter bậc cho tất cả rows */}
                <div style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                        Công ty <span style={{ color: "red" }}>*</span>
                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                            (chọn để lọc danh sách bậc)
                        </Text>
                    </Text>
                    <Select
                        style={{ width: "100%" }}
                        size="large"
                        placeholder="Chọn công ty..."
                        showSearch
                        optionFilterProp="label"
                        loading={loadingCompany}
                        options={companies}
                        value={filterCompanyId}
                        onChange={handleFilterCompanyChange}
                    />
                </div>

                <Divider style={{ margin: "12px 0" }} />

                {/* Header — ẩn trên mobile */}
                {!isMobile && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 180px 36px",
                        gap: 8, marginBottom: 6, padding: "0 2px",
                    }}>
                        <Text style={{ fontSize: 13, fontWeight: 500 }}>Tên VI <span style={{ color: "red" }}>*</span></Text>
                        <Text style={{ fontSize: 13, fontWeight: 500 }}>Tên EN</Text>
                        <Text style={{ fontSize: 13, fontWeight: 500 }}>Bậc <span style={{ color: "red" }}>*</span></Text>
                        <span />
                    </div>
                )}

                {/* Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 8 }}>
                    {rows.map((row) => {
                        const showNameViError = submitted && row.nameVi.trim() === "";
                        const showPlError     = submitted && !row.positionLevelId;

                        return isMobile ? (
                            /* Mobile: stack vertically */
                            <div key={row.key} style={{
                                background: "#fafafa", border: "1px solid #e5e7eb",
                                borderRadius: 10, padding: "10px 12px",
                                display: "flex", flexDirection: "column", gap: 8,
                            }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <Text style={{ fontSize: 11, color: "#6b7280", width: 48, flexShrink: 0 }}>Tên VI *</Text>
                                    <Input
                                        size="small"
                                        placeholder="Tên chức danh"
                                        value={row.nameVi}
                                        status={showNameViError ? "error" : ""}
                                        onChange={(e) => updateRow(row.key, "nameVi", e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <Text style={{ fontSize: 11, color: "#6b7280", width: 48, flexShrink: 0 }}>Tên EN</Text>
                                    <Input
                                        size="small"
                                        placeholder="Tên tiếng Anh"
                                        value={row.nameEn}
                                        onChange={(e) => updateRow(row.key, "nameEn", e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <Text style={{ fontSize: 11, color: "#6b7280", width: 48, flexShrink: 0 }}>Bậc *</Text>
                                    <Select
                                        size="small"
                                        style={{ flex: 1 }}
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
                                    <Tooltip title="Xóa dòng">
                                        <Button type="text" danger icon={<DeleteOutlined />}
                                            disabled={rows.length === 1}
                                            onClick={() => removeRow(row.key)}
                                            style={{ padding: 0 }}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        ) : (
                            /* Desktop: grid layout */
                            <div key={row.key} style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 180px 36px",
                                gap: 8, alignItems: "center",
                            }}>
                                <Input
                                    placeholder="Tên chức danh"
                                    value={row.nameVi}
                                    status={showNameViError ? "error" : ""}
                                    onChange={(e) => updateRow(row.key, "nameVi", e.target.value)}
                                />
                                <Input
                                    placeholder="Tên tiếng anh"
                                    value={row.nameEn}
                                    onChange={(e) => updateRow(row.key, "nameEn", e.target.value)}
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
                                <Tooltip title="Xóa dòng">
                                    <Button type="text" danger icon={<DeleteOutlined />}
                                        disabled={rows.length === 1}
                                        onClick={() => removeRow(row.key)}
                                        style={{ padding: 0 }}
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
                    style={{ width: "100%", marginTop: 12, borderRadius: 8 }}
                >
                    Thêm dòng
                </Button>

                {rows.length > 1 && (
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
                        {rows.length} chức danh sẽ được tạo cùng lúc
                    </Text>
                )}
            </ModalForm>
        </>
    );
};

export default ModalJobTitle;