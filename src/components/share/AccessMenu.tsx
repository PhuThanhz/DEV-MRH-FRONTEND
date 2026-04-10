import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAppSelector } from "@/redux/hooks";

interface IProps {
    hideChildren?: boolean;
    children: ReactNode;
    permission: { method: string; apiPath: string; module: string };
}

const AccessMenu = (props: IProps) => {
    const { permission, hideChildren = true } = props;
    const [allow, setAllow] = useState<boolean>(true);

    const permissions = useAppSelector(
        (state) => state.account.user.role.permissions
    );

    useEffect(() => {
        if (permissions?.length) {
            const check = permissions.find(
                (item) =>
                    item.apiPath === permission.apiPath &&
                    item.method === permission.method &&
                    item.module === permission.module
            );

            setAllow(!!check);
        }
    }, [permissions, permission]);

    // 🔥 QUAN TRỌNG
    if (allow === false && import.meta.env.VITE_ACL_ENABLE !== "false") {
        if (hideChildren) {
            return <></>; // 👉 FIX dropdown (không tạo dòng trống)
        }
        return null;
    }

    return <>{props.children}</>;
};

export default AccessMenu;