import { LessonFormData } from '../types';

export const FASE_OPTIONS = [
  { value: 'Fase A', label: 'Fase A (SD Kelas 1 - 2)' },
  { value: 'Fase B', label: 'Fase B (SD Kelas 3 - 4)' },
  { value: 'Fase C', label: 'Fase C (SD Kelas 5 - 6)' },
  { value: 'Fase D', label: 'Fase D (SMP Kelas 7 - 9)' },
  { value: 'Fase E', label: 'Fase E (SMA/SMK Kelas 10)' },
  { value: 'Fase F', label: 'Fase F (SMA/SMK Kelas 11 - 12)' },
  { value: 'Fase Fondasi', label: 'Fase Fondasi (PAUD / TK)' },
];

export const KELAS_BY_FASE: Record<string, string[]> = {
  'Fase A': ['Kelas 1', 'Kelas 2'],
  'Fase B': ['Kelas 3', 'Kelas 4'],
  'Fase C': ['Kelas 5', 'Kelas 6'],
  'Fase D': ['Kelas 7', 'Kelas 8', 'Kelas 9'],
  'Fase E': ['Kelas 10'],
  'Fase F': ['Kelas 11', 'Kelas 12'],
  'Fase Fondasi': ['Kelompok A (PAUD)', 'Kelompok B (PAUD)'],
};

export const getKelasOptions = (fase: string): string[] => {
  if (KELAS_BY_FASE[fase]) {
    return KELAS_BY_FASE[fase];
  }
  for (const key of Object.keys(KELAS_BY_FASE)) {
    if (fase && fase.includes(key)) {
      return KELAS_BY_FASE[key];
    }
  }
  return ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11', 'Kelas 12'];
};

export const KELAS_OPTIONS = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
  'Kelas 7',
  'Kelas 8',
  'Kelas 9',
  'Kelas 10',
  'Kelas 11',
  'Kelas 12',
  'Kelompok A (PAUD)',
  'Kelompok B (PAUD)',
];

export const FASE_KELAS_OPTIONS = [
  'Fase A - Kelas 1-2 (SD)',
  'Fase B - Kelas 3-4 (SD)',
  'Fase C - Kelas 5-6 (SD)',
  'Fase D - Kelas 7-9 (SMP)',
  'Fase E - Kelas 10 (SMA/SMK)',
  'Fase F - Kelas 11-12 (SMA/SMK)',
];

export const MATA_PELAJARAN_POPULER = [
  'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
  'Matematika',
  'Bahasa Indonesia',
  'Pendidikan Pancasila / PPKn',
  'Koding dan Kecerdasan Artifisial (KKA)',
  'Bahasa Inggris',
  'Pendidikan Agama dan Budi Pekerti',
  'PJOK (Pendidikan Jasmani Olahraga Kesehatan)',
  'Seni Musik',
  'Seni Rupa',
  'Seni Tari',
  'Seni Teater',
  'Informatika / TIK',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah',
  'Geografi',
  'Ekonomi',
  'Sosiologi',
];

export const getMataPelajaranByFase = (fase: string = '', kelas: string = ''): string[] => {
  const isFaseC = fase.includes('Fase C') || kelas.includes('Kelas 5') || kelas.includes('Kelas 6');
  if (isFaseC) {
    return [
      'Koding dan Kecerdasan Artifisial (KKA)',
      'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
      'Matematika',
      'Bahasa Indonesia',
      'Pendidikan Pancasila / PPKn',
      'Bahasa Inggris',
      'Pendidikan Agama dan Budi Pekerti',
      'PJOK (Pendidikan Jasmani Olahraga Kesehatan)',
      'Seni Rupa',
      'Seni Musik',
      'Seni Tari',
      'Seni Teater',
    ];
  }
  if (fase.includes('Fase A') || fase.includes('Fase B') || kelas.includes('Kelas 1') || kelas.includes('Kelas 2') || kelas.includes('Kelas 3') || kelas.includes('Kelas 4')) {
    return [
      'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
      'Matematika',
      'Bahasa Indonesia',
      'Pendidikan Pancasila / PPKn',
      'Pendidikan Agama dan Budi Pekerti',
      'PJOK (Pendidikan Jasmani Olahraga Kesehatan)',
      'Seni Rupa',
      'Seni Musik',
      'Bahasa Inggris',
    ];
  }
  return MATA_PELAJARAN_POPULER;
};

