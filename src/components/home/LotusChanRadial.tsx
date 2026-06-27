import React, { useState } from "react";
import { Tooltip } from "antd";
import { FileSearchOutlined, SearchOutlined, AppstoreAddOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";

const LotusChanRadial = () => {
    const [openRadial, setOpenRadial] = useState(false);
    const navigate = useNavigate();

    const user = useAppSelector((state) => state.account?.user);
    const permissions = user?.role?.permissions || [];

    const hasPermission = (requiredPermission: any) => {
        if (!requiredPermission) return true;
        return permissions.some(
            (item: any) =>
                item.apiPath === requiredPermission.apiPath &&
                item.method === requiredPermission.method &&
                item.module === requiredPermission.module
        );
    };

    const canViewAccounting = hasPermission(ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_PAGINATE);

    return (
        <div style={{ position: "relative", zIndex: 100 }}>
            {/* Mascot Center */}
            <div
                onClick={() => setOpenRadial(!openRadial)}
                style={{
                    width: 180,
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transform: openRadial ? "scale(0.95)" : "scale(1)",
                    position: "relative",
                    zIndex: 2,
                }}
                className="lotus-mascot-btn"
            >
                <img
                    src="/logo/logolinhvat.png"
                    alt="Lotus-chan"
                    style={{
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                        filter: openRadial ? "drop-shadow(0 0 15px rgba(236,72,153,0.6))" : "drop-shadow(0 4px 10px rgba(0,0,0,0.1))",
                        transition: "filter 0.3s ease",
                    }}
                />
            </div>

            {/* Radial Items */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 0,
                    height: 0,
                    zIndex: 1,
                }}
            >
                {canViewAccounting && (
                    <Tooltip title="Tra cứu Chứng từ" placement="left">
                        <div
                            onClick={() => {
                                navigate("/admin/accounting-lookup");
                                setOpenRadial(false);
                            }}
                            style={{
                                position: "absolute",
                                top: 0, left: 0,
                                transform: openRadial ? "translate(-50%, -120px)" : "translate(-50%, -50%)",
                                width: 56, height: 56,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #ec4899, #be185d)",
                                color: "white",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 24, cursor: "pointer",
                                boxShadow: "0 8px 25px rgba(236,72,153,0.5), inset 0 2px 5px rgba(255,255,255,0.3)",
                                opacity: openRadial ? 1 : 0,
                                visibility: openRadial ? "visible" : "hidden",
                                transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s",
                                border: "1px solid rgba(255,255,255,0.4)"
                            }}
                            className="radial-btn"
                        >
                            <FileSearchOutlined />
                        </div>
                    </Tooltip>
                )}

                {/* Coming soon button 1 */}
                <Tooltip title="Tìm kiếm chung" placement="left">
                    <div
                        style={{
                            position: "absolute",
                            top: 0, left: 0,
                            transform: openRadial ? "translate(-95px, -95px)" : "translate(-50%, -50%)",
                            width: 48, height: 48,
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(10px)",
                            color: "#ec4899",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20, cursor: "pointer",
                            boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                            opacity: openRadial ? 0.9 : 0,
                            visibility: openRadial ? "visible" : "hidden",
                            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s",
                            border: "1px solid rgba(236,72,153,0.3)"
                        }}
                        className="radial-btn-secondary"
                    >
                        <SearchOutlined />
                    </div>
                </Tooltip>

                {/* Coming soon button 2 */}
                <Tooltip title="Tiện ích khác" placement="left">
                    <div
                        style={{
                            position: "absolute",
                            top: 0, left: 0,
                            transform: openRadial ? "translate(-120px, -50%)" : "translate(-50%, -50%)",
                            width: 48, height: 48,
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(10px)",
                            color: "#ec4899",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 20, cursor: "pointer",
                            boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                            opacity: openRadial ? 0.9 : 0,
                            visibility: openRadial ? "visible" : "hidden",
                            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s",
                            border: "1px solid rgba(236,72,153,0.3)"
                        }}
                        className="radial-btn-secondary"
                    >
                        <AppstoreAddOutlined />
                    </div>
                </Tooltip>
            </div>

            <style>{`
                .radial-btn:hover {
                    transform: translate(-50%, -125px) scale(1.15) !important;
                    box-shadow: 0 12px 30px rgba(236,72,153,0.7), inset 0 2px 5px rgba(255,255,255,0.4) !important;
                }
                .radial-btn-secondary:hover {
                    transform: scale(1.15) !important;
                    background: #fff !important;
                    opacity: 1 !important;
                    box-shadow: 0 12px 25px rgba(236,72,153,0.2) !important;
                }
                /* Need to combine transform correctly for secondary buttons on hover */
                .radial-btn-secondary:nth-child(2):hover {
                    transform: translate(-95px, -95px) scale(1.15) !important;
                }
                .radial-btn-secondary:nth-child(3):hover {
                    transform: translate(-120px, -50%) scale(1.15) !important;
                }
                
                .lotus-mascot-btn:hover img {
                    filter: drop-shadow(0 8px 25px rgba(236, 72, 153, 0.6)) !important;
                    transform: scale(1.05);
                }
                .lotus-mascot-btn img {
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    position: relative;
                    zIndex: 2;
                }
            `}</style>

        </div>
    );
};

export default LotusChanRadial;
