import React from 'react';
import { UserCheck, Building2, User, Award, Calendar, Layers, GraduationCap } from 'lucide-react';
import { LessonFormData } from '../types';
import { FASE_OPTIONS, getKelasOptions } from '../data/presets';

interface IdentitySectionProps {
  formData: LessonFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({ formData, onChange }) => {
  const kelasOptions = getKelasOptions(formData.fase || 'Fase B');
  return (
    <div id="section-identity" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
          1
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            Identitas Guru & Instansi Sekolah
          </h2>
          <p className="text-xs text-slate-500">
            Data identitas untuk lembar dokumen dan pengesahan resmi RPM
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nama Sekolah */}
        <div className="md:col-span-2">
          <label htmlFor="input-namaSekolah" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            Nama Sekolah / Instansi Pendidikan <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-namaSekolah"
            type="text"
            name="namaSekolah"
            value={formData.namaSekolah}
            onChange={onChange}
            placeholder="Isikan nama sekolah / instansi pendidikan..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
            required
          />
        </div>

        {/* Nama Guru */}
        <div>
          <label htmlFor="input-namaGuru" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-teal-600" />
            Nama Guru Pengampu <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-namaGuru"
            type="text"
            name="namaGuru"
            value={formData.namaGuru}
            onChange={onChange}
            placeholder="Isikan nama guru pengampu beserta gelar..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
            required
          />
        </div>

        {/* NIP Guru */}
        <div>
          <label htmlFor="input-nipGuru" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            NIP Guru
          </label>
          <input
            id="input-nipGuru"
            type="text"
            name="nipGuru"
            value={formData.nipGuru}
            onChange={onChange}
            placeholder="Isikan NIP guru pengampu (contoh: 19900515 201801 1 002 / -)..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
          />
        </div>

        {/* Nama Kepsek (dibawah Nama Guru) */}
        <div>
          <label htmlFor="input-namaKepsek" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            Nama Kepala Sekolah
          </label>
          <input
            id="input-namaKepsek"
            type="text"
            name="namaKepsek"
            value={formData.namaKepsek}
            onChange={onChange}
            placeholder="Isikan nama kepala sekolah beserta gelar..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
          />
        </div>

        {/* NIP Kepsek (dibawah NIP Guru) */}
        <div>
          <label htmlFor="input-nipKepsek" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            NIP Kepala Sekolah
          </label>
          <input
            id="input-nipKepsek"
            type="text"
            name="nipKepsek"
            value={formData.nipKepsek}
            onChange={onChange}
            placeholder="Isikan NIP kepala sekolah (contoh: 19680312 199303 1 005 / -)..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
          />
        </div>

        {/* Fase Kurikulum */}
        <div>
          <label htmlFor="select-fase" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            Fase Kurikulum <span className="text-rose-500">*</span>
          </label>
          <select
            id="select-fase"
            name="fase"
            value={formData.fase || 'Fase B'}
            onChange={onChange}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none bg-white font-medium"
            required
          >
            {FASE_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Kelas yang Diampu (dibawah / bersandingan dengan Fase Kurikulum) */}
        <div>
          <label htmlFor="select-kelas" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            Kelas yang Diampu <span className="text-rose-500">*</span>
          </label>
          <select
            id="select-kelas"
            name="kelas"
            value={formData.kelas || kelasOptions[0] || ''}
            onChange={onChange}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none bg-white font-medium"
            required
          >
            {kelasOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Semester & Tahun */}
        <div className="md:col-span-2">
          <label htmlFor="input-semesterTahun" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Semester & Tahun Ajaran
          </label>
          <input
            id="input-semesterTahun"
            type="text"
            name="semesterTahun"
            value={formData.semesterTahun}
            onChange={onChange}
            placeholder="Isikan semester dan tahun ajaran (contoh: Semester 1 / TA 2025/2026)..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 transition-all outline-none"
          />
        </div>
      </div>
    </div>
  );
};
