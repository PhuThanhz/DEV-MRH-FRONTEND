import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useAppDispatch } from '@/redux/hooks';
import NotFound from 'components/share/not.found';
import LoginPage from 'pages/auth/login';
import ForgotPassword from 'pages/auth/ForgotPassword';
import LayoutAdmin from '@/components/layout/admin/layout.admin';
import ProtectedRoute from 'components/share/protected-route.ts';
import HomePage from 'pages/home';
import DashboardPage from './pages/admin/dashboard/dashboard';
import PermissionPage from './pages/admin/permission/permission';
import RolePage from './pages/admin/role/role';
import UserPage from './pages/admin/user/user';
import { fetchAccount, setLogoutAction } from './redux/slice/accountSlide';
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
import PositionChartPage from "@/pages/admin/department/position-chart/index";
import DepartmentProfilePage from "@/pages/admin/dashboard/department-profile";
import PublicProcedureView from "@/pages/public/PublicProcedureView";
import QrScanPage from "@/pages/scan/QrScanPage";
import QrProcedureDetail from "@/pages/admin/procedures/QrProcedureDetail";
// ✅ DOCUMENTS
import DocumentCategoryPage from "@/pages/admin/document-category";
import DocumentPage from "@/pages/admin/document";
import PersonalDrivePage from "@/pages/admin/personal-drive";
import AccountingDossierPage from "@/pages/admin/accounting-dossiers";
import AccountingDocumentPage from "@/pages/admin/accounting";
import AccountingDocumentCategoryPage from "@/pages/admin/accounting-document-category";
// ✅ EVALUATION HQCV
import EvaluationProcessPage from "@/pages/evaluation/process/EvaluationProcessPage";
import TemplatePage from "@/pages/admin/evaluation/templates/TemplatePage";
import TemplateDetailPage from "@/pages/admin/evaluation/templates/TemplateDetailPage";
import PeriodPage from "@/pages/admin/evaluation/periods/PeriodPage";
import MyEvaluationPage from "@/pages/evaluation/my-records/MyEvaluationPage";
import MyEvaluationDetailPage from "@/pages/evaluation/my-records/MyEvaluationDetailPage";
import PendingManagerEvaluationPage from "@/pages/evaluation/manager/PendingManagerEvaluationPage";
import ManagerEvaluationDetailPage from "@/pages/evaluation/manager/ManagerEvaluationDetailPage";
import PendingApprovalPage from "@/pages/evaluation/approval/PendingApprovalPage";
import ApprovalDetailPage from "@/pages/evaluation/approval/ApprovalDetailPage";
import CompletedEvaluationsPage from "@/pages/evaluation/summary/CompletedEvaluationsPage";
// ✅ DEDICATED PORTALS
import LookupPortalPage from "@/pages/accounting/LookupPortalPage";

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (window.location.pathname === PATHS.LOGIN) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      dispatch(setLogoutAction());
      return;
    }
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
        // Thêm route vào children của PATHS.ADMIN.ROOT
        {
          path: "department-profiles",
          element: (
            <ProtectedRoute>
              <DepartmentProfilePage />
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
          path: "/admin/departments/:departmentId/salary-range", element: (
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
        // ✅ THÊM VÀO ĐÂY
        {
          path: "procedures/qr/:token",
          element: (
            <ProtectedRoute>
              <QrProcedureDetail />
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
          path: "/admin/departments/:departmentId/permissions",
          element: (
            <ProtectedRoute>
              <DepartmentPermissionPage />
            </ProtectedRoute>
          ),
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
        // ← THÊM VÀO ĐÂY
        {
          path: "/admin/departments/:departmentId/position-chart",
          element: (
            <ProtectedRoute>
              <PositionChartPage />
            </ProtectedRoute>
          ),
        },
        // ← THÊM TIẾP
        {
          path: "/admin/qr-scan",
          element: (
            <ProtectedRoute>
              <QrScanPage />
            </ProtectedRoute>
          ),
        },
        // ✅ DOCUMENTS
        {
          path: PATHS.ADMIN.DOCUMENT_CATEGORY,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.DOCUMENT_CATEGORIES.GET_PAGINATE}>
                <DocumentCategoryPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.DOCUMENT,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.DOCUMENTS.GET_PAGINATE}>
                <DocumentPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.PERSONAL_DRIVE,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.DOCUMENT_FOLDERS.GET_TREE}>
                <PersonalDrivePage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.ACCOUNTING_DOSSIERS,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_PAGINATE}>
                <AccountingDossierPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: "/admin/accounting-documents",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_PAGINATE}>
                <AccountingDocumentPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.ACCOUNTING_DOCUMENT_CATEGORY,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.ACCOUNTING_DOCUMENT_CATEGORIES.GET_PAGINATE}>
                <AccountingDocumentCategoryPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION HQCV
        {
          path: PATHS.ADMIN.EVALUATION_TEMPLATES,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES}>
                <TemplatePage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.EVALUATION_TEMPLATE_DETAIL,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_TEMPLATES}>
                <TemplateDetailPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.EVALUATION_PERIODS,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PERIODS}>
                <PeriodPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION — PROCESS (Gộp 3 tab)
        {
          path: "evaluation/process",
          element: (
            <ProtectedRoute>
              <EvaluationProcessPage />
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION — NHÂN VIÊN
        {
          path: "evaluation/my-records",
          element: (
            <ProtectedRoute>
              <MyEvaluationPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "evaluation/my-records/:id",
          element: (
            <ProtectedRoute>
              <MyEvaluationDetailPage />
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION — QUẢN LÝ
        {
          path: "evaluation/manager/pending",
          element: (
            <ProtectedRoute>
              <PendingManagerEvaluationPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "evaluation/manager/records/:id",
          element: (
            <ProtectedRoute>
              <ManagerEvaluationDetailPage />
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION — APPROVAL
        {
          path: "evaluation/approval/pending",
          element: (
            <ProtectedRoute>
              <PendingApprovalPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "evaluation/approval/records/:id",
          element: (
            <ProtectedRoute>
              <ApprovalDetailPage />
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION — TỔNG HỢP (SUMMARY)
        {
          path: "evaluation/summary",
          element: (
            <ProtectedRoute>
              <CompletedEvaluationsPage />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: "/admin/accounting-lookup",
      element: (
        <LayoutApp>
          <ProtectedRoute>
            <Access permission={ALL_PERMISSIONS.ACCOUNTING_DOCUMENTS.GET_PAGINATE}>
              <LookupPortalPage />
            </Access>
          </ProtectedRoute>
        </LayoutApp>
      ),
    },
    { path: PATHS.LOGIN, element: <LoginPage /> },
    { path: PATHS.FORGOT_PASSWORD, element: <ForgotPassword /> },
    { path: PATHS.CONFIRM_RESET_PASSWORD, element: <ConfirmResetPassword /> },
    { path: "/public/view/:token", element: <PublicProcedureView /> },
  ]);

  return <RouterProvider router={router} />;
}
