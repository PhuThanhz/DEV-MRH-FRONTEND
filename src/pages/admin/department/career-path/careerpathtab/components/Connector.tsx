const Connector = ({ color }: { color: string }) => (
    <div style={{
        width: 1,
        height: 8,
        marginLeft: 22,
        marginBottom: 0,
        background: `linear-gradient(to bottom, ${color}44, transparent)`,
    }} />
);

export default Connector;