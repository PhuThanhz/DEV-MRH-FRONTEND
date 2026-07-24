import React, { memo, Component } from "react";
import { Empty } from "antd";
import { Pie as AntPie, Column as AntColumn, Radar as AntRadar, Bar as AntBar } from "@ant-design/charts";

class ChartErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any) {
        console.warn("Suppressed Ant Design Charts internal error:", error?.message);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không thể hiển thị biểu đồ" />
                </div>
            );
        }
        return this.props.children;
    }
}

const hasData = (props: any) => {
    return Array.isArray(props?.data) && props.data.length > 0;
};

const EmptyChartState = () => (
    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu biểu đồ" />
    </div>
);

export const Pie = memo((props: any) => {
    if (!hasData(props)) return <EmptyChartState />;
    return (
        <ChartErrorBoundary>
            <AntPie key={props.data?.length ?? 0} {...props} />
        </ChartErrorBoundary>
    );
});

export const Column = memo((props: any) => {
    if (!hasData(props)) return <EmptyChartState />;
    return (
        <ChartErrorBoundary>
            <AntColumn key={props.data?.length ?? 0} {...props} />
        </ChartErrorBoundary>
    );
});

export const Radar = memo((props: any) => {
    if (!hasData(props)) return <EmptyChartState />;
    return (
        <ChartErrorBoundary>
            <AntRadar key={props.data?.length ?? 0} {...props} />
        </ChartErrorBoundary>
    );
});

export const Bar = memo((props: any) => {
    if (!hasData(props)) return <EmptyChartState />;
    return (
        <ChartErrorBoundary>
            <AntBar key={props.data?.length ?? 0} {...props} />
        </ChartErrorBoundary>
    );
});
