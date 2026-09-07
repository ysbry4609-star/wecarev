import React, { useState, useEffect } from 'react';
import {
  SiteType,
  PriorityType,
  UserSession,
  MedicationItem,
  MedicationUsage,
  InventoryTransaction,
  SavedReport
} from '../types';
import {
  JOB_LIST,
  TEMPLATES_DATA
} from '../data/initialData';
import { printReportPDF } from '../utils/pdfExport';
import { useWeCareLogo } from '../utils/logoManager';
import {
  Activity,
  Heart,
  Pill,
  BookOpen,
  FileText,
  Trash2,
  Share2,
  Printer,
  CheckCircle,
  AlertTriangle,
  Minus,
  Plus,
  Sparkles,
  X,
  Layers,
  Camera,
  Upload,
  RotateCcw
} from 'lucide-react';

interface ReportFormProps {
  site: SiteType;
  onSetSite: (site: SiteType) => void;
  user: UserSession;
  inventory: MedicationItem[];
  transactions?: InventoryTransaction[];
  onSaveReport: (report: SavedReport, fullText: string) => void;
  onOpenRef: (key: string) => void;
  onToast: (msg: string) => void;
}

const SYMPTOM_PILLS = [
  'قياء', 'حمى', 'ألم بطني', 'إسهال', 'صداع', 'دوخة',
  'ضيق تنفس', 'ألم صدر', 'ألم ظهر', 'هبوط', 'جرح', 'كدمات',
  'إغماء', 'طلب حقنة IM', 'قياس ضغط', 'أخرى'
];

const PROTOCOL_PILLS = [
  'ABCDE', 'IPSGs', 'ITLS', 'BLS', 'ALS', 'Airway Mgmt',
  'O2 Therapy', 'IV / Cannula', 'Nebulizer', 'Dressing',
  'إحالة مستشفى', 'Psych Support'
];

const EDU_PILLS = [
  'الراحة التامة', 'شرب المياه الكافية', 'التغذية السليمة', 'تعويض السوائل / ORS',
  'السلامة الغذائية', 'أطعمة خفيفة ومسلوقة', 'كمادات باردة', 'البعد عن الشمس',
  'ممارسة الرياضة', 'النوم الكافي', 'متابعة internist', 'متابعة dentist',
  'متابعة urologist', 'متابعة nephrologist', 'متابعة dermatologist',
  'متابعة الطبيب والأدوية', 'طوارئ عند تدهور الحالة', 'قواعد السلامة أثناء العمل'
];

// 10 Baseline Emergency Medications (used as priority seed before usage is accumulated)
const DEFAULT_PRIORITY_TOP10 = [
  'Ketolac 30 mg/2 ml',
  'Spasmofen 100mg/20mg',
  'Cetal 500 mg',
  'Visceralgine 5 mg/2 ml',
  'Dexamethasone 8 mg/2 ml',
  'Farcolin Nebulizer Solution',
  'Antinal 200 mg',
  'Sodium Chloride 0.9% Solution (محلول ملح)',
  'Blood Glucose Test Strips (شرايط قياس السكر)',
  'Gauze Bandage (رباط شاش معقم)'
];

