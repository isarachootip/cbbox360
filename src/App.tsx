import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { Customer360Page } from './pages/Customer360Page';
import { InboxPage } from './pages/InboxPage';
import { PipelinePage } from './pages/PipelinePage';
import { SegmentsPage } from './pages/SegmentsPage';
import { TierLoyaltyPage } from './pages/TierLoyaltyPage';
import { ServiceCasePage } from './pages/ServiceCasePage';
import { CreditSalesPage } from './pages/CreditSalesPage';
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
        <CustomerProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedLayout />}>
                <Route index element={<Navigate to="/customers/C00123" replace />} />
                <Route path="customers/:id" element={<Customer360Page />} />
                <Route path="inbox" element={<InboxPage />} />
                <Route path="pipeline" element={<PipelinePage />} />
                <Route path="segments" element={<SegmentsPage />} />
                <Route path="tiers" element={<TierLoyaltyPage />} />
                <Route path="cases" element={<ServiceCasePage />} />
                <Route path="credit" element={<CreditSalesPage />} />
                <Route path="users" element={<UserManagementPage />} />
                
                {/* Placeholders */}
                <Route path="consent" element={<PlaceholderPage />} />
                <Route path="voice" element={<PlaceholderPage />} />
                <Route path="connectors" element={<PlaceholderPage />} />
                <Route path="settings" element={<PlaceholderPage />} />
                <Route path="settings/users" element={<UserManagementPage />} />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/customers/C00123" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CustomerProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
