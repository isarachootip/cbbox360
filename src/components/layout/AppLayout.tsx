import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { GlobalActiveCallBar } from '../telephony/GlobalActiveCallBar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-app antialiased">
      {/* Fixed Left Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <GlobalActiveCallBar />
        <Outlet />
      </main>
    </div>
  );
};
