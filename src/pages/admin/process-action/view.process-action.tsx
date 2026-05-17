import { Spin, Empty, Tag } from "antd";
import {
    TagOutlined, InfoCircleOutlined, CalendarOutlined,
    UserAddOutlined, CheckCircleOutlined, StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { IProcessAction } from "@/types/backend";
import { useProcessActionByIdQuery } from "@/hooks/useProcessActions";
import {
    DetailModal, InfoRow, InfoCard, SectionTitle,
    ProfileHeader, ActiveTag, InactiveTag, OutlineTag,
} from "@/components/common/modal/detail";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IProcessAction | null;
    setDataInit: (v: IProcessAction | null) => void;
}

// Render định nghĩa multi-line thành danh sách
const DefinitionBlock = ({ text }: { text?: string | null }) => {
    if (!text) return <span style={{ color: "#9ca3af", fontStyle: "italic" }}>--</span>;

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
        return <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{text}</span>;
    }

    return (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {lines.map((line, idx) => (
                <li key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{
                        width: 5, height: 5, borderRadius: "50%", background: "#f5317f",
                        flexShrink: 0, marginTop: 6,
                    }} />
                    <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                        {line.startsWith("-") ? line.slice(1).trim() : line}
                    </span>
                </li>
            ))}
        </ul>
    );
};

const ViewProcessAction = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const { data: detail, isLoading } = useProcessActionByIdQuery(
        open && dataInit?.id ? dataInit.id : null
    );

    const handleClose = () => {
        setDataInit(null);
        onClose(false);
    };

    const isActive = detail?.active;

    return (
        <DetailModal
            title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết Process Action</span>}
            open={open}
            onCancel={handleClose}
            destroyOnHidden
            maskClosable={false}
            moduleClass="process-action"
            desktopWidth={520}
        >
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <Spin size="large" />
                </div>
            ) : !detail ? (
                <Empty description="Không tìm thấy thông tin" style={{ padding: "32px 0" }} />
            ) : (
                <>
                    <ProfileHeader
                        avatarIcon={<TagOutlined />}
                        title={detail.name || "--"}
                        subtitle={detail.code ? `Mã: ${detail.code}` : undefined}
                        badges={[
                            isActive
                                ? <ActiveTag key="s" label="Hoạt động" />
                                : <InactiveTag key="s" label="Ngừng hoạt động" />,
                        ]}
                        tags={[
                            detail.code
                                ? <OutlineTag key="code" icon={<TagOutlined />} label={detail.code} />
                                : null,
                        ].filter(Boolean) as React.ReactNode[]}
                    />

                    <InfoCard>
                        <SectionTitle>Thông tin chung</SectionTitle>
                        <InfoRow
                            icon={<TagOutlined />}
                            label="Mã hành động"
                            value={detail.code}
                            highlight
                        />
                        <InfoRow
                            icon={<InfoCircleOutlined />}
                            label="Đầu mục"
                            value={detail.name}
                        />
                        <InfoRow
                            icon={<InfoCircleOutlined />}
                            label="Giải thích tên đầu mục"
                            value={detail.shortDescription}
                        />

                        {/* Định nghĩa — multi-line, render riêng */}
                        <div style={{
                            display: "flex", gap: 10,
                            padding: "10px 0",
                            borderBottom: "1px solid #f3f4f6",
                        }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: "linear-gradient(135deg,#fff0f6,#ffe6f0)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <InfoCircleOutlined style={{ fontSize: 13, color: "#f5317f" }} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 11, fontWeight: 600, color: "#9ca3af",
                                    letterSpacing: "0.05em", textTransform: "uppercase",
                                    marginBottom: 6,
                                }}>
                                    Định nghĩa
                                </div>
                                <DefinitionBlock text={detail.description} />
                            </div>
                        </div>

                        <InfoRow
                            icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
                            label="Trạng thái"
                            noBorder
                            value={
                                isActive
                                    ? <Tag color="success" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>Hoạt động</Tag>
                                    : <Tag color="error" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>Ngừng hoạt động</Tag>
                            }
                        />
                    </InfoCard>

                    <InfoCard style={{ marginBottom: 0 }}>
                        <SectionTitle>Lịch sử</SectionTitle>
                        <InfoRow
                            icon={<UserAddOutlined />}
                            label="Người tạo"
                            value={(detail as any).createdBy}
                        />
                        <InfoRow
                            icon={<CalendarOutlined />}
                            label="Ngày tạo"
                            value={detail.createdAt
                                ? dayjs(detail.createdAt).format("DD/MM/YYYY HH:mm")
                                : undefined}
                        />
                        <InfoRow
                            icon={<UserAddOutlined />}
                            label="Người cập nhật"
                            value={(detail as any).updatedBy}
                        />
                        <InfoRow
                            icon={<CalendarOutlined />}
                            label="Ngày cập nhật"
                            value={detail.updatedAt
                                ? dayjs(detail.updatedAt).format("DD/MM/YYYY HH:mm")
                                : undefined}
                            noBorder
                        />
                    </InfoCard>
                </>
            )}
        </DetailModal>
    );
};

export default ViewProcessAction;