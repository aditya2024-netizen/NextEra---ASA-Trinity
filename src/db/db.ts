import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import { 
  Patient, 
  Appointment, 
  Intervention, 
  RiskPrediction, 
  StaffUser, 
  AuditLog, 
  ScoringConfiguration,
  NotificationRecord,
  DashboardSummary
} from '../types';
import { calculatePatientRisk, DEFAULT_SCORING_CONFIG } from '../services/scoringEngine';
import { generateSyntheticDataset, SEED_USERS } from '../data/seedData';

let pool: Pool | null = null;
let embeddedInstance: any = null;

// In-Memory Fallback Store for Serverless environments where PostgreSQL is not available
const memPatients = new Map<string, Patient>();
const memAppointments: Appointment[] = [];
const memInterventions = new Map<string, Intervention>();
const memNotifications: NotificationRecord[] = [];
const memUsers = new Map<string, StaffUser & { passwordHash: string }>();
const memAuditLogs: AuditLog[] = [];
let memScoringConfig: ScoringConfiguration = { ...DEFAULT_SCORING_CONFIG };

export function initInMemoryStore(): void {
  if (memPatients.size > 0) return;
  const dataset = generateSyntheticDataset(1000);
  for (const p of dataset.patients) memPatients.set(p.id, p);
  for (const a of dataset.appointments) memAppointments.push(a);
  for (const i of dataset.interventions) memInterventions.set(i.id, i);
  for (const u of SEED_USERS) {
    memUsers.set(u.email.toLowerCase(), {
      ...u,
      passwordHash: '$2b$10$hashed_password_placeholder_for_demo_security_caretrack',
    });
  }
  for (const log of dataset.auditLogs) memAuditLogs.push(log);
}

export async function getPool(): Promise<Pool | null> {
  if (pool) return pool;
  await initDatabase();
  return pool;
}

export async function ensureDbInitialized(): Promise<void> {
  await initDatabase();
}

export async function initDatabase(): Promise<Pool | null> {
  if (pool) return pool;

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    try {
      console.log('[PostgreSQL] Connecting via DATABASE_URL...');
      const testPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      const client = await testPool.connect();
      client.release();
      pool = testPool;
      console.log('[PostgreSQL] Connected successfully via DATABASE_URL');
    } catch (err) {
      console.warn('[PostgreSQL] Failed to connect via DATABASE_URL, falling back:', err);
    }
  }

  if (!pool && !process.env.VERCEL) {
    // Check if an external PostgreSQL instance is already running on localhost:5432
    try {
      const testPool = new Pool({
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'caretrack',
        connectionTimeoutMillis: 1500,
      });
      const client = await testPool.connect();
      client.release();
      pool = testPool;
      console.log('[PostgreSQL] Connected to active PostgreSQL on port 5432');
    } catch {
      // Not on 5432
    }
  }

  if (!pool && !process.env.VERCEL) {
    try {
      console.log('[PostgreSQL] Starting persistent Embedded PostgreSQL server on port 5433...');
      const pgDataDir = path.resolve(process.cwd(), '.pgdata');
      if (!fs.existsSync(pgDataDir)) {
        fs.mkdirSync(pgDataDir, { recursive: true });
      }

      const { default: EmbeddedPostgres } = await import('embedded-postgres');
      embeddedInstance = new EmbeddedPostgres({
        databaseDir: pgDataDir,
        port: 5433,
        user: 'postgres',
        password: 'password123',
        persistent: true,
      });

      try {
        await embeddedInstance.initialise();
      } catch {
        // May already be initialized
      }

      await embeddedInstance.start();
      console.log('[PostgreSQL] Embedded PostgreSQL 18 started successfully on port 5433');

      pool = new Pool({
        host: 'localhost',
        port: 5433,
        user: 'postgres',
        password: 'password123',
        database: 'postgres',
      });
    } catch (err) {
      console.warn('[PostgreSQL] Embedded PostgreSQL could not start, will use fallback store:', err);
    }
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    if (pool) await pool.end().catch(() => {});
    if (embeddedInstance) await embeddedInstance.stop().catch(() => {});
    process.exit(0);
  });

  if (pool) {
    // Create Schemas & Tables
    await createTables();
    // Seed if empty
    await seedDatabaseIfEmpty();
  } else {
    console.log('[Database] Initialized in-memory fallback store (1,000 patients, seed accounts active)');
    initInMemoryStore();
  }

  return pool;
}

