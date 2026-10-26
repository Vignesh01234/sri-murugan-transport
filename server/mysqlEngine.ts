import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import type { Database } from 'sql.js';
import type { AppDatabaseState } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const MYSQL_CONFIG_FILE = path.join(DATA_DIR, 'mysql_config.json');
export const MYSQL_DUMP_FILE = path.join(DATA_DIR, 'sri_murugan_transport_mysql.sql');

export interface MySqlConnectionConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  lastSyncStatus?: 'connected' | 'disconnected' | 'error';
  lastErrorMessage?: string;
}

const DEFAULT_MYSQL_CONFIG: MySqlConnectionConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'sri_murugan_tms',
  autoSync: false,
  lastSyncStatus: 'disconnected'
};

export function getMySqlConfig(): MySqlConnectionConfig {
  try {
    if (fs.existsSync(MYSQL_CONFIG_FILE)) {
      const raw = fs.readFileSync(MYSQL_CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_MYSQL_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to read mysql_config.json:', err);
  }
  return { ...DEFAULT_MYSQL_CONFIG };
}

export function saveMySqlConfig(cfg: Partial<MySqlConnectionConfig>): MySqlConnectionConfig {
  const current = getMySqlConfig();
  const updated: MySqlConnectionConfig = {
    ...current,
    ...cfg,
    port: Number(cfg.port ?? current.port) || 3306
  };
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(MYSQL_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

// Escape string for SQL literal
function sqlStr(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return `'${str}'`;
}

function sqlNum(val: any): string {
  const n = Number(val);
  return isNaN(n) ? '0' : String(n);
}

function sqlBool(val: any): string {
  return val ? '1' : '0';
}

export const MYSQL_TABLES_DDL: Record<string, string> = {
  company_settings: `CREATE TABLE IF NOT EXISTS company_settings (
  id VARCHAR(32) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  address TEXT,
  phone VARCHAR(150),
  email VARCHAR(150),
  gstin VARCHAR(32),
  lr_prefix VARCHAR(32),
  next_lr_number INT NOT NULL DEFAULT 1001,
  default_payment_type VARCHAR(32),
  gst_enabled TINYINT(1) DEFAULT 0,
  default_gst_rate DECIMAL(5,2) DEFAULT 5.00,
  data_json LONGTEXT NOT NULL,
  updated_at VARCHAR(40)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  users: `CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(150),
  active TINYINT(1) DEFAULT 1,
  data_json LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  cities: `CREATE TABLE IF NOT EXISTS cities (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  pincode VARCHAR(20),
  active TINYINT(1) DEFAULT 1,
  data_json LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  vehicles: `CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(64) PRIMARY KEY,
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(100) NOT NULL,
  capacity VARCHAR(50),
  owner_name VARCHAR(150),
  owner_phone VARCHAR(50),
  insurance_expiry VARCHAR(30),
  fitness_expiry VARCHAR(30),
  active TINYINT(1) DEFAULT 1,
  data_json LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  drivers: `CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  license_number VARCHAR(80),
  license_expiry VARCHAR(30),
  assigned_vehicle VARCHAR(50),
  active TINYINT(1) DEFAULT 1,
  data_json LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  routes: `CREATE TABLE IF NOT EXISTS routes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  from_city VARCHAR(120) NOT NULL,
  to_city VARCHAR(120) NOT NULL,
  standard_freight_rate DECIMAL(10,2) DEFAULT 0.00,
  transit_time VARCHAR(60),
  active TINYINT(1) DEFAULT 1,
  data_json LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  package_types: `CREATE TABLE IF NOT EXISTS package_types (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(30),
  description TEXT,
  active TINYINT(1) DEFAULT 1,
  data_json LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  parties: `CREATE TABLE IF NOT EXISTS parties (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  business_name VARCHAR(255),
  customer_type VARCHAR(40),
  phone VARCHAR(60),
  email VARCHAR(150),
  city VARCHAR(120),
  state VARCHAR(120),
  pincode VARCHAR(20),
  gstin VARCHAR(40),
  opening_balance DECIMAL(12,2) DEFAULT 0.00,
  active TINYINT(1) DEFAULT 1,
  data_json LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  lrs: `CREATE TABLE IF NOT EXISTS lrs (
  id VARCHAR(64) PRIMARY KEY,
  lr_number VARCHAR(64) UNIQUE NOT NULL,
  lr_date VARCHAR(20) NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  from_city VARCHAR(120) NOT NULL,
  to_city VARCHAR(120) NOT NULL,
  status VARCHAR(32) NOT NULL,
  consignor_name VARCHAR(200) NOT NULL,
  consignee_name VARCHAR(200) NOT NULL,
  total_packages INT NOT NULL DEFAULT 0,
  total_weight DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  freight_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_type VARCHAR(32) NOT NULL,
  payment_status VARCHAR(32) NOT NULL,
  invoice_number VARCHAR(100),
  eway_bill_number VARCHAR(100),
  booking_staff VARCHAR(120),
  created_at VARCHAR(40),
  data_json LONGTEXT NOT NULL,
  INDEX idx_lr_date (lr_date),
  INDEX idx_lr_status (status),
  INDEX idx_lr_consignor (consignor_name),
  INDEX idx_lr_consignee (consignee_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  lr_items: `CREATE TABLE IF NOT EXISTS lr_items (
  id VARCHAR(80) PRIMARY KEY,
  lr_id VARCHAR(64) NOT NULL,
  lr_number VARCHAR(64) NOT NULL,
  serial_no INT NOT NULL DEFAULT 1,
  description VARCHAR(255) NOT NULL,
  package_type VARCHAR(100) NOT NULL,
  packages INT NOT NULL DEFAULT 0,
  weight DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rate_basis VARCHAR(32) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  INDEX idx_lritem_lrid (lr_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  payments: `CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  lr_id VARCHAR(64) NOT NULL,
  lr_number VARCHAR(64) NOT NULL,
  party_name VARCHAR(200) NOT NULL,
  payment_date VARCHAR(20) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL,
  transaction_ref VARCHAR(120),
  received_by VARCHAR(120),
  data_json LONGTEXT NOT NULL,
  INDEX idx_payment_date (payment_date),
  INDEX idx_payment_lrid (lr_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  expenses: `CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  expense_date VARCHAR(20) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  vehicle_number VARCHAR(50),
  route VARCHAR(150),
  payment_method VARCHAR(50),
  data_json LONGTEXT NOT NULL,
  INDEX idx_expense_date (expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  audit_logs: `CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(80) PRIMARY KEY,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  details TEXT NOT NULL,
  performed_by VARCHAR(120) NOT NULL,
  timestamp VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
};

/**
 * Populates all 13 relational tables in the embedded SQLite (sql.js) instance
 * so offline SQL queries work across every table seamlessly.
 */
export function syncAllTablesToSqlite(sqliteDb: Database, state: AppDatabaseState): void {
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      tagline TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      gstin TEXT,
      lr_prefix TEXT,
      next_lr_number INTEGER NOT NULL,
      default_payment_type TEXT,
      gst_enabled INTEGER,
      default_gst_rate REAL,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      active INTEGER,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT,
      active INTEGER,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      vehicle_number TEXT UNIQUE NOT NULL,
      vehicle_type TEXT NOT NULL,
      capacity TEXT,
      owner_name TEXT,
      owner_phone TEXT,
      insurance_expiry TEXT,
      fitness_expiry TEXT,
      active INTEGER,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      license_number TEXT,
      license_expiry TEXT,
      assigned_vehicle TEXT,
      active INTEGER,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      standard_freight_rate REAL,
      transit_time TEXT,
      active INTEGER,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS package_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      active INTEGER,
      data_json TEXT NOT NULL
    );

    DROP TABLE IF EXISTS parties;
    CREATE TABLE parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_name TEXT,
      customer_type TEXT,
      phone TEXT,
      email TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      gstin TEXT,
      opening_balance REAL,
      active INTEGER,
      data_json TEXT NOT NULL
    );

    DROP TABLE IF EXISTS lrs;
    CREATE TABLE lrs (
      id TEXT PRIMARY KEY,
      lr_number TEXT UNIQUE NOT NULL,
      lr_date TEXT NOT NULL,
      vehicle_number TEXT NOT NULL,
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      status TEXT NOT NULL,
      consignor_name TEXT NOT NULL,
      consignee_name TEXT NOT NULL,
      total_packages INTEGER NOT NULL,
      total_weight REAL NOT NULL,
      freight_amount REAL NOT NULL,
      grand_total REAL NOT NULL,
      paid_amount REAL NOT NULL,
      balance_due REAL NOT NULL,
      payment_type TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      invoice_number TEXT,
      eway_bill_number TEXT,
      booking_staff TEXT,
      created_at TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lr_items (
      id TEXT PRIMARY KEY,
      lr_id TEXT NOT NULL,
      lr_number TEXT NOT NULL,
      serial_no INTEGER NOT NULL,
      description TEXT NOT NULL,
      package_type TEXT NOT NULL,
      packages INTEGER NOT NULL,
      weight REAL NOT NULL,
      rate REAL NOT NULL,
      rate_basis TEXT NOT NULL,
      amount REAL NOT NULL
    );

    DROP TABLE IF EXISTS payments;
    CREATE TABLE payments (
      id TEXT PRIMARY KEY,
      lr_id TEXT NOT NULL,
      lr_number TEXT NOT NULL,
      party_name TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_ref TEXT,
      received_by TEXT,
      data_json TEXT NOT NULL
    );

    DROP TABLE IF EXISTS expenses;
    CREATE TABLE expenses (
      id TEXT PRIMARY KEY,
      expense_date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      vehicle_number TEXT,
      route TEXT,
      payment_method TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  // Clear existing rows before fresh insert
  sqliteDb.run('DELETE FROM company_settings;');
  sqliteDb.run('DELETE FROM users;');
  sqliteDb.run('DELETE FROM cities;');
  sqliteDb.run('DELETE FROM vehicles;');
  sqliteDb.run('DELETE FROM drivers;');
  sqliteDb.run('DELETE FROM routes;');
  sqliteDb.run('DELETE FROM package_types;');
  sqliteDb.run('DELETE FROM lr_items;');
  sqliteDb.run('DELETE FROM audit_logs;');

  // 1. Settings
  const s = state.settings;
  sqliteDb.run(
    `INSERT INTO company_settings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'default', s.companyName, s.tagline || '', s.address, s.phone, s.email, s.gstin,
      s.lrPrefix, s.nextLrNumber, s.defaultPaymentType, s.gstEnabled ? 1 : 0,
      s.defaultGstRate, JSON.stringify(s)
    ]
  );

  // 2. Users
  const stmtUser = sqliteDb.prepare(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const u of state.users) {
    stmtUser.run([u.id, u.username, u.name, u.role, u.phone || '', u.email || '', u.active ? 1 : 0, JSON.stringify(u)]);
  }
  stmtUser.free();

  // 3. Cities
  const stmtCity = sqliteDb.prepare(`INSERT INTO cities VALUES (?, ?, ?, ?, ?, ?)`);
  for (const c of state.cities) {
    stmtCity.run([c.id, c.name, c.state, c.pincode || '', c.active ? 1 : 0, JSON.stringify(c)]);
  }
  stmtCity.free();

  // 4. Vehicles
  const stmtVeh = sqliteDb.prepare(`INSERT INTO vehicles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const v of state.vehicles) {
    stmtVeh.run([
      v.id, v.vehicleNumber, v.vehicleType, v.capacity || '', v.ownerName || '',
      v.ownerPhone || '', v.insuranceExpiry || '', v.fitnessExpiry || '', v.active ? 1 : 0, JSON.stringify(v)
    ]);
  }
  stmtVeh.free();

  // 5. Drivers
  const stmtDrv = sqliteDb.prepare(`INSERT INTO drivers VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const d of state.drivers) {
    stmtDrv.run([
      d.id, d.name, d.phone, d.licenseNumber || '', d.licenseExpiry || '',
      d.assignedVehicle || '', d.active ? 1 : 0, JSON.stringify(d)
    ]);
  }
  stmtDrv.free();

  // 6. Routes
  const stmtRt = sqliteDb.prepare(`INSERT INTO routes VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const r of state.routes) {
    stmtRt.run([
      r.id, r.name, r.fromCity, r.toCity, r.standardFreightRate || 0,
      r.transitTime || '', r.active ? 1 : 0, JSON.stringify(r)
    ]);
  }
  stmtRt.free();

  // 7. Package Types
  const stmtPkg = sqliteDb.prepare(`INSERT INTO package_types VALUES (?, ?, ?, ?, ?, ?)`);
  for (const p of state.packageTypes || []) {
    stmtPkg.run([p.id, p.name, p.code || '', p.description || '', p.active ? 1 : 0, JSON.stringify(p)]);
  }
  stmtPkg.free();

  // 8. Parties
  const stmtPty = sqliteDb.prepare(`INSERT INTO parties VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const p of state.parties) {
    stmtPty.run([
      p.id, p.name, p.businessName || '', p.customerType || 'Both', p.phone || '',
      p.email || '', p.city || '', p.state || '', p.pincode || '', p.gstin || '',
      p.openingBalance || 0, p.active ? 1 : 0, JSON.stringify(p)
    ]);
  }
  stmtPty.free();

  // 9. LRs & 10. LR Items
  const stmtLR = sqliteDb.prepare(`
    INSERT INTO lrs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const stmtItem = sqliteDb.prepare(`
    INSERT INTO lr_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const lr of state.lrs) {
    stmtLR.run([
      lr.id, lr.lrNumber, lr.lrDate, lr.vehicleNumber || '', lr.fromCity, lr.toCity,
      lr.status, lr.consignorName, lr.consigneeName, lr.totalPackages || 0,
      lr.totalWeight || 0, lr.freightAmount || 0, lr.grandTotal || 0, lr.paidAmount || 0,
      lr.balanceDue || 0, lr.paymentType, lr.paymentStatus, lr.invoiceNumber || '',
      lr.ewayBillNumber || '', lr.bookingStaff || '', lr.createdAt || '', JSON.stringify(lr)
    ]);
    if (Array.isArray(lr.items)) {
      lr.items.forEach((item, idx) => {
        const itemId = `${lr.id}-itm-${idx + 1}`;
        stmtItem.run([
          itemId, lr.id, lr.lrNumber, item.serialNo || idx + 1, item.description || '',
          item.packageType || 'Carton Box', item.packages || 0, item.weight || 0,
          item.rate || 0, item.rateBasis || 'per_pkg', item.amount || 0
        ]);
      });
    }
  }
  stmtLR.free();
  stmtItem.free();

  // 11. Payments
  const stmtPay = sqliteDb.prepare(`INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const p of state.payments) {
    stmtPay.run([
      p.id, p.lrId, p.lrNumber, p.partyName, p.paymentDate, p.amount || 0,
      p.paymentMethod || 'Cash', p.transactionRef || '', p.receivedBy || '', JSON.stringify(p)
    ]);
  }
  stmtPay.free();

  // 12. Expenses
  const stmtExp = sqliteDb.prepare(`INSERT INTO expenses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const e of state.expenses) {
    stmtExp.run([
      e.id, e.expenseDate, e.category, e.description, e.amount || 0,
      e.vehicleNumber || '', e.route || '', e.paymentMethod || 'Cash', JSON.stringify(e)
    ]);
  }
  stmtExp.free();

  // 13. Audit Logs
  const stmtAud = sqliteDb.prepare(`INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const a of state.auditLogs) {
    stmtAud.run([a.id, a.action, a.entityType, a.entityId, a.details, a.performedBy, a.timestamp]);
  }
  stmtAud.free();
}

/**
 * Generates a complete, standard MySQL 8.0 / MariaDB .sql script file on disk
 * so the user can import it into XAMPP / WAMP / MySQL Workbench / CLI anytime.
 */
export function generateMySqlDumpFile(state: AppDatabaseState, dbName = 'sri_murugan_tms'): string {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push(`-- ============================================================================`);
  lines.push(`-- SRI MURUGAN TRANSPORT - COMPLETE MYSQL / MARIADB OFFLINE SERVER DATABASE`);
  lines.push(`-- Generated At: ${now}`);
  lines.push(`-- Compatible With: MySQL 5.7+, MySQL 8.0+, MariaDB 10.x+, XAMPP, WAMP, Laragon`);
  lines.push(`-- ============================================================================`);
  lines.push(`-- HOW TO IMPORT ON OFFLINE SERVER:`);
  lines.push(`--   Option A (Command Line): mysql -u root -p < sri_murugan_transport_mysql.sql`);
  lines.push(`--   Option B (phpMyAdmin / MySQL Workbench): Open SQL tab or Import -> Select this file`);
  lines.push(`-- ============================================================================\n`);

  lines.push(`SET NAMES utf8mb4;`);
  lines.push(`SET FOREIGN_KEY_CHECKS = 0;\n`);

  lines.push(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  lines.push(`USE \`${dbName}\`;\n`);

  // DDL for all tables
  for (const [tableName, ddl] of Object.entries(MYSQL_TABLES_DDL)) {
    lines.push(`-- Table structure for \`${tableName}\``);
    lines.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
    lines.push(ddl);
    lines.push('');
  }

  // 1. company_settings
  const s = state.settings;
  lines.push(`-- Data for table \`company_settings\``);
  lines.push(
    `INSERT INTO \`company_settings\` VALUES ('default', ${sqlStr(s.companyName)}, ${sqlStr(s.tagline || '')}, ${sqlStr(s.address)}, ${sqlStr(s.phone)}, ${sqlStr(s.email)}, ${sqlStr(s.gstin)}, ${sqlStr(s.lrPrefix)}, ${sqlNum(s.nextLrNumber)}, ${sqlStr(s.defaultPaymentType)}, ${sqlBool(s.gstEnabled)}, ${sqlNum(s.defaultGstRate)}, ${sqlStr(JSON.stringify(s))}, ${sqlStr(now)});\n`
  );

  // 2. users
  if (state.users.length > 0) {
    lines.push(`-- Data for table \`users\``);
    for (const u of state.users) {
      lines.push(
        `INSERT INTO \`users\` VALUES (${sqlStr(u.id)}, ${sqlStr(u.username)}, ${sqlStr(u.name)}, ${sqlStr(u.role)}, ${sqlStr(u.phone || '')}, ${sqlStr(u.email || '')}, ${sqlBool(u.active)}, ${sqlStr(JSON.stringify(u))});`
      );
    }
    lines.push('');
  }

  // 3. cities
  if (state.cities.length > 0) {
    lines.push(`-- Data for table \`cities\``);
    for (const c of state.cities) {
      lines.push(
        `INSERT INTO \`cities\` VALUES (${sqlStr(c.id)}, ${sqlStr(c.name)}, ${sqlStr(c.state)}, ${sqlStr(c.pincode || '')}, ${sqlBool(c.active)}, ${sqlStr(JSON.stringify(c))});`
      );
    }
    lines.push('');
  }

  // 4. vehicles
  if (state.vehicles.length > 0) {
    lines.push(`-- Data for table \`vehicles\``);
    for (const v of state.vehicles) {
      lines.push(
        `INSERT INTO \`vehicles\` VALUES (${sqlStr(v.id)}, ${sqlStr(v.vehicleNumber)}, ${sqlStr(v.vehicleType)}, ${sqlStr(v.capacity || '')}, ${sqlStr(v.ownerName || '')}, ${sqlStr(v.ownerPhone || '')}, ${sqlStr(v.insuranceExpiry || '')}, ${sqlStr(v.fitnessExpiry || '')}, ${sqlBool(v.active)}, ${sqlStr(JSON.stringify(v))});`
      );
    }
    lines.push('');
  }

  // 5. drivers
  if (state.drivers.length > 0) {
    lines.push(`-- Data for table \`drivers\``);
    for (const d of state.drivers) {
      lines.push(
        `INSERT INTO \`drivers\` VALUES (${sqlStr(d.id)}, ${sqlStr(d.name)}, ${sqlStr(d.phone)}, ${sqlStr(d.licenseNumber || '')}, ${sqlStr(d.licenseExpiry || '')}, ${sqlStr(d.assignedVehicle || '')}, ${sqlBool(d.active)}, ${sqlStr(JSON.stringify(d))});`
      );
    }
    lines.push('');
  }

  // 6. routes
  if (state.routes.length > 0) {
    lines.push(`-- Data for table \`routes\``);
    for (const r of state.routes) {
      lines.push(
        `INSERT INTO \`routes\` VALUES (${sqlStr(r.id)}, ${sqlStr(r.name)}, ${sqlStr(r.fromCity)}, ${sqlStr(r.toCity)}, ${sqlNum(r.standardFreightRate)}, ${sqlStr(r.transitTime || '')}, ${sqlBool(r.active)}, ${sqlStr(JSON.stringify(r))});`
      );
    }
    lines.push('');
  }

  // 7. package_types
  if (state.packageTypes && state.packageTypes.length > 0) {
    lines.push(`-- Data for table \`package_types\``);
    for (const p of state.packageTypes) {
      lines.push(
        `INSERT INTO \`package_types\` VALUES (${sqlStr(p.id)}, ${sqlStr(p.name)}, ${sqlStr(p.code || '')}, ${sqlStr(p.description || '')}, ${sqlBool(p.active)}, ${sqlStr(JSON.stringify(p))});`
      );
    }
    lines.push('');
  }

  // 8. parties
  if (state.parties.length > 0) {
    lines.push(`-- Data for table \`parties\``);
    for (const p of state.parties) {
      lines.push(
        `INSERT INTO \`parties\` VALUES (${sqlStr(p.id)}, ${sqlStr(p.name)}, ${sqlStr(p.businessName || '')}, ${sqlStr(p.customerType || 'Both')}, ${sqlStr(p.phone || '')}, ${sqlStr(p.email || '')}, ${sqlStr(p.city || '')}, ${sqlStr(p.state || '')}, ${sqlStr(p.pincode || '')}, ${sqlStr(p.gstin || '')}, ${sqlNum(p.openingBalance)}, ${sqlBool(p.active)}, ${sqlStr(JSON.stringify(p))});`
      );
    }
    lines.push('');
  }

  // 9. lrs & 10. lr_items
  if (state.lrs.length > 0) {
    lines.push(`-- Data for table \`lrs\``);
    for (const lr of state.lrs) {
      lines.push(
        `INSERT INTO \`lrs\` VALUES (${sqlStr(lr.id)}, ${sqlStr(lr.lrNumber)}, ${sqlStr(lr.lrDate)}, ${sqlStr(lr.vehicleNumber || '')}, ${sqlStr(lr.fromCity)}, ${sqlStr(lr.toCity)}, ${sqlStr(lr.status)}, ${sqlStr(lr.consignorName)}, ${sqlStr(lr.consigneeName)}, ${sqlNum(lr.totalPackages)}, ${sqlNum(lr.totalWeight)}, ${sqlNum(lr.freightAmount)}, ${sqlNum(lr.grandTotal)}, ${sqlNum(lr.paidAmount)}, ${sqlNum(lr.balanceDue)}, ${sqlStr(lr.paymentType)}, ${sqlStr(lr.paymentStatus)}, ${sqlStr(lr.invoiceNumber || '')}, ${sqlStr(lr.ewayBillNumber || '')}, ${sqlStr(lr.bookingStaff || '')}, ${sqlStr(lr.createdAt || '')}, ${sqlStr(JSON.stringify(lr))});`
      );
    }
    lines.push('');

    lines.push(`-- Data for table \`lr_items\``);
    for (const lr of state.lrs) {
      if (Array.isArray(lr.items)) {
        lr.items.forEach((item, idx) => {
          const itemId = `${lr.id}-itm-${idx + 1}`;
          lines.push(
            `INSERT INTO \`lr_items\` VALUES (${sqlStr(itemId)}, ${sqlStr(lr.id)}, ${sqlStr(lr.lrNumber)}, ${sqlNum(item.serialNo || idx + 1)}, ${sqlStr(item.description || '')}, ${sqlStr(item.packageType || 'Carton Box')}, ${sqlNum(item.packages)}, ${sqlNum(item.weight)}, ${sqlNum(item.rate)}, ${sqlStr(item.rateBasis || 'per_pkg')}, ${sqlNum(item.amount)});`
          );
        });
      }
    }
    lines.push('');
  }

  // 11. payments
  if (state.payments.length > 0) {
    lines.push(`-- Data for table \`payments\``);
    for (const p of state.payments) {
      lines.push(
        `INSERT INTO \`payments\` VALUES (${sqlStr(p.id)}, ${sqlStr(p.lrId)}, ${sqlStr(p.lrNumber)}, ${sqlStr(p.partyName)}, ${sqlStr(p.paymentDate)}, ${sqlNum(p.amount)}, ${sqlStr(p.paymentMethod || 'Cash')}, ${sqlStr(p.transactionRef || '')}, ${sqlStr(p.receivedBy || '')}, ${sqlStr(JSON.stringify(p))});`
      );
    }
    lines.push('');
  }

  // 12. expenses
  if (state.expenses.length > 0) {
    lines.push(`-- Data for table \`expenses\``);
    for (const e of state.expenses) {
      lines.push(
        `INSERT INTO \`expenses\` VALUES (${sqlStr(e.id)}, ${sqlStr(e.expenseDate)}, ${sqlStr(e.category)}, ${sqlStr(e.description)}, ${sqlNum(e.amount)}, ${sqlStr(e.vehicleNumber || '')}, ${sqlStr(e.route || '')}, ${sqlStr(e.paymentMethod || 'Cash')}, ${sqlStr(JSON.stringify(e))});`
      );
    }
    lines.push('');
  }

  // 13. audit_logs
  if (state.auditLogs.length > 0) {
    lines.push(`-- Data for table \`audit_logs\``);
    for (const a of state.auditLogs.slice(0, 200)) {
      lines.push(
        `INSERT INTO \`audit_logs\` VALUES (${sqlStr(a.id)}, ${sqlStr(a.action)}, ${sqlStr(a.entityType)}, ${sqlStr(a.entityId)}, ${sqlStr(a.details)}, ${sqlStr(a.performedBy)}, ${sqlStr(a.timestamp)});`
      );
    }
    lines.push('');
  }

  lines.push(`SET FOREIGN_KEY_CHECKS = 1;`);
  const sqlContent = lines.join('\n');
  fs.writeFileSync(MYSQL_DUMP_FILE, sqlContent, 'utf-8');
  return sqlContent;
}

/**
 * Tests connection to a live MySQL / MariaDB server on localhost or LAN
 */
export async function testMySqlConnection(configOverride?: Partial<MySqlConnectionConfig>): Promise<{
  connected: boolean;
  version?: string;
  databaseExists?: boolean;
  tableCount?: number;
  latencyMs?: number;
  error?: string;
}> {
  const cfg = { ...getMySqlConfig(), ...configOverride };
  const start = Date.now();
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host: cfg.host,
      port: Number(cfg.port) || 3306,
      user: cfg.user,
      password: cfg.password || undefined,
      connectTimeout: 4000
    });

    const [verRows]: any = await conn.query('SELECT VERSION() AS version');
    const version = verRows?.[0]?.version || 'MySQL Compatible Server';

    const [dbRows]: any = await conn.query('SHOW DATABASES LIKE ?', [cfg.database]);
    const databaseExists = Array.isArray(dbRows) && dbRows.length > 0;

    let tableCount = 0;
    if (databaseExists) {
      await conn.changeUser({ database: cfg.database });
      const [tblRows]: any = await conn.query('SHOW TABLES');
      tableCount = Array.isArray(tblRows) ? tblRows.length : 0;
    }

    const latencyMs = Date.now() - start;
    saveMySqlConfig({
      ...cfg,
      lastSyncStatus: 'connected',
      lastErrorMessage: undefined
    });

    return {
      connected: true,
      version,
      databaseExists,
      tableCount,
      latencyMs
    };
  } catch (err: any) {
    saveMySqlConfig({
      ...cfg,
      lastSyncStatus: 'error',
      lastErrorMessage: err.message || 'Connection refused'
    });
    return {
      connected: false,
      error: err.message || 'Unable to connect to MySQL Server'
    };
  } finally {
    if (conn) {
      try { await conn.end(); } catch {}
    }
  }
}

/**
 * Creates database + all 13 tables in the target MySQL Server and pushes all current state records
 */
export async function syncPushToMySql(state: AppDatabaseState, configOverride?: Partial<MySqlConnectionConfig>): Promise<{
  success: boolean;
  tablesSynced: number;
  rowsSynced: number;
  database: string;
  error?: string;
}> {
  const cfg = { ...getMySqlConfig(), ...configOverride };
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host: cfg.host,
      port: Number(cfg.port) || 3306,
      user: cfg.user,
      password: cfg.password || undefined,
      multipleStatements: true,
      connectTimeout: 5000
    });

    const sqlDump = generateMySqlDumpFile(state, cfg.database);
    await conn.query(sqlDump);

    const rowsSynced =
      1 +
      state.users.length +
      state.cities.length +
      state.vehicles.length +
      state.drivers.length +
      state.routes.length +
      (state.packageTypes?.length || 0) +
      state.parties.length +
      state.lrs.length +
      state.lrs.reduce((sum, l) => sum + (l.items?.length || 0), 0) +
      state.payments.length +
      state.expenses.length +
      Math.min(state.auditLogs.length, 200);

    const now = new Date().toISOString();
    saveMySqlConfig({
      ...cfg,
      lastSyncedAt: now,
      lastSyncStatus: 'connected',
      lastErrorMessage: undefined
    });

    return {
      success: true,
      tablesSynced: Object.keys(MYSQL_TABLES_DDL).length,
      rowsSynced,
      database: cfg.database
    };
  } catch (err: any) {
    saveMySqlConfig({
      ...cfg,
      lastSyncStatus: 'error',
      lastErrorMessage: err.message || 'Failed to sync to MySQL'
    });
    return {
      success: false,
      tablesSynced: 0,
      rowsSynced: 0,
      database: cfg.database,
      error: err.message || 'Failed to push data to MySQL Server'
    };
  } finally {
    if (conn) {
      try { await conn.end(); } catch {}
    }
  }
}

