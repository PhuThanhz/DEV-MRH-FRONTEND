import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button, DatePicker, Skeleton, Space, Typography } from "antd";
import { EditOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import {
    useDepartmentObjectivesQuery,
    useCreateDepartmentObjectiveMutation,
} from "@/hooks/useDepartmentObjectives";
import { useSectionsQuery } from "@/hooks/useSections";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";

import ObjectivesSection from "./components/ObjectivesSection";
import TasksSection from "./components/TasksSection";
import AuthoritiesSection from "./components/AuthoritiesSection";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";
import { notify } from "@/components/common/notification/notify";

import type { IDepartmentMissionTree } from "@/types/backend";

const { Title, Text } = Typography;

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

const DepartmentObjectivesPage = () => {
    const { departmentId } = useParams();
    const location = useLocation();
    const idNumber = departmentId ? Number(departmentId) : undefined;
    const deptNavPages = useDeptNavPages();

    const { data, isLoading, error } = useDepartmentObjectivesQuery(idNumber);
    const { data: sectionData } = useSectionsQuery(
        `page=1&size=100&filter=department.id:${idNumber}`
    );

    useEffect(() => {
        if (error) {
            notify.error((error as any)?.message || "Lỗi khi tải dữ liệu mục tiêu phòng ban");
        }
    }, [error]);
    const { mutateAsync: createObjective, isPending } =
        useCreateDepartmentObjectiveMutation();

    const mission: IDepartmentMissionTree | undefined = data;

    const [objectives, setObjectives] = useState<LocalObjectiveItem[]>([]);
    const [sections, setSections] = useState<LocalSectionTask[]>([]);
    const [generalTasks, setGeneralTasks] = useState<LocalTaskItem[]>([]);
    const [authorities, setAuthorities] = useState<LocalAuthorityItem[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [issueDate, setIssueDate] = useState<Dayjs | null>(null);

    const hasSections = mission?.hasSections ?? false;

    const departmentName = useMemo(() => {
        const p = new URLSearchParams(location.search);
        return p.get("departmentName") || mission?.department?.name || "";
    }, [location.search, mission]);

    useEffect(() => {
        if (!mission) return;

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

        // ĐỒNG BỘ CÁC BỘ PHẬN (SECTIONS) - Ưu tiên mảng từ mission.tasks để giữ đúng thứ tự Backend trả về
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

        // LUÔN KIỂM TRA VÀ HIỂN THỊ generalTasks (Nhiệm vụ chung)
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
    }, [mission, sectionData]);

    const handleSave = async () => {
        if (!idNumber) return;
        try {
            await createObjective({
                departmentId: idNumber,
                issueDate: issueDate ? issueDate.format("YYYY-MM-DD") : undefined,
                objectives,
                tasks: [
                    ...(hasSections ? sections.map((s) => ({ sectionId: s.sectionId, items: s.items })) : []),
                    { sectionId: undefined, items: generalTasks }
                ],
                authorities,
            } as any);
            setEditMode(false);
        } catch {
            // lỗi đã xử lý trong hook
        }
    };

    return (
        <PageContainer title="Mục tiêu - Nhiệm vụ phòng ban">

            {/* HEADER */}
            <div style={{
                background: "#fff",
                borderBottom: "1px solid #f0f0f0",
                padding: "20px 32px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
            }}>
                <Space direction="vertical" size={2}>
                    <Text style={{
                        fontSize: 11, textTransform: "uppercase",
                        letterSpacing: ".06em", color: ACCENT,
                        fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
                    }}>
                        <span style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: ACCENT, display: "inline-block",
                        }} />
                        Phòng ban
                    </Text>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: "-.01em" }}>
                        {departmentName || "—"}
                    </Title>
                    <Space size={6} align="center" style={{ marginTop: 2 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Ngày ban hành —
                        </Text>
                        {editMode ? (
                            <DatePicker
                                value={issueDate}
                                onChange={(d) => setIssueDate(d)}
                                format="DD/MM/YYYY"
                                placeholder="Chọn ngày"
                                size="small"
                            />
                        ) : (
                            <Text style={{ fontSize: 13, color: issueDate ? "#111" : "#aaa" }}>
                                {issueDate ? issueDate.format("DD/MM/YYYY") : "Chưa cập nhật"}
                            </Text>
                        )}
                    </Space>
                </Space>
                <Access permission={ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.CREATE} hideChildren>
                    <Space>

                        {!editMode && (
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => setEditMode(true)}
                            >
                                Chỉnh sửa
                            </Button>
                        )}


                        {editMode && (
                            <>
                                <Button
                                    icon={<CloseOutlined />}
                                    onClick={() => setEditMode(false)}
                                    disabled={isPending}
                                >
                                    Huỷ
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    loading={isPending}
                                    onClick={handleSave}
                                >
                                    Lưu thay đổi
                                </Button>
                            </>
                        )}
                    </Space>
                </Access>
            </div>

            {/* EDIT BANNER */}
            {editMode && (
                <div style={{
                    background: "#fffbe6",
                    borderBottom: "1px solid #ffe58f",
                    padding: "8px 32px",
                    fontSize: 13,
                    color: "#874d00",
                }}>
                    Đang chỉnh sửa — nhớ lưu thay đổi trước khi rời trang
                </div>
            )}

            {/* BODY */}
            <div style={{ padding: "28px 32px 56px", background: "#f8f9fb", minHeight: "80vh" }}>
                {isLoading ? (
                    <Space direction="vertical" style={{ width: "100%" }} size={16}>
                        {[1, 2, 3].map(i => <Skeleton key={i} active paragraph={{ rows: 3 }} />)}
                    </Space>
                ) : (
                    <Space direction="vertical" size={32} style={{ width: "100%" }}>

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

            {/* FLOATING NAV */}
            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default DepartmentObjectivesPage;