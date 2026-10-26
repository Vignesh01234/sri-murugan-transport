import React, { useState, useEffect } from 'react';
import { Search, Printer, Copy, FileText, CheckCircle, Calendar, Truck, ArrowRight, Camera, FileCheck2 } from 'lucide-react';
import type { LR, CompanySettings } from '../types/index';
import { api } from '../services/api';
import { LRPrintModal } from '../components/LRPrintModal';
import { AckPhotoModal } from '../components/StatusAndCancelModals';
import { TransportLogo } from '../components/TransportLogo';

interface Props {
  settings: CompanySettings;
}

export const LRPrintReprintView: React.FC<Props> = ({ settings }) => {
  const [lrs, setLrs] = useState<LR[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedLR, setSelectedLR] = useState<LR | null>(null);
  const [ackModalLR, setAckModalLR] = useState<LR | null>(null);
  const [printCopyType, setPrintCopyType] = useState<'All 4 Copies' | 'Consignor Copy' | 'Consignee Copy' | 'Driver Copy' | 'Office Copy' | 'ACK Photo Copy'>('All 4 Copies');

  useEffect(() => {
    loadRecentLRs();
  }, [search]);

  const loadRecentLRs = async () => {
    try {
      const data = await api.getLRs({ search });
      setLrs(data);
      if (!selectedLR && data.length > 0) {
        setSelectedLR(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPrint = (lr: LR, copy: 'All 4 Copies' | 'Consignor Copy' | 'Consignee Copy' | 'Driver Copy' | 'Office Copy' | 'ACK Photo Copy') => {
    setSelectedLR(lr);
    setPrintCopyType(copy);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <TransportLogo settings={settings} size="md" />
          <div>
            <h1 className="text-2xl font-black text-slate-900">LR Print & Reprint Station</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select paper sizes (A4, A5, Letter), landscape standard, or paper-saver multi-copy layouts matching Transport.pdf.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="text-slate-500">Standard:</span>
          <span className="text-blue-700 font-bold">A4 Landscape</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-bold">A5 Supported</span>
        </div>
      </div>

      {/* Quick Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by LR Number (e.g. SMT-2026-0001), Sender, Receiver, or Vehicle..."
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grid of LRs with 4-Copy Print Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lrs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            No Lorry Receipts found.
          </div>
        ) : (
          lrs.map(lr => (
            <div
              key={lr.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-base font-black text-blue-900">{lr.lrNumber}</span>
                    <span className="text-[11px] text-slate-500 block">{lr.lrDate}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    lr.paymentType === 'To Pay'
                      ? 'bg-amber-100 text-amber-900'
                      : lr.paymentType === 'Paid'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-purple-100 text-purple-900'
                  }`}>
                    {lr.paymentType}
                  </span>
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span>{lr.fromCity}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lr.toCity}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    <span className="font-semibold text-slate-400">Sender: </span>
                    {lr.consignorName}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    <span className="font-semibold text-slate-400">Receiver: </span>
                    {lr.consigneeName}
                  </div>
                  <div className="text-[11px] text-slate-600 flex justify-between pt-1 border-t border-slate-200">
                    <span>Vehicle: <strong className="text-slate-800">{lr.vehicleNumber}</strong></span>
                    <span>Total: <strong className="text-blue-900 font-extrabold">₹{lr.grandTotal}</strong></span>
                  </div>
                </div>
              </div>

              {/* Print Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => handleOpenPrint(lr, 'All 4 Copies')}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Print All 4 Copies (A4 Landscape / A5)</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleOpenPrint(lr, 'Consignor Copy')}
                    className="py-1 px-2 text-[11px] font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 rounded border border-blue-200 text-center cursor-pointer"
                  >
                    Consignor Copy
                  </button>
                  <button
                    onClick={() => handleOpenPrint(lr, 'Consignee Copy')}
                    className="py-1 px-2 text-[11px] font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded border border-emerald-200 text-center cursor-pointer"
                  >
                    Consignee Copy
                  </button>
                  <button
                    onClick={() => handleOpenPrint(lr, 'Driver Copy')}
                    className="py-1 px-2 text-[11px] font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded border border-amber-200 text-center cursor-pointer"
                  >
                    Driver Copy
                  </button>
                  <button
                    onClick={() => handleOpenPrint(lr, 'Office Copy')}
                    className="py-1 px-2 text-[11px] font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 rounded border border-slate-300 text-center cursor-pointer"
                  >
                    Office Copy
                  </button>
                </div>
                {lr.status === 'Delivered' && (
                  <div className="pt-1 flex items-center gap-1.5">
                    <button
                      onClick={() => setAckModalLR(lr)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{lr.ackPhotoUrl ? 'View / Edit ACK Photo Copy' : 'Attach LR ACK Photo Copy'}</span>
                    </button>
                    {lr.ackPhotoUrl && (
                      <button
                        onClick={() => handleOpenPrint(lr, 'ACK Photo Copy')}
                        className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        title="Print ACK Photo Copy"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Print ACK</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedLR && (
        <LRPrintModal
          lr={selectedLR}
          settings={settings}
          initialCopy={printCopyType}
          onClose={() => setSelectedLR(null)}
        />
      )}

      {ackModalLR && (
        <AckPhotoModal
          lr={ackModalLR}
          onClose={() => setAckModalLR(null)}
          onUpdated={() => {
            setAckModalLR(null);
            loadRecentLRs();
          }}
        />
      )}
    </div>
  );
};
