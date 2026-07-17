import type { ReactNode } from "react";
import { Drawer } from "antd";
import { useIsMobile } from "@/hooks/useIsMobile";
import DrawerCloseButton from "./DrawerCloseButton";

interface LotusDetailDrawerProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    height?: string | number;
    destroyOnClose?: boolean;
    keyboard?: boolean;
    closeAriaLabel?: string;
    maskClosable?: boolean;
}

const LotusDetailDrawer = ({
    open,
    onClose,
    children,
    height = "calc(100vh - 16px)",
    destroyOnClose = true,
    keyboard = true,
    closeAriaLabel = "Đóng",
    maskClosable = true,
}: LotusDetailDrawerProps) => {
    const isMobile = useIsMobile();

    return (
        <Drawer
            placement="bottom"
            height={height}
            open={open}
            onClose={onClose}
            keyboard={keyboard}
            maskClosable={maskClosable}
            closable={false}
            styles={{
                mask: { background: "rgba(15, 23, 42, 0.42)", backdropFilter: "blur(1px)" },
                wrapper: {
                    left: isMobile ? 40 : 48,
                    width: isMobile ? "calc(100% - 40px)" : "calc(100% - 48px)",
                    overflow: "visible",
                    background: "transparent",
                    boxShadow: "none",
                },
                content: {
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    overflow: "visible",
                    boxShadow: "0 -12px 36px rgba(15, 23, 42, 0.16)",
                },
                body: { padding: 0, overflow: "visible", height: "100%" },
            }}
            destroyOnHidden={destroyOnClose}
        >
            <div className="relative h-full">
                <DrawerCloseButton
                    onClick={onClose}
                    variant="bottom"
                    ariaLabel={closeAriaLabel}
                    size="sm"
                    left={-40}
                    top={isMobile ? 16 : 20}
                />
                <div
                    className="h-full bg-white"
                    style={{
                        position: "relative",
                        zIndex: 2,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        overflow: "hidden",
                    }}
                >
                    {children}
                </div>
            </div>
        </Drawer>
    );
};

export default LotusDetailDrawer;
