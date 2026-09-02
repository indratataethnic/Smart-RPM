import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Printer, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  BookOpen, 
  ExternalLink, 
  HelpCircle, 
  RefreshCw,
  FileText,
  Lightbulb,
  Info,
  FileDown,
  Layers,
  CheckCircle2,
  ListOrdered,
  Plus,
  Trash2,
  Presentation,
  CheckSquare
} from 'lucide-react';
import { BahanAjarData, JenisMateriItem, LessonPlanOutput } from '../types';

interface BahanAjarModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: LessonPlanOutput;
  bahanAjarData?: BahanAjarData;
  onSaveBahanAjar: (newData: BahanAjarData) => void;
  onGenerateBahanAjar: (customInstruction?: string) => Promise<void>;
  isGenerating: boolean;
}

export const BahanAjarModal: React.FC<BahanAjarModalProps> = ({
  isOpen,
  onClose,
  planData,
  bahanAjarData,
  onSaveBahanAjar,
  onGenerateBahanAjar,
  isGenerating,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedBoard, setCopiedBoard] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showPromptInput, setShowPromptInput] = useState<boolean>(false);

  // Local editable state
  const [editableData, setEditableData] = useState<BahanAjarData | undefined>(bahanAjarData);

  React.useEffect(() => {
    setEditableData(bahanAjarData);
  }, [bahanAjarData]);

  if (!isOpen) return null;

  const currentData = editableData || bahanAjarData;

  const handleCopyText = () => {
    if (!currentData) return;
    const { identitas, tujuanDanDpl } = planData;
    const lm = tujuanDanDpl?.lingkupMateri || 'Materi Pembelajaran';

    let text = `====================================================\n`;
    text += `${currentData.judulBahanAjar}\n`;
    text += `${currentData.subJudul || 'Kurikulum Merdeka - Bahan Ajar & Catatan Papan Tulis'}\n`;
    text += `Referensi Resmi: ${currentData.referensiUtama}\n`;
    text += `====================================================\n\n`;
    text += `Mata Pelajaran : ${identitas.mataPelajaran}\n`;
    text += `Kelas / Fase   : ${identitas.faseKelas}\n`;
    text += `Topik / Materi  : ${lm}\n\n`;

    // 1. Pengertian
    text += `--- I. PENGERTIAN & HAKIKAT KONSEP ---\n`;
    text += `${currentData.rangkumanMateriSiswa.pengertian || currentData.rangkumanMateriSiswa.penjelasanRingkas}\n\n`;

    // 2. Jenis-jenis
    if (currentData.rangkumanMateriSiswa.jenisJenis && currentData.rangkumanMateriSiswa.jenisJenis.length > 0) {
      text += `--- II. JENIS-JENIS / KLASIFIKASI MATERI ---\n`;
      currentData.rangkumanMateriSiswa.jenisJenis.forEach((j: any, idx: number) => {
        if (typeof j === 'string') {
          text += `${idx + 1}. ${j}\n`;
        } else {
          text += `${idx + 1}. ${j.nama}: ${j.deskripsi}${j.contoh ? ` (Contoh: ${j.contoh})` : ''}\n`;
        }
      });
      text += `\n`;
    }

    // 3. Ciri-ciri
    if (currentData.rangkumanMateriSiswa.ciriCiri && currentData.rangkumanMateriSiswa.ciriCiri.length > 0) {
      text += `--- III. CIRI-CIRI & KARAKTERISTIK UTAMA ---\n`;
      currentData.rangkumanMateriSiswa.ciriCiri.forEach((c: string, idx: number) => {
        text += `${idx + 1}. ${c}\n`;
      });
      text += `\n`;
    }

    // 4. Contoh Kontekstual
    text += `--- IV. CONTOH PENERAPAN SEHARI-HARI ---\n`;
    (currentData.rangkumanMateriSiswa.contohKontekstual || []).forEach((c, idx) => {
      text += `${idx + 1}. ${c}\n`;
    });
    text += `\n`;

    // 5. Catatan Papan Tulis
    if (currentData.rangkumanMateriSiswa.catatanPapanTulis && currentData.rangkumanMateriSiswa.catatanPapanTulis.length > 0) {
      text += `--- V. FORMAT CATATAN PAPAN TULIS (SIAP SALIN MURID KE BUKU CATATAN) ---\n`;
      currentData.rangkumanMateriSiswa.catatanPapanTulis.forEach((p) => {
        text += `${p}\n`;
      });
      text += `\n`;
    }

    // 6. Panduan Guru
    text += `--- VI. PANDUAN PEDAGOGIS GURU & MISKONSEPSI ---\n`;
    if (currentData.panduanGuru.tipsPapanTulis) {
      text += `Tips Papan Tulis: ${currentData.panduanGuru.tipsPapanTulis}\n`;
    }
    text += `Catatan Pedagogis: ${currentData.panduanGuru.catatanPedagogis}\n`;
    text += `Miskonsepsi Umum:\n`;
    (currentData.panduanGuru.miskonsepsiUmum || []).forEach((m, idx) => {
      text += `${idx + 1}. ${m}\n`;
    });
    text += `\n`;

    // 7. Glosarium
    text += `--- VII. GLOSARIUM ---\n`;
    (currentData.glosarium || []).forEach((g) => {
      text += `- ${g.istilah}: ${g.arti}\n`;
    });
    text += `\n`;

    // 8. Daftar Pustaka
    text += `--- VIII. DAFTAR PUSTAKA ---\n`;
    (currentData.daftarPustaka || []).forEach((d, idx) => {
      text += `${idx + 1}. ${d}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBoardNotes = () => {
    if (!currentData) return;
    const { identitas, tujuanDanDpl } = planData;
    const lm = tujuanDanDpl?.lingkupMateri || 'Materi Pembelajaran';

    let text = `CATATAN PAPAN TULIS - ${lm.toUpperCase()}\n`;
    text += `Mata Pelajaran: ${identitas.mataPelajaran} | Kelas: ${identitas.faseKelas}\n`;
    text += `========================================================\n\n`;

    if (currentData.rangkumanMateriSiswa.catatanPapanTulis && currentData.rangkumanMateriSiswa.catatanPapanTulis.length > 0) {
      currentData.rangkumanMateriSiswa.catatanPapanTulis.forEach((p) => {
        text += `${p}\n`;
      });
    } else {
      text += `1. PENGERTIAN:\n   ${currentData.rangkumanMateriSiswa.pengertian || currentData.rangkumanMateriSiswa.penjelasanRingkas}\n\n`;
      if (currentData.rangkumanMateriSiswa.jenisJenis && currentData.rangkumanMateriSiswa.jenisJenis.length > 0) {
        text += `2. JENIS-JENIS:\n`;
        currentData.rangkumanMateriSiswa.jenisJenis.forEach((j: any, i: number) => {
          text += `   (${String.fromCharCode(97 + i)}) ${typeof j === 'string' ? j : `${j.nama}: ${j.deskripsi}`}\n`;
        });
        text += `\n`;
      }
      if (currentData.rangkumanMateriSiswa.ciriCiri && currentData.rangkumanMateriSiswa.ciriCiri.length > 0) {
        text += `3. CIRI-CIRI:\n`;
        currentData.rangkumanMateriSiswa.ciriCiri.forEach((c: string, i: number) => {
          text += `   - ${c}\n`;
        });
        text += `\n`;
      }
      if (currentData.rangkumanMateriSiswa.contohKontekstual && currentData.rangkumanMateriSiswa.contohKontekstual.length > 0) {
        text += `4. CONTOH SEHARI-HARI:\n`;
        currentData.rangkumanMateriSiswa.contohKontekstual.forEach((c: string, i: number) => {
          text += `   - ${c}\n`;
        });
      }
    }

    navigator.clipboard.writeText(text);
    setCopiedBoard(true);
    setTimeout(() => setCopiedBoard(false), 2000);
  };

  const buildBahanAjarHtml = (data: BahanAjarData): string => {
    const { identitas, tujuanDanDpl } = planData;
    const lm = tujuanDanDpl?.lingkupMateri || 'Materi Pembelajaran';

    const jenisItems = data.rangkumanMateriSiswa.jenisJenis || [];
    const ciriItems = data.rangkumanMateriSiswa.ciriCiri || [];
    const boardItems = data.rangkumanMateriSiswa.catatanPapanTulis || [];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset='utf-8'>
        <title>${data.judulBahanAjar}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #1e293b; margin: 0; padding: 15px; }
          .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 15px; }
          .title { font-size: 13.5pt; font-weight: bold; color: #0f766e; text-transform: uppercase; }
          .subtitle { font-size: 10pt; font-style: italic; color: #475569; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .meta-table td { padding: 4px 6px; font-size: 9.5pt; vertical-align: top; }
          .section-title { background-color: #0f766e; color: white; padding: 6px 10px; font-weight: bold; font-size: 10.5pt; margin-top: 15px; margin-bottom: 8px; page-break-after: avoid; border-radius: 3px; }
          .box { border: 1px solid #cbd5e1; padding: 10px 12px; background-color: #f8fafc; margin-bottom: 10px; border-radius: 4px; font-size: 10pt; }
          .box-board { border: 2px dashed #0f766e; padding: 12px 14px; background-color: #f0fdfa; margin-bottom: 12px; border-radius: 6px; font-size: 10pt; }
          .box-warning { border: 1px solid #fde68a; padding: 10px 12px; background-color: #fffbeb; margin-bottom: 10px; border-radius: 4px; font-size: 10pt; }
          .badge { display: inline-block; background-color: #ccfbf1; color: #115e59; font-weight: bold; padding: 2px 8px; border-radius: 4px; font-size: 9pt; margin-bottom: 4px; }
          .glosarium-item { margin-bottom: 6px; }
          .glosarium-term { font-weight: bold; color: #0f766e; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${data.judulBahanAjar}</div>
          <div class="subtitle">${data.subJudul || 'Bahan Ajar & Panduan Catatan Papan Tulis - Kurikulum Merdeka'}</div>
          <div style="font-weight: bold; font-size: 10pt; margin-top: 4px; color: #0f766e;">${identitas.namaSekolah || ''}</div>
          <div style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">Referensi Resmi: ${data.referensiUtama}</div>
        </div>

        <table class="meta-table">
          <tr>
            <td width="50%"><strong>Mata Pelajaran:</strong> ${identitas.mataPelajaran}</td>
            <td width="50%"><strong>Kelas / Fase:</strong> ${identitas.faseKelas}</td>
          </tr>
          <tr>
            <td><strong>Topik Pembelajaran:</strong> ${lm}</td>
            <td><strong>Semester / TA:</strong> ${identitas.semesterTahun || '2025/2026'}</td>
          </tr>
        </table>

        <!-- I. PENGERTIAN & HAKIKAT KONSEP -->
        <div class="section-title">I. PENGERTIAN & HAKIKAT KONSEP MATERI</div>
        <div class="box" style="white-space: pre-line; line-height: 1.6;">
          <strong>Pengertian ${lm}:</strong><br/>
          ${data.rangkumanMateriSiswa.pengertian || data.rangkumanMateriSiswa.penjelasanRingkas}
        </div>

        <!-- II. JENIS-JENIS MATERI -->
        ${jenisItems.length > 0 ? `
        <div class="section-title">II. JENIS-JENIS / KLASIFIKASI MATERI</div>
        <div class="box">
          <table style="width: 100%; border-collapse: collapse;">
            ${jenisItems.map((j: any, idx: number) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 6px 8px; font-weight: bold; width: 30%; vertical-align: top; color: #0f766e;">
                  ${idx + 1}. ${typeof j === 'string' ? j : j.nama}
                </td>
                <td style="padding: 6px 8px; vertical-align: top;">
                  ${typeof j === 'string' ? '' : j.deskripsi}
                  ${typeof j !== 'string' && j.contoh ? `<div style="font-size: 9pt; color: #475569; margin-top: 2px;"><em>Contoh: ${j.contoh}</em></div>` : ''}
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
        ` : ''}

        <!-- III. CIRI-CIRI / KARAKTERISTIK -->
        ${ciriItems.length > 0 ? `
        <div class="section-title">III. CIRI-CIRI & KARAKTERISTIK UTAMA</div>
        <div class="box">
          <ol style="margin: 0; padding-left: 20px;">
            ${ciriItems.map((c: string) => `<li style="margin-bottom: 5px;">${c}</li>`).join('')}
          </ol>
        </div>
        ` : ''}

        <!-- IV. CONTOH KONTEKSTUAL -->
        <div class="section-title">IV. CONTOH PENERAPAN NYATA SEHARI-HARI</div>
        <div class="box">
          <ul style="margin: 0; padding-left: 20px;">
            ${(data.rangkumanMateriSiswa.contohKontekstual || []).map((c) => `<li style="margin-bottom: 4px;">${c}</li>`).join('')}
          </ul>
        </div>

        <!-- V. CATATAN PAPAN TULIS (BOARD NOTES) -->
        <div class="section-title">V. FORMAT CATATAN PAPAN TULIS (BAHAN SALIN MURID KE BUKU TULIS)</div>
        <div class="box-board">
          <div style="font-size: 9pt; color: #0f766e; font-weight: bold; margin-bottom: 6px;">
            *Panduan Catatan Guru di Papan Tulis untuk Disalin Murid ke Buku Catatan (Pengganti Buku Paket Cetak)*
          </div>
          ${boardItems.length > 0 ? `
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 9.5pt; line-height: 1.6; background-color: #ffffff; border: 1px solid #ccfbf1; padding: 10px; border-radius: 4px;">
              ${boardItems.map((b: string) => `<div>${b}</div>`).join('')}
            </div>
          ` : `
            <div style="font-size: 9.5pt; line-height: 1.6;">
              <p><strong>1. Definisi:</strong> ${data.rangkumanMateriSiswa.pengertian || data.rangkumanMateriSiswa.penjelasanRingkas}</p>
              ${jenisItems.length > 0 ? `<p><strong>2. Macam/Jenis:</strong> ${jenisItems.map((j: any) => typeof j === 'string' ? j : j.nama).join(', ')}</p>` : ''}
              ${ciriItems.length > 0 ? `<p><strong>3. Ciri Khas:</strong> ${ciriItems.join('; ')}</p>` : ''}
            </div>
          `}
        </div>

        <!-- VI. PANDUAN PEDAGOGIS GURU -->
        <div class="section-title">VI. PANDUAN PEDAGOGIS GURU & ANTISIPASI MISKONSEPSI</div>
        <div class="box">
          ${data.panduanGuru.tipsPapanTulis ? `
            <p style="margin-top: 0; margin-bottom: 6px;"><strong>Tips Penyajian Papan Tulis:</strong></p>
            <p style="margin-top: 0; margin-bottom: 10px; background-color: #f1f5f9; padding: 6px 10px; border-radius: 4px;">${data.panduanGuru.tipsPapanTulis}</p>
          ` : ''}
          <p style="margin-top: 0; margin-bottom: 6px;"><strong>Catatan Pedagogis Guru:</strong></p>
          <p style="margin-top: 0; margin-bottom: 10px; font-style: italic;">${data.panduanGuru.catatanPedagogis}</p>
          
          <p style="margin-top: 0; margin-bottom: 6px;"><strong>Miskonsepsi Umum & Cara Pelurusannya:</strong></p>
          <ol style="margin: 0; padding-left: 20px;">
            ${(data.panduanGuru.miskonsepsiUmum || []).map((m) => `<li style="margin-bottom: 4px;">${m}</li>`).join('')}
          </ol>
        </div>

        <!-- VII. GLOSARIUM -->
        <div class="section-title">VII. GLOSARIUM & KATA KUNCI</div>
        <div class="box">
          ${(data.glosarium || []).map((g) => `<div class="glosarium-item"><span class="glosarium-term">${g.istilah}:</span> ${g.arti}</div>`).join('')}
        </div>

        <!-- VIII. DAFTAR PUSTAKA -->
        <div class="section-title">VIII. DAFTAR PUSTAKA & SUMBER BELAJAR RESMI</div>
        <div class="box">
          <ol style="margin: 0; padding-left: 20px;">
            ${(data.daftarPustaka || []).map((d) => `<li style="margin-bottom: 4px;">${d}</li>`).join('')}
          </ol>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (!currentData) return;
    const htmlContent = buildBahanAjarHtml(currentData);

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
      let existingIframe = document.getElementById('bahanajar-print-frame') as HTMLIFrameElement | null;
      if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
      }

      const printIframe = document.createElement('iframe');
      printIframe.id = 'bahanajar-print-frame';
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
      console.error('All print strategies failed, falling back to window.print():', err);
      window.print();
    }
  };

  const handleDownloadWord = () => {
    if (!currentData) return;
    const htmlContent = buildBahanAjarHtml(currentData);
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bahan_Ajar_${(planData.identitas.mataPelajaran || 'Materi').replace(/[^a-zA-Z0-9]/g, '_')}_${(planData.identitas.faseKelas || 'Kelas').replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (editableData) {
      onSaveBahanAjar(editableData);
      setIsEditing(false);
    }
  };

  const handleRegenerate = async () => {
    await onGenerateBahanAjar(customPrompt);
    setShowPromptInput(false);
    setCustomPrompt('');
  };

  // Helper mutators for editableData
  const updatePengertian = (val: string) => {
    setEditableData((prev) => prev ? ({
      ...prev,
      rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, pengertian: val }
    }) : prev);
  };

  const addJenisItem = () => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const currentJenis = [...(prev.rangkumanMateriSiswa.jenisJenis || [])];
      currentJenis.push({
        nama: 'Jenis Baru',
        deskripsi: 'Deskripsi karakteristik jenis materi ini...',
        contoh: 'Contoh nyata...'
      });
      return {
        ...prev,
        rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, jenisJenis: currentJenis }
      };
    });
  };

  const updateJenisItem = (idx: number, field: 'nama' | 'deskripsi' | 'contoh', val: string) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const currentJenis = [...(prev.rangkumanMateriSiswa.jenisJenis || [])];
      const target = currentJenis[idx];
      if (typeof target === 'string') {
        currentJenis[idx] = {
          nama: field === 'nama' ? val : target,
          deskripsi: field === 'deskripsi' ? val : '',
          contoh: field === 'contoh' ? val : ''
        };
      } else {
        currentJenis[idx] = {
          ...target,
          [field]: val
        };
      }
      return {
        ...prev,
        rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, jenisJenis: currentJenis }
      };
    });
  };

  const removeJenisItem = (idx: number) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const currentJenis = [...(prev.rangkumanMateriSiswa.jenisJenis || [])].filter((_, i) => i !== idx);
      return {
        ...prev,
        rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, jenisJenis: currentJenis }
      };
    });
  };

  const addCiriItem = () => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const currentCiri = [...(prev.rangkumanMateriSiswa.ciriCiri || [])];
      currentCiri.push('Ciri atau karakteristik baru...');
      return {
        ...prev,
        rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, ciriCiri: currentCiri }
      };
    });
  };

  const updateCiriItem = (idx: number, val: string) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const currentCiri = [...(prev.rangkumanMateriSiswa.ciriCiri || [])];
      currentCiri[idx] = val;
      return {
        ...prev,
        rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, ciriCiri: currentCiri }
      };
    });
  };

  const removeCiriItem = (idx: number) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const currentCiri = [...(prev.rangkumanMateriSiswa.ciriCiri || [])].filter((_, i) => i !== idx);
      return {
        ...prev,
        rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, ciriCiri: currentCiri }
      };
    });
  };

  const updateCatatanPapanTulis = (idx: number, val: string) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const currentBoard = [...(prev.rangkumanMateriSiswa.catatanPapanTulis || [])];
      currentBoard[idx] = val;
      return {
        ...prev,
        rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, catatanPapanTulis: currentBoard }
      };
    });
  };

  const addCatatanPapanTulis = () => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const currentBoard = [...(prev.rangkumanMateriSiswa.catatanPapanTulis || [])];
      currentBoard.push(`${currentBoard.length + 1}. Poin Catatan Baru...`);
      return {
        ...prev,
        rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, catatanPapanTulis: currentBoard }
      };
    });
  };

  const removeCatatanPapanTulis = (idx: number) => {
    setEditableData((prev) => {
      if (!prev) return prev;
      const currentBoard = [...(prev.rangkumanMateriSiswa.catatanPapanTulis || [])].filter((_, i) => i !== idx);
      return {
        ...prev,
        rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, catatanPapanTulis: currentBoard }
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between gap-4 shrink-0 border-b border-teal-700/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-700/60 rounded-xl border border-teal-500/30">
              <Presentation className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-white">Rangkuman Materi & Catatan Papan Tulis AI</h2>
                <span className="bg-amber-400 text-teal-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  BSKAP Kemendikdasmen
                </span>
              </div>
              <p className="text-xs text-teal-100 flex items-center gap-1.5 mt-0.5">
                <span>Pengertian • Jenis-Jenis • Ciri-Ciri • Siap Salin Murid (Pengganti Buku Paket)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white hover:bg-teal-700/50 rounded-xl transition-all cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Action Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 flex items-center justify-between gap-2 flex-wrap text-xs print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyBoardNotes}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Salin Poin Catatan Papan Tulis Saja untuk ditulis di kelas"
            >
              {copiedBoard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Presentation className="w-3.5 h-3.5 text-amber-300" />}
              <span>{copiedBoard ? 'Catatan Papan Tulis Tersalin!' : 'Salin Catatan Papan Tulis'}</span>
            </button>

            <button
              onClick={() => setShowPromptInput(!showPromptInput)}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{showPromptInput ? 'Batal AI Refine' : 'Instruksi AI Khusus'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Salin seluruh dokumen rangkuman materi"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Semua Tersalin!' : 'Salin Semua Teks'}</span>
            </button>

            <button
              onClick={handleDownloadWord}
              className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Unduh format Microsoft Word (.doc)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh Word (.doc)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Manual</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom AI Prompt Bar */}
        {showPromptInput && (
          <div className="bg-amber-50/80 border-b border-amber-200 p-3 sm:px-6 flex items-center gap-2 print:hidden">
            <input
              type="text"
              className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Contoh: Tambahkan jenis materi khusus, perbanyak ciri-ciri, atau perjelas analogi untuk kelas 4..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
            />
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>Generate Ulang AI</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div id="printable-bahanajar-document" className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-6 print:p-0 print:overflow-visible text-slate-800 text-xs sm:text-sm">
          {isGenerating ? (
            <div className="py-20 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-teal-900 text-sm">Menyusun Rangkuman Materi & Catatan Papan Tulis...</p>
                <p className="text-xs text-slate-500">Mengkaji buku.kemendikdasmen.go.id, merumuskan Pengertian, Jenis-jenis, Ciri-ciri & Skema Papan Tulis.</p>
              </div>
            </div>
          ) : currentData ? (
            <div className="space-y-6">

              {/* Document Header Box */}
              <div className="border border-teal-200 bg-teal-50/50 rounded-2xl p-4 sm:p-6 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-800 text-white rounded-full text-[11px] font-bold">
                  <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                  <span>REFERENSI KEMENDIKDASMEN RI</span>
                </div>
                <h1 className="text-base sm:text-xl font-black text-teal-950 uppercase tracking-tight">
                  {currentData.judulBahanAjar}
                </h1>
                <p className="text-xs text-teal-800 font-medium">
                  {currentData.subJudul || 'Bahan Ajar & Panduan Catatan Papan Tulis Kurikulum Merdeka'}
                </p>
                <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-600 flex-wrap">
                  <span><strong>Mata Pelajaran:</strong> {planData.identitas.mataPelajaran}</span>
                  <span>•</span>
                  <span><strong>Kelas / Fase:</strong> {planData.identitas.faseKelas}</span>
                  <span>•</span>
                  <span><strong>Materi:</strong> {planData.tujuanDanDpl.lingkupMateri}</span>
                </div>
                <div className="pt-2 text-[11px] text-teal-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 max-w-2xl mx-auto flex items-center justify-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Penyajian Kelas:</strong> Dokumen ini dirancang sebagai bahan bacaan mandiri & skema papan tulis siap salin murid (karena kelas tidak memiliki buku paket cetak).</span>
                </div>
              </div>

              {/* SECTION I: PENGERTIAN & DEFINISI KONSEP */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-teal-900 text-sm uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>I. Pengertian & Hakikat Konsep ({planData.tujuanDanDpl.lingkupMateri})</span>
                  </h2>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    Konseptual & Ramah Anak
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 text-xs block">Definisi / Pengertian Utama:</label>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs font-normal"
                      value={currentData.rangkumanMateriSiswa.pengertian || currentData.rangkumanMateriSiswa.penjelasanRingkas}
                      onChange={(e) => updatePengertian(e.target.value)}
                    />
                  ) : (
                    <div className="text-slate-800 leading-relaxed bg-teal-50/40 p-3.5 rounded-xl border border-teal-100 text-xs sm:text-sm font-medium">
                      {currentData.rangkumanMateriSiswa.pengertian || currentData.rangkumanMateriSiswa.penjelasanRingkas}
                    </div>
                  )}
                </div>

                {/* Konsep Kunci */}
                <div className="space-y-1.5 pt-1">
                  <label className="font-bold text-slate-700 text-xs block">Kata Kunci Esensial:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(currentData.rangkumanMateriSiswa.konsepKunci || []).map((k, i) => (
                      <span key={i} className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        • {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION II: JENIS-JENIS / KLASIFIKASI MATERI */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-teal-900 text-sm uppercase flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-700" />
                    <span>II. Jenis-Jenis / Klasifikasi / Bentuk Materi</span>
                  </h2>
                  {isEditing && (
                    <button
                      onClick={addJenisItem}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Jenis</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(currentData.rangkumanMateriSiswa.jenisJenis || []).map((j: any, i: number) => {
                    const isStr = typeof j === 'string';
                    const nama = isStr ? j : j.nama;
                    const deskripsi = isStr ? '' : j.deskripsi;
                    const contoh = isStr ? '' : j.contoh;

                    return (
                      <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group hover:border-teal-300 transition-colors">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-teal-800 text-xs">#{i + 1}</span>
                              <button
                                onClick={() => removeJenisItem(i)}
                                className="text-rose-600 hover:text-rose-800 p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                                title="Hapus Jenis Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              className="w-full bg-amber-50 border border-amber-300 rounded-lg p-1.5 text-xs font-bold"
                              placeholder="Nama Jenis..."
                              value={nama}
                              onChange={(e) => updateJenisItem(i, 'nama', e.target.value)}
                            />
                            <textarea
                              rows={2}
                              className="w-full bg-amber-50 border border-amber-300 rounded-lg p-1.5 text-xs"
                              placeholder="Penjelasan/karakteristik..."
                              value={deskripsi}
                              onChange={(e) => updateJenisItem(i, 'deskripsi', e.target.value)}
                            />
                            <input
                              type="text"
                              className="w-full bg-amber-50 border border-amber-300 rounded-lg p-1.5 text-xs"
                              placeholder="Contoh..."
                              value={contoh || ''}
                              onChange={(e) => updateJenisItem(i, 'contoh', e.target.value)}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-teal-700 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                                {i + 1}
                              </span>
                              <h3 className="font-bold text-teal-950 text-xs sm:text-sm">{nama}</h3>
                            </div>
                            {deskripsi && (
                              <p className="text-slate-700 text-xs leading-relaxed pl-7">
                                {deskripsi}
                              </p>
                            )}
                            {contoh && (
                              <div className="ml-7 bg-white border border-slate-200 rounded-lg p-2 text-[11px] text-slate-600">
                                <span className="font-semibold text-teal-800">Contoh: </span>
                                <span>{contoh}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION III: CIRI-CIRI & KARAKTERISTIK UTAMA */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-teal-900 text-sm uppercase flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-teal-700" />
                    <span>III. Ciri-Ciri & Karakteristik Utama Materi</span>
                  </h2>
                  {isEditing && (
                    <button
                      onClick={addCiriItem}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Ciri</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {(currentData.rangkumanMateriSiswa.ciriCiri || []).map((c: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-teal-50/30 transition-colors">
                      <span className="w-5 h-5 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            className="flex-1 bg-amber-50 border border-amber-300 rounded-lg p-1.5 text-xs"
                            value={c}
                            onChange={(e) => updateCiriItem(i, e.target.value)}
                          />
                          <button
                            onClick={() => removeCiriItem(i)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded-md cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-800 text-xs sm:text-sm leading-relaxed">{c}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION IV: CONTOH KONTEKSTUAL SEHARI-HARI */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-teal-900 text-sm uppercase flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>IV. Contoh Penerapan Kontekstual di Kehidupan Sehari-hari</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(currentData.rangkumanMateriSiswa.contohKontekstual || []).map((c, i) => (
                    <div key={i} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-start gap-2 text-slate-800 text-xs">
                      <span className="font-bold text-amber-800 mt-0.5">•</span>
                      <span className="leading-relaxed">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION V: CATATAN PAPAN TULIS (BOARD NOTES - SIAP SALIN MURID) */}
              <div className="border-2 border-teal-700 bg-slate-900 text-white rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-teal-600/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-teal-800 text-amber-300 rounded-lg border border-teal-500/40">
                      <Presentation className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                        <span>V. FORMAT CATATAN PAPAN TULIS (SKEMA SALIN MURID)</span>
                      </h2>
                      <p className="text-[11px] text-teal-200">
                        Ditulis guru di papan tulis & disalin murid ke buku catatan sebagai pengganti buku paket cetak.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyBoardNotes}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      {copiedBoard ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBoard ? 'Tersalin!' : 'Salin Papan Tulis'}</span>
                    </button>
                    {isEditing && (
                      <button
                        onClick={addCatatanPapanTulis}
                        className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-600 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Baris</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Chalkboard content */}
                <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-4 sm:p-5 font-mono text-xs sm:text-sm space-y-2.5 text-teal-50 leading-relaxed">
                  {(currentData.rangkumanMateriSiswa.catatanPapanTulis || []).map((p: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 group">
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            className="flex-1 bg-slate-800 border border-teal-500/50 text-amber-200 rounded-lg p-2 text-xs font-mono"
                            value={p}
                            onChange={(e) => updateCatatanPapanTulis(i, e.target.value)}
                          />
                          <button
                            onClick={() => removeCatatanPapanTulis(i)}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold select-none">▶</span>
                          <span className="text-teal-100 font-medium whitespace-pre-wrap">{p}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION VI: PANDUAN PEDAGOGIS GURU */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-teal-900 text-sm uppercase flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-700" />
                    <span>VI. Panduan Pedagogis Guru & Antisipasi Miskonsepsi</span>
                  </h2>
                </div>

                {currentData.panduanGuru.tipsPapanTulis && (
                  <div className="space-y-1">
                    <label className="font-bold text-teal-900 text-xs block flex items-center gap-1">
                      <Presentation className="w-3.5 h-3.5 text-teal-700" />
                      <span>Tips Mengorganisir Papan Tulis di Kelas:</span>
                    </label>
                    <p className="text-slate-800 leading-relaxed bg-teal-50/50 p-3 rounded-lg border border-teal-100 text-xs">
                      {currentData.panduanGuru.tipsPapanTulis}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 text-xs block">Catatan Pedagogis Penyampaian:</label>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    {currentData.panduanGuru.catatanPedagogis}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 text-xs block">Antisipasi Miskonsepsi Umum & Pelurusannya:</label>
                  <div className="space-y-2">
                    {(currentData.panduanGuru.miskonsepsiUmum || []).map((m, i) => (
                      <div key={i} className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-lg text-slate-700 flex items-start gap-2 text-xs">
                        <span className="font-bold text-rose-700 shrink-0">{i + 1}.</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION VII: GLOSARIUM */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-teal-900 text-sm uppercase flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-700" />
                    <span>VII. Glosarium / Kamus Istilah</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(currentData.glosarium || []).map((g, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
                      <span className="font-bold text-teal-950 block text-xs">{g.istilah}</span>
                      <span className="text-slate-600 block text-[11px] leading-relaxed">{g.arti}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION VIII: DAFTAR PUSTAKA & REFERENSI */}
              <div className="border border-teal-200 rounded-xl p-4 sm:p-5 bg-teal-50/30 space-y-3">
                <div className="border-b border-teal-200 pb-2 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-bold text-teal-950 text-sm uppercase flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-teal-700" />
                    <span>VIII. Daftar Pustaka & Referensi Sumber Belajar Resmi</span>
                  </h2>
                  <a
                    href="https://buku.kemendikdasmen.go.id/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-teal-800 hover:text-teal-950 underline flex items-center gap-1"
                  >
                    <span>Kunjungi Portal Buku Kemendikdasmen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-xs">
                  {(currentData.daftarPustaka || []).map((d, i) => (
                    <li key={i} className="leading-relaxed">
                      {d.includes('http') ? (
                        <span>
                          {d.split('http')[0]}
                          <a 
                            href={`http${d.split('http')[1].replace(')', '')}`}
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-teal-700 hover:underline font-semibold"
                          >
                            http{d.split('http')[1]}
                          </a>
                        </span>
                      ) : (
                        <span>{d}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <p className="text-slate-500 text-sm">Belum ada rangkuman bahan bacaan yang dibuat.</p>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Buat Rangkuman Bacaan & Catatan Papan Tulis dengan AI
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
