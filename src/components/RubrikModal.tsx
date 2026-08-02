import React, { useState, useEffect } from 'react';
import { 
  X, Printer, Copy, Check, Sparkles, RefreshCw, Plus, Trash2, 
  Award, Eye, FileText, CheckCircle2, Edit3, HelpCircle, Layers,
  ChevronRight, Save, UserCheck, Search, Target, Users, UserPlus,
  FileSpreadsheet, Calculator, ArrowRight, Download, Filter
} from 'lucide-react';
import { 
  LessonPlanOutput, 
  RubrikPenilaianData, 
  RubrikSection, 
  RubrikKriteriaItem,
  LembarPenilaianSiswaData,
  SiswaNilaiRecord 
} from '../types';

interface RubrikModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: LessonPlanOutput;
  rubrikData?: RubrikPenilaianData;
  onSaveRubrik: (newRubrik: RubrikPenilaianData) => void;
  onGenerateRubrik: (customInstruction?: string) => Promise<void>;
  isGenerating?: boolean;
}

export const getDefaultLembarPenilaianSiswa = (): LembarPenilaianSiswaData => ({
  tanggalPenilaian: new Date().toISOString().split('T')[0],
  catatanUmumKelas: "Siswa secara umum berpartisipasi aktif dalam kegiatan pembelajaran mendalam (Deep Learning) dan diskusi kelompok LKPD.",
  daftarSiswa: [
    { id: '1', namaSiswa: 'Ahmad Dani', nisn: '0012345671', skorAs: [3, 4, 3], skorFor: [4, 3, 4], skorOf: [3, 4, 4], catatanGuru: 'Sangat baik dalam merefleksikan pemahaman diri.' },
    { id: '2', namaSiswa: 'Siti Rahma', nisn: '0012345672', skorAs: [4, 4, 4], skorFor: [4, 4, 4], skorOf: [4, 4, 4], catatanGuru: 'Menunjukkan pemahaman mahir dan kepemimpinan diskusi kelompok.' },
    { id: '3', namaSiswa: 'Budi Santoso', nisn: '0012345673', skorAs: [2, 3, 2], skorFor: [3, 2, 3], skorOf: [3, 3, 2], catatanGuru: 'Cukup aktif, perlu sedikit bimbingan pada analisis LKPD.' },
    { id: '4', namaSiswa: 'Dewa Putu', nisn: '0012345674', skorAs: [3, 3, 4], skorFor: [4, 3, 3], skorOf: [3, 4, 3], catatanGuru: 'Kolaboratif dalam kelompok dan teliti menyelesaikan tugas.' },
    { id: '5', namaSiswa: 'Evelyn Wijaya', nisn: '0012345675', skorAs: [4, 3, 4], skorFor: [3, 4, 4], skorOf: [4, 4, 4], catatanGuru: 'Sangat mandiri dan bernalar kritis.' },
  ]
});

export const getDefaultRubrikData = (plan: LessonPlanOutput): RubrikPenilaianData => {
  const mp = plan.identitas.mataPelajaran || "Mata Pelajaran";
  const fk = plan.identitas.faseKelas || "Fase / Kelas";
  const topik = plan.tujuanDanDpl.lingkupMateri || "Materi Pembelajaran";

  return {
    judulRubrik: `RUBRIK PENILAIAN PEMBELAJARAN MENDALAM - ${topik.toUpperCase()}`,
    subJudul: "Pedoman Penilaian Otentik (Assessment as, for, & of Learning)",
    mataPelajaran: mp,
    faseKelas: fk,
    lingkupMateri: topik,
    petunjukPenggunaan: [
      "Gunakan Rubrik Assessment as Learning untuk membimbing murid melakukan refleksi metakognitif mandiri dan penilaian antarteman.",
      "Gunakan Rubrik Assessment for Learning saat mengamati keaktifan, penalaran kritis, serta keterlibatan murid selama diskusi dan praktikum LKPD.",
      "Gunakan Rubrik Assessment of Learning untuk menilai hasil karya/produk akhir atau tes sumatif murid pada akhir materi.",
      "Gunakan Lembar Penilaian Siswa untuk menginput nilai nyata tiap siswa per indikator aspek."
    ],
    assessmentAsLearning: {
      kategori: "Assessment as Learning",
      subJudul: "Rubrik Penilaian Diri (Self Assessment) & Antarteman (Peer Assessment)",
      tujuanFokus: "Mengembangkan kesadaran metakognitif, kejujuran diri, dan kemampuan memberikan umpan balik konstruktif antar siswa.",
      teknikInstrumen: "Lembar Refleksi Metakognitif Mandiri & Angket Penilaian Teman Sejawat",
      tabelRubrik: [
        {
          aspekPenilaian: "Refleksi Pemahaman Mandiri",
          perluBimbingan: "Belum mampu mengenali hal yang dipahami atau kesulitan belajar yang dihadapi.",
          cukup: "Mampu menyebutkan hal yang dipahami dan kesulitan belajar dengan bimbingan guru.",
          layak: "Mampu mengidentifikasi pemahaman dan hambatan belajar secara mandiri dan jujur.",
          mahir: "Sangat peka dalam merefleksikan pemahaman, hambatan, serta merumuskan strategi perbaikan diri."
        },
        {
          aspekPenilaian: "Apresiasi & Penilaian Antarteman",
          perluBimbingan: "Belum memberikan tanggapan atau penilaian objektif kepada teman kelompok.",
          cukup: "Memberikan penilaian kepada teman tetapi masih ragu/singkat tanpa saran pendukung.",
          layak: "Memberikan penilaian dan umpan balik yang jujur serta menghargai kontribusi teman.",
          mahir: "Memberikan umpan balik yang sangat apresiatif, obyektif, konstruktif, dan membangun semangat teman."
        },
        {
          aspekPenilaian: "Kemandirian & Tanggung Jawab Belajar",
          perluBimbingan: "Memerlukan dorongan terus-menerus untuk menyelesaikan lembar refleksi diri.",
          cukup: "Mengisi lembar refleksi diri tepat waktu saat diingatkan guru.",
          layak: "Mengisi lembar refleksi secara mandiri dengan sungguh-sungguh.",
          mahir: "Sangat proaktif, jujur, dan menunjukkan komitmen tinggi dalam evaluasi belajar mandiri."
        }
      ],
      pedomanPenskoran: "Nilai Akhir = (Total Skor Perolehan / 12) x 100. Kategori: 81-100 (Sangat Baik), 71-80 (Baik), 61-70 (Cukup), <60 (Perlu Bimbingan)."
    },
    assessmentForLearning: {
      kategori: "Assessment for Learning",
      subJudul: "Rubrik Observasi Proses Pembelajaran & Kinerja Diskusi / LKPD",
      tujuanFokus: "Mengukur keaktifan, penalaran kritis, kolaborasi, dan pemecahan masalah selama proses pembelajaran berlangsung.",
      teknikInstrumen: "Lembar Observasi Unjuk Kerja & Rubrik Diskusi Kelompok",
      tabelRubrik: [
        {
          aspekPenilaian: "Keaktifan Diskusi & Penalaran Kritis",
          perluBimbingan: "Pasif dalam diskusi dan belum mengajukan gagasan atau pertanyaan.",
          cukup: "Aktif mendengarkan dan sesekali menyampaikan pendapat sederhana saat diminta.",
          layak: "Aktif berpendapat, mengajukan pertanyaan kritis, dan menanggapi ide teman.",
          mahir: "Sangat aktif memimpin argumentasi kritis, menghubungkan fakta, dan memberikan solusi inovatif."
        },
        {
          aspekPenilaian: "Kerjasama & Gotong Royong Kelompok",
          perluBimbingan: "Cenderung bekerja sendiri atau enggan berbagian peran dalam kelompok.",
          cukup: "Menjalankan peran kelompok jika diarahkan oleh teman atau guru.",
          layak: "Bekerja sama dengan baik, menghargai pembagian tugas, dan membantu anggota kelompok.",
          mahir: "Sangat proaktif membangun kolaborasi harmonis, membantu teman yang kesulitan, dan menjaga kekompakan."
        },
        {
          aspekPenilaian: "Ketepatan Analisis & Penulisan LKPD",
          perluBimbingan: `Jawaban LKPD kurang tepat dan belum mencerminkan pemahaman materi ${topik}.`,
          cukup: "Jawaban LKPD cukup tepat namun penjelasan analisis masih singkat.",
          layak: "Jawaban LKPD tepat, runtut, dan didukung alasan yang logis.",
          mahir: "Jawaban LKPD sangat akurat, mendalam, disertai analisis komprehensif dan contoh kontekstual."
        }
      ],
      pedomanPenskoran: "Nilai Akhir = (Total Skor Perolehan / 12) x 100. Digunakan guru sebagai umpan balik formatif untuk intervensi."
    },
    assessmentOfLearning: {
      kategori: "Assessment of Learning",
      subJudul: "Rubrik Evaluasi Sumatif Akhir (Tes Tertulis / Penilaian Produk Karya)",
      tujuanFokus: "Mengukur secara komprehensif tingkat penguasaan konsep akhir dan kualitas produk/karya siswa.",
      teknikInstrumen: "Lembar Tes Evaluasi Sumatif & Rubrik Penilaian Hasil Produk/Proyek",
      tabelRubrik: [
        {
          aspekPenilaian: "Penguasaan Konsep & Kebenaran Substansi",
          perluBimbingan: `Banyak kesalahan konsep dasar materi ${topik} (skor tes <60%).`,
          cukup: "Memahami konsep dasar namun terdapat beberapa kekeliruan kecil (skor tes 61-70%).",
          layak: "Memahami konsep materi secara benar dan tepat (skor tes 71-80%).",
          mahir: "Sangat menguasai konsep secara utuh, akurat, dan mampu mengaitkan dengan topik lain (skor 81-100%)."
        },
        {
          aspekPenilaian: "Kualitas Produk / Hasil Karya Akhir",
          perluBimbingan: "Karya belum selesai atau tidak sesuai dengan spesifikasi tugas yang ditentukan.",
          cukup: "Karya selesai sesuai petunjuk dasar, namun kerapian dan estetika perlu ditingkatkan.",
          layak: "Karya selesai dengan rapi, jelas, sistematis, dan memenuhi semua kriteria tugas.",
          mahir: "Karya sangat kreatif, estetik, orisinal, serta menyajikan penyelesaian masalah secara luar biasa."
        },
        {
          aspekPenilaian: "Kemampuan Pemecahan Masalah (HOTS)",
          perluBimbingan: "Belum mampu menjawab pertanyaan HOTS / studi kasus kontekstual.",
          cukup: "Mampu menjawab soal HOTS dengan analisis sederhana.",
          layak: "Mampu menyelesaikan soal HOTS dengan runtutan argumen yang logis.",
          mahir: "Mampu memecahkan masalah kompleks/HOTS dengan analisis tajam, kritis, dan sintesis jawaban yang matang."
        }
      ],
      pedomanPenskoran: "Nilai Akhir Sumatif = (Skor Tes Tertulis x 50%) + (Skor Produk x 50%). Konversi Predikat: A (89-100), B (78-88), C (66-77), D (<65)."
    },
    lembarPenilaianSiswa: getDefaultLembarPenilaianSiswa()
  };
};

