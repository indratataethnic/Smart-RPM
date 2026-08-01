import fs from "fs";
import path from "path";

export interface AccessCode {
  id: string;
  code: string;
  type: "PERMANENT" | "MONTHLY";
  status: "ACTIVE" | "EXPIRED" | "DISABLED";
  valid_from: string; // ISO date
  valid_until: string | null; // ISO date or null
  created_at: string;
  created_by: string;
  notes: string;
}

export interface TrialUser {
  id: string; // fingerprint hash or device id
  remaining_trials: number;
  created_at: string;
  last_active: string;
  ip: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  activity_type: 
    | "GENERATE_RPM"
    | "VALIDATE_CODE_SUCCESS"
    | "VALIDATE_CODE_FAILED"
    | "TRIAL_USED"
    | "TRIAL_EXHAUSTED"
    | "CODE_CREATED"
    | "CODE_DELETED"
    | "CODE_DISABLED"
    | "CODE_ENABLED"
    | "CODE_EDITED";
  details: string;
  user_info: {
    ip: string;
    browser: string;
    codeUsed?: string;
  };
}

interface DatabaseSchema {
  access_codes: AccessCode[];
  trial_users: TrialUser[];
  activity_logs: ActivityLog[];
}

const DB_FILE = path.join(process.cwd(), "licensing_db.json");
const TMP_DB_FILE = path.join("/tmp", "licensing_db.json");

let memoryDB: DatabaseSchema | null = null;

// Safe load helper
function loadDB(): DatabaseSchema {
  if (memoryDB) return memoryDB;

  const initialDB: DatabaseSchema = {
    access_codes: [
      {
        id: "code-perm-1",
        code: "RPM-PERM-KARANGANYAR",
        type: "PERMANENT",
        status: "ACTIVE",
        valid_from: new Date().toISOString(),
        valid_until: null,
        created_at: new Date().toISOString(),
        created_by: "System Admin",
        notes: "Akses Permanen & Selamanya Khusus SD Negeri Karanganyar",
      },
      {
        id: "code-monthly-demo",
        code: "RPM-2026-07-DEMO123",
        type: "MONTHLY",
        status: "ACTIVE",
        valid_from: "2026-07-01T00:00:00.000Z",
        valid_until: "2026-08-31T23:59:59.000Z",
        created_at: new Date().toISOString(),
        created_by: "System Admin",
        notes: "Kode Akses Bulan Juli - Agustus 2026 (Demo Bulanan Sekolah Lain)",
      },
      {
        id: "code-monthly-exp",
        code: "RPM-2026-06-EXPIRED",
        type: "MONTHLY",
        status: "ACTIVE", // Start as active, but validation logic checks date
        valid_from: "2026-06-01T00:00:00.000Z",
        valid_until: "2026-06-30T23:59:59.000Z",
        created_at: new Date().toISOString(),
        created_by: "System Admin",
        notes: "Kode Bulanan Lama (Juni 2026) - Sudah Kedaluwarsa",
      }
    ],
    trial_users: [],
    activity_logs: [],
  };

  try {
    let targetFile = DB_FILE;
    if (!fs.existsSync(targetFile) && fs.existsSync(TMP_DB_FILE)) {
      targetFile = TMP_DB_FILE;
    }
    if (fs.existsSync(targetFile)) {
      const data = fs.readFileSync(targetFile, "utf8");
      memoryDB = JSON.parse(data);
      return memoryDB!;
    }
  } catch (err) {
    console.error("Error loading licensing database, fallback to memory database:", err);
  }

  memoryDB = initialDB;
  saveDB(memoryDB);
  return memoryDB;
}

// Safe save helper
function saveDB(db: DatabaseSchema) {
  memoryDB = db;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    try {
      fs.writeFileSync(TMP_DB_FILE, JSON.stringify(db, null, 2), "utf8");
    } catch (e) {
      console.warn("Read-only filesystem detected (Vercel/Serverless). Database saved in memory.");
    }
  }
}

// -----------------------------------------------------------------
// DATABASE OPERATIONS
// -----------------------------------------------------------------

