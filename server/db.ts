import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { 
  LR, LRItem, Party, Vehicle, Driver, City, Route, 
  Payment, Expense, CompanySettings, User, AuditLog, PackageType 
} from '../src/types/index.ts';
import { DEFAULT_PRINT_FIELD_CONFIG } from '../src/types/index.ts';
import {
  syncAllTablesToSqlite,
  generateMySqlDumpFile,
  getMySqlConfig,
  saveMySqlConfig,
  testMySqlConnection,
  syncPushToMySql,
  syncPullFromMySql,
  MYSQL_TABLES_DDL,
  getOfflineServerLanInfo,
  MYSQL_DUMP_FILE
} from './mysqlEngine.ts';
import type { MySqlConnectionConfig } from './mysqlEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'transport.sqlite');
const MIRROR_JSON = path.join(DATA_DIR, 'transport_data.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db: Database;
let SQL: any;

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'SRI MURUGAN TRANSPORT',
  address: 'No. 14/B, G.S.T. Road, Guindy Industrial Estate, Chennai - 600032',
  phone: '+91 94440 12345, +91 98400 67890',
  email: 'bookings@srimurugantransport.com',
  gstin: '33AABCS8921M1Z4',
  lrPrefix: 'SMT-2026-',
  nextLrNumber: 1001,
  defaultPaymentType: 'To Pay',
  defaultPrintCopy: 'All 4 Copies',
  declaration: "Goods are carried at owner's risk. Subject to local jurisdiction. Please check goods at the time of delivery.",
  defaultWeightUnit: 'kg',
  gstEnabled: false,
  defaultGstRate: 5,
  taxCalculationBasis: 'freight',
  currencySymbol: '₹',
  printLayout: 'landscape',
  printPaperSize: 'A4',
  printCopiesPerSheet: '1',
  showLogoOnLR: true,
  logoStyle: 'emblem',
  tagline: 'Prompt, Safe & Reliable Daily Cargo Services Across South India',
  printFields: { ...DEFAULT_PRINT_FIELD_CONFIG }
};

export const INITIAL_USERS: User[] = [
  { id: 'usr-1', username: 'admin', name: 'M. Selvaraj (Admin)', role: 'Administrator', phone: '9444012345', email: 'admin@srimurugantransport.com', active: true },
  { id: 'usr-2', username: 'staff1', name: 'R. Vignesh (Booking Staff)', role: 'Booking Staff', phone: '9840067890', email: 'vignesh@srimurugantransport.com', active: true },
  { id: 'usr-3', username: 'accounts', name: 'K. Balaji (Accountant)', role: 'Accountant', phone: '9789012345', email: 'accounts@srimurugantransport.com', active: true },
  { id: 'usr-4', username: 'viewer', name: 'Guest Viewer', role: 'Viewer', phone: '9123456789', email: 'viewer@srimurugantransport.com', active: true }
];

export const INITIAL_CITIES: City[] = [
  { id: 'cty-1', name: 'Chennai', state: 'Tamil Nadu', pincode: '600001', active: true },
  { id: 'cty-2', name: 'Vellore', state: 'Tamil Nadu', pincode: '632001', active: true },
  { id: 'cty-3', name: 'Coimbatore', state: 'Tamil Nadu', pincode: '641001', active: true },
  { id: 'cty-4', name: 'Salem', state: 'Tamil Nadu', pincode: '636001', active: true },
  { id: 'cty-5', name: 'Madurai', state: 'Tamil Nadu', pincode: '625001', active: true },
  { id: 'cty-6', name: 'Bengaluru', state: 'Karnataka', pincode: '560001', active: true },
  { id: 'cty-7', name: 'Hyderabad', state: 'Telangana', pincode: '500001', active: true },
  { id: 'cty-8', name: 'Ranipet', state: 'Tamil Nadu', pincode: '632401', active: true },
  { id: 'cty-9', name: 'Tirupur', state: 'Tamil Nadu', pincode: '641601', active: true },
  { id: 'cty-10', name: 'Kanchipuram', state: 'Tamil Nadu', pincode: '631501', active: true }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'veh-1', vehicleNumber: 'TN 23 BX 4589', vehicleType: 'Eicher 17ft Open', capacity: '7.5 Ton', ownerName: 'Murugan Transport Fleet', ownerPhone: '9444012345', insuranceExpiry: '2027-04-15', fitnessExpiry: '2027-06-30', active: true, createdAt: '2026-01-01' },
  { id: 'veh-2', vehicleNumber: 'TN 04 CD 1290', vehicleType: 'Tata 1109 Container', capacity: '9.0 Ton', ownerName: 'Murugan Transport Fleet', ownerPhone: '9444012345', insuranceExpiry: '2027-03-20', fitnessExpiry: '2027-05-18', active: true, createdAt: '2026-01-01' },
  { id: 'veh-3', vehicleNumber: 'TN 02 AB 9811', vehicleType: 'Ashok Leyland 10 Wheeler', capacity: '16.0 Ton', ownerName: 'R. K. Logistics & Co.', ownerPhone: '9840123456', insuranceExpiry: '2026-11-25', fitnessExpiry: '2026-12-10', active: true, createdAt: '2026-01-01' },
  { id: 'veh-4', vehicleNumber: 'TN 37 CY 7744', vehicleType: 'Tata 407', capacity: '3.5 Ton', ownerName: 'Murugan Transport Fleet', ownerPhone: '9444012345', insuranceExpiry: '2027-01-10', fitnessExpiry: '2027-02-28', active: true, createdAt: '2026-01-01' }
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'drv-1', name: 'K. Rajendran', phone: '9840112233', licenseNumber: 'TN0220140029182', licenseExpiry: '2030-08-14', address: 'Old Town, Ranipet, Tamil Nadu', assignedVehicle: 'TN 23 BX 4589', active: true, createdAt: '2026-01-01' },
  { id: 'drv-2', name: 'P. Shanmugam', phone: '9789334455', licenseNumber: 'TN2320110034871', licenseExpiry: '2029-05-22', address: 'Katpadi, Vellore, Tamil Nadu', assignedVehicle: 'TN 04 CD 1290', active: true, createdAt: '2026-01-01' },
  { id: 'drv-3', name: 'M. Duraisamy', phone: '9443556677', licenseNumber: 'TN0420080018933', licenseExpiry: '2028-11-09', address: 'Avadi, Chennai, Tamil Nadu', assignedVehicle: 'TN 02 AB 9811', active: true, createdAt: '2026-01-01' }
];

export const INITIAL_ROUTES: Route[] = [
  { id: 'rt-1', name: 'Vellore - Chennai Direct', fromCity: 'Vellore', toCity: 'Chennai', standardFreightRate: 1.8, transitTime: '4 Hours', active: true },
  { id: 'rt-2', name: 'Chennai - Coimbatore Express', fromCity: 'Chennai', toCity: 'Coimbatore', standardFreightRate: 3.5, transitTime: '10 Hours', active: true },
  { id: 'rt-3', name: 'Ranipet - Bengaluru Heavy Corridor', fromCity: 'Ranipet', toCity: 'Bengaluru', standardFreightRate: 2.9, transitTime: '6 Hours', active: true },
  { id: 'rt-4', name: 'Chennai - Madurai Route', fromCity: 'Chennai', toCity: 'Madurai', standardFreightRate: 3.8, transitTime: '11 Hours', active: true },
  { id: 'rt-5', name: 'Vellore - Salem', fromCity: 'Vellore', toCity: 'Salem', standardFreightRate: 2.2, transitTime: '5 Hours', active: true }
];

export const INITIAL_PARTIES: Party[] = [
  {
    id: 'pty-1',
    name: 'Sri Krishna Textiles & Spares',
    businessName: 'Sri Krishna Textiles & Spares Pvt Ltd',
    address: 'Plot 45, SIPCOT Phase 2, Bhel Road',
    city: 'Ranipet',
    state: 'Tamil Nadu',
    pincode: '632403',
    phone: '9442111222',
    email: 'dispatch@krishnatex.com',
    gstin: '33AABCK1234D1Z2',
    openingBalance: 0,
    customerType: 'Both',
    active: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'pty-2',
    name: 'Balaji Hardware & Tools',
    businessName: 'Balaji Hardware & Tools Mart',
    address: '112 Broadway Street, George Town',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    phone: '9840222333',
    email: 'info@balajitools.in',
    gstin: '33AAACB5678E1Z8',
    openingBalance: 0,
    customerType: 'Consignee',
    active: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'pty-3',
    name: 'Vellore Precision Leathercraft',
    businessName: 'Vellore Precision Leathercraft LLP',
    address: '28 Gandhi Nagar Main Road',
    city: 'Vellore',
    state: 'Tamil Nadu',
    pincode: '632006',
    phone: '9443333444',
    email: 'sales@velloreleather.com',
    gstin: '33AAAFV9876F1Z1',
    openingBalance: 0,
    customerType: 'Consignor',
    active: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'pty-4',
    name: 'Apex Electricals & Pumps',
    businessName: 'Apex Electricals India Ltd',
    address: '88 Avinashi Road, Peelamedu',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641004',
    phone: '9488444555',
    email: 'orders@apexelectricals.com',
    gstin: '33AAACA4411C1ZX',
    openingBalance: 0,
    customerType: 'Both',
    active: true,
    createdAt: '2026-01-01'
  }
];

