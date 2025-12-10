// Backend Response Types
export interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
}

// Pagination Interface
export interface IModelPaginate<T> {
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    },
    result: T[]
}

export interface IAccount {
    access_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: {
            id: string;
            name: string;
            permissions: {
                id: string;
                name: string;
                apiPath: string;
                method: string;
                module: string;
            }[]
        }
    }
}

export interface IGetAccount extends Omit<IAccount, "access_token"> { }

export interface ICompany {
    id?: string;
    name?: string;
    address?: string;
    logo: string;
    description?: string;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}



export interface IUser {
    id?: string;
    name: string;
    email: string;
    password?: string;
    age: number;
    gender: string;
    address: string;
    role?: {
        id: string;
        name: string;
    }

    company?: {
        id: string;
        name: string;
    }
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IPermission {
    id?: string;
    name?: string;
    apiPath?: string;
    method?: string;
    module?: string;

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;

}

export interface IRole {
    id?: string;
    name: string;
    description: string;
    active: boolean;
    permissions: IPermission[] | string[];

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}



// ===============================
// SOURCE MAIN , GROUP & SOURCE LINK
// ===============================

/** Đại diện cho nhóm chính (SourceGroupMain) */
export interface ISourceGroupMain {
    id: number;
    name: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    totalGroups?: number;
}

export interface ISourceGroup {
    id: number;
    name: string;
    mainGroupId?: number;
    mainGroupName?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    totalLinks?: number;
}

export interface ISourceLink {
    id: number;
    url: string;
    name?: string;
    userId?: string;
    caption?: string | null;
    contentGenerated?: string | null;
    errorMessage?: string | null;
    status?: "SUCCESS" | "FAILED" | null;
    type?: "VIDEO" | "IMAGE" | "TEXT" | "UNKNOWN";
    createdAt?: string;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
}

// ===============================
// REQUEST MODELS
// ===============================
export interface ReqCreateGroupInMainDTO {
    groupName: string;
}

export interface IAddLinkReq {
    url: string;
}

export interface IUpdateCaptionReq {
    caption: string;
}