/**
 * Pulls all records from the live MySQL Server into AppDatabaseState
 */
export async function syncPullFromMySql(
  currentState: AppDatabaseState,
  configOverride?: Partial<MySqlConnectionConfig>
): Promise<{
  success: boolean;
  state?: AppDatabaseState;
  rowsPulled?: number;
  error?: string;
}> {
  const cfg = { ...getMySqlConfig(), ...configOverride };
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host: cfg.host,
      port: Number(cfg.port) || 3306,
      user: cfg.user,
      password: cfg.password || undefined,
      database: cfg.database,
      connectTimeout: 5000
    });

    const parseJsonRows = async <T>(tableName: string, fallback: T[]): Promise<T[]> => {
      try {
        const [rows]: any = await conn!.query(`SELECT data_json FROM \`${tableName}\``);
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => JSON.parse(r.data_json));
        }
      } catch {}
      return fallback;
    };

    const settingsArr = await parseJsonRows('company_settings', [currentState.settings]);
    const users = await parseJsonRows('users', currentState.users);
    const cities = await parseJsonRows('cities', currentState.cities);
    const vehicles = await parseJsonRows('vehicles', currentState.vehicles);
    const drivers = await parseJsonRows('drivers', currentState.drivers);
    const routes = await parseJsonRows('routes', currentState.routes);
    const packageTypes = await parseJsonRows('package_types', currentState.packageTypes || []);
    const parties = await parseJsonRows('parties', currentState.parties);
    const lrs = await parseJsonRows('lrs', currentState.lrs);
    const payments = await parseJsonRows('payments', currentState.payments);
    const expenses = await parseJsonRows('expenses', currentState.expenses);

    const newState: AppDatabaseState = {
      settings: settingsArr[0] || currentState.settings,
      users,
      cities,
      vehicles,
      drivers,
      routes,
      packageTypes,
      parties,
      lrs,
      payments,
      expenses,
      auditLogs: currentState.auditLogs
    };

    const rowsPulled =
      users.length + cities.length + vehicles.length + drivers.length +
      routes.length + packageTypes.length + parties.length + lrs.length +
      payments.length + expenses.length;

    saveMySqlConfig({
      ...cfg,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'connected',
      lastErrorMessage: undefined
    });

    return {
      success: true,
      state: newState,
      rowsPulled
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to pull data from MySQL server'
    };
  } finally {
    if (conn) {
      try { await conn.end(); } catch {}
    }
  }
}

/**
 * Returns local LAN IP addresses so multiple computers in the transport office
 * can access this offline server over Wi-Fi / Ethernet LAN.
 */
export function getOfflineServerLanInfo(port = 3000): {
  hostname: string;
  port: number;
  lanUrls: string[];
  localUrl: string;
} {
  const nets = os.networkInterfaces();
  const lanUrls: string[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        lanUrls.push(`http://${net.address}:${port}`);
      }
    }
  }

  return {
    hostname: os.hostname(),
    port,
    localUrl: `http://localhost:${port}`,
    lanUrls: lanUrls.length > 0 ? lanUrls : [`http://192.168.1.100:${port}`]
  };
}
