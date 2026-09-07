import React from 'react';
import { SUPERVISOR_CONTACTS } from '../data/initialData';
import { Phone, MessageSquare, Copy, X, AlertTriangle } from 'lucide-react';
import { SiteType } from '../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: SiteType;
  patientName?: string;
  location?: string;
  complaint?: string;
  onToast: (msg: string) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  site,
  patientName,
  location,
  complaint,
  onToast
}) => {
  if (!isOpen) return null;

  const siteLabel = site === 'taj' ? 'موقع تاج' : 'موقع سراي';

  const handleCopy = (phone: string) => {
    navigator.clipboard.writeText(phone);
    onToast(`✅ تم نسخ الرقم: ${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '20' + clean.substring(1);
    else if (!clean.startsWith('20')) clean = '20' + clean;

    const pName = patientName || 'غير محدد';
    const loc = location || 'غير محدد';
    const comp = complaint || 'غير محدد';

    const message = encodeURIComponent(
      `🚨 *تنبيه طوارئ وحالة حرجة من WeCare!*\n\n` +
      `👤 المريض: ${pName}\n` +
      `📍 الموقع: ${loc} (${siteLabel})\n` +
      `🩺 الشكوى: ${comp}\n\n` +
      `يرجى التوجيه والدعم فوراً. شكرًا لفريق WeCare.`
    );
    window.open(`https://wa.me/${clean}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm">📞 أرقام المشرفين للحالات الحرجة</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 bg-slate-50">
          <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
            ⚠️ يرجى استخدام هذا القسم عند الحاجة لدعم إشرافي عاجل أو تحويل حالة طارئة من {siteLabel}.
          </div>

          {SUPERVISOR_CONTACTS.map((sup, idx) => (
            <div
              key={idx}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-800">{sup.name}</span>
                <span className="font-mono text-xs text-slate-500 font-semibold">{sup.phone}</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${sup.phone}`}
                  className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <Phone className="w-3 h-3" />
                  اتصال
                </a>
                <button
                  onClick={() => handleWhatsApp(sup.phone)}
                  className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  واتساب
                </button>
                <button
                  onClick={() => handleCopy(sup.phone)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                  title="نسخ الرقم"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
