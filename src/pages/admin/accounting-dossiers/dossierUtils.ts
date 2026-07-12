import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type {
    IAccountingDossierRequest,
    AccountingDossierCategoryMode,
    AccountingDossierDocumentType,
    IAccountingDocumentCategory
} from "@/types/backend";

export type DossierFormValues = {
    content: string;
    categoryMode: AccountingDossierCategoryMode;
    dossierCategoryId?: number;
    customCategoryName?: string;
    syncCategoryRequested?: boolean;
    companyId: number;
    departmentId: number;
    sectionId?: number;
    documents?: Array<{
        accountingCategoryId: number;
        documentName: string;
        documentType?: AccountingDossierDocumentType;
        fileUrl?: string;
        externalLink?: string;
        invoiceDate?: Dayjs;
        invoiceNumber?: string;
        invoiceContent?: string;
        partnerName?: string;
        partnerType?: "SUPPLIER" | "CUSTOMER" | "OTHER";
        amount?: number;
        currency?: string;
    }>;
};

export type SubmitApprovalStep = {
    stepKey?: string;
    stepOrder: number;
    stepName: string;
    approverType: "DEPARTMENT_MANAGER" | "ACCOUNTANT" | "CHIEF_ACCOUNTANT" | "DIRECTOR" | "CUSTOM" | "USER_SELECTABLE";
    approverUserId?: string;
    approverStrategy?: string;
    required?: boolean;
    slaMinutes?: number;
    assigneeLabel?: string;
};

export type TemplateFormValues = {
    categoryCode?: string;
    categoryName: string;
    description?: string;
    scope: "GLOBAL" | "COMPANY";
    companyId?: number;
    active?: boolean;
    documentCategoryIds?: number[];
    documentCategoryItems?: Array<{
        documentCategoryId: number;
        required?: boolean;
    }>;
};

export const buildPayload = (values: DossierFormValues): IAccountingDossierRequest => ({
    content: values.content?.trim(),
    categoryMode: values.categoryMode,
    dossierCategoryId: values.categoryMode === "TEMPLATE" ? values.dossierCategoryId : undefined,
    customCategoryName:
        values.categoryMode === "UNSTRUCTURED"
            ? values.customCategoryName?.trim()
            : undefined,
    syncCategoryRequested:
        values.categoryMode === "UNSTRUCTURED"
            ? !!values.syncCategoryRequested
            : false,
    companyId: values.companyId,
    departmentId: values.departmentId,
    sectionId: values.sectionId,
});

export const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    return dayjs(value).format("DD/MM/YYYY HH:mm");
};

export const splitFileUrls = (value?: string) =>
    value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];

export const getFileDisplayName = (value?: string) => {
    if (!value) return "";
    const cleanValue = value.split("?")[0];
    return cleanValue.split("/").filter(Boolean).pop() || value;
};

export const inferDocumentNameFromFile = (fileName?: string) => {
    const displayName = getFileDisplayName(fileName);
    return displayName.replace(/\.[^.]+$/, "") || displayName;
};

export const normalizeSearchText = (value?: string) =>
    value
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() ?? "";

export const isInvoiceCategory = (category?: IAccountingDocumentCategory) => {
    const searchText = normalizeSearchText([
        category?.categoryName,
        category?.categoryCode,
        category?.symbol,
    ].filter(Boolean).join(" "));
    return searchText.includes("hoa don") || searchText.includes("invoice");
};
