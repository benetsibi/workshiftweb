const { Pool } = require('pg');

async function clean() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/shifttracker'
  });

  try {
    // Delete any users belonging to IT / tech
    const uRes = await pool.query(`
      DELETE FROM users 
      WHERE department_id IN ('dept-dev', 'dept-design', 'dept-qa') 
         OR id LIKE 'usr-emp-%'
         OR title ILIKE '%developer%'
         OR title ILIKE '%designer%'
         OR title ILIKE '%engineer%'
    `);
    console.log(`Deleted ${uRes.rowCount} IT users.`);

    // Delete IT departments
    const dRes = await pool.query(`
      DELETE FROM departments 
      WHERE id IN ('dept-dev', 'dept-design', 'dept-qa')
         OR name ILIKE '%developer%'
         OR name ILIKE '%designer%'
         OR name ILIKE '%testing%'
    `);
    console.log(`Deleted ${dRes.rowCount} IT departments.`);

    // Check remaining users
    const rem = await pool.query('SELECT id, name, role, title, department_id FROM users ORDER BY name ASC');
    console.log('Remaining staff in DB:');
    console.table(rem.rows);

    // Check remaining departments
    const depts = await pool.query('SELECT id, name, code FROM departments');
    console.log('Remaining departments in DB:');
    console.table(depts.rows);

  } finally {
    await pool.end();
  }
}

clean().catch(console.error);
