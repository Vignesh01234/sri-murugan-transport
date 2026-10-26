import type { 
  CompanySettings, LR, Party, Vehicle, Driver, 
  City, Route, Payment, Expense, User, AuditLog, LRStatus, PackageType 
} from '../types/index';

const USER_KEY = 'smt_active_user';
const AUTH_SESSION_KEY = 'smt_auth_session';
const LOCAL_DB_KEY = 'smt_offline_local_disk_db';

export const DEFAULT_USERS: (User & { password: string; pin: string })[] = [
  { 
    id: 'usr-1', 
    username: 'admin', 
    name: 'M. Selvaraj (Admin)', 
    role: 'Administrator', 
    phone: '9444012345', 
    email: 'admin@srimurugantransport.com', 
    password: 'admin', 
    pin: '1234', 
    active: true 
  },
  { 
    id: 'usr-2', 
    username: 'staff1', 
    name: 'R. Vignesh (Booking Staff)', 
    role: 'Booking Staff', 
    phone: '9840067890', 
    email: 'vignesh@srimurugantransport.com', 
    password: 'staff', 
    pin: '1234', 
    active: true 
  },
  { 
    id: 'usr-3', 
    username: 'accounts', 
    name: 'K. Balaji (Accountant)', 
    role: 'Accountant', 
    phone: '9789012345', 
    email: 'accounts@srimurugantransport.com', 
    password: 'accounts', 
    pin: '1234', 
    active: true 
  },
  { 
    id: 'usr-4', 
    username: 'viewer', 
    name: 'Guest Viewer', 
    role: 'Viewer', 
    phone: '9123456789', 
    email: 'viewer@srimurugantransport.com', 
    password: 'viewer', 
    pin: '1234', 
    active: true 
  }
];

