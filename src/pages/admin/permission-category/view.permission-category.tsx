import { Spin, Empty, Tag } from "antd";
import {
    SafetyCertificateOutlined, TagOutlined, BankOutlined,
    ApartmentOutlined, UserAddOutlined, CalendarOutlined,
    CheckCircleOutlined, StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { IPermissionCategory } from "@/types/backend";
import { usePermissionCategoryByIdQuery } from "@/hooks/usePermissionCategory";
import {
    DetailModal, InfoRow, InfoCard, SectionTitle,
    ProfileHeader, ActiveTag, InactiveTag, OutlineTag,
} from "@/components/common/modal/detail";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataInit: IPermissionCategory | null;
    setDataInit: (v: IPermissionCategory | null) => void;
}

const ViewCategory = ({ open, setOpen, dataInit, setDataInit }: IProps) => {
    const { data: detail, isLoading } = usePermissionCategoryByIdQuery(
        open && dataInit?.id ? Number(dataInit.id) : null
    );

    const handleClose = () => {
        setOpen(false);
        setDataInit(null);
    };

    const isActive = detail?.active;

    return (
        <DetailModal
            title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết danh mục phân quyền</span>}
            open={open}
            onCancel={handleClose}
            destroyOnHidden
            maskClosable={false}
            moduleClass="permission-category"
            desktopWidth={500}
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
                        avatarIcon={<SafetyCertificateOutlined />}
                        title={detail.name || "--"}
                        subtitle={detail.code ? `Mã: ${detail.code}` : undefined}
                        badges={[
                            isActive
                                ? <ActiveTag key="s" />
                                : <InactiveTag key="s" />,
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
                            label="Mã danh mục"
                            value={detail.code}
                            highlight
                        />
                        <InfoRow
                            icon={<SafetyCertificateOutlined />}
                            label="Tên danh mục"
                            value={detail.name}
                        />
                        <InfoRow
                            icon={<BankOutlined />}
                            label="Công ty"
                            span={2}
                            value={
                                detail.companyName
                                    ? <Tag style={{
                                        borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 12,
                                        border: "1px solid #d3adf7", background: "#f9f0ff", color: "#531dab",
                                    }}>{detail.companyName}</Tag>
                                    : undefined
                            }
                        />
                        <InfoRow
                            icon={<ApartmentOutlined />}
                            label="Phòng ban"
                            span={2}
                            value={
                                detail.departmentName
                                    ? <Tag style={{
                                        borderRadius: 6, margin: 0, fontWeight: 600, fontSize: 12,
                                        border: "1px solid #91caff", background: "#e6f4ff", color: "#0958d9",
                                    }}>{detail.departmentName}</Tag>
                                    : undefined
                            }
                        />
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
                            value={detail.createdBy}
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
                            value={detail.updatedBy}
                        />
                        <InfoRow
                            icon={<CalendarOutlined />}
                            label="Ngày cập nhật"
                            noBorder
                            value={detail.updatedAt
                                ? dayjs(detail.updatedAt).format("DD/MM/YYYY HH:mm")
                                : undefined}
                        />
                    </InfoCard>
                </>
            )}
        </DetailModal>
    );
};

export default ViewCategory;