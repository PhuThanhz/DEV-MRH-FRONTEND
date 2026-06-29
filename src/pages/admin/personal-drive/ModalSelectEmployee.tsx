import React, { useState, useRef } from 'react';
import { Modal, Button, Tag, Avatar, Space } from 'antd';
import { UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { callFetchUsersCrossCompany, callFetchSubordinates, callFetchCompany, callFetchDepartment } from '@/config/api';
import queryString from 'query-string';
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";
import { getModalWidth, MODAL_BODY_SCROLL } from "@/utils/responsive";

interface IProps {
    open: boolean;
    onClose: () => void;
    isAdmin: boolean;
    onSelectEmployee: (userId: string | undefined, userName: string) => void;
    currentSelectedId?: string;
}

const ModalSelectEmployee: React.FC<IProps> = ({ open, onClose, isAdmin, onSelectEmployee, currentSelectedId }) => {
    const actionRef = useRef<ActionType>(null);
    const [searchValue, setSearchValue] = useState<string>("");
    const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({});

    const columns: ProColumns<any>[] = [
        {
            title: 'Nhân viên',
            dataIndex: 'name',
            width: 250,
            render: (_, record) => (
                <Space>
                    <Avatar
                        src={record.avatar ? `${import.meta.env.VITE_BACKEND_URL}/uploads/avatar/${record.avatar}` : undefined}
                        icon={<UserOutlined />}
                    />
                    <div>
                        <div style={{ fontWeight: 500, color: '#1f2937' }}>{record.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{record.email}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Mã NV',
            dataIndex: 'employeeCode',
            width: 100,
            hideInSearch: true,
            render: (_, record) => record.employeeCode || '--'
        },
        {
            title: 'Chức danh',
            hideInSearch: true,
            render: (_, record) => {
                if (!record.jobTitle) return '--';
                return <Tag color="blue">{record.jobTitle}</Tag>;
            }
        },
        {
            title: 'Phòng ban / Công ty',
            hideInSearch: true,
            render: (_, record) => {
                if (!record.departmentName && !record.companyName) return '--';
                return (
                    <Space direction="vertical" size={4}>
                        <div style={{ fontSize: 13 }}>
                            <div style={{ color: '#0958d9', fontWeight: 500 }}>{record.departmentName || '---'}</div>
                            <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.companyName || '---'}</div>
                        </div>
                    </Space>
                );
            }
        },
        {
            title: 'Hành động',
            align: 'center',
            width: 100,
            hideInSearch: true,
            render: (_, record) => {
                const isSelected = record.id === currentSelectedId;
                return (
                    <Button
                        type={isSelected ? "primary" : "default"}
                        icon={isSelected ? <CheckCircleOutlined /> : undefined}
                        onClick={() => {
                            onSelectEmployee(record.id, record.name);
                            onClose();
                        }}
                    >
                        {isSelected ? "Đang chọn" : "Chọn"}
                    </Button>
                );
            }
        }
    ];

    const fetchUsers = async (params: any, sort: any, filter: any) => {
        // Nếu không phải Admin, chỉ lấy cấp dưới (không hỗ trợ phân trang chuẩn từ API này nhưng giả lập table)
        if (!isAdmin) {
            const res = await callFetchSubordinates();
            let data = res.data || [];
            if (searchValue) {
                data = data.filter((item: any) =>
                    item.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
                    item.email?.toLowerCase().includes(searchValue.toLowerCase())
                );
            }
            return {
                data: data,
                success: true,
                total: data.length
            };
        }

        // Nếu là Admin thì gọi API có phân trang
        const q: any = {
            page: params.current,
            size: params.pageSize,
        };
        if (searchValue) {
            q.search = searchValue;
        }
        if (advancedFilters.companyId) {
            q.companyId = advancedFilters.companyId;
        }
        if (advancedFilters.departmentId) {
            q.departmentId = advancedFilters.departmentId;
        }

        const query = queryString.stringify(q, { encode: false });
        const res = await callFetchUsersCrossCompany(query);

        return {
            data: res.data?.result || [],
            success: true,
            total: res.data?.meta?.total || 0,
        };
    };

    return (
        <Modal
            title="Tìm kiếm & Chọn nhân viên"
            open={open}
            onCancel={onClose}
            width={getModalWidth(1000)}
            footer={null}
            destroyOnClose
            style={{ top: 40 }}
            styles={{ body: MODAL_BODY_SCROLL }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <SearchFilter
                    searchPlaceholder="Tìm theo tên, email hoặc mã NV..."
                    showFilterButton={false}
                    showAddButton={false}
                    onSearch={(val) => {
                        setSearchValue(val);
                        actionRef.current?.reload();
                    }}
                    onReset={() => {
                        setSearchValue("");
                        setAdvancedFilters({});
                        actionRef.current?.reload();
                    }}
                />
                {isAdmin && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        <AdvancedFilterSelect
                            fields={[
                                {
                                    key: "companyId",
                                    label: "Công ty",
                                    searchable: true,
                                    asyncOptions: async () => {
                                        const res = await callFetchCompany('page=1&size=100');
                                        return res.data?.result?.map((c: any) => ({ label: c.name, value: c.id })) || [];
                                    }
                                },
                                {
                                    key: "departmentId",
                                    label: "Phòng ban",
                                    searchable: true,
                                    asyncOptions: async () => {
                                        const res = await callFetchDepartment('page=1&size=500');
                                        return res.data?.result?.map((d: any) => ({ label: d.name, value: d.id })) || [];
                                    }
                                }
                            ]}
                            onChange={(filters) => {
                                setAdvancedFilters(filters);
                                actionRef.current?.reload();
                            }}
                        />
                    </div>
                )}
            </div>

            <ProTable
                rowKey="id"
                actionRef={actionRef}
                columns={columns}
                request={fetchUsers}
                pagination={{
                    defaultPageSize: 5,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20']
                }}
                search={false}
                options={false}
                tableAlertRender={false}
                tableAlertOptionRender={false}
            />
        </Modal>
    );
};

export default ModalSelectEmployee;
