import {
    ProFormSwitch,
    ProFormText,
    ProFormTextArea,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import { callCreateRole, callUpdateRole } from '@/config/api';
import type { IPermission, IRole } from '@/types/backend';
import ModuleApi, { MODULE_MERGE_MAP, CHILD_TO_PARENT } from './module.api';
import { useAppDispatch } from '@/redux/hooks';
import { useState, useMemo } from 'react';
import { notify } from '@/components/common/notification/notify';
import LotusDetailDrawer from '@/components/common/drawer/LotusDetailDrawer';

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    reloadTable: () => void;
    listPermissions: {
        module: string;
        permissions: IPermission[];
    }[];
    singleRole: IRole | null;
    setSingleRole: (v: any) => void;
}

const countSelectedPermissions = (perms: Record<string, any> | undefined): number => {
    if (!perms) return 0;
    let count = 0;
    for (const key in perms) {
        if (key.match(/^[1-9][0-9]*$/) && perms[key] === true) {
            count++;
        }
    }
    return count;
};

/* ── ModalRole Component ── */
const ModalRole = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, listPermissions, singleRole, setSingleRole } = props;
    const dispatch = useAppDispatch();
    const [form] = Form.useForm();
    const isEdit = !!singleRole?.id;
    const [showLeft, setShowLeft] = useState(true);

    // Merge database modules into parent virtual groups on the frontend as defined in MODULE_MERGE_MAP
    const processedListPermissions = useMemo(() => {
        if (!listPermissions) return [];

        const byParent = new Map<string, IPermission[]>();
        const passthrough: { module: string; permissions: IPermission[] }[] = [];

        for (const grp of listPermissions) {
            const parent = CHILD_TO_PARENT[grp.module] ?? (MODULE_MERGE_MAP[grp.module] ? grp.module : null);
            if (parent) {
                const arr = byParent.get(parent) ?? [];
                arr.push(...(grp.permissions || []));
                byParent.set(parent, arr);
            } else {
                passthrough.push(grp);
            }
        }

        const merged = Array.from(byParent.entries()).map(([module, permissions]) => ({
            module,
            permissions,
        }));

        return [...merged, ...passthrough];
    }, [listPermissions]);

    // Calculate total permissions in the system
    const totalSystemPermissions = useMemo(() => {
        if (!listPermissions) return 0;
        return listPermissions.reduce((acc, curr) => acc + (curr.permissions?.length ?? 0), 0);
    }, [listPermissions]);

    const submitRole = async (valuesForm: any) => {
        const { description, active, name } = valuesForm;
        // permissions không được đăng ký qua Form.Item name="permissions" (chỉ có
        // noStyle/shouldUpdate để hiển thị), nên valuesForm.permissions luôn undefined -
        // phải đọc thẳng từ form store bằng getFieldValue.
        const permissions = form.getFieldValue('permissions');
        const checkedPermissions: { id: string }[] = [];

        if (permissions) {
            for (const key in permissions) {
                if (key.match(/^[1-9][0-9]*$/) && permissions[key] === true) {
                    checkedPermissions.push({ id: key });
                }
            }
        }

        const role = { name, description, active, permissions: checkedPermissions };

        if (isEdit) {
            const res = await callUpdateRole(role, singleRole!.id as string);
            if (res.data) {
                notify.success('Cập nhật vai trò thành công');
                handleReset();
                reloadTable();
            } else {
                notify.error(res.message || 'Không thể cập nhật vai trò. Vui lòng thử lại.');
            }
        } else {
            const res = await callCreateRole(role);
            if (res.data) {
                notify.success('Tạo vai trò thành công');
                handleReset();
                reloadTable();
            } else {
                notify.error(res.message || 'Không thể tạo vai trò. Vui lòng thử lại.');
            }
        }
    };

    const handleReset = () => {
        form.resetFields();
        setOpenModal(false);
        setSingleRole(null);
        setShowLeft(true);
    };

    return (
        <>
            <style>{globalCss}</style>
            <LotusDetailDrawer
                open={openModal}
                onClose={handleReset}
                maskClosable={false}
                keyboard={false}
            >
                <Form
                    form={form}
                    onFinish={submitRole}
                    scrollToFirstError
                    preserve={false}
                    layout="vertical"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                    {/* ── HEADER ── */}
                    <div style={s.header} className="apple-modal-header">
                        <div style={s.headerIcon}>
                            {isEdit ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" />
                                    <path d="M12 8v8M8 12h8" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            )}
                        </div>
                        <div style={s.headerLeft}>
                            <div style={s.title}>{isEdit ? 'Chỉnh sửa Role' : 'Tạo Role mới'}</div>
                            <div style={s.subtitle}>
                                {isEdit
                                    ? `Đang chỉnh sửa: ${singleRole?.name}`
                                    : 'Điền thông tin và phân quyền cho vai trò mới'}
                            </div>
                        </div>

                        {/* Toggle left panel */}
                        <button
                            style={s.toggleBtn}
                            type="button"
                            onClick={() => setShowLeft(v => !v)}
                            className="apple-toggle-btn"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="7" height="18" rx="2" stroke="#475569" strokeWidth="1.8" />
                                <path d="M14 7h5M14 12h5M14 17h5" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            <span style={s.toggleBtnLabel}>
                                {showLeft ? 'Ẩn thông tin' : 'Hiện thông tin'}
                            </span>
                        </button>
                    </div>

                    {/* ── BODY ── */}
                    <div style={s.body} className="apple-modal-body-layout">

                        {/* ── LEFT PANEL ── */}
                        <div style={{
                            ...s.leftPanel,
                            width: showLeft ? 280 : 0, // Desktop base width
                            opacity: showLeft ? 1 : 0,
                            paddingLeft: showLeft ? 18 : 0,
                            paddingRight: showLeft ? 18 : 0,
                            pointerEvents: showLeft ? 'auto' : 'none',
                        }} className={`apple-left-panel ${showLeft ? 'active' : ''}`}>
                            <div className="apple-left-panel-inner" style={{ width: 244, minWidth: 244 }}>
                                <div style={s.sectionLabel}>
                                    <span style={s.sectionDot} />
                                    Thông tin cơ bản
                                </div>

                                <div style={s.fieldGroup}>
                                    <label style={s.label}>Tên Role <span style={s.required}>*</span></label>
                                    <ProFormText
                                        name="name"
                                        noStyle
                                        rules={[{ required: true, message: 'Vui lòng nhập tên role' }]}
                                        fieldProps={{
                                            placeholder: 'VD: ADMIN, HR_MANAGER...',
                                            size: 'large',
                                        }}
                                    />
                                </div>

                                <div style={s.fieldGroup}>
                                    <label style={s.label}>Mô tả <span style={s.required}>*</span></label>
                                    <ProFormTextArea
                                        name="description"
                                        noStyle
                                        rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                                        fieldProps={{
                                            placeholder: 'Mô tả ngắn về vai trò này...',
                                            autoSize: { minRows: 3, maxRows: 4 },
                                        }}
                                    />
                                </div>

                                {/* Status */}
                                <div style={s.fieldGroup}>
                                    <label style={s.label}>Trạng thái</label>
                                    <Form.Item noStyle shouldUpdate={(p, c) => p.active !== c.active}>
                                        {({ getFieldValue }) => {
                                            const active = getFieldValue('active') !== false;
                                            return (
                                                <div style={s.statusCard}>
                                                    <div style={s.statusLeft}>
                                                        <div style={{
                                                            ...s.statusDot,
                                                            background: active ? '#34C759' : '#D1D1D6',
                                                        }} />
                                                        <div>
                                                            <div style={{
                                                                fontSize: 13,
                                                                fontWeight: 600,
                                                                color: active ? '#0F172A' : '#64748B',
                                                            }}>
                                                                {active ? 'Đang hoạt động' : 'Không hoạt động'}
                                                            </div>
                                                            <div style={{
                                                                fontSize: 11,
                                                                color: '#64748B',
                                                                marginTop: 1,
                                                            }}>
                                                                {active ? 'Có thể gán cho người dùng' : 'Tạm thời vô hiệu hoá'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ProFormSwitch
                                                        name="active"
                                                        noStyle
                                                        initialValue={true}
                                                        fieldProps={{ defaultChecked: true }}
                                                    />
                                                </div>
                                            );
                                        }}
                                    </Form.Item>
                                </div>

                                {/* Summary */}
                                <div style={s.summaryWrap}>
                                    <div style={s.sectionLabel}>
                                        <span style={{ ...s.sectionDot, background: '#2563EB' }} />
                                        Tổng quan
                                    </div>
                                    <div style={s.summaryGrid}>
                                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.permissions !== curr.permissions}>
                                            {({ getFieldValue }) => {
                                                const count = countSelectedPermissions(getFieldValue('permissions'));
                                                return (
                                                    <div style={s.summaryCard}>
                                                        <div style={{ ...s.summaryNum, color: '#2563EB' }}>
                                                            {count}
                                                            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>/{totalSystemPermissions}</span>
                                                        </div>
                                                        <div style={s.summaryLabel}>Quyền đã chọn</div>
                                                    </div>
                                                );
                                            }}
                                        </Form.Item>
                                        <div style={s.summaryCard}>
                                            <div style={{ ...s.summaryNum, color: '#475569' }}>
                                                {processedListPermissions?.length ?? 0}
                                            </div>
                                            <div style={s.summaryLabel}>Module hệ thống</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── DIVIDER ── */}
                        {showLeft && <div style={s.vDivider} className="apple-v-divider" />}

                        {/* ── RIGHT PANEL ── */}
                        <div style={s.rightPanel} className={`apple-right-panel ${showLeft ? 'has-left' : ''}`}>
                            <div style={s.rightHeader}>
                                <div style={s.rightHeaderLeft}>
                                    <div style={s.sectionLabelBold}>
                                        <span style={{ ...s.sectionDot, background: '#2563EB' }} />
                                        Phân quyền
                                    </div>
                                    <span style={s.rightHintBold}>Bật / tắt từng quyền hoặc toàn bộ module</span>
                                </div>
                                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.permissions !== curr.permissions}>
                                    {({ getFieldValue }) => {
                                        const count = countSelectedPermissions(getFieldValue('permissions'));
                                        return count > 0 ? (
                                            <div style={s.rightBadge}>
                                                Đã chọn {count}/{totalSystemPermissions} quyền
                                            </div>
                                        ) : null;
                                    }}
                                </Form.Item>
                            </div>
                            <div style={s.permScroll}>
                                <ModuleApi
                                    form={form}
                                    listPermissions={processedListPermissions}
                                    singleRole={singleRole}
                                    openModal={openModal}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── FOOTER ── */}
                    <div style={s.footer} className="apple-modal-footer">
                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.permissions !== curr.permissions}>
                            {({ getFieldValue }) => {
                                const count = countSelectedPermissions(getFieldValue('permissions'));
                                return (
                                    <div style={s.footerInfo}>
                                        {count > 0 ? (
                                            <div style={s.footerBadge}>
                                                <div style={s.footerDot} />
                                                Đã chọn {count}/{totalSystemPermissions} quyền
                                            </div>
                                        ) : (
                                            <div style={s.footerEmpty}>Chưa chọn quyền nào</div>
                                        )}
                                    </div>
                                );
                            }}
                        </Form.Item>
                        <div style={s.footerRight}>
                            <button
                                style={s.cancelBtn}
                                onClick={handleReset}
                                type="button"
                                className="apple-cancel-btn"
                            >
                                Hủy
                            </button>
                            <button
                                style={s.submitBtn}
                                type="button"
                                onClick={() => form.submit()}
                                className="apple-submit-btn"
                            >
                                {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </Form>
            </LotusDetailDrawer>
        </>
    );
};

