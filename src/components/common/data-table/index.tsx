import type { ParamsType, ProTableProps } from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";
import vi_VN from "antd/locale/vi_VN";
import { ConfigProvider } from "antd";
import { TABLE_SCROLL_X } from "@/utils/responsive";
import { TABLE_STICKY } from "./TableScrollbarController";

const DATA_TABLE_STYLE = { width: "100%" } as const;

const DataTable = <
    T extends Record<string, any>,
    U extends ParamsType = ParamsType,
    ValueType = "text"
>({
    columns,
    defaultData = [],
    dataSource,
    postData,
    pagination,
    loading,
    rowKey = (record) => record.id,
    scroll,
    params,
    request,
    search = false,
    polling,
    toolBarRender,
    headerTitle,
    actionRef,
    dateFormatter = "string",
    rowSelection,
    onChange,
    sticky = TABLE_STICKY,
}: ProTableProps<T, U, ValueType>) => {
    return (
        <ConfigProvider locale={vi_VN}>
            <div className="datatable-wrapper w-full">
                <ProTable<T, U, ValueType>
                    columns={columns}
                    defaultData={defaultData}
                    dataSource={dataSource}
                    postData={postData}
                    pagination={{
                        showQuickJumper: true,
                        showSizeChanger: { showSearch: false },
                        showTitle: false,
                        ...pagination,
                    }}
                    bordered
                    loading={loading}
                    rowKey={rowKey}
                    scroll={scroll ?? TABLE_SCROLL_X}
                    params={params}
                    request={request} search={false}
                    polling={polling}
                    toolBarRender={toolBarRender}
                    headerTitle={headerTitle}
                    actionRef={actionRef}
                    dateFormatter={dateFormatter}
                    rowSelection={rowSelection}
                    onChange={onChange}
                    tableLayout="auto"
                    sticky={sticky}
                    options={false}
                    size="small" // ✅ bảng gọn hơn → nhìn rộng hơn
                    style={DATA_TABLE_STYLE} // ✅ full width
                    className="custom-pro-table"
                />
            </div>
        </ConfigProvider>
    );
};

export default DataTable;
