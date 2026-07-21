import React from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { SCORE_DESCRIPTIONS, SCORE_VALUES, formatScoreResult } from "./evaluationScoring";

interface EvaluationScorePickerProps {
    value: number | null;
    result?: number | null;
    showResult?: boolean;
    loading: boolean;
    onChange: (score: number) => void;
    width?: number;
}

const EvaluationScorePicker = React.memo(({ value, result, showResult = false, loading, onChange, width = 135 }: EvaluationScorePickerProps) => (
    <div
        className={`evaluation-score-picker${value == null ? " is-empty" : " has-value"}${loading ? " is-saving" : ""}`}
        aria-busy={loading}
        style={{ width, minWidth: width, margin: "0 auto" }}
    >
        <div className="evaluation-score-picker-options" role="group" aria-label="Chọn điểm đánh giá từ 1 đến 5">
            {SCORE_VALUES.map(score => (
                <button
                    key={score}
                    type="button"
                    className={`evaluation-score-option${value === score ? " is-selected" : ""}`}
                    aria-label={`${score} điểm - ${SCORE_DESCRIPTIONS[score]}`}
                    aria-pressed={value === score}
                    title={`${score} điểm - ${SCORE_DESCRIPTIONS[score]}`}
                    disabled={loading}
                    onClick={() => {
                        if (value !== score) onChange(score);
                    }}
                >
                    {loading && value === score ? <LoadingOutlined spin /> : score}
                </button>
            ))}
        </div>
        {showResult && (
            <div 
                className={`evaluation-score-result${value == null || result == null ? " is-label-only" : ""}`}
                style={value != null && result != null ? { flexDirection: "column", gap: "2px", padding: "4px 8px 6px", alignItems: "center", minHeight: "36px" } : undefined}
            >
                {value == null
                    ? "Chưa đánh giá"
                    : result == null
                        ? "Điểm thành phần"
                        : (
                            <>
                                <span style={{ fontSize: "9px", color: "#8491a5", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2px" }}>Điểm trọng số</span>
                                <span style={{ fontSize: "15px", fontWeight: 800, color: "#d94c66", lineHeight: 1.1 }}>{formatScoreResult(result)}</span>
                            </>
                        )}
            </div>
        )}
    </div>
));

export default EvaluationScorePicker;
