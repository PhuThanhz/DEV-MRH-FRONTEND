import { Spin, Empty } from "antd";
import {
    TagOutlined, GlobalOutlined, StarOutlined,
    BankOutlined, CalendarOutlined, UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { IJobTitle } from "@/types/backend";
import { useJobTitleByIdQuery } from "@/hooks/useJobTitles";
import {
    DetailModal, InfoRow, InfoCard, SectionTitle,
    ProfileHeader, ActiveTag, InactiveTag, OutlineTag,
} from "@/components/common/modal/detail";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IJobTitle | null;
    setDataInit: (v: any) => void;
}

const ViewDetailJobTitle = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const { data: detail, isLoading } = useJobTitleByIdQuery(
        open && dataInit?.id ? dataInit.id : undefined
    );

    const handleClose = () => {
        setDataInit(null);
        onClose(false);
    };

    const isActive = detail?.active;

    return (
        <DetailModal
            title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết chức danh</span>}
            open={open}
            onCancel={handleClose}
            destroyOnHidden
            maskClosable={false}
            moduleClass="job-title"
            desktopWidth={540}
        >
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <Spin size="large" />
                </div>
            ) : !detail ? (
                <Empty description="Không tìm thấy thông tin chức danh" style={{ padding: "32px 0" }} />
            ) : (
                <>
                    <ProfileHeader
                        avatarIcon={<TagOutlined />}
                        title={detail.nameVi || "--"}
                        subtitle={detail.nameEn || undefined}
                        badges={[isActive ? <ActiveTag key="s" label="Đang hoạt động" /> : <InactiveTag key="s" />]}
                        tags={[
                            detail.positionLevel?.code
                                ? <OutlineTag key="pl" icon={<StarOutlined />} label={`Bậc: ${detail.positionLevel.code}`} />
                                : null,
                            detail.positionLevel?.companyName
                                ? <OutlineTag key="co" icon={<BankOutlined />} label={detail.positionLevel.companyName} />
                                : null,
                        ].filter(Boolean) as React.ReactNode[]}
                    />

                    <InfoCard>
                        <SectionTitle>Thông tin chức danh</SectionTitle>
                        <InfoRow icon={<TagOutlined />}    label="Tên chức danh (VI)" value={detail.nameVi}                       highlight />
                        <InfoRow icon={<GlobalOutlined />} label="Tên chức danh (EN)" value={detail.nameEn} />
                        <InfoRow icon={<StarOutlined />}   label="Bậc chức danh"      value={detail.positionLevel?.code} />
                        <InfoRow icon={<BankOutlined />}   label="Công ty"            value={detail.positionLevel?.companyName}   noBorder />
                    </InfoCard>

                    <InfoCard style={{ marginBottom: 0 }}>
                        <SectionTitle>Lịch sử</SectionTitle>
                        <InfoRow icon={<UserAddOutlined />} label="Người tạo"      value={detail.createdBy} />
                        <InfoRow
                            icon={<CalendarOutlined />}
                            label="Ngày tạo"
                            value={detail.createdAt ? dayjs(detail.createdAt).format("DD/MM/YYYY HH:mm") : undefined}
                        />
                        <InfoRow icon={<UserAddOutlined />} label="Người cập nhật" value={detail.updatedBy} />
                        <InfoRow
                            icon={<CalendarOutlined />}
                            label="Ngày cập nhật"
                            value={detail.updatedAt ? dayjs(detail.updatedAt).format("DD/MM/YYYY HH:mm") : undefined}
                            noBorder
                        />
                    </InfoCard>
                </>
            )}
        </DetailModal>
    );
};

export default ViewDetailJobTitle;