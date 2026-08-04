import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Modal, Popconfirm, Space, Typography, Card, Progress } from "antd";

import {
    UserSwitchOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";

import type { ProColumns } from "@ant-design/pro-components";
import queryString from "query-string";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import { useIsMobile } from "@/hooks/useIsMobile";
import { callFetchCompany, callFetchDepartment, callFetchUser, callFetchTaskById } from "@/config/api";
import { useTasksQuery, useDeleteTaskMutation } from "@/hooks/useTasks";
import type { IResTaskDTO } from "@/types/backend";
import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import type { FilterField } from "@/components/common/filter/AdvancedFilterSelect";
import TabBar from "@/components/common/tabs/TabBar";
import ActionButton from "@/components/common/ui/ActionButton";
import Access from "@/components/share/access";
import { PAGINATION_CONFIG } from "@/config/pagination";
import {
    TASK_ROLE_TABS,
    TASK_STATUS_META,
    TASK_PRIORITY_META,
    renderTaskPriorityTag,
    renderTaskStatusTag,
    renderParticipantAvatarStack,
} from "./taskMeta";
import { formatDateOnly } from "./taskUtils";
import { getTaskViewerContext } from "./taskContext";
import { TaskFormDrawer } from "./components/TaskFormDrawer";
import { TaskDetailDrawer } from "./components/TaskDetailDrawer";
import { TaskSubmitResultModal } from "./components/TaskSubmitResultModal";
import { ApprovalDelegationDrawer } from "./components/ApprovalDelegationDrawer";
import { TaskKanbanView } from "./components/TaskKanbanView";
import { TaskDeadlineKanbanView } from "./components/TaskDeadlineKanbanView";
import { TaskCalendarView } from "./components/TaskCalendarView";
import {
    TaskWorkspaceViewSwitcher,
    type TaskWorkspaceViewMode,
} from "./components/common/TaskWorkspaceViewSwitcher";
import TaskMobileListView from "./components/mobile/TaskMobileListView";
import "./TaskWorkspace.css";

const { Text } = Typography;

const TaskPage: React.FC = () => {
    const isMobile = useIsMobile();
    const user = useAppSelector((state) => state.account.user);

    // View mode state
    const [viewMode, setViewMode] = useState<TaskWorkspaceViewMode>("table");
    const [kanbanSize, setKanbanSize] = useState<number>(50);

    const effectiveViewMode = isMobile ? "table" : viewMode;


    // Permissions check via useAccess
    const canCreatePerm = useAccess(ALL_PERMISSIONS.TASKS.CREATE);
    const canUpdatePerm = useAccess(ALL_PERMISSIONS.TASKS.UPDATE);
    const canUpdateStatusPerm = useAccess(ALL_PERMISSIONS.TASKS.UPDATE_STATUS);
    const canCancelPerm = useAccess(ALL_PERMISSIONS.TASKS.CANCEL);
    const canDeletePerm = useAccess(ALL_PERMISSIONS.TASKS.DELETE);
    const canSubmitResultPerm = useAccess(ALL_PERMISSIONS.TASKS.SUBMIT_RESULT);
    const canApprovePerm = useAccess(ALL_PERMISSIONS.TASKS.APPROVE);
    const canRequestExtensionPerm = useAccess(ALL_PERMISSIONS.TASKS.REQUEST_EXTENSION);
    const canDecideExtensionPerm = useAccess(ALL_PERMISSIONS.TASKS.DECIDE_EXTENSION);
    const canDelegatePerm = useAccess(ALL_PERMISSIONS.APPROVAL_DELEGATIONS.CREATE);

    const perms = useMemo(
        () => ({
            create: canCreatePerm,
            update: canUpdatePerm,
            updateStatus: canUpdateStatusPerm,
            cancel: canCancelPerm,
            delete: canDeletePerm,
            submitResult: canSubmitResultPerm,
            approve: canApprovePerm,
            requestExtension: canRequestExtensionPerm,
            decideExtension: canDecideExtensionPerm,
        }),
        [
            canCreatePerm,
            canUpdatePerm,
            canUpdateStatusPerm,
            canCancelPerm,
            canDeletePerm,
            canSubmitResultPerm,
            canApprovePerm,
            canRequestExtensionPerm,
            canDecideExtensionPerm,
        ]
    );

    const [searchParams] = useSearchParams();
    const taskIdParam = searchParams.get("taskId");

    // Filter states
    const [activeTab, setActiveTab] = useState<string>("ALL");
    const [searchText, setSearchText] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});

    // Drawers & Modals states
    const [formDrawerOpen, setFormDrawerOpen] = useState(false);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [delegationDrawerOpen, setDelegationDrawerOpen] = useState(false);
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [submitTaskId, setSubmitTaskId] = useState<number | null>(null);
    const [selectedTask, setSelectedTask] = useState<IResTaskDTO | null>(null);

    const deleteMutation = useDeleteTaskMutation();

    // Auto open task detail if taskId query param is in URL (e.g. from Notification click)
    useEffect(() => {
        if (taskIdParam) {
            const idNum = Number(taskIdParam);
            if (!isNaN(idNum) && idNum > 0) {
                callFetchTaskById(idNum)
                    .then((res) => {
                        if (res && res.data) {
                            setSelectedTask(res.data as any);
                            setDetailDrawerOpen(true);
                        }
                    })
                    .catch(() => { });
            }
        }
    }, [taskIdParam]);

    // Query count per role tab for badge display
    const { data: myAssignedCountData } = useTasksQuery("size=1", "MY_ASSIGNED");
    const { data: myCollabCountData } = useTasksQuery("size=1", "MY_COLLABORATING");
    const { data: myCreatedCountData } = useTasksQuery("size=1", "MY_CREATED");
    const { data: myObservingCountData } = useTasksQuery("size=1", "MY_OBSERVING");

    const myAssignedCount = myAssignedCountData?.meta?.total || 0;
    const myCollabCount = myCollabCountData?.meta?.total || 0;
    const myCreatedCount = myCreatedCountData?.meta?.total || 0;
    const myObservingCount = myObservingCountData?.meta?.total || 0;
    const myTotalCount = myAssignedCount + myCollabCount + myCreatedCount + myObservingCount;

    const TAB_COUNT_MAP: Record<string, number> = useMemo(() => ({
        ALL: myTotalCount,
        MY_ASSIGNED: myAssignedCount,
        MY_COLLABORATING: myCollabCount,
        MY_CREATED: myCreatedCount,
        MY_OBSERVING: myObservingCount,
    }), [myTotalCount, myAssignedCount, myCollabCount, myCreatedCount, myObservingCount]);

    const roleTabsWithBadges = useMemo(() => {
        return TASK_ROLE_TABS.map((tab) => ({
            ...tab,
            count: TAB_COUNT_MAP[tab.key] ?? 0,
        }));
    }, [TAB_COUNT_MAP]);

    const filterExpression = useMemo(() => {
        const filters: string[] = [];
        if (searchText.trim()) {
            filters.push(`title~'${searchText.trim()}'`);
        }
        if (selectedFilters.status) {
            filters.push(`status='${selectedFilters.status}'`);
        }
        if (selectedFilters.priority) {
            filters.push(`priority='${selectedFilters.priority}'`);
        }

        if (selectedFilters.company) {
            filters.push(`department.company.id='${selectedFilters.company}'`);
        }
        if (selectedFilters.department) {
            filters.push(`department.id='${selectedFilters.department}'`);
        }
        return filters.join(" and ");
    }, [searchText, selectedFilters]);

    // Table and Kanban stay paginated; Calendar fetches its exact visible date range.
    const queryStr = useMemo(() => {
        const effectiveSize = effectiveViewMode === "table" ? pageSize : kanbanSize;
        const queryObj: any = {
            page,
            size: effectiveSize,
            sort: "createdAt,desc",
        };
        if (filterExpression) {
            queryObj.filter = filterExpression;
        }

        return queryString.stringify(queryObj, { encode: false });
    }, [page, pageSize, filterExpression, effectiveViewMode, kanbanSize]);

    const { data: tasksData, isLoading, refetch } = useTasksQuery(
        queryStr,
        activeTab,
        effectiveViewMode !== "calendar"
    );

    const tasksList = tasksData?.result || [];
    const totalElements = tasksData?.meta?.total || 0;

    // AdvancedFilterSelect fields config
    const filterFields: FilterField[] = useMemo(() => {
        const fields: FilterField[] = [
            {
                key: "status",
                label: "Trạng thái",
                options: Object.entries(TASK_STATUS_META).map(([value, meta]) => ({
                    label: meta.label,
                    value,
                    color: meta.color,
                })),
            },
            {
                key: "priority",
                label: "Độ ưu tiên",
                options: Object.entries(TASK_PRIORITY_META).map(([value, meta]) => ({
                    label: meta.label,
                    value,
                    color: meta.color,
                })),
            },
            {
                key: "assignee",
                label: "Người thực hiện",
                asyncOptions: async () => {
                    const res = await callFetchUser("page=1&size=100");
                    return (res?.data?.result || []).map((u: any) => ({
                        label: u.name || u.email,
                        value: String(u.id),
                        color: "blue",
                    }));
                },
                searchable: true,
            },
        ];

        if (activeTab === "ALL") {
            fields.push(
                {
                    key: "company",
                    label: "Công ty",
                    asyncOptions: async () => {
                        const res = await callFetchCompany("page=1&size=100");
                        return (res?.data?.result || []).map((c: any) => ({
                            label: c.name,
                            value: c.id,
                            color: "purple",
                        }));
                    },
                    searchable: true,
                },
                {
                    key: "department",
                    label: "Phòng ban",
                    dependsOn: "company",
                    asyncOptions: async (parentValues) => {
                        const companyId = parentValues?.company;
                        const query = companyId ? `page=1&size=100&filter=company.id='${companyId}'` : "page=1&size=100";
                        const res = await callFetchDepartment(query);
                        return (res?.data?.result || []).map((d: any) => ({
                            label: d.name,
                            value: d.id,
                            color: "green",
                        }));
                    },
                    searchable: true,
                }
            );
        }

        return fields;
    }, [activeTab]);

    const handleCreateClick = useCallback(() => {
        setSelectedTask(null);
        setFormDrawerOpen(true);
    }, []);

    const handleEditClick = useCallback((task: IResTaskDTO) => {
        setSelectedTask(task);
        setFormDrawerOpen(true);
    }, []);

    const handleDetailClick = useCallback((task: IResTaskDTO) => {
        setSelectedTask(task);
        setDetailDrawerOpen(true);
    }, []);

    const handleSubmitResultClick = useCallback((task: IResTaskDTO) => {
        setSubmitTaskId(task.id);
        setSubmitModalOpen(true);
    }, []);

    const handleDeleteTask = useCallback(async (id: number) => {
        await deleteMutation.mutateAsync(id);
        refetch();
    }, [deleteMutation, refetch]);

    const pageActionSlots = useMemo(() => {
        let hasEdit = false;
        let hasDelete = false;
        let hasSubmit = false;
        for (const record of tasksList) {
            const ctx = getTaskViewerContext(user, record, perms);
            if (ctx.canEdit && !ctx.isObserver) hasEdit = true;
            if (ctx.canDelete && !ctx.isObserver) hasDelete = true;
            if (ctx.canSubmitResult) hasSubmit = true;
        }
        return { hasEdit, hasDelete, hasSubmit };
    }, [tasksList, user, perms]);

    const columns: ProColumns<IResTaskDTO>[] = useMemo(() => [
        {
            title: "STT",
            key: "stt",
            width: 60,
            align: "center",
            render: (_, __, index) => (page - 1) * pageSize + index + 1,
        },
        {
            title: "Mã tác vụ",
            dataIndex: "id",
            key: "taskCode",
            width: 110,
            align: "center",
            render: (id) => (
                <span className="task-code-badge">
                    TV-{String(id).padStart(3, "0")}
                </span>
            ),
        },
        {
            title: "Tên tác vụ",
            dataIndex: "title",
            key: "title",
            render: (text, record) => (
                <a onClick={() => handleDetailClick(record)} className="task-name-link">
                    {text}
                </a>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 160,
            align: "center",
            render: (status, record) =>
                renderTaskStatusTag(status as any, record.overdue, "table"),
        },
        {
            title: "Người thực hiện chính",
            dataIndex: "assigneeName",
            key: "assigneeName",
            render: (text) => text || "--",
        },
        {
            title: "Công ty",
            dataIndex: "companyName",
            key: "companyName",
            render: (text) => text || "--",
        },
        {
            title: "Phòng ban",
            dataIndex: "departmentName",
            key: "departmentName",
            render: (text) => text || "--",
        },
        {
            title: "Độ ưu tiên",
            dataIndex: "priority",
            key: "priority",
            width: 132,
            align: "center",
            render: (priority) => renderTaskPriorityTag(priority as any),
        },
        {
            title: "Hạn chót",
            dataIndex: "dueDate",
            key: "dueDate",
            align: "center",
            render: (dueDate) => formatDateOnly(dueDate as string),
        },
        {
            title: "Thao tác",
            key: "actions",
            width: (() => {
                // 30px view (always) + each extra slot: edit=30px, delete=30px, submit=108px
                // Gap between slots: 4px
                const slots = [
                    30, // view — always visible
                    ...(pageActionSlots.hasEdit ? [30] : []),
                    ...(pageActionSlots.hasDelete ? [30] : []),
                    ...(pageActionSlots.hasSubmit ? [108] : []),
                ];
                const totalGap = (slots.length - 1) * 4;
                return slots.reduce((a, b) => a + b, 0) + totalGap + 16; // +16 cell padding
            })(),
            align: "center",
            fixed: "right",
            render: (_, record) => {
                const viewerCtx = getTaskViewerContext(user, record, perms);

                return (
                    <div className="task-table-actions">
                        <ActionButton
                            variant="view"
                            icon={<EyeOutlined />}
                            onClick={() => handleDetailClick(record)}
                            tooltip="Xem chi tiết tác vụ"
                        />
                        {viewerCtx.canEdit && !viewerCtx.isObserver && (
                            <ActionButton
                                variant="edit"
                                icon={<EditOutlined />}
                                onClick={() => handleEditClick(record)}
                                tooltip="Chỉnh sửa tác vụ"
                            />
                        )}
                        {viewerCtx.canDelete && !viewerCtx.isObserver && (
                            <ActionButton
                                variant="danger"
                                icon={<DeleteOutlined />}
                                tooltip="Xóa tác vụ"
                                onClick={() => {
                                    Modal.confirm({
                                        title: "Xóa tác vụ này?",
                                        content: "Thao tác này không thể hoàn tác.",
                                        okText: "Xóa",
                                        okType: "danger",
                                        cancelText: "Hủy",
                                        onOk: () => handleDeleteTask(record.id),
                                    });
                                }}
                            />
                        )}
                        {viewerCtx.canSubmitResult && (
                            <Button
                                icon={<CheckCircleOutlined />}
                                className="task-table-submit-result-button"
                                aria-label="Nộp kết quả tác vụ"
                                onClick={() => handleSubmitResultClick(record)}
                            >
                                Nộp kết quả
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ], [page, pageSize, user, perms, pageActionSlots, handleDetailClick, handleSubmitResultClick, handleEditClick, handleDeleteTask]);

    return (
        <PageContainer
            title="Quản lý tác vụ"
            extra={
                canDelegatePerm ? (
                    <Button
                        icon={<UserSwitchOutlined />}
                        onClick={() => setDelegationDrawerOpen(true)}
                        style={{ borderRadius: 8, height: 36 }}
                    >
                        Ủy quyền duyệt
                    </Button>
                ) : null
            }
            filter={
                <div className="task-command-center">
                    <div className="task-command-center__top">
                        <TabBar
                            tabs={roleTabsWithBadges}
                            activeKey={activeTab}
                            onChange={(key) => {
                                setActiveTab(key);
                                setPage(1);
                                setKanbanSize(50);
                            }}
                        />
                        {!isMobile && (
                            <TaskWorkspaceViewSwitcher
                                value={viewMode}
                                onChange={setViewMode}
                            />
                        )}
                    </div>

                    <div className="task-command-center__search">
                        <SearchFilter
                            searchPlaceholder="Tìm theo tên hoặc nội dung tác vụ..."
                            addLabel="Tạo tác vụ"
                            addIcon={null}
                            onSearch={(val) => {
                                setSearchText(val);
                                setPage(1);
                            }}
                            onReset={() => {
                                setSearchText("");
                                setSelectedFilters({});
                                setPage(1);
                                setKanbanSize(50);
                            }}
                            onAddClick={handleCreateClick}
                            addPermission={ALL_PERMISSIONS.TASKS.CREATE}
                            showFilterButton={false}
                        />
                        <AdvancedFilterSelect
                            fields={filterFields}
                            onChange={(newFilters) => {
                                setSelectedFilters(newFilters);
                                setPage(1);
                                setKanbanSize(50);
                            }}
                        />
                    </div>
                </div>
            }
        >
            <Access permission={ALL_PERMISSIONS.TASKS.GET_PAGINATE}>
                {isMobile ? (
                    <TaskMobileListView
                        tasks={tasksList}
                        onSelectTask={handleDetailClick}
                        totalElements={totalElements}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={(p: number, s: number) => {
                            setPage(p);
                            setPageSize(s);
                        }}
                        loading={isLoading}
                    />
                ) : effectiveViewMode === "kanban" ? (
                    <TaskKanbanView
                        tasks={tasksList}
                        onSelectTask={handleDetailClick}
                        user={user}
                        perms={perms}
                        hasMore={totalElements > tasksList.length}
                        onLoadMore={() => setKanbanSize((prev) => prev + 50)}
                        totalElements={totalElements}
                    />
                ) : effectiveViewMode === "deadline" ? (
                    <TaskDeadlineKanbanView
                        tasks={tasksList}
                        onSelectTask={handleDetailClick}
                        hasMore={totalElements > tasksList.length}
                        onLoadMore={() => setKanbanSize((prev) => prev + 50)}
                        totalElements={totalElements}
                    />
                ) : effectiveViewMode === "calendar" ? (
                    <TaskCalendarView
                        activeTab={activeTab}
                        filter={filterExpression}
                        onSelectTask={handleDetailClick}
                    />
                ) : (
                    <div className="task-data-table">
                        <DataTable<IResTaskDTO>
                            rowKey="id"
                            loading={isLoading}
                            columns={columns}
                            dataSource={tasksList}
                            scroll={{ x: "max-content" }}
                            pagination={{
                                defaultPageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
                                current: page,
                                pageSize,
                                total: totalElements,
                                onChange: (p, s) => {
                                    setPage(p);
                                    setPageSize(s);
                                },
                                showQuickJumper: true,
                                showTotal: (total, range) => (
                                    <div style={{ fontSize: 13 }}>
                                        <span style={{ fontWeight: 500 }}>
                                            {range[0]}–{range[1]}
                                        </span>{" "}
                                        trên{" "}
                                        <span style={{ fontWeight: 600, color: "#667085" }}>
                                            {total.toLocaleString()}
                                        </span>{" "}
                                        tác vụ
                                    </div>
                                ),
                            }}
                            rowSelection={false}
                        />
                    </div>
                )}
            </Access>

            <TaskFormDrawer
                open={formDrawerOpen}
                task={selectedTask}
                onClose={() => setFormDrawerOpen(false)}
            />

            <TaskDetailDrawer
                open={detailDrawerOpen}
                taskId={selectedTask?.id || null}
                onClose={() => setDetailDrawerOpen(false)}
                onEdit={() => {
                    setDetailDrawerOpen(false);
                    setFormDrawerOpen(true);
                }}
                user={user}
                perms={perms}
            />

            <ApprovalDelegationDrawer
                open={delegationDrawerOpen}
                onClose={() => setDelegationDrawerOpen(false)}
            />

            <TaskSubmitResultModal
                open={submitModalOpen}
                taskId={submitTaskId}
                onClose={() => {
                    setSubmitModalOpen(false);
                    setSubmitTaskId(null);
                    refetch();
                }}
            />
        </PageContainer>
    );
};

export default TaskPage;
