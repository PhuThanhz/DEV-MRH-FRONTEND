import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Form,
    Input,
    Select,
    DatePicker,
    InputNumber,
    Button,
    Row,
    Col,
    Space,
    Typography,
    Tag,
    Avatar,
    Progress,
    Card,
    Divider,
    Upload,
    Tooltip,
} from "antd";
import {
    FormOutlined,
    PlusOutlined,
    FileTextOutlined,
    UserOutlined,
    TeamOutlined,
    BookOutlined,
    FolderOutlined,
    DeleteOutlined,
    UnorderedListOutlined,
    CloseOutlined,
    CalendarOutlined,
    EyeOutlined,
    DownloadOutlined,
    InboxOutlined,
    PaperClipOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileZipOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useCreateTaskMutation, useTaskDetailQuery, useUpdateTaskMutation } from "@/hooks/useTasks";
import {
    useRegisterTaskAttachmentMutation,
    useUploadTaskAttachmentFileMutation,
} from "@/hooks/useTaskAttachments";
import { useJdTasksByUserQuery } from "@/hooks/useJobDescriptionTasks";
import { TASK_PRIORITY_META, renderTaskPriorityTag } from "@/pages/admin/tasks/taskMeta";
import { useUsersQuery } from "@/hooks/useUsers";
import { useAppSelector } from "@/redux/hooks";
import {
    callCreateTaskChecklist,
    callFetchCompany,
    callFetchDepartment,
    callFetchEmployees,
} from "@/config/api";
import type {
    IResTaskAttachmentDTO,
    IResTaskDTO,
    IResTaskDetailDTO,
} from "@/types/backend";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import { notify } from "@/components/common/notification/notify";
import "../TaskWorkspace.css";

const ALLOWED_ATTACHMENT_EXT = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp";

const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const { Title, Text } = Typography;
const { Dragger } = Upload;

const cleanFileName = (fileName: string): string =>
    fileName?.replace(/^\d+[-_]/, "") || "Tệp đính kèm";

const getFileIconAndBg = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
        return {
            icon: <FileImageOutlined style={{ fontSize: 18, color: "#ec4899" }} />,
            bgColor: "#fce7f3",
        };
    }
    if (ext === 'pdf') {
        return {
            icon: <FilePdfOutlined style={{ fontSize: 18, color: "#ef4444" }} />,
            bgColor: "#fee2e2",
        };
    }
    if (['doc', 'docx'].includes(ext)) {
        return {
            icon: <FileWordOutlined style={{ fontSize: 18, color: "#2563eb" }} />,
            bgColor: "#dbeafe",
        };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return {
            icon: <FileExcelOutlined style={{ fontSize: 18, color: "#16a34a" }} />,
            bgColor: "#dcfce7",
        };
    }
    if (['zip', 'rar', '7z'].includes(ext)) {
        return {
            icon: <FileZipOutlined style={{ fontSize: 18, color: "#d97706" }} />,
            bgColor: "#fef3c7",
        };
    }
    return {
        icon: <FileTextOutlined style={{ fontSize: 18, color: "#64748b" }} />,
        bgColor: "#f1f5f9",
    };
};

interface Props {
    open: boolean;
    task: IResTaskDTO | IResTaskDetailDTO | null;
    onClose: () => void;
}

interface LocalChecklistItem {
    id?: number;
    title: string;
    assignedUserId?: string;
    isCompleted?: boolean;
}

interface PendingAttachment {
    uid: string;
    fileName?: string;
    originalName: string;
    fileSize: number;
    status: "uploading" | "done" | "error";
}

const FORM_CARD_STYLE: React.CSSProperties = {
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    marginBottom: 16,
};

const JD_CARD_STYLE: React.CSSProperties = {
    background: "#f8fafc",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: 14,
    marginBottom: 0,
};

const RANGE_PRESETS: { label: string; value: [dayjs.Dayjs, dayjs.Dayjs] }[] = [
    { label: "Hôm nay", value: [dayjs().hour(8).minute(0), dayjs().hour(18).minute(0)] },
    {
        label: "Ngày mai",
        value: [
            dayjs().add(1, "day").hour(8).minute(0),
            dayjs().add(1, "day").hour(18).minute(0),
        ],
    },
    { label: "Cuối tuần này", value: [dayjs(), dayjs().day(6).hour(18).minute(0)] },
    {
        label: "Tuần sau",
        value: [
            dayjs().add(1, "week").day(1).hour(8).minute(0),
            dayjs().add(1, "week").day(5).hour(18).minute(0),
        ],
    },
];

