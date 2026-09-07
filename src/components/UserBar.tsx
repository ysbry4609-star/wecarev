import React from 'react';
import { UserSession, SiteType } from '../types';
import { LogOut, Package, Bell, Moon, Sun, AlertCircle } from 'lucide-react';
import { useWeCareLogo } from '../utils/logoManager';

interface UserBarProps {
  user: UserSession;
  site: SiteType;
  onLogout: () => void;
  onOpenInventory: () => void;
  onOpenEmergency: () => void;
  lowStockCount: number;
  isDark: boolean;
  onToggleDark: () => void;
}

export const UserBar: React.FC<UserBarProps> = ({
  user,
  site,
  onLogout,
  onOpenInventory,
  onOpenEmergency,
  lowStockCount,
  isDark,
  onToggleDark
}) => {
  const isSupervisor = user.role === '14';
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const { logo } = useWeCareLogo();

  const handleLogoutClick = () => {
    if (confirmLogout) {
      onLogout();
    } else {
      setConfirmLogout(true);
      setTimeout(() => setConfirmLogout(false), 3500);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a3d6b] text-white shadow-md px-3 py-2 sm:px-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* User Info & Logo */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={logo}
            alt="WeCare Emblem"
            className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 shrink-0 shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div className="truncate text-xs">
            <div className="font-bold truncate flex items-center gap-1.5">
              <span>{user.name}</span>
              {user.role === '14' && <span className="text-[10px] bg-amber-400/30 text-amber-200 px-1 rounded">مشرف</span>}
            </div>
            <div className="text-[10px] text-blue-200 flex items-center gap-1">
              <span>{user.roleLabel}</span>
              <span>•</span>
              <span className="font-semibold">{site === 'taj' ? 'موقع تاج' : 'موقع سراي'}</span>
            </div>
          </div>
        </div>

        {/* Actions & Inventory Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Inventory Button with notification badge */}
          <button
            onClick={onOpenInventory}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
              lowStockCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 animate-pulse'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="مخزون الأدوية والمستلزمات"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isSupervisor ? 'إدارة المخزون' : 'مخزون الأدوية'}
            </span>
            {lowStockCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-0.5">
                <Bell className="w-2.5 h-2.5" />
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Emergency Alert Button */}
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            title="أرقام المشرفين للحالات الحرجة"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">🚨 طوارئ المشرفين</span>
          </button>

          {/* Dark Mode */}
          <button
            onClick={onToggleDark}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogoutClick}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              confirmLogout
                ? 'bg-red-600 text-white animate-bounce'
                : 'bg-white/10 hover:bg-red-600/80 text-white'
            }`}
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{confirmLogout ? 'تأكيد الخروج؟' : 'خروج'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
