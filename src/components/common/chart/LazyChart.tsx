import React, { lazy, memo, Suspense } from "react";
import { Skeleton } from "antd";

const PieChart = lazy(() => import("@ant-design/charts").then(m => ({ default: m.Pie })));
const ColumnChart = lazy(() => import("@ant-design/charts").then(m => ({ default: m.Column })));
const RadarChart = lazy(() => import("@ant-design/charts").then(m => ({ default: m.Radar })));
const BarChart = lazy(() => import("@ant-design/charts").then(m => ({ default: m.Bar })));

export const Pie = memo((props: any) => (
    <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
        <PieChart {...props} />
    </Suspense>
));

export const Column = memo((props: any) => (
    <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
        <ColumnChart {...props} />
    </Suspense>
));

export const Radar = memo((props: any) => (
    <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
        <RadarChart {...props} />
    </Suspense>
));

export const Bar = memo((props: any) => (
    <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
        <BarChart {...props} />
    </Suspense>
));
