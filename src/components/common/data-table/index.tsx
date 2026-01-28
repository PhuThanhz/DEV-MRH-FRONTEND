import type { ParamsType, ProTableProps } from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";
import vi_VN from "antd/locale/vi_VN";
import { ConfigProvider } from "antd";

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
}: ProTableProps<T, U, ValueType>) => {
    return (
        <ConfigProvider locale={vi_VN}>
            <div className="datatable-wrapper">
                <ProTable<T, U, ValueType>
                    columns={columns}
                    defaultData={defaultData}
                    dataSource={dataSource}
                    postData={postData}
                    pagination={{
                        showQuickJumper: true,
                        showSizeChanger: true,
                        ...pagination,
                    }}
                    bordered
                    loading={loading}
                    rowKey={rowKey}
                    scroll={
                        scroll ?? {
                            x: "max-content",
                        }
                    }
                    params={params}
                    request={request}
                    search={false}
                    polling={polling}
                    toolBarRender={toolBarRender}
                    headerTitle={headerTitle}
                    actionRef={actionRef}
                    dateFormatter={dateFormatter}
                    rowSelection={rowSelection}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 64 }}
                    options={false}
                    className="custom-pro-table no-scrollbar"
                />
            </div>
        </ConfigProvider>
    );
};

export default DataTable;