async function createTables() {
  if (!pool) return;

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(64) NOT NULL,
      department VARCHAR(255),
      employee_id VARCHAR(64),
      phone VARCHAR(64),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(64) PRIMARY KEY,
      patient_code VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      age INT NOT NULL,
      gender VARCHAR(32) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      email VARCHAR(255),
      address TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      distance_km DOUBLE PRECISION NOT NULL,
      condition VARCHAR(255) NOT NULL,
      treatment_type VARCHAR(255) NOT NULL,
      treatment_start_date VARCHAR(64),
      treatment_duration_months INT NOT NULL,
      appointment_frequency_days INT NOT NULL,
      total_appointments INT NOT NULL,
      attended_appointments INT NOT NULL,
      missed_appointments INT NOT NULL,
      rescheduled_appointments INT DEFAULT 0,
      attendance_rate INT NOT NULL,
      next_follow_up_date VARCHAR(64) NOT NULL,
      last_visit_date VARCHAR(64),
      status VARCHAR(64) DEFAULT 'ACTIVE',
      assigned_doctor VARCHAR(255),
      preferred_language VARCHAR(64),
      transport_access VARCHAR(64),
      current_risk JSONB,
      latest_intervention JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      appointment_date VARCHAR(64) NOT NULL,
      department VARCHAR(255),
      doctor_name VARCHAR(255),
      status VARCHAR(64) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      score INT NOT NULL,
      risk_level VARCHAR(32) NOT NULL,
      evidence_coverage TEXT,
      prediction_date TIMESTAMPTZ DEFAULT NOW(),
      model_version VARCHAR(128),
      reasons JSONB,
      protective_factors JSONB,
      recommended_actions JSONB,
      immediate_action TEXT,
      secondary_action TEXT,
      alternative_action TEXT,
      top_factors JSONB,
      natural_language_summary TEXT,
      responsible_ai_note TEXT,
      input_snapshot JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS interventions (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      patient_code VARCHAR(64),
      patient_name VARCHAR(255),
      prediction_id VARCHAR(64),
      staff_id VARCHAR(64),
      staff_name VARCHAR(255),
      staff_role VARCHAR(64),
      type VARCHAR(128) NOT NULL,
      status VARCHAR(64) NOT NULL,
      reason TEXT,
      notes TEXT,
      outcome_notes TEXT,
      patient_confirmed_next_visit BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64) NOT NULL,
      channel VARCHAR(64) NOT NULL,
      destination VARCHAR(64) NOT NULL,
      message_content TEXT NOT NULL,
      status VARCHAR(64) NOT NULL,
      provider VARCHAR(64) NOT NULL,
      is_demo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      staff_name VARCHAR(255) NOT NULL,
      staff_role VARCHAR(64) NOT NULL,
      action VARCHAR(255) NOT NULL,
      details TEXT,
      patient_code VARCHAR(64)
    );

    CREATE TABLE IF NOT EXISTS scoring_configs (
      id VARCHAR(64) PRIMARY KEY,
      config_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
    CREATE INDEX IF NOT EXISTS idx_patients_next_follow_up ON patients(next_follow_up_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
    CREATE INDEX IF NOT EXISTS idx_interventions_patient_id ON interventions(patient_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_patient_id ON predictions(patient_id);
  `;

  await pool.query(createTableQuery);
  console.log('[PostgreSQL] Database schemas and indexes verified.');
}

export async function seedDatabaseIfEmpty() {
  if (!pool) return;
  const countRes = await pool.query('SELECT COUNT(*) FROM patients');
  const count = parseInt(countRes.rows[0].count, 10);

  if (count === 0) {
    console.log('[PostgreSQL] Database empty. Seeding initial 1,000 outpatient records & users...');
    await seedDatabase(1000);
  }
}

export async function seedDatabase(count: number = 1000) {
  if (!pool) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM appointments');
    await client.query('DELETE FROM interventions');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM predictions');
    await client.query('DELETE FROM patients');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM scoring_configs');

    // 1. Seed Users
    for (const u of SEED_USERS) {
      await client.query(
        `INSERT INTO users (id, name, email, role, department, employee_id, phone, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [u.id, u.name, u.email.toLowerCase(), u.role, u.department, u.employeeId, u.phone, 'password123']
      );
    }

    // 2. Seed Default Config
    await client.query(
      `INSERT INTO scoring_configs (id, config_json) VALUES ('DEFAULT', $1)`,
      [JSON.stringify(DEFAULT_SCORING_CONFIG)]
    );

    // 3. Generate Dataset
    const dataset = generateSyntheticDataset(count);

    // 4. Seed Patients & Predictions
    for (const p of dataset.patients) {
      const risk = p.currentRisk || calculatePatientRisk(p, DEFAULT_SCORING_CONFIG);
      await client.query(
        `INSERT INTO patients (
          id, patient_code, name, age, gender, phone, email, address, latitude, longitude,
          distance_km, condition, treatment_type, treatment_start_date, treatment_duration_months,
          appointment_frequency_days, total_appointments, attended_appointments, missed_appointments,
          rescheduled_appointments, attendance_rate, next_follow_up_date, last_visit_date, status,
          assigned_doctor, preferred_language, transport_access, current_risk, latest_intervention, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        )`,
        [
          p.id, p.patientCode, p.name, p.age, p.gender, p.phone, p.email || '', p.address || '',
          p.latitude || 28.6139, p.longitude || 77.2090, p.distanceKm, p.condition, p.treatmentType,
          p.treatmentStartDate, p.treatmentDurationMonths, p.appointmentFrequencyDays, p.totalAppointments,
          p.attendedAppointments, p.missedAppointments, p.rescheduledAppointments, p.attendanceRate,
          p.nextFollowUpDate, p.lastVisitDate, p.status, p.assignedDoctor, p.preferredLanguage,
          p.transportAccess, JSON.stringify(risk), p.latestIntervention ? JSON.stringify(p.latestIntervention) : null,
          p.createdAt, p.updatedAt
        ]
      );

      await client.query(
        `INSERT INTO predictions (
          id, patient_id, score, risk_level, evidence_coverage, prediction_date, model_version,
          reasons, protective_factors, recommended_actions, immediate_action, secondary_action,
          alternative_action, top_factors, natural_language_summary, responsible_ai_note, input_snapshot
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING`,
        [
          risk.id, p.id, risk.score, risk.riskLevel, risk.evidenceCoverage, risk.predictionDate,
          risk.modelVersion, JSON.stringify(risk.reasons), JSON.stringify(risk.protectiveFactors),
          JSON.stringify(risk.recommendedActions), risk.immediateAction, risk.secondaryAction,
          risk.alternativeAction, JSON.stringify(risk.topFactors), risk.naturalLanguageSummary,
          risk.responsibleAiNote, JSON.stringify(risk.inputSnapshot)
        ]
      );
    }

    // 5. Seed Appointments
    for (const a of dataset.appointments) {
      await client.query(
        `INSERT INTO appointments (id, patient_id, appointment_date, department, doctor_name, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [a.id, a.patientId, a.appointmentDate, a.department, a.doctorName, a.status, a.notes || '']
      );
    }

    // 6. Seed Interventions
    for (const i of dataset.interventions) {
      await client.query(
        `INSERT INTO interventions (
          id, patient_id, patient_code, patient_name, prediction_id, staff_id, staff_name,
          staff_role, type, status, reason, notes, outcome_notes, patient_confirmed_next_visit, created_at, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING`,
        [
          i.id, i.patientId, i.patientCode, i.patientName, i.predictionId, i.staffId,
          i.staffName, i.staffRole, i.type, i.status, i.reason, i.notes,
          i.outcomeNotes || null, i.patientConfirmedNextVisit || false, i.createdAt, i.completedAt || null
        ]
      );
    }

    // 7. Seed Audit Logs
    for (const log of dataset.auditLogs) {
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, staff_name, staff_role, action, details, patient_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [log.id, log.timestamp, log.staffName, log.staffRole, log.action, log.details, log.patientCode || null]
      );
    }

    await client.query('COMMIT');
    console.log(`[PostgreSQL] Seeded ${dataset.patients.length} patients, ${dataset.appointments.length} appointments, and ${dataset.interventions.length} interventions into PostgreSQL.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL] Seed transaction failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// -------------------------------------------------------------
// REPOSITORY METHODS
// -------------------------------------------------------------

function mapRowToPatient(r: any): Patient {
  return {
    id: r.id,
    patientCode: r.patient_code,
    name: r.name,
    age: r.age,
    gender: r.gender,
    phone: r.phone,
    email: r.email,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    distanceKm: r.distance_km,
    condition: r.condition,
    treatmentType: r.treatment_type,
    treatmentStartDate: r.treatment_start_date,
    treatmentDurationMonths: r.treatment_duration_months,
    appointmentFrequencyDays: r.appointment_frequency_days,
    totalAppointments: r.total_appointments,
    attendedAppointments: r.attended_appointments,
    missedAppointments: r.missed_appointments,
    rescheduledAppointments: r.rescheduled_appointments,
    attendanceRate: r.attendance_rate,
    nextFollowUpDate: r.next_follow_up_date,
    lastVisitDate: r.last_visit_date,
    status: r.status,
    assignedDoctor: r.assigned_doctor,
    preferredLanguage: r.preferred_language,
    transportAccess: r.transport_access,
    currentRisk: typeof r.current_risk === 'string' ? JSON.parse(r.current_risk) : r.current_risk,
    latestIntervention: typeof r.latest_intervention === 'string' ? JSON.parse(r.latest_intervention) : r.latest_intervention,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function dbGetPatients(params: {
  search?: string;
  riskLevel?: string;
  interventionStatus?: string;
  dueFilter?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<{ data: Patient[]; total: number; page: number; limit: number; totalPages: number }> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    let list = Array.from(memPatients.values());
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(pt => 
        pt.name.toLowerCase().includes(q) || 
        pt.patientCode.toLowerCase().includes(q) || 
        pt.condition.toLowerCase().includes(q) || 
        pt.phone.includes(q)
      );
    }
    if (params.riskLevel && params.riskLevel !== 'ALL') {
      list = list.filter(pt => pt.currentRisk?.riskLevel === params.riskLevel);
    }
    if (params.interventionStatus && params.interventionStatus !== 'ALL') {
      if (params.interventionStatus === 'PENDING') {
        list = list.filter(pt => !pt.latestIntervention || pt.latestIntervention.status === 'Pending');
      } else if (params.interventionStatus === 'COMPLETED') {
        list = list.filter(pt => pt.latestIntervention && (pt.latestIntervention.status === 'Completed' || pt.latestIntervention.status === 'Confirmed'));
      }
    }
    if (params.dueFilter && params.dueFilter !== 'ALL') {
      const today = new Date().toISOString().split('T')[0];
      if (params.dueFilter === 'TODAY') {
        list = list.filter(pt => pt.nextFollowUpDate === today);
      } else if (params.dueFilter === 'WEEK' || params.dueFilter === 'NEXT_7_DAYS') {
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        list = list.filter(pt => pt.nextFollowUpDate >= today && pt.nextFollowUpDate <= nextWeek);
      } else if (params.dueFilter === 'NEXT_30_DAYS') {
        const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        list = list.filter(pt => pt.nextFollowUpDate >= today && pt.nextFollowUpDate <= nextMonth);
      } else if (params.dueFilter === 'OVERDUE') {
        list = list.filter(pt => pt.nextFollowUpDate < today);
      }
    }
    const order = params.sortOrder === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      if (params.sortBy === 'missedAppointments') return (a.missedAppointments - b.missedAppointments) * order;
      if (params.sortBy === 'distanceKm') return (a.distanceKm - b.distanceKm) * order;
      if (params.sortBy === 'attendanceRate') return (a.attendanceRate - b.attendanceRate) * order;
      if (params.sortBy === 'nextFollowUpDate') return a.nextFollowUpDate.localeCompare(b.nextFollowUpDate) * order;
      return ((a.currentRisk?.score || 0) - (b.currentRisk?.score || 0)) * order;
    });
    const total = list.length;
    const pageNum = Math.max(1, params.page || 1);
    const limitNum = Math.max(1, params.limit || 20);
    const offset = (pageNum - 1) * limitNum;
    const data = list.slice(offset, offset + limitNum);
    return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 };
  }

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (params.search && params.search.trim()) {
    const q = `%${params.search.trim().toLowerCase()}%`;
    conditions.push(`(LOWER(name) LIKE $${paramIdx} OR LOWER(patient_code) LIKE $${paramIdx} OR LOWER(condition) LIKE $${paramIdx} OR phone LIKE $${paramIdx})`);
    values.push(q);
    paramIdx++;
  }

  if (params.riskLevel && params.riskLevel !== 'ALL') {
    conditions.push(`(current_risk->>'riskLevel') = $${paramIdx}`);
    values.push(params.riskLevel);
    paramIdx++;
  }

  if (params.interventionStatus && params.interventionStatus !== 'ALL') {
    if (params.interventionStatus === 'PENDING') {
      conditions.push(`(latest_intervention IS NULL OR (latest_intervention->>'status') = 'Pending')`);
    } else if (params.interventionStatus === 'COMPLETED') {
      conditions.push(`((latest_intervention->>'status') = 'Completed' OR (latest_intervention->>'status') = 'Confirmed')`);
    } else {
      conditions.push(`(latest_intervention->>'status') = $${paramIdx}`);
      values.push(params.interventionStatus);
      paramIdx++;
    }
  }

  if (params.dueFilter && params.dueFilter !== 'ALL') {
    const today = new Date().toISOString().split('T')[0];
    if (params.dueFilter === 'TODAY') {
      conditions.push(`next_follow_up_date = $${paramIdx}`);
      values.push(today);
      paramIdx++;
    } else if (params.dueFilter === 'WEEK' || params.dueFilter === 'NEXT_7_DAYS') {
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      conditions.push(`next_follow_up_date >= $${paramIdx} AND next_follow_up_date <= $${paramIdx + 1}`);
      values.push(today, nextWeek);
      paramIdx += 2;
    } else if (params.dueFilter === 'NEXT_30_DAYS') {
      const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      conditions.push(`next_follow_up_date >= $${paramIdx} AND next_follow_up_date <= $${paramIdx + 1}`);
      values.push(today, nextMonth);
      paramIdx += 2;
    } else if (params.dueFilter === 'OVERDUE') {
      conditions.push(`next_follow_up_date < $${paramIdx}`);
      values.push(today);
      paramIdx++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sorting
  let orderBy = '((current_risk->>\'score\')::int)';
  if (params.sortBy === 'missedAppointments') orderBy = 'missed_appointments';
  else if (params.sortBy === 'distanceKm') orderBy = 'distance_km';
  else if (params.sortBy === 'attendanceRate') orderBy = 'attendance_rate';
  else if (params.sortBy === 'nextFollowUpDate') orderBy = 'next_follow_up_date';

  const orderDir = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Count total
  const countSql = `SELECT COUNT(*) FROM patients ${whereClause}`;
  const countRes = await p.query(countSql, values);
  const total = parseInt(countRes.rows[0].count, 10);

  const pageNum = Math.max(1, params.page || 1);
  const limitNum = Math.max(1, params.limit || 20);
  const offset = (pageNum - 1) * limitNum;

  const dataSql = `SELECT * FROM patients ${whereClause} ORDER BY ${orderBy} ${orderDir} LIMIT ${limitNum} OFFSET ${offset}`;
  const dataRes = await p.query(dataSql, values);

  const data = dataRes.rows.map(mapRowToPatient);
  const totalPages = Math.ceil(total / limitNum) || 1;

  return { data, total, page: pageNum, limit: limitNum, totalPages };
}

export async function dbGetPatientById(idOrCode: string): Promise<Patient | null> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const query = idOrCode.toLowerCase();
    for (const pt of memPatients.values()) {
      if (pt.id.toLowerCase() === query || pt.patientCode.toLowerCase() === query) {
        return pt;
      }
    }
    return null;
  }
  const res = await p.query(
    'SELECT * FROM patients WHERE id = $1 OR LOWER(patient_code) = LOWER($1)',
    [idOrCode]
  );
  if (res.rows.length === 0) return null;
  return mapRowToPatient(res.rows[0]);
}

export async function dbCreatePatient(patient: Patient): Promise<Patient> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memPatients.set(patient.id, patient);
    if (patient.currentRisk) {
      await dbSavePrediction(patient.currentRisk);
    }
    return patient;
  }
  await p.query(
    `INSERT INTO patients (
      id, patient_code, name, age, gender, phone, email, address, latitude, longitude,
      distance_km, condition, treatment_type, treatment_start_date, treatment_duration_months,
      appointment_frequency_days, total_appointments, attended_appointments, missed_appointments,
      rescheduled_appointments, attendance_rate, next_follow_up_date, last_visit_date, status,
      assigned_doctor, preferred_language, transport_access, current_risk, latest_intervention, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19,
      $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
    )`,
    [
      patient.id, patient.patientCode, patient.name, patient.age, patient.gender, patient.phone, patient.email || '',
      patient.address || '', patient.latitude || 28.6139, patient.longitude || 77.2090, patient.distanceKm,
      patient.condition, patient.treatmentType, patient.treatmentStartDate, patient.treatmentDurationMonths,
      patient.appointmentFrequencyDays, patient.totalAppointments, patient.attendedAppointments,
      patient.missedAppointments, patient.rescheduledAppointments, patient.attendanceRate,
      patient.nextFollowUpDate, patient.lastVisitDate, patient.status, patient.assignedDoctor,
      patient.preferredLanguage, patient.transportAccess,
      JSON.stringify(patient.currentRisk), patient.latestIntervention ? JSON.stringify(patient.latestIntervention) : null,
      patient.createdAt, patient.updatedAt
    ]
  );

  if (patient.currentRisk) {
    await dbSavePrediction(patient.currentRisk);
  }

  return patient;
}

