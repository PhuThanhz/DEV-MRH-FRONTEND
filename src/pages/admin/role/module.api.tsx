import { Col, Dropdown, Form, Row, Select, Switch } from 'antd';
import type { MenuProps } from 'antd';
import { ProFormSwitch } from '@ant-design/pro-components';
import type { IPermission, IRole } from '@/types/backend';
import type { ProFormInstance } from '@ant-design/pro-components';
import { useEffect, useState, useMemo, useDeferredValue, memo } from 'react';
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

/* ── Refined Neutral & Subtle Accent Colors ── */
const ACCENT_PRIMARY = '#2563EB';

/* ── Clean & Refined Pastel CRUD Method Badges ── */
const METHOD_META: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  GET: { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E', label: 'GET' },
  POST: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', label: 'POST' },
  PUT: { bg: '#FEFCE8', text: '#854D0E', dot: '#EAB308', label: 'PUT' },
  PATCH: { bg: '#FEFCE8', text: '#854D0E', dot: '#EAB308', label: 'PATCH' },
  DELETE: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'DELETE' },
};

const getMethod = (method: string) =>
  METHOD_META[method?.toUpperCase()] ?? { bg: '#F1F5F9', text: '#475569', dot: '#CBD5E1', label: method || 'Khác' };

export const MODULE_MERGE_MAP: Record<string, string[]> = {
  ACCOUNTING_DOSSIERS: ['ACCOUNTING_WORKFLOWS', 'ACCOUNTING_DELEGATIONS'],
  SALARY_GRADES: ['COMPANY_SALARY_GRADES', 'DEPARTMENT_SALARY_GRADES', 'SECTION_SALARY_GRADES'],
  JOB_TITLES: ['COMPANY_JOB_TITLES', 'DEPARTMENT_JOB_TITLES', 'SECTION_JOB_TITLES'],
  COMPANIES: ['DEPARTMENTS', 'SECTIONS', 'COMPANY', 'DEPARTMENT'],
  DOCUMENTS: ['FILES', 'DOCUMENT_CATEGORIES', 'DOCUMENT_FOLDERS'],
  CAREER_PATHS: ['CAREER_PATH_TEMPLATES', 'EMPLOYEE_CAREER_PATHS'],
};

export const CHILD_TO_PARENT: Record<string, string> = Object.entries(MODULE_MERGE_MAP)
  .reduce((acc, [parent, children]) => {
    children.forEach(c => { acc[c] = parent; });
    return acc;
  }, {} as Record<string, string>);

const GROUPED_MODULES = [
  'ACCOUNTING_DOSSIERS',
  'SALARY_GRADES',
  'JOB_TITLES',
  'COMPANIES',
  'DOCUMENTS',
  'CAREER_PATHS',
  'PROCEDURES',
  'EVALUATION_MANAGER',
  'EVALUATION_PERIOD',
  'EVALUATION_TEMPLATE',
  'PROCEDURE_CONFIDENTIAL'
];

/* ── DOMAIN CATEGORIES FOR FILTERING ── */
export interface IDomainCategory {
  id: string;
  name: string;
  desc: string;
  modules: string[];
}

export const DOMAIN_CATEGORIES: IDomainCategory[] = [
  {
    id: 'ALL',
    name: 'Tất cả lĩnh vực',
    desc: 'Hiển thị toàn bộ module hệ thống',
    modules: [],
  },
  {
    id: 'ORG',
    name: 'Tổ chức & Nhân sự',
    desc: 'Cơ cấu công ty, Phòng ban, Bộ phận, Sơ đồ tổ chức & Nhân viên',
    modules: ['COMPANIES', 'USERS', 'EMPLOYEES', 'USER_POSITION', 'ORG_CHARTS', 'POSITION_LEVELS'],
  },
  {
    id: 'SALARY',
    name: 'Lương & Chức danh',
    desc: 'Khung lương, Bậc lương, Chức danh & Lộ trình phát triển',
    modules: ['JOB_TITLES', 'SALARY_GRADES', 'SALARY_RANGE', 'JOB_TITLE_PERFORMANCE_CONTENT', 'CAREER_PATHS', 'POSITION_CHART'],
  },
  {
    id: 'ACCOUNTING',
    name: 'Kế toán & Chứng từ',
    desc: 'Bộ chứng từ kế toán, Chứng từ con & Luồng phê duyệt',
    modules: ['ACCOUNTING_DOSSIERS', 'ACCOUNTING_DOCUMENTS', 'ACCOUNTING_DOCUMENT_CATEGORIES'],
  },
  {
    id: 'PROCEDURES_DOCS',
    name: 'Quy trình & Tài liệu',
    desc: 'Quy trình công ty, Quy trình bảo mật, Thư mục & Danh mục tài liệu',
    modules: ['PROCEDURES', 'PROCEDURE_CONFIDENTIAL', 'DOCUMENTS'],
  },
  {
    id: 'EVALUATION',
    name: 'Đánh giá & KPI',
    desc: 'Mẫu đánh giá, Kỳ đánh giá, Quản lý chấm điểm & Mục tiêu',
    modules: ['EVALUATION_TEMPLATE', 'EVALUATION_PERIOD', 'EVALUATION_MANAGER', 'EVALUATION_EMPLOYEE', 'DEPARTMENT_OBJECTIVES', 'JOB_DESCRIPTIONS', 'JD_FLOW'],
  },
  {
    id: 'SYSTEM',
    name: 'Hệ thống & Cấu hình',
    desc: 'Vai trò, Phân quyền, Bảng điều khiển & Nhật ký',
    modules: ['ROLES', 'PERMISSIONS', 'PERMISSION_CATEGORY', 'PERMISSION_CONTENT', 'PERMISSION_ASSIGNMENT', 'DASHBOARD', 'PROCESS_ACTIONS'],
  },
];