export const ALOKASI_WAKTU_OPTIONS = [
  '2 x 35 Menit (2 JP - SD)',
  '3 x 35 Menit (3 JP - SD)',
  '4 x 35 Menit (4 JP - SD)',
  '2 x 40 Menit (2 JP - SMP)',
  '3 x 40 Menit (3 JP - SMP)',
  '2 x 45 Menit (2 JP - SMA/SMK)',
  '3 x 45 Menit (3 JP - SMA/SMK)',
  '4 x 45 Menit (4 JP - SMA/SMK)',
  'Kustom / Sesuai Proyek Pembelajaran',
];

export const DPL_OPTIONS = [
  { id: 'dpl-1', label: 'Keimanan dan Ketakwaan', desc: 'Memiliki akhlak mulia, integritas, serta mengamalkan nilai spiritual dalam kehidupan sehari-hari.' },
  { id: 'dpl-2', label: 'Kewargaan', desc: 'Memahami tanggung jawab sosial, cinta tanah air, dan peduli terhadap kehidupan berbangsa.' },
  { id: 'dpl-3', label: 'Penalaran Kritis', desc: 'Mampu memproses informasi, menganalisis masalah, dan tidak mudah percaya pada hal yang tidak jelas.' },
  { id: 'dpl-4', label: 'Kreativitas', desc: 'Menumbuhkan daya cipta, menghasilkan gagasan baru, serta adaptif dalam memecahkan masalah.' },
  { id: 'dpl-5', label: 'Kolaborasi', desc: 'Mampu bekerja sama, menghargai peran orang lain, dan mencapai tujuan bersama dalam tim.' },
  { id: 'dpl-6', label: 'Kemandirian', desc: 'Bertanggung jawab pada proses belajar, disiplin, serta memiliki inisiatif tanpa bergantung pada orang lain.' },
  { id: 'dpl-7', label: 'Kesehatan', desc: 'Menjaga kesehatan fisik dan keseimbangan mental (well-being) agar tetap bugar.' },
  { id: 'dpl-8', label: 'Komunikasi', desc: 'Menyampaikan ide atau gagasan secara jelas, efektif, dan percaya diri.' },
];

export const METODE_MODEL_OPTIONS = [
  { id: 'm-1', label: 'Problem Based Learning (PBL)', tag: 'Model' },
  { id: 'm-2', label: 'Project Based Learning (PjBL)', tag: 'Model' },
  { id: 'm-3', label: 'Discovery Learning', tag: 'Model' },
  { id: 'm-4', label: 'Inquiry Based Learning', tag: 'Model' },
  { id: 'm-5', label: 'Pembelajaran Berdiferensiasi (Konten/Proses/Produk)', tag: 'Pendekatan' },
  { id: 'm-6', label: 'Cooperative Learning (Jigsaw/STAD)', tag: 'Model' },
  { id: 'm-7', label: 'Demonstrasi Interaktif & Eksperimen', tag: 'Metode' },
  { id: 'm-8', label: 'Diskusi Kelompok & Debat Positif', tag: 'Metode' },
  { id: 'm-9', label: 'Studi Kasus & Role Playing', tag: 'Metode' },
  { id: 'm-10', label: 'Simulasi & Stasiun Pembelajaran (Station Rotation)', tag: 'Metode' },
  { id: 'm-11', label: 'Technological Pedagogical Content Knowledge (TPACK)', tag: 'Pendekatan' },
];