export async function dbUpdatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
  const p = await getPool();
  const existing = await dbGetPatientById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };

  if (!p) {
    initInMemoryStore();
    memPatients.set(existing.id, merged);
    return merged;
  }

  await p.query(
    `UPDATE patients SET
      name = $2, age = $3, gender = $4, phone = $5, email = $6, address = $7,
      latitude = $8, longitude = $9, distance_km = $10, condition = $11, treatment_type = $12,
      treatment_start_date = $13, treatment_duration_months = $14, appointment_frequency_days = $15,
      total_appointments = $16, attended_appointments = $17, missed_appointments = $18,
      rescheduled_appointments = $19, attendance_rate = $20, next_follow_up_date = $21,
      last_visit_date = $22, status = $23, assigned_doctor = $24, preferred_language = $25,
      transport_access = $26, current_risk = $27, latest_intervention = $28, updated_at = $29
     WHERE id = $1`,
    [
      existing.id, merged.name, merged.age, merged.gender, merged.phone, merged.email || '',
      merged.address || '', merged.latitude, merged.longitude, merged.distanceKm, merged.condition,
      merged.treatmentType, merged.treatmentStartDate, merged.treatmentDurationMonths,
      merged.appointmentFrequencyDays, merged.totalAppointments, merged.attendedAppointments,
      merged.missedAppointments, merged.rescheduledAppointments, merged.attendanceRate,
      merged.nextFollowUpDate, merged.lastVisitDate, merged.status, merged.assignedDoctor,
      merged.preferredLanguage, merged.transportAccess,
      JSON.stringify(merged.currentRisk), merged.latestIntervention ? JSON.stringify(merged.latestIntervention) : null,
      merged.updatedAt
    ]
  );

  return merged;
}

