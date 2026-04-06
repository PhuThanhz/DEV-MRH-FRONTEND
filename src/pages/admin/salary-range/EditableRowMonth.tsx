import { useState, useRef, useEffect } from "react";
import { Input, message } from "antd";
import { EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { ISalaryStructure, IReqSalaryStructure } from "@/types/backend";
import { useUpsertSalaryStructureMutation } from "@/hooks/useSalaryStructure";

interface Props {
    structure: ISalaryStructure | null;
    ownerLevel: "COMPANY" | "DEPARTMENT" | "SECTION";
    jobTitleId: number;
    gradeId: number;
    onSaved: (newStruct: ISalaryStructure) => void;
}

const monthFields = [
    "monthBaseSalary", "monthPositionAllowance", "monthMealAllowance",
    "monthFuelSupport", "monthPhoneSupport", "monthOtherSupport",
    "monthKpiBonusA", "monthKpiBonusB", "monthKpiBonusC", "monthKpiBonusD",
] as const;

const parseViVN = (s: string): number | null => {
    const cleaned = s.replace(/\./g, "").replace(/,/g, "").trim();
    if (cleaned === "") return null;
    const n = Number(cleaned);
    return isNaN(n) ? null : n;
};

const formatViVN = (s: string): string => {
    const n = parseViVN(s);
    if (n == null) return "";
    return n.toLocaleString("vi-VN");
};

const structToValues = (structure: ISalaryStructure | null): Record<string, string> => {
    const out: Record<string, string> = {};
    monthFields.forEach((f) => {
        const v = structure?.[f];
        out[f] = v != null ? formatViVN(String(v)) : "";
    });
    return out;
};

const fmt = (val?: number | null) =>
    val != null ? val.toLocaleString("vi-VN") : <span style={{ color: "#bfbfbf" }}>—</span>;

const EditableRowMonth = ({ structure, ownerLevel, jobTitleId, gradeId, onSaved }: Props) => {
    const [isEditing, setIsEditing] = useState(false);
    const [values, setValues] = useState<Record<string, string>>(() => structToValues(structure));
    const savedValuesRef = useRef<Record<string, string>>(structToValues(structure));
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showSavedFeedback, setShowSavedFeedback] = useState(false);

    useEffect(() => {
        const fresh = structToValues(structure);
        setValues(fresh);
        savedValuesRef.current = fresh;
    }, [structure]);

    const upsert = useUpsertSalaryStructureMutation();

    const handleEdit = () => setIsEditing(true);

    const handleCancel = () => {
        setValues(savedValuesRef.current);
        setIsEditing(false);
    };

    const handleChange = (field: string, rawDigits: string) => {
        setValues((prev) => ({ ...prev, [field]: rawDigits }));
    };

    const handleSave = () => {
        const payload: IReqSalaryStructure = {
            ownerLevel,
            ownerJobTitleId: jobTitleId,
            salaryGradeId: gradeId,
        };
        monthFields.forEach((f) => { payload[f] = parseViVN(values[f]); });

        upsert.mutate(payload, {
            onSuccess: (newStruct) => {
                message.success({ content: "Đã lưu thành công", duration: 2 });
                onSaved(newStruct as ISalaryStructure);
                setIsEditing(false);
                setShowSavedFeedback(true);
                setTimeout(() => setShowSavedFeedback(false), 2000);
            },
            onError: () => {
                message.error({ content: "Lưu thất bại, vui lòng thử lại", duration: 3 });
            },
        });
    };

    return (
        <>
            {monthFields.map((field) => (
                <td key={field} className={`er-input-cell${focusedField === field ? " er-focused" : ""}`}>
                    {isEditing ? (
                        <div className="er-input-wrap">
                            <Input
                                value={values[field]}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(/[^0-9]/g, "");
                                    handleChange(field, digits);
                                }}
                                onFocus={() => setFocusedField(field)}
                                onBlur={(e) => {
                                    const formatted = formatViVN(e.target.value);
                                    setValues((prev) => ({ ...prev, [field]: formatted }));
                                    setTimeout(() => setFocusedField(null), 150);
                                }}
                                placeholder="0"
                                className="er-salary-input"
                            />
                        </div>
                    ) : (
                        <span className="num-display">
                            {fmt(structure?.[field])}
                        </span>
                    )}
                </td>
            ))}

            <td className="er-action-cell">
                {isEditing ? (
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}>
                        <CheckOutlined
                            style={{ fontSize: 18, color: "#52c41a", cursor: upsert.isPending ? "not-allowed" : "pointer", opacity: upsert.isPending ? 0.5 : 1 }}
                            onClick={upsert.isPending ? undefined : handleSave}
                        />
                        <CloseOutlined
                            style={{ fontSize: 18, color: "#ff4d4f", cursor: "pointer" }}
                            onClick={handleCancel}
                        />
                    </div>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <EditOutlined
                            style={{ fontSize: 18, color: "#fa8c16", cursor: "pointer" }}
                            onClick={handleEdit}
                        />
                        {showSavedFeedback && (
                            <CheckOutlined style={{ color: "#52c41a", fontSize: 14 }} />
                        )}
                    </div>
                )}
            </td>

            <style>{`
                .er-input-cell {
                    position: relative;
                    padding: 8px !important;
                    transition: background 0.15s ease;
                }
                .er-input-cell.er-focused { background: #fafafa !important; }
                .er-input-wrap { position: relative; }
                .num-display {
                    display: block;
                    text-align: right;
                    padding: 0 4px;
                    font-size: 13px;
                    color: #262626;
                }
                .er-salary-input {
                    font-weight: 500;
                    border-radius: 6px;
                    min-width: 130px;
                    text-align: right;
                    border: none;
                    background: transparent;
                    transition: all 0.2s;
                    color: #262626;
                }
                .er-salary-input:hover { background: #fafafa; }
                .er-salary-input:focus {
                    background: white;
                    border: none;
                    box-shadow: 0 0 0 1px rgba(235,47,150,0.3), 0 2px 8px rgba(235,47,150,0.08);
                }
                .er-salary-input::placeholder { color: #d9d9d9; }
                .er-salary-input.ant-input { padding: 6px 12px; }
                .er-action-cell { min-width: 80px; }
            `}</style>
        </>
    );
};

export default EditableRowMonth;