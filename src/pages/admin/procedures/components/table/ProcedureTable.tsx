import { Button, Modal, Image } from "antd";
import { DownloadOutlined, LockOutlined } from "@ant-design/icons";
import { QrcodeOutlined, ShareAltOutlined } from "@ant-design/icons";

// ❌ bỏ import Access — không dùng nữa

import DataTable from "@/components/common/data-table";
import ModalProcedure from "../../modal.procedure";
import ModalRevise from "../modal.revise";
import ViewProcedure from "../../view.procedure";
import ModalShareToken from "../ModalShareToken";
import ModalPrintQR from "../ModalPrintQR";

import { useProcedureTable } from "./useProcedureTable";
import { buildProcedureColumns } from "./procedureColumns";
import ProcedureToolbar from "./ProcedureToolbar";
import type { IProcedure, ProcedureType } from "@/types/backend";

interface IProps {
    type: ProcedureType;
    companyId?: number;
    departmentId?: number;
}

const ProcedureTable = ({ type, companyId, departmentId }: IProps) => {
    const ctx = useProcedureTable({ type, companyId, departmentId });

    const columns = buildProcedureColumns({
        type, companyId, departmentId,
        isAdmin: ctx.isAdmin,
        canShare: ctx.canShare, // 👈 thêm
        meta: ctx.meta,
        permission: ctx.permission,
        deleteMutation: ctx.deleteMutation,
        onView: (record) => { ctx.setDataInit(record); ctx.setOpenView(true); },
        onEdit: (record) => { ctx.setDataInit(record); ctx.setOpenModal(true); },
        onRevise: (record) => { ctx.setDataInit(record); ctx.setOpenRevise(true); },
        onQrClick: (record) => { ctx.setSelectedProcedure(record); ctx.setOpenQrModal(true); },
        onShare: (record) => {
            ctx.setSelectedProcedure(record);
            ctx.setOpenShareModal(true);
        },
    });

    return (
        <>
            <ProcedureToolbar
                type={type}
                companyId={companyId}
                departmentId={departmentId}
                printMode={ctx.printMode}
                selectedCount={ctx.selectedRows.length}
                resetSignal={ctx.resetSignal}
                permission={ctx.permission}
                onSearch={ctx.setSearchValue}
                onReset={ctx.handleReset}
                onAddClick={() => { ctx.setDataInit(null); ctx.setOpenModal(true); }}
                onPrintClick={ctx.handlePrintButtonClick}
                onExitPrintMode={ctx.handleExitPrintMode}
                onFilterChange={(filters) => {
                    ctx.setCompanyIdFilter(filters.companyId ?? (companyId ?? null));
                    ctx.setDepartmentIdFilter(filters.departmentId ?? (departmentId ?? null));
                    ctx.setSectionIdFilter(filters.sectionId ?? null);
                    ctx.setStatusFilter(filters.status ?? null);
                    ctx.setPlanYearFilter(filters.planYear ?? null);
                }}
            />

            <DataTable<IProcedure>
                actionRef={ctx.tableRef}
                rowKey="id"
                loading={ctx.isFetching}
                columns={columns}
                dataSource={ctx.procedures}
                scroll={{ x: "max-content" }}
                request={async (params, sort) => {
                    const q = ctx.buildQuery(params, sort);
                    return { data: ctx.procedures, success: true, total: ctx.meta.total };
                }}
                pagination={{
                    current: ctx.meta.page,
                    pageSize: ctx.meta.pageSize,
                    total: ctx.meta.total,
                    showQuickJumper: true,
                    showTotal: (total, range) => (
                        <div style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 500 }}>{range[0]}–{range[1]}</span>{" "}
                            trên{" "}
                            <span style={{ fontWeight: 600, color: "#1677ff" }}>
                                {total.toLocaleString()}
                            </span>{" "}
                            quy trình
                        </div>
                    ),
                }}
                rowSelection={ctx.printMode ? {
                    selectedRowKeys: ctx.selectedRows.map(r => r.id!),
                    onChange: (_, rows) => ctx.setSelectedRows(rows),
                    preserveSelectedRowKeys: true,
                } : undefined}
            />

            {/* ── Modals ── */}
            <ModalProcedure
                defaultType={type}
                open={ctx.openModal}
                onClose={() => ctx.setOpenModal(false)}
                dataInit={ctx.dataInit}
                refetch={ctx.refetch}
                {...(companyId ? { fixedCompanyId: companyId } : {})}
            />
            <ModalRevise
                type={type}
                open={ctx.openRevise}
                onClose={() => ctx.setOpenRevise(false)}
                dataInit={ctx.dataInit}
                refetch={ctx.refetch}
            />
            <ViewProcedure
                type={type}
                open={ctx.openView}
                onClose={() => ctx.setOpenView(false)}
                dataInit={ctx.dataInit}
                refetch={ctx.refetch}
            />

            {/* Modal QR nội bộ */}
            <Modal
                open={ctx.openQrModal}
                onCancel={() => ctx.setOpenQrModal(false)}
                footer={null}
                closable={false}
                width={420}
                centered
                styles={{
                    content: { padding: 0, borderRadius: 28, overflow: "hidden" },
                    mask: { backdropFilter: "blur(6px)" },
                }}
            >
                {ctx.selectedProcedure && (
                    <>
                        <div style={{
                            background: "linear-gradient(135deg,#f0226e 0%,#ff5fa0 60%,#ff85bc 100%)",
                            padding: "22px 20px 26px", position: "relative",
                        }}>
                            <button
                                onClick={() => ctx.setOpenQrModal(false)}
                                style={{
                                    position: "absolute", top: 14, right: 14,
                                    width: 32, height: 32,
                                    background: "rgba(255,255,255,0.18)",
                                    border: "1.5px solid rgba(255,255,255,0.28)",
                                    borderRadius: 10, color: "rgba(255,255,255,0.9)",
                                    fontSize: 18, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    outline: "none", lineHeight: 1,
                                }}
                            >×</button>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                                <div style={{
                                    width: 52, height: 52, background: "rgba(255,255,255,0.2)",
                                    borderRadius: 14, display: "flex", alignItems: "center",
                                    justifyContent: "center", flexShrink: 0,
                                }}>
                                    <QrcodeOutlined style={{ fontSize: 26, color: "white" }} />
                                </div>
                                <div>
                                    <div style={{
                                        color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: 500,
                                        letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 3,
                                    }}>
                                        Mã QR nội bộ
                                    </div>
                                    <div style={{ color: "white", fontSize: 17, fontWeight: 500, lineHeight: 1.35 }}>
                                        {ctx.selectedProcedure.procedureName}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                background: "white", color: "#e8256b",
                                fontSize: 13, fontWeight: 600, padding: "5px 14px", borderRadius: 30,
                            }}>
                                <QrcodeOutlined style={{ fontSize: 11 }} />
                                {ctx.selectedProcedure.procedureCode}
                            </div>
                        </div>

                        <div style={{ padding: 24 }}>
                            <div style={{
                                border: "1.5px solid #ffe0ee", borderRadius: 20, padding: 20,
                                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
                            }}>
                                {ctx.selectedProcedure.qrCode ? (
                                    <Image
                                        src={`data:image/png;base64,${ctx.selectedProcedure.qrCode}`}
                                        width={190} height={190} preview={false}
                                        style={{ borderRadius: 4, display: "block" }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 190, height: 190, display: "flex",
                                        alignItems: "center", justifyContent: "center",
                                        background: "#f9fafb", borderRadius: 4, color: "#ccc", fontSize: 13,
                                    }}>Chưa có mã QR</div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                                <Button
                                    icon={<DownloadOutlined />}
                                    style={{
                                        // 👇 nếu có quyền share thì flex: 1, không thì full width
                                        flex: 1,
                                        height: 42, borderRadius: 14, fontWeight: 500,
                                        borderColor: "#fcc", color: "#e8256b",
                                    }}
                                    onClick={() => {
                                        if (!ctx.selectedProcedure?.qrCode) return;
                                        const a = document.createElement("a");
                                        a.href = `data:image/png;base64,${ctx.selectedProcedure.qrCode}`;
                                        a.download = `QR_${ctx.selectedProcedure.procedureCode}.png`;
                                        a.click();
                                    }}
                                >Tải xuống</Button>

                                {/* 👇 chỉ hiện khi có quyền, thay vì dùng <Access> */}
                                {ctx.canShare && (
                                    <Button
                                        icon={<ShareAltOutlined />}
                                        style={{
                                            flex: 1, height: 42, borderRadius: 14, fontWeight: 500,
                                            background: "linear-gradient(135deg,#f0226e,#ff5fa0)",
                                            border: "none", color: "white",
                                            boxShadow: "0 4px 14px rgba(240,34,110,0.3)",
                                        }}
                                        onClick={() => {
                                            ctx.setOpenQrModal(false);
                                            ctx.setOpenShareModal(true);
                                        }}
                                    >Chia sẻ công khai</Button>
                                )}
                            </div>

                            <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "11px 14px", background: "#fff7fa",
                                border: "1px solid #fce4ef", borderRadius: 12,
                            }}>
                                <LockOutlined style={{ fontSize: 13, color: "#e8256b", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: "#c0537a" }}>
                                    Mã QR chỉ dùng nội bộ — quét bằng ứng dụng nội bộ
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </Modal>

            <ModalShareToken
                open={ctx.openShareModal}
                onClose={() => ctx.setOpenShareModal(false)}
                procedure={ctx.selectedProcedure}
                procedureType={type}
            />
            <ModalPrintQR
                open={ctx.openPrintModal}
                onClose={() => {
                    ctx.setOpenPrintModal(false);
                    ctx.handleExitPrintMode();
                }}
                procedures={ctx.selectedRows}
            />
        </>
    );
};

export default ProcedureTable;