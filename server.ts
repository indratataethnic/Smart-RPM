import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy init for Gemini API
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY tidak ditemukan di environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper for Gemini API calls with exponential backoff & model fallback
async function callGeminiWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const modelsToTry = [
    params.preferredModel || "gemini-2.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash"
  ];
  // Filter unique
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
  let lastError: any = null;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || "").toLowerCase();
        console.warn(`Gemini API call attempt ${attempt} on model ${model} failed:`, errStr);

        const isQuotaOrNotFound =
          errStr.includes("429") ||
          errStr.includes("resource_exhausted") ||
          errStr.includes("quota exceeded") ||
          errStr.includes("rate_limit") ||
          errStr.includes("404") ||
          errStr.includes("not_found");

        if (isQuotaOrNotFound) {
          // Immediately try next model in fallback list
          break;
        }

        const isTransient =
          errStr.includes("503") ||
          errStr.includes("unavailable") ||
          errStr.includes("service unavailable") ||
          errStr.includes("high demand") ||
          errStr.includes("overloaded");

        if (isTransient && attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 1000));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("Layanan AI sedang sibuk atau batas kuota tercapai. Silakan coba beberapa saat lagi.");
}

// Helper for Gemini API streaming calls with exponential backoff & model fallback
async function streamGeminiWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const modelsToTry = [
    params.preferredModel || "gemini-2.5-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash"
  ];
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));
  let lastError: any = null;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents: params.contents,
          config: params.config,
        });
        return responseStream;
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || "").toLowerCase();
        console.warn(`Gemini API stream attempt ${attempt} on model ${model} failed:`, errStr);

        const isQuotaOrNotFound =
          errStr.includes("429") ||
          errStr.includes("resource_exhausted") ||
          errStr.includes("quota exceeded") ||
          errStr.includes("rate_limit") ||
          errStr.includes("404") ||
          errStr.includes("not_found");

        if (isQuotaOrNotFound) {
          // Immediately try next model in fallback list
          break;
        }

        const isTransient =
          errStr.includes("503") ||
          errStr.includes("unavailable") ||
          errStr.includes("service unavailable") ||
          errStr.includes("high demand") ||
          errStr.includes("overloaded");

        if (isTransient && attempt < 3) {
          await new Promise((res) => setTimeout(res, attempt * 1000));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("Layanan AI sedang sibuk atau batas kuota tercapai. Silakan coba beberapa saat lagi.");
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server Rencana Pembelajaran Mendalam berjalan lancar" });
});

