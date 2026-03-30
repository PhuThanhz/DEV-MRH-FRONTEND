import { Typography, Skeleton } from "antd";
import {
    HistoryOutlined,
    ClockCircleOutlined,
    ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { useEmployeeCareerPathHistoryQuery } from "@/hooks/useEmployeeCareerPaths";
import { T, Badge } from "./ModalEmployeeDetail";

const { Text } = Typography;

export const TabHistory = ({ userId }: { userId?: number }) => {
    const { data: histories = [], isFetching } =
        useEmployeeCareerPathHistoryQuery(userId);

    if (isFetching) return <Skeleton active paragraph={{ rows: 4 }} />;

    if (histories.length === 0) return (
        <div style={{
            textAlign: "center", padding: "40px 0",
            background: T.s1, borderRadius: 10,
            border: `1px dashed ${T.ink6}`,
        }}>
            <HistoryOutlined style={{ fontSize: 28, color: T.ink5, display: "block", marginBottom: 8 }} />
            <Text style={{ fontSize: 13, color: T.ink5 }}>Chưa có quá trình công tác</Text>
        </div>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {histories.map((h, i) => (
                <div
                    key={h.id ?? i}
                    style={{
                        padding: "12px 14px",
                        background: T.white,
                        border: `1px solid ${T.line}`,
                        borderRadius: 10,
                    }}
                >
                    {/* From → To */}
                    <div style={{
                        display: "flex", alignItems: "center",
                        gap: 6, flexWrap: "wrap", marginBottom: 6,
                    }}>
                        <Text style={{ fontSize: 12.5, fontWeight: 500, color: T.ink3 }}>
                            {h.fromPositionName ?? "—"}
                        </Text>
                        {h.fromPositionCode && (
                            <Badge color={T.ink4} bg={T.s2} border={T.ink6}>
                                {h.fromPositionCode}
                            </Badge>
                        )}
                        <ArrowRightOutlined style={{ fontSize: 11, color: T.acc }} />
                        <Text style={{ fontSize: 12.5, fontWeight: 700, color: T.acc }}>
                            {h.toPositionName ?? "—"}
                        </Text>
                        {h.toPositionCode && (
                            <Badge color={T.acc} bg={T.accSoft} border={T.accBord}>
                                {h.toPositionCode}
                            </Badge>
                        )}
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {h.promotedAt && (
                            <Badge color={T.ink3} bg={T.s1} border={T.line}>
                                <ClockCircleOutlined style={{ fontSize: 9 }} />
                                {dayjs(h.promotedAt).format("DD/MM/YYYY")}
                            </Badge>
                        )}
                        {h.createdBy && (
                            <Text style={{ fontSize: 11, color: T.ink5 }}>· {h.createdBy}</Text>
                        )}
                    </div>

                    {h.note && (
                        <Text style={{
                            display: "block", fontSize: 11.5, color: T.ink4,
                            marginTop: 6, fontStyle: "italic",
                        }}>
                            "{h.note}"
                        </Text>
                    )}
                </div>
            ))}
        </div>
    );
};