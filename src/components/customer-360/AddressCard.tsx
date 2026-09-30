import React from 'react';
import { MapPin, ExternalLink, Edit2, Trash2, Truck } from 'lucide-react';
import { CustomerAddress, AddressType } from '../../types';

interface AddressCardProps {
  address: CustomerAddress;
  onEdit: (addr: CustomerAddress) => void;
  onDelete: (addrId: string, title: string) => void;
  onSetDefaultShipping?: (addrId: string, title: string) => void;
  onSetDefaultBilling?: (addrId: string, title: string) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetDefaultShipping,
  onSetDefaultBilling,
}) => {
  const getAddressTypeBadge = (type: AddressType) => {
    const config: Record<AddressType, { label: string; textClass: string; dotClass: string }> = {
      SHIPPING: { label: 'ที่อยู่จัดส่ง', textClass: 'text-emerald-700', dotClass: 'bg-emerald-500' },
      BILLING: { label: 'ใบกำกับภาษี', textClass: 'text-blue-700', dotClass: 'bg-blue-500' },
      WAREHOUSE: { label: 'โกดัง / คลังสินค้า', textClass: 'text-amber-700', dotClass: 'bg-amber-500' },
      OFFICE: { label: 'สำนักงาน', textClass: 'text-indigo-700', dotClass: 'bg-indigo-500' },
      BRANCH: { label: 'สาขา', textClass: 'text-teal-700', dotClass: 'bg-teal-500' },
      OTHER: { label: 'อื่นๆ', textClass: 'text-slate-600', dotClass: 'bg-slate-400' },
    };
    const c = config[type] || config.OTHER;
    return (
      <span className={`inline-flex items-center gap-1.5 ${c.textClass} text-[11px] font-medium`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dotClass}`} />
        <span>{c.label}</span>
      </span>
    );
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-white hover:border-brand/30 transition-all flex flex-col justify-between shadow-xs">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-divider">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] text-text-primary">{address.title}</span>
              {getAddressTypeBadge(address.type)}
            </div>
            {/* Default Badges */}
            <div className="flex items-center gap-3 mt-1 text-[11px]">
              {address.isDefaultShipping && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>ที่อยู่จัดส่งหลัก</span>
                </span>
              )}
              {address.isDefaultBilling && (
                <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>ใบกำกับภาษีหลัก</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(address)}
              title="แก้ไข"
              className="p-1 text-text-secondary hover:text-brand transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(address.id, address.title)}
              title="ลบ"
              className="p-1 text-text-secondary hover:text-rose-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Address Text */}
        <p className="mt-2.5 text-xs text-text-primary leading-relaxed">
          {address.addressLine1} {address.subdistrict && `ต./แขวง ${address.subdistrict}`} {address.district && `อ./เขต ${address.district}`} {address.province} {address.postalCode}
        </p>

        {/* Receiver Info */}
        {(address.receiverName || address.receiverPhone) && (
          <div className="mt-2 text-[11px] text-text-secondary flex items-center gap-2">
            <span className="font-medium text-text-primary">ผู้รับ: {address.receiverName || '-'}</span>
            <span>•</span>
            <span className="font-mono">{address.receiverPhone || '-'}</span>
          </div>
        )}

        {/* Delivery Constraints */}
        {address.deliveryNotes && (
          <div className="mt-2 text-[11px] text-amber-800 bg-[#FFFDF5] p-2 rounded border border-amber-200/80 flex items-start gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>{address.deliveryNotes}</span>
          </div>
        )}
      </div>

      {/* Bottom Actions & Coordinates */}
      <div className="mt-3 pt-2.5 border-t border-divider flex items-center justify-between text-xs">
        {address.latitude && address.longitude ? (
          <a
            href={`https://maps.google.com/?q=${address.latitude},${address.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand hover:text-brand-hover text-[11px] font-medium"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-mono">{address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        ) : (
          <span className="text-[11px] text-text-secondary">ยังไม่ได้ปักหมุด</span>
        )}

        <div className="flex items-center gap-2">
          {!address.isDefaultShipping && onSetDefaultShipping && (
            <button
              onClick={() => onSetDefaultShipping(address.id, address.title)}
              className="text-[11px] text-text-secondary hover:text-emerald-700 transition-colors"
            >
              ตั้งจัดส่งหลัก
            </button>
          )}
          {!address.isDefaultBilling && onSetDefaultBilling && (
            <button
              onClick={() => onSetDefaultBilling(address.id, address.title)}
              className="text-[11px] text-text-secondary hover:text-blue-700 transition-colors"
            >
              ตั้งใบกำกับหลัก
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
