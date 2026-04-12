export interface FilterOption {
    label: string;
    value: any;
    color?: string;
}

export interface FilterField {
    key: string;
    label: string;
    icon?: React.ReactNode;
    options?: FilterOption[];
    dependsOn?: string;
    asyncOptions?: (dependValue: any) => Promise<FilterOption[]>;
    searchable?: boolean;
}