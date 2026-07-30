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
import { DEMO_PRESETS, getKelasOptions, DPL_OPTIONS, METODE_MODEL_OPTIONS, KEMITRAAN_OPTIONS, DIGITAL_TOOLS_OPTIONS } from './data/presets';
import { Sparkles, Loader2, ArrowRight, RotateCcw, AlertCircle, Trash2 } from 'lucide-react';

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
    category: 'dpl' | 'metodeModel' | 'kemitraan' | 'pemanfaatanDigital',
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

  // AI Assistant for CP & TP
  const handleRequestCpTpAi = async () => {
    if (!formData.mataPelajaran) {
      alert('Silakan pilih atau ketik Nama Mata Pelajaran terlebih dahulu.');
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
          mataPelajaran: formData.mataPelajaran,
          faseKelas: formData.faseKelas,
          lingkupMateri: formData.lingkupMateri,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setFormData((prev) => ({
          ...prev,
          capaianPembelajaran: json.data.cp || prev.capaianPembelajaran,
          tujuanPembelajaran: json.data.tp || prev.tujuanPembelajaran,
          lingkupMateri: json.data.lingkupMateri || json.data.materi || prev.lingkupMateri,
        }));
      } else {
        throw new Error(json.error || 'Gagal mengambil saran CP/TP');
      }
    } catch (err: any) {
      console.error('Error in CP/TP AI:', err);
      setErrorMessage(err.message || 'Gagal mengambil saran CP/TP dari AI.');
    } finally {
      setIsAiLoadingCpTp(false);
    }
  };

  // AI Assistant for All Recommendations (DPL, Methods, Kemitraan, Digital)
  const handleRequestAllRecommendations = async () => {
    if (!formData.mataPelajaran) {
      alert('Silakan isi Mata Pelajaran terlebih dahulu.');
      return;
    }

    setIsAiRecommendingAll(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/recommend-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldType: 'recommendations_all',
          mataPelajaran: formData.mataPelajaran,
          faseKelas: formData.faseKelas,
          lingkupMateri: formData.lingkupMateri,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const newDpl = matchOptionLabels(d.recommendedDpl, DPL_OPTIONS, 2, 3);
        const newMethods = matchOptionLabels(d.recommendedMethods, METODE_MODEL_OPTIONS, 2, 3);
        const newPartnerships = matchOptionLabels(d.recommendedPartnerships, KEMITRAAN_OPTIONS, 2, 3);
        const newDigital = matchOptionLabels(d.recommendedDigitalTools, DIGITAL_TOOLS_OPTIONS, 2, 3);

        setFormData((prev) => ({
          ...prev,
          dpl: newDpl,
          metodeModel: newMethods,
          kemitraan: newPartnerships,
          pemanfaatanDigital: newDigital,
          karakteristikMurid: d.studentCharacteristics || prev.karakteristikMurid,
          karakteristikMateri: d.materialCharacteristics || prev.karakteristikMateri,
        }));
      } else {
        throw new Error(json.error || 'Gagal mengambil rekomendasi');
      }
    } catch (err: any) {
      console.error('Error in All Recommendations AI:', err);
      setErrorMessage(err.message || 'Gagal mengambil rekomendasi otomatis dari AI.');
    } finally {
      setIsAiRecommendingAll(false);
    }
  };

  // Main Submit Handler to Generate RPM with Streaming SSE
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.mataPelajaran || !formData.capaianPembelajaran || !formData.tujuanPembelajaran) {
      alert('Mohon lengkapi Mata Pelajaran, Capaian Pembelajaran, dan Tujuan Pembelajaran.');
      return;
    }

    setIsGenerating(true);
    setGeneratingStatusMessage('Menganalisis data CP, TP, dan Identitas Pembelajaran Guru...');
    setGeneratingCharCount(0);
    setGeneratingStep(1);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
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
                if (data.message) setGeneratingStatusMessage(data.message);
                if (data.step) setGeneratingStep(data.step);
              } else if (data.type === 'chunk') {
                if (typeof data.length === 'number') setGeneratingCharCount(data.length);
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
          setGeneratedPlan(finalPlan);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          throw new Error('Sistem AI belum menyelesaikan penyusunan dokumen. Silakan coba kembali.');
        }
      } else {
        const json = await res.json();
        if (json.success && json.lessonPlan) {
          setGeneratedPlan(json.lessonPlan);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          throw new Error(json.error || 'Gagal menghasilkan Rencana Pembelajaran Mendalam');
        }
      }
    } catch (err: any) {
      console.error('Error generating RPM:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyusun Rencana Pembelajaran Mendalam.');
    } finally {
      setIsGenerating(false);
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
      alert('Gagal merevisi dokumen: ' + (err.message || 'Error'));
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
          <form onSubmit={handleGeneratePlan} className="space-y-6">
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
    </div>
  );
}
