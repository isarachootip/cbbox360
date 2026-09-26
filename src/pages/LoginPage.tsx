import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, switchUser, users } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      } else {
        setErrorMessage(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    }, 300);
  };

  const handleQuickLogin = (uname: string) => {
    const success = switchUser(uname);
    if (success) {
      showToast(`เข้าสู่ระบบด้วยสิทธิ์ ${uname} สำเร็จ`, 'success');
      navigate('/customers/C00123');
    }
  };

  const demoAccounts = [
    { username: 'sysadmin', role: 'sysadmin', label: 'System Admin', color: 'bg-purple-100 text-purple-800 border-purple-200', desc: 'ดูแลระบบสูงสุด + จัดการสิทธิ์/ผู้ใช้' },
    { username: 'admin', role: 'admin', label: 'Admin', color: 'bg-blue-100 text-blue-800 border-blue-200', desc: 'ผู้ดูแลระบบและโมดูล' },
    { username: 'SF_1', role: 'SF_1', label: 'Sales Force 1', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'ทีมขาย / Sales Pipeline' },
    { username: 'SF_2', role: 'SF_2', label: 'Sales Force 2', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', desc: 'บริการลูกค้า / Inbox & Case' },
    { username: 'SF_3', role: 'SF_3', label: 'Sales Force 3', color: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'สินเชื่อ / Credit Sales' },
    { username: 'supervisor', role: 'supervisor', label: 'Supervisor', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', desc: 'หัวหน้างานกำกับดูแล' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF2FC] via-[#F2F6FB] to-[#E3EEFB] flex items-center justify-center p-4 select-none font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-border overflow-hidden grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
        
        {/* ================= LEFT SIDE: LOGIN FORM ================= */}
        <div className="p-8 md:p-10 flex flex-col justify-between">
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
                    placeholder="เช่น sysadmin, admin, SF_1, SF_2, SF_3, supervisor"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-bg-app border border-border rounded-lg focus:outline-none focus:border-brand focus:bg-white font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-text-primary">
                    รหัสผ่าน (Password)
                  </label>
                  <span className="text-[11px] text-brand font-mono">รหัสเริ่มต้น: 1234</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน (1234)"
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

        {/* ================= RIGHT SIDE: QUICK ROLE ACCESS ================= */}
        <div className="bg-bg-subtle p-8 md:p-10 border-t md:border-t-0 md:border-l border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary mb-1">
              <KeyRound className="w-4 h-4 text-brand" />
              <span>บัญชีผู้ใช้สำหรับทดสอบ (Quick Login)</span>
            </div>
            <p className="text-[11px] text-text-secondary mb-4 leading-relaxed">
              คลิกที่บัญชีด้านล่างเพื่อเข้าสู่ระบบตาม Role ได้ทันที (ทุกบัญชีรหัสผ่าน <strong>1234</strong>)
            </p>

            {/* Quick Login Chips List */}
            <div className="space-y-2.5">
              {demoAccounts.map((acc) => (
                <div
                  key={acc.username}
                  onClick={() => handleQuickLogin(acc.username)}
                  className="p-3 bg-white hover:bg-brand-selected rounded-xl border border-border hover:border-brand/40 cursor-pointer transition-all flex items-center justify-between shadow-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-tint text-brand-deep font-bold font-mono text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                      {acc.username.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-text-primary">
                          {acc.username}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${acc.color}`}>
                          {acc.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-text-secondary mt-0.5">
                        {acc.desc}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-white border border-border text-[11px] text-text-secondary">
            💡 <strong>ผู้ดูแลระบบ</strong> สามารถเพิ่ม ลบ แก้ไขผู้ใช้ และเปลี่ยนรหัสผ่านได้ที่เมนู <strong>ตั้งค่า &gt; จัดการผู้ใช้ (User Management)</strong>
          </div>
        </div>

      </div>
    </div>
  );
};
