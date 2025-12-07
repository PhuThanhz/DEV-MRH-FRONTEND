export const ALL_PERMISSIONS = {
    /* ===================== PERMISSIONS ===================== */
    PERMISSIONS: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/permissions', module: "PERMISSIONS" },
        CREATE: { method: "POST", apiPath: '/api/v1/permissions', module: "PERMISSIONS" },
        UPDATE: { method: "PUT", apiPath: '/api/v1/permissions', module: "PERMISSIONS" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/permissions/{id}', module: "PERMISSIONS" },
    },

    /* ===================== ROLES ===================== */
    ROLES: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/roles', module: "ROLES" },
        CREATE: { method: "POST", apiPath: '/api/v1/roles', module: "ROLES" },
        UPDATE: { method: "PUT", apiPath: '/api/v1/roles', module: "ROLES" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/roles/{id}', module: "ROLES" },
    },

    /* ===================== USERS ===================== */
    USERS: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/users', module: "USERS" },
        CREATE: { method: "POST", apiPath: '/api/v1/users', module: "USERS" },
        UPDATE: { method: "PUT", apiPath: '/api/v1/users', module: "USERS" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/users/{id}', module: "USERS" },
        RESTORE: { method: "PUT", apiPath: '/api/v1/users/{id}/restore', module: "USERS" },
    },

    /* ===================== SOURCE GROUPS ===================== */
    SOURCE_GROUPS: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/source-groups', module: "SOURCE_GROUPS" },
        CREATE: { method: "POST", apiPath: '/api/v1/source-groups', module: "SOURCE_GROUPS" },
        UPDATE: { method: "PUT", apiPath: '/api/v1/source-groups/{id}', module: "SOURCE_GROUPS" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/source-groups/{id}', module: "SOURCE_GROUPS" },
        ADD_LINK: { method: "POST", apiPath: '/api/v1/source-groups/{groupId}/links', module: "SOURCE_GROUPS" },
        DELETE_LINK: { method: "DELETE", apiPath: '/api/v1/source-groups/{groupId}/links/{linkId}', module: "SOURCE_GROUPS" },
    },

    /* ===================== SOURCE LINKS ===================== */
    SOURCE_LINKS: {
        PROCESS_GROUP: {
            method: "POST",
            apiPath: "/api/v1/source-links/{groupId}/process",
            module: "SOURCE_LINKS",
        },
        GET_BY_GROUP: {
            method: "GET",
            apiPath: "/api/v1/source-links/group/{groupId}",
            module: "SOURCE_LINKS",
        },
        GET_BY_ID: {
            method: "GET",
            apiPath: "/api/v1/source-links/{linkId}",
            module: "SOURCE_LINKS",
        },
        UPDATE_CAPTION: {
            method: "PUT",
            apiPath: "/api/v1/source-links/{linkId}/caption",
            module: "SOURCE_LINKS",
        },
    },


};

export const ALL_MODULES = {
    FILES: 'FILES',
    PERMISSIONS: 'PERMISSIONS',
    ROLES: 'ROLES',
    USERS: 'USERS',
    SOURCE_GROUPS: 'SOURCE_GROUPS',
    SOURCE_LINKS: 'SOURCE_LINKS',
};
