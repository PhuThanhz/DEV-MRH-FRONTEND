import React from "react";
import {
    Card,
    Row,
    Col,
    Progress,
    Input,
    Select,
    Button,
    List,
    Popconfirm,
    Checkbox,
    Typography,
    Tag,
} from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, PlusOutlined } from "@ant-design/icons";
import type { TaskContext } from "../../taskContext";

const { Text } = Typography;

interface Props {
    taskId: number;
    checklists: any[];
    completedChecklists: number;
    totalChecklists: number;
    checklistPercent: number;
    viewerContext: TaskContext;
    currentUserId: string;
    assignableUsers: Array<{ id: string; name: string }>;
    newChecklistTitle: string;
    setNewChecklistTitle: (val: string) => void;
    newChecklistAssignedUser: string | undefined;
    setNewChecklistAssignedUser: (val: string | undefined) => void;
    handleAddChecklist: () => void;
    isCreatePending: boolean;
    toggleChecklistMutation: any;
    deleteChecklistMutation: any;
}

export const TaskDetailChecklistTab: React.FC<Props> = ({
    taskId,
    checklists,
    completedChecklists,
    totalChecklists,
    checklistPercent,
    viewerContext,
    currentUserId,
    assignableUsers,
    newChecklistTitle,
    setNewChecklistTitle,
    newChecklistAssignedUser,
    setNewChecklistAssignedUser,
    handleAddChecklist,
    isCreatePending,
    toggleChecklistMutation,
    deleteChecklistMutation,
}) => {
    const [showAddForm, setShowAddForm] = React.useState(false);

    const canManageChecklist =
        !viewerContext.isObserver &&
        (viewerContext.isCreator || viewerContext.isAssignee || viewerContext.isSuperAdmin);

    const handleFormSubmit = () => {
        handleAddChecklist();
        // Giữ form mở để có thể thêm nhiều mục liên tiếp, hoặc đóng nếu không nhập nữa
    };

    return (
        <Card
            className="task-checklist-card"
            size="small"
            title={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Danh sách việc cần làm ({completedChecklists}/{totalChecklists})</span>
                    {canManageChecklist && totalChecklists > 0 && !showAddForm && (
                        <Button
                            type="primary"
                            ghost
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setShowAddForm(true)}
                            style={{ borderRadius: 6 }}
                        >
                            Thêm mục
                        </Button>
                    )}
                </div>
            }
            style={{ borderRadius: 14 }}
        >
            <Progress percent={checklistPercent} size="small" style={{ marginBottom: 16 }} />

            {canManageChecklist && showAddForm && (
                <div
                    style={{
                        padding: 12,
                        marginBottom: 16,
                        borderRadius: 10,
                        background: "#fafafa",
                        border: "1px dashed #d9d9d9",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 12.5, color: "#475569" }}>
                            Thêm mục việc cần làm mới
                        </Text>
                        <Button type="text" size="small" onClick={() => setShowAddForm(false)} style={{ color: "#94a3b8" }}>
                            Đóng
                        </Button>
                    </div>
                    <Row gutter={[8, 8]}>
                        <Col xs={24} sm={12}>
                            <Input
                                placeholder="Nội dung việc cần làm..."
                                value={newChecklistTitle}
                                onChange={(e) => setNewChecklistTitle(e.target.value)}
                                onPressEnter={handleFormSubmit}
                                autoFocus
                            />
                        </Col>
                        <Col xs={16} sm={8}>
                            <Select
                                placeholder="Người thực hiện (Tùy chọn)"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                style={{ width: "100%" }}
                                value={newChecklistAssignedUser}
                                onChange={(v) => setNewChecklistAssignedUser(v)}
                                options={assignableUsers.map((user) => ({
                                    value: user.id,
                                    label: user.name,
                                }))}
                                notFoundContent="Tác vụ chưa có người phối hợp"
                            />
                        </Col>
                        <Col xs={8} sm={4}>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleFormSubmit}
                                loading={isCreatePending}
                                block
                            >
                                Lưu
                            </Button>
                        </Col>
                    </Row>
                </div>
            )}

            <List
                size="small"
                dataSource={checklists}
                locale={{
                    emptyText: (
                        <div className="task-checklist-empty" style={{ padding: "24px 0" }}>
                            <strong>Chưa có việc cần làm</strong>
                            <span style={{ marginBottom: 12 }}>Tác vụ này chưa có danh sách kiểm tra chi tiết.</span>
                            {canManageChecklist && !showAddForm && (
                                <Button
                                    type="primary"
                                    ghost
                                    icon={<PlusOutlined />}
                                    onClick={() => setShowAddForm(true)}
                                >
                                    Tạo việc cần làm mới
                                </Button>
                            )}
                        </div>
                    ),
                }}
                renderItem={(item: any) => {
                    const isAssignedToMe = String(item.assignedUserId || "") === currentUserId;
                    const canToggle =
                        viewerContext.isSuperAdmin ||
                        viewerContext.isCreator ||
                        viewerContext.isAssignee ||
                        (viewerContext.isCollaborator && isAssignedToMe);

                    return (
                        <List.Item
                            actions={
                                !viewerContext.isObserver &&
                                (viewerContext.isCreator || viewerContext.isAssignee || viewerContext.isSuperAdmin)
                                    ? [
                                          <Popconfirm
                                              key="delete"
                                              title="Xóa mục checklist này?"
                                              onConfirm={() =>
                                                  deleteChecklistMutation.mutateAsync({
                                                      taskId,
                                                      checklistId: item.id,
                                                  })
                                              }
                                          >
                                              <Button type="link" danger size="small">
                                                  Xóa
                                              </Button>
                                          </Popconfirm>,
                                      ]
                                    : []
                            }
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                                {canToggle ? (
                                    <Checkbox
                                        checked={item.isCompleted}
                                        onChange={(e) => {
                                            if (!taskId) return;
                                            toggleChecklistMutation.mutateAsync({
                                                taskId,
                                                checklistId: item.id,
                                                isCompleted: e.target.checked,
                                            });
                                        }}
                                    />
                                ) : item.isCompleted ? (
                                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                                ) : (
                                    <ClockCircleOutlined style={{ color: "#bfbfbf" }} />
                                )}

                                <Text
                                    delete={item.isCompleted}
                                    style={{ flex: 1, color: item.isCompleted ? "#8c8c8c" : "inherit" }}
                                >
                                    {item.title}
                                </Text>

                                {item.assignedUserName && (
                                    <Tag color="blue" style={{ fontSize: 11 }}>
                                        👤 {item.assignedUserName}
                                    </Tag>
                                )}
                            </div>
                        </List.Item>
                    );
                }}
            />
        </Card>
    );
};

export default TaskDetailChecklistTab;
