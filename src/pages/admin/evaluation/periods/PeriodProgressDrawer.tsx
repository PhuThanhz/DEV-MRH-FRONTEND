import { lazy, Suspense } from "react";
import { Skeleton } from "antd";

import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";

const PeriodProgressDashboard = lazy(() => import("@/pages/evaluation/process/PeriodProgressDashboard"));

interface PeriodProgressDrawerProps {
    open: boolean;
    periodId?: number;
    onClose: () => void;
}

const PeriodProgressDrawer = ({ open, periodId, onClose }: PeriodProgressDrawerProps) => (
    <LotusDetailDrawer
        open={open}
        onClose={onClose}
        destroyOnClose
        maskClosable={false}
        closeAriaLabel="Đóng tiến độ kỳ đánh giá"
    >
        <div style={{ height: "100%", overflow: "auto", overscrollBehavior: "contain", background: "#f8fafc" }}>
            {open && periodId ? (
                <Suspense
                    fallback={(
                        <div style={{ padding: "28px 32px" }}>
                            <Skeleton active paragraph={{ rows: 8 }} />
                        </div>
                    )}
                >
                    <PeriodProgressDashboard periodIdOverride={periodId} onClose={onClose} />
                </Suspense>
            ) : null}
        </div>
    </LotusDetailDrawer>
);

export default PeriodProgressDrawer;
