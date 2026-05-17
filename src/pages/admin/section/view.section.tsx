import { Spin, Empty } from "antd";
import {
    AppstoreOutlined, CodeOutlined, ApartmentOutlined,
    CalendarOutlined, UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { ISection } from "@/types/backend";
import { useSectionByIdQuery } from "@/hooks/useSections";
import {
    DetailModal, InfoRow, InfoCard, SectionTitle,
    ProfileHeader, ActiveTag, InactiveTag, OutlineTag,
} from "@/components/common/modal/detail";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: ISection | null;
    setDataInit: (v: any) => void;
}

const ViewDetailSection = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const { data: detail, isLoading } = useSectionByIdQuery(
        open && dataInit?.id ? dataInit.id : undefined
    );

    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    const isActive = detail?.active;

    return (
        <DetailModal
            title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết bộ phận</span>}
            open={open}
            onCancel={handleClose}
            destroyOnHidden
            maskClosable={false}
            moduleClass="section"
            desktopWidth={560}
        >
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <Spin size="large" />
                </div>
            ) : !detail ? (
                <Empty description="Không tìm thấy thông tin bộ phận" style={{ padding: "32px 0" }} />
            ) : (
                <>
                    <ProfileHeader
                        avatarIcon={<AppstoreOutlined />}
                        title={detail.name || "--"}
                        badges={[isActive ? <ActiveTag key="s" /> : <InactiveTag key="s" label="Vô hiệu hóa" />]}
                        tags={[
                            detail.code
                                ? <OutlineTag key="code" icon={<CodeOutlined />} label={detail.code} />
                                : null,
                            detail.department?.name
                                ? <OutlineTag key="dept" icon={<ApartmentOutlined />} label={detail.department.name} />
                                : null,
                        ].filter(Boolean) as React.ReactNode[]}
                    />

                    <InfoCard>
                        <SectionTitle>Thông tin bộ phận</SectionTitle>
                        <InfoRow icon={<CodeOutlined />}      label="Mã bộ phận"  value={detail.code}               highlight />
                        <InfoRow icon={<AppstoreOutlined />}  label="Tên bộ phận" value={detail.name} />
                        <InfoRow icon={<ApartmentOutlined />} label="Phòng ban"   value={detail.department?.name}   noBorder />
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

export default ViewDetailSection;