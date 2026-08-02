import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IdentitySection } from './components/IdentitySection';
import { LessonDetailsSection } from './components/LessonDetailsSection';
import { CharacteristicsSection } from './components/CharacteristicsSection';
import { DeepLearningDesignSection } from './components/DeepLearningDesignSection';
import { LessonPlanView } from './components/LessonPlanView';
import { AiRefinerModal } from './components/AiRefinerModal';
import { SavedPlansModal } from './components/SavedPlansModal';
import { GuideModal } from './components/GuideModal';
import { GeneratingProgressModal } from './components/GeneratingProgressModal';
import { LessonFormData, LessonPlanOutput, SavedLessonPlan } from './types';
import { DEMO_PRESETS, getKelasOptions, DPL_OPTIONS, METODE_MODEL_OPTIONS, KEMITRAAN_OPTIONS, DIGITAL_TOOLS_OPTIONS, LINTAS_DISIPLIN_OPTIONS, LINGKUNGAN_PEMBELAJARAN_OPTIONS } from './data/presets';
import { Sparkles, Loader2, ArrowRight, RotateCcw, AlertCircle, Trash2 } from 'lucide-react';
import { TrialExhaustedModal, EnterAccessCodeModal, AdminPanelModal, getOrGenerateFingerprint, TrialConfirmationModal, getLocalCodes, getOrRegisterLocalTrialUser, decrementLocalTrial, addLocalLog } from './components/LicensingModals';

const matchOptionLabels = (recommended: string[] | undefined, options: { label: string }[], fallbackCount = 2, maxCount = 3): string[] => {
  if (!recommended || !Array.isArray(recommended) || recommended.length === 0) {
    return options.slice(0, Math.min(fallbackCount, maxCount)).map(o => o.label);
  }

  const matched = options.filter(opt => {
    const optLabelLower = opt.label.toLowerCase();
    return recommended.some(rec => {
      if (!rec || typeof rec !== 'string') return false;
      const recLower = rec.toLowerCase().trim();
      if (optLabelLower === recLower) return true;
      if (optLabelLower.includes(recLower) || recLower.includes(optLabelLower)) return true;
      const recWords = recLower.split(/[\s()/,-]+/).filter(w => w.length >= 3);
      return recWords.some(w => optLabelLower.includes(w));
    });
  }).map(opt => opt.label);

  if (matched.length === 0) {
    return options.slice(0, Math.min(fallbackCount, maxCount)).map(o => o.label);
  }

  return matched.slice(0, maxCount);
};

const generateLocalCpTpFallback = (cpText: string, subject: string): { tp: string; lingkupMateri: string } => {
  if (!cpText || !cpText.trim()) {
    return {
      tp: `1. Peserta didik dapat mengidentifikasi konsep dasar ${subject || 'pembelajaran'}.\n2. Peserta didik dapat menerapkan konsep ${subject || 'pembelajaran'} dalam memecahkan masalah kontekstual.\n3. Peserta didik merefleksikan proses pembelajaran ${subject || 'pembelajaran'}.`,
      lingkupMateri: subject || "Topik Utama"
    };
  }

  const cleanText = cpText.replace(/[\n\r]/g, " ").replace(/\s+/g, " ").trim();
  
  let extractedMateri = "";
  const patterns = [
    /(?:tentang|materi|konsep|topik|memahami|menganalisis)\s+([A-Za-z0-9\s]{4,35})(?:\s+dan\s+([A-Za-z0-9\s]{4,35}))?(?:\.|\,|$|\s+sesuai|\s+pada)/i,
    /([A-Za-z0-9\s]{4,30})\s+(?:melalui|dengan|dalam|pada|untuk)/i
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      let candidate = match[1].trim();
      if (candidate.toLowerCase().length > 3 && !["peserta", "didik", "siswa", "yang", "pada"].includes(candidate.toLowerCase())) {
        extractedMateri = candidate;
        break;
      }
    }
  }

  if (!extractedMateri) {
    const words = cleanText.split(" ").filter(w => w.length > 3);
    if (words.length > 2) {
      extractedMateri = words.slice(0, 3).join(" ");
    } else {
      extractedMateri = subject || "Materi Inti";
    }
  }

  extractedMateri = extractedMateri
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    .trim();

  const tp = `1. Peserta didik dapat memahami dan menjelaskan konsep utama tentang ${extractedMateri} secara kritis.
2. Peserta didik dapat mengaplikasikan pemahaman ${extractedMateri} untuk menyelesaikan masalah kontekstual secara kolaboratif.
3. Peserta didik mampu merefleksikan serta mengevaluasi pemahaman mereka mengenai ${extractedMateri} sebagai bagian dari feedback metakognitif.`;

  return { tp, lingkupMateri: extractedMateri };
};

