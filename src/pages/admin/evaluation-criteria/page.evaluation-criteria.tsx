import { useEffect, useState } from "react";
import { Collapse, Card, Descriptions, Spin, Empty } from "antd";

const { Panel } = Collapse;

interface IGrade {
    gradeLevel: number;
    ratingA?: string;
    ratingB?: string;
    ratingC?: string;
    ratingD?: string;
}

interface ICriteria {
    id: string;
    positionLevel: string;
    jobTitle: string;
    grades: IGrade[];
}

const EvaluationCriteriaPage = () => {
    const [data, setData] = useState<ICriteria[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 👉 thay URL API thật của bạn ở đây
                const res = await fetch("/api/evaluation-criteria");
                const json = await res.json();

                setData(json?.data || []);
            } catch (err) {
                console.error(err);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <Card title="Tiêu chí đánh giá theo bậc lương">
            {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <Spin />
                </div>
            ) : data.length === 0 ? (
                <Empty description="Không có dữ liệu" />
            ) : (
                data.map((jt) => (
                    <Card
                        key={jt.id}
                        type="inner"
                        title={`${jt.positionLevel} – ${jt.jobTitle}`}
                        style={{ marginBottom: 16 }}
                    >
                        <Collapse accordion>
                            {jt.grades?.map((g) => (
                                <Panel
                                    header={`Bậc ${g.gradeLevel}`}
                                    key={`${jt.id}-${g.gradeLevel}`}
                                >
                                    <Descriptions bordered column={1}>
                                        <Descriptions.Item label="A">
                                            <pre>{g.ratingA || "--"}</pre>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="B">
                                            <pre>{g.ratingB || "--"}</pre>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="C">
                                            <pre>{g.ratingC || "--"}</pre>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="D">
                                            <pre>{g.ratingD || "--"}</pre>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Panel>
                            ))}
                        </Collapse>
                    </Card>
                ))
            )}
        </Card>
    );
};

export default EvaluationCriteriaPage;