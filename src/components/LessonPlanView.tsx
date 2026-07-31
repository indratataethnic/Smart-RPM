import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  Copy,
  Sparkles,
  Save,
  Check,
  ChevronLeft,
  BookOpen,
  Award,
  Users,
  Monitor,
  CheckCircle2,
  HelpCircle,
  FileText,
  CheckSquare,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { LessonPlanOutput, KKTPData, LKPDData, JurnalHarianGuru, JurnalHarianEntry, normalizeAsesmen, AsesmenItem } from '../types';
import { LKPDModal } from './LKPDModal';
import { JurnalHarianModal } from './JurnalHarianModal';

export const getDefaultJurnalHarian = (p: LessonPlanOutput): JurnalHarianGuru => {
  if (p.jurnalHarian && Array.isArray(p.jurnalHarian.entries) && p.jurnalHarian.entries.length > 0) {
    return {
      judul: p.jurnalHarian.judul || 'Jurnal Harian Pelaksanaan Pembelajaran',
      catatanRefleksiUmum: p.jurnalHarian.catatanRefleksiUmum || '',
      entries: p.jurnalHarian.entries.map((e: any) => ({
        hariTanggal: e.hariTanggal || 'Senin, ... 2026',
        pertemuanJam: e.pertemuanJam || 'Pertemuan 1 (Jam 1-2)',
        mataPelajaran: e.mataPelajaran || p.identitas?.mataPelajaran || 'Mata Pelajaran',
        atp: e.atp || p.tujuanDanDpl?.tujuanPembelajaran || 'Alur Tujuan Pembelajaran',
        materiAktivitas: e.materiAktivitas || e.materiPokok || 'Materi & Aktivitas Pembelajaran',
        penilaian: e.penilaian || 'Asesmen Formatif (Observasi & LKPD)',
        catatanKendala: e.catatanKendala || e.catatanKejadian || 'Catatan dan kendala pelaksanaan pembelajaran...',
      })),
    };
  }

  const mPelajaran = p.identitas?.mataPelajaran || 'Mata Pelajaran';
  const tp = p.tujuanDanDpl?.tujuanPembelajaran || 'Alur Tujuan Pembelajaran';
  const topik = p.tujuanDanDpl?.lingkupMateri || 'Materi Pokok';

  return {
    judul: 'Jurnal Harian Pelaksanaan Pembelajaran',
    catatanRefleksiUmum: `Catatan refleksi pelaksanaan pembelajaran ${mPelajaran} pada lingkup materi ${topik}.`,
    entries: [
      {
        hariTanggal: 'Senin, ... 2026',
        pertemuanJam: 'Pertemuan 1 (Jam 1-2)',
        mataPelajaran: mPelajaran,
        atp: tp,
        materiAktivitas: `${topik} - Tahap Memahami & Eksplorasi Konsep`,
        penilaian: 'Asesmen Formatif (Observasi Sikap & Diskusi)',
        catatanKendala: 'Siswa aktif berdiskusi kelompok dan merespon pertanyaan pemantik awal dengan antusias.',
      },
      {
        hariTanggal: 'Rabu, ... 2026',
        pertemuanJam: 'Pertemuan 2 (Jam 3-4)',
        mataPelajaran: mPelajaran,
        atp: tp,
        materiAktivitas: `${topik} - Tahap Mengaplikasi & Praktek LKPD`,
        penilaian: 'Asesmen Formatif (Penilaian Unjuk Kerja / LKPD)',
        catatanKendala: 'Sebagian kelompok memerlukan bimbingan tambahan saat analisis data praktikum.',
      },
    ],
  };
};

interface LessonPlanViewProps {
  plan: LessonPlanOutput;
  onBackToForm: () => void;
  onOpenRefiner: () => void;
  onSavePlan: () => void;
  isSaved: boolean;
  onUpdatePlan?: (updatedPlan: LessonPlanOutput) => void;
}

