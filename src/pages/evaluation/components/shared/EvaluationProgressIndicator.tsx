import React from "react";
import { Progress } from "antd";

interface IEvaluationProgressIndicatorProps {
    scoredCount: number;
    totalCount: number;
}

export const EvaluationProgressIndicator: React.FC<IEvaluationProgressIndicatorProps> = React.memo(({ scoredCount, totalCount }) => {
    const progressPct = totalCount ? Math.round((scoredCount / totalCount) * 100) : 0;
    return (
        <div className="evaluation-header-progress">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 3 }}>
                <span style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>Tiến độ</span>
                <strong style={{ color: "#0f172a", fontSize: 13, fontWeight: 800, lineHeight: 1 }}>{scoredCount}/{totalCount}</strong>
            </div>
            <Progress
                percent={progressPct}
                showInfo={false}
                strokeWidth={4}
                strokeColor="#16a34a"
                trailColor="#e2e8f0"
                style={{ width: 105, margin: 0 }}
            />
        </div>
    );
});