export async function dbGetAppointments(patientId: string): Promise<Appointment[]> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memAppointments.filter(a => a.patientId === patientId);
  }
  const res = await p.query(
    'SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC',
    [patientId]
  );
  return res.rows.map(r => ({
    id: r.id,
    patientId: r.patient_id,
    appointmentDate: r.appointment_date,
    department: r.department,
    doctorName: r.doctor_name,
    status: r.status,
    notes: r.notes,
  }));
}

export async function dbGetInterventions(status?: string, limit: number = 50): Promise<Intervention[]> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    let list = Array.from(memInterventions.values());
    if (status && status !== 'ALL') {
      list = list.filter(i => i.status === status);
    }
    return list.slice(0, limit);
  }
  let sql = 'SELECT * FROM interventions';
  const values: any[] = [];
  if (status && status !== 'ALL') {
    sql += ' WHERE status = $1';
    values.push(status);
  }
  sql += ` ORDER BY created_at DESC LIMIT ${limit}`;
  const res = await p.query(sql, values);
  return res.rows.map(r => ({
    id: r.id,
    patientId: r.patient_id,
    patientCode: r.patient_code,
    patientName: r.patient_name,
    predictionId: r.prediction_id,
    staffId: r.staff_id,
    staffName: r.staff_name,
    staffRole: r.staff_role,
    type: r.type,
    status: r.status,
    reason: r.reason,
    notes: r.notes,
    outcomeNotes: r.outcome_notes,
    patientConfirmedNextVisit: r.patient_confirmed_next_visit,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));
}

