import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Empty, Popconfirm, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import { BankOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, TeamOutlined } from "@ant-design/icons";

import { callFetchCompany, callFetchDepartmentsByCompany } from "@/config/api";
import { useUpdateUserAdminScopesMutation, useUserAdminScopesQuery } from "@/hooks/useUserAdminScopes";
import { useUserPositionsQuery } from "@/hooks/useUserPositions";
import type { IReqUserAdminScopeItem, IUserAdminScope, IUserPosition } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

const { Text } = Typography;

type AdminScopeMode = "COMPANY" | "DEPARTMENT";

interface IProps {
    activeUserId?: string;
    mode: AdminScopeMode;
}

const BORDER = "#e5e7eb";
const ACCENT = "#f5317f";
const SELECT_POPUP_WIDTH = 420;

const renderFullOption = (option: any) => {
    const label = String(option?.label ?? "");
    return (
        <Tooltip title={label} placement="right">
            <div style={{
                whiteSpace: "normal",
                lineHeight: 1.35,
                padding: "4px 0",
                wordBreak: "break-word",
                fontWeight: 500,
            }}>
                {label}
            </div>
        </Tooltip>
    );
};

const UserAdminScopeForm = ({ activeUserId, mode }: IProps) => {
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
    const [draftScopes, setDraftScopes] = useState<IUserAdminScope[]>([]);
    const [assignableCompanyOptions, setAssignableCompanyOptions] = useState<{ label: string; value: number }[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: number }[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);

    const { data: savedScopes = [], isLoading } = useUserAdminScopesQuery(activeUserId);
    const { data: positions = [], isLoading: loadingPositions } = useUserPositionsQuery(activeUserId);
    const { mutate: updateScopes, isPending: isSaving } = useUpdateUserAdminScopesMutation(activeUserId);

    useEffect(() => {
        setDraftScopes(savedScopes as IUserAdminScope[]);
    }, [savedScopes]);

    useEffect(() => {
        setSelectedCompanyIds([]);
        setSelectedCompanyId(null);
        setSelectedDepartmentIds([]);
        setDepartmentOptions([]);
        setDraftScopes(savedScopes as IUserAdminScope[]);
    }, [mode, savedScopes]);

    useEffect(() => {
        if (mode !== "COMPANY") return;

        setLoadingCompanies(true);
        callFetchCompany("page=1&size=200&sort=name,asc")
            .then((res: any) => {
                const list = res?.data?.result ?? [];
                setAssignableCompanyOptions(list.map((c: any) => ({ label: c.name, value: Number(c.id) })));
            })
            .finally(() => setLoadingCompanies(false));
    }, [mode]);

    const positionCompanyOptions = useMemo(() => {
        const map = new Map<number, string>();
        (positions as IUserPosition[]).forEach((position) => {
            if (position.company?.id) {
                map.set(Number(position.company.id), position.company.name);
            }
        });
        return Array.from(map.entries()).map(([value, label]) => ({ label, value }));
    }, [positions]);

    const companyOptions = mode === "COMPANY" ? assignableCompanyOptions : positionCompanyOptions;

    useEffect(() => {
        if (mode !== "DEPARTMENT" || !selectedCompanyId) {
            setDepartmentOptions([]);
            setSelectedDepartmentIds([]);
            return;
        }

        setSelectedDepartmentIds([]);
        setDepartmentOptions([]);
        setLoadingDepartments(true);
        callFetchDepartmentsByCompany(selectedCompanyId)
            .then((res: any) => {
                const list = res?.data ?? [];
                setDepartmentOptions(list.map((d: any) => ({ label: d.name, value: Number(d.id) })));
            })
            .finally(() => setLoadingDepartments(false));
    }, [mode, selectedCompanyId]);

    const companyNameById = useMemo(() => {
        return new Map(companyOptions.map((item) => [item.value, item.label]));
    }, [companyOptions]);

    const departmentNameById = useMemo(() => {
        return new Map(departmentOptions.map((item) => [item.value, item.label]));
    }, [departmentOptions]);

    useEffect(() => {
        if (selectedCompanyIds.some((id) => !companyNameById.has(id))) {
            setSelectedCompanyIds((prev) => prev.filter((id) => companyNameById.has(id)));
        }
    }, [companyNameById, selectedCompanyIds]);

    useEffect(() => {
        if (selectedCompanyId && !companyNameById.has(selectedCompanyId)) {
            setSelectedCompanyId(null);
            setSelectedDepartmentIds([]);
        }
    }, [companyNameById, selectedCompanyId]);

    useEffect(() => {
        if (selectedDepartmentIds.some((id) => !departmentNameById.has(id))) {
            setSelectedDepartmentIds((prev) => prev.filter((id) => departmentNameById.has(id)));
        }
    }, [departmentNameById, selectedDepartmentIds]);

    const addCompanyScopes = () => {
        if (selectedCompanyIds.length === 0) {
            notify.warning("Vui lòng chọn công ty");
            return;
        }

        setDraftScopes((prev) => {
            const existing = new Set(prev.map((s) => `${s.scopeType}:${s.company?.id ?? ""}:${s.department?.id ?? ""}`));
            const next = [...prev];

            selectedCompanyIds.forEach((companyId) => {
                const key = `COMPANY:${companyId}:`;
                if (!existing.has(key)) {
                    next.push({
                        scopeType: "COMPANY",
                        company: { id: companyId, name: companyNameById.get(companyId) ?? "" },
                        active: true,
                    });
                }
            });

            return next;
        });
        setSelectedCompanyIds([]);
    };

    const addDepartmentScopes = () => {
        if (!selectedCompanyId) {
            notify.warning("Vui lòng chọn công ty");
            return;
        }
        if (selectedDepartmentIds.length === 0) {
            notify.warning("Vui lòng chọn phòng ban");
            return;
        }

        setDraftScopes((prev) => {
            const existing = new Set(prev.map((s) => `${s.scopeType}:${s.company?.id ?? ""}:${s.department?.id ?? ""}`));
            const next = [...prev];

            selectedDepartmentIds.forEach((departmentId) => {
                const key = `DEPARTMENT:${selectedCompanyId}:${departmentId}`;
                if (!existing.has(key)) {
                    next.push({
                        scopeType: "DEPARTMENT",
                        company: { id: selectedCompanyId, name: companyNameById.get(selectedCompanyId) ?? "" },
                        department: { id: departmentId, name: departmentNameById.get(departmentId) ?? "" },
                        active: true,
                    });
                }
            });

            return next;
        });
        setSelectedDepartmentIds([]);
    };

    const removeScope = (record: IUserAdminScope) => {
        setDraftScopes((prev) => prev.filter((item) => {
            const sameType = item.scopeType === record.scopeType;
            const sameCompany = item.company?.id === record.company?.id;
            const sameDepartment = (item.department?.id ?? null) === (record.department?.id ?? null);
            return !(sameType && sameCompany && sameDepartment);
        }));
    };

    const handleSave = () => {
        if (!activeUserId) {
            notify.warning("Vui lòng lưu thông tin tài khoản trước khi gán phạm vi quản trị");
            return;
        }

        const scopes: IReqUserAdminScopeItem[] = draftScopes
            .filter((scope) => scope.scopeType === mode)
            .map((scope) => ({
                scopeType: mode,
                companyId: Number(scope.company?.id),
                ...(mode === "DEPARTMENT" ? { departmentId: Number(scope.department?.id) } : {}),
            }))
            .filter((scope) => Boolean(scope.companyId) && (mode === "COMPANY" || Boolean(scope.departmentId)));

        updateScopes({ scopes });
    };

    const columns = [
        {
            title: "Loại",
            width: 120,
            render: (_: any, record: IUserAdminScope) => (
                <Tag color={record.scopeType === "COMPANY" ? "blue" : "green"}>
                    {record.scopeType === "COMPANY" ? "Công ty" : "Phòng ban"}
                </Tag>
            ),
        },
        {
            title: "Công ty",
            render: (_: any, record: IUserAdminScope) => (
                <Text style={{ fontSize: 13 }}>{record.company?.name ?? "--"}</Text>
            ),
        },
        {
            title: "Phòng ban",
            render: (_: any, record: IUserAdminScope) => (
                <Text style={{ fontSize: 13, color: record.department?.name ? "#111827" : "#9ca3af" }}>
                    {record.department?.name ?? "--"}
                </Text>
            ),
        },
        {
            title: "",
            width: 44,
            render: (_: any, record: IUserAdminScope) => (
                <Popconfirm
                    title="Xóa phạm vi này?"
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true, size: "small" }}
                    onConfirm={() => removeScope(record)}
                >
                    <Button danger size="small" type="text" icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    if (!activeUserId) {
        return (
            <div style={{
                border: `1.5px dashed ${BORDER}`,
                borderRadius: 10,
                padding: 18,
                textAlign: "center",
                color: "#9ca3af",
                background: "#fafafa",
            }}>
                Vui lòng lưu thông tin tài khoản trước khi gán phạm vi quản trị.
            </div>
        );
    }

    return (
        <div style={{
            border: `1.5px solid ${BORDER}`,
            borderRadius: 10,
            padding: 16,
            background: "#fff",
        }}>
            <div style={{ marginBottom: 14 }}>
                <Text strong style={{ display: "block", fontSize: 14, color: "#111827" }}>
                    Phạm vi quản trị
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    {mode === "COMPANY"
                        ? "Admin Sub 2 được gán một hoặc nhiều công ty theo quyền của người thao tác."
                        : "Trưởng bộ phận có thể quản lý một hoặc nhiều phòng ban trong công ty được chọn."}
                </Text>
            </div>

            {mode === "DEPARTMENT" && companyOptions.length === 0 && (
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 14 }}
                    message="Hãy gán chức danh trước khi chọn phạm vi quản trị."
                />
            )}

            {mode === "COMPANY" ? (
                <Space.Compact style={{ width: "100%", marginBottom: 14 }}>
                    <Select
                        mode="multiple"
                        allowClear
                        showSearch
                        maxTagCount="responsive"
                        loading={loadingCompanies}
                        placeholder="Chọn công ty"
                        options={companyOptions}
                        popupMatchSelectWidth={SELECT_POPUP_WIDTH}
                        optionRender={renderFullOption}
                        value={selectedCompanyIds}
                        onChange={setSelectedCompanyIds}
                        style={{ width: "100%" }}
                        suffixIcon={<BankOutlined />}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={addCompanyScopes}
                        style={{ background: ACCENT, borderColor: ACCENT }}
                    >
                        Thêm
                    </Button>
                </Space.Compact>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                    <Select
                        allowClear
                        showSearch
                        loading={loadingPositions}
                        placeholder="Chọn công ty"
                        options={companyOptions}
                        popupMatchSelectWidth={SELECT_POPUP_WIDTH}
                        optionRender={renderFullOption}
                        value={selectedCompanyId ?? undefined}
                        onChange={(value) => setSelectedCompanyId(value ?? null)}
                        style={{ width: "100%" }}
                        suffixIcon={<BankOutlined />}
                    />
                    <Space.Compact style={{ width: "100%" }}>
                        <Select
                            mode="multiple"
                            allowClear
                            showSearch
                            maxTagCount="responsive"
                            loading={loadingDepartments}
                            disabled={!selectedCompanyId}
                            placeholder="Chọn phòng ban"
                            options={departmentOptions}
                            popupMatchSelectWidth={SELECT_POPUP_WIDTH}
                            optionRender={renderFullOption}
                            value={selectedDepartmentIds}
                            onChange={setSelectedDepartmentIds}
                            style={{ width: "100%" }}
                            suffixIcon={<TeamOutlined />}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={addDepartmentScopes}
                            style={{ background: ACCENT, borderColor: ACCENT }}
                        >
                            Thêm
                        </Button>
                    </Space.Compact>
                </div>
            )}

            <Table
                size="small"
                rowKey={(record) => `${record.scopeType}-${record.company?.id}-${record.department?.id ?? "all"}`}
                loading={isLoading}
                columns={columns}
                dataSource={draftScopes.filter((scope) => scope.scopeType === mode)}
                pagination={false}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phạm vi" /> }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={isSaving}
                    onClick={handleSave}
                    style={{ background: ACCENT, borderColor: ACCENT, fontWeight: 600 }}
                >
                    Lưu phạm vi
                </Button>
            </div>
        </div>
    );
};

export default UserAdminScopeForm;