/* ─── Styles ─── */
const s: Record<string, React.CSSProperties> = {

    /* Header */
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '16px 20px 14px',
        borderBottom: '1px solid #F0F0F0',
        background: '#FFFFFF',
        flexShrink: 0,
    },
    headerIcon: {
        width: 34,
        height: 34,
        borderRadius: 9,
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    headerLeft: { flex: 1 },
    title: {
        fontSize: 16,
        fontWeight: 700,
        color: '#0F172A',
        letterSpacing: '-0.3px',
        lineHeight: 1.3,
    },
    subtitle: {
        fontSize: 12,
        color: '#475569',
        fontWeight: 500,
        marginTop: 2,
    },

    /* Toggle btn */
    toggleBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 11px',
        borderRadius: 8,
        border: '1px solid #CBD5E1',
        background: '#FAFAFA',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.15s',
    },
    toggleBtnLabel: {
        fontSize: 12,
        color: '#1E293B',
        fontWeight: 600,
        whiteSpace: 'nowrap' as const,
    },

    closeBtn: {
        width: 26,
        height: 26,
        borderRadius: '50%',
        border: '1px solid #CBD5E1',
        background: '#F9F9F9',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s',
    },

    /* Body */
    body: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
    },

    /* Left panel */
    leftPanel: {
        flexShrink: 0,
        paddingTop: 18,
        paddingBottom: 18,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#F9F9FB',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s, padding 0.25s',
    },
    sectionLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        color: '#0F172A',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.6px',
        marginBottom: 12,
    },
    sectionLabelBold: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 14,
        fontWeight: 700,
        color: '#0F172A',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    sectionDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#34C759',
        flexShrink: 0,
        display: 'inline-block',
    },
    fieldGroup: {
        marginBottom: 14,
    },
    label: {
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: '#1E293B',
        marginBottom: 5,
    },
    required: {
        color: '#FF3B30',
        marginLeft: 2,
    },

    /* Status card */
    statusCard: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 11px',
        borderRadius: 10,
        border: '1px solid #CBD5E1',
        background: '#FAFAFA',
    },
    statusLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: '50%',
        flexShrink: 0,
        transition: 'background 0.2s',
    },

    /* Summary */
    summaryWrap: {
        marginTop: 'auto' as const,
        paddingTop: 16,
        borderTop: '1px solid #EBEBEB',
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
    },
    summaryCard: {
        background: '#FFFFFF',
        borderRadius: 10,
        border: '1px solid #EBEBEB',
        padding: '10px 12px',
        textAlign: 'center' as const,
    },
    summaryNum: {
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: '-0.8px',
        lineHeight: 1,
        marginBottom: 3,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#475569',
        fontWeight: 600,
    },

    vDivider: {
        width: 1,
        background: '#EBEBEB',
        flexShrink: 0,
    },

    /* Right panel */
    rightPanel: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#FFFFFF',
    },
    rightHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #F0F0F0',
        background: '#FFFFFF',
        flexShrink: 0,
    },
    rightHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    rightHint: {
        fontSize: 12,
        color: '#475569',
        fontWeight: 500,
    },
    rightHintBold: {
        fontSize: 12,
        color: '#475569',
        fontWeight: 600,
    },
    rightBadge: {
        fontSize: 11,
        fontWeight: 600,
        color: '#1D4ED8',
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        padding: '3px 10px',
        borderRadius: 12,
    },

    permScroll: {
        flex: 1,
        overflowY: 'auto',
        padding: '0 20px 16px 20px', // Top padding moved to ModuleApi sticky header to eliminate hole gap!
    },

    /* Footer */
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderTop: '1px solid #F0F0F0',
        background: '#FFFFFF',
        flexShrink: 0,
    },
    footerInfo: {
        fontSize: 12,
    },
    footerBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: '#e8637a',
        background: '#fff5f7',
        border: '1px solid #f8d7da',
        padding: '4px 12px',
        borderRadius: 20,
    },
    footerDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#e8637a',
    },
    footerEmpty: {
        color: '#64748B',
        fontWeight: 500,
    },
    footerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    cancelBtn: {
        padding: '7px 16px',
        borderRadius: 8,
        border: '1px solid #CBD5E1',
        background: '#FFFFFF',
        color: '#1E293B',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    submitBtn: {
        padding: '7px 18px',
        borderRadius: 8,
        border: 'none',
        background: '#e8637a',
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(232, 99, 122, 0.3)',
        transition: 'all 0.15s',
    },
};

const globalCss = `
.apple-submit-btn:hover {
    background: #d4506a !important;
}
.apple-cancel-btn:hover {
    border-color: #94A3B8 !important;
    background: #F8FAFC !important;
}
`;

export default ModalRole;
