import React, { useState, useEffect } from 'react';
import { X, Users, AlertTriangle, Check } from 'lucide-react';
import type { Party } from '../types/index';
import { api } from '../services/api';

interface Props {
  party?: Party | null;
  existingParties: Party[];
  onClose: () => void;
  onSuccess: (party: Party) => void;
  initialName?: string;
  initialType?: Party['customerType'];
}

export const PartyModal: React.FC<Props> = ({
  party,
  existingParties,
  onClose,
  onSuccess,
  initialName = '',
  initialType = 'Both'
}) => {
  const [name, setName] = useState<string>(party?.name || initialName);
  const [businessName, setBusinessName] = useState<string>(party?.businessName || initialName);
  const [address, setAddress] = useState<string>(party?.address || '');
  const [city, setCity] = useState<string>(party?.city || '');
  const [state, setState] = useState<string>(party?.state || 'Tamil Nadu');
  const [pincode, setPincode] = useState<string>(party?.pincode || '');
  const [phone, setPhone] = useState<string>(party?.phone || '');
  const [email, setEmail] = useState<string>(party?.email || '');
  const [gstin, setGstin] = useState<string>(party?.gstin || '');
  const [openingBalance, setOpeningBalance] = useState<string>(party ? String(party.openingBalance) : '0');
  const [customerType, setCustomerType] = useState<Party['customerType']>(party?.customerType || initialType);
  const [active, setActive] = useState<boolean>(party ? party.active : true);

  const [duplicateWarning, setDuplicateWarning] = useState<Party | null>(null);
  const [ignoreWarning, setIgnoreWarning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Check for similar name to avoid duplicates
  useEffect(() => {
    if (!name.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const clean = name.trim().toLowerCase();
    const match = existingParties.find(p => {
      if (party && p.id === party.id) return false;
      const otherClean = p.name.trim().toLowerCase();
      return otherClean === clean || (otherClean.includes(clean) && clean.length > 4);
    });
    setDuplicateWarning(match || null);
  }, [name, existingParties, party]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Party name is required');
      return;
    }

    if (duplicateWarning && !ignoreWarning && !party) {
      setError(`A similar party "${duplicateWarning.name}" already exists. Check the box below if you want to create a new one anyway.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const saved = await api.saveParty({
        id: party?.id,
        name: name.trim(),
        businessName: businessName.trim() || name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gstin: gstin.trim().toUpperCase(),
        openingBalance: Number(openingBalance) || 0,
        customerType,
        active
      });
      onSuccess(saved);
    } catch (err: any) {
      setError(err.message || 'Failed to save party');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl my-auto overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">
              {party ? 'Edit Customer / Party' : 'Add New Customer / Party'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Possible Duplicate Detected!</span>
              </div>
              <p>
                An existing party named <strong>"{duplicateWarning.name}"</strong> ({duplicateWarning.city}, Ph: {duplicateWarning.phone || 'N/A'}) already exists in the registry.
              </p>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-950 pt-1">
                <input
                  type="checkbox"
                  checked={ignoreWarning}
                  onChange={e => setIgnoreWarning(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>I confirm this is a distinct party and want to proceed</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Party / Customer Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (!businessName || businessName === name) {
                    setBusinessName(e.target.value);
                  }
                }}
                required
                placeholder="e.g. Sri Krishna Textiles"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Business Trade Name (if different)
              </label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Sri Krishna Textiles & Spares Pvt Ltd"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Customer Type *
              </label>
              <select
                value={customerType}
                onChange={e => setCustomerType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="Both">Both (Consignor & Consignee)</option>
                <option value="Consignor">Consignor Only (Sender)</option>
                <option value="Consignee">Consignee Only (Receiver)</option>
                <option value="Broker">Transport Broker / Agent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 98401 23456"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. Plot 45, SIPCOT Phase 2, Bhel Road"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Ranipet"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="Tamil Nadu"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                PIN Code
              </label>
              <input
                type="text"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="632401"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={e => setGstin(e.target.value.toUpperCase())}
                placeholder="33AAAAA0000A1Z5"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="info@party.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Opening Balance (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="partyActive"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="partyActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Active Party (available for new LR bookings)
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Party'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
