const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seedPostgres() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'shifttracker'
  });

  await client.connect();
  console.log('Connected to PostgreSQL shifttracker database.');

  // Create hospital_settings table if not exists
  await client.query(`
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

  // Read clean hospital dataset
  const jsonPath = path.join(__dirname, 'shifttracker.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Clean existing rows
  await client.query('DELETE FROM trade_requests');
  await client.query('DELETE FROM shifts');
  await client.query('DELETE FROM users');
  await client.query('DELETE FROM departments');
  await client.query('DELETE FROM hospital_settings');

  // 1. Insert Departments
  for (const d of data.departments) {
    await client.query(`
      INSERT INTO departments (id, name, code, color, description, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [d.id, d.name, d.code, d.color, d.description, d.createdAt]);
  }
  console.log(`Inserted ${data.departments.length} departments.`);

  // 2. Insert Users
  for (const u of data.users) {
    await client.query(`
      INSERT INTO users (id, email, password_hash, name, role, title, phone, avatar_url, hourly_rate, department_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [u.id, u.email, u.passwordHash, u.name, u.role, u.title, u.phone, u.avatarUrl, u.hourlyRate, u.departmentId, u.createdAt, u.updatedAt]);
  }
  console.log(`Inserted ${data.users.length} users.`);

  // 3. Insert Shifts
  for (const s of data.shifts) {
    await client.query(`
      INSERT INTO shifts (id, title, user_id, department_id, start_time, end_time, break_minutes, location, notes, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [s.id, s.title, s.userId, s.departmentId, s.startTime, s.endTime, s.breakMinutes, s.location, s.notes || '', s.status, s.createdAt, s.updatedAt]);
  }
  console.log(`Inserted ${data.shifts.length} shifts.`);

  // 4. Insert Hospital Settings
  const st = data.settings;
  await client.query(`
    INSERT INTO hospital_settings (id, hospital_name, unit_name, day_shift_start, day_shift_end, night_shift_start, night_shift_end, auto_approval, email_alerts, updated_at)
    VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, NOW())
  `, [st.hospitalName, st.unitName, st.dayShiftStart, st.dayShiftEnd, st.nightShiftStart, st.nightShiftEnd, st.autoApproval, st.emailAlerts]);
  console.log('Inserted hospital settings.');

  await client.end();
  console.log('PostgreSQL migration & seeding completed successfully!');
}

seedPostgres().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
