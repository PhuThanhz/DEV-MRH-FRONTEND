import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, DatePicker, Divider, Form, Input, Modal, Skeleton, Space, Tag, Timeline, Typography, Select } from "antd";
import { EditOutlined, SaveOutlined, FileAddOutlined, HistoryOutlined, PlusCircleOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import {
    useDepartmentObjectivesQuery,
    useCreateDepartmentObjectiveMutation,
    usePublishDepartmentObjectiveMutation,
    useDepartmentMissionVersionsQuery,
} from "@/hooks/useDepartmentObjectives";
import { useSectionsQuery } from "@/hooks/useSections";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { notify } from "@/components/common/notification/notify";

import ObjectivesSection from "./ObjectivesSection";
import TasksSection from "./TasksSection";
import AuthoritiesSection from "./AuthoritiesSection";
import type { IDepartmentMissionTree, IDepartmentMissionVersion } from "@/types/backend";

const { Text } = Typography;

export interface LocalObjectiveItem {
    id?: number
    content: string
    orderNo: number
    createdBy?: string
    updatedBy?: string
    createdAt?: string
    updatedAt?: string
}

export interface LocalTaskItem {
    id?: number
    content: string
    orderNo: number
    createdBy?: string
    updatedBy?: string
    createdAt?: string
    updatedAt?: string
}

export interface LocalSectionTask {
    sectionId: number
    sectionName: string
    items: LocalTaskItem[]
}

export interface LocalAuthorityItem {
    id?: number
    content: string
    orderNo: number
    createdBy?: string
    updatedBy?: string
    createdAt?: string
    updatedAt?: string
}

const ACCENT = "#e8637a";

const normalizeMissionSnapshot = (mission?: IDepartmentMissionTree) => JSON.stringify({
    issueDate: mission?.issueDate || null,
    objectives: (mission?.objectives || []).map((item, index) => ({
        id: item.id,
        content: item.content || "",
        orderNo: item.orderNo || index + 1,
    })),
    sections: (mission?.tasks || []).map((section) => ({
        sectionId: section.sectionId,
        items: (section.tasks || []).map((item, index) => ({
            id: item.id,
            content: item.content || "",
            orderNo: item.orderNo || index + 1,
        })),
    })),
    generalTasks: (mission?.generalTasks || []).map((item, index) => ({
        id: item.id,
        content: item.content || "",
        orderNo: item.orderNo || index + 1,
    })),
    authorities: (mission?.authorities || []).map((item, index) => ({
        id: item.id,
        content: item.content || "",
        orderNo: item.orderNo || index + 1,
    })),
});

export interface DepartmentMissionDetailProps {
    departmentId?: number;
    departmentName?: string;
    startInEditMode?: boolean;
    editModeSignal?: number;
    showEditAction?: boolean;
    showHistoryAction?: boolean;
    showVersionAction?: boolean;
    openVersionModalSignal?: number;
    prepareVersionAfterSaveSignal?: number;
    onDirtyChange?: (dirty: boolean) => void;
}

const DepartmentMissionDetail: React.FC<DepartmentMissionDetailProps> = ({
    departmentId,
    departmentName: externalDeptName,
    startInEditMode = false,
    editModeSignal,
    showEditAction = true,
    showHistoryAction = true,
    showVersionAction = true,
    openVersionModalSignal,
    prepareVersionAfterSaveSignal,
    onDirtyChange,
}) => {

    const { data, isLoading, error } = useDepartmentObjectivesQuery(departmentId);
    const { data: versionHistory = [], isFetching: isLoadingVersions } = useDepartmentMissionVersionsQuery(departmentId);
    const { data: sectionData } = useSectionsQuery(
        `page=1&size=100&filter=department.id:${departmentId}`
    );

    useEffect(() => {
        if (error) {
            notify.error((error as any)?.message || "Không thể tải dữ liệu mục tiêu phòng ban");
        }
    }, [error]);
    
    const { mutateAsync: createObjective, isPending } = useCreateDepartmentObjectiveMutation();
    const { mutateAsync: publishObjective, isPending: isPublishing } = usePublishDepartmentObjectiveMutation();

    const mission: IDepartmentMissionTree | undefined = data;

    const [objectives, setObjectives] = useState<LocalObjectiveItem[]>([]);
    const [sections, setSections] = useState<LocalSectionTask[]>([]);
    const [generalTasks, setGeneralTasks] = useState<LocalTaskItem[]>([]);
    const [authorities, setAuthorities] = useState<LocalAuthorityItem[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [issueDate, setIssueDate] = useState<Dayjs | null>(null);
    const [status, setStatus] = useState<string>("PUBLISHED");
    const [historyOpen, setHistoryOpen] = useState(false);
    const [versionListOpen, setVersionListOpen] = useState(false);
    const [versionOpen, setVersionOpen] = useState(false);
    const [previewVersion, setPreviewVersion] = useState<IDepartmentMissionVersion | null>(null);
    const [versionAfterSaveMode, setVersionAfterSaveMode] = useState(false);
    const [versionForm] = Form.useForm();
    const handledVersionSignalRef = useRef<number | undefined>(undefined);
    const handledPrepareVersionSignalRef = useRef<number | undefined>(undefined);

    const hasSections = mission?.hasSections ?? false;
    const hasMissionContent =
        objectives.length > 0 || generalTasks.length > 0 || sections.some((section) => section.items.length > 0) || authorities.length > 0;
    const missionSnapshot = useMemo(() => normalizeMissionSnapshot(mission), [mission]);
    const localSnapshot = useMemo(() => JSON.stringify({
        issueDate: issueDate ? issueDate.format("YYYY-MM-DD") : null,
        status,
        objectives: objectives.map((item, index) => ({
            id: item.id,
            content: item.content || "",
            orderNo: item.orderNo || index + 1,
        })),
        sections: sections.map((section) => ({
            sectionId: section.sectionId,
            items: section.items.map((item, index) => ({
                id: item.id,
                content: item.content || "",
                orderNo: item.orderNo || index + 1,
            })),
        })),
        generalTasks: generalTasks.map((item, index) => ({
            id: item.id,
            content: item.content || "",
            orderNo: item.orderNo || index + 1,
        })),
        authorities: authorities.map((item, index) => ({
            id: item.id,
            content: item.content || "",
            orderNo: item.orderNo || index + 1,
        })),
    }), [authorities, generalTasks, issueDate, status, objectives, sections]);
    const hasUnsavedChanges = editMode && localSnapshot !== missionSnapshot;

    const departmentName = useMemo(() => {
        return externalDeptName || mission?.department?.name || "";
    }, [externalDeptName, mission]);

    const previewSnapshot = useMemo(() => {
        if (!previewVersion?.snapshotJson) return null;
        try {
            return JSON.parse(previewVersion.snapshotJson) as {
                departmentName?: string;
                issueDate?: string;
                objectives?: Array<{ content?: string }>;
                generalTasks?: Array<{ content?: string }>;
                sectionTasks?: Array<{
                    sectionName?: string;
                    tasks?: Array<{ content?: string }>;
                }>;
                authorities?: Array<{ content?: string }>;
            };
        } catch {
            return null;
        }
    }, [previewVersion]);

    const renderSnapshotList = (title: string, items?: Array<{ content?: string }>) => (
        <div>
            <div className="mb-2 text-[12px] font-semibold uppercase text-gray-500">{title}</div>
            {items && items.length > 0 ? (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={`${title}-${index}`} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-[13px] text-gray-800">
                            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-gray-500">
                                {index + 1}
                            </span>
                            {item.content || "Chưa có nội dung"}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-400">
                    Chưa có nội dung.
                </div>
            )}
        </div>
    );

    const historyEvents = useMemo(() => {
        if (!mission) return [];

        const events: Array<{
            key: string;
            color: "green" | "blue";
            label: string;
            time?: string;
            user?: string;
            meta?: string;
        }> = [];

        if (mission.lastUpdatedAt || mission.lastUpdatedByName) {
            events.push({
                key: "updated",
                color: "blue",
                label: "Chỉnh sửa nội dung",
                time: mission.lastUpdatedAt,
                user: mission.lastUpdatedByName || String(mission.lastUpdatedBy),
                meta: mission.issueDate ? `Ngày ban hành ${dayjs(mission.issueDate).format("DD/MM/YYYY")}` : undefined,
            });
        }

        return events;
    }, [mission]);

    useEffect(() => {
        if (onDirtyChange) {
            onDirtyChange(hasUnsavedChanges);
        }
    }, [hasUnsavedChanges, onDirtyChange]);

    useEffect(() => {
        setEditMode(startInEditMode);
        if (!startInEditMode) {
            setVersionAfterSaveMode(false);
        }
    }, [departmentId, startInEditMode]);

    useEffect(() => {
        if (editModeSignal && showEditAction) {
            setEditMode(true);
        }
    }, [editModeSignal, showEditAction]);

    useEffect(() => {
        if (!prepareVersionAfterSaveSignal || handledPrepareVersionSignalRef.current === prepareVersionAfterSaveSignal) {
            return;
        }

        if (isLoading) {
            return;
        }

        handledPrepareVersionSignalRef.current = prepareVersionAfterSaveSignal;
        setVersionOpen(false);
        setVersionAfterSaveMode(true);
        setEditMode(true);
        notify.info("Cập nhật nội dung trước, sau đó lưu để tạo version mới.");
    }, [prepareVersionAfterSaveSignal, isLoading]);

    const prepareVersionForm = () => {
        versionForm.setFieldsValue({
            title: `Version ${(mission?.version ?? 0) + 1}`,
            effectiveDate: issueDate || dayjs(),
            changeSummary: "",
        });
    };

    useEffect(() => {
        if (!openVersionModalSignal || handledVersionSignalRef.current === openVersionModalSignal) {
            return;
        }

        if (isLoading) {
            return;
        }

        handledVersionSignalRef.current = openVersionModalSignal;

        if (editMode) {
            notify.warning("Vui lòng lưu thay đổi trước khi tạo version.");
            return;
        }

        if (!hasMissionContent) {
            notify.warning("Phòng ban chưa có nội dung để tạo version.");
            return;
        }

        prepareVersionForm();
        setVersionOpen(true);
    }, [openVersionModalSignal, hasMissionContent, editMode, isLoading, issueDate, mission?.version, versionForm]);

    const resetLocalStateFromMission = () => {
        if (!mission) {
            setObjectives([]);
            setSections([]);
            setGeneralTasks([]);
            setAuthorities([]);
            setIssueDate(null);
            setStatus("PUBLISHED");
            return;
        }

        setObjectives(
            mission.objectives?.map((o, i) => ({
                id: o.id,
                content: o.content,
                orderNo: o.orderNo || (i + 1),
                createdBy: o.createdBy,
                updatedBy: o.updatedBy,
                createdAt: o.createdAt,
                updatedAt: o.updatedAt,
            })) || []
        );

        if (mission.issueDate) setIssueDate(dayjs(mission.issueDate));
        else setIssueDate(null);
        
        if (mission.status) setStatus(mission.status);
        else setStatus("PUBLISHED");

        setAuthorities(
            mission.authorities?.map((a, i) => ({
                id: a.id,
                content: a.content,
                orderNo: a.orderNo || (i + 1),
                createdBy: a.createdBy,
                updatedBy: a.updatedBy,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
            })) || []
        );

        if (mission.hasSections) {
            const missionTasks = mission.tasks || [];
            setSections(
                missionTasks.map((sec) => ({
                    sectionId: sec.sectionId,
                    sectionName: sec.sectionName,
                    items: sec.tasks?.map((t, i) => ({
                        id: t.id,
                        content: t.content,
                        orderNo: t.orderNo || (i + 1),
                        createdBy: t.createdBy,
                        updatedBy: t.updatedBy,
                        createdAt: t.createdAt,
                        updatedAt: t.updatedAt,
                    })) || [],
                }))
            );
        } else {
            setSections([]);
        }

        setGeneralTasks(
            mission.generalTasks?.map((t, i) => ({
                id: t.id,
                content: t.content,
                orderNo: t.orderNo || (i + 1),
                createdBy: t.createdBy,
                updatedBy: t.updatedBy,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            })) || []
        );
    };

    useEffect(() => {
        resetLocalStateFromMission();
    }, [mission, sectionData]);

    const handleSave = async () => {
        if (!departmentId) return;

        if (!hasUnsavedChanges) {
            setEditMode(false);
            if (versionAfterSaveMode) {
                setVersionAfterSaveMode(false);
                prepareVersionForm();
                setVersionOpen(true);
                return;
            }
            notify.info("Không có thay đổi mới để lưu.");
            return;
        }

        try {
            await createObjective({
                departmentId: departmentId,
                issueDate: issueDate ? issueDate.format("YYYY-MM-DD") : undefined,
                status,
                objectives,
                tasks: [
                    ...(hasSections ? sections.map((s) => ({ sectionId: s.sectionId, items: s.items })) : []),
                    { sectionId: undefined, items: generalTasks }
                ],
                authorities,
            } as any);
            setEditMode(false);
            if (versionAfterSaveMode) {
                setVersionAfterSaveMode(false);
                prepareVersionForm();
                setVersionOpen(true);
            }
        } catch {
            // lỗi đã xử lý trong hook
        }
    };

    const handlePublish = async () => {
        if (!departmentId) return;
        try {
            const values = await versionForm.validateFields();
            await publishObjective({
                departmentId,
                title: values.title,
                changeSummary: values.changeSummary,
                effectiveDate: values.effectiveDate ? values.effectiveDate.format("YYYY-MM-DD") : undefined,
            });
            setVersionOpen(false);
            versionForm.resetFields();
            setVersionAfterSaveMode(false);
        } catch {
            // lỗi đã xử lý trong hook
        }
    };

    const openVersionModal = () => {
        if (editMode) {
            notify.warning("Vui lòng lưu thay đổi trước khi tạo version.");
            return;
        }

        if (!hasMissionContent) {
            notify.warning("Phòng ban chưa có nội dung để tạo version.");
            return;
        }

        prepareVersionForm();
        setVersionOpen(true);
    };

    if (!departmentId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#f8f9fb] text-gray-400 select-none">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e8637a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2"/>
                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                        <line x1="12" y1="12" x2="12" y2="16"/>
                        <line x1="10" y1="14" x2="14" y2="14"/>
                    </svg>
                </div>
                <p className="text-[14px] font-semibold text-gray-600 mb-1">Chọn phòng ban để xem chi tiết</p>
                <p className="text-[12px] text-gray-400">Nhấn vào một phòng ban ở danh sách bên trái</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-100 p-5 sm:px-8 flex items-start justify-between gap-5 flex-wrap">
                <div className="min-w-0 flex-1">
                    <Text className="text-[11px] uppercase font-semibold flex items-center gap-1.5" style={{ color: ACCENT }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ACCENT }} />
                        Phòng ban
                    </Text>
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                        <h2 className="m-0 min-w-0 text-[28px] font-bold leading-9 text-gray-950 sm:text-[32px] sm:leading-10">
                            {departmentName || "—"}
                        </h2>
                        {mission?.status && (
                            <Tag
                                className="!m-0 shrink-0"
                                color={mission.status === "PUBLISHED" ? "green" : mission.status === "ARCHIVED" ? "red" : "default"}
                                style={{
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    lineHeight: "24px",
                                    padding: "0 10px",
                                }}
                            >
                                {mission.status === "PUBLISHED" ? "Đã ban hành" : mission.status === "ARCHIVED" ? "Ngừng áp dụng" : "Bản nháp"}
                            </Tag>
                        )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-gray-500">
                        <div className="flex items-center gap-2">
                            <span>Ngày ban hành</span>
                            {editMode ? (
                                <DatePicker
                                    value={issueDate}
                                    onChange={(d) => setIssueDate(d)}
                                    format="DD/MM/YYYY"
                                    placeholder="Chọn ngày"
                                    size="small"
                                />
                            ) : (
                                <span className={issueDate ? "font-semibold text-gray-800" : "text-gray-400"}>
                                    {issueDate ? issueDate.format("DD/MM/YYYY") : "Chưa cập nhật"}
                                </span>
                            )}
                        </div>
                        {editMode && (
                            <div className="flex items-center gap-2 ml-4">
                                <span>Trạng thái:</span>
                                <Select
                                    value={status}
                                    onChange={setStatus}
                                    size="small"
                                    options={[
                                        { label: "Bản nháp", value: "DRAFT" },
                                        { label: "Đã ban hành", value: "PUBLISHED" },
                                        { label: "Ngừng áp dụng", value: "ARCHIVED" },
                                    ]}
                                />
                            </div>
                        )}
                    </div>
                </div>
                {!editMode ? (
                    <Space wrap size={[8, 8]} className="max-w-full">
                        {showHistoryAction && (
                            <>
                                <Button
                                    icon={<HistoryOutlined />}
                                    onClick={() => setHistoryOpen(true)}
                                >
                                    Lịch sử chỉnh sửa
                                </Button>
                                <Button
                                    icon={<FileAddOutlined />}
                                    onClick={() => setVersionListOpen(true)}
                                >
                                    Phiên bản
                                </Button>
                            </>
                        )}
                        {showEditAction && (
                            <Access permission={ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.CREATE} hideChildren>
                                <Space>
                                    <Button
                                        data-guide-id="department-objectives-edit-btn"
                                        icon={hasMissionContent ? <EditOutlined /> : <PlusCircleOutlined />}
                                        onClick={() => setEditMode(true)}
                                    >
                                        {hasMissionContent ? "Chỉnh sửa" : "Thiết lập"}
                                    </Button>
                                    {showVersionAction && mission?.status && hasMissionContent && (
                                        <Button
                                            type="primary"
                                            icon={<FileAddOutlined />}
                                            onClick={openVersionModal}
                                        >
                                            Tạo version
                                        </Button>
                                    )}
                                </Space>
                            </Access>
                        )}
                    </Space>
                ) : (
                    <Access permission={ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.CREATE} hideChildren>
                        <Space size={10}>
                            <Button
                                data-guide-id="department-objectives-save-btn"
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={isPending}
                                onClick={handleSave}
                                className="!border-[#e8637a] !bg-[#e8637a] !shadow-sm hover:!border-[#d94c66] hover:!bg-[#d94c66]"
                            >
                                {versionAfterSaveMode ? "Lưu & tạo version" : "Lưu"}
                            </Button>
                        </Space>
                    </Access>
                )}
            </div>

            {/* EDIT BANNER */}
            {editMode && (
                <div className="bg-[#fffbe6] border-b border-[#ffe58f] py-2 px-5 sm:px-8 text-[13px] text-[#874d00]">
                    {versionAfterSaveMode
                        ? "Đang cập nhật nội dung cho version mới — lưu xong hệ thống sẽ mở bước tạo version"
                        : "Đang chỉnh sửa — nhớ lưu thay đổi trước khi rời trang"}
                </div>
            )}

            {/* BODY */}
            <div className="p-5 sm:px-8 sm:py-7 pb-14 bg-[#f8f9fb] flex-1 min-h-0 overflow-auto">
                {isLoading ? (
                    <Space direction="vertical" className="w-full" size={16}>
                        {[1, 2, 3].map(i => <Skeleton key={i} active paragraph={{ rows: 3 }} />)}
                    </Space>
                ) : (
                    <Space direction="vertical" size={32} className="w-full">
                        <ObjectivesSection
                            objectives={objectives}
                            editMode={editMode}
                            onChange={setObjectives}
                        />

                        <TasksSection
                            hasSections={hasSections}
                            sections={sections}
                            generalTasks={generalTasks}
                            editMode={editMode}
                            onSectionsChange={setSections}
                            onGeneralTasksChange={setGeneralTasks}
                        />

                        {(authorities.length > 0 || editMode) && (
                            <AuthoritiesSection
                                authorities={authorities}
                                editMode={editMode}
                                onChange={setAuthorities}
                            />
                        )}
                    </Space>
                )}
            </div>

            <Modal
                title="Lịch sử chỉnh sửa"
                open={historyOpen}
                onCancel={() => setHistoryOpen(false)}
                footer={null}
                width={720}
                styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
            >
                <Space direction="vertical" size={16} className="w-full">
                    <Space size={8} wrap>
                        <Tag
                            color={mission?.status === "PUBLISHED" ? "green" : "default"}
                            style={{ margin: 0, borderRadius: 4, fontWeight: 500 }}
                        >
                            {mission?.status === "PUBLISHED" ? "Đã ban hành" : "Bản nháp"}
                        </Tag>
                        <Tag
                            color="blue"
                            style={{ margin: 0, borderRadius: 4, fontWeight: 500 }}
                        >
                            Phiên bản v{mission?.version ?? 0}
                        </Tag>
                    </Space>

                    {historyEvents.length > 0 ? (
                        <Timeline
                            style={{ marginBottom: -12 }}
                            items={historyEvents.map((event) => ({
                                color: event.color,
                                children: (
                                    <div className="text-[13px] leading-5">
                                        <div className="font-semibold text-gray-800">
                                            {event.label}
                                            {event.time ? (
                                                <span className="ml-2 font-normal text-gray-500">
                                                    {dayjs(event.time).format("DD/MM/YYYY HH:mm")}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="text-gray-500">
                                            {event.user ? `Thực hiện bởi ${event.user}` : "Chưa ghi nhận người thực hiện"}
                                            {event.meta ? ` · ${event.meta}` : ""}
                                        </div>
                                    </div>
                                ),
                            }))}
                        />
                    ) : (
                        <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-[13px] text-gray-400">
                            Chưa có dữ liệu chỉnh sửa.
                        </div>
                    )}
                </Space>
            </Modal>

            <Modal
                title="Phiên bản đã ban hành"
                open={versionListOpen}
                onCancel={() => setVersionListOpen(false)}
                footer={null}
                width={720}
                styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
            >
                {versionHistory.length > 0 ? (
                    <Space direction="vertical" size={10} className="w-full">
                        {versionHistory.map((version) => (
                            <div key={version.id} className="rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="min-w-0 font-semibold text-gray-800">
                                        v{version.version} · {version.title || "Không có tiêu đề"}
                                    </div>
                                    <Tag color="blue" style={{ margin: 0, borderRadius: 4 }}>
                                        {(version.objectiveCount ?? 0)} MT · {(version.taskCount ?? 0)} NV
                                        {(version.authorityCount ?? 0) > 0 ? ` · ${version.authorityCount} QH` : ""}
                                    </Tag>
                                </div>
                                <div className="mt-1 text-[12px] text-gray-500">
                                    {version.createdAt ? dayjs(version.createdAt).format("DD/MM/YYYY HH:mm") : "Chưa có thời gian"}
                                    {version.createdByName ? ` · Tạo bởi ${version.createdByName}` : ""}
                                    {version.effectiveDate ? ` · Hiệu lực ${dayjs(version.effectiveDate).format("DD/MM/YYYY")}` : ""}
                                </div>
                                {version.changeSummary && (
                                    <div className="mt-1 text-[13px] text-gray-600">
                                        {version.changeSummary}
                                    </div>
                                )}
                                <div className="mt-3">
                                    <Button
                                        size="small"
                                        onClick={() => setPreviewVersion(version)}
                                    >
                                        Xem nội dung version
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </Space>
                ) : (
                    <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-[13px] text-gray-400">
                        Chưa có version nào được tạo.
                    </div>
                )}
            </Modal>

            <Modal
                title={previewVersion ? `Nội dung version v${previewVersion.version}` : "Nội dung version"}
                open={!!previewVersion}
                onCancel={() => setPreviewVersion(null)}
                footer={null}
                width={760}
                styles={{ body: { maxHeight: "72vh", overflowY: "auto" } }}
            >
                {previewVersion?.snapshotJson && previewSnapshot ? (
                    <Space direction="vertical" size={18} className="w-full">
                        <div className="flex flex-wrap items-center gap-2">
                            <Tag color="blue" style={{ margin: 0, borderRadius: 4 }}>
                                v{previewVersion.version}
                            </Tag>
                            <span className="text-[13px] text-gray-500">
                                {previewVersion.createdAt ? dayjs(previewVersion.createdAt).format("DD/MM/YYYY HH:mm") : "Chưa có thời gian"}
                                {previewVersion.createdByName ? ` · Tạo bởi ${previewVersion.createdByName}` : ""}
                                {previewVersion.effectiveDate ? ` · Hiệu lực ${dayjs(previewVersion.effectiveDate).format("DD/MM/YYYY")}` : ""}
                            </span>
                        </div>
                        {renderSnapshotList("Mục tiêu phòng ban", previewSnapshot.objectives)}
                        <div>
                            <div className="mb-2 text-[12px] font-semibold uppercase text-gray-500">Nhiệm vụ</div>
                            <Space direction="vertical" size={12} className="w-full">
                                {previewSnapshot.sectionTasks && previewSnapshot.sectionTasks.length > 0 ? (
                                    previewSnapshot.sectionTasks.map((section, index) => (
                                        <div key={`${section.sectionName}-${index}`} className="rounded-md border border-gray-100 bg-white px-3 py-3">
                                            <div className="mb-2 text-[13px] font-semibold text-gray-700">
                                                {section.sectionName || "Bộ phận"}
                                            </div>
                                            {renderSnapshotList("Danh sách nhiệm vụ", section.tasks)}
                                        </div>
                                    ))
                                ) : null}
                                {renderSnapshotList("Nhiệm vụ chung", previewSnapshot.generalTasks)}
                            </Space>
                        </div>
                        {renderSnapshotList("Quyền hạn", previewSnapshot.authorities)}
                    </Space>
                ) : (
                    <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-[13px] text-gray-500">
                        Version này chưa có snapshot nội dung. Các version được tạo sau bản cập nhật này sẽ xem lại được nội dung chi tiết.
                    </div>
                )}
            </Modal>

            <Modal
                title="Tạo version mới"
                open={versionOpen}
                onCancel={() => setVersionOpen(false)}
                okText="Tạo version"
                cancelText="Huỷ"
                confirmLoading={isPublishing}
                onOk={handlePublish}
                width={680}
                styles={{ body: { maxHeight: "72vh", overflowY: "auto" } }}
            >
                <Space direction="vertical" size={16} className="w-full">
                    <Alert
                        type="info"
                        showIcon
                        message={`Version hiện tại: v${mission?.version ?? 0}`}
                        description={`Sau khi xác nhận, hệ thống sẽ tạo v${(mission?.version ?? 0) + 1} từ nội dung đã lưu hiện tại của phòng ban này.`}
                    />

                    <Form form={versionForm} layout="vertical">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
                            <Form.Item
                                name="title"
                                label="Tên version"
                                rules={[{ required: true, message: "Vui lòng nhập tên version" }]}
                            >
                                <Input placeholder="Ví dụ: Cập nhật mục tiêu Q3/2026" maxLength={180} />
                            </Form.Item>
                            <Form.Item name="effectiveDate" label="Ngày hiệu lực">
                                <DatePicker format="DD/MM/YYYY" className="w-full" />
                            </Form.Item>
                        </div>
                        <Form.Item name="changeSummary" label="Nội dung thay đổi / ghi chú">
                            <Input.TextArea
                                rows={4}
                                maxLength={1000}
                                showCount
                                placeholder="Tóm tắt các điểm thay đổi chính của version này..."
                            />
                        </Form.Item>
                    </Form>

                    <div>
                        <div className="mb-2 text-[12px] font-semibold uppercase tracking-[.04em] text-gray-500">
                            Version trước đó
                        </div>
                        {versionHistory.length > 0 ? (
                            <Space direction="vertical" size={8} className="max-h-[220px] w-full overflow-y-auto pr-1">
                                {versionHistory.slice(0, 3).map((version) => (
                                    <div key={version.id} className="rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="min-w-0 font-semibold text-gray-800">
                                                v{version.version} · {version.title || "Không có tiêu đề"}
                                            </div>
                                            <Tag color="blue" style={{ margin: 0, borderRadius: 4 }}>
                                                {(version.objectiveCount ?? 0)} MT · {(version.taskCount ?? 0)} NV
                                            </Tag>
                                        </div>
                                        <div className="mt-1 text-[12px] text-gray-500">
                                            {version.createdAt ? dayjs(version.createdAt).format("DD/MM/YYYY HH:mm") : "Chưa có thời gian"}
                                            {version.createdByName ? ` · Tạo bởi ${version.createdByName}` : ""}
                                        </div>
                                        {version.changeSummary && (
                                            <div className="mt-1 text-[13px] text-gray-600">
                                                {version.changeSummary}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </Space>
                        ) : (
                            <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-[13px] text-gray-400">
                                Chưa có version trước đó. Version đầu tiên sẽ được tạo từ nội dung hiện tại.
                            </div>
                        )}
                        {isLoadingVersions && (
                            <div className="mt-2 text-[12px] text-gray-400">Đang tải lịch sử version...</div>
                        )}
                    </div>
                </Space>
            </Modal>
        </div>
    );
};

export default DepartmentMissionDetail;
