import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Button,
    Col,
    Dropdown,
    Empty,
    Form,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import type { ProColumns } from "@ant-design/pro-components";
import {
    ApartmentOutlined,
    CheckCircleFilled,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    FileTextOutlined,
    GlobalOutlined,
    MoreOutlined,
    PauseCircleOutlined,
    PlusOutlined,
    PoweroffOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import type {
    IAccountingDossierCategory,
    IAccountingDocumentCategory,
    ICompany,
    IAccountingDossierCategoryRequest,
} from "@/types/backend";
import ActionButton from "@/components/common/ui/ActionButton";
import {
    callCreateAccountingDossierCategory,
    callDeleteAccountingDossierCategory,
    callFetchAccountingDocumentCategoryActive,
    callFetchAccountingDossierCategories,
    callToggleAccountingDossierCategoryActive,
    callUpdateAccountingDossierCategory,
} from "@/config/api";
import { getModalWidth } from "@/utils/responsive";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import DataTable from "@/components/common/data-table";
import { notify } from "@/components/common/notification/notify";
import type { TemplateFormValues } from "../dossierUtils";
import type { MenuProps } from "antd";

const { Text, Title } = Typography;

const TEMPLATE_CACHE_TTL_MS = 60_000;
let templateLookupCache: {
    rows: IAccountingDossierCategory[];
    documentCategories: IAccountingDocumentCategory[];
    expiresAt: number;
} | null = null;

type DossierTemplateDrawerProps = {
    open: boolean;
    companies: ICompany[];
    onClose: () => void;
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    canToggleActive?: boolean;
    isSuperAdmin?: boolean;
};

const DossierTemplateDrawer = ({
    open,
    companies,
    onClose,
    canCreate = false,
    canUpdate = false,
    canDelete = false,
    canToggleActive = false,
    isSuperAdmin = false,
}: DossierTemplateDrawerProps) => {
    const [rows, setRows] = useState<IAccountingDossierCategory[]>([]);
    const [docCategories, setDocCategories] = useState<IAccountingDocumentCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [editorRecord, setEditorRecord] = useState<IAccountingDossierCategory | null | "new">(null);
    const [previewRecord, setPreviewRecord] = useState<IAccountingDossierCategory | null>(null);

    const loadData = useCallback(async (force = false) => {
        if (!force && templateLookupCache && templateLookupCache.expiresAt > Date.now()) {
            setRows(templateLookupCache.rows);
            setDocCategories(templateLookupCache.documentCategories);
            return;
        }
        setLoading(true);
        try {
            const [templateRes, docCatRes] = await Promise.all([
                callFetchAccountingDossierCategories("page=1&size=200&sort=categoryName,asc"),
                callFetchAccountingDocumentCategoryActive(),
            ]);
            const nextRows = (templateRes as any)?.data?.result || [];
            const nextDocumentCategories = (docCatRes as any)?.data || [];
            templateLookupCache = {
                rows: nextRows,
                documentCategories: nextDocumentCategories,
                expiresAt: Date.now() + TEMPLATE_CACHE_TTL_MS,
            };
            setRows(nextRows);
            setDocCategories(nextDocumentCategories);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) void loadData();
    }, [open, loadData]);

    const filteredRows = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
        if (!normalizedQuery) return rows;
        return rows.filter((record) => [record.categoryCode, record.categoryName, record.description]
            .filter(Boolean)
            .some((value) => value!.toLocaleLowerCase("vi-VN").includes(normalizedQuery)));
    }, [query, rows]);

    const toggleActive = useCallback(async (record: IAccountingDossierCategory) => {
        if (!record.id) return;
        try {
            await callToggleAccountingDossierCategoryActive(record.id, !record.active);
            notify.success(record.active ? "Đã ngưng hiệu lực mẫu" : "Đã kích hoạt lại mẫu");
            await loadData();
        } catch (error: any) {
            notify.error(error?.response?.status === 401
                ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để cập nhật trạng thái mẫu."
                : error?.response?.data?.message || error?.response?.data?.error || "Không thể cập nhật trạng thái mẫu");
        }
    }, [loadData]);

    const deleteTemplate = useCallback(async (record: IAccountingDossierCategory) => {
        if (!record.id) return;
        try {
            await callDeleteAccountingDossierCategory(record.id);
            notify.success("Đã xóa mẫu bộ chứng từ");
            await loadData();
        } catch (error: any) {
            notify.error(error?.response?.data?.message || "Không thể xóa mẫu bộ chứng từ");
        }
    }, [loadData]);

    const confirmDeleteTemplate = useCallback((record: IAccountingDossierCategory) => {
        Modal.confirm({
            title: "Xóa mẫu bộ chứng từ?",
            content: `Mẫu “${record.categoryName}” sẽ bị xóa vĩnh viễn. Chỉ có thể xóa mẫu chưa được dùng để tạo bộ chứng từ.`,
            okText: "Xóa mẫu",
            cancelText: "Hủy",
            okButtonProps: { danger: true },
            onOk: () => deleteTemplate(record),
        });
    }, [deleteTemplate]);

    const getActionMenu = useCallback((record: IAccountingDossierCategory): MenuProps => ({
        items: [
            ...(canToggleActive && record.active ? [{
                key: "toggle-active",
                className: record.active ? "template-action-menu-pause" : "template-action-menu-activate",
                icon: record.active ? <PauseCircleOutlined /> : <CheckCircleFilled />,
                label: record.active ? "Ngưng hiệu lực" : "Kích hoạt lại",
            }] : []),
            ...(canDelete ? [{ type: "divider" as const }, {
                key: "delete",
                className: "template-action-menu-delete",
                danger: true,
                icon: <DeleteOutlined />,
                label: "Xóa mẫu",
            }] : []),
        ],
        onClick: ({ key }) => {
            if (key === "toggle-active") void toggleActive(record);
            if (key === "delete") confirmDeleteTemplate(record);
        },
    }), [canDelete, canToggleActive, canUpdate, confirmDeleteTemplate, toggleActive]);

    const columns = useMemo<ProColumns<IAccountingDossierCategory>[]>(() => [
        {
            title: "Mã mẫu",
            dataIndex: "categoryCode",
            width: 270,
            responsive: ["sm"],
            render: (value: any) => value ? (
                <Tag style={{ fontFamily: "monospace", margin: 0 }}>{String(value)}</Tag>
            ) : (
                <Tag style={{ margin: 0 }}>Chưa có mã</Tag>
            ),
        },
        {
            title: "Mẫu bộ chứng từ",
            dataIndex: "categoryName",
            render: (value: React.ReactNode, record) => (
                <div className="template-name-cell">
                    <Text strong className="template-name">{value}</Text>
                    <Text type="secondary" className="template-description" ellipsis={{ tooltip: record.description }}>
                        {record.description || "Chưa có mô tả"}
                    </Text>
                    <div className="template-mobile-actions">
                        <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setPreviewRecord(record)}>Xem</Button>
                        {canUpdate && <Button size="small" type="text" icon={<EditOutlined />} onClick={() => setEditorRecord(record)}>Sửa</Button>}
                        {canToggleActive && !record.active && <Button size="small" type="text" className="template-activate-button" icon={<PoweroffOutlined />} onClick={() => void toggleActive(record)}>Kích hoạt</Button>}
                        {((record.active && canToggleActive) || canDelete) && (
                            <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
                                <ActionButton
                                    variant="default"
                                    tooltip="Thao tác khác"
                                    aria-label={`Thao tác với ${record.categoryName}`}
                                    icon={<MoreOutlined />}
                                />
                            </Dropdown>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: "Phạm vi",
            width: 142,
            responsive: ["lg"],
            render: (_, record) => record.scope === "COMPANY" ? (
                <span className="template-scope"><ApartmentOutlined /> Theo công ty</span>
            ) : (
                <span className="template-scope"><GlobalOutlined /> Toàn hệ thống</span>
            ),
        },
        {
            title: "Chứng từ",
            width: 118,
            responsive: ["lg"],
            render: (_, record) => {
                const total = record.documentCategories?.length || 0;
                const required = record.documentCategories?.filter((item: any) => item.required !== false).length || 0;
                return <span className="template-doc-count"><FileTextOutlined /> {required}/{total}</span>;
            },
        },
        {
            title: "Trạng thái",
            width: 126,
            responsive: ["md"],
            render: (_, record) => record.active ? (
                <Tag color="success" icon={<CheckCircleFilled />}>Đang hiệu lực</Tag>
            ) : (
                <Tag color="error" icon={<PauseCircleOutlined />}>Ngưng hiệu lực</Tag>
            ),
        },
        {
            title: "Thao tác",
            width: 120,
            align: "center",
            fixed: "right",
            responsive: ["sm"],
            render: (_, record) => (
                <Space size={4} align="center">
                    <ActionButton
                        variant="view"
                        tooltip="Xem mẫu"
                        aria-label={`Xem ${record.categoryName}`}
                        icon={<EyeOutlined />}
                        onClick={() => setPreviewRecord(record)}
                    />
                    {canUpdate && (
                        <ActionButton
                            variant="edit"
                            tooltip="Chỉnh sửa mẫu"
                            aria-label={`Chỉnh sửa ${record.categoryName}`}
                            icon={<EditOutlined />}
                            onClick={() => setEditorRecord(record)}
                        />
                    )}
                    {canToggleActive && !record.active && (
                        <ActionButton
                            variant="success"
                            tooltip="Kích hoạt lại"
                            aria-label={`Kích hoạt lại ${record.categoryName}`}
                            icon={<PoweroffOutlined />}
                            onClick={() => void toggleActive(record)}
                        />
                    )}
                    {((record.active && canToggleActive) || canDelete) && (
                        <Dropdown menu={getActionMenu(record)} trigger={["click"]}>
                            <ActionButton
                                variant="default"
                                tooltip="Thao tác khác"
                                aria-label={`Thao tác với ${record.categoryName}`}
                                icon={<MoreOutlined />}
                            />
                        </Dropdown>
                    )}
                </Space>
            ),
        },
            ], [canDelete, canToggleActive, canUpdate, getActionMenu]);

    const editorOpen = editorRecord !== null;
    const editing = editorRecord === "new" ? null : editorRecord;

    return (
        <LotusDetailDrawer
            open={open}
            onClose={onClose}
            height="calc(100vh - 24px)"
            destroyOnClose
            closeAriaLabel="Đóng mẫu bộ chứng từ"
        >
            <div className="dossier-template-drawer">
                <style>{`
                .dossier-template-drawer .template-drawer-title > span { color: #e8356d; font-size: 11px; font-weight: 750; letter-spacing: .04em; text-transform: uppercase; }
                .dossier-template-drawer .template-drawer-title .ant-typography { margin: 3px 0 0; color: #172033; font-size: 22px; line-height: 1.2; }
                .dossier-template-drawer .template-total { font-size: 13px; }
                .dossier-template-drawer { display: flex; flex-direction: column; height: 100%; background: #fbfcfe; }
                .dossier-template-drawer .template-drawer-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 18px 28px; border-bottom: 1px solid #edf0f4; background: #fff; }
                .dossier-template-drawer .template-drawer-content { flex: 1; overflow: auto; padding: 20px 28px 28px; }
                .dossier-template-drawer .template-create-button.ant-btn-primary { background: #e8356d !important; border-color: #e8356d !important; box-shadow: 0 6px 14px rgba(232, 53, 109, .18); }
                .dossier-template-drawer .template-create-button.ant-btn-primary:hover, .dossier-template-drawer .template-create-button.ant-btn-primary:focus { color: #fff !important; background: #c9275a !important; border-color: #c9275a !important; box-shadow: 0 8px 18px rgba(201, 39, 90, .22); }
                .dossier-template-drawer .template-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
                .dossier-template-drawer .template-search { max-width: 380px; }
                .dossier-template-drawer .template-search .ant-input-affix-wrapper { min-height: 40px; border-color: #dfe4ea; border-radius: 10px; box-shadow: none; }
                .dossier-template-drawer .template-search .ant-input-affix-wrapper:focus-within { border-color: #e8356d; box-shadow: 0 0 0 3px rgba(232, 53, 109, .1); }
                .dossier-template-drawer .template-table .ant-pro-card { box-shadow: none; }
                .dossier-template-drawer .template-table .ant-table { background: #fff; border: 1px solid #dfe5ee; border-radius: 14px; overflow: hidden; }
                .dossier-template-drawer .template-table .ant-table-thead > tr > th { background: #f5f7fa; color: #344054; font-size: 13px; font-weight: 700; border-bottom: 1px solid #dfe5ee; padding: 13px 14px; }
                .dossier-template-drawer .template-table .ant-table-tbody > tr > td { padding: 15px 14px; color: #475467; border-bottom-color: #e7ecf2; vertical-align: middle; }
                .dossier-template-drawer .template-table .ant-table-tbody > tr:hover > td { background: #f6f8fb !important; }
                .dossier-template-drawer .template-code { display: block; min-width: 210px; color: #475467; font-family: inherit; font-size: 13px; font-weight: 650; overflow-wrap: anywhere; white-space: normal; }
                .dossier-template-drawer .template-name-cell { display: grid; gap: 4px; min-width: 220px; }
                .dossier-template-drawer .template-name { color: #1f2937; font-size: 15px; line-height: 1.45; font-weight: 700; }
                .dossier-template-drawer .template-description { display: block; max-width: 460px; color: #596579; font-size: 13px; line-height: 1.45; }
                .dossier-template-drawer .template-mobile-actions { display: none; align-items: center; gap: 4px; margin-top: 4px; }
                .dossier-template-drawer .template-scope, .dossier-template-drawer .template-doc-count { display: inline-flex; align-items: center; gap: 6px; color: #526075; font-size: 13px; white-space: nowrap; }
                .dossier-template-drawer .template-doc-count { color: #344054; font-weight: 700; }
                .dossier-template-drawer .template-pause-button { color: #9a5b06; border-color: #f3d6a7; background: #fffbeb; }
                .dossier-template-drawer .template-enable-button { color: #087443; border-color: #b7e1cb; background: #f0fdf4; }
                .dossier-template-drawer .template-activate-button { color: #087443; }
                .dossier-template-drawer .template-activate-button:hover, .dossier-template-drawer .template-activate-button:focus { color: #056c3d; background: #f0fdf4; }
                .dossier-template-drawer .ant-pagination { margin: 18px 0 0; }
                .template-action-menu-activate { color: #087443 !important; }
                .template-action-menu-activate .ant-dropdown-menu-title-content, .template-action-menu-activate .anticon { color: #087443 !important; font-weight: 650; }
                .template-action-menu-activate:hover { background: #f0fdf4 !important; }
                .template-action-menu-pause { color: #9a5b06 !important; }
                .template-action-menu-pause .ant-dropdown-menu-title-content, .template-action-menu-pause .anticon { color: #9a5b06 !important; font-weight: 650; }
                .template-action-menu-pause:hover { background: #fffbeb !important; }
                .template-action-menu-delete:hover { background: #fff1f0 !important; }
                .template-company-select-popup { min-width: min(540px, calc(100vw - 48px)) !important; max-width: calc(100vw - 48px); }
                .template-company-select-popup .ant-select-item { min-height: 42px; padding-top: 9px; padding-bottom: 9px; }
                .template-company-select-popup .ant-select-item-option-content { white-space: normal; overflow-wrap: anywhere; line-height: 1.45; }
                .template-editor-modal-root .ant-modal-mask { background: rgba(15, 23, 42, .58); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
                .template-editor-modal .ant-modal-content { overflow: hidden; border-radius: 16px; box-shadow: 0 24px 64px rgba(31, 41, 55, .18); }
                .template-editor-modal .ant-modal-header { padding: 22px 26px 0; margin-bottom: 0; }
                .template-editor-modal .ant-modal-body { padding: 18px 26px 12px; }
                .template-editor-modal .ant-modal-footer { padding: 14px 26px 18px; margin-top: 0; border-top: 1px solid #edf0f4; }
                .template-editor-modal .editor-modal-title, .template-preview-modal .editor-modal-title { display: flex; align-items: center; gap: 10px; }
                .template-editor-modal .editor-modal-icon, .template-preview-modal .editor-modal-icon { display: inline-flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 9px; color: #a52a55; background: #fff1f5; }
                .template-editor-modal .editor-modal-copy, .template-preview-modal .editor-modal-copy { display: grid; gap: 1px; }
                .template-editor-modal .editor-modal-copy strong, .template-preview-modal .editor-modal-copy strong { color: #202b3c; font-size: 16px; line-height: 20px; }
                .template-editor-modal .editor-modal-copy span, .template-preview-modal .editor-modal-copy span { color: #7b8798; font-size: 12px; font-weight: 400; }
                .template-editor .editor-section { padding: 14px 16px; background: #fbfcfe; border: 1px solid #edf0f4; border-radius: 12px; margin-bottom: 12px; }
                .template-editor { display: flex; flex-direction: column; min-height: 100%; }
                .template-editor .template-editor-main { display: grid; grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr); flex: 1; gap: 14px; min-height: 0; }
                .template-editor .template-editor-main .editor-section { margin-bottom: 0; }
                .template-editor .editor-section-title-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
                .template-editor .editor-section-title { color: #344054; font-size: 14px; font-weight: 750; }
                .template-editor .editor-section-hint { color: #7b8798; font-size: 12px; }
                .template-editor .ant-form-item { margin-bottom: 12px; }
                .template-editor .ant-form-item-label > label { color: #465366; font-size: 13px; font-weight: 600; }
                .template-editor .template-document-list { display: grid; gap: 0; max-height: 272px; overflow-y: auto; overscroll-behavior: contain; padding: 0 2px 0 0; background: #fff; border: 1px solid #e4eaf1; border-radius: 10px; }
                .template-editor .template-document-row { padding: 8px 10px; background: #fff; border-bottom: 1px solid #eef2f6; }
                .template-editor .template-document-row:last-child { border-bottom: 0; }
                .template-editor .template-document-row .ant-form-item { margin-bottom: 0; }
                .template-editor .template-document-empty { padding: 18px; color: #7b8798; font-size: 13px; text-align: center; }
                .template-editor .template-document-add { height: 40px; margin-top: 10px; border-style: solid; border-color: #d8dee7; border-radius: 9px; color: #475467; background: #fff; font-weight: 650; }
                .template-editor .template-document-add:hover, .template-editor .template-document-add:focus { color: #1677ff; border-color: #91caff; background: #f5f9ff; }
                .template-editor .template-document-remove { min-width: 36px; min-height: 32px; }
                .template-editor .template-status-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: auto; padding: 18px 4px 2px; }
                .template-editor .template-status-copy { display: grid; gap: 2px; }
                .template-editor .template-status-copy strong { color: #344054; font-size: 13px; }
                .template-editor .template-status-copy span { color: #7b8798; font-size: 12px; }
                .template-editor .ant-switch.ant-switch-checked { background: #c9577d; }
                .template-editor .ant-switch.ant-switch-checked:hover { background: #b94a70; }
                .template-editor-modal .template-cancel-button, .template-editor-modal .template-save-button { height: 40px; border-radius: 9px; font-weight: 650; }
                .template-editor-modal .template-cancel-button { min-width: 88px; border-color: #d8dee7; color: #475467; background: #fff; }
                .template-editor-modal .template-cancel-button:hover, .template-editor-modal .template-cancel-button:focus { color: #344054; border-color: #b8c1cc; background: #f5f7fa; }
                .template-editor-modal .template-save-button { min-width: 112px; color: #fff; border-color: #e8356d; background: #e8356d; box-shadow: 0 6px 14px rgba(232, 53, 109, .18); }
                .template-editor-modal .template-save-button:hover, .template-editor-modal .template-save-button:focus { color: #fff; border-color: #c9275a; background: #c9275a; }
                .template-preview-modal .ant-modal-content { overflow: hidden; border-radius: 16px; box-shadow: 0 24px 64px rgba(31, 41, 55, .18); }
                .template-preview-modal .ant-modal-header { padding: 24px 28px 0; margin-bottom: 0; }
                .template-preview-modal .ant-modal-body { padding: 22px 28px 28px; }
                .template-preview-modal .ant-modal-footer { padding: 14px 28px 20px; margin-top: 0; border-top: 1px solid #edf0f4; }
                .template-preview-modal .editor-modal-icon { width: 38px; height: 38px; border-radius: 11px; color: #b4235b; background: #fff1f5; }
                .template-preview-modal .editor-modal-copy strong { font-size: 18px; line-height: 22px; }
                .template-preview-modal .editor-modal-copy span { font-size: 13px; }
                .template-preview-modal .template-preview-identity { padding: 18px 20px; background: linear-gradient(135deg, #fff7fa 0%, #ffffff 72%); border: 1px solid #f4dce6; border-radius: 12px; }
                .template-preview-modal .template-preview-name { display: block; margin-bottom: 6px; color: #1d2939; font-size: 18px; font-weight: 750; line-height: 1.4; }
                .template-preview-modal .template-preview-description { margin: 0; color: #667085; font-size: 14px; line-height: 1.6; }
                .template-preview-modal .template-preview-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
                .template-preview-modal .template-preview-meta-item { min-width: 0; padding: 12px 14px; background: #f8fafc; border: 1px solid #e8edf3; border-radius: 10px; }
                .template-preview-modal .template-preview-meta-label { display: block; margin-bottom: 5px; color: #7b8798; font-size: 12px; font-weight: 650; }
                .template-preview-modal .template-preview-meta-value { display: flex; align-items: center; gap: 6px; min-width: 0; color: #344054; font-size: 14px; font-weight: 650; line-height: 1.4; }
                .template-preview-modal .template-preview-code { overflow-wrap: anywhere; word-break: break-word; }
                .template-preview-modal .template-preview-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 24px 0 10px; }
                .template-preview-modal .template-preview-section-title { margin: 0; color: #344054; font-size: 14px; font-weight: 750; }
                .template-preview-modal .template-preview-documents { display: grid; gap: 8px; }
                .template-preview-modal .template-preview-document { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; background: #fff; border: 1px solid #e7ecf2; border-radius: 10px; }
                .template-preview-modal .template-preview-document-main { display: flex; align-items: center; gap: 10px; min-width: 0; color: #344054; font-size: 14px; font-weight: 650; }
                .template-preview-modal .template-preview-document-main .anticon { color: #6b7a90; font-size: 16px; }
                .template-preview-modal .template-preview-document-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .template-preview-modal .template-preview-close { min-width: 90px; }
                @media (max-width: 575px) {
                    .template-editor-modal .ant-modal-header { padding: 20px 20px 0; }
                    .template-editor-modal .ant-modal-body { padding: 16px 20px 10px; }
                    .template-editor-modal .ant-modal-footer { padding: 12px 20px 16px; }
                    .template-editor .editor-section { padding: 14px; }
                    .template-editor .editor-section-title-row { align-items: flex-start; flex-direction: column; gap: 3px; }
                    .template-editor .template-document-list { max-height: 224px; }
                    .template-preview-modal .ant-modal-header { padding: 20px 20px 0; }
                    .template-preview-modal .ant-modal-body { padding: 18px 20px 20px; }
                    .template-preview-modal .ant-modal-footer { padding: 12px 20px 16px; }
                    .template-preview-modal .template-preview-meta { grid-template-columns: 1fr; }
                }
                @media (max-width: 991px) {
                    .template-editor .template-editor-main { grid-template-columns: 1fr; }
                    .template-editor .template-editor-main .editor-section { margin-bottom: 12px; }
                }
                @media (min-width: 992px) {
                    .template-editor .template-document-list { max-height: 356px; }
                }
                @media (max-width: 767px) {
                    .dossier-template-drawer .template-drawer-header { padding: 16px 20px; }
                    .dossier-template-drawer .template-drawer-content { padding: 16px 20px 24px; }
                    .dossier-template-drawer .template-toolbar { align-items: stretch; flex-direction: column; }
                    .dossier-template-drawer .template-search { max-width: none; }
                    .dossier-template-drawer .template-total { display: none; }
                    .dossier-template-drawer .template-drawer-title .ant-typography { font-size: 18px; }
                    .dossier-template-drawer .template-mobile-actions { display: flex; }
                    .dossier-template-drawer .template-name-cell { min-width: 0; }
                }
            `}</style>

                <div className="template-drawer-header">
                    <div className="template-drawer-title">
                        <span>Thiết lập kế toán</span>
                        <Title level={4}>Mẫu bộ chứng từ</Title>
                    </div>
                    <Space size={12}>
                        <Text type="secondary" className="template-total">{filteredRows.length} mẫu</Text>
                        {canCreate && <Button className="template-create-button" type="primary" icon={<PlusOutlined />} onClick={() => setEditorRecord("new")}>Tạo mẫu</Button>}
                    </Space>
                </div>

                <div className="template-drawer-content">
            <div className="template-toolbar">
                <Input
                    className="template-search"
                    prefix={<SearchOutlined style={{ color: "#98a2b3" }} />}
                    placeholder="Tìm theo mã, tên hoặc mô tả mẫu"
                    value={query}
                    allowClear
                    onChange={(event) => setQuery(event.target.value)}
                />
                <Text type="secondary">Chọn một mẫu để chỉnh sửa hoặc thay đổi trạng thái sử dụng.</Text>
            </div>

            <div className="template-table">
                <DataTable<IAccountingDossierCategory>
                    rowKey={(record) => String(record.id)}
                    loading={loading}
                    dataSource={filteredRows}
                    columns={columns}
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: true,
                        pageSizeOptions: [8, 16, 32],
                        showTotal: (total) => `${total} mẫu`,
                    }}
                    scroll={{ x: "max-content" }}
                    sticky={false}
                />
            </div>

            {editorOpen && (
                <TemplateEditorModal
                    open={editorOpen}
                    record={editing}
                    companies={companies}
                    documentCategories={docCategories}
                    isSuperAdmin={isSuperAdmin}
                    onClose={() => setEditorRecord(null)}
                    onSaved={async () => {
                        setEditorRecord(null);
                        await loadData(true);
                    }}
                />
            )}
            {previewRecord && <TemplatePreviewModal record={previewRecord} onClose={() => setPreviewRecord(null)} />}
                </div>
            </div>
        </LotusDetailDrawer>
    );
};

