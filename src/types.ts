export interface LessonFormData {
  // Identitas Guru & Sekolah
  namaGuru: string;
  nipGuru: string;
  namaKepsek: string;
  nipKepsek: string;
  namaSekolah: string;
  fase: string;
  kelas: string;
  faseKelas: string;
  semesterTahun: string;

  // Data Pembelajaran
  mataPelajaran: string;
  capaianPembelajaran: string;
  lingkupMateri: string;
  tujuanPembelajaran: string;
  alokasiWaktu: string;

  // Analysis & Characteristics
  karakteristikMurid: string;
  karakteristikMateri: string;

  // Multi-select Checkboxes with AI Recommendations
  dpl: string[]; // Dimensi Profil Lulusan
  metodeModel: string[]; // Metode & Model
  kemitraan: string[]; // Kemitraan Pembelajaran
  pemanfaatanDigital: string[]; // Pemanfaatan Digital
  lintasDisiplin: string[]; // Lintas Disiplin Ilmu
  lingkunganPembelajaran: string[]; // Lingkungan Pembelajaran
}

export interface DeepLearningStage {
  tahapLabel: 'MEMAHAMI' | 'MENGAPLIKASI' | 'MEREFLEKSI' | string;
  subJudul: string;
  prinsipMendalamLabel: string;
  alokasiWaktu: string;
  aktivitasGuru: string | string[];
  aktivitasMurid: string | string[];
  poinUtama: string[];
}

export interface KKTPKriteria {
  aspekPenilaian: string;
  perluBimbingan: string; // 0 - 60%
  cukup: string;         // 61 - 70%
  layak: string;         // 71 - 80%
  mahir: string;         // 81 - 100%
}

export interface KKTPData {
  pendekatan: string;
  deskripsi: string;
  kriteria: KKTPKriteria[];
  tindakLanjut: {
    perluBimbingan: string;
    cukup: string;
    layak: string;
    mahir: string;
  };
}

export interface LKPDQuestion {
  no: number;
  pertanyaan: string;
  pilihan?: string[];
  kunciJawaban: string;
  pembahasan: string;
}

export interface JurnalHarianEntry {
  hariTanggal: string;
  pertemuanJam: string;
  mataPelajaran: string;
  atp: string;
  materiAktivitas: string;
  penilaian: string;
  catatanKendala: string;
}

export interface JurnalHarianGuru {
  judul: string;
  catatanRefleksiUmum: string;
  entries: JurnalHarianEntry[];
}

export interface LKPDTableData {
  judulTabel: string;
  headers: string[];
  rows: string[][];
  petunjukPengisian: string;
}

export interface LKPDData {
  judulLKPD: string;
  subJudul?: string;
  petunjukUmum: string[];
  lembarPenugasan: {
    judulTugas: string;
    tujuanAktivitas: string;
    alatDanBahan: string[];
    instruksiKerja: string[];
  };
  panduanPraktikum: {
    judulEksplorasi: string;
    tujuanPraktikum: string;
    langkahKerja: string[];
    tabelPengamatan: LKPDTableData;
    pertanyaanAnalisis: string[];
  };
  latihanSoal: {
    petunjukPengerjaan: string;
    pilihanGanda: LKPDQuestion[];
    soalUraian: LKPDQuestion[];
  };
  refleksiSiswa: {
    pertanyaanRefleksi: string[];
    checkListDiri: string[];
  };
}

export interface AsesmenItem {
  bentukPenilaian: string;
  teknikPenilaian: string;
  instrumenPenilaian: string;
}