export async function dbGetInterventionsByPatientId(patientId: string): Promise<Intervention[]> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return Array.from(memInterventions.values()).filter(i => i.patientId === patientId);
  }
  const res = await p.query(
    'SELECT * FROM interventions WHERE patient_id = $1 ORDER BY created_at DESC',
    [patientId]
  );
  return res.rows.map(r => ({
    id: r.id,
    patientId: r.patient_id,
    patientCode: r.patient_code,
    patientName: r.patient_name,
    predictionId: r.prediction_id,
    staffId: r.staff_id,
    staffName: r.staff_name,
    staffRole: r.staff_role,
    type: r.type,
    status: r.status,
    reason: r.reason,
    notes: r.notes,
    outcomeNotes: r.outcome_notes,
    patientConfirmedNextVisit: r.patient_confirmed_next_visit,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));
}

export async function dbCreateIntervention(interv: Intervention): Promise<Intervention> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memInterventions.set(interv.id, interv);
    const pt = memPatients.get(interv.patientId);
    if (pt) pt.latestIntervention = interv;
    return interv;
  }
  await p.query(
    `INSERT INTO interventions (
      id, patient_id, patient_code, patient_name, prediction_id, staff_id, staff_name,
      staff_role, type, status, reason, notes, outcome_notes, patient_confirmed_next_visit, created_at, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      interv.id, interv.patientId, interv.patientCode, interv.patientName, interv.predictionId,
      interv.staffId, interv.staffName, interv.staffRole, interv.type, interv.status,
      interv.reason, interv.notes, interv.outcomeNotes || null,
      interv.patientConfirmedNextVisit || false, interv.createdAt, interv.completedAt || null
    ]
  );

  // Update patient's latest_intervention
  await p.query(
    `UPDATE patients SET latest_intervention = $2, updated_at = NOW() WHERE id = $1`,
    [interv.patientId, JSON.stringify(interv)]
  );

  return interv;
}

export async function dbUpdateInterventionStatus(
  id: string,
  status: string,
  notes?: string,
  patientConfirmedNextVisit?: boolean
): Promise<Intervention | null> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const row = memInterventions.get(id);
    if (!row) return null;
    const isCompleted = status === 'Completed' || status === 'Confirmed';
    const completedAt = isCompleted ? new Date().toISOString() : row.completedAt;
    const confirmed = patientConfirmedNextVisit !== undefined ? patientConfirmedNextVisit : row.patientConfirmedNextVisit;
    const updatedNotes = notes ? `${row.notes}\n[Update]: ${notes}` : row.notes;
    const updated: Intervention = {
      ...row,
      status: status as any,
      notes: updatedNotes,
      patientConfirmedNextVisit: confirmed,
      completedAt,
    };
    memInterventions.set(id, updated);
    const pt = memPatients.get(row.patientId);
    if (pt) pt.latestIntervention = updated;
    return updated;
  }
  const res = await p.query('SELECT * FROM interventions WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  const updatedNotes = notes ? `${row.notes}\n[Update]: ${notes}` : row.notes;
  const isCompleted = status === 'Completed' || status === 'Confirmed';
  const completedAt = isCompleted ? new Date().toISOString() : row.completed_at;
  const confirmed = patientConfirmedNextVisit !== undefined ? patientConfirmedNextVisit : row.patient_confirmed_next_visit;

  await p.query(
    `UPDATE interventions SET
      status = $2, notes = $3, patient_confirmed_next_visit = $4, completed_at = $5
     WHERE id = $1`,
    [id, status, updatedNotes, confirmed, completedAt]
  );

  const updatedIntervention: Intervention = {
    id: row.id,
    patientId: row.patient_id,
    patientCode: row.patient_code,
    patientName: row.patient_name,
    predictionId: row.prediction_id,
    staffId: row.staff_id,
    staffName: row.staff_name,
    staffRole: row.staff_role,
    type: row.type,
    status: status as any,
    notes: updatedNotes,
    reason: row.reason,
    outcomeNotes: row.outcome_notes,
    patientConfirmedNextVisit: confirmed,
    createdAt: row.created_at,
    completedAt,
  };

  // Sync to patient
  await p.query(
    `UPDATE patients SET latest_intervention = $2, updated_at = NOW() WHERE id = $1`,
    [row.patient_id, JSON.stringify(updatedIntervention)]
  );

  return updatedIntervention;
}

export async function dbCreateNotification(record: NotificationRecord): Promise<NotificationRecord> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memNotifications.push(record);
    return record;
  }
  await p.query(
    `INSERT INTO notifications (id, patient_id, channel, destination, message_content, status, provider, is_demo, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      record.id, record.patientId, record.channel, record.destination,
      record.messageContent, record.status, record.provider, record.isDemo, record.createdAt
    ]
  );
  return record;
}

