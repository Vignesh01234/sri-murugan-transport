import React, { useState, useEffect } from 'react';
import { 
  Truck, UserCheck, MapPin, Navigation, Plus, 
  Search, Edit, Trash2, Calendar, Phone, CheckCircle, XCircle,
  Package, Boxes
} from 'lucide-react';
import type { Vehicle, Driver, City, Route, PackageType } from '../types/index';
import { api } from '../services/api';
import { VehicleModal, DriverModal, CityModal, RouteModal, PackageTypeModal } from '../components/MasterModals';

interface Props {
  initialTab?: 'vehicles' | 'drivers' | 'routes' | 'cities' | 'packageTypes';
}

export const FleetAndRouteMasterView: React.FC<Props> = ({ initialTab = 'vehicles' }) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers' | 'routes' | 'cities' | 'packageTypes'>(initialTab);
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [showCityModal, setShowCityModal] = useState(false);

  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const [showPackageTypeModal, setShowPackageTypeModal] = useState(false);
  const [editingPackageType, setEditingPackageType] = useState<PackageType | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [vehs, drvs, cts, rts, pkgs] = await Promise.all([
        api.getVehicles(),
        api.getDrivers(),
        api.getCities(),
        api.getRoutes(),
        api.getPackageTypes()
      ]);
      setVehicles(vehs);
      setDrivers(drvs);
      setCities(cts);
      setRoutes(rts);
      setPackageTypes(pkgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackageType = async (id: string) => {
    if (confirm('Delete package type from master registry?')) {
      await api.deletePackageType(id);
      setPackageTypes(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm('Delete vehicle record?')) {
      await api.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (confirm('Delete driver record?')) {
      await api.deleteDriver(id);
      setDrivers(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Fleet & Route Master Registries</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage transport vehicles, commercial drivers, dispatch corridors, and service cities.
          </p>
        </div>

        <div>
          {activeTab === 'vehicles' && (
            <button
              onClick={() => { setEditingVehicle(null); setShowVehicleModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span>+ Add Vehicle</span>
            </button>
          )}
          {activeTab === 'drivers' && (
            <button
              onClick={() => { setEditingDriver(null); setShowDriverModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span>+ Add Driver</span>
            </button>
          )}
          {activeTab === 'routes' && (
            <button
              onClick={() => { setEditingRoute(null); setShowRouteModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span>+ Add Route</span>
            </button>
          )}
          {activeTab === 'cities' && (
            <button
              onClick={() => setShowCityModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span>+ Add City</span>
            </button>
          )}
          {activeTab === 'packageTypes' && (
            <button
              onClick={() => { setEditingPackageType(null); setShowPackageTypeModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span>+ Add Package Type</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 bg-white px-4 pt-2 rounded-t-xl border-t border-l border-r overflow-x-auto">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'vehicles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Vehicles ({vehicles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'drivers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Drivers ({drivers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'routes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Routes & Corridors ({routes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cities')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'cities'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Service Cities ({cities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('packageTypes')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'packageTypes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Package Types ({packageTypes.length})</span>
        </button>
      </div>

      {/* TAB 1: VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4">Type & Capacity</th>
                  <th className="py-3 px-4">Owner Name & Phone</th>
                  <th className="py-3 px-4">Insurance Expiry</th>
                  <th className="py-3 px-4">Fitness Expiry</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-black text-slate-900 text-sm uppercase">
                      {v.vehicleNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{v.vehicleType}</div>
                      <div className="text-[11px] text-slate-500">{v.capacity}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{v.ownerName}</div>
                      <div className="text-[11px] text-slate-500">{v.ownerPhone || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {v.insuranceExpiry || 'Not set'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {v.fitnessExpiry || 'Not set'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        v.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {v.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditingVehicle(v); setShowVehicleModal(true); }}
                          className="p-1 text-slate-600 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVERS */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Licence Number</th>
                  <th className="py-3 px-4">Licence Expiry</th>
                  <th className="py-3 px-4">Assigned Vehicle</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      {d.name}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {d.phone}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {d.licenseNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {d.licenseExpiry || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-900 uppercase">
                      {d.assignedVehicle || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {d.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditingDriver(d); setShowDriverModal(true); }}
                          className="p-1 text-slate-600 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(d.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROUTES */}
      {activeTab === 'routes' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Route Name</th>
                  <th className="py-3 px-4">Origin (From)</th>
                  <th className="py-3 px-4">Destination (To)</th>
                  <th className="py-3 px-4">Std Rate (₹/kg)</th>
                  <th className="py-3 px-4">Transit Time</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {routes.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      {r.name}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {r.fromCity}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {r.toCity}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-800">
                      ₹{r.standardFreightRate?.toFixed(2)} / kg
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {r.transitTime || 'Standard'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => { setEditingRoute(r); setShowRouteModal(true); }}
                        className="p-1 text-slate-600 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CITIES */}
      {activeTab === 'cities' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
            {cities.map(c => (
              <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.state} {c.pincode ? `- ${c.pincode}` : ''}</div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PACKAGE TYPES */}
      {activeTab === 'packageTypes' && (
        <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Package Type Name</th>
                  <th className="py-3 px-4">Short Code / Symbol</th>
                  <th className="py-3 px-4">Description / Typical Cargo</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {packageTypes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No package types found. Click "+ Add Package Type" to register a custom type.
                    </td>
                  </tr>
                ) : (
                  packageTypes.map(pkg => (
                    <tr key={pkg.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Package className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{pkg.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {pkg.code ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-extrabold border border-slate-300">
                            {pkg.code}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        {pkg.description || <span className="text-slate-400 italic">Standard logistics parcel packaging</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {pkg.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            <XCircle className="w-3 h-3 text-slate-400" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPackageType(pkg);
                              setShowPackageTypeModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Package Type"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePackageType(pkg.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Package Type"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Master Modals */}
      {showPackageTypeModal && (
        <PackageTypeModal
          packageType={editingPackageType}
          onClose={() => setShowPackageTypeModal(false)}
          onSuccess={() => { setShowPackageTypeModal(false); loadAll(); }}
        />
      )}

      {showVehicleModal && (
        <VehicleModal
          vehicle={editingVehicle}
          onClose={() => setShowVehicleModal(false)}
          onSuccess={() => { setShowVehicleModal(false); loadAll(); }}
        />
      )}

      {showDriverModal && (
        <DriverModal
          driver={editingDriver}
          onClose={() => setShowDriverModal(false)}
          onSuccess={() => { setShowDriverModal(false); loadAll(); }}
        />
      )}

      {showRouteModal && (
        <RouteModal
          route={editingRoute}
          cities={cities}
          onClose={() => setShowRouteModal(false)}
          onSuccess={() => { setShowRouteModal(false); loadAll(); }}
        />
      )}

      {showCityModal && (
        <CityModal
          onClose={() => setShowCityModal(false)}
          onSuccess={() => { setShowCityModal(false); loadAll(); }}
        />
      )}
    </div>
  );
};
