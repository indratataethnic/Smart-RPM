import React from 'react';
import { Sparkles, CheckCircle2, Clock, Cpu, FileText } from 'lucide-react';

interface GeneratingProgressModalProps {
  isOpen: boolean;
  statusMessage: string;
  charCount: number;
  step: number;
}

export const GeneratingProgressModal: React.FC<GeneratingProgressModalProps> = ({
  isOpen,
  statusMessage,
  charCount,
  step,
}) => {
  if (!isOpen) return null;

  const steps = [
    { num: 1, label: 'Identitas & Analisis CP/TP' },
    { num: 2, label: 'Alur Deep Learning' },
    { num: 3, label: 'Aktivitas Guru & Murid' },
    { num: 4, label: 'Asesmen & Rubrik KKTP' },
    { num: 5, label: 'Finalisasi Dokumen RPM' },
  ];

  const currentStep = Math.min(Math.max(step, 1), 5);
  const progressPercent = Math.min(currentStep * 20, 95);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-teal-100 relative overflow-hidden">
        {/* Top Decorative Background Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Badge & Title */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span>AI Studio Engine Sedang Bekerja...</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Menyusun Rencana Pembelajaran Mendalam (RPM)
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Sistem sedang menyusun modul ajar lengkap berbasis Deep Learning (<strong className="text-teal-700">Memahami, Mengaplikasi, Merefleksi</strong>) beserta Lampiran LKPD, Rubrik & KKTP.
          </p>
        </div>

        {/* Dynamic Reassuring Status Box */}
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-4 rounded-2xl shadow-inner border border-slate-800 space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0 mt-0.5 animate-pulse">
              <Cpu className="w-5 h-5 text-teal-300" />
            </div>
            <div className="space-y-1 text-left flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">
                Status Generasi Saat Ini
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
                {statusMessage || 'Sedang memproses... Mohon tunggu sejenak, dokumen akan segera selesai.'}
              </p>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[11px] text-slate-300 font-medium">
              <span>Kemajuan Penyusunan</span>
              <span className="font-bold text-teal-300">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Live Streaming Character Counter */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              Teks Ter-generate Streaming:
            </span>
            <span className="font-mono font-bold text-teal-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {charCount > 0 ? `${charCount.toLocaleString('id-ID')} Karakter` : 'Memulai...'}
            </span>
          </div>
        </div>

        {/* Step Timeline */}
        <div className="space-y-2 mb-6">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-left">
            Tahapan Penyusunan RPM:
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {steps.map((st) => {
              const isCompleted = st.num < currentStep;
              const isCurrent = st.num === currentStep;

              return (
                <div
                  key={st.num}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isCompleted
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : isCurrent
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-xs ring-2 ring-teal-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center mb-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping" />
                    ) : (
                      <span className="text-[10px] text-slate-400">{st.num}</span>
                    )}
                  </div>
                  <p className="text-[9px] leading-tight line-clamp-2">{st.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comforting Reassuring Footer Banner */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 flex items-center gap-2.5 text-left text-amber-900 text-xs">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="leading-relaxed text-[11px]">
            <strong>Catatan Guru:</strong> Proses ini membutuhkan waktu beberapa detik karena AI menyusun seluruh komponen pembelajaran secara mendalam dan terstruktur. Harap tidak menutup halaman ini.
          </p>
        </div>
      </div>
    </div>
  );
};
