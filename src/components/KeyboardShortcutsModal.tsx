import React from 'react';
import { X, Keyboard, Zap, Compass, Command, ArrowRight } from 'lucide-react';
import type { NavigationMenuKey } from '../App';

export interface ShortcutDefinition {
  keys: string[];
  label: string;
  description: string;
  category: 'core' | 'navigation' | 'system';
  targetView?: NavigationMenuKey;
  action?: () => void;
}

interface Props {
  onClose: () => void;
  onNavigate: (view: NavigationMenuKey) => void;
  onOpenBackup: () => void;
  onOpenInstall: () => void;
  currentView: NavigationMenuKey;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({
  onClose,
  onNavigate,
  onOpenBackup,
  onOpenInstall,
  currentView
}) => {
  const coreShortcuts: ShortcutDefinition[] = [
    {
      keys: ['F2'],
      label: 'Create New LR',
      description: 'Open a fresh Lorry Receipt booking form from anywhere',
      category: 'core',
      targetView: 'create-lr'
    },
    {
      keys: ['F3'],
      label: 'LR Database & Search',
      description: 'Jump to the central Lorry Receipt register and filter consignments',
      category: 'core',
      targetView: 'lr-database'
    },
    {
      keys: ['F4'],
      label: 'LR Print & Reprint Station',
      description: 'Open 4-Copy A4/A5 LR printing and ACK photo copy station',
      category: 'core',
      targetView: 'print-reprint'
    },
    {
      keys: ['F6'],
      label: 'Record Payment Entry',
      description: 'Record cash, UPI, or bank freight collections against LRs',
      category: 'core',
      targetView: 'payment-entry'
    },
    {
      keys: ['F7'],
      label: 'Customer Ledger Statement',
      description: 'Inspect party-wise debit/credit ledger and running balances',
      category: 'core',
      targetView: 'customer-ledger'
    },
    {
      keys: ['F8'],
      label: 'MySQL & Offline Server DB',
      description: 'Open SQLite portability, MySQL sync, and offline SQL console',
      category: 'core',
      targetView: 'mysql-server-db'
    },
    {
      keys: ['F9'],
      label: 'Backup Local Disk',
      description: 'Open local disk database backup & archive prompt',
      category: 'system',
      action: () => {
        onClose();
        onOpenBackup();
      }
    },
    {
      keys: ['F1', 'Ctrl + /'],
      label: 'Keyboard Shortcuts Reference',
      description: 'Toggle this keyboard shortcut guide & quick launcher',
      category: 'system',
      action: onClose
    }
  ];

  const ctrlNumberShortcuts: ShortcutDefinition[] = [
    {
      keys: ['Ctrl + 1'],
      label: '1. Dashboard',
      description: 'Live operations overview, KPIs, and recent bookings',
      category: 'navigation',
      targetView: 'dashboard'
    },
    {
      keys: ['Ctrl + 2'],
      label: '2. Create New LR',
      description: 'Book a new consignment or save as draft (also F2)',
      category: 'navigation',
      targetView: 'create-lr'
    },
    {
      keys: ['Ctrl + 3'],
      label: '3. LR Database',
      description: 'View, edit, update delivery status, and attach ACK photos',
      category: 'navigation',
      targetView: 'lr-database'
    },
    {
      keys: ['Ctrl + 4'],
      label: '4. LR Print & Reprint',
      description: 'Print 4 copies or signed POD acknowledgement copies',
      category: 'navigation',
      targetView: 'print-reprint'
    },
    {
      keys: ['Ctrl + 5'],
      label: '5. Customer / Party Master',
      description: 'Manage consignors, consignees, GSTINs, and opening balances',
      category: 'navigation',
      targetView: 'party-master'
    },
    {
      keys: ['Ctrl + 6'],
      label: '7. Vehicle & Fleet Master',
      description: 'Manage trucks, drivers, cities, routes, and package types',
      category: 'navigation',
      targetView: 'vehicle-management'
    },
    {
      keys: ['Ctrl + 7'],
      label: '11. Payment Entry',
      description: 'Post freight receipts and update balance due',
      category: 'navigation',
      targetView: 'payment-entry'
    },
    {
      keys: ['Ctrl + 8'],
      label: '12. Customer Ledger',
      description: 'Party account statements and outstanding summaries',
      category: 'navigation',
      targetView: 'customer-ledger'
    },
    {
      keys: ['Ctrl + 9'],
      label: '20. MySQL & Offline Server DB',
      description: 'Single-file SQLite export/merge & LAN MySQL database center',
      category: 'navigation',
      targetView: 'mysql-server-db'
    },
    {
      keys: ['Ctrl + 0'],
      label: '21. Company Settings',
      description: 'Company profile, logo, and printed LR field toggles',
      category: 'navigation',
      targetView: 'company-settings'
    }
  ];

  const handleTriggerItem = (item: ShortcutDefinition) => {
    if (item.action) {
      item.action();
      return;
    }
    if (item.targetView) {
      onNavigate(item.targetView);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide uppercase">
                Global Keyboard Shortcuts & Fast Navigation
              </h2>
              <p className="text-xs text-slate-300">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-blue-300">F2</kbd> anytime to Create New LR, or use <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-blue-300">Ctrl + 1..9 / 0</kbd> (or <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-blue-300">Alt + 1..9 / 0</kbd>) to switch views.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Function Keys & Core Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Function Key Core Actions (F1 – F9)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">Works globally</span>
              </div>

              <div className="space-y-2">
                {coreShortcuts.map((sc) => {
                  const isActive = sc.targetView && currentView === sc.targetView;
                  return (
                    <button
                      key={sc.label}
                      type="button"
                      onClick={() => handleTriggerItem(sc)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 border-blue-400 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">{sc.label}</span>
                          {isActive && (
                            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{sc.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {sc.keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2.5 py-1 bg-slate-900 text-white border border-slate-700 rounded-md text-xs font-mono font-bold shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Ctrl + Number Navigation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Ctrl + Number View Navigation (Ctrl + 1..0)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">Also supports Alt + 1..0</span>
              </div>

              <div className="space-y-2">
                {ctrlNumberShortcuts.map((sc) => {
                  const isActive = sc.targetView && currentView === sc.targetView;
                  return (
                    <button
                      key={sc.label}
                      type="button"
                      onClick={() => handleTriggerItem(sc)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-400 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">{sc.label}</span>
                          {isActive && (
                            <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Current View
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{sc.description}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-1 bg-slate-100 text-slate-900 border border-slate-300 rounded-md text-xs font-mono font-bold shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-blue-600" />
            <span>
              Tip: Click any shortcut card above to jump directly to that screen, or press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px] font-bold text-slate-800">Esc</kbd> to close modals.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
