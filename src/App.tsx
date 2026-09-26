import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { CustomerProvider } from './context/CustomerContext';
import { AppLayout } from './components/layout/AppLayout';
import { Customer360Page } from './pages/Customer360Page';
import { InboxPage } from './pages/InboxPage';
import { PipelinePage } from './pages/PipelinePage';
import { SegmentsPage } from './pages/SegmentsPage';
import { TierLoyaltyPage } from './pages/TierLoyaltyPage';
import { ServiceCasePage } from './pages/ServiceCasePage';
import { CreditSalesPage } from './pages/CreditSalesPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <CustomerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/customers/C00123" replace />} />
              <Route path="customers/:id" element={<Customer360Page />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="segments" element={<SegmentsPage />} />
              <Route path="tiers" element={<TierLoyaltyPage />} />
              <Route path="cases" element={<ServiceCasePage />} />
              <Route path="credit" element={<CreditSalesPage />} />
              
              {/* Placeholders */}
              <Route path="consent" element={<PlaceholderPage />} />
              <Route path="voice" element={<PlaceholderPage />} />
              <Route path="connectors" element={<PlaceholderPage />} />
              <Route path="settings" element={<PlaceholderPage />} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/customers/C00123" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CustomerProvider>
    </ToastProvider>
  );
};

export default App;
