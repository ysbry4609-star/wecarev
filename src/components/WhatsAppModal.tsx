import React from 'react';
import { X, Copy, Share2, Check } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportText: string;
  onToast: (msg: string) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  reportText,
  onToast
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    onToast('✅ تم نسخ التقرير — الصقه في جروب الواتساب');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="bg-gradient-to-r from-[#075e54] to-[#128c7e] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-sm">💬 التقرير جاهز للواتساب</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
          <div className="bg-[#f0faf8] p-4 rounded-xl border border-[#128c7e]/30 shadow-xs font-mono text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
            {reportText}
          </div>
        </div>

        <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-[#075e54] to-[#128c7e] hover:opacity-95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            {copied ? 'تم النسخ بنجاح' : '📋 نسخ التقرير'}
          </button>
          <button
            onClick={handleOpenWhatsApp}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            فتح تطبيق واتساب
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
