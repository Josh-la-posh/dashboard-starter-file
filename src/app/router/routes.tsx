import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import RootRedirect from "./RootRedirect";
import ProtectedRoute, { UnauthOnly } from "./ProtectedRoute";
import LoadingFallback from "./LoadingFallback";
import AppShell from "../layouts/AppShell";
import NotFound from "../../components/system/NotFound";
import MerchantLayout from "../../features/merchants/pages/MerchantLayout";
import TransactionsPage from "../../features/transactions/pages/Transactionpage";
import SettingsLayout from "../../features/settings/SettingsLayout";
import ProfilePage from "../../features/settings/pages/ProfilePage";
import BrandingPage from "../../features/settings/pages/BrandingPage";
import SecurityPage from "../../features/settings/pages/SecurityPage";
import WebhooksPage from "../../features/settings/pages/WebhooksPage";
import UserManagementPage from "../../features/settings/pages/UserPage";
import AuditLogsPage from "../../features/settings/pages/AuditLogsPage";
import BillingPage from "../../features/settings/pages/BillingPage";
import CompliancePage from "../../features/compliance/pages/CompliancePage";

const Login = React.lazy(() => import("../../features/auth/pages/Login"));
const Register = React.lazy(() => import("../../features/auth/pages/Register"));
const ForgotPassword = React.lazy(() => import("../../features/auth/pages/ForgotPassword"));
const VerifyEmail = React.lazy(() => import("../../features/auth/pages/VerifyEmail"));
const RegisterSuccess = React.lazy(() => import("../../features/auth/pages/RegisterSuccess"));
const ResetPassword = React.lazy(() => import("../../features/auth/pages/ResetPassword"));

const Dashboard = React.lazy(() => Promise.resolve({ default: () => <div className="p-6">Welcome to Dashboard</div> }));

const MerchantProfile = React.lazy(() => Promise.resolve({ default: () => <div>Profile Content</div> }));
const MerchantDocuments = React.lazy(() => Promise.resolve({ default: () => <div>Documents Content</div> }));
const MerchantCredentials = React.lazy(() => Promise.resolve({ default: () => <div>Credentials Content</div> }));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <UnauthOnly />,
    children: [
  { index: true, element: <RootRedirect /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "register/success", element: <RegisterSuccess /> },
    ]
  },

  // Protected app
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { path: "dashboard", element: (
          <Suspense fallback={<LoadingFallback />}>
            <AppShell>
              <Dashboard />
            </AppShell>
          </Suspense>
        ) },
      { path: "merchants", element: (
          <Suspense fallback={<LoadingFallback />}>
            <AppShell>
              <MerchantLayout />
            </AppShell>
          </Suspense>
        ),
        children: [
          { path: "profile", element: <MerchantProfile /> },
          { path: "documents", element: <MerchantDocuments /> },
          { path: "credentials", element: <MerchantCredentials /> }
        ]
      },      
      { path: "compliance", element: (
          <Suspense fallback={<LoadingFallback />}>
            <AppShell>
              <CompliancePage />
            </AppShell>
          </Suspense>
        ) },
      { path: "transactions", element: (
          <Suspense fallback={<LoadingFallback />}>
            <AppShell>
              <TransactionsPage />
            </AppShell>
          </Suspense>
        ) },
      {
        path: "settings", element: (
          <Suspense fallback={<LoadingFallback />}>
            <AppShell>
              <SettingsLayout />
            </AppShell>
          </Suspense>
        ),
        children: [
          { path: "profile", element: <ProfilePage /> },
          { path: "branding", element: <BrandingPage /> },
          { path: "webhooks", element: <WebhooksPage /> },
          { path: "users", element: <UserManagementPage /> },
          { path: "security", element: <SecurityPage /> },
          { path: "billing", element: <BillingPage /> },
          { path: "audit-logs", element: <AuditLogsPage /> },
        ]
      },
      { path: "*", element: (
          <Suspense fallback={<LoadingFallback />}>
            <NotFound />
          </Suspense>
        ) },
    ],
  },
  // Global fallback for any unmatched route (handles both auth/unauth users)
  { path: "*", element: <NotFound /> },
]);

// RootRedirect is located in ./RootRedirect.tsx
