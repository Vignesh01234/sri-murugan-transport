import React, { useState, useEffect } from 'react';
import {
  Database, Server, Play, Download, RefreshCw, CheckCircle2,
  AlertTriangle, Copy, Check, Terminal, Table as TableIcon,
  HardDrive, Wifi, ShieldCheck, FileCode, ArrowUpRight, ArrowDownLeft,
  Save, Layers, Search, Upload, FolderSync
} from 'lucide-react';
import { api } from '../services/api';

interface TableMeta {
  tableName: string;
  rowCount: number;
  columns: string[];
  mysqlDdl: string;
  description: string;
}

interface ServerDbStatus {
  engine: string;
  sqliteFile: string;
  sqliteSizeBytes: number;
  mysqlDumpFile: string;
  mysqlDumpSizeBytes: number;
  jsonMirrorFile: string;
  jsonSizeBytes: number;
  totalTables: number;
  totalRows: number;
  tables: TableMeta[];
  mysqlConfig: {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
    autoSync: boolean;
    lastSyncedAt?: string;
    lastSyncStatus?: string;
    lastErrorMessage?: string;
  };
  lanInfo: {
    hostname: string;
    port: number;
    localUrl: string;
    lanUrls: string[];
  };
}

const PRESET_SQL_QUERIES = [
  {
    label: 'All LRs (Bookings & Drafts)',
    sql: `SELECT lr_number, lr_date, vehicle_number, from_city, to_city, status, consignor_name, consignee_name, total_packages, total_weight, grand_total, balance_due, payment_type FROM lrs ORDER BY lr_date DESC;`
  },
  {
    label: 'Package Types Breakdown (Cargo Items)',
    sql: `SELECT package_type, COUNT(*) AS item_entries, SUM(packages) AS total_packages, SUM(weight) AS total_weight_kg, SUM(amount) AS total_freight FROM lr_items GROUP BY package_type ORDER BY total_packages DESC;`
  },
  {
    label: 'LR Status Summary (Draft vs Booked vs Delivered)',
    sql: `SELECT status, COUNT(*) AS total_lrs, SUM(total_packages) AS packages, SUM(grand_total) AS billed_amount, SUM(balance_due) AS pending_due FROM lrs GROUP BY status;`
  },
  {
    label: 'Package Types Master Table',
    sql: `SELECT id, code, name, description, active FROM package_types ORDER BY name ASC;`
  },
  {
    label: 'Customer Parties & GSTIN Registry',
    sql: `SELECT name, business_name, customer_type, phone, city, gstin, opening_balance FROM parties ORDER BY name ASC;`
  },
  {
    label: 'Freight Payments Collected',
    sql: `SELECT payment_date, lr_number, party_name, amount, payment_method, transaction_ref, received_by FROM payments ORDER BY payment_date DESC;`
  },
  {
    label: 'Show All SQL Tables',
    sql: `SHOW TABLES;`
  }
];

