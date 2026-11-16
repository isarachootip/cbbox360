import React from 'react';

interface CustomerContactChannelsFieldsProps {
  phone: string;
  email: string;
  phoneError?: string;
  emailError?: string;
  onPhoneChange: (next: string) => void;
  onEmailChange: (next: string) => void;
}

const INPUT_BASE =
  'w-full px-3.5 py-2.5 border rounded-lg text-sm bg-white text-text-primary transition-all focus:outline-none focus:ring-2';
const NORMAL_BORDER = 'border-border focus:border-brand focus:ring-brand/20';
const ERROR_BORDER = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20';

export const CustomerContactChannelsFields: React.FC<CustomerContactChannelsFieldsProps> = ({
  phone,
  email,
  phoneError,
  emailError,
  onPhoneChange,
  onEmailChange,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        เบอร์โทรหลัก <span className="text-rose-500">*</span>
      </label>
      <input
        type="tel"
        required
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder="08x-xxx-xxxx หรือ 02-xxx-xxxx"
        aria-invalid={Boolean(phoneError)}
        className={`${INPUT_BASE} font-mono ${phoneError ? ERROR_BORDER : NORMAL_BORDER}`}
      />
      {phoneError && <p className="mt-1 text-xs font-medium text-rose-600">{phoneError}</p>}
    </div>
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        อีเมลติดต่อ{' '}
        <span className="text-xs text-text-muted font-normal whitespace-nowrap">(ไม่บังคับ)</span>
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="contact@company.com"
        aria-invalid={Boolean(emailError)}
        className={`${INPUT_BASE} ${emailError ? ERROR_BORDER : NORMAL_BORDER}`}
      />
      {emailError && <p className="mt-1 text-xs font-medium text-rose-600">{emailError}</p>}
    </div>
  </div>
);
