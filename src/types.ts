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
    diagnostik: string;
    formatif: string;
    sumatif: string;
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
