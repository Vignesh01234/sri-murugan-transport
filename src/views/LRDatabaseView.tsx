import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Printer, Edit, Trash2, IndianRupee, 
  Truck, Eye, Download, CheckCircle, Clock, AlertTriangle, X,
  FileClock, CheckCircle2, Camera, Image as ImageIcon, FileCheck2 
} from 'lucide-react';
import type { LR, CompanySettings, Payment } from '../types/index';
import { api } from '../services/api';
import { LRPrintModal } from '../components/LRPrintModal';
import { PaymentModal } from '../components/PaymentModal';
import { StatusModal, CancelModal, AckPhotoModal } from '../components/StatusAndCancelModals';

interface Props {
  settings: CompanySettings;
  currentUser: string;
  onEditLR: (lr: LR) => void;
  onCreateNewLR: () => void;
}

export const LRDatabaseView: React.FC<Props> = ({ settings, currentUser, onEditLR, onCreateNewLR }) => {
  const [lrs, setLrs] = useState<LR[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [printModalLR, setPrintModalLR] = useState<LR | null>(null);
  const [paymentModalLR, setPaymentModalLR] = useState<LR | null>(null);
  const [statusModalLR, setStatusModalLR] = useState<LR | null>(null);
  const [ackPhotoModalLR, setAckPhotoModalLR] = useState<LR | null>(null);
  const [cancelModalLR, setCancelModalLR] = useState<LR | null>(null);
  const [viewDetailsLR, setViewDetailsLR] = useState<LR | null>(null);

  useEffect(() => {
    fetchLRs();
  }, [search, statusFilter, paymentTypeFilter, startDate, endDate]);

  const fetchLRs = async () => {
    try {
      setLoading(true);
      const data = await api.getLRs({
        search,
        status: statusFilter,
        paymentType: paymentTypeFilter,
        startDate,
        endDate
      });
      setLrs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (lrs.length === 0) return;
    const headers = [
      'LR Number', 'LR Date', 'From City', 'To City', 'Vehicle No', 
      'Consignor', 'Consignee', 'Total Packages', 'Total Weight (kg)', 
      'Freight (INR)', 'Grand Total (INR)', 'Payment Type', 'Paid Amount', 
      'Balance Due', 'Payment Status', 'Delivery Status', 'Invoice No'
    ];

    const rows = lrs.map(l => [
      `"${l.lrNumber}"`,
      `"${l.lrDate}"`,
      `"${l.fromCity}"`,
      `"${l.toCity}"`,
      `"${l.vehicleNumber}"`,
      `"${l.consignorName.replace(/"/g, '""')}"`,
      `"${l.consigneeName.replace(/"/g, '""')}"`,
      l.totalPackages,
      l.totalWeight,
      l.freightAmount,
      l.grandTotal,
      `"${l.paymentType}"`,
      l.paidAmount,
      l.balanceDue,
      `"${l.paymentStatus}"`,
      `"${l.status}"`,
      `"${l.invoiceNumber || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sri_murugan_lrs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Lorry Receipt (LR) Database</h1>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of all booked, in-transit, delivered, and cancelled consignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV / Excel</span>
          </button>
          <button
            onClick={onCreateNewLR}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
          >
            <span>+ Create New LR</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by LR No, Party, City, Vehicle, or Invoice..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="All">All LR Statuses</option>
              <option value="Draft">Draft LRs (Pending)</option>
              <option value="Booked">Booked</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Type */}
          <div>
            <select
              value={paymentTypeFilter}
              onChange={e => setPaymentTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="All">All Payment Types</option>
              <option value="To Pay">To Pay</option>
              <option value="Paid">Paid</option>
              <option value="To Be Billed">To Be Billed (Credit)</option>
            </select>
          </div>

          {/* Date Range Start & End */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-2 text-[11px] border border-slate-300 rounded-lg"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-2 text-[11px] border border-slate-300 rounded-lg"
              title="End Date"
            />
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-semibold mr-1">Quick Views:</span>
          <button
            onClick={() => { setStatusFilter('All'); setPaymentTypeFilter('All'); }}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              statusFilter === 'All' && paymentTypeFilter === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Consignments ({lrs.length})
          </button>
          <button
            onClick={() => setStatusFilter('Draft')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              statusFilter === 'Draft'
                ? 'bg-amber-600 text-white ring-2 ring-amber-300'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
            }`}
          >
            <FileClock className="w-3.5 h-3.5 text-amber-700" />
            <span>Drafts ({lrs.filter(l => l.status === 'Draft').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('Booked')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              statusFilter === 'Booked' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Booked
          </button>
          <button
            onClick={() => setStatusFilter('In Transit')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              statusFilter === 'In Transit' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            In Transit
          </button>
          <button
            onClick={() => setStatusFilter('Delivered')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              statusFilter === 'Delivered' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Delivered
          </button>
        </div>
      </div>

      {/* LRs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">LR No & Date</th>
                <th className="py-3 px-4">Route & Vehicle</th>
                <th className="py-3 px-4">Consignor & Consignee</th>
                <th className="py-3 px-3 text-center">Pkgs / Wt</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Payment Basis</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading database records...
                  </td>
                </tr>
              ) : lrs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No Lorry Receipts found matching the filters.
                  </td>
                </tr>
              ) : (
                lrs.map(lr => (
                  <tr key={lr.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* LR No & Date */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-blue-900 text-sm">{lr.lrNumber}</div>
                      <div className="text-[11px] text-slate-500">{lr.lrDate}</div>
                      {lr.invoiceNumber && (
                        <div className="text-[10px] text-slate-400">Inv: {lr.invoiceNumber}</div>
                      )}
                    </td>

                    {/* Route & Vehicle */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">
                        {lr.fromCity} → {lr.toCity}
                      </div>
                      <div className="text-[11px] text-slate-600 uppercase font-semibold">
                        {lr.vehicleNumber}
                      </div>
                    </td>

                    {/* Consignor & Consignee */}
                    <td className="py-3 px-4 max-w-[220px]">
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">From:</span>
                        <span className="font-semibold text-slate-800">{lr.consignorName}</span>
                      </div>
                      <div className="truncate text-slate-600 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">To:</span>
                        <span className="font-medium">{lr.consigneeName}</span>
                      </div>
                    </td>

                    {/* Packages / Weight */}
                    <td className="py-3 px-3 text-center">
                      <div className="font-bold text-slate-900">{lr.totalPackages} pkgs</div>
                      <div className="text-[11px] text-slate-500">{lr.totalWeight} kg</div>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-extrabold text-slate-900">
                        ₹{lr.grandTotal.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Freight: ₹{lr.freightAmount.toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* Payment Basis & Status */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        lr.paymentType === 'To Pay'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : lr.paymentType === 'Paid'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-purple-100 text-purple-900 border border-purple-300'
                      }`}>
                        {lr.paymentType}
                      </span>
                      <div className={`text-[10px] font-bold mt-1 ${
                        lr.paymentStatus === 'Paid' ? 'text-emerald-700' : lr.paymentStatus === 'Partially Paid' ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {lr.paymentStatus}
                      </div>
                    </td>

                    {/* Balance Due */}
                    <td className="py-3 px-3 text-right">
                      <div className={`font-black ${lr.balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        ₹{lr.balanceDue.toLocaleString('en-IN')}
                      </div>
                      {lr.paidAmount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Rec: ₹{lr.paidAmount.toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    {/* LR Status & Delivery ACK Photo Copy */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          lr.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : lr.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-800'
                            : lr.status === 'Booked'
                            ? 'bg-slate-200 text-slate-800'
                            : lr.status === 'Draft'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {lr.status === 'Draft' && <FileClock className="w-3 h-3 text-amber-700" />}
                          <span>{lr.status}</span>
                        </span>

                        {lr.status === 'Delivered' && (
                          lr.ackPhotoUrl ? (
                            <button
                              type="button"
                              onClick={() => setAckPhotoModalLR(lr)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold shadow-2xs transition-colors cursor-pointer"
                              title="View / Print Signed LR Acknowledgement Photo Copy"
                            >
                              <FileCheck2 className="w-3 h-3" />
                              <span>ACK Photo Copy</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAckPhotoModalLR(lr)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold transition-colors cursor-pointer"
                              title="Upload or Generate LR Acknowledgement Photo Copy"
                            >
                              <Camera className="w-3 h-3 text-amber-700" />
                              <span>+ Add ACK Photo</span>
                            </button>
                          )
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Finalize Draft shortcut */}
                        {lr.status === 'Draft' && (
                          <button
                            onClick={() => onEditLR(lr)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-all shadow-xs mr-1"
                            title="Complete and Book Draft LR"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Book Now</span>
                          </button>
                        )}

                        {/* Dedicated ACK Photo Copy button once Delivery Completed */}
                        {lr.status === 'Delivered' && (
                          <button
                            onClick={() => setAckPhotoModalLR(lr)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              lr.ackPhotoUrl
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                            }`}
                            title={lr.ackPhotoUrl ? 'View / Print LR ACK Photo Copy' : 'Attach LR ACK Photo Copy (Delivery Completed)'}
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        )}

                        {/* Print / 4 Copies */}
                        <button
                          onClick={() => setPrintModalLR(lr)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={lr.status === 'Draft' ? 'Preview Draft Copies' : 'Print 4 Copies & ACK'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Record Payment */}
                        {lr.status !== 'Cancelled' && (
                          <button
                            onClick={() => setPaymentModalLR(lr)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Record Payment"
                          >
                            <IndianRupee className="w-4 h-4" />
                          </button>
                        )}

                        {/* Update Delivery Status */}
                        {lr.status !== 'Cancelled' && (
                          <button
                            onClick={() => setStatusModalLR(lr)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Update Delivery Status / Complete Delivery & Attach ACK Photo"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit LR */}
                        {lr.status !== 'Cancelled' && (
                          <button
                            onClick={() => onEditLR(lr)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Edit LR"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancel LR */}
                        {lr.status !== 'Cancelled' && (
                          <button
                            onClick={() => setCancelModalLR(lr)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Cancel LR"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {printModalLR && (
        <LRPrintModal
          lr={printModalLR}
          settings={settings}
          onClose={() => setPrintModalLR(null)}
        />
      )}

      {paymentModalLR && (
        <PaymentModal
          lr={paymentModalLR}
          currentUser={currentUser}
          onClose={() => setPaymentModalLR(null)}
          onSuccess={() => {
            setPaymentModalLR(null);
            fetchLRs();
          }}
        />
      )}

      {statusModalLR && (
        <StatusModal
          lr={statusModalLR}
          onClose={() => setStatusModalLR(null)}
          onSuccess={() => {
            setStatusModalLR(null);
            fetchLRs();
          }}
        />
      )}

      {ackPhotoModalLR && (
        <AckPhotoModal
          lr={ackPhotoModalLR}
          onClose={() => setAckPhotoModalLR(null)}
          onUpdated={() => {
            setAckPhotoModalLR(null);
            fetchLRs();
          }}
        />
      )}

      {cancelModalLR && (
        <CancelModal
          lr={cancelModalLR}
          onClose={() => setCancelModalLR(null)}
          onSuccess={() => {
            setCancelModalLR(null);
            fetchLRs();
          }}
        />
      )}
    </div>
  );
};
