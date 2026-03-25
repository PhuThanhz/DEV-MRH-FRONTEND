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
    id?: number;        // ← string → number
    name?: string;
    permissions?: IPermission[];
}

export interface IUser {
    id?: number;        // ← string → number (optional để tránh lỗi initial state)
    email: string;
    name: string;
    avatar?: string;
    active?: boolean;
    role: IRole;
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
   FETCH ACCOUNT (THEO BACKEND HIỆN TẠI)
========================================= */
export const fetchAccount = createAsyncThunk<
    IGetAccount,
    void
>(
    "account/fetchAccount",
    async (_, { rejectWithValue }) => {
        try {
            const response: IBackendRes<IGetAccount> =
                await callFetchAccount();

            if (!response?.data) {
                return rejectWithValue("No account data");
            }

            return response.data;
        } catch (error) {
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
        id: undefined,      // ← "" → undefined (vì id giờ là number)
        email: "",
        name: "",
        avatar: "",
        active: true,
        role: {
            id: undefined,  // ← "" → undefined
            name: "",
            permissions: [],
        },
    },
    activeMenu: "home",
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

        updateUserProfile: (
            state,
            action: PayloadAction<Partial<IUser>>
        ) => {
            state.user = {
                ...state.user,
                ...action.payload,
                role: {
                    ...state.user.role,
                    ...action.payload.role,
                    permissions:
                        action.payload.role?.permissions ??
                        state.user.role.permissions,
                },
            };
        },

        setLogoutAction: (state) => {
            localStorage.removeItem("access_token");
            state.isAuthenticated = false;
            state.user = {
                id: undefined,      // ← "" → undefined
                email: "",
                name: "",
                avatar: "",
                active: true,
                role: {
                    id: undefined,  // ← "" → undefined
                    name: "",
                    permissions: [],
                },
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

                const userData = action.payload.user;

                state.user = {
                    id: userData.id,            // ← bỏ ?? "" (number không cần fallback string)
                    email: userData.email ?? "",
                    name: userData.name ?? "",
                    avatar: userData.avatar ?? "",
                    active: userData.active ?? true,
                    role: {
                        id: userData.role?.id,  // ← bỏ ?? ""
                        name: userData.role?.name ?? "",
                        permissions:
                            userData.role?.permissions ?? [],
                    },
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