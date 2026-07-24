import React from "react";
import { Drawer, Empty, Tag, Avatar, Spin } from "antd";
import {
    HistoryOutlined,
    ArrowRightOutlined,
    CheckCircleFilled,
    ClockCircleFilled,
    ExclamationCircleFilled,
    RobotOutlined,
    UserOutlined,
    CommentOutlined,
    CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import EvaluationStatusTag from "./EvaluationStatusTag";
import type { IEvaluationHistory } from "@/types/backend";

interface EvaluationHistoryDrawerProps {
    open: boolean;
    onClose: () => void;
    record?: any | null;
    historyData?: IEvaluationHistory[];
    loading?: boolean;
}

const getTimelineDot = (status: string) => {
    switch (status) {
        case "COMPLETED":
            return <CheckCircleFilled className="text-emerald-500 text-base" />;
        case "REVISION_NEEDED":
        case "OVERDUE_EMPLOYEE":
        case "OVERDUE_MANAGER":
        case "OVERDUE_APPROVAL":
            return <ExclamationCircleFilled className="text-rose-500 text-base" />;
        case "PENDING_MANAGER_REVIEW":
        case "PENDING_APPROVAL":
            return <ClockCircleFilled className="text-amber-500 text-base" />;
        default:
            return <ClockCircleFilled className="text-blue-500 text-base" />;
    }
};

const getRoleBadge = (username?: string, fullName?: string) => {
    if (!username && !fullName) return null;
    const nameLower = (fullName || username || "").toLowerCase();
    if (nameLower.includes("gián tiếp") || nameLower.includes("trưởng bộ phận")) {
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60">Cấp duyệt</span>;
    }
    if (nameLower.includes("trực tiếp") || nameLower.includes("quản lý")) {
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">Quản lý</span>;
    }
    if (nameLower.includes("nhân viên")) {
        return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Nhân viên</span>;
    }
    return null;
};

const EvaluationHistoryDrawer: React.FC<EvaluationHistoryDrawerProps> = ({
    open,
    onClose,
    record,
    historyData = [],
    loading = false,
}) => {
    const employeeName = record?.employee?.fullName || record?.employee?.username || "Nhân viên";
    const departmentName = record?.employee?.department?.departmentName || record?.departmentName || "";
    const periodName = record?.period?.periodName || record?.periodName || "";
    const latestStatus = record?.status || historyData[0]?.toStatus;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={540}
            destroyOnClose
            styles={{
                header: { padding: "16px 24px", borderBottom: "1px solid #f1f5f9" },
                body: { padding: "20px 24px", backgroundColor: "#f8f9fb" },
            }}
            title={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#e8256b]/10 text-[#e8256b] flex items-center justify-center text-lg font-semibold shrink-0">
                        <HistoryOutlined />
                    </div>
                    <div>
                        <h3 className="m-0 text-base font-bold text-slate-900 tracking-tight">Lịch sử tiến trình đánh giá</h3>
                        <p className="m-0 text-xs text-slate-500 font-normal">Theo dõi các bước xử lý và chuyển trạng thái</p>
                    </div>
                </div>
            }
        >
            {/* Header info banner */}
            {record && (
                <div className="bg-white rounded-xl border border-slate-200/90 p-4 mb-6 shadow-2xs">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Avatar
                                size={40}
                                icon={<UserOutlined />}
                                className="bg-[#e8256b] text-white font-bold shrink-0"
                            >
                                {employeeName.charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 m-0">{employeeName}</h4>
                                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                    {departmentName && <span>{departmentName}</span>}
                                    {departmentName && periodName && <span>•</span>}
                                    {periodName && <span>{periodName}</span>}
                                </div>
                            </div>
                        </div>

                        {latestStatus && (
                            <div className="text-right shrink-0">
                                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">Hiện tại</div>
                                <EvaluationStatusTag status={latestStatus} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Timeline Body */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                    <Spin size="large" />
                    <span className="text-xs">Đang tải lịch sử xử lý...</span>
                </div>
            ) : historyData.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử xử lý cho bản đánh giá này" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                        <span>CÁC BƯỚC XỬ LÝ ({historyData.length})</span>
                        <span className="text-[11px] font-normal text-slate-400">Mới nhất xếp trên</span>
                    </div>

                    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                        {historyData.map((item, idx) => {
                            const isSystem = !item.performedBy || item.performedBy.username === "system";
                            const actorName = isSystem
                                ? "Hệ thống"
                                : item.performedBy?.fullName || item.performedBy?.username || "Người dùng";
                            const formattedTime = item.performedAt
                                ? dayjs(item.performedAt).format("HH:mm • DD/MM/YYYY")
                                : "—";

                            return (
                                <div key={item.id || idx} className="relative group">
                                    {/* Dot Marker */}
                                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white flex items-center justify-center z-10 shadow-2xs">
                                        {getTimelineDot(item.toStatus)}
                                    </div>

                                    {/* Card */}
                                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
                                        {/* Actor & Time */}
                                        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                {isSystem ? (
                                                    <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs">
                                                        <RobotOutlined />
                                                    </div>
                                                ) : (
                                                    <Avatar size={24} className="bg-slate-700 text-white text-[11px] font-bold">
                                                        {actorName.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                )}

                                                <span className="text-xs font-bold text-slate-800">{actorName}</span>
                                                {isSystem ? (
                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60">Tự động</span>
                                                ) : (
                                                    getRoleBadge(item.performedBy?.username, item.performedBy?.fullName)
                                                )}
                                            </div>

                                            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                                                <CalendarOutlined className="text-[10px]" />
                                                {formattedTime}
                                            </span>
                                        </div>

                                        {/* Status Transition Box */}
                                        <div className="bg-slate-50/90 rounded-lg border border-slate-200/60 p-2.5 flex items-center justify-between gap-2">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Từ trạng thái</span>
                                                {item.fromStatus ? (
                                                    <EvaluationStatusTag status={item.fromStatus} />
                                                ) : (
                                                    <Tag className="m-0 border-slate-200 bg-slate-100 text-slate-500 font-medium text-[11px]">Khởi tạo</Tag>
                                                )}
                                            </div>

                                            <div className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                                                <ArrowRightOutlined className="text-xs" />
                                            </div>

                                            <div className="flex flex-col gap-0.5 text-right">
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Sang trạng thái</span>
                                                <EvaluationStatusTag status={item.toStatus} />
                                            </div>
                                        </div>

                                        {/* Note / System Message */}
                                        {item.note && (
                                            <div className="mt-3 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
                                                <CommentOutlined className="text-amber-600 text-sm shrink-0 mt-0.5" />
                                                <div className="leading-relaxed font-normal">{item.note}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default EvaluationHistoryDrawer;
