import React from "react";
import { Segmented } from "antd";

export interface TaskSegmentOption<Value extends string = string> {
    label: React.ReactNode;
    value: Value;
    icon?: React.ReactNode;
    disabled?: boolean;
}

interface Props<Value extends string> {
    value: Value;
    onChange: (value: Value) => void;
    options: TaskSegmentOption<Value>[];
    className?: string;
    ariaLabel: string;
}

export const TaskSegmentedControl = <Value extends string>({
    value,
    onChange,
    options,
    className,
    ariaLabel,
}: Props<Value>) => (
    <div className="task-segmented-control" aria-label={ariaLabel}>
        <Segmented
            className={className}
            value={value}
            onChange={(nextValue) => onChange(nextValue as Value)}
            options={options}
        />
    </div>
);

export default TaskSegmentedControl;