/* ── DOMAIN SPECIFIC SVG ICONS ── */
const renderModuleIcon = (moduleKey: string) => {
  const k = moduleKey.toUpperCase();

  if (['COMPANIES', 'USERS', 'EMPLOYEES', 'USER_POSITION', 'ORG_CHARTS', 'POSITION_LEVELS'].includes(k)) {
    return (
      <div style={s.iconBoxBlue}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" stroke="#2563EB" strokeWidth="2" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (['JOB_TITLES', 'SALARY_GRADES', 'SALARY_RANGE', 'JOB_TITLE_PERFORMANCE_CONTENT', 'CAREER_PATHS', 'POSITION_CHART'].includes(k)) {
    return (
      <div style={s.iconBoxGreen}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="7" width="20" height="14" rx="2" stroke="#16A34A" strokeWidth="2" />
          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke="#16A34A" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (['ACCOUNTING_DOSSIERS', 'ACCOUNTING_DOCUMENTS', 'ACCOUNTING_DOCUMENT_CATEGORIES'].includes(k)) {
    return (
      <div style={s.iconBoxIndigo}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (['DOCUMENTS', 'FILES'].includes(k)) {
    return (
      <div style={s.iconBoxSky}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (['PROCEDURES', 'PROCEDURE_CONFIDENTIAL'].includes(k)) {
    return (
      <div style={s.iconBoxPurple}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (['EVALUATION_TEMPLATE', 'EVALUATION_PERIOD', 'EVALUATION_MANAGER', 'EVALUATION_EMPLOYEE', 'DEPARTMENT_OBJECTIVES', 'JOB_DESCRIPTIONS', 'JD_FLOW'].includes(k)) {
    return (
      <div style={s.iconBoxOrange}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#EA580C" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div style={s.iconBoxSlate}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#334155" strokeWidth="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};

/* ── Subgroup Classifier for Child Sections ── */
const classifyPermission = (moduleName: string, name: string, apiPath: string, origModule?: string): string => {
  const path = apiPath.toLowerCase();
  const n = name.toLowerCase();
  const orig = origModule || '';

  if (moduleName === 'COMPANIES') {
    if (orig === 'COMPANIES' || orig === 'COMPANY' || path.includes('/companies')) {
      return 'Quản lý Công ty';
    }
    if (orig === 'DEPARTMENTS' || orig === 'DEPARTMENT' || path.includes('/departments')) {
      return 'Quản lý Phòng ban';
    }
    if (orig === 'SECTIONS' || path.includes('/sections')) {
      return 'Quản lý Bộ phận';
    }
    return 'Quản lý Đơn vị';
  }

  if (moduleName === 'SALARY_GRADES') {
    if (orig === 'SALARY_GRADES' || path.includes('/salary-grades')) {
      return 'Bậc lương Hệ thống';
    }
    if (orig === 'COMPANY_SALARY_GRADES' || path.includes('/company-salary-grades')) {
      return 'Khung lương Công ty';
    }
    if (orig === 'DEPARTMENT_SALARY_GRADES' || path.includes('/department-salary-grades')) {
      return 'Khung lương Phòng ban';
    }
    if (orig === 'SECTION_SALARY_GRADES' || path.includes('/section-salary-grades')) {
      return 'Khung lương Bộ phận';
    }
    return 'Khác';
  }

  if (moduleName === 'JOB_TITLES') {
    if (orig === 'JOB_TITLES' || path.includes('/job-titles')) {
      return 'Chức danh Hệ thống';
    }
    if (orig === 'COMPANY_JOB_TITLES' || path.includes('/company-job-titles')) {
      return 'Chức danh Công ty';
    }
    if (orig === 'DEPARTMENT_JOB_TITLES' || path.includes('/department-job-titles')) {
      return 'Chức danh Phòng ban';
    }
    if (orig === 'SECTION_JOB_TITLES' || path.includes('/section-job-titles')) {
      return 'Chức danh Bộ phận';
    }
    return 'Khác';
  }

  if (moduleName === 'DOCUMENTS') {
    if (orig === 'DOCUMENT_CATEGORIES' || path.includes('document-categories')) {
      return 'Danh mục Tài liệu';
    }
    if (orig === 'DOCUMENT_FOLDERS' || path.includes('folders')) {
      return 'Thư mục Tài liệu';
    }
    if (orig === 'FILES' || path.includes('/files')) {
      return 'Quản lý File & Upload';
    }
    if (orig === 'DOCUMENTS' || path.includes('/documents')) {
      return 'Tài liệu Công ty';
    }
    return 'Tài liệu chung';
  }

  if (moduleName === 'ACCOUNTING_DOSSIERS') {
    if (orig === 'ACCOUNTING_WORKFLOWS' || path.includes('accounting-approval-workflows')) {
      return 'Luồng phê duyệt';
    }
    if (orig === 'ACCOUNTING_DELEGATIONS' || path.includes('accounting-approval-delegations')) {
      return 'Ủy quyền phê duyệt';
    }
    if (path.includes('/categories') || path.includes('/sync-template')) {
      return 'Mẫu bộ chứng từ';
    }
    if (path.includes('/documents') || path.includes('/document')) {
      return 'Chứng từ con trong bộ';
    }
    return 'Quản lý & Thao tác';
  }

  if (moduleName === 'CAREER_PATHS') {
    if (orig === 'CAREER_PATHS') {
      return 'Định nghĩa Lộ trình';
    }
    if (orig === 'CAREER_PATH_TEMPLATES') {
      return 'Mẫu Lộ trình';
    }
    if (orig === 'EMPLOYEE_CAREER_PATHS') {
      return 'Lộ trình Cá nhân';
    }
    return 'Khác';
  }

  if (moduleName === 'PROCEDURES') {
    if (path.includes('/company') || path.includes('/department') || path.includes('/confidential')) {
      return 'Lọc theo Đơn vị & Phòng ban';
    }
    if (path.includes('share')) {
      return 'Chia sẻ Quy trình';
    }
    return 'Quản lý Quy trình';
  }

  if (moduleName === 'EVALUATION_MANAGER') {
    if (n.includes('quản lý trực tiếp') || path.includes('manager')) {
      return 'Quản lý Trực tiếp';
    }
    if (n.includes('phê duyệt') || path.includes('approve') || path.includes('approval')) {
      return 'Quản lý Gián tiếp & Phê duyệt';
    }
    return 'Thao tác chung';
  }

  if (moduleName === 'EVALUATION_PERIOD') {
    if (path.includes('templates') || path.includes('employees')) {
      return 'Cấu hình & Thành viên';
    }
    if (path.includes('progress') || path.includes('records')) {
      return 'Thống kê & Tiến độ';
    }
    return 'Quản lý Kỳ đánh giá';
  }

  if (moduleName === 'EVALUATION_TEMPLATE') {
    if (path.includes('sections') || path.includes('criteria')) {
      return 'Phần đánh giá & Tiêu chí';
    }
    if (path.includes('levels')) {
      return 'Thang điểm đánh giá';
    }
    return 'Quản lý Mẫu';
  }

  return 'Khác';
};

interface PermCardProps {
  value: IPermission;
  parentModule: string;
  isChecked: boolean;
  onToggle: (checked: boolean, childId: string, parentModuleName: string) => void;
}

const PermCard = memo(({ value, parentModule, isChecked, onToggle }: PermCardProps) => {
  const m = getMethod(value?.method as string);
  return (
    <div
      style={{
        ...s.permCard,
        borderColor: isChecked ? '#BFDBFE' : '#E2E8F0',
        background: isChecked ? '#FAFAFA' : '#FFFFFF',
        boxShadow: isChecked ? '0 1px 3px rgba(0, 0, 0, 0.04)' : '0 1px 2px rgba(0,0,0,0.02)',
      }}
      className={`ma-perm-card ${isChecked ? 'active' : ''}`}
      onClick={() => onToggle(!isChecked, value.id as string, parentModule)}
    >
      <div style={s.permToggle} onClick={(e) => e.stopPropagation()}>
        <Switch
          size="small"
          checked={isChecked}
          onChange={(v) => onToggle(v, value.id as string, parentModule)}
        />
      </div>

      <div style={s.permInfo}>
        <div style={{ ...s.permName, color: '#0F172A' }}>
          {value?.name || '—'}
        </div>
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
              {m.label}
            </span>
          )}
          <span style={s.apiPath}>{value?.apiPath || ''}</span>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.isChecked === next.isChecked &&
    prev.parentModule === next.parentModule &&
    prev.value.id === next.value.id &&
    prev.value.name === next.value.name &&
    prev.value.apiPath === next.value.apiPath &&
    prev.value.method === next.value.method
  );
});

const ModuleApi = (props: IProps) => {
  const { form, listPermissions, singleRole, openModal } = props;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState('');
  const deferredSearchText = useDeferredValue(searchText);
  const [activeDomain, setActiveDomain] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [grantedFilter, setGrantedFilter] = useState<'ALL' | 'GRANTED' | 'UNGRANTED'>('ALL');

  // Merge child modules into parent modules
  const mergedPermissions = useMemo(() => {
    if (!listPermissions) return [];
    const mergedMap = new Map<string, IPermission[]>();
    const parentMap = new Map<string, { module: string; permissions: IPermission[] }>();

    listPermissions.forEach((item) => {
      const parentModule = CHILD_TO_PARENT[item.module] || item.module;
      if (!mergedMap.has(parentModule)) {
        mergedMap.set(parentModule, []);
        parentMap.set(parentModule, { module: parentModule, permissions: [] });
      }
      const existing = mergedMap.get(parentModule)!;
      (item.permissions || []).forEach((p) => {
        existing.push({ ...p, module: p.module || item.module });
      });
    });

    const result: { module: string; permissions: IPermission[] }[] = [];
    mergedMap.forEach((perms, moduleKey) => {
      result.push({ module: moduleKey, permissions: perms });
    });

    return result;
  }, [listPermissions]);

  // Parse subgroups per parent module
  const parsedSubgroups = useMemo(() => {
    if (!mergedPermissions) return new Map<string, Record<string, IPermission[]>>();
    const map = new Map<string, Record<string, IPermission[]>>();
    mergedPermissions.forEach((item) => {
      if (GROUPED_MODULES.includes(item.module) && (item.permissions?.length ?? 0) >= 6) {
        const subgroups: Record<string, IPermission[]> = {};
        item.permissions?.forEach((value: IPermission) => {
          const groupName = classifyPermission(item.module, value.name || '', value.apiPath || '', value.module);
          if (!subgroups[groupName]) {
            subgroups[groupName] = [];
          }
          subgroups[groupName].push(value);
        });
        map.set(item.module, subgroups);
      }
    });
    return map;
  }, [mergedPermissions]);

  useEffect(() => {
    if (listPermissions?.length && singleRole?.id && openModal === true) {
      const p: any = {};
      const grantedIds = new Set(
        (singleRole.permissions ?? [])
          .map((x) => (typeof x === 'string' ? x : x?.id))
          .filter(Boolean)
      );

      listPermissions.forEach((x) => {
        let allCheck = (x.permissions?.length ?? 0) > 0;
        x.permissions?.forEach((y) => {
          const isExist = grantedIds.has(y.id);
          p[y.id!] = isExist;
          if (!isExist) {
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

      setExpandedModules(new Set());
    }
  }, [openModal]);

  useEffect(() => {
    if (!openModal) {
      setSearchText('');
      setActiveDomain('ALL');
      setMethodFilter('ALL');
      setGrantedFilter('ALL');
    }
  }, [openModal]);

  const handleSwitchAll = (value: boolean, parentModuleName: string) => {
    const parent = mergedPermissions?.find((item) => item.module === parentModuleName);
    if (parent) {
      const currentVals = form.getFieldValue('permissions') || {};
      const updates = { ...currentVals, [parentModuleName]: value };

      const childModules = MODULE_MERGE_MAP[parentModuleName] || [];
      childModules.forEach(c => { updates[c] = value; });

      parent.permissions?.forEach((item) => {
        if (item.id) updates[item.id] = value;
      });
      form.setFieldsValue({ permissions: updates });
    }
  };

  const handleSingleCheck = (value: boolean, childId: string, parentModuleName: string) => {
    const currentVals = form.getFieldValue('permissions') || {};
    const updates = { ...currentVals, [childId]: value };

    const parent = mergedPermissions?.find((item) => item.module === parentModuleName);
    if (parent) {
      const rest = parent.permissions?.filter((item) => item.id !== childId);
      if (rest?.length) {
        const allTrue = rest.every((item) => !!updates[item.id as string]);
        updates[parentModuleName] = allTrue && value;
      }
    }
    form.setFieldsValue({ permissions: updates });
  };

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  };

  // Filter visible parent modules based on Domain, Search Query, Method Filter & Granted Status Filter
  const visibleModules = useMemo(() => {
    if (!mergedPermissions) return [];
    let result = mergedPermissions;

    // 1. Filter by Domain Category
    if (activeDomain !== 'ALL') {
      const cat = DOMAIN_CATEGORIES.find(c => c.id === activeDomain);
      if (cat) {
        result = result.filter(item => cat.modules.includes(item.module));
      }
    }

    const q = deferredSearchText.trim().toLowerCase();
    const permsState = form.getFieldValue('permissions') || {};

    // 2. Filter modules by Search Query, Method Filter & Granted Status
    result = result.filter((item) => {
      let perms = item.permissions || [];

      // Granted Status Filter
      if (grantedFilter !== 'ALL') {
        perms = perms.filter(p => {
          const isChecked = !!permsState[p.id as string];
          return grantedFilter === 'GRANTED' ? isChecked : !isChecked;
        });
        if (perms.length === 0) return false;
      }

      // Method Filter
      if (methodFilter !== 'ALL') {
        perms = perms.filter(p => {
          if (methodFilter === 'PUT') return p.method?.toUpperCase() === 'PUT' || p.method?.toUpperCase() === 'PATCH';
          return p.method?.toUpperCase() === methodFilter;
        });
        if (perms.length === 0) return false;
      }

      if (!q) return perms.length > 0;

      const mn = (MODULE_TRANSLATIONS[item.module] || item.module || '').toLowerCase();
      const moduleMatch = mn.includes(q) || item.module.toLowerCase().includes(q);

      if (moduleMatch) return perms.length > 0;

      return perms.some(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.apiPath?.toLowerCase().includes(q) ||
          p.method?.toLowerCase().includes(q)
      );
    });

    return result;
  }, [mergedPermissions, activeDomain, deferredSearchText, methodFilter, grantedFilter, form]);

  // Auto expand matching modules when filter changes
  useEffect(() => {
    if (deferredSearchText.trim() || methodFilter !== 'ALL' || grantedFilter !== 'ALL' || activeDomain !== 'ALL') {
      setExpandedModules(new Set(visibleModules.map((m) => m.module)));
    }
  }, [deferredSearchText, methodFilter, grantedFilter, activeDomain, visibleModules]);

  // Count total granted permissions & total visible permissions
  const totalStats = useMemo(() => {
    if (!listPermissions) return { granted: 0, total: 0 };
    const permsState = form.getFieldValue('permissions') || {};
    let granted = 0;
    let total = 0;
    listPermissions.forEach(m => {
      m.permissions?.forEach(p => {
        total++;
        if (p.id && permsState[p.id]) granted++;
      });
    });
    return { granted, total };
  }, [listPermissions, form]);

  // Reset all filters
  const handleResetFilters = () => {
    setActiveDomain('ALL');
    setGrantedFilter('ALL');
    setMethodFilter('ALL');
    setSearchText('');
  };

  const handlePresetSelectAllRead = () => {
    const currentVals = form.getFieldValue('permissions') || {};
    const updates = { ...currentVals };

    listPermissions?.forEach((mod) => {
      if (activeDomain !== 'ALL') {
        const cat = DOMAIN_CATEGORIES.find(c => c.id === activeDomain);
        if (cat && !cat.modules.includes(mod.module)) return;
      }
      mod.permissions?.forEach((p) => {
        if (p.method?.toUpperCase() === 'GET' && p.id) {
          updates[p.id] = true;
        }
      });
    });
    form.setFieldsValue({ permissions: updates });
  };

  const handlePresetSelectAllVisible = (val: boolean) => {
    const currentVals = form.getFieldValue('permissions') || {};
    const updates = { ...currentVals };

    visibleModules.forEach((mod) => {
      updates[mod.module] = val;
      mod.permissions?.forEach((p) => {
        if (p.id) updates[p.id] = val;
      });
    });
    form.setFieldsValue({ permissions: updates });
  };

  const isFiltered = searchText.trim() !== '' || activeDomain !== 'ALL' || methodFilter !== 'ALL' || grantedFilter !== 'ALL';

  // Action Menu Items for Dropdown
  const actionMenuItems: MenuProps['items'] = [
    {
      key: 'select-read',
      label: 'Cấp quyền XEM (GET)',
      onClick: handlePresetSelectAllRead,
    },
    {
      key: 'select-visible',
      label: 'Bật tất cả mục hiển thị',
      onClick: () => handlePresetSelectAllVisible(true),
    },
    {
      key: 'deselect-visible',
      label: 'Bỏ chọn mục hiển thị',
      danger: true,
      onClick: () => handlePresetSelectAllVisible(false),
    },
    { type: 'divider' },
    {
      key: 'expand-all',
      label: 'Mở rộng tất cả',
      onClick: () => setExpandedModules(new Set(visibleModules.map((i) => i.module))),
    },
    {
      key: 'collapse-all',
      label: 'Thu gọn tất cả',
      onClick: () => setExpandedModules(new Set()),
    },
  ];

  const q = deferredSearchText.trim().toLowerCase();

  const renderPermissionsGrid = (item: any, isExpanded: boolean, q: string, moduleMatch: boolean) => {
    if (!isExpanded) return null;

    const isGrouped = parsedSubgroups.has(item.module);

    const filterPermByMethodAndSearch = (p: IPermission) => {
      const permsState = form.getFieldValue('permissions') || {};
      const isChecked = !!permsState[p.id as string];

      if (grantedFilter !== 'ALL') {
        if (grantedFilter === 'GRANTED' && !isChecked) return false;
        if (grantedFilter === 'UNGRANTED' && isChecked) return false;
      }

      if (methodFilter !== 'ALL') {
        if (methodFilter === 'PUT' && p.method?.toUpperCase() !== 'PUT' && p.method?.toUpperCase() !== 'PATCH') return false;
        if (methodFilter !== 'PUT' && p.method?.toUpperCase() !== methodFilter) return false;
      }
      if (!q || moduleMatch) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.apiPath?.toLowerCase().includes(q) ||
        p.method?.toLowerCase().includes(q)
      );
    };

    if (isGrouped) {
      const subgroups = parsedSubgroups.get(item.module) || {};

      return (
        <div
          style={{
            padding: '16px 20px 20px',
            background: '#FAFAFA',
            borderTop: '1px solid #F1F5F9',
          }}
        >
          {Object.entries(subgroups).map(([groupName, perms]) => {
            const filteredPerms = perms.filter(filterPermByMethodAndSearch);
            if (filteredPerms.length === 0) return null;

            const idsInGroup = filteredPerms.map((p) => p.id as string);

            return (
              <div key={groupName} style={{ marginBottom: 20 }}>
                {/* Subgroup Divider Header Bar */}
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) =>
                    idsInGroup.some((id) => prev.permissions?.[id] !== curr.permissions?.[id])
                  }
                >
                  {({ getFieldValue }) => {
                    const isAllChecked = filteredPerms.every((p) => !!getFieldValue(['permissions', p.id]));
                    const selectedCount = filteredPerms.filter((p) => !!getFieldValue(['permissions', p.id])).length;

                    return (
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#0F172A',
                          marginBottom: 12,
                          paddingBottom: 8,
                          borderBottom: `1px solid #E2E8F0`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={s.accentDot} />
                          <span>{groupName}</span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: selectedCount > 0 ? '#1D4ED8' : '#64748B',
                              background: selectedCount > 0 ? '#EFF6FF' : '#F1F5F9',
                              padding: '1px 8px',
                              borderRadius: 10,
                              border: `1px solid ${selectedCount > 0 ? '#BFDBFE' : '#E2E8F0'}`,
                            }}
                          >
                            {selectedCount > 0 ? `Đã chọn ${selectedCount}/${filteredPerms.length}` : `${filteredPerms.length} quyền`}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Bật tất cả trong nhóm</span>
                          <Switch
                            size="small"
                            checked={isAllChecked}
                            onChange={(checked) => {
                              const currentVals = form.getFieldValue('permissions') || {};
                              const updates = { ...currentVals };
                              filteredPerms.forEach((p) => {
                                if (p.id) updates[p.id] = checked;
                              });

                              const parentItem = mergedPermissions?.find((x) => x.module === item.module);
                              if (parentItem) {
                                const allChecked = parentItem.permissions?.every((p) =>
                                  p.id ? !!updates[p.id] : true
                                );
                                updates[item.module] = allChecked;
                              }

                              form.setFieldsValue({ permissions: updates });
                            }}
                          />
                        </div>
                      </div>
                    );
                  }}
                </Form.Item>

                {/* Subgroup Permission Cards Grid */}
                <Row gutter={[12, 12]}>
                  {filteredPerms.map((value, i) => {
                    return (
                      <Col xs={24} sm={24} md={12} lg={12} style={{ display: 'flex' }} key={`${i}-child-${value.id}`}>
                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.permissions?.[value.id as string] !== curr.permissions?.[value.id as string]}>
                          {({ getFieldValue }) => {
                            const isChecked = !!getFieldValue(['permissions', value.id as string]);
                            return (
                              <PermCard
                                value={value}
                                parentModule={item.module}
                                isChecked={isChecked}
                                onToggle={handleSingleCheck}
                              />
                            );
                          }}
                        </Form.Item>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            );
          })}
        </div>
      );
    }

    const filteredPerms = item.permissions?.filter(filterPermByMethodAndSearch) || [];

    return (
      <div
        style={{
          padding: '16px 20px 20px',
          background: '#FAFAFA',
          borderTop: '1px solid #F1F5F9',
        }}
      >
        <Row gutter={[12, 12]}>
          {filteredPerms.map((value: any, i: number) => {
            return (
              <Col xs={24} sm={24} md={12} lg={12} style={{ display: 'flex' }} key={`${i}-child-${item.module}`}>
                <Form.Item noStyle shouldUpdate={(prev, curr) => prev.permissions?.[value.id as string] !== curr.permissions?.[value.id as string]}>
                  {({ getFieldValue }) => {
                    const isChecked = !!getFieldValue(['permissions', value.id as string]);
                    return (
                      <PermCard
                        value={value}
                        parentModule={item.module}
                        isChecked={isChecked}
                        onToggle={handleSingleCheck}
                      />
                    );
                  }}
                </Form.Item>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  return (
    <div style={s.container}>
      <style>{css}</style>

      {/* ── 1. SEAMLESS CLEAN STICKY TOOLBAR ── */}
      <div style={s.stickyToolbarWrapper}>
        <div style={s.unifiedToolbarCard}>
          {/* Search input */}
          <div style={s.searchWrap} className="ma-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" stroke="#64748B" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              style={s.searchInput}
              placeholder="Tìm theo tên quyền, API path, module..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                style={s.searchClear}
                onClick={() => setSearchText('')}
                type="button"
              >
                ×
              </button>
            )}
          </div>

          {/* Dropdown 1: Select Lĩnh Vực */}
          <Select
            value={activeDomain}
            onChange={setActiveDomain}
            style={{ width: 160 }}
            popupMatchSelectWidth={false}
            options={DOMAIN_CATEGORIES.map(c => ({
              value: c.id,
              label: c.id === 'ALL' ? 'Tất cả lĩnh vực' : c.name,
            }))}
          />

          {/* Dropdown 2: Select Trạng Thái Gán Quyền */}
          <Select
            value={grantedFilter}
            onChange={setGrantedFilter}
            style={{ width: 175 }}
            popupMatchSelectWidth={false}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'GRANTED', label: `Đã cấp (${totalStats.granted})` },
              { value: 'UNGRANTED', label: 'Chưa cấp' },
            ]}
          />

          {/* Dropdown 3: Select Loại Thao Tác */}
          <Select
            value={methodFilter}
            onChange={setMethodFilter}
            style={{ width: 160 }}
            popupMatchSelectWidth={false}
            options={[
              { value: 'ALL', label: 'Tất cả loại thao tác' },
              { value: 'GET', label: 'Xem (GET)' },
              { value: 'POST', label: 'Tạo mới (POST)' },
              { value: 'PUT', label: 'Cập nhật (PUT)' },
              { value: 'DELETE', label: 'Xóa (DELETE)' },
            ]}
          />

          {/* Dropdown 4: Thao tác nhanh */}
          <Dropdown menu={{ items: actionMenuItems }} trigger={['click']} placement="bottomRight">
            <button type="button" style={s.actionMenuBtn}>
              <span>Thao tác</span>
              <span style={{ fontSize: 9, marginLeft: 4 }}>▼</span>
            </button>
          </Dropdown>
        </div>

        {/* Filter Status Hint Bar */}
        {isFiltered && (
          <div style={s.filterStatusHint}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                Đang lọc: <strong>{visibleModules.length} module</strong>
                {activeDomain !== 'ALL' && <span> • Lĩnh vực: {DOMAIN_CATEGORIES.find(c => c.id === activeDomain)?.name}</span>}
                {grantedFilter !== 'ALL' && <span> • Trạng thái: {grantedFilter === 'GRANTED' ? 'Đã cấp' : 'Chưa cấp'}</span>}
                {methodFilter !== 'ALL' && <span> • Thao tác: {methodFilter}</span>}
                {searchText && <span> • Từ khóa: "{searchText}"</span>}
              </span>
              <button type="button" onClick={handleResetFilters} style={s.resetFilterBtn}>
                Đặt lại bộ lọc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. CONSOLIDATED PARENT MODULE CARDS WITH SUBGROUP SECTIONS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleModules.map((item) => {
          const isExpanded = expandedModules.has(item.module);
          const moduleName = MODULE_TRANSLATIONS[item.module] || item.module || 'Chưa dịch';
          const permCount = item.permissions?.length ?? 0;
          const mn = (MODULE_TRANSLATIONS[item.module] || item.module || '').toLowerCase();
          const moduleMatch = mn.includes(q) || item.module.toLowerCase().includes(q);

          return (
            <div
              key={`module-${item.module}`}
              style={{
                ...s.moduleCard,
                borderColor: isExpanded ? '#BFDBFE' : '#E2E8F0',
                borderLeft: isExpanded ? '3px solid #2563EB' : '3px solid transparent',
              }}
              className="ma-module-card"
            >
              {/* Module Header */}
              <div
                style={{
                  ...s.moduleHeader,
                  background: isExpanded ? '#FAFAFA' : '#FFFFFF',
                }}
                onClick={() => toggleModule(item.module)}
              >
                <div style={s.moduleHeaderLeft}>
                  {/* Grid App Icon Box + Chevron Dropdown */}
                  <div style={s.gridIconWrap}>
                    {renderModuleIcon(item.module)}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 14,
                        height: 14,
                        color: isExpanded ? '#2563EB' : '#64748B',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ ...s.moduleName, color: isExpanded ? '#0F172A' : '#1E293B' }}>
                      {moduleName}
                    </span>
                    <span style={s.slugTag}>{item.module}</span>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, curr) => {
                        return item.permissions?.some(
                          (p) => prev.permissions?.[p.id as string] !== curr.permissions?.[p.id as string]
                        );
                      }}
                    >
                      {({ getFieldValue }) => {
                        const perms = form.getFieldValue('permissions') || {};
                        const selectedCount = item.permissions?.filter(
                          (p) => p.id && !!perms[p.id as string]
                        ).length ?? 0;

                        return (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: selectedCount > 0 ? '#1D4ED8' : '#64748B',
                              background: selectedCount > 0 ? '#EFF6FF' : '#F1F5F9',
                              padding: '1px 7px',
                              borderRadius: 10,
                              border: `1px solid ${selectedCount > 0 ? '#BFDBFE' : '#E2E8F0'}`,
                            }}
                          >
                            {selectedCount > 0 ? `Đã chọn ${selectedCount}/${permCount} quyền` : `${permCount} quyền`}
                          </span>
                        );
                      }}
                    </Form.Item>
                  </div>
                </div>

                <div style={s.masterToggleWrap} onClick={(e) => e.stopPropagation()}>
                  <span style={s.toggleLabel}>Tất cả</span>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.permissions?.[item.module] !== curr.permissions?.[item.module]}
                  >
                    {({ getFieldValue }) => (
                      <Switch
                        size="small"
                        checked={!!getFieldValue(['permissions', item.module])}
                        onChange={(value) => handleSwitchAll(value, item.module)}
                      />
                    )}
                  </Form.Item>
                </div>
              </div>

              {/* Permissions Grid with Subgroup Section Dividers */}
              {renderPermissionsGrid(item, isExpanded, q, moduleMatch)}
            </div>
          );
        })}

        {visibleModules.length === 0 && (
          <div style={s.emptyState}>
            <div style={{ fontSize: 14, color: '#1E293B', fontWeight: 600 }}>Không tìm thấy kết quả phù hợp</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
              Thử bấm <strong style={{ color: '#0F172A', cursor: 'pointer' }} onClick={handleResetFilters}>Đặt lại bộ lọc</strong> để xem toàn bộ danh sách
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Refined Styles ── */
const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    padding: '0',
  },

  /* Grid Icon Wrap */
  gridIconWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '4px 6px',
    borderRadius: 8,
    flexShrink: 0,
  },
  iconBoxBlue: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxGreen: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxIndigo: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSky: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxPurple: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxOrange: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSlate: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Seamless Opaque Sticky Header Wrapper */
  stickyToolbarWrapper: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#FFFFFF',
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottom: '1px solid #F1F5F9',
  },
  unifiedToolbarCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 11px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    flex: 1,
    minWidth: 200,
    transition: 'all 0.15s ease',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 13,
    color: '#0F172A',
    fontWeight: 400,
  },
  searchClear: {
    border: 'none',
    background: 'transparent',
    fontSize: 16,
    color: '#64748B',
    cursor: 'pointer',
  },
  actionMenuBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 11px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    background: '#F8FAFC',
    color: '#1E293B',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  resetFilterBtn: {
    fontSize: 12,
    fontWeight: 500,
    color: '#0F172A',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  filterStatusHint: {
    fontSize: 12,
    color: '#0F172A',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '5px 11px',
    borderRadius: 8,
    fontWeight: 500,
    marginTop: 8,
  },

  /* Module Card */
  moduleCard: {
    background: '#FFFFFF',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  moduleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: 'all 0.15s ease',
  },
  moduleHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    transition: 'color 0.15s ease',
  },
  slugTag: {
    fontSize: 10,
    color: '#64748B',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '1px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontWeight: 500,
  },
  masterToggleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 500,
  },

  /* Perm Card */
  permCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  permToggle: {
    marginTop: 2,
  },
  permInfo: {
    flex: 1,
    minWidth: 0,
  },
  permName: {
    fontSize: 13,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  permMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  methodBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 4,
    display: 'inline-flex',
    alignItems: 'center',
  },
  apiPath: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 500,
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  accentDot: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#2563EB',
  },
  emptyState: {
    padding: '36px 20px',
    textAlign: 'center' as const,
    background: '#FAFAFA',
    borderRadius: 10,
    border: '1px dashed #CBD5E1',
  },
};

const css = `
.ma-module-card:hover {
  border-color: #CBD5E1 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
}
.ma-perm-card:hover {
  border-color: #CBD5E1 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04) !important;
}
.ma-search-wrap:focus-within {
  border-color: #475569 !important;
  background: #FFFFFF !important;
  box-shadow: 0 0 0 2px rgba(71, 85, 105, 0.12) !important;
}
`;

export default ModuleApi;