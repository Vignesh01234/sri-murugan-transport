import React, { useState } from 'react';
import { X, Truck, UserCheck, MapPin, Navigation, Receipt, Check, Package, Boxes } from 'lucide-react';
import type { Vehicle, Driver, City, Route, Expense, PackageType } from '../types/index';
import { api } from '../services/api';

// --- VEHICLE MODAL ---
interface VehicleModalProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSuccess: (v: Vehicle) => void;
}
export const VehicleModal: React.FC<VehicleModalProps> = ({ vehicle, onClose, onSuccess }) => {
  const [vehicleNumber, setVehicleNumber] = useState(vehicle?.vehicleNumber || '');
  const [vehicleType, setVehicleType] = useState(vehicle?.vehicleType || 'Tata 1109');
  const [capacity, setCapacity] = useState(vehicle?.capacity || '9.0 Ton');
  const [ownerName, setOwnerName] = useState(vehicle?.ownerName || 'Self / Own Fleet');
  const [ownerPhone, setOwnerPhone] = useState(vehicle?.ownerPhone || '');
  const [insuranceExpiry, setInsuranceExpiry] = useState(vehicle?.insuranceExpiry || '');
  const [fitnessExpiry, setFitnessExpiry] = useState(vehicle?.fitnessExpiry || '');
  const [active, setActive] = useState(vehicle ? vehicle.active : true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = await api.saveVehicle({
        id: vehicle?.id,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType,
        capacity,
        ownerName,
        ownerPhone,
        insuranceExpiry,
        fitnessExpiry,
        active
      });
      onSuccess(saved);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. TN 23 BX 4589"
              value={vehicleNumber}
              onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 font-bold uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle Type</label>
              <input
                type="text"
                placeholder="e.g. Eicher 17ft"
                value={vehicleType}
                onChange={e => setVehicleType(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Load Capacity</label>
              <input
                type="text"
                placeholder="e.g. 7.5 Ton"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Owner Phone</label>
              <input
                type="text"
                value={ownerPhone}
                onChange={e => setOwnerPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Insurance Expiry</label>
              <input
                type="date"
                value={insuranceExpiry}
                onChange={e => setInsuranceExpiry(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fitness Expiry</label>
              <input
                type="date"
                value={fitnessExpiry}
                onChange={e => setFitnessExpiry(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm">
              {loading ? 'Saving...' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- DRIVER MODAL ---
interface DriverModalProps {
  driver?: Driver | null;
  onClose: () => void;
  onSuccess: (d: Driver) => void;
}
export const DriverModal: React.FC<DriverModalProps> = ({ driver, onClose, onSuccess }) => {
  const [name, setName] = useState(driver?.name || '');
  const [phone, setPhone] = useState(driver?.phone || '');
  const [licenseNumber, setLicenseNumber] = useState(driver?.licenseNumber || '');
  const [licenseExpiry, setLicenseExpiry] = useState(driver?.licenseExpiry || '');
  const [address, setAddress] = useState(driver?.address || '');
  const [assignedVehicle, setAssignedVehicle] = useState(driver?.assignedVehicle || '');
  const [active, setActive] = useState(driver ? driver.active : true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = await api.saveDriver({
        id: driver?.id,
        name,
        phone,
        licenseNumber,
        licenseExpiry,
        address,
        assignedVehicle,
        active
      });
      onSuccess(saved);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">{driver ? 'Edit Driver' : 'Add Driver'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Driver Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. K. Rajendran"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 98401 12233"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Licence Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value.toUpperCase())}
                placeholder="TN0220140029"
                className="w-full px-3 py-2 text-sm border rounded-lg uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Licence Expiry</label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={e => setLicenseExpiry(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Vehicle</label>
            <input
              type="text"
              value={assignedVehicle}
              onChange={e => setAssignedVehicle(e.target.value.toUpperCase())}
              placeholder="e.g. TN 23 BX 4589"
              className="w-full px-3 py-2 text-sm border rounded-lg uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Driver Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Ranipet, Tamil Nadu"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm">
              {loading ? 'Saving...' : 'Save Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- CITY MODAL ---
interface CityModalProps {
  onClose: () => void;
  onSuccess: (c: City) => void;
}
export const CityModal: React.FC<CityModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const saved = await api.saveCity({ name: name.trim(), state, pincode });
      onSuccess(saved);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Add New City</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Hosur"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pincode (Optional)</label>
            <input
              type="text"
              value={pincode}
              onChange={e => setPincode(e.target.value)}
              placeholder="635109"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm">
              {loading ? 'Adding...' : 'Add City'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ROUTE MODAL ---
interface RouteModalProps {
  route?: Route | null;
  cities: City[];
  onClose: () => void;
  onSuccess: (r: Route) => void;
}
export const RouteModal: React.FC<RouteModalProps> = ({ route, cities, onClose, onSuccess }) => {
  const [fromCity, setFromCity] = useState(route?.fromCity || (cities[0]?.name || ''));
  const [toCity, setToCity] = useState(route?.toCity || (cities[1]?.name || ''));
  const [name, setName] = useState(route?.name || '');
  const [standardFreightRate, setStandardFreightRate] = useState(route ? String(route.standardFreightRate) : '2.0');
  const [transitTime, setTransitTime] = useState(route?.transitTime || '6 Hours');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = await api.saveRoute({
        id: route?.id,
        name: name.trim() || `${fromCity} - ${toCity}`,
        fromCity,
        toCity,
        standardFreightRate: Number(standardFreightRate) || 0,
        transitTime
      });
      onSuccess(saved);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">{route ? 'Edit Route' : 'Add Route'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">From City *</label>
              <input
                type="text"
                required
                value={fromCity}
                onChange={e => setFromCity(e.target.value)}
                placeholder="Origin"
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">To City *</label>
              <input
                type="text"
                required
                value={toCity}
                onChange={e => setToCity(e.target.value)}
                placeholder="Destination"
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Route Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Chennai - Madurai Express"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Std Rate (₹/kg)</label>
              <input
                type="number"
                step="0.1"
                value={standardFreightRate}
                onChange={e => setStandardFreightRate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transit Time</label>
              <input
                type="text"
                value={transitTime}
                onChange={e => setTransitTime(e.target.value)}
                placeholder="e.g. 5 Hours"
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm">
              {loading ? 'Saving...' : 'Save Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- EXPENSE MODAL ---
interface ExpenseModalProps {
  expense?: Expense | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSuccess: (e: Expense) => void;
}
export const ExpenseModal: React.FC<ExpenseModalProps> = ({ expense, vehicles, onClose, onSuccess }) => {
  const [expenseDate, setExpenseDate] = useState(expense?.expenseDate || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Expense['category']>(expense?.category || 'Fuel');
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [vehicleNumber, setVehicleNumber] = useState(expense?.vehicleNumber || '');
  const [route, setRoute] = useState(expense?.route || '');
  const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>(expense?.paymentMethod || 'Cash');
  const [referenceNumber, setReferenceNumber] = useState(expense?.referenceNumber || '');
  const [remarks, setRemarks] = useState(expense?.remarks || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = await api.saveExpense({
        id: expense?.id,
        expenseDate,
        category,
        description,
        amount: Number(amount) || 0,
        vehicleNumber,
        route,
        paymentMethod,
        referenceNumber,
        remarks
      });
      onSuccess(saved);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">{expense ? 'Edit Operational Expense' : 'Add Operational Expense'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
              >
                <option value="Fuel">Fuel (Diesel/Petrol)</option>
                <option value="Toll">Toll Plaza / Fastag</option>
                <option value="Maintenance">Vehicle Maintenance & Spares</option>
                <option value="Driver Allowance">Driver Batta & Allowance</option>
                <option value="Loading Labour">Loading / Hamali Labour</option>
                <option value="Police & RTO">Police / RTO / Weighbridge</option>
                <option value="Office & Admin">Office Rent & Admin</option>
                <option value="Other">Other Expenses</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. 50L Diesel at Indian Oil Ranipet"
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm font-bold border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle (Optional)</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="TN 23 BX 4589"
                className="w-full px-3 py-2 text-sm border rounded-lg uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ref / Bill No.</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="Bill #1209"
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm">
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- PACKAGE TYPE MODAL ---
interface PackageTypeModalProps {
  packageType?: PackageType | null;
  onClose: () => void;
  onSuccess: (pkg: PackageType) => void;
}
export const PackageTypeModal: React.FC<PackageTypeModalProps> = ({ packageType, onClose, onSuccess }) => {
  const [name, setName] = useState(packageType?.name || '');
  const [code, setCode] = useState(packageType?.code || '');
  const [description, setDescription] = useState(packageType?.description || '');
  const [active, setActive] = useState(packageType ? packageType.active : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Package type name is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const saved = await api.savePackageType({
        id: packageType?.id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        active
      });
      onSuccess(saved);
    } catch (err: any) {
      setError(err.message || 'Failed to save package type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">{packageType ? 'Edit Package Type' : 'Add Package Type'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Package Type Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Wooden Boxes, Steel Coils, Jumbo Bags"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Short Code / Symbol</label>
              <input
                type="text"
                placeholder="e.g. WBX, COIL, JMB"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm border rounded-lg uppercase font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={active ? 'true' : 'false'}
                onChange={e => setActive(e.target.value === 'true')}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Cargo Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Standard usage, handling precautions, or packaging specs"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            />
          </div>
          <div className="pt-3 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
              {loading ? 'Saving...' : 'Save Package Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
