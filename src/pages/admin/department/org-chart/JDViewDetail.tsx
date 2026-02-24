// src/modules/settings/job-description/components/JDViewDetail.tsx

import React from 'react';
import {
    Tabs,
    Card,
    Typography,
    Space,
    Descriptions,
    Table,
} from 'antd';

import jdTemplate from '../org-chart/jd-sample.json'; // Giả sử path đúng

const { Title, Text, Paragraph } = Typography;

interface Position {
    nameVN: string;
    departmentName: string;
    companyName?: string;
    // Thêm các field khác nếu cần
}

interface JDViewDetailProps {
    position: Position;
}

const JDViewDetail: React.FC<JDViewDetailProps> = ({ position }) => {
    if (!position) return null;

    const meta = jdTemplate.meta || {};
    const general = jdTemplate.general || {};
    const sec = jdTemplate.sections || {};
    const req = sec.requirements || {};
    const responsibilities = sec.responsibilities || [];

    /** Chuẩn hóa bullet */
    const toLines = (value: string | string[]): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;

        return value
            .split(/\n|•|-/)
            .map((x) => x.trim())
            .filter(Boolean);
    };

    /** Yêu cầu → bảng */
    const requirementRows = [
        { key: 1, title: 'Kiến thức', content: toLines(req.knowledge) },
        { key: 2, title: 'Kinh nghiệm', content: toLines(req.experience) },
        { key: 3, title: 'Kỹ năng', content: toLines(req.skills) },
        { key: 4, title: 'Phẩm chất', content: toLines(req.qualities) },
        { key: 5, title: 'Yêu cầu khác', content: toLines(req.other) },
    ];

    const reqColumns = [
        {
            title: 'STT',
            dataIndex: 'key',
            width: 70,
            align: 'center' as const,
            render: (v: number) => <b>{v}</b>,
        },
        {
            title: 'Nhóm yêu cầu',
            dataIndex: 'title',
            width: 220,
            render: (t: string) => <b>{t}</b>,
        },
        {
            title: 'Chi tiết',
            dataIndex: 'content',
            render: (arr: string[]) => (
                <div style={{ lineHeight: 1.65 }}>
                    {arr.map((item, i) => (
                        <div key={i}>• {item}</div>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: 12, maxWidth: 1250, margin: '0 auto' }}>
            {/* HEADER */}
            <Card bordered={false} style={{ marginBottom: 16, padding: 22 }}>
                <Space direction="vertical">
                    <Title level={3} style={{ margin: 0 }}>
                        {position.nameVN}
                    </Title>
                    <Text style={{ fontSize: 15 }}>
                        Bộ phận: {position.departmentName}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Phiên bản: {meta.version} • Hiệu lực: {meta.effectiveDate}
                    </Text>
                </Space>
            </Card>

            {/* ================= TABS ================= */}
            <Tabs
                defaultActiveKey="1"
                size="large"
                type="card"
                items={[
                    /* ================== TAB 1 — THÔNG TIN ================== */
                    {
                        key: '1',
                        label: 'Thông tin chung',
                        children: (
                            <Card>
                                <Descriptions bordered column={2}>
                                    <Descriptions.Item label="Chức vụ">{position.nameVN}</Descriptions.Item>
                                    <Descriptions.Item label="Bộ phận">{position.departmentName}</Descriptions.Item>
                                    <Descriptions.Item label="Trực thuộc">{position.companyName}</Descriptions.Item>
                                    <Descriptions.Item label="Cấp trên trực tiếp">{general.directManager}</Descriptions.Item>
                                    <Descriptions.Item label="Tác nghiệp với">{general.collaboration}</Descriptions.Item>
                                    <Descriptions.Item label="Ngày hiệu lực">{meta.effectiveDate}</Descriptions.Item>
                                </Descriptions>
                            </Card>
                        ),
                    },

                    /* ================== TAB 2 — SƠ ĐỒ ================== */
                    {
                        key: '2',
                        label: 'Sơ đồ vị trí công việc',
                        children: (
                            <Card style={{ padding: 40, textAlign: 'center' }}>
                                <Text type="secondary" italic>
                                    [ Sơ đồ vị trí công việc được hiển thị tại đây ]
                                </Text>
                            </Card>
                        ),
                    },

                    /* ================== TAB 3 — MÔ TẢ ================== */
                    {
                        key: '3',
                        label: 'Mô tả công việc',
                        children: (
                            <Card style={{ padding: 22 }}>
                                {responsibilities.map((item: string, index: number) => {
                                    const [rawTitle, rawBody] = item.split(':');
                                    const title = rawTitle.replace(/^\d+\.\s*/, '').trim();
                                    const bullets = toLines(rawBody);

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                marginBottom: 24,
                                                border: '1px solid #e5e7eb',
                                                padding: 16,
                                                borderRadius: 10,
                                                background: '#fff',
                                            }}
                                        >
                                            <Text strong style={{ fontSize: 16 }}>
                                                {index + 1}. {title}
                                            </Text>

                                            <div style={{ marginTop: 10, paddingLeft: 12 }}>
                                                {bullets.map((line, i) => (
                                                    <Paragraph key={i} style={{ marginBottom: 6 }}>
                                                        • {line}
                                                    </Paragraph>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </Card>
                        ),
                    },

                    /* ================== TAB 4 — YÊU CẦU ================== */
                    {
                        key: '4',
                        label: 'Yêu cầu công việc',
                        children: (
                            <Card>
                                <Table
                                    bordered
                                    pagination={false}
                                    columns={reqColumns}
                                    dataSource={requirementRows}
                                />
                            </Card>
                        ),
                    },
                ]}
            />
        </div>
    );
};

export default JDViewDetail;