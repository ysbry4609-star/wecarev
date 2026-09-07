import React, { useState } from 'react';
import { MedicationItem, InventoryTransaction, SiteType, UserSession } from '../types';
import {
  X,
  PlusCircle,
  Package,
  AlertTriangle,
  History,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: MedicationItem[];
  transactions: InventoryTransaction[];
  currentSite: SiteType;
  user: UserSession;
  onRestockItem: (itemId: string, site: SiteType, amount: number, note: string) => void;
  onAddNewItem: (item: Omit<MedicationItem, 'id'>) => void;
  onUpdateThreshold: (itemId: string, site: SiteType, newThreshold: number) => void;
  onResetInventory?: () => void;
  onToast: (msg: string) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  transactions,
  currentSite,
  user,
  onRestockItem,
  onAddNewItem,
  onUpdateThreshold,
  onResetInventory,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'add'>('inventory');
  const [siteFilter, setSiteFilter] = useState<SiteType | 'all'>(currentSite);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Restock modal state
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<MedicationItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [restockSite, setRestockSite] = useState<SiteType>(currentSite);
  const [restockNote, setRestockNote] = useState('');

  // Threshold edit state
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(5);

  // New item state
  const [newItemName, setNewItemName] = useState('');
  const [newItemScientific, setNewItemScientific] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<MedicationItem['category']>('tablets');
  const [newItemUnit, setNewItemUnit] = useState('قرص');
  const [newItemStockTaj, setNewItemStockTaj] = useState(20);
  const [newItemStockSaray, setNewItemStockSaray] = useState(20);
  const [newItemMinTaj, setNewItemMinTaj] = useState(5);
  const [newItemMinSaray, setNewItemMinSaray] = useState(5);

  if (!isOpen) return null;

  const isSupervisor = user.role === '14';

  // Filter items
  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;

    // Check stock status based on site filter
    const stockTaj = item.stockTaj;
    const stockSaray = item.stockSaray;
    const isLowTaj = stockTaj > 0 && stockTaj <= item.minThresholdTaj;
    const isOutTaj = stockTaj <= 0;
    const isLowSaray = stockSaray > 0 && stockSaray <= item.minThresholdSaray;
    const isOutSaray = stockSaray <= 0;

    let matchesStatus = true;
    if (statusFilter === 'low') {
      if (siteFilter === 'taj') matchesStatus = isLowTaj;
      else if (siteFilter === 'saray') matchesStatus = isLowSaray;
      else matchesStatus = isLowTaj || isLowSaray;
    } else if (statusFilter === 'out') {
      if (siteFilter === 'taj') matchesStatus = isOutTaj;
      else if (siteFilter === 'saray') matchesStatus = isOutSaray;
      else matchesStatus = isOutTaj || isOutSaray;
    }

    return matchesSearch && matchesCat && matchesStatus;
  });

  // Calculate low stock items count
  const lowStockItems = inventory.filter((item) => {
    if (siteFilter === 'taj') return item.stockTaj <= item.minThresholdTaj;
    if (siteFilter === 'saray') return item.stockSaray <= item.minThresholdSaray;
    return (
      item.stockTaj <= item.minThresholdTaj ||
      item.stockSaray <= item.minThresholdSaray
    );
  });

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock) return;
    if (restockAmount <= 0) {
      onToast('⚠️ يرجى إدخال كمية صحيحة أكبر من صفر');
      return;
    }
    onRestockItem(selectedItemForRestock.id, restockSite, Number(restockAmount), restockNote);
    setSelectedItemForRestock(null);
    setRestockNote('');
    onToast(`✅ تم إضافة ${restockAmount} ${selectedItemForRestock.unit} إلى مخزون ${restockSite === 'taj' ? 'موقع تاج' : 'موقع سراي'}`);
  };

  const handleSaveThreshold = (item: MedicationItem) => {
    onUpdateThreshold(item.id, siteFilter === 'saray' ? 'saray' : 'taj', tempThreshold);
    setEditingThresholdId(null);
    onToast('✅ تم تحديث حد التنبيه');
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      onToast('⚠️ اكتب اسم الدواء أو المستلزم');
      return;
    }
    onAddNewItem({
      name: newItemName.trim(),
      scientificName: newItemScientific.trim() || newItemName.trim(),
      category: newItemCategory,
      unit: newItemUnit,
      stockTaj: Number(newItemStockTaj) || 0,
      stockSaray: Number(newItemStockSaray) || 0,
      minThresholdTaj: Number(newItemMinTaj) || 5,
      minThresholdSaray: Number(newItemMinSaray) || 5
    });
    setNewItemName('');
    setNewItemScientific('');
    setActiveTab('inventory');
    onToast('✅ تم إضافة الصنف الجديد للمخزون');
  };

  const exportCSV = () => {
    const headers = ['كود الصنف', 'اسم الصنف', 'الاسم العلمي', 'القسم', 'الوحدة', 'رصيد تاج', 'حد تنبيه تاج', 'رصيد سراي', 'حد تنبيه سراي', 'الاستخدام الطبي'];
    const rows = inventory.map((i) => [
      `"${i.code || ''}"`,
      `"${i.name}"`,
      `"${i.scientificName}"`,
      `"${i.categoryLabel || i.category}"`,
      `"${i.unit}"`,
      i.stockTaj,
      i.minThresholdTaj,
      i.stockSaray,
      i.minThresholdSaray,
      `"${i.indication || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wecare_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('📊 تم تصدير ملف المخزون بنجاح');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a3d6b] via-[#1565a8] to-[#1e88e5] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">إدارة مخزون الأدوية والمستلزمات الطبية</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20 text-white">
                  {isSupervisor ? 'صلاحية المشرف الكاملة 👑' : 'وضع العرض للمسعف 🚑'}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                ربط تلقائي مع تقارير الحالات وتنبيهات النواقص الفورية — WeCare
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Low stock alert banner */}
        {lowStockItems.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-2 text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <b>تنبيه مخزون:</b> يوجد <b>{lowStockItems.length}</b> صنف وصل لحد التنبيه الأدنى أو نفد في{' '}
                {siteFilter === 'all' ? 'الموقعين' : siteFilter === 'taj' ? 'موقع تاج' : 'موقع سراي'}.
              </span>
            </div>
            <button
              onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
              className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
            >
              {statusFilter === 'low' ? 'عرض الكل' : 'تصفية النواقص فقط'}
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-2 bg-slate-50 shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
                activeTab === 'inventory'
                  ? 'bg-white text-blue-800 border-blue-600 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              جدول المخزون والأرصدة ({inventory.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
                activeTab === 'history'
                  ? 'bg-white text-blue-800 border-blue-600 shadow-xs'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              سجل الحركات والخصم ({transactions.length})
            </button>
            {isSupervisor && (
              <button
                onClick={() => setActiveTab('add')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'add'
                    ? 'bg-white text-blue-800 border-blue-600 shadow-xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                إضافة صنف جديد
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pb-1.5 flex-wrap">
            {onResetInventory && isSupervisor && (
              <button
                onClick={() => {
                  if (confirm('هل تريد بالتأكيد مزامنة واستعادة كافة الـ 70 صنفاً الأصلية من شيت الإكسل المعتمد؟')) {
                    onResetInventory();
                  }
                }}
                className="px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                title="استرجاع ومزامنة 70 صنفاً طبياً مع كافة التصنيفات (محاليل، جلسات، دهانات، سوائل، مستلزمات)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>مزامنة شيت الإكسل (70 صنف)</span>
              </button>
            )}
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title="تصدير جدول المخزون كملف إكسل / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تصدير إكسل</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Inventory Table */}
        {activeTab === 'inventory' && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 gap-3">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث باسم الدواء أو الصنف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-hidden focus:border-blue-600"
                />
              </div>

              {/* Site selector */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 text-xs">
                <span className="text-[11px] font-bold text-slate-500 mr-1">الموقع:</span>
                <button
                  type="button"
                  onClick={() => setSiteFilter('all')}
                  className={`flex-1 py-1 rounded text-center font-bold text-[11px] cursor-pointer ${
                    siteFilter === 'all' ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setSiteFilter('taj')}
                  className={`flex-1 py-1 rounded text-center font-bold text-[11px] cursor-pointer ${
                    siteFilter === 'taj' ? 'bg-[#0a3d6b] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  تاج
                </button>
                <button
                  type="button"
                  onClick={() => setSiteFilter('saray')}
                  className={`flex-1 py-1 rounded text-center font-bold text-[11px] cursor-pointer ${
                    siteFilter === 'saray' ? 'bg-[#7b1fa2] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  سراي
                </button>
              </div>

              {/* Category selector */}
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-hidden"
                >
                  <option value="all">كل الأقسام والمجموعات</option>
                  <option value="tablets">💊 أقراص وكبسولات</option>
                  <option value="injections">💉 حقن وأمبولات طوارئ</option>
                  <option value="solutions">💧 محاليل وريدية</option>
                  <option value="nebulizer">🫁 جلسات استنشاق ونيبولايزر</option>
                  <option value="topical">🧴 دهانات ومراهم موضعية</option>
                  <option value="liquids">🧪 أدوية سائلة ونقط</option>
                  <option value="supplies">🩹 مستلزمات طبية وكانيولات</option>
                </select>
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 outline-hidden"
              >
                <option value="all">كل الحالات</option>
                <option value="low">🟡 قارب على النفاد فقط</option>
                <option value="out">🔴 نفد تماماً فقط (0)</option>
              </select>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xs">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200 z-10">
                  <tr>
                    <th className="p-3">اسم الدواء / المستلزم</th>
                    <th className="p-3">القسم</th>
                    <th className="p-3">الوحدة</th>
                    {(siteFilter === 'all' || siteFilter === 'taj') && (
                      <th className="p-3 text-center bg-blue-50/50">رصيد موقع تاج</th>
                    )}
                    {(siteFilter === 'all' || siteFilter === 'saray') && (
                      <th className="p-3 text-center bg-purple-50/50">رصيد موقع سراي</th>
                    )}
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        لا توجد أصناف مطابقة للبحث أو التصفية
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLowTaj = item.stockTaj > 0 && item.stockTaj <= item.minThresholdTaj;
                      const isOutTaj = item.stockTaj <= 0;
                      const isLowSaray = item.stockSaray > 0 && item.stockSaray <= item.minThresholdSaray;
                      const isOutSaray = item.stockSaray <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {item.code && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-200 text-slate-700">
                                  {item.code}
                                </span>
                              )}
                              <div className="font-bold text-slate-800 text-xs sm:text-sm">{item.name}</div>
                              {item.isTop10 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                  الأكثر طلباً ⭐
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{item.scientificName}</div>
                            {item.indication && (
                              <div className="text-[10px] text-blue-700 font-semibold mt-0.5">📌 {item.indication}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
                              {item.category === 'tablets' && '💊 أقراص وكبسولات'}
                              {item.category === 'injections' && '💉 حقن وأمبولات'}
                              {item.category === 'solutions' && '💧 محاليل وريدية'}
                              {item.category === 'nebulizer' && '🫁 جلسات استنشاق'}
                              {item.category === 'topical' && '🧴 دهانات ومراهم'}
                              {item.category === 'liquids' && '🧪 أدوية سائلة'}
                              {item.category === 'supplies' && '🩹 مستلزمات طبية'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-semibold">{item.unit}</td>

                          {/* Taj Stock */}
                          {(siteFilter === 'all' || siteFilter === 'taj') && (
                            <td className="p-3 text-center bg-blue-50/20">
                              <div className="inline-flex items-center gap-1.5">
                                <span
                                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                                    isOutTaj
                                      ? 'bg-red-100 text-red-700 border border-red-300'
                                      : isLowTaj
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.stockTaj} {item.unit}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                حد التنبيه: {item.minThresholdTaj}
                              </div>
                            </td>
                          )}

                          {/* Saray Stock */}
                          {(siteFilter === 'all' || siteFilter === 'saray') && (
                            <td className="p-3 text-center bg-purple-50/20">
                              <div className="inline-flex items-center gap-1.5">
                                <span
                                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                                    isOutSaray
                                      ? 'bg-red-100 text-red-700 border border-red-300'
                                      : isLowSaray
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.stockSaray} {item.unit}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                حد التنبيه: {item.minThresholdSaray}
                              </div>
                            </td>
                          )}

                          {/* Actions */}
                          <td className="p-3 text-center">
                            {isSupervisor ? (
                              <button
                                onClick={() => {
                                  setSelectedItemForRestock(item);
                                  setRestockSite(siteFilter === 'saray' ? 'saray' : 'taj');
                                }}
                                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-xs"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                إضافة وارد
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">للمشرف فقط</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Transactions / Ledger */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">التوقيت والتاريخ</th>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">الصنف</th>
                    <th className="p-3">الموقع</th>
                    <th className="p-3">الكمية</th>
                    <th className="p-3">الرصيد بعد الحركة</th>
                    <th className="p-3">المسعف / المشرف</th>
                    <th className="p-3">رقم التقرير / الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        لا توجد حركات مسجلة حتى الآن. عند حفظ أي تقرير طبي يتضمن أدوية، سيتم الخصم التلقائي وتوثيقه هنا.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-600">{tx.timestamp}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-flex items-center gap-1 ${
                              tx.type === 'deduction'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {tx.type === 'deduction' ? (
                              <>
                                <ArrowDownRight className="w-3 h-3" /> خصم تلقائي للتقرير
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" /> توريد / إضافة وارد
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">{tx.itemName}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.site === 'taj' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {tx.site === 'taj' ? 'موقع تاج' : 'موقع سراي'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-xs">
                          {tx.type === 'deduction' ? `-${tx.quantity}` : `+${tx.quantity}`}
                        </td>
                        <td className="p-3 font-bold text-slate-700">{tx.balanceAfter}</td>
                        <td className="p-3 text-slate-700">{tx.paramedicName}</td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {tx.reportId ? (
                            <div>
                              <span className="font-mono text-blue-700">{tx.reportId}</span>
                              {tx.patientName && <div className="text-slate-800 font-medium">({tx.patientName})</div>}
                            </div>
                          ) : (
                            tx.notes || '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Add New Item (Supervisor only) */}
        {activeTab === 'add' && isSupervisor && (
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
            <form onSubmit={handleCreateNewItem} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                تعريف صنف دوائي أو مستلزم جديد بالمخزون
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الدواء التجاري <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="مثال: Panadol Extra قرص"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الاسم العلمي / التركيز</label>
                  <input
                    type="text"
                    value={newItemScientific}
                    onChange={(e) => setNewItemScientific(e.target.value)}
                    placeholder="مثال: Paracetamol 500mg + Caffeine"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم الدوائي</label>
                    <select
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:border-blue-600"
                    >
                      <option value="tablets">💊 أقراص وكبسولات</option>
                      <option value="injections">💉 حقن وأمبولات طوارئ</option>
                      <option value="solutions">💧 محاليل وريدية</option>
                      <option value="nebulizer">🫁 جلسات استنشاق ونيبولايزر</option>
                      <option value="topical">🧴 دهانات ومراهم موضعية</option>
                      <option value="liquids">🧪 أدوية سائلة ونقط</option>
                      <option value="supplies">🩹 مستلزمات طبية وكانيولات</option>
                    </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وحدة الصرف</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="قرص / أمبول / كانيولا / باكت"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                  <span className="font-bold text-xs text-blue-900 block">موقع تاج</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">الرصيد الابتدائي</label>
                    <input
                      type="number"
                      min="0"
                      value={newItemStockTaj}
                      onChange={(e) => setNewItemStockTaj(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">حد التنبيه الأدنى</label>
                    <input
                      type="number"
                      min="1"
                      value={newItemMinTaj}
                      onChange={(e) => setNewItemMinTaj(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                  <span className="font-bold text-xs text-purple-900 block">موقع سراي</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">الرصيد الابتدائي</label>
                    <input
                      type="number"
                      min="0"
                      value={newItemStockSaray}
                      onChange={(e) => setNewItemStockSaray(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">حد التنبيه الأدنى</label>
                    <input
                      type="number"
                      min="1"
                      value={newItemMinSaray}
                      onChange={(e) => setNewItemMinSaray(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ الصنف الجديد
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sub-modal: Restock Form */}
        {selectedItemForRestock && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-blue-700" />
                  إذن توريد وإضافة وارد للمخزون
                </h4>
                <button
                  onClick={() => setSelectedItemForRestock(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs space-y-1">
                <div className="font-bold text-blue-900 text-sm">{selectedItemForRestock.name}</div>
                <div className="text-slate-600 font-mono">{selectedItemForRestock.scientificName}</div>
                <div className="text-slate-500">
                  الرصيد الحالي تاج: {selectedItemForRestock.stockTaj} {selectedItemForRestock.unit} | رصيد سراي: {selectedItemForRestock.stockSaray} {selectedItemForRestock.unit}
                </div>
              </div>

              <form onSubmit={handleRestockSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الموقع المستلم</label>
                  <select
                    value={restockSite}
                    onChange={(e) => setRestockSite(e.target.value as SiteType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden"
                  >
                    <option value="taj">موقع تاج</option>
                    <option value="saray">موقع سراي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الكمية المضافة ({selectedItemForRestock.unit}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات / رقم الفاتورة أو إذن الاستلام</label>
                  <input
                    type="text"
                    value={restockNote}
                    onChange={(e) => setRestockNote(e.target.value)}
                    placeholder="مثال: توريد صيدلية الهيئة / إذن توريد 104"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-hidden"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItemForRestock(null)}
                    className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    تأكيد إضافة الرصيد
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
