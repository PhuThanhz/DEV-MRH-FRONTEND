import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { callFetchAccount } from "@/config/api";

export const fetchAccount = createAsyncThunk("account/fetchAccount", async () => {
    const response = await callFetchAccount();
    return response.data;
});


interface IPermission {
    id: string;
    name: string;
    apiPath: string;
    method: string;
    module: string;
}

interface IRole {
    id?: string;
    name?: string;
    permissions?: IPermission[];
}

interface IUser {
    id: string;
    email: string;
    name: string;
    avatar?: string
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


const initialState: IState = {
    isAuthenticated: false,
    isLoading: true,
    isRefreshToken: false,
    errorRefreshToken: "",
    user: {
        id: "",
        email: "",
        name: "",
        avatar: "",
        active: true,
        role: {
            id: "",
            name: "",
            permissions: [],
        },
    },
    activeMenu: "home",
};

/* ================================
   Slice
=================================*/
export const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        setActiveMenu: (state, action) => {
            state.activeMenu = action.payload;
        },

        setUserLoginInfo: (state, action) => {
            const user = action.payload ?? {};
            state.isAuthenticated = true;
            state.isLoading = false;

            state.user.id = user?.id ?? "";
            state.user.email = user?.email ?? "";
            state.user.name = user?.name ?? "";
            state.user.avatar = user?.avatar ?? "";
            state.user.active = user?.active ?? true;

            state.user.role = user?.role ?? {};
            state.user.role.permissions = user?.role?.permissions ?? [];
        },

        setLogoutAction: (state) => {
            localStorage.removeItem("access_token");
            state.isAuthenticated = false;
            state.user = {
                id: "",
                email: "",
                name: "",
                avatar: "",
                active: true,
                role: {
                    id: "",
                    name: "",
                    permissions: [],
                },
            };
        },

        setRefreshTokenAction: (state, action) => {
            state.isRefreshToken = action.payload?.status ?? false;
            state.errorRefreshToken = action.payload?.message ?? "";
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchAccount.pending, (state) => {
                state.isAuthenticated = false;
                state.isLoading = true;
            })
            .addCase(fetchAccount.fulfilled, (state, action) => {
                if (action.payload) {
                    const userData = action.payload?.user ?? action.payload;

                    state.isAuthenticated = true;
                    state.isLoading = false;

                    state.user.id = userData?.id ?? "";
                    state.user.email = userData?.email ?? "";
                    state.user.name = userData?.name ?? "";
                    state.user.avatar = userData?.avatar ?? "";
                    state.user.active = userData?.active ?? true;

                    state.user.role = userData?.role ?? {};
                    state.user.role.permissions = userData?.role?.permissions ?? [];
                }
            })
            .addCase(fetchAccount.rejected, (state) => {
                state.isAuthenticated = false;
                state.isLoading = false;
            });
    },
});

export const {
    setActiveMenu,
    setUserLoginInfo,
    setLogoutAction,
    setRefreshTokenAction,
} = accountSlice.actions;

export default accountSlice.reducer;