export async function dbSavePrediction(pred: RiskPrediction): Promise<RiskPrediction> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const pt = memPatients.get(pred.patientId);
    if (pt) pt.currentRisk = pred;
    return pred;
  }
  await p.query(
    `INSERT INTO predictions (
      id, patient_id, score, risk_level, evidence_coverage, prediction_date, model_version,
      reasons, protective_factors, recommended_actions, immediate_action, secondary_action,
      alternative_action, top_factors, natural_language_summary, responsible_ai_note, input_snapshot
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    ON CONFLICT (id) DO UPDATE SET
      score = EXCLUDED.score, risk_level = EXCLUDED.risk_level, reasons = EXCLUDED.reasons,
      top_factors = EXCLUDED.top_factors, natural_language_summary = EXCLUDED.natural_language_summary`,
    [
      pred.id, pred.patientId, pred.score, pred.riskLevel, pred.evidenceCoverage,
      pred.predictionDate, pred.modelVersion, JSON.stringify(pred.reasons),
      JSON.stringify(pred.protectiveFactors), JSON.stringify(pred.recommendedActions),
      pred.immediateAction, pred.secondaryAction, pred.alternativeAction,
      JSON.stringify(pred.topFactors), pred.naturalLanguageSummary,
      pred.responsibleAiNote, JSON.stringify(pred.inputSnapshot)
    ]
  );
  return pred;
}

export async function dbGetPredictions(limit: number = 100): Promise<RiskPrediction[]> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const list: RiskPrediction[] = [];
    for (const pt of memPatients.values()) {
      if (pt.currentRisk) list.push(pt.currentRisk);
    }
    return list.slice(0, limit);
  }
  const res = await p.query('SELECT * FROM predictions ORDER BY prediction_date DESC LIMIT $1', [limit]);
  return res.rows.map(r => ({
    id: r.id,
    patientId: r.patient_id,
    score: r.score,
    riskLevel: r.risk_level,
    evidenceCoverage: r.evidence_coverage,
    predictionDate: r.prediction_date,
    modelVersion: r.model_version,
    reasons: typeof r.reasons === 'string' ? JSON.parse(r.reasons) : r.reasons,
    protectiveFactors: typeof r.protective_factors === 'string' ? JSON.parse(r.protective_factors) : r.protective_factors,
    recommendedActions: typeof r.recommended_actions === 'string' ? JSON.parse(r.recommended_actions) : r.recommended_actions,
    immediateAction: r.immediate_action,
    secondaryAction: r.secondary_action,
    alternativeAction: r.alternative_action,
    topFactors: typeof r.top_factors === 'string' ? JSON.parse(r.top_factors) : r.top_factors,
    naturalLanguageSummary: r.natural_language_summary,
    responsibleAiNote: r.responsible_ai_note,
    inputSnapshot: typeof r.input_snapshot === 'string' ? JSON.parse(r.input_snapshot) : r.input_snapshot,
  }));
}

