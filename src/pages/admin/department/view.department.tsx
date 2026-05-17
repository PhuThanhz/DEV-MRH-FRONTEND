import { Spin, Empty } from "antd";
import {
    ApartmentOutlined, CodeOutlined, GlobalOutlined,
    CalendarOutlined, UserAddOutlined, BankOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import type { IDepartment } from "@/types/backend";
import { useDepartmentByIdQuery } from "@/hooks/useDepartments";
import {
    DetailModal, InfoRow, InfoCard, SectionTitle,
    ProfileHeader, ActiveTag, InactiveTag, OutlineTag,
} from "@/components/common/modal/detail";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IDepartment | null;
    setDataInit: (v: any) => void;
}

const ViewDepartment = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const { data: detail, isLoading } = useDepartmentByIdQuery(
        open && dataInit?.id ? dataInit.id : undefined
    );

    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    const isActive = detail?.status === 1;

    return (
        <DetailModal
            title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết phòng ban</span>}
            open={open}
            onCancel={handleClose}
            destroyOnHidden
            maskClosable={false}
            moduleClass="department"
            desktopWidth={580}
        >
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <Spin size="large" />
                </div>
            ) : !detail ? (
                <Empty description="Không tìm thấy thông tin phòng ban" style={{ padding: "32px 0" }} />
            ) : (
                <>
                    <ProfileHeader
                        avatarIcon={<ApartmentOutlined />}
                        title={detail.name || "--"}
                        badges={[isActive ? <ActiveTag key="s" /> : <InactiveTag key="s" />]}
                        tags={[
                            detail.code
                                ? <OutlineTag key="code" icon={<CodeOutlined />} label={detail.code} />
                                : null,
                            detail.company?.name
                                ? <OutlineTag key="co" icon={<BankOutlined />} label={detail.company.name} />
                                : null,
                        ].filter(Boolean) as React.ReactNode[]}
                    />

                    <InfoCard>
                        <SectionTitle>Thông tin phòng ban</SectionTitle>
                        <InfoRow icon={<CodeOutlined />}       label="Mã phòng ban"   value={detail.code}             highlight />
                        <InfoRow icon={<ApartmentOutlined />}  label="Tên phòng ban"  value={detail.name} />
                        <InfoRow icon={<GlobalOutlined />}     label="Tên tiếng Anh"  value={detail.englishName} />
                        <InfoRow icon={<BankOutlined />}       label="Công ty"        value={detail.company?.name}    noBorder />
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

export default ViewDepartment;