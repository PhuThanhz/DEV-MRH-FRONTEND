import { Button, Input, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { LocalAuthorityItem } from "./DepartmentMissionDetail";
import ActionButton from "@/components/common/ui/ActionButton";

const ACCENT = "#e8637a";

interface Props {
    authorities: LocalAuthorityItem[];
    editMode: boolean;
    onChange: (items: LocalAuthorityItem[]) => void;
}

const AuthoritiesSection = ({ authorities, editMode, onChange }: Props) => {
    if (authorities.length === 0 && !editMode) return null;

    const update = (i: number, v: string) => {
        const list = [...authorities];
        list[i] = { ...list[i], content: v };
        onChange(list);
    };

    const add = () =>
        onChange([...authorities, { content: "", orderNo: authorities.length + 1 }]);

    const remove = (i: number) =>
        onChange(authorities.filter((_, idx) => idx !== i));

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="w-1 h-4 rounded-sm bg-[#e8637a] inline-block" />
                    <span className="text-[11px] font-bold tracking-[.08em] uppercase text-gray-500">
                        Quyền hạn
                    </span>
                </div>
                <span className="text-xs text-gray-400">
                    {authorities.length} quyền hạn
                </span>
            </div>

            <div className="flex flex-col gap-3">
                {authorities.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white border border-gray-100 rounded-lg p-3 sm:px-4 shadow-sm hover:shadow-md transition-shadow">
                        <span className="min-w-6 h-6 rounded-full bg-gray-50 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                        </span>
                        {editMode ? (
                            <Input.TextArea
                                value={item.content}
                                onChange={(e) => update(i, e.target.value)}
                                placeholder="Nhập nội dung quyền hạn…"
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
                                title="Xoá quyền hạn này?"
                                onConfirm={() => remove(i)}
                                okText="Xoá" cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                            >
                                <ActionButton
                                    variant="danger"
                                    tooltip="Xóa quyền hạn"
                                    icon={<DeleteOutlined />}
                                    className="mt-0.5"
                                    aria-label="Xóa quyền hạn"
                                />
                            </Popconfirm>
                        )}
                    </div>
                ))}

                {editMode && (
                    <Button
                        type="dashed" icon={<PlusOutlined />}
                        onClick={add} block
                        className="mt-1 h-10 text-gray-500 border-gray-300 hover:text-blue-500 hover:border-blue-500"
                    >
                        Thêm quyền hạn
                    </Button>
                )}
            </div>
        </div>
    );
};

export default AuthoritiesSection;