export const LicensingDB = {
  // --- Access Codes ---
  getAccessCodes(): AccessCode[] {
    const db = loadDB();
    // Dynamically update status to EXPIRED for MONTHLY codes if current time has passed valid_until
    const now = new Date();
    let updated = false;
    db.access_codes.forEach((c) => {
      if (c.type === "MONTHLY" && c.status === "ACTIVE" && c.valid_until && new Date(c.valid_until) < now) {
        c.status = "EXPIRED";
        updated = true;
      }
    });
    if (updated) {
      saveDB(db);
    }
    return db.access_codes;
  },

  getAccessCodeByCode(code: string): AccessCode | undefined {
    const codes = this.getAccessCodes();
    return codes.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  },

  createAccessCode(newCode: Omit<AccessCode, "id" | "created_at">): AccessCode {
    const db = loadDB();
    const created: AccessCode = {
      ...newCode,
      id: "code-" + Math.random().toString(36).substr(2, 9),
      code: newCode.code.toUpperCase().trim(),
      created_at: new Date().toISOString(),
    };
    db.access_codes.push(created);
    saveDB(db);
    this.addLog("CODE_CREATED", `Kode baru berhasil dibuat: ${created.code} (${created.type})`, {
      ip: "127.0.0.1",
      browser: "Admin Dashboard",
    });
    return created;
  },

  updateAccessCode(id: string, updates: Partial<Omit<AccessCode, "id" | "code" | "type" | "created_at">>): AccessCode | null {
    const db = loadDB();
    const idx = db.access_codes.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    db.access_codes[idx] = {
      ...db.access_codes[idx],
      ...updates,
    };
    const updated = db.access_codes[idx];
    saveDB(db);
    this.addLog("CODE_EDITED", `Kode diubah: ${updated.code} (Status: ${updated.status})`, {
      ip: "127.0.0.1",
      browser: "Admin Dashboard",
    });
    return updated;
  },

  deleteAccessCode(id: string): boolean {
    const db = loadDB();
    const idx = db.access_codes.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    const codeStr = db.access_codes[idx].code;
    db.access_codes.splice(idx, 1);
    saveDB(db);
    this.addLog("CODE_DELETED", `Kode dihapus: ${codeStr}`, {
      ip: "127.0.0.1",
      browser: "Admin Dashboard",
    });
    return true;
  },

  // --- Trial Users ---
  getAllTrialUsers(): TrialUser[] {
    const db = loadDB();
    return db.trial_users || [];
  },

  getTrialUser(id: string): TrialUser | undefined {
    const db = loadDB();
    return db.trial_users.find((u) => u.id === id);
  },

  resetTrial(id: string): boolean {
    const db = loadDB();
    const user = db.trial_users.find((u) => u.id === id);
    if (user) {
      user.remaining_trials = 5;
      user.last_active = new Date().toISOString();
      saveDB(db);
      this.addLog("CODE_EDITED", `Trial di-reset ke 5 untuk user: ${id}`, { ip: "127.0.0.1", browser: "Admin Dashboard" });
      return true;
    }
    return false;
  },

  registerOrGetTrialUser(id: string, ip: string): TrialUser {
    const db = loadDB();
    let user = db.trial_users.find((u) => u.id === id);
    if (!user) {
      user = {
        id,
        remaining_trials: 5,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        ip,
      };
      db.trial_users.push(user);
      saveDB(db);
    } else {
      user.last_active = new Date().toISOString();
      user.ip = ip;
      saveDB(db);
    }
    return user;
  },

  decrementTrial(id: string): boolean {
    const db = loadDB();
    const idx = db.trial_users.findIndex((u) => u.id === id);
    if (idx === -1) return false;

    if (db.trial_users[idx].remaining_trials > 0) {
      db.trial_users[idx].remaining_trials -= 1;
      db.trial_users[idx].last_active = new Date().toISOString();
      saveDB(db);
      return true;
    }
    return false;
  },

  // --- Logs ---
  getLogs(): ActivityLog[] {
    const db = loadDB();
    return db.activity_logs;
  },

  addLog(
    type: ActivityLog["activity_type"],
    details: string,
    userInfo: { ip: string; browser: string; codeUsed?: string }
  ): ActivityLog {
    const db = loadDB();
    const log: ActivityLog = {
      id: "log-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      activity_type: type,
      details,
      user_info: userInfo,
    };
    db.activity_logs.unshift(log); // newest first
    if (db.activity_logs.length > 2000) {
      db.activity_logs.pop(); // Cap log size
    }
    saveDB(db);
    return log;
  },
};
