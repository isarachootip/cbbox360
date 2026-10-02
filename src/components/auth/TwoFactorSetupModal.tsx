import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, AlertCircle, Smartphone, KeyRound, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { QrCodeDisplay } from './QrCodeDisplay';
import { generateTotpSecret, generateTotpUri, formatSecretForDisplay, verifyTotpCode } from '../../utils/totp';
import { UserAccount } from '../../types';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onEnrolled: (secret: string) => void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  onClose,
  user,
  onEnrolled,
}) => {
  const [secret, setSecret] = useState('');
  const [testCode, setTestCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showManualKey, setShowManualKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSecret((current) => current || user.twoFactorSecret || generateTotpSecret(20));
      setTestCode('');
      setErrorMsg('');
      setCopied(false);
    } else {
      setSecret('');
      setTestCode('');
      setErrorMsg('');
      setShowManualKey(false);
    }
  }, [isOpen, user.id, user.twoFactorSecret]);

  const totpUri = generateTotpUri(user.username, secret, 'CustBox360');

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = testCode.trim();
    if (clean.length !== 6) {
      setErrorMsg('กรุณากรอกรหัส 6 หลักจากแอป');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const isValid = await verifyTotpCode(clean, secret, 2);
      if (isValid) {
        onEnrolled(secret);
        onClose();
      } else {
        setErrorMsg('รหัส 6 หลักไม่ถูกต้อง กรุณาตรวจสอบรหัสในมือถืออีกครั้ง');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบ');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ตั้งค่า 2-Factor Authentication (Microsoft Authenticator)"
      maxWidth="lg"
    >
      <div className="space-y-5 text-text-primary text-xs">
        {/* Step 1: Instruction banner */}
        <div className="p-3.5 bg-[#F4F8FD] rounded-xl border border-brand/20 flex gap-3 items-start">
          <Smartphone className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-text-primary">
              ขั้นตอนที่ 1: เปิดแอป Microsoft Authenticator
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              เปิดแอปในมือถือ กดเครื่องหมาย <strong className="text-brand">+</strong> แล้วเลือกเมนู{' '}
              <strong className="text-text-primary underline">Other (Google, Facebook, etc.)</strong> เพื่อเปิดกล้องสแกน
            </p>
          </div>
        </div>

        {/* Step 2: QR Code Scan */}
        <div className="flex flex-col items-center justify-center p-4 bg-bg-app rounded-2xl border border-border">
          <div className="text-xs font-bold text-text-primary mb-3">
            ขั้นตอนที่ 2: ใช้กล้องในแอปสแกน QR Code นี้
          </div>

          <QrCodeDisplay value={totpUri} size={175} />

          <button
            type="button"
            onClick={() => setShowManualKey(!showManualKey)}
            className="mt-3 text-[11px] font-semibold text-brand hover:underline flex items-center gap-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{showManualKey ? 'ซ่อนรหัสสำหรับกรอกเอง' : 'สแกนไม่ได้? กดที่นี่เพื่อกรอกรหัสด้วยตนเอง (Enter code manually)'}</span>
          </button>

          {showManualKey && (
            <div className="w-full mt-3 p-3 bg-white rounded-xl border border-border text-center space-y-2 animate-in fade-in">
              <span className="text-[10px] text-text-secondary block font-medium">
                Secret Key (รหัสลับ):
              </span>
              <div className="flex items-center justify-center gap-2">
                <code className="px-2.5 py-1 bg-bg-app rounded-lg font-mono font-bold text-xs text-brand tracking-wider select-all">
                  {formatSecretForDisplay(secret)}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="p-1.5 rounded-lg border border-border hover:bg-bg-subtle text-text-secondary hover:text-brand transition-colors"
                  title="คัดลอกรหัส"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Verification form */}
        <form onSubmit={handleVerifyAndSave} className="space-y-3 pt-1">
          <div className="font-bold text-text-primary">
            ขั้นตอนที่ 3: กรอกรหัส 6 หลักจากแอปเพื่อยืนยัน
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="flex-1 px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest bg-bg-app border border-border rounded-xl focus:border-brand focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={isVerifying || testCode.length !== 6}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>ยืนยันและเปิดใช้งาน 2FA</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
