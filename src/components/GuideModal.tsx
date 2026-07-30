import React from 'react';
import { X, BookOpen, Lightbulb, CheckCircle2, ShieldCheck } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Panduan Rencana Pembelajaran Mendalam (RPM)
            </h3>
            <p className="text-xs text-slate-500">
              Konsep dasar Pembelajaran Mendalam (Deep Learning) Kurikulum Merdeka
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
            <h4 className="font-bold text-teal-900 mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-teal-600" />
              Apa itu Pembelajaran Mendalam (Deep Learning)?
            </h4>
            <p className="text-slate-700 text-xs">
              Pembelajaran Mendalam berfokus pada penguasaan konsep esensial secara bermakna, bukan sekadar menghafal fakta atau menuntaskan materi secara permukaan. Murid diajak untuk memahami esensi, mengaplikasikan konsep pada situasi nyata, serta merefleksikan makna belajar.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              3 Pilar Tahapan Kegiatan Inti RPM:
            </h4>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
              <span className="font-bold text-blue-900 block text-xs uppercase mb-1">
                1. Label MEMAHAMI (Understanding & Concept Discovery)
              </span>
              <p className="text-xs text-slate-700">
                Murid mengeksplorasi konsep dasar, menghubungkan pengetahuan awal dengan konsep baru, menjawab pertanyaan pemantik, serta melakukan observasi atau simulasi interaktif.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <span className="font-bold text-emerald-900 block text-xs uppercase mb-1">
                2. Label MENGAPLIKASI (Application & Deep Problem Solving)
              </span>
              <p className="text-xs text-slate-700">
                Murid menerapkan pemahamannya untuk memecahkan masalah nyata, membuat produk/karya kolaboratif, menganalisis studi kasus, serta berinteraksi dalam tim.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
              <span className="font-bold text-purple-900 block text-xs uppercase mb-1">
                3. Label MEREFLEKSI (Reflection, Metacognition & Self-Evaluation)
              </span>
              <p className="text-xs text-slate-700">
                Murid mengevaluasi pemahaman diri, menyimpulkan makna pembelajaran bagi kehidupan sehari-hari, serta merencanakan perbaikan/tindak lanjut.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-1 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Prinsip Pembelajaran Mendalam
            </h4>
            <p className="text-xs text-slate-700">
              Setiap kegiatan dilengkapi label prinsip seperti <span className="font-semibold text-slate-900">Berpusat Pada Siswa, Authentic Context, High Order Thinking (HOTS), Joyful Learning,</span> dan <span className="font-semibold text-slate-900">Feedback Loop</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
