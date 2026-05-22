import { Col, Form, Row } from 'antd';
import { ProFormSwitch } from '@ant-design/pro-components';
import { groupByPermission } from '@/config/utils';
import type { IPermission, IRole } from '@/types/backend';
import type { ProFormInstance } from '@ant-design/pro-components';
import { useEffect, useState } from 'react';
import { MODULE_TRANSLATIONS } from '@/constants/moduleTranslation.constant';

interface IProps {
  onChange?: (data: any[]) => void;
  onReset?: () => void;
  form: ProFormInstance;
  listPermissions: {
    module: string;
    permissions: IPermission[];
  }[] | null;
  singleRole: IRole | null;
  openModal: boolean;
}

/* ── Method badge ── */
const METHOD_META: Record<string, { bg: string; text: string; dot: string }> = {
  GET: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },     // Quiet slate gray (safe read actions)
  POST: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#60A5FA' },    // Soft blue (creation)
  PUT: { bg: '#FEF3C7', text: '#B45309', dot: '#FBBF24' },     // Soft amber (update)
  PATCH: { bg: '#FEF3C7', text: '#B45309', dot: '#FBBF24' },   // Soft amber (update)
  DELETE: { bg: '#FEF2F2', text: '#B91C1C', dot: '#F87171' },  // Soft red (destructive actions)
};

const getMethod = (method: string) =>
  METHOD_META[method?.toUpperCase()] ?? { bg: '#F1F5F9', text: '#64748B', dot: '#CBD5E1' };

/* ── Dynamic Module Theme ── */
const getModuleTheme = (isExpanded: boolean) => {
  if (isExpanded) {
    return {
      icon: '#007AFF',       // Active Brand Blue
      iconBg: '#EFF6FF',     // Light Brand Blue wash
      iconBorder: '#BFDBFE', // Soft border
    };
  }
  return {
    icon: '#64748B',         // Inactive Slate Grey
    iconBg: '#F8FAFC',       // Clean background
    iconBorder: '#E2E8F0',   // Neutral border
  };
};

