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

import ObjectivesSection from "./components/ObjectivesSection";
import TasksSection from "./components/TasksSection";
import AuthoritiesSection from "./components/AuthoritiesSection";

import type { IDepartmentMissionTree } from "@/types/backend";

const { Title, Text } = Typography;

export interface LocalObjectiveItem { id?: number; content: string; orderNo: number }
export interface LocalTaskItem { id?: number; content: string; orderNo: number }
export interface LocalSectionTask { sectionId: number; sectionName: string; items: LocalTaskItem[] }
export interface LocalAuthorityItem { id?: number; content: string; orderNo: number }

const ACCENT = "#e8637a";

const DepartmentObjectivesPage = () => {
    const { departmentId } = useParams();
    const location = useLocation();
    const idNumber = departmentId ? Number(departmentId) : undefined;

    const { data, isLoading } = useDepartmentObjectivesQuery(idNumber);
    const { data: sectionData } = useSectionsQuery(
        `page=1&size=100&filter=department.id:${idNumber}`
    );
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
                id: o.id, content: o.content, orderNo: i + 1,
            })) || []
        );

        if (mission.issueDate) setIssueDate(dayjs(mission.issueDate));

        setAuthorities(
            mission.authorities?.map((a, i) => ({
                id: a.id, content: a.content, orderNo: i + 1,
            })) || []
        );

        if (mission.hasSections) {
            const allSections = sectionData?.result || [];
            const missionTasks = mission.tasks || [];
            setSections(
                allSections.map((sec) => {
                    const found = missionTasks.find((t) => t.sectionId === sec.id);
                    return {
                        sectionId: sec.id!,
                        sectionName: sec.name,
                        items: found?.tasks?.map((t, i) => ({
                            id: t.id, content: t.content, orderNo: i + 1,
                        })) || [],
                    };
                })
            );
        } else {
            setGeneralTasks(
                mission.generalTasks?.map((t, i) => ({
                    id: t.id, content: t.content, orderNo: i + 1,
                })) || []
            );
        }
    }, [mission, sectionData]);

    const handleSave = async () => {
        if (!idNumber) return;
        try {
            await createObjective({
                departmentId: idNumber,
                issueDate: issueDate ? issueDate.format("YYYY-MM-DD") : undefined,
                objectives,
                tasks: hasSections
                    ? sections.map((s) => ({ sectionId: s.sectionId, items: s.items }))
                    : [{ sectionId: undefined, items: generalTasks }],
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

                <Space>
                    {!editMode ? (
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => setEditMode(true)}
                        >
                            Chỉnh sửa
                        </Button>
                    ) : (
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
        </PageContainer>
    );
};

export default DepartmentObjectivesPage;