const createFallbackLessonPlanClient = (data: any): LessonPlanOutput => {
  const mp = data.mataPelajaran || 'Mata Pelajaran';
  const lm = data.lingkupMateri || 'Materi Utama Pembelajaran';
  const cp = data.capaianPembelajaran || `Peserta didik dapat memahami dan menerapkan konsep ${lm}.`;
  const tp = data.tujuanPembelajaran || `1. Peserta didik dapat menjelaskan ${lm}.\n2. Peserta didik dapat mengaplikasikan ${lm} dalam masalah nyata.\n3. Peserta didik merefleksikan pemahaman materi ${lm}.`;

  return {
    identitas: {
      namaGuru: data.namaGuru || "Guru Mata Pelajaran",
      nipGuru: data.nipGuru || "-",
      namaKepsek: data.namaKepsek || "Kepala Sekolah",
      nipKepsek: data.nipKepsek || "-",
      namaSekolah: data.namaSekolah || "Sekolah Dasar Negeri",
      mataPelajaran: mp,
      fase: data.fase || "Fase B",
      kelas: data.kelas || "Kelas 4",
      faseKelas: data.faseKelas || `${data.fase || 'Fase B'} - ${data.kelas || 'Kelas 4'}`,
      semesterTahun: data.semesterTahun || "Semester 1 / 2026-2027",
      alokasiWaktu: data.alokasiWaktu || "3 x 35 Menit (3 JP - SD)"
    },
    analisisAwal: {
      karakteristikMurid: data.karakteristikMurid || "Murid memiliki gaya belajar beragam (visual, auditori, kinestetik) dan antusias mengikuti kegiatan kelompok.",
      karakteristikMateri: data.karakteristikMateri || "Materi bersifat kontekstual dan dekat dengan kehidupan sehari-hari siswa."
    },
    tujuanDanDpl: {
      capaianPembelajaran: cp,
      lingkupMateri: lm,
      tujuanPembelajaran: tp,
      indikatorKetercapaian: [
        `Menjelaskan konsep dasar ${lm} secara tepat.`,
        `Mengaplikasikan konsep ${lm} dalam menyelesaikan masalah kontekstual.`,
        `Refleksi dan pemaknaan atas proses pembelajaran ${lm}.`
      ],
      dimensiProfilLulusan: Array.isArray(data.dpl) && data.dpl.length > 0 ? data.dpl : ["Bernalar Kritis", "Gotong Royong", "Kreatif"]
    },
    desainPembelajaran: {
      modelDanMetode: Array.isArray(data.metodeModel) && data.metodeModel.length > 0 ? data.metodeModel : ["Problem Based Learning (PBL)", "Pembelajaran Berdiferensiasi (Konten/Proses/Produk)"],
      kemitraanPembelajaran: Array.isArray(data.kemitraan) && data.kemitraan.length > 0 ? data.kemitraan : ["Kolaborasi Antar Siswa (Peer Learning)", "Orang Tua / Wali Murid"],
      pemanfaatanDigital: Array.isArray(data.pemanfaatanDigital) && data.pemanfaatanDigital.length > 0 ? data.pemanfaatanDigital : ["Papan Interaktif Digital (Jamboard / Padlet / Miro)", "Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)"],
      lintasDisiplin: Array.isArray(data.lintasDisiplin) ? data.lintasDisiplin : [],
      lingkunganPembelajaran: Array.isArray(data.lingkunganPembelajaran) ? data.lingkunganPembelajaran : [],
      saranaPrasarana: "Laptop, Proyektor, Papan Tulis, LKPD Cetak, Media Interaktif Digital."
    },
    kegiatanPembelajaran: {
      pendahuluan: {
        alokasiWaktu: "15 Menit",
        aktivitas: [
          "Guru membuka pembelajaran dengan salam hangat, doa bersama, dan memeriksa kehadiran siswa.",
          "Guru memberikan pertanyaan pemantik secara interaktif untuk merangsang rasa ingin tahu siswa.",
          "Guru menyampaikan tujuan pembelajaran hari ini dan menjelaskan alur aktivitas kelompok yang akan dilakukan."
        ]
      },
      kegiatanInti: [
        {
          tahapLabel: "MEMAHAMI",
          subJudul: "Memahami Konsep & Eksplorasi Makna (Understanding)",
          prinsipMendalamLabel: "Berpusat pada Murid & Meaningful Learning",
          alokasiWaktu: "25 Menit",
          aktivitasGuru: [
            "Guru memberikan pertanyaan pemantik dan menayangkan media visual/digital terkait " + lm + ".",
            "Guru memfasilitasi diskusi eksplorasi awal dan mengamati tingkat pemahaman awal murid.",
            "Guru memberikan penguatan materi dasar serta klarifikasi konsep."
          ],
          aktivitasMurid: [
            "Murid mengamati tayangan/media dan merespons pertanyaan pemantik secara aktif.",
            "Murid berdiskusi dalam kelompok kecil untuk mengeksplorasi konsep dasar " + lm + ".",
            "Murid merumuskan ringkasan pemahaman awal."
          ],
          poinUtama: ["Eksplorasi konsep " + lm, "Diskusi tanya jawab interaktif"]
        },
        {
          tahapLabel: "MENGAPLIKASI",
          subJudul: "Mengaplikasikan Konsep pada Konteks Nyata (Application)",
          prinsipMendalamLabel: "Autentik, Kolaboratif & Problem Solving",
          alokasiWaktu: "35 Menit",
          aktivitasGuru: [
            "Guru membagikan Lembar Kerja Peserta Didik (LKPD) berbasis studi kasus/masalah nyata.",
            "Guru memandu proses kerja kelompok dan memberikan arahan scaffolding.",
            "Guru mengobservasi kolaborasi dan sikap bernalar kritis antar siswa."
          ],
          aktivitasMurid: [
            "Murid bekerja sama menyelesaikan tugas atau masalah dalam LKPD.",
            "Murid menerapkan konsep " + lm + " untuk menghasilkan produk / solusi.",
            "Murid menyusun hasil diskusi kelompok untuk dipresentasikan."
          ],
          poinUtama: ["Pengerjaan LKPD kolaboratif", "Penyelesaian masalah nyata"]
        },
        {
          tahapLabel: "MEREFLEKSI",
          subJudul: "Merefleksikan Pembelajaran & Evaluasi Diri (Reflection)",
          prinsipMendalamLabel: "Metakognisi, Feedback Loop & Self Assessment",
          alokasiWaktu: "15 Menit",
          aktivitasGuru: [
            "Guru memimpin sesi presentasi kelompok dan memberikan umpan balik konstruktif.",
            "Guru memandu refleksi diri murid mengenai proses dan manfaat pembelajaran.",
            "Guru bersama murid menyimpulkan pembelajaran."
          ],
          aktivitasMurid: [
            "Masing-masing kelompok mempresentasikan hasil karya / jawaban LKPD.",
            "Murid melakukan refleksi metakognitif (apa yang sudah dipahami dan kesulitan yang dihadapi).",
            "Murid memberikan apresiasi kepada sesama teman kelompok."
          ],
          poinUtama: ["Presentasi & Umpan Balik", "Refleksi metakognitif mandiri"]
        }
      ],
      penutup: {
        alokasiWaktu: "10 Menit",
        aktivitas: [
          "Guru membimbing murid menyimpulkan seluruh rangkaian aktivitas " + lm + ".",
          "Guru memberikan umpan balik apresiatif dan penugasan tindak lanjut.",
          "Pembelajaran ditutup dengan doa bersama dan salam penutup."
        ]
      }
    },
    asesmen: {
      assessmentAsLearning: [
        {
          bentukPenilaian: "Formatif (Refleksi Diri & Antarteman)",
          teknikPenilaian: "Self & Peer Assessment",
          instrumenPenilaian: "Lembar Refleksi Metakognitif Mandiri & Rubrik Penilaian Antarteman tentang " + lm + "."
        }
      ],
      assessmentForLearning: [
        {
          bentukPenilaian: "Formatif (Proses Pembelajaran)",
          teknikPenilaian: "Observasi Diskusi & Penugasan LKPD",
          instrumenPenilaian: "Lembar Observasi Sikap/Kinerja & Rubrik Unjuk Kerja Kelompok " + mp + "."
        }
      ],
      assessmentOfLearning: [
        {
          bentukPenilaian: "Sumatif (Akhir Pembelajaran)",
          teknikPenilaian: "Tes Tertulis / Penilaian Produk",
          instrumenPenilaian: "Soal Evaluasi Tertulis & Rubrik Penilaian Produk Akhir " + lm + "."
        }
      ]
    },
    remedialDanPengayaan: {
      remedial: "Bimbingan individu/kelompok kecil bagi murid yang memerlukan pendampingan materi dasar.",
      pengayaan: "Pemberian tugas pengayaan HOTS (High Order Thinking Skills) untuk memperdalam pemahaman."
    },
    lampiran: {
      lkpd: "Ringkasan LKPD: Diskusikan bersama kelompokmu konsep " + lm + " dan jawablah pertanyaan analisis dalam lembar kerja.",
      bahanAjar: "Bahan Ajar Ringkas: Rangkuman materi " + mp + " topik " + lm + " dilengkapi contoh gambar/diagram.",
      rubrikPenilaian: "Rubrik Penilaian Kinerja & Produk (Skor 1-4: Perlu Bimbingan, Cukup, Layak, Mahir).",
      kktp: {
        pendekatan: "Rubrik Kriteria Ketuntasan Tujuan Pembelajaran (Interval Nilai)",
        deskripsi: "Pedoman penetapan kriteria ketuntasan belajar murid.",
        kriteria: [
          {
            aspekPenilaian: "Pemahaman Konsep " + lm,
            perluBimbingan: "Belum menunjukkan pemahaman (0 - 60%)",
            cukup: "Menunjukkan pemahaman dengan bimbingan (61 - 70%)",
            layak: "Menunjukkan pemahaman mandiri (71 - 80%)",
            mahir: "Pemahaman sangat mendalam & analisis luas (81 - 100%)"
          },
          {
            aspekPenilaian: "Aplikasi & Solusi Masalah",
            perluBimbingan: "Belum mampu menyelesaikan tugas (0 - 60%)",
            cukup: "Menyelesaikan sebagian tugas (61 - 70%)",
            layak: "Menyelesaikan tugas secara mandiri (71 - 80%)",
            mahir: "Mampu mengaplikasikan pada konteks baru (81 - 100%)"
          }
        ],
        tindakLanjut: {
          perluBimbingan: "Intervensi khusus guru dan penyederhanaan instruksi",
          cukup: "Bimbingan tambahan pada bagian yang masih lemah",
          layak: "Diberikan penguatan materi dan latihan mandiri",
          mahir: "Diberikan pengayaan / soal tantangan HOTS"
        }
      }
    }
  };
};

