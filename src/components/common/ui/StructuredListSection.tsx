import type { CSSProperties, ReactNode } from "react";
import { Button } from "antd";
import type { ButtonProps } from "antd";
import { OrderedListOutlined, PlusOutlined } from "@ant-design/icons";

type StructuredListItem = {
    id: string | number;
    content: ReactNode;
    leading?: ReactNode;
    actions?: ReactNode;
    meta?: ReactNode;
    selected?: boolean;
    draggable?: boolean;
    dragOver?: boolean;
    onClick?: () => void;
    onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
};

interface StructuredListSectionProps {
    label: string;
    count?: string | number;
    items: StructuredListItem[];
    emptyText: ReactNode;
    emptyIcon?: ReactNode;
    headerAction?: ReactNode;
    addButtonText?: string;
    addButtonProps?: ButtonProps;
    className?: string;
    style?: CSSProperties;
}

const ACCENT = "#e8637a";

const defaultEmptyIcon = (
    <OrderedListOutlined style={{ fontSize: 28, marginBottom: 8, display: "block", color: "#cbd5e1" }} />
);

const StructuredListSection = ({
    label,
    count,
    items,
    emptyText,
    emptyIcon = defaultEmptyIcon,
    headerAction,
    addButtonText,
    addButtonProps,
    className,
    style,
}: StructuredListSectionProps) => {
    return (
        <div className={className} style={style}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1 h-4 rounded-sm bg-[#e8637a] inline-block shrink-0" />
                    <span className="text-[11px] font-bold tracking-[.08em] uppercase text-gray-500 truncate">
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {count !== undefined && (
                        <span className="text-xs text-gray-400">{count}</span>
                    )}
                    {headerAction}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-[13px] bg-white rounded-lg border border-dashed border-gray-200">
                        {emptyIcon}
                        {emptyText}
                    </div>
                ) : (
                    items.map((item) => {
                        const borderColor = item.selected ? ACCENT : item.dragOver ? "#f9a8b8" : "#f3f4f6";
                        const background = item.selected ? "#fff5f7" : item.dragOver ? "#fff1f4" : "#ffffff";

                        return (
                            <div
                                key={item.id}
                                draggable={item.draggable}
                                onClick={item.onClick}
                                onDragStart={item.onDragStart}
                                onDragOver={item.onDragOver}
                                onDragLeave={item.onDragLeave}
                                onDrop={item.onDrop}
                                onDragEnd={item.onDragEnd}
                                className="flex items-start gap-3 rounded-lg p-3 sm:px-4 shadow-sm hover:shadow-md transition-shadow"
                                style={{
                                    background,
                                    border: `1px solid ${borderColor}`,
                                    cursor: item.draggable ? "grab" : item.onClick ? "pointer" : "default",
                                }}
                            >
                                {item.leading}
                                <div className="flex-1 min-w-0">
                                    {item.content}
                                    {item.meta && (
                                        <div className="mt-1 text-xs text-gray-400">
                                            {item.meta}
                                        </div>
                                    )}
                                </div>
                                {item.actions && (
                                    <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
                                        {item.actions}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {addButtonText && (
                    <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        block
                        className="mt-1 h-10 text-gray-500 border-gray-300 hover:text-blue-500 hover:border-blue-500"
                        {...addButtonProps}
                    >
                        {addButtonText}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default StructuredListSection;
