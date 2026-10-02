import React, { useState, useRef, useEffect } from 'react';
import { Lock, CheckCircle2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { verifyTotpCode } from '../../utils/totp';

interface TwoFactorVerifyCardProps {
  username: string;
  secret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorVerifyCard: React.FC<TwoFactorVerifyCardProps> = ({
  username,
  secret,
  onSuccess,
  onCancel,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric characters
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const char = clean.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setErrorMsg('');

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setDigits(next);
    setErrorMsg('');

    const targetFocus = Math.min(pasted.length, 5);
    inputRefs.current[targetFocus]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = digits.join('');
    if (token.length !== 6) {
      setErrorMsg('กรุณากรอกรหัส 6 หลักให้ครบถ้วน');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const isValid = await verifyTotpCode(token, secret);
      if (isValid) {
        onSuccess();
      } else {
        setErrorMsg('รหัสความปลอดภัยไม่ถูกต้อง หรือหมดเวลา กรุณาลองใหม่');
      }
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบรหัส');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border/80 p-8 md:p-10 flex flex-col items-center text-center animate-in fade-in duration-300">
      {/* Top Padlock Icon with soft cyan/blue shadow */}
      <div className="w-16 h-16 rounded-2xl bg-white border border-brand/20 shadow-md shadow-brand/10 flex items-center justify-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1F6FD1] to-[#3B82F6] flex items-center justify-center text-white shadow-inner">
          <Lock className="w-6 h-6 stroke-[2.5]" />
        </div>
      </div>

      {/* Screen Title */}
      <h1 className="text-2xl font-black text-text-primary tracking-tight">Two-Factor Auth</h1>

      {/* Status Indicator compliant with CB360 Dot standard */}
      <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand">
        <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
        <span>VERIFICATION REQUIRED</span>
      </div>

      {/* Security Check Section */}
      <div className="mt-6 mb-2">
        <h2 className="text-base font-bold text-text-primary">Security Check</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-[280px]">
          Please enter the 6-digit code from your Authenticator app
        </p>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="w-full mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 6 Digit Verification Input Boxes */}
      <form onSubmit={handleVerify} className="w-full mt-6">
        <div className="mb-2 text-xs font-semibold text-text-secondary text-center">
          Verification Code
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              placeholder="0"
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-[#F4F8FD] border transition-all outline-none ${
                digit
                  ? 'border-brand text-text-primary bg-white ring-2 ring-brand/10'
                  : 'border-border text-slate-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isVerifying || digits.join('').length !== 6}
          className="w-full mt-6 py-3.5 bg-brand hover:bg-brand-hover disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>กำลังตรวจสอบรหัส...</span>
            </>
          ) : (
            <>
              <span className="tracking-wide">VERIFY & ACCESS</span>
              <CheckCircle2 className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Return to Sign in */}
      <button
        type="button"
        onClick={onCancel}
        className="mt-5 text-xs font-semibold text-brand hover:text-brand-hover flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Sign In</span>
      </button>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-divider w-full text-[11px] text-text-secondary">
        © 2026 CustBox360 Enterprise. Secured Access Only.
      </div>
    </div>
  );
};
