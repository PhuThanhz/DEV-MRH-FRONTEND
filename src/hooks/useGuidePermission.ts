import { useCallback } from "react";
import { useAppSelector } from "@/redux/hooks";
import type { LotusGuide } from "@/components/common/guide/guideRegistry";

type PermissionLike = {
    apiPath: string;
    method: string;
    module?: string;
};

const useGuidePermission = () => {
    const permissions = useAppSelector(
        (state) => state.account?.user?.role?.permissions ?? []
    );

    const hasPermission = useCallback(
        (required?: PermissionLike | null): boolean => {
            if (!required) return true;
            if (import.meta.env.VITE_ACL_ENABLE === "false") return true;
            if (!permissions.length) return false;
            return permissions.some(
                (p: any) =>
                    p.method?.toUpperCase() === required.method?.toUpperCase() &&
                    p.apiPath === required.apiPath &&
                    (!required.module || p.module === required.module)
            );
        },
        [permissions]
    );

    const canStartGuide = useCallback(
        (guide: LotusGuide): boolean => hasPermission(guide.requiredPermission),
        [hasPermission]
    );

    const filterGuides = useCallback(
        (guides: LotusGuide[]): LotusGuide[] => guides.filter((g) => canStartGuide(g)),
        [canStartGuide]
    );

    return { hasPermission, canStartGuide, filterGuides };
};

export default useGuidePermission;
