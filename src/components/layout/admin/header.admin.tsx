import React, { useState } from "react";
import { Button } from "antd";
import NotificationBell from "@/components/common/notification/NotificationBell";

interface IProps {
    collapsed: boolean;
    setCollapsed: (val: boolean) => void;
    mobileOpen: boolean;
    setMobileOpen: (val: boolean) => void;
}

const HeaderAdmin: React.FC<IProps> = ({
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
}) => {
    const [notifOpen, setNotifOpen] = useState(false);

    return (
        <>
            <header className="bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600 text-white shadow-xl sticky top-0 z-40 border-b border-white/10 overflow-hidden transition-all duration-300">
                {/* GPU-accelerated wave overlay */}
                <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
                    <svg className="absolute top-0 left-0 w-[200%] h-full animate-wave-flow" viewBox="0 0 2400 60" preserveAspectRatio="none">
                        <path d="M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30 T1500,30 T1800,30 T2100,30 T2400,30" stroke="white" strokeWidth="2" fill="none" />
                    </svg>
                </div>

                <div className="relative z-10 flex items-center justify-between h-14 px-4 sm:px-6 w-full gap-4">

                    {/* LEFT: Toggle sidebar */}
                    <Button
                        type="text"
                        onClick={() =>
                            window.innerWidth < 1024
                                ? setMobileOpen(!mobileOpen)
                                : setCollapsed(!collapsed)
                        }
                        className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm group active:scale-95"
                        style={{ border: "none" }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 6.5h17M3.5 12h17m-17 5.5h17" />
                        </svg>
                    </Button>

                    {/* RIGHT: Notifications */}
                    <div className="flex items-center">
                        <NotificationBell
                            open={notifOpen}
                            onOpenChange={setNotifOpen}
                        />
                    </div>
                </div>

                <style>{`
                    @keyframes wave-flow {
                        0% { transform: translate3d(0, 0, 0); }
                        100% { transform: translate3d(-50%, 0, 0); }
                    }
                    .animate-wave-flow {
                        animation: wave-flow 25s linear infinite;
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .animate-wave-flow {
                            animation: none !important;
                        }
                    }
                `}</style>
            </header>

        </>
    );
};

export default HeaderAdmin;
