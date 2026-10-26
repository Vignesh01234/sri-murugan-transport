import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit, Trash2, BookOpen, 
  Download, Phone, MapPin, Building, CheckCircle2, XCircle 
} from 'lucide-react';
import type { Party, CompanySettings } from '../types/index';
import { api } from '../services/api';
import { PartyModal } from '../components/PartyModal';

interface Props {
  settings: CompanySettings;
  filterType?: string;
  initialType?: string;
  onViewLedger: (party: Party) => void;
}

export const PartyMasterView: React.FC<Props> = ({ settings, filterType, initialType = 'All', onViewLedger }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>(filterType || initialType || 'All');
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    try {
      setLoading(true);
      const data = await api.getParties();
      setParties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer/party "${name}"?`)) {
      try {
        await api.deleteParty(id);
        setParties(prev => prev.filter(p => p.id !== id));
      } catch (err: any) {
        alert('Failed to delete party: ' + err.message);
      }
    }
  };

  const filteredParties = parties.filter(p => {
    if (typeFilter !== 'All') {
      if (typeFilter === 'Consignor' && p.customerType !== 'Consignor' && p.customerType !== 'Both') return false;
      if (typeFilter === 'Consignee' && p.customerType !== 'Consignee' && p.customerType !== 'Both') return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.gstin && p.gstin.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (parties.length === 0) return;
    const headers = ['Party ID', 'Name', 'Business Name', 'Type', 'Phone', 'City', 'State', 'GSTIN', 'Opening Balance', 'Status'];
    const rows = parties.map(p => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.businessName.replace(/"/g, '""')}"`,
      `"${p.customerType}"`,
      `"${p.phone}"`,
      `"${p.city}"`,
      `"${p.state}"`,
      `"${p.gstin || ''}"`,
      p.openingBalance,
      p.active ? 'Active' : 'Inactive'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `parties_master_${new Date().toISOString().split('T')[0]}.csv`);
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
            {filterType === 'Consignor' ? 'Consignor Master (Senders)' : filterType === 'Consignee' ? 'Consignee Master (Receivers)' : 'Customer & Party Master'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain sender, receiver, broker profiles, addresses, contact details, and account ledgers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Party</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search party by name, trade name, city, phone, or GSTIN..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="All">All Customer Types</option>
            <option value="Consignor">Consignors (Senders)</option>
            <option value="Consignee">Consignees (Receivers)</option>
            <option value="Both">Both (Consignor & Consignee)</option>
            <option value="Broker">Brokers / Agents</option>
          </select>
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Party Name & Business Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">City & State</th>
                <th className="py-3 px-4">Contact & Phone</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading party records...
                  </td>
                </tr>
              ) : filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No parties found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredParties.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-slate-900">{p.name}</div>
                      {p.businessName && p.businessName !== p.name && (
                        <div className="text-[11px] text-slate-500 italic">{p.businessName}</div>
                      )}
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.address}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                        {p.customerType}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.city}</div>
                      <div className="text-[11px] text-slate-500">{p.state} {p.pincode && `- ${p.pincode}`}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{p.phone || '—'}</div>
                      {p.email && <div className="text-[11px] text-slate-500">{p.email}</div>}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {p.gstin || 'Unregistered'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {p.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewLedger(p)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                          title="View Account Ledger"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </button>

                        <button
                          onClick={() => setEditingParty(p)}
                          className="p-1 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete"
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

      {/* Add / Edit Modal */}
      {(showAddModal || editingParty) && (
        <PartyModal
          party={editingParty}
          existingParties={parties}
          onClose={() => {
            setShowAddModal(false);
            setEditingParty(null);
          }}
          onSuccess={saved => {
            setShowAddModal(false);
            setEditingParty(null);
            loadParties();
          }}
        />
      )}
    </div>
  );
};
