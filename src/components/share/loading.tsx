import React from "react";
import "./loading.css";
import { DotLottiePlayer } from '@dotlottie/react-player';
import '@dotlottie/react-player/dist/index.css';

const Loading = () => {
    const style: React.CSSProperties = { 
        position: "fixed", 
        top: "50%", 
        left: "50%", 
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    };

    return (
        <div style={style}>
            <div className="lotus-loader-lottie" style={{ width: 180, height: 180 }}>
                <DotLottiePlayer
                    src="/logo/loading2.lottie"
                    autoplay
                    loop
                />
            </div>
        </div>
    )
}

export default Loading;