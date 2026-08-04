import type { IJobDescription } from "@/types/backend";
import StructuredListSection from "@/components/common/ui/StructuredListSection";

interface Props {
    tasks?: IJobDescription["tasks"];
}

const Tab3Tasks = ({ tasks }: Props) => {
    const sortedTasks = tasks?.slice().sort((a, b) => a.orderNo - b.orderNo) ?? [];
    const items = sortedTasks.map((task, index) => {
        const sortedSubItems = task.items?.slice().sort((a, b) => a.orderNo - b.orderNo) ?? [];
        return {
            id: task.id ?? `${task.orderNo}-${index}`,
            leading: (
                <span className="mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#fff0f3] text-xs font-bold text-[#e8637a]">
                    {index + 1}
                </span>
            ),
            content: (
                <div className="min-w-0">
                    {task.title ? (
                        <div className="mb-1 text-sm font-semibold leading-5 text-gray-950">{task.title}</div>
                    ) : null}
                    {sortedSubItems.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            {sortedSubItems.map((item, subIndex) => (
                                <div key={item.id ?? subIndex} className="flex items-start gap-2 text-sm leading-6 text-gray-700">
                                    <span className="shrink-0 font-medium text-gray-500">
                                        {index + 1}.{subIndex + 1}
                                    </span>
                                    <span>{item.content}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm leading-6 text-gray-400">Chưa có nội dung</div>
                    )}
                </div>
            ),
        };
    });

    return (
        <StructuredListSection
            label="Mô tả công việc"
            count={`${sortedTasks.length} nhiệm vụ`}
            items={items}
            emptyText="Chưa có nhiệm vụ nào."
        />
    );
};

export default Tab3Tasks;
