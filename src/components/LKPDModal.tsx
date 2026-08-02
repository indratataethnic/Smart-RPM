import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Printer, 
  FileDown, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  BookOpen, 
  FlaskConical, 
  HelpCircle, 
  ListChecks, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2,
  RefreshCw,
  Award
} from 'lucide-react';
import { LKPDData, LessonPlanOutput } from '../types';

interface LKPDModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: LessonPlanOutput;
  lkpdData?: LKPDData;
  onSaveLKPD: (newLkpd: LKPDData) => void;
  onGenerateLKPD: (customInstruction?: string) => Promise<void>;
  isGenerating: boolean;
}

export const LKPDModal: React.FC<LKPDModalProps> = ({
  isOpen,
  onClose,
  planData,
  lkpdData,
  onSaveLKPD,
  onGenerateLKPD,
  isGenerating,
}) => {
  const [showAnswerKeys, setShowAnswerKeys] = useState<boolean>(true); // Mode Guru vs Mode Siswa
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showPromptInput, setShowPromptInput] = useState<boolean>(false);

  // Local state for editable LKPD
  const [editableLkpd, setEditableLkpd] = useState<LKPDData | undefined>(lkpdData);

  React.useEffect(() => {
    setEditableLkpd(lkpdData);
  }, [lkpdData]);

  if (!isOpen) return null;

  const currentLkpd = editableLkpd || lkpdData;

  const handleCopyText = () => {
    if (!currentLkpd) return;
    const { identitas, tujuanDanDpl } = planData;

    let text = `====================================================\n`;
    text += `${currentLkpd.judulLKPD}\n`;
    text += `${currentLkpd.subJudul || ''}\n`;
    text += `====================================================\n\n`;
    text += `Mata Pelajaran : ${identitas.mataPelajaran}\n`;
    text += `Kelas / Fase   : ${identitas.faseKelas}\n`;
    text += `Topik / Materi  : ${tujuanDanDpl.lingkupMateri}\n`;
    text += `Nama Siswa     : ....................................\n`;
    text += `Kelompok       : ....................................\n\n`;

    text += `--- I. LEMBAR PENUGASAN & DISKUSI KELOMPOK ---\n`;
    text += `Tujuan: ${currentLkpd.lembarPenugasan.tujuanAktivitas}\n`;
    text += `Alat & Bahan: ${currentLkpd.lembarPenugasan.alatDanBahan.join(', ')}\n`;
    text += `Instruksi Kerja:\n${currentLkpd.lembarPenugasan.instruksiKerja.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n`;

    text += `--- II. PANDUAN AKTIVITAS PRAKTIKUM & EKSPLORASI ---\n`;
    text += `Judul: ${currentLkpd.panduanPraktikum.judulEksplorasi}\n`;
    text += `Langkah Kerja:\n${currentLkpd.panduanPraktikum.langkahKerja.map((l, idx) => `${idx + 1}. ${l}`).join('\n')}\n`;
    text += `Pertanyaan Analisis:\n${currentLkpd.panduanPraktikum.pertanyaanAnalisis.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}\n\n`;

    text += `--- III. LATIHAN SOAL & EVALUASI ---\n`;
    text += `A. Pilihan Ganda:\n`;
    currentLkpd.latihanSoal.pilihanGanda.forEach((q, idx) => {
      text += `${idx + 1}. ${q.pertanyaan}\n`;
      if (q.pilihan) {
        q.pilihan.forEach((opt) => (text += `   ${opt}\n`));
      }
      if (showAnswerKeys) {
        text += `   [Kunci Jawaban: ${q.kunciJawaban}]\n   [Pembahasan: ${q.pembahasan}]\n`;
      }
      text += `\n`;
    });

    text += `B. Soal Uraian:\n`;
    currentLkpd.latihanSoal.soalUraian.forEach((q, idx) => {
      text += `${idx + 1}. ${q.pertanyaan}\n`;
      if (showAnswerKeys) {
        text += `   [Kunci Jawaban: ${q.kunciJawaban}]\n   [Pembahasan: ${q.pembahasan}]\n`;
      }
      text += `\n`;
    });

    text += `--- IV. LEMBAR REFLEKSI SISWA ---\n`;
    text += `Pertanyaan Refleksi:\n${currentLkpd.refleksiSiswa.pertanyaanRefleksi.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (!currentLkpd) return;

    const { identitas, tujuanDanDpl } = planData;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset='utf-8'>
        <title>${currentLkpd.judulLKPD}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.4; color: #1e293b; margin: 0; padding: 15px; }
          .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 15px; }
          .title { font-size: 14pt; font-weight: bold; color: #0f766e; text-transform: uppercase; }
          .subtitle { font-size: 11pt; font-style: italic; color: #475569; }
          .meta-table, .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .meta-table td { padding: 5px; font-size: 10pt; vertical-align: top; }
          .data-table th, .data-table td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 10pt; text-align: left; }
          .data-table th { background-color: #f1f5f9; font-weight: bold; color: #0f766e; }
          .section-title { background-color: #0f766e; color: white; padding: 6px 10px; font-weight: bold; font-size: 11pt; margin-top: 15px; margin-bottom: 10px; page-break-after: avoid; border-radius: 3px; }
          .box { border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc; margin-bottom: 10px; border-radius: 4px; }
          .answer-key { background-color: #f0fdf4; border: 1px solid #86efac; padding: 6px 10px; margin-top: 6px; font-size: 9.5pt; color: #166534; border-radius: 4px; }
          .question-item { margin-bottom: 14px; page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${currentLkpd.judulLKPD}</div>
          <div class="subtitle">${currentLkpd.subJudul || 'Aktivitas Pembelajaran Mendalam (Deep Learning)'}</div>
          <div style="font-weight: bold; font-size: 10pt; margin-top: 4px;">${identitas.namaSekolah || ''}</div>
        </div>

        <table class="meta-table">
          <tr>
            <td width="50%"><strong>Mata Pelajaran:</strong> ${identitas.mataPelajaran}</td>
            <td width="50%"><strong>Kelas / Fase:</strong> ${identitas.faseKelas}</td>
          </tr>
          <tr>
            <td><strong>Topik Pembelajaran:</strong> ${tujuanDanDpl.lingkupMateri}</td>
            <td><strong>Semester / TA:</strong> ${identitas.semesterTahun}</td>
          </tr>
          <tr>
            <td><strong>Nama Siswa / Kelompok:</strong> .....................................</td>
            <td><strong>Tanggal / Pertemuan:</strong> .....................................</td>
          </tr>
        </table>

        <!-- PETUNJUK UMUM -->
        <div class="box">
          <strong>PETUNJUK UMUM:</strong>
          <ul style="margin-top: 4px; margin-bottom: 0; padding-left: 20px;">
            ${currentLkpd.petunjukUmum.map((p) => `<li>${p}</li>`).join('')}
          </ul>
        </div>

        <!-- I. LEMBAR PENUGASAN -->
        <div class="section-title">I. LEMBAR PENUGASAN & DISKUSI KELOMPOK</div>
        <p><strong>Tujuan Aktivitas:</strong> ${currentLkpd.lembarPenugasan.tujuanAktivitas}</p>
        <p><strong>Alat & Bahan:</strong> ${currentLkpd.lembarPenugasan.alatDanBahan.join(', ')}</p>
        <p><strong>Langkah Kerja Penugasan:</strong></p>
        <ol style="padding-left: 20px;">
          ${currentLkpd.lembarPenugasan.instruksiKerja.map((ik) => `<li style="margin-bottom: 4px;">${ik}</li>`).join('')}
        </ol>

        <!-- II. PANDUAN PRAKTIKUM -->
        <div class="section-title">II. PANDUAN AKTIVITAS PRAKTIKUM & EKSPLORASI SISWA</div>
        <p><strong>Eksplorasi:</strong> ${currentLkpd.panduanPraktikum.judulEksplorasi}</p>
        <p><strong>Tujuan Praktikum:</strong> ${currentLkpd.panduanPraktikum.tujuanPraktikum}</p>
        <p><strong>Langkah Kerja Praktikum:</strong></p>
        <ol style="padding-left: 20px;">
          ${currentLkpd.panduanPraktikum.langkahKerja.map((lk) => `<li style="margin-bottom: 4px;">${lk}</li>`).join('')}
        </ol>

        <p><strong>${currentLkpd.panduanPraktikum.tabelPengamatan.judulTabel}:</strong></p>
        <table class="data-table">
          <thead>
            <tr>
              ${currentLkpd.panduanPraktikum.tabelPengamatan.headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${currentLkpd.panduanPraktikum.tabelPengamatan.rows
              .map(
                (r) =>
                  `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>

        <p><strong>Pertanyaan Analisis & Diskusi Praktikum:</strong></p>
        <ol style="padding-left: 20px;">
          ${currentLkpd.panduanPraktikum.pertanyaanAnalisis.map((pa) => `<li style="margin-bottom: 20px;">${pa}</li>`).join('')}
        </ol>

        <!-- III. LATIHAN SOAL -->
        <div class="section-title">III. LATIHAN SOAL & EVALUASI PEMBELAJARAN</div>
        <p><em>${currentLkpd.latihanSoal.petunjukPengerjaan}</em></p>

        <h3 style="font-size: 11pt; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 15px;">A. Pilihan Ganda</h3>
        ${currentLkpd.latihanSoal.pilihanGanda
          .map(
            (q) => `
          <div class="question-item">
            <p style="margin-bottom: 4px;"><strong>${q.no}. ${q.pertanyaan}</strong></p>
            ${
              q.pilihan
                ? `<ul style="list-style-type: none; padding-left: 15px; margin-top: 4px; margin-bottom: 6px;">
                  ${q.pilihan.map((p) => `<li style="margin-bottom: 2px;">${p}</li>`).join('')}
                </ul>`
                : ''
            }
            ${
              showAnswerKeys
                ? `<div class="answer-key">
                    <strong>Kunci Jawaban:</strong> ${q.kunciJawaban}<br/>
                    <strong>Pembahasan:</strong> ${q.pembahasan}
                  </div>`
                : ''
            }
          </div>
        `
          )
          .join('')}

        <h3 style="font-size: 11pt; color: #0f766e; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 15px;">B. Soal Uraian / HOTS</h3>
        ${currentLkpd.latihanSoal.soalUraian
          .map(
            (q) => `
          <div class="question-item">
            <p style="margin-bottom: 4px;"><strong>${q.no}. ${q.pertanyaan}</strong></p>
            ${
              showAnswerKeys
                ? `<div class="answer-key">
                    <strong>Kunci Jawaban & Rubrik:</strong> ${q.kunciJawaban}<br/>
                    <strong>Pembahasan:</strong> ${q.pembahasan}
                  </div>`
                : `<div style="height: 60px; border: 1px dashed #94a3b8; margin-top: 6px; border-radius: 4px;"></div>`
            }
          </div>
        `
          )
          .join('')}

        <!-- IV. REFLEKSI SISWA -->
        <div class="section-title">IV. LEMBAR REFLEKSI & PENILAIAN DIRI SISWA</div>
        <p><strong>Pertanyaan Refleksi:</strong></p>
        <ol style="padding-left: 20px;">
          ${currentLkpd.refleksiSiswa.pertanyaanRefleksi.map((pr) => `<li style="margin-bottom: 15px;">${pr}</li>`).join('')}
        </ol>

        <p><strong>Checklist Evaluasi Diri:</strong></p>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 70%;">Pernyataan Sikap & Pemahaman</th>
              <th style="width: 15%; text-align: center;">Ya</th>
              <th style="width: 15%; text-align: center;">Tidak</th>
            </tr>
          </thead>
          <tbody>
            ${currentLkpd.refleksiSiswa.checkListDiri
              .map(
                (cl) => `
              <tr>
                <td>${cl}</td>
                <td></td>
                <td></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Strategy 1: Open popup window directly
    try {
      const printWin = window.open('', '_blank', 'width=950,height=850');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (err) {
            console.warn('Popup print command error:', err);
          }
        }, 350);
        return;
      }
    } catch (e) {
      console.warn('Window open blocked, falling back to Blob URL or iframe:', e);
    }

    // Strategy 2: Blob URL window opening
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
    } catch (e) {
      console.warn('Blob print error:', e);
    }

    // Strategy 3: Hidden iframe in body
    try {
      let existingIframe = document.getElementById('lkpd-print-frame') as HTMLIFrameElement | null;
      if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
      }

      const printIframe = document.createElement('iframe');
      printIframe.id = 'lkpd-print-frame';
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
      console.error('All print strategies failed:', err);
      alert('Gagal membuka jendela cetak. Silakan periksa pengaturan pop-up di peramban Anda.');
    }
  };

  const handleDownloadWord = () => {
    if (!currentLkpd) return;

    const { identitas, tujuanDanDpl } = planData;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${currentLkpd.judulLKPD}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.4; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 15px; }
          .title { font-size: 14pt; font-weight: bold; color: #0f766e; }
          .subtitle { font-size: 11pt; font-style: italic; color: #475569; }
          .meta-table, .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .meta-table td { padding: 4px; font-size: 10pt; }
          .data-table th, .data-table td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 10pt; text-align: left; }
          .data-table th { background-color: #f1f5f9; font-weight: bold; }
          .section-title { background-color: #0f766e; color: white; padding: 6px 10px; font-weight: bold; font-size: 11pt; margin-top: 15px; margin-bottom: 10px; }
          .box { border: 1px solid #cbd5e1; padding: 10px; background-color: #f8fafc; margin-bottom: 10px; border-radius: 4px; }
          .answer-key { background-color: #f0fdf4; border: 1px solid #86efac; padding: 6px; margin-top: 4px; font-size: 9.5pt; color: #166534; }
          .question-item { margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${currentLkpd.judulLKPD}</div>
          <div class="subtitle">${currentLkpd.subJudul || 'Aktivitas Pembelajaran Mendalam (Deep Learning)'}</div>
          <div>${identitas.namaSekolah || ''}</div>
        </div>

        <table class="meta-table">
          <tr>
            <td><strong>Mata Pelajaran:</strong> ${identitas.mataPelajaran}</td>
            <td><strong>Kelas / Fase:</strong> ${identitas.faseKelas}</td>
          </tr>
          <tr>
            <td><strong>Topik Pembelajaran:</strong> ${tujuanDanDpl.lingkupMateri}</td>
            <td><strong>Semester / TA:</strong> ${identitas.semesterTahun}</td>
          </tr>
          <tr>
            <td><strong>Nama Siswa / Kelompok:</strong> .....................................</td>
            <td><strong>Tanggal / Pertemuan:</strong> .....................................</td>
          </tr>
        </table>

        <!-- PETUNJUK UMUM -->
        <div class="box">
          <strong>PETUNJUK UMUM:</strong>
          <ul>
            ${currentLkpd.petunjukUmum.map((p) => `<li>${p}</li>`).join('')}
          </ul>
        </div>

        <!-- I. LEMBAR PENUGASAN -->
        <div class="section-title">I. LEMBAR PENUGASAN & DISKUSI KELOMPOK</div>
        <p><strong>Tujuan Aktivitas:</strong> ${currentLkpd.lembarPenugasan.tujuanAktivitas}</p>
        <p><strong>Alat & Bahan:</strong> ${currentLkpd.lembarPenugasan.alatDanBahan.join(', ')}</p>
        <p><strong>Langkah Kerja Penugasan:</strong></p>
        <ol>
          ${currentLkpd.lembarPenugasan.instruksiKerja.map((ik) => `<li>${ik}</li>`).join('')}
        </ol>

        <!-- II. PANDUAN PRAKTIKUM -->
        <div class="section-title">II. PANDUAN AKTIVITAS PRAKTIKUM & EKSPLORASI SISWA</div>
        <p><strong>Eksplorasi:</strong> ${currentLkpd.panduanPraktikum.judulEksplorasi}</p>
        <p><strong>Tujuan Praktikum:</strong> ${currentLkpd.panduanPraktikum.tujuanPraktikum}</p>
        <p><strong>Langkah Kerja Praktikum:</strong></p>
        <ol>
          ${currentLkpd.panduanPraktikum.langkahKerja.map((lk) => `<li>${lk}</li>`).join('')}
        </ol>

        <p><strong>${currentLkpd.panduanPraktikum.tabelPengamatan.judulTabel}:</strong></p>
        <table class="data-table">
          <thead>
            <tr>
              ${currentLkpd.panduanPraktikum.tabelPengamatan.headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${currentLkpd.panduanPraktikum.tabelPengamatan.rows
              .map(
                (r) =>
                  `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>

        <p><strong>Pertanyaan Analisis & Diskusi Praktikum:</strong></p>
        <ol>
          ${currentLkpd.panduanPraktikum.pertanyaanAnalisis.map((pa) => `<li style="margin-bottom: 25px;">${pa}</li>`).join('')}
        </ol>

        <!-- III. LATIHAN SOAL -->
        <div class="section-title">III. LATIHAN SOAL & EVALUASI PEMBELAJARAN</div>
        <p><em>${currentLkpd.latihanSoal.petunjukPengerjaan}</em></p>

        <h3>A. Pilihan Ganda</h3>
        ${currentLkpd.latihanSoal.pilihanGanda
          .map(
            (q) => `
          <div class="question-item">
            <p><strong>${q.no}. ${q.pertanyaan}</strong></p>
            ${
              q.pilihan
                ? `<ul style="list-style-type: none; padding-left: 15px;">
                  ${q.pilihan.map((p) => `<li>${p}</li>`).join('')}
                </ul>`
                : ''
            }
            ${
              showAnswerKeys
                ? `<div class="answer-key">
                    <strong>Kunci Jawaban:</strong> ${q.kunciJawaban}<br/>
                    <strong>Pembahasan:</strong> ${q.pembahasan}
                  </div>`
                : ''
            }
          </div>
        `
          )
          .join('')}

        <h3>B. Soal Uraian / HOTS</h3>
        ${currentLkpd.latihanSoal.soalUraian
          .map(
            (q) => `
          <div class="question-item">
            <p><strong>${q.no}. ${q.pertanyaan}</strong></p>
            ${
              showAnswerKeys
                ? `<div class="answer-key">
                    <strong>Kunci Jawaban & Rubrik:</strong> ${q.kunciJawaban}<br/>
                    <strong>Pembahasan:</strong> ${q.pembahasan}
                  </div>`
                : `<div style="height: 60px; border: 1px dashed #94a3b8; margin-top: 5px; border-radius: 4px;"></div>`
            }
          </div>
        `
          )
          .join('')}

        <!-- IV. REFLEKSI SISWA -->
        <div class="section-title">IV. LEMBAR REFLEKSI & PENILAIAN DIRI SISWA</div>
        <p><strong>Pertanyaan Refleksi:</strong></p>
        <ol>
          ${currentLkpd.refleksiSiswa.pertanyaanRefleksi.map((pr) => `<li style="margin-bottom: 20px;">${pr}</li>`).join('')}
        </ol>

        <p><strong>Checklist Evaluasi Diri:</strong></p>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 70%;">Pernyataan Sikap & Pemahaman</th>
              <th style="width: 15%; text-align: center;">Ya</th>
              <th style="width: 15%; text-align: center;">Tidak</th>
            </tr>
          </thead>
          <tbody>
            ${currentLkpd.refleksiSiswa.checkListDiri
              .map(
                (cl) => `
              <tr>
                <td>${cl}</td>
                <td></td>
                <td></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LKPD_${identitas.mataPelajaran.replace(/\s+/g, '_')}_${identitas.faseKelas.replace(/\s+/g, '_')}${showAnswerKeys ? '_GURU' : '_SISWA'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (editableLkpd) {
      onSaveLKPD(editableLkpd);
      setIsEditing(false);
    }
  };

  const handleTriggerRegenerate = () => {
    onGenerateLKPD(customPrompt || undefined);
    setShowPromptInput(false);
    setCustomPrompt('');
  };

  // Updaters for Editable LKPD
  const updatePetunjukUmum = (index: number, val: string) => {
    if (!editableLkpd) return;
    const list = [...editableLkpd.petunjukUmum];
    list[index] = val;
    setEditableLkpd({ ...editableLkpd, petunjukUmum: list });
  };

  const addPetunjukUmum = () => {
    if (!editableLkpd) return;
    setEditableLkpd({
      ...editableLkpd,
      petunjukUmum: [...editableLkpd.petunjukUmum, 'Petunjuk baru...']
    });
  };

  const removePetunjukUmum = (index: number) => {
    if (!editableLkpd) return;
    setEditableLkpd({
      ...editableLkpd,
      petunjukUmum: editableLkpd.petunjukUmum.filter((_, i) => i !== index)
    });
  };

  const updatePilihanGanda = (index: number, field: string, val: any) => {
    if (!editableLkpd) return;
    const pg = [...editableLkpd.latihanSoal.pilihanGanda];
    pg[index] = { ...pg[index], [field]: val };
    setEditableLkpd({
      ...editableLkpd,
      latihanSoal: {
        ...editableLkpd.latihanSoal,
        pilihanGanda: pg
      }
    });
  };

  const updateSoalUraian = (index: number, field: string, val: any) => {
    if (!editableLkpd) return;
    const ur = [...editableLkpd.latihanSoal.soalUraian];
    ur[index] = { ...ur[index], [field]: val };
    setEditableLkpd({
      ...editableLkpd,
      latihanSoal: {
        ...editableLkpd.latihanSoal,
        soalUraian: ur
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-800 to-teal-900 text-white flex items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-700/80 rounded-xl border border-teal-600/50">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Lembar Kerja Peserta Didik (LKPD) AI
              </h2>
              <p className="text-xs text-teal-200">
                Lengkap dengan Penugasan, Panduan Praktikum, Latihan Soal & Kunci Jawaban
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
          {/* Left: Mode Switch & Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAnswerKeys(!showAnswerKeys)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                showAnswerKeys
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-900'
              }`}
              title="Ganti Tampilan Siswa (Tanpa Kunci) atau Guru (Lengkap Kunci Jawaban)"
            >
              {showAnswerKeys ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showAnswerKeys ? 'Mode Guru (Tampilkan Kunci)' : 'Mode Siswa (Sembunyikan Kunci)'}</span>
            </button>

            {isEditing ? (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer transition-all shadow-xs font-bold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                <span>Edit LKPD</span>
              </button>
            )}
          </div>

          {/* Right: Export & AI Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPromptInput(!showPromptInput)}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 rounded-lg cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate AI</span>
            </button>

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
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg cursor-pointer transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* CUSTOM AI REGENERATE PROMPT PANEL */}
        {showPromptInput && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 flex flex-col sm:flex-row items-center gap-2 shrink-0">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Contoh: Tambahkan eksperimen praktikum lapangan / Perbanyak soal uraian HOTS..."
              className="flex-1 w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={handleTriggerRegenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Generate Sekarang</span>
            </button>
          </div>
        )}

        {/* MAIN BODY DOCUMENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200">
                <Sparkles className="w-10 h-10 text-teal-600 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Sedang Menyusun LKPD Interaktif dengan AI...</h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Kecerdasan Buatan sedang menyesuaikan Lembar Penugasan, Panduan Praktikum, Tabel Pengamatan, Soal HOTS, dan Refleksi Siswa berdasarkan Rencana Pembelajaran Mendalam (RPM).
              </p>
            </div>
          ) : !currentLkpd ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <BookOpen className="w-12 h-12 text-teal-600/70" />
              <h3 className="text-base font-bold text-slate-800">LKPD Belum Dibuat</h3>
              <p className="text-xs text-slate-500 max-w-md">
                Klik tombol di bawah ini untuk membuat Lembar Kerja Peserta Didik (LKPD) lengkap secara otomatis menggunakan AI sesuai dengan RPM ini.
              </p>
              <button
                type="button"
                onClick={() => onGenerateLKPD()}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Buat LKPD dengan AI Sekarang</span>
              </button>
            </div>
          ) : (
            <div id="printable-lkpd-document" className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto font-sans text-slate-800 text-xs sm:text-sm leading-relaxed">
              
              {/* KOP HEADER LKPD */}
              <div className="border-b-2 border-teal-800 pb-4 mb-6 text-center">
                {isEditing ? (
                  <div className="space-y-2 max-w-xl mx-auto">
                    <input
                      type="text"
                      value={currentLkpd.judulLKPD}
                      onChange={(e) => setEditableLkpd({ ...currentLkpd, judulLKPD: e.target.value })}
                      className="w-full text-center font-bold text-sm bg-amber-50 border border-amber-300 rounded p-1 text-teal-900"
                    />
                    <input
                      type="text"
                      value={currentLkpd.subJudul || ''}
                      onChange={(e) => setEditableLkpd({ ...currentLkpd, subJudul: e.target.value })}
                      className="w-full text-center text-xs bg-amber-50 border border-amber-300 rounded p-1 text-teal-700"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-base sm:text-xl font-extrabold text-teal-900 uppercase tracking-wide">
                      {currentLkpd.judulLKPD}
                    </h1>
                    <p className="text-xs sm:text-sm text-teal-700 font-semibold mt-1">
                      {currentLkpd.subJudul || 'Aktivitas Pembelajaran Mendalam (Deep Learning)'}
                    </p>
                    <p className="text-xs font-medium text-slate-600 mt-0.5">
                      {planData.identitas.namaSekolah || 'Sekolah Dasar / Menengah'}
                    </p>
                  </>
                )}
              </div>

              {/* IDENTITAS SISWA & MATERI TABLE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs">
                <div>
                  <p><span className="font-bold text-slate-700">Mata Pelajaran:</span> {planData.identitas.mataPelajaran}</p>
                  <p><span className="font-bold text-slate-700">Kelas / Fase:</span> {planData.identitas.faseKelas}</p>
                  <p><span className="font-bold text-slate-700">Topik Pembelajaran:</span> {planData.tujuanDanDpl.lingkupMateri}</p>
                </div>
                <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                  <p><span className="font-bold text-slate-700">Nama Siswa / Kelompok:</span> ...............................................</p>
                  <p><span className="font-bold text-slate-700">Anggota Kelompok:</span> ...............................................</p>
                  <p><span className="font-bold text-slate-700">Hari / Tanggal:</span> ...............................................</p>
                </div>
              </div>

              {/* PETUNJUK UMUM */}
              <div className="mb-6 p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl">
                <span className="font-bold text-teal-900 block mb-1 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-teal-700" />
                  Petunjuk Umum Penggunaan LKPD:
                </span>
                {isEditing ? (
                  <div className="space-y-2">
                    {currentLkpd.petunjukUmum.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={p}
                          onChange={(e) => updatePetunjukUmum(idx, e.target.value)}
                          className="flex-1 bg-white border border-amber-300 rounded p-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removePetunjukUmum(idx)}
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPetunjukUmum}
                      className="inline-flex items-center gap-1 text-xs text-teal-700 font-bold hover:underline cursor-pointer pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Petunjuk
                    </button>
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs pl-1">
                    {currentLkpd.petunjukUmum.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* SECTION I: LEMBAR PENUGASAN */}
              <div className="mb-8">
                <h2 className="text-xs sm:text-sm font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
                  <span>I. LEMBAR PENUGASAN & DISKUSI KELOMPOK</span>
                  <BookOpen className="w-4 h-4" />
                </h2>
                
                <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-0.5">Judul Tugas:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentLkpd.lembarPenugasan.judulTugas}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          lembarPenugasan: { ...currentLkpd.lembarPenugasan, judulTugas: e.target.value }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs font-bold text-teal-800"
                      />
                    ) : (
                      <p className="font-bold text-teal-800">{currentLkpd.lembarPenugasan.judulTugas}</p>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-0.5">Tujuan Aktivitas:</span>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={currentLkpd.lembarPenugasan.tujuanAktivitas}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          lembarPenugasan: { ...currentLkpd.lembarPenugasan, tujuanAktivitas: e.target.value }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                      />
                    ) : (
                      <p className="text-slate-700 leading-relaxed">{currentLkpd.lembarPenugasan.tujuanAktivitas}</p>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-1">Alat dan Bahan:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentLkpd.lembarPenugasan.alatDanBahan.join(', ')}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          lembarPenugasan: {
                            ...currentLkpd.lembarPenugasan,
                            alatDanBahan: e.target.value.split(',').map(s => s.trim())
                          }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {currentLkpd.lembarPenugasan.alatDanBahan.map((ab, idx) => (
                          <span key={idx} className="bg-white border border-slate-300 text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            • {ab}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-1.5">Instruksi / Langkah Kerja Penugasan:</span>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={currentLkpd.lembarPenugasan.instruksiKerja.join('\n')}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          lembarPenugasan: {
                            ...currentLkpd.lembarPenugasan,
                            instruksiKerja: e.target.value.split('\n').filter(Boolean)
                          }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                        placeholder="Pisahkan setiap instruksi dengan baris baru"
                      />
                    ) : (
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pl-1">
                        {currentLkpd.lembarPenugasan.instruksiKerja.map((ik, idx) => (
                          <li key={idx} className="leading-relaxed">{ik}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION II: PANDUAN PRAKTIKUM & EKSPLORASI SISWA */}
              <div className="mb-8">
                <h2 className="text-xs sm:text-sm font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
                  <span>II. PANDUAN AKTIVITAS PRAKTIKUM & EKSPLORASI SISWA</span>
                  <FlaskConical className="w-4 h-4" />
                </h2>

                <div className="space-y-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-0.5">Judul Eksplorasi / Praktikum:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentLkpd.panduanPraktikum.judulEksplorasi}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          panduanPraktikum: { ...currentLkpd.panduanPraktikum, judulEksplorasi: e.target.value }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs font-bold text-teal-800"
                      />
                    ) : (
                      <p className="font-bold text-teal-800">{currentLkpd.panduanPraktikum.judulEksplorasi}</p>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-0.5">Tujuan Praktikum:</span>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={currentLkpd.panduanPraktikum.tujuanPraktikum}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          panduanPraktikum: { ...currentLkpd.panduanPraktikum, tujuanPraktikum: e.target.value }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                      />
                    ) : (
                      <p className="text-slate-700 leading-relaxed">{currentLkpd.panduanPraktikum.tujuanPraktikum}</p>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-1.5">Langkah Kerja Praktikum:</span>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={currentLkpd.panduanPraktikum.langkahKerja.join('\n')}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          panduanPraktikum: {
                            ...currentLkpd.panduanPraktikum,
                            langkahKerja: e.target.value.split('\n').filter(Boolean)
                          }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                        placeholder="Pisahkan setiap langkah kerja dengan baris baru"
                      />
                    ) : (
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-700 pl-1">
                        {currentLkpd.panduanPraktikum.langkahKerja.map((lk, idx) => (
                          <li key={idx} className="leading-relaxed">{lk}</li>
                        ))}
                      </ol>
                    )}
                  </div>

                  {/* TABEL PENGAMATAN */}
                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-1">
                      {currentLkpd.panduanPraktikum.tabelPengamatan.judulTabel}:
                    </span>
                    <p className="text-[11px] text-slate-500 italic mb-2">
                      {currentLkpd.panduanPraktikum.tabelPengamatan.petunjukPengisian}
                    </p>

                    <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-2xs">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-teal-700 text-white font-semibold">
                            {currentLkpd.panduanPraktikum.tabelPengamatan.headers.map((h, idx) => (
                              <th key={idx} className="p-2.5 border-b border-teal-800 border-r border-teal-600 last:border-r-0">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentLkpd.panduanPraktikum.tabelPengamatan.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-3 border-r border-slate-200 last:border-r-0 min-h-[40px] align-top">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) => {
                                        const newRows = currentLkpd.panduanPraktikum.tabelPengamatan.rows.map((r, ri) => 
                                          ri === rIdx ? r.map((c, ci) => ci === cIdx ? e.target.value : c) : r
                                        );
                                        setEditableLkpd({
                                          ...currentLkpd,
                                          panduanPraktikum: {
                                            ...currentLkpd.panduanPraktikum,
                                            tabelPengamatan: {
                                              ...currentLkpd.panduanPraktikum.tabelPengamatan,
                                              rows: newRows
                                            }
                                          }
                                        });
                                      }}
                                      className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                                    />
                                  ) : (
                                    cell || <span className="text-slate-300 italic">...isikan data hasil pengamatan...</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PERTANYAAN ANALISIS PRAKTIKUM */}
                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-1.5">Pertanyaan Analisis & Diskusi Praktikum:</span>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={currentLkpd.panduanPraktikum.pertanyaanAnalisis.join('\n')}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          panduanPraktikum: {
                            ...currentLkpd.panduanPraktikum,
                            pertanyaanAnalisis: e.target.value.split('\n').filter(Boolean)
                          }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                        placeholder="Pisahkan setiap pertanyaan dengan baris baru"
                      />
                    ) : (
                      <ol className="list-decimal list-inside space-y-3 text-slate-800 pl-1">
                        {currentLkpd.panduanPraktikum.pertanyaanAnalisis.map((pa, idx) => (
                          <li key={idx} className="space-y-1">
                            <span className="font-semibold">{pa}</span>
                            <div className="min-h-[45px] border-b border-dashed border-slate-300 bg-white rounded p-2 text-slate-400 text-[11px]">
                              <em>Lembar Jawaban Siswa...</em>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION III: LATIHAN SOAL & EVALUASI */}
              <div className="mb-8">
                <h2 className="text-xs sm:text-sm font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
                  <span>III. LATIHAN SOAL & EVALUASI PEMBELAJARAN</span>
                  <HelpCircle className="w-4 h-4" />
                </h2>

                <p className="text-xs text-slate-600 italic mb-4">
                  {currentLkpd.latihanSoal.petunjukPengerjaan}
                </p>

                {/* A. PILIHAN GANDA */}
                <div className="mb-6 space-y-4">
                  <h3 className="font-bold text-teal-900 text-xs uppercase border-b border-teal-200 pb-1">
                    A. Soal Pilihan Ganda (HOTS)
                  </h3>

                  {currentLkpd.latihanSoal.pilihanGanda.map((q, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{idx + 1}.</span>
                            <input
                              type="text"
                              value={q.pertanyaan}
                              onChange={(e) => updatePilihanGanda(idx, 'pertanyaan', e.target.value)}
                              className="flex-1 bg-amber-50 border border-amber-300 rounded p-1 text-xs font-bold"
                            />
                          </div>
                          {q.pilihan && (
                            <div className="space-y-1 pl-4">
                              {q.pilihan.map((p, pIdx) => (
                                <input
                                  key={pIdx}
                                  type="text"
                                  value={p}
                                  onChange={(e) => {
                                    const opts = [...q.pilihan!];
                                    opts[pIdx] = e.target.value;
                                    updatePilihanGanda(idx, 'pilihan', opts);
                                  }}
                                  className="w-full bg-white border border-slate-300 rounded p-1 text-xs"
                                />
                              ))}
                            </div>
                          )}
                          <div className="p-2 bg-emerald-50 rounded border border-emerald-200 space-y-1">
                            <input
                              type="text"
                              value={q.kunciJawaban}
                              onChange={(e) => updatePilihanGanda(idx, 'kunciJawaban', e.target.value)}
                              placeholder="Kunci Jawaban"
                              className="w-full bg-white border border-emerald-300 rounded p-1 text-xs text-emerald-900 font-medium"
                            />
                            <textarea
                              rows={2}
                              value={q.pembahasan}
                              onChange={(e) => updatePilihanGanda(idx, 'pembahasan', e.target.value)}
                              placeholder="Pembahasan Soal"
                              className="w-full bg-white border border-emerald-300 rounded p-1 text-xs text-emerald-900"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-bold text-slate-800">
                            {q.no || idx + 1}. {q.pertanyaan}
                          </p>

                          {q.pilihan && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3 pt-1">
                              {q.pilihan.map((p, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-2 text-slate-700 text-xs">
                                  <span className="w-4 h-4 rounded-full border border-slate-400 inline-flex items-center justify-center text-[10px] shrink-0"></span>
                                  <span>{p}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {showAnswerKeys && (
                            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 space-y-1">
                              <p><span className="font-bold text-emerald-950">Kunci Jawaban:</span> {q.kunciJawaban}</p>
                              <p><span className="font-bold text-emerald-950">Pembahasan Guru:</span> {q.pembahasan}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* B. SOAL URAIAN */}
                <div className="space-y-4">
                  <h3 className="font-bold text-teal-900 text-xs uppercase border-b border-teal-200 pb-1">
                    B. Soal Uraian / Studi Kasus
                  </h3>

                  {currentLkpd.latihanSoal.soalUraian.map((q, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{idx + 1}.</span>
                            <textarea
                              rows={2}
                              value={q.pertanyaan}
                              onChange={(e) => updateSoalUraian(idx, 'pertanyaan', e.target.value)}
                              className="flex-1 bg-amber-50 border border-amber-300 rounded p-1 text-xs font-bold"
                            />
                          </div>
                          <div className="p-2 bg-emerald-50 rounded border border-emerald-200 space-y-1">
                            <textarea
                              rows={2}
                              value={q.kunciJawaban}
                              onChange={(e) => updateSoalUraian(idx, 'kunciJawaban', e.target.value)}
                              placeholder="Kunci Jawaban & Rubrik"
                              className="w-full bg-white border border-emerald-300 rounded p-1 text-xs text-emerald-900 font-medium"
                            />
                            <textarea
                              rows={2}
                              value={q.pembahasan}
                              onChange={(e) => updateSoalUraian(idx, 'pembahasan', e.target.value)}
                              placeholder="Pembahasan Soal Uraian"
                              className="w-full bg-white border border-emerald-300 rounded p-1 text-xs text-emerald-900"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-bold text-slate-800">
                            {q.no || idx + 1}. {q.pertanyaan}
                          </p>

                          {!showAnswerKeys ? (
                            <div className="min-h-[60px] border border-dashed border-slate-300 bg-white rounded-lg p-2 text-slate-400 text-[11px]">
                              <em>Lembar Jawaban Uraian Siswa...</em>
                            </div>
                          ) : (
                            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 space-y-1">
                              <p><span className="font-bold text-emerald-950">Kunci Jawaban & Rubrik:</span> {q.kunciJawaban}</p>
                              <p><span className="font-bold text-emerald-950">Pembahasan Guru:</span> {q.pembahasan}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION IV: LEMBAR REFLEKSI SISWA */}
              <div className="mb-6">
                <h2 className="text-xs sm:text-sm font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
                  <span>IV. LEMBAR REFLEKSI & PENILAIAN DIRI SISWA</span>
                  <Award className="w-4 h-4" />
                </h2>

                <div className="space-y-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-2">Pertanyaan Refleksi Siswa:</span>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={currentLkpd.refleksiSiswa.pertanyaanRefleksi.join('\n')}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          refleksiSiswa: {
                            ...currentLkpd.refleksiSiswa,
                            pertanyaanRefleksi: e.target.value.split('\n').filter(Boolean)
                          }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                        placeholder="Pisahkan pertanyaan refleksi dengan baris baru"
                      />
                    ) : (
                      <ol className="list-decimal list-inside space-y-3 text-slate-800 pl-1">
                        {currentLkpd.refleksiSiswa.pertanyaanRefleksi.map((pr, idx) => (
                          <li key={idx} className="space-y-1">
                            <span className="font-semibold">{pr}</span>
                            <div className="min-h-[40px] border-b border-dashed border-slate-300 bg-white rounded p-2 text-slate-400 text-[11px]">
                              <em>Refleksi Diri Siswa...</em>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block text-xs mb-2">Checklist Evaluasi Mandiri:</span>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={currentLkpd.refleksiSiswa.checkListDiri.join('\n')}
                        onChange={(e) => setEditableLkpd({
                          ...currentLkpd,
                          refleksiSiswa: {
                            ...currentLkpd.refleksiSiswa,
                            checkListDiri: e.target.value.split('\n').filter(Boolean)
                          }
                        })}
                        className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs"
                        placeholder="Pisahkan item checklist dengan baris baru"
                      />
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-teal-700 text-white font-semibold">
                              <th className="p-2.5 border-b border-teal-800">Pernyataan Sikap & Pemahaman</th>
                              <th className="p-2.5 border-b border-teal-800 text-center w-16">Ya</th>
                              <th className="p-2.5 border-b border-teal-800 text-center w-16">Tidak</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {currentLkpd.refleksiSiswa.checkListDiri.map((cl, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 font-medium text-slate-700">{cl}</td>
                                <td className="p-2.5 text-center border-l border-slate-200">
                                  <span className="w-4 h-4 border border-slate-400 rounded inline-block"></span>
                                </td>
                                <td className="p-2.5 text-center border-l border-slate-200">
                                  <span className="w-4 h-4 border border-slate-400 rounded inline-block"></span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
