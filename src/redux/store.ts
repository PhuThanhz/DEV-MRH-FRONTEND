import { configureStore, type Action, type ThunkAction } from "@reduxjs/toolkit";
import accountReducer from "./slice/accountSlide";
import userReducer from "./slice/userSlide";
import permissionReducer from "./slice/permissionSlide";
import roleReducer from "./slice/roleSlide";

// Import baseApi (của RTK Query)
import { baseApi } from "@/redux/api/baseApi";

export const store = configureStore({
  reducer: {
    account: accountReducer,
    user: userReducer,
    permission: permissionReducer,
    role: roleReducer,

    //  Thêm reducer của RTK Query
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware), //  Thêm middleware để RTK Query hoạt động (cache, refetch, invalidation)
});

//  Types
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