export const KEMITRAAN_OPTIONS = [
  { id: 'k-1', label: 'Orang Tua / Wali Murid', desc: 'Dukungan aktivitas belajar di rumah dan pameran karya' },
  { id: 'k-2', label: 'Kolaborasi Antar Siswa (Peer Learning)', desc: 'Tutor sebaya dan kerja kelompok diferensiasi' },
  { id: 'k-3', label: 'Komunitas Lokal & Tokoh Masyarakat', desc: 'Narasumber budaya, pengrajin, atau tokoh lingkungan' },
  { id: 'k-4', label: 'Narasumber / Ahli Profesi Outside', desc: 'Undangan dokter, insinyur, wirausahawan, atau alumni' },
  { id: 'k-5', label: 'Guru Antar Mata Pelajaran (Team Teaching)', desc: 'Integrasi lintas disiplin ilmu / proyek kolaboratif' },
  { id: 'k-6', label: 'Perpustakaan & Instansi Daerah', desc: 'Kunjungan atau pemanfaatan arsip/fasilitas lokal' },
];

export const DIGITAL_TOOLS_OPTIONS = [
  { id: 'dt-1', label: 'Papan Interaktif Digital (Jamboard / Padlet / Miro)', category: 'Kolaborasi Visual' },
  { id: 'dt-2', label: 'Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)', category: 'Gamifikasi & Asesmen' },
  { id: 'dt-3', label: 'Perpustakaan Digital / E-Book / Portal Rumah Belajar', category: 'Bahan Ajar' },
  { id: 'dt-4', label: 'Simulator & Visualisasi Interaktif (PhET / GeoGebra / Canva)', category: 'Eksperimen Digital' },
  { id: 'dt-5', label: 'LMS (Google Classroom / Moodle / Whatsapp Group)', category: 'Manajemen Kelas' },
  { id: 'dt-6', label: 'Video Pembelajaran Interaktif (Edpuzzle / YouTube)', category: 'Media Audiovisual' },
  { id: 'dt-7', label: 'Asisten AI & Tools Generatif Pembelajaran', category: 'Teknologi Masa Depan' },
  { id: 'dt-8', label: 'Platform Koding Visual & AI (Scratch / Blockly / Teachable Machine / Code.org)', category: 'Koding & AI' },
];

export const LINTAS_DISIPLIN_OPTIONS = [
  { id: 'ld-1', label: 'Bahasa Indonesia', desc: 'Literasi, kosakata sains/sosial, presentasi lisan, dan penulisan laporan' },
  { id: 'ld-2', label: 'Matematika & Numerasi', desc: 'Pengukuran, grafik data, estimasi, dan pengolahan angka/tabel' },
  { id: 'ld-3', label: 'IPAS / Sains Terapan', desc: 'Pengamatan fenomena alam, lingkungan hidup, dan analisis sosial' },
  { id: 'ld-4', label: 'Pendidikan Pancasila & Moral', desc: 'Nilai etika, gotong royong, tanggung jawab warga, dan norma' },
  { id: 'ld-5', label: 'Seni Budaya & Desain (SBdP)', desc: 'Ekspresi visual, menggambar poster, infografis, dan estetika karya' },
  { id: 'ld-6', label: 'Informatika & Literasi Digital', desc: 'Pencarian informasi, pembuatan media digital, dan berpikir komputasional' },
  { id: 'ld-7', label: 'PJOK & Kesehatan', desc: 'Aktivitas fisik, kebugaran, postur belajar, dan kesehatan motorik' },
  { id: 'ld-8', label: 'Bahasa Inggris & Daerah', desc: 'Pengenalan istilah global/lokal dan komunikasi lintas budaya' },
  { id: 'ld-9', label: 'Koding & Kecerdasan Artifisial (KKA)', desc: 'Logika sekuensial, percabangan kode, berpikir komputasional, dan etika AI' },
];