const TemplatePreviewModal = ({ record, onClose }: { record: IAccountingDossierCategory; onClose: () => void }) => {
    const documentCategories = record.documentCategories || [];
    const isActive = record.active;
    const scopeLabel = record.scope === "COMPANY" ? "Theo công ty" : "Toàn hệ thống";

    return (
        <Modal
            open
            className="template-preview-modal"
            title={
                <div className="editor-modal-title">
                    <span className="editor-modal-icon"><EyeOutlined /></span>
                    <span className="editor-modal-copy">
                        <strong>Chi tiết mẫu bộ chứng từ</strong>
                        <span>Xem cấu hình đang áp dụng cho mẫu này</span>
                    </span>
                </div>
            }
            footer={<Button className="template-preview-close" onClick={onClose}>Đóng</Button>}
            onCancel={onClose}
            width={getModalWidth(640)}
            destroyOnHidden
        >
            <div className="template-preview-identity">
                <Text className="template-preview-name">{record.categoryName || "Chưa có tên mẫu"}</Text>
                <div className="template-preview-description">{record.description || "Mẫu này chưa có mô tả."}</div>
            </div>

            <div className="template-preview-meta">
                <div className="template-preview-meta-item">
                    <span className="template-preview-meta-label">Mã mẫu</span>
                    <span className="template-preview-meta-value template-preview-code">{record.categoryCode || "Chưa có mã"}</span>
                </div>
                <div className="template-preview-meta-item">
                    <span className="template-preview-meta-label">Trạng thái</span>
                    <span className="template-preview-meta-value">
                        {isActive
                            ? <Tag color="success" icon={<CheckCircleFilled />}>Đang hiệu lực</Tag>
                            : <Tag color="error" icon={<PauseCircleOutlined />}>Ngưng hiệu lực</Tag>}
                    </span>
                </div>
                <div className="template-preview-meta-item">
                    <span className="template-preview-meta-label">Phạm vi áp dụng</span>
                    <span className="template-preview-meta-value">
                        {record.scope === "COMPANY" ? <ApartmentOutlined /> : <GlobalOutlined />}
                        {scopeLabel}
                    </span>
                </div>
                <div className="template-preview-meta-item">
                    <span className="template-preview-meta-label">Phiên bản</span>
                    <span className="template-preview-meta-value">v{record.version || 1}</span>
                </div>
            </div>

            <div className="template-preview-section-heading">
                <div className="template-preview-section-title">Loại chứng từ trong mẫu</div>
                <Text type="secondary">{documentCategories.length} loại</Text>
            </div>
            <div className="template-preview-documents">
                {documentCategories.length ? documentCategories.map((document: any) => (
                    <div className="template-preview-document" key={document.id}>
                        <span className="template-preview-document-main">
                            <FileTextOutlined />
                            <span className="template-preview-document-name">{document.categoryName || document.categoryCode || "Loại chứng từ"}</span>
                        </span>
                        <Tag color={document.required === false ? "default" : "blue"}>{document.required === false ? "Tùy chọn" : "Bắt buộc"}</Tag>
                    </div>
                )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có loại chứng từ" />}
            </div>
        </Modal>
    );
};

const TemplateEditorModal = ({
    open,
    record,
    companies,
    documentCategories,
    isSuperAdmin,
    onClose,
    onSaved,
}: {
    open: boolean;
    record: IAccountingDossierCategory | null;
    companies: ICompany[];
    documentCategories: IAccountingDocumentCategory[];
    isSuperAdmin: boolean;
    onClose: () => void;
    onSaved: () => Promise<void>;
}) => {
    const [form] = Form.useForm<TemplateFormValues>();
    const [saving, setSaving] = useState(false);
    const scope = Form.useWatch("scope", form);

    useEffect(() => {
        const defaultCompanyId = !isSuperAdmin && companies.length === 1 ? companies[0].id : undefined;
        form.setFieldsValue(record ? {
            categoryCode: record.categoryCode,
            categoryName: record.categoryName,
            description: record.description,
            scope: isSuperAdmin ? (record.scope as "GLOBAL" | "COMPANY") || "GLOBAL" : "COMPANY",
            companyId: record.companyId || defaultCompanyId,
            active: record.active,
            documentCategoryItems: record.documentCategories?.map((item: any) => ({ documentCategoryId: item.id, required: item.required ?? true })) || [],
        } : {
            categoryCode: undefined,
            categoryName: undefined,
            description: undefined,
            scope: isSuperAdmin ? "GLOBAL" : "COMPANY",
            companyId: defaultCompanyId,
            active: true,
            documentCategoryItems: [],
        });
    }, [companies, form, isSuperAdmin, record]);

    const saveTemplate = async () => {
        const values = await form.validateFields();
        setSaving(true);
        try {
            const effectiveScope = isSuperAdmin ? values.scope : "COMPANY";
            const payload: IAccountingDossierCategoryRequest = {
                categoryCode: values.categoryCode?.trim(),
                categoryName: values.categoryName.trim(),
                description: values.description?.trim(),
                scope: effectiveScope,
                companyId: effectiveScope === "COMPANY" ? values.companyId : null,
                active: values.active ?? true,
                documentCategoryItems: values.documentCategoryItems?.map((item, index) => ({ documentCategoryId: item.documentCategoryId, required: item.required ?? true, sortOrder: index })) || [],
            };
            if (record?.id) await callUpdateAccountingDossierCategory(record.id, payload);
            else await callCreateAccountingDossierCategory(payload);
            await onSaved();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            className="template-editor-modal"
            title={
                <div className="editor-modal-title">
                    <span className="editor-modal-icon"><FileTextOutlined /></span>
                    <span className="editor-modal-copy">
                        <strong>{record ? "Cập nhật mẫu bộ chứng từ" : "Tạo mẫu bộ chứng từ"}</strong>
                        <span>{record ? "Điều chỉnh thông tin và loại chứng từ áp dụng" : "Thiết lập thông tin và loại chứng từ áp dụng"}</span>
                    </span>
                </div>
            }
            footer={[
                <Button key="cancel" className="template-cancel-button" onClick={onClose}>Hủy</Button>,
                <Button key="save" className="template-save-button" type="primary" loading={saving} onClick={() => void saveTemplate()}>Lưu mẫu</Button>,
            ]}
            onCancel={onClose}
            width={getModalWidth(1040)}
            style={{ top: 32, maxWidth: "calc(100vw - 32px)" }}
            styles={{ body: { height: "clamp(560px, calc(100vh - 210px), 720px)", maxHeight: "calc(100vh - 210px)", overflowY: "auto" } }}
            rootClassName="template-editor-modal-root"
            destroyOnHidden
        >
            <Form form={form} layout="vertical" className="template-editor" initialValues={{ scope: "GLOBAL", active: true }} validateTrigger="onBlur">
                <div className="template-editor-main">
                    <div className="editor-section">
                        <div className="editor-section-title-row">
                            <div className="editor-section-title">Thông tin mẫu</div>
                            <span className="editor-section-hint">Các trường có dấu * là bắt buộc</span>
                        </div>
                        <Row gutter={16}>
                            <Col xs={24} md={8}><Form.Item label="Mã mẫu" name="categoryCode"><Input placeholder="Tự sinh nếu để trống" /></Form.Item></Col>
                            <Col xs={24} md={16}><Form.Item label="Tên mẫu" name="categoryName" rules={[{ required: true, message: "Nhập tên mẫu" }]}><Input placeholder="Ví dụ: Bộ chứng từ thanh toán nhà cung cấp" /></Form.Item></Col>
                            <Col xs={24} md={scope === "COMPANY" ? 12 : 24}><Form.Item label="Phạm vi" name="scope" rules={[{ required: true }]} extra={!isSuperAdmin ? "Mẫu chỉ áp dụng trong công ty được phân quyền." : undefined}><Select disabled={!isSuperAdmin} options={isSuperAdmin ? [{ value: "GLOBAL", label: "Toàn hệ thống" }, { value: "COMPANY", label: "Theo công ty" }] : [{ value: "COMPANY", label: "Theo công ty" }]} /></Form.Item></Col>
                            {scope === "COMPANY" && <Col xs={24} md={12}><Form.Item label="Công ty áp dụng" name="companyId" rules={[{ required: true, message: "Chọn công ty áp dụng" }]}><Select showSearch optionFilterProp="label" listHeight={336} popupMatchSelectWidth={false} classNames={{ popup: { root: "template-company-select-popup" } }} placeholder="Tìm và chọn công ty" options={companies.map((company) => ({ value: company.id, label: company.code ? `${company.code} · ${company.name}` : company.name }))} /></Form.Item></Col>}
                            <Col xs={24}><Form.Item label="Mô tả" name="description"><Input.TextArea rows={2} placeholder="Mô tả ngắn để người dùng chọn đúng mẫu" /></Form.Item></Col>
                        </Row>
                    </div>

                    <div className="editor-section">
                        <div className="editor-section-title-row">
                            <div className="editor-section-title">Loại chứng từ trong mẫu</div>
                            <span className="editor-section-hint">Danh sách cuộn khi có nhiều loại</span>
                        </div>
                        <Form.List name="documentCategoryItems">
                            {(fields, { add, remove }) => (
                                <Space direction="vertical" className="w-full" size={0}>
                                    <div className="template-document-list">
                                        {fields.length === 0 && <div className="template-document-empty">Chưa chọn loại chứng từ nào.</div>}
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Row key={key} gutter={12} align="middle" className="template-document-row">
                                                <Col xs={24} sm={14} md={15}><Form.Item {...restField} name={[name, "documentCategoryId"]} rules={[{ required: true, message: "Chọn loại chứng từ" }]}><Select size="middle" showSearch optionFilterProp="label" placeholder="Chọn loại chứng từ" options={documentCategories.map((item) => ({ value: item.id, label: item.categoryName }))} /></Form.Item></Col>
                                                <Col xs={18} sm={7} md={6}><Form.Item {...restField} name={[name, "required"]} valuePropName="checked" initialValue><Switch size="small" checkedChildren="Bắt buộc" unCheckedChildren="Tùy chọn" /></Form.Item></Col>
                                                <Col xs={6} sm={3} className="text-right"><Tooltip title="Xóa loại chứng từ"><Button className="template-document-remove" danger type="text" aria-label="Xóa loại chứng từ" icon={<DeleteOutlined />} onClick={() => remove(name)} /></Tooltip></Col>
                                            </Row>
                                        ))}
                                    </div>
                                    <Button className="template-document-add" block icon={<PlusOutlined />} onClick={() => add({ required: true })}>Thêm loại chứng từ</Button>
                                </Space>
                            )}
                        </Form.List>
                    </div>
                </div>

                <div className="template-status-row">
                    <span className="template-status-copy">
                        <strong>Trạng thái sử dụng</strong>
                        <span>Mẫu đang dùng có thể được chọn khi tạo bộ chứng từ.</span>
                    </span>
                    <Form.Item name="active" valuePropName="checked" noStyle>
                        <Switch checkedChildren="Hiệu lực" unCheckedChildren="Ngưng hiệu lực" />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};

export default DossierTemplateDrawer;