export const MySqlOfflineServerView: React.FC = () => {
  const [statusData, setStatusData] = useState<ServerDbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'explorer' | 'console' | 'mysql-connect' | 'setup-guide'>('explorer');

  // Table Explorer state
  const [selectedTable, setSelectedTable] = useState<string>('lrs');
  const [showDdl, setShowDdl] = useState(false);
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[][]; executionTimeMs: number } | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // SQL Console state
  const [sqlInput, setSqlInput] = useState<string>(PRESET_SQL_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[][];
    rowCount: number;
    executionTimeMs: number;
  } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [runningQuery, setRunningQuery] = useState(false);

  // MySQL Connection state
  const [mysqlForm, setMysqlForm] = useState({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'sri_murugan_tms',
    autoSync: false
  });
  const [mysqlFeedback, setMysqlFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    details?: string;
  } | null>(null);
  const [mysqlBusy, setMysqlBusy] = useState(false);

  // SQLite Single-File Portability & Merge state
  const [sqliteBusy, setSqliteBusy] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [portabilityNotice, setPortabilityNotice] = useState<{
    type: 'success' | 'error';
    title: string;
    details: string;
    summaryByTable?: Record<string, { added: number; updated: number }>;
  } | null>(null);

  useEffect(() => {
    loadServerStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'explorer' && selectedTable) {
      loadTablePreview(selectedTable);
    }
  }, [selectedTable, activeTab]);

  const loadServerStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getSqlServerStatus();
      setStatusData(data);
      if (data.mysqlConfig) {
        setMysqlForm({
          host: data.mysqlConfig.host || '127.0.0.1',
          port: Number(data.mysqlConfig.port) || 3306,
          user: data.mysqlConfig.user || 'root',
          password: data.mysqlConfig.password || '',
          database: data.mysqlConfig.database || 'sri_murugan_tms',
          autoSync: Boolean(data.mysqlConfig.autoSync)
        });
      }
    } catch (err) {
      console.error('Failed to load SQL server status:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTablePreview = async (tbl: string) => {
    setTableLoading(true);
    try {
      const res = await api.executeSqlQuery(`SELECT * FROM ${tbl} LIMIT 100;`);
      setTableData(res);
    } catch (err) {
      setTableData({ columns: [], rows: [], executionTimeMs: 0 });
    } finally {
      setTableLoading(false);
    }
  };

  const handleRunSql = async (customSql?: string) => {
    const q = customSql ?? sqlInput;
    if (!q.trim()) return;
    setRunningQuery(true);
    setQueryError(null);
    try {
      const res = await api.executeSqlQuery(q);
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message || 'SQL execution failed');
      setQueryResult(null);
    } finally {
      setRunningQuery(false);
    }
  };

  const handleExportQueryCsv = () => {
    if (!queryResult || queryResult.columns.length === 0) return;
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };
    const header = queryResult.columns.map(escapeCsv).join(',');
    const body = queryResult.rows.map(r => r.map(escapeCsv).join(',')).join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sql_query_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSaveMysqlConfig = async () => {
    setMysqlBusy(true);
    setMysqlFeedback(null);
    try {
      await api.saveMySqlConfig(mysqlForm);
      setMysqlFeedback({
        type: 'success',
        title: 'MySQL Server Configuration Saved',
        details: `Target database '${mysqlForm.database}' on ${mysqlForm.host}:${mysqlForm.port} updated.`
      });
      await loadServerStatus();
    } catch (err: any) {
      setMysqlFeedback({
        type: 'error',
        title: 'Failed to Save Configuration',
        details: err.message
      });
    } finally {
      setMysqlBusy(false);
    }
  };

  const handleTestMysql = async () => {
    setMysqlBusy(true);
    setMysqlFeedback(null);
    try {
      const res = await api.testMySqlConnection(mysqlForm);
      if (res.connected) {
        setMysqlFeedback({
          type: 'success',
          title: `Connected to MySQL Server (${res.version}) in ${res.latencyMs}ms`,
          details: res.databaseExists
            ? `Database '${mysqlForm.database}' exists with ${res.tableCount} tables ready.`
            : `Server is online! Click "Create Tables & Push Data to MySQL" below to initialize '${mysqlForm.database}'.`
        });
      } else {
        setMysqlFeedback({
          type: 'error',
          title: `Could Not Reach MySQL Server at ${mysqlForm.host}:${mysqlForm.port}`,
          details: `${res.error || 'Connection refused'}. Make sure XAMPP / WAMP / MySQL Server is running on ${mysqlForm.host}:${mysqlForm.port}, or download the .SQL file above to import manually.`
        });
      }
      await loadServerStatus();
    } catch (err: any) {
      setMysqlFeedback({
        type: 'error',
        title: 'MySQL Connection Error',
        details: err.message
      });
    } finally {
      setMysqlBusy(false);
    }
  };

  const handlePushToMysql = async () => {
    setMysqlBusy(true);
    setMysqlFeedback(null);
    try {
      const res = await api.syncPushToMySql(mysqlForm);
      if (res.success) {
        setMysqlFeedback({
          type: 'success',
          title: `Successfully Created Schema & Synced ${res.rowsSynced} Records to MySQL!`,
          details: `Database '${res.database}' now has all ${res.tablesSynced} relational tables populated with current LRs, package types, parties, and payments.`
        });
        await loadServerStatus();
      } else {
        setMysqlFeedback({
          type: 'error',
          title: 'MySQL Sync Push Failed',
          details: `${res.error}. Ensure your MySQL server is started on ${mysqlForm.host}:${mysqlForm.port}.`
        });
      }
    } catch (err: any) {
      setMysqlFeedback({
        type: 'error',
        title: 'MySQL Sync Push Error',
        details: err.message
      });
    } finally {
      setMysqlBusy(false);
    }
  };

  const handlePullFromMysql = async () => {
    setMysqlBusy(true);
    setMysqlFeedback(null);
    try {
      const res = await api.syncPullFromMySql(mysqlForm);
      if (res.success) {
        setMysqlFeedback({
          type: 'success',
          title: `Pulled ${res.rowsPulled} Records from MySQL Server!`,
          details: `Local application state and SQLite mirror updated from MySQL database '${mysqlForm.database}'.`
        });
        await loadServerStatus();
      } else {
        setMysqlFeedback({
          type: 'error',
          title: 'MySQL Sync Pull Failed',
          details: res.error
        });
      }
    } catch (err: any) {
      setMysqlFeedback({
        type: 'error',
        title: 'MySQL Sync Pull Error',
        details: err.message
      });
    } finally {
      setMysqlBusy(false);
    }
  };

  const handleExportSqliteFile = async () => {
    setSqliteBusy(true);
    setPortabilityNotice(null);
    try {
      const { filename, sizeBytes } = await api.exportSqliteDatabase();
      await loadServerStatus();
      setPortabilityNotice({
        type: 'success',
        title: `Exported Single SQLite File: ${filename}`,
        details: `All ${statusData?.totalTables || 13} relational tables (${statusData?.totalRows || 0} records, ${(sizeBytes / 1024).toFixed(1)} KB) were packaged into a single portable SQLite 3 file.`
      });
    } catch (err: any) {
      setPortabilityNotice({
        type: 'error',
        title: 'SQLite Export Failed',
        details: err.message || 'Could not export SQLite file.'
      });
    } finally {
      setSqliteBusy(false);
    }
  };

  const processSqliteFileImport = (file: File, modeToUse: 'merge' | 'replace' = importMode) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = ev.target?.result as string;
      if (!base64Data) return;
      setSqliteBusy(true);
      setPortabilityNotice(null);
      try {
        const res = await api.importSqliteDatabase(base64Data, modeToUse);
        await loadServerStatus();
        if (activeTab === 'explorer' && selectedTable) {
          await loadTablePreview(selectedTable);
        }
        setPortabilityNotice({
          type: 'success',
          title:
            res.mode === 'merge'
              ? `Imported & Merged Data from ${file.name}`
              : `Restored Complete Database from ${file.name}`,
          details:
            res.mode === 'merge'
              ? `Smart Merge complete: ${res.recordsAdded} new records added and ${res.recordsUpdated} existing records updated across ${res.tablesRestored} SQLite tables. LR financial balances have been automatically reconciled.`
              : `Replaced current database state with ${res.recordsRestored} records across ${res.tablesRestored} SQLite tables.`,
          summaryByTable: res.summaryByTable
        });
      } catch (err: any) {
        setPortabilityNotice({
          type: 'error',
          title: 'Import Data Failed',
          details: err.message || 'Failed to import and merge the selected SQLite file.'
        });
      } finally {
        setSqliteBusy(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportSqliteFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    processSqliteFileImport(file, importMode);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 KB';
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const currentTableMeta = statusData?.tables.find(t => t.tableName === selectedTable);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              MySQL & Offline Server Database Center
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Full relational SQL database engine with live MySQL 8.0 / MariaDB / XAMPP connector, embedded SQLite disk storage, and multi-PC offline LAN server access.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{sqliteBusy ? 'Importing...' : 'Import Data (.SQLITE)'}</span>
            <input
              type="file"
              accept=".sqlite,.db,.sqlite3"
              onChange={handleImportSqliteFile}
              disabled={sqliteBusy}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExportSqliteFile}
            disabled={sqliteBusy}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <HardDrive className="w-4 h-4" />
            <span>{sqliteBusy ? 'Exporting SQLite...' : 'Export Single .SQLITE File'}</span>
          </button>

          <button
            onClick={() => api.downloadMySqlDump()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download MySQL (.SQL) Dump</span>
          </button>

          <button
            onClick={loadServerStatus}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Refresh Database Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Portability & Merge Feedback Banner */}
      {portabilityNotice && (
        <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
          portabilityNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {portabilityNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <div className="font-bold text-sm">{portabilityNotice.title}</div>
                <p className="mt-0.5 leading-relaxed">{portabilityNotice.details}</p>
              </div>
            </div>
            <button
              onClick={() => setPortabilityNotice(null)}
              className="text-xs font-semibold underline opacity-75 hover:opacity-100 cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>

          {portabilityNotice.summaryByTable && Object.keys(portabilityNotice.summaryByTable).length > 0 && (
            <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-emerald-800 pl-8">
              <span className="font-bold uppercase tracking-wider text-emerald-900">Merge Breakdown:</span>
              {Object.entries(portabilityNotice.summaryByTable)
                .filter(([, counts]) => counts.added > 0 || counts.updated > 0)
                .map(([tbl, counts]) => (
                  <span key={tbl} className="font-mono">
                    {tbl}: +{counts.added} new / {counts.updated} updated
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Single-File SQLite Portability & Import Data Merge Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
            <FolderSync className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Import Data & Single-File SQLite Portability
              </h2>
              <span className="text-xs text-slate-500">
                · {formatBytes(statusData?.sqliteSizeBytes || 65536)} · SQLite 3 Format (`{statusData?.sqliteFile || 'data/transport.sqlite'}`)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Upload an existing <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">.sqlite</code> database file to <strong>merge</strong> its Lorry Receipts, Drafts, Package Types, Parties, Fleet, and Payments into your current application state, or export the active database into a single portable SQLite file.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto">
          {/* Import Mode Segmented Control */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setImportMode('merge')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                importMode === 'merge'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Combine uploaded records with existing database without losing data"
            >
              Smart Merge
            </button>
            <button
              type="button"
              onClick={() => setImportMode('replace')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                importMode === 'replace'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Overwrite current database state with the uploaded SQLite file"
            >
              Replace All
            </button>
          </div>

          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{importMode === 'merge' ? 'Import Data & Merge (.SQLITE)' : 'Import & Replace (.SQLITE)'}</span>
            <input
              type="file"
              accept=".sqlite,.db,.sqlite3"
              onChange={handleImportSqliteFile}
              disabled={sqliteBusy}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleExportSqliteFile}
            disabled={sqliteBusy}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>{sqliteBusy ? 'Packaging...' : 'Export Single .SQLITE File'}</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>RELATIONAL SQL TABLES</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {statusData?.totalTables || 13} Tables
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {statusData?.totalRows || 0} total rows indexed on disk
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>MYSQL .SQL DUMP FILE</span>
            <FileCode className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatBytes(statusData?.mysqlDumpSizeBytes || 42800)}
          </div>
          <div className="text-xs text-slate-500 mt-1 truncate">
            Auto-updated: data/sri_murugan_transport_mysql.sql
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>MYSQL SERVER CONNECTOR</span>
            <Server className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-1 truncate">
            {mysqlForm.host}:{mysqlForm.port}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            DB: <span className="font-mono font-semibold text-slate-700">{mysqlForm.database}</span> · {statusData?.mysqlConfig?.lastSyncStatus === 'connected' ? 'Online' : 'Offline SQLite Active'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>OFFLINE LAN SERVER ACCESS</span>
            <Wifi className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-base font-mono font-black text-slate-900 mt-1 truncate">
            {statusData?.lanInfo?.lanUrls?.[0] || 'http://localhost:3000'}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Multi-PC Office Access</span>
            <button
              onClick={() => handleCopy(statusData?.lanInfo?.lanUrls?.[0] || window.location.origin, 'lan')}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              {copiedText === 'lan' ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Segmented Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'explorer'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>1. SQL Table Explorer ({statusData?.totalTables || 13})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('console');
              if (!queryResult) handleRunSql(sqlInput);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'console'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>2. Interactive SQL Query Console</span>
          </button>

          <button
            onClick={() => setActiveTab('mysql-connect')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'mysql-connect'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>3. Live MySQL Server Connection (XAMPP / WAMP)</span>
          </button>

          <button
            onClick={() => setActiveTab('setup-guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'setup-guide'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>4. Offline LAN Server Setup Guide</span>
          </button>
        </div>

        {/* TAB 1: SQL TABLE EXPLORER */}
        {activeTab === 'explorer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            {/* Left Sidebar of Tables */}
            <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/60 p-3 space-y-1">
              <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Database Tables (`{mysqlForm.database}`)
              </div>
              {(statusData?.tables || []).map(tbl => (
                <button
                  key={tbl.tableName}
                  onClick={() => setSelectedTable(tbl.tableName)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer ${
                    selectedTable === tbl.tableName
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <span className="font-mono truncate">{tbl.tableName}</span>
                  <span className={`text-[11px] ${selectedTable === tbl.tableName ? 'text-blue-100' : 'text-slate-400'}`}>
                    {tbl.rowCount} rows
                  </span>
                </button>
              ))}
            </div>

            {/* Right Table Content */}
            <div className="lg:col-span-9 p-5 space-y-4 overflow-x-auto">
              {currentTableMeta && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black font-mono text-slate-900">
                        TABLE `{currentTableMeta.tableName}`
                      </h3>
                      <span className="text-xs text-slate-500">
                        · {currentTableMeta.rowCount} Records · {currentTableMeta.columns.length} Columns
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{currentTableMeta.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDdl(!showDdl)}
                      className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      {showDdl ? 'Hide MySQL CREATE TABLE' : 'View MySQL Schema (DDL)'}
                    </button>
                    <button
                      onClick={() => {
                        setSqlInput(`SELECT * FROM ${currentTableMeta.tableName} LIMIT 50;`);
                        setActiveTab('console');
                        handleRunSql(`SELECT * FROM ${currentTableMeta.tableName} LIMIT 50;`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Query in Console</span>
                    </button>
                  </div>
                </div>
              )}

              {showDdl && currentTableMeta && (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs relative overflow-x-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>MySQL 8.0 / MariaDB Table Definition</span>
                    <button
                      onClick={() => handleCopy(currentTableMeta.mysqlDdl, 'ddl')}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      {copiedText === 'ddl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'ddl' ? 'Copied DDL' : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed text-emerald-300">
                    {currentTableMeta.mysqlDdl}
                  </pre>
                </div>
              )}

              {/* Table Rows Preview */}
              {tableLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading SQL table rows...</div>
              ) : tableData && tableData.columns.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 font-mono">
                          {tableData.columns.map(col => (
                            <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 whitespace-nowrap max-w-[260px] truncate text-slate-700 font-mono text-[11px]">
                                {cell === null || cell === undefined ? <span className="text-slate-400">NULL</span> : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  No records currently in `{selectedTable}`.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE SQL QUERY CONSOLE */}
        {activeTab === 'console' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Offline SQL Query Runner
                </h3>
                <p className="text-xs text-slate-500">
                  Run standard SQL `SELECT`, `GROUP BY`, `JOIN`, `SHOW TABLES`, or `DESCRIBE` queries directly against your transport database.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_SQL_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSqlInput(preset.sql);
                      handleRunSql(preset.sql);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-md border border-slate-200 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                rows={4}
                value={sqlInput}
                onChange={e => setSqlInput(e.target.value)}
                placeholder="SELECT * FROM lrs ORDER BY lr_date DESC;"
                className="w-full p-3.5 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl border border-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Supports `SELECT`, `SHOW TABLES`, `DESCRIBE lrs`, aggregations (`SUM`, `COUNT`, `GROUP BY`), and table joins.
                </span>
                <div className="flex items-center gap-2">
                  {queryResult && queryResult.columns.length > 0 && (
                    <button
                      onClick={handleExportQueryCsv}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleRunSql()}
                    disabled={runningQuery}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{runningQuery ? 'Executing...' : 'Run SQL Query'}</span>
                  </button>
                </div>
              </div>
            </div>

            {queryError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{queryError}</span>
              </div>
            )}

            {queryResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Returned <strong>{queryResult.rowCount}</strong> rows · Executed in <strong>{queryResult.executionTimeMs} ms</strong>
                  </span>
                </div>

                {queryResult.columns.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[420px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 font-mono">
                            {queryResult.columns.map(c => (
                              <th key={c} className="py-2.5 px-3 whitespace-nowrap">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs font-mono">
                          {queryResult.rows.map((r, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              {r.map((val, cIdx) => (
                                <td key={cIdx} className="py-2 px-3 whitespace-nowrap max-w-[280px] truncate text-slate-700 text-[11px]">
                                  {val === null || val === undefined ? 'NULL' : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    Query executed successfully (0 rows returned).
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE MYSQL SERVER CONNECTION */}
        {activeTab === 'mysql-connect' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Connect to Local or Offline LAN MySQL / MariaDB Server
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link this application directly to your office MySQL Server (XAMPP, WAMP, MySQL 8.0, or MariaDB) over localhost or LAN IP.
                </p>
              </div>
              <button
                onClick={() => api.downloadMySqlDump()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download .SQL Dump for Manual Import</span>
              </button>
            </div>

            {mysqlFeedback && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                mysqlFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {mysqlFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm">{mysqlFeedback.title}</div>
                  {mysqlFeedback.details && <p className="leading-relaxed">{mysqlFeedback.details}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  MySQL Server Host / LAN IP *
                </label>
                <input
                  type="text"
                  value={mysqlForm.host}
                  onChange={e => setMysqlForm(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="127.0.0.1 or 192.168.1.100"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Use 127.0.0.1 for same PC or LAN IP for office server</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  MySQL Port *
                </label>
                <input
                  type="number"
                  value={mysqlForm.port}
                  onChange={e => setMysqlForm(prev => ({ ...prev, port: Number(e.target.value) || 3306 }))}
                  placeholder="3306"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Default MySQL / XAMPP port is 3306</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  value={mysqlForm.database}
                  onChange={e => setMysqlForm(prev => ({ ...prev, database: e.target.value }))}
                  placeholder="sri_murugan_tms"
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Created automatically on first Push</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  MySQL Username *
                </label>
                <input
                  type="text"
                  value={mysqlForm.user}
                  onChange={e => setMysqlForm(prev => ({ ...prev, user: e.target.value }))}
                  placeholder="root"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  MySQL Password
                </label>
                <input
                  type="password"
                  value={mysqlForm.password}
                  onChange={e => setMysqlForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave blank for default XAMPP root"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mysqlForm.autoSync}
                    onChange={e => setMysqlForm(prev => ({ ...prev, autoSync: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Real-Time MySQL Auto-Sync</span>
                    <span className="text-[11px] text-slate-500 block">Automatically push every new LR & payment to MySQL</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={mysqlBusy}
                onClick={handleTestMysql}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Server className="w-4 h-4 text-blue-400" />
                <span>1. Test MySQL Connection</span>
              </button>

              <button
                type="button"
                disabled={mysqlBusy}
                onClick={handlePushToMysql}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>2. Create Tables & Push Data to MySQL</span>
              </button>

              <button
                type="button"
                disabled={mysqlBusy}
                onClick={handlePullFromMysql}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>3. Pull Records from MySQL</span>
              </button>

              <button
                type="button"
                disabled={mysqlBusy}
                onClick={handleSaveMysqlConfig}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ml-auto"
              >
                <Save className="w-4 h-4" />
                <span>Save Connection Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: OFFLINE LAN SERVER & MYSQL SETUP GUIDE */}
        {activeTab === 'setup-guide' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step-by-step XAMPP / MySQL setup */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Option A: Using XAMPP / WAMP / Local MySQL Server</span>
                </h3>
                <ol className="space-y-2.5 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
                  <li>
                    Install and open <strong>XAMPP Control Panel</strong> (or WAMP / MySQL Server 8.0) on your main office PC and click <strong>Start</strong> next to <strong>MySQL</strong> (Port 3306).
                  </li>
                  <li>
                    <strong>Automatic Setup:</strong> Open Tab 3 (<em>Live MySQL Server Connection</em>) above, keep Host as <code className="bg-white px-1.5 py-0.5 rounded border">127.0.0.1</code>, Port <code className="bg-white px-1.5 py-0.5 rounded border">3306</code>, User <code className="bg-white px-1.5 py-0.5 rounded border">root</code>, and click <strong>"Create Tables & Push Data to MySQL"</strong>.
                  </li>
                  <li>
                    <strong>Manual phpMyAdmin Import:</strong> Click <strong>"Download MySQL (.SQL) Database"</strong> at the top of this page, open <code className="bg-white px-1.5 py-0.5 rounded border">http://localhost/phpmyadmin</code>, click <strong>Import</strong>, and choose <code className="bg-white px-1.5 py-0.5 rounded border">sri_murugan_transport_mysql.sql</code>.
                  </li>
                  <li>
                    Every time you create a Lorry Receipt, Draft LR, Package Type, or Payment, the file <code className="bg-white px-1.5 py-0.5 rounded border">data/sri_murugan_transport_mysql.sql</code> and <code className="bg-white px-1.5 py-0.5 rounded border">data/transport.sqlite</code> are updated automatically on disk!
                  </li>
                </ol>
              </div>

              {/* Multi-PC Offline LAN Access */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-600" />
                  <span>Option B: Access Offline Server Across Office PCs (LAN)</span>
                </h3>
                <ol className="space-y-2.5 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
                  <li>
                    Run the server on your main office computer using <code className="bg-white px-1.5 py-0.5 rounded border">npm run dev</code> or <code className="bg-white px-1.5 py-0.5 rounded border">Start_Offline_Server.bat</code>.
                  </li>
                  <li>
                    The server listens on <code className="bg-white px-1.5 py-0.5 rounded border">0.0.0.0:3000</code> so any computer or mobile device connected to the same office Wi-Fi / LAN switch can open it without internet.
                  </li>
                  <li>
                    On any other office computer, open Chrome or Edge and enter your server's LAN address:
                    <div className="mt-2 p-2.5 bg-slate-900 text-emerald-300 font-mono text-xs rounded-lg flex items-center justify-between">
                      <span>{statusData?.lanInfo?.lanUrls?.[0] || 'http://192.168.1.100:3000'}</span>
                      <button
                        onClick={() => handleCopy(statusData?.lanInfo?.lanUrls?.[0] || 'http://192.168.1.100:3000', 'guide-lan')}
                        className="text-blue-400 hover:underline text-[11px] cursor-pointer"
                      >
                        {copiedText === 'guide-lan' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </li>
                  <li>
                    All connected office computers share the exact same central SQL database in real time.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
