import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

interface PageContainerProps {
    title: React.ReactNode;
    filter?: React.ReactNode;
    extra?: React.ReactNode;
    breadcrumb?: React.ReactNode;
    children?: React.ReactNode;
    fullHeight?: boolean;
    contentClassName?: string;
    onBack?: () => void;
}

const PageContainer: React.FC<PageContainerProps> = ({
    title,
    filter,
    extra,
    breadcrumb,
    children,
    fullHeight = false,
    contentClassName,
    onBack
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const fromPath = location.state?.from;
    const departmentName = location.state?.departmentName;

    return (
        <div className={fullHeight ? "flex flex-col h-full w-full bg-[#f8f9fa]" : "min-h-screen w-full bg-[#f8f9fa]"}>
            {/* Header */}
            {title && (
                <div className="bg-[#f8f9fa] border-b border-gray-200/60 px-4 sm:px-8 py-3">
                    {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {onBack ? (
                                <Button
                                    type="text"
                                    shape="circle"
                                    icon={<ArrowLeftOutlined style={{ transition: "transform 0.2s" }} className="back-btn-icon" />}
                                    onClick={onBack}
                                    style={{
                                        color: "#595959",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 32,
                                        height: 32,
                                        marginRight: 4,
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "#f2547d";
                                        e.currentTarget.style.background = "#fff0f4";
                                        const icon = e.currentTarget.querySelector(".back-btn-icon") as HTMLElement;
                                        if (icon) icon.style.transform = "translateX(-2px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "#595959";
                                        e.currentTarget.style.background = "transparent";
                                        const icon = e.currentTarget.querySelector(".back-btn-icon") as HTMLElement;
                                        if (icon) icon.style.transform = "translateX(0)";
                                    }}
                                />
                            ) : (
                                /* Pink accent indicator */
                                <div className="h-6 w-[4px] bg-gradient-to-b from-pink-400 to-pink-600 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.3)]" />
                            )}
                            
                            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                                {title}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {fromPath && fromPath.startsWith("/admin/department-profiles") && (
                                <Button
                                    type="link"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate(fromPath)}
                                    style={{
                                        fontWeight: 600,
                                        color: "#f2547d",
                                        padding: 0,
                                        display: "inline-flex",
                                        alignItems: "center"
                                    }}
                                >
                                    Quay lại Hồ sơ phòng ban {departmentName ? `(${departmentName})` : ""}
                                </Button>
                            )}
                            {extra}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter */}
            {filter && (
                <div className="px-4 sm:px-8 pt-4 pb-2">
                    {filter}
                </div>
            )}

            {/* Content */}
            <div className={contentClassName ?? (fullHeight ? "px-4 sm:px-8 py-2 flex-1 min-h-0" : "px-4 sm:px-8 py-5")}>
                {children}
            </div>
        </div>
    );
};

export default PageContainer;
