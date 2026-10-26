import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Search, Download, Trash2, Edit, 
  Fuel, Wrench, ShieldAlert, Coffee, Truck, IndianRupee 
} from 'lucide-react';
import type { Expense, Vehicle } from '../types/index';
import { api } from '../services/api';
import { ExpenseModal } from '../components/MasterModals';

export const ExpenseManagementView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [exps, vehs] = await Promise.all([
        api.getExpenses(),
        api.getVehicles()
      ]);
      setExpenses(exps);
      setVehicles(vehs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense entry?')) {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.vehicleNumber && e.vehicleNumber.toLowerCase().includes(q)) ||
      (e.referenceNumber && e.referenceNumber.toLowerCase().includes(q))
    );
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Date', 'Category', 'Description', 'Amount (INR)', 'Vehicle', 'Route', 'Method', 'Ref No', 'Remarks'];
    const rows = expenses.map(e => [
      `"${e.expenseDate}"`,
      `"${e.category}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.vehicleNumber || ''}"`,
      `"${e.route || ''}"`,
      `"${e.paymentMethod}"`,
      `"${e.referenceNumber || ''}"`,
      `"${e.remarks || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `operational_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Fleet & Operational Expense Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track fuel, highway tolls, vehicle maintenance, driver allowances, and union labour charges.
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
            onClick={() => { setEditingExpense(null); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Total and Category Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Operational Outflow
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Fuel (Diesel)
            </span>
            <Fuel className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-black text-amber-600 mt-1 block">
            ₹{(categoryTotals['Fuel'] || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Toll & Fastag
            </span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-xl font-black text-blue-600 mt-1 block">
            ₹{(categoryTotals['Toll'] || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Maintenance & Spares
            </span>
            <Wrench className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-xl font-black text-purple-600 mt-1 block">
            ₹{(categoryTotals['Maintenance'] || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by description, vehicle number, or reference number..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Fuel">Fuel (Diesel)</option>
            <option value="Toll">Toll / Fastag</option>
            <option value="Maintenance">Maintenance & Spares</option>
            <option value="Driver Allowance">Driver Batta & Allowance</option>
            <option value="Loading Labour">Loading Labour / Hamali</option>
            <option value="Police & RTO">Police / RTO / Weighbridge</option>
            <option value="Office & Admin">Office Rent & Admin</option>
            <option value="Other">Other Expenses</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Vehicle No</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Bill / Ref No</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">Loading expenses...</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">No expense records found.</td>
                </tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{e.expenseDate}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{e.description}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                      ₹{e.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-900 uppercase">
                      {e.vehicleNumber || 'General Fleet'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{e.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{e.referenceNumber || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setEditingExpense(e); setShowAddModal(true); }}
                          className="p-1 text-slate-600 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
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

      {showAddModal && (
        <ExpenseModal
          expense={editingExpense}
          vehicles={vehicles}
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