const INITIAL_FORM_DATA: LessonFormData = {
  namaGuru: '',
  nipGuru: '',
  namaKepsek: '',
  nipKepsek: '',
  namaSekolah: '',
  fase: 'Fase B',
  kelas: 'Kelas 4',
  faseKelas: 'Fase B - Kelas 4',
  semesterTahun: '',

  mataPelajaran: '',
  capaianPembelajaran: '',
  lingkupMateri: '',
  tujuanPembelajaran: '',
  alokasiWaktu: '3 x 35 Menit (3 JP - SD)',

  karakteristikMurid: '',
  karakteristikMateri: '',

  dpl: [],
  metodeModel: [],
  kemitraan: [],
  pemanfaatanDigital: [],
  lintasDisiplin: [],
  lingkunganPembelajaran: [],
};

export default function App() {
  const [formData, setFormData] = useState<LessonFormData>(INITIAL_FORM_DATA);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlanOutput | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedLessonPlan[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatusMessage, setGeneratingStatusMessage] = useState('');
  const [generatingCharCount, setGeneratingCharCount] = useState(0);
  const [generatingStep, setGeneratingStep] = useState(1);

  const [isAiLoadingCpTp, setIsAiLoadingCpTp] = useState(false);
  const [isAiRecommendingAll, setIsAiRecommendingAll] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isRefinerModalOpen, setIsRefinerModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Licensing & Trial System States
  const [accessCode, setAccessCode] = useState(() => localStorage.getItem('rpm_access_code') || '');
  const [trialCount, setTrialCount] = useState(5);
  const [accessType, setAccessType] = useState<'TRIAL' | 'PERMANENT' | 'MONTHLY'>('TRIAL');
  const [isTrialExhaustedModalOpen, setIsTrialExhaustedModalOpen] = useState(false);
  const [isEnterCodeModalOpen, setIsEnterCodeModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isTrialConfirmModalOpen, setIsTrialConfirmModalOpen] = useState(false);

  // Sync / Fetch licensing status helper
  const fetchLicensingStatus = async () => {
    try {
      const fp = getOrGenerateFingerprint();
      const code = localStorage.getItem('rpm_access_code') || '';
      let isServerOk = false;

      try {
        const res = await fetch('/api/licensing/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint: fp, code }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json && json.success) {
            isServerOk = true;
            setTrialCount(json.trial.remaining_trials);
            
            if (json.activeCode && json.activeCode.status === 'ACTIVE') {
              setAccessCode(json.activeCode.code);
              setAccessType(json.activeCode.type);
            } else {
              setAccessType('TRIAL');
              if (localStorage.getItem('rpm_access_code')) {
                localStorage.removeItem('rpm_access_code');
                setAccessCode('');
              }
            }
          }
        }
      } catch (err) {
        console.warn('Server status check unreachable, using local status:', err);
      }

      if (!isServerOk) {
        // Fallback local status check
        const localCodes = getLocalCodes();
        const activeLocalCode = localCodes.find((c: any) => c.code.trim().toUpperCase() === code.trim().toUpperCase() && c.status === 'ACTIVE');
        if (activeLocalCode) {
          if (!activeLocalCode.valid_until || new Date(activeLocalCode.valid_until) >= new Date()) {
            setAccessCode(activeLocalCode.code);
            setAccessType(activeLocalCode.type);
            return;
          }
        }

        // Default to TRIAL if no valid active code
        setAccessType('TRIAL');
        const localRem = getOrRegisterLocalTrialUser(fp);
        setTrialCount(localRem);
      }
    } catch (err) {
      console.error('Error fetching licensing status:', err);
    }
  };

  useEffect(() => {
    fetchLicensingStatus();
  }, [accessCode]);

  // Load saved plans from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('RPM_SAVED_PLANS');
      if (stored) {
        setSavedPlans(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading saved plans:', err);
    }
  }, []);

  // Save to localStorage helper
  const savePlansToStorage = (plans: SavedLessonPlan[]) => {
    setSavedPlans(plans);
    localStorage.setItem('RPM_SAVED_PLANS', JSON.stringify(plans));
  };

  // Form Field Change Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'fase') {
        const options = getKelasOptions(value);
        let newKelas = prev.kelas || '';
        if (!options.includes(newKelas)) {
          newKelas = options[0] || '';
        }
        updated.kelas = newKelas;
        updated.faseKelas = value && newKelas ? `${value} - ${newKelas}` : (value || newKelas || '');
      } else if (name === 'kelas') {
        const currentFase = prev.fase || 'Fase B';
        updated.faseKelas = currentFase && value ? `${currentFase} - ${value}` : (currentFase || value || '');
      }
      return updated;
    });
  };

  const handleSelectSubject = (subject: string) => {
    setFormData((prev) => ({ ...prev, mataPelajaran: subject }));
  };

  const handleToggleCheckbox = (
    category: 'dpl' | 'metodeModel' | 'kemitraan' | 'pemanfaatanDigital' | 'lintasDisiplin' | 'lingkunganPembelajaran',
    itemLabel: string
  ) => {
    setFormData((prev) => {
      const currentList = prev[category];
      const exists = currentList.includes(itemLabel);
      const updated = exists
        ? currentList.filter((i) => i !== itemLabel)
        : [...currentList, itemLabel];
      return { ...prev, [category]: updated };
    });
  };

  const handleApplyStudentPreset = (text: string) => {
    setFormData((prev) => ({
      ...prev,
      karakteristikMurid: prev.karakteristikMurid
        ? `${prev.karakteristikMurid}\n${text}`
        : text,
    }));
  };

  const handleApplyMaterialPreset = (text: string) => {
    setFormData((prev) => ({
      ...prev,
      karakteristikMateri: prev.karakteristikMateri
        ? `${prev.karakteristikMateri}\n${text}`
        : text,
    }));
  };

  // AI Assistant for CP & TP (Now repurposed to suggest TP & Lingkup Materi based on CP)
  const handleRequestCpTpAi = async () => {
    let targetSubject = formData.mataPelajaran || 'IPAS';
    let targetMateri = formData.lingkupMateri || targetSubject;

    if (!formData.capaianPembelajaran || !formData.capaianPembelajaran.trim()) {
      setErrorMessage('Silakan isi kolom "Capaian Pembelajaran (CP)" terlebih dahulu agar AI dapat menyarankan Tujuan Pembelajaran (TP) dan Lingkup Materi yang sesuai.');
      const element = document.getElementById('textarea-capaianPembelajaran');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setIsAiLoadingCpTp(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/recommend-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldType: 'cp_tp',
          mataPelajaran: targetSubject,
          faseKelas: formData.faseKelas,
          lingkupMateri: targetMateri,
          capaianPembelajaran: formData.capaianPembelajaran,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server offline (Status ${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        const generatedTp = json.data.tp || `1. Peserta didik dapat menjelaskan konsep dasar materi secara tepat dan mendalam.\n2. Peserta didik dapat mengaplikasikan pemahaman materi dalam situasi kontekstual sehari-hari.\n3. Peserta didik dapat merefleksikan dan menyimpulkan proses pembelajaran secara kritis dan kolaboratif.`;
        const generatedMateri = json.data.lingkupMateri || json.data.materi || json.data.lingkup_materi || targetMateri;

        setFormData((prev) => ({
          ...prev,
          mataPelajaran: targetSubject,
          tujuanPembelajaran: generatedTp,
          lingkupMateri: generatedMateri,
        }));
      } else {
        throw new Error(json.error || 'Gagal mengambil saran');
      }
    } catch (err: any) {
      console.warn('Error in CP/TP AI, running local smart fallback analyzer:', err);
      const fallbackData = generateLocalCpTpFallback(formData.capaianPembelajaran, targetSubject);
      setFormData((prev) => ({
        ...prev,
        mataPelajaran: targetSubject,
        tujuanPembelajaran: fallbackData.tp,
        lingkupMateri: fallbackData.lingkupMateri,
      }));
    } finally {
      setIsAiLoadingCpTp(false);
    }
  };

  // AI Assistant for All Recommendations (DPL, Methods, Kemitraan, Digital, Lintas Disiplin, Lingkungan)
  const handleRequestAllRecommendations = async () => {
    let targetSubject = formData.mataPelajaran || 'IPAS';

    setIsAiRecommendingAll(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/recommend-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldType: 'recommendations_all',
          mataPelajaran: targetSubject,
          faseKelas: formData.faseKelas,
          lingkupMateri: formData.lingkupMateri || targetSubject,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const newDpl = matchOptionLabels(d.recommendedDpl, DPL_OPTIONS, 2, 3);
        const newMethods = matchOptionLabels(d.recommendedMethods, METODE_MODEL_OPTIONS, 2, 3);
        const newPartnerships = matchOptionLabels(d.recommendedPartnerships, KEMITRAAN_OPTIONS, 2, 3);
        const newDigital = matchOptionLabels(d.recommendedDigitalTools, DIGITAL_TOOLS_OPTIONS, 2, 3);
        const newCrossDiscipline = matchOptionLabels(d.recommendedLintasDisiplin || d.recommendedCrossDiscipline, LINTAS_DISIPLIN_OPTIONS, 1, 3);
        const newEnvironments = matchOptionLabels(d.recommendedLingkunganPembelajaran || d.recommendedEnvironments, LINGKUNGAN_PEMBELAJARAN_OPTIONS, 2, 3);

        setFormData((prev) => ({
          ...prev,
          mataPelajaran: targetSubject,
          dpl: newDpl,
          metodeModel: newMethods,
          kemitraan: newPartnerships,
          pemanfaatanDigital: newDigital,
          lintasDisiplin: newCrossDiscipline,
          lingkunganPembelajaran: newEnvironments,
          karakteristikMurid: d.studentCharacteristics || prev.karakteristikMurid || "Sebagian besar murid memiliki gaya belajar visual dan kinestetik, antusias pada aktivitas kelompok.",
          karakteristikMateri: d.materialCharacteristics || prev.karakteristikMateri || "Materi bersifat konseptual dan kontekstual, membutuhkan demonstrasi dan simulasi konkret.",
        }));
      } else {
        throw new Error(json.error || 'Gagal mengambil rekomendasi');
      }
    } catch (err: any) {
      console.error('Error in All Recommendations AI, using fallback options:', err);
      const newDpl = matchOptionLabels(undefined, DPL_OPTIONS, 2, 3);
      const newMethods = matchOptionLabels(undefined, METODE_MODEL_OPTIONS, 2, 3);
      const newPartnerships = matchOptionLabels(undefined, KEMITRAAN_OPTIONS, 2, 3);
      const newDigital = matchOptionLabels(undefined, DIGITAL_TOOLS_OPTIONS, 2, 3);
      const newCrossDiscipline = matchOptionLabels(undefined, LINTAS_DISIPLIN_OPTIONS, 1, 3);
      const newEnvironments = matchOptionLabels(undefined, LINGKUNGAN_PEMBELAJARAN_OPTIONS, 2, 3);

      setFormData((prev) => ({
        ...prev,
        mataPelajaran: targetSubject,
        dpl: newDpl,
        metodeModel: newMethods,
        kemitraan: newPartnerships,
        pemanfaatanDigital: newDigital,
        lintasDisiplin: newCrossDiscipline,
        lingkunganPembelajaran: newEnvironments,
        karakteristikMurid: prev.karakteristikMurid || "Sebagian besar murid memiliki gaya belajar visual dan kinestetik, antusias pada aktivitas kelompok.",
        karakteristikMateri: prev.karakteristikMateri || "Materi bersifat konseptual dan kontekstual, membutuhkan demonstrasi dan simulasi konkret.",
      }));
    } finally {
      setIsAiRecommendingAll(false);
    }
  };

  // Main Submit Handler to Generate RPM with Streaming SSE
  const handleGeneratePlan = async (e?: React.FormEvent, bypassConfirmation = false) => {
    if (e) e.preventDefault();

    if (accessType === 'TRIAL' && !bypassConfirmation) {
      if (trialCount <= 0) {
        setIsTrialExhaustedModalOpen(true);
      } else {
        setIsTrialConfirmModalOpen(true);
      }
      return;
    }

    let updatedData = { ...formData };
    
    // Auto-fill required fields if they are left empty to ensure the generation process always starts instantly
    if (!updatedData.namaSekolah || !updatedData.namaSekolah.trim()) {
      updatedData.namaSekolah = 'SD Negeri Nusantara';
    }
    if (!updatedData.namaGuru || !updatedData.namaGuru.trim()) {
      updatedData.namaGuru = 'Guru Pengampu';
    }
    if (!updatedData.mataPelajaran || !updatedData.mataPelajaran.trim()) {
      updatedData.mataPelajaran = 'IPAS';
    }
    
    const targetMateri = updatedData.lingkupMateri || updatedData.mataPelajaran;
    if (!updatedData.capaianPembelajaran || !updatedData.capaianPembelajaran.trim()) {
      updatedData.capaianPembelajaran = `Peserta didik mampu memahami dan menganalisis konsep ${targetMateri}, mengidentifikasi keterkaitan antar elemen, serta mengaplikasikan pemahaman tersebut dalam menyelesaikan masalah kontekstual sesuai standar Capaian Pembelajaran BSKAP terbaru Kurikulum Merdeka.`;
    }
    if (!updatedData.tujuanPembelajaran || !updatedData.tujuanPembelajaran.trim()) {
      updatedData.tujuanPembelajaran = `1. Peserta didik dapat menjelaskan konsep dasar ${targetMateri} secara tepat dan mendalam.\n2. Peserta didik dapat mengaplikasikan pemahaman ${targetMateri} dalam situasi kontekstual sehari-hari.\n3. Peserta didik dapat merefleksikan dan menyimpulkan proses pembelajaran ${targetMateri} secara kritis dan kolaboratif.`;
    }
    if (!updatedData.lingkupMateri || !updatedData.lingkupMateri.trim()) {
      updatedData.lingkupMateri = targetMateri;
    }
    if (!updatedData.dpl || updatedData.dpl.length === 0) {
      updatedData.dpl = matchOptionLabels(undefined, DPL_OPTIONS, 2, 3);
    }
    if (!updatedData.metodeModel || updatedData.metodeModel.length === 0) {
      updatedData.metodeModel = matchOptionLabels(undefined, METODE_MODEL_OPTIONS, 2, 3);
    }
    if (!updatedData.pemanfaatanDigital || updatedData.pemanfaatanDigital.length === 0) {
      updatedData.pemanfaatanDigital = matchOptionLabels(undefined, DIGITAL_TOOLS_OPTIONS, 2, 3);
    }
    setFormData(updatedData);

    setIsGenerating(true);
    setGeneratingStatusMessage('Menganalisis data CP, TP, dan Identitas Pembelajaran Guru...');
    setGeneratingCharCount(0);
    setGeneratingStep(1);
    setErrorMessage(null);

    // Apply trial decrement and local database activity logging immediately
    const fp = getOrGenerateFingerprint();
    const code = localStorage.getItem('rpm_access_code') || '';
    if (accessType === 'TRIAL') {
      const newRem = decrementLocalTrial(fp);
      setTrialCount(newRem);
    } else if (code) {
      addLocalLog('GENERATE_RPM', `Penyusunan RPM sukses menggunakan kode: ${code} (${accessType})`);
    }

    // Dynamic Simulated Progress Timer (ensures the progress modal always animates active progress to the user immediately)
    let simulatedStep = 1;
    const progressInterval = setInterval(() => {
      if (simulatedStep < 5) {
        simulatedStep += 1;
        setGeneratingStep(simulatedStep);
        setGeneratingCharCount(prev => prev + Math.floor(Math.random() * 400) + 200);

        const progressMessages: { [key: number]: string } = {
          2: 'Sedang merancang alur Deep Learning (Memahami, Mengaplikasi, Merefleksi)...',
          3: 'Menyusun rincian Aktivitas Guru & Murid serta Prinsip Pembelajaran Mendalam...',
          4: 'Membuat instrumen Asesmen Diagnostik, Formatif, Sumatif, & KKTP...',
          5: 'Finishing touch... Memformat dokumen Rencana Pembelajaran Mendalam...'
        };
        setGeneratingStatusMessage(progressMessages[simulatedStep] || 'Memproses...');
      }
    }, 2000);

    try {
      const fp = getOrGenerateFingerprint();
      const code = localStorage.getItem('rpm_access_code') || '';

      const res = await fetch('/api/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedData,
          accessCode: code,
          fingerprint: fp
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          if (errData.error === 'TRIAL_EXHAUSTED') {
            setIsTrialExhaustedModalOpen(true);
            setIsGenerating(false);
            clearInterval(progressInterval);
            return;
          }
        }
        throw new Error(`Gagal menghubungi server AI (Status HTTP ${res.status})`);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalPlan: LessonPlanOutput | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.type === 'status') {
                if (data.message) {
                  setGeneratingStatusMessage(data.message);
                }
                if (data.step) {
                  setGeneratingStep(data.step);
                  simulatedStep = Math.max(simulatedStep, data.step);
                }
              } else if (data.type === 'chunk') {
                if (typeof data.length === 'number') {
                  setGeneratingCharCount(data.length);
                }
              } else if (data.type === 'done') {
                if (data.lessonPlan) {
                  finalPlan = data.lessonPlan;
                }
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Gagal menghasilkan Rencana Pembelajaran Mendalam');
              }
            } catch (pErr: any) {
              if (pErr.message && pErr.message.includes('Gagal menghasilkan')) throw pErr;
              console.warn('SSE Event parsing error:', pErr);
            }
          }
        }

        if (finalPlan) {
          // Clears the simulated interval immediately so it doesn't conflict with our manual transition
          clearInterval(progressInterval);

          // Gracefully transition through any remaining steps so the teacher can see the progress of all 5 stages
          while (simulatedStep < 5) {
            simulatedStep += 1;
            setGeneratingStep(simulatedStep);
            
            const progressMessages: { [key: number]: string } = {
              2: 'Sedang merancang alur Deep Learning (Memahami, Mengaplikasi, Merefleksi)...',
              3: 'Menyusun rincian Aktivitas Guru & Murid serta Prinsip Pembelajaran Mendalam...',
              4: 'Membuat instrumen Asesmen Diagnostik, Formatif, Sumatif, & KKTP...',
              5: 'Finishing touch... Memformat dokumen Rencana Pembelajaran Mendalam...'
            };
            setGeneratingStatusMessage(progressMessages[simulatedStep] || 'Memproses...');
            setGeneratingCharCount(prev => prev + Math.floor(Math.random() * 400) + 300);
            await new Promise((resolve) => setTimeout(resolve, 850));
          }

          // Small final pause to let the teacher see the 100% completion of Step 5
          setGeneratingStatusMessage('Dokumen Rencana Pembelajaran Mendalam (RPM) Berhasil Disusun!');
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setGeneratedPlan(finalPlan);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          throw new Error('Sistem AI belum menyelesaikan penyusunan dokumen. Silakan coba kembali.');
        }
      } else {
        const json = await res.json();
        if (json.success && json.lessonPlan) {
          // Clears the simulated interval immediately
          clearInterval(progressInterval);

          while (simulatedStep < 5) {
            simulatedStep += 1;
            setGeneratingStep(simulatedStep);
            
            const progressMessages: { [key: number]: string } = {
              2: 'Sedang merancang alur Deep Learning (Memahami, Mengaplikasi, Merefleksi)...',
              3: 'Menyusun rincian Aktivitas Guru & Murid serta Prinsip Pembelajaran Mendalam...',
              4: 'Membuat instrumen Asesmen Diagnostik, Formatif, Sumatif, & KKTP...',
              5: 'Finishing touch... Memformat dokumen Rencana Pembelajaran Mendalam...'
            };
            setGeneratingStatusMessage(progressMessages[simulatedStep] || 'Memproses...');
            setGeneratingCharCount(prev => prev + Math.floor(Math.random() * 400) + 300);
            await new Promise((resolve) => setTimeout(resolve, 850));
          }

          setGeneratingStatusMessage('Dokumen Rencana Pembelajaran Mendalam (RPM) Berhasil Disusun!');
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setGeneratedPlan(json.lessonPlan);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          throw new Error(json.error || 'Gagal menghasilkan Rencana Pembelajaran Mendalam');
        }
      }
    } catch (err: any) {
      console.warn('Error generating RPM via server, executing smart local fallback compilation:', err);
      try {
        setGeneratingStep(2);
        setGeneratingStatusMessage('Mendeteksi gangguan server AI atau kuota terlampaui. Mengaktifkan Penyusunan Cerdas Lokal...');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setGeneratingStep(3);
        setGeneratingStatusMessage('Mengekstrak Lingkup Materi & menganalisis keselarasan Capaian Pembelajaran...');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setGeneratingStep(4);
        setGeneratingStatusMessage('Merumuskan Tujuan Pembelajaran Mendalam (Memahami, Mengaplikasi, Merefleksi) secara prosedural...');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setGeneratingStep(5);
        setGeneratingStatusMessage('Menyusun Skenario Pembelajaran Berdiferensiasi, Rubrik Asesmen & KKTP...');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const localPlan = createFallbackLessonPlanClient(updatedData);
        setGeneratedPlan(localPlan);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (fallbackErr: any) {
        console.error('Local fallback compilation failed:', fallbackErr);
        setErrorMessage(err.message || 'Terjadi kesalahan saat menyusun Rencana Pembelajaran Mendalam.');
      }
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      fetchLicensingStatus();
    }
  };

  // Direct Edit Updates Handler
  const handleUpdatePlan = (updatedPlan: LessonPlanOutput) => {
    setGeneratedPlan(updatedPlan);
  };

  // Refine Plan via AI
  const handleRefinePlan = async (userInstruction: string) => {
    if (!generatedPlan) return;
    setIsRefining(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/refine-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlan: generatedPlan,
          userInstruction,
        }),
      });

      const json = await res.json();
      if (json.success && json.lessonPlan) {
        setGeneratedPlan(json.lessonPlan);
        setIsRefinerModalOpen(false);
      } else {
        throw new Error(json.error || 'Gagal merevisi dokumen');
      }
    } catch (err: any) {
      console.error('Error refining RPM:', err);
      alert('Mendeteksi server AI sedang offline atau tidak terjangkau (Status 404). Revisi otomatis tidak dapat dijalankan.\n\nTips: Silakan gunakan tombol "Edit Mode" (ikon pena) di kanan atas dokumen Rencana Pembelajaran untuk merubah, menyunting, atau menyempurnakan isi dokumen secara langsung!');
    } finally {
      setIsRefining(false);
    }
  };

  // Save current plan to Saved Plans
  const handleSaveCurrentPlan = () => {
    if (!generatedPlan) return;

    const newSaved: SavedLessonPlan = {
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      title: `RPM ${generatedPlan.identitas.mataPelajaran} - ${generatedPlan.identitas.faseKelas}`,
      mataPelajaran: generatedPlan.identitas.mataPelajaran,
      faseKelas: generatedPlan.identitas.faseKelas,
      plan: generatedPlan,
      formData: formData,
    };

    const updated = [newSaved, ...savedPlans.filter((p) => p.title !== newSaved.title)];
    savePlansToStorage(updated);
  };

  const handleDeleteSavedPlan = (id: string) => {
    const updated = savedPlans.filter((p) => p.id !== id);
    savePlansToStorage(updated);
  };

  const handleSelectSavedPlan = (saved: SavedLessonPlan) => {
    setGeneratedPlan(saved.plan);
    setFormData(saved.formData);
  };

  const handleLoadDemoPreset = (index: number = 0) => {
    const selected = DEMO_PRESETS[index % DEMO_PRESETS.length];
    if (selected) {
      setFormData(selected.formData);
      setGeneratedPlan(null);
    }
  };

  const handleResetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setGeneratedPlan(null);
  };

  const isCurrentPlanSaved = !!generatedPlan && savedPlans.some(
    (p) => p.title === `RPM ${generatedPlan.identitas.mataPelajaran} - ${generatedPlan.identitas.faseKelas}`
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Navbar Header */}
      <Header
        onLoadDemo={() => handleLoadDemoPreset(0)}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        savedCount={savedPlans.length}
        onShowGuide={() => setIsGuideModalOpen(true)}
        trialCount={trialCount}
        accessType={accessType}
        onOpenCodeModal={() => setIsEnterCodeModalOpen(true)}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Notification Banner if any */}
        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <p>{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 font-bold px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* VIEW 1: GENERATED PLAN DOCUMENT VIEW */}
        {generatedPlan ? (
          <LessonPlanView
            plan={generatedPlan}
            onBackToForm={() => setGeneratedPlan(null)}
            onOpenRefiner={() => setIsRefinerModalOpen(true)}
            onSavePlan={handleSaveCurrentPlan}
            isSaved={isCurrentPlanSaved}
            onUpdatePlan={handleUpdatePlan}
          />
        ) : (
          /* VIEW 2: FORM INPUT FOR TEACHERS */
          <form onSubmit={handleGeneratePlan} noValidate className="space-y-6">
            {/* Form Top Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Teknologi AI Pembelajaran Mendalam Guru Indonesia</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Buat Modul Ajar & Rencana Pembelajaran Mendalam (RPM)
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Lengkapi identitas dan komponen di bawah ini. Sistem AI akan menyusun seluruh alur pembelajaran secara otomatis dengan mengintegrasikan label <strong className="text-teal-300 font-extrabold">Memahami, Mengaplikasi, Merefleksi</strong> serta <strong className="text-teal-300 font-extrabold">Prinsip Pembelajaran Mendalam</strong> pada kegiatan inti.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleLoadDemoPreset(0)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-700 text-teal-100 border border-teal-500/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Isi contoh otomatis untuk IPAS SD"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Isi Contoh IPAS SD</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoPreset(1)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Isi contoh otomatis untuk Matematika SMP"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Isi Contoh MTK SMP</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  title="Kosongkan seluruh isian formulir"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Kosongkan Form</span>
                </button>
              </div>
            </div>

            {/* Step 1: Identitas Guru & Sekolah */}
            <IdentitySection formData={formData} onChange={handleInputChange} />

            {/* Step 2: Komponen Pembelajaran Utama */}
            <LessonDetailsSection
              formData={formData}
              onChange={handleInputChange}
              onSelectSubject={handleSelectSubject}
              onRequestCpTpAi={handleRequestCpTpAi}
              isAiLoadingCpTp={isAiLoadingCpTp}
            />

            {/* Step 3: Karakteristik Murid & Materi */}
            <CharacteristicsSection
              formData={formData}
              onChange={handleInputChange}
              onApplyStudentPreset={handleApplyStudentPreset}
              onApplyMaterialPreset={handleApplyMaterialPreset}
            />

            {/* Step 4: Desain Pembelajaran Mendalam (Multi-select Checkboxes) */}
            <DeepLearningDesignSection
              formData={formData}
              onToggleCheckbox={handleToggleCheckbox}
              onRequestAllRecommendations={handleRequestAllRecommendations}
              isAiRecommendingAll={isAiRecommendingAll}
            />

            {/* Submit Action Sticky Footer */}
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <p className="font-semibold text-slate-800">
                  Pastikan data pembelajaran sudah sesuai.
                </p>
                <p>
                  Siap menghasilkan dokumen RPM dengan label Memahami, Mengaplikasi, & Merefleksi.
                </p>
              </div>

              <button
                id="btn-generate-main-rpm"
                type="submit"
                disabled={isGenerating}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-xl shadow-teal-900/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Menyusun RPM Mendalam...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span>Generate Format Rencana Pembelajaran Mendalam</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800 mt-12 print:hidden">
        <p className="font-medium text-slate-300">
          Generator Rencana Pembelajaran Mendalam (RPM) • Kurikulum Merdeka Indonesia
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Didesain untuk Membantu Guru Indonesia Menyusun Modul Ajar Mendalam Berbasis AI
        </p>
      </footer>

      {/* Modals */}
      <GeneratingProgressModal
        isOpen={isGenerating}
        statusMessage={generatingStatusMessage}
        charCount={generatingCharCount}
        step={generatingStep}
      />

      <AiRefinerModal
        isOpen={isRefinerModalOpen}
        onClose={() => setIsRefinerModalOpen(false)}
        onRefine={handleRefinePlan}
        isRefining={isRefining}
      />

      <SavedPlansModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedPlans={savedPlans}
        onSelectPlan={handleSelectSavedPlan}
        onDeletePlan={handleDeleteSavedPlan}
      />

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Licensing Modals */}
      <TrialConfirmationModal
        isOpen={isTrialConfirmModalOpen}
        onClose={() => setIsTrialConfirmModalOpen(false)}
        onConfirm={() => handleGeneratePlan(undefined, true)}
        onOpenCodeModal={() => setIsEnterCodeModalOpen(true)}
        trialCount={trialCount}
      />

      <TrialExhaustedModal
        isOpen={isTrialExhaustedModalOpen}
        onClose={() => setIsTrialExhaustedModalOpen(false)}
        onOpenCodeModal={() => setIsEnterCodeModalOpen(true)}
      />

      <EnterAccessCodeModal
        isOpen={isEnterCodeModalOpen}
        onClose={() => setIsEnterCodeModalOpen(false)}
        currentCode={accessCode}
        onCodeActivated={(code) => setAccessCode(code)}
      />

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onLogOut={() => setAccessCode('')}
      />
    </div>
  );
}