export const RubrikModal: React.FC<RubrikModalProps> = ({
  isOpen,
  onClose,
  planData,
  rubrikData,
  onSaveRubrik,
  onGenerateRubrik,
  isGenerating = false,
}) => {
  const [activeTab, setActiveTab] = useState<'as' | 'for' | 'of' | 'lembar' | 'all'>('as');
  const [isEditing, setIsEditing] = useState(false);
  const [editedRubrik, setEditedRubrik] = useState<RubrikPenilaianData>(() => {
    const base = rubrikData || getDefaultRubrikData(planData);
    if (!base.lembarPenilaianSiswa) {
      base.lembarPenilaianSiswa = getDefaultLembarPenilaianSiswa();
    }
    return base;
  });
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);

  // Lembar Penilaian Helper States
  const [searchSiswa, setSearchSiswa] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    if (rubrikData) {
      const dataWithLembar = { ...rubrikData };
      if (!dataWithLembar.lembarPenilaianSiswa) {
        dataWithLembar.lembarPenilaianSiswa = getDefaultLembarPenilaianSiswa();
      }
      setEditedRubrik(dataWithLembar);
    } else {
      setEditedRubrik(getDefaultRubrikData(planData));
    }
  }, [rubrikData, planData]);

  if (!isOpen) return null;

  const currentRubrik = editedRubrik || getDefaultRubrikData(planData);
  const lembarData = currentRubrik.lembarPenilaianSiswa || getDefaultLembarPenilaianSiswa();

  const handleSave = () => {
    onSaveRubrik(editedRubrik);
    setIsEditing(false);
  };

  const handleCopyText = () => {
    const text = `
=== ${currentRubrik.judulRubrik} ===
Mata Pelajaran: ${currentRubrik.mataPelajaran} | Fase/Kelas: ${currentRubrik.faseKelas}
Lingkup Materi: ${currentRubrik.lingkupMateri}

1. ASSESSMENT AS LEARNING (Refleksi Diri & Antarteman)
Fokus: ${currentRubrik.assessmentAsLearning.tujuanFokus}
Teknik/Instrumen: ${currentRubrik.assessmentAsLearning.teknikInstrumen}
Tabel Kriteria:
${currentRubrik.assessmentAsLearning.tabelRubrik.map((item, idx) => `
${idx + 1}. Aspek: ${item.aspekPenilaian}
   - Perlu Bimbingan (1): ${item.perluBimbingan}
   - Cukup (2): ${item.cukup}
   - Layak (3): ${item.layak}
   - Mahir (4): ${item.mahir}
`).join('')}
Pedoman Penskoran: ${currentRubrik.assessmentAsLearning.pedomanPenskoran}

2. ASSESSMENT FOR LEARNING (Observasi Proses & Diskusi LKPD)
Fokus: ${currentRubrik.assessmentForLearning.tujuanFokus}
Teknik/Instrumen: ${currentRubrik.assessmentForLearning.teknikInstrumen}
Tabel Kriteria:
${currentRubrik.assessmentForLearning.tabelRubrik.map((item, idx) => `
${idx + 1}. Aspek: ${item.aspekPenilaian}
   - Perlu Bimbingan (1): ${item.perluBimbingan}
   - Cukup (2): ${item.cukup}
   - Layak (3): ${item.layak}
   - Mahir (4): ${item.mahir}
`).join('')}
Pedoman Penskoran: ${currentRubrik.assessmentForLearning.pedomanPenskoran}

3. ASSESSMENT OF LEARNING (Evaluasi Akhir & Produk Sumatif)
Fokus: ${currentRubrik.assessmentOfLearning.tujuanFokus}
Teknik/Instrumen: ${currentRubrik.assessmentOfLearning.teknikInstrumen}
Tabel Kriteria:
${currentRubrik.assessmentOfLearning.tabelRubrik.map((item, idx) => `
${idx + 1}. Aspek: ${item.aspekPenilaian}
   - Perlu Bimbingan (1): ${item.perluBimbingan}
   - Cukup (2): ${item.cukup}
   - Layak (3): ${item.layak}
   - Mahir (4): ${item.mahir}
`).join('')}
Pedoman Penskoran: ${currentRubrik.assessmentOfLearning.pedomanPenskoran}

=== LEMBAR PENILAIAN SISWA ===
${lembarData.daftarSiswa.map((s, idx) => {
  const totAs = s.skorAs.reduce((a,b)=>a+b,0);
  const totFor = s.skorFor.reduce((a,b)=>a+b,0);
  const totOf = s.skorOf.reduce((a,b)=>a+b,0);
  const total = totAs + totFor + totOf;
  const max = (currentRubrik.assessmentAsLearning.tabelRubrik.length + currentRubrik.assessmentForLearning.tabelRubrik.length + currentRubrik.assessmentOfLearning.tabelRubrik.length) * 4;
  const nil = Math.round((total / max) * 100);
  return `${idx+1}. ${s.namaSiswa} | Total Skor: ${total}/${max} | Nilai: ${nil} | Catatan: ${s.catatanGuru || '-'}`;
}).join('\n')}
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const { identitas, tujuanDanDpl } = planData;
    const currentRubrik = editedRubrik || getDefaultRubrikData(planData);
    const lembarData = currentRubrik.lembarPenilaianSiswa || getDefaultLembarPenilaianSiswa();

    // Calculate columns
    const numAspekAs = currentRubrik.assessmentAsLearning.tabelRubrik.length;
    const numAspekFor = currentRubrik.assessmentForLearning.tabelRubrik.length;
    const numAspekOf = currentRubrik.assessmentOfLearning.tabelRubrik.length;
    const totalMaxSkor = (numAspekAs + numAspekFor + numAspekOf) * 4;

    // Class average
    let classTotalScore = 0;
    let totalSiswa = lembarData.daftarSiswa.length;
    lembarData.daftarSiswa.forEach(s => {
      const totAs = (s.skorAs || []).reduce((a, b) => a + (b || 0), 0);
      const totFor = (s.skorFor || []).reduce((a, b) => a + (b || 0), 0);
      const totOf = (s.skorOf || []).reduce((a, b) => a + (b || 0), 0);
      const tot = totAs + totFor + totOf;
      const nil = totalMaxSkor > 0 ? Math.round((tot / totalMaxSkor) * 100) : 0;
      classTotalScore += nil;
    });
    const classAverageNilai = totalSiswa > 0 ? Math.round(classTotalScore / totalSiswa) : 0;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset='utf-8'>
        <title>${currentRubrik.judulRubrik}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 9.5pt; line-height: 1.4; color: #1e293b; margin: 0; padding: 10px; }
          .header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 13pt; font-weight: bold; color: #0f766e; text-transform: uppercase; }
          .subtitle { font-size: 10pt; font-style: italic; color: #475569; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .meta-table td { padding: 4px; font-size: 9pt; vertical-align: top; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .data-table th, .data-table td { border: 1px solid #94a3b8; padding: 6px 8px; font-size: 8.5pt; text-align: left; vertical-align: top; }
          .data-table th { background-color: #f1f5f9; font-weight: bold; color: #0f766e; }
          .section-title { background-color: #0f766e; color: white; padding: 6px 10px; font-weight: bold; font-size: 10pt; margin-top: 15px; margin-bottom: 8px; page-break-after: avoid; border-radius: 3px; }
          .section-title-as { background-color: #581c87; color: white; padding: 6px 10px; font-weight: bold; font-size: 10pt; margin-top: 15px; margin-bottom: 8px; page-break-after: avoid; border-radius: 3px; }
          .section-title-for { background-color: #0369a1; color: white; padding: 6px 10px; font-weight: bold; font-size: 10pt; margin-top: 15px; margin-bottom: 8px; page-break-after: avoid; border-radius: 3px; }
          .section-title-of { background-color: #047857; color: white; padding: 6px 10px; font-weight: bold; font-size: 10pt; margin-top: 15px; margin-bottom: 8px; page-break-after: avoid; border-radius: 3px; }
          .box { border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f8fafc; margin-bottom: 10px; border-radius: 4px; font-size: 9pt; }
          .page-break { page-break-before: always; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
          .stat-card { border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 4px; background: #f8fafc; font-size: 8.5pt; }
          .stat-card strong { display: block; font-size: 11pt; color: #0f766e; margin-top: 2px; }
          .badge { display: inline-block; padding: 2px 6px; font-size: 7.5pt; font-weight: bold; border-radius: 4px; border: 1px solid; }
          .badge-as { background-color: #f3e8ff; color: #6b21a8; border-color: #d8b4fe; }
          .badge-for { background-color: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
          .badge-of { background-color: #d1fae5; color: #065f46; border-color: #a7f3d0; }
          .badge-mahir { background-color: #d1fae5; color: #065f46; border-color: #a7f3d0; }
          .badge-cakap { background-color: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
          .badge-cukup { background-color: #fef3c7; color: #92400e; border-color: #fde68a; }
          .badge-bimbingan { background-color: #ffe4e6; color: #9f1239; border-color: #fecdd3; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${currentRubrik.judulRubrik}</div>
          <div class="subtitle">${currentRubrik.subJudul || 'Pedoman Penilaian Otentik (Assessment as, for, & of Learning)'}</div>
          <div style="font-weight: bold; font-size: 10pt; margin-top: 4px;">${identitas.namaSekolah || ''}</div>
        </div>

        <table class="meta-table">
          <tr>
            <td width="50%"><strong>Mata Pelajaran:</strong> ${currentRubrik.mataPelajaran || identitas.mataPelajaran}</td>
            <td width="50%"><strong>Kelas / Fase:</strong> ${currentRubrik.faseKelas || identitas.faseKelas}</td>
          </tr>
          <tr>
            <td><strong>Topik Pembelajaran:</strong> ${currentRubrik.lingkupMateri || tujuanDanDpl.lingkupMateri}</td>
            <td><strong>Semester / TA:</strong> ${identitas.semesterTahun || ''}</td>
          </tr>
        </table>

        <div class="box">
          <strong>PETUNJUK PENGGUNAAN RUBRIK:</strong>
          <ul style="margin-top: 4px; margin-bottom: 0; padding-left: 20px;">
            ${(currentRubrik.petunjukPenggunaan || []).map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>

        <!-- I. ASSESSMENT AS LEARNING -->
        <div class="section-title-as">I. ${currentRubrik.assessmentAsLearning.kategori} - ${currentRubrik.assessmentAsLearning.subJudul}</div>
        <table class="meta-table" style="margin-bottom: 8px;">
          <tr>
            <td width="50%"><strong>Tujuan Fokus:</strong> ${currentRubrik.assessmentAsLearning.tujuanFokus}</td>
            <td width="50%"><strong>Teknik / Instrumen:</strong> ${currentRubrik.assessmentAsLearning.teknikInstrumen}</td>
          </tr>
        </table>
        <table class="data-table">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="width: 20%;">Aspek Penilaian</th>
              <th style="width: 20%; background-color: #ffe4e6; color: #9f1239;">Perlu Bimbingan (Skor 1)</th>
              <th style="width: 20%; background-color: #fef3c7; color: #92400e;">Cukup (Skor 2)</th>
              <th style="width: 20%; background-color: #d1fae5; color: #065f46;">Layak (Skor 3)</th>
              <th style="width: 20%; background-color: #dbeafe; color: #1e40af;">Mahir (Skor 4)</th>
            </tr>
          </thead>
          <tbody>
            ${currentRubrik.assessmentAsLearning.tabelRubrik.map(item => `
              <tr>
                <td><strong>${item.aspekPenilaian}</strong></td>
                <td>${item.perluBimbingan}</td>
                <td>${item.cukup}</td>
                <td>${item.layak}</td>
                <td>${item.mahir}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="font-size: 8.5pt; font-style: italic; margin-top: -5px; color: #475569;"><strong>Pedoman Skor:</strong> ${currentRubrik.assessmentAsLearning.pedomanPenskoran}</p>

        <div class="page-break"></div>

        <!-- II. ASSESSMENT FOR LEARNING -->
        <div class="section-title-for" style="margin-top: 0;">II. ${currentRubrik.assessmentForLearning.kategori} - ${currentRubrik.assessmentForLearning.subJudul}</div>
        <table class="meta-table" style="margin-bottom: 8px;">
          <tr>
            <td width="50%"><strong>Tujuan Fokus:</strong> ${currentRubrik.assessmentForLearning.tujuanFokus}</td>
            <td width="50%"><strong>Teknik / Instrumen:</strong> ${currentRubrik.assessmentForLearning.teknikInstrumen}</td>
          </tr>
        </table>
        <table class="data-table">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="width: 20%;">Aspek Penilaian</th>
              <th style="width: 20%; background-color: #ffe4e6; color: #9f1239;">Perlu Bimbingan (Skor 1)</th>
              <th style="width: 20%; background-color: #fef3c7; color: #92400e;">Cukup (Skor 2)</th>
              <th style="width: 20%; background-color: #d1fae5; color: #065f46;">Layak (Skor 3)</th>
              <th style="width: 20%; background-color: #dbeafe; color: #1e40af;">Mahir (Skor 4)</th>
            </tr>
          </thead>
          <tbody>
            ${currentRubrik.assessmentForLearning.tabelRubrik.map(item => `
              <tr>
                <td><strong>${item.aspekPenilaian}</strong></td>
                <td>${item.perluBimbingan}</td>
                <td>${item.cukup}</td>
                <td>${item.layak}</td>
                <td>${item.mahir}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="font-size: 8.5pt; font-style: italic; margin-top: -5px; color: #475569;"><strong>Pedoman Skor:</strong> ${currentRubrik.assessmentForLearning.pedomanPenskoran}</p>

        <!-- III. ASSESSMENT OF LEARNING -->
        <div class="section-title-of">III. ${currentRubrik.assessmentOfLearning.kategori} - ${currentRubrik.assessmentOfLearning.subJudul}</div>
        <table class="meta-table" style="margin-bottom: 8px;">
          <tr>
            <td width="50%"><strong>Tujuan Fokus:</strong> ${currentRubrik.assessmentOfLearning.tujuanFokus}</td>
            <td width="50%"><strong>Teknik / Instrumen:</strong> ${currentRubrik.assessmentOfLearning.teknikInstrumen}</td>
          </tr>
        </table>
        <table class="data-table">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="width: 20%;">Aspek Penilaian</th>
              <th style="width: 20%; background-color: #ffe4e6; color: #9f1239;">Perlu Bimbingan (Skor 1)</th>
              <th style="width: 20%; background-color: #fef3c7; color: #92400e;">Cukup (Skor 2)</th>
              <th style="width: 20%; background-color: #d1fae5; color: #065f46;">Layak (Skor 3)</th>
              <th style="width: 20%; background-color: #dbeafe; color: #1e40af;">Mahir (Skor 4)</th>
            </tr>
          </thead>
          <tbody>
            ${currentRubrik.assessmentOfLearning.tabelRubrik.map(item => `
              <tr>
                <td><strong>${item.aspekPenilaian}</strong></td>
                <td>${item.perluBimbingan}</td>
                <td>${item.cukup}</td>
                <td>${item.layak}</td>
                <td>${item.mahir}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="font-size: 8.5pt; font-style: italic; margin-top: -5px; color: #475569;"><strong>Pedoman Skor:</strong> ${currentRubrik.assessmentOfLearning.pedomanPenskoran}</p>

        <div class="page-break"></div>

        <!-- IV. LEMBAR REKAPITULASI NILAI SISWA -->
        <div class="section-title" style="margin-top: 0;">IV. LEMBAR PENILAIAN & REKAPITULASI NILAI SISWA</div>
        
        <div class="stats-grid">
          <div class="stat-card">
            Total Siswa:
            <strong>${totalSiswa} Siswa</strong>
          </div>
          <div class="stat-card">
            Rata-rata Nilai Kelas:
            <strong>${classAverageNilai} / 100</strong>
          </div>
          <div class="stat-card">
            Total Max Skor:
            <strong>${totalMaxSkor} Poin</strong>
          </div>
          <div class="stat-card">
            Tanggal Penilaian:
            <strong>${lembarData.tanggalPenilaian || new Date().toISOString().split('T')[0]}</strong>
          </div>
        </div>

        <p><strong>Catatan Umum Pelaksanaan / Kelas:</strong> ${lembarData.catatanUmumKelas || '-'}</p>

        <table class="data-table" style="width: 100%;">
          <thead>
            <tr style="background-color: #0f172a; color: white;">
              <th style="width: 3%; text-align: center; background-color: #0f172a; color: white;">No</th>
              <th style="width: 17%; background-color: #0f172a; color: white;">Nama Siswa</th>
              
              <!-- As Learning Column Headers -->
              ${currentRubrik.assessmentAsLearning.tabelRubrik.map((_, i) => `
                <th style="text-align: center; background-color: #581c87; color: white; width: 4%;" title="${currentRubrik.assessmentAsLearning.tabelRubrik[i].aspekPenilaian}">A${i+1}</th>
              `).join('')}

              <!-- For Learning Column Headers -->
              ${currentRubrik.assessmentForLearning.tabelRubrik.map((_, i) => `
                <th style="text-align: center; background-color: #0369a1; color: white; width: 4%;" title="${currentRubrik.assessmentForLearning.tabelRubrik[i].aspekPenilaian}">F${i+1}</th>
              `).join('')}

              <!-- Of Learning Column Headers -->
              ${currentRubrik.assessmentOfLearning.tabelRubrik.map((_, i) => `
                <th style="text-align: center; background-color: #047857; color: white; width: 4%;" title="${currentRubrik.assessmentOfLearning.tabelRubrik[i].aspekPenilaian}">O${i+1}</th>
              `).join('')}

              <th style="text-align: center; background-color: #b45309; color: white; width: 8%;">Total Skor</th>
              <th style="text-align: center; background-color: #15803d; color: white; width: 8%;">Nilai (100)</th>
              <th style="text-align: center; background-color: #334155; color: white; width: 10%;">Predikat</th>
              <th style="background-color: #1e293b; color: white; width: 20%;">Catatan Guru</th>
            </tr>
          </thead>
          <tbody>
            ${lembarData.daftarSiswa.map((siswa, rowIdx) => {
              const skorAsArr = siswa.skorAs || Array(numAspekAs).fill(3);
              const skorForArr = siswa.skorFor || Array(numAspekFor).fill(3);
              const skorOfArr = siswa.skorOf || Array(numAspekOf).fill(3);

              const totAs = skorAsArr.reduce((a, b) => a + (Number(b) || 0), 0);
              const totFor = skorForArr.reduce((a, b) => a + (Number(b) || 0), 0);
              const totOf = skorOfArr.reduce((a, b) => a + (Number(b) || 0), 0);
              
              const grandTotal = totAs + totFor + totOf;
              const finalNilai = totalMaxSkor > 0 ? Math.round((grandTotal / totalMaxSkor) * 100) : 0;
              const pred = getPredikatInfo(finalNilai);

              return `
                <tr>
                  <td style="text-align: center; font-weight: bold; color: #475569;">${rowIdx + 1}</td>
                  <td>
                    <strong style="color: #0f172a; font-size: 8.5pt;">${siswa.namaSiswa}</strong>
                    ${siswa.nisn ? `<br/><span style="font-size: 7.2pt; font-family: monospace; color: #64748b;">NISN: ${siswa.nisn}</span>` : ''}
                  </td>
                  
                  <!-- Skor As -->
                  ${skorAsArr.map(val => `<td style="text-align: center; font-weight: bold; background-color: #faf5ff;">${val}</td>`).join('')}
                  
                  <!-- Skor For -->
                  ${skorForArr.map(val => `<td style="text-align: center; font-weight: bold; background-color: #f0f9ff;">${val}</td>`).join('')}
                  
                  <!-- Skor Of -->
                  ${skorOfArr.map(val => `<td style="text-align: center; font-weight: bold; background-color: #ecfdf5;">${val}</td>`).join('')}
                  
                  <td style="text-align: center; font-weight: bold; background-color: #fffbeb;">${grandTotal} <span style="font-size: 7pt; color: #92400e; font-weight: normal;">/ ${totalMaxSkor}</span></td>
                  <td style="text-align: center; font-weight: 900; font-size: 9.5pt; color: #065f46; background-color: #f0fdf4;">${finalNilai}</td>
                  <td style="text-align: center;">
                    <span class="badge ${finalNilai >= 85 ? 'badge-mahir' : finalNilai >= 75 ? 'badge-cakap' : finalNilai >= 65 ? 'badge-cukup' : 'badge-bimbingan'}">
                      ${pred.label.split(' ')[0]}
                    </span>
                  </td>
                  <td style="font-size: 7.5pt; color: #334155;">${siswa.catatanGuru || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- SIGNATURE SECTION -->
        <table style="width: 100%; margin-top: 40px; page-break-inside: avoid; border: none;">
          <tr style="border: none;">
            <td width="50%" style="border: none; padding: 0;">
              <p style="margin: 0; font-size: 9pt; color: #475569;">Mengetahui,</p>
              <p style="margin: 0; font-weight: bold; font-size: 9.5pt; color: #1e293b; margin-bottom: 50px;">Kepala Sekolah</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline; color: #1e293b;">${identitas.namaKepsek || '_________________________'}</p>
              <p style="margin: 0; font-size: 8.5pt; color: #475569;">NIP. ${identitas.nipKepsek || '...........................................'}</p>
            </td>
            <td width="50%" style="border: none; padding: 0; text-align: right;">
              <p style="margin: 0; font-size: 9pt; color: #475569;">${identitas.kotaKabupaten || 'Indonesia'}, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p style="margin: 0; font-weight: bold; font-size: 9.5pt; color: #1e293b; margin-bottom: 50px;">Guru Kelas</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline; color: #1e293b;">${identitas.namaGuru || '_________________________'}</p>
              <p style="margin: 0; font-size: 8.5pt; color: #475569;">NIP. ${identitas.nipGuru || '...........................................'}</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Strategy 1: Open popup window directly
    try {
      const printWin = window.open('', '_blank', 'width=1100,height=850');
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
      let existingIframe = document.getElementById('rubrik-print-frame') as HTMLIFrameElement | null;
      if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
      }

      const printIframe = document.createElement('iframe');
      printIframe.id = 'rubrik-print-frame';
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

  const handleTriggerGenerate = async () => {
    await onGenerateRubrik(customPrompt.trim() ? customPrompt : undefined);
    setShowPromptInput(false);
    setCustomPrompt('');
  };

  // Section Editors
  const updateSectionField = (
    sectionKey: 'assessmentAsLearning' | 'assessmentForLearning' | 'assessmentOfLearning',
    field: keyof RubrikSection,
    value: any
  ) => {
    setEditedRubrik(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value
      }
    }));
  };

  const updateTableRow = (
    sectionKey: 'assessmentAsLearning' | 'assessmentForLearning' | 'assessmentOfLearning',
    rowIndex: number,
    field: keyof RubrikKriteriaItem,
    value: string
  ) => {
    setEditedRubrik(prev => {
      const section = prev[sectionKey];
      const newTable = [...section.tabelRubrik];
      newTable[rowIndex] = { ...newTable[rowIndex], [field]: value };
      return {
        ...prev,
        [sectionKey]: { ...section, tabelRubrik: newTable }
      };
    });
  };

  const addTableRow = (sectionKey: 'assessmentAsLearning' | 'assessmentForLearning' | 'assessmentOfLearning') => {
    setEditedRubrik(prev => {
      const section = prev[sectionKey];
      const newRow: RubrikKriteriaItem = {
        aspekPenilaian: "Aspek Penilaian Baru",
        perluBimbingan: "Deskripsi kriteria perlu bimbingan (0 - 60%)",
        cukup: "Deskripsi kriteria cukup (61 - 70%)",
        layak: "Deskripsi kriteria layak (71 - 80%)",
        mahir: "Deskripsi kriteria mahir (81 - 100%)"
      };
      return {
        ...prev,
        [sectionKey]: {
          ...section,
          tabelRubrik: [...section.tabelRubrik, newRow]
        }
      };
    });
  };

  const removeTableRow = (
    sectionKey: 'assessmentAsLearning' | 'assessmentForLearning' | 'assessmentOfLearning',
    rowIndex: number
  ) => {
    setEditedRubrik(prev => {
      const section = prev[sectionKey];
      if (section.tabelRubrik.length <= 1) return prev;
      const newTable = section.tabelRubrik.filter((_, idx) => idx !== rowIndex);
      return {
        ...prev,
        [sectionKey]: { ...section, tabelRubrik: newTable }
      };
    });
  };

  // ==========================================
  // LEMBAR PENILAIAN SISWA EDITORS & LOGIC
  // ==========================================
  const numAspekAs = currentRubrik.assessmentAsLearning.tabelRubrik.length;
  const numAspekFor = currentRubrik.assessmentForLearning.tabelRubrik.length;
  const numAspekOf = currentRubrik.assessmentOfLearning.tabelRubrik.length;
  const totalMaxSkor = (numAspekAs + numAspekFor + numAspekOf) * 4;

  const updateSiswaField = (id: string, field: keyof SiswaNilaiRecord, value: any) => {
    setEditedRubrik(prev => {
      const prevLembar = prev.lembarPenilaianSiswa || getDefaultLembarPenilaianSiswa();
      const updatedList = prevLembar.daftarSiswa.map(s => {
        if (s.id === id) {
          return { ...s, [field]: value };
        }
        return s;
      });
      return {
        ...prev,
        lembarPenilaianSiswa: { ...prevLembar, daftarSiswa: updatedList }
      };
    });
  };

  const updateSiswaSkor = (
    id: string,
    category: 'skorAs' | 'skorFor' | 'skorOf',
    index: number,
    val: number
  ) => {
    setEditedRubrik(prev => {
      const prevLembar = prev.lembarPenilaianSiswa || getDefaultLembarPenilaianSiswa();
      const updatedList = prevLembar.daftarSiswa.map(s => {
        if (s.id === id) {
          const arr = [...(s[category] || [])];
          arr[index] = Math.min(4, Math.max(1, val));
          return { ...s, [category]: arr };
        }
        return s;
      });
      return {
        ...prev,
        lembarPenilaianSiswa: { ...prevLembar, daftarSiswa: updatedList }
      };
    });
  };

  const handleAddSiswa = () => {
    setEditedRubrik(prev => {
      const prevLembar = prev.lembarPenilaianSiswa || getDefaultLembarPenilaianSiswa();
      const newSiswa: SiswaNilaiRecord = {
        id: Date.now().toString(),
        namaSiswa: `Siswa Baru ${prevLembar.daftarSiswa.length + 1}`,
        nisn: `00123456${prevLembar.daftarSiswa.length + 1}`,
        skorAs: Array(numAspekAs).fill(3),
        skorFor: Array(numAspekFor).fill(3),
        skorOf: Array(numAspekOf).fill(3),
        catatanGuru: 'Sudah mengikuti proses pembelajaran dengan baik.'
      };
      return {
        ...prev,
        lembarPenilaianSiswa: {
          ...prevLembar,
          daftarSiswa: [...prevLembar.daftarSiswa, newSiswa]
        }
      };
    });
  };

  const handleRemoveSiswa = (id: string) => {
    setEditedRubrik(prev => {
      const prevLembar = prev.lembarPenilaianSiswa || getDefaultLembarPenilaianSiswa();
      const filtered = prevLembar.daftarSiswa.filter(s => s.id !== id);
      return {
        ...prev,
        lembarPenilaianSiswa: { ...prevLembar, daftarSiswa: filtered }
      };
    });
  };

  const handleBatchPasteSiswa = () => {
    const names = pasteText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) return;

    setEditedRubrik(prev => {
      const prevLembar = prev.lembarPenilaianSiswa || getDefaultLembarPenilaianSiswa();
      const newList: SiswaNilaiRecord[] = names.map((nama, idx) => ({
        id: `${Date.now()}-${idx}`,
        namaSiswa: nama,
        nisn: `0012345${Math.floor(1000 + Math.random() * 9000)}`,
        skorAs: Array(numAspekAs).fill(3),
        skorFor: Array(numAspekFor).fill(3),
        skorOf: Array(numAspekOf).fill(3),
        catatanGuru: 'Tuntas.'
      }));

      return {
        ...prev,
        lembarPenilaianSiswa: {
          ...prevLembar,
          daftarSiswa: newList
        }
      };
    });

    setShowPasteModal(false);
    setPasteText('');
  };

  const handleQuickFillScores = (defaultSkor: number) => {
    setEditedRubrik(prev => {
      const prevLembar = prev.lembarPenilaianSiswa || getDefaultLembarPenilaianSiswa();
      const updated = prevLembar.daftarSiswa.map(s => ({
        ...s,
        skorAs: Array(numAspekAs).fill(defaultSkor),
        skorFor: Array(numAspekFor).fill(defaultSkor),
        skorOf: Array(numAspekOf).fill(defaultSkor)
      }));
      return {
        ...prev,
        lembarPenilaianSiswa: { ...prevLembar, daftarSiswa: updated }
      };
    });
  };

  const getPredikatInfo = (nilai: number) => {
    if (nilai >= 85) return { label: 'Mahir (A)', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' };
    if (nilai >= 75) return { label: 'Cakap / Layak (B)', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-bold' };
    if (nilai >= 65) return { label: 'Cukup (C)', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' };
    return { label: 'Perlu Bimbingan (D)', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold' };
  };

  // Render Section Tables
  const renderRubrikTable = (
    sectionKey: 'assessmentAsLearning' | 'assessmentForLearning' | 'assessmentOfLearning',
    titleBadge: string,
    badgeColor: string,
    icon: React.ReactNode
  ) => {
    const section = currentRubrik[sectionKey];

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-8 print:border-none print:shadow-none print:p-0">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
                {icon}
                <span>{titleBadge}</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">| {section.kategori}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {section.subJudul}
            </h3>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => addTableRow(sectionKey)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris Aspek</span>
            </button>
          )}
        </div>

        {/* Focus & Instrument Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">🎯 Fokus & Tujuan Asesmen:</span>
            {isEditing ? (
              <textarea
                rows={2}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                value={section.tujuanFokus}
                onChange={e => updateSectionField(sectionKey, 'tujuanFokus', e.target.value)}
              />
            ) : (
              <p className="text-slate-600">{section.tujuanFokus}</p>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">📋 Teknik & Instrumen Penilaian:</span>
            {isEditing ? (
              <input
                type="text"
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                value={section.teknikInstrumen}
                onChange={e => updateSectionField(sectionKey, 'teknikInstrumen', e.target.value)}
              />
            ) : (
              <p className="text-slate-600">{section.teknikInstrumen}</p>
            )}
          </div>
        </div>

        {/* 5-Column Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-800 text-white font-bold">
                <th className="p-3 w-1/5 border-r border-slate-700">Aspek / Indikator Penilaian</th>
                <th className="p-3 w-1/5 border-r border-slate-700 bg-rose-900/90 text-rose-100">
                  Perlu Bimbingan (Skor 1)<br/><span className="font-normal text-[10px] text-rose-200">(0 - 60%)</span>
                </th>
                <th className="p-3 w-1/5 border-r border-slate-700 bg-amber-900/90 text-amber-100">
                  Cukup (Skor 2)<br/><span className="font-normal text-[10px] text-amber-200">(61 - 70%)</span>
                </th>
                <th className="p-3 w-1/5 border-r border-slate-700 bg-emerald-900/90 text-emerald-100">
                  Layak (Skor 3)<br/><span className="font-normal text-[10px] text-emerald-200">(71 - 80%)</span>
                </th>
                <th className="p-3 w-1/5 bg-blue-900/90 text-blue-100">
                  Mahir (Skor 4)<br/><span className="font-normal text-[10px] text-blue-200">(81 - 100%)</span>
                </th>
                {isEditing && <th className="p-2 w-10 text-center bg-slate-900">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {section.tabelRubrik.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="p-3 font-semibold text-slate-900 align-top border-r border-slate-200 bg-slate-50/80">
                    {isEditing ? (
                      <textarea
                        rows={3}
                        className="w-full p-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                        value={row.aspekPenilaian}
                        onChange={e => updateTableRow(sectionKey, rowIdx, 'aspekPenilaian', e.target.value)}
                      />
                    ) : (
                      row.aspekPenilaian
                    )}
                  </td>

                  <td className="p-3 text-slate-700 align-top border-r border-slate-200 bg-rose-50/30">
                    {isEditing ? (
                      <textarea
                        rows={3}
                        className="w-full p-1 bg-white border border-rose-200 rounded text-xs"
                        value={row.perluBimbingan}
                        onChange={e => updateTableRow(sectionKey, rowIdx, 'perluBimbingan', e.target.value)}
                      />
                    ) : (
                      row.perluBimbingan
                    )}
                  </td>

                  <td className="p-3 text-slate-700 align-top border-r border-slate-200 bg-amber-50/30">
                    {isEditing ? (
                      <textarea
                        rows={3}
                        className="w-full p-1 bg-white border border-amber-200 rounded text-xs"
                        value={row.cukup}
                        onChange={e => updateTableRow(sectionKey, rowIdx, 'cukup', e.target.value)}
                      />
                    ) : (
                      row.cukup
                    )}
                  </td>

                  <td className="p-3 text-slate-700 align-top border-r border-slate-200 bg-emerald-50/30">
                    {isEditing ? (
                      <textarea
                        rows={3}
                        className="w-full p-1 bg-white border border-emerald-200 rounded text-xs"
                        value={row.layak}
                        onChange={e => updateTableRow(sectionKey, rowIdx, 'layak', e.target.value)}
                      />
                    ) : (
                      row.layak
                    )}
                  </td>

                  <td className="p-3 text-slate-700 align-top bg-blue-50/30">
                    {isEditing ? (
                      <textarea
                        rows={3}
                        className="w-full p-1 bg-white border border-blue-200 rounded text-xs"
                        value={row.mahir}
                        onChange={e => updateTableRow(sectionKey, rowIdx, 'mahir', e.target.value)}
                      />
                    ) : (
                      row.mahir
                    )}
                  </td>

                  {isEditing && (
                    <td className="p-2 text-center align-middle bg-slate-100">
                      <button
                        type="button"
                        onClick={() => removeTableRow(sectionKey, rowIdx)}
                        className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded transition-all cursor-pointer"
                        title="Hapus Baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pedoman Penskoran */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
          <span className="font-bold block mb-1 uppercase text-[11px] tracking-wide text-emerald-900">
            📊 Pedoman Penskoran & Formula Penentuan Nilai:
          </span>
          {isEditing ? (
            <textarea
              rows={2}
              className="w-full bg-white border border-emerald-300 rounded p-1.5 text-xs text-slate-900"
              value={section.pedomanPenskoran}
              onChange={e => updateSectionField(sectionKey, 'pedomanPenskoran', e.target.value)}
            />
          ) : (
            <p className="font-medium">{section.pedomanPenskoran}</p>
          )}
        </div>
      </div>
    );
  };

  // Render Lembar Penilaian Siswa View
  const renderLembarPenilaianSiswa = () => {
    const filteredSiswa = lembarData.daftarSiswa.filter(s =>
      s.namaSiswa.toLowerCase().includes(searchSiswa.toLowerCase()) ||
      (s.nisn && s.nisn.includes(searchSiswa))
    );

    // Calculate class averages
    let classTotalScore = 0;
    let totalSiswa = lembarData.daftarSiswa.length;

    lembarData.daftarSiswa.forEach(s => {
      const totAs = (s.skorAs || []).reduce((a,b)=>a+(b||0),0);
      const totFor = (s.skorFor || []).reduce((a,b)=>a+(b||0),0);
      const totOf = (s.skorOf || []).reduce((a,b)=>a+(b||0),0);
      const tot = totAs + totFor + totOf;
      const nil = totalMaxSkor > 0 ? Math.round((tot / totalMaxSkor) * 100) : 0;
      classTotalScore += nil;
    });

    const classAverageNilai = totalSiswa > 0 ? Math.round(classTotalScore / totalSiswa) : 0;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-8 print:border-none print:shadow-none print:p-0">
        {/* Header Controls & Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200 print:pb-2 print:mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span>Lembar Penilaian Siswa</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">| Rekapitulasi Nilai Otentik</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Lembar Input & Rekapitulasi Nilai Asesmen Pembelajaran Siswa
            </h3>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <button
              type="button"
              onClick={handleAddSiswa}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import Daftar Nama</span>
            </button>

            <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="px-1.5 text-slate-500">Isi Cepat Skor:</span>
              <button
                type="button"
                onClick={() => handleQuickFillScores(3)}
                className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded border border-slate-300 font-bold transition-all"
                title="Set semua skor ke 3 (Layak / Baik)"
              >
                Skor 3 (Layak)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFillScores(4)}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-blue-800 rounded border border-slate-300 font-bold transition-all"
                title="Set semua skor ke 4 (Mahir)"
              >
                Skor 4 (Mahir)
              </button>
            </div>
          </div>
        </div>

        {/* STATS SUMMARY BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs print:bg-transparent print:p-0 print:border-none">
          <div className="p-2 bg-white rounded-lg border border-slate-200 print:bg-transparent">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Siswa Terdaftar:</span>
            <span className="text-base font-black text-slate-900">{totalSiswa} Siswa</span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-200 print:bg-transparent">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Rata-rata Nilai Kelas:</span>
            <span className="text-base font-black text-emerald-700">{classAverageNilai} / 100</span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-200 print:bg-transparent">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Maksimal Skor:</span>
            <span className="text-base font-black text-blue-800">{totalMaxSkor} Poin</span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-200 print:bg-transparent">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Predikat Rata-Rata:</span>
            <span className={`inline-block px-2 py-0.5 rounded text-xs mt-0.5 ${getPredikatInfo(classAverageNilai).badgeClass}`}>
              {getPredikatInfo(classAverageNilai).label}
            </span>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NISN..."
              value={searchSiswa}
              onChange={(e) => setSearchSiswa(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredSiswa.length} dari {totalSiswa} siswa
          </span>
        </div>

        {/* BIG SCORING MATRIX TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 mb-6">
          <table className="w-full text-xs text-left border-collapse min-w-[950px]">
            <thead>
              {/* Category Grouping Row */}
              <tr className="bg-slate-900 text-white font-bold text-[11px]">
                <th className="p-2.5 w-10 text-center border-r border-slate-800" rowSpan={2}>No</th>
                <th className="p-2.5 border-r border-slate-800 min-w-[150px]" rowSpan={2}>Nama Siswa & NISN</th>
                
                {/* As Learning Headers */}
                <th 
                  className="p-2 text-center bg-purple-900/90 text-purple-100 border-r border-slate-800" 
                  colSpan={numAspekAs}
                >
                  1. Assessment as Learning (Refleksi Diri)
                </th>

                {/* For Learning Headers */}
                <th 
                  className="p-2 text-center bg-blue-900/90 text-blue-100 border-r border-slate-800" 
                  colSpan={numAspekFor}
                >
                  2. Assessment for Learning (Observasi / LKPD)
                </th>

                {/* Of Learning Headers */}
                <th 
                  className="p-2 text-center bg-emerald-900/90 text-emerald-100 border-r border-slate-800" 
                  colSpan={numAspekOf}
                >
                  3. Assessment of Learning (Sumatif / Produk)
                </th>

                <th className="p-2 text-center bg-amber-900/90 text-amber-100 border-r border-slate-800 min-w-[70px]" rowSpan={2}>
                  Total Skor
                </th>
                <th className="p-2 text-center bg-amber-800/90 text-amber-100 border-r border-slate-800 min-w-[65px]" rowSpan={2}>
                  Nilai (0-100)
                </th>
                <th className="p-2 text-center bg-slate-800 text-slate-100 border-r border-slate-800 min-w-[110px]" rowSpan={2}>
                  Predikat
                </th>
                <th className="p-2 border-r border-slate-800 min-w-[160px]" rowSpan={2}>
                  Catatan Umpan Balik Guru
                </th>
                <th className="p-2 text-center w-12 bg-slate-950 print:hidden" rowSpan={2}>
                  Aksi
                </th>
              </tr>

              {/* Sub-aspects header row */}
              <tr className="bg-slate-800 text-slate-200 text-[10px] border-t border-slate-700">
                {/* Aspek As Learning */}
                {currentRubrik.assessmentAsLearning.tabelRubrik.map((asp, i) => (
                  <th key={`as-${i}`} className="p-1.5 text-center border-r border-slate-700 font-normal bg-purple-950/60 max-w-[90px]" title={asp.aspekPenilaian}>
                    A{i+1}
                  </th>
                ))}

                {/* Aspek For Learning */}
                {currentRubrik.assessmentForLearning.tabelRubrik.map((asp, i) => (
                  <th key={`for-${i}`} className="p-1.5 text-center border-r border-slate-700 font-normal bg-blue-950/60 max-w-[90px]" title={asp.aspekPenilaian}>
                    F{i+1}
                  </th>
                ))}

                {/* Aspek Of Learning */}
                {currentRubrik.assessmentOfLearning.tabelRubrik.map((asp, i) => (
                  <th key={`of-${i}`} className="p-1.5 text-center border-r border-slate-700 font-normal bg-emerald-950/60 max-w-[90px]" title={asp.aspekPenilaian}>
                    S{i+1}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={numAspekAs + numAspekFor + numAspekOf + 6} className="p-6 text-center text-slate-500">
                    Belum ada data siswa. Klik <strong>"Tambah Siswa"</strong> atau <strong>"Import Daftar Nama"</strong> untuk memulai.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((siswa, rowIdx) => {
                  const skorAsArr = siswa.skorAs || Array(numAspekAs).fill(3);
                  const skorForArr = siswa.skorFor || Array(numAspekFor).fill(3);
                  const skorOfArr = siswa.skorOf || Array(numAspekOf).fill(3);

                  const totAs = skorAsArr.reduce((a,b) => a + (Number(b) || 0), 0);
                  const totFor = skorForArr.reduce((a,b) => a + (Number(b) || 0), 0);
                  const totOf = skorOfArr.reduce((a,b) => a + (Number(b) || 0), 0);
                  
                  const grandTotal = totAs + totFor + totOf;
                  const finalNilai = totalMaxSkor > 0 ? Math.round((grandTotal / totalMaxSkor) * 100) : 0;
                  const predikat = getPredikatInfo(finalNilai);

                  return (
                    <tr key={siswa.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      {/* No */}
                      <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200 align-middle">
                        {rowIdx + 1}
                      </td>

                      {/* Nama Siswa */}
                      <td className="p-2 border-r border-slate-200 align-middle">
                        <input
                          type="text"
                          className="w-full font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded px-1.5 py-0.5 text-xs transition-all"
                          value={siswa.namaSiswa}
                          onChange={(e) => updateSiswaField(siswa.id, 'namaSiswa', e.target.value)}
                        />
                        <div className="flex items-center gap-1 mt-0.5 px-1">
                          <span className="text-[10px] text-slate-400 font-mono">NISN:</span>
                          <input
                            type="text"
                            className="text-[10px] text-slate-500 font-mono bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded px-1 py-0"
                            value={siswa.nisn || ''}
                            onChange={(e) => updateSiswaField(siswa.id, 'nisn', e.target.value)}
                            placeholder="Opsional"
                          />
                        </div>
                      </td>

                      {/* Skor As Learning */}
                      {currentRubrik.assessmentAsLearning.tabelRubrik.map((_, colIdx) => (
                        <td key={`as-cell-${colIdx}`} className="p-1.5 text-center border-r border-slate-200 bg-purple-50/20 align-middle">
                          <select
                            value={skorAsArr[colIdx] || 3}
                            onChange={(e) => updateSiswaSkor(siswa.id, 'skorAs', colIdx, Number(e.target.value))}
                            className="w-12 text-center py-1 px-0.5 bg-white border border-purple-200 rounded font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-xs cursor-pointer"
                          >
                            <option value={1}>1 (Bimbingan)</option>
                            <option value={2}>2 (Cukup)</option>
                            <option value={3}>3 (Layak)</option>
                            <option value={4}>4 (Mahir)</option>
                          </select>
                        </td>
                      ))}

                      {/* Skor For Learning */}
                      {currentRubrik.assessmentForLearning.tabelRubrik.map((_, colIdx) => (
                        <td key={`for-cell-${colIdx}`} className="p-1.5 text-center border-r border-slate-200 bg-blue-50/20 align-middle">
                          <select
                            value={skorForArr[colIdx] || 3}
                            onChange={(e) => updateSiswaSkor(siswa.id, 'skorFor', colIdx, Number(e.target.value))}
                            className="w-12 text-center py-1 px-0.5 bg-white border border-blue-200 rounded font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs cursor-pointer"
                          >
                            <option value={1}>1 (Bimbingan)</option>
                            <option value={2}>2 (Cukup)</option>
                            <option value={3}>3 (Layak)</option>
                            <option value={4}>4 (Mahir)</option>
                          </select>
                        </td>
                      ))}

                      {/* Skor Of Learning */}
                      {currentRubrik.assessmentOfLearning.tabelRubrik.map((_, colIdx) => (
                        <td key={`of-cell-${colIdx}`} className="p-1.5 text-center border-r border-slate-200 bg-emerald-50/20 align-middle">
                          <select
                            value={skorOfArr[colIdx] || 3}
                            onChange={(e) => updateSiswaSkor(siswa.id, 'skorOf', colIdx, Number(e.target.value))}
                            className="w-12 text-center py-1 px-0.5 bg-white border border-emerald-200 rounded font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs cursor-pointer"
                          >
                            <option value={1}>1 (Bimbingan)</option>
                            <option value={2}>2 (Cukup)</option>
                            <option value={3}>3 (Layak)</option>
                            <option value={4}>4 (Mahir)</option>
                          </select>
                        </td>
                      ))}

                      {/* Total Skor */}
                      <td className="p-2 text-center font-bold text-slate-800 bg-amber-50/40 border-r border-slate-200 align-middle">
                        {grandTotal} <span className="text-[10px] text-slate-400 font-normal">/ {totalMaxSkor}</span>
                      </td>

                      {/* Nilai Akhir (0-100) */}
                      <td className="p-2 text-center font-black text-sm text-emerald-900 bg-emerald-50/40 border-r border-slate-200 align-middle">
                        {finalNilai}
                      </td>

                      {/* Predikat Badge */}
                      <td className="p-2 text-center border-r border-slate-200 align-middle">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${predikat.badgeClass}`}>
                          {predikat.label}
                        </span>
                      </td>

                      {/* Catatan Guru */}
                      <td className="p-2 border-r border-slate-200 align-middle">
                        <textarea
                          rows={1}
                          className="w-full text-xs text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded p-1 transition-all"
                          value={siswa.catatanGuru || ''}
                          onChange={(e) => updateSiswaField(siswa.id, 'catatanGuru', e.target.value)}
                          placeholder="Catatan umpan balik..."
                        />
                      </td>

                      {/* Delete button */}
                      <td className="p-2 text-center align-middle print:hidden">
                        <button
                          type="button"
                          onClick={() => handleRemoveSiswa(siswa.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          title="Hapus Siswa Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend / Guidance */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold block mb-0.5 text-amber-900">💡 Panduan Pembobotan Skor Asesmen:</span>
            <p className="text-slate-700 text-[11px]">
              Skor 1 = Perlu Bimbingan (0-60%) | Skor 2 = Cukup (61-70%) | Skor 3 = Layak (71-80%) | Skor 4 = Mahir (81-100%).
            </p>
          </div>
          <div className="text-[11px] font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-amber-200 shrink-0">
            Formula Nilai = (Total Skor Perolehan / {totalMaxSkor}) x 100
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:static print:bg-white print:overflow-visible">
      <div className="bg-slate-100 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none print:w-full print:bg-white">
        {/* MODAL HEADER */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-300/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Rubrik Penilaian AI (3 Asesmen & Lembar Siswa)</span>
                <span className="px-2 py-0.5 bg-amber-400 text-emerald-950 text-[11px] font-black rounded-md uppercase tracking-wider">
                  Deep Learning
                </span>
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Assessment as Learning, Assessment for Learning, Assessment of Learning, & Lembar Penilaian Siswa
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPromptInput(!showPromptInput)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Menyusun Rubrik...' : 'Buat Ulang via AI'}</span>
            </button>

            {isEditing ? (
              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Rubrik</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Manual Rubrik</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-xl transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CUSTOM PROMPT INPUT BANNER FOR AI GENERATION */}
        {showPromptInput && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 sm:p-4 shrink-0 print:hidden">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-4xl mx-auto">
              <div className="flex-1">
                <label className="text-xs font-bold text-amber-900 block mb-1">
                  💡 Catatan Khusus untuk AI Penyusun Rubrik Penilaian (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Buatkan indikator rubrik yang lebih spesifik untuk praktikum ipas materi gaya magnet dan diskusi kelompok..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleTriggerGenerate}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isGenerating ? 'Generasi Rubrik...' : 'Proses Rubrik AI'}</span>
              </button>
            </div>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="bg-white border-b border-slate-200 px-4 pt-3 flex items-center gap-1 overflow-x-auto shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('as')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'as'
                ? 'bg-purple-50 text-purple-900 border-purple-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <UserCheck className="w-4 h-4 text-purple-600" />
            <span>1. Assessment as Learning</span>
            <span className="px-1.5 py-0.2 bg-purple-200 text-purple-800 rounded-full text-[10px]">Refleksi Diri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('for')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'for'
                ? 'bg-blue-50 text-blue-900 border-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <Search className="w-4 h-4 text-blue-600" />
            <span>2. Assessment for Learning</span>
            <span className="px-1.5 py-0.2 bg-blue-200 text-blue-800 rounded-full text-[10px]">Observasi & LKPD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('of')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'of'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <Target className="w-4 h-4 text-emerald-600" />
            <span>3. Assessment of Learning</span>
            <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-800 rounded-full text-[10px]">Sumatif & Produk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lembar')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'lembar'
                ? 'bg-amber-100 text-amber-950 border-amber-600 shadow-xs'
                : 'text-amber-900 hover:bg-amber-50 border-transparent font-bold'
            }`}
          >
            <Users className="w-4 h-4 text-amber-700" />
            <span>4. Lembar Penilaian Siswa</span>
            <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
              {lembarData.daftarSiswa.length} Siswa
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-200 text-slate-900 border-slate-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-slate-700" />
            <span>Semua Dokumen (Tampilan Lengkap)</span>
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          {/* Header Identitas Cetak */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs mb-6 print:border-none print:shadow-none print:p-0 print:mb-4">
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
              <h1 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                {currentRubrik.judulRubrik}
              </h1>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                {currentRubrik.subJudul || 'Pedoman Penilaian Otentik Kurikulum Merdeka'}
              </p>
            </div>

            {/* Grid Identitas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 print:bg-transparent print:border-none">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Mata Pelajaran:</span>
                <span className="font-bold text-slate-900">{currentRubrik.mataPelajaran}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Fase / Kelas:</span>
                <span className="font-bold text-slate-900">{currentRubrik.faseKelas}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Lingkup Materi:</span>
                <span className="font-bold text-slate-900">{currentRubrik.lingkupMateri}</span>
              </div>
            </div>

            {/* Petunjuk Penggunaan */}
            {currentRubrik.petunjukPenggunaan && currentRubrik.petunjukPenggunaan.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-1">💡 Petunjuk Penggunaan Rubrik Guru:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {currentRubrik.petunjukPenggunaan.map((ptj, idx) => (
                    <li key={idx}>{ptj}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RENDER ACTIVE TAB OR ALL TABLES */}
          {(activeTab === 'as' || activeTab === 'all') && renderRubrikTable(
            'assessmentAsLearning',
            'Assessment as Learning',
            'bg-purple-100 text-purple-900 border border-purple-300',
            <UserCheck className="w-3.5 h-3.5 text-purple-700" />
          )}

          {(activeTab === 'for' || activeTab === 'all') && renderRubrikTable(
            'assessmentForLearning',
            'Assessment for Learning',
            'bg-blue-100 text-blue-900 border border-blue-300',
            <Search className="w-3.5 h-3.5 text-blue-700" />
          )}

          {(activeTab === 'of' || activeTab === 'all') && renderRubrikTable(
            'assessmentOfLearning',
            'Assessment of Learning',
            'bg-emerald-100 text-emerald-900 border border-emerald-300',
            <Target className="w-3.5 h-3.5 text-emerald-700" />
          )}

          {(activeTab === 'lembar' || activeTab === 'all') && renderLembarPenilaianSiswa()}

          {/* SIGNATURE BLOCK FOR PRINT */}
          <div className="mt-8 pt-6 border-t-2 border-slate-300 text-xs print:break-inside-avoid">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="text-slate-600 mb-1">Mengetahui,</p>
                <p className="font-bold text-slate-900">Kepala Sekolah {planData.identitas.namaSekolah}</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">{planData.identitas.namaKepsek || '_________________________'}</p>
                <p className="text-slate-600 text-xs">NIP. {planData.identitas.nipKepsek || '...........................................'}</p>
              </div>

              <div>
                <p className="text-slate-600 mb-1">Disahkan di Sekolah, ......................... 2026</p>
                <p className="font-bold text-slate-900">Guru Mata Pelajaran</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">{planData.identitas.namaGuru || '_________________________'}</p>
                <p className="text-slate-600 text-xs">NIP. {planData.identitas.nipGuru || '...........................................'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* IMPORT / PASTE DAFTAR SISWA MODAL */}
      {showPasteModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>Import Daftar Nama Siswa</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Tempelkan (paste) daftar nama siswa di bawah ini (1 nama per baris). Sistem akan secara otomatis membuatkan baris penilaian siswa.
            </p>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Ahmad Dani\nSiti Rahma\nBudi Santoso\nDewa Putu\nEvelyn Wijaya`}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBatchPasteSiswa}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Proses Import Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
