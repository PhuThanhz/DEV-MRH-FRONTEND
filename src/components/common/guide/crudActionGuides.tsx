import {
    AppstoreAddOutlined,
    AuditOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    FileProtectOutlined,
    FileTextOutlined,
    IdcardOutlined,
    PartitionOutlined,
    SafetyCertificateOutlined,
    SettingOutlined,
    TeamOutlined,
    UserSwitchOutlined,
} from "@ant-design/icons";
import { ALL_PERMISSIONS } from "@/config/permissions";
import type React from "react";
import type { LotusGuide } from "./guideRegistry";

type PermissionLike = {
    apiPath: string;
    method: string;
    module?: string;
};

type CrudGuideConfig = {
    key: string;
    title: string;
    module: string;
    subModule?: string;
    routePrefix: string;
    exactRoute?: boolean;
    searchTarget: string;
    addTarget?: string;
    formTarget?: string;
    detailPanelTarget?: string;
    editFormTarget?: string;
    deleteConfirmTarget?: string;
    statusConfirmTarget?: string;
    detailTarget?: string;
    editTarget?: string;
    deleteTarget?: string;
    statusTarget?: string;
    listPermission?: PermissionLike;
    createPermission?: PermissionLike;
    detailPermission?: PermissionLike;
    updatePermission?: PermissionLike;
    deletePermission?: PermissionLike;
    statusPermission?: PermissionLike;
    icon: React.ReactNode;
    createLabel?: string;
    detailLabel?: string;
    editLabel?: string;
    deleteLabel?: string;
    statusLabel?: string;
};

const guideIcon = {
    create: <AppstoreAddOutlined />,
    detail: <EyeOutlined />,
    edit: <EditOutlined />,
    delete: <DeleteOutlined />,
    status: <SafetyCertificateOutlined />,
};

const makeCreateGuide = (config: CrudGuideConfig): LotusGuide | null => {
    if (!config.addTarget || !config.formTarget || !config.createPermission) return null;
    return {
        id: `${config.key}-create-guide`,
        title: config.createLabel ?? `Thêm ${config.title.toLowerCase()}`,
        description: `Hướng dẫn tạo mới ${config.title.toLowerCase()} theo đúng luồng nghiệp vụ.`,
        module: config.module,
        subModule: config.subModule,
        routePrefix: config.routePrefix,
        exactRoute: config.exactRoute ?? true,
        requiredPermission: config.createPermission,
        icon: guideIcon.create,
        steps: [
            {
                id: `${config.key}-create-search`,
                targetId: config.searchTarget,
                title: "Bước 1: Kiểm tra dữ liệu hiện có",
                description: `Tìm theo mã, tên hoặc thông tin liên quan để xác nhận ${config.title.toLowerCase()} chưa tồn tại trước khi tạo mới.`,
            },
            {
                id: `${config.key}-create-open`,
                targetId: config.addTarget,
                title: "Bước 2: Mở form tạo mới",
                description: "Nhấn nút này để mở form nhập liệu. Hãy chuẩn bị đủ thông tin bắt buộc trước khi lưu.",
                placement: "left",
                actionType: "click",
            },
            {
                id: `${config.key}-create-form`,
                targetId: config.formTarget,
                title: "Bước 3: Nhập và lưu thông tin",
                description: "Hoàn thiện các trường bắt buộc, kiểm tra lại dữ liệu nghiệp vụ, sau đó lưu để ghi nhận vào hệ thống.",
                placement: "right",
            },
        ],
    };
};

