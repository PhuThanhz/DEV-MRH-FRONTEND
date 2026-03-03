import {
    ModalForm,
    ProFormText,
    ProFormTextArea,
    ProFormSelect,
    ProFormDatePicker,
} from "@ant-design/pro-components";
import {
    Form,
    Row,
    Col,
    Tabs,
    Typography,
    Card,
    Button,
    Input,
} from "antd";
import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
} from "reactflow";
import type { NodeProps } from "reactflow";
import "reactflow/dist/style.css";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dataInit: any | null;
    onFinish: (values: any) => void;
}

const pinkColor = "#ff4d8b";

// ===== CUSTOM EDITABLE NODE =====
const EditableNode = ({ id, data }: NodeProps) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(data.label);

    const handleBlur = () => {
        setEditing(false);
        data.onChange(id, value);
    };

    return (
        <div
            style={{
                background: "#fff",
                border: `2px solid ${pinkColor}`,
                borderRadius: 8,
                padding: "8px 16px",
                minWidth: 140,
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(255,77,139,0.15)",
                cursor: "pointer",
            }}
        >
            {/* Handle trên (nhận kết nối từ cấp cha) */}
            <Handle
                type="target"
                position={Position.Top}
                style={{ background: pinkColor, width: 10, height: 10 }}
            />

            {editing ? (
                <Input
                    autoFocus
                    size="small"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onPressEnter={handleBlur}
                    style={{ textAlign: "center", borderColor: pinkColor }}
                />
            ) : (
                <div
                    onDoubleClick={() => setEditing(true)}
                    title="Double-click để chỉnh sửa"
                    style={{
                        fontWeight: 600,
                        color: "#333",
                        fontSize: 13,
                        userSelect: "none",
                    }}
                >
                    {value || "Chức danh..."}
                </div>
            )}

            {/* Handle dưới (kết nối xuống cấp con) */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ background: pinkColor, width: 10, height: 10 }}
            />
        </div>
    );
};

const nodeTypes = { editableNode: EditableNode };

