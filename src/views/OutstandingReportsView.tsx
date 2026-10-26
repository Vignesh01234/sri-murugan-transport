import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, Download, Search, CheckCircle2, Clock, 
  AlertCircle, Filter, ArrowRight, Printer, Eye 
} from 'lucide-react';
import type { LR, CompanySettings } from '../types/index';
import { api } from '../services/api';
import { PaymentModal } from '../components/PaymentModal';
import { LRPrintModal } from '../components/LRPrintModal';

interface Props {
  settings: CompanySettings;
  currentUser: string;
  initialType?: 'topay' | 'paid' | 'collection';
}

export const OutstandingReportsView: React.FC<Props> = ({ settings, currentUser, initialType = 'topay' }) => {
  const [reportType, setReportType] = useState<'topay' | 'paid' | 'collection'>(initialType);
  const [lrs, setLrs] = useState<LR[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [selectedLrForPay, setSelectedLrForPay] = useState<LR | null>(null);
  const [printModalLR, setPrintModalLR] = useState<LR | null>(null);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getLRs({ startDate, endDate });
      setLrs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter based on report type
  const filteredList = lrs.filter(l => {
    if (l.status === 'Cancelled') return false;

    if (reportType === 'topay') {
      // Unpaid or partially paid To Pay LRs
      if (l.paymentType !== 'To Pay' || l.paymentStatus === 'Paid') return false;
    } else if (reportType === 'paid') {
      // Fully paid LRs
      if (l.paymentStatus !== 'Paid') return false;
    }
    // 'collection' shows all active LRs with freight and collection status

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.lrNumber.toLowerCase().includes(q) ||
        l.consignorName.toLowerCase().includes(q) ||
        l.consigneeName.toLowerCase().includes(q) ||
        l.fromCity.toLowerCase().includes(q) ||
        l.toCity.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalGrandTotal = filteredList.reduce((sum, l) => sum + l.grandTotal, 0);
  const totalPaidAmount = filteredList.reduce((sum, l) => sum + l.paidAmount, 0);
  const totalBalanceDue = filteredList.reduce((sum, l) => sum + l.balanceDue, 0);

  const handleExportCSV = () => {
    if (filteredList.length === 0) return;
    const headers = ['LR Number', 'Date', 'From', 'To', 'Responsible Party', 'Total (INR)', 'Paid (INR)', 'Balance Due (INR)', 'Type', 'Status'];
    const rows = filteredList.map(l => [
      `"${l.lrNumber}"`,
      `"${l.lrDate}"`,
      `"${l.fromCity}"`,
      `"${l.toCity}"`,
      `"${(l.paymentType === 'To Pay' ? l.consigneeName : l.consignorName).replace(/"/g, '""')}"`,
      l.grandTotal,
      l.paidAmount,
      l.balanceDue,
      `"${l.paymentType}"`,
      `"${l.paymentStatus}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {reportType === 'topay' && 'To Pay Outstanding Receivables Report'}
            {reportType === 'paid' && 'Paid LRs & Freight Settlement Report'}
            {reportType === 'collection' && 'Freight Collection & Billed Revenue Report'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial audit derived from saved LR records and verified cash receipts.
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
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex border-b border-slate-200 gap-2 bg-white px-4 pt-2 rounded-t-xl border-t border-l border-r">
        <button
          onClick={() => setReportType('topay')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            reportType === 'topay'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>To Pay Outstanding</span>
        </button>

        <button
          onClick={() => setReportType('paid')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            reportType === 'paid'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Paid LRs Report</span>
        </button>

        <button
          onClick={() => setReportType('collection')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            reportType === 'collection'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Freight Collection Summary</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Consignments Count
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {filteredList.length} LRs
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Freight Billed
          </span>
          <span className="text-xl font-black text-blue-900 mt-1 block">
            ₹{totalGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Cash Collected
          </span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">
            ₹{totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Pending Balance Due
          </span>
          <span className={`text-xl font-black mt-1 block ${totalBalanceDue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            ₹{totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search report by LR Number, Consignor, Consignee, or City..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            title="From Date"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            title="To Date"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">LR No & Date</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Responsible Party</th>
                <th className="py-3 px-4 text-center">Payment Type</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">Loading records...</td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No matching records found for this criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map(lr => (
                  <tr key={lr.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-black text-blue-900">{lr.lrNumber}</div>
                      <div className="text-[11px] text-slate-500">{lr.lrDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{lr.fromCity} → {lr.toCity}</div>
                      <div className="text-[11px] text-slate-500 uppercase">{lr.vehicleNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {lr.paymentType === 'To Pay' ? lr.consigneeName : lr.consignorName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {lr.paymentType === 'To Pay' ? 'Consignee (Receiver)' : 'Consignor (Sender)'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        lr.paymentType === 'To Pay' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {lr.paymentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      ₹{lr.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      ₹{lr.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">
                      ₹{lr.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lr.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {lr.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {lr.balanceDue > 0 && (
                          <button
                            onClick={() => setSelectedLrForPay(lr)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
                          >
                            Receive
                          </button>
                        )}
                        <button
                          onClick={() => setPrintModalLR(lr)}
                          className="p-1 text-slate-600 hover:text-blue-600"
                          title="Print LR"
                        >
                          <Printer className="w-4 h-4" />
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

      {selectedLrForPay && (
        <PaymentModal
          lr={selectedLrForPay}
          currentUser={currentUser}
          onClose={() => setSelectedLrForPay(null)}
          onSuccess={() => {
            setSelectedLrForPay(null);
            loadData();
          }}
        />
      )}

      {printModalLR && (
        <LRPrintModal
          lr={printModalLR}
          settings={settings}
          onClose={() => setPrintModalLR(null)}
        />
      )}
    </div>
  );
};
