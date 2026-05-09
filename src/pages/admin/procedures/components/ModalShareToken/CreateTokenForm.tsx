/**
 * CreateTokenForm.tsx
 * Dùng để: form tạo share token mới — gồm PIN, ngày hết hạn, giới hạn lượt xem + preview QR sau khi tạo
 * Dùng trong: index.tsx
 */

import { Form, Input, InputNumber, DatePicker, Button, Switch, Image, Typography, Flex, Divider } from "antd";
import { QrcodeOutlined, SafetyOutlined, CalendarOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
    form: any;
    autoPin: boolean;
    onAutoPinChange: (checked: boolean) => void;
    onCreate: () => void;
    onCancel: () => void;
    isCreating: boolean;
    newTokenQr: string | null;
    procedureCode?: string;
    isMobile: boolean;
}

export const CreateTokenForm = ({
    form,
    autoPin,
    onAutoPinChange,
    onCreate,
    onCancel,
    isCreating,
    newTokenQr,
    procedureCode,
    isMobile,
}: Props) => (
    <div style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: isMobile ? "12px 12px 4px" : "16px 16px 4px",
        marginBottom: 16,
    }}>
        <Form form={form} layout="vertical">
            <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                gap: isMobile ? "0" : "0 16px",
            }}>
                {/* PIN */}
                <Form.Item
                    name="pin"
                    label={
                        <Flex align="center" gap={8}>
                            <span>Mã PIN (tuỳ chọn)</span>
                            <Flex align="center" gap={6}>
                                <Switch
                                    size="small"
                                    checked={autoPin}
                                    onChange={(checked) => {
                                        onAutoPinChange(checked);
                                        if (checked) form.setFieldValue("pin", undefined);
                                    }}
                                />
                                <span style={{ fontSize: 12, color: "#6b7280" }}>Tự sinh</span>
                            </Flex>
                        </Flex>
                    }
                    rules={!autoPin ? [{ pattern: /^\d{4,6}$/, message: "PIN phải là 4–6 chữ số" }] : []}
                >
                    <Input
                        maxLength={6}
                        disabled={autoPin}
                        placeholder={autoPin ? "Hệ thống tự sinh PIN 6 số" : "4–6 số, để trống nếu không cần"}
                        prefix={<SafetyOutlined style={{ color: autoPin ? "#d1d5db" : "#9ca3af" }} />}
                    />
                </Form.Item>

                {/* Ngày hết hạn */}
                <Form.Item name="expiresAt" label="Ngày hết hạn (tuỳ chọn)">
                    <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        placeholder="Không giới hạn"
                        suffixIcon={<CalendarOutlined />}
                        disabledDate={(d) => d.isBefore(dayjs(), "day")}
                    />
                </Form.Item>

                {/* Giới hạn lượt xem */}
                <Form.Item name="maxAccessCount" label="Giới hạn lượt xem (tuỳ chọn)">
                    <InputNumber min={1} style={{ width: "100%" }} placeholder="Để trống = không giới hạn" />
                </Form.Item>
            </div>

            <Flex gap={8} style={{ marginBottom: 16 }}>
                <Button
                    icon={<QrcodeOutlined />}
                    loading={isCreating}
                    onClick={onCreate}
                    style={{
                        background: "linear-gradient(135deg,#f0226e,#ff5fa0)",
                        border: "none",
                        color: "white",
                        boxShadow: "0 2px 8px rgba(240,34,110,0.25)",
                    }}
                >
                    Tạo link & QR
                </Button>
                <Button onClick={onCancel}>Huỷ</Button>
            </Flex>
        </Form>

        {/* Preview QR vừa tạo */}
        {newTokenQr && (
            <>
                <Divider style={{ margin: "0 0 14px" }} />
                <Flex align="center" gap={16} style={{ marginBottom: 16 }}>
                    <div style={{
                        padding: 8,
                        background: "#fff",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        flexShrink: 0,
                    }}>
                        <Image
                            src={`data:image/png;base64,${newTokenQr}`}
                            width={isMobile ? 80 : 100}
                            height={isMobile ? 80 : 100}
                            preview={{ mask: <EyeOutlined /> }}
                            style={{ borderRadius: 4, display: "block" }}
                        />
                    </div>
                    <div>
                        <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
                            Mã QR vừa tạo
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 10 }}>
                            Bấm vào ▶ ở dòng tương ứng để xem lại QR bất cứ lúc nào.
                        </Text>
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            style={{ borderColor: "#fcc", color: "#e8256b" }}
                            onClick={() => {
                                const a = document.createElement("a");
                                a.href = `data:image/png;base64,${newTokenQr}`;
                                a.download = `qr-${procedureCode}-${Date.now()}.png`;
                                a.click();
                            }}
                        >
                            Tải QR về máy
                        </Button>
                    </div>
                </Flex>
            </>
        )}
    </div>
);