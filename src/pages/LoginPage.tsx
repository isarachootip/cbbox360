import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserAccount } from '../types';
import { TwoFactorVerifyCard } from '../components/auth/TwoFactorVerifyCard';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, completeTwoFactorLogin } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorPendingUser, setTwoFactorPendingUser] = useState<UserAccount | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = login(username, password);
      setIsLoading(false);

      if (result.success) {
        showToast(`ยินดีต้อนรับเข้าสู่ระบบ CusBox360`, 'success');
        navigate('/customers/C00123');
      } else if (result.requireTwoFactor && result.user) {
        setTwoFactorPendingUser(result.user);
      } else {
        setErrorMessage(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    }, 300);
  };

  if (twoFactorPendingUser && twoFactorPendingUser.twoFactorSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EAF2FC] via-[#F2F6FB] to-[#E3EEFB] flex items-center justify-center p-4 select-none font-sans">
        <TwoFactorVerifyCard
          username={twoFactorPendingUser.username}
          secret={twoFactorPendingUser.twoFactorSecret}
          onSuccess={() => {
            completeTwoFactorLogin(twoFactorPendingUser);
            showToast('ยืนยันตัวตน 2FA สำเร็จ ยินดีต้อนรับเข้าสู่ระบบ', 'success');
            navigate('/customers/C00123');
          }}
          onCancel={() => {
            setTwoFactorPendingUser(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF2FC] via-[#F2F6FB] to-[#E3EEFB] flex items-center justify-center p-4 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border overflow-hidden p-8 md:p-10 flex flex-col justify-between">
        <div>
          {/* Framed Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
              <img
                src="/logo.png"
                alt="CustBox360 Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-2xl text-[#0F2B4D] tracking-tight block leading-none">
                CustBox360
              </span>
              <span className="text-[11px] text-sidebar-label tracking-wide font-medium mt-0.5 block">
                Customer Data Platform & Activity Plug-ins
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-text-primary">เข้าสู่ระบบ (Sign In)</h1>
            <p className="text-xs text-text-secondary mt-1">
              กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าใช้งานแพลตฟอร์ม CDP
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-danger-bg border border-danger-border text-danger-text text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                ชื่อผู้ใช้ (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-text-primary">
                  รหัสผ่าน (Password)
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>{isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="mt-8 pt-4 border-t border-divider text-[11px] text-text-secondary flex items-center justify-between">
          <span>© 2026 CusBox360 Thailand</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PDPA Compliant</span>
          </span>
        </div>
      </div>
    </div>
  );
};
