import { Input, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import StructuredListSection from "@/components/common/ui/StructuredListSection";
import ActionButton from "@/components/common/ui/ActionButton";
import type { LocalObjectiveItem } from "./DepartmentMissionDetail";

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

    const items = objectives.map((item, i) => ({
        id: i,
        leading: (
            <span className="min-w-6 h-6 rounded-full bg-gray-50 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
            </span>
        ),
        content: editMode ? (
            <Input.TextArea
                value={item.content}
                onChange={(e) => update(i, e.target.value)}
                placeholder="Nhập nội dung mục tiêu…"
                variant="borderless"
                autoSize={{ minRows: 1, maxRows: 6 }}
                className="w-full !px-2 !py-1 text-sm bg-gray-50 focus:bg-white border border-transparent focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] rounded transition-all"
            />
        ) : (
            <span className="text-sm text-gray-900 leading-relaxed mt-0.5 block">
                {item.content}
            </span>
        ),
        actions: editMode ? (
                            <Popconfirm
                                title="Xoá mục tiêu này?"
                                onConfirm={() => remove(i)}
                                okText="Xoá" cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                            >
                                <ActionButton
                                    variant="danger"
                                    tooltip="Xóa mục tiêu"
                                    icon={<DeleteOutlined />}
                                    className="mt-0.5"
                                    aria-label="Xóa mục tiêu"
                                />
                            </Popconfirm>
        ) : undefined,
    }));

    return (
        <StructuredListSection
            label="Mục tiêu phòng ban"
            count={`${objectives.length} mục tiêu`}
            items={items}
            emptyText="Chưa có mục tiêu nào."
            emptyIcon={null}
            addButtonText={editMode ? "Thêm mục tiêu" : undefined}
            addButtonProps={{
                "data-guide-id": "department-objectives-add-obj-btn",
                onClick: add,
            } as any}
        />
    );
};

export default ObjectivesSection;
