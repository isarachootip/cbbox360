import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuditLogProvider } from './context/AuditLogContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MenuProvider } from './context/MenuContext';
import { CustomerProvider } from './context/CustomerContext';
import { TelephonyProvider } from './context/TelephonyContext';
import { CannedResponseProvider } from './context/CannedResponseContext';
import { BotProvider } from './context/BotContext';
import { LayoutProvider } from './context/LayoutContext';
import { BusinessTemplateProvider } from './context/BusinessTemplateContext';
import { AppLayout } from './components/layout/AppLayout';
import { ForceChangePasswordCard } from './components/auth/ForceChangePasswordCard';
import { LoginPage } from './pages/LoginPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { MenuManagementPage } from './pages/MenuManagementPage';
import { CustomerListPage } from './pages/CustomerListPage';
import { Customer360Page } from './pages/Customer360Page';
import { InboxPage } from './pages/InboxPage';
import { CannedResponsesPage } from './pages/CannedResponsesPage';
import { SettingsPage } from './pages/SettingsPage';
import { PipelinePage } from './pages/PipelinePage';
import { SegmentsPage } from './pages/SegmentsPage';
import { TierLoyaltyPage } from './pages/TierLoyaltyPage';
import { ServiceCasePage } from './pages/ServiceCasePage';
import { CreditSalesPage } from './pages/CreditSalesPage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { CtiScreenPopPage } from './pages/CtiScreenPopPage';
import { VoicePage } from './pages/VoicePage';
import { PlaceholderPage } from './pages/PlaceholderPage';

// Protected Route Component
const ProtectedLayout: React.FC = () => {
  const { currentUser, isAuthLoading, mustChangePassword } = useAuth();
  const location = useLocation();
  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-text-secondary">กำลังตรวจสอบการเข้าสู่ระบบ...</div>;
  }
  if (!currentUser) {
    const requested = `${location.pathname}${location.search}`;
    const target =
      requested && requested !== '/' && !requested.startsWith('/login')
        ? `/login?returnTo=${encodeURIComponent(requested)}`
        : '/login';
    return <Navigate to={target} replace />;
  }
  if (mustChangePassword) {
    return <ForceChangePasswordCard />;
  }
  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuditLogProvider>
        <AuthProvider>
          <MenuProvider>
            <CustomerProvider>
              <TelephonyProvider>
              <CannedResponseProvider>
                <BotProvider>
                  <BusinessTemplateProvider>
                  <BrowserRouter>
                    <LayoutProvider>
                    <Routes>
                      {/* Public Route */}
                      <Route path="/login" element={<LoginPage />} />

                      {/* Protected Routes */}
                      <Route path="/" element={<ProtectedLayout />}>
                        <Route index element={<Navigate to="/customers" replace />} />
                        <Route path="crm" element={<CtiScreenPopPage />} />
                        <Route path="customers" element={<CustomerListPage />} />
                        <Route path="customers/:id" element={<Customer360Page />} />
                        <Route path="inbox" element={<InboxPage />} />
                        <Route path="canned-responses" element={<CannedResponsesPage />} />
                        <Route path="pipeline" element={<PipelinePage />} />
                        <Route path="segments" element={<SegmentsPage />} />
                        <Route path="tiers" element={<TierLoyaltyPage />} />
                        <Route path="cases" element={<ServiceCasePage />} />
                        <Route path="credit" element={<CreditSalesPage />} />
                        <Route path="users" element={<UserManagementPage />} />
                        <Route path="menus" element={<MenuManagementPage />} />
                        
                        {/* Placeholders & Tools */}
                        <Route path="consent" element={<PlaceholderPage />} />
                        <Route path="voice" element={<VoicePage />} />
                        <Route path="connectors" element={<ConnectorsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="settings/bot" element={<SettingsPage />} />
                        <Route path="settings/canned-responses" element={<CannedResponsesPage />} />
                        <Route path="settings/users" element={<UserManagementPage />} />
                        <Route path="settings/menus" element={<MenuManagementPage />} />
                        <Route path="settings/connectors" element={<ConnectorsPage />} />

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/customers/C00123" replace />} />
                      </Route>
                    </Routes>
                  </LayoutProvider>
                </BrowserRouter>
                  </BusinessTemplateProvider>
              </BotProvider>
            </CannedResponseProvider>
            </TelephonyProvider>
          </CustomerProvider>
        </MenuProvider>
      </AuthProvider>
      </AuditLogProvider>
    </ToastProvider>
  );
};

export default App;
