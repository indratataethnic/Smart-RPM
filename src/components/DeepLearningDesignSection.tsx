import React from 'react';
import { Award, Cpu, Users, Monitor, Sparkles, Check, Loader2 } from 'lucide-react';
import { LessonFormData } from '../types';
import {
  DPL_OPTIONS,
  METODE_MODEL_OPTIONS,
  KEMITRAAN_OPTIONS,
  DIGITAL_TOOLS_OPTIONS,
} from '../data/presets';

interface DeepLearningDesignSectionProps {
  formData: LessonFormData;
  onToggleCheckbox: (category: 'dpl' | 'metodeModel' | 'kemitraan' | 'pemanfaatanDigital', itemLabel: string) => void;
  onRequestAllRecommendations: () => void;
  isAiRecommendingAll: boolean;
}

export const DeepLearningDesignSection: React.FC<DeepLearningDesignSectionProps> = ({
  formData,
  onToggleCheckbox,
  onRequestAllRecommendations,
  isAiRecommendingAll,
}) => {
  return (
    <div id="section-deep-learning-design" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
            4
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Desain Pembelajaran Mendalam & Kemitraan Digital
            </h2>
            <p className="text-xs text-slate-500">
              Pilih opsi centang di bawah ini atau gunakan rekomendasi kecerdasan buatan (AI)
            </p>
          </div>
        </div>

        <button
          id="btn-ai-all-recommendations"
          type="button"
          onClick={onRequestAllRecommendations}
          disabled={isAiRecommendingAll || !formData.mataPelajaran}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isAiRecommendingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menganalisis Kebutuhan via AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Rekomendasi AI Otomatis (DPL, Metode, Digital)</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* 1. Dimensi Profil Lulusan (DPL) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-600" />
              Dimensi Profil Lulusan / DPL (Profil Pelajar Pancasila) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
              Terpilih: {formData.dpl.length} opsi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {DPL_OPTIONS.map((item) => {
              const isChecked = formData.dpl.includes(item.label);
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleCheckbox('dpl', item.label)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    isChecked
                      ? 'bg-teal-50/70 border-teal-500 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-all ${
                      isChecked ? 'bg-teal-600 text-white' : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-snug">
                      {item.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Metode & Model Pembelajaran */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Metode & Model Pembelajaran (Deep Learning) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              Terpilih: {formData.metodeModel.length} opsi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {METODE_MODEL_OPTIONS.map((item) => {
              const isChecked = formData.metodeModel.includes(item.label);
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleCheckbox('metodeModel', item.label)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all ${
                      isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 font-medium shrink-0">
                    {item.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Kemitraan Pembelajaran */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-600" />
              Kemitraan Pembelajaran (Mitra Pembelajaran) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full font-medium">
              Terpilih: {formData.kemitraan.length} opsi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {KEMITRAAN_OPTIONS.map((item) => {
              const isChecked = formData.kemitraan.includes(item.label);
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleCheckbox('kemitraan', item.label)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    isChecked
                      ? 'bg-cyan-50/70 border-cyan-500 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-all ${
                      isChecked ? 'bg-cyan-600 text-white' : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 leading-snug">
                      {item.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Pemanfaatan Digital */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-indigo-600" />
              Pemanfaatan Digital (Teknologi & Aplikasi) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
              Terpilih: {formData.pemanfaatanDigital.length} opsi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DIGITAL_TOOLS_OPTIONS.map((item) => {
              const isChecked = formData.pemanfaatanDigital.includes(item.label);
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleCheckbox('pemanfaatanDigital', item.label)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                    isChecked
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all ${
                      isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-800 block truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100/70 text-indigo-700 font-medium shrink-0">
                    {item.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
