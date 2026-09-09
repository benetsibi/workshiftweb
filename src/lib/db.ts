import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Department, HospitalSettings, Role, Shift, ShiftWithDetails, TradeRequest, TradeWithDetails, User } from './types';

// PostgreSQL Connection Pool
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/shifttracker';

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
      department: row.req_dept_name ? {
        id: row.req_shift_dept_id,
        name: row.req_dept_name,
        code: row.req_dept_code,
        color: row.req_dept_color || '#0284c7',
        description: '',
        createdAt: '',
      } : undefined,
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
      department: row.tgt_dept_name ? {
        id: row.tgt_shift_dept_id,
        name: row.tgt_dept_name,
        code: row.tgt_dept_code,
        color: row.tgt_dept_color || '#4f46e5',
        description: '',
        createdAt: '',
      } : undefined,
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

// Ensure settings table exists
async function ensureSettingsTable() {
  try {
    await pool.query(`
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
  } catch (e) {
    console.error('Settings table check error:', e);
  }
}
ensureSettingsTable();

// Main Database Object
export const db = {
  // --- USERS ---
  users: {
    async findByEmail(email: string): Promise<User | null> {
      const clean = email.trim().toLowerCase();
      // Support direct match or alias (@hospital.com <-> @shifttracker.com)
      const prefix = clean.split('@')[0];
      const res = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(email) LIKE $2 LIMIT 1',
        [clean, `${prefix}@%`]
      );
      return res.rows.length > 0 ? mapUser(res.rows[0]) : null;
    },

    async findById(id: string): Promise<User | null> {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows.length > 0 ? mapUser(res.rows[0]) : null;
    },

    async list(departmentId?: string, role?: Role): Promise<User[]> {
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
    },

    async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
      const id = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const res = await pool.query(`
        INSERT INTO users (id, email, password_hash, name, role, title, phone, avatar_url, hourly_rate, department_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `, [
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
      ]);
      return mapUser(res.rows[0]);
    },

    async update(id: string, updates: Partial<User>): Promise<User | null> {
      const current = await this.findById(id);
      if (!current) return null;

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
      return res.rows.length > 0 ? mapUser(res.rows[0]) : null;
    },

    async delete(id: string): Promise<boolean> {
      await pool.query('DELETE FROM shifts WHERE user_id = $1', [id]);
      await pool.query('DELETE FROM trade_requests WHERE requester_id = $1 OR target_user_id = $1', [id]);
      const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    }
  },

  // --- DEPARTMENTS ---
  departments: {
    async list(): Promise<Department[]> {
      const res = await pool.query('SELECT * FROM departments ORDER BY name ASC');
      return res.rows.map(mapDepartment);
    },

    async findById(id: string): Promise<Department | null> {
      const res = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
      return res.rows.length > 0 ? mapDepartment(res.rows[0]) : null;
    },

    async create(deptData: Omit<Department, 'id' | 'createdAt'>): Promise<Department> {
      const id = `dept-${Date.now()}`;
      const res = await pool.query(`
        INSERT INTO departments (id, name, code, color, description, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `, [id, deptData.name, deptData.code, deptData.color, deptData.description]);
      return mapDepartment(res.rows[0]);
    }
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
    },

    async findById(id: string): Promise<ShiftWithDetails | null> {
      const res = await pool.query(`
        SELECT s.*, 
               u.name as user_name, u.email as user_email, u.title as user_title, u.avatar_url as user_avatar,
               d.name as dept_name, d.code as dept_code, d.color as dept_color, d.description as dept_desc
        FROM shifts s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN departments d ON s.department_id = d.id
        WHERE s.id = $1
      `, [id]);
      return res.rows.length > 0 ? mapShift(res.rows[0]) : null;
    },

    async create(shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<ShiftWithDetails> {
      const id = `sh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      await pool.query(`
        INSERT INTO shifts (id, title, user_id, department_id, start_time, end_time, break_minutes, location, notes, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
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
      ]);
      return (await this.findById(id))!;
    },

    async update(id: string, updates: Partial<Shift>): Promise<ShiftWithDetails | null> {
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
    },

    async delete(id: string): Promise<boolean> {
      await pool.query('DELETE FROM trade_requests WHERE requester_shift_id = $1 OR target_shift_id = $1', [id]);
      const res = await pool.query('DELETE FROM shifts WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    }
  },

  // --- TRADE REQUESTS ---
  trades: {
    async list(filters?: {
      userId?: string;
      status?: string;
      pendingAdmin?: boolean;
    }): Promise<TradeWithDetails[]> {
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
    },

    async findById(id: string): Promise<TradeWithDetails | null> {
      const list = await this.list();
      return list.find(t => t.id === id) || null;
    },

    async create(tradeData: {
      requesterId: string;
      requesterShiftId: string;
      targetUserId: string;
      targetShiftId: string;
      reason?: string;
    }): Promise<TradeWithDetails> {
      const id = `tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      await pool.query(`
        INSERT INTO trade_requests (id, requester_id, requester_shift_id, target_user_id, target_shift_id, reason, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_PEER', NOW(), NOW())
      `, [
        id,
        tradeData.requesterId,
        tradeData.requesterShiftId,
        tradeData.targetUserId,
        tradeData.targetShiftId,
        tradeData.reason || '',
      ]);
      return (await this.findById(id))!;
    },

    async updateStatus(
      id: string,
      status: TradeRequest['status'],
      adminNotes?: string
    ): Promise<TradeWithDetails | null> {
      const trade = await this.findById(id);
      if (!trade) return null;

      await pool.query(`
        UPDATE trade_requests
        SET status = $1, admin_notes = COALESCE($2, admin_notes), updated_at = NOW()
        WHERE id = $3
      `, [status, adminNotes !== undefined ? adminNotes : null, id]);

      // If approved by Admin, swap shift assignments in PostgreSQL atomically!
      if (status === 'ADMIN_APPROVED') {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          // Swap user assignments of both shifts
          await client.query('UPDATE shifts SET user_id = $1, updated_at = NOW() WHERE id = $2', [trade.targetUserId, trade.requesterShiftId]);
          await client.query('UPDATE shifts SET user_id = $1, updated_at = NOW() WHERE id = $2', [trade.requesterId, trade.targetShiftId]);
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }

      return await this.findById(id);
    }
  },

  // --- HOSPITAL SETTINGS ---
  settings: {
    async get(): Promise<HospitalSettings> {
      try {
        const res = await pool.query('SELECT * FROM hospital_settings WHERE id = $1 LIMIT 1', ['default']);
        if (res.rows.length > 0) {
          return mapSettings(res.rows[0]);
        }
      } catch (e) {
        console.error('Failed to get hospital settings from PostgreSQL:', e);
      }

      return {
        hospitalName: 'St. Jude Community Hospital',
        unitName: 'Acute Inpatient Care Unit 3B',
        dayShiftStart: '07:00',
        dayShiftEnd: '19:00',
        nightShiftStart: '19:00',
        nightShiftEnd: '07:00',
        autoApproval: false,
        emailAlerts: true,
      };
    },

    async update(updates: Partial<HospitalSettings>): Promise<HospitalSettings> {
      const current = await this.get();
      const updated = { ...current, ...updates };

      await pool.query(`
        INSERT INTO hospital_settings (id, hospital_name, unit_name, day_shift_start, day_shift_end, night_shift_start, night_shift_end, auto_approval, email_alerts, updated_at)
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
          updated_at = NOW()
      `, [
        updated.hospitalName,
        updated.unitName,
        updated.dayShiftStart,
        updated.dayShiftEnd,
        updated.nightShiftStart,
        updated.nightShiftEnd,
        updated.autoApproval,
        updated.emailAlerts,
      ]);

      return updated;
    }
  },

  // --- STATS OVERVIEW ---
  stats: {
    async getOverview() {
      const activeEmployees = await db.users.list(undefined, 'EMPLOYEE');
      const shifts = await db.shifts.list();
      const departments = await db.departments.list();
      const trades = await db.trades.list();

      let totalHours = 0;
      shifts.forEach(s => {
        const start = new Date(s.startTime).getTime();
        const end = new Date(s.endTime).getTime();
        const diffHours = (end - start) / (1000 * 60 * 60);
        if (diffHours > 0) {
          totalHours += Math.max(0, diffHours - (s.breakMinutes || 0) / 60);
        }
      });

      const pendingPeerTrades = trades.filter(t => t.status === 'PENDING_PEER').length;
      const pendingAdminTrades = trades.filter(t => t.status === 'PEER_ACCEPTED').length;
      const approvedTrades = trades.filter(t => t.status === 'ADMIN_APPROVED').length;

      const departmentStats = departments.map(dept => {
        const deptShifts = shifts.filter(s => s.departmentId === dept.id);
        const deptEmployees = activeEmployees.filter(u => u.departmentId === dept.id);
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
    }
  },

  // Database helper
  getPool() {
    return pool;
  }
};
