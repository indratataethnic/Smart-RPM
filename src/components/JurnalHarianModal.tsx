import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  FileDown, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  BookOpen, 
  Plus, 
  Trash2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { JurnalHarianGuru, JurnalHarianEntry, LessonPlanOutput } from '../types';

interface JurnalHarianModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: LessonPlanOutput;
  jurnalData: JurnalHarianGuru;
  onSaveJurnal: (newJurnal: JurnalHarianGuru) => void;
}

export const JurnalHarianModal: React.FC<JurnalHarianModalProps> = ({
  isOpen,
  onClose,
  planData,
  jurnalData,
  onSaveJurnal,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [editableJurnal, setEditableJurnal] = useState<JurnalHarianGuru>(jurnalData);

  React.useEffect(() => {
    setEditableJurnal(jurnalData);
  }, [jurnalData]);

  if (!isOpen) return null;

  const currentJurnal = editableJurnal || jurnalData;
  const { identitas, tujuanDanDpl } = planData;

  const handleCopyText = () => {
    let text = `====================================================\n`;
    text += `${currentJurnal.judul || 'JURNAL HARIAN PELAKSANAAN PEMBELAJARAN'}\n`;
    text += `====================================================\n\n`;
    text += `Kelas / Fase : ${identitas.faseKelas}\n`;
    text += `Semester / TA: ${identitas.semesterTahun}\n\n`;

    text += `Catatan Refleksi Keterlaksanaan:\n${currentJurnal.catatanRefleksiUmum}\n\n`;
    text += `DAFTAR JURNAL PELAKSANAAN HARIAN:\n`;

    currentJurnal.entries.forEach((e, idx) => {
      text += `${idx + 1}. [${e.hariTanggal}] ${e.pertemuanJam}\n`;
      text += `   Mata Pelajaran          : ${e.mataPelajaran}\n`;
      text += `   Alur Tujuan Pembelajaran: ${e.atp}\n`;
      text += `   Materi / Aktivitas      : ${e.materiAktivitas}\n`;
      text += `   Penilaian               : ${e.penilaian}\n`;
      text += `   Catatan dan Kendala     : ${e.catatanKendala}\n\n`;
    });

    text += `Mengetahui,\nKepala Sekolah: ${identitas.namaKepsek || '-'}\nGuru Mata Pelajaran: ${identitas.namaGuru || '-'}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset='utf-8'>
        <title>Jurnal Harian Pelaksanaan Pembelajaran - ${identitas.faseKelas}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; line-height: 1.4; color: #1e293b; margin: 0; padding: 10px; }
          .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 13pt; font-weight: bold; color: #0f766e; text-transform: uppercase; }
          .subtitle { font-size: 10pt; font-style: italic; color: #475569; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt; }
          .meta-table td { padding: 4px; vertical-align: top; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .data-table th, .data-table td { border: 1px solid #64748b; padding: 6px 8px; font-size: 9pt; text-align: left; }
          .data-table th { background-color: #0f766e; color: white; font-weight: bold; text-align: center; }
          .box { border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f8fafc; margin-bottom: 12px; border-radius: 4px; font-size: 9pt; }
          .signature-table { width: 100%; margin-top: 20px; border-collapse: collapse; text-align: center; font-size: 9.5pt; page-break-inside: avoid; }
          .signature-table td { padding: 8px; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${currentJurnal.judul || 'JURNAL HARIAN PELAKSANAAN PEMBELAJARAN'}</div>
          <div class="subtitle">Rencana Pembelajaran Mendalam (RPM) - Kurikulum Merdeka</div>
          <div style="font-weight: bold; font-size: 10pt; margin-top: 3px;">${identitas.namaSekolah || ''}</div>
        </div>

        <!-- IDENTITAS JURNAL (HANYA KELAS / FASE DAN SEMESTER / TA) -->
        <table class="meta-table">
          <tr>
            <td width="50%"><strong>Kelas / Fase:</strong> ${identitas.faseKelas}</td>
            <td width="50%"><strong>Semester / TA:</strong> ${identitas.semesterTahun}</td>
          </tr>
        </table>

        ${currentJurnal.catatanRefleksiUmum ? `
        <div class="box">
          <strong>CATATAN REFLEKSI & KETERLAKSANAAN PEMBELAJARAN:</strong><br/>
          <em>${currentJurnal.catatanRefleksiUmum}</em>
        </div>
        ` : ''}

        <table class="data-table">
          <thead>
            <tr>
              <th width="4%">No</th>
              <th width="12%">Hari dan Tanggal</th>
              <th width="11%">Pertemuan / Jam</th>
              <th width="12%">Mata Pelajaran</th>
              <th width="20%">Alur Tujuan Pembelajaran</th>
              <th width="18%">Materi / Aktivitas</th>
              <th width="11%">Penilaian</th>
              <th width="12%">Catatan dan Kendala</th>
            </tr>
          </thead>
          <tbody>
            ${currentJurnal.entries
              .map(
                (e, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td>${e.hariTanggal}</td>
                <td>${e.pertemuanJam}</td>
                <td style="font-weight: bold; color: #0f766e;">${e.mataPelajaran}</td>
                <td>${e.atp}</td>
                <td>${e.materiAktivitas}</td>
                <td>${e.penilaian}</td>
                <td>${e.catatanKendala}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <!-- SIGNATURES -->
        <table class="signature-table">
          <tr>
            <td width="50%">
              <p style="margin-bottom: 4px;">Mengetahui,</p>
              <p style="font-weight: bold; margin-top: 0;">Kepala Sekolah ${identitas.namaSekolah}</p>
              <div style="height: 50px; border-bottom: 1px dashed #cbd5e1; margin: 10px 40px;"></div>
              <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">${identitas.namaKepsek || '_________________________'}</p>
              <p style="font-size: 8.5pt; color: #64748b; margin-top: 0;">NIP. ${identitas.nipKepsek || '...........................................'}</p>
            </td>
            <td width="50%">
              <p style="margin-bottom: 4px;">Guru Mata Pelajaran,</p>
              <p style="font-weight: bold; margin-top: 0;">${identitas.namaSekolah}</p>
              <div style="height: 50px; border-bottom: 1px dashed #cbd5e1; margin: 10px 40px;"></div>
              <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">${identitas.namaGuru || '_________________________'}</p>
              <p style="font-size: 8.5pt; color: #64748b; margin-top: 0;">NIP. ${identitas.nipGuru || '...........................................'}</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Strategy 1: Popup window
    try {
      const printWin = window.open('', '_blank', 'width=1000,height=800');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (e) {}
        }, 350);
        return;
      }
    } catch (e) {}

    // Strategy 2: Blob URL window
    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWin = window.open(url, '_blank');
      if (printWin) {
        printWin.onload = () => {
          printWin.focus();
          printWin.print();
        };
        setTimeout(() => {
          try {
            printWin.focus();
            printWin.print();
          } catch (e) {}
        }, 500);
        return;
      }
    } catch (e) {}

    // Strategy 3: Hidden iframe
    try {
      let existingIframe = document.getElementById('jurnal-print-frame') as HTMLIFrameElement | null;
      if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
      }

      const printIframe = document.createElement('iframe');
      printIframe.id = 'jurnal-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '1px';
      printIframe.style.height = '1px';
      printIframe.style.opacity = '0.01';
      printIframe.style.pointerEvents = 'none';
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();
        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        }, 400);
      }
    } catch (err) {
      alert('Gagal membuka jendela cetak. Periksa izin pop-up browser Anda.');
    }
  };

  const handleDownloadWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Jurnal Harian Pelaksanaan Pembelajaran - ${identitas.faseKelas}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Calibri', sans-serif; font-size: 10pt; line-height: 1.4; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 13pt; font-weight: bold; color: #0f766e; text-transform: uppercase; }
          .subtitle { font-size: 10pt; font-style: italic; color: #475569; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt; }
          .meta-table td { padding: 4px; vertical-align: top; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .data-table th, .data-table td { border: 1px solid #64748b; padding: 6px 8px; font-size: 9pt; text-align: left; }
          .data-table th { background-color: #0f766e; color: white; font-weight: bold; text-align: center; }
          .box { border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f8fafc; margin-bottom: 12px; border-radius: 4px; font-size: 9pt; }
          .signature-table { width: 100%; margin-top: 25px; border-collapse: collapse; text-align: center; font-size: 9.5pt; }
          .signature-table td { padding: 8px; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${currentJurnal.judul || 'JURNAL HARIAN PELAKSANAAN PEMBELAJARAN'}</div>
          <div class="subtitle">Rencana Pembelajaran Mendalam (RPM) - Kurikulum Merdeka</div>
          <div style="font-weight: bold; font-size: 10pt; margin-top: 3px;">${identitas.namaSekolah || ''}</div>
        </div>

        <table class="meta-table">
          <tr>
            <td width="50%"><strong>Kelas / Fase:</strong> ${identitas.faseKelas}</td>
            <td width="50%"><strong>Semester / TA:</strong> ${identitas.semesterTahun}</td>
          </tr>
        </table>

        ${currentJurnal.catatanRefleksiUmum ? `
        <div class="box">
          <strong>CATATAN REFLEKSI & KETERLAKSANAAN PEMBELAJARAN:</strong><br/>
          <em>${currentJurnal.catatanRefleksiUmum}</em>
        </div>
        ` : ''}

        <table class="data-table">
          <thead>
            <tr>
              <th width="4%">No</th>
              <th width="12%">Hari dan Tanggal</th>
              <th width="11%">Pertemuan / Jam</th>
              <th width="12%">Mata Pelajaran</th>
              <th width="20%">Alur Tujuan Pembelajaran</th>
              <th width="18%">Materi / Aktivitas</th>
              <th width="11%">Penilaian</th>
              <th width="12%">Catatan dan Kendala</th>
            </tr>
          </thead>
          <tbody>
            ${currentJurnal.entries
              .map(
                (e, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td>${e.hariTanggal}</td>
                <td>${e.pertemuanJam}</td>
                <td style="font-weight: bold; color: #0f766e;">${e.mataPelajaran}</td>
                <td>${e.atp}</td>
                <td>${e.materiAktivitas}</td>
                <td>${e.penilaian}</td>
                <td>${e.catatanKendala}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <!-- SIGNATURES -->
        <table class="signature-table">
          <tr>
            <td width="50%">
              <p style="margin-bottom: 4px;">Mengetahui,</p>
              <p style="font-weight: bold; margin-top: 0;">Kepala Sekolah ${identitas.namaSekolah}</p>
              <div style="height: 50px; border-bottom: 1px dashed #cbd5e1; margin: 10px 40px;"></div>
              <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">${identitas.namaKepsek || '_________________________'}</p>
              <p style="font-size: 8.5pt; color: #64748b; margin-top: 0;">NIP. ${identitas.nipKepsek || '...........................................'}</p>
            </td>
            <td width="50%">
              <p style="margin-bottom: 4px;">Guru Mata Pelajaran,</p>
              <p style="font-weight: bold; margin-top: 0;">${identitas.namaSekolah}</p>
              <div style="height: 50px; border-bottom: 1px dashed #cbd5e1; margin: 10px 40px;"></div>
              <p style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">${identitas.namaGuru || '_________________________'}</p>
              <p style="font-size: 8.5pt; color: #64748b; margin-top: 0;">NIP. ${identitas.nipGuru || '...........................................'}</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jurnal_Harian_${identitas.faseKelas.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    onSaveJurnal(editableJurnal);
    setIsEditing(false);
  };

  const updateEntryField = (index: number, field: keyof JurnalHarianEntry, value: string) => {
    const newEntries = [...editableJurnal.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEditableJurnal({ ...editableJurnal, entries: newEntries });
  };

  const addEntry = () => {
    const newEntry: JurnalHarianEntry = {
      hariTanggal: 'Senin, ... 2026',
      pertemuanJam: 'Pertemuan ke-...',
      mataPelajaran: identitas.mataPelajaran || 'Mata Pelajaran',
      atp: tujuanDanDpl.tujuanPembelajaran || 'Alur Tujuan Pembelajaran',
      materiAktivitas: 'Materi & Aktivitas Pembelajaran',
      penilaian: 'Asesmen Formatif (Observasi / LKPD)',
      catatanKendala: 'Catatan dan kendala pelaksanaan...',
    };
    setEditableJurnal({
      ...editableJurnal,
      entries: [...editableJurnal.entries, newEntry],
    });
  };

  const removeEntry = (index: number) => {
    setEditableJurnal({
      ...editableJurnal,
      entries: editableJurnal.entries.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-800 to-teal-900 text-white flex items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-700/80 rounded-xl border border-teal-600/50">
              <Calendar className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Jurnal Harian Pelaksanaan Pembelajaran
              </h2>
              <p className="text-xs text-teal-200">
                Catatan Alur Tujuan Pembelajaran, Materi, Penilaian, serta Catatan & Kendala Guru
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 text-teal-200 hover:text-white hover:bg-teal-700/50 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL TOOLBAR */}
        <div className="bg-slate-100 border-b border-slate-200 p-3 px-4 flex flex-wrap items-center justify-between gap-2.5 print:hidden shrink-0 text-xs font-semibold">
          {/* Left: Mode / Edit Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer transition-all shadow-xs font-bold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan Jurnal</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                <span>Edit Jurnal Harian</span>
              </button>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={addEntry}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            )}
          </div>

          {/* Right: Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWord}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg cursor-pointer transition-all shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh Word</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg cursor-pointer transition-all shadow-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF Jurnal</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY DOCUMENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50">
          <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200 max-w-5xl mx-auto font-sans text-slate-800 text-xs sm:text-sm leading-relaxed">
            
            {/* KOP HEADER JURNAL */}
            <div className="border-b-2 border-teal-800 pb-4 mb-6 text-center">
              {isEditing ? (
                <input
                  type="text"
                  value={currentJurnal.judul || ''}
                  onChange={(e) => setEditableJurnal({ ...currentJurnal, judul: e.target.value })}
                  placeholder="Isikan judul jurnal harian..."
                  className="w-full text-center font-bold text-sm sm:text-base bg-amber-50 border border-amber-300 rounded p-1.5 text-teal-900"
                />
              ) : (
                <>
                  <h1 className="text-base sm:text-xl font-extrabold text-teal-900 uppercase tracking-wide">
                    {currentJurnal.judul || 'JURNAL HARIAN PELAKSANAAN PEMBELAJARAN'}
                  </h1>
                  <p className="text-xs sm:text-sm text-teal-700 font-semibold mt-1">
                    Dokumen Pelaksanaan Pembelajaran Mendalam (Deep Learning)
                  </p>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    {identitas.namaSekolah || 'Sekolah Dasar / Menengah'}
                  </p>
                </>
              )}
            </div>

            {/* IDENTITAS INFORMASI TABLE (HANYA KELAS/FASE & SEMESTER/TA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 min-w-28">Kelas / Fase:</span>
                <span className="font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">{identitas.faseKelas}</span>
              </div>
              <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                <span className="font-bold text-slate-700 min-w-28">Semester / TA:</span>
                <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200">{identitas.semesterTahun}</span>
              </div>
            </div>

            {/* CATATAN REFLEKSI UMUM */}
            <div className="mb-6 p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl">
              <span className="font-bold text-teal-900 block mb-1 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-teal-700" />
                Catatan Refleksi & Keterlaksanaan Pembelajaran:
              </span>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={currentJurnal.catatanRefleksiUmum}
                  onChange={(e) => setEditableJurnal({ ...currentJurnal, catatanRefleksiUmum: e.target.value })}
                  placeholder="Isikan catatan refleksi keterlaksanaan pembelajaran..."
                  className="w-full bg-amber-50 border border-amber-300 rounded p-2 text-xs"
                />
              ) : (
                <p className="text-slate-700 italic text-xs leading-relaxed">
                  "{currentJurnal.catatanRefleksiUmum || 'Pembelajaran terlaksana dengan baik.'}"
                </p>
              )}
            </div>

            {/* TABEL JURNAL HARIAN */}
            <div className="mb-8 overflow-x-auto rounded-xl border border-slate-300 shadow-2xs">
              <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-teal-800 text-white font-semibold">
                    <th className="p-2.5 border-b border-teal-900 border-r border-teal-700 text-center w-8">No</th>
                    <th className="p-2.5 border-b border-teal-900 border-r border-teal-700 w-28">Hari dan Tanggal</th>
                    <th className="p-2.5 border-b border-teal-900 border-r border-teal-700 w-28">Pertemuan / Jam</th>
                    <th className="p-2.5 border-b border-teal-900 border-r border-teal-700 w-28">Mata Pelajaran</th>
                    <th className="p-2.5 border-b border-teal-900 border-r border-teal-700">Alur Tujuan Pembelajaran</th>
                    <th className="p-2.5 border-b border-teal-900 border-r border-teal-700">Materi / Aktivitas</th>
                    <th className="p-2.5 border-b border-teal-900 border-r border-teal-700 w-28">Penilaian</th>
                    <th className="p-2.5 border-b border-teal-900 border-r border-teal-700">Catatan dan Kendala</th>
                    {isEditing && <th className="p-2.5 border-b border-teal-900 text-center w-10">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {currentJurnal.entries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-600">{idx + 1}</td>
                      <td className="p-2.5 border-r border-slate-200">
                        {isEditing ? (
                          <input
                            type="text"
                            value={entry.hariTanggal}
                            onChange={(e) => updateEntryField(idx, 'hariTanggal', e.target.value)}
                            placeholder="Isikan hari & tanggal..."
                            className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                          />
                        ) : (
                          <span className="font-semibold text-slate-800">{entry.hariTanggal}</span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {isEditing ? (
                          <input
                            type="text"
                            value={entry.pertemuanJam}
                            onChange={(e) => updateEntryField(idx, 'pertemuanJam', e.target.value)}
                            placeholder="Isikan pertemuan & jam ke-..."
                            className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                          />
                        ) : (
                          <span className="text-slate-700">{entry.pertemuanJam}</span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {isEditing ? (
                          <input
                            type="text"
                            value={entry.mataPelajaran}
                            onChange={(e) => updateEntryField(idx, 'mataPelajaran', e.target.value)}
                            placeholder="Isikan mata pelajaran..."
                            className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                          />
                        ) : (
                          <span className="font-bold text-teal-900">{entry.mataPelajaran}</span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={entry.atp}
                            onChange={(e) => updateEntryField(idx, 'atp', e.target.value)}
                            placeholder="Isikan Alur Tujuan Pembelajaran (ATP)..."
                            className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                          />
                        ) : (
                          <span className="text-slate-800 font-medium">{entry.atp}</span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={entry.materiAktivitas}
                            onChange={(e) => updateEntryField(idx, 'materiAktivitas', e.target.value)}
                            placeholder="Isikan materi & aktivitas..."
                            className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                          />
                        ) : (
                          <span className="text-slate-700">{entry.materiAktivitas}</span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={entry.penilaian}
                            onChange={(e) => updateEntryField(idx, 'penilaian', e.target.value)}
                            placeholder="Isikan bentuk penilaian..."
                            className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                          />
                        ) : (
                          <span className="inline-block bg-teal-50 text-teal-900 font-medium px-2 py-1 rounded text-[11px] border border-teal-200">
                            {entry.penilaian}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            value={entry.catatanKendala}
                            onChange={(e) => updateEntryField(idx, 'catatanKendala', e.target.value)}
                            placeholder="Isikan catatan dan kendala..."
                            className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                          />
                        ) : (
                          <span className="text-slate-700">{entry.catatanKendala}</span>
                        )}
                      </td>
                      {isEditing && (
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeEntry(idx)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LEMBAR PARAF & VERIFIKASI TANDA TANGAN */}
            <div className="pt-4 border-t border-slate-200 mt-6">
              <h3 className="text-xs font-bold text-teal-900 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                Kolom Paraf & Verifikasi Jurnal Harian Guru:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <p className="font-bold text-slate-800">Mengetahui & Memverifikasi,</p>
                  <p className="text-slate-600 font-semibold">Kepala Sekolah {identitas.namaSekolah}</p>
                  <div className="h-16 border-b border-dashed border-slate-300 mx-8 my-3 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic">( Tanda Tangan & Stempel )</span>
                  </div>
                  <p className="font-bold text-slate-900 underline">{identitas.namaKepsek || '_________________________'}</p>
                  <p className="text-slate-500 text-[11px]">NIP. {identitas.nipKepsek || '...........................................'}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <p className="font-bold text-slate-800">Pembuat Jurnal Harian,</p>
                  <p className="text-slate-600 font-semibold">Guru Mata Pelajaran</p>
                  <div className="h-16 border-b border-dashed border-slate-300 mx-8 my-3 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic">( Paraf / Tanda Tangan Guru )</span>
                  </div>
                  <p className="font-bold text-slate-900 underline">{identitas.namaGuru || '_________________________'}</p>
                  <p className="text-slate-500 text-[11px]">NIP. {identitas.nipGuru || '...........................................'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
