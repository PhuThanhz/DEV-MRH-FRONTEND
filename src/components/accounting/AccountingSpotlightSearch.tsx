import React, { useState, useEffect, useRef } from "react";
import { Modal, Input, List, Typography, Space, Button, Empty, Spin, Tag } from "antd";
import { SearchOutlined, EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import { callFetchAccountingDocuments } from "@/config/api";
import dayjs from "dayjs";

const { Text } = Typography;
const getValidityLabel = (active?: boolean) => active ? "Còn hiệu lực" : "Đã hủy";

interface AccountingSpotlightSearchProps {
    open: boolean;
    onClose: () => void;
}

const AccountingSpotlightSearch: React.FC<AccountingSpotlightSearchProps> = ({ open, onClose }) => {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const inputRef = useRef<any>(null);

    // Debounce search
    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const queryStr = `current=1&pageSize=10&keyword=${encodeURIComponent(query.trim())}`;
                const res = await callFetchAccountingDocuments(queryStr);
                if (res?.data?.result) {
                    setResults(res.data.result);
                } else if (Array.isArray(res?.data)) {
                    // Filter in memory if the API returns all
                    const filtered = res.data.filter((d: any) => 
                        (d.documentCode && d.documentCode.toLowerCase().includes(query.toLowerCase())) ||
                        (d.documentName && d.documentName.toLowerCase().includes(query.toLowerCase()))
                    ).slice(0, 10);
                    setResults(filtered);
                } else {
                    setResults([]);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchResults();
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setQuery("");
            setResults([]);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closable={false}
            width={600}
            style={{ top: 100 }}
            styles={{
                body: { padding: 0, borderRadius: 12, overflow: "hidden" },
                mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.2)" }
            }}
        >
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", background: "#fff", display: "flex", alignItems: "center" }}>
                <SearchOutlined style={{ fontSize: 24, color: "#ec4899", marginRight: 16 }} />
                <Input
                    ref={inputRef}
                    placeholder="Nhập mã chứng từ hoặc nội dung..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    variant="borderless"
                    style={{ fontSize: 20, padding: 0, boxShadow: "none" }}
                    autoFocus
                />
            </div>
            
            <div style={{ background: "#fafafa", minHeight: 150, maxHeight: 400, overflowY: "auto", padding: 12 }}>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                        <Spin />
                    </div>
                ) : results.length > 0 ? (
                    <List
                        dataSource={results}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    background: "#fff",
                                    borderRadius: 8,
                                    marginBottom: 8,
                                    padding: "12px 16px",
                                    border: "1px solid #f0f0f0",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                className="spotlight-item"
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ec4899")}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f0f0f0")}
                                onClick={() => {
                                    // Open document logic
                                    window.open(`/admin/accounting-documents?search=${item.documentCode}`, '_blank');
                                }}
                            >
                                <List.Item.Meta
                                    avatar={<FileTextOutlined style={{ fontSize: 24, color: "#db2777" }} />}
                                    title={
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Text strong style={{ fontSize: 16, color: "#9d174d" }}>{item.documentCode}</Text>
                                            <Tag color={item.active ? "success" : "default"}>{getValidityLabel(item.active)}</Tag>
                                        </div>
                                    }
                                    description={
                                        <Space direction="vertical" size={2} style={{ width: "100%" }}>
                                            <Text type="secondary" ellipsis style={{ maxWidth: 400 }}>{item.documentName || "Không có nội dung"}</Text>
                                            <Space size={16}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Ngày ban hành: {item.issuedDate ? dayjs(item.issuedDate).format("DD/MM/YYYY") : "N/A"}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>Phòng ban: {item.department?.companyName || "Chung"}</Text>
                                            </Space>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                ) : query ? (
                    <Empty description="Không tìm thấy chứng từ nào" style={{ margin: "40px 0" }} />
                ) : (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
                        <SearchOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                        <p>Gõ mã hoặc tên chứng từ để tìm kiếm nhanh</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AccountingSpotlightSearch;
