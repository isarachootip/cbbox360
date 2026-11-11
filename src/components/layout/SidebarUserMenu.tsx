import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface SidebarUserMenuProps {
  isCollapsed?: boolean;
}

export const SidebarUserMenu: React.FC<SidebarUserMenuProps> = ({ isCollapsed = false }) => {
  const navigate = useNavigate();
  const { currentUser, logout, switchUser, users, authMode } = useAuth();
  const { showToast } = useToast();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const displayUser = currentUser || {
    name: 'สมศักดิ์ บริหารระบบ',
    initials: 'SA',
    role: 'sysadmin',
    username: 'sysadmin',
    avatarBg: '#CFE2F8',
  };

  const handleLogout = () => {
    logout();
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    navigate('/login');
  };

  const handleSwitchUser = (username: string) => {
    const success = switchUser(username);
    if (success) {
      showToast(`สลับใช้งานเป็น "${username}" แล้ว`, 'success');
      setIsUserMenuOpen(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-sidebar-border/80 flex-shrink-0 relative">
      <button
        type="button"
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        title={isCollapsed ? `${displayUser.name} (${displayUser.role})` : undefined}
        className={`w-full flex items-center rounded-xl bg-white/70 hover:bg-white border border-sidebar-border/70 transition-all text-left shadow-xs ${
          isCollapsed ? 'justify-center p-1.5' : 'justify-between p-2'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-brand border border-brand/20 flex-shrink-0 shadow-xs"
            style={{ backgroundColor: displayUser.avatarBg || '#CFE2F8' }}
          >
            {displayUser.initials}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-text-primary truncate">
                {displayUser.name}
              </span>
              <span className="text-[11px] font-mono text-brand font-medium truncate">
                {displayUser.role}
              </span>
            </div>
          )}
        </div>
        {!isCollapsed &&
          (isUserMenuOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" />
          ))}
      </button>

      {isUserMenuOpen && (
        <div
          className={`absolute bottom-full mb-2 bg-white border border-border rounded-xl shadow-modal p-2 z-50 space-y-2 ${
            isCollapsed ? 'left-0 w-[236px]' : 'left-0 right-0'
          }`}
        >
          {/* Password-less account switching is a demo convenience; disabled with real authentication. */}
          {authMode === 'demo' && (
            <>
              <div className="text-[11px] font-semibold text-text-secondary px-2 pt-1">
                สลับบัญชีผู้ใช้งาน (Quick Switch):
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => handleSwitchUser(u.username)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        isCurrent
                          ? 'bg-brand-tint text-brand font-semibold'
                          : 'hover:bg-bg-subtle text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: u.avatarBg || '#CFE2F8' }}
                        >
                          {u.initials}
                        </div>
                        <div className="text-left min-w-0">
                          <div className="truncate text-xs font-medium">{u.name}</div>
                          <div className="text-[10px] font-mono text-text-secondary">{u.role}</div>
                        </div>
                      </div>
                      {isCurrent && <UserCheck className="w-3.5 h-3.5 text-brand flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="pt-1.5 border-t border-divider">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