export const LessonPlanView: React.FC<LessonPlanViewProps> = ({
  plan,
  onBackToForm,
  onOpenRefiner,
  onSavePlan,
  isSaved,
  onUpdatePlan,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<LessonPlanOutput>(plan);
  const [saveToast, setSaveToast] = useState(false);

  // LKPD AI & Jurnal Harian State
  const [isLkpdModalOpen, setIsLkpdModalOpen] = useState(false);
  const [isGeneratingLkpd, setIsGeneratingLkpd] = useState(false);
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);

  const handleSaveJurnal = (newJurnal: JurnalHarianGuru) => {
    const updated = {
      ...(isEditing ? editedPlan : plan),
      jurnalHarian: newJurnal,
    };
    if (isEditing) {
      setEditedPlan(updated);
    }
    if (onUpdatePlan) {
      onUpdatePlan(updated);
    }
  };

  React.useEffect(() => {
    setEditedPlan(plan);
  }, [plan]);

  const createLocalLkpdFallback = (p: LessonPlanOutput): LKPDData => {
    const mp = p.identitas?.mataPelajaran || 'Mata Pelajaran';
    const lm = p.tujuanDanDpl?.lingkupMateri || 'Materi Utama';

    return {
      judulLKPD: `LEMBAR KERJA PESERTA DIDIK (LKPD) - ${lm.toUpperCase()}`,
      subJudul: `Aktivitas Pembelajaran Mendalam (Deep Learning) - ${mp}`,
      petunjukUmum: [
        "Berdoalah sebelum memulai mengerjakan lembar kerja ini.",
        "Baca dan pahami setiap instruksi aktivitas dengan saksama bersama kelompokmu.",
        "Gunakan alat/bahan dan media digital yang direkomendasikan dengan bijak.",
        "Tanyakan kepada guru apabila terdapat langkah kerja yang kurang dimengerti."
      ],
      lembarPenugasan: {
        judulTugas: `Aktivitas Kolaboratif: Eksplorasi Konseptual ${lm}`,
        tujuanAktivitas: `Menganalisis dan merumuskan pemahaman bermakna mengenai konsep dasar ${lm} secara berkelompok.`,
        alatDanBahan: [
          "Buku Catatan / Kertas Karton",
          "Alat Tulis & Spidol Warna",
          "Perangkat Digital (Smartphone/Chromebook) untuk akses literasi digital/simulator"
        ],
        instruksiKerja: [
          "Berkumpullah bersama anggota kelompok yang telah ditentukan oleh guru.",
          `Diskusikan bersama kelompok mengenai konsep ${lm} berdasarkan stimulus yang ditayangkan guru.`,
          "Petakan ide-ide pokok hasil diskusi kelompok ke dalam bentuk mind-mapping/diagram kreatif pada karton atau aplikasi digital.",
          "Persiapkan perwakilan kelompok untuk mempresentasikan hasil mind-mapping di depan kelas secara bergantian."
        ]
      },
      panduanPraktikum: {
        judulEksplorasi: `Eksplorasi Konteks Nyata & Eksperimen Mandiri: Penerapan ${lm}`,
        tujuanPraktikum: `Membuktikan dan mengamati secara langsung prinsip kerja serta implikasi ${lm} dalam kehidupan sehari-hari.`,
        langkahKerja: [
          "Siapkan alat dan bahan praktikum sesuai dengan petunjuk guru.",
          "Lakukan eksperimen / observasi secara bertahap sesuai petunjuk kerja kelompok.",
          "Catat setiap fenomena, data kuantitatif, atau data kualitatif yang teramati ke dalam tabel pengamatan.",
          "Diskusikan hasil temuan kelompok dan rumuskan kesimpulan awal secara bernalar kritis."
        ],
        tabelPengamatan: {
          judulTabel: `Tabel Hasil Pengamatan & Eksperimen ${lm}`,
          headers: ["No", "Aktivitas / Perlakuan", "Hasil Pengamatan", "Keterangan / Analisis"],
          rows: [
            ["1", "Percobaan / Pengamatan 1", "...........................................", "Sesuai teori dasar"],
            ["2", "Percobaan / Pengamatan 2", "...........................................", "Terjadi perubahan signifikan"],
            ["3", "Percobaan / Pengamatan 3", "...........................................", "Memerlukan analisis lanjut"]
          ],
          petunjukPengisian: "Isikan data hasil pengukuran/pengamatan secara teliti."
        },
        pertanyaanAnalisis: [
          `Berdasarkan data hasil eksperimen, jelaskan hubungan sebab-akibat yang terjadi pada fenomena ${lm}!`,
          "Apa kendala terbesar yang kelompokmu temukan saat melakukan praktikum, dan bagaimana kalian menyelesaikannya?",
          `Tuliskan kesimpulan akhir kelompok mengenai cara kerja serta manfaat ${lm} dalam konteks kehidupan nyata sehari-hari!`
        ]
      },
      latihanSoal: {
        petunjukPengerjaan: "Jawablah soal-soal latihan di bawah ini secara mandiri dan jujur untuk menguji pemahaman mendalammu.",
        pilihanGanda: [
          {
            no: 1,
            pertanyaan: `Manakah di antara pernyataan berikut yang paling tepat menggambarkan esensi utama dari konsep ${lm}?`,
            pilihan: [
              `A. Sebuah fenomena statis yang tidak berhubungan dengan mata pelajaran ${mp}.`,
              `B. Konsep dinamis tentang ${lm} yang berperan penting dalam memecahkan masalah praktis sehari-hari.`,
              `C. Teori hafalan semata yang hanya diujikan pada akhir semester sekolah.`,
              `D. Aktivitas praktikum tanpa landasan teori atau rancangan instruksional.`
            ],
            kunciJawaban: "B",
            pembahasan: `Esensi utama dari ${lm} adalah penerapan konsep secara kontekstual dan dinamis untuk menyelesaikan masalah nyata dalam kehidupan sehari-hari.`
          },
          {
            no: 2,
            pertanyaan: `Dalam pembelajaran mendalam, setelah kita "Memahami" suatu materi ${lm}, langkah selanjutnya yang paling krusial untuk melatih nalar kritis adalah...`,
            pilihan: [
              "A. Menghafal seluruh definisi istilah yang ada di buku teks secara berulang.",
              "B. Mengaplikasikannya dalam konteks nyata / pemecahan masalah (Application).",
              "C. Mengabaikan umpan balik dari guru dan langsung berpindah ke bab materi berikutnya.",
              "D. Mencribel atau menulis ulang materi tanpa melakukan refleksi atau diskusi kelompok."
            ],
            kunciJawaban: "B",
            pembahasan: 'Tahap Mengaplikasi (Application) adalah jembatan penting untuk menguji apakah pemahaman konsep murid sudah mendalam dan fungsional.'
          }
        ],
        soalUraian: [
          {
            no: 1,
            pertanyaan: `Uraikanlah bagaimana pemahaman tentang ${lm} dapat membantumu menjelaskan salah satu kejadian nyata yang sering kamu jumpai di lingkungan sekitarmu!`,
            kunciJawaban: "Kunci Jawaban bervariasi tergantung argumentasi siswa. Jawaban dinilai mahir apabila siswa mampu menghubungkan minimal 2 elemen konsep dasar dengan contoh nyata secara logis.",
            pembahasan: "Mengukur kemampuan kognitif tingkat tinggi (HOTS) siswa dalam mensintesis teori dengan aplikasi kontekstual sehari-hari."
          },
          {
            no: 2,
            pertanyaan: `Lakukan refleksi diri: bagian manakah dari materi ${lm} ini yang menurutmu paling menarik untuk dieksplorasi lebih jauh? Berikan alasan pendukungmu!`,
            kunciJawaban: "Kunci Jawaban terbuka (open-ended). Kriteria ketuntasan dinilai dari kedalaman refleksi metakognitif dan kemandirian berpikir siswa.",
            pembahasan: "Mengukur aspek metakognisi, self-assessment, dan minat belajar siswa terhadap topik yang diajarkan."
          }
        ]
      },
      refleksiSiswa: {
        pertanyaanRefleksi: [
          "Apa hal terpenting yang baru saja kamu pahami setelah menyelesaikan seluruh aktivitas lembar kerja ini?",
          "Apakah kamu merasa kerja sama kelompokmu berjalan dengan baik dan saling mendukung? Jelaskan bagian mana yang perlu ditingkatkan!",
          "Bagaimana perasaanmu selama mengikuti pembelajaran mendalam hari ini? Lingkari/pilih emoji yang menggambarkan perasaanmu!"
        ],
        checkListDiri: [
          `Saya telah memahami konsep dasar mengenai ${lm} dengan baik.`,
          "Saya dapat bekerja sama secara kolaboratif dalam kelompok diskusi.",
          "Saya mampu menganalisis hasil eksperimen dan mengisi tabel pengamatan.",
          "Saya dapat merefleksikan proses belajar saya secara jujur dan mandiri."
        ]
      }
    };
  };

  const handleGenerateLKPD = async (customInstruction?: string) => {
    try {
      setIsGeneratingLkpd(true);
      const res = await fetch('/api/generate-lkpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planData: isEditing ? editedPlan : plan,
          customInstruction,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.lkpd) {
        const updated = {
          ...(isEditing ? editedPlan : plan),
          lampiran: {
            ...(isEditing ? editedPlan : plan).lampiran,
            lkpdStructured: data.lkpd,
          },
        };
        if (isEditing) {
          setEditedPlan(updated);
        }
        if (onUpdatePlan) {
          onUpdatePlan(updated);
        }
      } else {
        throw new Error(data.error || 'Gagal membuat LKPD');
      }
    } catch (err: any) {
      console.warn('Error generating LKPD, running local smart fallback compiler:', err);
      const localLkpd = createLocalLkpdFallback(isEditing ? editedPlan : plan);
      const updated = {
        ...(isEditing ? editedPlan : plan),
        lampiran: {
          ...(isEditing ? editedPlan : plan).lampiran,
          lkpdStructured: localLkpd,
        },
      };
      if (isEditing) {
        setEditedPlan(updated);
      }
      if (onUpdatePlan) {
        onUpdatePlan(updated);
      }
    } finally {
      setIsGeneratingLkpd(false);
    }
  };

  const handleSaveLKPD = (newLkpdData: LKPDData) => {
    const updated = {
      ...(isEditing ? editedPlan : plan),
      lampiran: {
        ...(isEditing ? editedPlan : plan).lampiran,
        lkpdStructured: newLkpdData,
      },
    };
    if (isEditing) {
      setEditedPlan(updated);
    }
    if (onUpdatePlan) {
      onUpdatePlan(updated);
    }
  };

  const handleSaveEdits = () => {
    if (onUpdatePlan) {
      onUpdatePlan(editedPlan);
    }
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleCancelEdits = () => {
    setEditedPlan(plan);
    setIsEditing(false);
  };

  // Field updaters
  const updateIdentitas = (field: keyof LessonPlanOutput['identitas'], val: string) => {
    setEditedPlan((prev) => ({
      ...prev,
      identitas: { ...prev.identitas, [field]: val },
    }));
  };

  const updateAnalisis = (field: keyof LessonPlanOutput['analisisAwal'], val: string) => {
    setEditedPlan((prev) => ({
      ...prev,
      analisisAwal: { ...prev.analisisAwal, [field]: val },
    }));
  };

  const updateTujuanDpl = (field: keyof LessonPlanOutput['tujuanDanDpl'], val: any) => {
    setEditedPlan((prev) => ({
      ...prev,
      tujuanDanDpl: { ...prev.tujuanDanDpl, [field]: val },
    }));
  };

  const updateDesain = (field: keyof LessonPlanOutput['desainPembelajaran'], items: string[]) => {
    setEditedPlan((prev) => ({
      ...prev,
      desainPembelajaran: { ...prev.desainPembelajaran, [field]: items },
    }));
  };

  const updateKegiatanIntiStage = (idx: number, field: string, val: any) => {
    setEditedPlan((prev) => {
      const copy = [...prev.kegiatanPembelajaran.kegiatanInti];
      copy[idx] = { ...copy[idx], [field]: val };
      return {
        ...prev,
        kegiatanPembelajaran: {
          ...prev.kegiatanPembelajaran,
          kegiatanInti: copy,
        },
      };
    });
  };

  const updateAsesmenItem = (
    category: 'assessmentAsLearning' | 'assessmentForLearning' | 'assessmentOfLearning',
    index: number,
    field: keyof AsesmenItem,
    val: string
  ) => {
    setEditedPlan((prev) => {
      const norm = normalizeAsesmen(prev.asesmen);
      const list = [...norm[category]];
      if (!list[index]) {
        list[index] = { bentukPenilaian: '', teknikPenilaian: '', instrumenPenilaian: '' };
      }
      list[index] = { ...list[index], [field]: val };
      return {
        ...prev,
        asesmen: {
          ...norm,
          [category]: list,
        },
      };
    });
  };

  const addAsesmenItem = (category: 'assessmentAsLearning' | 'assessmentForLearning' | 'assessmentOfLearning') => {
    setEditedPlan((prev) => {
      const norm = normalizeAsesmen(prev.asesmen);
      const list = [...norm[category], { bentukPenilaian: '', teknikPenilaian: '', instrumenPenilaian: '' }];
      return {
        ...prev,
        asesmen: {
          ...norm,
          [category]: list,
        },
      };
    });
  };

  const removeAsesmenItem = (category: 'assessmentAsLearning' | 'assessmentForLearning' | 'assessmentOfLearning', index: number) => {
    setEditedPlan((prev) => {
      const norm = normalizeAsesmen(prev.asesmen);
      const list = norm[category].filter((_, i) => i !== index);
      return {
        ...prev,
        asesmen: {
          ...norm,
          [category]: list.length > 0 ? list : [{ bentukPenilaian: '', teknikPenilaian: '', instrumenPenilaian: '' }],
        },
      };
    });
  };

  const updateRemedial = (field: keyof LessonPlanOutput['remedialDanPengayaan'], val: string) => {
    setEditedPlan((prev) => ({
      ...prev,
      remedialDanPengayaan: { ...prev.remedialDanPengayaan, [field]: val },
    }));
  };

  const updateLampiran = (field: keyof LessonPlanOutput['lampiran'], val: any) => {
    setEditedPlan((prev) => ({
      ...prev,
      lampiran: { ...prev.lampiran, [field]: val },
    }));
  };

  const activeJurnal = getDefaultJurnalHarian(isEditing ? editedPlan : plan);

  const updateJurnalHarianField = (field: keyof JurnalHarianGuru, value: any) => {
    const currentJurnal = getDefaultJurnalHarian(editedPlan);
    const updatedJurnal = { ...currentJurnal, [field]: value };
    const newPlan = { ...editedPlan, jurnalHarian: updatedJurnal };
    setEditedPlan(newPlan);
    if (onUpdatePlan) onUpdatePlan(newPlan);
  };

  const updateJurnalEntryRow = (idx: number, field: keyof JurnalHarianEntry, value: string) => {
    const currentJurnal = getDefaultJurnalHarian(editedPlan);
    const newEntries = [...currentJurnal.entries];
    newEntries[idx] = { ...newEntries[idx], [field]: value };
    const updatedJurnal = { ...currentJurnal, entries: newEntries };
    const newPlan = { ...editedPlan, jurnalHarian: updatedJurnal };
    setEditedPlan(newPlan);
    if (onUpdatePlan) onUpdatePlan(newPlan);
  };

  const addJurnalEntryRow = () => {
    const currentJurnal = getDefaultJurnalHarian(editedPlan);
    const newEntry: JurnalHarianEntry = {
      hariTanggal: 'Senin, ... 2026',
      pertemuanJam: 'Pertemuan ke-...',
      mataPelajaran: editedPlan.identitas?.mataPelajaran || 'Mata Pelajaran',
      atp: editedPlan.tujuanDanDpl?.tujuanPembelajaran || 'Alur Tujuan Pembelajaran',
      materiAktivitas: 'Materi & Aktivitas Pembelajaran',
      penilaian: 'Asesmen Formatif (Observasi / LKPD)',
      catatanKendala: 'Catatan dan kendala pelaksanaan pembelajaran...',
    };
    const updatedJurnal = { ...currentJurnal, entries: [...currentJurnal.entries, newEntry] };
    const newPlan = { ...editedPlan, jurnalHarian: updatedJurnal };
    setEditedPlan(newPlan);
    if (onUpdatePlan) onUpdatePlan(newPlan);
  };

  const removeJurnalEntryRow = (idx: number) => {
    const currentJurnal = getDefaultJurnalHarian(editedPlan);
    const newEntries = currentJurnal.entries.filter((_, i) => i !== idx);
    const updatedJurnal = { ...currentJurnal, entries: newEntries };
    const newPlan = { ...editedPlan, jurnalHarian: updatedJurnal };
    setEditedPlan(newPlan);
    if (onUpdatePlan) onUpdatePlan(newPlan);
  };

  const updateKKTPCriterion = (cIdx: number, field: string, val: string) => {
    if (typeof editedPlan.lampiran.kktp !== 'object' || !editedPlan.lampiran.kktp) return;
    const currentObj = editedPlan.lampiran.kktp;
    const newKriteria = [...(currentObj.kriteria || [])];
    newKriteria[cIdx] = { ...newKriteria[cIdx], [field]: val };

    updateLampiran('kktp', {
      ...currentObj,
      kriteria: newKriteria,
    });
  };

  const addKKTPCriterionRow = () => {
    if (typeof editedPlan.lampiran.kktp !== 'object' || !editedPlan.lampiran.kktp) return;
    const currentObj = editedPlan.lampiran.kktp;
    const newKriteria = [
      ...(currentObj.kriteria || []),
      {
        aspekPenilaian: 'Indikator / Aspek Ketercapaian Baru',
        perluBimbingan: 'Belum menunjukkan pemahaman (0-60%)',
        cukup: 'Pemahaman dasar dengan bimbingan (61-70%)',
        layak: 'Pemahaman mandiri dan tepat (71-80%)',
        mahir: 'Pemahaman mendalam & analisis HOTS (81-100%)',
      },
    ];
    updateLampiran('kktp', {
      ...currentObj,
      kriteria: newKriteria,
    });
  };

  const removeKKTPCriterionRow = (cIdx: number) => {
    if (typeof editedPlan.lampiran.kktp !== 'object' || !editedPlan.lampiran.kktp) return;
    const currentObj = editedPlan.lampiran.kktp;
    const newKriteria = (currentObj.kriteria || []).filter((_, i) => i !== cIdx);
    updateLampiran('kktp', {
      ...currentObj,
      kriteria: newKriteria,
    });
  };

  // Helper to separate Fase and Kelas
  const parseFaseAndKelas = (faseKelasStr: string) => {
    if (!faseKelasStr) return { fase: '-', kelas: '-' };

    if (faseKelasStr.includes(' - ')) {
      const parts = faseKelasStr.split(' - ');
      return {
        fase: parts[0]?.trim() || faseKelasStr,
        kelas: parts.slice(1).join(' - ')?.trim() || '-',
      };
    }

    if (faseKelasStr.includes(' / ')) {
      const parts = faseKelasStr.split(' / ');
      return {
        fase: parts[0]?.trim() || faseKelasStr,
        kelas: parts.slice(1).join(' / ')?.trim() || '-',
      };
    }

    const faseMatch = faseKelasStr.match(/(Fase\s+[A-Za-z0-9]+)/i);
    const kelasMatch = faseKelasStr.match(/(Kelas\s+[^,\-/]+)/i);

    if (faseMatch && kelasMatch) {
      return {
        fase: faseMatch[1],
        kelas: kelasMatch[1],
      };
    }

    return {
      fase: faseKelasStr,
      kelas: '-',
    };
  };

  // Helper to format activities for plain text / markdown
  const formatActivityText = (activities: string | string[]) => {
    let list: string[] = [];
    if (Array.isArray(activities)) {
      list = activities;
    } else if (typeof activities === 'string') {
      list = activities.split('\n').map((s) => s.trim()).filter(Boolean);
    }
    if (list.length === 0) return '  - (Tidak ada aktivitas)';
    return list.map((item) => `  - ${item.replace(/^[-*•\d.]+\s*/, '')}`).join('\n');
  };

  // Helper to render activity lists in JSX
  const renderActivityList = (
    activityData: string | string[],
    colorScheme: 'teal' | 'emerald'
  ) => {
    let list: string[] = [];
    if (Array.isArray(activityData)) {
      list = activityData;
    } else if (typeof activityData === 'string') {
      list = activityData.split('\n').map((s) => s.trim()).filter(Boolean);
    }

    if (list.length === 0) {
      return <p className="text-slate-500 italic text-xs">Belum ada aktivitas.</p>;
    }

    const dotClass = colorScheme === 'teal' ? 'bg-teal-600' : 'bg-emerald-600';

    if (list.length === 1 && !list[0].startsWith('-') && !list[0].startsWith('•') && !/^\d+\./.test(list[0])) {
      return <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{list[0]}</p>;
    }

    return (
      <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed mt-1">
        {list.map((item, idx) => {
          const cleanText = item.replace(/^[-*•\d.]+\s*/, '');
          return (
            <li key={idx} className="flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass} shrink-0 mt-1.5`} />
              <span className="flex-1">{cleanText}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  // Helper to format list items into HTML bullets for Word
  const formatListItemsForWord = (items: string | string[]) => {
    let list: string[] = [];
    if (Array.isArray(items)) {
      list = items;
    } else if (typeof items === 'string') {
      list = items.split('\n').map((s) => s.trim()).filter(Boolean);
    }
    if (list.length === 0) {
      return '<p style="margin: 0; font-style: italic; color: #64748b; font-size: 9.5pt;">(Belum ada data)</p>';
    }

    if (list.length === 1 && !list[0].startsWith('-') && !list[0].startsWith('•') && !/^\d+\./.test(list[0])) {
      return `<p style="margin: 0 0 4px 0; color: #334155; font-size: 9.5pt;">${list[0]}</p>`;
    }

    return `<ul style="margin: 4px 0 0 0; padding-left: 18px; color: #334155; font-size: 9.5pt;">
      ${list
        .map((item) => {
          const cleanText = item.replace(/^[-*•\d.]+\s*/, '');
          return `<li style="margin-bottom: 3px; line-height: 1.4;">${cleanText}</li>`;
        })
        .join('')}
    </ul>`;
  };

  // Build full rich HTML for Word Document export matching preview layout
  const buildWordDocumentHtml = (planData: LessonPlanOutput) => {
    const {
      identitas,
      analisisAwal,
      tujuanDanDpl,
      desainPembelajaran,
      kegiatanPembelajaran,
      asesmen,
      remedialDanPengayaan,
      lampiran,
    } = planData;

    const normAsesmen = normalizeAsesmen(asesmen);

    const { fase: wordFase, kelas: wordKelas } = parseFaseAndKelas(identitas.faseKelas);

    return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Rencana Pembelajaran Mendalam (RPM)</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 12mm 15mm 12mm;
        }
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 10.5pt;
          line-height: 1.4;
          color: #1e293b;
          background-color: #ffffff;
        }
        h1, h2, h3, h4 { margin: 0; font-family: 'Arial', sans-serif; }
        .header-banner {
          border-bottom: 3px solid #0f766e;
          padding-bottom: 8px;
          margin-bottom: 18px;
          text-align: center;
        }
        .section-header {
          background-color: #0f766e;
          color: #ffffff;
          font-weight: bold;
          font-size: 11pt;
          padding: 6px 10px;
          margin-top: 18px;
          margin-bottom: 10px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .grid-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 14px;
        }
        .grid-table th, .grid-table td {
          border: 1px solid #cbd5e1;
          padding: 7px 9px;
          font-size: 9.5pt;
          vertical-align: top;
        }
        .bg-label {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #0f172a;
        }
        .badge-dpl {
          display: inline-block;
          background-color: #ccfbf1;
          color: #0f766e;
          border: 1px solid #99f6e4;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: bold;
          margin-right: 4px;
          margin-bottom: 4px;
        }
        .badge-memahami {
          background-color: #2563eb;
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 9pt;
        }
        .badge-mengaplikasi {
          background-color: #059669;
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 9pt;
        }
        .badge-merefleksi {
          background-color: #7c3aed;
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 9pt;
        }
        .prinsip-tag {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: bold;
          display: inline-block;
          margin-top: 4px;
          margin-bottom: 6px;
        }
        .activity-title-guru {
          color: #0f766e;
          font-weight: bold;
          font-size: 9.5pt;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .activity-title-murid {
          color: #047857;
          font-weight: bold;
          font-size: 9.5pt;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      <!-- Document Banner -->
      <div class="header-banner">
        <h1 style="font-size: 15pt; color: #0f172a; text-transform: uppercase; font-weight: 900;">
          RENCANA PEMBELAJARAN MENDALAM (RPM)
        </h1>
        <p style="font-size: 9.5pt; font-weight: bold; color: #0f766e; margin-top: 3px;">
          MODUL AJAR KURIKULUM MERDEKA - BERBASIS DEEP LEARNING FRAMEWORK
        </p>
        <p style="font-size: 9pt; color: #475569; font-style: italic; margin-top: 2px;">
          ${identitas.namaSekolah || 'SATUAN PENDIDIKAN'}
        </p>
      </div>

      <!-- Identitas Dokumen -->
      <table class="grid-table">
        <tr>
          <td class="bg-label" width="22%">Nama Sekolah</td>
          <td width="28%">${identitas.namaSekolah || '-'}</td>
          <td class="bg-label" width="22%">Mata Pelajaran</td>
          <td width="28%">${identitas.mataPelajaran || '-'}</td>
        </tr>
        <tr>
          <td class="bg-label">Nama Guru</td>
          <td>${identitas.namaGuru || '-'}</td>
          <td class="bg-label">NIP Guru</td>
          <td>${identitas.nipGuru || '-'}</td>
        </tr>
        <tr>
          <td class="bg-label">Fase</td>
          <td>${wordFase}</td>
          <td class="bg-label">Kelas</td>
          <td>${wordKelas}</td>
        </tr>
        <tr>
          <td class="bg-label">Alokasi Waktu</td>
          <td>${identitas.alokasiWaktu || '-'}</td>
          <td class="bg-label">Semester / Tahun</td>
          <td>${identitas.semesterTahun || '-'}</td>
        </tr>
      </table>

      <!-- Section I -->
      <div class="section-header">I. IDENTIFIKASI DAN ANALISIS KEBUTUHAN BELAJAR</div>
      <table class="grid-table">
        <tr>
          <td class="bg-label" width="50%">A. Karakteristik & Kebutuhan Murid</td>
          <td class="bg-label" width="50%">B. Karakteristik Materi Pembelajaran</td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc;">${(analisisAwal.karakteristikMurid || '').replace(/\n/g, '<br/>')}</td>
          <td style="background-color: #f8fafc;">${(analisisAwal.karakteristikMateri || '').replace(/\n/g, '<br/>')}</td>
        </tr>
      </table>

      <!-- Section II -->
      <div class="section-header">II. CAPAIAN, TUJUAN PEMBELAJARAN, & DIMENSI PROFIL LULUSAN (DPL)</div>
      <table class="grid-table">
        <tr>
          <td class="bg-label" width="25%">A. Capaian Pembelajaran (CP)</td>
          <td width="75%">${tujuanDanDpl.capaianPembelajaran}</td>
        </tr>
        <tr>
          <td class="bg-label">B. Lingkup Materi / Topik</td>
          <td><strong>${tujuanDanDpl.lingkupMateri}</strong></td>
        </tr>
        <tr>
          <td class="bg-label">C. Tujuan Pembelajaran (TP)</td>
          <td>${(tujuanDanDpl.tujuanPembelajaran || '').replace(/\n/g, '<br/>')}</td>
        </tr>
        ${
          tujuanDanDpl.indikatorKetercapaian && tujuanDanDpl.indikatorKetercapaian.length > 0
            ? `
        <tr>
          <td class="bg-label">D. Indikator Ketercapaian (IKTP)</td>
          <td>
            <ul style="margin: 0; padding-left: 18px;">
              ${tujuanDanDpl.indikatorKetercapaian.map((ik) => `<li>${ik}</li>`).join('')}
            </ul>
          </td>
        </tr>`
            : ''
        }
        <tr>
          <td class="bg-label">E. Dimensi Profil Lulusan (DPL)</td>
          <td>
            ${(tujuanDanDpl.dimensiProfilLulusan || []).map((dpl) => `<span class="badge-dpl">✔ ${dpl}</span>`).join(' ')}
          </td>
        </tr>
      </table>

      <!-- Section III -->
      <div class="section-header">III. DESAIN PEMBELAJARAN MENDALAM & KEMITRAAN DIGITAL</div>
      <table class="grid-table">
        <tr>
          <td class="bg-label" width="20%">Model & Metode Pembelajaran</td>
          <td class="bg-label" width="20%">Kemitraan Pembelajaran</td>
          <td class="bg-label" width="20%">Pemanfaatan Digital & Alat</td>
          <td class="bg-label" width="20%">Lintas Disiplin Ilmu</td>
          <td class="bg-label" width="20%">Lingkungan Pembelajaran</td>
        </tr>
        <tr>
          <td>
            <ul style="margin: 0; padding-left: 18px;">
              ${(desainPembelajaran.modelDanMetode || []).map((m) => `<li>${m}</li>`).join('')}
            </ul>
          </td>
          <td>
            <ul style="margin: 0; padding-left: 18px;">
              ${(desainPembelajaran.kemitraanPembelajaran || []).map((k) => `<li>${k}</li>`).join('')}
            </ul>
          </td>
          <td>
            <ul style="margin: 0; padding-left: 18px;">
              ${(desainPembelajaran.pemanfaatanDigital || []).map((d) => `<li>${d}</li>`).join('')}
            </ul>
          </td>
          <td>
            <ul style="margin: 0; padding-left: 18px;">
              ${(desainPembelajaran.lintasDisiplin || []).length > 0
                ? (desainPembelajaran.lintasDisiplin || []).map((ld) => `<li>${ld}</li>`).join('')
                : '<li>(Tidak ada)</li>'}
            </ul>
          </td>
          <td>
            <ul style="margin: 0; padding-left: 18px;">
              ${(desainPembelajaran.lingkunganPembelajaran || []).length > 0
                ? (desainPembelajaran.lingkunganPembelajaran || []).map((lp) => `<li>${lp}</li>`).join('')
                : '<li>(Tidak ada)</li>'}
            </ul>
          </td>
        </tr>
      </table>

      <!-- Section IV -->
      <div class="section-header">IV. ALUR KEGIATAN PEMBELAJARAN MENDALAM (DEEP LEARNING)</div>
      
      <!-- Pendahuluan -->
      <table class="grid-table" style="margin-bottom: 16px;">
        <tr>
          <td class="bg-label" style="background-color: #e2e8f0; color: #0f172a;">
            PENDAHULUAN (Alokasi Waktu: ${kegiatanPembelajaran.pendahuluan.alokasiWaktu})
          </td>
        </tr>
        <tr>
          <td>
            <ul style="margin: 0; padding-left: 18px;">
              ${(kegiatanPembelajaran.pendahuluan.aktivitas || []).map((act) => `<li style="margin-bottom: 3px;">${act}</li>`).join('')}
            </ul>
          </td>
        </tr>
      </table>

      <!-- Kegiatan Inti -->
      ${(kegiatanPembelajaran.kegiatanInti || [])
        .map((stage) => {
          const isMemahami = stage.tahapLabel.toUpperCase().includes('MEMAHAMI');
          const isMengaplikasi = stage.tahapLabel.toUpperCase().includes('MENGAPLIKASI');

          let badgeClass = 'badge-merefleksi';
          let stageBgColor = '#faf5ff';
          let stageBorderColor = '#7c3aed';

          if (isMemahami) {
            badgeClass = 'badge-memahami';
            stageBgColor = '#eff6ff';
            stageBorderColor = '#2563eb';
          } else if (isMengaplikasi) {
            badgeClass = 'badge-mengaplikasi';
            stageBgColor = '#ecfdf5';
            stageBorderColor = '#059669';
          }

          return `
        <table class="grid-table" style="margin-bottom: 16px; border-left: 5px solid ${stageBorderColor};">
          <tr style="background-color: ${stageBgColor};">
            <td colspan="2" style="padding: 8px 10px;">
              <div>
                <span class="${badgeClass}">[${stage.tahapLabel}]</span>
                <strong style="font-size: 10.5pt; color: #0f172a; margin-left: 6px;">${stage.subJudul}</strong>
                <span style="float: right; font-size: 9pt; font-weight: bold; color: #475569;">(${stage.alokasiWaktu})</span>
              </div>
              <div class="prinsip-tag">✨ Prinsip Pembelajaran Mendalam: ${stage.prinsipMendalamLabel}</div>
            </td>
          </tr>
          <tr>
            <td width="50%" style="background-color: #ffffff; padding: 8px 10px;">
              <div class="activity-title-guru">👥 Aktivitas Guru:</div>
              ${formatListItemsForWord(stage.aktivitasGuru)}
            </td>
            <td width="50%" style="background-color: #ffffff; padding: 8px 10px;">
              <div class="activity-title-murid">📖 Aktivitas Murid:</div>
              ${formatListItemsForWord(stage.aktivitasMurid)}
            </td>
          </tr>
          ${
            stage.poinUtama && stage.poinUtama.length > 0
              ? `
          <tr style="background-color: #f8fafc;">
            <td colspan="2" style="font-size: 8.5pt; color: #475569;">
              <strong>Langkah Kunci:</strong> ${stage.poinUtama.join(' • ')}
            </td>
          </tr>`
              : ''
          }
        </table>
        `;
        })
        .join('')}

      <!-- Penutup -->
      <table class="grid-table" style="margin-bottom: 16px;">
        <tr>
          <td class="bg-label" style="background-color: #e2e8f0; color: #0f172a;">
            PENUTUP & TIE-UP (Alokasi Waktu: ${kegiatanPembelajaran.penutup.alokasiWaktu})
          </td>
        </tr>
        <tr>
          <td>
            <ul style="margin: 0; padding-left: 18px;">
              ${(kegiatanPembelajaran.penutup.aktivitas || []).map((act) => `<li style="margin-bottom: 3px;">${act}</li>`).join('')}
            </ul>
          </td>
        </tr>
      </table>

      <!-- Section V -->
      <div class="section-header">V. ASESMEN & PENILAIAN PEMBELAJARAN</div>
      <table class="grid-table" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <thead>
          <tr style="background-color: #0f766e; color: #ffffff;">
            <th width="22%" style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left; font-size: 11px;">Pendekatan Asesmen</th>
            <th width="26%" style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left; font-size: 11px;">Bentuk Penilaian</th>
            <th width="26%" style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left; font-size: 11px;">Teknik Penilaian</th>
            <th width="26%" style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left; font-size: 11px;">Instrumen Penilaian</th>
          </tr>
        </thead>
        <tbody>
          ${[
            { key: 'assessmentAsLearning', label: 'Assessment as Learning', desc: '(Asesmen saat pembelajaran - Refleksi & Evaluasi Diri)' },
            { key: 'assessmentForLearning', label: 'Assessment for Learning', desc: '(Asesmen selama proses - Umpan Balik Guru)' },
            { key: 'assessmentOfLearning', label: 'Assessment of Learning', desc: '(Asesmen akhir - Ketercapaian Hasil Belajar)' },
          ].map(({ key, label, desc }) => {
            const list = normAsesmen[key as keyof typeof normAsesmen];
            return list.map((item, idx) => `
              <tr>
                ${idx === 0 ? `<td rowspan="${list.length}" style="padding: 6px; border: 1px solid #cbd5e1; background-color: #f8fafc; vertical-align: top; font-size: 11px;">
                  <strong style="color: #0f766e;">${label}</strong><br/>
                  <span style="font-size: 9px; color: #64748b;">${desc}</span>
                </td>` : ''}
                <td style="padding: 6px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 11px;">${item.bentukPenilaian}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 11px;">${item.teknikPenilaian}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 11px;">${item.instrumenPenilaian}</td>
              </tr>
            `).join('');
          }).join('')}
        </tbody>
      </table>

      <!-- Section VI -->
      <div class="section-header">VI. PROGRAM REMEDIAL DAN PENGAYAAN</div>
      <table class="grid-table">
        <tr>
          <td class="bg-label" width="50%" style="color: #92400e; background-color: #fef3c7;">Program Remedial (Pendampingan)</td>
          <td class="bg-label" width="50%" style="color: #0f766e; background-color: #ccfbf1;">Program Pengayaan (Tantangan HOTS)</td>
        </tr>
        <tr>
          <td>${remedialDanPengayaan.remedial}</td>
          <td>${remedialDanPengayaan.pengayaan}</td>
        </tr>
      </table>

      <!-- Section VII -->
      <div class="section-header">VII. LAMPIRAN (LKPD, BAHAN AJAR, RUBRIK PENILAIAN, & KKTP)</div>
      <table class="grid-table">
        <tr>
          <td class="bg-label">A. Ringkasan Lembar Kerja Peserta Didik (LKPD)</td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc;">${(lampiran.lkpd || '').replace(/\n/g, '<br/>')}</td>
        </tr>
        <tr>
          <td class="bg-label">B. Rangkuman Bahan Bacaan Guru & Siswa</td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc;">${(lampiran.bahanAjar || '').replace(/\n/g, '<br/>')}</td>
        </tr>
        <tr>
          <td class="bg-label">C. Rubrik Penilaian</td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc;">${(lampiran.rubrikPenilaian || '').replace(/\n/g, '<br/>')}</td>
        </tr>
      </table>

      ${
        lampiran.kktp
          ? typeof lampiran.kktp === 'string'
            ? `<table class="grid-table">
                <tr><td class="bg-label">D. Kriteria Ketuntasan Tujuan Pembelajaran (KKTP)</td></tr>
                <tr><td style="background-color: #f8fafc;">${lampiran.kktp.replace(/\n/g, '<br/>')}</td></tr>
               </table>`
            : `
              <div style="margin-top: 14px; font-weight: bold; font-size: 11pt; color: #0f766e;">
                D. KRITERIA KETUNTASAN TUJUAN PEMBELAJARAN (KKTP)
              </div>
              <p style="font-size: 9pt; color: #475569; margin: 4px 0 8px 0;">
                <strong>Pendekatan:</strong> ${lampiran.kktp.pendekatan || 'Rubrik Interval Nilai'}<br/>
                <em>${lampiran.kktp.deskripsi || ''}</em>
              </p>

              <table class="grid-table">
                <thead>
                  <tr style="background-color: #0f766e; color: #ffffff;">
                    <th width="24%">Aspek / Indikator TP</th>
                    <th width="19%">Perlu Bimbingan<br/>(0 - 60%)</th>
                    <th width="19%">Cukup<br/>(61 - 70%)</th>
                    <th width="19%">Layak<br/>(71 - 80%)</th>
                    <th width="19%">Mahir<br/>(81 - 100%)</th>
                  </tr>
                </thead>
                <tbody>
                  ${(lampiran.kktp.kriteria || [])
                    .map(
                      (k) => `
                    <tr>
                      <td style="font-weight: bold; background-color: #f8fafc;">${k.aspekPenilaian}</td>
                      <td style="background-color: #fef2f2; font-size: 8.5pt;">${k.perluBimbingan}</td>
                      <td style="background-color: #fffbe3; font-size: 8.5pt;">${k.cukup}</td>
                      <td style="background-color: #f0fdf4; font-size: 8.5pt;">${k.layak}</td>
                      <td style="background-color: #eff6ff; font-size: 8.5pt;">${k.mahir}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>

              ${
                lampiran.kktp.tindakLanjut
                  ? `
                <table class="grid-table" style="margin-top: 8px;">
                  <tr style="background-color: #f1f5f9; font-weight: bold;">
                    <td colspan="4">Rencana Tindak Lanjut Hasil Asesmen KKTP</td>
                  </tr>
                  <tr>
                    <td width="25%" style="font-size: 8.5pt; background-color: #fef2f2;"><strong>Perlu Bimbingan:</strong><br/>${lampiran.kktp.tindakLanjut.perluBimbingan}</td>
                    <td width="25%" style="font-size: 8.5pt; background-color: #fffbe3;"><strong>Cukup:</strong><br/>${lampiran.kktp.tindakLanjut.cukup}</td>
                    <td width="25%" style="font-size: 8.5pt; background-color: #f0fdf4;"><strong>Layak:</strong><br/>${lampiran.kktp.tindakLanjut.layak}</td>
                    <td width="25%" style="font-size: 8.5pt; background-color: #eff6ff;"><strong>Mahir:</strong><br/>${lampiran.kktp.tindakLanjut.mahir}</td>
                  </tr>
                </table>
                `
                  : ''
              }
            `
          : ''
      }

      <!-- Signatures -->
      <table width="100%" style="margin-top: 36px; border-collapse: collapse; text-align: center; font-size: 9.5pt;">
        <tr>
          <td width="50%" style="vertical-align: top;">
            <p style="margin-bottom: 4px;">Mengetahui,</p>
            <p style="font-weight: bold;">Kepala Sekolah ${identitas.namaSekolah}</p>
            <div style="height: 55px;"></div>
            <p style="font-weight: bold; text-decoration: underline;">${identitas.namaKepsek || '_________________________'}</p>
            <p style="font-size: 8.5pt; color: #475569;">NIP. ${identitas.nipKepsek || '...........................................'}</p>
          </td>
          <td width="50%" style="vertical-align: top;">
            <p style="margin-bottom: 4px;">Disahkan di Sekolah, ......................... 2026</p>
            <p style="font-weight: bold;">Guru</p>
            <div style="height: 55px;"></div>
            <p style="font-weight: bold; text-decoration: underline;">${identitas.namaGuru || '_________________________'}</p>
            <p style="font-size: 8.5pt; color: #475569;">NIP. ${identitas.nipGuru || '...........................................'}</p>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
  };

  // Print function (PDF / Cetak) with multi-fallback for iframe compatibility
  const handlePrint = () => {
    const activePlan = isEditing ? editedPlan : plan;
    const fullHtml = buildWordDocumentHtml(activePlan);

    // Strategy 1: Open a clean popup window for printing
    try {
      const printWin = window.open('', '_blank', 'width=950,height=850');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(fullHtml);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (err) {
            console.warn('Popup print error:', err);
          }
        }, 350);
        return;
      }
    } catch (e) {
      console.warn('Window open blocked or failed, attempting iframe print:', e);
    }

    // Strategy 2: Create hidden print iframe in current document
    try {
      let existingIframe = document.getElementById('rpm-print-frame') as HTMLIFrameElement | null;
      if (existingIframe && existingIframe.parentNode) {
        existingIframe.parentNode.removeChild(existingIframe);
      }

      const printIframe = document.createElement('iframe');
      printIframe.id = 'rpm-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0px';
      printIframe.style.height = '0px';
      printIframe.style.border = '0px';
      printIframe.style.opacity = '0';
      printIframe.style.pointerEvents = 'none';
      document.body.appendChild(printIframe);

      const frameDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(fullHtml);
        frameDoc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print failed, falling back to window.print():', e);
            window.print();
          }
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 2000);
        }, 350);
        return;
      }
    } catch (err) {
      console.warn('Print iframe error:', err);
    }

    // Strategy 3: Standard window.print() fallback
    window.print();
  };

  // Download DOC Word function
  const handleDownloadWord = () => {
    const activePlan = isEditing ? editedPlan : plan;
    const wordHtml = buildWordDocumentHtml(activePlan);
    const blob = new Blob(['\ufeff', wordHtml], {
      type: 'application/msword',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RPM_${activePlan.identitas.mataPelajaran.replace(/\s+/g, '_')}_${activePlan.identitas.faseKelas.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy Markdown/Text function
  const handleCopyText = () => {
    const activePlan = isEditing ? editedPlan : plan;
    const { fase, kelas } = parseFaseAndKelas(activePlan.identitas.faseKelas);
    const text = `
DOKUMEN RENCANA PEMBELAJARAN MENDALAM (RPM)
===========================================
Nama Sekolah    : ${activePlan.identitas.namaSekolah}
Mata Pelajaran  : ${activePlan.identitas.mataPelajaran}
Nama Guru       : ${activePlan.identitas.namaGuru}
NIP Guru        : ${activePlan.identitas.nipGuru || '-'}
Fase            : ${fase}
Kelas           : ${kelas}
Alokasi Waktu   : ${activePlan.identitas.alokasiWaktu}
Semester / TA   : ${activePlan.identitas.semesterTahun}

CAPAIAN PEMBELAJARAN (CP):
${activePlan.tujuanDanDpl.capaianPembelajaran}

TUJUAN PEMBELAJARAN (TP):
${activePlan.tujuanDanDpl.tujuanPembelajaran}

KEGIATAN INTI PEMBELAJARAN MENDALAM:
${activePlan.kegiatanPembelajaran.kegiatanInti
  .map(
    (k) => `
[${k.tahapLabel}] ${k.subJudul} (${k.alokasiWaktu})
Prinsip Pembelajaran Mendalam: ${k.prinsipMendalamLabel}
Aktivitas Guru:
${formatActivityText(k.aktivitasGuru)}

Aktivitas Murid:
${formatActivityText(k.aktivitasMurid)}
`
  )
  .join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePlan = isEditing ? editedPlan : plan;

  return (
    <div id="view-lesson-plan" className="space-y-6">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-200 stroke-[3]" />
          <span>Perubahan RPM berhasil disimpan!</span>
        </div>
      )}

      {/* Top Action Bar (Hidden on Print) */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-form"
            onClick={onBackToForm}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali Edit Form</span>
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-teal-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              {isEditing ? 'Mode Edit RPM Aktif' : 'Dokumen RPM Berhasil Dihasilkan!'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing
                ? 'Semua isian dapat diubah langsung di bawah. Klik Simpan Hasil Edit setelah selesai.'
                : 'Format Rencana Pembelajaran Mendalam dengan label Memahami, Mengaplikasi, & Merefleksi'}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-toggle-edit-mode"
            onClick={() => {
              if (isEditing) {
                handleSaveEdits();
              } else {
                setIsEditing(true);
              }
            }}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isEditing
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                <span>Simpan Hasil Edit</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Edit RPM Langsung</span>
              </>
            )}
          </button>

          <button
            id="btn-refine-ai"
            onClick={onOpenRefiner}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Revisi dengan AI</span>
          </button>

          <button
            id="btn-open-lkpd-modal"
            onClick={() => {
              setIsLkpdModalOpen(true);
              if (!activePlan.lampiran.lkpdStructured) {
                handleGenerateLKPD();
              }
            }}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-800 hover:bg-teal-900 text-white shadow-sm transition-all cursor-pointer ring-1 ring-teal-500/50"
            title="Buka atau buat LKPD lengkap (Lembar Penugasan, Praktikum, Latihan Soal & Kunci Jawaban)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>LKPD AI & Soal</span>
          </button>

          <button
            id="btn-open-jurnal-modal"
            onClick={() => setIsJurnalModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm transition-all cursor-pointer ring-1 ring-emerald-500/50"
            title="Buka, edit, dan cetak Jurnal Harian Guru & Catatan Pelaksanaan"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>Jurnal Harian Guru</span>
          </button>

          <button
            id="btn-save-plan"
            onClick={onSavePlan}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              isSaved
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5 text-teal-400" />}
            <span>{isSaved ? 'Tersimpan' : 'Simpan RPM'}</span>
          </button>

          <button
            id="btn-download-word"
            onClick={handleDownloadWord}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
            title="Unduh format dokumen Word (.doc)"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Unduh Word (.doc)</span>
          </button>

          <button
            id="btn-print-pdf"
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-white text-slate-900 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Cetak / PDF</span>
          </button>

          <button
            id="btn-copy-text"
            onClick={handleCopyText}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Salin Teks / Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* EDIT MODE BANNER */}
      {isEditing && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-950 print:hidden animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-amber-950">Mode Edit RPM Aktif</h4>
              <p className="text-amber-800">
                Ubah teks, alur pembelajaran, maupun tabel KKTP di bawah ini. Klik <strong>Simpan Perubahan</strong> setelah selesai.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCancelEdits}
              type="button"
              className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
            <button
              onClick={handleSaveEdits}
              type="button"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Printable Document Container */}
      <div
        id="printable-rpm-document"
        className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10 max-w-5xl mx-auto print:shadow-none print:p-0 print:border-none print:max-w-none print:m-0"
      >
        {/* Document Header Banner */}
        <div className="border-b-2 border-teal-800 pb-4 mb-6 text-center">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            RENCANA PEMBELAJARAN MENDALAM (RPM)
          </h1>
          <p className="text-sm font-bold text-teal-800 mt-0.5">
            MODUL AJAR KURIKULUM MERDEKA - BERBASIS DEEP LEARNING FRAMEWORK
          </p>
          {isEditing ? (
            <input
              type="text"
              className="mt-2 w-full max-w-md mx-auto text-center font-semibold text-xs border border-amber-400 bg-amber-50 rounded p-1 text-slate-900"
              value={editedPlan.identitas.namaSekolah}
              onChange={(e) => updateIdentitas('namaSekolah', e.target.value)}
              placeholder="Nama Sekolah..."
            />
          ) : (
            <p className="text-xs text-slate-600 mt-1 italic">
              {activePlan.identitas.namaSekolah || 'SATUAN PENDIDIKAN'}
            </p>
          )}
        </div>

        {/* IDENTITAS DOKUMEN TABLE */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse border border-slate-300">
            <tbody>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-2 font-bold w-1/4">Nama Sekolah</td>
                <td className="border border-slate-300 p-2 w-1/4">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-amber-50 border border-amber-300 rounded p-1 font-medium text-xs"
                      value={editedPlan.identitas.namaSekolah}
                      onChange={(e) => updateIdentitas('namaSekolah', e.target.value)}
                    />
                  ) : (
                    activePlan.identitas.namaSekolah
                  )}
                </td>
                <td className="border border-slate-300 p-2 font-bold w-1/4">Mata Pelajaran</td>
                <td className="border border-slate-300 p-2 w-1/4">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-amber-50 border border-amber-300 rounded p-1 font-medium text-xs"
                      value={editedPlan.identitas.mataPelajaran}
                      onChange={(e) => updateIdentitas('mataPelajaran', e.target.value)}
                    />
                  ) : (
                    activePlan.identitas.mataPelajaran
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Nama Guru</td>
                <td className="border border-slate-300 p-2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-amber-50 border border-amber-300 rounded p-1 font-medium text-xs"
                      value={editedPlan.identitas.namaGuru}
                      onChange={(e) => updateIdentitas('namaGuru', e.target.value)}
                      placeholder="Nama Guru"
                    />
                  ) : (
                    activePlan.identitas.namaGuru
                  )}
                </td>
                <td className="border border-slate-300 p-2 font-bold">NIP Guru</td>
                <td className="border border-slate-300 p-2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-amber-50 border border-amber-300 rounded p-1 font-medium text-xs"
                      value={editedPlan.identitas.nipGuru}
                      onChange={(e) => updateIdentitas('nipGuru', e.target.value)}
                      placeholder="NIP Guru"
                    />
                  ) : (
                    activePlan.identitas.nipGuru || '-'
                  )}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-2 font-bold">Fase</td>
                <td className="border border-slate-300 p-2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-amber-50 border border-amber-300 rounded p-1 font-medium text-xs"
                      value={parseFaseAndKelas(editedPlan.identitas.faseKelas).fase}
                      onChange={(e) => {
                        const currentKelas = parseFaseAndKelas(editedPlan.identitas.faseKelas).kelas;
                        updateIdentitas('faseKelas', `${e.target.value}${currentKelas !== '-' ? ` - ${currentKelas}` : ''}`);
                      }}
                      placeholder="Fase"
                    />
                  ) : (
                    parseFaseAndKelas(activePlan.identitas.faseKelas).fase
                  )}
                </td>
                <td className="border border-slate-300 p-2 font-bold">Kelas</td>
                <td className="border border-slate-300 p-2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-amber-50 border border-amber-300 rounded p-1 font-medium text-xs"
                      value={parseFaseAndKelas(editedPlan.identitas.faseKelas).kelas !== '-' ? parseFaseAndKelas(editedPlan.identitas.faseKelas).kelas : ''}
                      onChange={(e) => {
                        const currentFase = parseFaseAndKelas(editedPlan.identitas.faseKelas).fase;
                        updateIdentitas('faseKelas', `${currentFase} - ${e.target.value}`);
                      }}
                      placeholder="Kelas"
                    />
                  ) : (
                    parseFaseAndKelas(activePlan.identitas.faseKelas).kelas
                  )}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Alokasi Waktu</td>
                <td className="border border-slate-300 p-2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-amber-50 border border-amber-300 rounded p-1 font-medium text-xs"
                      value={editedPlan.identitas.alokasiWaktu}
                      onChange={(e) => updateIdentitas('alokasiWaktu', e.target.value)}
                    />
                  ) : (
                    activePlan.identitas.alokasiWaktu
                  )}
                </td>
                <td className="border border-slate-300 p-2 font-bold">Semester / Tahun</td>
                <td className="border border-slate-300 p-2">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full bg-amber-50 border border-amber-300 rounded p-1 font-medium text-xs"
                      value={editedPlan.identitas.semesterTahun}
                      onChange={(e) => updateIdentitas('semesterTahun', e.target.value)}
                    />
                  ) : (
                    activePlan.identitas.semesterTahun
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 1: IDENTIFIKASI KEBUTUHAN & ANALISIS */}
        <div className="mb-6">
          <h2 className="text-sm sm:text-base font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3 flex items-center gap-2">
            <span>I. IDENTIFIKASI DAN ANALISIS KEBUTUHAN BELAJAR</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                A. Karakteristik & Kebutuhan Murid
              </h3>
              {isEditing ? (
                <textarea
                  rows={4}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  value={editedPlan.analisisAwal.karakteristikMurid}
                  onChange={(e) => updateAnalisis('karakteristikMurid', e.target.value)}
                />
              ) : (
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {activePlan.analisisAwal.karakteristikMurid}
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                B. Karakteristik Materi Pembelajaran
              </h3>
              {isEditing ? (
                <textarea
                  rows={4}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  value={editedPlan.analisisAwal.karakteristikMateri}
                  onChange={(e) => updateAnalisis('karakteristikMateri', e.target.value)}
                />
              ) : (
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {activePlan.analisisAwal.karakteristikMateri}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: CAPAIAN, TUJUAN & PROFIL LULUSAN */}
        <div className="mb-6">
          <h2 className="text-sm sm:text-base font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3">
            II. CAPAIAN, TUJUAN PEMBELAJARAN, & DIMENSI PROFIL LULUSAN (DPL)
          </h2>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
              <span className="font-bold text-slate-900 block mb-1 text-xs uppercase tracking-wide text-teal-800">
                A. Capaian Pembelajaran (CP)
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs font-medium"
                  value={editedPlan.tujuanDanDpl.capaianPembelajaran}
                  onChange={(e) => updateTujuanDpl('capaianPembelajaran', e.target.value)}
                />
              ) : (
                <p className="text-slate-800 leading-relaxed">{activePlan.tujuanDanDpl.capaianPembelajaran}</p>
              )}
            </div>

            <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
              <span className="font-bold text-slate-900 block mb-1 text-xs uppercase tracking-wide text-teal-800">
                B. Lingkup Materi / Topik
              </span>
              {isEditing ? (
                <input
                  type="text"
                  className="w-full bg-amber-50 border border-amber-300 rounded p-1.5 font-bold text-xs"
                  value={editedPlan.tujuanDanDpl.lingkupMateri}
                  onChange={(e) => updateTujuanDpl('lingkupMateri', e.target.value)}
                />
              ) : (
                <p className="text-slate-800 font-semibold">{activePlan.tujuanDanDpl.lingkupMateri}</p>
              )}
            </div>

            <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
              <span className="font-bold text-slate-900 block mb-1 text-xs uppercase tracking-wide text-teal-800">
                C. Tujuan Pembelajaran (TP)
              </span>
              {isEditing ? (
                <textarea
                  rows={4}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs font-medium"
                  value={editedPlan.tujuanDanDpl.tujuanPembelajaran}
                  onChange={(e) => updateTujuanDpl('tujuanPembelajaran', e.target.value)}
                />
              ) : (
                <p className="text-slate-800 whitespace-pre-line leading-relaxed">{activePlan.tujuanDanDpl.tujuanPembelajaran}</p>
              )}
            </div>

            <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
              <span className="font-bold text-slate-900 block mb-1.5 text-xs uppercase tracking-wide text-teal-800">
                D. Indikator Ketercapaian Tujuan Pembelajaran (IKTP)
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  placeholder="Isi satu indikator per baris..."
                  value={(editedPlan.tujuanDanDpl.indikatorKetercapaian || []).join('\n')}
                  onChange={(e) =>
                    updateTujuanDpl(
                      'indikatorKetercapaian',
                      e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              ) : (
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {(activePlan.tujuanDanDpl.indikatorKetercapaian || []).map((ik, i) => (
                    <li key={i}>{ik}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
              <span className="font-bold text-slate-900 block mb-2 text-xs uppercase tracking-wide text-teal-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-teal-600" />
                E. Dimensi Profil Lulusan / DPL (Profil Pelajar Pancasila)
              </span>
              {isEditing ? (
                <textarea
                  rows={2}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  placeholder="Isi satu dimensi per baris..."
                  value={editedPlan.tujuanDanDpl.dimensiProfilLulusan.join('\n')}
                  onChange={(e) =>
                    updateTujuanDpl(
                      'dimensiProfilLulusan',
                      e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activePlan.tujuanDanDpl.dimensiProfilLulusan.map((dpl, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-100 text-teal-900 border border-teal-300"
                    >
                      <Check className="w-3 h-3 text-teal-700" />
                      {dpl}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: DESAIN PEMBELAJARAN MENDALAM */}
        <div className="mb-6">
          <h2 className="text-sm sm:text-base font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3">
            III. DESAIN PEMBELAJARAN MENDALAM & KEMITRAAN DIGITAL
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs sm:text-sm">
            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
              <span className="font-bold text-slate-800 block mb-1.5 text-xs uppercase text-teal-800">
                Model & Metode Pembelajaran
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  placeholder="Isi satu per baris..."
                  value={editedPlan.desainPembelajaran.modelDanMetode.join('\n')}
                  onChange={(e) => updateDesain('modelDanMetode', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                />
              ) : (
                <ul className="space-y-1">
                  {activePlan.desainPembelajaran.modelDanMetode.map((m, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
              <span className="font-bold text-slate-800 block mb-1.5 text-xs uppercase text-teal-800">
                Kemitraan Pembelajaran
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  placeholder="Isi satu per baris..."
                  value={editedPlan.desainPembelajaran.kemitraanPembelajaran.join('\n')}
                  onChange={(e) => updateDesain('kemitraanPembelajaran', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                />
              ) : (
                <ul className="space-y-1">
                  {activePlan.desainPembelajaran.kemitraanPembelajaran.map((k, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
                      {k}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
              <span className="font-bold text-slate-800 block mb-1.5 text-xs uppercase text-teal-800">
                Pemanfaatan Digital & Alat
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  placeholder="Isi satu per baris..."
                  value={editedPlan.desainPembelajaran.pemanfaatanDigital.join('\n')}
                  onChange={(e) => updateDesain('pemanfaatanDigital', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                />
              ) : (
                <ul className="space-y-1">
                  {activePlan.desainPembelajaran.pemanfaatanDigital.map((d, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
              <span className="font-bold text-slate-800 block mb-1.5 text-xs uppercase text-teal-800">
                Lintas Disiplin Ilmu
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  placeholder="Isi satu per baris..."
                  value={(editedPlan.desainPembelajaran.lintasDisiplin || []).join('\n')}
                  onChange={(e) => updateDesain('lintasDisiplin', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                />
              ) : (
                <ul className="space-y-1">
                  {(activePlan.desainPembelajaran.lintasDisiplin || []).length > 0 ? (
                    (activePlan.desainPembelajaran.lintasDisiplin || []).map((ld, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                        {ld}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">Tidak dipilih</li>
                  )}
                </ul>
              )}
            </div>

            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
              <span className="font-bold text-slate-800 block mb-1.5 text-xs uppercase text-teal-800">
                Lingkungan Pembelajaran
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  placeholder="Isi satu per baris..."
                  value={(editedPlan.desainPembelajaran.lingkunganPembelajaran || []).join('\n')}
                  onChange={(e) => updateDesain('lingkunganPembelajaran', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                />
              ) : (
                <ul className="space-y-1">
                  {(activePlan.desainPembelajaran.lingkunganPembelajaran || []).length > 0 ? (
                    (activePlan.desainPembelajaran.lingkunganPembelajaran || []).map((lp, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                        {lp}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">Tidak dipilih</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: KEGIATAN PEMBELAJARAN MENDALAM (DEEP LEARNING CORE) */}
        <div className="mb-6">
          <h2 className="text-sm sm:text-base font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-4 flex items-center justify-between">
            <span>IV. ALUR KEGIATAN PEMBELAJARAN MENDALAM</span>
            <span className="text-xs bg-teal-900 text-teal-200 px-2.5 py-0.5 rounded-md font-normal border border-teal-700">
              Label: Memahami, Mengaplikasi, Merefleksi
            </span>
          </h2>

          <div className="space-y-5">
            {/* A. PENDAHULUAN */}
            <div className="border-l-4 border-slate-400 pl-4 py-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-xs font-bold">
                    PENDAHULUAN
                  </span>
                  {!isEditing && (
                    <span className="text-xs text-slate-500 font-normal">
                      (Alokasi Waktu: {activePlan.kegiatanPembelajaran.pendahuluan.alokasiWaktu})
                    </span>
                  )}
                </h3>
                {isEditing && (
                  <input
                    type="text"
                    className="bg-amber-50 border border-amber-300 rounded px-2 py-0.5 text-xs font-semibold"
                    placeholder="Alokasi Waktu..."
                    value={editedPlan.kegiatanPembelajaran.pendahuluan.alokasiWaktu}
                    onChange={(e) =>
                      setEditedPlan((prev) => ({
                        ...prev,
                        kegiatanPembelajaran: {
                          ...prev.kegiatanPembelajaran,
                          pendahuluan: {
                            ...prev.kegiatanPembelajaran.pendahuluan,
                            alokasiWaktu: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                )}
              </div>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  placeholder="Isi satu langkah per baris..."
                  value={editedPlan.kegiatanPembelajaran.pendahuluan.aktivitas.join('\n')}
                  onChange={(e) =>
                    setEditedPlan((prev) => ({
                      ...prev,
                      kegiatanPembelajaran: {
                        ...prev.kegiatanPembelajaran,
                        pendahuluan: {
                          ...prev.kegiatanPembelajaran.pendahuluan,
                          aktivitas: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                        },
                      },
                    }))
                  }
                />
              ) : (
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-700">
                  {activePlan.kegiatanPembelajaran.pendahuluan.aktivitas.map((act, i) => (
                    <li key={i} className="leading-relaxed">{act}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* B. KEGIATAN INTI PEMBELAJARAN MENDALAM (3 TAHAP) */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider text-teal-900 border-b border-teal-200 pb-1">
                KEGIATAN INTI PEMBELAJARAN MENDALAM (DEEP LEARNING)
              </h3>

              {activePlan.kegiatanPembelajaran.kegiatanInti.map((stage, idx) => {
                const isMemahami = stage.tahapLabel.toUpperCase().includes('MEMAHAMI');
                const isMengaplikasi = stage.tahapLabel.toUpperCase().includes('MENGAPLIKASI');

                let borderStyle = 'border-purple-500 bg-purple-50/30';
                let badgeStyle = 'bg-purple-600 text-white';
                let tagBg = 'bg-purple-100 text-purple-900 border-purple-300';

                if (isMemahami) {
                  borderStyle = 'border-blue-500 bg-blue-50/30';
                  badgeStyle = 'bg-blue-600 text-white';
                  tagBg = 'bg-blue-100 text-blue-900 border-blue-300';
                } else if (isMengaplikasi) {
                  borderStyle = 'border-emerald-500 bg-emerald-50/30';
                  badgeStyle = 'bg-emerald-600 text-white';
                  tagBg = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                }

                return (
                  <div
                    key={idx}
                    className={`border-l-4 ${borderStyle} rounded-r-2xl p-4 shadow-2xs border-t border-r border-b border-slate-200`}
                  >
                    {/* Stage Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${badgeStyle}`}>
                          [{stage.tahapLabel}]
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            className="flex-1 bg-amber-50 border border-amber-300 rounded p-1 font-bold text-xs"
                            value={editedPlan.kegiatanPembelajaran.kegiatanInti[idx]?.subJudul || stage.subJudul}
                            onChange={(e) => updateKegiatanIntiStage(idx, 'subJudul', e.target.value)}
                          />
                        ) : (
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                            {stage.subJudul}
                          </h4>
                        )}
                      </div>

                      {isEditing ? (
                        <input
                          type="text"
                          className="bg-amber-50 border border-amber-300 rounded p-1 text-xs font-semibold w-28"
                          value={editedPlan.kegiatanPembelajaran.kegiatanInti[idx]?.alokasiWaktu || stage.alokasiWaktu}
                          onChange={(e) => updateKegiatanIntiStage(idx, 'alokasiWaktu', e.target.value)}
                        />
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-300 px-2.5 py-0.5 rounded-full">
                          {stage.alokasiWaktu}
                        </span>
                      )}
                    </div>

                    {/* PRINSIP PEMBELAJARAN MENDALAM LABEL */}
                    <div className="mb-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">Prinsip Mendalam:</span>
                          <input
                            type="text"
                            className="flex-1 bg-amber-50 border border-amber-300 rounded p-1 text-xs font-bold"
                            value={editedPlan.kegiatanPembelajaran.kegiatanInti[idx]?.prinsipMendalamLabel || stage.prinsipMendalamLabel}
                            onChange={(e) => updateKegiatanIntiStage(idx, 'prinsipMendalamLabel', e.target.value)}
                          />
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${tagBg}`}>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Prinsip Pembelajaran Mendalam: {stage.prinsipMendalamLabel}</span>
                        </span>
                      )}
                    </div>

                    {/* Guru & Murid Activity Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs sm:text-sm">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                        <span className="font-bold text-slate-800 block mb-1.5 text-xs text-teal-800 uppercase tracking-wide flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          Aktivitas Guru
                        </span>
                        {isEditing ? (
                          <textarea
                            rows={5}
                            className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                            value={formatActivityText(editedPlan.kegiatanPembelajaran.kegiatanInti[idx]?.aktivitasGuru || stage.aktivitasGuru)}
                            onChange={(e) =>
                              updateKegiatanIntiStage(
                                idx,
                                'aktivitasGuru',
                                e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                              )
                            }
                          />
                        ) : (
                          renderActivityList(stage.aktivitasGuru, 'teal')
                        )}
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                        <span className="font-bold text-slate-800 block mb-1.5 text-xs text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                          Aktivitas Murid
                        </span>
                        {isEditing ? (
                          <textarea
                            rows={5}
                            className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                            value={formatActivityText(editedPlan.kegiatanPembelajaran.kegiatanInti[idx]?.aktivitasMurid || stage.aktivitasMurid)}
                            onChange={(e) =>
                              updateKegiatanIntiStage(
                                idx,
                                'aktivitasMurid',
                                e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                              )
                            }
                          />
                        ) : (
                          renderActivityList(stage.aktivitasMurid, 'emerald')
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* C. PENUTUP */}
            <div className="border-l-4 border-slate-400 pl-4 py-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-xs font-bold">
                    PENUTUP & TIE-UP
                  </span>
                  {!isEditing && (
                    <span className="text-xs text-slate-500 font-normal">
                      (Alokasi Waktu: {activePlan.kegiatanPembelajaran.penutup.alokasiWaktu})
                    </span>
                  )}
                </h3>
                {isEditing && (
                  <input
                    type="text"
                    className="bg-amber-50 border border-amber-300 rounded px-2 py-0.5 text-xs font-semibold"
                    placeholder="Alokasi Waktu..."
                    value={editedPlan.kegiatanPembelajaran.penutup.alokasiWaktu}
                    onChange={(e) =>
                      setEditedPlan((prev) => ({
                        ...prev,
                        kegiatanPembelajaran: {
                          ...prev.kegiatanPembelajaran,
                          penutup: {
                            ...prev.kegiatanPembelajaran.penutup,
                            alokasiWaktu: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                )}
              </div>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  placeholder="Isi satu langkah per baris..."
                  value={editedPlan.kegiatanPembelajaran.penutup.aktivitas.join('\n')}
                  onChange={(e) =>
                    setEditedPlan((prev) => ({
                      ...prev,
                      kegiatanPembelajaran: {
                        ...prev.kegiatanPembelajaran,
                        penutup: {
                          ...prev.kegiatanPembelajaran.penutup,
                          aktivitas: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                        },
                      },
                    }))
                  }
                />
              ) : (
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-slate-700">
                  {activePlan.kegiatanPembelajaran.penutup.aktivitas.map((act, i) => (
                    <li key={i} className="leading-relaxed">{act}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: ASESMEN & PENILAIAN */}
        <div className="mb-6">
          <h2 className="text-sm sm:text-base font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
            <span>V. ASESMEN & PENILAIAN PEMBELAJARAN</span>
          </h2>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-teal-700 text-white font-semibold">
                  <th className="p-3 border-b border-teal-800 w-1/4 min-w-[160px]">Pendekatan Asesmen</th>
                  <th className="p-3 border-b border-teal-800 w-1/4 min-w-[180px]">Bentuk Penilaian</th>
                  <th className="p-3 border-b border-teal-800 w-1/4 min-w-[180px]">Teknik Penilaian</th>
                  <th className="p-3 border-b border-teal-800 w-1/4 min-w-[200px]">Instrumen Penilaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {[
                  {
                    key: 'assessmentAsLearning' as const,
                    title: 'Assessment as Learning',
                    badge: 'Refleksi Diri / Antarteman',
                    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
                    desc: 'Asesmen saat pembelajaran berlangsung untuk refleksi & evaluasi diri murid'
                  },
                  {
                    key: 'assessmentForLearning' as const,
                    title: 'Assessment for Learning',
                    badge: 'Proses Pembelajaran',
                    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
                    desc: 'Asesmen selama proses pembelajaran untuk umpan balik & perbaikan guru'
                  },
                  {
                    key: 'assessmentOfLearning' as const,
                    title: 'Assessment of Learning',
                    badge: 'Hasil Belajar (Sumatif)',
                    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    desc: 'Asesmen pada akhir pembelajaran untuk mengukur ketercapaian hasil belajar'
                  },
                ].map((cat) => {
                  const items = isEditing
                    ? normalizeAsesmen(editedPlan.asesmen)[cat.key]
                    : normalizeAsesmen(activePlan.asesmen)[cat.key];

                  return items.map((item, idx) => (
                    <tr key={`${cat.key}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      {idx === 0 && (
                        <td
                          rowSpan={items.length}
                          className="p-3 bg-slate-50 font-medium align-top border-r border-slate-200"
                        >
                          <div className="font-bold text-teal-900 text-xs sm:text-sm">{cat.title}</div>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${cat.badgeColor}`}>
                            {cat.badge}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1.5 leading-tight">{cat.desc}</p>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => addAsesmenItem(cat.key)}
                              className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-1 rounded-md transition-all"
                            >
                              <Plus size={12} /> Tambah Baris
                            </button>
                          )}
                        </td>
                      )}
                      
                      {/* Bentuk Penilaian */}
                      <td className="p-3 align-top border-r border-slate-200">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                            value={item.bentukPenilaian}
                            onChange={(e) => updateAsesmenItem(cat.key, idx, 'bentukPenilaian', e.target.value)}
                            placeholder="Contoh: Formatif (Penilaian Diri)"
                          />
                        ) : (
                          <span className="font-medium text-slate-800">{item.bentukPenilaian}</span>
                        )}
                      </td>

                      {/* Teknik Penilaian */}
                      <td className="p-3 align-top border-r border-slate-200">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                            value={item.teknikPenilaian}
                            onChange={(e) => updateAsesmenItem(cat.key, idx, 'teknikPenilaian', e.target.value)}
                            placeholder="Contoh: Self-Assessment & Peer Assessment"
                          />
                        ) : (
                          <span>{item.teknikPenilaian}</span>
                        )}
                      </td>

                      {/* Instrumen Penilaian */}
                      <td className="p-3 align-top relative group">
                        {isEditing ? (
                          <div className="flex items-start gap-1.5">
                            <textarea
                              rows={2}
                              className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                              value={item.instrumenPenilaian}
                              onChange={(e) => updateAsesmenItem(cat.key, idx, 'instrumenPenilaian', e.target.value)}
                              placeholder="Contoh: Lembar Refleksi Metakognitif & Rubrik Penilaian Antarteman"
                            />
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAsesmenItem(cat.key, idx)}
                                title="Hapus baris"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md transition-all shrink-0 mt-0.5"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span>{item.instrumenPenilaian}</span>
                        )}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 6: REMEDIAL & PENGAYAAN */}
        <div className="mb-6">
          <h2 className="text-sm sm:text-base font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3">
            VI. PROGRAM REMEDIAL DAN PENGAYAAN
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="border border-slate-200 p-3.5 rounded-xl bg-amber-50/40">
              <span className="font-bold text-slate-900 block mb-1 text-xs uppercase text-amber-800">
                Program Remedial (Pendampingan)
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  value={editedPlan.remedialDanPengayaan.remedial}
                  onChange={(e) => updateRemedial('remedial', e.target.value)}
                />
              ) : (
                <p className="text-slate-700 leading-relaxed">{activePlan.remedialDanPengayaan.remedial}</p>
              )}
            </div>

            <div className="border border-slate-200 p-3.5 rounded-xl bg-teal-50/40">
              <span className="font-bold text-slate-900 block mb-1 text-xs uppercase text-teal-800">
                Program Pengayaan (Tantangan HOTS)
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  value={editedPlan.remedialDanPengayaan.pengayaan}
                  onChange={(e) => updateRemedial('pengayaan', e.target.value)}
                />
              ) : (
                <p className="text-slate-700 leading-relaxed">{activePlan.remedialDanPengayaan.pengayaan}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 7: LAMPIRAN */}
        <div className="mb-8">
          <h2 className="text-sm sm:text-base font-bold bg-teal-800 text-white px-3 py-1.5 rounded-lg mb-3">
            VII. LAMPIRAN (LKPD, BAHAN AJAR, RUBRIK PENILAIAN, & KKTP)
          </h2>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="border border-teal-200 p-4 rounded-xl bg-teal-50/40">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="font-bold text-slate-900 text-xs uppercase text-teal-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-700" />
                  A. Lembar Kerja Peserta Didik (LKPD) Interaktif AI
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLkpdModalOpen(true);
                    if (!activePlan.lampiran.lkpdStructured) {
                      handleGenerateLKPD();
                    }
                  }}
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{activePlan.lampiran.lkpdStructured ? 'Buka LKPD Lengkap & Cetak' : 'Buat LKPD dengan AI'}</span>
                </button>
              </div>

              {activePlan.lampiran.lkpdStructured ? (
                <div className="p-3 bg-white border border-teal-200 rounded-xl space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900 text-xs">{activePlan.lampiran.lkpdStructured.judulLKPD}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">✓ Dokumen LKPD AI Siap</span>
                  </div>
                  <p className="text-slate-600 text-xs line-clamp-2">
                    {activePlan.lampiran.lkpdStructured.lembarPenugasan.tujuanAktivitas}
                  </p>
                </div>
              ) : isEditing ? (
                <textarea
                  rows={4}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  value={editedPlan.lampiran.lkpd}
                  onChange={(e) => updateLampiran('lkpd', e.target.value)}
                />
              ) : (
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{activePlan.lampiran.lkpd}</p>
              )}
            </div>

            <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50">
              <span className="font-bold text-slate-900 block mb-1 text-xs uppercase text-teal-800 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                B. Rangkuman Bahan Bacaan Guru & Siswa
              </span>
              {isEditing ? (
                <textarea
                  rows={4}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  value={editedPlan.lampiran.bahanAjar}
                  onChange={(e) => updateLampiran('bahanAjar', e.target.value)}
                />
              ) : (
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{activePlan.lampiran.bahanAjar}</p>
              )}
            </div>

            <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50">
              <span className="font-bold text-slate-900 block mb-1 text-xs uppercase text-teal-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                C. Rubrik Penilaian
              </span>
              {isEditing ? (
                <textarea
                  rows={4}
                  className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                  value={editedPlan.lampiran.rubrikPenilaian}
                  onChange={(e) => updateLampiran('rubrikPenilaian', e.target.value)}
                />
              ) : (
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{activePlan.lampiran.rubrikPenilaian}</p>
              )}
            </div>

            {/* D. KKTP (Kriteria Ketuntasan Tujuan Pembelajaran) */}
            <div className="border border-teal-200 p-4 rounded-xl bg-teal-50/20">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="font-bold text-slate-900 text-xs uppercase text-teal-800 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-teal-600" />
                  D. Kriteria Ketuntasan Tujuan Pembelajaran (KKTP)
                </span>
                {typeof activePlan.lampiran.kktp === 'object' && activePlan.lampiran.kktp?.pendekatan && !isEditing && (
                  <span className="text-[11px] font-semibold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
                    {activePlan.lampiran.kktp.pendekatan}
                  </span>
                )}
              </div>

              {activePlan.lampiran.kktp ? (
                typeof activePlan.lampiran.kktp === 'string' ? (
                  isEditing ? (
                    <textarea
                      rows={4}
                      className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                      value={editedPlan.lampiran.kktp as string}
                      onChange={(e) => updateLampiran('kktp', e.target.value)}
                    />
                  ) : (
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{activePlan.lampiran.kktp}</p>
                  )
                ) : (
                  <div className="space-y-3.5 mt-2">
                    {isEditing ? (
                      <div className="space-y-2 bg-amber-50/70 p-3 rounded-lg border border-amber-300">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-amber-950">Pendekatan KKTP:</span>
                          <input
                            type="text"
                            className="flex-1 bg-white border border-amber-300 rounded p-1 text-xs font-semibold"
                            value={(editedPlan.lampiran.kktp as KKTPData)?.pendekatan || ''}
                            onChange={(e) => {
                              const curr = editedPlan.lampiran.kktp as KKTPData;
                              updateLampiran('kktp', { ...curr, pendekatan: e.target.value });
                            }}
                            placeholder="Deskripsi Kriteria / Rubrik..."
                          />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-amber-950 block mb-1">Deskripsi Umum / Petunjuk:</span>
                          <textarea
                            rows={2}
                            className="w-full bg-white border border-amber-300 rounded p-1 text-xs"
                            value={(editedPlan.lampiran.kktp as KKTPData)?.deskripsi || ''}
                            onChange={(e) => {
                              const curr = editedPlan.lampiran.kktp as KKTPData;
                              updateLampiran('kktp', { ...curr, deskripsi: e.target.value });
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      activePlan.lampiran.kktp.deskripsi && (
                        <p className="text-xs text-slate-600 italic leading-relaxed">
                          {activePlan.lampiran.kktp.deskripsi}
                        </p>
                      )
                    )}

                    {/* KKTP Rubrik Table */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-teal-700 text-white font-semibold">
                            <th className="p-2.5 border-b border-teal-800 min-w-[140px]">Indikator / Aspek TP</th>
                            <th className="p-2.5 border-b border-teal-800 min-w-[120px] bg-rose-800/80">Perlu Bimbingan (0-60%)</th>
                            <th className="p-2.5 border-b border-teal-800 min-w-[120px] bg-amber-700/80">Cukup (61-70%)</th>
                            <th className="p-2.5 border-b border-teal-800 min-w-[120px] bg-emerald-800/80">Layak (71-80%)</th>
                            <th className="p-2.5 border-b border-teal-800 min-w-[120px] bg-blue-800/80">Mahir (81-100%)</th>
                            {isEditing && <th className="p-2.5 border-b border-teal-800 w-10 text-center">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {((isEditing ? (editedPlan.lampiran.kktp as KKTPData) : activePlan.lampiran.kktp as KKTPData).kriteria || []).map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-2 font-bold text-slate-800 bg-slate-50/60 align-top">
                                {isEditing ? (
                                  <textarea
                                    rows={2}
                                    className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-xs font-bold"
                                    value={item.aspekPenilaian}
                                    onChange={(e) => updateKKTPCriterion(idx, 'aspekPenilaian', e.target.value)}
                                  />
                                ) : (
                                  item.aspekPenilaian
                                )}
                              </td>
                              <td className="p-2 text-slate-700 bg-rose-50/40 align-top text-[11px]">
                                {isEditing ? (
                                  <textarea
                                    rows={2}
                                    className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-[11px]"
                                    value={item.perluBimbingan}
                                    onChange={(e) => updateKKTPCriterion(idx, 'perluBimbingan', e.target.value)}
                                  />
                                ) : (
                                  item.perluBimbingan
                                )}
                              </td>
                              <td className="p-2 text-slate-700 bg-amber-50/40 align-top text-[11px]">
                                {isEditing ? (
                                  <textarea
                                    rows={2}
                                    className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-[11px]"
                                    value={item.cukup}
                                    onChange={(e) => updateKKTPCriterion(idx, 'cukup', e.target.value)}
                                  />
                                ) : (
                                  item.cukup
                                )}
                              </td>
                              <td className="p-2 text-slate-700 bg-emerald-50/40 align-top text-[11px]">
                                {isEditing ? (
                                  <textarea
                                    rows={2}
                                    className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-[11px]"
                                    value={item.layak}
                                    onChange={(e) => updateKKTPCriterion(idx, 'layak', e.target.value)}
                                  />
                                ) : (
                                  item.layak
                                )}
                              </td>
                              <td className="p-2 text-slate-700 bg-blue-50/40 align-top text-[11px]">
                                {isEditing ? (
                                  <textarea
                                    rows={2}
                                    className="w-full bg-amber-50 border border-amber-300 rounded p-1 text-[11px]"
                                    value={item.mahir}
                                    onChange={(e) => updateKKTPCriterion(idx, 'mahir', e.target.value)}
                                  />
                                ) : (
                                  item.mahir
                                )}
                              </td>
                              {isEditing && (
                                <td className="p-2 align-top text-center">
                                  <button
                                    onClick={() => removeKKTPCriterionRow(idx)}
                                    type="button"
                                    className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded transition-all cursor-pointer"
                                    title="Hapus Baris Kriteria"
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

                    {/* Add Row Button in Edit Mode */}
                    {isEditing && (
                      <button
                        onClick={addKKTPCriterionRow}
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 rounded-lg text-xs font-bold cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Baris Kriteria KKTP</span>
                      </button>
                    )}

                    {/* Tindak Lanjut Summary */}
                    {(activePlan.lampiran.kktp as KKTPData).tindakLanjut && (
                      <div className="bg-white p-3 rounded-xl border border-teal-200 text-xs space-y-1.5">
                        <span className="font-bold text-teal-900 block uppercase text-[11px] tracking-wide">
                          📌 Rencana Tindak Lanjut Hasil Asesmen KKTP:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-[11px]">
                          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                            <span className="font-bold block mb-0.5">Perlu Bimbingan:</span>
                            {isEditing ? (
                              <textarea
                                rows={2}
                                className="w-full bg-white border border-rose-300 rounded p-1 text-[11px]"
                                value={(editedPlan.lampiran.kktp as KKTPData)?.tindakLanjut?.perluBimbingan || ''}
                                onChange={(e) => {
                                  const curr = editedPlan.lampiran.kktp as KKTPData;
                                  updateLampiran('kktp', {
                                    ...curr,
                                    tindakLanjut: { ...(curr.tindakLanjut || { perluBimbingan: '', cukup: '', layak: '', mahir: '' }), perluBimbingan: e.target.value },
                                  });
                                }}
                              />
                            ) : (
                              (activePlan.lampiran.kktp as KKTPData).tindakLanjut?.perluBimbingan
                            )}
                          </div>
                          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                            <span className="font-bold block mb-0.5">Cukup:</span>
                            {isEditing ? (
                              <textarea
                                rows={2}
                                className="w-full bg-white border border-amber-300 rounded p-1 text-[11px]"
                                value={(editedPlan.lampiran.kktp as KKTPData)?.tindakLanjut?.cukup || ''}
                                onChange={(e) => {
                                  const curr = editedPlan.lampiran.kktp as KKTPData;
                                  updateLampiran('kktp', {
                                    ...curr,
                                    tindakLanjut: { ...(curr.tindakLanjut || { perluBimbingan: '', cukup: '', layak: '', mahir: '' }), cukup: e.target.value },
                                  });
                                }}
                              />
                            ) : (
                              (activePlan.lampiran.kktp as KKTPData).tindakLanjut?.cukup
                            )}
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                            <span className="font-bold block mb-0.5">Layak:</span>
                            {isEditing ? (
                              <textarea
                                rows={2}
                                className="w-full bg-white border border-emerald-300 rounded p-1 text-[11px]"
                                value={(editedPlan.lampiran.kktp as KKTPData)?.tindakLanjut?.layak || ''}
                                onChange={(e) => {
                                  const curr = editedPlan.lampiran.kktp as KKTPData;
                                  updateLampiran('kktp', {
                                    ...curr,
                                    tindakLanjut: { ...(curr.tindakLanjut || { perluBimbingan: '', cukup: '', layak: '', mahir: '' }), layak: e.target.value },
                                  });
                                }}
                              />
                            ) : (
                              (activePlan.lampiran.kktp as KKTPData).tindakLanjut?.layak
                            )}
                          </div>
                          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                            <span className="font-bold block mb-0.5">Mahir:</span>
                            {isEditing ? (
                              <textarea
                                rows={2}
                                className="w-full bg-white border border-blue-300 rounded p-1 text-[11px]"
                                value={(editedPlan.lampiran.kktp as KKTPData)?.tindakLanjut?.mahir || ''}
                                onChange={(e) => {
                                  const curr = editedPlan.lampiran.kktp as KKTPData;
                                  updateLampiran('kktp', {
                                    ...curr,
                                    tindakLanjut: { ...(curr.tindakLanjut || { perluBimbingan: '', cukup: '', layak: '', mahir: '' }), mahir: e.target.value },
                                  });
                                }}
                              />
                            ) : (
                              (activePlan.lampiran.kktp as KKTPData).tindakLanjut?.mahir
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <p className="text-slate-500 italic text-xs mt-1">(KKTP terlampir otomatis dalam modul ajar)</p>
              )}
            </div>
          </div>
        </div>

        {/* CARD LAMPIRAN TERPISAH: JURNAL HARIAN GURU */}
        <div className="mb-8 p-4 bg-teal-50/50 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div>
            <h3 className="font-bold text-teal-900 text-xs sm:text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>Jurnal Harian & Catatan Pelaksanaan Guru (Dokumen Terpisah)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Kelola catatan refleksi harian, daftar presensi/kejadian, tindak lanjut, serta cetak/unduh dokumen jurnal secara terpisah.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsJurnalModalOpen(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>Buka & Edit Jurnal Harian</span>
          </button>
        </div>

        {/* SIGNATURE BLOCK / LEMBAR PENGESAHAN */}
        <div className="mt-12 pt-6 border-t-2 border-slate-300 text-xs sm:text-sm print:break-inside-avoid">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-slate-600 mb-1">Mengetahui,</p>
              <p className="font-bold text-slate-900">Kepala Sekolah {activePlan.identitas.namaSekolah}</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline">{activePlan.identitas.namaKepsek || '_________________________'}</p>
              <p className="text-slate-600 text-xs">NIP. {activePlan.identitas.nipKepsek || '...........................................'}</p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">Disahkan di Sekolah, ......................... 2026</p>
              <p className="font-bold text-slate-900">Guru</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 underline">{activePlan.identitas.namaGuru || '_________________________'}</p>
              <p className="text-slate-600 text-xs">NIP. {activePlan.identitas.nipGuru || '...........................................'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LKPD MODAL */}
      <LKPDModal
        isOpen={isLkpdModalOpen}
        onClose={() => setIsLkpdModalOpen(false)}
        planData={activePlan}
        lkpdData={activePlan.lampiran.lkpdStructured}
        onSaveLKPD={handleSaveLKPD}
        onGenerateLKPD={handleGenerateLKPD}
        isGenerating={isGeneratingLkpd}
      />

      {/* JURNAL HARIAN GURU MODAL */}
      <JurnalHarianModal
        isOpen={isJurnalModalOpen}
        onClose={() => setIsJurnalModalOpen(false)}
        planData={activePlan}
        jurnalData={activePlan.jurnalHarian || getDefaultJurnalHarian(activePlan)}
        onSaveJurnal={handleSaveJurnal}
      />
    </div>
  );
};
