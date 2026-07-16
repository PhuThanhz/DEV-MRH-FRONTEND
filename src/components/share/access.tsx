import { Result } from "antd";
import { Navigate } from "react-router-dom";
import { useAppSelector } from '@/redux/hooks';

interface IProps {
    hideChildren?: boolean;
    children: React.ReactNode;
    permission: { method: string, apiPath: string, module: string };
}

const matchApiPath = (pattern: string, path: string): boolean => {
    if (!pattern || !path) return false;

    const toRegex = (value: string) =>
        new RegExp(`^${value.replace(/\{[^/]+\}/g, "[^/]+").replace(/\*/g, "[^/]+")}$`);

    return toRegex(pattern).test(path) || toRegex(path).test(pattern);
};

const Access = (props: IProps) => {
    //set default: hideChildren = false => vẫn render children
    // hideChildren = true => ko render children, ví dụ hide button (button này check quyền)
    const { permission, hideChildren = false } = props;

    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const permissions = useAppSelector(state => state.account.user.role.permissions);
    const roleName = useAppSelector(state => state.account.user.role?.name?.toUpperCase() || "");

    const allow =
        import.meta.env.VITE_ACL_ENABLE === 'false' ||
        roleName === 'SUPER_ADMIN' ||
        !!permissions?.some(item =>
            matchApiPath(permission.apiPath, item.apiPath)
            && item.method?.toUpperCase() === permission.method?.toUpperCase()
            && item.module === permission.module
        );

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