// ===== COMPONENT CHÍNH =====
const ModalJobDescriptionPro = ({
    open,
    onOpenChange,
    dataInit,
    onFinish,
}: Props) => {
    const [form] = Form.useForm();
    const isEdit = !!dataInit;

    const makeInitialNodes = (onChangeFn: (id: string, label: string) => void) => [
        {
            id: "1",
            position: { x: 250, y: 50 },
            type: "editableNode",
            data: { label: "CEO", onChange: onChangeFn },
        },
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Cập nhật label của node khi user chỉnh sửa
    const handleNodeLabelChange = useCallback((id: string, newLabel: string) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === id
                    ? { ...n, data: { ...n.data, label: newLabel } }
                    : n
            )
        );
    }, []);

    // Gắn lại onChange cho tất cả nodes (vì handler có thể thay đổi)
    const withHandler = useCallback(
        (rawNodes: any[]) =>
            rawNodes.map((n) => ({
                ...n,
                type: "editableNode",
                data: { ...n.data, onChange: handleNodeLabelChange },
            })),
        [handleNodeLabelChange]
    );

    const onConnect = useCallback(
        (params: any) =>
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        animated: true,
                        style: { stroke: pinkColor, strokeWidth: 2 },
                        markerEnd: { type: "arrowclosed" as any, color: pinkColor },
                    },
                    eds
                )
            ),
        []
    );

    const addNode = () => {
        const newId = Date.now().toString();
        const newNode = {
            id: newId,
            position: {
                x: 150 + Math.random() * 300,
                y: 180 + Math.random() * 150,
            },
            type: "editableNode",
            data: { label: "Chức danh mới", onChange: handleNodeLabelChange },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    useEffect(() => {
        if (open) {
            if (dataInit) {
                form.setFieldsValue({
                    ...dataInit,
                    effectiveDate: dataInit.effectiveDate
                        ? dayjs(dataInit.effectiveDate)
                        : null,
                });

                if (dataInit.positionDiagram) {
                    const parsed = JSON.parse(dataInit.positionDiagram);
                    setNodes(withHandler(parsed.nodes || []));
                    setEdges(parsed.edges || []);
                }
            } else {
                form.resetFields();
                form.setFieldsValue({
                    companyName: "CÔNG TY CỔ PHẦN V LOTUS HOLDINGS",
                    version: "01",
                });
                setNodes(withHandler(makeInitialNodes(handleNodeLabelChange)));
                setEdges([]);
            }
        }
    }, [open, dataInit]);

    return (
        <ModalForm
            open={open}
            form={form}
            layout="vertical"
            width={1250}
            title={false}
            onOpenChange={onOpenChange}
            modalProps={{
                destroyOnClose: true,
                maskClosable: false,
                style: { top: 20 },
            }}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật JD" : "Tạo JD",
                    resetText: "Đóng",
                },
                submitButtonProps: {
                    style: {
                        background: pinkColor,
                        borderColor: pinkColor,
                        color: "#fff",
                        fontWeight: 600,
                    },
                },
                resetButtonProps: {
                    style: { borderColor: pinkColor, color: pinkColor },
                },
            }}
            onFinish={async (values) => {
                // Lưu nodes không có hàm onChange (không serialize được)
                const cleanNodes = nodes.map(({ data, ...rest }) => ({
                    ...rest,
                    data: { label: data.label },
                }));

                const submitData = {
                    ...values,
                    effectiveDate: values.effectiveDate
                        ? values.effectiveDate.format("YYYY-MM-DD")
                        : null,
                    positionDiagram: JSON.stringify({ nodes: cleanNodes, edges }),
                };
                onFinish(submitData);
                return true;
            }}
        >
            {/* HEADER */}
            <Card bordered style={{ marginBottom: 24 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={4} style={{ marginBottom: 0 }}>
                            MÔ TẢ CÔNG VIỆC (JOB DESCRIPTION)
                        </Title>
                        <Text type="secondary">Hệ thống quản lý JD nội bộ</Text>
                    </Col>

                    <Col>
                        <Row gutter={16}>
                            <Col>
                                <Text strong>Mã số:</Text>
                                <ProFormText name="code" noStyle rules={[{ required: true }]} />
                            </Col>
                            <Col>
                                <Text strong>Phiên bản:</Text>
                                <ProFormText name="version" noStyle rules={[{ required: true }]} />
                            </Col>
                            <Col>
                                <Text strong>Hiệu lực:</Text>
                                <ProFormDatePicker
                                    name="effectiveDate"
                                    noStyle
                                    fieldProps={{ format: "DD/MM/YYYY" }}
                                    rules={[{ required: true }]}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Card>

            <Tabs defaultActiveKey="1" type="card" tabBarStyle={{ color: pinkColor }}>
                {/* TAB 1 */}
                <TabPane tab="I. Thông tin chung" key="1">
                    <Row gutter={24}>
                        <Col span={12}>
                            <ProFormText name="companyName" label="Công ty" rules={[{ required: true }]} />
                        </Col>
                        <Col span={12}>
                            <ProFormText name="title" label="Chức vụ" rules={[{ required: true }]} />
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={12}>
                            <ProFormSelect
                                name="department"
                                label="Phòng ban"
                                rules={[{ required: true }]}
                                options={[
                                    { label: "Hành chính Nhân sự", value: "Hành chính Nhân sự" },
                                    { label: "Vận hành", value: "Vận hành" },
                                    { label: "Kinh doanh", value: "Kinh doanh" },
                                    { label: "Marketing", value: "Marketing" },
                                ]}
                            />
                        </Col>
                        <Col span={12}>
                            <ProFormText name="reportTo" label="Báo cáo cho" rules={[{ required: true }]} />
                        </Col>
                    </Row>
                </TabPane>

                {/* TAB 2 - ORG CHART */}
                <TabPane tab="II. Sơ đồ vị trí công việc" key="2">
                    <Row align="middle" style={{ marginBottom: 12 }} gutter={12}>
                        <Col>
                            <Button
                                type="primary"
                                style={{ background: pinkColor, borderColor: pinkColor }}
                                onClick={addNode}
                            >
                                + Thêm vị trí
                            </Button>
                        </Col>
                        <Col>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                💡 <b>Double-click</b> vào ô để đổi tên chức danh &nbsp;|&nbsp;
                                Kéo từ <b>chấm dưới</b> sang <b>chấm trên</b> của ô khác để tạo kết nối cấp bậc
                            </Text>
                        </Col>
                    </Row>

                    <div style={{ height: 500, border: "1px solid #eee", borderRadius: 8 }}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            fitView
                            deleteKeyCode="Delete"
                        >
                            <MiniMap
                                nodeColor={() => pinkColor}
                                maskColor="rgba(255,77,139,0.05)"
                            />
                            <Controls />
                            <Background color="#fce4ec" gap={16} />
                        </ReactFlow>
                    </div>

                    <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: "block" }}>
                        🗑 Chọn node hoặc đường kẻ rồi nhấn <b>Delete</b> để xoá
                    </Text>
                </TabPane>

                {/* TAB 3 */}
                <TabPane tab="III. Mô tả công việc" key="3">
                    <ProFormTextArea
                        name="responsibilities"
                        label="Trách nhiệm chính"
                        fieldProps={{ rows: 10 }}
                        rules={[{ required: true }]}
                    />
                </TabPane>

                {/* TAB 4 */}
                <TabPane tab="IV. Yêu cầu vị trí" key="4">
                    <ProFormTextArea name="knowledge" label="Kiến thức" rules={[{ required: true }]} />
                    <ProFormTextArea name="experience" label="Kinh nghiệm" rules={[{ required: true }]} />
                    <ProFormTextArea name="skills" label="Kỹ năng" rules={[{ required: true }]} />
                    <ProFormTextArea name="qualities" label="Phẩm chất" rules={[{ required: true }]} />
                    <ProFormTextArea name="otherRequirements" label="Yêu cầu khác" />
                </TabPane>
            </Tabs>
        </ModalForm>
    );
};

export default ModalJobDescriptionPro;