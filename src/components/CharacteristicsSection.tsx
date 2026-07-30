import React from 'react';
import { Users, BookCheck, Lightbulb } from 'lucide-react';
import { LessonFormData } from '../types';
import { KARAKTERISTIK_MURID_PRESETS, KARAKTERISTIK_MATERI_PRESETS } from '../data/presets';

interface CharacteristicsSectionProps {
  formData: LessonFormData;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onApplyStudentPreset: (text: string) => void;
  onApplyMaterialPreset: (text: string) => void;
}

export const CharacteristicsSection: React.FC<CharacteristicsSectionProps> = ({
  formData,
  onChange,
  onApplyStudentPreset,
  onApplyMaterialPreset,
}) => {
  return (
    <div id="section-characteristics" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
          3
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            Identifikasi & Analisis Karakteristik
          </h2>
          <p className="text-xs text-slate-500">
            Analisis kebutuhan belajar murid dan karakteristik materi pembelajaran mendalam
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Karakteristik Murid */}
        <div>
          <label htmlFor="textarea-karakteristikMurid" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            Karakteristik Murid (Identifikasi Kebutuhan & Gaya Belajar)
          </label>
          <textarea
            id="textarea-karakteristikMurid"
            name="karakteristikMurid"
            rows={4}
            value={formData.karakteristikMurid}
            onChange={onChange}
            placeholder="Isikan analisis karakteristik murid (kebutuhan belajar, minat, latar belakang, kesiapan belajar, gaya belajar Visual/Auditori/Kinestetik)..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none mb-2"
          />

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-500" /> Rekomendasi Opsi Cepat:
            </span>
            <div className="flex flex-col gap-1.5">
              {KARAKTERISTIK_MURID_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onApplyStudentPreset(preset)}
                  className="text-left text-[11px] p-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-600 hover:text-teal-900 transition-all cursor-pointer leading-relaxed"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Karakteristik Materi */}
        <div>
          <label htmlFor="textarea-karakteristikMateri" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <BookCheck className="w-3.5 h-3.5 text-teal-600" />
            Karakteristik Materi (Analisis Sifat Materi)
          </label>
          <textarea
            id="textarea-karakteristikMateri"
            name="karakteristikMateri"
            rows={4}
            value={formData.karakteristikMateri}
            onChange={onChange}
            placeholder="Isikan analisis karakteristik materi (tingkat kesulitan, konseptual/prosedural, konkret/abstrak, relevansi dunia nyata)..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none mb-2"
          />

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-500" /> Rekomendasi Opsi Cepat:
            </span>
            <div className="flex flex-col gap-1.5">
              {KARAKTERISTIK_MATERI_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onApplyMaterialPreset(preset)}
                  className="text-left text-[11px] p-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-600 hover:text-teal-900 transition-all cursor-pointer leading-relaxed"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
