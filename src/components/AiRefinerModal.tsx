import React, { useState } from 'react';
import { X, Sparkles, Send, Loader2, RefreshCw } from 'lucide-react';

interface AiRefinerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefine: (userInstruction: string) => Promise<void>;
  isRefining: boolean;
}

export const AiRefinerModal: React.FC<AiRefinerModalProps> = ({
  isOpen,
  onClose,
  onRefine,
  isRefining,
}) => {
  const [instruction, setInstruction] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isRefining) return;
    await onRefine(instruction);
    setInstruction('');
  };

  const samplePrompts = [
    'Tambahkan kegiatan ice-breaking permainan kelompok di bagian Pendahuluan',
    'Persingkat alokasi waktu dan perjelas tugas murid di tahap MENGAPLIKASI',
    'Berikan contoh instrumen kuis interaktif Kahoot/Quizizz pada bagian Lampiran',
    'Fokuskan aktivitas murid pada gaya belajar kinestetik dan diferensiasi produk',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Revisi Dokumen RPM dengan AI
            </h3>
            <p className="text-xs text-slate-500">
              Instruksikan perubahan spesifik yang Anda inginkan
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Instruksi Perubahan untuk AI:
            </label>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Contoh: Tambahkan variasi games di tahap MEMAHAMI, atau tambahkan rubrik penilaian sikap gotong royong..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-sm text-slate-800 outline-none transition-all"
              required
            />
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
              Contoh Instruksi Cepat (Klik untuk memilih):
            </span>
            <div className="space-y-1.5">
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstruction(prompt)}
                  className="w-full text-left text-xs p-2 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-900 transition-all cursor-pointer"
                >
                  ⚡ {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isRefining || !instruction.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isRefining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Memproses...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Terapkan Revisi AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
