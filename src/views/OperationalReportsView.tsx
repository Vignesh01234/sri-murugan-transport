import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Calendar, Download, Printer, Filter, 
  MapPin, Truck, Users, TrendingUp, AlertOctagon, CheckCircle2 
} from 'lucide-react';
import type { LR, CompanySettings } from '../types/index';
import { api } from '../services/api';

interface Props {
  settings: CompanySettings;
  defaultMode?: 'daily' | 'monthly' | 'route' | 'analytics';
}

export const OperationalReportsView: React.FC<Props> = ({ settings, defaultMode = 'daily' }) => {
  const [mode, setMode] = useState<'daily' | 'monthly' | 'route' | 'party' | 'vehicle' | 'cancelled'>(
    defaultMode === 'daily' ? 'daily' : defaultMode === 'monthly' ? 'monthly' : 'route'
  );

  const [lrs, setLrs] = useState<LR[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getLRs();
      setLrs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Daily Report Dataset
  const dailyRecords = useMemo(() => {
    return lrs.filter(l => l.lrDate === selectedDate);
  }, [lrs, selectedDate]);

  // 2. Monthly Report Dataset
  const monthlyRecords = useMemo(() => {
    return lrs.filter(l => l.lrDate.startsWith(selectedMonth));
  }, [lrs, selectedMonth]);

  // 3. Route-wise Summary
  const routeSummary = useMemo(() => {
    const map: Record<string, { count: number; packages: number; weight: number; freight: number; paid: number; balance: number }> = {};
    for (const l of lrs.filter(x => x.status !== 'Cancelled')) {
      const key = `${l.fromCity} → ${l.toCity}`;
      if (!map[key]) {
        map[key] = { count: 0, packages: 0, weight: 0, freight: 0, paid: 0, balance: 0 };
      }
      map[key].count++;
      map[key].packages += l.totalPackages || 0;
      map[key].weight += l.totalWeight || 0;
      map[key].freight += l.grandTotal || 0;
      map[key].paid += l.paidAmount || 0;
      map[key].balance += l.balanceDue || 0;
    }
    return Object.entries(map).map(([route, stats]) => ({ route, ...stats })).sort((a, b) => b.freight - a.freight);
  }, [lrs]);

  // 4. Party-wise Summary (Consignors & Consignees)
  const partySummary = useMemo(() => {
    const map: Record<string, { role: string; count: number; freight: number; paid: number; balance: number }> = {};
    for (const l of lrs.filter(x => x.status !== 'Cancelled')) {
      // Consignor
      const cKey = `${l.consignorName} (Sender)`;
      if (!map[cKey]) map[cKey] = { role: 'Consignor', count: 0, freight: 0, paid: 0, balance: 0 };
      map[cKey].count++;
      map[cKey].freight += l.grandTotal;

      // Consignee
      const rKey = `${l.consigneeName} (Receiver)`;
      if (!map[rKey]) map[rKey] = { role: 'Consignee', count: 0, freight: 0, paid: 0, balance: 0 };
      map[rKey].count++;
      map[rKey].freight += l.grandTotal;
    }
    return Object.entries(map).map(([party, stats]) => ({ party, ...stats })).sort((a, b) => b.freight - a.freight);
  }, [lrs]);

  // 5. Vehicle-wise Summary
  const vehicleSummary = useMemo(() => {
    const map: Record<string, { count: number; weight: number; freight: number }> = {};
    for (const l of lrs.filter(x => x.status !== 'Cancelled')) {
      const v = l.vehicleNumber || 'Unassigned';
      if (!map[v]) map[v] = { count: 0, weight: 0, freight: 0 };
      map[v].count++;
      map[v].weight += l.totalWeight || 0;
      map[v].freight += l.grandTotal || 0;
    }
    return Object.entries(map).map(([vehicle, stats]) => ({ vehicle, ...stats })).sort((a, b) => b.freight - a.freight);
  }, [lrs]);

  // 6. Cancelled LRs
  const cancelledRecords = useMemo(() => {
    return lrs.filter(l => l.status === 'Cancelled');
  }, [lrs]);

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];

    if (mode === 'daily') {
      headers = ['LR Number', 'Date', 'From', 'To', 'Vehicle', 'Packages', 'Weight', 'Freight', 'Status'];
      rows = dailyRecords.map(l => [`"${l.lrNumber}"`, `"${l.lrDate}"`, `"${l.fromCity}"`, `"${l.toCity}"`, `"${l.vehicleNumber}"`, l.totalPackages, l.totalWeight, l.grandTotal, `"${l.status}"`]);
    } else if (mode === 'monthly') {
      headers = ['LR Number', 'Date', 'From', 'To', 'Vehicle', 'Consignor', 'Freight', 'Paid', 'Balance'];
      rows = monthlyRecords.map(l => [`"${l.lrNumber}"`, `"${l.lrDate}"`, `"${l.fromCity}"`, `"${l.toCity}"`, `"${l.vehicleNumber}"`, `"${l.consignorName}"`, l.grandTotal, l.paidAmount, l.balanceDue]);
    } else if (mode === 'route') {
      headers = ['Route Corridor', 'Consignments', 'Total Packages', 'Total Weight (kg)', 'Total Freight (INR)'];
      rows = routeSummary.map(r => [`"${r.route}"`, r.count, r.packages, r.weight, r.freight]);
    } else if (mode === 'cancelled') {
      headers = ['LR Number', 'Date', 'Route', 'Vehicle', 'Reason'];
      rows = cancelledRecords.map(l => [`"${l.lrNumber}"`, `"${l.lrDate}"`, `"${l.fromCity} to ${l.toCity}"`, `"${l.vehicleNumber}"`, `"${l.cancelReason || 'Cancelled'}"`]);
    }

    if (rows.length === 0) return;
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `${mode}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Transport Operational Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated business intelligence derived directly from saved live database records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Report CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-200 gap-2 bg-white px-4 pt-2 rounded-t-xl border-t border-l border-r no-print overflow-x-auto">
        <button
          onClick={() => setMode('daily')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            mode === 'daily' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily LR Report
        </button>

        <button
          onClick={() => setMode('monthly')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            mode === 'monthly' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly LR Report
        </button>

        <button
          onClick={() => setMode('route')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            mode === 'route' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Route-wise Report
        </button>

        <button
          onClick={() => setMode('party')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            mode === 'party' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Party-wise Report
        </button>

        <button
          onClick={() => setMode('vehicle')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            mode === 'vehicle' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Vehicle-wise Report
        </button>

        <button
          onClick={() => setMode('cancelled')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
            mode === 'cancelled' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Cancelled LRs Audit ({cancelledRecords.length})
        </button>
      </div>

      {/* Controls for Daily & Monthly */}
      {mode === 'daily' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 no-print">
          <label className="text-xs font-bold text-slate-700 uppercase">Select Target Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg"
          />
          <span className="text-xs text-slate-500">
            Found {dailyRecords.length} consignments booked on {selectedDate}
          </span>
        </div>
      )}

      {mode === 'monthly' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 no-print">
          <label className="text-xs font-bold text-slate-700 uppercase">Select Month & Year:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg"
          />
          <span className="text-xs text-slate-500">
            Found {monthlyRecords.length} consignments booked in {selectedMonth}
          </span>
        </div>
      )}

      {/* REPORT CONTENT VIEWS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden printable-area">
        {/* Printable Title */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm uppercase">
              {mode === 'daily' && `Sri Murugan Transport — Daily Consignment Report (${selectedDate})`}
              {mode === 'monthly' && `Sri Murugan Transport — Monthly Consignment Report (${selectedMonth})`}
              {mode === 'route' && 'Sri Murugan Transport — Route-wise Booking Performance'}
              {mode === 'party' && 'Sri Murugan Transport — Party & Customer Performance'}
              {mode === 'vehicle' && 'Sri Murugan Transport — Vehicle-wise Dispatch Summary'}
              {mode === 'cancelled' && 'Sri Murugan Transport — Cancelled LRs Audit Trail'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Generated: {new Date().toLocaleDateString('en-IN')}
          </span>
        </div>

        {/* 1. Daily Report Table */}
        {mode === 'daily' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b">
                <tr>
                  <th className="py-2.5 px-4">LR Number</th>
                  <th className="py-2.5 px-4">Vehicle</th>
                  <th className="py-2.5 px-4">Route</th>
                  <th className="py-2.5 px-4">Consignor</th>
                  <th className="py-2.5 px-4">Consignee</th>
                  <th className="py-2.5 px-3 text-center">Pkgs</th>
                  <th className="py-2.5 px-3 text-right">Weight</th>
                  <th className="py-2.5 px-4 text-right">Freight (₹)</th>
                  <th className="py-2.5 px-4 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dailyRecords.length === 0 ? (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-500">No consignments on this date.</td></tr>
                ) : (
                  dailyRecords.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-black text-blue-900">{l.lrNumber}</td>
                      <td className="py-2.5 px-4 font-semibold uppercase">{l.vehicleNumber}</td>
                      <td className="py-2.5 px-4">{l.fromCity} → {l.toCity}</td>
                      <td className="py-2.5 px-4 font-medium">{l.consignorName}</td>
                      <td className="py-2.5 px-4">{l.consigneeName}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{l.totalPackages}</td>
                      <td className="py-2.5 px-3 text-right">{l.totalWeight} kg</td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900">₹{l.grandTotal.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">{l.paymentType}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Monthly Report Table */}
        {mode === 'monthly' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b">
                <tr>
                  <th className="py-2.5 px-4">LR No</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Route</th>
                  <th className="py-2.5 px-4">Consignor</th>
                  <th className="py-2.5 px-4 text-right">Freight Billed</th>
                  <th className="py-2.5 px-4 text-right">Paid</th>
                  <th className="py-2.5 px-4 text-right">Balance Due</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthlyRecords.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-500">No consignments found for this month.</td></tr>
                ) : (
                  monthlyRecords.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-black text-blue-900">{l.lrNumber}</td>
                      <td className="py-2.5 px-4 text-slate-600">{l.lrDate}</td>
                      <td className="py-2.5 px-4 font-medium">{l.fromCity} → {l.toCity}</td>
                      <td className="py-2.5 px-4">{l.consignorName}</td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900">₹{l.grandTotal.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-700">₹{l.paidAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-600">₹{l.balanceDue.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">{l.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Route-wise Summary */}
        {mode === 'route' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b">
                <tr>
                  <th className="py-2.5 px-4">Route Corridor</th>
                  <th className="py-2.5 px-4 text-center">Total Bookings</th>
                  <th className="py-2.5 px-4 text-center">Total Packages</th>
                  <th className="py-2.5 px-4 text-right">Total Weight (kg)</th>
                  <th className="py-2.5 px-4 text-right">Total Freight (₹)</th>
                  <th className="py-2.5 px-4 text-right">Collected (₹)</th>
                  <th className="py-2.5 px-4 text-right">Outstanding (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {routeSummary.map(r => (
                  <tr key={r.route} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{r.route}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-blue-900">{r.count} LRs</td>
                    <td className="py-2.5 px-4 text-center">{r.packages}</td>
                    <td className="py-2.5 px-4 text-right font-semibold">{r.weight} kg</td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">₹{r.freight.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">₹{r.paid.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-600">₹{r.balance.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Party-wise Summary */}
        {mode === 'party' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b">
                <tr>
                  <th className="py-2.5 px-4">Party & Role</th>
                  <th className="py-2.5 px-4 text-center">Role</th>
                  <th className="py-2.5 px-4 text-center">Bookings Count</th>
                  <th className="py-2.5 px-4 text-right">Total Freight Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {partySummary.map(p => (
                  <tr key={p.party} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{p.party}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">{p.role}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold">{p.count}</td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">₹{p.freight.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Vehicle-wise Summary */}
        {mode === 'vehicle' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b">
                <tr>
                  <th className="py-2.5 px-4">Vehicle Number</th>
                  <th className="py-2.5 px-4 text-center">Trips / LRs Handled</th>
                  <th className="py-2.5 px-4 text-right">Total Cargo Carried (kg)</th>
                  <th className="py-2.5 px-4 text-right">Total Freight Billed (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vehicleSummary.map(v => (
                  <tr key={v.vehicle} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-black uppercase text-slate-900">{v.vehicle}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-blue-900">{v.count}</td>
                    <td className="py-2.5 px-4 text-right font-semibold">{v.weight} kg</td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">₹{v.freight.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Cancelled LRs Table */}
        {mode === 'cancelled' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-rose-50 text-rose-900 font-bold uppercase text-[11px] border-b border-rose-200">
                <tr>
                  <th className="py-2.5 px-4">LR Number</th>
                  <th className="py-2.5 px-4">Booking Date</th>
                  <th className="py-2.5 px-4">Route</th>
                  <th className="py-2.5 px-4">Consignor</th>
                  <th className="py-2.5 px-4 text-right">Original Value</th>
                  <th className="py-2.5 px-4">Cancellation Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cancelledRecords.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">No cancelled LRs on record.</td></tr>
                ) : (
                  cancelledRecords.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-black text-rose-900 line-through">{l.lrNumber}</td>
                      <td className="py-2.5 px-4 text-slate-600">{l.lrDate}</td>
                      <td className="py-2.5 px-4">{l.fromCity} → {l.toCity}</td>
                      <td className="py-2.5 px-4 font-medium">{l.consignorName}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-500">₹{l.grandTotal.toFixed(2)}</td>
                      <td className="py-2.5 px-4 font-semibold text-rose-700">{l.cancelReason || 'Cancelled by staff'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
