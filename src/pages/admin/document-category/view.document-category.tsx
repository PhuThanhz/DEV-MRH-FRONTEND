import { Tag } from "antd";
import {
    FolderOutlined, TagOutlined, FileTextOutlined,
    UserAddOutlined, CalendarOutlined,
    CheckCircleOutlined, StopOutlined, LinkOutlined,
    GlobalOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { IDocumentCategory } from "@/types/backend";
import {
    DetailModal, InfoRow, InfoCard, SectionTitle,
    ProfileHeader, ActiveTag, InactiveTag, OutlineTag,
} from "@/components/common/modal/detail";

interface Props {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IDocumentCategory | null;
    setDataInit: (v: IDocumentCategory | null) => void;
}

const ViewDetailDocumentCategory = ({ open, onClose, dataInit, setDataInit }: Props) => {
    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    if (!dataInit) return null;

    const isActive = dataInit.active;

    return (
        <DetailModal
            title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết danh mục loại văn bản</span>}
            open={open}
            onCancel={handleClose}
            destroyOnHidden
            maskClosable={false}
            moduleClass="document-category"
            desktopWidth={480}
        >
            <ProfileHeader
                avatarIcon={<FolderOutlined />}
                title={dataInit.categoryName || "--"}
                subtitle={dataInit.categoryCode ? `Mã: ${dataInit.categoryCode}` : undefined}
                badges={[
                    isActive
                        ? <ActiveTag key="s" />
                        : <InactiveTag key="s" />,
                ]}
                tags={[
                    dataInit.categoryCode
                        ? <OutlineTag key="code" icon={<TagOutlined />} label={dataInit.categoryCode} />
                        : null,
                    dataInit.symbol
                        ? <OutlineTag key="sym" icon={<FileTextOutlined />} label={dataInit.symbol} />
                        : null,
                ].filter(Boolean) as React.ReactNode[]}
            />

            <InfoCard>
                <SectionTitle>Thông tin chung</SectionTitle>
                <InfoRow
                    icon={<TagOutlined />}
                    label="Mã danh mục"
                    value={
                        dataInit.categoryCode
                            ? <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{dataInit.categoryCode}</Tag>
                            : undefined
                    }
                    highlight
                />
                <InfoRow
                    icon={<FolderOutlined />}
                    label="Tên danh mục"
                    value={dataInit.categoryName}
                />
                <InfoRow
                    icon={<FileTextOutlined />}
                    label="Ký hiệu"
                    value={
                        dataInit.symbol
                            ? <Tag style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{dataInit.symbol}</Tag>
                            : undefined
                    }
                />
                <InfoRow
                    icon={<FileTextOutlined />}
                    label="Định nghĩa"
                    value={dataInit.definition}
                />
                <InfoRow
                    icon={<LinkOutlined />}
                    label="Mapping quy trình"
                    value={
                        dataInit.mappingProcedure
                            ? <Tag color="green" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>Có mapping</Tag>
                            : <Tag color="default" style={{ borderRadius: 6, margin: 0 }}>Không</Tag>
                    }
                />
                <InfoRow
                    icon={<GlobalOutlined />}
                    label="Gửi liên công ty"
                    value={
                        (dataInit as any).isCrossCompany
                            ? <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>Có</Tag>
                            : <Tag color="default" style={{ borderRadius: 6, margin: 0 }}>Không</Tag>
                    }
                />
                <InfoRow
                    icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
                    label="Trạng thái"
                    noBorder
                    value={
                        isActive
                            ? <Tag color="success" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>Hoạt động</Tag>
                            : <Tag color="error" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>Ngừng hoạt động</Tag>
                    }
                />
            </InfoCard>

            <InfoCard style={{ marginBottom: 0 }}>
                <SectionTitle>Lịch sử</SectionTitle>
                <InfoRow
                    icon={<UserAddOutlined />}
                    label="Người tạo"
                    value={dataInit.createdBy}
                />
                <InfoRow
                    icon={<CalendarOutlined />}
                    label="Ngày tạo"
                    value={dataInit.createdAt
                        ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm")
                        : undefined}
                />
                <InfoRow
                    icon={<UserAddOutlined />}
                    label="Người cập nhật"
                    value={dataInit.updatedBy}
                />
                <InfoRow
                    icon={<CalendarOutlined />}
                    label="Ngày cập nhật"
                    noBorder
                    value={dataInit.updatedAt
                        ? dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm")
                        : undefined}
                />
            </InfoCard>
        </DetailModal>
    );
};

export default ViewDetailDocumentCategory;