const makeActionGuide = (
    config: CrudGuideConfig,
    action: "detail" | "edit" | "delete" | "status",
    target?: string,
    permission?: PermissionLike,
): LotusGuide | null => {
    if (!target || !permission) return null;

    const actionCopy = {
        detail: {
            title: config.detailLabel ?? `Xem chi tiết ${config.title.toLowerCase()}`,
            heading: "Bước 2: Mở hồ sơ chi tiết",
            description: "Dùng thao tác này để kiểm tra đầy đủ thông tin, lịch sử hoặc dữ liệu liên kết trước khi xử lý tiếp.",
        },
        edit: {
            title: config.editLabel ?? `Cập nhật ${config.title.toLowerCase()}`,
            heading: "Bước 2: Mở form cập nhật",
            description: "Chỉ chỉnh sửa khi đã xác nhận đúng bản ghi. Sau khi thay đổi, kiểm tra lại thông tin bắt buộc trước khi lưu.",
        },
        delete: {
            title: config.deleteLabel ?? `Xóa ${config.title.toLowerCase()}`,
            heading: "Bước 2: Xác nhận thao tác xóa",
            description: "Kiểm tra kỹ bản ghi và điều kiện nghiệp vụ trước khi xác nhận, vì thao tác này có thể ảnh hưởng dữ liệu liên quan.",
        },
        status: {
            title: config.statusLabel ?? `Cập nhật trạng thái ${config.title.toLowerCase()}`,
            heading: "Bước 2: Bật hoặc ngưng sử dụng",
            description: "Dùng thao tác này khi cần thay đổi hiệu lực sử dụng. Hãy đảm bảo trạng thái mới phù hợp với quy trình vận hành.",
        },
    }[action];
    const followUpTarget = {
        detail: config.detailPanelTarget,
        edit: config.editFormTarget ?? config.formTarget,
        delete: config.deleteConfirmTarget,
        status: config.statusConfirmTarget,
    }[action];
    const followUpCopy = {
        detail: {
            title: "Bước 3: Kiểm tra nội dung chi tiết",
            description: "Đối chiếu các thông tin chính, trạng thái và dữ liệu liên kết trước khi quyết định thao tác tiếp theo.",
        },
        edit: {
            title: "Bước 3: Cập nhật và lưu thay đổi",
            description: "Điều chỉnh đúng trường cần thay đổi, kiểm tra thông tin bắt buộc và lưu để cập nhật dữ liệu chính thức.",
        },
        delete: {
            title: "Bước 3: Xác nhận điều kiện xóa",
            description: "Đọc kỹ cảnh báo, chỉ xác nhận khi bản ghi không còn được sử dụng trong quy trình nghiệp vụ.",
        },
        status: {
            title: "Bước 3: Xác nhận trạng thái mới",
            description: "Kiểm tra tác động vận hành trước khi xác nhận bật, tắt hoặc ngưng sử dụng bản ghi.",
        },
    }[action];

    return {
        id: `${config.key}-${action}-guide`,
        title: actionCopy.title,
        description: `Hướng dẫn thao tác ${actionCopy.title.toLowerCase()} trong danh sách.`,
        module: config.module,
        subModule: config.subModule,
        routePrefix: config.routePrefix,
        exactRoute: config.exactRoute ?? true,
        requiredPermission: permission,
        icon: guideIcon[action],
        steps: [
            {
                id: `${config.key}-${action}-search`,
                targetId: config.searchTarget,
                title: "Bước 1: Tìm đúng bản ghi",
                description: "Sử dụng ô tìm kiếm hoặc bộ lọc để thu hẹp danh sách, tránh thao tác nhầm trên bản ghi không liên quan.",
            },
            {
                id: `${config.key}-${action}-target`,
                targetId: target,
                title: actionCopy.heading,
                description: actionCopy.description,
                placement: "left",
                actionType: followUpTarget ? "click" : "none",
            },
            ...(followUpTarget
                ? [{
                    id: `${config.key}-${action}-follow-up`,
                    targetId: followUpTarget,
                    title: followUpCopy.title,
                    description: followUpCopy.description,
                    placement: "right" as const,
                }]
                : []),
        ],
    };
};

const makeCrudGuides = (config: CrudGuideConfig): LotusGuide[] => [
    makeCreateGuide(config),
    makeActionGuide(config, "detail", config.detailTarget, config.detailPermission),
    makeActionGuide(config, "edit", config.editTarget, config.updatePermission),
    makeActionGuide(config, "delete", config.deleteTarget, config.deletePermission),
    makeActionGuide(config, "status", config.statusTarget, config.statusPermission),
].filter(Boolean) as LotusGuide[];

