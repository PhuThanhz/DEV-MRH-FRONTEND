import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const Loading: React.FC<{ message?: string }> = ({ message = "Đang tải hệ thống NCT Network" }) => {
    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "white",
            }}
        >
            <Spin
                indicator={<LoadingOutlined style={{ fontSize: 48, color: "#1677ff" }} spin />}
                tip={<span style={{ fontSize: 18, color: "#555" }}>{message}</span>}
                size="large"
            />
        </div>
    );
};

export default Loading;
