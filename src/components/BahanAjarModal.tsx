import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Printer, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  BookOpen, 
  ExternalLink, 
  HelpCircle, 
  RefreshCw,
  FileText,
  Lightbulb,
  Info
} from 'lucide-react';
import { BahanAjarData, LessonPlanOutput } from '../types';

interface BahanAjarModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: LessonPlanOutput;
  bahanAjarData?: BahanAjarData;
  onSaveBahanAjar: (newData: BahanAjarData) => void;
  onGenerateBahanAjar: (customInstruction?: string) => Promise<void>;
  isGenerating: boolean;
}

export const BahanAjarModal: React.FC<BahanAjarModalProps> = ({
  isOpen,
  onClose,
  planData,
  bahanAjarData,
  onSaveBahanAjar,
  onGenerateBahanAjar,
  isGenerating,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showPromptInput, setShowPromptInput] = useState<boolean>(false);

  // Local editable state
  const [editableData, setEditableData] = useState<BahanAjarData | undefined>(bahanAjarData);

  React.useEffect(() => {
    setEditableData(bahanAjarData);
  }, [bahanAjarData]);

  if (!isOpen) return null;

  const currentData = editableData || bahanAjarData;

  const handleCopyText = () => {
    if (!currentData) return;
    const { identitas } = planData;

    let text = `====================================================\n`;
    text += `${currentData.judulBahanAjar}\n`;
    text += `${currentData.subJudul || 'Kurikulum Merdeka - Kementerian Pendidikan Dasar dan Menengah'}\n`;
    text += `Referensi Resmi: ${currentData.referensiUtama}\n`;
    text += `====================================================\n\n`;
    text += `Mata Pelajaran : ${identitas.mataPelajaran}\n`;
    text += `Kelas / Fase   : ${identitas.faseKelas}\n`;
    text += `Topik / Materi  : ${planData.tujuanDanDpl.lingkupMateri}\n\n`;

    text += `--- I. KONSEP KUNCI MATERI ---\n`;
    currentData.rangkumanMateriSiswa.konsepKunci.forEach((k, idx) => {
      text += `${idx + 1}. ${k}\n`;
    });
    text += `\n`;

    text += `--- II. PENJELASAN RINGKAS MATERI ---\n`;
    text += `${currentData.rangkumanMateriSiswa.penjelasanRingkas}\n\n`;

    text += `--- III. CONTOH KONTEKSTUAL SEHARI-HARI ---\n`;
    currentData.rangkumanMateriSiswa.contohKontekstual.forEach((c, idx) => {
      text += `${idx + 1}. ${c}\n`;
    });
    text += `\n`;

    text += `--- IV. PANDUAN PEDAGOGIS GURU & MISKONSEPSI ---\n`;
    text += `Catatan Guru: ${currentData.panduanGuru.catatanPedagogis}\n`;
    text += `Miskonsepsi Umum:\n`;
    currentData.panduanGuru.miskonsepsiUmum.forEach((m, idx) => {
      text += `${idx + 1}. ${m}\n`;
    });
    text += `\n`;

    text += `--- V. GLOSARIUM ---\n`;
    currentData.glosarium.forEach((g) => {
      text += `- ${g.istilah}: ${g.arti}\n`;
    });
    text += `\n`;

    text += `--- VI. DAFTAR PUSTAKA ---\n`;
    currentData.daftarPustaka.forEach((d, idx) => {
      text += `${idx + 1}. ${d}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (editableData) {
      onSaveBahanAjar(editableData);
      setIsEditing(false);
    }
  };

  const handleRegenerate = async () => {
    await onGenerateBahanAjar(customPrompt);
    setShowPromptInput(false);
    setCustomPrompt('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between gap-4 shrink-0 border-b border-teal-700/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-700/60 rounded-xl border border-teal-500/30">
              <BookOpen className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-white">Rangkuman Bahan Bacaan AI</h2>
                <span className="bg-amber-400 text-teal-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  BSKAP Kemendikdasmen
                </span>
              </div>
              <p className="text-xs text-teal-100 flex items-center gap-1.5 mt-0.5">
                <span>Ref: Buku Teks Utama Kemendikdasmen</span>
                <a 
                  href="https://buku.kemendikdasmen.go.id/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-amber-300 hover:underline flex items-center gap-0.5 font-semibold"
                >
                  (buku.kemendikdasmen.go.id <ExternalLink className="w-3 h-3" />)
                </a>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white hover:bg-teal-700/50 rounded-xl transition-all cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Action Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 flex items-center justify-between gap-2 flex-wrap text-xs print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://buku.kemendikdasmen.go.id/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
              <span>Buka buku.kemendikdasmen.go.id</span>
            </a>

            <button
              onClick={() => setShowPromptInput(!showPromptInput)}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>{showPromptInput ? 'Batal AI Refine' : 'Instruksi AI Khusus'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Manual</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom AI Prompt Bar */}
        {showPromptInput && (
          <div className="bg-amber-50/80 border-b border-amber-200 p-3 sm:px-6 flex items-center gap-2 print:hidden">
            <input
              type="text"
              className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Contoh: Tambahkan poin eksperimen sederhana atau penyesuaian khusus..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
            />
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>Generate Ulang AI</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-6 print:p-0 print:overflow-visible text-slate-800 text-xs sm:text-sm">
          {isGenerating ? (
            <div className="py-20 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-teal-900 text-sm">Menyusun Rangkuman Bahan Bacaan AI...</p>
                <p className="text-xs text-slate-500">Mengkaji buku.kemendikdasmen.go.id & menyesuaikan bahasa ramah anak.</p>
              </div>
            </div>
          ) : currentData ? (
            <div className="space-y-6">

              {/* Document Header Box */}
              <div className="border border-teal-200 bg-teal-50/50 rounded-2xl p-4 sm:p-6 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-800 text-white rounded-full text-[11px] font-bold">
                  <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                  <span>REFERENSI KEMENDIKDASMEN RI</span>
                </div>
                <h1 className="text-base sm:text-xl font-black text-teal-950 uppercase tracking-tight">
                  {currentData.judulBahanAjar}
                </h1>
                <p className="text-xs text-teal-800 font-medium">
                  {currentData.subJudul || 'Bahan Ajar & Referensi Pembelajaran Kurikulum Merdeka'}
                </p>
                <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-600 flex-wrap">
                  <span><strong>Mata Pelajaran:</strong> {planData.identitas.mataPelajaran}</span>
                  <span>•</span>
                  <span><strong>Kelas / Fase:</strong> {planData.identitas.faseKelas}</span>
                  <span>•</span>
                  <span><strong>Materi:</strong> {planData.tujuanDanDpl.lingkupMateri}</span>
                </div>
                <div className="pt-2 text-[11px] text-teal-700 bg-white border border-teal-200 rounded-lg p-2 max-w-xl mx-auto flex items-center justify-center gap-2">
                  <Info className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Sumber rujukan resmi: <a href="https://buku.kemendikdasmen.go.id/" target="_blank" rel="noreferrer" className="font-bold underline">{currentData.referensiUtama}</a></span>
                </div>
              </div>

              {/* SECTION I: RANGKUMAN MATERI SISWA */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-teal-900 text-sm uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>I. Rangkuman Materi Peserta Didik (Bahasa Ramah Anak)</span>
                  </h2>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Mudah Dipahami Siswa
                  </span>
                </div>

                {/* Konsep Kunci */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 text-xs block">Konsep Kunci Materi:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {currentData.rangkumanMateriSiswa.konsepKunci.map((k, i) => (
                      <span key={i} className="bg-teal-100/70 text-teal-900 border border-teal-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        • {k}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Penjelasan Ringkas */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 text-xs block">Penjelasan Ringkas & Komunikatif:</label>
                  {isEditing ? (
                    <textarea
                      rows={5}
                      className="w-full bg-amber-50 border border-amber-300 rounded-lg p-2 text-xs"
                      value={currentData.rangkumanMateriSiswa.penjelasanRingkas}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditableData((prev) => prev ? ({
                          ...prev,
                          rangkumanMateriSiswa: { ...prev.rangkumanMateriSiswa, penjelasanRingkas: val }
                        }) : prev);
                      }}
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                      {currentData.rangkumanMateriSiswa.penjelasanRingkas}
                    </p>
                  )}
                </div>

                {/* Contoh Kontekstual */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 text-xs block flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Contoh Kontekstual dalam Kehidupan Sehari-hari:</span>
                  </label>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60">
                    {currentData.rangkumanMateriSiswa.contohKontekstual.map((c, i) => (
                      <li key={i} className="leading-relaxed">{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* SECTION II: PANDUAN PEDAGOGIS GURU */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-teal-900 text-sm uppercase flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-700" />
                    <span>II. Panduan Pedagogis Guru & Antisipasi Miskonsepsi</span>
                  </h2>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 text-xs block">Catatan Pedagogis Penyampaian:</label>
                  <p className="text-slate-700 leading-relaxed bg-teal-50/40 p-3 rounded-lg border border-teal-100">
                    {currentData.panduanGuru.catatanPedagogis}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 text-xs block">Antisipasi Miskonsepsi Umum & Pelurusannya:</label>
                  <div className="space-y-2">
                    {currentData.panduanGuru.miskonsepsiUmum.map((m, i) => (
                      <div key={i} className="p-2.5 bg-rose-50/60 border border-rose-200 rounded-lg text-slate-700 flex items-start gap-2">
                        <span className="font-bold text-rose-700 shrink-0">{i + 1}.</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION III: GLOSARIUM */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h2 className="font-bold text-teal-900 text-sm uppercase flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-700" />
                    <span>III. Glosarium / Kamus Kata Istilah</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentData.glosarium.map((g, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
                      <span className="font-bold text-teal-950 block text-xs">{g.istilah}</span>
                      <span className="text-slate-600 block text-[11px] leading-relaxed">{g.arti}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION IV: DAFTAR PUSTAKA & REFERENSI */}
              <div className="border border-teal-200 rounded-xl p-4 sm:p-5 bg-teal-50/30 space-y-3">
                <div className="border-b border-teal-200 pb-2 flex items-center justify-between">
                  <h2 className="font-bold text-teal-950 text-sm uppercase flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-teal-700" />
                    <span>IV. Daftar Pustaka & Referensi Sumber Belajar Resmi</span>
                  </h2>
                  <a
                    href="https://buku.kemendikdasmen.go.id/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-teal-800 hover:text-teal-950 underline flex items-center gap-1"
                  >
                    <span>Kunjungi Portal Buku Kemendikdasmen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-xs">
                  {currentData.daftarPustaka.map((d, i) => (
                    <li key={i} className="leading-relaxed">
                      {d.includes('http') ? (
                        <span>
                          {d.split('http')[0]}
                          <a 
                            href={`http${d.split('http')[1].replace(')', '')}`}
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-teal-700 hover:underline font-semibold"
                          >
                            http{d.split('http')[1]}
                          </a>
                        </span>
                      ) : (
                        <span>{d}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <p className="text-slate-500 text-sm">Belum ada rangkuman bahan bacaan yang dibuat.</p>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Buat Rangkuman Bacaan dengan AI
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
