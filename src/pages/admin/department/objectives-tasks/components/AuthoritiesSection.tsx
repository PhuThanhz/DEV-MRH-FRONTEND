import { Button, Input, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { LocalAuthorityItem } from "../index";

const ACCENT = "#e8637a";

interface Props {
    authorities: LocalAuthorityItem[];
    editMode: boolean;
    onChange: (items: LocalAuthorityItem[]) => void;
}

const AuthoritiesSection = ({ authorities, editMode, onChange }: Props) => {
    if (authorities.length === 0 && !editMode) return null;

    const update = (i: number, v: string) => {
        const list = [...authorities];
        list[i] = { ...list[i], content: v };
        onChange(list);
    };

    const add = () =>
        onChange([...authorities, { content: "", orderNo: authorities.length + 1 }]);

    const remove = (i: number) =>
        onChange(authorities.filter((_, idx) => idx !== i));

    return (
        <div>
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 16,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                        width: 3, height: 16, borderRadius: 2,
                        background: ACCENT, display: "inline-block",
                    }} />
                    <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: ".08em",
                        textTransform: "uppercase", color: "#555",
                    }}>
                        Quyền hạn
                    </span>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>
                    {authorities.length} quyền hạn
                </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {authorities.map((item, i) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: "#fff", border: "1px solid #f0f0f0",
                        borderRadius: 10, padding: "12px 16px",
                    }}>
                        <span style={{
                            minWidth: 24, height: 24, borderRadius: 12,
                            background: "#f5f5f5", color: "#888",
                            fontSize: 12, fontWeight: 700,
                            display: "flex", alignItems: "center",
                            justifyContent: "center", flexShrink: 0,
                        }}>
                            {i + 1}
                        </span>
                        {editMode ? (
                            <Input
                                value={item.content}
                                onChange={(e) => update(i, e.target.value)}
                                placeholder="Nhập nội dung quyền hạn…"
                                style={{ flex: 1 }}
                            />
                        ) : (
                            <span style={{ flex: 1, fontSize: 14, color: "#111", lineHeight: 1.65 }}>
                                {item.content}
                            </span>
                        )}
                        {editMode && (
                            <Popconfirm
                                title="Xoá quyền hạn này?"
                                onConfirm={() => remove(i)}
                                okText="Xoá" cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                            >
                                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                        )}
                    </div>
                ))}

                {editMode && (
                    <Button
                        type="dashed" icon={<PlusOutlined />}
                        onClick={add} block
                        style={{ marginTop: 4, color: "#aaa", borderColor: "#e0e0e0" }}
                    >
                        Thêm quyền hạn
                    </Button>
                )}
            </div>
        </div>
    );
};

export default AuthoritiesSection;