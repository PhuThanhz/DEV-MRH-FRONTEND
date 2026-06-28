import {
    BellOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
    TeamOutlined,
    BankOutlined,
    EditOutlined,
    StopOutlined,
    PlusOutlined,
    AimOutlined,
} from "@ant-design/icons";
import { ALL_PERMISSIONS } from "@/config/permissions";
import type React from "react";
import { CRUD_ACTION_GUIDES } from "./crudActionGuides";

export type LotusGuideStep = {
    id: string;
    targetId: string;
    title: string;
    description: string;
    placement?: "top" | "right" | "bottom" | "left";
    actionType?: "click" | "none";
};

export type LotusGuide = {
    id: string;
    title: string;
    description: string;
    module: string;
    subModule?: string;
    routePrefix: string; // Used for force navigation
    exactRoute?: boolean;
    routePattern?: RegExp; // Used to match current page strictly
    allowedRoutes?: RegExp[]; // Guide stays alive when navigating to these routes mid-flow
    requiredPermission?: {
        apiPath: string;
        method: string;
        module?: string;
    };
    icon: React.ReactNode;
    steps: LotusGuideStep[];
};

export const LOTUS_GUIDES: LotusGuide[] = [
    {
        id: "create-department",
        title: "Tạo phòng ban mới",
        description: "Chỉ từng bước để bắt đầu tạo một phòng ban trong hệ thống.",
        module: "Cấu trúc tổ chức",
        subModule: "Quản lý chung",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <FolderOpenOutlined />,
        steps: [
            {
                id: "department-search",
                targetId: "department-search-input",
                title: "Bước 1: Kiểm tra phòng ban đã có chưa",
                description: "Bạn có thể tìm theo mã hoặc tên phòng ban trước khi tạo mới để tránh trùng dữ liệu.",
            },
            {
                id: "department-add",
                targetId: "department-add-button",
                title: "Bước 2: Mở form tạo phòng ban",
                description: "Nhấn VÀO NÚT NÀY để mở form tạo phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-add-form",
                targetId: ".department-form-modal .ant-modal-content",
                title: "Bước 3: Điền thông tin",
                description: "Nhập các thông tin cần thiết vào form này, sau đó nhấn nút Lưu lại để hoàn tất.",
                placement: "right",
            },
        ],
    },
    {
        id: "create-employee",
        title: "Thêm nhân viên mới",
        description: "Hướng dẫn mở form thêm nhân viên và tìm hồ sơ nhân sự.",
        module: "Nhân sự",
        subModule: "Quản lý chung",
        routePrefix: "/admin/employees",
        exactRoute: true,
        icon: <TeamOutlined />,
        steps: [
            {
                id: "employee-search",
                targetId: "employee-search-input",
                title: "Bước 1: Tìm nhân viên",
                description: "Tìm theo tên, email hoặc mã nhân viên để kiểm tra hồ sơ đã tồn tại chưa.",
            },
            {
                id: "employee-add",
                targetId: "employee-add-button",
                title: "Bước 2: Thêm nhân viên",
                description: "Nhấn VÀO NÚT NÀY để mở form thêm nhân viên mới.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "employee-add-form",
                targetId: ".employee-modal .ant-modal-content",
                title: "Bước 3: Điền thông tin",
                description: "Nhập thông tin nhân viên vào form này, sau đó nhấn nút lưu để hoàn tất.",
                placement: "right",
            },
        ],
    },
    {
        id: "create-document",
        title: "Thêm văn bản",
        description: "Hướng dẫn tạo văn bản và tải file đính kèm vào kho nội bộ.",
        module: "Tài liệu",
        subModule: "Quản lý chung",
        routePrefix: "/admin/documents",
        exactRoute: true,
        icon: <FileTextOutlined />,
        steps: [
            {
                id: "document-search",
                targetId: "document-search-input",
                title: "Bước 1: Tìm văn bản",
                description: "Tìm theo mã hoặc tên văn bản trước khi tạo mới để tránh nhập trùng.",
            },
            {
                id: "document-add",
                targetId: "document-add-button",
                title: "Bước 2: Mở form thêm văn bản",
                description: "Nhấn VÀO NÚT NÀY để tạo văn bản mới.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "document-add-form",
                targetId: ".document-form-modal .ant-modal-content",
                title: "Bước 3: Điền thông tin",
                description: "Nhập thông tin văn bản và tải file đính kèm nếu cần, sau đó lưu lại để hoàn tất.",
                placement: "right",
            },
        ],
    },
    {
        id: "notification-center",
        title: "Xử lý thông báo",
        description: "Xem tác vụ chờ, thông báo mới và đánh dấu đã xử lý.",
        module: "Thông báo",
        subModule: "Quản lý chung",
        routePrefix: "/admin",
        icon: <BellOutlined />,
        steps: [
            {
                id: "notification-bell",
                targetId: "notification-bell",
                title: "Bước 1: Mở trung tâm thông báo",
                description: "Nhấn VÀO CHUÔNG này để xem thông báo mới.",
                placement: "bottom",
                actionType: "click",
            },
        ],
    },
    {
        id: "company-list-view",
        title: "Quản lý công ty",
        description: "Hướng dẫn tìm kiếm và thêm mới công ty.",
        module: "Công ty",
        subModule: "Quản lý chung",
        routePrefix: "/admin/company",
        exactRoute: true,
        icon: <BankOutlined />,
        steps: [
            {
                id: "company-search",
                targetId: "company-search-input",
                title: "Bước 1: Tìm kiếm công ty",
                description: "Nhập tên công ty để tìm kiếm nhanh trong danh sách.",
                placement: "bottom",
            },
            {
                id: "company-add",
                targetId: "company-add-button",
                title: "Bước 2: Mở form thêm công ty",
                description: "Nhấn VÀO NÚT NÀY để mở form tạo mới công ty.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "company-add-form",
                targetId: ".company-form-modal .ant-modal-content",
                title: "Bước 3: Điền thông tin",
                description: "Nhập các thông tin cần thiết vào form này, sau đó nhấn nút Tạo mới để hoàn tất.",
                placement: "right",
            },
        ],
    },
    {
        id: "company-detail-view",
        title: "Xem chi tiết công ty",
        description: "Hướng dẫn xem thông tin chi tiết của một công ty.",
        module: "Công ty",
        subModule: "Quản lý chung",
        routePrefix: "/admin/company",
        exactRoute: true,
        icon: <BankOutlined />,
        steps: [
            {
                id: "company-detail",
                targetId: "company-detail-button",
                title: "Bước 1: Chọn xem chi tiết",
                description: "Nhấn VÀO BIỂU TƯỢNG CON MẮT để xem toàn bộ thông tin của công ty này.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "company-detail-info",
                targetId: ".detail-modal-shared--company .ant-modal-content",
                title: "Bước 2: Xem thông tin chung",
                description: "Tại đây bạn có thể xem lại mã công ty, tên đầy đủ và tên tiếng Anh (nếu có).",
                placement: "right",
            },
        ],
    },
    {
        id: "company-org-chart-view",
        title: "Xem sơ đồ tổ chức công ty",
        description: "Hướng dẫn cách mở sơ đồ tổ chức của công ty.",
        module: "Công ty",
        subModule: "Sơ đồ & Tổ chức",
        routePrefix: "/admin/company",
        exactRoute: true,
        icon: <BankOutlined />,
        steps: [
            {
                id: "company-more",
                targetId: "company-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn VÀO NÚT BA CHẤM này để xem thêm các chức năng khác.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "company-org-chart",
                targetId: ".guide-company-org-chart",
                title: "Bước 2: Xem sơ đồ tổ chức",
                description: "Chọn mục Sơ đồ tổ chức để xem cấu trúc các phòng ban và nhân sự.",
                placement: "left",
            },
        ],
    },
    {
        id: "company-edit-view",
        title: "Chỉnh sửa công ty",
        description: "Hướng dẫn cách cập nhật thông tin công ty.",
        module: "Công ty",
        subModule: "Quản lý chung",
        routePrefix: "/admin/company",
        exactRoute: true,
        icon: <EditOutlined />,
        steps: [
            {
                id: "company-edit-step-1",
                targetId: "company-edit-button",
                title: "Bước 1: Chọn Chỉnh sửa",
                description: "Nhấn vào biểu tượng cây bút để mở form chỉnh sửa thông tin công ty.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "company-edit-step-2",
                targetId: ".company-form-modal .ant-modal-content",
                title: "Bước 2: Cập nhật thông tin",
                description: "Chỉnh sửa các thông tin cần thiết và nhấn Lưu lại để hoàn tất.",
                placement: "right",
            },
        ],
    },
    {
        id: "company-status-view",
        title: "Vô hiệu hóa / Kích hoạt",
        description: "Hướng dẫn thay đổi trạng thái hoạt động của công ty.",
        module: "Công ty",
        subModule: "Trạng thái",
        routePrefix: "/admin/company",
        exactRoute: true,
        icon: <StopOutlined />,
        steps: [
            {
                id: "company-status-step-1",
                targetId: "company-more-button",
                title: "Bước 1: Mở menu tính năng",
                description: "Nhấn vào biểu tượng 3 chấm để hiển thị thêm các tùy chọn.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "company-status-step-2",
                targetId: ".guide-company-status-action",
                title: "Bước 2: Chọn thay đổi trạng thái",
                description: "Nhấn Vô hiệu hóa (hoặc Kích hoạt) và xác nhận để thay đổi trạng thái của công ty.",
                placement: "left",
            },
        ],
    },
    {
        id: "company-org-chart-edit-view",
        title: "Thêm vị trí sơ đồ công ty",
        description: "Hướng dẫn từng bước vào sơ đồ tổ chức và thêm mới một vị trí.",
        module: "Công ty",
        subModule: "Sơ đồ & Tổ chức",
        routePrefix: "/admin/company",
        exactRoute: true,
        allowedRoutes: [/^\/admin\/companies\/[^/]+\/org-chart/],
        icon: <PlusOutlined />,
        steps: [
            {
                id: "company-org-chart-edit-step-1",
                targetId: "company-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn vào biểu tượng 3 chấm của một công ty để xem các tùy chọn.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "company-org-chart-edit-step-2",
                targetId: ".guide-company-org-chart",
                title: "Bước 2: Vào sơ đồ tổ chức",
                description: "Chọn 'Sơ đồ tổ chức' để vào trang quản lý sơ đồ của công ty.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "company-org-chart-edit-step-3",
                targetId: "org-chart-add-button",
                title: "Bước 3: Nhấn Thêm vị trí",
                description: "Nhấn nút 'Thêm vị trí' trên thanh công cụ để mở form tạo mới.",
                placement: "bottom",
                actionType: "click",
            },
            {
                id: "company-org-chart-edit-step-4",
                targetId: ".org-node-form-modal .ant-modal-content",
                title: "Bước 4: Điền thông tin vị trí",
                description: "Nhập tên phòng ban hoặc vị trí mới và nhấn Tạo để hoàn tất.",
                placement: "left",
            },
        ],
    },
    {
        id: "company-org-chart-add-node",
        title: "Thêm vị trí vào sơ đồ",
        description: "Hướng dẫn thêm mới một phòng ban hoặc vị trí trong sơ đồ tổ chức công ty.",
        module: "Công ty",
        subModule: "Sơ đồ & Tổ chức",
        routePrefix: "/admin/companies",
        exactRoute: false,
        routePattern: /^\/admin\/companies\/[^/]+\/org-chart/,
        icon: <PlusOutlined />,
        steps: [
            {
                id: "company-org-chart-add-node-step-1",
                targetId: "org-chart-add-button",
                title: "Bước 1: Nhấn Thêm vị trí",
                description: "Nhấn nút 'Thêm vị trí' trên thanh công cụ để mở form tạo mới.",
                placement: "bottom",
                actionType: "click",
            },
            {
                id: "company-org-chart-add-node-step-2",
                targetId: ".org-node-form-modal .ant-modal-content",
                title: "Bước 2: Điền thông tin vị trí",
                description: "Nhập tên phòng ban hoặc vị trí mới và nhấn Tạo để hoàn tất.",
                placement: "left",
            },
        ],
    },
    {
        id: "department-list-view",
        title: "Quản lý phòng ban",
        description: "Hướng dẫn tìm kiếm và thêm mới phòng ban.",
        module: "Phòng ban",
        subModule: "Quản lý chung",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <FolderOpenOutlined />,
        steps: [
            {
                id: "department-search",
                targetId: "department-search-input",
                title: "Bước 1: Tìm kiếm phòng ban",
                description: "Nhập mã hoặc tên phòng ban để tìm kiếm nhanh trong danh sách.",
                placement: "bottom",
            },
            {
                id: "department-add",
                targetId: "department-add-button",
                title: "Bước 2: Mở form thêm phòng ban",
                description: "Nhấn VÀO NÚT NÀY để mở form tạo mới phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-add-form",
                targetId: ".department-form-modal .ant-modal-content",
                title: "Bước 3: Điền thông tin",
                description: "Nhập các thông tin cần thiết vào form này, sau đó nhấn nút Lưu lại để hoàn tất.",
                placement: "right",
            },
        ],
    },
    {
        id: "department-detail-view",
        title: "Xem chi tiết phòng ban",
        description: "Hướng dẫn xem thông tin chi tiết của một phòng ban.",
        module: "Phòng ban",
        subModule: "Quản lý chung",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <FolderOpenOutlined />,
        steps: [
            {
                id: "department-detail",
                targetId: "department-detail-button",
                title: "Bước 1: Chọn xem chi tiết",
                description: "Nhấn VÀO BIỂU TƯỢNG CON MẮT để xem toàn bộ thông tin của phòng ban này.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-detail-info",
                targetId: ".detail-modal-shared--department .ant-modal-content",
                title: "Bước 2: Xem thông tin chung",
                description: "Tại đây bạn có thể xem lại mã phòng ban, tên và các thông tin trực thuộc.",
                placement: "right",
            },
        ],
    },
    {
        id: "department-edit-view",
        title: "Chỉnh sửa phòng ban",
        description: "Hướng dẫn cách cập nhật thông tin phòng ban.",
        module: "Phòng ban",
        subModule: "Quản lý chung",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <EditOutlined />,
        steps: [
            {
                id: "department-edit-step-1",
                targetId: "department-edit-button",
                title: "Bước 1: Chọn Chỉnh sửa",
                description: "Nhấn vào biểu tượng cây bút để mở form chỉnh sửa thông tin phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-edit-step-2",
                targetId: ".department-form-modal .ant-modal-content",
                title: "Bước 2: Cập nhật thông tin",
                description: "Chỉnh sửa các thông tin cần thiết và nhấn Lưu lại để hoàn tất.",
                placement: "right",
            },
        ],
    },
    {
        id: "department-org-chart-edit-view",
        title: "Thêm vị trí sơ đồ phòng ban",
        description: "Hướng dẫn từng bước vào sơ đồ tổ chức và thêm mới một vị trí trong phòng ban.",
        module: "Phòng ban",
        subModule: "Sơ đồ & Tổ chức",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        allowedRoutes: [/^\/admin\/departments\/[^/]+\/org-chart/],
        icon: <PlusOutlined />,
        steps: [
            {
                id: "department-org-chart-edit-step-1",
                targetId: "department-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn vào biểu tượng 3 chấm của một phòng ban để xem các tùy chọn. (Cần có ít nhất 1 phòng ban trong danh sách)",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-org-chart-edit-step-2",
                targetId: ".guide-department-org-chart",
                title: "Bước 2: Vào sơ đồ tổ chức",
                description: "Chọn 'Sơ đồ tổ chức' để vào trang quản lý sơ đồ của phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-org-chart-edit-step-3",
                targetId: "org-chart-add-button",
                title: "Bước 3: Nhấn Thêm vị trí",
                description: "Nhấn nút 'Thêm vị trí' trên thanh công cụ để mở form tạo mới.",
                placement: "bottom",
                actionType: "click",
            },
            {
                id: "department-org-chart-edit-step-4",
                targetId: ".org-node-form-modal .ant-modal-content",
                title: "Bước 4: Điền thông tin vị trí",
                description: "Nhập tên vị trí mới và nhấn Tạo để hoàn tất.",
                placement: "left",
            },
        ],
    },
    {
        id: "department-org-chart-add-node",
        title: "Thêm vị trí vào sơ đồ phòng ban",
        description: "Hướng dẫn thêm mới một vị trí trong sơ đồ tổ chức phòng ban.",
        module: "Phòng ban",
        subModule: "Sơ đồ & Tổ chức",
        routePrefix: "/admin/departments",
        exactRoute: false,
        routePattern: /^\/admin\/departments\/[^/]+\/org-chart/,
        icon: <PlusOutlined />,
        steps: [
            {
                id: "department-org-chart-add-node-step-1",
                targetId: "org-chart-add-button",
                title: "Bước 1: Nhấn Thêm vị trí",
                description: "Nhấn nút 'Thêm vị trí' trên thanh công cụ để mở form tạo mới.",
                placement: "bottom",
                actionType: "click",
            },
            {
                id: "department-org-chart-add-node-step-2",
                targetId: ".org-node-form-modal .ant-modal-content",
                title: "Bước 2: Điền thông tin vị trí",
                description: "Nhập tên vị trí mới và nhấn Tạo để hoàn tất.",
                placement: "left",
            },
        ],
    },
    {
        id: "department-objectives-view",
        title: "Xem mục tiêu & nhiệm vụ",
        description: "Hướng dẫn xem mục tiêu/nhiệm vụ của phòng ban.",
        module: "Phòng ban",
        subModule: "Mục tiêu (OKRs)",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        requiredPermission: ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.VIEW,
        icon: <AimOutlined />,
        steps: [
            {
                id: "department-objectives-step-1",
                targetId: "department-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn vào biểu tượng 3 chấm để xem các cấu hình con. (Lưu ý: Phải có ít nhất 1 phòng ban để thực hiện)",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-objectives-step-2",
                targetId: ".guide-department-objectives",
                title: "Bước 2: Chọn Mục tiêu",
                description: "Chọn mục 'Mục tiêu - Nhiệm vụ' để truy cập vào phân hệ OKRs của phòng ban.",
                placement: "left",
            },
        ],
    },
    {
        id: "department-objectives-edit-view",
        title: "Quản lý mục tiêu - nhiệm vụ",
        description: "Hướng dẫn chi tiết cách thêm/sửa mục tiêu và nhiệm vụ tại trang này.",
        module: "Phòng ban",
        subModule: "Mục tiêu (OKRs)",
        routePrefix: "/admin/departments",
        exactRoute: false,
        routePattern: /^\/admin\/departments\/\d+\/objectives-tasks/,
        requiredPermission: ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.CREATE,
        icon: <EditOutlined />,
        steps: [
            {
                id: "department-objectives-edit-step-3",
                targetId: "department-objectives-edit-btn",
                title: "Bước 1: Bật chế độ chỉnh sửa",
                description: "Nhấn vào nút 'Chỉnh sửa' ở góc trên để bắt đầu thay đổi dữ liệu.",
                placement: "bottom",
                actionType: "click",
            },
            {
                id: "department-objectives-edit-step-4",
                targetId: "department-objectives-add-obj-btn",
                title: "Bước 2: Thêm mục tiêu",
                description: "Nhấn vào nút này để thêm một dòng mục tiêu mới. Bạn có thể nhập trực tiếp nội dung vào dòng vừa tạo.",
                placement: "top",
                actionType: "click",
            },
            {
                id: "department-objectives-edit-step-5",
                targetId: "department-objectives-save-btn",
                title: "Bước 3: Lưu thay đổi",
                description: "Sau khi đã thêm và nhập nội dung xong, hãy nhớ nhấn 'Lưu thay đổi' để hệ thống ghi nhận nhé!",
                placement: "bottom",
            },
        ],
    },
    {
        id: "department-job-title-view",
        title: "Cấu hình chức danh",
        description: "Hướng dẫn thiết lập các chức danh thuộc phòng ban.",
        module: "Phòng ban",
        subModule: "Sơ đồ & Tổ chức",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <FolderOpenOutlined />,
        steps: [
            {
                id: "department-job-title-step-1",
                targetId: "department-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn vào biểu tượng 3 chấm của một phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-job-title-step-2",
                targetId: ".guide-department-job-title",
                title: "Bước 2: Chọn Cấu hình chức danh",
                description: "Nhấn vào đây để quản lý danh sách chức danh của phòng ban.",
                placement: "left",
            },
        ],
    },
    {
        id: "department-procedures-view",
        title: "Quy trình phòng ban",
        description: "Hướng dẫn xem và thiết lập quy trình làm việc.",
        module: "Phòng ban",
        subModule: "Quy trình & Phân quyền",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <FolderOpenOutlined />,
        steps: [
            {
                id: "department-procedures-step-1",
                targetId: "department-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn vào biểu tượng 3 chấm của một phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-procedures-step-2",
                targetId: ".guide-department-procedures",
                title: "Bước 2: Chọn Quy trình",
                description: "Nhấn vào đây để xem các quy trình làm việc của phòng ban.",
                placement: "left",
            },
        ],
    },
    {
        id: "department-permissions-view",
        title: "Phân quyền phòng ban",
        description: "Hướng dẫn xem ma trận phân quyền của phòng ban.",
        module: "Phòng ban",
        subModule: "Quy trình & Phân quyền",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <FolderOpenOutlined />,
        steps: [
            {
                id: "department-permissions-step-1",
                targetId: "department-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn vào biểu tượng 3 chấm của một phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-permissions-step-2",
                targetId: ".guide-department-permissions",
                title: "Bước 2: Chọn Phân quyền",
                description: "Nhấn vào đây để mở modal phân quyền và thiết lập quyền hạn.",
                placement: "left",
            },
        ],
    },
    {
        id: "department-career-paths-view",
        title: "Lộ trình thăng tiến",
        description: "Xem và thiết lập lộ trình thăng tiến cho nhân sự.",
        module: "Phòng ban",
        subModule: "Đãi ngộ & Lộ trình",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <FolderOpenOutlined />,
        steps: [
            {
                id: "department-career-paths-step-1",
                targetId: "department-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn vào biểu tượng 3 chấm của một phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-career-paths-step-2",
                targetId: ".guide-department-career-paths",
                title: "Bước 2: Chọn Lộ trình thăng tiến",
                description: "Nhấn vào đây để xem các nấc thang phát triển sự nghiệp.",
                placement: "left",
            },
        ],
    },
    {
        id: "department-salary-view",
        title: "Khung lương phòng ban",
        description: "Xem thiết lập khung lương cho các vị trí trong phòng.",
        module: "Phòng ban",
        subModule: "Đãi ngộ & Lộ trình",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <FolderOpenOutlined />,
        steps: [
            {
                id: "department-salary-step-1",
                targetId: "department-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn vào biểu tượng 3 chấm của một phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-salary-step-2",
                targetId: ".guide-department-salary",
                title: "Bước 2: Chọn Khung lương",
                description: "Nhấn vào đây để vào giao diện quản lý ngạch/bậc lương.",
                placement: "left",
            },
        ],
    },
    {
        id: "department-position-chart-view",
        title: "Bản đồ chức danh",
        description: "Xem sơ đồ trực quan các chức danh trong phòng ban.",
        module: "Phòng ban",
        subModule: "Sơ đồ & Tổ chức",
        routePrefix: "/admin/departments",
        exactRoute: true,
        routePattern: /^\/admin\/departments$/,
        icon: <FolderOpenOutlined />,
        steps: [
            {
                id: "department-position-chart-step-1",
                targetId: "department-more-button",
                title: "Bước 1: Mở menu tùy chọn",
                description: "Nhấn vào biểu tượng 3 chấm của một phòng ban.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "department-position-chart-step-2",
                targetId: ".guide-department-position-chart",
                title: "Bước 2: Chọn Bản đồ chức danh",
                description: "Nhấn vào đây để xem bản đồ lưới nhân sự/chức danh.",
                placement: "left",
            },
        ],
    },
    ...CRUD_ACTION_GUIDES,
];

export const getGuidesForPath = (path: string) => {
    return LOTUS_GUIDES.filter((guide) => {
        if (guide.routePattern) {
            return guide.routePattern.test(path);
        }
        if (guide.exactRoute) {
            return path === guide.routePrefix;
        }
        return path === guide.routePrefix || path.startsWith(`${guide.routePrefix}/`);
    });
};

export const getFilteredGuidesForPath = (
    path: string,
    canStartGuide: (guide: LotusGuide) => boolean
) => getGuidesForPath(path).filter(canStartGuide);

export const findGuideById = (id: string) =>
    LOTUS_GUIDES.find((guide) => guide.id === id);
