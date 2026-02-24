import { Collapse, Card, Descriptions } from "antd";
import { MOCK_EVALUATION_CRITERIA } from "./mock.data";

const { Panel } = Collapse;

const EvaluationCriteriaPage = () => {
    return (
        <Card title="Tiêu chí đánh giá theo bậc lương">
            {MOCK_EVALUATION_CRITERIA.map((jt, idx) => (
                <Card
                    key={idx}
                    type="inner"
                    title={`${jt.positionLevel} – ${jt.jobTitle}`}
                    style={{ marginBottom: 16 }}
                >
                    <Collapse accordion>
                        {jt.grades.map((g) => (
                            <Panel
                                header={`Bậc ${g.gradeLevel}`}
                                key={g.gradeLevel}
                            >
                                <Descriptions bordered column={1}>
                                    <Descriptions.Item label="A">
                                        <pre>{g.ratingA}</pre>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="B">
                                        <pre>{g.ratingB}</pre>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="C">
                                        <pre>{g.ratingC}</pre>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="D">
                                        <pre>{g.ratingD}</pre>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Panel>
                        ))}
                    </Collapse>
                </Card>
            ))}
        </Card>
    );
};

export default EvaluationCriteriaPage;
