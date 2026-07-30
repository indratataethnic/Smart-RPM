import React, { useState } from 'react';
import { Award, Cpu, Users, Monitor, BookOpen, Compass, Sparkles, Check, Loader2, Plus, X } from 'lucide-react';
import { LessonFormData } from '../types';
import {
  DPL_OPTIONS,
  METODE_MODEL_OPTIONS,
  KEMITRAAN_OPTIONS,
  DIGITAL_TOOLS_OPTIONS,
  LINTAS_DISIPLIN_OPTIONS,
  LINGKUNGAN_PEMBELAJARAN_OPTIONS,
} from '../data/presets';

interface DeepLearningDesignSectionProps {
  formData: LessonFormData;
  onToggleCheckbox: (
    category: 'dpl' | 'metodeModel' | 'kemitraan' | 'pemanfaatanDigital' | 'lintasDisiplin' | 'lingkunganPembelajaran',
    itemLabel: string
  ) => void;
  onRequestAllRecommendations: () => void;
  isAiRecommendingAll: boolean;
}

const CustomOptionInput: React.FC<{
  placeholder: string;
  onAdd: (text: string) => void;
  buttonBgClass?: string;
}> = ({ placeholder, onAdd, buttonBgClass = 'bg-teal-600 hover:bg-teal-700' }) => {
  const [val, setVal] = useState('');

  const handleAdd = () => {
    const trimmed = val.trim();
    if (trimmed) {
      onAdd(trimmed);
      setVal('');
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2.5">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder={placeholder}
        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!val.trim()}
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl text-white transition-all disabled:opacity-40 cursor-pointer ${buttonBgClass}`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Tambah</span>
      </button>
    </div>
  );
};

const CustomOptionsBadges: React.FC<{
  selectedList: string[];
  presetOptions: { label: string }[];
  onRemove: (label: string) => void;
  bgColorClass?: string;
  borderColorClass?: string;
  textColorClass?: string;
}> = ({ selectedList, presetOptions, onRemove, bgColorClass = 'bg-slate-100', borderColorClass = 'border-slate-300', textColorClass = 'text-slate-800' }) => {
  const presetLabels = new Set(presetOptions.map((o) => o.label));
  const customSelected = selectedList.filter((label) => !presetLabels.has(label));

  if (customSelected.length === 0) return null;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Opsi Tambahan (Kustom):</span>
      {customSelected.map((item) => (
        <span
          key={item}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-2xs ${bgColorClass} ${borderColorClass} ${textColorClass}`}
        >
          <Check className="w-3 h-3 stroke-[2.5]" />
          <span>{item}</span>
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
            title="Hapus opsi kustom ini"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
};

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
              Pilih opsi di bawah ini, tambah opsi sendiri (Lainnya), atau gunakan rekomendasi AI otomatis (1-3 opsi)
            </p>
          </div>
        </div>

        <button
          id="btn-ai-all-recommendations"
          type="button"
          onClick={onRequestAllRecommendations}
          disabled={isAiRecommendingAll}
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
              <span>Rekomendasi AI Otomatis (1-3 Opsi DPL, Metode, Digital)</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* 1. Dimensi Profil Lulusan (8 DPL) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-600" />
              Dimensi Profil Lulusan / DPL (8 Dimensi Profil Pelajar) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
              Terpilih: {formData.dpl.length} opsi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
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
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-all shrink-0 ${
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

          <CustomOptionInput
            placeholder="+ Tambah DPL Lainnya (Mengisi Sendiri)..."
            onAdd={(text) => onToggleCheckbox('dpl', text)}
            buttonBgClass="bg-teal-600 hover:bg-teal-700"
          />
          <CustomOptionsBadges
            selectedList={formData.dpl}
            presetOptions={DPL_OPTIONS}
            onRemove={(item) => onToggleCheckbox('dpl', item)}
            bgColorClass="bg-teal-50"
            borderColorClass="border-teal-300"
            textColorClass="text-teal-900"
          />
        </div>

        {/* 2. Metode & Model Pembelajaran */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Metode & Model Pembelajaran (Deep Learning & TPACK) <span className="text-rose-500">*</span>
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
                    <span className="text-xs font-semibold text-slate-800 block truncate" title={item.label}>
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

          <CustomOptionInput
            placeholder="+ Tambah Metode / Pendekatan Lainnya (Mengisi Sendiri)..."
            onAdd={(text) => onToggleCheckbox('metodeModel', text)}
            buttonBgClass="bg-emerald-600 hover:bg-emerald-700"
          />
          <CustomOptionsBadges
            selectedList={formData.metodeModel}
            presetOptions={METODE_MODEL_OPTIONS}
            onRemove={(item) => onToggleCheckbox('metodeModel', item)}
            bgColorClass="bg-emerald-50"
            borderColorClass="border-emerald-300"
            textColorClass="text-emerald-900"
          />
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
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-all shrink-0 ${
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

          <CustomOptionInput
            placeholder="+ Tambah Mitra Pembelajaran Lainnya (Mengisi Sendiri)..."
            onAdd={(text) => onToggleCheckbox('kemitraan', text)}
            buttonBgClass="bg-cyan-600 hover:bg-cyan-700"
          />
          <CustomOptionsBadges
            selectedList={formData.kemitraan}
            presetOptions={KEMITRAAN_OPTIONS}
            onRemove={(item) => onToggleCheckbox('kemitraan', item)}
            bgColorClass="bg-cyan-50"
            borderColorClass="border-cyan-300"
            textColorClass="text-cyan-900"
          />
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

          <CustomOptionInput
            placeholder="+ Tambah Aplikasi / Tool Digital Lainnya (Mengisi Sendiri)..."
            onAdd={(text) => onToggleCheckbox('pemanfaatanDigital', text)}
            buttonBgClass="bg-indigo-600 hover:bg-indigo-700"
          />
          <CustomOptionsBadges
            selectedList={formData.pemanfaatanDigital}
            presetOptions={DIGITAL_TOOLS_OPTIONS}
            onRemove={(item) => onToggleCheckbox('pemanfaatanDigital', item)}
            bgColorClass="bg-indigo-50"
            borderColorClass="border-indigo-300"
            textColorClass="text-indigo-900"
          />
        </div>

        {/* 5. Lintas Disiplin Ilmu */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Lintas Disiplin Ilmu (Integrasi Antar Mata Pelajaran) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
              Terpilih: {(formData.lintasDisiplin || []).length} opsi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {LINTAS_DISIPLIN_OPTIONS.map((item) => {
              const isChecked = (formData.lintasDisiplin || []).includes(item.label);
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleCheckbox('lintasDisiplin', item.label)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    isChecked
                      ? 'bg-amber-50/70 border-amber-500 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-all shrink-0 ${
                      isChecked ? 'bg-amber-600 text-white' : 'border border-slate-300 bg-white'
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

          <CustomOptionInput
            placeholder="+ Tambah Mata Pelajaran Lintas Disiplin (Mengisi Sendiri)..."
            onAdd={(text) => onToggleCheckbox('lintasDisiplin', text)}
            buttonBgClass="bg-amber-600 hover:bg-amber-700"
          />
          <CustomOptionsBadges
            selectedList={formData.lintasDisiplin || []}
            presetOptions={LINTAS_DISIPLIN_OPTIONS}
            onRemove={(item) => onToggleCheckbox('lintasDisiplin', item)}
            bgColorClass="bg-amber-50"
            borderColorClass="border-amber-300"
            textColorClass="text-amber-900"
          />
        </div>

        {/* 6. Lingkungan Pembelajaran */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-purple-600" />
              Lingkungan Pembelajaran (Setting & Tempat Belajar) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
              Terpilih: {(formData.lingkunganPembelajaran || []).length} opsi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {LINGKUNGAN_PEMBELAJARAN_OPTIONS.map((item) => {
              const isChecked = (formData.lingkunganPembelajaran || []).includes(item.label);
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleCheckbox('lingkunganPembelajaran', item.label)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    isChecked
                      ? 'bg-purple-50/70 border-purple-500 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-all shrink-0 ${
                      isChecked ? 'bg-purple-600 text-white' : 'border border-slate-300 bg-white'
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

          <CustomOptionInput
            placeholder="+ Tambah Lingkungan Pembelajaran Lainnya (Mengisi Sendiri)..."
            onAdd={(text) => onToggleCheckbox('lingkunganPembelajaran', text)}
            buttonBgClass="bg-purple-600 hover:bg-purple-700"
          />
          <CustomOptionsBadges
            selectedList={formData.lingkunganPembelajaran || []}
            presetOptions={LINGKUNGAN_PEMBELAJARAN_OPTIONS}
            onRemove={(item) => onToggleCheckbox('lingkunganPembelajaran', item)}
            bgColorClass="bg-purple-50"
            borderColorClass="border-purple-300"
            textColorClass="text-purple-900"
          />
        </div>
      </div>
    </div>
  );
};
