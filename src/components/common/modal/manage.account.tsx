/**
 * manage.account.tsx — Root export only
 */

import { Modal } from "antd";
import { isMobile } from "react-device-detect";
import { UserUpdateInfo } from "./manage.account.content";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
}

const ManageAccount = ({ open, onClose }: IProps) => (
    <Modal
        title={
            <span style={{
                fontSize: 12, fontWeight: 700, color: "#9ca3af",
                letterSpacing: ".12em", textTransform: "uppercase",
            }}>
                Tài khoản
            </span>
        }
        open={open}
        onCancel={() => onClose(false)}
        footer={null}
        destroyOnClose
        maskClosable={false}
        width={isMobile ? "100%" : 800}
        styles={{
            body: { padding: "0 24px 24px", maxHeight: "82vh", overflowY: "auto" },
            content: { borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" },
            header: { padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6" },
            mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.18)" },
        }}
    >
        <style>{`
            .ant-modal-body::-webkit-scrollbar { width: 4px; }
            .ant-modal-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        `}</style>
        <UserUpdateInfo onClose={onClose} />
    </Modal>
);

export default ManageAccount;