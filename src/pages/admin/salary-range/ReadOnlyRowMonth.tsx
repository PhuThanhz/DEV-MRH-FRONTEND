import type { ISalaryStructure } from "@/types/backend";

interface Props {
    structure: ISalaryStructure | null;
}

const fmt = (val?: number | null) =>
    val != null
        ? val.toLocaleString("vi-VN")
        : <span style={{ color: "#bfbfbf" }}>—</span>;

const ReadOnlyRowMonth = ({ structure }: Props) => {
    const s = structure;
    return (
        <>
            {/* ── Thu nhập cố định (6 cột) ── */}
            <td className="num-col">{fmt(s?.monthBaseSalary)}</td>
            <td className="num-col">{fmt(s?.monthPositionAllowance)}</td>
            <td className="num-col">{fmt(s?.monthMealAllowance)}</td>
            <td className="num-col">{fmt(s?.monthFuelSupport)}</td>
            <td className="num-col">{fmt(s?.monthPhoneSupport)}</td>
            <td className="num-col">{fmt(s?.monthOtherSupport)}</td>

            {/* ── KPI A / B / C / D (4 cột) ── */}
            <td className="num-col kpi">{fmt(s?.monthKpiBonusA)}</td>
            <td className="num-col kpi">{fmt(s?.monthKpiBonusB)}</td>
            <td className="num-col kpi">{fmt(s?.monthKpiBonusC)}</td>
            <td className="num-col kpi">{fmt(s?.monthKpiBonusD)}</td>
        </>
    );
};

export default ReadOnlyRowMonth;