export const INITIAL_LRS: LR[] = [
  {
    id: 'lr-1',
    lrNumber: 'SMT-2026-0001',
    lrDate: '2026-10-15',
    vehicleNumber: 'TN 23 BX 4589',
    vehicleType: 'Eicher 17ft Open',
    driverName: 'K. Rajendran',
    driverPhone: '9840112233',
    fromCity: 'Vellore',
    toCity: 'Chennai',
    bookingBranch: 'Ranipet Main Branch',
    deliveryBranch: 'Chennai Guindy Godown',
    bookingStaff: 'R. Vignesh',
    expectedDeliveryDate: '2026-10-16',
    status: 'Delivered',
    deliveryDate: '2026-10-16',
    deliveryReceivedBy: 'K. Parthiban (Store Keeper)',
    podReference: 'POD-CH-9941',
    deliveryRemarks: 'Delivered in sound condition. 10 cartons checked.',
    consignorId: 'pty-3',
    consignorName: 'Vellore Precision Leathercraft',
    consignorBusinessName: 'Vellore Precision Leathercraft LLP',
    consignorAddress: '28 Gandhi Nagar Main Road, Vellore',
    consignorCity: 'Vellore',
    consignorState: 'Tamil Nadu',
    consignorPincode: '632006',
    consignorPhone: '9443333444',
    consignorGstin: '33AAAFV9876F1Z1',
    consigneeId: 'pty-2',
    consigneeName: 'Balaji Hardware & Tools',
    consigneeBusinessName: 'Balaji Hardware & Tools Mart',
    consigneeAddress: '112 Broadway Street, George Town, Chennai',
    consigneeCity: 'Chennai',
    consigneeState: 'Tamil Nadu',
    consigneePincode: '600001',
    consigneePhone: '9840222333',
    consigneeGstin: '33AAACB5678E1Z8',
    items: [
      {
        id: 'itm-1',
        serialNo: 1,
        description: 'Tanned Leather Rolls & Finished Belts',
        packageType: 'Carton Box',
        packages: 10,
        weight: 250,
        rate: 8.0,
        rateBasis: 'per_kg',
        amount: 2000
      }
    ],
    totalPackages: 10,
    totalWeight: 250,
    invoiceNumber: 'INV/26/0894',
    invoiceDate: '2026-10-14',
    invoiceValue: 85000,
    ewayBillNumber: '341098223451',
    paymentType: 'To Pay',
    freightAmount: 2000,
    loadingCharges: 150,
    unloadingCharges: 150,
    otherCharges: 50,
    hamaliCharges: 0,
    additionalCharges: 0,
    discount: 0,
    gstApplicable: false,
    gstRate: 0,
    gstAmount: 0,
    grandTotal: 2350,
    paidAmount: 2350,
    balanceDue: 0,
    paymentStatus: 'Paid',
    createdAt: '2026-10-15T09:30:00Z',
    updatedAt: '2026-10-16T11:00:00Z',
    notes: 'Sample seed matching Transport.pdf'
  },
  {
    id: 'lr-2',
    lrNumber: 'SMT-2026-0002',
    lrDate: '2026-10-16',
    vehicleNumber: 'TN 04 CD 1290',
    vehicleType: 'Tata 1109 Container',
    driverName: 'P. Shanmugam',
    driverPhone: '9789334455',
    fromCity: 'Ranipet',
    toCity: 'Bengaluru',
    bookingBranch: 'Ranipet Main Branch',
    deliveryBranch: 'Bengaluru Peenya Godown',
    bookingStaff: 'R. Vignesh',
    expectedDeliveryDate: '2026-10-17',
    status: 'In Transit',
    consignorId: 'pty-1',
    consignorName: 'Sri Krishna Textiles & Spares',
    consignorBusinessName: 'Sri Krishna Textiles & Spares Pvt Ltd',
    consignorAddress: 'Plot 45, SIPCOT Phase 2, Bhel Road',
    consignorCity: 'Ranipet',
    consignorState: 'Tamil Nadu',
    consignorPincode: '632403',
    consignorPhone: '9442111222',
    consignorGstin: '33AABCK1234D1Z2',
    consigneeId: 'pty-4',
    consigneeName: 'Apex Electricals & Pumps',
    consigneeBusinessName: 'Apex Electricals India Ltd',
    consigneeAddress: '88 Avinashi Road, Peelamedu, Coimbatore (Depot: Peenya Bengaluru)',
    consigneeCity: 'Bengaluru',
    consigneeState: 'Karnataka',
    consigneePincode: '560058',
    consigneePhone: '9488444555',
    consigneeGstin: '33AAACA4411C1ZX',
    items: [
      {
        id: 'itm-2-1',
        serialNo: 1,
        description: 'Cotton Fabric Bales & Yarn Spools',
        packageType: 'Bales',
        packages: 25,
        weight: 650,
        rate: 6.5,
        rateBasis: 'per_kg',
        amount: 4225
      },
      {
        id: 'itm-2-2',
        serialNo: 2,
        description: 'Spinning Machine Brass Bushings',
        packageType: 'Wooden Crates',
        packages: 5,
        weight: 120,
        rate: 150,
        rateBasis: 'per_pkg',
        amount: 750
      }
    ],
    totalPackages: 30,
    totalWeight: 770,
    invoiceNumber: 'SKT/OCT/112',
    invoiceDate: '2026-10-16',
    invoiceValue: 175000,
    ewayBillNumber: '551122334411',
    paymentType: 'To Pay',
    freightAmount: 4975,
    loadingCharges: 250,
    unloadingCharges: 250,
    otherCharges: 75,
    hamaliCharges: 50,
    additionalCharges: 0,
    discount: 0,
    gstApplicable: false,
    gstRate: 0,
    gstAmount: 0,
    grandTotal: 5600,
    paidAmount: 0,
    balanceDue: 5600,
    paymentStatus: 'Unpaid',
    createdAt: '2026-10-16T08:15:00Z',
    updatedAt: '2026-10-16T08:15:00Z',
    notes: 'Priority industrial consignment'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    lrId: 'lr-1',
    lrNumber: 'SMT-2026-0001',
    partyId: 'pty-2',
    partyName: 'Balaji Hardware & Tools',
    paymentDate: '2026-10-16',
    amount: 2350,
    paymentMethod: 'UPI',
    transactionRef: 'UPI/628911492019/GPay',
    remarks: 'Full settlement at Chennai delivery point',
    receivedBy: 'R. Vignesh',
    createdAt: '2026-10-16T11:05:00Z'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    expenseDate: '2026-10-15',
    category: 'Fuel',
    description: 'Diesel for TN 23 BX 4589 at Ranipet IOCL Bunk',
    amount: 3200,
    vehicleNumber: 'TN 23 BX 4589',
    route: 'Vellore - Chennai Direct',
    paymentMethod: 'UPI',
    referenceNumber: 'IOCL-B7721',
    remarks: '40 Litres filled',
    createdAt: '2026-10-15T08:00:00Z'
  },
  {
    id: 'exp-2',
    expenseDate: '2026-10-15',
    category: 'Toll',
    description: 'Fastag Toll Plaza Charges (Walajah & Sriperumbudur)',
    amount: 380,
    vehicleNumber: 'TN 23 BX 4589',
    route: 'Vellore - Chennai Direct',
    paymentMethod: 'Other',
    referenceNumber: 'FASTAG-9821',
    remarks: 'Automatic fastag deduction',
    createdAt: '2026-10-15T12:00:00Z'
  },
  {
    id: 'exp-3',
    expenseDate: '2026-10-16',
    category: 'Loading Labour',
    description: 'Hamali union loading charges for Bangalore container',
    amount: 450,
    vehicleNumber: 'TN 04 CD 1290',
    route: 'Ranipet - Bengaluru Heavy Corridor',
    paymentMethod: 'Cash',
    referenceNumber: 'VOUCHER-084',
    remarks: 'Paid to Sri Murugan loaders team',
    createdAt: '2026-10-16T09:10:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    action: 'LR Created',
    entityType: 'LR',
    entityId: 'lr-1',
    details: 'Created LR SMT-2026-0001 (Vellore to Chennai, To Pay ₹2,350)',
    performedBy: 'R. Vignesh',
    timestamp: '2026-10-15T09:30:00Z'
  },
  {
    id: 'aud-2',
    action: 'Payment Recorded',
    entityType: 'Payment',
    entityId: 'pay-1',
    details: 'Recorded ₹2,350 UPI payment for LR SMT-2026-0001 (Status -> Paid)',
    performedBy: 'R. Vignesh',
    timestamp: '2026-10-16T11:05:00Z'
  },
  {
    id: 'aud-3',
    action: 'LR Created',
    entityType: 'LR',
    entityId: 'lr-2',
    details: 'Created LR SMT-2026-0002 (Ranipet to Bengaluru, To Pay ₹5,600)',
    performedBy: 'R. Vignesh',
    timestamp: '2026-10-16T08:15:00Z'
  }
];

export const INITIAL_PACKAGE_TYPES: PackageType[] = [
  { id: 'pkg-1', name: 'Carton Box', code: 'CTN', description: 'Standard corrugated cardboard packaging box', active: true },
  { id: 'pkg-2', name: 'Bales', code: 'BAL', description: 'Textile / raw cotton compressed bale', active: true },
  { id: 'pkg-3', name: 'Gunny Bags', code: 'BAG', description: 'Jute / woven sack for agriculture or grain cargo', active: true },
  { id: 'pkg-4', name: 'Wooden Crates', code: 'CRT', description: 'Heavy machinery wooden case or crate', active: true },
  { id: 'pkg-5', name: 'Drums / Barrels', code: 'DRM', description: 'Liquid, chemical or oil barrel container', active: true },
  { id: 'pkg-6', name: 'Rolls / Coils', code: 'ROL', description: 'Paper, steel coils, rubber, or plastic rolls', active: true },
  { id: 'pkg-7', name: 'Bundles', code: 'BDL', description: 'Steel rods, pipes, or timber tied bundles', active: true },
  { id: 'pkg-8', name: 'Loose / Open', code: 'LSE', description: 'Unpacked bulk machinery, parts, or loose cargo', active: true },
  { id: 'pkg-9', name: 'Corrugated Boxes', code: 'CBX', description: 'Heavy duty fluted export cartons', active: true },
  { id: 'pkg-10', name: 'Pallets', code: 'PLT', description: 'Shrink-wrapped wooden or plastic pallet unit', active: true },
  { id: 'pkg-11', name: 'Carboys / Cans', code: 'CAN', description: 'Plastic jerrycans or carboys for liquid products', active: true },
  { id: 'pkg-12', name: 'Cylinders', code: 'CYL', description: 'Compressed industrial or medical gas cylinders', active: true },
  { id: 'pkg-13', name: 'HDPE Woven Sacks', code: 'HDP', description: 'Polymer woven bags for fertilizers / chemicals', active: true },
  { id: 'pkg-14', name: 'Wooden Boxes', code: 'WBX', description: 'Reinforced timber enclosure for sensitive items', active: true }
];

export interface AppDatabaseState {
  settings: CompanySettings;
  users: User[];
  cities: City[];
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: Route[];
  parties: Party[];
  lrs: LR[];
  payments: Payment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  packageTypes: PackageType[];
}

let appState: AppDatabaseState;

