import type { IBackendRes, IAccount, IUser, IModelPaginate, IGetAccount, IPermission, IRole } from '@/types/backend';
import axios from 'config/axios-customize';
import type {
    ISourceGroup,
    ISourceLink,
    IAddLinkReq,
    ReqCreateGroupInMainDTO,
    IUpdateCaptionReq,
    ISourceGroupMain
} from '@/types/backend'
/**
 * 
Module Auth
 */
export const callRegister = (name: string, email: string, password: string, age: number, gender: string, address: string) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/auth/register', { name, email, password, age, gender, address })
}

export const callLogin = (username: string, password: string) => {
    return axios.post<IBackendRes<IAccount>>('/api/v1/auth/login', { username, password })
}

export const callFetchAccount = () => {
    return axios.get<IBackendRes<IGetAccount>>('/api/v1/auth/account')
}

export const callRefreshToken = () => {
    return axios.get<IBackendRes<IAccount>>('/api/v1/auth/refresh')
}

export const callLogout = () => {
    return axios.post<IBackendRes<string>>('/api/v1/auth/logout')
}

/**
 * Upload single file
 */
export const callUploadSingleFile = (file: any, folderType: string) => {
    const bodyFormData = new FormData();
    bodyFormData.append('file', file);
    bodyFormData.append('folder', folderType);

    return axios<IBackendRes<{ fileName: string }>>({
        method: 'post',
        url: '/api/v1/files',
        data: bodyFormData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}


/**
 * 
Module User
 */
export const callCreateUser = (user: IUser) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/users', { ...user })
}

export const callUpdateUser = (user: IUser) => {
    return axios.put<IBackendRes<IUser>>(`/api/v1/users`, { ...user })
}

export const callDeleteUser = (id: string) => {
    return axios.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
}

export const callFetchUser = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
}

/**
 * 
Module Permission
 */
export const callCreatePermission = (permission: IPermission) => {
    return axios.post<IBackendRes<IPermission>>('/api/v1/permissions', { ...permission })
}

export const callUpdatePermission = (permission: IPermission, id: string) => {
    return axios.put<IBackendRes<IPermission>>(`/api/v1/permissions`, { id, ...permission })
}

export const callDeletePermission = (id: string) => {
    return axios.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
}

export const callFetchPermission = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${query}`);
}

export const callFetchPermissionById = (id: string) => {
    return axios.get<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
}

/**
 * 
Module Role
 */
export const callCreateRole = (role: IRole) => {
    return axios.post<IBackendRes<IRole>>('/api/v1/roles', { ...role })
}

export const callUpdateRole = (role: IRole, id: string) => {
    return axios.put<IBackendRes<IRole>>(`/api/v1/roles`, { id, ...role })
}

export const callDeleteRole = (id: string) => {
    return axios.delete<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}

export const callFetchRole = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IRole>>>(`/api/v1/roles?${query}`);
}

export const callFetchRoleById = (id: string) => {
    return axios.get<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}











// ============================================================
// SOURCE GROUP MAIN API
// ============================================================

export const callFetchSourceGroupMains = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ISourceGroupMain>>>(`/api/v1/source-group-mains?${query}`);
};
export const callCreateSourceGroupMain = (body: { name: string }) => {
    return axios.post<IBackendRes<ISourceGroupMain>>(`/api/v1/source-group-mains`, body);
};
export const callUpdateSourceGroupMain = (body: { id: number; name: string }) => {
    return axios.put<IBackendRes<ISourceGroupMain>>(`/api/v1/source-group-mains`, body);
};
export const callDeleteSourceGroupMain = (id: number) => {
    return axios.delete<IBackendRes<null>>(`/api/v1/source-group-mains/${id}`);
};
export const callCreateGroupInMain = (mainId: number, body: ReqCreateGroupInMainDTO) => {
    return axios.post<IBackendRes<ISourceGroup>>(`/api/v1/source-group-mains/${mainId}/groups`, body);
};
export const callFetchGroupsByMainId = (mainId: number) => {
    return axios.get<IBackendRes<ISourceGroup[]>>(`/api/v1/source-group-mains/${mainId}/groups`);
};

// ============================================================
// SOURCE GROUP API
// ============================================================

export const callUpdateSourceGroupName = (body: { id: number; name: string }) => {
    return axios.put<IBackendRes<ISourceGroup>>(`/api/v1/source-groups`, body, {
        headers: { "Content-Type": "application/json" },
    });
};

export const callDeleteSourceGroup = (id: number) => {
    return axios.delete<IBackendRes<null>>(`/api/v1/source-groups/${id}`);
};

export const callAddLinkToGroup = (groupId: number, body: IAddLinkReq) => {
    return axios.post<IBackendRes<ISourceGroup>>(`/api/v1/source-groups/${groupId}/links`, body);
};

export const callDeleteLinkFromGroup = (groupId: number, linkId: number) => {
    return axios.delete<IBackendRes<ISourceGroup>>(`/api/v1/source-groups/${groupId}/links/${linkId}`);
};

// ============================================================
// SOURCE LINK API
// ============================================================

export const callProcessGroupLinks = (groupId: number) => {
    return axios.post<IBackendRes<{ message: string }>>(`/api/v1/source-links/${groupId}/process`);
};

export const callFetchLinksByGroup = (groupId: number, query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ISourceLink>>>(`/api/v1/source-links/group/${groupId}?${query}`);
};

export const callFetchLinkDetail = (linkId: number) => {
    return axios.get<IBackendRes<ISourceLink>>(`/api/v1/source-links/${linkId}`);
};

export const callUpdateLinkCaption = (linkId: number, body: IUpdateCaptionReq) => {
    return axios.put<IBackendRes<ISourceLink>>(`/api/v1/source-links/${linkId}/caption`, body);
};