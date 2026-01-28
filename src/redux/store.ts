import type {
  Action, ThunkAction,
} from '@reduxjs/toolkit';
import {

  configureStore,

} from '@reduxjs/toolkit';
import accountReducer from './slice/accountSlide';

export const store = configureStore({
  reducer: {
    account: accountReducer,
  },
});
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;