export interface LessonPlanOutput {
  identitas: {
    namaGuru: string;
    nipGuru: string;
    namaKepsek: string;
    nipKepsek: string;
    namaSekolah: string;
    mataPelajaran: string;
    fase?: string;
    kelas?: string;
    faseKelas: string;
    semesterTahun: string;
    alokasiWaktu: string;
  };
  analisisAwal: {
    karakteristikMurid: string;
    karakteristikMateri: string;
  };
  tujuanDanDpl: {
    capaianPembelajaran: string;
    lingkupMateri: string;
    tujuanPembelajaran: string;
    indikatorKetercapaian: string[];
    dimensiProfilLulusan: string[];
  };
  desainPembelajaran: {
    modelDanMetode: string[];
    kemitraanPembelajaran: string[];
    pemanfaatanDigital: string[];
    lintasDisiplin?: string[];
    lingkunganPembelajaran?: string[];
    saranaPrasarana: string;
  };
  kegiatanPembelajaran: {
    pendahuluan: {
      alokasiWaktu: string;
      aktivitas: string[];
    };
    kegiatanInti: DeepLearningStage[];
    penutup: {
      alokasiWaktu: string;
      aktivitas: string[];
    };
  };
  asesmen: {
    assessmentAsLearning?: AsesmenItem[] | AsesmenItem | string;
    assessmentForLearning?: AsesmenItem[] | AsesmenItem | string;
    assessmentOfLearning?: AsesmenItem[] | AsesmenItem | string;
    diagnostik?: string;
    formatif?: string;
    sumatif?: string;
  };
  remedialDanPengayaan: {
    remedial: string;
    pengayaan: string;
  };
  lampiran: {
    lkpd: string;
    lkpdStructured?: LKPDData;
    bahanAjar: string;
    rubrikPenilaian: string;
    kktp?: KKTPData | string;
  };
  jurnalHarian?: JurnalHarianGuru;
}

export interface SavedLessonPlan {
  id: string;
  createdAt: string;
  title: string;
  mataPelajaran: string;
  faseKelas: string;
  plan: LessonPlanOutput;
  formData: LessonFormData;
}

export function normalizeAsesmen(asesmenInput: any): {
  assessmentAsLearning: AsesmenItem[];
  assessmentForLearning: AsesmenItem[];
  assessmentOfLearning: AsesmenItem[];
} {
  const parseCategory = (
    val: any,
    defaultBentuk: string,
    defaultTeknik: string,
    defaultInstrumen: string
  ): AsesmenItem[] => {
    if (!val) {
      return [{ bentukPenilaian: defaultBentuk, teknikPenilaian: defaultTeknik, instrumenPenilaian: defaultInstrumen }];
    }
    if (Array.isArray(val) && val.length > 0) {
      return val.map((item) => {
        if (typeof item === 'string') {
          return { bentukPenilaian: defaultBentuk, teknikPenilaian: defaultTeknik, instrumenPenilaian: item };
        }
        return {
          bentukPenilaian: item.bentukPenilaian || defaultBentuk,
          teknikPenilaian: item.teknikPenilaian || defaultTeknik,
          instrumenPenilaian: item.instrumenPenilaian || defaultInstrumen,
        };
      });
    }
    if (typeof val === 'object' && val !== null) {
      return [{
        bentukPenilaian: val.bentukPenilaian || defaultBentuk,
        teknikPenilaian: val.teknikPenilaian || defaultTeknik,
        instrumenPenilaian: val.instrumenPenilaian || defaultInstrumen,
      }];
    }
    if (typeof val === 'string') {
      return [{
        bentukPenilaian: defaultBentuk,
        teknikPenilaian: defaultTeknik,
        instrumenPenilaian: val,
      }];
    }
    return [{ bentukPenilaian: defaultBentuk, teknikPenilaian: defaultTeknik, instrumenPenilaian: defaultInstrumen }];
  };

  if (!asesmenInput) {
    asesmenInput = {};
  }

  const asLearningVal = asesmenInput.assessmentAsLearning || asesmenInput.diagnostik;
  const forLearningVal = asesmenInput.assessmentForLearning || asesmenInput.formatif;
  const ofLearningVal = asesmenInput.assessmentOfLearning || asesmenInput.sumatif;

  return {
    assessmentAsLearning: parseCategory(
      asLearningVal,
      "Formatif (Refleksi Diri & Antarteman)",
      "Self & Peer Assessment",
      "Lembar Refleksi Metakognitif Mandiri & Rubrik Penilaian Antarteman"
    ),
    assessmentForLearning: parseCategory(
      forLearningVal,
      "Formatif (Proses Pembelajaran)",
      "Observasi & Penugasan LKPD",
      "Lembar Observasi Sikap/Kinerja & Rubrik Unjuk Kerja Kelompok"
    ),
    assessmentOfLearning: parseCategory(
      ofLearningVal,
      "Sumatif (Akhir Pembelajaran)",
      "Tes Tertulis / Penilaian Produk",
      "Soal Evaluasi Tertulis & Rubrik Penilaian Produk/Proyek Akhir"
    ),
  };
}
