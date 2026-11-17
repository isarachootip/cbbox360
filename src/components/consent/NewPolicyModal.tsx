import React, { useId, useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../common/Modal';

interface NewPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedVersion: string;
  onSubmit: (input: {
    version: string;
    title: string;
    effectiveDate: string;
    summary: string;
    lineConsentMessage: string;
  }) => void;
}

export const NewPolicyModal: React.FC<NewPolicyModalProps> = ({
  isOpen,
  onClose,
  suggestedVersion,
  onSubmit,
}) => {
  const formId = useId();
  const [version, setVersion] = useState(suggestedVersion);
  const [title, setTitle] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [summary, setSummary] = useState('');
  const [lineConsentMessage, setLineConsentMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setVersion(suggestedVersion);
    setTitle('ประกาศความเป็นส่วนตัวและความยินยอมลูกค้า CusBox360');
    setSummary('');
    setLineConsentMessage(
      `เรียนคุณลูกค้า กรุณาตรวจสอบและยืนยันความยินยอมข้อมูลส่วนบุคคล (${suggestedVersion}) ได้ที่: https://liff.line.me/cb360-pdpa-consent`
    );
    setError('');
  }, [isOpen, suggestedVersion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !title.trim() || !summary.trim()) {
      setError('กรุณากรอกเวอร์ชัน หัวข้อนโยบาย และสรุปสาระสำคัญให้ครบถ้วน');
      return;
    }
    onSubmit({ version, title, effectiveDate, summary, lineConsentMessage });
    onClose();
  };

  const inputClass =
    'w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ประกาศใช้นโยบายความเป็นส่วนตัว (PDPA Policy) เวอร์ชันใหม่"
      subtitle="เมื่อประกาศใช้ เวอร์ชันนี้จะถูกตั้งเป็นฉบับบังคับใช้ปัจจุบันสำหรับการบันทึกความยินยอมใหม่"
      maxWidth="2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form={formId}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-lg text-sm font-semibold shadow-card transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>ประกาศใช้เวอร์ชันใหม่</span>
          </button>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-3 rounded-lg bg-danger-bg border border-rose-200 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              รหัสเวอร์ชัน <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="เช่น v2.2"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              วันที่มีผลบังคับใช้ <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            ชื่อประกาศนโยบาย <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            สรุปวัตถุประสงค์และขอบเขตที่ปรับปรุง <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="อธิบายขอบเขตการเก็บ ใช้ หรือเปิดเผยข้อมูลที่ปรับปรุงในเวอร์ชันนี้..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            ข้อความและลิงก์ขอความยินยอมสำหรับส่งผ่านแชท LINE / Facebook
          </label>
          <textarea
            rows={2}
            value={lineConsentMessage}
            onChange={(e) => setLineConsentMessage(e.target.value)}
            className={`${inputClass} font-mono text-xs resize-none`}
          />
        </div>
      </form>
    </Modal>
  );
};
