import type { ISalaryStructure } from "@/types/backend";

interface Props {
    structure: ISalaryStructure | null;
}

const fmt = (val?: number | null) =>
    val != null
        ? val.toLocaleString("vi-VN")
        : <span style={{ color: "#bfbfbf" }}>—</span>;

const ReadOnlyRowHour = ({ structure }: Props) => {
    const s = structure;
    return (
        <>
            {/* ── Thu nhập theo giờ (6 cột) ── */}
            <td className="num-col">{fmt(s?.hourBaseSalary)}</td>
            <td className="num-col">{fmt(s?.hourPositionAllowance)}</td>
            <td className="num-col">{fmt(s?.hourMealAllowance)}</td>
            <td className="num-col">{fmt(s?.hourFuelSupport)}</td>
            <td className="num-col">{fmt(s?.hourPhoneSupport)}</td>
            <td className="num-col">{fmt(s?.hourOtherSupport)}</td>

            {/* ── KPI A / B / C / D (4 cột) ── */}
            <td className="num-col kpi">{fmt(s?.hourKpiBonusA)}</td>
            <td className="num-col kpi">{fmt(s?.hourKpiBonusB)}</td>
            <td className="num-col kpi">{fmt(s?.hourKpiBonusC)}</td>
            <td className="num-col kpi">{fmt(s?.hourKpiBonusD)}</td>
        </>
    );
};

export default ReadOnlyRowHour;