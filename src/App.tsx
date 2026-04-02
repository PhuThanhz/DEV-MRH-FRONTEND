import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useAppDispatch } from '@/redux/hooks';
import NotFound from 'components/share/not.found';
import LoginPage from 'pages/auth/login';
import ForgotPassword from 'pages/auth/ForgotPassword';
import LayoutAdmin from '@/components/layout/admin/layout.admin';
import ProtectedRoute from 'components/share/protected-route.ts';
import HomePage from 'pages/home';
import DashboardPage from './pages/admin/dashboard';
import PermissionPage from './pages/admin/permission/permission';
import RolePage from './pages/admin/role/role';
import UserPage from './pages/admin/user/user';
import { fetchAccount } from './redux/slice/accountSlide';
import LayoutApp from './components/share/layout.app';
import LayoutClient from './components/layout/client/layout.client';
import { PATHS } from '@/constants/paths';
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import CompanyPage from './pages/admin/company/company';
import DepartmentPage from './pages/admin/department/department';
import SectionPage from "@/pages/admin/section/section";
import PositionLevelPage from "@/pages/admin/position-levels/position-levels";
import JobTitlePage from "@/pages/admin/job-title/job-title.page";
// import CareerPathTab from "@/pages/admin/department/career-path/CareerPathTab";
import CareerPathPage from "@/pages/admin/department/career-path/CareerPathPage";
import DepartmentPermissionPage from "@/pages/admin/department/permissions";
import DepartmentObjectivesTasksPage from "@/pages/admin/department/objectives-tasks";
import CompanyOrgChartPage from "@/pages/admin/company/org-chart";
import SalaryRangePage from "@/pages/admin/salary-range/SalaryRangePage";
import ProcessActionPage from "@/pages/admin/process-action";
import PermissionCategoryPage from "@/pages/admin/permission-category";
import JobDescriptionPage from "@/pages/admin/job-description/job-description.page";
import OrgChartPage from '@/pages/admin/department/org-chart';
import ConfirmResetPassword from 'pages/auth/ConfirmResetPassword';
import EmployeePage from './pages/admin/employees/employee';
// ✅ PROCEDURES
import ProcedureAdminPage from "@/pages/admin/procedures";
import CompanyProceduresPage from "@/pages/admin/company/procedures";
import DepartmentProceduresPage from "@/pages/admin/department/procedures";
import WelcomePage from "@/pages/admin/WelcomePage";
import DashboardOrWelcome from "@/pages/admin/DashboardOrWelcome";
export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (window.location.pathname === PATHS.LOGIN) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;
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
              <DashboardOrWelcome />
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.USER,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.USERS.GET_PAGINATE}>
                <UserPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.EMPLOYEE,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.USERS.GET_PAGINATE}>
                <EmployeePage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.COMPANY,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.COMPANIES.GET_PAGINATE}>
                <CompanyPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.ORG_CHART_COMPANY,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.COMPANIES.GET_PAGINATE}>
                <CompanyOrgChartPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.DEPARTMENT,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.DEPARTMENTS.GET_PAGINATE}>
                <DepartmentPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: "/admin/salary-range/:departmentId",
          element: (
            <ProtectedRoute>
              <SalaryRangePage />
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.ORG_CHART_DEPARTMENT,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.DEPARTMENTS.GET_PAGINATE}>
                <OrgChartPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.SECTION,
          element: (
            <Access permission={ALL_PERMISSIONS.SECTIONS.GET_PAGINATE}>
              <SectionPage />
            </Access>
          ),
        },
        {
          path: PATHS.ADMIN.POSITION_LEVEL,
          element: (
            <Access permission={ALL_PERMISSIONS.POSITION_LEVELS.GET_PAGINATE}>
              <PositionLevelPage />
            </Access>
          ),
        },
        {
          path: PATHS.ADMIN.PERMISSION,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE}>
                <PermissionPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.ROLE,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.ROLES.GET_PAGINATE}>
                <RolePage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.JOB_TITLE,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.JOB_TITLES.GET_PAGINATE}>
                <JobTitlePage />
              </Access>
            </ProtectedRoute>
          ),
        },

        // ===== PROCEDURES =====
        {
          path: PATHS.ADMIN.PROCEDURES,
          element: (
            <ProtectedRoute>
              <ProcedureAdminPage />
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.COMPANY_PROCEDURES,
          element: (
            <ProtectedRoute>
              <CompanyProceduresPage />
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.DEPARTMENT_PROCEDURES,
          element: (
            <ProtectedRoute>
              <DepartmentProceduresPage />
            </ProtectedRoute>
          ),
        },

        {
          path: PATHS.ADMIN.CAREER_PATH,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.CAREER_PATHS.GET_BY_DEPARTMENT}>
                <CareerPathPage />  {/* ← đổi từ CareerPathTab */}
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: "/admin/departments/:id/permissions",
          element: <DepartmentPermissionPage />,
        },
        {
          path: PATHS.ADMIN.DEPARTMENT_OBJECTIVES,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.VIEW}>
                <DepartmentObjectivesTasksPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.JOB_DESCRIPTIONS,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PAGINATE}>
                <JobDescriptionPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.PROCESS_ACTION,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.PROCESS_ACTIONS.GET_PAGINATE}>
                <ProcessActionPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.PERMISSION_CATEGORIES,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.PERMISSION_CATEGORY.GET_PAGINATE}>
                <PermissionCategoryPage />
              </Access>
            </ProtectedRoute>
          ),
        },
      ],
    },
    { path: PATHS.LOGIN, element: <LoginPage /> },
    { path: PATHS.FORGOT_PASSWORD, element: <ForgotPassword /> },
    { path: PATHS.CONFIRM_RESET_PASSWORD, element: <ConfirmResetPassword /> },
  ]);

  return <RouterProvider router={router} />;
}