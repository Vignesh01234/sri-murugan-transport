import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Plus, Shield, Clock, Search, 
  CheckCircle, Key, Activity, UserCog, User 
} from 'lucide-react';
import type { User as UserType, AuditLog, UserRole } from '../types/index';
import { api, getActiveUser, setActiveUser } from '../services/api';

interface Props {
  currentUser: UserType;
  onUserSwitched: (user: UserType) => void;
}

export const UserManagementView: React.FC<Props> = ({ currentUser, onUserSwitched }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [showAddUser, setShowAddUser] = useState(false);

  // New user form state
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Booking Staff');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [searchLog, setSearchLog] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, logs] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs()
      ]);
      setUsers(uList);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchActiveUser = (u: UserType) => {
    setActiveUser(u);
    onUserSwitched(u);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) return;
    try {
      const saved = await api.saveUser({
        username: username.trim().toLowerCase(),
        name: name.trim(),
        role,
        phone,
        email,
        active: true
      });
      setUsers(prev => [...prev, saved]);
      setShowAddUser(false);
      setUsername('');
      setName('');
      setPhone('');
      setEmail('');
    } catch (err: any) {
      alert('Failed to create user: ' + err.message);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!searchLog.trim()) return true;
    const q = searchLog.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">User Management & Role Permissions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage system access for Administrator, Booking Staff, Accountant, and Viewer roles, and review audit trail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Staff User</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 bg-white px-4 pt-2 rounded-t-xl border-t border-l border-r">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>Active Users & Role Switcher ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Users */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {users.map(u => {
              const isCurrent = currentUser.id === u.id;
              return (
                <div
                  key={u.id}
                  className={`bg-white p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                      {u.name.charAt(0)}
                    </div>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 uppercase">
                        Current Session
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSwitchActiveUser(u)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                      >
                        Switch Role
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    <h3 className="font-bold text-sm text-slate-900">{u.name}</h3>
                    <p className="text-xs text-slate-500">@{u.username}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Role:</span>
                      <span className="font-extrabold text-blue-900">{u.role}</span>
                    </div>
                    {u.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="text-slate-700">{u.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2 text-[11px] text-slate-500 border-t border-dashed">
                    {u.role === 'Administrator' && 'Full access to all LR edits, payments, masters & settings.'}
                    {u.role === 'Booking Staff' && 'Fast LR data entry, printing, and parcel dispatch.'}
                    {u.role === 'Accountant' && 'Cash collection, customer ledgers, and financial reports.'}
                    {u.role === 'Viewer' && 'Read-only access for auditing and status verification.'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role Permissions Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 overflow-hidden">
            <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide mb-3">
              Role Access & Permission Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-2.5 px-3">Operation / Capability</th>
                    <th className="py-2.5 px-3 text-center">Administrator</th>
                    <th className="py-2.5 px-3 text-center">Booking Staff</th>
                    <th className="py-2.5 px-3 text-center">Accountant</th>
                    <th className="py-2.5 px-3 text-center">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2 px-3">Create New LR & Print 4 Copies</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-slate-400">View Only</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Edit Existing LR</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-slate-400">No</td>
                    <td className="text-center text-slate-400">No</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Record Payments & Cash Receipts</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-slate-400">No</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Cancel LR with Audit Reason</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-amber-600 font-bold">With Reason</td>
                    <td className="text-center text-slate-400">No</td>
                    <td className="text-center text-slate-400">No</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Manage Company Settings & Database Backups</td>
                    <td className="text-center text-emerald-600 font-bold">Yes</td>
                    <td className="text-center text-slate-400">No</td>
                    <td className="text-center text-slate-400">No</td>
                    <td className="text-center text-slate-400">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchLog}
                onChange={e => setSearchLog(e.target.value)}
                placeholder="Search audit trail by user, action, or details..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredLogs.length} logged actions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700">
                      {log.entityType}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">
                      {log.details}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-600">
                      {log.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Add New Staff User</h3>
              <button onClick={() => setShowAddUser(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. S. Murugesan"
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="murugesan"
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role *</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Booking Staff">Booking Staff</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="9444012345"
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@transport.com"
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
