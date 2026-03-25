import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { callFetchAccount } from "@/config/api";
import type { IBackendRes, IGetAccount } from "@/types/backend";

/* =========================================
   TYPES
========================================= */
interface IPermission {
    id: string;
    name: string;
    apiPath: string;
    method: string;
    module: string;
}

interface IRole {
    id?: number;
    name?: string;
    permissions?: IPermission[];
}

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface IUserInfo {
    employeeCode?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null;       // ISO string (từ Java Instant)
    gender?: Gender | null;
    startDate?: string | null;
    contractSignDate?: string | null;
    contractExpireDate?: string | null;
}

export interface IUser {
    id?: number;
    email: string;
    name: string;
    avatar?: string;
    active?: boolean;
    role: IRole;
    userInfo?: IUserInfo | null;
}

interface IState {
    isAuthenticated: boolean;
    isLoading: boolean;
    isRefreshToken: boolean;
    errorRefreshToken: string;
    user: IUser;
    activeMenu: string;
}

/* =========================================
   FETCH ACCOUNT
========================================= */
export const fetchAccount = createAsyncThunk<IGetAccount, void>(
    "account/fetchAccount",
    async (_, { rejectWithValue }) => {
        try {
            const response: IBackendRes<IGetAccount> = await callFetchAccount();
            if (!response?.data) return rejectWithValue("No account data");
            return response.data;
        } catch {
            return rejectWithValue("Fetch account failed");
        }
    }
);

/* =========================================
   INITIAL STATE
========================================= */
const initialState: IState = {
    isAuthenticated: false,
    isLoading: true,
    isRefreshToken: false,
    errorRefreshToken: "",
    user: {
        id: undefined,
        email: "",
        name: "",
        avatar: "",
        active: true,
        role: { id: undefined, name: "", permissions: [] },
        userInfo: null,
    },
    activeMenu: "home",
};

/* =========================================
   HELPER — map raw backend → IUserInfo
========================================= */
const mapUserInfo = (raw?: any): IUserInfo | null => {
    if (!raw) return null;
    return {
        employeeCode: raw.employeeCode ?? null,
        phone: raw.phone ?? null,
        dateOfBirth: raw.dateOfBirth ?? null,
        gender: raw.gender ?? null,
        startDate: raw.startDate ?? null,
        contractSignDate: raw.contractSignDate ?? null,
        contractExpireDate: raw.contractExpireDate ?? null,
    };
};

/* =========================================
   SLICE
========================================= */
export const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        setActiveMenu: (state, action: PayloadAction<string>) => {
            state.activeMenu = action.payload;
        },

        setUserLoginInfo: (state, action: PayloadAction<IUser>) => {
            state.isAuthenticated = true;
            state.isLoading = false;
            state.user = action.payload;
        },

        updateUserProfile: (state, action: PayloadAction<Partial<IUser>>) => {
            state.user = {
                ...state.user,
                ...action.payload,
                role: {
                    ...state.user.role,
                    ...action.payload.role,
                    permissions:
                        action.payload.role?.permissions ?? state.user.role.permissions,
                },
                // Merge userInfo — giữ lại các field cũ nếu patch không gửi lại
                userInfo:
                    action.payload.userInfo !== undefined
                        ? { ...state.user.userInfo, ...action.payload.userInfo }
                        : state.user.userInfo,
            };
        },

        setLogoutAction: (state) => {
            localStorage.removeItem("access_token");
            state.isAuthenticated = false;
            state.user = {
                id: undefined,
                email: "",
                name: "",
                avatar: "",
                active: true,
                role: { id: undefined, name: "", permissions: [] },
                userInfo: null,
            };
        },

        setRefreshTokenAction: (
            state,
            action: PayloadAction<{ status: boolean; message: string }>
        ) => {
            state.isRefreshToken = action.payload.status;
            state.errorRefreshToken = action.payload.message;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchAccount.pending, (state) => {
                state.isAuthenticated = false;
                state.isLoading = true;
            })
            .addCase(fetchAccount.fulfilled, (state, action) => {
                state.isAuthenticated = true;
                state.isLoading = false;

                const u = action.payload.user;

                state.user = {
                    id: u.id,
                    email: u.email ?? "",
                    name: u.name ?? "",
                    avatar: u.avatar ?? "",
                    active: u.active ?? true,
                    role: {
                        id: u.role?.id,
                        name: u.role?.name ?? "",
                        permissions: u.role?.permissions ?? [],
                    },
                    userInfo: mapUserInfo(u.userInfo),   // ← map từ ResUserDTO.UserInfoBasic
                };
            })
            .addCase(fetchAccount.rejected, (state) => {
                state.isAuthenticated = false;
                state.isLoading = false;
            });
    },
});

/* =========================================
   EXPORTS
========================================= */
export const {
    setActiveMenu,
    setUserLoginInfo,
    updateUserProfile,
    setLogoutAction,
    setRefreshTokenAction,
} = accountSlice.actions;

export default accountSlice.reducer;