import { Spin, Empty } from "antd";
import {
    BankOutlined, CodeOutlined, GlobalOutlined,
    CalendarOutlined, UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { useCompanyByIdQuery } from "@/hooks/useCompanies";
import {
    DetailModal, InfoRow, InfoCard, SectionTitle,
    ProfileHeader, ActiveTag, InactiveTag, OutlineTag,
} from "@/components/common/modal/detail";

interface IProps {
    open: boolean;
    onClose: () => void;
    companyId?: string | number | null;
}

const ViewCompany = ({ open, onClose, companyId }: IProps) => {
    const { data: company, isLoading, isError } = useCompanyByIdQuery(
        companyId ? String(companyId) : undefined
    );

    const isActive = company?.status === 1;

    return (
        <DetailModal
            title={<span style={{ letterSpacing: "-0.03em" }}>Chi tiết công ty</span>}
            open={open}
            onCancel={onClose}
            destroyOnHidden
            maskClosable={false}
            moduleClass="company"
            desktopWidth={600}
        >
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <Spin size="large" />
                </div>
            ) : isError || !company ? (
                <Empty description="Không tìm thấy thông tin công ty" style={{ padding: "32px 0" }} />
            ) : (
                <>
                    <ProfileHeader
                        avatarIcon={<BankOutlined />}
                        title={company.name || "--"}
                        badges={[isActive ? <ActiveTag key="s" /> : <InactiveTag key="s" />]}
                        tags={[
                            company.code
                                ? <OutlineTag key="code" icon={<CodeOutlined />} label={company.code} />
                                : null,
                            company.englishName
                                ? <OutlineTag key="en" icon={<GlobalOutlined />} label={company.englishName} />
                                : null,
                        ].filter(Boolean) as React.ReactNode[]}
                    />

                    <InfoCard>
                        <SectionTitle>Thông tin công ty</SectionTitle>
                        <InfoRow icon={<CodeOutlined />}   label="Mã công ty"    value={company.code}        highlight />
                        <InfoRow icon={<BankOutlined />}   label="Tên công ty"   value={company.name} />
                        <InfoRow icon={<GlobalOutlined />} label="Tên tiếng Anh" value={company.englishName} noBorder />
                    </InfoCard>

                    <InfoCard style={{ marginBottom: 0 }}>
                        <SectionTitle>Lịch sử</SectionTitle>
                        <InfoRow icon={<UserAddOutlined />} label="Người tạo"      value={company.createdBy} />
                        <InfoRow
                            icon={<CalendarOutlined />}
                            label="Ngày tạo"
                            value={company.createdAt ? dayjs(company.createdAt).format("DD/MM/YYYY HH:mm") : undefined}
                        />
                        <InfoRow icon={<UserAddOutlined />} label="Người cập nhật" value={company.updatedBy} />
                        <InfoRow
                            icon={<CalendarOutlined />}
                            label="Ngày cập nhật"
                            value={company.updatedAt ? dayjs(company.updatedAt).format("DD/MM/YYYY HH:mm") : undefined}
                            noBorder
                        />
                    </InfoCard>
                </>
            )}
        </DetailModal>
    );
};

export default ViewCompany;