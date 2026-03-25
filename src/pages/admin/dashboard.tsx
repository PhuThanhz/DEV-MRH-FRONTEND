import { Table, Progress, Typography } from "antd";
import { Pie, Column } from "@ant-design/plots";
import PageContainer from "@/components/common/data-table/PageContainer";
import { useDashboardSummaryQuery } from "@/hooks/useDashboard";

const { Text } = Typography;

const DashboardPage = () => {
    const { data, isLoading } = useDashboardSummaryQuery();

    /* ================= BACKEND DATA ================= */

    // 👉 backend bạn đang trả dạng total
    const companyCount = data?.totalCompany || 0;
    const departmentCount = data?.totalDepartment || 0;
    const unitCount = data?.totalSection || 0;

    /* ================= FAKE DATA (để giữ UI) ================= */

    // ⚠️ vì backend chưa trả list → fake để table không bị trống
    const departments = [
        {
            id: "d1",
            companyName: "Demo Company",
            code: "HR",
            name: "Phòng nhân sự",
        },
    ];

    /* ================= CHART ================= */

    const completedProfile = 0;
    const missingProfile = 0;
    const overallPct = 0;

    const pieConfig = {
        data: [
            { type: "Hoàn thành", value: completedProfile },
            { type: "Còn thiếu", value: missingProfile }
        ],
        angleField: "value",
        colorField: "type",
        innerRadius: 0.7,
        height: 220,
    };

    const columnConfig = {
        data: departments.map(d => ({
            name: d.code,
            value: 0
        })),
        xField: "name",
        yField: "value",
        height: 220,
    };

    /* ================= TABLE ================= */

    const columns = [
        {
            title: "Công ty",
            render: (_: any, r: any) => (
                <Text>{r.companyName}</Text>
            )
        },
        {
            title: "Phòng ban",
            render: (_: any, r: any) => (
                <Text>{r.name}</Text>
            )
        },
        {
            title: "Bộ hồ sơ",
            render: () => (
                <Progress percent={0} size="small" />
            )
        },
        {
            title: "Mục còn thiếu",
            render: () => "Chưa có dữ liệu"
        }
    ];

    /* ================= RENDER ================= */

    return (
        <PageContainer title="Dashboard">

            {/* KPI */}
            <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                <div>Công ty: {companyCount}</div>
                <div>Phòng ban: {departmentCount}</div>
                <div>Bộ phận: {unitCount}</div>
            </div>

            {/* Loading */}
            {isLoading && <div>Đang tải dữ liệu...</div>}

            {/* Charts */}
            <div style={{ display: "flex", gap: 40, marginBottom: 30 }}>
                <Pie {...pieConfig} />
                <Column {...columnConfig} />
            </div>

            {/* Table */}
            <Table
                columns={columns}
                dataSource={departments}
                rowKey="id"
                pagination={false}
            />
        </PageContainer>
    );
};

export default DashboardPage;