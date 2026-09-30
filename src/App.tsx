import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MenuProvider } from './context/MenuContext';
import { CustomerProvider } from './context/CustomerContext';
import { CannedResponseProvider } from './context/CannedResponseContext';
import { BotProvider } from './context/BotContext';
import { LayoutProvider } from './context/LayoutContext';
import { AppLayout } from './components/layout/AppLayout';
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
import { PlaceholderPage } from './pages/PlaceholderPage';

// Protected Route Component
const ProtectedLayout: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <MenuProvider>
          <CustomerProvider>
            <CannedResponseProvider>
              <BotProvider>
                <BrowserRouter>
                  <LayoutProvider>
                    <Routes>
                      {/* Public Route */}
                      <Route path="/login" element={<LoginPage />} />

                      {/* Protected Routes */}
                      <Route path="/" element={<ProtectedLayout />}>
                        <Route index element={<Navigate to="/customers" replace />} />
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
                        <Route path="voice" element={<PlaceholderPage />} />
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
              </BotProvider>
            </CannedResponseProvider>
          </CustomerProvider>
        </MenuProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
