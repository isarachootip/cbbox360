import React, { useState } from 'react';
import { KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const MIN_LENGTH = 8;
const inputClass =
  'w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand';

/** Shown instead of the app until a seeded/reset account sets its own password. */
export const ForceChangePasswordCard: React.FC = () => {
  const { currentUser, changePassword, logout } = useAuth();
  const { showToast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < MIN_LENGTH) return setError(`รหัสผ่านใหม่ต้องมีอย่างน้อย ${MIN_LENGTH} ตัวอักษร`);
    if (next !== confirm) return setError('ยืนยันรหัสผ่านใหม่ไม่ตรงกัน');
    setIsSaving(true);
    const result = await changePassword(current, next);
    setIsSaving(false);
    if (result.success) showToast('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
    else setError(result.error ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF2FC] via-[#F2F6FB] to-[#E3EEFB] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-xs text-text-secondary">บัญชี {currentUser?.username} ต้องเปลี่ยนรหัสผ่านก่อนเริ่มใช้งาน</p>
          </div>
        </div>
        <input type="password" autoComplete="current-password" className={inputClass} placeholder="รหัสผ่านปัจจุบัน (ชั่วคราว)" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <input type="password" autoComplete="new-password" className={inputClass} placeholder={`รหัสผ่านใหม่ (อย่างน้อย ${MIN_LENGTH} ตัว)`} value={next} onChange={(e) => setNext(e.target.value)} />
        <input type="password" autoComplete="new-password" className={inputClass} placeholder="ยืนยันรหัสผ่านใหม่" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
        <button type="submit" disabled={isSaving} className="w-full py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-bold disabled:opacity-50">
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
        </button>
        <button type="button" onClick={logout} className="w-full text-xs text-text-secondary hover:underline">
          ออกจากระบบ
        </button>
      </form>
    </div>
  );
};
