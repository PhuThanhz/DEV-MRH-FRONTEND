// src/hooks/useAccess.ts
import { useAppSelector } from '@/redux/hooks';

type Permission = {
    method: string;
    apiPath: string;
    module: string;
};

// So khớp apiPath có hỗ trợ tham số động {id}, {departmentId},...
const matchApiPath = (pattern: string, path: string): boolean => {
    if (!pattern || !path) return false;

    // Chuyển {param} thành regex
    const regexPattern = '^' + pattern.replace(/\{[^/]+\}/g, '[^/]+') + '$';
    const regex = new RegExp(regexPattern);

    return regex.test(path);
};

const useAccess = (permission: Permission): boolean => {
    const permissions = useAppSelector(
        state => state.account?.user?.role?.permissions
    );

    // Bypass ACL nếu tắt
    if (import.meta.env.VITE_ACL_ENABLE === 'false') return true;

    if (!permissions || permissions.length === 0) return false;

    return permissions.some(item => {
        const methodMatch =
            item.method?.toUpperCase() === permission.method?.toUpperCase();

        const moduleMatch = item.module === permission.module;

        const pathMatch = matchApiPath(permission.apiPath, item.apiPath);

        return methodMatch && moduleMatch && pathMatch;
    });
};

export default useAccess;