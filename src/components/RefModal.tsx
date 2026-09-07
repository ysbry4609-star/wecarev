import React from 'react';
import { REF_CARDS_DATA } from '../data/initialData';
import { X, BookOpen } from 'lucide-react';

interface RefModalProps {
  cardKey: string | null;
  onClose: () => void;
}

export const RefModal: React.FC<RefModalProps> = ({ cardKey, onClose }) => {
  if (!cardKey || !REF_CARDS_DATA[cardKey]) return null;
  const card = REF_CARDS_DATA[cardKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="bg-gradient-to-r from-[#a80000] to-[#e53935] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm">{card.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-red-50/40">
          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {card.body}
          </div>
        </div>

        <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            إغلاق المرجع
          </button>
        </div>
      </div>
    </div>
  );
};
