import type { ReactNode } from "react";
import dayjs from "dayjs";
import {
    ApartmentOutlined,
    CalendarOutlined,
    FileTextOutlined,
    LinkOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons";
import type { IJobDescription } from "@/types/backend";

interface Props {
    jd: IJobDescription & { companyName?: string; departmentName?: string; jobTitleName?: string };
    statusInfo?: { label: string; color: string; bg: string; border: string } | null;
}

interface DetailRowProps {
    icon: ReactNode;
    label: string;
    value?: ReactNode;
    last?: boolean;
}

const DetailRow = ({ icon, label, value, last = false }: DetailRowProps) => (
    <div className={`grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-4 ${last ? "" : "border-b border-gray-100"}`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff3f5] text-[16px] text-[#e8637a]">
            {icon}
        </span>
        <div className="min-w-0 self-center">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-gray-400">{label}</div>
            <div className="break-words text-[15px] font-semibold leading-6 text-gray-900">{value || "—"}</div>
        </div>
    </div>
);

const Tab1General = ({ jd, statusInfo }: Props) => (
    <div className="space-y-6">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(18rem,0.82fr)_minmax(28rem,1.18fr)]">
            <section className="overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(148,80,96,0.06)]">
                <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <span className="h-4 w-1 rounded-full bg-[#e8637a]" />
                        <h3 className="m-0 text-[15px] font-semibold text-gray-950">Thông tin hồ sơ</h3>
                    </div>
                    <p className="mb-0 mt-1.5 pl-3 text-xs leading-5 text-gray-400">Thông tin nhận diện và hiệu lực của JD</p>
                </div>

                <div className="px-5 sm:px-6">
                    <DetailRow
                        icon={<FileTextOutlined />}
                        label="Mã JD"
                        value={<span className="font-mono tabular-nums text-[#d94c66]">{jd.code ?? "—"}</span>}
                    />
                    <DetailRow
                        icon={<LinkOutlined />}
                        label="Trạng thái"
                        value={statusInfo ? (
                            <span
                                className="inline-flex rounded-md border px-2.5 py-0.5 text-xs font-semibold"
                                style={{
                                    color: statusInfo.color,
                                    background: statusInfo.bg,
                                    borderColor: statusInfo.border,
                                }}
                            >
                                {statusInfo.label}
                            </span>
                        ) : "—"}
                    />
                    <DetailRow
                        icon={<CalendarOutlined />}
                        label="Ngày hiệu lực"
                        value={jd.effectiveDate ? dayjs(jd.effectiveDate).format("DD/MM/YYYY") : "—"}
                        last
                    />
                </div>
            </section>

            <section className="overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(148,80,96,0.06)]">
                <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <span className="h-4 w-1 rounded-full bg-[#e8637a]" />
                        <h3 className="m-0 text-[15px] font-semibold text-gray-950">Quan hệ công việc</h3>
                    </div>
                    <p className="mb-0 mt-1.5 pl-3 text-xs leading-5 text-gray-400">Tuyến báo cáo, đơn vị trực thuộc và phạm vi phối hợp</p>
                </div>

                <div className="px-5 sm:px-6">
                    <DetailRow icon={<UserOutlined />} label="Cấp quản lý trực tiếp" value={jd.reportTo} />
                    <DetailRow icon={<ApartmentOutlined />} label="Trực thuộc bộ phận" value={jd.belongsTo} />
                    <DetailRow icon={<TeamOutlined />} label="Phối hợp công tác với" value={jd.collaborateWith} last />
                </div>
            </section>
        </div>

        {jd.positions && jd.positions.length > 0 ? (
            <section className="rounded-xl bg-white px-5 py-5 shadow-[0_8px_24px_rgba(148,80,96,0.06)] sm:px-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-4 w-1 rounded-full bg-[#e8637a]" />
                            <h3 className="m-0 text-[15px] font-semibold text-gray-950">Vị trí trong sơ đồ</h3>
                        </div>
                        <p className="mb-0 mt-1.5 pl-3 text-xs leading-5 text-gray-400">Các vị trí đang áp dụng mô tả công việc này</p>
                    </div>
                    <span className="text-xs font-medium text-gray-400">{jd.positions.length} vị trí</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {jd.positions.map((position, index) => (
                        <div
                            key={`${position.nodeId}-${index}`}
                            className="flex min-w-0 items-center gap-3 rounded-lg border border-[#f7dfe5] bg-[#fff8fa] px-4 py-3 transition-colors duration-200 hover:border-[#e8637a]/50 hover:bg-[#fff3f6]"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#e8637a] shadow-sm">
                                <ApartmentOutlined />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-gray-900">
                                    {position.nodeName ?? `Node #${position.nodeId}`}
                                </div>
                                {position.levelCode ? (
                                    <div className="mt-0.5 text-xs font-medium text-[#c94d66]">Cấp {position.levelCode}</div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        ) : null}
    </div>
);

export default Tab1General;
