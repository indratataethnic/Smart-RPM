import React from 'react';
import { X, Trash2, FolderOpen, Calendar, BookOpen, Layers } from 'lucide-react';
import { SavedLessonPlan } from '../types';

interface SavedPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlans: SavedLessonPlan[];
  onSelectPlan: (saved: SavedLessonPlan) => void;
  onDeletePlan: (id: string) => void;
}

export const SavedPlansModal: React.FC<SavedPlansModalProps> = ({
  isOpen,
  onClose,
  savedPlans,
  onSelectPlan,
  onDeletePlan,
}) => {
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
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Daftar RPM Tersimpan
            </h3>
            <p className="text-xs text-slate-500">
              Riwayat Rencana Pembelajaran Mendalam yang telah Anda simpan di perangkat ini
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {savedPlans.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Belum ada dokumen RPM tersimpan.</p>
              <p className="text-xs mt-1">Buat Rencana Pembelajaran Mendalam dan klik "Simpan RPM" untuk menyimpan di sini.</p>
            </div>
          ) : (
            savedPlans.map((saved) => (
              <div
                key={saved.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-slate-50/80 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {saved.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      {saved.mataPelajaran}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      {saved.faseKelas}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {saved.createdAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPlan(saved);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    Buka Document
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePlan(saved.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
