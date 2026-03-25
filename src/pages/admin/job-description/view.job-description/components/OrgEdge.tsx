const OrgEdge = ({ id, sourceX, sourceY, targetX, targetY }: any) => {
    const midY = (sourceY + targetY) / 2;
    const d = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
    return <path id={id} d={d} fill="none" stroke="#d1d5db" strokeWidth={1.5} />;
};

export default OrgEdge;