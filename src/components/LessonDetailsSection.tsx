import React from 'react';
import { BookOpen, Sparkles, Clock, Target, FileCode, Loader2, Cpu } from 'lucide-react';
import { LessonFormData } from '../types';
import { getMataPelajaranByFase, ALOKASI_WAKTU_OPTIONS } from '../data/presets';

interface LessonDetailsSectionProps {
  formData: LessonFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSelectSubject: (subject: string) => void;
  onRequestCpTpAi: () => void;
  isAiLoadingCpTp: boolean;
}

export const LessonDetailsSection: React.FC<LessonDetailsSectionProps> = ({
  formData,
  onChange,
  onSelectSubject,
  onRequestCpTpAi,
  isAiLoadingCpTp,
}) => {
  const isFaseC = 
    (formData.fase && formData.fase.includes('Fase C')) ||
    (formData.kelas && (formData.kelas.includes('Kelas 5') || formData.kelas.includes('Kelas 6'))) ||
    (formData.faseKelas && (formData.faseKelas.includes('Fase C') || formData.faseKelas.includes('Kelas 5') || formData.faseKelas.includes('Kelas 6')));

  const recommendedSubjects = getMataPelajaranByFase(formData.fase, formData.kelas);

  return (
    <div id="section-lesson-details" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Komponen Pembelajaran Utama
            </h2>
            <p className="text-xs text-slate-500">
              Mata pelajaran, Capaian Pembelajaran (CP), Lingkup Materi, dan Tujuan Pembelajaran (TP)
            </p>
          </div>
        </div>

        <button
          id="btn-ai-cp-tp"
          type="button"
          onClick={onRequestCpTpAi}
          disabled={isAiLoadingCpTp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isAiLoadingCpTp ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Membuat TP & Materi...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Saran TP & Materi dari AI</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {/* Mata Pelajaran & Quick Select Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <label htmlFor="input-mataPelajaran" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            {isFaseC && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                <Cpu className="w-3 h-3 text-emerald-600" />
                Tersedia KKA (Koding & AI) untuk Fase C (Kelas 5-6)
              </span>
            )}
          </div>
          <input
            id="input-mataPelajaran"
            type="text"
            name="mataPelajaran"
            value={formData.mataPelajaran}
            onChange={onChange}
            placeholder="Isikan mata pelajaran (pilih dari rekomendasi di bawah atau ketik nama mata pelajaran)..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none mb-2"
            required
          />

          {/* Quick Subject Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[11px] text-slate-400 font-medium self-center mr-1">Rekomendasi Cepat:</span>
            {recommendedSubjects.map((subject) => {
              const isKka = subject.includes('Koding dan Kecerdasan Artifisial') || subject.includes('KKA');
              const isSelected = formData.mataPelajaran === subject;

              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => onSelectSubject(subject)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer border flex items-center gap-1 ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-600 font-semibold shadow-xs'
                      : isKka
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {isKka && <Cpu className={`w-3 h-3 ${isSelected ? 'text-emerald-200' : 'text-emerald-600'}`} />}
                  <span>{subject}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Capaian Pembelajaran (CP) */}
        <div>
          <label htmlFor="textarea-capaianPembelajaran" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-teal-600" />
              Capaian Pembelajaran (CP) Kurikulum Merdeka <span className="text-rose-500">*</span>
            </span>
          </label>
          <textarea
            id="textarea-capaianPembelajaran"
            name="capaianPembelajaran"
            rows={3}
            value={formData.capaianPembelajaran}
            onChange={onChange}
            placeholder="Ketik/isikan Capaian Pembelajaran (CP) Kurikulum Merdeka di sini terlebih dahulu, lalu klik tombol 'Saran TP & Materi dari AI' di atas untuk merumuskan Tujuan Pembelajaran & Lingkup Materi secara otomatis..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
            required
          />
        </div>

        {/* Tujuan Pembelajaran (TP) */}
        <div>
          <label htmlFor="textarea-tujuanPembelajaran" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            Tujuan Pembelajaran (TP) <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="textarea-tujuanPembelajaran"
            name="tujuanPembelajaran"
            rows={3}
            value={formData.tujuanPembelajaran}
            onChange={onChange}
            placeholder="Isikan Tujuan Pembelajaran (TP) (contoh: 1. Peserta didik dapat mengidentifikasi...\n2. Peserta didik mampu menganalisis...)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
            required
          />
        </div>

        {/* Lingkup Materi / Topik Pembelajaran */}
        <div>
          <label htmlFor="textarea-lingkupMateri" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-teal-600" />
            Lingkup Materi / Topik Pembelajaran <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="textarea-lingkupMateri"
            name="lingkupMateri"
            rows={2}
            value={formData.lingkupMateri}
            onChange={onChange}
            placeholder="Isikan lingkup materi / topik pembelajaran (contoh: Wujud Zat dan Perubahannya / Teks Eksposisi)..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
            required
          />
        </div>

        {/* Alokasi Waktu */}
        <div>
          <label htmlFor="select-alokasiWaktu" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            Alokasi Waktu <span className="text-rose-500">*</span>
          </label>
          <select
            id="select-alokasiWaktu"
            name="alokasiWaktu"
            value={formData.alokasiWaktu}
            onChange={onChange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none bg-white"
            required
          >
            {ALOKASI_WAKTU_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
