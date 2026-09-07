import React, { useState, useRef } from 'react';
import { UserSession, UserRole } from '../types';
import { ShieldCheck, User, KeyRound, AlertTriangle, Camera } from 'lucide-react';
import { useWeCareLogo } from '../utils/logoManager';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (user: UserSession) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  '12': 'مسعف عادي',
  '13': 'مسعف متقدم',
  '14': 'مشرف'
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLogin }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { logo, uploadLogo } = useWeCareLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadLogo(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('⚠️ يرجى كتابة الاسم بالكامل.');
      return;
    }
    if (!role) {
      setError('⚠️ يرجى اختيار الصفة الوظيفية.');
      return;
    }
    if (code.trim() !== role) {
      setError('❌ كود التأكيد غير صحيح لهذه الصفة.');
      return;
    }

    const session: UserSession = {
      name: trimmedName,
      role: role as UserRole,
      roleLabel: ROLE_LABELS[role as UserRole]
    };
    onLogin(session);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-[#0a3d6b] via-[#1565a8] to-[#1e88e5] text-white p-6 text-center">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 mx-auto mb-2 bg-white/15 p-1 rounded-2xl flex items-center justify-center shadow-md backdrop-blur-xs relative group cursor-pointer"
            title="انقر لتغيير أو رفع شعار شركتكم الرسمي (PNG/JPG)"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <img
              src={logo}
              alt="WeCare Rescue Emblem"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-bold transition-opacity">
              <Camera className="w-4 h-4 mb-0.5 text-amber-300" />
              <span>تغيير الشعار</span>
            </div>
          </div>
          <h2 className="text-xl font-bold">تسجيل الدخول — WeCare Rescue</h2>
          <p className="text-xs text-blue-100 mt-1">نظام التقارير الطبية الميدانية وإدارة مخزون الطوارئ</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-700" />
              الاسم بالكامل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك الثلاثي"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الصفة الوظيفية <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-hidden transition"
            >
              <option value="">اختر صفتك...</option>
              <option value="12">مسعف عادي</option>
              <option value="13">مسعف متقدم</option>
              <option value="14">مشرف</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-700" />
              كود التأكيد الوظيفي <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="اكتب الكود الخاص بصفتك"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-hidden transition"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#0a3d6b] to-[#1e88e5] hover:opacity-95 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition cursor-pointer text-sm"
            >
              دخول إلى النظام
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Emergency & Critical Care Department — WeCare Company
          </div>
        </form>
      </div>
    </div>
  );
};