export const LINGKUNGAN_PEMBELAJARAN_OPTIONS = [
  { id: 'lp-1', label: 'Ruang Kelas Interaktif', desc: 'Diskusi kelompok, kerja meja, presentasi, dan simulasi tatap muka' },
  { id: 'lp-2', label: 'Laboratorium & Ruang Sains/Komputer', desc: 'Eksperimen langsung, uji coba, praktikum, dan eksplorasi digital' },
  { id: 'lp-3', label: 'Lingkungan Sekolah & Kebun/Halaman', desc: 'Observasi alam terbuka, pengukuran lapangan, dan outdoor learning' },
  { id: 'lp-4', label: 'Lingkungan Masyarakat & Sekitar Sekolah', desc: 'Wawancara narasumber, studi lingkungan lokal, dan keterlibatan komunitas' },
  { id: 'lp-5', label: 'Perpustakaan & Pusat Sumber Belajar', desc: 'Riset mandiri, studi literatur, pencarian referensi, dan sudut baca' },
  { id: 'lp-6', label: 'Ruang Digital / Maya (Virtual Class & LMS)', desc: 'Akses kuis online, video interaktif, LMS, dan papan kolaborasi virtual' },
];

export const KARAKTERISTIK_MURID_PRESETS = [
  'Mayoritas murid memiliki gaya belajar visual dan kinestetik, menyukai aktivitas langsung, dan membutuhkan pengalaman konkrit sebelum memahami teori abstrak.',
  'Murid memiliki kesiapan belajar heterogen; sebagian sudah lancar memahami materi dasar, sebagian memerlukan bimbingan bertahap dengan scaffolding visual.',
  'Murid sangat antusias dengan teknologi digital dan permainan edukatif (gamifikasi), serta aktif jika diajak berdiskusi kelompok kecil.',
];

export const KARAKTERISTIK_MATERI_PRESETS = [
  'Materi memuat konsep abstrak yang membutuhkan alat peraga/simulasi konkret dan keterkaitan langsung dengan fenomena kehidupan sehari-hari siswa.',
  'Materi berfokus pada keterampilan pemecahan masalah kontekstual, membutuhkan analisis kritis, pemikiran prosedural, dan kolaborasi kelompok.',
  'Materi bersifat eksploratif dan kreatif, memberikan ruang bagi murid untuk menghasilkan produk beragam sesuai minat dan bakat mereka.',
];

