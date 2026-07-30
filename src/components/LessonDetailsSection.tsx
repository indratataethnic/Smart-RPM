import React from 'react';
import { BookOpen, Sparkles, Clock, Target, FileCode, Loader2 } from 'lucide-react';
import { LessonFormData } from '../types';
import { MATA_PELAJARAN_POPULER, ALOKASI_WAKTU_OPTIONS } from '../data/presets';

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
          disabled={isAiLoadingCpTp || !formData.mataPelajaran}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isAiLoadingCpTp ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Membuat CP/TP AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Saran CP & TP dari AI</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {/* Mata Pelajaran & Quick Select Chips */}
        <div>
          <label htmlFor="input-mataPelajaran" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            Mata Pelajaran <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-mataPelajaran"
            type="text"
            name="mataPelajaran"
            value={formData.mataPelajaran}
            onChange={onChange}
            placeholder="Pilih dari rekomendasi di bawah atau ketik nama mata pelajaran..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none mb-2"
            required
          />

          {/* Quick Subject Chips */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-[11px] text-slate-400 font-medium self-center mr-1">Rekomendasi Cepat:</span>
            {MATA_PELAJARAN_POPULER.slice(0, 8).map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => onSelectSubject(subject)}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                  formData.mataPelajaran === subject
                    ? 'bg-teal-600 text-white border-teal-600 font-medium shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        {/* Lingkup Materi */}
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
            placeholder="Contoh: Wujud Zat dan Perubahannya / Teorema Pythagoras / Teks Eksposisi"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
            required
          />
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
            placeholder="Ketikkan teks CP resmi dari Keputusan BSKAP atau klik 'Saran CP & TP dari AI' di atas untuk mengisi otomatis..."
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
            placeholder="1. Peserta didik dapat mengidentifikasi...\n2. Peserta didik mampu menganalisis...\n3. Peserta didik mampu merefleksikan..."
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
