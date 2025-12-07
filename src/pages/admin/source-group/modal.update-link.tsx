import { ModalForm, ProFormTextArea } from "@ant-design/pro-components";
import { message, notification } from "antd";
import type { ISourceLink } from "@/types/backend";
import { callUpdateLinkCaption } from "@/config/api";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    link: ISourceLink | null;
    onSuccess: () => void;
}

const ModalUpdateLink = ({ open, setOpen, link, onSuccess }: IProps) => {
    const handleSubmit = async (values: any) => {
        if (!link) return;
        try {
            const res = await callUpdateLinkCaption(link.id, { caption: values.caption });
            if (res?.data) {
                message.success("Cập nhật mô tả thành công!");
                onSuccess();
                setOpen(false);
            }
        } catch (err: any) {
            notification.error({
                message: "Không thể cập nhật mô tả",
                description: err.message || "Đã xảy ra lỗi khi xử lý",
            });
        }
    };

    return (
        <ModalForm
            title={`Cập nhật mô tả cho Link #${link?.id || ""}`}
            open={open}
            onOpenChange={setOpen}
            initialValues={{ caption: link?.caption || "" }}
            modalProps={{
                destroyOnClose: true,
                maskClosable: false,
            }}
            onFinish={handleSubmit}
        >
            <ProFormTextArea
                name="caption"
                label="Mô tả (Caption)"
                placeholder="Nhập mô tả mới..."
                rules={[{ required: true, message: "Vui lòng nhập mô tả hợp lệ" }]}
                fieldProps={{ rows: 4 }}
            />
        </ModalForm>
    );
};

export default ModalUpdateLink;
