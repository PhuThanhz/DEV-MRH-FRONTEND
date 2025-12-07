import { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import NotFound from 'components/share/not.found';
import LoginPage from 'pages/auth/login';
import RegisterPage from 'pages/auth/register';
import LayoutAdmin from '@/components/admin/layout/layout.admin';
import ProtectedRoute from 'components/share/protected-route.ts';
import HomePage from 'pages/home';
import DashboardPage from './pages/admin/dashboard';
import PermissionPage from './pages/admin/permission';
import RolePage from './pages/admin/role';
import UserPage from './pages/admin/UserPage.rtk';
import { fetchAccount } from './redux/slice/accountSlide';
import LayoutApp from './components/share/layout.app';
import LayoutClient from './components/client/layout/layout.client';
import { PATHS } from '@/constants/paths';

export default function App() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.account.isLoading);

  useEffect(() => {
    if (
      window.location.pathname === PATHS.LOGIN ||
      window.location.pathname === PATHS.REGISTER
    ) return;
    dispatch(fetchAccount());
  }, []);

  const router = createBrowserRouter([
    {
      path: PATHS.HOME,
      element: (
        <LayoutApp>
          <LayoutClient />
        </LayoutApp>
      ),
      errorElement: <NotFound />,
      children: [
        { index: true, element: <HomePage /> },
      ],
    },
    {
      path: PATHS.ADMIN.ROOT,
      element: (
        <LayoutApp>
          <LayoutAdmin />
        </LayoutApp>
      ),
      errorElement: <NotFound />,
      children: [
        {
          index: true,
          element: (
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.USER,
          element: (
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.PERMISSION,
          element: (
            <ProtectedRoute>
              <PermissionPage />
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.ROLE,
          element: (
            <ProtectedRoute>
              <RolePage />
            </ProtectedRoute>
          ),
        },
      ],
    },
    { path: PATHS.LOGIN, element: <LoginPage /> },
    { path: PATHS.REGISTER, element: <RegisterPage /> },
  ]);

  return <RouterProvider router={router} />;
}