const makeProcedureGuides = (
    key: "company" | "department" | "confidential",
    title: string,
    subModule: string,
    routePrefix: string,
    permissions: {
        create: PermissionLike;
        view: PermissionLike;
        update: PermissionLike;
        revise: PermissionLike;
        delete: PermissionLike;
    },
): LotusGuide[] => {
    const base = `${key}-procedure`;
    const common = {
        module: "Tài liệu & Quy định",
        subModule,
        routePrefix,
        exactRoute: true,
        icon: <FileTextOutlined />,
    };

    return [
        {
            id: `${base}-create-guide`,
            title: `Thêm ${title}`,
            description: `Hướng dẫn tạo mới ${title} theo đúng thông tin tổ chức, trạng thái và file đính kèm.`,
            ...common,
            requiredPermission: permissions.create,
            steps: [
                {
                    id: `${base}-create-search`,
                    targetId: `${base}-search-input`,
                    title: "Bước 1: Kiểm tra quy trình hiện có",
                    description: "Tìm theo tên hoặc mã quy trình để hạn chế tạo trùng và xác định đúng phạm vi áp dụng.",
                },
                {
                    id: `${base}-create-open`,
                    targetId: `${base}-add-button`,
                    title: "Bước 2: Mở form thêm quy trình",
                    description: "Nhấn nút này để mở form tạo mới quy trình.",
                    placement: "left" as const,
                    actionType: "click" as const,
                },
                {
                    id: `${base}-create-form`,
                    targetId: ".procedure-form-modal .ant-modal-content",
                    title: "Bước 3: Nhập thông tin quy trình",
                    description: "Chọn đúng loại quy trình, đơn vị áp dụng, trạng thái, năm kế hoạch và đính kèm tài liệu trước khi lưu.",
                    placement: "right" as const,
                },
            ],
        },
        {
            id: `${base}-detail-guide`,
            title: `Xem chi tiết ${title}`,
            description: "Hướng dẫn kiểm tra đầy đủ thông tin quy trình và lịch sử liên quan.",
            ...common,
            requiredPermission: permissions.view,
            steps: [
                {
                    id: `${base}-detail-search`,
                    targetId: `${base}-search-input`,
                    title: "Bước 1: Tìm đúng quy trình",
                    description: "Lọc theo đơn vị, trạng thái hoặc năm kế hoạch để mở đúng hồ sơ cần xem.",
                },
                {
                    id: `${base}-detail-open`,
                    targetId: `${base}-detail-button`,
                    title: "Bước 2: Mở chi tiết quy trình",
                    description: "Nhấn biểu tượng mắt để xem nội dung, file đính kèm và thông tin ban hành.",
                    placement: "left" as const,
                    actionType: "click" as const,
                },
                {
                    id: `${base}-detail-modal`,
                    targetId: ".procedure-view-modal .ant-modal-content",
                    title: "Bước 3: Rà soát hồ sơ",
                    description: "Kiểm tra trạng thái, phạm vi áp dụng, thông tin người tạo/cập nhật và tài liệu đính kèm.",
                    placement: "right" as const,
                },
            ],
        },
        {
            id: `${base}-edit-guide`,
            title: `Cập nhật ${title}`,
            description: "Hướng dẫn mở menu thao tác và cập nhật quy trình.",
            ...common,
            requiredPermission: permissions.update,
            steps: [
                {
                    id: `${base}-edit-search`,
                    targetId: `${base}-search-input`,
                    title: "Bước 1: Tìm quy trình cần cập nhật",
                    description: "Xác định đúng bản ghi trước khi chỉnh sửa để tránh thay đổi nhầm phiên bản hoặc đơn vị áp dụng.",
                },
                {
                    id: `${base}-edit-menu`,
                    targetId: `${base}-more-button`,
                    title: "Bước 2: Mở menu thao tác",
                    description: "Nhấn nút ba chấm để xem các thao tác được phân quyền.",
                    placement: "left" as const,
                    actionType: "click" as const,
                },
                {
                    id: `${base}-edit-item`,
                    targetId: `${base}-edit-menu-item`,
                    title: "Bước 3: Chọn Chỉnh sửa",
                    description: "Chọn mục Chỉnh sửa để mở form cập nhật quy trình.",
                    placement: "left" as const,
                    actionType: "click" as const,
                },
                {
                    id: `${base}-edit-form`,
                    targetId: ".procedure-form-modal .ant-modal-content",
                    title: "Bước 4: Cập nhật và lưu",
                    description: "Điều chỉnh thông tin cần thiết, kiểm tra file đính kèm và lưu lại để ghi nhận thay đổi.",
                    placement: "right" as const,
                },
            ],
        },
        {
            id: `${base}-revise-guide`,
            title: `Tạo phiên bản mới ${title}`,
            description: "Hướng dẫn tạo version mới khi quy trình cần được cập nhật theo chu kỳ hoặc thay đổi nghiệp vụ.",
            ...common,
            requiredPermission: permissions.revise,
            steps: [
                {
                    id: `${base}-revise-search`,
                    targetId: `${base}-search-input`,
                    title: "Bước 1: Tìm quy trình gốc",
                    description: "Chọn đúng quy trình đang hiệu lực hoặc cần cập nhật để tạo phiên bản kế tiếp.",
                },
                {
                    id: `${base}-revise-menu`,
                    targetId: `${base}-more-button`,
                    title: "Bước 2: Mở menu thao tác",
                    description: "Nhấn nút ba chấm để mở danh sách thao tác của quy trình.",
                    placement: "left" as const,
                    actionType: "click" as const,
                },
                {
                    id: `${base}-revise-item`,
                    targetId: `${base}-revise-menu-item`,
                    title: "Bước 3: Chọn tạo version",
                    description: "Chọn mục tạo phiên bản mới để kế thừa thông tin từ quy trình hiện tại.",
                    placement: "left" as const,
                    actionType: "click" as const,
                },
                {
                    id: `${base}-revise-form`,
                    targetId: ".procedure-revise-modal .ant-modal-content",
                    title: "Bước 4: Hoàn thiện phiên bản mới",
                    description: "Cập nhật nội dung thay đổi, tài liệu đính kèm và xác nhận tạo version mới.",
                    placement: "right" as const,
                },
            ],
        },
        {
            id: `${base}-delete-guide`,
            title: `Xóa ${title}`,
            description: "Hướng dẫn xóa quy trình khi bản ghi không còn phù hợp.",
            ...common,
            requiredPermission: permissions.delete,
            steps: [
                {
                    id: `${base}-delete-search`,
                    targetId: `${base}-search-input`,
                    title: "Bước 1: Tìm đúng quy trình",
                    description: "Kiểm tra tên, mã và phạm vi áp dụng trước khi thực hiện thao tác xóa.",
                },
                {
                    id: `${base}-delete-menu`,
                    targetId: `${base}-more-button`,
                    title: "Bước 2: Mở menu thao tác",
                    description: "Nhấn nút ba chấm để mở các thao tác của quy trình.",
                    placement: "left" as const,
                    actionType: "click" as const,
                },
                {
                    id: `${base}-delete-item`,
                    targetId: `${base}-delete-menu-item`,
                    title: "Bước 3: Chọn Xóa",
                    description: "Chỉ xác nhận xóa khi quy trình không còn được sử dụng hoặc đã được thay thế đúng quy định.",
                    placement: "left" as const,
                },
            ],
        },
    ];
};

