import React from "react";
import EvaluationScorePicker from "../EvaluationScorePicker";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { formatWeight, formatScoreResult } from "../evaluationScoring";

const SCORE_VALUES = [1, 2, 3, 4, 5] as const;

export interface ISharedCriteriaRowProps {
    role: "EMPLOYEE" | "MANAGER" | "APPROVER";
    c: any;
    cIdx: number;
    hasSub: boolean;
    isEditable: boolean;
    isCompleted?: boolean;

    // Scores
    empScore: number | null;
    avgEmp?: number | null;

    mgrScore?: number | null;
    avgMgr?: number | null;

    realMgrScore?: number | null;
    apprScore?: number | null;

    finalScore?: number | null;
    avgFinal?: number | null;

    savingScore: number | null;
    handleSaveScore: (id: number, score: number) => void;

    tdB: React.CSSProperties;
    tdLvl: React.CSSProperties;
    tdSc: React.CSSProperties;
    getStickyStyle: (col: string, isHeader?: boolean) => React.CSSProperties;

    hoveredGroupId?: string | number | null;
    onGroupHover?: (id: string | number | null) => void;
}

export const SharedCriteriaRow = React.memo(({
    role, c, cIdx, hasSub, isEditable, isCompleted = false,
    empScore, avgEmp,
    mgrScore, avgMgr,
    realMgrScore, apprScore,
    finalScore, avgFinal,
    savingScore, handleSaveScore,
    tdB, tdLvl, tdSc, getStickyStyle,
    hoveredGroupId, onGroupHover
}: ISharedCriteriaRowProps) => {
    const getL = (lvl: number) => c.levels?.find((l: any) => l.level === lvl)?.description || "";
    const weightText = formatWeight(c.weight);
    const isGroupHovered = hoveredGroupId != null && String(hoveredGroupId) === String(c.id);

    return (
        <tr className={hasSub ? "eval-row eval-parent-row" : "eval-row"} id={!hasSub ? `evaluation-criteria-${c.id}` : undefined}>
            <td style={{ ...tdB, textAlign: "center", color: "#475569", fontWeight: 800, fontSize: 13 }}>{cIdx + 1}</td>
            <td style={{ ...tdB, color: "#111827" }}>
                <div style={{ fontWeight: hasSub ? 800 : 650, color: hasSub ? "#0f172a" : "#1e293b" }}>{c.name}</div>
                {hasSub && <span className="evaluation-parent-indicator-badge">Mục tổng hợp ({c.subCriteria?.length || 0} tiêu chí con)</span>}
                {c.description && <div className="evaluation-criteria-description">{c.description}</div>}
            </td>
            <td style={{ ...tdB, color: "#64748b", fontSize: 12 }}>{c.measurementMethod || "—"}</td>
            {hasSub ? (
                <td colSpan={5} style={{ ...tdB, textAlign: "center", color: "#94a3b8", fontStyle: "italic", fontSize: 12, background: "#f8fafc" }}>
                    Tiêu chí nhóm - Vui lòng xem và đánh giá chi tiết ở các mục con bên dưới
                </td>
            ) : SCORE_VALUES.map(lvl => (
                <td key={lvl} style={tdLvl}>
                    {getL(lvl) || <span className="evaluation-level-empty">Chưa có mô tả</span>}
                </td>
            ))}
            <td
                rowSpan={hasSub ? (c.subCriteria?.length || 0) + 1 : undefined}
                style={{
                    ...tdB,
                    textAlign: "center",
                    verticalAlign: "middle",
                    backgroundColor: hasSub ? "#f8fafc" : undefined
                }}
            >
                <span className="evaluation-group-weight-badge">{weightText}</span>
            </td>
            <td style={{ ...tdB, textAlign: "center", verticalAlign: "middle" }}>
                {hasSub ? (
                    <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>
                ) : (
                    <span className="evaluation-sub-weight-badge">{weightText}</span>
                )}
            </td>

            {/* EMPLOYEE ROLE COLUMNS */}
            {role === "EMPLOYEE" && (
                <>
                    <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore", isCompleted), padding: "10px 8px" }}>
                        {hasSub ? (
                            <div className="evaluation-score-readout">
                                <span>Điểm trung bình</span>
                                <strong>{avgEmp != null ? avgEmp.toFixed(2) : "—"}</strong>
                                <small>Kết quả {avgEmp != null ? formatScoreResult(avgEmp * c.weight) : "—"}</small>
                            </div>
                        ) : isEditable ? (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.EMPLOYEE_SCORE} hideChildren>
                                <EvaluationScorePicker
                                    value={empScore}
                                    showResult={false}
                                    loading={savingScore === c.id}
                                    onChange={(score) => handleSaveScore(c.id, score)}
                                />
                            </Access>
                        ) : (
                            <div className="evaluation-score-readout">
                                <span>Điểm nhân viên</span>
                                <strong>{empScore ?? "—"}</strong>
                                <small>Kết quả {empScore != null ? formatScoreResult(empScore * c.weight) : "—"}</small>
                            </div>
                        )}
                    </td>
                    {isCompleted && (
                        <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("finalScore", isCompleted) }}>
                            <div className="evaluation-score-readout is-final">
                                <span>Điểm cuối</span>
                                <strong>{hasSub ? (avgFinal?.toFixed(2) ?? "—") : (finalScore ?? "—")}</strong>
                                <small>Kết quả {hasSub
                                    ? (avgFinal != null ? formatScoreResult(avgFinal * c.weight) : "—")
                                    : (finalScore != null ? formatScoreResult(finalScore * c.weight) : "—")}
                                </small>
                            </div>
                        </td>
                    )}
                </>
            )}

            {/* MANAGER ROLE COLUMNS */}
            {role === "MANAGER" && (
                <>
                    <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore"), padding: "10px 8px" }}>
                        <div className="evaluation-score-readout">
                            <span>Điểm tự đánh giá</span>
                            <strong>{hasSub ? (avgEmp != null ? avgEmp.toFixed(2) : "—") : (empScore ?? "—")}</strong>
                            <small>Kết quả {hasSub
                                ? (avgEmp != null ? formatScoreResult(avgEmp * c.weight) : "—")
                                : (empScore != null ? formatScoreResult(empScore * c.weight) : "—")}
                            </small>
                        </div>
                    </td>
                    <td style={{ ...tdSc, ...getStickyStyle("mgrScore"), padding: "10px 8px" }}>
                        {hasSub ? (
                            <div className="evaluation-score-readout">
                                <span>Điểm trung bình</span>
                                <strong>{avgMgr != null ? avgMgr.toFixed(2) : "—"}</strong>
                                <small>Kết quả {avgMgr != null ? formatScoreResult(avgMgr * c.weight) : "—"}</small>
                            </div>
                        ) : isEditable ? (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.MANAGER_SCORE} hideChildren>
                                <EvaluationScorePicker
                                    value={mgrScore ?? null}
                                    showResult={false}
                                    loading={savingScore === c.id}
                                    onChange={(score) => handleSaveScore(c.id, score)}
                                />
                            </Access>
                        ) : (
                            <div className="evaluation-score-readout">
                                <span>Điểm đánh giá</span>
                                <strong>{mgrScore ?? "—"}</strong>
                                <small>Kết quả {mgrScore != null ? formatScoreResult(mgrScore * c.weight) : "—"}</small>
                            </div>
                        )}
                    </td>
                </>
            )}

            {/* APPROVER ROLE COLUMNS */}
            {role === "APPROVER" && (
                <>
                    <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore"), padding: "10px 8px" }}>
                        <div className="evaluation-score-readout">
                            <span>{hasSub ? "TB Tự đánh giá" : "Tự đánh giá"}</span>
                            <strong>{hasSub ? (avgEmp != null ? avgEmp.toFixed(2) : "—") : (empScore ?? "—")}</strong>
                            <small>Kết quả {hasSub
                                ? (avgEmp != null ? formatScoreResult(avgEmp * c.weight) : "—")
                                : (empScore != null ? formatScoreResult(empScore * c.weight) : "—")}
                            </small>
                        </div>
                    </td>
                    <td style={{ ...tdSc, ...getStickyStyle("mgrScore"), padding: "10px 8px" }}>
                        <div className="evaluation-score-readout">
                            <span>{hasSub ? "TB Quản lý" : "Quản lý chấm"}</span>
                            <strong>{hasSub ? (avgMgr != null ? avgMgr.toFixed(2) : "—") : (realMgrScore ?? "—")}</strong>
                            <small>Kết quả {hasSub
                                ? (avgMgr != null ? formatScoreResult(avgMgr * c.weight) : "—")
                                : (realMgrScore != null ? formatScoreResult(realMgrScore * c.weight) : "—")}
                            </small>
                        </div>
                    </td>
                    <td style={{ ...tdSc, ...getStickyStyle("apprScore"), padding: "10px 8px" }}>
                        {hasSub ? (
                            <div className="evaluation-score-readout is-final">
                                <span>TB Phê duyệt</span>
                                <strong>{avgFinal != null ? avgFinal.toFixed(2) : "—"}</strong>
                                <small>Kết quả {avgFinal != null ? formatScoreResult(avgFinal * c.weight) : "—"}</small>
                            </div>
                        ) : isEditable ? (
                            <EvaluationScorePicker
                                value={apprScore ?? null}
                                result={apprScore != null ? apprScore * c.weight : null}
                                showResult={true}
                                loading={savingScore === c.id}
                                onChange={(val) => handleSaveScore(c.id, val)}
                            />
                        ) : (
                            <div className="evaluation-score-readout is-final">
                                <span>Phê duyệt</span>
                                <strong>{apprScore ?? "—"}</strong>
                                <small>Kết quả {apprScore != null ? formatScoreResult(apprScore * c.weight) : "—"}</small>
                            </div>
                        )}
                    </td>
                </>
            )}
        </tr>
    );
});