export const TaskFormDrawer: React.FC<Props> = ({ open, task, onClose }) => {
    const [form] = Form.useForm();
    const isEdit = !!task;
    const user = useAppSelector((state) => state.account.user);
    const currentUserId = String(user?.id || "");
    const currentUserName = user?.name || "Huỳnh Thanh Phú";

    const { data: usersData } = useUsersQuery("page=1&size=500", open);
    const usersList = usersData?.result || [];

    const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | undefined>(
        task?.assigneeId ? String(task.assigneeId) : undefined
    );
    const [selectedCollabIds, setSelectedCollabIds] = useState<string[]>([]);
    const [selectedObserverIds, setSelectedObserverIds] = useState<string[]>([]);

    const [checklists, setChecklists] = useState<LocalChecklistItem[]>([]);
    const [newChecklistTitle, setNewChecklistTitle] = useState("");
    const [isChecklistExpanded, setIsChecklistExpanded] = useState<boolean>(false);

    const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
    const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
    const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(undefined);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const hydratedTaskIdRef = useRef<number | null>(null);

    const { data: jdTasksList = [] } = useJdTasksByUserQuery(selectedAssigneeId);
    const {
        data: taskDetail,
        isFetching: isFetchingTaskDetail,
    } = useTaskDetailQuery(isEdit ? task?.id : null);

    useEffect(() => {
        if (!open) return;
        callFetchCompany("page=1&size=100").then((res: any) => {
            setCompanies((res?.data?.result || res?.data?.data?.result || []).map((c: any) => ({ id: c.id, name: c.name })));
        });
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const query = selectedCompanyId ? `page=1&size=100&filter=company.id='${selectedCompanyId}'` : "page=1&size=100";
        callFetchDepartment(query).then((res: any) => {
            setDepartments((res?.data?.result || res?.data?.data?.result || []).map((d: any) => ({ id: d.id, name: d.name })));
        });
    }, [open, selectedCompanyId]);

    useEffect(() => {
        if (!open) return;
        const params: string[] = ["page=1", "size=500"];
        if (selectedCompanyId) {
            params.push(`companyId=${selectedCompanyId}`);
        }
        if (selectedDepartmentId) {
            params.push(`departmentId=${selectedDepartmentId}`);
        }
        callFetchEmployees(params.join("&")).then((res: any) => {
            const list = res?.data?.result || res?.data?.data?.result || [];
            setFilteredUsers(list);
        });
    }, [open, selectedCompanyId, selectedDepartmentId]);

    const activeUsersList = useMemo(() => {
        if (filteredUsers.length > 0) return filteredUsers;
        return usersList;
    }, [filteredUsers, usersList]);

    const existingAttachments = useMemo<IResTaskAttachmentDTO[]>(
        () =>
            (
                taskDetail?.attachments ||
                (task as IResTaskDetailDTO | null)?.attachments ||
                []
            ).filter(
                (attachment) =>
                    attachment.attachmentCategory === "GUIDANCE" &&
                    !attachment.isResultAttachment
            ),
        [task, taskDetail]
    );

    const checklistInputRef = React.useRef<any>(null);

    const handleJdTaskChange = (compositeValue: string | undefined) => {
        if (!compositeValue) {
            form.setFieldsValue({ jobDescriptionTaskId: undefined, jobDescriptionTaskItemId: undefined });
            return;
        }
        const [kind, rawId] = compositeValue.split("-");
        const id = Number(rawId);

        if (kind === "item") {
            const parentJd = jdTasksList.find((jd: any) => jd.items?.some((it: any) => it.id === id));
            form.setFieldsValue({ jobDescriptionTaskId: parentJd?.id, jobDescriptionTaskItemId: id });
        } else {
            form.setFieldsValue({ jobDescriptionTaskId: id, jobDescriptionTaskItemId: undefined });
        }
    };

    const createMutation = useCreateTaskMutation();
    const updateMutation = useUpdateTaskMutation();
    const uploadAttachmentMutation = useUploadTaskAttachmentFileMutation();
    const registerAttachmentMutation = useRegisterTaskAttachmentMutation();

    useEffect(() => {
        if (!open) return;

        hydratedTaskIdRef.current = null;
        setPendingAttachments([]);
        setNewChecklistTitle("");

        if (!task) {
            form.resetFields();
            setSelectedAssigneeId(undefined);
            setSelectedCollabIds([]);
            setSelectedObserverIds([]);
            setChecklists([]);
            setIsChecklistExpanded(false);
        }
    }, [open, task?.id, form]);

    useEffect(() => {
        if (!open || !task || hydratedTaskIdRef.current === task.id) return;
        if (!taskDetail && isFetchingTaskDetail) return;

        const detail = taskDetail || (task as IResTaskDetailDTO);
        const collabIds = (detail.collaborators || []).map((item) => String(item.userId));
        const observerIds = (detail.observers || []).map((item) => String(item.userId));
        const detailChecklists = detail.checklists || [];

        setSelectedAssigneeId(detail.assigneeId ? String(detail.assigneeId) : undefined);
        setSelectedCollabIds(collabIds);
        setSelectedObserverIds(observerIds);
        setChecklists(
            detailChecklists.map((item) => ({
                id: item.id,
                title: item.title,
                assignedUserId: item.assignedUserId,
                isCompleted: item.isCompleted,
            }))
        );
        setIsChecklistExpanded(detailChecklists.length > 0);

        if (detail.companyId) {
            setSelectedCompanyId(detail.companyId);
        }
        if (detail.departmentId) {
            setSelectedDepartmentId(detail.departmentId);
        }

        form.setFieldsValue({
            title: detail.title,
            description: detail.description,
            priority: detail.priority || "MEDIUM",
            dateRange: [
                detail.startDate ? dayjs(detail.startDate) : null,
                detail.dueDate ? dayjs(detail.dueDate) : null,
            ],
            estimatedHours: detail.estimatedHours,
            assigneeId: detail.assigneeId ? String(detail.assigneeId) : undefined,
            collaboratorIds: collabIds,
            observerIds: observerIds,
            jobDescriptionTaskId: detail.jobDescriptionTaskId,
            jobDescriptionTaskItemId: detail.jobDescriptionTaskItemId,
            companyId: detail.companyId,
            departmentId: detail.departmentId,
        });

        hydratedTaskIdRef.current = task.id;
    }, [form, isFetchingTaskDetail, open, task, taskDetail]);

    const handleAssigneeChange = (value: string) => {
        setSelectedAssigneeId(value);
        form.setFieldsValue({ jobDescriptionTaskId: undefined, jobDescriptionTaskItemId: undefined });
        if (selectedCollabIds.includes(value)) {
            const newCollabs = selectedCollabIds.filter((id) => id !== value);
            setSelectedCollabIds(newCollabs);
            form.setFieldValue("collaboratorIds", newCollabs);
        }
        if (selectedObserverIds.includes(value)) {
            const newObs = selectedObserverIds.filter((id) => id !== value);
            setSelectedObserverIds(newObs);
            form.setFieldValue("observerIds", newObs);
        }
    };

    const handleCollabChange = (values: string[]) => {
        setSelectedCollabIds(values);
        const newObs = selectedObserverIds.filter((id) => !values.includes(id));
        if (newObs.length !== selectedObserverIds.length) {
            setSelectedObserverIds(newObs);
            form.setFieldValue("observerIds", newObs);
        }
    };

    const handleObserverChange = (values: string[]) => {
        setSelectedObserverIds(values);
        const newCollabs = selectedCollabIds.filter((id) => !values.includes(id));
        if (newCollabs.length !== selectedCollabIds.length) {
            setSelectedCollabIds(newCollabs);
            form.setFieldValue("collaboratorIds", newCollabs);
        }
    };

    const handleAddChecklist = (e?: React.KeyboardEvent | React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            const navEvent = (e as any).nativeEvent || e;
            if (navEvent.isComposing) return;
        }
        if (!newChecklistTitle.trim()) return;
        setChecklists((prev) => [...prev, { title: newChecklistTitle.trim(), isCompleted: false }]);
        setNewChecklistTitle("");
    };

    const handleRemoveChecklist = (index: number) => {
        setChecklists((prev) => prev.filter((_, i) => i !== index));
    };

    const handleBeforeUpload = (file: any) => {
        const uid = file.uid || `${Date.now()}-${Math.random()}`;
        setPendingAttachments((prev) => [
            ...prev,
            { uid, originalName: file.name, fileSize: file.size, status: "uploading" },
        ]);

        (async () => {
            try {
                const res = await uploadAttachmentMutation.mutateAsync({
                    file,
                    folder: "task",
                });
                const fileName = res?.data?.fileName;
                if (!fileName) throw new Error("Upload thất bại");
                setPendingAttachments((prev) =>
                    prev.map((att) => (att.uid === uid ? { ...att, fileName, status: "done" } : att))
                );
            } catch (error: any) {
                setPendingAttachments((prev) =>
                    prev.map((att) => (att.uid === uid ? { ...att, status: "error" } : att))
                );
                notify.error("Không thể tải tệp lên", error?.message || "Vui lòng thử lại.");
            }
        })();

        return false;
    };

    const handleRemovePendingAttachment = (uid: string) => {
        setPendingAttachments((prev) => prev.filter((att) => att.uid !== uid));
    };

    const handleSubmit = async () => {
        if (pendingAttachments.some((attachment) => attachment.status === "uploading")) {
            notify.warning("Tệp đang được tải lên. Vui lòng chờ hoàn tất trước khi lưu.");
            return;
        }

        if (pendingAttachments.some((attachment) => attachment.status === "error")) {
            notify.warning("Có tệp tải lên thất bại. Vui lòng xóa tệp lỗi hoặc tải lại.");
            return;
        }

        try {
            const values = await form.validateFields();
            const dateRange = values.dateRange;
            const startDate = dateRange?.[0] ? dateRange[0].toISOString() : undefined;
            const dueDate = dateRange?.[1] ? dateRange[1].toISOString() : undefined;

            const payload = {
                title: values.title,
                description: values.description,
                priority: values.priority,
                startDate,
                dueDate,
                estimatedHours: values.estimatedHours,
                assigneeId: values.assigneeId,
                collaboratorIds: values.collaboratorIds || [],
                observerIds: values.observerIds || [],
                jobDescriptionTaskId: values.jobDescriptionTaskId,
                jobDescriptionTaskItemId: values.jobDescriptionTaskItemId,
                departmentId: values.departmentId,
            };

            let taskIdToUse: number | null = null;

            if (isEdit && task) {
                await updateMutation.mutateAsync({ id: task.id, data: payload });
                taskIdToUse = task.id;
            } else {
                const createdTask = await createMutation.mutateAsync(payload);
                if (createdTask && createdTask.id) {
                    taskIdToUse = createdTask.id;
                }
            }

            if (taskIdToUse && checklists.length > 0) {
                const failedChecklistTitles: string[] = [];
                for (let i = 0; i < checklists.length; i++) {
                    const chk = checklists[i];
                    if (!chk.id) {
                        try {
                            await callCreateTaskChecklist(taskIdToUse, {
                                title: chk.title,
                                assignedUserId: chk.assignedUserId,
                                sortOrder: i + 1,
                            });
                        } catch (e) {
                            failedChecklistTitles.push(chk.title);
                        }
                    }
                }
                if (failedChecklistTitles.length > 0) {
                    notify.warning(
                        `Không thể tạo mục kiểm tra: ${failedChecklistTitles.join(", ")}`
                    );
                }
            }

            if (taskIdToUse) {
                for (const att of pendingAttachments) {
                    if (att.status === "done" && att.fileName) {
                        await registerAttachmentMutation.mutateAsync({
                            taskId: taskIdToUse,
                            data: {
                                fileName: att.fileName,
                                folder: "task",
                                fileSize: att.fileSize,
                                attachmentCategory: "GUIDANCE",
                            },
                        });
                    }
                }
            }

            onClose();
        } catch (err) {
            // Form validation error
        }
    };

    const assigneeOptions = activeUsersList.filter(
        (u) => !selectedCollabIds.includes(String(u.id)) && !selectedObserverIds.includes(String(u.id))
    );

    const collabOptions = activeUsersList.filter(
        (u) =>
            String(u.id) !== selectedAssigneeId &&
            String(u.id) !== currentUserId &&
            !selectedObserverIds.includes(String(u.id))
    );

    const observerOptions = activeUsersList.filter(
        (u) =>
            String(u.id) !== selectedAssigneeId &&
            String(u.id) !== currentUserId &&
            !selectedCollabIds.includes(String(u.id))
    );

    const completedCount = checklists.filter((c) => c.isCompleted).length;
    const percent = checklists.length > 0 ? Math.round((completedCount / checklists.length) * 100) : 0;
    const isUploadingAttachments = pendingAttachments.some(
        (attachment) => attachment.status === "uploading"
    );
    const isSaving =
        createMutation.isPending ||
        updateMutation.isPending ||
        registerAttachmentMutation.isPending;
    const attachmentCount = existingAttachments.length + pendingAttachments.length;

    return (
        <LotusDetailDrawer open={open} onClose={onClose} destroyOnClose>
            <div className="task-form-shell">
                {/* Header */}
                <div
                    className="task-form-header"
                    style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid #e2e8f0",
                        background: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}
                >
                    <Space align="center" size={12}>
                        <div className="task-form-heading">
                            <Text className="task-form-eyebrow">
                                {isEdit ? `TÁC VỤ #${task?.id}` : "TÁC VỤ MỚI"}
                            </Text>
                            <Title level={5} style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>
                                {isEdit ? "Cập nhật tác vụ" : "Tạo tác vụ"}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {isEdit
                                    ? `Chỉnh sửa tác vụ #${task?.id}`
                                    : "Nội dung · Phân công · Thời hạn"}
                            </Text>
                        </div>
                    </Space>
                    <Space size={10} className="task-form-header__actions">
                        <Button onClick={onClose} className="task-secondary-button">
                            Hủy
                        </Button>
                        <Button
                            className="task-primary-button"
                            type="primary"
                            onClick={handleSubmit}
                            loading={isSaving}
                            disabled={isFetchingTaskDetail || isUploadingAttachments}
                            style={{
                                borderRadius: 8,
                                background: "linear-gradient(135deg, #f06292 0%, #e84373 100%)",
                                borderColor: "#e84373",
                                color: "#ffffff",
                                fontWeight: 600,
                                boxShadow: "0 4px 12px rgba(232, 67, 115, 0.25)",
                            }}
                        >
                            {isEdit ? "Lưu thay đổi" : "Tạo tác vụ"}
                        </Button>
                    </Space>
                </div>

                {/* Form Content Body */}
                <div className="task-form-body">
                    <Form form={form} layout="vertical" className="task-form">
                        <Row gutter={20}>
                            <Col xs={24} md={15} lg={16} className="task-form-main">
                                {/* CARD 1: NỘI DUNG VÀ TÊN TÁC VỤ */}
                                <Card
                                    className="task-form-card task-form-card--content"
                                    size="small"
                                    title={
                                        <Space align="center" size={8}>
                                            <FileTextOutlined style={{ fontSize: 16, color: "#2563eb" }} />
                                            <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                                                Nội dung tác vụ
                                            </Text>
                                        </Space>
                                    }
                                    style={FORM_CARD_STYLE}
                                >
                                    <Form.Item
                                        name="title"
                                        label={<span style={{ fontWeight: 600 }}>Tên tác vụ</span>}
                                        rules={[{ required: true, message: "Vui lòng nhập tên tác vụ" }]}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Input
                                            placeholder="Nhập tên tác vụ..."
                                            maxLength={255}
                                            style={{ borderRadius: 8 }}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="description"
                                        label={<span style={{ fontWeight: 600 }}>Mô tả chi tiết nội dung công việc</span>}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input.TextArea
                                            autoSize={{ minRows: 3, maxRows: 6 }}
                                            placeholder="Nhập mục tiêu, yêu cầu hoặc chi tiết các bước cần hoàn thành..."
                                            style={{ borderRadius: 8 }}
                                            maxLength={5000}
                                        />
                                    </Form.Item>
                                </Card>

                                {/* CARD 2: BITRIX24 CHECKLIST COMPONENT */}
                                {!isChecklistExpanded && checklists.length === 0 ? (
                                    /* Collapsed Pill Bar (Bitrix24 Design) */
                                    <div
                                        className="task-form-collapsed-section"
                                        onClick={() => setIsChecklistExpanded(true)}
                                        style={{
                                            background: "#ffffff",
                                            borderRadius: 14,
                                            border: "1px solid #e2e8f0",
                                            padding: "14px 20px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            cursor: "pointer",
                                            marginBottom: 16,
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = "#cbd5e1";
                                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = "#e2e8f0";
                                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                                        }}
                                    >
                                        <Space size={12} align="center">
                                            <UnorderedListOutlined style={{ fontSize: 18, color: "#2563eb" }} />
                                            <Text style={{ fontSize: 14, color: "#334155", fontWeight: 500 }}>
                                                Danh sách kiểm tra
                                            </Text>
                                        </Space>
                                        <PlusOutlined style={{ fontSize: 16, color: "#94a3b8" }} />
                                    </div>
                                ) : (
                                    /* Expanded Bitrix24 Checklist Panel */
                                    <Card
                                        className="task-form-card"
                                        size="small"
                                        title={
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    width: "100%",
                                                }}
                                            >
                                                <Space size={10} align="center">
                                                    <UnorderedListOutlined style={{ fontSize: 18, color: "#2563eb" }} />
                                                    <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                                                        Danh sách kiểm tra #1
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                                        Đã hoàn thành {completedCount} / {checklists.length}
                                                    </Text>
                                                    {checklists.length > 0 && (
                                                        <Progress
                                                            percent={percent}
                                                            showInfo={false}
                                                            strokeColor="#2563eb"
                                                            style={{ width: 80, margin: 0, marginLeft: 6 }}
                                                        />
                                                    )}
                                                </Space>

                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<CloseOutlined style={{ color: "#94a3b8", fontSize: 12 }} />}
                                                    onClick={() => {
                                                        if (checklists.length === 0) {
                                                            setIsChecklistExpanded(false);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        }
                                        style={FORM_CARD_STYLE}
                                    >
                                        {checklists.length > 0 && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                                                {checklists.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            padding: "6px 0",
                                                            borderBottom: "1px dashed #f1f5f9",
                                                        }}
                                                    >
                                                        <Space size={10} style={{ flex: 1 }}>
                                                            <div
                                                                style={{
                                                                    width: 16,
                                                                    height: 16,
                                                                    borderRadius: 4,
                                                                    border: "1.5px solid #cbd5e1",
                                                                    background: "#ffffff",
                                                                }}
                                                            />
                                                            <Text style={{ fontSize: 13, color: "#334155" }}>{item.title}</Text>
                                                        </Space>
                                                        <Button
                                                            type="text"
                                                            danger
                                                            size="small"
                                                            icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                                                            onClick={() => handleRemoveChecklist(idx)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                                            <Text style={{ color: "#64748b", fontSize: 16, fontWeight: 300 }}>+</Text>
                                            <Input
                                                ref={checklistInputRef}
                                                variant="borderless"
                                                placeholder="Thêm mục (Nhập tên mục rồi bấm Enter)..."
                                                value={newChecklistTitle}
                                                onChange={(e) => setNewChecklistTitle(e.target.value)}
                                                onPressEnter={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleAddChecklist(e);
                                                }}
                                                style={{ fontSize: 13, padding: "4px 0", color: "#334155" }}
                                            />
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                marginTop: 14,
                                                paddingTop: 12,
                                                borderTop: "1px solid #f1f5f9",
                                            }}
                                        >
                                            <Button
                                                type="text"
                                                icon={<PlusOutlined style={{ fontSize: 13, color: "#64748b" }} />}
                                                style={{ color: "#475569", fontSize: 13, padding: 0 }}
                                                onClick={() => {
                                                    setIsChecklistExpanded(true);
                                                    if (newChecklistTitle.trim()) {
                                                        handleAddChecklist();
                                                    }
                                                    setTimeout(() => {
                                                        checklistInputRef.current?.focus();
                                                    }, 50);
                                                }}
                                            >
                                                Danh sách kiểm tra mới
                                            </Button>
                                        </div>
                                    </Card>
                                )}

                                {/* CARD: TÀI LIỆU GIAO VIỆC */}
                                <Card
                                    className="task-form-card"
                                    size="small"
                                    title={
                                        <Space align="center" size={8}>
                                            <PaperClipOutlined style={{ fontSize: 16, color: "#f59e0b" }} />
                                            <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                                                Tài liệu giao việc
                                                {attachmentCount > 0 ? ` (${attachmentCount})` : ""}
                                            </Text>
                                        </Space>
                                    }
                                    style={FORM_CARD_STYLE}
                                >
                                    {existingAttachments.length > 0 && (
                                        <div className="task-attachment-section">
                                            <Text className="task-attachment-section__label">
                                                Tài liệu đã cung cấp ({existingAttachments.length})
                                            </Text>
                                            <div className="task-attachment-list">
                                                {existingAttachments.map((attachment) => {
                                                    const displayName = cleanFileName(attachment.fileName);
                                                    const { icon, bgColor } = getFileIconAndBg(attachment.fileName);

                                                    return (
                                                        <div
                                                            className="task-attachment-row task-attachment-row--saved"
                                                            key={attachment.id}
                                                        >
                                                            <div className="task-attachment-row__main">
                                                                <div
                                                                    className="task-attachment-row__icon"
                                                                    style={{ backgroundColor: bgColor }}
                                                                >
                                                                    {icon}
                                                                </div>
                                                                <div className="task-attachment-row__copy">
                                                                    <Text
                                                                        ellipsis={{ tooltip: displayName }}
                                                                        className="task-attachment-row__name"
                                                                    >
                                                                        {displayName}
                                                                    </Text>
                                                                    <Text className="task-attachment-row__meta">
                                                                        {formatFileSize(attachment.fileSize || 0)}
                                                                        {attachment.uploadedByName
                                                                            ? ` · ${attachment.uploadedByName}`
                                                                            : ""}
                                                                    </Text>
                                                                </div>
                                                            </div>
                                                            <Space size={4}>
                                                                <Tooltip title="Xem tập tin">
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={<EyeOutlined />}
                                                                        href={`/api/v1/files/view?fileName=${encodeURIComponent(attachment.fileName)}`}
                                                                        target="_blank"
                                                                    />
                                                                </Tooltip>
                                                                <Tooltip title="Tải tập tin">
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={<DownloadOutlined />}
                                                                        href={`/api/v1/files/download?fileName=${encodeURIComponent(attachment.fileName)}`}
                                                                        target="_blank"
                                                                    />
                                                                </Tooltip>
                                                            </Space>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {pendingAttachments.length > 0 && (
                                        <div className="task-attachment-section">
                                            <Text className="task-attachment-section__label">
                                                Tài liệu mới chờ lưu ({pendingAttachments.length})
                                            </Text>
                                            <div className="task-attachment-list">
                                                {pendingAttachments.map((att) => {
                                                    const { icon, bgColor } = getFileIconAndBg(att.originalName);
                                                    return (
                                                        <div
                                                            key={att.uid}
                                                            className="task-attachment-row task-attachment-row--pending"
                                                        >
                                                            <div className="task-attachment-row__main">
                                                                <div
                                                                    className="task-attachment-row__icon"
                                                                    style={{ backgroundColor: bgColor }}
                                                                >
                                                                    {icon}
                                                                </div>
                                                                <div className="task-attachment-row__copy">
                                                                    <Text
                                                                        ellipsis
                                                                        className="task-attachment-row__name"
                                                                    >
                                                                        {att.originalName}
                                                                    </Text>
                                                                    <div className="task-attachment-row__status">
                                                                        <Text className="task-attachment-row__meta">
                                                                            {formatFileSize(att.fileSize)}
                                                                        </Text>
                                                                        {att.status === "uploading" && (
                                                                            <Tag color="processing">
                                                                                Đang tải...
                                                                            </Tag>
                                                                        )}
                                                                        {att.status === "error" && (
                                                                            <Tag color="error">
                                                                                Tải lên thất bại
                                                                            </Tag>
                                                                        )}
                                                                        {att.status === "done" && (
                                                                            <Tag color="success">Sẵn sàng lưu</Tag>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Tooltip title="Xóa tệp tin">
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    size="small"
                                                                    icon={<DeleteOutlined style={{ fontSize: 15 }} />}
                                                                    onClick={() => handleRemovePendingAttachment(att.uid)}
                                                                    style={{ borderRadius: 6 }}
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <Dragger
                                        className="task-attachment-uploader"
                                        multiple
                                        showUploadList={false}
                                        accept={ALLOWED_ATTACHMENT_EXT}
                                        beforeUpload={handleBeforeUpload}
                                    >
                                        <InboxOutlined className="task-attachment-uploader__icon" />
                                        <Text className="task-attachment-uploader__title">
                                            Kéo thả tài liệu giao việc hoặc bấm để chọn
                                        </Text>
                                        <Text className="task-attachment-uploader__hint">
                                            Nhân viên sẽ xem tài liệu này tại tab Tài liệu & kết quả
                                        </Text>
                                    </Dragger>
                                </Card>

                                {/* CARD: NHÂN SỰ HỖ TRỢ & THEO DÕI */}
                                <Card
                                    className="task-form-card"
                                    size="small"
                                    title={
                                        <Space align="center" size={8}>
                                            <TeamOutlined style={{ fontSize: 16, color: "#8b5cf6" }} />
                                            <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                                                Nhân sự hỗ trợ & Theo dõi
                                            </Text>
                                        </Space>
                                    }
                                    style={FORM_CARD_STYLE}
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="collaboratorIds"
                                                label={<span style={{ fontWeight: 600 }}>Người phối hợp (Collaborators)</span>}
                                                help="Cùng làm việc & cập nhật tiến độ"
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Select
                                                    mode="multiple"
                                                    showSearch
                                                    placeholder="Chọn người phối hợp..."
                                                    optionFilterProp="label"
                                                    onChange={handleCollabChange}
                                                    tagRender={(tagProps) => {
                                                        const { label, value, closable, onClose } = tagProps;
                                                        const foundUser = usersList.find((u) => String(u.id) === String(value));
                                                        const displayName = foundUser?.name || (typeof label === "string" ? label : "");
                                                        const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";
                                                        return (
                                                            <Tag
                                                                closable={closable}
                                                                onClose={onClose}
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: 5,
                                                                    padding: "2px 8px 2px 4px",
                                                                    borderRadius: 16,
                                                                    backgroundColor: "#f1f5f9",
                                                                    borderColor: "#cbd5e1",
                                                                    color: "#1e293b",
                                                                    fontWeight: 500,
                                                                    fontSize: 12,
                                                                    marginRight: 4,
                                                                    marginTop: 2,
                                                                    marginBottom: 2,
                                                                }}
                                                            >
                                                                <Avatar
                                                                    size={18}
                                                                    style={{ backgroundColor: "#8b5cf6", fontSize: 10, fontWeight: 600, flexShrink: 0 }}
                                                                >
                                                                    {initial}
                                                                </Avatar>
                                                                <span>{displayName}</span>
                                                            </Tag>
                                                        );
                                                    }}
                                                    style={{ borderRadius: 8, width: "100%" }}
                                                >
                                                    {collabOptions.map((u) => (
                                                        <Select.Option key={u.id} value={String(u.id)} label={`${u.name} ${u.email || ""}`}>
                                                            <Space align="center" size={8}>
                                                                <Avatar
                                                                    size={22}
                                                                    style={{ backgroundColor: "#8b5cf6", fontSize: 11, fontWeight: 600, flexShrink: 0 }}
                                                                >
                                                                    {u.name?.charAt(0).toUpperCase()}
                                                                </Avatar>
                                                                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                                                                    <span style={{ fontWeight: 500, color: "#1e293b", fontSize: 13 }}>{u.name}</span>
                                                                    {u.email && <span style={{ fontSize: 11, color: "#94a3b8" }}>{u.email}</span>}
                                                                </div>
                                                            </Space>
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="observerIds"
                                                label={<span style={{ fontWeight: 600 }}>Người quan sát (Observers)</span>}
                                                help="Quyền theo dõi Read-only, nhận thông báo"
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Select
                                                    mode="multiple"
                                                    showSearch
                                                    placeholder="Chọn người quan sát..."
                                                    optionFilterProp="label"
                                                    onChange={handleObserverChange}
                                                    tagRender={(tagProps) => {
                                                        const { label, value, closable, onClose } = tagProps;
                                                        const foundUser = usersList.find((u) => String(u.id) === String(value));
                                                        const displayName = foundUser?.name || (typeof label === "string" ? label : "");
                                                        const initial = displayName ? displayName.charAt(0).toUpperCase() : "U";
                                                        return (
                                                            <Tag
                                                                closable={closable}
                                                                onClose={onClose}
                                                                style={{
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: 5,
                                                                    padding: "2px 8px 2px 4px",
                                                                    borderRadius: 16,
                                                                    backgroundColor: "#f1f5f9",
                                                                    borderColor: "#cbd5e1",
                                                                    color: "#1e293b",
                                                                    fontWeight: 500,
                                                                    fontSize: 12,
                                                                    marginRight: 4,
                                                                    marginTop: 2,
                                                                    marginBottom: 2,
                                                                }}
                                                            >
                                                                <Avatar
                                                                    size={18}
                                                                    style={{ backgroundColor: "#06b6d4", fontSize: 10, fontWeight: 600, flexShrink: 0 }}
                                                                >
                                                                    {initial}
                                                                </Avatar>
                                                                <span>{displayName}</span>
                                                            </Tag>
                                                        );
                                                    }}
                                                    style={{ borderRadius: 8, width: "100%" }}
                                                >
                                                    {observerOptions.map((u) => (
                                                        <Select.Option key={u.id} value={String(u.id)} label={`${u.name} ${u.email || ""}`}>
                                                            <Space align="center" size={8}>
                                                                <Avatar
                                                                    size={22}
                                                                    style={{ backgroundColor: "#06b6d4", fontSize: 11, fontWeight: 600, flexShrink: 0 }}
                                                                >
                                                                    {u.name?.charAt(0).toUpperCase()}
                                                                </Avatar>
                                                                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                                                                    <span style={{ fontWeight: 500, color: "#1e293b", fontSize: 13 }}>{u.name}</span>
                                                                    {u.email && <span style={{ fontSize: 11, color: "#94a3b8" }}>{u.email}</span>}
                                                                </div>
                                                            </Space>
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>

                            </Col>

                            <Col xs={24} md={9} lg={8} className="task-form-aside">
                                {/* SIDEBAR: THÔNG TIN & PHÂN CÔNG */}
                                <Card
                                    className="task-form-card task-form-sidebar-card"
                                    size="small"
                                    title={
                                        <Space align="center" size={8}>
                                            <UserOutlined style={{ fontSize: 16, color: "#10b981" }} />
                                            <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                                                Thông tin & Phân công
                                            </Text>
                                        </Space>
                                    }
                                    style={FORM_CARD_STYLE}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                            gap: 8,
                                        }}
                                    >
                                        <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>
                                            Chủ sở hữu:
                                        </Text>
                                        <Space size={8}>
                                            <Avatar size="small" style={{ backgroundColor: "#ec4899" }}>
                                                {currentUserName.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Text strong style={{ color: "#1e293b", fontSize: 13 }}>
                                                {currentUserName}
                                            </Text>
                                            <Tag color="pink" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
                                                Người tạo
                                            </Tag>
                                        </Space>
                                    </div>

                                    <Divider style={{ margin: "12px 0" }} />

                                    <Form.Item
                                        name="companyId"
                                        label={<span style={{ fontWeight: 600 }}>Công ty</span>}
                                        rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Select
                                            showSearch
                                            allowClear
                                            placeholder="Chọn công ty..."
                                            optionFilterProp="children"
                                            onChange={(val) => {
                                                setSelectedCompanyId(val);
                                                setSelectedDepartmentId(undefined);
                                                form.setFieldValue("departmentId", undefined);
                                            }}
                                            style={{ borderRadius: 8, width: "100%" }}
                                        >
                                            {companies.map((c) => (
                                                <Select.Option key={c.id} value={c.id}>
                                                    {c.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item
                                        name="departmentId"
                                        label={<span style={{ fontWeight: 600 }}>Phòng ban</span>}
                                        rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Select
                                            showSearch
                                            allowClear
                                            placeholder="Chọn phòng ban..."
                                            optionFilterProp="children"
                                            onChange={(val) => setSelectedDepartmentId(val)}
                                            style={{ borderRadius: 8, width: "100%" }}
                                        >
                                            {departments.map((d) => (
                                                <Select.Option key={d.id} value={d.id}>
                                                    {d.name}
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item
                                        name="assigneeId"
                                        label={<span style={{ fontWeight: 600 }}>Người thực hiện chính</span>}
                                        rules={[{ required: true, message: "Vui lòng chọn người thực hiện chính" }]}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Select
                                            showSearch
                                            disabled={isEdit && task?.status !== "TODO"}
                                            placeholder="Chọn nhân viên thực hiện chính..."
                                            optionFilterProp="label"
                                            onChange={handleAssigneeChange}
                                            style={{ borderRadius: 8, width: "100%" }}
                                        >
                                            {assigneeOptions.map((u) => (
                                                <Select.Option key={u.id} value={String(u.id)} label={`${u.name} ${u.email || ""}`}>
                                                    <Space align="center" size={8}>
                                                        <Avatar
                                                            size={22}
                                                            style={{ backgroundColor: "#3b82f6", fontSize: 11, fontWeight: 600, flexShrink: 0 }}
                                                        >
                                                            {u.name?.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                                                            <span style={{ fontWeight: 500, color: "#1e293b", fontSize: 13 }}>{u.name}</span>
                                                            {u.email && <span style={{ fontSize: 11, color: "#94a3b8" }}>{u.email}</span>}
                                                        </div>
                                                    </Space>
                                                </Select.Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item
                                        name="priority"
                                        label={<span style={{ fontWeight: 600 }}>Độ ưu tiên</span>}
                                        initialValue="MEDIUM"
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Select
                                            style={{ borderRadius: 8, width: "100%" }}
                                            optionLabelProp="label"
                                        >
                                            {(Object.keys(TASK_PRIORITY_META) as Array<keyof typeof TASK_PRIORITY_META>).map(
                                                (value) => (
                                                    <Select.Option
                                                        key={value}
                                                        value={value}
                                                        label={renderTaskPriorityTag(value)}
                                                    >
                                                        <div style={{ padding: "2px 4px" }}>
                                                            {renderTaskPriorityTag(value)}
                                                        </div>
                                                    </Select.Option>
                                                )
                                            )}
                                        </Select>
                                    </Form.Item>

                                    <Divider style={{ margin: "12px 0" }} />

                                    <Form.Item
                                        name="dateRange"
                                        label={
                                            <span style={{ fontWeight: 600 }}>
                                                Thời gian thực hiện (Từ ngày → Hạn chót)
                                            </span>
                                        }
                                        rules={[{ required: true, message: "Vui lòng chọn thời gian thực hiện tác vụ" }]}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <DatePicker.RangePicker
                                            showTime={{ format: "HH:mm", minuteStep: 15 }}
                                            format="DD/MM/YYYY HH:mm"
                                            presets={RANGE_PRESETS}
                                            disabledDate={(current) => current && current < dayjs().startOf("day")}
                                            style={{ width: "100%", borderRadius: 8 }}
                                            placeholder={["Ngày bắt đầu", "Hạn chót"]}
                                            suffixIcon={<CalendarOutlined style={{ color: "#10b981" }} />}
                                            separator={<span style={{ color: "#94a3b8" }}>→</span>}
                                            allowClear
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="estimatedHours"
                                        label={<span style={{ fontWeight: 600 }}>Ước tính (Giờ)</span>}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <InputNumber
                                            min={0}
                                            step={0.5}
                                            style={{ width: "100%", borderRadius: 8 }}
                                            placeholder="Ví dụ: 8.5"
                                        />
                                    </Form.Item>

                                    {/* JD (Nhiệm vụ theo Job Description) */}
                                    <div style={JD_CARD_STYLE}>
                                        <Form.Item name="jobDescriptionTaskId" hidden>
                                            <Input />
                                        </Form.Item>
                                        <Form.Item name="jobDescriptionTaskItemId" hidden>
                                            <Input />
                                        </Form.Item>
                                        <Form.Item
                                            label={
                                                <span style={{ fontWeight: 600, color: "#0f172a" }}>
                                                    <BookOutlined style={{ color: "#2563eb", marginRight: 6 }} /> Gắn với Nhiệm vụ JD
                                                </span>
                                            }
                                            style={{ marginBottom: 8 }}
                                        >
                                            <Form.Item noStyle shouldUpdate={(prev, cur) =>
                                                prev.jobDescriptionTaskId !== cur.jobDescriptionTaskId ||
                                                prev.jobDescriptionTaskItemId !== cur.jobDescriptionTaskItemId
                                            }>
                                                {({ getFieldValue }) => {
                                                    const currentTaskId = getFieldValue("jobDescriptionTaskId");
                                                    const currentItemId = getFieldValue("jobDescriptionTaskItemId");
                                                    const compositeValue = currentTaskId
                                                        ? currentItemId
                                                            ? `item-${currentItemId}`
                                                            : `task-${currentTaskId}`
                                                        : undefined;
                                                    return (
                                                        <Select
                                                            placeholder={
                                                                selectedAssigneeId
                                                                    ? "Chọn nhiệm vụ JD phù hợp..."
                                                                    : "Chọn người thực hiện chính trước..."
                                                            }
                                                            disabled={!selectedAssigneeId}
                                                            allowClear
                                                            value={compositeValue}
                                                            onChange={handleJdTaskChange}
                                                            style={{ borderRadius: 8, background: "#ffffff", width: "100%" }}
                                                            className="jd-task-select"
                                                            popupClassName="jd-task-select-dropdown"
                                                            popupMatchSelectWidth={440}
                                                            listHeight={340}
                                                            optionLabelProp="label"
                                                        >
                                                            {jdTasksList.map((jd: any) => (
                                                                <Select.OptGroup
                                                                    key={jd.id}
                                                                    label={
                                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f172a", fontWeight: 700, fontSize: 12.5, padding: "2px 0" }}>
                                                                            <FolderOutlined style={{ color: "#2563eb", fontSize: 13 }} />
                                                                            <span>{jd.title}</span>
                                                                        </div>
                                                                    }
                                                                >
                                                                    <Select.Option
                                                                        key={`task-${jd.id}`}
                                                                        value={`task-${jd.id}`}
                                                                        label={jd.title}
                                                                        title={jd.title}
                                                                    >
                                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0 2px 4px", color: "#2563eb" }}>
                                                                            <span style={{ fontWeight: 600, fontSize: 12.5 }}>
                                                                                • Chọn toàn bộ nhóm nhiệm vụ này
                                                                            </span>
                                                                        </div>
                                                                    </Select.Option>
                                                                    {(jd.items ?? []).map((item: any, idx: number) => (
                                                                        <Select.Option
                                                                            key={`item-${item.id}`}
                                                                            value={`item-${item.id}`}
                                                                            label={`${jd.orderNo ?? "•"}.${idx + 1} ${item.content}`}
                                                                            title={`${jd.orderNo ?? "•"}.${idx + 1} ${item.content}`}
                                                                        >
                                                                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "2px 0 2px 4px" }}>
                                                                                <span
                                                                                    style={{
                                                                                        display: "inline-flex",
                                                                                        alignItems: "center",
                                                                                        justifyContent: "center",
                                                                                        minWidth: 28,
                                                                                        height: 20,
                                                                                        padding: "0 6px",
                                                                                        borderRadius: 4,
                                                                                        background: "#e0f2fe",
                                                                                        color: "#0369a1",
                                                                                        fontSize: 11,
                                                                                        fontWeight: 700,
                                                                                        flexShrink: 0,
                                                                                        marginTop: 1,
                                                                                    }}
                                                                                >
                                                                                    {jd.orderNo ?? "•"}.{idx + 1}
                                                                                </span>
                                                                                <span style={{ flex: 1, color: "#334155", fontSize: 12.5, lineHeight: 1.45, wordBreak: "break-word" }}>
                                                                                    {item.content}
                                                                                </span>
                                                                            </div>
                                                                        </Select.Option>
                                                                    ))}
                                                                </Select.OptGroup>
                                                            ))}
                                                        </Select>
                                                    );
                                                }}
                                            </Form.Item>
                                        </Form.Item>
                                        <Text type="secondary" style={{ fontSize: 12, color: "#64748b", display: "block", lineHeight: 1.4 }}>
                                            Tự động liên kết tiến độ tác vụ với chỉ tiêu công việc định kỳ của nhân viên
                                        </Text>
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </div>
        </LotusDetailDrawer>
    );
};

export default TaskFormDrawer;