// Initialize SQLite & State
export async function initDatabase(): Promise<void> {
  try {
    SQL = await initSqlJs();
    let fileBuffer: Buffer | null = null;
    
    if (fs.existsSync(DB_FILE)) {
      fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    // Create relational schema in SQLite
    createSqliteSchema();

    // Check if JSON mirror or SQLite tables have data
    if (fs.existsSync(MIRROR_JSON)) {
      try {
        const raw = fs.readFileSync(MIRROR_JSON, 'utf-8');
        appState = JSON.parse(raw);
        if (!appState.packageTypes || !Array.isArray(appState.packageTypes) || appState.packageTypes.length === 0) {
          appState.packageTypes = [...INITIAL_PACKAGE_TYPES];
        }
      } catch {
        seedInitialState();
      }
    } else {
      seedInitialState();
    }

    persistDatabase();
    console.log('Database initialized successfully with SQLite & Disk persistence.');
  } catch (err) {
    console.error('Error initializing SQLite database:', err);
    seedInitialState();
    persistDatabase();
  }
}

function createSqliteSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS lrs (
      id TEXT PRIMARY KEY,
      lr_number TEXT UNIQUE NOT NULL,
      lr_date TEXT NOT NULL,
      vehicle_number TEXT NOT NULL,
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      status TEXT NOT NULL,
      consignor_name TEXT NOT NULL,
      consignee_name TEXT NOT NULL,
      grand_total REAL NOT NULL,
      paid_amount REAL NOT NULL,
      balance_due REAL NOT NULL,
      payment_type TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_name TEXT,
      phone TEXT,
      city TEXT,
      gstin TEXT,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      lr_id TEXT NOT NULL,
      lr_number TEXT NOT NULL,
      party_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      expense_date TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
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
}

function seedInitialState() {
  appState = {
    settings: { ...DEFAULT_SETTINGS },
    users: [...INITIAL_USERS],
    cities: [...INITIAL_CITIES],
    vehicles: [...INITIAL_VEHICLES],
    drivers: [...INITIAL_DRIVERS],
    routes: [...INITIAL_ROUTES],
    parties: [...INITIAL_PARTIES],
    lrs: [...INITIAL_LRS],
    payments: [...INITIAL_PAYMENTS],
    expenses: [...INITIAL_EXPENSES],
    auditLogs: [...INITIAL_AUDIT_LOGS],
    packageTypes: [...INITIAL_PACKAGE_TYPES]
  };
}

export function persistDatabase(): void {
  try {
    // 1. Write structured JSON mirror for lightning-fast querying & backup
    fs.writeFileSync(MIRROR_JSON, JSON.stringify(appState, null, 2), 'utf-8');

    // 2. Synchronize all 13 relational tables to embedded SQLite engine
    if (db) {
      syncAllTablesToSqlite(db, appState);

      // Export binary SQLite database to disk
      const binaryArray = db.export();
      const buffer = Buffer.from(binaryArray);
      fs.writeFileSync(DB_FILE, buffer);
    }

    // 3. Auto-generate standard MySQL 8.0 / MariaDB .sql database dump file on disk
    const mysqlCfg = getMySqlConfig();
    generateMySqlDumpFile(appState, mysqlCfg.database || 'sri_murugan_tms');

    // 4. If live MySQL Server Auto-Sync is enabled, push asynchronously
    if (mysqlCfg.autoSync) {
      syncPushToMySql(appState, mysqlCfg).catch(err => {
        console.warn('Auto-sync to MySQL Server skipped:', err.message);
      });
    }
  } catch (err) {
    console.error('Error persisting database:', err);
  }
}

export function getState(): AppDatabaseState {
  return appState;
}

export function setState(newState: AppDatabaseState): void {
  appState = newState;
  persistDatabase();
}

// Data access operations
export const DB = {
  getSettings(): CompanySettings {
    return appState.settings;
  },

  updateSettings(settings: Partial<CompanySettings>, user = 'Administrator'): CompanySettings {
    appState.settings = { ...appState.settings, ...settings };
    this.addAuditLog('Settings Updated', 'CompanySettings', 'settings', 'Updated company profile and LR settings', user);
    persistDatabase();
    return appState.settings;
  },

  getNextLRNumber(): string {
    const prefix = appState.settings.lrPrefix || 'SMT-2026-';
    const seq = appState.settings.nextLrNumber || 1001;
    const formatted = `${prefix}${String(seq).padStart(4, '0')}`;
    return formatted;
  },

  incrementLRNumber(): void {
    appState.settings.nextLrNumber = (appState.settings.nextLrNumber || 1001) + 1;
    persistDatabase();
  },

  getLRs(): LR[] {
    return [...appState.lrs].sort((a, b) => b.lrDate.localeCompare(a.lrDate));
  },

  getLRById(id: string): LR | undefined {
    return appState.lrs.find(l => l.id === id || l.lrNumber === id);
  },

  saveLR(lrData: Omit<LR, 'id' | 'createdAt' | 'updatedAt' | 'paidAmount' | 'balanceDue' | 'paymentStatus'> & { id?: string }, user = 'Staff'): LR {
    const existingIndex = lrData.id ? appState.lrs.findIndex(l => l.id === lrData.id) : -1;
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Edit existing LR
      const existing = appState.lrs[existingIndex];
      // Recalculate balance with existing payments
      const grandTotal = Number(lrData.grandTotal) || 0;
      const paidAmount = existing.paidAmount || 0;
      const balanceDue = Math.max(0, grandTotal - paidAmount);
      let paymentStatus: LR['paymentStatus'] = 'Unpaid';
      if (paidAmount >= grandTotal && grandTotal > 0) {
        paymentStatus = 'Paid';
      } else if (paidAmount > 0) {
        paymentStatus = 'Partially Paid';
      }

      const isFinalizingDraft = existing.status === 'Draft' && lrData.status !== 'Draft';

      const updatedLR: LR = {
        ...existing,
        ...lrData,
        id: existing.id,
        paidAmount,
        balanceDue,
        paymentStatus,
        updatedAt: now
      };

      appState.lrs[existingIndex] = updatedLR;
      this.syncPartyRecordsFromLR(updatedLR);

      if (isFinalizingDraft) {
        if (lrData.paymentType === 'Paid' && grandTotal > 0 && paidAmount === 0) {
          const payId = 'pay-' + Date.now();
          const payment: Payment = {
            id: payId,
            lrId: updatedLR.id,
            lrNumber: updatedLR.lrNumber,
            partyId: updatedLR.consignorId,
            partyName: updatedLR.consignorName,
            paymentDate: updatedLR.lrDate,
            amount: grandTotal,
            paymentMethod: 'Cash',
            remarks: 'Paid upon booking from Draft',
            receivedBy: user,
            createdAt: now
          };
          appState.payments.unshift(payment);
          updatedLR.paidAmount = grandTotal;
          updatedLR.balanceDue = 0;
          updatedLR.paymentStatus = 'Paid';
        }
        this.addAuditLog('LR Finalized', 'LR', updatedLR.id, `Converted Draft to ${updatedLR.status} LR ${updatedLR.lrNumber}`, user);
      } else if (updatedLR.status === 'Draft') {
        this.addAuditLog('LR Draft Updated', 'LR', updatedLR.id, `Updated LR Draft ${updatedLR.lrNumber}`, user);
      } else {
        this.addAuditLog('LR Updated', 'LR', updatedLR.id, `Updated LR ${updatedLR.lrNumber} (${updatedLR.fromCity} to ${updatedLR.toCity})`, user);
      }
      persistDatabase();
      return updatedLR;
    } else {
      // Create new LR
      const id = 'lr-' + Date.now();
      const isDraft = lrData.status === 'Draft';
      const lrNumber = lrData.lrNumber || (isDraft ? `DRAFT-${Date.now().toString().slice(-4)}` : this.getNextLRNumber());
      const grandTotal = Number(lrData.grandTotal) || 0;
      let paidAmount = 0;
      let paymentStatus: LR['paymentStatus'] = 'Unpaid';

      if (!isDraft && lrData.paymentType === 'Paid') {
        paidAmount = grandTotal;
        paymentStatus = 'Paid';
      }

      const balanceDue = Math.max(0, grandTotal - paidAmount);

      const newLR: LR = {
        ...lrData,
        id,
        lrNumber,
        paidAmount,
        balanceDue,
        paymentStatus,
        createdAt: now,
        updatedAt: now
      };

      appState.lrs.unshift(newLR);
      if (!isDraft) {
        this.incrementLRNumber();
      }
      this.syncPartyRecordsFromLR(newLR);

      // If Paid upfront and not a draft, automatically record the payment record
      if (!isDraft && lrData.paymentType === 'Paid' && grandTotal > 0) {
        const payId = 'pay-' + Date.now();
        const payment: Payment = {
          id: payId,
          lrId: newLR.id,
          lrNumber: newLR.lrNumber,
          partyId: newLR.consignorId,
          partyName: newLR.consignorName,
          paymentDate: newLR.lrDate,
          amount: grandTotal,
          paymentMethod: 'Cash',
          remarks: 'Paid at the time of booking',
          receivedBy: user,
          createdAt: now
        };
        appState.payments.unshift(payment);
      }

      if (isDraft) {
        this.addAuditLog('LR Draft Saved', 'LR', newLR.id, `Saved LR Draft ${newLR.lrNumber} (${newLR.fromCity || 'Origin'} to ${newLR.toCity || 'Destination'})`, user);
      } else {
        this.addAuditLog('LR Created', 'LR', newLR.id, `Created LR ${newLR.lrNumber} (${newLR.fromCity} to ${newLR.toCity}, ₹${newLR.grandTotal})`, user);
      }
      persistDatabase();
      return newLR;
    }
  },

  cancelLR(id: string, reason: string, user = 'Staff'): LR {
    const lr = appState.lrs.find(l => l.id === id);
    if (!lr) throw new Error('LR not found');
    lr.status = 'Cancelled';
    lr.cancelReason = reason;
    lr.updatedAt = new Date().toISOString();
    this.addAuditLog('LR Cancelled', 'LR', lr.id, `Cancelled LR ${lr.lrNumber}. Reason: ${reason}`, user);
    persistDatabase();
    return lr;
  },

  updateLRStatus(
    id: string,
    status: LR['status'],
    details?: {
      deliveryDate?: string;
      receivedBy?: string;
      deliveryReceivedBy?: string;
      podReference?: string;
      remarks?: string;
      deliveryRemarks?: string;
      ackPhotoUrl?: string;
      ackPhotoFileName?: string;
    },
    user = 'Staff'
  ): LR {
    const lr = appState.lrs.find(l => l.id === id);
    if (!lr) throw new Error('LR not found');
    const now = new Date().toISOString();
    lr.status = status;
    lr.updatedAt = now;
    if (status === 'Delivered' && details) {
      lr.deliveryDate = details.deliveryDate || lr.deliveryDate || now.split('T')[0];
      if (details.receivedBy !== undefined || details.deliveryReceivedBy !== undefined) {
        lr.deliveryReceivedBy = details.receivedBy ?? details.deliveryReceivedBy;
      }
      if (details.podReference !== undefined) {
        lr.podReference = details.podReference;
      }
      if (details.remarks !== undefined || details.deliveryRemarks !== undefined) {
        lr.deliveryRemarks = details.remarks ?? details.deliveryRemarks;
      }
      if (details.ackPhotoUrl !== undefined) {
        lr.ackPhotoUrl = details.ackPhotoUrl;
        lr.ackPhotoFileName = details.ackPhotoFileName || (details.ackPhotoUrl ? `ACK_${lr.lrNumber}.jpg` : undefined);
        lr.ackPhotoUploadedAt = details.ackPhotoUrl ? now : undefined;
      }
    }
    const ackNote = lr.ackPhotoUrl ? ' (LR Ack Photo Copy attached)' : '';
    this.addAuditLog('Status Updated', 'LR', lr.id, `Updated LR ${lr.lrNumber} status to ${status}${ackNote}`, user);
    persistDatabase();
    return lr;
  },

  syncPartyRecordsFromLR(lr: LR): void {
    // Ensure Consignor exists or update
    if (lr.consignorName && lr.consignorName.trim()) {
      const existing = appState.parties.find(p => p.name.trim().toLowerCase() === lr.consignorName.trim().toLowerCase());
      if (!existing) {
        appState.parties.push({
          id: 'pty-' + Date.now() + '-1',
          name: lr.consignorName.trim(),
          businessName: lr.consignorBusinessName || lr.consignorName.trim(),
          address: lr.consignorAddress || '',
          city: lr.consignorCity || lr.fromCity,
          state: lr.consignorState || 'Tamil Nadu',
          pincode: lr.consignorPincode || '',
          phone: lr.consignorPhone || '',
          gstin: lr.consignorGstin || '',
          openingBalance: 0,
          customerType: 'Consignor',
          active: true,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Ensure Consignee exists or update
    if (lr.consigneeName && lr.consigneeName.trim()) {
      const existing = appState.parties.find(p => p.name.trim().toLowerCase() === lr.consigneeName.trim().toLowerCase());
      if (!existing) {
        appState.parties.push({
          id: 'pty-' + (Date.now() + 1) + '-2',
          name: lr.consigneeName.trim(),
          businessName: lr.consigneeBusinessName || lr.consigneeName.trim(),
          address: lr.consigneeAddress || '',
          city: lr.consigneeCity || lr.toCity,
          state: lr.consigneeState || 'Tamil Nadu',
          pincode: lr.consigneePincode || '',
          phone: lr.consigneePhone || '',
          gstin: lr.consigneeGstin || '',
          openingBalance: 0,
          customerType: 'Consignee',
          active: true,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Ensure City records exist
    if (lr.fromCity && !appState.cities.some(c => c.name.toLowerCase() === lr.fromCity.toLowerCase())) {
      appState.cities.push({ id: 'cty-' + Date.now(), name: lr.fromCity, state: lr.consignorState || 'Tamil Nadu', active: true });
    }
    if (lr.toCity && !appState.cities.some(c => c.name.toLowerCase() === lr.toCity.toLowerCase())) {
      appState.cities.push({ id: 'cty-' + (Date.now() + 1), name: lr.toCity, state: lr.consigneeState || 'Tamil Nadu', active: true });
    }

    // Ensure Vehicle record exists
    if (lr.vehicleNumber && !appState.vehicles.some(v => v.vehicleNumber.toLowerCase() === lr.vehicleNumber.toLowerCase())) {
      appState.vehicles.push({
        id: 'veh-' + Date.now(),
        vehicleNumber: lr.vehicleNumber.toUpperCase(),
        vehicleType: lr.vehicleType || 'Truck',
        capacity: 'Standard',
        ownerName: 'Attached Vehicle',
        ownerPhone: '',
        active: true,
        createdAt: new Date().toISOString()
      });
    }
  },

  // Parties
  getParties(): Party[] {
    return appState.parties;
  },

  saveParty(party: Partial<Party> & { name: string }, user = 'Staff'): Party {
    const now = new Date().toISOString();
    if (party.id) {
      const idx = appState.parties.findIndex(p => p.id === party.id);
      if (idx >= 0) {
        appState.parties[idx] = { ...appState.parties[idx], ...party } as Party;
        this.addAuditLog('Party Updated', 'Party', party.id, `Updated party ${party.name}`, user);
        persistDatabase();
        return appState.parties[idx];
      }
    }
    const newParty: Party = {
      id: 'pty-' + Date.now(),
      name: party.name,
      businessName: party.businessName || party.name,
      address: party.address || '',
      city: party.city || '',
      state: party.state || 'Tamil Nadu',
      pincode: party.pincode || '',
      phone: party.phone || '',
      email: party.email || '',
      gstin: party.gstin || '',
      openingBalance: Number(party.openingBalance) || 0,
      customerType: party.customerType || 'Both',
      active: party.active !== false,
      createdAt: now
    };
    appState.parties.unshift(newParty);
    this.addAuditLog('Party Created', 'Party', newParty.id, `Added party ${newParty.name}`, user);
    persistDatabase();
    return newParty;
  },

  deleteParty(id: string, user = 'Admin'): void {
    const p = appState.parties.find(x => x.id === id);
    appState.parties = appState.parties.filter(x => x.id !== id);
    this.addAuditLog('Party Deleted', 'Party', id, `Removed party ${p?.name || id}`, user);
    persistDatabase();
  },

  // Vehicles
  getVehicles(): Vehicle[] {
    return appState.vehicles;
  },

  saveVehicle(veh: Partial<Vehicle> & { vehicleNumber: string }, user = 'Staff'): Vehicle {
    const now = new Date().toISOString();
    if (veh.id) {
      const idx = appState.vehicles.findIndex(v => v.id === veh.id);
      if (idx >= 0) {
        appState.vehicles[idx] = { ...appState.vehicles[idx], ...veh } as Vehicle;
        this.addAuditLog('Vehicle Updated', 'Vehicle', veh.id, `Updated vehicle ${veh.vehicleNumber}`, user);
        persistDatabase();
        return appState.vehicles[idx];
      }
    }
    const newVeh: Vehicle = {
      id: 'veh-' + Date.now(),
      vehicleNumber: veh.vehicleNumber.toUpperCase(),
      vehicleType: veh.vehicleType || 'Truck',
      capacity: veh.capacity || '10 Ton',
      ownerName: veh.ownerName || 'Self',
      ownerPhone: veh.ownerPhone || '',
      insuranceExpiry: veh.insuranceExpiry || '',
      fitnessExpiry: veh.fitnessExpiry || '',
      active: veh.active !== false,
      createdAt: now
    };
    appState.vehicles.unshift(newVeh);
    this.addAuditLog('Vehicle Added', 'Vehicle', newVeh.id, `Added vehicle ${newVeh.vehicleNumber}`, user);
    persistDatabase();
    return newVeh;
  },

  deleteVehicle(id: string, user = 'Admin'): void {
    appState.vehicles = appState.vehicles.filter(v => v.id !== id);
    this.addAuditLog('Vehicle Deleted', 'Vehicle', id, 'Deleted vehicle', user);
    persistDatabase();
  },

  // Drivers
  getDrivers(): Driver[] {
    return appState.drivers;
  },

  saveDriver(drv: Partial<Driver> & { name: string; phone: string }, user = 'Staff'): Driver {
    const now = new Date().toISOString();
    if (drv.id) {
      const idx = appState.drivers.findIndex(d => d.id === drv.id);
      if (idx >= 0) {
        appState.drivers[idx] = { ...appState.drivers[idx], ...drv } as Driver;
        this.addAuditLog('Driver Updated', 'Driver', drv.id, `Updated driver ${drv.name}`, user);
        persistDatabase();
        return appState.drivers[idx];
      }
    }
    const newDrv: Driver = {
      id: 'drv-' + Date.now(),
      name: drv.name,
      phone: drv.phone,
      licenseNumber: drv.licenseNumber || '',
      licenseExpiry: drv.licenseExpiry || '',
      address: drv.address || '',
      assignedVehicle: drv.assignedVehicle || '',
      active: drv.active !== false,
      createdAt: now
    };
    appState.drivers.unshift(newDrv);
    this.addAuditLog('Driver Added', 'Driver', newDrv.id, `Added driver ${newDrv.name}`, user);
    persistDatabase();
    return newDrv;
  },

  deleteDriver(id: string, user = 'Admin'): void {
    appState.drivers = appState.drivers.filter(d => d.id !== id);
    this.addAuditLog('Driver Deleted', 'Driver', id, 'Deleted driver', user);
    persistDatabase();
  },

  // Cities & Routes
  getCities(): City[] {
    return appState.cities;
  },

  saveCity(city: { name: string; state?: string; pincode?: string; active?: boolean }, user = 'Staff'): City {
    const existing = appState.cities.find(c => c.name.toLowerCase() === city.name.trim().toLowerCase());
    if (existing) {
      existing.state = city.state || existing.state;
      existing.pincode = city.pincode || existing.pincode;
      persistDatabase();
      return existing;
    }
    const newCity: City = {
      id: 'cty-' + Date.now(),
      name: city.name.trim(),
      state: city.state || 'Tamil Nadu',
      pincode: city.pincode || '',
      active: city.active !== false
    };
    appState.cities.push(newCity);
    this.addAuditLog('City Added', 'City', newCity.id, `Added city ${newCity.name}`, user);
    persistDatabase();
    return newCity;
  },

  getRoutes(): Route[] {
    return appState.routes;
  },

  saveRoute(route: Partial<Route> & { fromCity: string; toCity: string }, user = 'Staff'): Route {
    if (route.id) {
      const idx = appState.routes.findIndex(r => r.id === route.id);
      if (idx >= 0) {
        appState.routes[idx] = { ...appState.routes[idx], ...route } as Route;
        persistDatabase();
        return appState.routes[idx];
      }
    }
    const newRoute: Route = {
      id: 'rt-' + Date.now(),
      name: route.name || `${route.fromCity} - ${route.toCity}`,
      fromCity: route.fromCity,
      toCity: route.toCity,
      standardFreightRate: Number(route.standardFreightRate) || 0,
      transitTime: route.transitTime || '',
      active: route.active !== false
    };
    appState.routes.unshift(newRoute);
    this.addAuditLog('Route Added', 'Route', newRoute.id, `Added route ${newRoute.name}`, user);
    persistDatabase();
    return newRoute;
  },

  // Package Types Master
  getPackageTypes(): PackageType[] {
    if (!appState.packageTypes || !Array.isArray(appState.packageTypes)) {
      appState.packageTypes = [...INITIAL_PACKAGE_TYPES];
    }
    return appState.packageTypes;
  },

  savePackageType(pkg: Partial<PackageType> & { name: string }, user = 'Staff'): PackageType {
    if (!appState.packageTypes || !Array.isArray(appState.packageTypes)) {
      appState.packageTypes = [...INITIAL_PACKAGE_TYPES];
    }
    const now = new Date().toISOString();
    if (pkg.id) {
      const idx = appState.packageTypes.findIndex(p => p.id === pkg.id);
      if (idx >= 0) {
        appState.packageTypes[idx] = { 
          ...appState.packageTypes[idx], 
          ...pkg,
          name: pkg.name.trim(),
          code: pkg.code?.trim().toUpperCase() || appState.packageTypes[idx].code || '',
          description: pkg.description !== undefined ? pkg.description.trim() : appState.packageTypes[idx].description
        } as PackageType;
        this.addAuditLog('Package Type Updated', 'PackageType', pkg.id, `Updated package type ${pkg.name}`, user);
        persistDatabase();
        return appState.packageTypes[idx];
      }
    }
    const newPkg: PackageType = {
      id: 'pkg-' + Date.now(),
      name: pkg.name.trim(),
      code: pkg.code?.trim().toUpperCase() || '',
      description: pkg.description?.trim() || '',
      active: pkg.active !== false,
      createdAt: now
    };
    appState.packageTypes.unshift(newPkg);
    this.addAuditLog('Package Type Added', 'PackageType', newPkg.id, `Added package type ${newPkg.name}`, user);
    persistDatabase();
    return newPkg;
  },

  deletePackageType(id: string, user = 'Admin'): void {
    if (!appState.packageTypes) return;
    const target = appState.packageTypes.find(p => p.id === id);
    appState.packageTypes = appState.packageTypes.filter(p => p.id !== id);
    this.addAuditLog('Package Type Deleted', 'PackageType', id, `Removed package type ${target?.name || id}`, user);
    persistDatabase();
  },

  // Payments
  getPayments(): Payment[] {
    return appState.payments;
  },

  recordPayment(payData: Omit<Payment, 'id' | 'createdAt'>, user = 'Staff'): Payment {
    const now = new Date().toISOString();
    const id = 'pay-' + Date.now();
    const amount = Number(payData.amount) || 0;

    const payment: Payment = {
      ...payData,
      id,
      amount,
      createdAt: now
    };

    appState.payments.unshift(payment);

    // Update associated LR balance & status
    const lr = appState.lrs.find(l => l.id === payData.lrId || l.lrNumber === payData.lrNumber);
    if (lr) {
      // Recalculate total paid on this LR from all payments
      const totalPaid = appState.payments
        .filter(p => p.lrId === lr.id || p.lrNumber === lr.lrNumber)
        .reduce((sum, p) => sum + p.amount, 0);

      lr.paidAmount = totalPaid;
      lr.balanceDue = Math.max(0, lr.grandTotal - totalPaid);
      if (lr.balanceDue <= 0 && lr.grandTotal > 0) {
        lr.paymentStatus = 'Paid';
      } else if (lr.paidAmount > 0) {
        lr.paymentStatus = 'Partially Paid';
      } else {
        lr.paymentStatus = 'Unpaid';
      }
      lr.updatedAt = now;
    }

    this.addAuditLog('Payment Recorded', 'Payment', payment.id, `Received ₹${amount} for LR ${payment.lrNumber} via ${payment.paymentMethod}`, user);
    persistDatabase();
    return payment;
  },

  deletePayment(id: string, user = 'Admin'): void {
    const payment = appState.payments.find(p => p.id === id);
    if (!payment) return;
    const lrNumber = payment.lrNumber;
    appState.payments = appState.payments.filter(p => p.id !== id);

    // Recalculate LR
    const lr = appState.lrs.find(l => l.lrNumber === lrNumber);
    if (lr) {
      const totalPaid = appState.payments
        .filter(p => p.lrId === lr.id || p.lrNumber === lr.lrNumber)
        .reduce((sum, p) => sum + p.amount, 0);
      lr.paidAmount = totalPaid;
      lr.balanceDue = Math.max(0, lr.grandTotal - totalPaid);
      if (lr.balanceDue <= 0 && lr.grandTotal > 0) {
        lr.paymentStatus = 'Paid';
      } else if (lr.paidAmount > 0) {
        lr.paymentStatus = 'Partially Paid';
      } else {
        lr.paymentStatus = 'Unpaid';
      }
      lr.updatedAt = new Date().toISOString();
    }

    this.addAuditLog('Payment Deleted', 'Payment', id, `Deleted payment of ₹${payment.amount} for LR ${payment.lrNumber}`, user);
    persistDatabase();
  },

  // Customer Ledger
  getPartyLedger(partyNameOrId: string, startDate?: string, endDate?: string) {
    const party = appState.parties.find(p => p.id === partyNameOrId || p.name.toLowerCase() === partyNameOrId.toLowerCase());
    const partyName = party ? party.name : partyNameOrId;
    const openingBal = party ? party.openingBalance || 0 : 0;

    // Collect all transactions: Debits (LRs booked for this party) & Credits (Payments)
    const transactions: Array<{
      id: string;
      date: string;
      lrNumber?: string;
      description: string;
      debit: number;
      credit: number;
      reference?: string;
    }> = [];

    // Find LRs where party is consignor or consignee
    for (const lr of appState.lrs) {
      if (lr.status === 'Cancelled') continue;
      const isConsignor = lr.consignorName.toLowerCase() === partyName.toLowerCase();
      const isConsignee = lr.consigneeName.toLowerCase() === partyName.toLowerCase();

      // For 'To Pay' LRs, charge consignee; for 'Paid' / 'To Be Billed', charge consignor
      const isDebitedParty = (lr.paymentType === 'To Pay' && isConsignee) ||
                             (lr.paymentType !== 'To Pay' && isConsignor) ||
                             (isConsignor && !isConsignee);

      if (isDebitedParty) {
        transactions.push({
          id: 'deb-' + lr.id,
          date: lr.lrDate,
          lrNumber: lr.lrNumber,
          description: `LR Booking: ${lr.fromCity} -> ${lr.toCity} (${lr.totalPackages} pkgs, ${lr.totalWeight} kg)`,
          debit: lr.grandTotal,
          credit: 0,
          reference: lr.invoiceNumber || lr.lrNumber
        });
      }
    }

    // Find Payments
    for (const p of appState.payments) {
      if (p.partyName.toLowerCase() === partyName.toLowerCase() || (party && p.partyId === party.id)) {
        transactions.push({
          id: 'crd-' + p.id,
          date: p.paymentDate,
          lrNumber: p.lrNumber,
          description: `Payment Received (${p.paymentMethod}) ${p.remarks ? '- ' + p.remarks : ''}`,
          debit: 0,
          credit: p.amount,
          reference: p.transactionRef || 'Receipt'
        });
      }
    }

    // Sort chronologically
    transactions.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balances
    let running = openingBal;
    const ledger = transactions.map(t => {
      running = running + t.debit - t.credit;
      return {
        ...t,
        balance: running
      };
    });

    // Filter by dates if requested
    const filtered = ledger.filter(row => {
      if (startDate && row.date < startDate) return false;
      if (endDate && row.date > endDate) return false;
      return true;
    });

    const totalDebit = filtered.reduce((s, r) => s + r.debit, 0);
    const totalCredit = filtered.reduce((s, r) => s + r.credit, 0);
    const currentBalance = running;

    return {
      party: party || { name: partyName, openingBalance: openingBal },
      openingBalance: openingBal,
      totalDebit,
      totalCredit,
      currentBalance,
      transactions: filtered
    };
  },

  // Expenses
  getExpenses(): Expense[] {
    return [...appState.expenses].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  },

  saveExpense(exp: Partial<Expense> & { category: Expense['category']; amount: number; description: string; expenseDate: string }, user = 'Staff'): Expense {
    const now = new Date().toISOString();
    if (exp.id) {
      const idx = appState.expenses.findIndex(e => e.id === exp.id);
      if (idx >= 0) {
        appState.expenses[idx] = { ...appState.expenses[idx], ...exp } as Expense;
        this.addAuditLog('Expense Updated', 'Expense', exp.id, `Updated expense: ₹${exp.amount} (${exp.category})`, user);
        persistDatabase();
        return appState.expenses[idx];
      }
    }
    const newExp: Expense = {
      id: 'exp-' + Date.now(),
      expenseDate: exp.expenseDate,
      category: exp.category,
      description: exp.description,
      amount: Number(exp.amount) || 0,
      vehicleNumber: exp.vehicleNumber || '',
      route: exp.route || '',
      paymentMethod: exp.paymentMethod || 'Cash',
      referenceNumber: exp.referenceNumber || '',
      remarks: exp.remarks || '',
      createdAt: now
    };
    appState.expenses.unshift(newExp);
    this.addAuditLog('Expense Added', 'Expense', newExp.id, `Added expense: ₹${newExp.amount} (${newExp.category})`, user);
    persistDatabase();
    return newExp;
  },

  deleteExpense(id: string, user = 'Admin'): void {
    const exp = appState.expenses.find(e => e.id === id);
    appState.expenses = appState.expenses.filter(e => e.id !== id);
    this.addAuditLog('Expense Deleted', 'Expense', id, `Deleted expense ₹${exp?.amount}`, user);
    persistDatabase();
  },

  // Users
  getUsers(): User[] {
    return appState.users;
  },

  saveUser(userObj: Partial<User> & { username: string; name: string; role: User['role'] }, performer = 'Admin'): User {
    if (userObj.id) {
      const idx = appState.users.findIndex(u => u.id === userObj.id);
      if (idx >= 0) {
        appState.users[idx] = { ...appState.users[idx], ...userObj } as User;
        persistDatabase();
        return appState.users[idx];
      }
    }
    const newUser: User = {
      id: 'usr-' + Date.now(),
      username: userObj.username,
      name: userObj.name,
      role: userObj.role,
      phone: userObj.phone || '',
      email: userObj.email || '',
      active: userObj.active !== false
    };
    appState.users.push(newUser);
    this.addAuditLog('User Created', 'User', newUser.id, `Added user ${newUser.name} (${newUser.role})`, performer);
    persistDatabase();
    return newUser;
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return [...appState.auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  addAuditLog(action: string, entityType: string, entityId: string, details: string, performedBy: string): void {
    const log: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      action,
      entityType,
      entityId,
      details,
      performedBy: performedBy || 'System',
      timestamp: new Date().toISOString()
    };
    appState.auditLogs.unshift(log);
    // keep latest 500 logs
    if (appState.auditLogs.length > 500) {
      appState.auditLogs = appState.auditLogs.slice(0, 500);
    }
  },

  // Reset to initial demo data
  resetDemoData(user = 'Admin'): void {
    seedInitialState();
    this.addAuditLog('Demo Data Reset', 'System', 'system', 'Reset all records to standard Sri Murugan Transport demo dataset', user);
    persistDatabase();
  },

  // Backup & Restore
  exportBackup(): AppDatabaseState {
    return appState;
  },

  importBackup(data: AppDatabaseState, user = 'Admin'): void {
    if (!data || !Array.isArray(data.lrs)) {
      throw new Error('Invalid backup file format');
    }
    if (!data.packageTypes || !Array.isArray(data.packageTypes) || data.packageTypes.length === 0) {
      data.packageTypes = [...INITIAL_PACKAGE_TYPES];
    }
    appState = data;
    this.addAuditLog('Backup Restored', 'System', 'system', 'Restored complete database from backup archive', user);
    persistDatabase();
  },

  // --- SQL & MySQL Server Management ---
  getSqliteFilePath(): string {
    if (db) {
      syncAllTablesToSqlite(db, appState);
      const binaryArray = db.export();
      fs.writeFileSync(DB_FILE, Buffer.from(binaryArray));
    }
    return DB_FILE;
  },

  exportSqliteBuffer(): Buffer {
    if (!db && SQL) {
      db = new SQL.Database();
    }
    if (db) {
      syncAllTablesToSqlite(db, appState);
      const binaryArray = db.export();
      const buffer = Buffer.from(binaryArray);
      fs.writeFileSync(DB_FILE, buffer);
      return buffer;
    }
    if (fs.existsSync(DB_FILE)) {
      return fs.readFileSync(DB_FILE);
    }
    throw new Error('SQLite database engine is not initialized');
  },

  importSqliteBuffer(
    base64Data: string,
    user = 'Admin',
    mode: 'merge' | 'replace' = 'merge'
  ): {
    mode: 'merge' | 'replace';
    tablesRestored: number;
    recordsRestored: number;
    recordsAdded: number;
    recordsUpdated: number;
    summaryByTable: Record<string, { added: number; updated: number }>;
    state: AppDatabaseState;
  } {
    if (!SQL) {
      throw new Error('SQLite engine is not ready');
    }
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Verify SQLite3 header magic bytes ("SQLite format 3")
    const headerStr = buffer.subarray(0, 15).toString('utf-8');
    if (!headerStr.startsWith('SQLite format 3')) {
      throw new Error('Invalid file: Not a valid SQLite 3 database binary (.sqlite / .db)');
    }

    const importedDb = new SQL.Database(buffer);

    // Helper to read all rows from a table as key-value objects
    const readRawRows = (tableName: string): Record<string, any>[] => {
      try {
        const res = importedDb.exec(`SELECT * FROM ${tableName}`);
        if (res && res[0] && Array.isArray(res[0].values)) {
          const cols = res[0].columns;
          return res[0].values.map((vals: any[]) => {
            const obj: Record<string, any> = {};
            cols.forEach((col, i) => {
              obj[col] = vals[i];
            });
            return obj;
          });
        }
      } catch {}
      return [];
    };

    // Parse data_json if present, and overlay any edited relational columns
    const parseTableObjects = <T>(
      tableName: string,
      mapRelational: (row: Record<string, any>, base?: Partial<T>) => T
    ): T[] => {
      const rawRows = readRawRows(tableName);
      const list: T[] = [];
      for (const row of rawRows) {
        let baseObj: Partial<T> = {};
        if (row.data_json && typeof row.data_json === 'string') {
          try {
            baseObj = JSON.parse(row.data_json);
          } catch {}
        }
        list.push(mapRelational(row, baseObj));
      }
      return list;
    };

    // Read lr_items grouped by lr_id so relational LR rows also get their items
    const rawLrItems = readRawRows('lr_items');
    const itemsByLrId: Record<string, LRItem[]> = {};
    for (const r of rawLrItems) {
      const lrId = String(r.lr_id || '');
      if (!lrId) continue;
      if (!itemsByLrId[lrId]) itemsByLrId[lrId] = [];
      itemsByLrId[lrId].push({
        id: String(r.id || `itm-${Date.now()}`),
        serialNo: Number(r.serial_no) || itemsByLrId[lrId].length + 1,
        description: String(r.description || ''),
        packageType: String(r.package_type || 'Carton Box'),
        packages: Number(r.packages) || 0,
        weight: Number(r.weight) || 0,
        rate: Number(r.rate) || 0,
        rateBasis: (r.rate_basis as any) || 'per_pkg',
        amount: Number(r.amount) || 0
      });
    }

    const importedSettings = parseTableObjects<CompanySettings>('company_settings', (r, base) => ({
      ...DEFAULT_SETTINGS,
      ...base,
      companyName: r.company_name ? String(r.company_name) : (base?.companyName || DEFAULT_SETTINGS.companyName),
      tagline: r.tagline !== undefined ? String(r.tagline) : base?.tagline,
      address: r.address ? String(r.address) : (base?.address || DEFAULT_SETTINGS.address),
      phone: r.phone ? String(r.phone) : (base?.phone || DEFAULT_SETTINGS.phone),
      email: r.email ? String(r.email) : (base?.email || DEFAULT_SETTINGS.email),
      gstin: r.gstin ? String(r.gstin) : (base?.gstin || DEFAULT_SETTINGS.gstin),
      lrPrefix: r.lr_prefix ? String(r.lr_prefix) : (base?.lrPrefix || DEFAULT_SETTINGS.lrPrefix),
      nextLrNumber: Number(r.next_lr_number) || base?.nextLrNumber || DEFAULT_SETTINGS.nextLrNumber
    }));

    const importedUsers = parseTableObjects<User>('users', (r, base) => ({
      id: String(r.id || base?.id || `usr-${Date.now()}`),
      username: String(r.username || base?.username || 'staff'),
      name: String(r.name || base?.name || 'User'),
      role: (r.role || base?.role || 'Booking Staff') as User['role'],
      phone: String(r.phone ?? base?.phone ?? ''),
      email: String(r.email ?? base?.email ?? ''),
      active: r.active !== undefined ? Boolean(Number(r.active)) : (base?.active ?? true)
    }));

    const importedCities = parseTableObjects<City>('cities', (r, base) => ({
      id: String(r.id || base?.id || `cty-${Date.now()}`),
      name: String(r.name || base?.name || ''),
      state: String(r.state || base?.state || 'Tamil Nadu'),
      pincode: String(r.pincode ?? base?.pincode ?? ''),
      active: r.active !== undefined ? Boolean(Number(r.active)) : (base?.active ?? true)
    }));

    const importedVehicles = parseTableObjects<Vehicle>('vehicles', (r, base) => ({
      id: String(r.id || base?.id || `veh-${Date.now()}`),
      vehicleNumber: String(r.vehicle_number || base?.vehicleNumber || ''),
      vehicleType: String(r.vehicle_type || base?.vehicleType || 'Lorry'),
      capacity: String(r.capacity ?? base?.capacity ?? ''),
      ownerName: String(r.owner_name ?? base?.ownerName ?? ''),
      ownerPhone: String(r.owner_phone ?? base?.ownerPhone ?? ''),
      insuranceExpiry: String(r.insurance_expiry ?? base?.insuranceExpiry ?? ''),
      fitnessExpiry: String(r.fitness_expiry ?? base?.fitnessExpiry ?? ''),
      active: r.active !== undefined ? Boolean(Number(r.active)) : (base?.active ?? true),
      createdAt: base?.createdAt || new Date().toISOString().split('T')[0]
    }));

    const importedDrivers = parseTableObjects<Driver>('drivers', (r, base) => ({
      id: String(r.id || base?.id || `drv-${Date.now()}`),
      name: String(r.name || base?.name || ''),
      phone: String(r.phone || base?.phone || ''),
      licenseNumber: String(r.license_number ?? base?.licenseNumber ?? ''),
      licenseExpiry: String(r.license_expiry ?? base?.licenseExpiry ?? ''),
      address: base?.address || '',
      assignedVehicle: String(r.assigned_vehicle ?? base?.assignedVehicle ?? ''),
      active: r.active !== undefined ? Boolean(Number(r.active)) : (base?.active ?? true),
      createdAt: base?.createdAt || new Date().toISOString().split('T')[0]
    }));

    const importedRoutes = parseTableObjects<Route>('routes', (r, base) => ({
      id: String(r.id || base?.id || `rt-${Date.now()}`),
      name: String(r.name || base?.name || ''),
      fromCity: String(r.from_city || base?.fromCity || ''),
      toCity: String(r.to_city || base?.toCity || ''),
      standardFreightRate: Number(r.standard_freight_rate ?? base?.standardFreightRate ?? 0),
      transitTime: String(r.transit_time ?? base?.transitTime ?? ''),
      active: r.active !== undefined ? Boolean(Number(r.active)) : (base?.active ?? true)
    }));

    const importedPackageTypes = parseTableObjects<PackageType>('package_types', (r, base) => ({
      id: String(r.id || base?.id || `pkg-${Date.now()}`),
      name: String(r.name || base?.name || ''),
      code: String(r.code ?? base?.code ?? ''),
      description: String(r.description ?? base?.description ?? ''),
      active: r.active !== undefined ? Boolean(Number(r.active)) : (base?.active ?? true)
    }));

    const importedParties = parseTableObjects<Party>('parties', (r, base) => ({
      id: String(r.id || base?.id || `pty-${Date.now()}`),
      name: String(r.name || base?.name || ''),
      businessName: String(r.business_name ?? base?.businessName ?? ''),
      customerType: (r.customer_type || base?.customerType || 'Both') as Party['customerType'],
      phone: String(r.phone ?? base?.phone ?? ''),
      email: String(r.email ?? base?.email ?? ''),
      address: base?.address || '',
      city: String(r.city ?? base?.city ?? ''),
      state: String(r.state ?? base?.state ?? 'Tamil Nadu'),
      pincode: String(r.pincode ?? base?.pincode ?? ''),
      gstin: String(r.gstin ?? base?.gstin ?? ''),
      openingBalance: Number(r.opening_balance ?? base?.openingBalance ?? 0),
      active: r.active !== undefined ? Boolean(Number(r.active)) : (base?.active ?? true),
      createdAt: base?.createdAt || new Date().toISOString().split('T')[0]
    }));

    const importedLRs = parseTableObjects<LR>('lrs', (r, base) => {
      const id = String(r.id || base?.id || `lr-${Date.now()}`);
      const items = itemsByLrId[id] || base?.items || [];
      return {
        ...(base as LR),
        id,
        lrNumber: String(r.lr_number || base?.lrNumber || ''),
        lrDate: String(r.lr_date || base?.lrDate || new Date().toISOString().split('T')[0]),
        vehicleNumber: String(r.vehicle_number ?? base?.vehicleNumber ?? ''),
        fromCity: String(r.from_city || base?.fromCity || ''),
        toCity: String(r.to_city || base?.toCity || ''),
        status: (r.status || base?.status || 'Booked') as LR['status'],
        consignorName: String(r.consignor_name || base?.consignorName || ''),
        consigneeName: String(r.consignee_name || base?.consigneeName || ''),
        consignorAddress: base?.consignorAddress || '',
        consignorCity: base?.consignorCity || String(r.from_city || ''),
        consignorState: base?.consignorState || 'Tamil Nadu',
        consignorPincode: base?.consignorPincode || '',
        consignorPhone: base?.consignorPhone || '',
        consignorGstin: base?.consignorGstin || '',
        consigneeAddress: base?.consigneeAddress || '',
        consigneeCity: base?.consigneeCity || String(r.to_city || ''),
        consigneeState: base?.consigneeState || 'Tamil Nadu',
        consigneePincode: base?.consigneePincode || '',
        consigneePhone: base?.consigneePhone || '',
        consigneeGstin: base?.consigneeGstin || '',
        items,
        totalPackages: Number(r.total_packages ?? base?.totalPackages ?? 0),
        totalWeight: Number(r.total_weight ?? base?.totalWeight ?? 0),
        freightAmount: Number(r.freight_amount ?? base?.freightAmount ?? 0),
        loadingCharges: base?.loadingCharges ?? 0,
        unloadingCharges: base?.unloadingCharges ?? 0,
        otherCharges: base?.otherCharges ?? 0,
        hamaliCharges: base?.hamaliCharges ?? 0,
        additionalCharges: base?.additionalCharges ?? 0,
        discount: base?.discount ?? 0,
        gstApplicable: base?.gstApplicable ?? false,
        gstRate: base?.gstRate ?? 5,
        cgstAmount: base?.cgstAmount ?? 0,
        sgstAmount: base?.sgstAmount ?? 0,
        igstAmount: base?.igstAmount ?? 0,
        grandTotal: Number(r.grand_total ?? base?.grandTotal ?? 0),
        paidAmount: Number(r.paid_amount ?? base?.paidAmount ?? 0),
        balanceDue: Number(r.balance_due ?? base?.balanceDue ?? 0),
        paymentType: (r.payment_type || base?.paymentType || 'To Pay') as LR['paymentType'],
        paymentStatus: (r.payment_status || base?.paymentStatus || 'Unpaid') as LR['paymentStatus'],
        invoiceNumber: String(r.invoice_number ?? base?.invoiceNumber ?? ''),
        ewayBillNumber: String(r.eway_bill_number ?? base?.ewayBillNumber ?? ''),
        bookingBranch: base?.bookingBranch || 'Main Branch',
        deliveryBranch: base?.deliveryBranch || 'Destination Branch',
        bookingStaff: String(r.booking_staff ?? base?.bookingStaff ?? 'Staff'),
        createdAt: String(r.created_at || base?.createdAt || new Date().toISOString()),
        updatedAt: base?.updatedAt || new Date().toISOString()
      };
    });

    const importedPayments = parseTableObjects<Payment>('payments', (r, base) => ({
      id: String(r.id || base?.id || `pay-${Date.now()}`),
      lrId: String(r.lr_id || base?.lrId || ''),
      lrNumber: String(r.lr_number || base?.lrNumber || ''),
      partyId: base?.partyId,
      partyName: String(r.party_name || base?.partyName || ''),
      paymentDate: String(r.payment_date || base?.paymentDate || new Date().toISOString().split('T')[0]),
      amount: Number(r.amount ?? base?.amount ?? 0),
      paymentMethod: (r.payment_method || base?.paymentMethod || 'Cash') as Payment['paymentMethod'],
      transactionRef: String(r.transaction_ref ?? base?.transactionRef ?? ''),
      receivedBy: String(r.received_by ?? base?.receivedBy ?? 'Staff'),
      remarks: base?.remarks || '',
      createdAt: base?.createdAt || new Date().toISOString()
    }));

    const importedExpenses = parseTableObjects<Expense>('expenses', (r, base) => ({
      id: String(r.id || base?.id || `exp-${Date.now()}`),
      expenseDate: String(r.expense_date || base?.expenseDate || new Date().toISOString().split('T')[0]),
      category: (r.category || base?.category || 'Miscellaneous') as Expense['category'],
      description: String(r.description || base?.description || ''),
      amount: Number(r.amount ?? base?.amount ?? 0),
      vehicleNumber: String(r.vehicle_number ?? base?.vehicleNumber ?? ''),
      route: String(r.route ?? base?.route ?? ''),
      paymentMethod: (r.payment_method || base?.paymentMethod || 'Cash') as Expense['paymentMethod'],
      referenceNumber: base?.referenceNumber || '',
      remarks: base?.remarks || '',
      createdAt: base?.createdAt || new Date().toISOString()
    }));

    try {
      importedDb.close();
    } catch {}

    const summaryByTable: Record<string, { added: number; updated: number }> = {};
    let recordsAdded = 0;
    let recordsUpdated = 0;

    // Generic smart-merge helper by unique matcher
    const mergeCollection = <T>(
      tableName: string,
      currentList: T[],
      incomingList: T[],
      isSameEntity: (a: T, b: T) => boolean
    ): T[] => {
      let added = 0;
      let updated = 0;
      const merged = [...currentList];

      for (const incoming of incomingList) {
        const existingIdx = merged.findIndex(item => isSameEntity(item, incoming));
        if (existingIdx >= 0) {
          merged[existingIdx] = { ...merged[existingIdx], ...incoming };
          updated++;
        } else {
          merged.push(incoming);
          added++;
        }
      }

      summaryByTable[tableName] = { added, updated };
      recordsAdded += added;
      recordsUpdated += updated;
      return merged;
    };

    if (mode === 'replace') {
      appState = {
        settings: importedSettings[0] || appState.settings,
        users: importedUsers.length > 0 ? importedUsers : appState.users,
        cities: importedCities.length > 0 ? importedCities : appState.cities,
        vehicles: importedVehicles,
        drivers: importedDrivers,
        routes: importedRoutes,
        packageTypes: importedPackageTypes.length > 0 ? importedPackageTypes : appState.packageTypes,
        parties: importedParties,
        lrs: importedLRs,
        payments: importedPayments,
        expenses: importedExpenses,
        auditLogs: appState.auditLogs
      };
      recordsAdded =
        importedUsers.length + importedCities.length + importedVehicles.length +
        importedDrivers.length + importedRoutes.length + importedPackageTypes.length +
        importedParties.length + importedLRs.length + importedPayments.length + importedExpenses.length;
    } else {
      // SMART MERGE MODE
      const mergedUsers = mergeCollection(
        'users',
        appState.users,
        importedUsers,
        (a, b) => a.id === b.id || a.username.toLowerCase() === b.username.toLowerCase()
      );

      const mergedCities = mergeCollection(
        'cities',
        appState.cities,
        importedCities,
        (a, b) => a.id === b.id || a.name.toLowerCase() === b.name.toLowerCase()
      );

      const mergedVehicles = mergeCollection(
        'vehicles',
        appState.vehicles,
        importedVehicles,
        (a, b) => a.id === b.id || a.vehicleNumber.replace(/\s+/g, '').toLowerCase() === b.vehicleNumber.replace(/\s+/g, '').toLowerCase()
      );

      const mergedDrivers = mergeCollection(
        'drivers',
        appState.drivers,
        importedDrivers,
        (a, b) => a.id === b.id || (Boolean(a.licenseNumber) && a.licenseNumber.toLowerCase() === b.licenseNumber.toLowerCase()) || a.name.toLowerCase() === b.name.toLowerCase()
      );

      const mergedRoutes = mergeCollection(
        'routes',
        appState.routes,
        importedRoutes,
        (a, b) => a.id === b.id || a.name.toLowerCase() === b.name.toLowerCase()
      );

      const mergedPackageTypes = mergeCollection(
        'package_types',
        appState.packageTypes || INITIAL_PACKAGE_TYPES,
        importedPackageTypes,
        (a, b) => a.id === b.id || a.name.toLowerCase() === b.name.toLowerCase()
      );

      const mergedParties = mergeCollection(
        'parties',
        appState.parties,
        importedParties,
        (a, b) => a.id === b.id || a.name.toLowerCase() === b.name.toLowerCase()
      );

      const mergedLRs = mergeCollection(
        'lrs',
        appState.lrs,
        importedLRs,
        (a, b) => a.id === b.id || a.lrNumber.toLowerCase() === b.lrNumber.toLowerCase()
      );

      const mergedPayments = mergeCollection(
        'payments',
        appState.payments,
        importedPayments,
        (a, b) => a.id === b.id || (a.lrNumber === b.lrNumber && a.paymentDate === b.paymentDate && a.amount === b.amount && a.transactionRef === b.transactionRef)
      );

      const mergedExpenses = mergeCollection(
        'expenses',
        appState.expenses,
        importedExpenses,
        (a, b) => a.id === b.id || (a.expenseDate === b.expenseDate && a.category === b.category && a.amount === b.amount && a.description === b.description)
      );

      // Reconcile LR payment balances after merging LRs & Payments
      for (const lr of mergedLRs) {
        const lrPayments = mergedPayments.filter(
          p => p.lrId === lr.id || p.lrNumber.toLowerCase() === lr.lrNumber.toLowerCase()
        );
        if (lrPayments.length > 0) {
          const totalPaid = lrPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
          lr.paidAmount = Math.max(lr.paidAmount || 0, totalPaid);
          lr.balanceDue = Math.max(0, (Number(lr.grandTotal) || 0) - lr.paidAmount);
          if (lr.paidAmount >= (Number(lr.grandTotal) || 0) && lr.grandTotal > 0) {
            lr.paymentStatus = 'Paid';
          } else if (lr.paidAmount > 0) {
            lr.paymentStatus = 'Partially Paid';
          }
        }
      }

      // Ensure nextLrNumber is at least higher than any imported sequence
      const incomingNextSeq = importedSettings[0]?.nextLrNumber || 1001;
      const mergedSettings: CompanySettings = {
        ...appState.settings,
        nextLrNumber: Math.max(appState.settings.nextLrNumber || 1001, incomingNextSeq)
      };

      appState = {
        settings: mergedSettings,
        users: mergedUsers,
        cities: mergedCities,
        vehicles: mergedVehicles,
        drivers: mergedDrivers,
        routes: mergedRoutes,
        packageTypes: mergedPackageTypes,
        parties: mergedParties,
        lrs: mergedLRs,
        payments: mergedPayments,
        expenses: mergedExpenses,
        auditLogs: appState.auditLogs
      };
    }

    const recordsRestored = recordsAdded + recordsUpdated;

    this.addAuditLog(
      mode === 'merge' ? 'SQLite Data Merged' : 'SQLite File Restored',
      'Database',
      'transport.sqlite',
      `${mode === 'merge' ? 'Merged' : 'Restored'} SQLite database (${recordsAdded} added, ${recordsUpdated} updated)`,
      user
    );
    persistDatabase();

    return {
      mode,
      tablesRestored: Object.keys(MYSQL_TABLES_DDL).length,
      recordsRestored,
      recordsAdded,
      recordsUpdated,
      summaryByTable,
      state: appState
    };
  },

  getMySqlDumpFilePath(): string {
    if (!fs.existsSync(MYSQL_DUMP_FILE)) {
      generateMySqlDumpFile(appState, getMySqlConfig().database);
    }
    return MYSQL_DUMP_FILE;
  },

  getSqlTablesMetadata(): Array<{
    tableName: string;
    rowCount: number;
    columns: string[];
    mysqlDdl: string;
    description: string;
  }> {
    const descriptions: Record<string, string> = {
      lrs: 'Master Lorry Receipts (Bookings, Drafts, Freight & Payment Status)',
      lr_items: 'Line-Item Cargo Packages & Weight Breakdown per LR',
      parties: 'Consignor & Consignee Customer Master Registry',
      payments: 'Freight Collections, Receipts & Settlement Ledger',
      expenses: 'Vehicle Diesel, Driver Bata, Toll & Godown Expenses',
      vehicles: 'Owned & Attached Lorry Fleet Registry',
      drivers: 'Commercial Drivers, Licenses & Assigned Vehicles',
      routes: 'Transport Corridors, Transit Time & Standard Rates',
      cities: 'Serviceable Origin & Destination Cities / Branches',
      package_types: 'Standard Cargo Packaging Units (Cartons, Bales, Drums, etc.)',
      users: 'Offline System Operators, Roles & Access Credentials',
      company_settings: 'Company Header, GST Configuration & LR Numbering Series',
      audit_logs: 'Immutable Security & Operational Activity Trail'
    };

    const result: Array<{
      tableName: string;
      rowCount: number;
      columns: string[];
      mysqlDdl: string;
      description: string;
    }> = [];

    for (const [tableName, mysqlDdl] of Object.entries(MYSQL_TABLES_DDL)) {
      let rowCount = 0;
      let columns: string[] = [];
      if (db) {
        try {
          const countRes = db.exec(`SELECT COUNT(*) FROM ${tableName}`);
          rowCount = Number(countRes?.[0]?.values?.[0]?.[0] || 0);
          const pragmaRes = db.exec(`PRAGMA table_info(${tableName})`);
          if (pragmaRes?.[0]?.values) {
            columns = pragmaRes[0].values.map(v => String(v[1]));
          }
        } catch {}
      }
      result.push({
        tableName,
        rowCount,
        columns,
        mysqlDdl,
        description: descriptions[tableName] || 'Relational SQL Table'
      });
    }

    return result;
  },

  executeSqlQuery(rawQuery: string): {
    columns: string[];
    rows: any[][];
    rowCount: number;
    executionTimeMs: number;
  } {
    const start = Date.now();
    const trimmed = (rawQuery || '').trim();
    if (!trimmed) {
      throw new Error('SQL query cannot be empty');
    }

    // Translate MySQL convenience commands like SHOW TABLES or DESCRIBE <table> for the embedded engine
    let translated = trimmed;
    if (/^SHOW\s+TABLES\s*;?$/i.test(trimmed)) {
      translated = `SELECT name AS table_name, 'InnoDB / SQL' AS engine FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`;
    } else {
      const descMatch = trimmed.match(/^(?:DESCRIBE|DESC|SHOW\s+COLUMNS\s+FROM)\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*;?$/i);
      if (descMatch) {
        translated = `PRAGMA table_info(${descMatch[1]});`;
      }
    }

    // Prevent destructive DROP/DELETE from accidental console execution unless SELECT/PRAGMA
    const upper = translated.toUpperCase();
    if (
      !upper.startsWith('SELECT') &&
      !upper.startsWith('PRAGMA') &&
      !upper.startsWith('WITH') &&
      !upper.startsWith('EXPLAIN')
    ) {
      throw new Error('Only SELECT, SHOW TABLES, DESCRIBE, and PRAGMA queries are allowed in the interactive query console.');
    }

    if (!db) {
      throw new Error('Embedded SQL engine is not initialized');
    }

    const res = db.exec(translated);
    const executionTimeMs = Date.now() - start;

    if (!res || res.length === 0) {
      return { columns: [], rows: [], rowCount: 0, executionTimeMs };
    }

    // Filter out huge data_json column if user ran SELECT * unless explicitly requested
    const firstResult = res[0];
    const isSelectStar = /SELECT\s+\*\s+FROM/i.test(translated);
    let cols = firstResult.columns;
    let rows = firstResult.values;

    if (isSelectStar && cols.includes('data_json') && cols.length > 2) {
      const jsonIdx = cols.indexOf('data_json');
      cols = cols.filter((_, idx) => idx !== jsonIdx);
      rows = rows.map(r => r.filter((_, idx) => idx !== jsonIdx));
    }

    return {
      columns: cols,
      rows,
      rowCount: rows.length,
      executionTimeMs
    };
  },

  getServerDatabaseStatus(port = 3000) {
    const sqliteSize = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0;
    const mysqlDumpSize = fs.existsSync(MYSQL_DUMP_FILE) ? fs.statSync(MYSQL_DUMP_FILE).size : 0;
    const jsonSize = fs.existsSync(MIRROR_JSON) ? fs.statSync(MIRROR_JSON).size : 0;
    const mysqlConfig = getMySqlConfig();
    const lanInfo = getOfflineServerLanInfo(port);
    const tables = this.getSqlTablesMetadata();
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

    return {
      engine: 'Dual SQL Engine (MySQL 8.0 / MariaDB Connector + Embedded Offline SQLite)',
      sqliteFile: 'data/transport.sqlite',
      sqliteSizeBytes: sqliteSize,
      mysqlDumpFile: 'data/sri_murugan_transport_mysql.sql',
      mysqlDumpSizeBytes: mysqlDumpSize,
      jsonMirrorFile: 'data/transport_data.json',
      jsonSizeBytes: jsonSize,
      totalTables: tables.length,
      totalRows,
      tables,
      mysqlConfig: {
        ...mysqlConfig,
        password: mysqlConfig.password ? '••••••••' : ''
      },
      lanInfo
    };
  },

  updateMySqlConfig(cfg: Partial<MySqlConnectionConfig>): MySqlConnectionConfig {
    const current = getMySqlConfig();
    const merged = { ...cfg };
    if (merged.password === '••••••••') {
      merged.password = current.password;
    }
    return saveMySqlConfig(merged);
  },

  async testMySql(cfg?: Partial<MySqlConnectionConfig>) {
    const current = getMySqlConfig();
    const merged = { ...cfg };
    if (merged.password === '••••••••') {
      merged.password = current.password;
    }
    return testMySqlConnection(merged);
  },

  async pushToMySql(cfg?: Partial<MySqlConnectionConfig>, user = 'Admin') {
    const current = getMySqlConfig();
    const merged = { ...cfg };
    if (merged.password === '••••••••') {
      merged.password = current.password;
    }
    const res = await syncPushToMySql(appState, merged);
    if (res.success) {
      this.addAuditLog('MySQL Sync Push', 'Database', res.database, `Synced ${res.tablesSynced} tables (${res.rowsSynced} rows) to MySQL server`, user);
      persistDatabase();
    }
    return res;
  },

  async pullFromMySql(cfg?: Partial<MySqlConnectionConfig>, user = 'Admin') {
    const current = getMySqlConfig();
    const merged = { ...cfg };
    if (merged.password === '••••••••') {
      merged.password = current.password;
    }
    const res = await syncPullFromMySql(appState, merged);
    if (res.success && res.state) {
      appState = res.state;
      this.addAuditLog('MySQL Sync Pull', 'Database', current.database, `Pulled ${res.rowsPulled} records from MySQL server`, user);
      persistDatabase();
    }
    return res;
  }
};

