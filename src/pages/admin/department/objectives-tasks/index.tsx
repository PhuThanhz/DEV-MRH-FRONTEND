// src/pages/admin/department/objectives-tasks/index.tsx

import { useParams, useSearchParams } from "react-router-dom";
import {
    Space,
    Typography,
    Button,
    Breadcrumb,
    List,
    Table,
    Card,
    Tag,
} from "antd";
import {
    PrinterOutlined,
    HomeOutlined,
    ApartmentOutlined,
    CheckCircleOutlined,
    FileTextOutlined,
    TeamOutlined,
    CalendarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// Dữ liệu giả hard-code trực tiếp trong file
const MOCK_OBJECTIVES = [
    "Đảm bảo việc phát triển và tối ưu hóa nguồn nhân lực phù hợp với chiến lược phát triển của công ty.",
    "Nâng cao mức độ gắn kết và trải nghiệm của người lao động nhằm thu hút, giữ chân nhân tài và xây dựng đội ngũ ổn định, phát triển bền vững.",
    "Đảm bảo hệ thống hành chính – nhân sự vận hành hiệu quả, minh bạch và tuân thủ pháp luật",
];

const MOCK_TEAMS = [
    { id: "t1", name: "Hành chính" },
    { id: "t2", name: "C&B" },
    { id: "t3", name: "Tuyển Dụng\n(Hoạch định và thu hút nhân tài)" },
    { id: "t4", name: "Đào Tạo và\nPhát Triển năng lực" },
];

const MOCK_TASKS = [
    // Hành chính (t1)
    { teamId: "t1", name: "Vận hành dịch vụ hành chính – văn phòng thông suốt", description: "Vận hành dịch vụ hành chính – văn phòng thông suốt, hỗ trợ hoạt động kinh doanh" },
    { teamId: "t1", name: "Tối ưu nguồn lực hành chính", description: "Tối ưu nguồn lực hành chính nhằm gia tăng hiệu quả kinh doanh." },

    // C&B (t2)
    { teamId: "t2", name: "Xây dựng hệ thống lương thưởng phúc lợi", description: "Xây dựng hệ thống lương, thưởng, phúc lợi cạnh tranh & công bằng" },
    { teamId: "t2", name: "Thủ tục nhân sự", description: "Triển khai các nghiệp vụ về thủ tục nhân sự (bao gồm nhưng không giới hạn: chấm công, hồ sơ nhân sự, hợp đồng lao động,…) theo quy định của Công ty và Luật Lao động." },
    { teamId: "t2", name: "Thanh toán lương thưởng", description: "Triển khai các nghiệp vụ về thanh toán tiền lương, thưởng và phúc lợi cho người lao động toàn Công ty theo quy định, theo pháp luật lao động." },

    // Tuyển dụng (t3)
    { teamId: "t3", name: "Phát triển Thương hiệu Nhà Tuyển dụng", description: "Xây dựng và triển khai chiến lược phát triển Thương hiệu Nhà Tuyển dụng và thu hút nhân tài cho công ty" },
    { teamId: "t3", name: "Lập kế hoạch tuyển dụng", description: "Lập kế hoạch và tổ chức triển khai công tác tuyển dụng cho Công ty với ngân sách tối ưu." },
    { teamId: "t3", name: "Phát triển văn hóa doanh nghiệp", description: "Phát triển văn hóa doanh nghiệp và gắn kết con người" },

    // Đào tạo và Phát triển (t4)
    { teamId: "t4", name: "Chuẩn hóa năng lực & đào tạo", description: "Chuẩn hóa tiêu chuẩn năng lực cho từng vị trí. Xây dựng hệ thống quản lý đào tạo và triển khai đào tạo nhằm nâng cao năng lực của đội ngũ." },
    { teamId: "t4", name: "Xây dựng nguồn lực kế thừa", description: "Xây dựng nguồn lực kế thừa phù hợp chiến lược phát triển công ty." },
];

const DepartmentObjectivesTasksPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();

    const departmentName = searchParams.get("departmentName") || "HÀNH CHÍNH NHÂN SỰ";
    const companyName = "F&B";

    // Lấy ngày hiện tại
    const currentDate = new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const teams = MOCK_TEAMS;
    const tasks = MOCK_TASKS;

    const maxTasks = Math.max(
        ...teams.map(team => tasks.filter(task => task.teamId === team.id).length),
        1
    );

    const taskColumns = [
        {
            title: "STT",
            dataIndex: "index",
            width: 70,
            align: "center" as const,
            fixed: "left" as const,
            render: (text: number) => <Text type="secondary">{text}</Text>,
        },
        ...teams.map((team) => ({
            title: (
                <div style={{ textAlign: "center", padding: "8px" }}>
                    <TeamOutlined style={{ fontSize: 14, marginBottom: 4, display: 'block' }} />
                    <Text strong style={{ fontSize: 13, display: "block", whiteSpace: "pre-line" }}>
                        {team.name}
                    </Text>
                </div>
            ),
            dataIndex: `team_${team.id}`,
            width: 340,
            render: (task: any) => {
                if (!task) return (
                    <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Text type="secondary">—</Text>
                    </div>
                );
                return (
                    <div style={{
                        padding: "12px",
                        minHeight: 100,
                        background: "#fafafa",
                        borderRadius: 4,
                        border: "1px solid #f0f0f0"
                    }}>
                        <Text strong style={{ fontSize: 13, display: "block", marginBottom: 6, color: '#262626' }}>
                            {task.name}
                        </Text>
                        <Text style={{ fontSize: 12, lineHeight: 1.6, color: "#595959" }}>
                            {task.description}
                        </Text>
                    </div>
                );
            },
        })),
    ];

    const taskTableData = Array.from({ length: maxTasks }, (_, rowIndex) => {
        const row: any = { key: `row-${rowIndex}`, index: rowIndex + 1 };
        teams.forEach((team) => {
            const teamTasks = tasks.filter(task => task.teamId === team.id);
            row[`team_${team.id}`] = teamTasks[rowIndex] || null;
        });
        return row;
    });

    return (
        <div style={{ padding: "24px", background: "#fafafa", minHeight: "100vh" }}>
            <div style={{ maxWidth: Math.min(1600, 600 + teams.length * 340), margin: "0 auto" }}>

                {/* Breadcrumb */}
                <Breadcrumb
                    className="no-print"
                    style={{ marginBottom: 16 }}
                    items={[
                        { href: "/", title: <HomeOutlined /> },
                        {
                            href: "/admin/departments",
                            title: (
                                <>
                                    <ApartmentOutlined /> <span>Phòng ban</span>
                                </>
                            ),
                        },
                        { title: departmentName },
                    ]}
                />

                {/* HEADER */}
                <div style={{
                    background: "linear-gradient(to right, #fff5f7, #fff)",
                    padding: "32px 24px",
                    borderBottom: "3px solid #ff4d7d",
                    position: "relative",
                    borderRadius: "8px 8px 0 0",
                    marginBottom: 0,
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ textAlign: "center", flex: 1 }}>
                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ff4d7d, #ff85a6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 12px',
                                boxShadow: '0 4px 12px rgba(255, 77, 125, 0.2)'
                            }}>
                                <ApartmentOutlined style={{ fontSize: 28, color: "#fff" }} />
                            </div>
                            <Title level={3} style={{ margin: "0 0 8px 0", color: '#262626' }}>
                                {departmentName}
                            </Title>
                            <Space direction="vertical" size={4}>
                                <Tag style={{
                                    fontSize: 12,
                                    padding: "4px 12px",
                                    borderRadius: 12,
                                    border: '1px solid #ffadc2',
                                    background: '#fff5f7',
                                    color: '#eb2f64'
                                }}>
                                    Trực thuộc: {companyName}
                                </Tag>
                                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                                    <CalendarOutlined style={{ marginRight: 6 }} />
                                    Ngày ban hành: {currentDate}
                                </Text>
                            </Space>
                        </div>

                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            size="large"
                            onClick={() => window.print()}
                            className="no-print"
                            style={{
                                position: "absolute",
                                right: 24,
                                top: 24,
                                background: '#ff4d7d',
                                borderColor: '#ff4d7d',
                            }}
                        >
                            In tài liệu
                        </Button>
                    </div>
                </div>

                <div style={{ padding: "24px", background: '#fff', borderRadius: "0 0 8px 8px", boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    {/* MỤC TIÊU HOẠT ĐỘNG */}
                    <Card
                        title={
                            <Space size={8}>
                                <CheckCircleOutlined style={{ color: "#ff4d7d", fontSize: 16 }} />
                                <Text strong>Mục tiêu hoạt động</Text>
                            </Space>
                        }
                        style={{
                            marginBottom: 24,
                            borderLeft: '4px solid #ff4d7d',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                        bordered={false}
                        size="small"
                    >
                        <List
                            dataSource={MOCK_OBJECTIVES}
                            renderItem={(goal, idx) => (
                                <List.Item style={{ padding: "10px 0", border: 'none' }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <Text type="secondary" style={{ minWidth: 20, marginTop: 2 }}>
                                            {idx + 1}.
                                        </Text>
                                        <Text style={{ fontSize: 14, lineHeight: 1.6, flex: 1 }}>
                                            {goal}
                                        </Text>
                                    </div>
                                </List.Item>
                            )}
                            split={false}
                        />
                    </Card>

                    {/* NHIỆM VỤ THEO BỘ PHẬN */}
                    <Card
                        title={
                            <Space size={8}>
                                <FileTextOutlined style={{ color: "#ff4d7d", fontSize: 16 }} />
                                <Text strong>Nhiệm vụ theo bộ phận</Text>
                            </Space>
                        }
                        bordered={false}
                        size="small"
                        style={{
                            borderLeft: '4px solid #ff4d7d',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                    >
                        <div style={{ overflowX: "auto", marginTop: 16 }}>
                            <Table
                                columns={taskColumns}
                                dataSource={taskTableData}
                                pagination={false}
                                bordered
                                size="small"
                                scroll={{ x: teams.length * 340 + 70 }}
                                style={{ background: '#fff' }}
                            />
                        </div>
                    </Card>
                </div>
            </div>

            {/* CSS cho styling và in ấn */}
            <style>{`
                .ant-table-thead > tr > th {
                    background: #fafafa !important;
                    color: #262626 !important;
                    font-weight: 600;
                    border-bottom: 2px solid #f0f0f0 !important;
                }
                .ant-table-tbody > tr:hover > td {
                    background: #f5f5f5 !important;
                }
                
                @media print {
                    body {
                        background: white !important;
                        padding: 0 !important;
                        font-family: 'Times New Roman', Times, serif !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    .ant-breadcrumb {
                        display: none !important;
                    }
                    
                    .ant-card {
                        box-shadow: none !important;
                        border: 1px solid #d9d9d9 !important;
                        page-break-inside: avoid;
                    }
                    
                    .ant-card-head {
                        background: #f5f5f5 !important;
                        border-bottom: 2px solid #000 !important;
                    }
                    
                    h3 {
                        color: #000 !important;
                        page-break-after: avoid;
                    }
                    
                    table {
                        page-break-inside: avoid;
                    }
                    
                    table, th, td {
                        border: 1px solid #000 !important;
                        border-collapse: collapse !important;
                    }
                    
                    .ant-table-thead > tr > th {
                        background: #f0f0f0 !important;
                        font-weight: bold !important;
                        color: #000 !important;
                    }
                    
                    .ant-tag {
                        border: 1px solid #000 !important;
                        background: #fff !important;
                        color: #000 !important;
                    }
                    
                    @page {
                        margin: 2cm;
                        size: A4 landscape;
                    }
                }
            `}</style>
        </div>
    );
};

export default DepartmentObjectivesTasksPage;