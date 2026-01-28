import { adminBreadcrumb } from "./admin.breadcrumb";
import { clientBreadcrumb } from "./client.breadcrumb";

export const breadcrumbNameMap: Record<string, string> = {
    ...adminBreadcrumb,
    ...clientBreadcrumb,
};
