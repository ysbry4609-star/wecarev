import { SavedReport } from '../types';
import { WECARE_LOGO_BASE64 } from '../assets/logoBase64';
import { getActiveLogo } from './logoManager';

export const WECARE_LOGO = WECARE_LOGO_BASE64;

export function printReportPDF(report: SavedReport, fullText: string) {
  const currentLogo = getActiveLogo() || WECARE_LOGO_BASE64;
  const win = window.open('', '_blank', 'width=900,height=900');
  if (!win) {
    alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) من شريط المتصفح لطباعة التقرير بصيغة PDF');
    return;
  }
  const siteName = report.site === 'taj' ? 'موقع تاج (Taj Site)' : 'موقع سراي (Sarai Site)';
  const priorityArabic =
    report.priority === 'critical'
      ? '🔴 حرجة وطارئة (Critical)'
      : report.priority === 'moderate'
      ? '🟡 متوسطة (Moderate)'
      : '🟢 طفيفة / روتينية (Minor)';

  win.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>تقرير WeCare الطبي — ${report.patientName || 'حالة طوارئ'} — ${report.reportId}</title>
      <style>
        @page {
          size: A4;
          margin: 12mm 14mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Segoe UI', Tahoma, 'Cairo', Arial, sans-serif;
          margin: 0;
          padding: 16px 20px;
          direction: rtl;
          color: #0f172a;
          background: #ffffff;
          position: relative;
          min-height: 100vh;
        }

        /* Prominent & Unobscured Watermark Layer */
        .watermark-layer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .watermark-emblem {
          width: 380px;
          max-width: 80%;
          opacity: 0.085;
          filter: grayscale(15%);
        }
        .watermark-text {
          position: absolute;
          transform: rotate(-32deg);
          font-size: 58px;
          font-weight: 900;
          letter-spacing: 4px;
          color: rgba(10, 61, 107, 0.07);
          text-transform: uppercase;
          white-space: nowrap;
          text-align: center;
          line-height: 1.3;
        }

        /* Document Container (Transparent so watermark shines through cleanly) */
        .document-wrapper {
          position: relative;
          z-index: 1;
          background: transparent;
        }

        /* Header */
        .report-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2.5px solid #0a3d6b;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .brand-section {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .official-logo {
          width: 72px;
          height: auto;
          object-fit: contain;
          border-radius: 6px;
        }
        .brand-info h1 {
          margin: 0;
          font-size: 19px;
          color: #0a3d6b;
          font-weight: 900;
          letter-spacing: -0.2px;
        }
        .brand-info h2 {
          margin: 2px 0 0;
          font-size: 12px;
          color: #1e293b;
          font-weight: 700;
        }
        .brand-info p {
          margin: 2px 0 0;
          font-size: 11px;
          color: #059669;
          font-weight: 600;
        }

        .meta-box {
          text-align: left;
          font-size: 11px;
          color: #334155;
          line-height: 1.65;
          border-right: 2px solid #e2e8f0;
          padding-right: 14px;
        }
        .report-badge {
          display: inline-block;
          font-family: monospace;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
          border: 1px solid #bfdbfe;
        }

        /* Section Cards - Semi-transparent to let the watermark show */
        .section-card {
          margin-bottom: 11px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.88);
          page-break-inside: avoid;
        }
        .section-title {
          background: rgba(10, 61, 107, 0.08);
          color: #0a3d6b;
          font-weight: 800;
          font-size: 12px;
          padding: 5px 12px;
          border-bottom: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .section-body {
          padding: 8px 12px;
          font-size: 11.5px;
          line-height: 1.6;
        }

        /* Tables & Grids */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px 14px;
        }
        .info-item b {
          color: #475569;
          font-size: 10.5px;
          display: block;
        }
        .info-item span {
          color: #0f172a;
          font-weight: 600;
          font-size: 12px;
        }

        /* Vitals Table */
        .vitals-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
          text-align: center;
        }
        .vital-box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 4px;
          background: rgba(248, 250, 252, 0.85);
        }
        .vital-label {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 700;
        }
        .vital-val {
          font-size: 13px;
          font-weight: 800;
          color: #0a3d6b;
          margin-top: 2px;
        }

        /* Meds Table */
        .med-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-top: 4px;
        }
        .med-table th {
          background: rgba(241, 245, 249, 0.9);
          color: #334155;
          text-align: right;
          padding: 5px 8px;
          border: 1px solid #cbd5e1;
          font-weight: 700;
          font-size: 10.5px;
        }
        .med-table td {
          padding: 5px 8px;
          border: 1px solid #e2e8f0;
          color: #1e293b;
        }
        .med-table tr:nth-child(even) {
          background: rgba(248, 250, 252, 0.6);
        }

        /* Pills */
        .pill-badge {
          display: inline-block;
          background: #f1f5f9;
          color: #334155;
          padding: 2px 7px;
          border-radius: 12px;
          font-size: 10.5px;
          margin: 2px;
          border: 1px solid #e2e8f0;
        }

        /* Footer */
        .report-footer {
          margin-top: 14px;
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          color: #64748b;
        }

        @media print {
          body {
            padding: 0;
          }
          .watermark-emblem {
            opacity: 0.10 !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Watermark Background Layer -->
      <div class="watermark-layer">
        <div class="watermark-text">WE CARE RESCUE SERVICES</div>
        <img src="${currentLogo}" class="watermark-emblem" alt="WeCare Watermark" />
        <div class="watermark-text" style="transform: rotate(-32deg) translateY(90px); font-size: 32px; letter-spacing: 6px;">
          EMERGENCY & CRITICAL CARE
        </div>
      </div>

      <!-- Main Document Content -->
      <div class="document-wrapper">
        <!-- Header -->
        <div class="report-header">
          <div class="brand-section">
            <img src="${currentLogo}" class="official-logo" alt="WeCare Official Logo" />
            <div class="brand-info">
              <h1>وي كير للإنقاذ — WE CARE RESCUE</h1>
              <h2>Emergency & Critical Care Department</h2>
              <p>تقرير تدخل طبي وإسعافي رسمي — ${siteName}</p>
            </div>
          </div>
          <div class="meta-box">
            <div>رقم التقرير: <span class="report-badge">${report.reportId}</span></div>
            <div>التاريخ: <b>${report.date}</b> | التوقيت: <b>${report.reportTime || '—'}</b></div>
            <div>وقت الوصول: <b>${report.arrivalTime || '—'}</b></div>
            <div>المسعف: <b>${report.paramedicName || report.loggedUser.name}</b></div>
            <div>درجة الأولوية: <b>${priorityArabic}</b></div>
          </div>
        </div>

        <!-- 1. Patient & Incident Info -->
        <div class="section-card">
          <div class="section-title">
            <span>👤 بيانات المصاب / المريض ومكان الحدث</span>
          </div>
          <div class="section-body">
            <div class="info-grid">
              <div class="info-item">
                <b>اسم الحالة:</b>
                <span>${report.patientName || 'غير محدد'}</span>
              </div>
              <div class="info-item">
                <b>السن والنوع:</b>
                <span>${report.age ? `${report.age} سنة` : '—'} / ${report.gender || '—'}</span>
              </div>
              <div class="info-item">
                <b>الوظيفة / المهنة:</b>
                <span>${report.job || '—'}</span>
              </div>
              <div class="info-item">
                <b>مكان وتمركز الحدث:</b>
                <span>${report.location || '—'}</span>
              </div>
              <div class="info-item">
                <b>مصدر البلاغ:</b>
                <span>${report.reportSource || '—'}</span>
              </div>
              <div class="info-item">
                <b>نوع الفعالية / البلاغ:</b>
                <span>${report.eventType || 'خدمات إسعافات طبية'}</span>
              </div>
              <div class="info-item">
                <b>موقع الخدمة:</b>
                <span>${siteName}</span>
              </div>
              <div class="info-item">
                <b>الشهر والسنة:</b>
                <span>${report.monthYear || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Vital Signs -->
        <div class="section-card">
          <div class="section-title">
            <span>🩺 العلامات الحيوية عند الوصول (Initial Vital Signs)</span>
          </div>
          <div class="section-body">
            <div class="vitals-grid">
              <div class="vital-box">
                <div class="vital-label">ضغط الدم (BP)</div>
                <div class="vital-val">${report.vitals?.bp || '—'} <span style="font-size: 9px; font-weight: normal;">mmHg</span></div>
              </div>
              <div class="vital-box">
                <div class="vital-label">النبض (HR)</div>
                <div class="vital-val">${report.vitals?.hr || '—'} <span style="font-size: 9px; font-weight: normal;">bpm</span></div>
              </div>
              <div class="vital-box">
                <div class="vital-label">الأكسجين (SpO2)</div>
                <div class="vital-val">${report.vitals?.spo2 || '—'} <span style="font-size: 9px; font-weight: normal;">%</span></div>
              </div>
              <div class="vital-box">
                <div class="vital-label">السكر بالدم (RBS)</div>
                <div class="vital-val">${report.vitals?.rbs || '—'} <span style="font-size: 9px; font-weight: normal;">mg/dL</span></div>
              </div>
              <div class="vital-box">
                <div class="vital-label">الحرارة (Temp)</div>
                <div class="vital-val">${report.vitals?.temp || '—'} <span style="font-size: 9px; font-weight: normal;">°C</span></div>
              </div>
              <div class="vital-box">
                <div class="vital-label">مقياس الوعي (GCS)</div>
                <div class="vital-val">${report.vitals?.gcs || '—'} <span style="font-size: 9px; font-weight: normal;">/15</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Clinical Assessment -->
        <div class="section-card">
          <div class="section-title">
            <span>📋 التقييم السريري والشكوى (Clinical Assessment)</span>
          </div>
          <div class="section-body">
            <div style="margin-bottom: 6px;">
              <b>الشكوى الرئيسية:</b> <span style="font-weight: 700; color: #0a3d6b;">${report.chiefComplaint || '—'}</span>
            </div>
            ${
              report.complaintDetails
                ? `<div style="margin-bottom: 6px;"><b>تفاصيل الحالة والفحص الميداني:</b> <span>${report.complaintDetails}</span></div>`
                : ''
            }
            ${
              report.medicalHistory
                ? `<div style="margin-bottom: 6px;"><b>التاريخ المرضي والأمراض المزمنة:</b> <span>${report.medicalHistory}</span></div>`
                : ''
            }
            ${
              report.symptoms && report.symptoms.length > 0
                ? `<div style="margin-top: 4px;"><b>الأعراض الملاحظة:</b> ${report.symptoms
                    .map((s) => `<span class="pill-badge">${s}</span>`)
                    .join('')}</div>`
                : ''
            }
          </div>
        </div>

        <!-- 4. Administered Medications & Supplies -->
        <div class="section-card">
          <div class="section-title">
            <span>💊 الأدوية والمستلزمات الطبية المصروفة للحالة (تم الخصم آلياً من مخزون ${siteName})</span>
          </div>
          <div class="section-body">
            ${
              report.medications && report.medications.length > 0
                ? `
              <table class="med-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">كود الصنف</th>
                    <th style="width: 45%;">اسم العلاج / المستلزم الطبي</th>
                    <th style="width: 20%;">الكمية المصروفة</th>
                    <th style="width: 20%;">الوحدة الصيدلية</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.medications
                    .map(
                      (m) => `
                    <tr>
                      <td style="font-family: monospace; font-weight: bold; color: #1e40af;">${m.inventoryId || 'MED'}</td>
                      <td><b>${m.name}</b></td>
                      <td style="font-weight: bold; color: #0a3d6b;">${m.qty}</td>
                      <td>${m.unit}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            `
                : '<div style="color: #64748b; font-style: italic; padding: 4px 0;">لم يتم صرف أدوية أو مستلزمات طبية لهذه الحالة.</div>'
            }
            ${
              report.otherProcedures
                ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0;"><b>إجراءات إضافية أو أدوية أخرى:</b> ${report.otherProcedures}</div>`
                : ''
            }
          </div>
        </div>

        <!-- 5. Protocols & Education -->
        <div class="section-card">
          <div class="section-title">
            <span>📢 البروتوكولات والتثقيف الطبي ومآل الحالة</span>
          </div>
          <div class="section-body">
            ${
              report.protocols && report.protocols.length > 0
                ? `<div style="margin-bottom: 6px;"><b>البروتوكولات الطبية المطبقة:</b> ${report.protocols
                    .map((p) => `<span class="pill-badge" style="background: #e0f2fe; color: #0369a1;">${p}</span>`)
                    .join('')}</div>`
                : ''
            }
            ${
              report.healthEducation && report.healthEducation.length > 0
                ? `<div style="margin-bottom: 6px;"><b>الإرشادات والتثقيف الصحي:</b> ${report.healthEducation
                    .map((e) => `<span class="pill-badge" style="background: #fdf2f8; color: #be185d;">${e}</span>`)
                    .join('')}</div>`
                : ''
            }
            ${
              report.additionalEducation
                ? `<div style="margin-bottom: 6px;"><b>إرشادات وتوجيهات إضافية:</b> ${report.additionalEducation}</div>`
                : ''
            }
            <div style="margin-top: 6px; padding: 6px 10px; background: rgba(241, 245, 249, 0.85); border-radius: 6px; border-right: 3px solid #0a3d6b;">
              <b>مآل وخاتمة الحالة (Outcome):</b> <span style="font-weight: 800; color: #0a3d6b; font-size: 12.5px;">${report.outcome || 'تحسن وأُفرج عنه'}</span>
            </div>
            ${
              report.notes
                ? `<div style="margin-top: 6px;"><b>ملاحظات إضافية:</b> <span>${report.notes}</span></div>`
                : ''
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="report-footer">
          <div>WeCare Rescue Services — قسم الطوارئ والرعاية الحرجة — كود الاعتماد: ${report.reportId}</div>
          <div>❝ Care you feel, <b>help to heal</b> ❞</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