export async function dbGetUsers(): Promise<StaffUser[]> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return Array.from(memUsers.values()).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      employeeId: u.employeeId,
      phone: u.phone,
    }));
  }
  const res = await p.query('SELECT id, name, email, role, department, employee_id, phone FROM users ORDER BY name ASC');
  return res.rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    department: r.department,
    employeeId: r.employee_id,
    phone: r.phone,
  }));
}

export async function dbGetUserByEmail(email: string): Promise<(StaffUser & { passwordHash: string }) | null> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memUsers.get(email.trim().toLowerCase()) || null;
  }
  const res = await p.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    department: r.department,
    employeeId: r.employee_id,
    phone: r.phone,
    passwordHash: r.password_hash,
  };
}

export async function dbCreateUser(user: StaffUser, passwordHash: string): Promise<StaffUser> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memUsers.set(user.email.toLowerCase(), { ...user, passwordHash });
    return user;
  }
  await p.query(
    `INSERT INTO users (id, name, email, role, department, employee_id, phone, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [user.id, user.name, user.email.toLowerCase(), user.role, user.department, user.employeeId, user.phone, passwordHash]
  );
  return user;
}

export async function dbDeleteUser(email: string): Promise<boolean> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memUsers.delete(email.trim().toLowerCase());
  }
  const res = await p.query('DELETE FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
  return (res.rowCount ?? 0) > 0;
}

export async function dbLogAudit(
  staffName: string,
  staffRole: string,
  action: string,
  details: string,
  patientCode?: string
): Promise<AuditLog> {
  const p = await getPool();
  const log: AuditLog = {
    id: `AUD-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    staffName,
    staffRole: staffRole as any,
    action,
    details,
    patientCode,
  };
  if (!p) {
    initInMemoryStore();
    memAuditLogs.unshift(log);
    return log;
  }
  await p.query(
    `INSERT INTO audit_logs (id, timestamp, staff_name, staff_role, action, details, patient_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [log.id, log.timestamp, log.staffName, log.staffRole, log.action, log.details, log.patientCode || null]
  );
  return log;
}

export async function dbGetAuditLogs(limit: number = 200): Promise<AuditLog[]> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memAuditLogs.slice(0, limit);
  }
  const res = await p.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1', [limit]);
  return res.rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    staffName: r.staff_name,
    staffRole: r.staff_role,
    action: r.action,
    details: r.details,
    patientCode: r.patient_code,
  }));
}

export async function dbGetScoringConfig(): Promise<ScoringConfiguration> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    return memScoringConfig;
  }
  const res = await p.query("SELECT config_json FROM scoring_configs WHERE id = 'DEFAULT'");
  if (res.rows.length === 0) return { ...DEFAULT_SCORING_CONFIG };
  const val = res.rows[0].config_json;
  return typeof val === 'string' ? JSON.parse(val) : val;
}

export async function dbSaveScoringConfig(config: ScoringConfiguration): Promise<ScoringConfiguration> {
  const mergedConfig: ScoringConfiguration = {
    ...DEFAULT_SCORING_CONFIG,
    ...config,
    weights: {
      ...DEFAULT_SCORING_CONFIG.weights,
      ...(config.weights || {}),
    },
    thresholds: {
      ...DEFAULT_SCORING_CONFIG.thresholds,
      ...(config.thresholds || {}),
    },
  };

  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    memScoringConfig = mergedConfig;
    for (const pt of memPatients.values()) {
      pt.currentRisk = calculatePatientRisk(pt, mergedConfig);
    }
    return mergedConfig;
  }
  await p.query(
    `INSERT INTO scoring_configs (id, config_json, updated_at)
     VALUES ('DEFAULT', $1, NOW())
     ON CONFLICT (id) DO UPDATE SET config_json = EXCLUDED.config_json, updated_at = NOW()`,
    [JSON.stringify(mergedConfig)]
  );

  // Recalculate risk for all patients
  const patientsRes = await p.query('SELECT * FROM patients');
  for (const r of patientsRes.rows) {
    const patient = mapRowToPatient(r);
    const newRisk = calculatePatientRisk(patient, mergedConfig);
    await p.query(
      `UPDATE patients SET current_risk = $2, updated_at = NOW() WHERE id = $1`,
      [patient.id, JSON.stringify(newRisk)]
    );
    await dbSavePrediction(newRisk);
  }

  return mergedConfig;
}

export async function dbGetDashboardSummary(): Promise<DashboardSummary> {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    const patients = Array.from(memPatients.values());
    const totalPatients = patients.length;
    let high = 0, med = 0, low = 0;
    let totalScore = 0, totalAttRate = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const weekStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    let dueToday = 0, dueThisWeek = 0;
    for (const pt of patients) {
      const score = pt.currentRisk?.score || 0;
      totalScore += score;
      totalAttRate += pt.attendanceRate || 0;
      if (score >= 60) high++;
      else if (score >= 30) med++;
      else low++;
      if (pt.nextFollowUpDate === todayStr) dueToday++;
      if (pt.nextFollowUpDate >= todayStr && pt.nextFollowUpDate <= weekStr) dueThisWeek++;
    }
    const interventions = Array.from(memInterventions.values());
    const completed = interventions.filter(i => i.status === 'Completed' || i.status === 'Confirmed').length;
    const pending = interventions.filter(i => i.status === 'Pending').length;
    return {
      totalPatients,
      highRiskPatients: high,
      mediumRiskPatients: med,
      lowRiskPatients: low,
      followUpsDueToday: dueToday,
      followUpsDueThisWeek: dueThisWeek,
      interventionsCompleted: completed,
      interventionsPending: pending,
      outreachSuccessRate: 84,
      averageRiskScore: totalPatients > 0 ? Math.round(totalScore / totalPatients) : 48,
      averageAttendanceRate: totalPatients > 0 ? Math.round(totalAttRate / totalPatients) : 76,
    };
  }

  const totalPatientsRes = await p.query('SELECT COUNT(*) FROM patients');
  const totalPatients = parseInt(totalPatientsRes.rows[0].count, 10);

  const criticalPatientsRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'CRITICAL'");
  const criticalPatients = parseInt(criticalPatientsRes.rows[0].count, 10);

  const highPatientsRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'HIGH'");
  const highPatients = parseInt(highPatientsRes.rows[0].count, 10);

  const mediumPatientsRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'MEDIUM'");
  const mediumPatients = parseInt(mediumPatientsRes.rows[0].count, 10);

  const lowPatientsRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'LOW'");
  const lowPatients = parseInt(lowPatientsRes.rows[0].count, 10);

  const todayStr = new Date().toISOString().split('T')[0];
  const weekStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const dueTodayRes = await p.query("SELECT COUNT(*) FROM patients WHERE next_follow_up_date = $1", [todayStr]);
  const followUpsDueToday = parseInt(dueTodayRes.rows[0].count, 10);

  const dueWeekRes = await p.query("SELECT COUNT(*) FROM patients WHERE next_follow_up_date >= $1 AND next_follow_up_date <= $2", [todayStr, weekStr]);
  const followUpsDueThisWeek = parseInt(dueWeekRes.rows[0].count, 10);

  const completedIntervRes = await p.query("SELECT COUNT(*) FROM interventions WHERE status IN ('Completed', 'Confirmed')");
  const interventionsCompleted = parseInt(completedIntervRes.rows[0].count, 10);

  const pendingIntervRes = await p.query("SELECT COUNT(*) FROM interventions WHERE status = 'Pending'");
  const interventionsPending = parseInt(pendingIntervRes.rows[0].count, 10);

  const attemptedIntervRes = await p.query("SELECT COUNT(*) FROM interventions WHERE status != 'Pending'");
  const attemptedCount = parseInt(attemptedIntervRes.rows[0].count, 10);

  const confirmedIntervRes = await p.query("SELECT COUNT(*) FROM interventions WHERE patient_confirmed_next_visit = TRUE OR status = 'Confirmed'");
  const confirmedCount = parseInt(confirmedIntervRes.rows[0].count, 10);

  const outreachSuccessRate = attemptedCount > 0 ? Math.round((confirmedCount / attemptedCount) * 100) : 91;

  const avgScoresRes = await p.query("SELECT AVG((current_risk->>'score')::int) as avg_score, AVG(attendance_rate) as avg_att FROM patients");
  const averageRiskScore = Math.round(parseFloat(avgScoresRes.rows[0]?.avg_score || '48'));
  const averageAttendanceRate = Math.round(parseFloat(avgScoresRes.rows[0]?.avg_att || '76'));

  return {
    totalPatients,
    highRiskPatients: highPatients + criticalPatients,
    mediumRiskPatients: mediumPatients,
    lowRiskPatients: lowPatients,
    followUpsDueToday,
    followUpsDueThisWeek,
    interventionsCompleted,
    interventionsPending,
    outreachSuccessRate,
    averageRiskScore,
    averageAttendanceRate,
  };
}

export async function dbGetRiskDistribution() {
  const p = await getPool();
  if (!p) {
    initInMemoryStore();
    let critical = 0, high = 0, med = 0, low = 0;
    for (const pt of memPatients.values()) {
      const level = pt.currentRisk?.riskLevel;
      if (level === 'CRITICAL') critical++;
      else if (level === 'HIGH') high++;
      else if (level === 'MEDIUM') med++;
      else low++;
    }
    return [
      { name: 'Critical Risk (80-100)', value: critical, color: '#991B1B' },
      { name: 'High Risk (60-79)', value: high, color: '#EF4444' },
      { name: 'Medium Risk (30-59)', value: med, color: '#F59E0B' },
      { name: 'Low Risk (0-29)', value: low, color: '#10B981' },
    ];
  }
  const criticalRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'CRITICAL'");
  const highRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'HIGH'");
  const medRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'MEDIUM'");
  const lowRes = await p.query("SELECT COUNT(*) FROM patients WHERE (current_risk->>'riskLevel') = 'LOW'");

  const critical = parseInt(criticalRes.rows[0].count, 10);
  const high = parseInt(highRes.rows[0].count, 10);
  const med = parseInt(medRes.rows[0].count, 10);
  const low = parseInt(lowRes.rows[0].count, 10);

  return [
    { name: 'Critical Risk (80-100)', value: critical, color: '#991B1B' },
    { name: 'High Risk (60-79)', value: high, color: '#EF4444' },
    { name: 'Medium Risk (30-59)', value: med, color: '#F59E0B' },
    { name: 'Low Risk (0-29)', value: low, color: '#10B981' },
  ];
}
