/**
 * manage.account.tsx — Root export only
 */

import { Drawer } from "antd";
import { useBreakpoint } from "@/hooks/useIsMobile";
import { UserUpdateInfo } from "./manage.account.content";
import DrawerCloseButton from "@/components/common/drawer/DrawerCloseButton";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
}

const ManageAccount = ({ open, onClose }: IProps) => {
    const { isMobile } = useBreakpoint();

    return (
        <Drawer
            placement="right"
            open={open}
            onClose={() => onClose(false)}
            closable={false}
            maskClosable={false}
            destroyOnHidden
            width={isMobile ? "100%" : "min(1200px, calc(100% - 80px))"}
            styles={{
                mask: {
                    background: "rgba(10, 14, 32, 0.34)",
                    backdropFilter: "blur(8px)",
                    top: 0,
                },
                wrapper: {
                    top: 35,
                    height: "calc(100% - 35px)",
                    boxShadow: "-10px 0 40px rgba(15, 23, 42, 0.16)",
                    overflow: "visible",
                },
                content: {
                    borderTopLeftRadius: isMobile ? 0 : 20,
                    borderBottomLeftRadius: isMobile ? 0 : 20,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    overflow: "hidden",
                    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 26%)",
                },
                body: {
                    padding: 0,
                    overflow: "hidden",
                    height: "100%",
                },
            }}
        >
            {/* Floating close button — shared Lotus component */}
            {!isMobile && (
                <DrawerCloseButton
                    onClick={() => onClose(false)}
                    variant="right"
                    size="sm"
                    top={12}
                />
            )}
            <UserUpdateInfo onClose={onClose} />
        </Drawer>
    );
};

export default ManageAccount;
