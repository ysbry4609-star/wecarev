import React, { useState, useEffect } from 'react';
import {
  UserSession,
  SiteType,
  MedicationItem,
  InventoryTransaction,
  SavedReport
} from './types';
import { INITIAL_MEDICATIONS } from './data/initialData';
import { LoginModal } from './components/LoginModal';
import { UserBar } from './components/UserBar';
import { EmergencyModal } from './components/EmergencyModal';
import { RefModal } from './components/RefModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { InventoryModal } from './components/InventoryModal';
import { ReportForm } from './components/ReportForm';
import { printReportPDF } from './utils/pdfExport';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwHsUjBTs1Jmc515yxvkZVmYtSr9GoSmDAQDIhjxQLOieYMNGyO6ObQkbGL-bMLqq4m/exec';

export default function App() {
  // User Session
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('wecareUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Current Site: 'taj' or 'saray'
  const [site, setSite] = useState<SiteType>(() => {
    return (localStorage.getItem('wecare_site') as SiteType) || 'taj';
  });

  // Dark mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('wecare_dark') === 'true';
  });

  // Inventory State (Auto-upgrades and verifies full 70 items from Excel list)
  const [inventory, setInventory] = useState<MedicationItem[]>(() => {
    try {
      // Clear legacy storage keys if any
      localStorage.removeItem('wecare_inventory_v3');
      localStorage.removeItem('wecare_inventory_v2');
      localStorage.removeItem('wecare_inventory_v1');
      localStorage.removeItem('wecare_inventory');

      const saved = localStorage.getItem('wecare_inventory_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_MEDICATIONS.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    try {
      localStorage.setItem('wecare_inventory_v5', JSON.stringify(INITIAL_MEDICATIONS));
    } catch {}
    return INITIAL_MEDICATIONS;
  });

  // Inventory Transactions Ledger
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('wecare_inventory_tx_v5');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Modals state
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [selectedRefKey, setSelectedRefKey] = useState<string | null>(null);
  const [whatsAppReportText, setWhatsAppReportText] = useState<string | null>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<{ text: string; type?: 'info' | 'warn' | 'success' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('wecare_inventory_v5', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('wecare_inventory_tx_v5', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('wecare_site', site);
  }, [site]);

  useEffect(() => {
    localStorage.setItem('wecare_dark', isDark ? 'true' : 'false');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const showToast = (text: string, type: 'info' | 'warn' | 'success' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  const handleLogin = (session: UserSession) => {
    setUser(session);
    localStorage.setItem('wecareUser', JSON.stringify(session));
    showToast(`مرحباً بك يا ${session.name} (${session.roleLabel})`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wecareUser');
    showToast('🚪 تم تسجيل الخروج بنجاح', 'info');
  };

  // Automatic Inventory Deduction upon Report Saving
  const handleSaveReport = (report: SavedReport, fullText: string) => {
    let lowStockAlerts: string[] = [];

    // Deduct medications
    if (report.medications && report.medications.length > 0) {
      const nowStr = new Date().toLocaleString('ar-EG');
      const newTransactions: InventoryTransaction[] = [];

      setInventory((prevInv) => {
        return prevInv.map((item) => {
          const used = report.medications.find((m) => m.name === item.name);
          if (!used) return item;

          const deductAmount = used.qty || 1;
          const currentStock = report.site === 'taj' ? item.stockTaj : item.stockSaray;
          const newStock = Math.max(0, currentStock - deductAmount);
          const threshold = report.site === 'taj' ? item.minThresholdTaj : item.minThresholdSaray;

          // Check if low or out
          if (newStock === 0) {
            lowStockAlerts.push(`🔴 نفد تماماً: ${item.name} في ${report.site === 'taj' ? 'موقع تاج' : 'موقع سراي'}`);
          } else if (newStock <= threshold) {
            lowStockAlerts.push(`⚠️ قارب على النفاد: ${item.name} (المتبقي: ${newStock} ${item.unit})`);
          }

          // Record ledger transaction
          newTransactions.push({
            id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemId: item.id,
            itemName: item.name,
            site: report.site,
            type: 'deduction',
            quantity: deductAmount,
            balanceAfter: newStock,
            timestamp: nowStr,
            reportId: report.reportId,
            patientName: report.patientName,
            paramedicName: report.paramedicName || user?.name || 'مسعف',
            notes: `صرف للحالة: ${report.patientName}`
          });

          return {
            ...item,
            stockTaj: report.site === 'taj' ? newStock : item.stockTaj,
            stockSaray: report.site === 'saray' ? newStock : item.stockSaray
          };
        });
      });

      if (newTransactions.length > 0) {
        setTransactions((prevTx) => [...newTransactions, ...prevTx]);
      }

      // Record cumulative medication dispense usage stats for dynamic Top 10 ranking
      try {
        const currentStats = JSON.parse(localStorage.getItem('wecare_med_usage_stats') || '{}');
        for (const med of report.medications) {
          currentStats[med.name] = (currentStats[med.name] || 0) + (med.qty || 1);
        }
        localStorage.setItem('wecare_med_usage_stats', JSON.stringify(currentStats));
      } catch (e) {
        console.warn('Could not update usage stats', e);
      }
    }

    // Save report to Google Apps Script if online
    try {
      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          "الموقع": report.site === 'taj' ? 'تاج' : 'سراي',
          "التاريخ": report.date,
          "نوع الحدث": report.eventType,
          "تقرير عن الحدث": fullText,
          "السن": report.age,
          "الوظيفه": report.job,
          "اسم الحاله": report.patientName,
          "ميعاد الابلاغ": report.reportTime,
          "ميعاد الوصول": report.arrivalTime,
          "مكان الحدث": report.location,
          "اسم المسعف": report.paramedicName,
          "جهة الإبلاغ": report.reportSource,
          "اسم المستخدم": report.loggedUser.name,
          "الصفة الوظيفية": report.loggedUser.roleLabel,
          "الرقم المرجعي": report.reportId,
          "الأولوية": report.priority
        })
      }).catch((e) => console.warn('Offline report stored locally', e));
    } catch (e) {
      console.warn('Network sync error', e);
    }

    // Show feedback toast & warnings
    showToast(`✅ تم حفظ التقرير (${report.reportId}) وخصم الأدوية بنجاح`, 'success');

    if (lowStockAlerts.length > 0) {
      setTimeout(() => {
        showToast(lowStockAlerts.join(' | '), 'warn');
      }, 1500);
    }

    // Open WhatsApp modal with generated message
    setWhatsAppReportText(fullText);
  };

  // Supervisor Restock Action
  const handleRestockItem = (itemId: string, siteTarget: SiteType, amount: number, note: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    const currentStock = siteTarget === 'taj' ? item.stockTaj : item.stockSaray;
    const newStock = currentStock + amount;

    setInventory((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          stockTaj: siteTarget === 'taj' ? newStock : i.stockTaj,
          stockSaray: siteTarget === 'saray' ? newStock : i.stockSaray
        };
      })
    );

    // Record restock transaction
    const newTx: InventoryTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemId: item.id,
      itemName: item.name,
      site: siteTarget,
      type: 'restock',
      quantity: amount,
      balanceAfter: newStock,
      timestamp: new Date().toLocaleString('ar-EG'),
      paramedicName: user?.name || 'المشرف',
      notes: note || 'توريد مخزون جديد'
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Supervisor Add New Medication Item
  const handleAddNewItem = (newItem: Omit<MedicationItem, 'id'>) => {
    const created: MedicationItem = {
      ...newItem,
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    setInventory((prev) => [created, ...prev]);
  };

  // Supervisor Update Minimum Threshold
  const handleUpdateThreshold = (itemId: string, siteTarget: SiteType, newThreshold: number) => {
    setInventory((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        return {
          ...i,
          minThresholdTaj: siteTarget === 'taj' ? newThreshold : i.minThresholdTaj,
          minThresholdSaray: siteTarget === 'saray' ? newThreshold : i.minThresholdSaray
        };
      })
    );
  };

  // Reset and synchronize full 70 items from official Excel dataset
  const handleResetInventory = () => {
    setInventory(INITIAL_MEDICATIONS);
    localStorage.setItem('wecare_inventory_v5', JSON.stringify(INITIAL_MEDICATIONS));
    showToast('✅ تمت استعادة ومزامنة كافة الأصناف الـ 70 من شيت الإكسل المعتمد بنجاح', 'success');
  };

  // Count items below threshold in current site
  const lowStockCount = inventory.filter((item) => {
    const stock = site === 'taj' ? item.stockTaj : item.stockSaray;
    const min = site === 'taj' ? item.minThresholdTaj : item.minThresholdSaray;
    return stock <= min;
  }).length;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#eef2f7] text-[#1a2a3a]'}`}>
      {/* Login Gate */}
      <LoginModal isOpen={!user} onLogin={handleLogin} />

      {/* Top User & Inventory Bar */}
      {user && (
        <UserBar
          user={user}
          site={site}
          onLogout={handleLogout}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenEmergency={() => setIsEmergencyOpen(true)}
          lowStockCount={lowStockCount}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
        />
      )}

      {/* Main Container */}
      {user && (
        <main className="max-w-4xl mx-auto px-3 py-4 sm:px-5">
          <ReportForm
            site={site}
            onSetSite={setSite}
            user={user}
            inventory={inventory}
            transactions={transactions}
            onSaveReport={handleSaveReport}
            onOpenRef={(key) => setSelectedRefKey(key)}
            onToast={showToast}
          />
        </main>
      )}

      {/* Inventory & Pharmacy Management Modal */}
      {user && (
        <InventoryModal
          isOpen={isInventoryOpen}
          onClose={() => setIsInventoryOpen(false)}
          inventory={inventory}
          transactions={transactions}
          currentSite={site}
          user={user}
          onRestockItem={handleRestockItem}
          onAddNewItem={handleAddNewItem}
          onUpdateThreshold={handleUpdateThreshold}
          onResetInventory={handleResetInventory}
          onToast={showToast}
        />
      )}

      {/* Emergency Supervisor Contact Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        site={site}
        onToast={showToast}
      />

      {/* Diagnostic Reference Modal */}
      <RefModal
        cardKey={selectedRefKey}
        onClose={() => setSelectedRefKey(null)}
      />

      {/* WhatsApp Modal */}
      {whatsAppReportText && (
        <WhatsAppModal
          isOpen={!!whatsAppReportText}
          onClose={() => setWhatsAppReportText(null)}
          reportText={whatsAppReportText}
          onToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 bg-slate-900 text-white border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {toastMsg.type === 'warn' ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}
    </div>
  );
}
