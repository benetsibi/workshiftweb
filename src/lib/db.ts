import { Pool } from 'pg';
import { initialSeedData } from './seedData';
import {
  Department,
  HospitalSettings,
  Role,
  Shift,
  ShiftWithDetails,
  TradeRequest,
  TradeWithDetails,
  User,
} from './types';

// PostgreSQL Connection String (Supports standard DATABASE_URL and Vercel Storage POSTGRES_URL)
const rawConn =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  'postgresql://postgres:postgres@localhost:5432/shifttracker';
const isLocal = rawConn.includes('localhost') || rawConn.includes('127.0.0.1');

// Only attempt PG if DATABASE_URL or POSTGRES_URL is provided or not in a serverless cloud environment
const isCloudWithoutDb =
  Boolean(process.env.VERCEL) &&
  !process.env.DATABASE_URL &&
  !process.env.POSTGRES_URL &&
  !process.env.POSTGRES_PRISMA_URL;

export const pool = new Pool({
  connectionString: rawConn,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// Row Mappers
function mapDepartment(row: any): Department {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    color: row.color,
    description: row.description || '',
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role as Role,
    title: row.title || '',
    phone: row.phone || '',
    avatarUrl: row.avatar_url,
    hourlyRate: Number(row.hourly_rate || 0),
    departmentId: row.department_id || '',
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapShift(row: any): ShiftWithDetails {
  const shift: ShiftWithDetails = {
    id: row.id,
    title: row.title,
    userId: row.user_id,
    departmentId: row.department_id,
    startTime: new Date(row.start_time).toISOString(),
    endTime: new Date(row.end_time).toISOString(),
    breakMinutes: row.break_minutes || 0,
    location: row.location || 'Inpatient Ward',
    notes: row.notes || '',
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };

  if (row.user_name || row.u_name) {
    shift.user = {
      id: row.user_id,
      name: row.user_name || row.u_name,
      email: row.user_email || row.u_email,
      title: row.user_title || row.u_title,
      avatarUrl: row.user_avatar || row.u_avatar,
    };
  }

  if (row.dept_name || row.d_name) {
    shift.department = {
      id: row.department_id,
      name: row.dept_name || row.d_name,
      code: row.dept_code || row.d_code,
      color: row.dept_color || row.d_color || '#0284c7',
      description: row.dept_desc || '',
      createdAt: '',
    };
  }

  return shift;
}

function mapTrade(row: any): TradeWithDetails {
  return {
    id: row.id,
    requesterId: row.requester_id,
    requesterShiftId: row.requester_shift_id,
    targetUserId: row.target_user_id,
    targetShiftId: row.target_shift_id,
    reason: row.reason || '',
    status: row.status,
    adminNotes: row.admin_notes || '',
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    requester: {
      id: row.requester_id,
      name: row.req_name || '',
      email: row.req_email || '',
      title: row.req_title || '',
    },
    requesterShift: {
      id: row.requester_shift_id,
      title: row.req_shift_title || 'Day Shift',
      userId: row.requester_id,
      departmentId: row.req_shift_dept_id,
      startTime: row.req_shift_start ? new Date(row.req_shift_start).toISOString() : '',
      endTime: row.req_shift_end ? new Date(row.req_shift_end).toISOString() : '',
      breakMinutes: row.req_shift_break || 60,
      location: row.req_shift_loc || 'Inpatient Ward',
      status: row.req_shift_status || 'SCHEDULED',
      createdAt: '',
      updatedAt: '',
      department: row.req_dept_name
        ? {
            id: row.req_shift_dept_id,
            name: row.req_dept_name,
            code: row.req_dept_code,
            color: row.req_dept_color || '#0284c7',
            description: '',
            createdAt: '',
          }
        : undefined,
    },
    targetUser: {
      id: row.target_user_id,
      name: row.tgt_name || '',
      email: row.tgt_email || '',
      title: row.tgt_title || '',
    },
    targetShift: {
      id: row.target_shift_id,
      title: row.tgt_shift_title || 'Night Shift',
      userId: row.target_user_id,
      departmentId: row.tgt_shift_dept_id,
      startTime: row.tgt_shift_start ? new Date(row.tgt_shift_start).toISOString() : '',
      endTime: row.tgt_shift_end ? new Date(row.tgt_shift_end).toISOString() : '',
      breakMinutes: row.tgt_shift_break || 60,
      location: row.tgt_shift_loc || 'Inpatient Ward',
      status: row.tgt_shift_status || 'SCHEDULED',
      createdAt: '',
      updatedAt: '',
      department: row.tgt_dept_name
        ? {
            id: row.tgt_shift_dept_id,
            name: row.tgt_dept_name,
            code: row.tgt_dept_code,
            color: row.tgt_dept_color || '#4f46e5',
            description: '',
            createdAt: '',
          }
        : undefined,
    },
  };
}

function mapSettings(row: any): HospitalSettings {
  return {
    hospitalName: row.hospital_name,
    unitName: row.unit_name,
    dayShiftStart: row.day_shift_start,
    dayShiftEnd: row.day_shift_end,
    nightShiftStart: row.night_shift_start,
    nightShiftEnd: row.night_shift_end,
    autoApproval: Boolean(row.auto_approval),
    emailAlerts: Boolean(row.email_alerts),
  };
}

// -------------------------------------------------------------
// PostgreSQL Auto-Migration & Schema Setup
// -------------------------------------------------------------
let schemaInitialized = false;
async function ensureTablesAndSeed() {
  if (schemaInitialized) return;
  schemaInitialized = true;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        color VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        phone VARCHAR(50),
        avatar_url TEXT,
        hourly_rate NUMERIC(10, 2),
        department_id VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS shifts (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        department_id VARCHAR(50),
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        break_minutes INTEGER DEFAULT 60,
        location VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'SCHEDULED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trade_requests (
        id VARCHAR(50) PRIMARY KEY,
        requester_id VARCHAR(50) NOT NULL,
        requester_shift_id VARCHAR(50) NOT NULL,
        target_user_id VARCHAR(50) NOT NULL,
        target_shift_id VARCHAR(50) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'PENDING_PEER',
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hospital_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        hospital_name VARCHAR(255) NOT NULL,
        unit_name VARCHAR(255) NOT NULL,
        day_shift_start VARCHAR(10) NOT NULL,
        day_shift_end VARCHAR(10) NOT NULL,
        night_shift_start VARCHAR(10) NOT NULL,
        night_shift_end VARCHAR(10) NOT NULL,
        auto_approval BOOLEAN DEFAULT false,
        email_alerts BOOLEAN DEFAULT true,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Auto seed if empty
    const checkUsers = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(checkUsers.rows[0].count, 10) === 0) {
      for (const d of initialSeedData.departments) {
        await pool.query(
          `INSERT INTO departments (id, name, code, color, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
          [d.id, d.name, d.code, d.color, d.description, d.createdAt]
        );
      }
      for (const u of initialSeedData.users) {
        await pool.query(
          `INSERT INTO users (id, email, password_hash, name, role, title, phone, avatar_url, hourly_rate, department_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO NOTHING`,
          [u.id, u.email, u.passwordHash, u.name, u.role, u.title, u.phone, u.avatarUrl, u.hourlyRate, u.departmentId, u.createdAt, u.updatedAt]
        );
      }
      for (const s of initialSeedData.shifts) {
        await pool.query(
          `INSERT INTO shifts (id, title, user_id, department_id, start_time, end_time, break_minutes, location, notes, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO NOTHING`,
          [s.id, s.title, s.userId, s.departmentId, s.startTime, s.endTime, s.breakMinutes, s.location, (s as any).notes || '', s.status, s.createdAt, s.updatedAt]
        );
      }
      if (initialSeedData.settings) {
        const st = initialSeedData.settings;
        await pool.query(
          `INSERT INTO hospital_settings (id, hospital_name, unit_name, day_shift_start, day_shift_end, night_shift_start, night_shift_end, auto_approval, email_alerts, updated_at)
           VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, NOW()) ON CONFLICT (id) DO NOTHING`,
          [st.hospitalName, st.unitName, st.dayShiftStart, st.dayShiftEnd, st.nightShiftStart, st.nightShiftEnd, st.autoApproval, st.emailAlerts]
        );
      }
    }
  } catch (e) {
    console.error('[DB] PostgreSQL init warning:', e);
  }
}

// Check PG availability
let pgAvailable: boolean | null = null;
async function isPgWorking(): Promise<boolean> {
  if (isCloudWithoutDb) return false;
  if (pgAvailable !== null) return pgAvailable;

  try {
    const res = await pool.query('SELECT 1');
    if (res) {
      pgAvailable = true;
      await ensureTablesAndSeed();
      return true;
    }
  } catch {
    console.warn('[DB] Cloud or local PostgreSQL unreachable. Switching to in-memory fallback store.');
    pgAvailable = false;
  }
  return false;
}

// -------------------------------------------------------------
// IN-MEMORY / JSON FALLBACK STORE (Active when PG is unconfigured)
// -------------------------------------------------------------
const memoryStore = {
  departments: JSON.parse(JSON.stringify(initialSeedData.departments)) as Department[],
  users: JSON.parse(JSON.stringify(initialSeedData.users)) as User[],
  shifts: JSON.parse(JSON.stringify(initialSeedData.shifts)) as Shift[],
  trades: JSON.parse(JSON.stringify((initialSeedData as any).trades || [])) as TradeRequest[],
  settings: {
    hospitalName: 'Workforce Operations',
    unitName: 'Operations Unit',
    dayShiftStart: '07:00',
    dayShiftEnd: '19:00',
    nightShiftStart: '19:00',
    nightShiftEnd: '07:00',
    autoApproval: false,
    emailAlerts: true,
  } as HospitalSettings,
};

// -------------------------------------------------------------
// MAIN DATABASE EXPORT (PG with transparent In-Memory Fallback)
// -------------------------------------------------------------
export const db = {
  // --- USERS ---
  users: {
    async findByEmail(email: string): Promise<User | null> {
      const clean = email.trim().toLowerCase();
      const prefix = clean.split('@')[0];

      if (await isPgWorking()) {
        try {
          const res = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(email) LIKE $2 LIMIT 1',
            [clean, `${prefix}@%`]
          );
          if (res.rows.length > 0) return mapUser(res.rows[0]);
        } catch {
          // fallback to memory
        }
      }

      return (
        memoryStore.users.find(
          (u) =>
            u.email.toLowerCase() === clean ||
            u.email.toLowerCase().startsWith(prefix + '@')
        ) || null
      );
    },

    async findById(id: string): Promise<User | null> {
      if (await isPgWorking()) {
        try {
          const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
          if (res.rows.length > 0) return mapUser(res.rows[0]);
        } catch {
          // fallback to memory
        }
      }
      return memoryStore.users.find((u) => u.id === id) || null;
    },

    async list(departmentId?: string, role?: Role): Promise<User[]> {
      if (await isPgWorking()) {
        try {
          let query = 'SELECT * FROM users WHERE 1=1';
          const params: any[] = [];
          if (departmentId) {
            params.push(departmentId);
            query += ` AND department_id = $${params.length}`;
          }
          if (role) {
            params.push(role);
            query += ` AND role = $${params.length}`;
          }
          query += ' ORDER BY role ASC, name ASC';
          const res = await pool.query(query, params);
          return res.rows.map(mapUser);
        } catch {
          // fallback to memory
        }
      }

      return memoryStore.users.filter((u) => {
        if (departmentId && u.departmentId !== departmentId) return false;
        if (role && u.role !== role) return false;
        return true;
      });
    },

    async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
      const id = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      if (await isPgWorking()) {
        try {
          const res = await pool.query(
            `INSERT INTO users (id, email, password_hash, name, role, title, phone, avatar_url, hourly_rate, department_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
             RETURNING *`,
            [
              id,
              userData.email,
              userData.passwordHash,
              userData.name,
              userData.role,
              userData.title || '',
              userData.phone || '',
              userData.avatarUrl || null,
              userData.hourlyRate || 40,
              userData.departmentId || null,
            ]
          );
          return mapUser(res.rows[0]);
        } catch {
          // fallback to memory
        }
      }

      const newUser: User = {
        ...userData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.users.push(newUser);
      return newUser;
    },

    async update(id: string, updates: Partial<User>): Promise<User | null> {
      if (await isPgWorking()) {
        try {
          const fields: string[] = [];
          const params: any[] = [id];

          if (updates.name !== undefined) {
            params.push(updates.name);
            fields.push(`name = $${params.length}`);
          }
          if (updates.email !== undefined) {
            params.push(updates.email);
            fields.push(`email = $${params.length}`);
          }
          if (updates.title !== undefined) {
            params.push(updates.title);
            fields.push(`title = $${params.length}`);
          }
          if (updates.phone !== undefined) {
            params.push(updates.phone);
            fields.push(`phone = $${params.length}`);
          }
          if (updates.hourlyRate !== undefined) {
            params.push(updates.hourlyRate);
            fields.push(`hourly_rate = $${params.length}`);
          }
          if (updates.departmentId !== undefined) {
            params.push(updates.departmentId);
            fields.push(`department_id = $${params.length}`);
          }
          fields.push('updated_at = NOW()');

          const res = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
            params
          );
          if (res.rows.length > 0) return mapUser(res.rows[0]);
        } catch {
          // fallback to memory
        }
      }

      const idx = memoryStore.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        memoryStore.users[idx] = {
          ...memoryStore.users[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return memoryStore.users[idx];
      }
      return null;
    },

    async delete(id: string): Promise<boolean> {
      if (await isPgWorking()) {
        try {
          await pool.query('DELETE FROM shifts WHERE user_id = $1', [id]);
          await pool.query('DELETE FROM trade_requests WHERE requester_id = $1 OR target_user_id = $1', [id]);
          const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
          return (res.rowCount || 0) > 0;
        } catch {
          // fallback to memory
        }
      }
      memoryStore.shifts = memoryStore.shifts.filter((s) => s.userId !== id);
      memoryStore.trades = memoryStore.trades.filter((t) => t.requesterId !== id && t.targetUserId !== id);
      const initialLen = memoryStore.users.length;
      memoryStore.users = memoryStore.users.filter((u) => u.id !== id);
      return memoryStore.users.length < initialLen;
    },
  },

  // --- DEPARTMENTS ---
  departments: {
    async list(): Promise<Department[]> {
      if (await isPgWorking()) {
        try {
          const res = await pool.query('SELECT * FROM departments ORDER BY name ASC');
          return res.rows.map(mapDepartment);
        } catch {
          // fallback to memory
        }
      }
      return memoryStore.departments;
    },

    async findById(id: string): Promise<Department | null> {
      if (await isPgWorking()) {
        try {
          const res = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
          if (res.rows.length > 0) return mapDepartment(res.rows[0]);
        } catch {
          // fallback to memory
        }
      }
      return memoryStore.departments.find((d) => d.id === id) || null;
    },

    async create(deptData: Omit<Department, 'id' | 'createdAt'>): Promise<Department> {
      const id = `dept-${Date.now()}`;
      if (await isPgWorking()) {
        try {
          const res = await pool.query(
            `INSERT INTO departments (id, name, code, color, description, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
            [id, deptData.name, deptData.code, deptData.color, deptData.description]
          );
          return mapDepartment(res.rows[0]);
        } catch {
          // fallback to memory
        }
      }

      const newDept: Department = {
        ...deptData,
        id,
        createdAt: new Date().toISOString(),
      };
      memoryStore.departments.push(newDept);
      return newDept;
    },
  },

  // --- SHIFTS ---
  shifts: {
    async list(filters?: {
      userId?: string;
      departmentId?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    }): Promise<ShiftWithDetails[]> {
      if (await isPgWorking()) {
        try {
          let query = `
            SELECT s.*, 
                   u.name as user_name, u.email as user_email, u.title as user_title, u.avatar_url as user_avatar,
                   d.name as dept_name, d.code as dept_code, d.color as dept_color, d.description as dept_desc
            FROM shifts s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN departments d ON s.department_id = d.id
            WHERE 1=1
          `;
          const params: any[] = [];
          if (filters?.userId) {
            params.push(filters.userId);
            query += ` AND s.user_id = $${params.length}`;
          }
          if (filters?.departmentId) {
            params.push(filters.departmentId);
            query += ` AND s.department_id = $${params.length}`;
          }
          if (filters?.status) {
            params.push(filters.status);
            query += ` AND s.status = $${params.length}`;
          }
          if (filters?.startDate) {
            params.push(filters.startDate);
            query += ` AND s.start_time >= $${params.length}`;
          }
          if (filters?.endDate) {
            params.push(filters.endDate);
            query += ` AND s.start_time <= $${params.length}`;
          }
          query += ' ORDER BY s.start_time ASC';
          const res = await pool.query(query, params);
          return res.rows.map(mapShift);
        } catch {
          // fallback to memory
        }
      }

      return memoryStore.shifts
        .filter((s) => {
          if (filters?.userId && s.userId !== filters.userId) return false;
          if (filters?.departmentId && s.departmentId !== filters.departmentId) return false;
          if (filters?.status && s.status !== filters.status) return false;
          if (filters?.startDate && s.startTime < filters.startDate) return false;
          if (filters?.endDate && s.startTime > filters.endDate) return false;
          return true;
        })
        .map((s) => {
          const u = memoryStore.users.find((user) => user.id === s.userId);
          const d = memoryStore.departments.find((dept) => dept.id === s.departmentId);
          return {
            ...s,
            user: u
              ? {
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  title: u.title,
                  avatarUrl: u.avatarUrl,
                }
              : undefined,
            department: d,
          };
        });
    },

    async findById(id: string): Promise<ShiftWithDetails | null> {
      if (await isPgWorking()) {
        try {
          const res = await pool.query(
            `SELECT s.*, 
                    u.name as user_name, u.email as user_email, u.title as user_title, u.avatar_url as user_avatar,
                    d.name as dept_name, d.code as dept_code, d.color as dept_color, d.description as dept_desc
             FROM shifts s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN departments d ON s.department_id = d.id
             WHERE s.id = $1`,
            [id]
          );
          if (res.rows.length > 0) return mapShift(res.rows[0]);
        } catch {
          // fallback to memory
        }
      }

      const shift = memoryStore.shifts.find((s) => s.id === id);
      if (!shift) return null;
      const u = memoryStore.users.find((user) => user.id === shift.userId);
      const d = memoryStore.departments.find((dept) => dept.id === shift.departmentId);
      return {
        ...shift,
        user: u
          ? {
              id: u.id,
              name: u.name,
              email: u.email,
              title: u.title,
              avatarUrl: u.avatarUrl,
            }
          : undefined,
        department: d,
      };
    },

    async create(shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShiftWithDetails> {
      const id = `sh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      if (await isPgWorking()) {
        try {
          await pool.query(
            `INSERT INTO shifts (id, title, user_id, department_id, start_time, end_time, break_minutes, location, notes, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
            [
              id,
              shiftData.title,
              shiftData.userId,
              shiftData.departmentId,
              shiftData.startTime,
              shiftData.endTime,
              shiftData.breakMinutes || 60,
              shiftData.location || 'Inpatient Ward',
              shiftData.notes || '',
              shiftData.status || 'SCHEDULED',
            ]
          );
          const created = await this.findById(id);
          if (created) return created;
        } catch {
          // fallback to memory
        }
      }

      const newShift: Shift = {
        ...shiftData,
        id,
        breakMinutes: shiftData.breakMinutes || 60,
        location: shiftData.location || 'Inpatient Ward',
        notes: shiftData.notes || '',
        status: shiftData.status || 'SCHEDULED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.shifts.push(newShift);
      return (await this.findById(id))!;
    },

    async update(id: string, updates: Partial<Shift>): Promise<ShiftWithDetails | null> {
      if (await isPgWorking()) {
        try {
          const fields: string[] = [];
          const params: any[] = [id];

          if (updates.title !== undefined) {
            params.push(updates.title);
            fields.push(`title = $${params.length}`);
          }
          if (updates.userId !== undefined) {
            params.push(updates.userId);
            fields.push(`user_id = $${params.length}`);
          }
          if (updates.departmentId !== undefined) {
            params.push(updates.departmentId);
            fields.push(`department_id = $${params.length}`);
          }
          if (updates.startTime !== undefined) {
            params.push(updates.startTime);
            fields.push(`start_time = $${params.length}`);
          }
          if (updates.endTime !== undefined) {
            params.push(updates.endTime);
            fields.push(`end_time = $${params.length}`);
          }
          if (updates.breakMinutes !== undefined) {
            params.push(updates.breakMinutes);
            fields.push(`break_minutes = $${params.length}`);
          }
          if (updates.location !== undefined) {
            params.push(updates.location);
            fields.push(`location = $${params.length}`);
          }
          if (updates.notes !== undefined) {
            params.push(updates.notes);
            fields.push(`notes = $${params.length}`);
          }
          if (updates.status !== undefined) {
            params.push(updates.status);
            fields.push(`status = $${params.length}`);
          }
          fields.push('updated_at = NOW()');

          await pool.query(`UPDATE shifts SET ${fields.join(', ')} WHERE id = $1`, params);
          return await this.findById(id);
        } catch {
          // fallback to memory
        }
      }

      const idx = memoryStore.shifts.findIndex((s) => s.id === id);
      if (idx !== -1) {
        memoryStore.shifts[idx] = {
          ...memoryStore.shifts[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return await this.findById(id);
      }
      return null;
    },

    async delete(id: string): Promise<boolean> {
      if (await isPgWorking()) {
        try {
          await pool.query('DELETE FROM trade_requests WHERE requester_shift_id = $1 OR target_shift_id = $1', [id]);
          const res = await pool.query('DELETE FROM shifts WHERE id = $1', [id]);
          return (res.rowCount || 0) > 0;
        } catch {
          // fallback to memory
        }
      }
      memoryStore.trades = memoryStore.trades.filter((t) => t.requesterShiftId !== id && t.targetShiftId !== id);
      const initLen = memoryStore.shifts.length;
      memoryStore.shifts = memoryStore.shifts.filter((s) => s.id !== id);
      return memoryStore.shifts.length < initLen;
    },
  },

  // --- TRADES ---
  trades: {
    async list(filters?: {
      userId?: string;
      status?: string;
      pendingAdmin?: boolean;
    }): Promise<TradeWithDetails[]> {
      if (await isPgWorking()) {
        try {
          let query = `
            SELECT t.*,
                   req.name as req_name, req.email as req_email, req.title as req_title,
                   tgt.name as tgt_name, tgt.email as tgt_email, tgt.title as tgt_title,
                   rs.title as req_shift_title, rs.department_id as req_shift_dept_id, rs.start_time as req_shift_start, rs.end_time as req_shift_end, rs.break_minutes as req_shift_break, rs.location as req_shift_loc, rs.status as req_shift_status,
                   rd.name as req_dept_name, rd.code as req_dept_code, rd.color as req_dept_color,
                   ts.title as tgt_shift_title, ts.department_id as tgt_shift_dept_id, ts.start_time as tgt_shift_start, ts.end_time as tgt_shift_end, ts.break_minutes as tgt_shift_break, ts.location as tgt_shift_loc, ts.status as tgt_shift_status,
                   td.name as tgt_dept_name, td.code as tgt_dept_code, td.color as tgt_dept_color
            FROM trade_requests t
            LEFT JOIN users req ON t.requester_id = req.id
            LEFT JOIN users tgt ON t.target_user_id = tgt.id
            LEFT JOIN shifts rs ON t.requester_shift_id = rs.id
            LEFT JOIN departments rd ON rs.department_id = rd.id
            LEFT JOIN shifts ts ON t.target_shift_id = ts.id
            LEFT JOIN departments td ON ts.department_id = td.id
            WHERE 1=1
          `;
          const params: any[] = [];
          if (filters?.userId) {
            params.push(filters.userId);
            query += ` AND (t.requester_id = $${params.length} OR t.target_user_id = $${params.length})`;
          }
          if (filters?.status) {
            params.push(filters.status);
            query += ` AND t.status = $${params.length}`;
          }
          if (filters?.pendingAdmin) {
            query += ` AND t.status = 'PEER_ACCEPTED'`;
          }
          query += ' ORDER BY t.created_at DESC';
          const res = await pool.query(query, params);
          return res.rows.map(mapTrade);
        } catch {
          // fallback to memory
        }
      }

      return memoryStore.trades
        .filter((t) => {
          if (filters?.userId && t.requesterId !== filters.userId && t.targetUserId !== filters.userId) return false;
          if (filters?.status && t.status !== filters.status) return false;
          if (filters?.pendingAdmin && t.status !== 'PEER_ACCEPTED') return false;
          return true;
        })
        .map((t) => {
          const req = memoryStore.users.find((u) => u.id === t.requesterId);
          const tgt = memoryStore.users.find((u) => u.id === t.targetUserId);
          const reqShift = memoryStore.shifts.find((s) => s.id === t.requesterShiftId);
          const tgtShift = memoryStore.shifts.find((s) => s.id === t.targetShiftId);

          const reqDept = reqShift ? memoryStore.departments.find((d) => d.id === reqShift.departmentId) : undefined;
          const tgtDept = tgtShift ? memoryStore.departments.find((d) => d.id === tgtShift.departmentId) : undefined;

          return {
            ...t,
            requester: {
              id: t.requesterId,
              name: req?.name || '',
              email: req?.email || '',
              title: req?.title || '',
            },
            requesterShift: {
              ...(reqShift || ({} as any)),
              department: reqDept,
            },
            targetUser: {
              id: t.targetUserId,
              name: tgt?.name || '',
              email: tgt?.email || '',
              title: tgt?.title || '',
            },
            targetShift: {
              ...(tgtShift || ({} as any)),
              department: tgtDept,
            },
          };
        });
    },

    async findById(id: string): Promise<TradeWithDetails | null> {
      const list = await this.list();
      return list.find((t) => t.id === id) || null;
    },

    async create(tradeData: {
      requesterId: string;
      requesterShiftId: string;
      targetUserId: string;
      targetShiftId: string;
      reason?: string;
    }): Promise<TradeWithDetails> {
      const id = `tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      if (await isPgWorking()) {
        try {
          await pool.query(
            `INSERT INTO trade_requests (id, requester_id, requester_shift_id, target_user_id, target_shift_id, reason, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_PEER', NOW(), NOW())`,
            [
              id,
              tradeData.requesterId,
              tradeData.requesterShiftId,
              tradeData.targetUserId,
              tradeData.targetShiftId,
              tradeData.reason || '',
            ]
          );
          return (await this.findById(id))!;
        } catch {
          // fallback to memory
        }
      }

      const newTrade: TradeRequest = {
        id,
        requesterId: tradeData.requesterId,
        requesterShiftId: tradeData.requesterShiftId,
        targetUserId: tradeData.targetUserId,
        targetShiftId: tradeData.targetShiftId,
        reason: tradeData.reason || '',
        status: 'PENDING_PEER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.trades.push(newTrade);
      return (await this.findById(id))!;
    },

    async updateStatus(
      id: string,
      status: TradeRequest['status'],
      adminNotes?: string
    ): Promise<TradeWithDetails | null> {
      if (await isPgWorking()) {
        try {
          const trade = await this.findById(id);
          if (!trade) return null;

          await pool.query(
            `UPDATE trade_requests
             SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = NOW()
             WHERE id = $3`,
            [status, adminNotes !== undefined ? adminNotes : null, id]
          );

          if (status === 'ADMIN_APPROVED') {
            const client = await pool.connect();
            try {
              await client.query('BEGIN');
              await client.query('UPDATE shifts SET user_id = $1, updated_at = NOW() WHERE id = $2', [
                trade.targetUserId,
                trade.requesterShiftId,
              ]);
              await client.query('UPDATE shifts SET user_id = $1, updated_at = NOW() WHERE id = $2', [
                trade.requesterId,
                trade.targetShiftId,
              ]);
              await client.query('COMMIT');
            } catch (e) {
              await client.query('ROLLBACK');
              throw e;
            } finally {
              client.release();
            }
          }
          return await this.findById(id);
        } catch {
          // fallback to memory
        }
      }

      const tIdx = memoryStore.trades.findIndex((t) => t.id === id);
      if (tIdx !== -1) {
        memoryStore.trades[tIdx].status = status;
        if (adminNotes !== undefined) memoryStore.trades[tIdx].adminNotes = adminNotes;
        memoryStore.trades[tIdx].updatedAt = new Date().toISOString();

        if (status === 'ADMIN_APPROVED') {
          const tr = memoryStore.trades[tIdx];
          const reqShift = memoryStore.shifts.find((s) => s.id === tr.requesterShiftId);
          const tgtShift = memoryStore.shifts.find((s) => s.id === tr.targetShiftId);
          if (reqShift && tgtShift) {
            reqShift.userId = tr.targetUserId;
            tgtShift.userId = tr.requesterId;
          }
        }
        return await this.findById(id);
      }
      return null;
    },
  },

  // --- HOSPITAL SETTINGS ---
  settings: {
    async get(): Promise<HospitalSettings> {
      if (await isPgWorking()) {
        try {
          const res = await pool.query('SELECT * FROM hospital_settings WHERE id = $1 LIMIT 1', ['default']);
          if (res.rows.length > 0) return mapSettings(res.rows[0]);
        } catch {
          // fallback to memory
        }
      }
      return memoryStore.settings;
    },

    async update(updates: Partial<HospitalSettings>): Promise<HospitalSettings> {
      if (await isPgWorking()) {
        try {
          const current = await this.get();
          const updated = { ...current, ...updates };
          await pool.query(
            `INSERT INTO hospital_settings (id, hospital_name, unit_name, day_shift_start, day_shift_end, night_shift_start, night_shift_end, auto_approval, email_alerts, updated_at)
             VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, NOW())
             ON CONFLICT (id) DO UPDATE SET
               hospital_name = EXCLUDED.hospital_name,
               unit_name = EXCLUDED.unit_name,
               day_shift_start = EXCLUDED.day_shift_start,
               day_shift_end = EXCLUDED.day_shift_end,
               night_shift_start = EXCLUDED.night_shift_start,
               night_shift_end = EXCLUDED.night_shift_end,
               auto_approval = EXCLUDED.auto_approval,
               email_alerts = EXCLUDED.email_alerts,
               updated_at = NOW()`,
            [
              updated.hospitalName,
              updated.unitName,
              updated.dayShiftStart,
              updated.dayShiftEnd,
              updated.nightShiftStart,
              updated.nightShiftEnd,
              updated.autoApproval,
              updated.emailAlerts,
            ]
          );
          return updated;
        } catch {
          // fallback to memory
        }
      }

      memoryStore.settings = { ...memoryStore.settings, ...updates };
      return memoryStore.settings;
    },
  },

  // --- STATS OVERVIEW ---
  stats: {
    async getOverview() {
      const activeEmployees = await db.users.list(undefined, 'EMPLOYEE');
      const shifts = await db.shifts.list();
      const departments = await db.departments.list();
      const trades = await db.trades.list();

      let totalHours = 0;
      shifts.forEach((s) => {
        const start = new Date(s.startTime).getTime();
        const end = new Date(s.endTime).getTime();
        const diffHours = (end - start) / (1000 * 60 * 60);
        if (diffHours > 0) {
          totalHours += Math.max(0, diffHours - (s.breakMinutes || 0) / 60);
        }
      });

      const pendingPeerTrades = trades.filter((t) => t.status === 'PENDING_PEER').length;
      const pendingAdminTrades = trades.filter((t) => t.status === 'PEER_ACCEPTED').length;
      const approvedTrades = trades.filter((t) => t.status === 'ADMIN_APPROVED').length;

      const departmentStats = departments.map((dept) => {
        const deptShifts = shifts.filter((s) => s.departmentId === dept.id);
        const deptEmployees = activeEmployees.filter((u) => u.departmentId === dept.id);
        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          color: dept.color,
          shiftsCount: deptShifts.length,
          employeesCount: deptEmployees.length,
        };
      });

      return {
        totalEmployees: activeEmployees.length,
        totalShifts: shifts.length,
        totalHours: Math.round(totalHours),
        coverageRate: '100%',
        pendingPeerTrades,
        pendingAdminTrades,
        approvedTrades,
        departmentStats,
      };
    },
  },

  getPool() {
    return pool;
  },
};
