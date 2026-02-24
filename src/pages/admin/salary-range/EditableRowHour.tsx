import { useState } from "react";
import { Button, Input, message } from "antd";
import { EditOutlined, CheckOutlined } from "@ant-design/icons";
import type { ISalaryStructure, IReqSalaryStructure } from "@/types/backend";
import { useUpsertSalaryStructureMutation } from "@/hooks/useSalaryStructure";

interface Props {
    structure: ISalaryStructure | null;
    ownerLevel: "COMPANY" | "DEPARTMENT" | "SECTION";
    jobTitleId: number;
    gradeId: number;
    onSaved: (newStruct: ISalaryStructure) => void;
}

const hourFields = [
    "hourBaseSalary",
    "hourPositionAllowance",
    "hourMealAllowance",
    "hourFuelSupport",
    "hourPhoneSupport",
    "hourOtherSupport",
    "hourKpiBonusA",
    "hourKpiBonusB",
    "hourKpiBonusC",
    "hourKpiBonusD",
] as const;

const EditableRowHour = ({
    structure,
    ownerLevel,
    jobTitleId,
    gradeId,
    onSaved,
}: Props) => {

    const [values, setValues] = useState<Record<string, string>>(() => {
        const initial: any = {};
        hourFields.forEach((f) => {
            initial[f] = structure?.[f] != null ? String(structure[f]) : "";
        });
        return initial;
    });

    const [originalValues] = useState<Record<string, string>>(() => {
        const initial: any = {};
        hourFields.forEach((f) => {
            initial[f] = structure?.[f] != null ? String(structure[f]) : "";
        });
        return initial;
    });

    const [isSaved, setIsSaved] = useState(true);
    const [showSavedFeedback, setShowSavedFeedback] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const upsert = useUpsertSalaryStructureMutation();

    const handleChange = (field: string, v: string) => {
        setValues((prev) => {
            const newValues = { ...prev, [field]: v };
            const hasChanges = hourFields.some(f => newValues[f] !== originalValues[f]);
            setIsSaved(!hasChanges);
            return newValues;
        });
    };

    const formatCurrency = (value: string) => {
        if (!value) return "";
        const num = parseFloat(value.replace(/,/g, ""));
        if (isNaN(num)) return value;
        return num.toLocaleString("vi-VN");
    };

    const handleSave = () => {
        const payload: IReqSalaryStructure = {
            ownerLevel,
            ownerJobTitleId: jobTitleId,
            salaryGradeId: gradeId,
        };

        hourFields.forEach((f) => {
            const raw = values[f];
            payload[f] = raw === "" ? null : Number(raw.replace(/,/g, ""));
        });

        upsert.mutate(payload, {
            onSuccess: (newStruct) => {
                message.success({
                    content: "Đã lưu thành công",
                    duration: 2,
                });
                onSaved(newStruct as ISalaryStructure);
                setIsSaved(true);

                // Show micro-interaction feedback
                setShowSavedFeedback(true);
                setTimeout(() => setShowSavedFeedback(false), 2000);
            },
            onError: () => {
                message.error({
                    content: "Lưu thất bại, vui lòng thử lại",
                    duration: 3,
                });
            },
        });
    };

    return (
        <>
            {hourFields.map((field) => {
                const isFocused = focusedField === field;

                return (
                    <td key={field} className={`input-cell ${isFocused ? "focused-cell" : ""}`}>
                        <div className="input-wrapper">
                            <Input
                                type="text"
                                value={values[field]}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, "");
                                    handleChange(field, val);
                                }}
                                onFocus={() => setFocusedField(field)}
                                onBlur={(e) => {
                                    const formatted = formatCurrency(e.target.value);
                                    setValues((prev) => ({ ...prev, [field]: formatted }));
                                    setTimeout(() => setFocusedField(null), 200);
                                }}
                                placeholder="0"
                                className="salary-input"
                            />
                            {isFocused && values[field] && (
                                <div className="calc-popup">
                                    <div className="calc-row">
                                        <span className="calc-label">Giờ</span>
                                        <span className="calc-value">{formatCurrency(values[field])}</span>
                                    </div>
                                    <div className="calc-row">
                                        <span className="calc-label">Ngày (8h)</span>
                                        <span className="calc-value">{formatCurrency(String(Number(values[field].replace(/,/g, "") || 0) * 8))}</span>
                                    </div>
                                    <div className="calc-row">
                                        <span className="calc-label">Tháng (208h)</span>
                                        <span className="calc-value">{formatCurrency(String(Number(values[field].replace(/,/g, "") || 0) * 208))}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </td>
                );
            })}

            <td className="action-cell">
                {!isSaved ? (
                    <Button
                        type="default"
                        onClick={handleSave}
                        loading={upsert.isPending}
                        size="middle"
                        icon={<EditOutlined />}
                        className="save-button-edit"
                    >
                        Lưu
                    </Button>
                ) : (
                    <div className={`save-indicator ${showSavedFeedback ? 'saved-pulse' : ''}`}>
                        <CheckOutlined className="check-icon" />
                    </div>
                )}
            </td>

            <style>
                {`
                    .input-cell {
                        position: relative;
                        padding: 8px !important;
                        transition: background 0.15s ease;
                    }

                    .input-cell.focused-cell {
                        background: #fafafa !important;
                    }

                    .input-wrapper {
                        position: relative;
                    }

                    .salary-input {
                        font-weight: 500;
                        border-radius: 6px;
                        min-width: 130px;
                        text-align: right;
                        border: none;
                        background: transparent;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        color: #262626;
                    }

                    .salary-input:hover {
                        background: #fafafa;
                    }

                    .salary-input:focus {
                        background: white;
                        border: none;
                        box-shadow: 0 0 0 1px rgba(235, 47, 150, 0.3), 0 2px 8px rgba(235, 47, 150, 0.08);
                    }

                    .salary-input::placeholder {
                        color: #d9d9d9;
                    }

                    .calc-popup {
                        position: absolute;
                        top: calc(100% + 8px);
                        right: 0;
                        z-index: 1000;
                        background: white;
                        border: 1px solid #e8e8e8;
                        border-radius: 8px;
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.05);
                        padding: 10px 12px;
                        min-width: 220px;
                        animation: slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(4px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    .calc-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 6px 0;
                        border-bottom: 1px solid #f5f5f5;
                    }

                    .calc-row:last-child {
                        border-bottom: none;
                    }

                    .calc-label {
                        font-size: 12px;
                        font-weight: 600;
                        color: #8c8c8c;
                    }

                    .calc-value {
                        font-size: 13px;
                        font-weight: 600;
                        color: #262626;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }

                    .action-cell {
                        min-width: 80px;
                    }

                    /* Save button when editing */
                    .save-button-edit.ant-btn {
                        background: white;
                        border: 1.5px solid #eb2f96;
                        border-radius: 8px;
                        font-weight: 500;
                        color: #eb2f96;
                        box-shadow: 0 1px 4px rgba(235, 47, 150, 0.15);
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    }

                    .save-button-edit.ant-btn:hover:not(:disabled) {
                        background: #eb2f96;
                        color: white;
                        border-color: #eb2f96;
                        box-shadow: 0 2px 8px rgba(235, 47, 150, 0.3);
                        transform: translateY(-1px);
                    }

                    .save-button-edit.ant-btn:active:not(:disabled) {
                        transform: translateY(0);
                    }

                    .save-button-edit .anticon {
                        font-size: 13px;
                    }

                    /* Micro-interaction saved indicator - just icon, no text */
                    .save-indicator {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        background: #f6ffed;
                        border: 1px solid #b7eb8f;
                        border-radius: 50%;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .check-icon {
                        font-size: 16px;
                        color: #52c41a;
                    }

                    /* Pulse animation when just saved */
                    .save-indicator.saved-pulse {
                        animation: pulse 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    @keyframes pulse {
                        0%, 100% {
                            transform: scale(1);
                            box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
                        }
                        50% {
                            transform: scale(1.1);
                            box-shadow: 0 0 0 4px rgba(82, 196, 26, 0);
                        }
                    }

                    /* Remove Ant Design default styles */
                    .salary-input.ant-input {
                        padding: 6px 12px;
                    }

                    .salary-input.ant-input:focus {
                        outline: none;
                    }
                `}
            </style>
        </>
    );
};

export default EditableRowHour;