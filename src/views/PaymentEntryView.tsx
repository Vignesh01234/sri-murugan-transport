import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, Search, Calendar, Download, Trash2, Printer, CheckCircle } from 'lucide-react';
import type { Payment, LR, CompanySettings } from '../types/index';
import { api } from '../services/api';
import { PaymentModal } from '../components/PaymentModal';

interface Props {
  settings: CompanySettings;
  currentUser: string;
}

export const PaymentEntryView: React.FC<Props> = ({ settings, currentUser }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allLrs, setAllLrs] = useState<LR[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLrForPay, setSelectedLrForPay] = useState<LR | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pays, lrs] = await Promise.all([
        api.getPayments(),
        api.getLRs()
      ]);
      setPayments(pays);
      setAllLrs(lrs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment record? The LR balance will be automatically recalculated.')) {
      await api.deletePayment(id);
      loadData();
    }
  };

  const filteredPayments = payments.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.lrNumber.toLowerCase().includes(q) ||
      p.partyName.toLowerCase().includes(q) ||
      p.paymentMethod.toLowerCase().includes(q) ||
      (p.transactionRef && p.transactionRef.toLowerCase().includes(q))
    );
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    const headers = ['Payment ID', 'LR Number', 'Party Name', 'Date', 'Amount (INR)', 'Method', 'Reference', 'Received By'];
    const rows = payments.map(p => [
      `"${p.id}"`,
      `"${p.lrNumber}"`,
      `"${p.partyName.replace(/"/g, '""')}"`,
      `"${p.paymentDate}"`,
      p.amount,
      `"${p.paymentMethod}"`,
      `"${p.transactionRef || ''}"`,
      `"${p.receivedBy}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Payment Collection & Receipt Entry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Record cash, UPI, bank transfer, and cheque collections against booked and delivered LRs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Receipts</span>
          </button>
          <button
            onClick={() => { setSelectedLrForPay(null); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record New Payment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Payments Recorded
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {filteredPayments.length} Receipts
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Amount Collected
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Pending To Pay LRs
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {allLrs.filter(l => l.paymentType === 'To Pay' && l.paymentStatus !== 'Paid' && l.status !== 'Cancelled').length} Consignments
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search payments by LR Number, Customer/Party Name, Method, or Reference..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">LR Number</th>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4">Method & Reference</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4">Received By</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {p.paymentDate}
                    </td>
                    <td className="py-3 px-4 font-black text-blue-900">
                      {p.lrNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.partyName}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                      ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border">
                        {p.paymentMethod}
                      </span>
                      {p.transactionRef && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-xs">
                          Ref: {p.transactionRef}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 italic text-[11px]">
                      {p.remarks || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium text-[11px]">
                      {p.receivedBy}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Payment Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <PaymentModal
          lr={selectedLrForPay}
          allLrs={allLrs}
          currentUser={currentUser}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