export const DEMO_PRESETS: { title: string; subtitle: string; formData: LessonFormData }[] = [
  {
    title: 'IPAS SD Kelas 4 - Wujud Zat dan Perubahannya',
    subtitle: 'SD / Fase B | Pembelajaran Berdiferensiasi & Eksperimen',
    formData: {
      namaGuru: 'Indartha Meiputra, S.Pd.',
      nipGuru: '19900515 201801 1 002',
      namaKepsek: 'Dr. H. Bambang Suherman, M.Pd.',
      nipKepsek: '19680312 199303 1 005',
      namaSekolah: 'SD Negeri Harapan Bangsa',
      fase: 'Fase B',
      kelas: 'Kelas 4',
      faseKelas: 'Fase B - Kelas 4',
      semesterTahun: 'Semester 1 / Tahun Ajaran 2025/2026',
      mataPelajaran: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)',
      capaianPembelajaran: 'Peserta didik mengidentifikasi proses perubahan wujud zat dan mengaitkannya dengan perubahan suhu dalam kehidupan sehari-hari.',
      lingkupMateri: 'Wujud Zat (Padat, Cair, Gas) dan Perubahannya (Mencair, Membeku, Menguap, Mengembun, Menyublim)',
      tujuanPembelajaran: '1. Peserta didik dapat mengidentifikasi wujud zat beserta sifat-sifat dasarnya melalui observasi dan eksperimen sederhana.\n2. Peserta didik dapat menganalisis proses perubahan wujud zat akibat pengaruh kalor.\n3. Peserta didik mampu merefleksikan pemanfaatan perubahan wujud zat dalam kehidupan sehari-hari.',
      alokasiWaktu: '3 x 35 Menit (3 JP - SD)',
      karakteristikMurid: 'Sebagian besar murid bergaya belajar visual dan kinestetik. Murid menyukai kegiatan eksperimen kelompok dan penggunaan media gambar/interaktif.',
      karakteristikMateri: 'Materi bersifat konkret namun memerlukan demonstrasi langsung agar murid paham perubahan antar zat yang tidak kasat mata secara makro.',
      dpl: [
        'Penalaran Kritis',
        'Kolaborasi',
        'Kreativitas',
      ],
      metodeModel: [
        'Problem Based Learning (PBL)',
        'Pembelajaran Berdiferensiasi (Konten/Proses/Produk)',
        'Demonstrasi Interaktif & Eksperimen',
      ],
      kemitraan: [
        'Kolaborasi Antar Siswa (Peer Learning)',
        'Orang Tua / Wali Murid',
      ],
      pemanfaatanDigital: [
        'Papan Interaktif Digital (Jamboard / Padlet / Miro)',
        'Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)',
        'Simulator & Visualisasi Interaktif (PhET / GeoGebra / Canva)',
      ],
      lintasDisiplin: [
        'Bahasa Indonesia',
        'Matematika & Numerasi',
        'Seni Budaya & Desain (SBdP)',
      ],
      lingkunganPembelajaran: [
        'Ruang Kelas Interaktif',
        'Laboratorium & Ruang Sains/Komputer',
        'Lingkungan Sekolah & Kebun/Halaman',
      ],
    },
  },
  {
    title: 'Matematika SMP Kelas 8 - Teorema Pythagoras',
    subtitle: 'SMP / Fase D | Problem Based Learning & Digital App',
    formData: {
      namaGuru: 'Siti Rahmawati, M.Pd.',
      nipGuru: '19881120 201502 2 001',
      namaKepsek: 'Drs. Ahmad Wijaya, M.Si.',
      nipKepsek: '19650708 199003 1 003',
      namaSekolah: 'SMP Negeri 1 Nusantara',
      fase: 'Fase D',
      kelas: 'Kelas 8',
      faseKelas: 'Fase D - Kelas 8',
      semesterTahun: 'Semester 1 / Tahun Ajaran 2025/2026',
      mataPelajaran: 'Matematika',
      capaianPembelajaran: 'Peserta didik dapat membuktikan dan menggunakan teorema Pythagoras dalam menyelesaikan masalah kontekstual.',
      lingkupMateri: 'Teorema Pythagoras dan Penerapannya dalam Menghitung Jarak / Tinggi Bangunan',
      tujuanPembelajaran: '1. Peserta didik mampu menemukan rumus Pythagoras melalui eksplorasi ubin luas bangun datar.\n2. Peserta didik mampu menyelesaikan masalah kontekstual yang melibatkan segitiga siku-siku.',
      alokasiWaktu: '2 x 40 Menit (2 JP - SMP)',
      karakteristikMurid: 'Murid memiliki kemampuan awal variatif. Sebagian murid memerlukan visualisasi konsep geometric sebelum rumus simbolis.',
      karakteristikMateri: 'Materi berhubungan dengan spasial dan logika matematika terapan yang relevan dengan arsitektur dan navigasi.',
      dpl: [
        'Penalaran Kritis',
        'Kemandirian',
        'Kreativitas',
      ],
      metodeModel: [
        'Problem Based Learning (PBL)',
        'Inquiry Based Learning',
      ],
      kemitraan: [
        'Kolaborasi Antar Siswa (Peer Learning)',
        'Narasumber / Ahli Profesi Outside',
      ],
      pemanfaatanDigital: [
        'Simulator & Visualisasi Interaktif (PhET / GeoGebra / Canva)',
        'Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)',
      ],
      lintasDisiplin: [
        'Informatika & Literasi Digital',
        'Seni Budaya & Desain (SBdP)',
      ],
      lingkunganPembelajaran: [
        'Ruang Kelas Interaktif',
        'Ruang Digital / Maya (Virtual Class & LMS)',
      ],
    },
  },
  {
    title: 'KKA SD Kelas 5 - Logika Algoritma & Pemrograman Visual Scratch',
    subtitle: 'SD / Fase C | Computational Thinking & Project Based Learning',
    formData: {
      namaGuru: 'Indartha Meiputra, S.Pd.',
      nipGuru: '19900515 201801 1 002',
      namaKepsek: 'Dr. H. Bambang Suherman, M.Pd.',
      nipKepsek: '19680312 199303 1 005',
      namaSekolah: 'SD Negeri Harapan Bangsa',
      fase: 'Fase C',
      kelas: 'Kelas 5',
      faseKelas: 'Fase C - Kelas 5',
      semesterTahun: 'Semester 1 / Tahun Ajaran 2025/2026',
      mataPelajaran: 'Koding dan Kecerdasan Artifisial (KKA)',
      capaianPembelajaran: 'Peserta didik mampu memahami konsep berpikir komputasional, merancang instruksi algoritma sekuensial dan percabangan sederhana menggunakan blok visual koding (Scratch/Blockly), serta merefleksikan etika dasar penggunaan kecerdasan artifisial (AI) dalam kehidupan sehari-hari.',
      lingkupMateri: 'Berpikir Komputasional dan Pemrograman Visual (Scratch/Blockly)',
      tujuanPembelajaran: '1. Peserta didik dapat memahami konsep logika algoritma, urutan langkah (sekuensial), dan percabangan sederhana dalam pemrograman visual.\n2. Peserta didik dapat merancang dan mengaplikasikan blok kode visual untuk membuat animasi/interaksi sederhana secara kolaboratif.\n3. Peserta didik mampu merefleksikan proses perbaikan kesalahan program (debugging) serta memahami etika dasar pemanfaatan kecerdasan artifisial (AI) secara bijak.',
      alokasiWaktu: '3 x 35 Menit (3 JP - SD)',
      karakteristikMurid: 'Murid memiliki ketertarikan tinggi terhadap gawai digital dan permainan visual, menyukai pembelajaran eksploratif melalui uji coba langsung (hands-on) di depan perangkat komputer/tablet.',
      karakteristikMateri: 'Materi menekankan kemampuan berpikir logis prosedural, dekomposisi masalah, serta kreativitas merangkai blok kode visual dan memahami prinsip dasar cara kerja AI.',
      dpl: [
        'Penalaran Kritis',
        'Kreativitas',
        'Kolaborasi',
        'Kemandirian',
      ],
      metodeModel: [
        'Project Based Learning (PjBL)',
        'Problem Based Learning (PBL)',
        'Technological Pedagogical Content Knowledge (TPACK)',
        'Demonstrasi Interaktif & Eksperimen',
      ],
      kemitraan: [
        'Kolaborasi Antar Siswa (Peer Learning)',
        'Guru Antar Mata Pelajaran (Team Teaching)',
        'Orang Tua / Wali Murid',
      ],
      pemanfaatanDigital: [
        'Platform Koding Visual & AI (Scratch / Blockly / Teachable Machine / Code.org)',
        'Asisten AI & Tools Generatif Pembelajaran',
        'Papan Interaktif Digital (Jamboard / Padlet / Miro)',
      ],
      lintasDisiplin: [
        'Matematika & Numerasi',
        'Seni Budaya & Desain (SBdP)',
        'Bahasa Indonesia',
        'Pendidikan Pancasila & Moral',
      ],
      lingkunganPembelajaran: [
        'Laboratorium & Ruang Sains/Komputer',
        'Ruang Kelas Interaktif',
        'Ruang Digital / Maya (Virtual Class & LMS)',
      ],
    },
  },
];