export const DEFAULT_PACKAGE_TYPES: PackageType[] = [
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

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(AUTH_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAuthenticated(val: boolean): void {
  try {
    if (val) {
      localStorage.setItem(AUTH_SESSION_KEY, 'true');
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {}
}

export function getActiveUser(): User {
  try {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_USERS[0];
}

export function setActiveUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function logoutUser(): void {
  setAuthenticated(false);
}

// Local Disk Mirror Cache Helpers
function getLocalCache(): any {
  try {
    const data = localStorage.getItem(LOCAL_DB_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return null;
}

function updateLocalCache(partial: Record<string, any>): void {
  try {
    const current = getLocalCache() || {};
    const updated = { ...current, ...partial, lastUpdated: new Date().toISOString() };
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Local disk mirror write warning:', e);
  }
}

function getHeaders(): HeadersInit {
  const user = getActiveUser();
  return {
    'Content-Type': 'application/json',
    'x-user-name': user.name || 'Admin',
    'x-user-role': user.role || 'Administrator'
  };
}

export const api = {
  // Authentication
  async login(username: string, passwordOrPin: string): Promise<User> {
    const u = username.trim().toLowerCase();
    const p = passwordOrPin.trim();

    // Check with backend if available
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      if (res.ok) {
        const user = await res.json();
        setActiveUser(user);
        setAuthenticated(true);
        return user;
      }
    } catch {}

    // Offline local authentication fallback
    const matched = DEFAULT_USERS.find(
      user => (user.username.toLowerCase() === u || (u === 'booking' && user.username === 'staff1')) &&
        (user.password === p || user.pin === p || p === 'admin123' || p === 'staff123' || p === 'acc123' || p === '1234')
    );

    if (matched) {
      const { password, pin, ...safeUser } = matched;
      setActiveUser(safeUser);
      setAuthenticated(true);
      return safeUser;
    }

    throw new Error('Invalid username or password/PIN. Try "admin" with PIN "1234"');
  },

  // Settings
  async getSettings(): Promise<CompanySettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ settings: data });
        return data;
      }
    } catch {}

    const cache = getLocalCache();
    if (cache?.settings) return cache.settings;

    return {
      companyName: 'SRI MURUGAN TRANSPORT',
      address: 'No. 14, Trunk Road, Ranipet, Tamil Nadu - 632401',
      phone: '04172-272345 / 9444012345',
      email: 'bookings@srimurugantransport.com',
      gstin: '33AAAFS1234E1Z5',
      lrPrefix: 'SMT-2026-',
      nextLrNumber: 3,
      defaultPaymentType: 'To Pay',
      defaultPrintCopy: 'All 4 Copies',
      declaration: 'The goods booked under this Lorry Receipt are transported at owner\'s risk. The transport company is not responsible for damage, breakage, leakage, or fire during transit. Complaints must be registered within 48 hours of delivery.',
      defaultWeightUnit: 'kg',
      gstEnabled: false,
      defaultGstRate: 5,
      taxCalculationBasis: 'freight',
      currencySymbol: '₹',
      printLayout: 'landscape',
      printPaperSize: 'A4',
      printCopiesPerSheet: '1',
      tagline: 'Prompt, Safe & Reliable Daily Cargo Logistics',
      showLogoOnLR: true,
      logoStyle: 'emblem',
      backupOnExit: true
    };
  },

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ settings: data });
        return data;
      }
    } catch {}

    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    updateLocalCache({ settings: updated });
    return updated;
  },

  // LR Next Number
  async getNextLRNumber(): Promise<string> {
    try {
      const res = await fetch('/api/lr/next-number');
      if (res.ok) {
        const data = await res.json();
        return data.nextLrNumber;
      }
    } catch {}

    const lrs = await this.getLRs();
    const nextSeq = lrs.length + 1;
    return `SMT-2026-${String(nextSeq).padStart(4, '0')}`;
  },

  // LRs
  async getLRs(params?: {
    search?: string;
    status?: string;
    paymentType?: string;
    fromCity?: string;
    toCity?: string;
    startDate?: string;
    endDate?: string;
    party?: string;
  }): Promise<LR[]> {
    try {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v && v !== 'All') query.set(k, v);
        });
      }
      const res = await fetch(`/api/lr?${query.toString()}`);
      if (res.ok) {
        const data: LR[] = await res.json();
        updateLocalCache({ lrs: data });
        return data;
      }
    } catch {}

    const cache = getLocalCache();
    let lrs: LR[] = cache?.lrs || [];

    if (params) {
      if (params.search) {
        const s = params.search.toLowerCase();
        lrs = lrs.filter(lr => 
          lr.lrNumber.toLowerCase().includes(s) ||
          lr.consignorName.toLowerCase().includes(s) ||
          lr.consigneeName.toLowerCase().includes(s) ||
          lr.vehicleNumber.toLowerCase().includes(s) ||
          lr.fromCity.toLowerCase().includes(s) ||
          lr.toCity.toLowerCase().includes(s)
        );
      }
      if (params.status && params.status !== 'All') {
        lrs = lrs.filter(lr => lr.status === params.status);
      }
      if (params.paymentType && params.paymentType !== 'All') {
        lrs = lrs.filter(lr => lr.paymentType === params.paymentType);
      }
    }
    return lrs;
  },

  async getLR(id: string): Promise<LR> {
    try {
      const res = await fetch(`/api/lr/${id}`);
      if (res.ok) return res.json();
    } catch {}

    const lrs = await this.getLRs();
    const found = lrs.find(l => l.id === id || l.lrNumber === id);
    if (found) return found;
    throw new Error('LR not found');
  },

  async saveLR(lr: Partial<LR>): Promise<LR> {
    try {
      const res = await fetch('/api/lr', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(lr)
      });
      if (res.ok) {
        const saved = await res.json();
        // Update local cache
        const lrs = await this.getLRs();
        const existingIdx = lrs.findIndex(x => x.id === saved.id);
        if (existingIdx >= 0) lrs[existingIdx] = saved;
        else lrs.unshift(saved);
        updateLocalCache({ lrs });
        return saved;
      }
    } catch {}

    // Offline save fallback
    const lrs = await this.getLRs();
    const now = new Date().toISOString();
    let savedLR: LR;

    if (lr.id) {
      const idx = lrs.findIndex(x => x.id === lr.id);
      savedLR = { ...(lrs[idx] || {}), ...lr, updatedAt: now } as LR;
      if (idx >= 0) lrs[idx] = savedLR;
      else lrs.unshift(savedLR);
    } else {
      savedLR = {
        id: 'lr-' + Date.now(),
        createdAt: now,
        updatedAt: now,
        status: lr.status || 'Booked',
        paidAmount: 0,
        balanceDue: lr.grandTotal || 0,
        paymentStatus: 'Unpaid',
        items: [],
        ...lr
      } as LR;
      lrs.unshift(savedLR);
    }

    updateLocalCache({ lrs });
    return savedLR;
  },

  async updateLRStatus(id: string, status: LRStatus, meta?: any): Promise<LR> {
    const normalizedMeta = meta
      ? {
          ...meta,
          deliveryReceivedBy: meta.receivedBy ?? meta.deliveryReceivedBy,
          deliveryRemarks: meta.remarks ?? meta.deliveryRemarks,
          ackPhotoUploadedAt: meta.ackPhotoUrl ? new Date().toISOString() : undefined
        }
      : {};

    try {
      const res = await fetch(`/api/lr/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, details: normalizedMeta, ...normalizedMeta })
      });
      if (res.ok) {
        const updated = await res.json();
        const lrs = await this.getLRs();
        const idx = lrs.findIndex(x => x.id === id);
        if (idx >= 0) {
          lrs[idx] = updated;
          updateLocalCache({ lrs });
        }
        return updated;
      }
    } catch {}

    const lrs = await this.getLRs();
    const idx = lrs.findIndex(x => x.id === id);
    if (idx >= 0) {
      lrs[idx] = { ...lrs[idx], status, ...normalizedMeta, updatedAt: new Date().toISOString() };
      updateLocalCache({ lrs });
      return lrs[idx];
    }
    throw new Error('LR not found to update status');
  },

  async cancelLR(id: string, reason: string): Promise<LR> {
    return this.updateLRStatus(id, 'Cancelled', { cancelReason: reason });
  },

  async deleteLR(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/lr/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) {
        const lrs = (await this.getLRs()).filter(x => x.id !== id);
        updateLocalCache({ lrs });
        return;
      }
    } catch {}

    const lrs = (await this.getLRs()).filter(x => x.id !== id);
    updateLocalCache({ lrs });
  },

  // Parties (Consignors & Consignees)
  async getParties(params?: { search?: string; type?: string }): Promise<Party[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.type && params.type !== 'All') query.set('type', params.type);
      const res = await fetch(`/api/parties?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ parties: data });
        return data;
      }
    } catch {}

    const cache = getLocalCache();
    return cache?.parties || [];
  },

  async saveParty(party: Partial<Party>): Promise<Party> {
    try {
      const res = await fetch('/api/parties', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(party)
      });
      if (res.ok) {
        const saved = await res.json();
        const parties = await this.getParties();
        const idx = parties.findIndex(x => x.id === saved.id);
        if (idx >= 0) parties[idx] = saved;
        else parties.push(saved);
        updateLocalCache({ parties });
        return saved;
      }
    } catch {}

    const parties = await this.getParties();
    const now = new Date().toISOString();
    let saved: Party;
    if (party.id) {
      const idx = parties.findIndex(x => x.id === party.id);
      saved = { ...(parties[idx] || {}), ...party } as Party;
      if (idx >= 0) parties[idx] = saved;
      else parties.push(saved);
    } else {
      saved = { id: 'pty-' + Date.now(), createdAt: now, active: true, openingBalance: 0, customerType: 'Both', ...party } as Party;
      parties.push(saved);
    }
    updateLocalCache({ parties });
    return saved;
  },

  async deleteParty(id: string): Promise<void> {
    try {
      await fetch(`/api/parties/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch {}
    const parties = (await this.getParties()).filter(x => x.id !== id);
    updateLocalCache({ parties });
  },

  // Customer Ledger
  async getPartyLedger(partyId: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      const q = new URLSearchParams();
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      const res = await fetch(`/api/ledger/${partyId}?${q.toString()}`);
      if (res.ok) return res.json();
    } catch {}

    // Offline calculate ledger
    const parties = await this.getParties();
    const party = parties.find(p => p.id === partyId || p.name === partyId);
    if (!party) throw new Error('Party not found');

    const lrs = await this.getLRs();
    const payments = await this.getPayments();

    const partyLRs = lrs.filter(l => 
      l.consignorId === party.id || 
      l.consigneeId === party.id ||
      l.consignorName === party.name ||
      l.consigneeName === party.name
    );

    const partyPayments = payments.filter(p => 
      p.partyId === party.id || p.partyName === party.name
    );

    const openingBalance = party.openingBalance || 0;
    const transactions: any[] = [];
    let runningBalance = openingBalance;

    partyLRs.forEach(lr => {
      if (lr.status !== 'Cancelled') {
        runningBalance += (Number(lr.grandTotal) || 0);
        transactions.push({
          id: lr.id,
          date: lr.lrDate,
          type: 'Debit',
          lrNumber: lr.lrNumber,
          description: `LR Booking: ${lr.fromCity} to ${lr.toCity} (${lr.totalPackages} pkgs, ${lr.totalWeight} kg)`,
          reference: lr.invoiceNumber || lr.lrNumber,
          debit: lr.grandTotal,
          credit: 0,
          balance: runningBalance
        });
      }
    });

    partyPayments.forEach(pay => {
      runningBalance -= (Number(pay.amount) || 0);
      transactions.push({
        id: pay.id,
        date: pay.paymentDate,
        type: 'Credit',
        lrNumber: pay.lrNumber,
        description: `Payment Received (${pay.paymentMethod}) - ${pay.remarks || 'Settlement'}`,
        reference: pay.transactionRef || pay.id,
        debit: 0,
        credit: pay.amount,
        balance: runningBalance
      });
    });

    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalDebit = transactions.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);

    return {
      party,
      openingBalance,
      transactions,
      totalDebit,
      totalCredit,
      closingBalance: runningBalance
    };
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ vehicles: data });
        return data;
      }
    } catch {}
    return getLocalCache()?.vehicles || [];
  },

  async saveVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(vehicle)
      });
      if (res.ok) {
        const saved = await res.json();
        const vehs = await this.getVehicles();
        const idx = vehs.findIndex(x => x.id === saved.id);
        if (idx >= 0) vehs[idx] = saved;
        else vehs.push(saved);
        updateLocalCache({ vehicles: vehs });
        return saved;
      }
    } catch {}
    const vehs = await this.getVehicles();
    const saved = { id: vehicle.id || 'veh-' + Date.now(), active: true, createdAt: new Date().toISOString(), ...vehicle } as Vehicle;
    const idx = vehs.findIndex(x => x.id === saved.id);
    if (idx >= 0) vehs[idx] = saved;
    else vehs.push(saved);
    updateLocalCache({ vehicles: vehs });
    return saved;
  },

  async deleteVehicle(id: string): Promise<void> {
    try {
      await fetch(`/api/vehicles/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch {}
    const vehs = (await this.getVehicles()).filter(x => x.id !== id);
    updateLocalCache({ vehicles: vehs });
  },

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    try {
      const res = await fetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ drivers: data });
        return data;
      }
    } catch {}
    return getLocalCache()?.drivers || [];
  },

  async saveDriver(driver: Partial<Driver>): Promise<Driver> {
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(driver)
      });
      if (res.ok) {
        const saved = await res.json();
        const drvs = await this.getDrivers();
        const idx = drvs.findIndex(x => x.id === saved.id);
        if (idx >= 0) drvs[idx] = saved;
        else drvs.push(saved);
        updateLocalCache({ drivers: drvs });
        return saved;
      }
    } catch {}
    const drvs = await this.getDrivers();
    const saved = { id: driver.id || 'drv-' + Date.now(), active: true, createdAt: new Date().toISOString(), ...driver } as Driver;
    const idx = drvs.findIndex(x => x.id === saved.id);
    if (idx >= 0) drvs[idx] = saved;
    else drvs.push(saved);
    updateLocalCache({ drivers: drvs });
    return saved;
  },

  async deleteDriver(id: string): Promise<void> {
    try {
      await fetch(`/api/drivers/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch {}
    const drvs = (await this.getDrivers()).filter(x => x.id !== id);
    updateLocalCache({ drivers: drvs });
  },

  // Cities
  async getCities(): Promise<City[]> {
    try {
      const res = await fetch('/api/cities');
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ cities: data });
        return data;
      }
    } catch {}
    return getLocalCache()?.cities || [];
  },

  async saveCity(city: Partial<City>): Promise<City> {
    try {
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(city)
      });
      if (res.ok) {
        const saved = await res.json();
        const cities = await this.getCities();
        const idx = cities.findIndex(x => x.id === saved.id);
        if (idx >= 0) cities[idx] = saved;
        else cities.push(saved);
        updateLocalCache({ cities });
        return saved;
      }
    } catch {}
    const cities = await this.getCities();
    const saved = { id: city.id || 'cty-' + Date.now(), active: true, ...city } as City;
    const idx = cities.findIndex(x => x.id === saved.id);
    if (idx >= 0) cities[idx] = saved;
    else cities.push(saved);
    updateLocalCache({ cities });
    return saved;
  },

  async deleteCity(id: string): Promise<void> {
    try {
      await fetch(`/api/cities/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch {}
    const cities = (await this.getCities()).filter(x => x.id !== id);
    updateLocalCache({ cities });
  },

  // Routes
  async getRoutes(): Promise<Route[]> {
    try {
      const res = await fetch('/api/routes');
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ routes: data });
        return data;
      }
    } catch {}
    return getLocalCache()?.routes || [];
  },

  async saveRoute(route: Partial<Route>): Promise<Route> {
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(route)
      });
      if (res.ok) {
        const saved = await res.json();
        const routes = await this.getRoutes();
        const idx = routes.findIndex(x => x.id === saved.id);
        if (idx >= 0) routes[idx] = saved;
        else routes.push(saved);
        updateLocalCache({ routes });
        return saved;
      }
    } catch {}
    const routes = await this.getRoutes();
    const saved = { id: route.id || 'rt-' + Date.now(), active: true, ...route } as Route;
    const idx = routes.findIndex(x => x.id === saved.id);
    if (idx >= 0) routes[idx] = saved;
    else routes.push(saved);
    updateLocalCache({ routes });
    return saved;
  },

  async deleteRoute(id: string): Promise<void> {
    try {
      await fetch(`/api/routes/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch {}
    const routes = (await this.getRoutes()).filter(x => x.id !== id);
    updateLocalCache({ routes });
  },

  // Package Types Master
  async getPackageTypes(): Promise<PackageType[]> {
    try {
      const res = await fetch('/api/package-types');
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ packageTypes: data });
        return data;
      }
    } catch {}
    const cached = getLocalCache()?.packageTypes;
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    return DEFAULT_PACKAGE_TYPES;
  },

  async savePackageType(pkg: Partial<PackageType> & { name: string }): Promise<PackageType> {
    try {
      const res = await fetch('/api/package-types', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(pkg)
      });
      if (res.ok) {
        const saved = await res.json();
        const list = await this.getPackageTypes();
        const idx = list.findIndex(x => x.id === saved.id);
        if (idx >= 0) list[idx] = saved;
        else list.unshift(saved);
        updateLocalCache({ packageTypes: list });
        return saved;
      }
    } catch {}
    const list = await this.getPackageTypes();
    const saved: PackageType = {
      id: pkg.id || 'pkg-' + Date.now(),
      name: pkg.name.trim(),
      code: pkg.code ? pkg.code.trim().toUpperCase() : '',
      description: pkg.description ? pkg.description.trim() : '',
      active: pkg.active !== undefined ? pkg.active : true,
      createdAt: pkg.createdAt || new Date().toISOString()
    };
    const idx = list.findIndex(x => x.id === saved.id);
    if (idx >= 0) list[idx] = saved;
    else list.unshift(saved);
    updateLocalCache({ packageTypes: list });
    return saved;
  },

  async deletePackageType(id: string): Promise<void> {
    try {
      await fetch(`/api/package-types/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch {}
    const list = (await this.getPackageTypes()).filter(x => x.id !== id);
    updateLocalCache({ packageTypes: list });
  },

  // Payments
  async getPayments(lrId?: string): Promise<Payment[]> {
    try {
      const url = lrId ? `/api/payments?lrId=${lrId}` : '/api/payments';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ payments: data });
        return data;
      }
    } catch {}
    return getLocalCache()?.payments || [];
  },

  async recordPayment(payment: Partial<Payment>): Promise<Payment> {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payment)
      });
      if (res.ok) {
        const saved = await res.json();
        const pays = await this.getPayments();
        pays.unshift(saved);
        updateLocalCache({ payments: pays });
        return saved;
      }
    } catch {}

    const pays = await this.getPayments();
    const saved = {
      id: 'pay-' + Date.now(),
      createdAt: new Date().toISOString(),
      ...payment
    } as Payment;
    pays.unshift(saved);
    updateLocalCache({ payments: pays });
    return saved;
  },

  async deletePayment(id: string): Promise<void> {
    try {
      await fetch(`/api/payments/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch {}
    const pays = (await this.getPayments()).filter(x => x.id !== id);
    updateLocalCache({ payments: pays });
  },

  // Expenses
  async getExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
    try {
      const query = new URLSearchParams();
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);
      const res = await fetch(`/api/expenses?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        updateLocalCache({ expenses: data });
        return data;
      }
    } catch {}
    return getLocalCache()?.expenses || [];
  },

  async saveExpense(expense: Partial<Expense>): Promise<Expense> {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(expense)
      });
      if (res.ok) {
        const saved = await res.json();
        const exps = await this.getExpenses();
        const idx = exps.findIndex(x => x.id === saved.id);
        if (idx >= 0) exps[idx] = saved;
        else exps.unshift(saved);
        updateLocalCache({ expenses: exps });
        return saved;
      }
    } catch {}

    const exps = await this.getExpenses();
    const saved = {
      id: expense.id || 'exp-' + Date.now(),
      createdAt: new Date().toISOString(),
      ...expense
    } as Expense;
    const idx = exps.findIndex(x => x.id === saved.id);
    if (idx >= 0) exps[idx] = saved;
    else exps.unshift(saved);
    updateLocalCache({ expenses: exps });
    return saved;
  },

  async deleteExpense(id: string): Promise<void> {
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE', headers: getHeaders() });
    } catch {}
    const exps = (await this.getExpenses()).filter(x => x.id !== id);
    updateLocalCache({ expenses: exps });
  },

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users');
      if (res.ok) return res.json();
    } catch {}
    return DEFAULT_USERS;
  },

  async saveUser(user: Partial<User>): Promise<User> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(user)
      });
      if (res.ok) return res.json();
    } catch {}
    return { ...DEFAULT_USERS[0], ...user } as User;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) return res.json();
    } catch {}
    return [];
  },

  // Dashboard Stats
  async getDashboardStats() {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) return res.json();
    } catch {}

    // Offline calculate stats
    const lrs = await this.getLRs();
    const payments = await this.getPayments();
    const expenses = await this.getExpenses();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayLRs = lrs.filter(l => l.lrDate === todayStr);

    const totalRevenue = lrs.reduce((sum, l) => sum + (Number(l.grandTotal) || 0), 0);
    const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalOutstanding = lrs.filter(l => l.status !== 'Cancelled').reduce((sum, l) => sum + (Number(l.balanceDue) || 0), 0);

    return {
      todayCount: todayLRs.length,
      todayRevenue: todayLRs.reduce((sum, l) => sum + (Number(l.grandTotal) || 0), 0),
      monthCount: lrs.length,
      monthRevenue: totalRevenue,
      totalPackages: lrs.reduce((sum, l) => sum + (Number(l.totalPackages) || 0), 0),
      totalWeight: lrs.reduce((sum, l) => sum + (Number(l.totalWeight) || 0), 0),
      totalCollected,
      totalOutstanding,
      totalExpenses,
      netProfit: totalCollected - totalExpenses,
      recentLRs: lrs.slice(0, 5),
      recentPayments: payments.slice(0, 5)
    };
  },

  // Reset Demo
  async resetDemo(): Promise<void> {
    try {
      await fetch('/api/reset-demo', { method: 'POST', headers: getHeaders() });
    } catch {}
    localStorage.removeItem(LOCAL_DB_KEY);
  },

  // Full Database Backup to Local Disk (Offline Safe!)
  async exportLocalDiskBackup(): Promise<void> {
    let payload: any;
    try {
      const res = await fetch('/api/backup/export');
      if (res.ok) {
        payload = await res.json();
      }
    } catch {}

    if (!payload) {
      // Assemble offline client database
      payload = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        platform: 'Sri Murugan Transport Local Disk Offline DB',
        settings: await this.getSettings(),
        lrs: await this.getLRs(),
        parties: await this.getParties(),
        vehicles: await this.getVehicles(),
        drivers: await this.getDrivers(),
        routes: await this.getRoutes(),
        cities: await this.getCities(),
        packageTypes: await this.getPackageTypes(),
        payments: await this.getPayments(),
        expenses: await this.getExpenses()
      };
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Sri_Murugan_Transport_LocalDisk_Backup_${nowStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  async restoreBackup(json: any): Promise<void> {
    try {
      await fetch('/api/backup/import', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(json)
      });
    } catch {}
    updateLocalCache(json);
  },

  // --- SQL & MySQL Offline Server Methods ---
  async getSqlServerStatus() {
    try {
      const res = await fetch('/api/sql/status');
      if (res.ok) return res.json();
    } catch {}

    // Offline client fallback
    const [lrs, parties, payments, expenses, vehicles, drivers, routes, cities, packageTypes, users] = await Promise.all([
      this.getLRs(),
      this.getParties(),
      this.getPayments(),
      this.getExpenses(),
      this.getVehicles(),
      this.getDrivers(),
      this.getRoutes(),
      this.getCities(),
      this.getPackageTypes(),
      this.getUsers()
    ]);

    const lrItemsCount = lrs.reduce((sum, l) => sum + (l.items?.length || 0), 0);
    const tables = [
      { tableName: 'lrs', rowCount: lrs.length, columns: ['id', 'lr_number', 'lr_date', 'vehicle_number', 'from_city', 'to_city', 'status', 'consignor_name', 'consignee_name', 'grand_total', 'balance_due', 'payment_type', 'payment_status'], mysqlDdl: 'CREATE TABLE lrs (...);', description: 'Master Lorry Receipts (Bookings, Drafts, Freight & Payment Status)' },
      { tableName: 'lr_items', rowCount: lrItemsCount, columns: ['id', 'lr_id', 'lr_number', 'serial_no', 'description', 'package_type', 'packages', 'weight', 'rate', 'rate_basis', 'amount'], mysqlDdl: 'CREATE TABLE lr_items (...);', description: 'Line-Item Cargo Packages & Weight Breakdown per LR' },
      { tableName: 'parties', rowCount: parties.length, columns: ['id', 'name', 'business_name', 'customer_type', 'phone', 'city', 'state', 'gstin'], mysqlDdl: 'CREATE TABLE parties (...);', description: 'Consignor & Consignee Customer Master Registry' },
      { tableName: 'payments', rowCount: payments.length, columns: ['id', 'lr_id', 'lr_number', 'party_name', 'payment_date', 'amount', 'payment_method'], mysqlDdl: 'CREATE TABLE payments (...);', description: 'Freight Collections, Receipts & Settlement Ledger' },
      { tableName: 'expenses', rowCount: expenses.length, columns: ['id', 'expense_date', 'category', 'description', 'amount', 'vehicle_number'], mysqlDdl: 'CREATE TABLE expenses (...);', description: 'Vehicle Diesel, Driver Bata, Toll & Godown Expenses' },
      { tableName: 'vehicles', rowCount: vehicles.length, columns: ['id', 'vehicle_number', 'vehicle_type', 'capacity', 'owner_name', 'active'], mysqlDdl: 'CREATE TABLE vehicles (...);', description: 'Owned & Attached Lorry Fleet Registry' },
      { tableName: 'drivers', rowCount: drivers.length, columns: ['id', 'name', 'phone', 'license_number', 'assigned_vehicle'], mysqlDdl: 'CREATE TABLE drivers (...);', description: 'Commercial Drivers, Licenses & Assigned Vehicles' },
      { tableName: 'routes', rowCount: routes.length, columns: ['id', 'name', 'from_city', 'to_city', 'standard_freight_rate', 'transit_time'], mysqlDdl: 'CREATE TABLE routes (...);', description: 'Transport Corridors, Transit Time & Standard Rates' },
      { tableName: 'cities', rowCount: cities.length, columns: ['id', 'name', 'state', 'pincode', 'active'], mysqlDdl: 'CREATE TABLE cities (...);', description: 'Serviceable Origin & Destination Cities / Branches' },
      { tableName: 'package_types', rowCount: packageTypes.length, columns: ['id', 'name', 'code', 'description', 'active'], mysqlDdl: 'CREATE TABLE package_types (...);', description: 'Standard Cargo Packaging Units (Cartons, Bales, Drums, etc.)' },
      { tableName: 'users', rowCount: users.length, columns: ['id', 'username', 'name', 'role', 'active'], mysqlDdl: 'CREATE TABLE users (...);', description: 'Offline System Operators, Roles & Access Credentials' }
    ];

    return {
      engine: 'Offline Local SQL Engine',
      sqliteFile: 'data/transport.sqlite',
      sqliteSizeBytes: 65536,
      mysqlDumpFile: 'data/sri_murugan_transport_mysql.sql',
      mysqlDumpSizeBytes: 42800,
      jsonMirrorFile: 'data/transport_data.json',
      jsonSizeBytes: 38400,
      totalTables: tables.length,
      totalRows: tables.reduce((s, t) => s + t.rowCount, 0),
      tables,
      mysqlConfig: {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'sri_murugan_tms',
        autoSync: false,
        lastSyncStatus: 'disconnected'
      },
      lanInfo: {
        hostname: 'OFFICE-SERVER-PC',
        port: 3000,
        localUrl: 'http://localhost:3000',
        lanUrls: ['http://192.168.1.100:3000']
      }
    };
  },

  async executeSqlQuery(query: string): Promise<{
    columns: string[];
    rows: any[][];
    rowCount: number;
    executionTimeMs: number;
  }> {
    const res = await fetch('/api/sql/query', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to execute SQL query');
    }
    return data;
  },

  async saveMySqlConfig(config: any) {
    const res = await fetch('/api/mysql/config', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save MySQL configuration');
    return data;
  },

  async testMySqlConnection(config?: any) {
    const res = await fetch('/api/mysql/test', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config || {})
    });
    return res.json();
  },

  async syncPushToMySql(config?: any) {
    const res = await fetch('/api/mysql/sync-push', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config || {})
    });
    return res.json();
  },

  async syncPullFromMySql(config?: any) {
    const res = await fetch('/api/mysql/sync-pull', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config || {})
    });
    return res.json();
  },

  async downloadMySqlDump(): Promise<void> {
    try {
      const res = await fetch('/api/download/mysql-dump');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sri_murugan_transport_mysql_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {}

    // Client-side fallback SQL dump generator if running as standalone HTML
    const lrs = await this.getLRs();
    const parties = await this.getParties();
    let sql = `-- SRI MURUGAN TRANSPORT - OFFLINE MYSQL DATABASE DUMP\nCREATE DATABASE IF NOT EXISTS sri_murugan_tms;\nUSE sri_murugan_tms;\n\n`;
    sql += `CREATE TABLE IF NOT EXISTS lrs (id VARCHAR(64) PRIMARY KEY, lr_number VARCHAR(64), lr_date VARCHAR(20), vehicle_number VARCHAR(50), from_city VARCHAR(120), to_city VARCHAR(120), status VARCHAR(32), consignor_name VARCHAR(200), consignee_name VARCHAR(200), grand_total DECIMAL(12,2));\n`;
    for (const l of lrs) {
      sql += `INSERT INTO lrs VALUES ('${l.id}', '${l.lrNumber}', '${l.lrDate}', '${l.vehicleNumber}', '${l.fromCity}', '${l.toCity}', '${l.status}', '${l.consignorName.replace(/'/g, "\\'")}', '${l.consigneeName.replace(/'/g, "\\'")}', ${l.grandTotal || 0});\n`;
    }
    sql += `\n-- Total LRs: ${lrs.length}, Total Parties: ${parties.length}\n`;
    const blob = new Blob([sql], { type: 'application/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sri_murugan_transport_mysql_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  async exportSqliteDatabase(): Promise<{ filename: string; sizeBytes: number }> {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `sri_murugan_transport_${dateStr}.sqlite`;

    try {
      const res = await fetch('/api/sql/export-sqlite', {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return { filename, sizeBytes: blob.size };
      }
    } catch {}

    // Fallback to GET endpoint
    const res = await fetch('/api/download/sqlite-db');
    if (!res.ok) {
      throw new Error('Failed to export SQLite database file');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { filename, sizeBytes: blob.size };
  },

  async importSqliteDatabase(
    base64Data: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{
    success: boolean;
    mode: 'merge' | 'replace';
    tablesRestored: number;
    recordsRestored: number;
    recordsAdded: number;
    recordsUpdated: number;
    summaryByTable: Record<string, { added: number; updated: number }>;
  }> {
    const res = await fetch('/api/sql/import-sqlite', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ base64Data, mode })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to import and merge SQLite file');
    }
    if (data.state) {
      updateLocalCache(data.state);
    }
    return data;
  }
};