export const ReportForm: React.FC<ReportFormProps> = ({
  site,
  onSetSite,
  user,
  inventory,
  transactions = [],
  onSaveReport,
  onOpenRef,
  onToast
}) => {
  // Logo management
  const { logo, uploadLogo, resetLogo } = useWeCareLogo();
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const isCustomLogo = logo.startsWith('data:image/');

  // Case Basic Data
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportTime, setReportTime] = useState(new Date().toTimeString().slice(0, 5));
  const [arrivalTime, setArrivalTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'ذكر' | 'أنثى' | ''>('');
  const [jobSelect, setJobSelect] = useState('');
  const [jobOther, setJobOther] = useState('');
  const [location, setLocation] = useState('');
  const [reportSource, setReportSource] = useState('');
  const [reportSourceOther, setReportSourceOther] = useState('');

  // Complaint & Symptoms
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('None');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Vitals
  const [bp, setBp] = useState('120/80');
  const [spo2, setSpo2] = useState('98');
  const [gcs, setGcs] = useState('15/15');
  const [rbs, setRbs] = useState('120');
  const [hr, setHr] = useState('80');
  const [temp, setTemp] = useState('37');

  // Protocols & Meds
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>(['ABCDE', 'IPSGs', 'ITLS']);
  const [medicationUsages, setMedicationUsages] = useState<Record<string, number>>({});
  const [otherProcedures, setOtherProcedures] = useState('');

  // Education & Outcome
  const [selectedEdu, setSelectedEdu] = useState<string[]>(['الراحة التامة', 'شرب المياه الكافية']);
  const [additionalEdu, setAdditionalEdu] = useState('');
  const [outcome, setOutcome] = useState('تحسن وأُفرج عنه');
  const [paramedicName, setParamedicName] = useState(user.name);
  const [eventType, setEventType] = useState('خدمات اسعافات طبية');
  const [priority, setPriority] = useState<PriorityType>('moderate');
  const [notes, setNotes] = useState('');

  // Auto Draft Saved Indicator
  const [saveIndicator, setSaveIndicator] = useState(false);

  // Month year label calculation
  const getMonthYear = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Generate Report ID
  const generateReportId = () => {
    const siteCode = site === 'taj' ? 'تاج' : 'سراي';
    const now = new Date();
    const dStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${siteCode}-${dStr}-${rand}`;
  };

  // Toggle helpers
  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Medication toggle & quantity
  const toggleMedication = (name: string, defaultQty = 1) => {
    setMedicationUsages((prev) => {
      const next = { ...prev };
      if (next[name]) {
        delete next[name];
      } else {
        next[name] = defaultQty;
      }
      return next;
    });
  };

  const addMedication = (name: string, qty = 1) => {
    setMedicationUsages((prev) => ({
      ...prev,
      [name]: (prev[name] || 0) + qty
    }));
    onToast(`➕ تم إضافة ${name} إلى التقرير`);
  };

  const removeMedication = (name: string) => {
    setMedicationUsages((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const clearAllMedications = () => {
    setMedicationUsages({});
    onToast('🗑️ تم إلغاء تحديد جميع الأدوية');
  };

  const updateMedQty = (name: string, delta: number) => {
    setMedicationUsages((prev) => {
      const cur = prev[name] || 0;
      const nextVal = Math.max(1, cur + delta);
      return { ...prev, [name]: nextVal };
    });
  };

  // Dynamically calculate Top 10 medications based on paramedic's actual usage & dispensing rate
  const dynamicTop10 = React.useMemo(() => {
    const usageCounts: Record<string, number> = {};

    // 1. Read past dispense transactions
    if (transactions && transactions.length > 0) {
      for (const tx of transactions) {
        if (tx.type === 'deduction' || (tx as any).type === 'dispensed') {
          const key = tx.itemName || tx.itemId;
          const qty = tx.quantity || (tx as any).amount || 1;
          usageCounts[key] = (usageCounts[key] || 0) + qty;
        }
      }
    }

    // 2. Read cumulative usage stats from local storage
    try {
      const saved = localStorage.getItem('wecare_med_usage_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const [k, v] of Object.entries(parsed)) {
          usageCounts[k] = (usageCounts[k] || 0) + Number(v);
        }
      }
    } catch {}

    // Sort inventory items dynamically
    const sorted = [...inventory].sort((a, b) => {
      const scoreA = (usageCounts[a.name] || 0) + (usageCounts[a.id] || 0) + (medicationUsages[a.name] ? 5 : 0);
      const scoreB = (usageCounts[b.name] || 0) + (usageCounts[b.id] || 0) + (medicationUsages[b.name] ? 5 : 0);

      // If usage scores differ, rank higher usage first
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // If scores are tied, fall back to default priority list
      const idxA = DEFAULT_PRIORITY_TOP10.findIndex((n) => a.name.includes(n) || n.includes(a.name));
      const idxB = DEFAULT_PRIORITY_TOP10.findIndex((n) => b.name.includes(n) || n.includes(b.name));
      const rankA = idxA !== -1 ? idxA : 999;
      const rankB = idxB !== -1 ? idxB : 999;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return a.name.localeCompare(b.name);
    });

    // Strictly return EXACTLY 10 items
    return sorted.slice(0, 10).map((item) => {
      const usage = (usageCounts[item.name] || 0) + (usageCounts[item.id] || 0);
      return {
        item,
        usageCount: usage
      };
    });
  }, [inventory, transactions, medicationUsages]);

  // Apply Quick Template
  const handleApplyTemplate = (key: string) => {
    setSelectedTemplate(key);
    if (!key || !TEMPLATES_DATA[key]) return;
    const t = TEMPLATES_DATA[key];
    setChiefComplaint(t.fc);
    setComplaintDetails(t.fcd);
    setSelectedSymptoms(t.symptoms || []);
    setSelectedProtocols((prev) => Array.from(new Set([...prev, ...(t.protocols || [])])));
    setSelectedEdu((prev) => Array.from(new Set([...prev, ...(t.education || [])])));
    setPriority(t.priority);

    // Apply template meds
    const newMeds: Record<string, number> = {};
    (t.meds || []).forEach((m) => {
      newMeds[m] = 1;
    });
    setMedicationUsages((prev) => ({ ...prev, ...newMeds }));
    onToast(`⚡ تم تطبيق قالب: ${t.fc}`);
  };

  // Build Text Report
  const buildReportText = (repId: string) => {
    const siteTitle = site === 'taj' ? 'فريق إسعاف موقع تاج' : 'فريق إسعاف موقع سراي';
    const effectiveJob = jobSelect === 'أخرى' ? jobOther : jobSelect;
    const effectiveSource = reportSource === 'أخرى' ? reportSourceOther : reportSource;

    let complaintFull = chiefComplaint;
    if (complaintDetails) complaintFull += ` (${complaintDetails})`;
    if (selectedSymptoms.length > 0) complaintFull += `، الأعراض: ${selectedSymptoms.join('، ')}`;

    const medsList = Object.entries(medicationUsages)
      .map(([name, qty]) => `${name} [الكمية: ${qty}]`)
      .join('، ');

    let t = '';
    t += `🔖 رقم التقرير: ${repId}\n\n`;
    t += `⚕️ تقرير تدخل طبي — ${chiefComplaint || 'إسعاف وطوارئ'}\n\n`;

    t += `👤 بيانات الحالة:\n`;
    if (effectiveSource) t += `* المبلغ: ${effectiveSource}\n`;
    if (location) t += `* المكان: ${location}\n`;
    t += `* الاسم: ${patientName || 'غير مسجل'}\n`;
    if (age) t += `* السن: ${age} عاماً\n`;
    if (effectiveJob) t += `* الوظيفة: ${effectiveJob}\n`;
    t += `* الشكوى والأعراض الحالية: ${complaintFull || '—'}\n`;
    t += `* التاريخ المرضي: ${medicalHistory || 'None'}\n\n`;

    t += `📊 أولاً: العلامات الحيوية (V/S) أثناء الفحص:\n`;
    t += `* درجة الوعي (GCS): ${gcs || '15/15'}\n`;
    t += `* ضغط الدم (BP): ${bp || '120/80'} mmHg\n`;
    t += `* نسبة الأكسجين (SpO2): ${spo2 || '98'}%\n`;
    t += `* مستوى السكر العشوائي (RBS): ${rbs || '120'} mg/dL\n`;
    t += `* نبض القلب (H.R): ${hr || '80'} bpm\n`;
    t += `* درجة الحرارة (Temp): ${temp || '37'}°C\n\n`;

    t += `🛠️ ثانياً: الإجراءات والتدخل الطبي:\n`;
    t += `* البروتوكولات المُتبعة: ${selectedProtocols.join('، ') || 'ABCDE, IPSGs'}\n`;
    t += `* تم قياس العلامات الحيوية بدقة ومراقبتها\n`;
    if (medsList) t += `* الأدوية والعلاج المصروف: ${medsList}\n`;
    if (otherProcedures) t += `* إجراءات إضافية: ${otherProcedures}\n`;
    if (outcome) t += `* نتيجة التدخل: ${outcome}\n\n`;

    t += `📢 ثالثاً: التعليمات والنصائح الطبية (Health Education):\n`;
    t += `* تم نصح المريض بـ: ${selectedEdu.join('، ') || 'الراحة وشرب المياه الكافية'}\n`;
    if (additionalEdu) t += `* ${additionalEdu}\n`;

    if (notes) t += `\n📝 ملاحظات:\n${notes}\n`;

    t += `\nEmergency and Critical Care Department, WeCare Company\n${siteTitle}`;
    return t;
  };

  const handleClear = () => {
    if (!confirm('هل تريد مسح جميع بيانات النموذج وبدء تقرير جديد؟')) return;
    setPatientName('');
    setAge('');
    setGender('');
    setJobSelect('');
    setJobOther('');
    setLocation('');
    setReportSource('');
    setReportSourceOther('');
    setChiefComplaint('');
    setComplaintDetails('');
    setSelectedSymptoms([]);
    setMedicationUsages({});
    setOtherProcedures('');
    setAdditionalEdu('');
    setNotes('');
    setPriority('moderate');
    onToast('🗑️ تم مسح النموذج');
  };

  const handleSubmit = (actionType: 'whatsapp' | 'pdf') => {
    if (!patientName.trim()) {
      onToast('⚠️ أدخل اسم الحالة أولاً');
      return;
    }
    if (!location.trim()) {
      onToast('⚠️ أدخل مكان الحدث');
      return;
    }

    const repId = generateReportId();
    const effectiveJob = jobSelect === 'أخرى' ? jobOther : jobSelect;
    const effectiveSource = reportSource === 'أخرى' ? reportSourceOther : reportSource;

    // Convert medication usages to array
    const medsArray: MedicationUsage[] = Object.entries(medicationUsages).map(([name, qty]) => {
      const invItem = inventory.find((i) => i.name === name);
      return {
        name,
        qty: Number(qty),
        unit: invItem?.unit || 'وحدة',
        inventoryId: invItem?.id
      };
    });

    const report: SavedReport = {
      reportId: repId,
      site,
      date: reportDate,
      monthYear: getMonthYear(reportDate),
      reportTime,
      arrivalTime,
      patientName: patientName.trim(),
      age,
      gender,
      job: effectiveJob,
      location,
      reportSource: effectiveSource,
      chiefComplaint,
      complaintDetails,
      medicalHistory,
      symptoms: selectedSymptoms,
      vitals: { bp, spo2, gcs, rbs, hr, temp },
      protocols: selectedProtocols,
      medications: medsArray,
      otherProcedures,
      healthEducation: selectedEdu,
      additionalEducation: additionalEdu,
      outcome,
      paramedicName: paramedicName || user.name,
      eventType,
      priority,
      notes,
      loggedUser: user,
      createdAt: new Date().toISOString()
    };

    const fullText = buildReportText(repId);
    onSaveReport(report, fullText);

    if (actionType === 'pdf') {
      printReportPDF(report, fullText);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header with Site Selector & Motto */}
      <div
        className={`rounded-2xl p-4 sm:p-5 text-white shadow-xl transition-all duration-300 ${
          site === 'taj'
            ? 'bg-gradient-to-r from-[#0a3d6b] via-[#1565a8] to-[#1e88e5]'
            : 'bg-gradient-to-r from-[#4a0080] via-[#7b1fa2] to-[#ab47bc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              onClick={() => logoInputRef.current?.click()}
              className="relative group cursor-pointer w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-white/20 p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden backdrop-blur-xs"
              title="انقر لاختيار ورفع ملف شعار WeCare الرسمي الحقيقي (PNG/JPG)"
            >
              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const success = await uploadLogo(file);
                    if (success) {
                      onToast('✅ تم اعتماد وحفظ شعار WeCare الرسمي بنجاح!');
                    } else {
                      onToast('⚠️ تعذر تحميل الملف، يرجى التأكد من اختيار صورة صحيحة.');
                    }
                  }
                }}
              />
              <img
                src={logo}
                alt="WeCare Rescue Emblem"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] text-white font-bold transition-opacity">
                <Camera className="w-3.5 h-3.5 mb-0.5 text-amber-300" />
                <span>تغيير</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold">
                  تقرير التدخل الطبي والطوارئ — {site === 'taj' ? 'موقع تاج' : 'موقع سراي'}
                </h1>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-md border border-white/30 transition cursor-pointer shadow-xs"
                  title="رفع ملف الشعار الحقيقي لشركتكم بصيغة PNG أو JPG"
                >
                  <Upload className="w-3 h-3" />
                  <span>رفع الشعار الأصلي</span>
                </button>
                {isCustomLogo && (
                  <button
                    type="button"
                    onClick={() => {
                      resetLogo();
                      onToast('تمت استعادة الشعار الافتراضي');
                    }}
                    className="inline-flex items-center gap-1 text-[10px] bg-red-500/30 hover:bg-red-500/50 text-white px-1.5 py-0.5 rounded-md transition cursor-pointer"
                    title="استعادة الشعار الافتراضي"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>استعادة</span>
                  </button>
                )}
              </div>
              <p className="text-xs opacity-85 mt-0.5">Emergency & Critical Care Department — WeCare Rescue Services</p>
            </div>
          </div>
          <div className="bg-black/20 text-center py-1.5 px-3.5 rounded-xl text-xs font-semibold">
            ❝ Care you feel, <span className="text-amber-300 font-bold">help to heal</span> ❞
          </div>
        </div>

        {/* Site Toggle Bar inside Header */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">📍 الموقع الحالي:</span>
            <div className="inline-flex p-1 bg-black/25 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => onSetSite('taj')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  site === 'taj' ? 'bg-white text-blue-900 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                🏗️ موقع تاج
              </button>
              <button
                type="button"
                onClick={() => onSetSite('saray')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  site === 'saray' ? 'bg-white text-purple-950 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                🏛️ موقع سراي
              </button>
            </div>
          </div>

          <div className="text-xs text-white/90">
            👤 المسعف المسجل: <b>{user.name}</b> ({user.roleLabel})
          </div>
        </div>
      </div>

      {/* Quick Diagnostic Reference Pills */}
      <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200">
        <div className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-red-600" />
          <span>🔍 مراجع الفحص والتشخيص السريع (اضغط لفتح الدليل الطبي):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { k: 'headache', l: '🤕 صداع' },
            { k: 'abdominal', l: '🍽️ ألم بطن' },
            { k: 'wound', l: '🩹 جروح وحوادث' },
            { k: 'dental', l: '🦷 ألم أسنان' },
            { k: 'fever', l: '🌡️ حرارة/التهاب' },
            { k: 'bp', l: '💉 ضغط دم' },
            { k: 'syncope', l: '😵 إغماء/هبوط' },
            { k: 'chest', l: '🫁 ألم صدر/تنفس' },
            { k: 'headtotoe', l: '🩺 فحص شامل Head-to-Toe' },
            { k: 'trauma', l: '🚑 تقييم إصابة ITLS' },
            { k: 'shock', l: '🩸 أنواع الصدمة Shock' }
          ].map((item) => (
            <button
              key={item.k}
              type="button"
              onClick={() => onOpenRef(item.k)}
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
            >
              {item.l}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Case Details */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-blue-50/80 px-4 py-2.5 border-b border-blue-100 text-xs font-bold text-blue-900 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-blue-700" />
          <span>👤 بيانات الحالة والحدث</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                التاريخ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">الشهر والسنة</label>
              <input
                type="text"
                readOnly
                value={getMonthYear(reportDate)}
                className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">ميعاد الإبلاغ</label>
              <input
                type="time"
                value={reportTime}
                onChange={(e) => setReportTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">ميعاد الوصول</label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                اسم الحالة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="الاسم الكامل للمريض"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">السن</label>
              <input
                type="number"
                placeholder="السن بالسنة"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">الجنس</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="">—</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">الوظيفة</label>
              <select
                value={jobSelect}
                onChange={(e) => setJobSelect(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="">اختر الوظيفة...</option>
                {JOB_LIST.map((j, i) => {
                  const val = gender === 'أنثى' ? j.f : j.m;
                  return (
                    <option key={i} value={val}>
                      {val}
                    </option>
                  );
                })}
                <option value="أخرى">أخرى (اكتبها)</option>
              </select>
              {jobSelect === 'أخرى' && (
                <input
                  type="text"
                  placeholder="اكتب الوظيفة..."
                  value={jobOther}
                  onChange={(e) => setJobOther(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                مكان الحدث <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: بلوك 4، بوابة 2، الكافيتريا"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">جهة الإبلاغ</label>
              <select
                value={reportSource}
                onChange={(e) => setReportSource(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="">اختر...</option>
                <option value="كنترول روم">كنترول روم</option>
                <option value="الأمن الداخلي">الأمن الداخلي</option>
                <option value="السيفتي">السيفتي</option>
                <option value="زيارة">زيارة</option>
                <option value="مباشر">مباشر</option>
                <option value="أخرى">أخرى</option>
              </select>
              {reportSource === 'أخرى' && (
                <input
                  type="text"
                  placeholder="اكتب جهة الإبلاغ..."
                  value={reportSourceOther}
                  onChange={(e) => setReportSourceOther(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Complaint, Diagnosis & Symptoms */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-amber-50/80 px-4 py-2.5 border-b border-amber-100 text-xs font-bold text-amber-900 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-amber-700" />
          <span>🩺 الشكوى والتشخيص والأعراض</span>
        </div>
        <div className="p-4 space-y-3">
          {/* Quick Template Dropdown */}
          <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-bold text-amber-900 shrink-0">⚡ قالب سريع للحالة:</label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs outline-hidden"
            >
              <option value="">— اختر قالباً سريعاً لملء التشخيص والأدوية تلقائياً —</option>
              <option value="headache">🤕 صداع نمطي</option>
              <option value="abdominal">🍽️ ألم بطن نمطي</option>
              <option value="minor_wound">🩹 جرح سطحي وبسيط</option>
              <option value="fever">🌡️ حرارة مرتفعة</option>
              <option value="fainting">😵 إغماء بسيط</option>
              <option value="burn">🔥 حروق درجة ثانية</option>
              <option value="fracture">🦴 اشتباه كسر</option>
              <option value="bleeding">🩸 نزيف حاد</option>
              <option value="chestPain">🫁 ألم صدر ضاغط (حرج)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                الشكوى الرئيسية <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: قياء مع حمى / vomiting with fever"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">التاريخ المرضي</label>
              <input
                type="text"
                placeholder="None أو DM, HTN أو جرثومة المعدة..."
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Symptoms Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">⚡ الأعراض الملاحظة:</label>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOM_PILLS.map((symp) => {
                const active = selectedSymptoms.includes(symp);
                return (
                  <button
                    key={symp}
                    type="button"
                    onClick={() => toggleItem(selectedSymptoms, setSelectedSymptoms, symp)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer border ${
                      active
                        ? 'bg-blue-100 text-blue-900 border-blue-600 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {symp}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">تفاصيل إضافية عن الشكوى</label>
            <input
              type="text"
              placeholder="سبب أو تفاصيل الحادث أو بداية الأعراض..."
              value={complaintDetails}
              onChange={(e) => setComplaintDetails(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Vitals */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-emerald-50/80 px-4 py-2.5 border-b border-emerald-100 text-xs font-bold text-emerald-900 flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-emerald-700" />
          <span>📊 العلامات الحيوية (V/S)</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-base block">🩸</span>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">BP (mmHg)</label>
              <input
                type="text"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                placeholder="120/80"
                className="w-full text-center font-bold text-xs bg-white border border-slate-300 py-1 rounded-md"
              />
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-base block">🫁</span>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">SpO2 (%)</label>
              <input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
                placeholder="98"
                className="w-full text-center font-bold text-xs bg-white border border-slate-300 py-1 rounded-md"
              />
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-base block">🧠</span>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">GCS</label>
              <input
                type="text"
                value={gcs}
                onChange={(e) => setGcs(e.target.value)}
                placeholder="15/15"
                className="w-full text-center font-bold text-xs bg-white border border-slate-300 py-1 rounded-md"
              />
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-base block">🩺</span>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">RBS (mg/dL)</label>
              <input
                type="text"
                value={rbs}
                onChange={(e) => setRbs(e.target.value)}
                placeholder="120"
                className="w-full text-center font-bold text-xs bg-white border border-slate-300 py-1 rounded-md"
              />
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-base block">💓</span>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">H.R (bpm)</label>
              <input
                type="number"
                value={hr}
                onChange={(e) => setHr(e.target.value)}
                placeholder="80"
                className="w-full text-center font-bold text-xs bg-white border border-slate-300 py-1 rounded-md"
              />
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-base block">🌡️</span>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Temp (°C)</label>
              <input
                type="text"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="37"
                className="w-full text-center font-bold text-xs bg-white border border-slate-300 py-1 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Protocols and MEDICATIONS LINKED TO INVENTORY */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-purple-50/80 px-4 py-2.5 border-b border-purple-100 text-xs font-bold text-purple-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-purple-700" />
            <span>💊 التدخل الطبي والأدوية (تخصم تلقائياً من مخزون {site === 'taj' ? 'موقع تاج' : 'موقع سراي'})</span>
          </div>
          <span className="text-[10px] text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full font-bold">
            رصيد حي ومباشر
          </span>
        </div>
        <div className="p-4 space-y-4">
          {/* Protocols */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">✅ البروتوكولات المُتبعة:</label>
            <div className="flex flex-wrap gap-1.5">
              {PROTOCOL_PILLS.map((proto) => {
                const active = selectedProtocols.includes(proto);
                return (
                  <button
                    key={proto}
                    type="button"
                    onClick={() => toggleItem(selectedProtocols, setSelectedProtocols, proto)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                      active
                        ? 'bg-purple-100 text-purple-900 border-purple-600 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {proto}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Medication Section */}
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-blue-700" />
                  الأدوية والمستلزمات المصروفة للحالة (تخصم تلقائياً من مخزون {site === 'taj' ? 'موقع تاج' : 'موقع سراي'})
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  اختر من الأدوية الـ 10 الأكثر استهلاكاً أو استعرض القوائم المنسدلة للتصنيفات الصيدلانية
                </p>
              </div>

              {/* Counter of selected */}
              {Object.keys(medicationUsages).length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
                    المحدد للصرف: {Object.keys(medicationUsages).length} صنف
                  </span>
                  <button
                    type="button"
                    onClick={clearAllMedications}
                    className="text-[11px] text-red-600 hover:text-red-800 font-bold underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    مسح الكل
                  </button>
                </div>
              )}
            </div>

            {/* Selected Medications Basket / Tray */}
            {Object.keys(medicationUsages).length > 0 && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-blue-200 pb-1.5">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-700" />
                    قائمة العلاجات والمستلزمات المختارة في هذا التقرير:
                  </span>
                  <span className="text-[11px] text-slate-600 font-normal">
                    انقر (+) أو (-) لتعديل الجرعة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(medicationUsages).map(([medName, qty]) => {
                    const itemData = inventory.find((i) => i.name === medName);
                    const stock = itemData
                      ? site === 'taj'
                        ? itemData.stockTaj
                        : itemData.stockSaray
                      : 0;
                    const unit = itemData?.unit || 'وحدة';
                    const isExceeded = stock < qty;

                    return (
                      <div
                        key={medName}
                        className={`p-2 bg-white rounded-lg border shadow-2xs flex items-center justify-between gap-2 ${
                          isExceeded ? 'border-red-400 ring-1 ring-red-300' : 'border-blue-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                            {itemData?.code && (
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {itemData.code}
                              </span>
                            )}
                            <span className="truncate">{medName}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] font-semibold ${
                                stock <= 0
                                  ? 'text-red-600'
                                  : isExceeded
                                  ? 'text-red-600 font-bold'
                                  : 'text-slate-500'
                              }`}
                            >
                              الرصيد: {stock} {unit}
                            </span>
                            {itemData?.indication && (
                              <span className="text-[9px] text-blue-600 truncate">
                                • {itemData.indication}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateMedQty(medName, -1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-extrabold text-xs text-blue-900 w-5 text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateMedQty(medName, 1)}
                            className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMedication(medName)}
                            className="w-5 h-5 mr-1 rounded bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center cursor-pointer transition"
                            title="إلغاء هذا الصنف"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top 10 Most Consumed Medicines & Supplies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>الأصناف الـ 10 الأكثر استهلاكاً وصرفاً للمسعف (انقر للإضافة السريعة):</span>
                </div>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  تحديث تلقائي وفق الاستخدام ومعدل صرف البلاغات
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {dynamicTop10.map(({ item, usageCount }) => {
                  const isSelected = medicationUsages[item.name] !== undefined;
                  const qtyUsed = medicationUsages[item.name] || 0;
                  const stock = site === 'taj' ? item.stockTaj : item.stockSaray;
                  const minThreshold = site === 'taj' ? item.minThresholdTaj : item.minThresholdSaray;
                  const isLow = stock > 0 && stock <= minThreshold;
                  const isOut = stock <= 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 text-right ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-400'
                          : isOut
                          ? 'bg-slate-50/80 border-slate-200 opacity-60'
                          : isLow
                          ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded font-bold">
                            {item.code || 'MED'}
                          </span>
                          <div className="flex items-center gap-1">
                            {usageCount > 0 && (
                              <span className="text-[8.5px] px-1 py-0.2 rounded bg-blue-100 text-blue-800 font-bold" title="معدل الصرف التراكمي للمسعف">
                                صُرِف {usageCount}×
                              </span>
                            )}
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                isOut
                                  ? 'bg-red-500 text-white'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOut ? 'نفد 0' : `${stock} ${item.unit}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-slate-800 leading-tight pt-1 line-clamp-1">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {item.scientificName}
                        </div>
                        {item.indication && (
                          <div className="text-[10px] text-blue-700 font-medium truncate">
                            📌 {item.indication}
                          </div>
                        )}
                      </div>

                      {isSelected ? (
                        <div className="mt-1 pt-1.5 border-t border-blue-200 flex items-center justify-between bg-white/90 px-2 py-1 rounded-lg">
                          <span className="text-[10px] font-bold text-blue-900">مصروف:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateMedQty(item.name, -1)}
                              className="w-4.5 h-4.5 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center cursor-pointer text-slate-700"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="font-bold text-xs text-blue-900 w-4 text-center">
                              {qtyUsed}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateMedQty(item.name, 1)}
                              className="w-4.5 h-4.5 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center cursor-pointer text-slate-700"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={() => toggleMedication(item.name, 1)}
                          className={`w-full py-1 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1 mt-1 ${
                            isOut
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          {isOut ? 'غير متوفر' : 'إضافة للتقرير'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Categorized Dropdowns Grid */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Layers className="w-3.5 h-3.5 text-blue-700" />
                  <span>قوائم منسدلة حسب التصنيف الصيدلي (اختر أي علاج لإضافته):</span>
                </div>
                <span className="text-[10px] text-slate-500">اختر من القائمة ليتم إدراجه فوراً</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {/* 1. Tablets */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>💊</span>
                    <span>أقراص وكبسولات (برشام)</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({inventory.filter((i) => i.category === 'tablets').length})
                    </span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addMedication(e.target.value);
                    }}
                    className="w-full text-xs py-2 px-2.5 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- اختر قرص / كبسولة --</option>
                    {inventory
                      .filter((i) => i.category === 'tablets')
                      .map((item) => {
                        const stock = site === 'taj' ? item.stockTaj : item.stockSaray;
                        return (
                          <option key={item.id} value={item.name}>
                            {item.name} {item.code ? `[${item.code}]` : ''} | رصيد: {stock} {item.unit} {item.indication ? `(${item.indication})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* 2. Injections */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>💉</span>
                    <span>حقن وأمبولات طوارئ</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({inventory.filter((i) => i.category === 'injections').length})
                    </span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addMedication(e.target.value);
                    }}
                    className="w-full text-xs py-2 px-2.5 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- اختر حقنة / أمبول --</option>
                    {inventory
                      .filter((i) => i.category === 'injections')
                      .map((item) => {
                        const stock = site === 'taj' ? item.stockTaj : item.stockSaray;
                        return (
                          <option key={item.id} value={item.name}>
                            {item.name} {item.code ? `[${item.code}]` : ''} | رصيد: {stock} {item.unit} {item.indication ? `(${item.indication})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* 3. Solutions */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>💧</span>
                    <span>محاليل وريدية (IV Fluids)</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({inventory.filter((i) => i.category === 'solutions').length})
                    </span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addMedication(e.target.value);
                    }}
                    className="w-full text-xs py-2 px-2.5 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- اختر محلول وريدي --</option>
                    {inventory
                      .filter((i) => i.category === 'solutions')
                      .map((item) => {
                        const stock = site === 'taj' ? item.stockTaj : item.stockSaray;
                        return (
                          <option key={item.id} value={item.name}>
                            {item.name} {item.code ? `[${item.code}]` : ''} | رصيد: {stock} {item.unit} {item.indication ? `(${item.indication})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* 4. Nebulizer */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>🫁</span>
                    <span>جلسات استنشاق ونيبولايزر</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({inventory.filter((i) => i.category === 'nebulizer').length})
                    </span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addMedication(e.target.value);
                    }}
                    className="w-full text-xs py-2 px-2.5 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- اختر محلول استنشاق --</option>
                    {inventory
                      .filter((i) => i.category === 'nebulizer')
                      .map((item) => {
                        const stock = site === 'taj' ? item.stockTaj : item.stockSaray;
                        return (
                          <option key={item.id} value={item.name}>
                            {item.name} {item.code ? `[${item.code}]` : ''} | رصيد: {stock} {item.unit} {item.indication ? `(${item.indication})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* 5. Topical */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>🧴</span>
                    <span>دهانات ومراهم موضعية</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({inventory.filter((i) => i.category === 'topical').length})
                    </span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addMedication(e.target.value);
                    }}
                    className="w-full text-xs py-2 px-2.5 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- اختر مرهم / كريم --</option>
                    {inventory
                      .filter((i) => i.category === 'topical')
                      .map((item) => {
                        const stock = site === 'taj' ? item.stockTaj : item.stockSaray;
                        return (
                          <option key={item.id} value={item.name}>
                            {item.name} {item.code ? `[${item.code}]` : ''} | رصيد: {stock} {item.unit} {item.indication ? `(${item.indication})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* 6. Liquids */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>🧪</span>
                    <span>سوائل ونقط ومطهرات</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({inventory.filter((i) => i.category === 'liquids').length})
                    </span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addMedication(e.target.value);
                    }}
                    className="w-full text-xs py-2 px-2.5 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- اختر شراب / نقط / مطهر --</option>
                    {inventory
                      .filter((i) => i.category === 'liquids')
                      .map((item) => {
                        const stock = site === 'taj' ? item.stockTaj : item.stockSaray;
                        return (
                          <option key={item.id} value={item.name}>
                            {item.name} {item.code ? `[${item.code}]` : ''} | رصيد: {stock} {item.unit} {item.indication ? `(${item.indication})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* 7. Supplies */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>🩹</span>
                    <span>مستلزمات طبية وكانيولات وشرايط سكر وضمادات</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      ({inventory.filter((i) => i.category === 'supplies').length})
                    </span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addMedication(e.target.value);
                    }}
                    className="w-full text-xs py-2 px-2.5 bg-white border border-slate-300 rounded-lg outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="">-- اختر مستلزم طبي / كانيولا / شاش / شرايط --</option>
                    {inventory
                      .filter((i) => i.category === 'supplies')
                      .map((item) => {
                        const stock = site === 'taj' ? item.stockTaj : item.stockSaray;
                        return (
                          <option key={item.id} value={item.name}>
                            {item.name} {item.code ? `[${item.code}]` : ''} | رصيد: {stock} {item.unit} {item.indication ? `(${item.indication})` : ''}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              دواء آخر أو تفاصيل إجراء طبي إضافي
            </label>
            <textarea
              value={otherProcedures}
              onChange={(e) => setOtherProcedures(e.target.value)}
              placeholder="أي أدوية أو مستلزمات أخرى أو تفاصيل التدخل الميداني..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs min-h-[50px]"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Health Education */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-rose-50/80 px-4 py-2.5 border-b border-rose-100 text-xs font-bold text-rose-900 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-rose-700" />
          <span>📢 التثقيف والإرشادات الطبية (Health Education)</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {EDU_PILLS.map((edu) => {
              const active = selectedEdu.includes(edu);
              return (
                <button
                  key={edu}
                  type="button"
                  onClick={() => toggleItem(selectedEdu, setSelectedEdu, edu)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    active
                      ? 'bg-rose-100 text-rose-900 border-rose-600 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {edu}
                </button>
              );
            })}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">تعليمات إضافية</label>
            <input
              type="text"
              placeholder="أي تعليمات أو نصائح إضافية للمريض..."
              value={additionalEdu}
              onChange={(e) => setAdditionalEdu(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section 6: Outcome, Priority & Paramedic */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-teal-50/80 px-4 py-2.5 border-b border-teal-100 text-xs font-bold text-teal-900 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-teal-700" />
          <span>📋 النتيجة والأولوية والمسعف</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">نتيجة التدخل</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="تحسن وأُفرج عنه">تحسن وأُفرج عنه</option>
                <option value="تحول للمستشفى">تحول للمستشفى</option>
                <option value="تحسن جزئي - متابعة">تحسن جزئي - متابعة</option>
                <option value="رفض العلاج">رفض العلاج</option>
                <option value="حالة خطيرة - إسعاف">حالة خطيرة - إسعاف</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم المسعف مقدم الخدمة</label>
              <input
                type="text"
                value={paramedicName}
                onChange={(e) => setParamedicName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">نوع الحدث</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="خدمات اسعافات طبية">خدمات اسعافات طبية</option>
                <option value="حادث عمل">حادث عمل</option>
                <option value="حالة طارئة">حالة طارئة</option>
                <option value="إسعاف ونقل">إسعاف ونقل</option>
              </select>
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">🚦 مستوى الأولوية:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('minor')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  priority === 'minor'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🟢 بسيطة (Minor)
              </button>
              <button
                type="button"
                onClick={() => setPriority('moderate')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  priority === 'moderate'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🟡 متوسطة (Moderate)
              </button>
              <button
                type="button"
                onClick={() => setPriority('critical')}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                  priority === 'critical'
                    ? 'bg-red-600 text-white border-red-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🔴 حرجة (Critical)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات فنية أو إدارية..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs min-h-[45px]"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="sticky bottom-3 z-30 bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-xl border border-slate-200 flex flex-wrap gap-2.5 justify-center items-center">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-slate-500" />
          مسح النموذج
        </button>

        <button
          type="button"
          onClick={() => handleSubmit('whatsapp')}
          className="px-6 py-2.5 bg-gradient-to-r from-[#075e54] to-[#128c7e] hover:opacity-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          📊💬 حفظ وخصم المخزون وإرسال واتساب
        </button>

        <button
          type="button"
          onClick={() => handleSubmit('pdf')}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:opacity-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          📄 تصدير PDF رسمي
        </button>
      </div>
    </div>
  );
};
