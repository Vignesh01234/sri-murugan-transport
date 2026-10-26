import React, { useState, useEffect } from 'react';
import { 
  Truck, FileText, IndianRupee, Clock, CheckCircle2, 
  AlertCircle, ArrowUpRight, TrendingUp, Package, Weight, 
  Plus, Printer, Navigation, ChevronRight, FileClock 
} from 'lucide-react';
import type { CompanySettings, LR, Payment } from '../types/index';
import { api } from '../services/api';
import { LRPrintModal } from '../components/LRPrintModal';
import { TransportLogo } from '../components/TransportLogo';

interface Props {
  settings: CompanySettings;
  currentUser: string;
  onNavigate: (view: string) => void;
  onEditLR: (lr: LR) => void;
}

export const DashboardView: React.FC<Props> = ({ settings, currentUser, onNavigate, onEditLR }) => {
  const [stats, setStats] = useState<any>(null);
  const [draftLRs, setDraftLRs] = useState<LR[]>([]);
  const [loading, setLoading] = useState(true);
  const [printLR, setPrintLR] = useState<LR | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [data, lrs] = await Promise.all([
        api.getDashboardStats(),
        api.getLRs()
      ]);
      setStats(data);
      setDraftLRs(lrs.filter(l => l.status === 'Draft'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-xs shadow-inner">
            <TransportLogo settings={settings} size="lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-blue-500/30 text-blue-300 border border-blue-400/30">
                Live Operations Terminal
              </span>
              <span className="text-xs text-slate-400">South India Daily Cargo Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1.5 tracking-tight">
              {settings.companyName || 'SRI MURUGAN TRANSPORT'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {settings.tagline || 'Prompt, Safe & Reliable Daily Cargo Services Across South India'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate('create-lr')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New LR</span>
          </button>
          <button
            onClick={() => onNavigate('print-reprint')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Reprint LR</span>
          </button>
        </div>
      </div>

      {/* Draft Consignments Attention Banner */}
      {draftLRs.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              <FileClock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-amber-950">
                  {draftLRs.length} Unbooked Draft Consignment{draftLRs.length > 1 ? 's' : ''} Pending
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-200 text-amber-900 border border-amber-300">
                  Pending Finalization
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Consignments saved as drafts on local disk. Review goods, enter vehicles, or finalize to assign official booking serials.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('lr-database')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <span>View Pending Drafts ({draftLRs.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Bookings */}
        <div 
          onClick={() => onNavigate('daily-report')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Bookings</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.totalLRsToday || 0} <span className="text-xs font-semibold text-slate-400">LRs</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>This month:</span>
            <strong className="text-slate-800">{stats?.totalLRsThisMonth || 0} LRs</strong>
          </div>
        </div>

        {/* Total Freight Billed */}
        <div 
          onClick={() => onNavigate('collection-report')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Freight Billed</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{(stats?.totalFreightBilled || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Active revenue billed
          </div>
        </div>

        {/* Payments Collected */}
        <div 
          onClick={() => onNavigate('payment-entry')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Payments Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ₹{(stats?.totalPaymentsCollected || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Verified cash / UPI receipts
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div 
          onClick={() => onNavigate('topay-outstanding')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-rose-400 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Outstanding Due</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            ₹{(stats?.totalOutstandingBalance || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">
            {stats?.toPayLRsCount || 0} To Pay consignments pending
          </div>
        </div>
      </div>

      {/* Secondary Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Packages</span>
            <span className="text-lg font-black text-slate-900">{stats?.totalPackagesBooked || 0} Pkgs</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
            <Weight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Weight Booked</span>
            <span className="text-lg font-black text-slate-900">{stats?.totalWeightBooked || 0} kg</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Active In-Transit</span>
            <span className="text-lg font-black text-indigo-900">{stats?.inTransitLRsCount || 0} Vehicles</span>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Fleet Expenses</span>
            <span className="text-lg font-black text-amber-900">₹{(stats?.totalExpenses || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Route-wise Volume & Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Routes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Top Corridors & Booking Routes</span>
              </h2>
              <button 
                onClick={() => onNavigate('operational-reports')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {stats?.routeSummary && stats.routeSummary.length > 0 ? (
                stats.routeSummary.map((r: any) => (
                  <div key={r.route} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center font-bold text-xs text-slate-800">
                      <span>{r.route}</span>
                      <span className="text-blue-900">₹{r.freight.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                      <span>{r.count} Bookings</span>
                      <span>{r.weight} kg Total</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">No route statistics yet.</div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('fleet-master')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
            >
              Manage Fleet & Corridors
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Recent LRs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Recent Lorry Receipts</span>
            </h2>
            <button 
              onClick={() => onNavigate('lr-database')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              <span>Full LR Database</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-bold text-slate-500 uppercase border-b">
                <tr>
                  <th className="py-2 px-2">LR No</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Route</th>
                  <th className="py-2 px-2">Consignor</th>
                  <th className="py-2 px-2 text-right">Grand Total</th>
                  <th className="py-2 px-2 text-center">Type</th>
                  <th className="py-2 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentLRs?.map((lr: LR) => (
                  <tr key={lr.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2 font-black text-blue-900">{lr.lrNumber}</td>
                    <td className="py-2.5 px-2 text-slate-500">{lr.lrDate}</td>
                    <td className="py-2.5 px-2 font-medium">{lr.fromCity} → {lr.toCity}</td>
                    <td className="py-2.5 px-2 truncate max-w-[130px]">{lr.consignorName}</td>
                    <td className="py-2.5 px-2 text-right font-black text-slate-900">
                      ₹{lr.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 uppercase">
                        {lr.paymentType}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => setPrintLR(lr)}
                        className="p-1 text-slate-500 hover:text-blue-600"
                        title="Print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {printLR && (
        <LRPrintModal
          lr={printLR}
          settings={settings}
          onClose={() => setPrintLR(null)}
        />
      )}
    </div>
  );
};
