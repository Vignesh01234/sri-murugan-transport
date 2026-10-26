import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Download, Printer, Calendar, 
  ArrowUpRight, ArrowDownLeft, Building, User, IndianRupee 
} from 'lucide-react';
import type { Party, CompanySettings } from '../types/index';
import { api } from '../services/api';

interface Props {
  settings: CompanySettings;
  preselectedParty?: Party | null;
}

export const CustomerLedgerView: React.FC<Props> = ({ settings, preselectedParty }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(preselectedParty?.id || '');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    const list = await api.getParties();
    setParties(list);
    if (!selectedPartyId && list.length > 0) {
      setSelectedPartyId(list[0].id);
    }
  };

  useEffect(() => {
    if (selectedPartyId) {
      fetchLedger();
    }
  }, [selectedPartyId, startDate, endDate]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await api.getPartyLedger(selectedPartyId, startDate, endDate);
      setLedgerData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!ledgerData || !ledgerData.transactions) return;
    const headers = ['Date', 'LR Number', 'Description', 'Reference', 'Debit (Charge)', 'Credit (Payment)', 'Running Balance'];
    const rows = ledgerData.transactions.map((t: any) => [
      `"${t.date}"`,
      `"${t.lrNumber || ''}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.reference || ''}"`,
      t.debit,
      t.credit,
      t.balance
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `ledger_${ledgerData.party?.name || 'customer'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Customer & Party Ledger Statement</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track opening balances, freight charges (debits), payments collected (credits), and running balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={!ledgerData || ledgerData.transactions?.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Selector & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Select Customer / Party *
          </label>
          <select
            value={selectedPartyId}
            onChange={e => setSelectedPartyId(e.target.value)}
            className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {parties.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city}) — {p.customerType}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            From Date (Optional)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            To Date (Optional)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {/* Ledger Report Card */}
      {ledgerData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden printable-area">
          {/* Printable Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                {settings.companyName || 'SRI MURUGAN TRANSPORT'}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                Statement of Account: {ledgerData.party?.name}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {ledgerData.party?.address && `${ledgerData.party.address}, `}
                {ledgerData.party?.city} {ledgerData.party?.state && `, ${ledgerData.party.state}`}
                {ledgerData.party?.gstin && ` | GSTIN: ${ledgerData.party.gstin}`}
                {ledgerData.party?.phone && ` | Ph: ${ledgerData.party.phone}`}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold block">Net Outstanding Balance:</span>
              <span className={`text-2xl font-black ${ledgerData.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ₹{ledgerData.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-4 border-b border-slate-200 text-center divide-x divide-slate-200 bg-white py-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Opening Balance</div>
              <div className="font-extrabold text-sm text-slate-800">
                ₹{ledgerData.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Debits (Billed)</div>
              <div className="font-extrabold text-sm text-blue-900">
                ₹{ledgerData.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Credits (Paid)</div>
              <div className="font-extrabold text-sm text-emerald-700">
                ₹{ledgerData.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Closing Balance Due</div>
              <div className={`font-black text-sm ${ledgerData.currentBalance > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                ₹{ledgerData.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-28">Date</th>
                  <th className="py-2.5 px-4 w-36">LR / Ref No</th>
                  <th className="py-2.5 px-4">Transaction Details</th>
                  <th className="py-2.5 px-4 w-32 text-right">Debit (₹)</th>
                  <th className="py-2.5 px-4 w-32 text-right">Credit (₹)</th>
                  <th className="py-2.5 px-4 w-36 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Initial Balance Row */}
                <tr className="bg-slate-50/50 font-semibold text-slate-600">
                  <td className="py-2 px-4">—</td>
                  <td className="py-2 px-4 font-mono">—</td>
                  <td className="py-2 px-4">Opening Balance Brought Forward</td>
                  <td className="py-2 px-4 text-right">—</td>
                  <td className="py-2 px-4 text-right">—</td>
                  <td className="py-2 px-4 text-right font-bold text-slate-900">
                    ₹{ledgerData.openingBalance.toFixed(2)}
                  </td>
                </tr>

                {ledgerData.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No LR bookings or payments found for this customer.
                    </td>
                  </tr>
                ) : (
                  ledgerData.transactions.map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-700">{row.date}</td>
                      <td className="py-2.5 px-4 font-black text-blue-900">{row.lrNumber || row.reference || '—'}</td>
                      <td className="py-2.5 px-4 text-slate-800">{row.description}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-blue-900">
                        {row.debit > 0 ? `₹${row.debit.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                        {row.credit > 0 ? `₹${row.credit.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-slate-900">
                        ₹{row.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