const JD_GUIDES: LotusGuide[] = [
    ...makeCrudGuides({
        key: "job-description",
        title: "mô tả công việc",
        module: "Tài liệu & Quy định",
        subModule: "Mô tả công việc",
        routePrefix: "/admin/job-descriptions",
        searchTarget: "job-description-search-input",
        addTarget: "job-description-add-button",
        formTarget: ".job-description-form-modal .ant-modal-content",
        detailPanelTarget: ".job-description-view-modal .ant-modal-content",
        detailTarget: "job-description-detail-button",
        editTarget: "job-description-edit-button",
        deleteTarget: "job-description-more-button",
        createPermission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.CREATE,
        detailPermission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.UPDATE,
        deletePermission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.DELETE,
        icon: <FileTextOutlined />,
        createLabel: "Tạo mô tả công việc",
        editLabel: "Cập nhật mô tả công việc",
    }),
    {
        id: "job-description-approve-guide",
        title: "Duyệt mô tả công việc",
        description: "Hướng dẫn phê duyệt JD trong hàng chờ xử lý.",
        module: "Tài liệu & Quy định",
        subModule: "Mô tả công việc",
        routePrefix: "/admin/job-descriptions",
        exactRoute: true,
        requiredPermission: ALL_PERMISSIONS.JD_FLOW.APPROVE,
        icon: <SafetyCertificateOutlined />,
        steps: [
            {
                id: "job-description-approve-search",
                targetId: "job-description-search-input",
                title: "Bước 1: Tìm JD cần duyệt",
                description: "Tìm đúng mã JD hoặc lọc trạng thái đang duyệt trước khi xử lý.",
            },
            {
                id: "job-description-approve-open",
                targetId: "job-description-approve-button",
                title: "Bước 2: Mở form duyệt",
                description: "Nhấn nút Duyệt để mở form xử lý phê duyệt.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "job-description-approve-modal",
                targetId: ".job-description-approval-modal .ant-modal-content",
                title: "Bước 3: Kiểm tra và xác nhận",
                description: "Rà soát thông tin JD, ghi nhận ý kiến nếu cần và xác nhận duyệt theo đúng trách nhiệm.",
                placement: "right",
            },
        ],
    },
    {
        id: "job-description-reject-guide",
        title: "Từ chối mô tả công việc",
        description: "Hướng dẫn trả lại JD kèm lý do nghiệp vụ rõ ràng.",
        module: "Tài liệu & Quy định",
        subModule: "Mô tả công việc",
        routePrefix: "/admin/job-descriptions",
        exactRoute: true,
        requiredPermission: ALL_PERMISSIONS.JD_FLOW.REJECT,
        icon: <DeleteOutlined />,
        steps: [
            {
                id: "job-description-reject-search",
                targetId: "job-description-search-input",
                title: "Bước 1: Tìm JD cần từ chối",
                description: "Mở đúng bản ghi cần phản hồi để tránh trả lại nhầm hồ sơ.",
            },
            {
                id: "job-description-reject-open",
                targetId: "job-description-reject-button",
                title: "Bước 2: Mở form từ chối",
                description: "Nhấn nút Từ chối để nhập lý do phản hồi.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "job-description-reject-modal",
                targetId: ".job-description-reject-modal .ant-modal-content",
                title: "Bước 3: Nhập lý do rõ ràng",
                description: "Ghi lý do cụ thể để người tạo JD biết cần chỉnh sửa nội dung nào trước khi gửi lại.",
                placement: "right",
            },
        ],
    },
    {
        id: "job-description-issue-guide",
        title: "Ban hành mô tả công việc",
        description: "Hướng dẫn ban hành JD sau khi đã được phê duyệt.",
        module: "Tài liệu & Quy định",
        subModule: "Mô tả công việc",
        routePrefix: "/admin/job-descriptions",
        exactRoute: true,
        requiredPermission: ALL_PERMISSIONS.JD_FLOW.ISSUE,
        icon: <FileProtectOutlined />,
        steps: [
            {
                id: "job-description-issue-search",
                targetId: "job-description-search-input",
                title: "Bước 1: Tìm JD đã duyệt",
                description: "Lọc các JD ở trạng thái đã duyệt để chuẩn bị ban hành chính thức.",
            },
            {
                id: "job-description-issue-open",
                targetId: "job-description-issue-button",
                title: "Bước 2: Mở xác nhận ban hành",
                description: "Nhấn Ban hành để mở hộp xác nhận.",
                placement: "left",
                actionType: "click",
            },
            {
                id: "job-description-issue-modal",
                targetId: ".job-description-issue-modal .ant-modal-content",
                title: "Bước 3: Xác nhận ban hành",
                description: "Kiểm tra mã JD và trạng thái trước khi xác nhận, vì JD đã ban hành sẽ được dùng làm bản chính thức.",
                placement: "right",
            },
        ],
    },
];