// API Quick AI Suggestions for CP, TP, DPL, Metode, Digital Tools
app.post("/api/recommend-fields", async (req, res) => {
  try {
    const { mataPelajaran, faseKelas, lingkupMateri, fieldType } = req.body;
    const ai = getGeminiClient();

    let prompt = "";
    if (fieldType === "cp_tp") {
      prompt = `Kamu adalah pakar Kurikulum Merdeka dan Pembelajaran Mendalam (Deep Learning) di Indonesia.
Berikan rekomendasi Capaian Pembelajaran (CP), Tujuan Pembelajaran (TP), dan Lingkup Materi/Topik Pembelajaran yang relevan untuk:
- Mata Pelajaran: ${mataPelajaran || 'Umum'}
- Kelas/Fase: ${faseKelas || 'Fase A'}
- Lingkup Materi Input Guru (jika ada): ${lingkupMateri || 'Belum diisi'}

Keluarkan dalam format JSON valid:
{
  "cp": "Teks Capaian Pembelajaran resmi dan ringkas...",
  "tp": "1. Tujuan pembelajaran 1...\n2. Tujuan pembelajaran 2...\n3. Tujuan pembelajaran 3...",
  "lingkupMateri": "Ringkasan topik atau lingkup materi pembelajaran yang spesifik dan jelas"
}`;
    } else if (fieldType === "recommendations_all") {
      prompt = `Kamu adalah pakar metodologi Pembelajaran Mendalam (Deep Learning).
Berdasarkan data berikut:
- Mata Pelajaran: ${mataPelajaran || 'Umum'}
- Fase/Kelas: ${faseKelas || 'Fase A'}
- Materi: ${lingkupMateri || 'Umum'}

Berikan rekomendasi spesifik yang berorientasi pada Pembelajaran Mendalam (Memahami, Mengaplikasi, Merefleksi).
Gunakan STRING PERSIS BOLD DARI DAFTAR BERIKUT:

1. DPL (Pilih 2-4 string persis):
- "Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia"
- "Berkebinekaan Global"
- "Gotong Royong"
- "Mandiri"
- "Bernalar Kritis"
- "Kreatif"

2. Metode & Model Pembelajaran (Pilih 2-3 string persis):
- "Problem Based Learning (PBL)"
- "Project Based Learning (PjBL)"
- "Discovery Learning"
- "Inquiry Based Learning"
- "Pembelajaran Berdiferensiasi (Konten/Proses/Produk)"
- "Cooperative Learning (Jigsaw/STAD)"
- "Demonstrasi Interaktif & Eksperimen"
- "Diskusi Kelompok & Debat Positif"
- "Studi Kasus & Role Playing"
- "Simulasi & Stasiun Pembelajaran (Station Rotation)"

3. Kemitraan Pembelajaran (Pilih 2-3 string persis):
- "Orang Tua / Wali Murid"
- "Kolaborasi Antar Siswa (Peer Learning)"
- "Komunitas Lokal & Tokoh Masyarakat"
- "Narasumber / Ahli Profesi Outside"
- "Guru Antar Mata Pelajaran (Team Teaching)"
- "Perpustakaan & Instansi Daerah"

4. Pemanfaatan Digital (Pilih 2-3 string persis):
- "Papan Interaktif Digital (Jamboard / Padlet / Miro)"
- "Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)"
- "Perpustakaan Digital / E-Book / Portal Rumah Belajar"
- "Simulator & Visualisasi Interaktif (PhET / GeoGebra / Canva)"
- "LMS (Google Classroom / Moodle / Whatsapp Group)"
- "Video Pembelajaran Interaktif (Edpuzzle / YouTube)"
- "Asisten AI & Tools Generatif Pembelajaran"

Keluarkan dalam format JSON valid:
{
  "recommendedDpl": ["Bernalar Kritis", "Gotong Royong", "Kreatif"],
  "recommendedMethods": ["Problem Based Learning (PBL)", "Pembelajaran Berdiferensiasi (Konten/Proses/Produk)"],
  "recommendedPartnerships": ["Kolaborasi Antar Siswa (Peer Learning)", "Orang Tua / Wali Murid"],
  "recommendedDigitalTools": ["Papan Interaktif Digital (Jamboard / Padlet / Miro)", "Platform Kuis Interaktif (Kahoot! / Quizizz / Wordwall)"],
  "studentCharacteristics": "Sebagian besar murid memiliki gaya belajar visual dan kinestetik, antusias pada aktivitas kelompok.",
  "materialCharacteristics": "Materi bersifat konseptual dan kontekstual, membutuhkan demonstrasi dan simulasi konkret."
}`;
    } else {
      return res.status(400).json({ error: "fieldType tidak valid" });
    }

    const response = await callGeminiWithRetry(ai, {
      preferredModel: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error in /api/recommend-fields:", error);
    res.status(500).json({ success: false, error: error.message || "Gagal mendapatkan rekomendasi AI" });
  }
});

// API Main Generator for Deep Learning Lesson Plan (Rencana Pembelajaran Mendalam / RPM)
app.post("/api/generate-lesson-plan", async (req, res) => {
  try {
    const formData = req.body;
    const ai = getGeminiClient();

    const systemPrompt = `Kamu adalah pakar desain instruksional Kurikulum Merdeka dan pelopor Pembelajaran Mendalam (Deep Learning) di Indonesia.
Tugas utama kamu adalah menyusun dokumen lengkap "Rencana Pembelajaran Mendalam (RPM)" / Modul Ajar Mendalam berdasarkan input guru berikut:

DATAPEMBELAJARAN:
- Nama Guru: ${formData.namaGuru || '-'} (NIP: ${formData.nipGuru || '-'})
- Nama Kepala Sekolah: ${formData.namaKepsek || '-'} (NIP: ${formData.nipKepsek || '-'})
- Nama Sekolah: ${formData.namaSekolah || '-'}
- Mata Pelajaran: ${formData.mataPelajaran}
- Fase: ${formData.fase || '-'}
- Kelas: ${formData.kelas || '-'}
- Kelas / Fase: ${formData.faseKelas || `${formData.fase || ''} - ${formData.kelas || ''}`}
- Semester / Tahun Ajaran: ${formData.semesterTahun}
- Alokasi Waktu: ${formData.alokasiWaktu}
- Capaian Pembelajaran (CP): ${formData.capaianPembelajaran}
- Lingkup Materi: ${formData.lingkupMateri}
- Tujuan Pembelajaran (TP): ${formData.tujuanPembelajaran}
- Karakteristik Murid: ${formData.karakteristikMurid || 'Tercantum di tabel analisis'}
- Karakteristik Materi: ${formData.karakteristikMateri || 'Tercantum di tabel analisis'}
- Dimensi Profil Lulusan (DPL): ${Array.isArray(formData.dpl) ? formData.dpl.join(", ") : formData.dpl}
- Metode & Model Pembelajaran: ${Array.isArray(formData.metodeModel) ? formData.metodeModel.join(", ") : formData.metodeModel}
- Kemitraan Pembelajaran: ${Array.isArray(formData.kemitraan) ? formData.kemitraan.join(", ") : formData.kemitraan}
- Pemanfaatan Digital: ${Array.isArray(formData.pemanfaatanDigital) ? formData.pemanfaatanDigital.join(", ") : formData.pemanfaatanDigital}

PERSYARATAN WAJIB DOKUMEN RENCANA PEMBELAJARAN MENDALAM:
1. PADA KEGIATAN INTI PEMBELAJARAN, KAMU WAJIB MEMBAGI KEGIATAN MENJADI 3 TAHAPAN EKSPLISIT PEMBELAJARAN MENDALAM:
   - Tahap 1: MEMAHAMI (Understanding & Concept Exploration)
   - Tahap 2: MENGAPLIKASI (Application & Deep Problem Solving)
   - Tahap 3: MEREFLEKSI (Reflection, Metacognition & Self Assessment)

2. PADA SETIAP TAHAPAN KEGIATAN INTI, BERIKAN EKSPLISIT LABEL "PRINSIP PEMBELAJARAN MENDALAM", contoh:
   - [Prinsip Pembelajaran Mendalam: Berpusat Pada Murid & Meaningful Learning]
   - [Prinsip Pembelajaran Mendalam: Keterlibatan Aktif & Authentic Context]
   - [Prinsip Pembelajaran Mendalam: High Order Thinking (HOT) & Joyful Learning]
   - [Prinsip Pembelajaran Mendalam: Metakognisi & Feedback Loop]

3. Cantumkan rincian kegiatan Guru dan Kegiatan Murid secara sistematis, operasional, dan inspiratif.
4. Cantumkan Asesmen Awal (Diagnostik), Asesmen Formatif (Proses), dan Asesmen Sumatif (Akhir).
5. Berikan Lampiran LKPD ringkas, Bahan Ajar ringkas, dan Rubrik Penilaian.

Keluarkan dalam format JSON struktur persis berikut:
{
  "identitas": {
    "namaGuru": "${formData.namaGuru || ''}",
    "nipGuru": "${formData.nipGuru || ''}",
    "namaKepsek": "${formData.namaKepsek || ''}",
    "nipKepsek": "${formData.nipKepsek || ''}",
    "namaSekolah": "${formData.namaSekolah || ''}",
    "mataPelajaran": "${formData.mataPelajaran}",
    "fase": "${formData.fase || ''}",
    "kelas": "${formData.kelas || ''}",
    "faseKelas": "${formData.fase && formData.kelas ? `${formData.fase} - ${formData.kelas}` : (formData.faseKelas || '')}",
    "semesterTahun": "${formData.semesterTahun}",
    "alokasiWaktu": "${formData.alokasiWaktu}"
  },
  "analisisAwal": {
    "karakteristikMurid": "Uraian rinci identifikasi kebutuhan belajar murid (visual/auditori/kinestetik, kesiapan belajar)...",
    "karakteristikMateri": "Uraian rinci analisis materi (konkret/abstrak, konseptual, keterkaitan dengan kehidupan nyata)..."
  },
  "tujuanDanDpl": {
    "capaianPembelajaran": "${formData.capaianPembelajaran}",
    "lingkupMateri": "${formData.lingkupMateri}",
    "tujuanPembelajaran": "${formData.tujuanPembelajaran}",
    "indikatorKetercapaian": [
      "Indikator 1...",
      "Indikator 2...",
      "Indikator 3..."
    ],
    "dimensiProfilLulusan": ${JSON.stringify(formData.dpl || [])}
  },
  "desainPembelajaran": {
    "modelDanMetode": ${JSON.stringify(formData.metodeModel || [])},
    "kemitraanPembelajaran": ${JSON.stringify(formData.kemitraan || [])},
    "pemanfaatanDigital": ${JSON.stringify(formData.pemanfaatanDigital || [])},
    "saranaPrasarana": "Daftar alat dan media pembelajaran yang digunakan..."
  },
  "kegiatanPembelajaran": {
    "pendahuluan": {
      "alokasiWaktu": "15 Menit",
      "aktivitas": [
        "Pengondisian kelas, doa, dan apersepsi...",
        "Penyampaian tujuan pembelajaran dan motivasi...",
        "Asesmen diagnostik singkat untuk mengukur pengetahuan awal..."
      ]
    },
    "kegiatanInti": [
      {
        "tahapLabel": "MEMAHAMI",
        "subJudul": "Memahami Konsep & Eksplorasi Makna (Understanding)",
        "prinsipMendalamLabel": "Berpusat pada Murid & Meaningful Learning",
        "alokasiWaktu": "25 Menit",
        "aktivitasGuru": [
          "Guru memberikan stimulus awal berupa media interaktif / pertanyaan pemantik...",
          "Guru memfasilitasi diskusi eksplorasi konsep dan mengamati pemahaman siswa...",
          "Guru memberikan konfirmasi dan penguatan materi dasar..."
        ],
        "aktivitasMurid": [
          "Murid mengamati stimulus dan mencatat poin-poin utama...",
          "Murid mendiskusikan pertanyaan pemantik dalam kelompok kecil...",
          "Murid menyampaikan pendapat awal dan bertanya jawab dengan guru...",
          "Murid merumuskan pemahaman awal tentang materi..."
        ],
        "poinUtama": ["Mengeksplorasi konsep dasar melalui media digital...", "Menjawab pertanyaan pemantik..."]
      },
      {
        "tahapLabel": "MENGAPLIKASI",
        "subJudul": "Mengaplikasikan Konsep pada Konteks Nyata (Application)",
        "prinsipMendalamLabel": "Autentik, Kolaboratif & Problem Solving",
        "alokasiWaktu": "35 Menit",
        "aktivitasGuru": [
          "Guru membagikan LKPD / tugas berbasis masalah nyata...",
          "Guru memberikan bimbingan dan scaffolding sesuai kebutuhan kelompok...",
          "Guru memantau kerjasama dan keaktifan murid..."
        ],
        "aktivitasMurid": [
          "Murid merencanakan langkah penyelesaian masalah dalam kelompok...",
          "Murid menerapkan konsep untuk memecahkan masalah atau membuat produk...",
          "Murid melakukan pembagian peran dan diskusi kelompok secara kolaboratif...",
          "Murid menyusun bahan presentasi atau laporan hasil kerja..."
        ],
        "poinUtama": ["Menganalisis studi kasus nyata...", "Membuat produk penyelesaian masalah..."]
      },
      {
        "tahapLabel": "MEREFLEKSI",
        "subJudul": "Merefleksikan Pembelajaran & Evaluasi Diri (Reflection)",
        "prinsipMendalamLabel": "Metakognisi, Feedback Loop & Self Assessment",
        "alokasiWaktu": "15 Menit",
        "aktivitasGuru": [
          "Guru memfasilitasi sesi presentasi / pameran karya kelompok...",
          "Guru memberikan umpan balik (feedback) yang membangun...",
          "Guru memandu refleksi metakognitif siswa..."
        ],
        "aktivitasMurid": [
          "Murid mempresentasikan hasil karya dan menanggapi pertanyaan...",
          "Murid melakukan refleksi diri (apa yang dipahami dan hambatan)...",
          "Murid memberikan penilaian antarteman atau umpan balik positif..."
        ],
        "poinUtama": ["Mengidentifikasi apa yang sudah dipahami dan hal yang perlu ditingkatkan...", "Menyampaikan pemaknaan belajar..."]
      }
    ],
    "penutup": {
      "alokasiWaktu": "10 Menit",
      "aktivitas": [
        "Menyimpulkan poin-poin utama pembelajaran bersama murid...",
        "Refleksi singkat dan apresiasi terhadap kinerja siswa...",
        "Informasi kegiatan pembelajaran berikutnya dan doa penutup."
      ]
    }
  },
  "asesmen": {
    "diagnostik": "Teknik dan instrumen asesmen awal...",
    "formatif": "Teknik dan instrumen asesmen proses (observasi, jurnal, produk)...",
    "sumatif": "Teknik dan instrumen asesmen akhir (tes tulis, portofolio, rubrik unjuk kerja)..."
  },
  "remedialDanPengayaan": {
    "remedial": "Langkah pendampingan bagi siswa yang belum mencapai TP...",
    "pengayaan": "Tantangan berorientasi HOTS bagi siswa yang telah mencapai standar..."
  },
  "lampiran": {
    "lkpd": "Ringkasan Lembar Kerja Peserta Didik (soal/instruksi tugas)...",
    "bahanAjar": "Rangkuman materi singkat atau bahan bacaan guru & siswa...",
    "rubrikPenilaian": "Tabel/kriteria penilaian (Sangat Baik, Baik, Cukup, Perlu Bimbingan)...",
    "kktp": {
      "pendekatan": "Rubrik Kriteria Ketuntasan Tujuan Pembelajaran (Interval Nilai)",
      "deskripsi": "Pedoman penetapan kriteria ketuntasan belajar murid berdasarkan Kriteria Indikator TP.",
      "kriteria": [
        {
          "aspekPenilaian": "Indikator Ketercapaian TP 1 (Pemahaman Konsep)",
          "perluBimbingan": "Belum menunjukkan pemahaman konsep dasar (0 - 60%)",
          "cukup": "Menunjukkan pemahaman konsep dasar dengan bantuan (61 - 70%)",
          "layak": "Menunjukkan pemahaman konsep secara mandiri dan tepat (71 - 80%)",
          "mahir": "Menunjukkan pemahaman mendalam dan mampu menganalisis ulang (81 - 100%)"
        },
        {
          "aspekPenilaian": "Indikator Ketercapaian TP 2 (Aplikasi & Praktik)",
          "perluBimbingan": "Belum mampu menyelesaikan tugas / praktek (0 - 60%)",
          "cukup": "Mampu menyelesaikan sebagian tugas praktek dengan bimbingan (61 - 70%)",
          "layak": "Mampu menyelesaikan tugas praktek secara mandiri (71 - 80%)",
          "mahir": "Mampu mengaplikasikan pada masalah baru / konteks nyata (81 - 100%)"
        }
      ],
      "tindakLanjut": {
        "perluBimbingan": "Intervensi khusus dari guru dan penyederhanaan materi/tugas",
        "cukup": "Bimbingan tambahan pada poin indikator yang masih lemah",
        "layak": "Diberikan penguatan materi dan latihan soal mandiri",
        "mahir": "Diberikan pengayaan / soal tantangan berorientasi HOTS"
      }
    }
  },
  "jurnalHarian": {
    "judul": "Jurnal Harian Pelaksanaan Pembelajaran",
    "catatanRefleksiUmum": "Catatan ringkas keterlaksanaan alur Pembelajaran Mendalam, respon siswa, serta tindak lanjut perbaikan.",
    "entries": [
      {
        "hariTanggal": "Senin, ... 2026",
        "pertemuanJam": "Pertemuan 1 (Jam ke-1 & 2)",
        "mataPelajaran": "${formData.mataPelajaran}",
        "atp": "${formData.tujuanPembelajaran}",
        "materiAktivitas": "Aktivitas Tahap Memahami & Eksplorasi Konsep",
        "penilaian": "Asesmen Formatif (Observasi Sikap & Diskusi)",
        "catatanKendala": "Siswa aktif berdiskusi kelompok dan merespon pertanyaan pemantik dengan antusias."
      },
      {
        "hariTanggal": "Rabu, ... 2026",
        "pertemuanJam": "Pertemuan 2 (Jam ke-3 & 4)",
        "mataPelajaran": "${formData.mataPelajaran}",
        "atp": "${formData.tujuanPembelajaran}",
        "materiAktivitas": "Aktivitas Tahap Mengaplikasi & Praktikum LKPD",
        "penilaian": "Asesmen Formatif (Penilaian Kinerja / LKPD)",
        "catatanKendala": "Siswa berhasil menyelesaikan tugas praktek dan analisis masalah."
      }
    ]
  }
}`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send initial status event
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Menganalisis CP, TP, dan Identitas Pembelajaran Guru...', step: 1 })}\n\n`);

    const responseStream = await streamGeminiWithRetry(ai, {
      preferredModel: "gemini-3.6-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      },
    });

    let accumulatedText = "";
    let lastStatusTime = Date.now();
    let currentPhaseIndex = 0;

    const phaseMessages = [
      { msg: "Sedang merancang alur Deep Learning (Memahami, Mengaplikasi, Merefleksi)...", step: 2 },
      { msg: "Menyusun rincian Aktivitas Guru & Murid serta Prinsip Pembelajaran Mendalam...", step: 3 },
      { msg: "Membuat instrumen Asesmen Diagnostik, Formatif, Sumatif, & KKTP...", step: 4 },
      { msg: "Finishing touch... Memformat dokumen Rencana Pembelajaran Mendalam...", step: 5 },
      { msg: "Hampir selesai! Menyiapkan lampiran LKPD dan Bahan Ajar...", step: 5 }
    ];

    for await (const chunk of responseStream) {
      const textChunk = chunk.text || "";
      accumulatedText += textChunk;

      res.write(`data: ${JSON.stringify({ type: 'chunk', text: textChunk, length: accumulatedText.length })}\n\n`);

      const now = Date.now();
      if (now - lastStatusTime > 2200 && currentPhaseIndex < phaseMessages.length) {
        const statusItem = phaseMessages[currentPhaseIndex];
        res.write(`data: ${JSON.stringify({ type: 'status', message: statusItem.msg, step: statusItem.step })}\n\n`);
        currentPhaseIndex++;
        lastStatusTime = now;
      }
    }

    try {
      const parsedPlan = JSON.parse(accumulatedText);
      res.write(`data: ${JSON.stringify({ type: 'done', lessonPlan: parsedPlan })}\n\n`);
    } catch (parseErr) {
      const jsonMatch = accumulatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedPlan = JSON.parse(jsonMatch[0]);
        res.write(`data: ${JSON.stringify({ type: 'done', lessonPlan: parsedPlan })}\n\n`);
      } else {
        throw new Error("Gagal mengurai respons JSON dari AI. Silakan coba lagi.");
      }
    }
    res.end();
  } catch (error: any) {
    console.error("Error in /api/generate-lesson-plan:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message || "Gagal menyusun Rencana Pembelajaran Mendalam" });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || "Gagal menyusun Rencana Pembelajaran Mendalam" })}\n\n`);
      res.end();
    }
  }
});

// API Refine existing lesson plan with user prompt
app.post("/api/refine-lesson-plan", async (req, res) => {
  try {
    const { currentPlan, userInstruction } = req.body;
    const ai = getGeminiClient();

    const prompt = `Kamu adalah pakar kurikulum Rencana Pembelajaran Mendalam.
Berikut adalah Rencana Pembelajaran Mendalam (RPM) saat ini dalam format JSON:
${JSON.stringify(currentPlan, null, 2)}

Instruksi Revisi dari Guru:
"${userInstruction}"

Perbaiki dokumen JSON di atas sesuai instruksi guru dengan tetap menjaga struktur JSON asli dan mempertahankan label Memahami, Mengaplikasi, Merefleksi serta Prinsip Pembelajaran Mendalam.
Keluarkan hasil akhir HANYA dalam JSON valid dengan struktur persis sama dengan input.`;

    const response = await callGeminiWithRetry(ai, {
      preferredModel: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const text = response.text || "{}";
    const updatedPlan = JSON.parse(text);
    res.json({ success: true, lessonPlan: updatedPlan });
  } catch (error: any) {
    console.error("Error in /api/refine-lesson-plan:", error);
    res.status(500).json({ success: false, error: error.message || "Gagal merevisi rencana pembelajaran" });
  }
});

// API Generate Detailed LKPD (Lembar Kerja Peserta Didik) with AI
app.post("/api/generate-lkpd", async (req, res) => {
  try {
    const { planData, customInstruction } = req.body;
    const ai = getGeminiClient();

    const mataPelajaran = planData?.identitas?.mataPelajaran || "Mata Pelajaran";
    const faseKelas = planData?.identitas?.faseKelas || "Fase / Kelas";
    const topik = planData?.tujuanDanDpl?.lingkupMateri || "Materi Pembelajaran";
    const tp = planData?.tujuanDanDpl?.tujuanPembelajaran || "";
    const cp = planData?.tujuanDanDpl?.capaianPembelajaran || "";

    const prompt = `Kamu adalah pakar penyusun Lembar Kerja Peserta Didik (LKPD) Kurikulum Merdeka berorientasi Pembelajaran Mendalam (Deep Learning).
Buatkan dokumen LKPD LENGKAP, OTENTIK, dan INTERAKTIF berdasarkan Rencana Pembelajaran Mendalam (RPM) berikut:
- Mata Pelajaran: ${mataPelajaran}
- Fase / Kelas: ${faseKelas}
- Topik / Lingkup Materi: ${topik}
- Tujuan Pembelajaran: ${tp}
- Capaian Pembelajaran: ${cp}
${customInstruction ? `- Catatan Khusus Guru: ${customInstruction}` : ''}

DOKUMEN LKPD HARUS SANGAT RINCI DENGAN 4 KOMPONEN UTAMA BERIKUT:
1. Lembar Penugasan / Instruksi Kerja Kelompok (Judul, Tujuan Aktivitas, Alat & Bahan, Petunjuk/Langkah Kerja Operasional)
2. Panduan Aktivitas Praktikum / Eksplorasi Siswa (Judul Eksplorasi, Tujuan Praktikum, Langkah Kerja Praktikum, Tabel Lembar Pengamatan/Data Hasil Praktikum dengan header dan contoh baris isian, serta Pertanyaan Analisis)
3. Latihan Soal & Evaluasi (Minimal 5 Soal Pilihan Ganda HOTS dan Minimal 3 Soal Uraian/HOTS, LENGKAP dengan Kunci Jawaban & Pembahasan Detail untuk Guru)
4. Lembar Refleksi & Penilaian Diri Siswa (Pertanyaan Refleksi Metakognitif & Checklist Diri)

Keluarkan HANYA dalam format JSON valid dengan struktur persis berikut:
{
  "judulLKPD": "LEMBAR KERJA PESERTA DIDIK (LKPD) - ${topik.toUpperCase()}",
  "subJudul": "Aktivitas Pembelajaran Mendalam (Deep Learning)",
  "petunjukUmum": [
    "Tuliskan nama anggota kelompok / nama siswa pada kolom identitas yang disediakan.",
    "Bacalah setiap petunjuk kerja dengan cermat sebelum melakukan aktivitas.",
    "Gunakan nalar kritis dan kolaborasi yang baik dalam menyelesaikan setiap tahapan."
  ],
  "lembarPenugasan": {
    "judulTugas": "Lembar Penugasan & Diskusi Kelompok",
    "tujuanAktivitas": "Peserta didik dapat memahami konsep ${topik} melalui diskusi dan pemecahan masalah kontekstual.",
    "alatDanBahan": ["Buku Siswa / Modul Ajar", "Alat Tulis Lengkap", "Lembar Kerja Siswa", "Media / Alat Peraga"],
    "instruksiKerja": [
      "Bentuklah kelompok diskusi yang terdiri dari 4-5 siswa.",
      "Cermati studi kasus atau wacana masalah yang diberikan oleh guru.",
      "Diskusikan pertanyaan dengan anggota kelompok dan catat hasil kesepakatan kelompok."
    ]
  },
  "panduanPraktikum": {
    "judulEksplorasi": "Panduan Aktivitas Praktikum & Eksplorasi Siswa",
    "tujuanPraktikum": "Peserta didik dapat membuktikan dan menganalisis fenomena ${topik} melalui eksperimen/praktikum langsung.",
    "langkahKerja": [
      "Siapkan alat dan bahan praktikum secara rapi di atas meja kerja.",
      "Lakukan percobaan sesuai dengan tahapan kerja yang diinstruksikan.",
      "Catat setiap data hasil pengamatan ke dalam tabel pengamatan di bawah ini secara cermat."
    ],
    "tabelPengamatan": {
      "judulTabel": "Tabel Lembar Pengamatan & Data Hasil Praktikum",
      "headers": ["No", "Variabel / Objek Pengamatan", "Hasil Pengamatan (Siswa)", "Analisis Singkat"],
      "rows": [
        ["1", "Pengamatan Kondisi Awal", "", ""],
        ["2", "Pengamatan Setelah Perlakuan / Percobaan", "", ""],
        ["3", "Pengamatan Akhir & Hasil Percobaan", "", ""]
      ],
      "petunjukPengisian": "Isilah tabel di atas berdasarkan hasil pengamatan langsung atau percobaan kelompok kalian."
    },
    "pertanyaanAnalisis": [
      "Berdasarkan data tabel pengamatan, pola atau perubahan apa yang dapat kalian amati?",
      "Mengapa hal tersebut dapat terjadi? Jelaskan keterkaitannya dengan konsep materi ${topik}!",
      "Apa kesimpulan utama yang dapat diambil dari kegiatan praktikum ini?"
    ]
  },
  "latihanSoal": {
    "petunjukPengerjaan": "Jawablah pertanyaan-pertanyaan berikut dengan teliti, kritis, dan jujur!",
    "pilihanGanda": [
      {
        "no": 1,
        "pertanyaan": "Soal pilihan ganda 1 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "A. Pilihan A",
        "pembahasan": "Pembahasan rinci alasan jawaban A benar..."
      },
      {
        "no": 2,
        "pertanyaan": "Soal pilihan ganda 2 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "B. Pilihan B",
        "pembahasan": "Pembahasan..."
      },
      {
        "no": 3,
        "pertanyaan": "Soal pilihan ganda 3 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "C. Pilihan C",
        "pembahasan": "Pembahasan..."
      },
      {
        "no": 4,
        "pertanyaan": "Soal pilihan ganda 4 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "D. Pilihan D",
        "pembahasan": "Pembahasan..."
      },
      {
        "no": 5,
        "pertanyaan": "Soal pilihan ganda 5 (HOTS)...",
        "pilihan": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],
        "kunciJawaban": "A. Pilihan A",
        "pembahasan": "Pembahasan..."
      }
    ],
    "soalUraian": [
      {
        "no": 1,
        "pertanyaan": "Soal uraian 1 berorientasi studi kasus nyata...",
        "kunciJawaban": "Kunci jawaban dan panduan penskoran...",
        "pembahasan": "Pembahasan rinci..."
      },
      {
        "no": 2,
        "pertanyaan": "Soal uraian 2...",
        "kunciJawaban": "Kunci jawaban...",
        "pembahasan": "Pembahasan..."
      },
      {
        "no": 3,
        "pertanyaan": "Soal uraian 3...",
        "kunciJawaban": "Kunci jawaban...",
        "pembahasan": "Pembahasan..."
      }
    ]
  },
  "refleksiSiswa": {
    "pertanyaanRefleksi": [
      "Apa hal paling menarik yang aku pelajari hari ini?",
      "Hambatan apa yang aku temui saat praktikum/diskusi dan bagaimana cara mengatasinya?",
      "Bagaimana aku dapat menerapkan pengetahuan ini dalam kehidupan sehari-hari?"
    ],
    "checkListDiri": [
      "Saya memahami konsep dasar materi pembelajaran hari ini",
      "Saya aktif berdiskusi dan bekerjasama dalam kelompok",
      "Saya dapat menyelesaikan praktikum dan latihan soal dengan jujur"
    ]
  }
}`;

    const response = await callGeminiWithRetry(ai, {
      preferredModel: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const text = response.text || "{}";
    const lkpdData = JSON.parse(text);
    res.json({ success: true, lkpd: lkpdData });
  } catch (error: any) {
    console.error("Error in /api/generate-lkpd:", error);
    res.status(500).json({ success: false, error: error.message || "Gagal membuat LKPD dengan AI" });
  }
});

// Serve Vite in dev or static files in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Rencana Pembelajaran Mendalam berjalan di http://localhost:${PORT}`);
  });
}

start();
