import { useState } from "react";
import { Card, Button, Space, Typography } from "antd";
import { useParams, useSearchParams } from "react-router-dom";

import PermissionViewModal from "./ components/PermissionViewModal";

const { Title, Text } = Typography;

const DepartmentPermissionPage = () => {
    const { id: departmentId } = useParams();
    const [params] = useSearchParams();

    const [open, setOpen] = useState(true);

    const departmentName = params.get("departmentName");

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <Space direction="vertical" size={12}>
                    <Title level={4}>Bản phân quyền phòng ban</Title>
                    <Text type="secondary">
                        Phòng ban: {departmentName || `ID ${departmentId}`}
                    </Text>

                    <Button type="primary" onClick={() => setOpen(true)}>
                        Xem bảng phân quyền
                    </Button>
                </Space>
            </Card>

            {/* MODAL VIEW */}
            <PermissionViewModal
                open={open}
                onClose={() => setOpen(false)}
                departmentName={departmentName || ""}
            />
        </div>
    );
};

export default DepartmentPermissionPage;