export const CRUD_ACTION_GUIDES: LotusGuide[] = [
    ...makeProcedureGuides("company", "quy trình công ty", "Quy trình công ty", "/admin/procedures", {
        create: ALL_PERMISSIONS.PROCEDURE_COMPANY.CREATE,
        view: ALL_PERMISSIONS.PROCEDURE_COMPANY.GET_BY_ID,
        update: ALL_PERMISSIONS.PROCEDURE_COMPANY.UPDATE,
        revise: ALL_PERMISSIONS.PROCEDURE_COMPANY.REVISE,
        delete: ALL_PERMISSIONS.PROCEDURE_COMPANY.DELETE,
    }),
    ...makeProcedureGuides("department", "quy trình phòng ban", "Quy trình phòng ban", "/admin/procedures", {
        create: ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.CREATE,
        view: ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.GET_BY_ID,
        update: ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.UPDATE,
        revise: ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.REVISE,
        delete: ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.DELETE,
    }),
    ...makeProcedureGuides("confidential", "quy trình bảo mật", "Quy trình bảo mật", "/admin/procedures", {
        create: ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.CREATE,
        view: ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.GET_BY_ID,
        update: ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.UPDATE,
        revise: ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.REVISE,
        delete: ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.DELETE,
    }),
    ...JD_GUIDES,
    ...makeCrudGuides({
        key: "employee",
        title: "nhân viên",
        module: "Quản lý người dùng",
        subModule: "Nhân viên",
        routePrefix: "/admin/employees",
        searchTarget: "employee-search-input",
        detailTarget: "employee-detail-button",
        editTarget: "employee-edit-button",
        deleteTarget: "employee-delete-button",
        detailPermission: ALL_PERMISSIONS.EMPLOYEES.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.EMPLOYEES.UPDATE,
        deletePermission: ALL_PERMISSIONS.EMPLOYEES.DELETE,
        icon: <TeamOutlined />,
    }),
    ...makeCrudGuides({
        key: "user",
        title: "người dùng",
        module: "Quản lý người dùng",
        subModule: "Tài khoản",
        routePrefix: "/admin/user",
        searchTarget: "user-search-input",
        addTarget: "user-add-button",
        formTarget: ".user-form-modal .ant-modal-content",
        detailTarget: "user-detail-button",
        editTarget: "user-edit-button",
        createPermission: ALL_PERMISSIONS.USERS.CREATE,
        detailPermission: ALL_PERMISSIONS.USERS.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.USERS.UPDATE,
        icon: <UserSwitchOutlined />,
    }),
    ...makeCrudGuides({
        key: "role",
        title: "vai trò",
        module: "Quản lý người dùng",
        subModule: "Vai trò",
        routePrefix: "/admin/role",
        searchTarget: "role-search-input",
        addTarget: "role-add-button",
        formTarget: ".role-form-modal .ant-modal-content",
        editTarget: "role-edit-button",
        deleteTarget: "role-delete-button",
        createPermission: ALL_PERMISSIONS.ROLES.CREATE,
        updatePermission: ALL_PERMISSIONS.ROLES.UPDATE,
        deletePermission: ALL_PERMISSIONS.ROLES.DELETE,
        icon: <TeamOutlined />,
        editLabel: "Cập nhật phân quyền vai trò",
    }),
    ...makeCrudGuides({
        key: "permission",
        title: "quyền hạn",
        module: "Quản trị hệ thống",
        subModule: "Quyền hạn",
        routePrefix: "/admin/permission",
        searchTarget: "permission-search-input",
        addTarget: "permission-add-button",
        formTarget: ".permission-form-modal .ant-modal-content",
        editTarget: "permission-edit-button",
        deleteTarget: "permission-delete-button",
        createPermission: ALL_PERMISSIONS.PERMISSIONS.CREATE,
        updatePermission: ALL_PERMISSIONS.PERMISSIONS.UPDATE,
        deletePermission: ALL_PERMISSIONS.PERMISSIONS.DELETE,
        icon: <SafetyCertificateOutlined />,
    }),
    ...makeCrudGuides({
        key: "section",
        title: "bộ phận",
        module: "Cấu trúc tổ chức",
        subModule: "Bộ phận",
        routePrefix: "/admin/sections",
        searchTarget: "section-search-input",
        addTarget: "section-add-button",
        formTarget: ".section-form-modal .ant-modal-content",
        detailTarget: "section-detail-button",
        editTarget: "section-edit-button",
        createPermission: ALL_PERMISSIONS.SECTIONS.CREATE,
        detailPermission: ALL_PERMISSIONS.SECTIONS.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.SECTIONS.UPDATE,
        icon: <PartitionOutlined />,
    }),
    ...makeCrudGuides({
        key: "position-level",
        title: "bậc chức danh",
        module: "Cấu hình & Danh mục",
        subModule: "Bậc chức danh",
        routePrefix: "/admin/position-levels",
        searchTarget: "position-level-search-input",
        addTarget: "position-level-add-button",
        formTarget: ".position-level-form-modal .ant-modal-content",
        detailTarget: "position-level-detail-button",
        editTarget: "position-level-edit-button",
        deleteTarget: "position-level-delete-button",
        createPermission: ALL_PERMISSIONS.POSITION_LEVELS.CREATE,
        detailPermission: ALL_PERMISSIONS.POSITION_LEVELS.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.POSITION_LEVELS.UPDATE,
        deletePermission: ALL_PERMISSIONS.POSITION_LEVELS.DELETE,
        icon: <IdcardOutlined />,
    }),
    ...makeCrudGuides({
        key: "job-title",
        title: "chức danh",
        module: "Cấu hình & Danh mục",
        subModule: "Chức danh",
        routePrefix: "/admin/job-titles",
        searchTarget: "job-title-search-input",
        addTarget: "job-title-add-button",
        formTarget: ".job-title-create-modal .ant-modal-content",
        detailTarget: "job-title-detail-button",
        editTarget: "job-title-edit-button",
        createPermission: ALL_PERMISSIONS.JOB_TITLES.CREATE,
        detailPermission: ALL_PERMISSIONS.JOB_TITLES.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.JOB_TITLES.UPDATE,
        icon: <IdcardOutlined />,
    }),
    ...makeCrudGuides({
        key: "process-action",
        title: "đầu mục RACI",
        module: "Cấu hình & Danh mục",
        subModule: "RACI",
        routePrefix: "/admin/process-action",
        searchTarget: "process-action-search-input",
        addTarget: "process-action-add-button",
        formTarget: ".process-action-form-modal .ant-modal-content",
        detailTarget: "process-action-detail-button",
        editTarget: "process-action-edit-button",
        createPermission: ALL_PERMISSIONS.PROCESS_ACTIONS.CREATE,
        detailPermission: ALL_PERMISSIONS.PROCESS_ACTIONS.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.PROCESS_ACTIONS.UPDATE,
        icon: <AuditOutlined />,
    }),
    ...makeCrudGuides({
        key: "permission-category",
        title: "danh mục phân quyền",
        module: "Cấu hình & Danh mục",
        subModule: "Danh mục phân quyền",
        routePrefix: "/admin/permission-categories",
        searchTarget: "permission-category-search-input",
        addTarget: "permission-category-add-button",
        formTarget: ".permission-category-form-modal .ant-modal-content",
        detailTarget: "permission-category-detail-button",
        editTarget: "permission-category-edit-button",
        deleteTarget: "permission-category-delete-button",
        createPermission: ALL_PERMISSIONS.PERMISSION_CATEGORY.CREATE,
        detailPermission: ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.PERMISSION_CATEGORY.UPDATE,
        deletePermission: ALL_PERMISSIONS.PERMISSION_CATEGORY.DELETE,
        icon: <SettingOutlined />,
    }),
    ...makeCrudGuides({
        key: "document",
        title: "văn bản",
        module: "Tài liệu & Quy định",
        subModule: "Văn bản",
        routePrefix: "/admin/documents",
        searchTarget: "document-search-input",
        detailTarget: "document-detail-button",
        editTarget: "document-more-button",
        statusTarget: "document-more-button",
        detailPermission: ALL_PERMISSIONS.DOCUMENTS.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.DOCUMENTS.UPDATE,
        statusPermission: ALL_PERMISSIONS.DOCUMENTS.TOGGLE_ACTIVE,
        icon: <FileTextOutlined />,
        editLabel: "Cập nhật văn bản",
        statusLabel: "Kích hoạt hoặc ngưng văn bản",
    }),
    ...makeCrudGuides({
        key: "document-category",
        title: "danh mục loại văn bản",
        module: "Cấu hình & Danh mục",
        subModule: "Loại văn bản",
        routePrefix: "/admin/document-categories",
        searchTarget: "document-category-search-input",
        addTarget: "document-category-add-button",
        formTarget: ".document-category-form-modal .ant-modal-content",
        detailTarget: "document-category-detail-button",
        editTarget: "document-category-edit-button",
        statusTarget: "document-category-status-button",
        createPermission: ALL_PERMISSIONS.DOCUMENT_CATEGORIES.CREATE,
        detailPermission: ALL_PERMISSIONS.DOCUMENT_CATEGORIES.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.DOCUMENT_CATEGORIES.UPDATE,
        statusPermission: ALL_PERMISSIONS.DOCUMENT_CATEGORIES.TOGGLE_ACTIVE,
        icon: <FileTextOutlined />,
    }),
    ...makeCrudGuides({
        key: "accounting-document-category",
        title: "loại chứng từ kế toán",
        module: "Cấu hình & Danh mục",
        subModule: "Loại chứng từ kế toán",
        routePrefix: "/admin/accounting-document-categories",
        searchTarget: "accounting-document-category-search-input",
        addTarget: "accounting-document-category-add-button",
        formTarget: ".accounting-document-category-form-modal .ant-modal-content",
        editTarget: "accounting-document-category-edit-button",
        deleteTarget: "accounting-document-category-delete-button",
        statusTarget: "accounting-document-category-status-button",
        createPermission: ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.CREATE,
        updatePermission: ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.UPDATE,
        deletePermission: ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.DELETE,
        statusPermission: ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.TOGGLE_ACTIVE,
        icon: <FileProtectOutlined />,
    }),
    ...makeCrudGuides({
        key: "accounting-dossier",
        title: "bộ chứng từ kế toán",
        module: "Kế toán & Tài chính",
        subModule: "Bộ chứng từ kế toán",
        routePrefix: "/admin/accounting-dossiers",
        searchTarget: "accounting-dossier-search-input",
        addTarget: "accounting-dossier-add-button",
        formTarget: ".accounting-dossier-form-modal .ant-modal-content",
        detailTarget: "accounting-dossier-detail-button",
        editTarget: "accounting-dossier-edit-button",
        deleteTarget: "accounting-dossier-delete-button",
        createPermission: ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.CREATE,
        detailPermission: ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_BY_ID,
        updatePermission: ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.UPDATE,
        deletePermission: ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.DELETE,
        icon: <FileProtectOutlined />,
    }),
];
