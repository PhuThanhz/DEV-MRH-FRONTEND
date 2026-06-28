import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useAppDispatch } from '@/redux/hooks';
import NotFound from 'components/share/not.found';
import LayoutAdmin from '@/components/layout/admin/layout.admin';
import ProtectedRoute from 'components/share/protected-route.ts';
import { fetchAccount, setLogoutAction } from './redux/slice/accountSlide';
import LayoutApp from './components/share/layout.app';
import LayoutClient from './components/layout/client/layout.client';
import { PATHS } from '@/constants/paths';
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Loading from "@/components/share/loading";

const LoginPage = lazy(() => import("pages/auth/login"));
const ForgotPassword = lazy(() => import("pages/auth/ForgotPassword"));
const HomePage = lazy(() => import("pages/home"));
const UserPage = lazy(() => import("./pages/admin/user/user"));
const CompanyPage = lazy(() => import("./pages/admin/company/company"));
const DepartmentPage = lazy(() => import("./pages/admin/department/department"));
const SectionPage = lazy(() => import("@/pages/admin/section/section"));
const PositionLevelPage = lazy(() => import("@/pages/admin/position-levels/position-levels"));
const PermissionPage = lazy(() => import("./pages/admin/permission/permission"));
const RolePage = lazy(() => import("./pages/admin/role/role"));
const JobTitlePage = lazy(() => import("@/pages/admin/job-title/job-title.page"));
const CareerPathPage = lazy(() => import("@/pages/admin/department/career-path/CareerPathPage"));
const DepartmentPermissionPage = lazy(() => import("@/pages/admin/department/permissions"));
const DepartmentObjectivesTasksPage = lazy(() => import("@/pages/admin/department/objectives-tasks"));
const CompanyOrgChartPage = lazy(() => import("@/pages/admin/company/org-chart"));
const SalaryRangePage = lazy(() => import("@/pages/admin/salary-range/SalaryRangePage"));
const ProcessActionPage = lazy(() => import("@/pages/admin/process-action"));
const PermissionCategoryPage = lazy(() => import("@/pages/admin/permission-category"));
const JobDescriptionPage = lazy(() => import("@/pages/admin/job-description/job-description.page"));
const OrgChartPage = lazy(() => import("@/pages/admin/department/org-chart"));
const ConfirmResetPassword = lazy(() => import("pages/auth/ConfirmResetPassword"));
const EmployeePage = lazy(() => import("./pages/admin/employees/employee"));
const ProcedureAdminPage = lazy(() => import("@/pages/admin/procedures"));
const CompanyProceduresPage = lazy(() => import("@/pages/admin/company/procedures"));
const DepartmentProceduresPage = lazy(() => import("@/pages/admin/department/procedures"));
const DashboardOrWelcome = lazy(() => import("@/pages/admin/DashboardOrWelcome"));
const PositionChartPage = lazy(() => import("@/pages/admin/department/position-chart/index"));
const DepartmentProfilePage = lazy(() => import("@/pages/admin/dashboard/department-profile"));
const PublicProcedureView = lazy(() => import("@/pages/public/PublicProcedureView"));
const QrScanPage = lazy(() => import("@/pages/scan/QrScanPage"));
const QrProcedureDetail = lazy(() => import("@/pages/admin/procedures/QrProcedureDetail"));
const DocumentCategoryPage = lazy(() => import("@/pages/admin/document-category"));
const DocumentPage = lazy(() => import("@/pages/admin/document"));
const PersonalDrivePage = lazy(() => import("@/pages/admin/personal-drive"));
const AccountingDossierPage = lazy(() => import("@/pages/admin/accounting-dossiers"));
const AccountingDocumentPage = lazy(() => import("@/pages/admin/accounting"));
const AccountingDocumentCategoryPage = lazy(() => import("@/pages/admin/accounting-document-category"));
const EvaluationProcessPage = lazy(() => import("@/pages/evaluation/process/EvaluationProcessPage"));
const TemplatePage = lazy(() => import("@/pages/admin/evaluation/templates/TemplatePage"));
const TemplateDetailPage = lazy(() => import("@/pages/admin/evaluation/templates/TemplateDetailPage"));
const PeriodPage = lazy(() => import("@/pages/admin/evaluation/periods/PeriodPage"));
const MyEvaluationPage = lazy(() => import("@/pages/evaluation/my-records/MyEvaluationPage"));
const MyEvaluationDetailPage = lazy(() => import("@/pages/evaluation/my-records/MyEvaluationDetailPage"));
const PendingManagerEvaluationPage = lazy(() => import("@/pages/evaluation/manager/PendingManagerEvaluationPage"));
const ManagerEvaluationDetailPage = lazy(() => import("@/pages/evaluation/manager/ManagerEvaluationDetailPage"));
const PendingApprovalPage = lazy(() => import("@/pages/evaluation/approval/PendingApprovalPage"));
const ApprovalDetailPage = lazy(() => import("@/pages/evaluation/approval/ApprovalDetailPage"));
const CompletedEvaluationsPage = lazy(() => import("@/pages/evaluation/summary/CompletedEvaluationsPage"));
const LookupPortalPage = lazy(() => import("@/pages/accounting/LookupPortalPage"));

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

  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
