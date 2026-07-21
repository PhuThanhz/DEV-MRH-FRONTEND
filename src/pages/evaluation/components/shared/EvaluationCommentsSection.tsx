import React from "react";
import { Button, Input } from "antd";

interface IEvaluationCommentsSectionProps {
    role: "EMPLOYEE" | "MANAGER" | "APPROVER";
    comments: any[];
    isEditable: boolean;
    canFeedback?: boolean;
    selfReviewValue: string;
    onChangeSelfReview?: (val: string) => void;
    onSaveSelfReview?: () => void;
    managerFeedbackValue: string;
    onChangeManagerFeedback?: (val: string) => void;
    onSaveManagerFeedback?: () => void;
    savingSelfReview?: boolean;
    savingManagerFeedback?: boolean;
}

const getCommentHelper = (comments: any[], type: string) =>
    comments?.find(c => c.commentType === type)?.content ?? "";

export const EvaluationCommentsSection: React.FC<IEvaluationCommentsSectionProps> = ({
    role,
    comments,
    isEditable,
    canFeedback = false,
    selfReviewValue,
    onChangeSelfReview,
    onSaveSelfReview,
    managerFeedbackValue,
    onChangeManagerFeedback,
    onSaveManagerFeedback,
    savingSelfReview = false,
    savingManagerFeedback = false,
}) => {
    const dbSelfReview = getCommentHelper(comments, "SELF_REVIEW");
    const dbManagerFeedback = getCommentHelper(comments, "MANAGER_FEEDBACK");

    const displaySelfReview = dbSelfReview || selfReviewValue;
    const displayManagerFeedback = dbManagerFeedback || managerFeedbackValue;

    const isSelfReviewUnchanged = selfReviewValue.trim() === dbSelfReview.trim();
    const isManagerFeedbackUnchanged = managerFeedbackValue.trim() === dbManagerFeedback.trim();

    return (
        <div style={{ display: "grid", gap: 16 }}>
            {/* Self review section */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
                    Nhận xét tự đánh giá của nhân viên
                </div>
                {role === "EMPLOYEE" && isEditable && onChangeSelfReview && onSaveSelfReview ? (
                    <div>
                        <Input.TextArea
                            rows={4}
                            value={selfReviewValue}
                            onChange={(e) => onChangeSelfReview(e.target.value)}
                            placeholder="Chia sẻ thành tựu, khó khăn hoặc mong muốn của bạn trong kỳ làm việc vừa qua..."
                            style={{ borderRadius: 8, fontSize: 14, resize: "none", borderColor: "#e5e7eb" }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                            <Button
                                onClick={onSaveSelfReview}
                                loading={savingSelfReview}
                                disabled={isSelfReviewUnchanged || savingSelfReview}
                                style={{ borderRadius: 8, fontWeight: 650, color: isSelfReviewUnchanged ? undefined : "#111827", borderColor: "#e5e7eb" }}
                            >
                                Lưu nhận xét
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: displaySelfReview ? "#111827" : "#9ca3af", fontStyle: displaySelfReview ? "normal" : "italic", lineHeight: 1.7, border: "1px solid #f3f4f6" }}>
                        {displaySelfReview || "Nhân viên chưa viết nhận xét tự đánh giá."}
                    </div>
                )}
            </div>

            {/* Manager feedback section */}
            {(role === "MANAGER" || displayManagerFeedback || (role === "EMPLOYEE" && comments?.some(c => c.commentType === "MANAGER_FEEDBACK"))) && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
                        Nhận xét / Phản hồi của Quản lý
                    </div>
                    {role === "MANAGER" && isEditable && canFeedback && onChangeManagerFeedback && onSaveManagerFeedback ? (
                        <div>
                            <Input.TextArea
                                rows={4}
                                value={managerFeedbackValue}
                                onChange={(e) => onChangeManagerFeedback(e.target.value)}
                                placeholder="Nhập nhận xét, phản hồi về hiệu quả công việc của nhân viên..."
                                style={{ borderRadius: 8, fontSize: 14, resize: "none", borderColor: "#e5e7eb" }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                                <Button
                                    onClick={onSaveManagerFeedback}
                                    loading={savingManagerFeedback}
                                    disabled={isManagerFeedbackUnchanged || savingManagerFeedback}
                                    style={{ borderRadius: 8, fontWeight: 650, color: isManagerFeedbackUnchanged ? undefined : "#111827", borderColor: "#e5e7eb" }}
                                >
                                    Lưu nhận xét
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: displayManagerFeedback ? "#111827" : "#9ca3af", fontStyle: displayManagerFeedback ? "normal" : "italic", lineHeight: 1.7, border: "1px solid #f3f4f6" }}>
                            {displayManagerFeedback || "Quản lý chưa viết nhận xét."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