export interface ISharedSubCriteriaRowProps {
    role: "EMPLOYEE" | "MANAGER" | "APPROVER";
    sub: any;
    cIdx: number;
    si: number;
    isEditable: boolean;
    isCompleted?: boolean;

    // Scores
    subEmp: number | null;
    subMgr?: number | null;
    subRealMgr?: number | null;
    subAppr?: number | null;
    subFinalScore?: number | null;

    savingScore: number | null;
    handleSaveScore: (id: number, score: number) => void;

    tdB: React.CSSProperties;
    tdLvl: React.CSSProperties;
    tdSc: React.CSSProperties;
    getStickyStyle: (col: string, isHeader?: boolean) => React.CSSProperties;
    parentWeight: number;
    criteriaCount: number;

    parentCriteriaId?: string | number;
    hoveredGroupId?: string | number | null;
    onGroupHover?: (id: string | number | null) => void;
}

export const SharedSubCriteriaRow = React.memo(({
    role, sub, cIdx, si, isEditable, isCompleted = false,
    subEmp, subMgr, subRealMgr, subAppr, subFinalScore,
    savingScore, handleSaveScore,
    tdB, tdLvl, tdSc, getStickyStyle, parentWeight, criteriaCount,
    parentCriteriaId, hoveredGroupId, onGroupHover
}: ISharedSubCriteriaRowProps) => {
    const getSL = (lvl: number) => sub.levels?.find((l: any) => l.level === lvl)?.description || "";
    const subWeight = (sub.weight && sub.weight > 0) ? sub.weight : (parentWeight / criteriaCount);
    const subEmpResult = subEmp != null ? subEmp * subWeight : null;
    const subMgrResult = subMgr != null ? subMgr * subWeight : null;
    const groupKey = parentCriteriaId ?? sub.criteriaId;
    const isGroupHovered = hoveredGroupId != null && groupKey != null && String(hoveredGroupId) === String(groupKey);

    return (
        <tr className="eval-row" id={`evaluation-criteria-${sub.id}`}>
            <td style={{ ...tdB, textAlign: "center", color: "#475569", fontWeight: 800, fontSize: 12 }}>{cIdx + 1}.{si + 1}</td>
            <td style={{ ...tdB, paddingLeft: role === "APPROVER" ? 14 : undefined, color: "#111827", borderLeft: role === "APPROVER" ? "none" : undefined }}>
                <div style={{ fontWeight: 650 }}>{sub.name}</div>
                {sub.description && <div className="evaluation-criteria-description">{sub.description}</div>}
            </td>
            <td style={{ ...tdB, color: "#64748b", fontSize: 12 }}>{sub.measurementMethod || "—"}</td>
            {SCORE_VALUES.map(lvl => (
                <td key={lvl} style={tdLvl}>
                    {getSL(lvl) || <span className="evaluation-level-empty">Chưa có mô tả</span>}
                </td>
            ))}

            <td style={{ ...tdB, textAlign: "center", verticalAlign: "middle" }}>
                <span className="evaluation-sub-weight-badge">
                    {formatWeight(subWeight)}
                </span>
            </td>

            {/* EMPLOYEE ROLE COLUMNS */}
            {role === "EMPLOYEE" && (
                <>
                    <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore", isCompleted), padding: "10px 8px" }}>
                        {isEditable ? (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.EMPLOYEE_SCORE} hideChildren>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <EvaluationScorePicker
                                        value={subEmp}
                                        showResult={false}
                                        loading={savingScore === sub.id}
                                        onChange={(score) => handleSaveScore(sub.id, score)}
                                    />
                                    {subEmp != null && (
                                        <small style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: "#e8637a" }}>
                                            Kết quả {formatScoreResult(subEmpResult)}
                                        </small>
                                    )}
                                </div>
                            </Access>
                        ) : (
                            <div className="evaluation-score-readout">
                                <strong>{subEmp ?? "—"}</strong>
                                {subEmp != null && (
                                    <small>Kết quả {formatScoreResult(subEmpResult)}</small>
                                )}
                            </div>
                        )}
                    </td>
                    {isCompleted && (
                        <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("finalScore", isCompleted) }}>
                            <div className="evaluation-score-readout is-final">
                                <strong>{subFinalScore ?? "—"}</strong>
                                {subFinalScore != null && (
                                    <small>Kết quả {formatScoreResult(subFinalScore * subWeight)}</small>
                                )}
                            </div>
                        </td>
                    )}
                </>
            )}

            {/* MANAGER ROLE COLUMNS */}
            {role === "MANAGER" && (
                <>
                    <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore"), padding: "10px 8px" }}>
                        <div className="evaluation-score-readout">
                            <strong>{subEmp ?? "—"}</strong>
                            {subEmp != null && (
                                <small>Kết quả {formatScoreResult(subEmpResult)}</small>
                            )}
                        </div>
                    </td>
                    <td style={{ ...tdSc, ...getStickyStyle("mgrScore"), padding: "10px 8px" }}>
                        {isEditable ? (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.MANAGER_SCORE} hideChildren>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <EvaluationScorePicker
                                        value={subMgr ?? null}
                                        showResult={false}
                                        loading={savingScore === sub.id}
                                        onChange={(score) => handleSaveScore(sub.id, score)}
                                    />
                                    {subMgr != null && (
                                        <small style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                                            Kết quả {formatScoreResult(subMgrResult)}
                                        </small>
                                    )}
                                </div>
                            </Access>
                        ) : (
                            <div className="evaluation-score-readout">
                                <strong>{subMgr ?? "—"}</strong>
                                {subMgr != null && (
                                    <small>Kết quả {formatScoreResult(subMgrResult)}</small>
                                )}
                            </div>
                        )}
                    </td>
                </>
            )}

            {/* APPROVER ROLE COLUMNS */}
            {role === "APPROVER" && (
                <>
                    <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore"), padding: "10px 8px" }}>
                        <div className="evaluation-score-readout">
                            <strong>{subEmp ?? "—"}</strong>
                            {subEmp != null && (
                                <small>Kết quả {formatScoreResult(subEmp * subWeight)}</small>
                            )}
                        </div>
                    </td>
                    <td style={{ ...tdSc, ...getStickyStyle("mgrScore"), padding: "10px 8px" }}>
                        <div className="evaluation-score-readout">
                            <strong>{subRealMgr ?? "—"}</strong>
                            {subRealMgr != null && (
                                <small>Kết quả {formatScoreResult(subRealMgr * subWeight)}</small>
                            )}
                        </div>
                    </td>
                    <td style={{ ...tdSc, ...getStickyStyle("apprScore"), padding: "10px 8px" }}>
                        {isEditable ? (
                            <EvaluationScorePicker
                                value={subAppr ?? null}
                                result={subAppr != null ? subAppr * subWeight : null}
                                showResult={true}
                                loading={savingScore === sub.id}
                                onChange={(val) => handleSaveScore(sub.id, val)}
                            />
                        ) : (
                            <div className="evaluation-score-readout is-final">
                                <strong>{subAppr ?? "—"}</strong>
                                {subAppr != null && (
                                    <small>Kết quả {formatScoreResult(subAppr * subWeight)}</small>
                                )}
                            </div>
                        )}
                    </td>
                </>
            )}
        </tr>
    );
});
