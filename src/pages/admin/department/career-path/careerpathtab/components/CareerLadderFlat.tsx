import { Typography } from "antd";
import type { ICareerPath } from "@/types/backend";
import { T, getHue, compareLevelCode } from "../constants";
import StairCard from "./StairCard";
import Connector from "./Connector";
import EmptyState from "./EmptyState";

const { Text } = Typography;

interface CareerLadderFlatProps {
    paths: ICareerPath[];
    onView: (r: ICareerPath) => void;
    onEdit: (r: ICareerPath) => void;
    onDelete: (r: ICareerPath) => void;
    showHeader?: boolean;
}

const CareerLadderFlat = ({ paths, onView, onEdit, onDelete, showHeader = true }: CareerLadderFlatProps) => {
    if (paths.length === 0) return <EmptyState label="Chưa có lộ trình nào" />;

    const uniqueCodes = Array.from(new Set(paths.map(p => p.positionLevelCode ?? "")))
        .sort(compareLevelCode);

    const rankMap = new Map(uniqueCodes.map((code, i) => [code, i]));
    const totalRanks = uniqueCodes.length;

    return (
        <div>
            {showHeader && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 20, height: 1, background: T.lineStr }} />
                        <Text style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: T.ink4,
                            letterSpacing: 0.8,
                            textTransform: "uppercase",
                        }}>
                            Cấp cao nhất
                        </Text>
                    </div>
                    <Text style={{ fontSize: 11, color: T.ink5, fontWeight: 500 }}>
                        {paths.length} cấp bậc
                    </Text>
                </div>
            )}

            {paths.map((item, i) => {
                const rank = rankMap.get(item.positionLevelCode ?? "") ?? 0;
                return (
                    <div key={item.id}>
                        <StairCard
                            item={item}
                            index={i}
                            rank={rank}
                            totalRanks={totalRanks}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                        {i < paths.length - 1 && <Connector color={getHue(i).dot} />}
                    </div>
                );
            })}

            {showHeader && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 14,
                }}>
                    <div style={{ width: 20, height: 1, background: T.line }} />
                    <Text style={{ fontSize: 11, color: T.ink5, fontWeight: 500 }}>
                        Cấp khởi đầu
                    </Text>
                </div>
            )}
        </div>
    );
};

export default CareerLadderFlat;