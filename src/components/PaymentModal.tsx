import React, { useState, useEffect } from 'react';
import { X, CheckCircle, IndianRupee, CreditCard } from 'lucide-react';
import type { LR, Payment } from '../types/index';
import { api } from '../services/api';

interface Props {
  lr?: LR | null;
  allLrs?: LR[];
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
  currentUser: string;
}

export const PaymentModal: React.FC<Props> = ({ lr, allLrs = [], onClose, onSuccess, currentUser }) => {
  const [selectedLrId, setSelectedLrId] = useState<string>(lr?.id || '');
  const [activeLR, setActiveLR] = useState<LR | null>(lr || null);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>(lr ? String(lr.balanceDue > 0 ? lr.balanceDue : lr.grandTotal) : '');
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('Cash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (selectedLrId && allLrs.length > 0) {
      const found = allLrs.find(l => l.id === selectedLrId);
      if (found) {
        setActiveLR(found);
        setAmount(String(found.balanceDue > 0 ? found.balanceDue : found.grandTotal));
      }
    }
  }, [selectedLrId, allLrs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLR) {
      setError('Please select an LR to receive payment against');
      return;
    }
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const responsibleParty = activeLR.paymentType === 'To Pay' 
        ? activeLR.consigneeName 
        : activeLR.consignorName;
      const responsiblePartyId = activeLR.paymentType === 'To Pay'
        ? activeLR.consigneeId
        : activeLR.consignorId;

      const payment = await api.recordPayment({
        lrId: activeLR.id,
        lrNumber: activeLR.lrNumber,
        partyId: responsiblePartyId,
        partyName: responsibleParty,
        paymentDate,
        amount: payAmt,
        paymentMethod,
        transactionRef,
        remarks,
        receivedBy: currentUser
      });

      onSuccess(payment);
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Record Payment</h3>
              <p className="text-xs text-slate-400">Receive cash, UPI, bank or cheque payment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* LR Selection */}
          {!lr && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select LR Number *
              </label>
              <select
                value={selectedLrId}
                onChange={e => setSelectedLrId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Choose an LR --</option>
                {allLrs.filter(l => l.status !== 'Cancelled').map(l => (
                  <option key={l.id} value={l.id}>
                    {l.lrNumber} — {l.fromCity} to {l.toCity} | Due: ₹{l.balanceDue} ({l.paymentType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeLR && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">LR Number:</span>
                <span className="text-slate-900 font-bold">{activeLR.lrNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Route:</span>
                <span>{activeLR.fromCity} → {activeLR.toCity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Responsible Party ({activeLR.paymentType}):</span>
                <span className="font-medium">
                  {activeLR.paymentType === 'To Pay' ? activeLR.consigneeName : activeLR.consignorName}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Grand Total:</span>
                <span className="font-bold text-slate-900">₹{activeLR.grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Already Paid:</span>
                <span className="font-bold">₹{activeLR.paidAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Balance Due:</span>
                <span className="text-sm">₹{activeLR.balanceDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reference / UTR / Cheque No.
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                placeholder="e.g. UPI Ref / Cheque 102931"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Remarks / Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Full settlement on delivery"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Save Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
