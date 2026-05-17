import { Spin, Empty } from "antd";
import {
    StarOutlined, CodeOutlined, BankOutlined,
    CalendarOutlined, UserAddOutlined, OrderedListOutlined,
    SortAscendingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { IPositionLevel } from "@/types/backend";
import { usePositionLevelByIdQuery } from "@/hooks/usePositionLevels";
import {
    DetailModal, InfoRow, InfoCard, SectionTitle,
    ProfileHeader, ActiveTag, InactiveTag, OutlineTag,
} from "@/components/common/modal/detail";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IPositionLevel | null;
    setDataInit: (v: any) => void;
}

const ViewDetailPositionLevel = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const { data: detail, isLoading } = usePositionLevelByIdQuery(
        open && dataInit?.id ? dataInit.id : undefined
    );

    const close = () => {
        onClose(false);
        setDataInit(null);
    };

    const isActive = detail?.status === 1;

    return (
        <DetailModal
            title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết bậc chức danh</span>}
            open={open}
            onCancel={close}
            destroyOnHidden
            maskClosable={false}
            moduleClass="position-level"
            desktopWidth={540}
        >
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <Spin size="large" />
                </div>
            ) : !detail ? (
                <Empty description="Không tìm thấy thông tin bậc chức danh" style={{ padding: "32px 0" }} />
            ) : (
                <>
                    <ProfileHeader
                        avatarIcon={<StarOutlined />}
                        title={detail.code || "--"}
                        badges={[isActive ? <ActiveTag key="s" label="Đang hoạt động" /> : <InactiveTag key="s" />]}
                        tags={[
                            detail.band
                                ? <OutlineTag key="band" icon={<OrderedListOutlined />} label={`Nhóm: ${detail.band}`} />
                                : null,
                            detail.levelNumber !== undefined && detail.levelNumber !== null
                                ? <OutlineTag key="lvl" icon={<SortAscendingOutlined />} label={`Cấp ${detail.levelNumber}`} />
                                : null,
                            detail.companyName
                                ? <OutlineTag key="co" icon={<BankOutlined />} label={detail.companyName} />
                                : null,
                        ].filter(Boolean) as React.ReactNode[]}
                    />

                    <InfoCard>
                        <SectionTitle>Thông tin bậc chức danh</SectionTitle>
                        <InfoRow icon={<CodeOutlined />}           label="Mã bậc"      value={detail.code}        highlight />
                        <InfoRow icon={<OrderedListOutlined />}    label="Nhóm (Band)" value={detail.band} />
                        <InfoRow icon={<SortAscendingOutlined />}  label="Cấp (Level)" value={detail.levelNumber !== undefined && detail.levelNumber !== null ? String(detail.levelNumber) : undefined} />
                        <InfoRow icon={<StarOutlined />}           label="Thứ tự nhóm" value={detail.bandOrder !== undefined && detail.bandOrder !== null ? String(detail.bandOrder) : undefined} />
                        <InfoRow icon={<BankOutlined />}           label="Công ty"     value={detail.companyName} noBorder />
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

export default ViewDetailPositionLevel;