const ModuleApi = (props: IProps) => {
  const { form, listPermissions, singleRole, openModal } = props;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (listPermissions?.length && singleRole?.id && openModal === true) {
      const userPermissions = groupByPermission(singleRole.permissions);
      const p: any = {};

      listPermissions.forEach((x) => {
        let allCheck = true;
        x.permissions?.forEach((y) => {
          const temp = userPermissions.find((z) => z.module === x.module);
          p[y.id!] = false;
          if (temp) {
            const isExist = temp.permissions.find((k) => k.id === y.id);
            if (isExist) {
              p[y.id!] = true;
            } else allCheck = false;
          } else {
            allCheck = false;
          }
        });
        p[x.module] = allCheck;
      });

      form.setFieldsValue({
        name: singleRole.name,
        active: singleRole.active,
        description: singleRole.description,
        permissions: p,
      });

      if (listPermissions.length > 0) {
        setExpandedModules(new Set(listPermissions.map((i) => i.module)));
      }
    }
  }, [openModal]);

  useEffect(() => {
    if (!openModal) setSearchText('');
  }, [openModal]);

  const handleSwitchAll = (value: boolean, name: string) => {
    const child = listPermissions?.find((item) => item.module === name);
    if (child) {
      child.permissions?.forEach((item) => {
        if (item.id) form.setFieldValue(['permissions', item.id], value);
      });
    }
  };

  const handleSingleCheck = (value: boolean, child: string, parent: string) => {
    form.setFieldValue(['permissions', child], value);
    const temp = listPermissions?.find((item) => item.module === parent);
    if (temp?.module) {
      const rest = temp.permissions?.filter((item) => item.id !== child);
      if (rest?.length) {
        const allTrue = rest.every((item) =>
          form.getFieldValue(['permissions', item.id as string])
        );
        form.setFieldValue(['permissions', parent], allTrue && value);
      }
    }
  };

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  };

  const handleSearch = (val: string) => {
    setSearchText(val);
    if (val.trim()) {
      const q = val.toLowerCase();
      const matched =
        listPermissions
          ?.filter((item) => {
            const mn = (MODULE_TRANSLATIONS[item.module] || item.module || '').toLowerCase();
            return (
              mn.includes(q) ||
              item.module.toLowerCase().includes(q) ||
              item.permissions?.some(
                (p) =>
                  p.name?.toLowerCase().includes(q) ||
                  p.apiPath?.toLowerCase().includes(q) ||
                  p.method?.toLowerCase().includes(q)
              )
            );
          })
          .map((i) => i.module) ?? [];
      setExpandedModules(new Set(matched));
    }
  };

  const q = searchText.trim().toLowerCase();

  const filteredModuleKeys = q
    ? new Set(
      listPermissions
        ?.map((item) => {
          const mn = (MODULE_TRANSLATIONS[item.module] || item.module || '').toLowerCase();
          const moduleMatch = mn.includes(q) || item.module.toLowerCase().includes(q);
          const hasMatchedPerm = item.permissions?.some(
            (p) =>
              p.name?.toLowerCase().includes(q) ||
              p.apiPath?.toLowerCase().includes(q) ||
              p.method?.toLowerCase().includes(q)
          );
          return moduleMatch || hasMatchedPerm ? item.module : null;
        })
        .filter(Boolean) as string[]
    )
    : null;

  const displayCount = filteredModuleKeys
    ? listPermissions
      ?.filter((item) => filteredModuleKeys.has(item.module))
      .reduce((acc, m) => {
        const mn = (MODULE_TRANSLATIONS[m.module] || m.module || '').toLowerCase();
        const moduleMatch = mn.includes(q) || m.module.toLowerCase().includes(q);
        const count = moduleMatch
          ? (m.permissions?.length ?? 0)
          : (m.permissions?.filter(
            (p) =>
              p.name?.toLowerCase().includes(q) ||
              p.apiPath?.toLowerCase().includes(q) ||
              p.method?.toLowerCase().includes(q)
          ).length ?? 0);
        return acc + count;
      }, 0) ?? 0
    : 0;

  const noResult = q && filteredModuleKeys !== null && filteredModuleKeys.size === 0;

  return (
    <div style={s.container}>
      <style>{css}</style>

      {/* ── Search bar ── */}
      <div style={s.searchWrap} className="ma-search-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" stroke="#AEAEB2" strokeWidth="1.8" />
          <path d="M21 21l-4.35-4.35" stroke="#AEAEB2" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          style={s.searchInput}
          placeholder="Tìm module, tên quyền, API path..."
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          className="ma-search-input"
        />
        {searchText && (
          <button
            style={s.searchClear}
            onClick={() => setSearchText('')}
            type="button"
            className="ma-search-clear"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="#AEAEB2" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {q && !noResult && (
        <div style={s.searchResultHint}>
          {`${displayCount} quyền trong ${filteredModuleKeys?.size ?? 0} module`}
        </div>
      )}

      {/* ── Module list — luôn render TẤT CẢ, ẩn bằng display:none ── */}
      {listPermissions?.map((item, index) => {
        const isExpanded = expandedModules.has(item.module);
        const moduleName = MODULE_TRANSLATIONS[item.module] || item.module || 'Chưa dịch';
        const permCount = item.permissions?.length ?? 0;
        const accent = getModuleTheme(isExpanded);
        const isHiddenBySearch = filteredModuleKeys !== null && !filteredModuleKeys.has(item.module);

        const mn = (MODULE_TRANSLATIONS[item.module] || item.module || '').toLowerCase();
        const moduleMatch = mn.includes(q) || item.module.toLowerCase().includes(q);

        return (
          <div
            key={`module-${item.module}`}
            style={{
              ...s.moduleCard,
              display: isHiddenBySearch ? 'none' : 'block',
              // border-left màu accent khi expanded — điểm nhận diện module duy nhất
              borderLeft: isExpanded
                ? `3px solid ${accent.icon}`
                : '3px solid transparent',
            }}
            className="ma-module-card"
          >
            {/* ── Module Header — nền neutral, không phủ màu accent ── */}
            <div
              style={{
                ...s.moduleHeader,
                background: isExpanded ? '#FFFFFF' : '#FAFAFA',
                borderBottom: isExpanded ? '1px solid #F0F0F0' : '1px solid transparent',
              }}
              className="ma-module-header"
              onClick={() => toggleModule(item.module)}
            >
              <div style={s.moduleHeaderLeft}>
                {/* Icon: chỗ DUY NHẤT giữ màu accent của module */}
                <div
                  style={{
                    ...s.moduleIcon,
                    background: accent.iconBg,
                    border: `1px solid ${accent.iconBorder}`,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" rx="1.5" fill={accent.icon} opacity="0.85" />
                    <rect x="9" y="1" width="6" height="6" rx="1.5" fill={accent.icon} opacity="0.5" />
                    <rect x="1" y="9" width="6" height="6" rx="1.5" fill={accent.icon} opacity="0.5" />
                    <rect x="9" y="9" width="6" height="6" rx="1.5" fill={accent.icon} opacity="0.2" />
                  </svg>
                </div>

                <span
                  style={{
                    ...s.chevron,
                    color: isExpanded ? accent.icon : '#C7C7CC',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                >
                  ›
                </span>

                <div>
                  <div style={s.moduleName}>{moduleName}</div>
                  <div style={s.moduleSlug}>
                    {/* Slug tag: bỏ background màu, chỉ giữ border + text accent nhẹ */}
                    <span
                      style={{
                        ...s.slugTag,
                        color: '#475569',
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {item.module}
                    </span>
                    <span style={s.permBadge}>{permCount} quyền</span>
                  </div>
                </div>
              </div>

              <div style={s.masterToggleWrap} onClick={(e) => e.stopPropagation()}>
                <span style={s.toggleLabel}>Tất cả</span>
                <ProFormSwitch
                  name={['permissions', item.module]}
                  noStyle
                  fieldProps={{
                    size: 'small',
                    onChange: (value) => handleSwitchAll(value, item.module),
                  }}
                />
              </div>
            </div>

            {/* ── Permissions Grid — ẨN bằng display:none, KHÔNG unmount ── */}
            <div
              style={{
                ...s.permissionsGrid,
                display: isExpanded ? 'block' : 'none',
              }}
            >
              <Row gutter={[10, 10]}>
                {item.permissions?.map((value, i) => {
                  const isMatchedPerm =
                    !q ||
                    moduleMatch ||
                    value.name?.toLowerCase().includes(q) ||
                    value.apiPath?.toLowerCase().includes(q) ||
                    value.method?.toLowerCase().includes(q);

                  const m = getMethod(value?.method as string);
                  return (
                    <Col xs={24} sm={24} md={12} lg={12} style={{ display: 'flex' }} key={`${i}-child-${item.module}`}>
                      <Form.Item noStyle shouldUpdate={(prev, curr) => prev.permissions?.[value.id as string] !== curr.permissions?.[value.id as string]}>
                        {({ getFieldValue }) => {
                          const isChecked = !!getFieldValue(['permissions', value.id as string]);
                          return (
                            <div
                              style={{
                                ...s.permCard,
                                opacity: isMatchedPerm ? 1 : 0.35,
                                borderColor: isChecked ? '#BFDBFE' : '#EBEBEB',
                                background: isChecked ? '#F8FAFC' : '#FFFFFF',
                                boxShadow: isChecked ? '0 2px 8px rgba(0, 122, 255, 0.04)' : 'none',
                              }}
                              className={`ma-perm-card ${isChecked ? 'active' : ''}`}
                            >
                              <div style={s.permToggle}>
                                <ProFormSwitch
                                  name={['permissions', value.id as string]}
                                  noStyle
                                  fieldProps={{
                                    size: 'small',
                                    onChange: (v) =>
                                      handleSingleCheck(v, value.id as string, item.module),
                                  }}
                                />
                              </div>

                              <div style={s.permInfo}>
                                <div style={s.permName}>{value?.name || '—'}</div>
                                <div style={s.permMeta}>
                                  {value?.method && (
                                    <span
                                      style={{
                                        ...s.methodBadge,
                                        background: m.bg,
                                        color: m.text,
                                      }}
                                    >
                                      <span
                                        style={{
                                          display: 'inline-block',
                                          width: 5,
                                          height: 5,
                                          borderRadius: '50%',
                                          background: m.dot,
                                          marginRight: 4,
                                          verticalAlign: 'middle',
                                          flexShrink: 0,
                                        }}
                                      />
                                      {value.method}
                                    </span>
                                  )}
                                  <span style={s.apiPath}>{value?.apiPath || ''}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      </Form.Item>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {noResult && (
        <div style={s.emptyState}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            style={{ marginBottom: 8, opacity: 0.25 }}
          >
            <circle cx="11" cy="11" r="8" stroke="#8E8E93" strokeWidth="1.5" />
            <path d="M21 21l-4.35-4.35" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 13, color: '#8E8E93' }}>Không tìm thấy kết quả</div>
          <div style={{ fontSize: 12, color: '#C7C7CC', marginTop: 3 }}>Thử từ khóa khác</div>
        </div>
      )}
    </div>
  );
};

/* ── Styles ── */
const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '2px 0',
  },

  /* Search */
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 12px',
    borderRadius: 10,
    border: '1px solid #E5E5EA',
    background: '#FAFAFA',
    marginBottom: 4,
    transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 13,
    color: '#1C1C1E',
    lineHeight: '20px',
  },
  searchClear: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '1px solid #E5E5EA',
    background: '#F2F2F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  },
  searchResultHint: {
    fontSize: 11,
    color: '#AEAEB2',
    paddingLeft: 2,
    marginBottom: 2,
  },

  /* Module card */
  moduleCard: {
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #EBEBEB',
    overflow: 'hidden',
    transition: 'border-color 0.15s, border-left-color 0.2s',
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: 'background 0.15s',
  },
  moduleHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
  },
  moduleIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chevron: {
    fontSize: 18,
    fontWeight: 300,
    lineHeight: 1,
    transition: 'transform 0.22s cubic-bezier(.4,0,.2,1), color 0.15s',
    display: 'inline-block',
    width: 14,
    textAlign: 'center' as const,
  },
  moduleName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1C1C1E',
    letterSpacing: '-0.2px',
    lineHeight: 1.3,
  },
  moduleSlug: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  slugTag: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.3px',
    padding: '1px 6px',
    borderRadius: 4,
    textTransform: 'uppercase' as const,
  },
  permBadge: {
    background: '#F2F2F7',
    color: '#AEAEB2',
    borderRadius: 20,
    padding: '1px 7px',
    fontSize: 11,
    fontWeight: 400,
  },
  masterToggleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#AEAEB2',
    fontWeight: 400,
  },

  /* Permissions grid */
  permissionsGrid: {
    padding: '10px 12px 12px',
    background: '#FDFDFD',
  },
  permCard: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 9,
    border: '1px solid #EBEBEB',
    background: '#FFFFFF',
    transition: 'border-color 0.15s, opacity 0.15s',
    overflow: 'hidden',
    minHeight: 54,
    width: '100%',
  },
  permToggle: {
    flexShrink: 0,
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch' as const,
    background: '#FAFAFA',
    borderRight: '1px solid #F0F0F0',
  },
  permInfo: {
    flex: 1,
    minWidth: 0,
    padding: '7px 11px',
  },
  permName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#1C1C1E',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: 3,
  },
  permMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  methodBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 7px 2px 5px',
    borderRadius: 5,
    letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  apiPath: {
    fontSize: 11,
    color: '#C7C7CC',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: '"SF Mono", "Menlo", "Monaco", monospace',
  },

  /* Empty state */
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center' as const,
  },
};

/* ── Global CSS ── */
const css = `
  .ma-search-wrap:focus-within {
    border-color: #007AFF !important;
    background: #FFFFFF !important;
    box-shadow: 0 0 0 3px rgba(0,122,255,0.08);
  }
  .ma-search-input::placeholder {
    color: #C7C7CC;
  }
  .ma-search-clear:hover {
    background: #E5E5EA !important;
  }
  .ma-module-card {
    transition: all 0.2s ease-in-out !important;
  }
  .ma-module-card:hover {
    border-color: #CBD5E1 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02) !important;
  }
  .ma-module-header {
    transition: background 0.2s !important;
  }
  .ma-module-header:hover {
    background: #F1F5F9 !important;
  }
  .ma-perm-card {
    width: 100% !important;
    transition: all 0.2s ease-in-out !important;
  }
  .ma-perm-card:hover {
    border-color: #94A3B8 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
    transform: translateY(-1px);
  }
  .ma-perm-card.active:hover {
    border-color: #3B82F6 !important;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.08) !important;
  }
  .ant-switch-checked {
    background: #007AFF !important;
  }
`;

export default ModuleApi;