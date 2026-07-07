import { Button, Input, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { LocalObjectiveItem } from "./DepartmentMissionDetail";

const ACCENT = "#e8637a";

function SectionHeader({ label, count }: { label: string; count: string }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-sm bg-[#e8637a] inline-block" />
                <span className="text-[11px] font-bold tracking-[.08em] uppercase text-gray-500">
                    {label}
                </span>
            </div>
            <span className="text-xs text-gray-400">{count}</span>
        </div>
    );
}

interface Props {
    objectives: LocalObjectiveItem[];
    editMode: boolean;
    onChange: (items: LocalObjectiveItem[]) => void;
}

const ObjectivesSection = ({ objectives, editMode, onChange }: Props) => {
    const update = (i: number, v: string) => {
        const list = [...objectives];
        list[i] = { ...list[i], content: v };
        onChange(list);
    };

    const add = () =>
        onChange([...objectives, { content: "", orderNo: objectives.length + 1 }]);

    const remove = (i: number) =>
        onChange(objectives.filter((_, idx) => idx !== i));

    return (
        <div>
            <SectionHeader
                label="Mục tiêu phòng ban"
                count={`${objectives.length} mục tiêu`}
            />

            <div className="flex flex-col gap-3">
                {objectives.length === 0 && !editMode && (
                    <div className="text-center py-5 text-gray-400 text-[13px] italic bg-white rounded-lg border border-dashed border-gray-200">
                        Chưa có mục tiêu nào.
                    </div>
                )}

                {objectives.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white border border-gray-100 rounded-lg p-3 sm:px-4 shadow-sm hover:shadow-md transition-shadow">
                        <span className="min-w-6 h-6 rounded-full bg-gray-50 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                        </span>
                        {editMode ? (
                            <Input.TextArea
                                value={item.content}
                                onChange={(e) => update(i, e.target.value)}
                                placeholder="Nhập nội dung mục tiêu…"
                                variant="borderless"
                                autoSize={{ minRows: 1, maxRows: 6 }}
                                className="flex-1 !px-2 !py-1 text-sm bg-gray-50 focus:bg-white border border-transparent focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] rounded transition-all"
                            />
                        ) : (
                            <span className="flex-1 text-sm text-gray-900 leading-relaxed mt-0.5">
                                {item.content}
                            </span>
                        )}
                        {editMode && (
                            <Popconfirm
                                title="Xoá mục tiêu này?"
                                onConfirm={() => remove(i)}
                                okText="Xoá" cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    type="text" danger size="small"
                                    icon={<DeleteOutlined />}
                                    className="mt-0.5"
                                />
                            </Popconfirm>
                        )}
                    </div>
                ))}

                {editMode && (
                    <Button
                        data-guide-id="department-objectives-add-obj-btn"
                        type="dashed" icon={<PlusOutlined />}
                        onClick={add} block
                        className="mt-1 h-10 text-gray-500 border-gray-300 hover:text-blue-500 hover:border-blue-500"
                    >
                        Thêm mục tiêu
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ObjectivesSection;