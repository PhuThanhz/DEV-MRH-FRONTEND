import { useEffect, useState } from 'react';
import { Result } from "antd";
import { Navigate } from "react-router-dom";
import { useAppSelector } from '@/redux/hooks';
interface IProps {
    hideChildren?: boolean;
    children: React.ReactNode;
    permission: { method: string, apiPath: string, module: string };
}

const Access = (props: IProps) => {
    //set default: hideChildren = false => vẫn render children
    // hideChildren = true => ko render children, ví dụ hide button (button này check quyền)
    const { permission, hideChildren = false } = props;
    const [allow, setAllow] = useState<boolean>(true);

    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const permissions = useAppSelector(state => state.account.user.role.permissions);
    const roleName = useAppSelector(state => state.account.user.role?.name?.toUpperCase() || "");

    useEffect(() => {
        if (roleName === 'SUPER_ADMIN') {
            setAllow(true);
            return;
        }
        if (permissions?.length) {
            const check = permissions.find(item =>
                item.apiPath === permission.apiPath
                && item.method === permission.method
                && item.module === permission.module
            )
            if (check) {
                setAllow(true)
            } else
                setAllow(false);
        }
    }, [permissions, roleName])

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            {allow === true || import.meta.env.VITE_ACL_ENABLE === 'false' ?
                <>{props.children}</>
                :
                <>
                    {hideChildren === false ?
                        <Result
                            status="403"
                            title="Truy cập bị từ chối"
                            subTitle="Xin lỗi, bạn không có quyền hạn (permission) truy cập thông tin này"
                        />
                        :
                        <>
                            {/* render nothing */}
                        </>
                    }
                </>
            }
        </>

    )
}

export default Access;