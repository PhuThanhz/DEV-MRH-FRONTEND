import { lazy, Suspense, useEffect, useMemo } from 'react';
import type { ReactNode } from "react";
import { Result } from "antd";
import { createBrowserRouter, RouterProvider, Navigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import NotFound from 'components/share/not.found';
import ProtectedRoute from 'components/share/protected-route.ts';
import { fetchAccount, setLogoutAction } from './redux/slice/accountSlide';
import LayoutApp from './components/share/layout.app';
import LayoutClient from './components/layout/client/layout.client';
import { PATHS } from '@/constants/paths';
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Loading from "@/components/common/loading/loading";
import RouteErrorFallback from "@/components/share/route-error";

const LoginPage = lazy(() => import("pages/auth/login"));
const ForgotPassword = lazy(() => import("pages/auth/ForgotPassword"));
const HomePage = lazy(() => import("pages/home"));
const UserPage = lazy(() => import("./pages/admin/user/user"));
const CompanyPage = lazy(() => import("./pages/admin/company/company"));
const DepartmentPage = lazy(() => import("./pages/admin/department/department"));
const SectionPage = lazy(() => import("@/pages/admin/section/section"));
const PositionLevelPage = lazy(() => import("@/pages/admin/position-levels/position-levels"));
const PermissionPage = lazy(() => import("@/pages/admin/permission/permission"));
const RolePage = lazy(() => import("@/pages/admin/role/role"));
const JobTitlePage = lazy(() => import("@/pages/admin/job-title/job-title.page"));
const CareerPathPage = lazy(() => import("@/pages/admin/department/career-path/CareerPathPage"));
const DepartmentPermissionPage = lazy(() => import("@/pages/admin/department/permissions"));
const DepartmentObjectivesTasksPage = lazy(() => import("@/pages/admin/department/objectives-tasks"));
const MissionConsolePage = lazy(() => import("@/pages/admin/department/mission-console"));
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
const LayoutAdmin = lazy(() => import('@/components/layout/admin/layout.admin'));
const PersonalOverviewPage = lazy(() => import("@/pages/admin/overview/PersonalOverviewPage"));
const WelcomePage = lazy(() => import("@/pages/admin/WelcomePage"));
const PositionChartPage = lazy(() => import("@/pages/admin/department/position-chart/index"));
const DepartmentProfilePage = lazy(() => import("@/pages/admin/dashboard/department-profile"));
const PublicProcedureView = lazy(() => import("@/pages/public/PublicProcedureView"));
const QrScanPage = lazy(() => import("@/pages/scan/QrScanPage"));
const QrProcedureDetail = lazy(() => import("@/pages/admin/procedures/QrProcedureDetail"));
const DocumentCategoryPage = lazy(() => import("@/pages/admin/document-category"));
const DocumentPage = lazy(() => import("@/pages/admin/document"));
const PersonalDrivePage = lazy(() => import("@/pages/admin/personal-drive"));
const AccountingDossierPage = lazy(() => import("@/pages/admin/accounting-dossiers"));
const DossierQrDetail = lazy(() => import("@/pages/admin/accounting-dossiers/DossierQrDetail"));
const AccountingReportsPage = lazy(() => import("@/pages/admin/accounting-reports"));
const AccountingDocumentPage = lazy(() => import("@/pages/admin/accounting"));
const AccountingDocumentCategoryPage = lazy(() => import("@/pages/admin/accounting-document-category"));
const WorkflowTemplatesPage = lazy(() => import("@/pages/admin/accounting-workflows"));
const DelegationsPage = lazy(() => import("@/pages/admin/accounting-delegations"));
const EvaluationProcessPage = lazy(() => import("@/pages/evaluation/process/EvaluationProcessPage"));
const TemplatePage = lazy(() => import("@/pages/admin/evaluation/templates/TemplatePage"));
const PeriodPage = lazy(() => import("@/pages/admin/evaluation/periods/PeriodPage"));
const PeriodProgressDashboard = lazy(() => import("@/pages/evaluation/process/PeriodProgressDashboard"));
const MyEvaluationPage = lazy(() => import("@/pages/evaluation/my-records/MyEvaluationPage"));
const MyEvaluationDetailPage = lazy(() => import("@/pages/evaluation/my-records/MyEvaluationDetailPage"));
const PendingManagerEvaluationPage = lazy(() => import("@/pages/evaluation/manager/PendingManagerEvaluationPage"));
const PendingApprovalPage = lazy(() => import("@/pages/evaluation/approval/PendingApprovalPage"));
const EvaluationDetailRouteRedirect = lazy(() => import("@/pages/evaluation/process/EvaluationDetailRouteRedirect"));
const CompletedEvaluationsPage = lazy(() => import("@/pages/evaluation/summary/CompletedEvaluationsPage"));
const LookupPortalPage = lazy(() => import("@/pages/accounting/LookupPortalPage"));

type PermissionDef = { method: string; apiPath: string; module: string };

const canAccessAny = (grantedPermissions: PermissionDef[] | undefined, permissions: PermissionDef[], roleName: string) => {
  if (import.meta.env.VITE_ACL_ENABLE === "false") return true;
  if (roleName === "SUPER_ADMIN") return true;
  if (!grantedPermissions?.length) return false;

  return permissions.some(permission =>
    grantedPermissions.some(item =>
      item.apiPath === permission.apiPath &&
      item.method?.toUpperCase() === permission.method?.toUpperCase() &&
      item.module === permission.module
    )
  );
};

const AccessAny = ({ permissions, children }: { permissions: PermissionDef[]; children: ReactNode }) => {
  const grantedPermissions = useAppSelector(state => state.account.user.role.permissions);
  const roleName = useAppSelector(state => state.account.user.role?.name?.toUpperCase() || "");
  const allow = canAccessAny(grantedPermissions, permissions, roleName);

  return allow ? (
    <>{children}</>
  ) : (
    <Result
      status="403"
      title="Truy cập bị từ chối"
      subTitle="Xin lỗi, bạn không có quyền hạn (permission) truy cập thông tin này"
    />
  );
};

const PeriodProgressRedirect = () => {
  const { periodId } = useParams<{ periodId: string }>();
  return <Navigate to={`/admin/evaluation/periods?progressPeriodId=${periodId}`} replace />;
};

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

  const router = useMemo(() => createBrowserRouter([
    {
      path: PATHS.HOME,
      element: (
        <LayoutApp>
          <LayoutClient />
        </LayoutApp>
      ),
      errorElement: <RouteErrorFallback />,
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
      errorElement: <RouteErrorFallback />,
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
          path: "overview",
          element: (
            <ProtectedRoute>
              <WelcomePage />
            </ProtectedRoute>
          ),
        },
        // Thêm route vào children của PATHS.ADMIN.ROOT
        {
          path: "department-profiles",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.DASHBOARD.GET_DEPARTMENT_COMPLETENESS}>
                <DepartmentProfilePage />
              </Access>
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
          path: "/admin/departments/mission-console",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.DEPARTMENT_OBJECTIVES.VIEW}>
                <MissionConsolePage />
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
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.SECTIONS.GET_PAGINATE}>
                <SectionPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.POSITION_LEVEL,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.POSITION_LEVELS.GET_PAGINATE}>
                <PositionLevelPage />
              </Access>
            </ProtectedRoute>
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
          path: "accounting-dossiers/qr/:token",
          element: (
            <ProtectedRoute>
              <DossierQrDetail />
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
          path: PATHS.ADMIN.ACCOUNTING_WORKFLOW_TEMPLATES,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.ACCOUNTING_WORKFLOWS.VIEW}>
                <WorkflowTemplatesPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: PATHS.ADMIN.ACCOUNTING_DELEGATIONS,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.ACCOUNTING_DELEGATIONS.VIEW}>
                <DelegationsPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: "/admin/accounting-reports",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.GET_DASHBOARD_SUMMARY}>
                <AccountingReportsPage />
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
                <TemplatePage />
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
        {
          path: PATHS.ADMIN.EVALUATION_PERIOD_PROGRESS,
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PERIODS}>
                <PeriodProgressRedirect />
              </Access>
            </ProtectedRoute>
          ),
        },

        // ✅ EVALUATION — PROCESS (Gộp 3 tab)
        {
          path: "evaluation/process",
          element: (
            <ProtectedRoute>
              <AccessAny
                permissions={[
                  ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS,
                  ALL_PERMISSIONS.EVALUATION.GET_PENDING_MANAGER_RECORDS,
                  ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS,
                  ALL_PERMISSIONS.EVALUATION.GET_MANAGER_HISTORY,
                  ALL_PERMISSIONS.EVALUATION.GET_APPROVAL_HISTORY,
                ]}
              >
                <EvaluationProcessPage />
              </AccessAny>
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION — NHÂN VIÊN
        {
          path: "evaluation/my-records",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS}>
                <MyEvaluationPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: "evaluation/my-records/:id",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_RECORD_BY_ID}>
                <MyEvaluationDetailPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION — QUẢN LÝ
        {
          path: "evaluation/manager/pending",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PENDING_MANAGER_RECORDS}>
                <PendingManagerEvaluationPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: "evaluation/manager/records/:id",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_RECORD_BY_ID}>
                <EvaluationDetailRouteRedirect role="MANAGER" />
              </Access>
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION — APPROVAL
        {
          path: "evaluation/approval/pending",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS}>
                <PendingApprovalPage />
              </Access>
            </ProtectedRoute>
          ),
        },
        {
          path: "evaluation/approval/records/:id",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_RECORD_BY_ID}>
                <EvaluationDetailRouteRedirect role="APPROVER" />
              </Access>
            </ProtectedRoute>
          ),
        },
        // ✅ EVALUATION — TỔNG HỢP (SUMMARY)
        {
          path: "evaluation/summary",
          element: (
            <ProtectedRoute>
              <Access permission={ALL_PERMISSIONS.EVALUATION.GET_COMPLETED_SUMMARY}>
                <CompletedEvaluationsPage />
              </Access>
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
      errorElement: <RouteErrorFallback />,
    },
    { path: PATHS.LOGIN, element: <LoginPage />, errorElement: <RouteErrorFallback /> },
    { path: PATHS.FORGOT_PASSWORD, element: <ForgotPassword />, errorElement: <RouteErrorFallback /> },
    { path: PATHS.CONFIRM_RESET_PASSWORD, element: <ConfirmResetPassword />, errorElement: <RouteErrorFallback /> },
    { path: "/public/view/:token", element: <PublicProcedureView />, errorElement: <RouteErrorFallback /> },
    { path: "*", element: <NotFound /> },
  ]), []);

  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
