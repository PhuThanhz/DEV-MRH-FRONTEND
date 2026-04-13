import {
    ModalForm,
    ProFormSwitch,
    ProFormText,
    ProFormTextArea,
} from '@ant-design/pro-components';
import { Form, message, notification } from 'antd';
import { isMobile } from 'react-device-detect';
import { callCreateRole, callUpdateRole } from '@/config/api';
import type { IPermission, IRole } from '@/types/backend';
import ModuleApi from './module.api';
import { useAppDispatch } from '@/redux/hooks';
import { useState } from 'react';

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

const ModalRole = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, listPermissions, singleRole, setSingleRole } = props;
    const dispatch = useAppDispatch();
    const [form] = Form.useForm();
    const isEdit = !!singleRole?.id;
    const [showLeft, setShowLeft] = useState(true);

    const submitRole = async (valuesForm: any) => {
        const { description, active, name, permissions } = valuesForm;
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
                message.success('Cập nhật role thành công');
                handleReset();
                reloadTable();
            } else {
                notification.error({ message: 'Có lỗi xảy ra', description: res.message });
            }
        } else {
            const res = await callCreateRole(role);
            if (res.data) {
                message.success('Thêm mới role thành công');
                handleReset();
                reloadTable();
            } else {
                notification.error({ message: 'Có lỗi xảy ra', description: res.message });
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
            <ModalForm
                title={null}
                open={openModal}
                modalProps={{
                    onCancel: handleReset,
                    afterClose: handleReset,
                    destroyOnClose: true,
                    width: isMobile ? '100%' : 1200,
                    keyboard: false,
                    maskClosable: false,
                    className: 'apple-modal',
                    footer: null,
                    closable: false,
                    style: { top: 24 },
                }}
                scrollToFirstError
                preserve={false}
                form={form}
                onFinish={submitRole}
                submitter={false}
            >
                {/* ── HEADER ── */}
                <div style={s.header}>
                    <div style={s.headerIcon}>
                        {isEdit ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#007AFF" strokeWidth="2" />
                                <path d="M12 8v8M8 12h8" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" />
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
                            <rect x="3" y="3" width="7" height="18" rx="2" stroke="#636366" strokeWidth="1.8" />
                            <path d="M14 7h5M14 12h5M14 17h5" stroke="#636366" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <span style={s.toggleBtnLabel}>{showLeft ? 'Ẩn thông tin' : 'Hiện thông tin'}</span>
                    </button>

                    <button style={s.closeBtn} onClick={handleReset} type="button" className="apple-close-btn">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M1 1l10 10M11 1L1 11" stroke="#636366" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* ── BODY ── */}
                <div style={s.body}>

                    {/* ── LEFT PANEL ── */}
                    <div style={{
                        ...s.leftPanel,
                        width: showLeft ? 280 : 0,
                        opacity: showLeft ? 1 : 0,
                        paddingLeft: showLeft ? 18 : 0,
                        paddingRight: showLeft ? 18 : 0,
                        pointerEvents: showLeft ? 'auto' : 'none',
                    }}>
                        <div style={{ width: 244, minWidth: 244 }}>
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
                                                            fontWeight: 500,
                                                            color: active ? '#1C1C1E' : '#8E8E93',
                                                        }}>
                                                            {active ? 'Đang hoạt động' : 'Không hoạt động'}
                                                        </div>
                                                        <div style={{
                                                            fontSize: 11,
                                                            color: '#AEAEB2',
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
                                    <span style={{ ...s.sectionDot, background: '#007AFF' }} />
                                    Tổng quan
                                </div>
                                <div style={s.summaryGrid}>
                                    <Form.Item noStyle shouldUpdate>
                                        {({ getFieldValue }) => {
                                            const perms = getFieldValue('permissions') || {};
                                            const count = Object.entries(perms).filter(
                                                ([k, v]) => k.match(/^[1-9][0-9]*$/) && v === true
                                            ).length;
                                            return (
                                                <div style={s.summaryCard}>
                                                    <div style={{ ...s.summaryNum, color: '#007AFF' }}>{count}</div>
                                                    <div style={s.summaryLabel}>Quyền đã chọn</div>
                                                </div>
                                            );
                                        }}
                                    </Form.Item>
                                    <div style={s.summaryCard}>
                                        <div style={{ ...s.summaryNum, color: '#5856D6' }}>
                                            {listPermissions?.length ?? 0}
                                        </div>
                                        <div style={s.summaryLabel}>Module hệ thống</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── DIVIDER ── */}
                    {showLeft && <div style={s.vDivider} />}

                    {/* ── RIGHT PANEL ── */}
                    <div style={s.rightPanel}>
                        <div style={s.rightHeader}>
                            <div style={s.rightHeaderLeft}>
                                <div style={s.sectionLabel}>
                                    <span style={{ ...s.sectionDot, background: '#5856D6' }} />
                                    Phân quyền
                                </div>
                                <span style={s.rightHint}>Bật / tắt từng quyền hoặc toàn bộ module</span>
                            </div>
                            <Form.Item noStyle shouldUpdate>
                                {({ getFieldValue }) => {
                                    const perms = getFieldValue('permissions') || {};
                                    const count = Object.entries(perms).filter(
                                        ([k, v]) => k.match(/^[1-9][0-9]*$/) && v === true
                                    ).length;
                                    return count > 0 ? (
                                        <div style={s.rightBadge}>{count} quyền</div>
                                    ) : null;
                                }}
                            </Form.Item>
                        </div>
                        <div style={s.permScroll}>
                            <ModuleApi
                                form={form}
                                listPermissions={listPermissions}
                                singleRole={singleRole}
                                openModal={openModal}
                            />
                        </div>
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <div style={s.footer}>
                    <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => {
                            const perms = getFieldValue('permissions') || {};
                            const count = Object.entries(perms).filter(
                                ([k, v]) => k.match(/^[1-9][0-9]*$/) && v === true
                            ).length;
                            return (
                                <div style={s.footerInfo}>
                                    {count > 0 ? (
                                        <div style={s.footerBadge}>
                                            <div style={s.footerDot} />
                                            {count} quyền đã chọn
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

            </ModalForm>
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
        fontSize: 15,
        fontWeight: 600,
        color: '#1C1C1E',
        letterSpacing: '-0.3px',
        lineHeight: 1.3,
    },
    subtitle: {
        fontSize: 11,
        color: '#AEAEB2',
        marginTop: 1,
    },

    /* Toggle btn */
    toggleBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 11px',
        borderRadius: 8,
        border: '1px solid #E5E5EA',
        background: '#FAFAFA',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.15s',
    },
    toggleBtnLabel: {
        fontSize: 12,
        color: '#636366',
        fontWeight: 400,
        whiteSpace: 'nowrap' as const,
    },

    closeBtn: {
        width: 26,
        height: 26,
        borderRadius: '50%',
        border: '1px solid #E5E5EA',
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
        height: 'calc(88vh - 140px)',
        minHeight: 520,
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
        fontSize: 11,
        fontWeight: 600,
        color: '#AEAEB2',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.6px',
        marginBottom: 12,
    },
    sectionDot: {
        width: 5,
        height: 5,
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
        fontWeight: 500,
        color: '#48484A',
        marginBottom: 5,
    },
    required: {
        color: '#FF3B30',
        marginLeft: 2,
    },

    /* Status card — neutral, không nổi bật */
    statusCard: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 11px',
        borderRadius: 10,
        border: '1px solid #E5E5EA',
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
        fontWeight: 600,
        letterSpacing: '-0.8px',
        lineHeight: 1,
        marginBottom: 3,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#AEAEB2',
        fontWeight: 400,
    },

    /* Divider */
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
        padding: '14px 20px 12px',
        borderBottom: '1px solid #F0F0F0',
        flexShrink: 0,
    },
    rightHeaderLeft: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 2,
    },
    rightHint: {
        fontSize: 11,
        color: '#C7C7CC',
        marginLeft: 11,
    },
    rightBadge: {
        background: '#F2F2F7',
        color: '#636366',
        fontSize: 12,
        fontWeight: 500,
        padding: '3px 11px',
        borderRadius: 20,
        border: '1px solid #E5E5EA',
    },
    permScroll: {
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px 18px',
    },

    /* Footer */
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px 14px',
        borderTop: '1px solid #F0F0F0',
        background: '#FFFFFF',
        borderRadius: '0 0 18px 18px',
        flexShrink: 0,
    },
    footerInfo: {
        display: 'flex',
        alignItems: 'center',
    },
    footerBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 500,
        color: '#1D4ED8',
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: 20,
        padding: '3px 11px',
    },
    footerDot: {
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: '#007AFF',
        flexShrink: 0,
    },
    footerEmpty: {
        fontSize: 12,
        color: '#C7C7CC',
        fontStyle: 'italic' as const,
    },
    footerRight: {
        display: 'flex',
        gap: 7,
    },
    cancelBtn: {
        padding: '8px 20px',
        borderRadius: 9,
        border: '1px solid #E5E5EA',
        background: '#FFFFFF',
        color: '#3A3A3C',
        fontSize: 13,
        fontWeight: 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    submitBtn: {
        padding: '8px 24px',
        borderRadius: 9,
        border: 'none',
        background: '#007AFF',
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
};

/* ─── Global CSS ─── */
const globalCss = `
  .apple-modal .ant-modal-content {
    border-radius: 20px !important;
    padding: 0 !important;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04) !important;
  }
  .apple-modal .ant-modal-header,
  .apple-modal .ant-modal-footer {
    display: none !important;
  }
  .apple-modal .ant-modal-body {
    padding: 0 !important;
  }

  /* Inputs */
  .apple-modal .ant-input,
  .apple-modal .ant-input-affix-wrapper,
  .apple-modal textarea.ant-input {
    border-radius: 9px !important;
    border: 1px solid #E5E5EA !important;
    background: #FFFFFF !important;
    font-size: 13px !important;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-shadow: none !important;
  }
  .apple-modal .ant-input:hover,
  .apple-modal .ant-input-affix-wrapper:hover {
    border-color: #C7C7CC !important;
  }
  .apple-modal .ant-input:focus,
  .apple-modal .ant-input-affix-wrapper:focus-within,
  .apple-modal textarea.ant-input:focus {
    border-color: #007AFF !important;
    box-shadow: 0 0 0 3px rgba(0,122,255,0.1) !important;
    background: #FFFFFF !important;
  }
  .apple-modal .ant-input-lg {
    font-size: 13px !important;
    padding: 9px 12px !important;
    border-radius: 9px !important;
  }

  /* Switch */
  .apple-modal .ant-switch {
    background: #D1D1D6 !important;
  }
  .apple-modal .ant-switch-checked {
    background: #007AFF !important;
  }

  /* Form item */
  .apple-modal .ant-form-item {
    margin-bottom: 0 !important;
  }
  .apple-modal .ant-form-item-explain-error {
    font-size: 11px;
    margin-top: 3px;
    color: #FF3B30;
  }

  /* Buttons */
  .apple-close-btn:hover {
    background: #EFEFF4 !important;
    border-color: #D1D1D6 !important;
  }
  .apple-toggle-btn:hover {
    background: #EFEFF4 !important;
    border-color: #D1D1D6 !important;
  }
  .apple-cancel-btn:hover {
    background: #F2F2F7 !important;
    border-color: #C7C7CC !important;
  }
  .apple-submit-btn:hover {
    opacity: 0.86;
  }
  .apple-submit-btn:active {
    opacity: 1;
  }

  /* Scrollbar */
  .apple-modal ::-webkit-scrollbar { width: 4px; }
  .apple-modal ::-webkit-scrollbar-track { background: transparent; }
  .apple-modal ::-webkit-scrollbar-thumb {
    background: #D1D1D6;
    border-radius: 4px;
  }
  .apple-modal ::-webkit-scrollbar-thumb:hover {
    background: #AEAEB2;
  }
`;

export default ModalRole;