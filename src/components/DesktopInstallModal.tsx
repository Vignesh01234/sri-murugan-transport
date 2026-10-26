import React, { useState, useEffect } from 'react';
import { 
  Laptop, Download, HardDrive, CheckCircle2, 
  X, ArrowRight, ShieldCheck, Sparkles, FolderDown, Monitor,
  ExternalLink, Copy, Check, Info, FileCode, PackageCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  onClose: () => void;
}

export const DesktopInstallModal: React.FC<Props> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'browser' | 'backup'>('download');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setActiveTab('browser');
    }
  };

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      setCopiedUrl(true);
    }
  };

  const triggerDownload = (url: string, filename: string, title: string) => {
    setDownloadNotice(`Downloading ${title}... Check your PC Downloads folder.`);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => setDownloadNotice(null), 5000);
  };

  const handleExportData = async () => {
    try {
      await api.exportLocalDiskBackup();
      setDownloadNotice('Local disk data backup exported successfully to your PC!');
      setTimeout(() => setDownloadNotice(null), 5000);
    } catch {
      setDownloadNotice('Failed to export backup file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Laptop className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">
                  Download Sri Murugan TMS for PC
                </h3>
                <span className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                  100% Offline
                </span>
              </div>
              <p className="text-xs text-blue-300 mt-0.5">
                Install & run directly on your PC disk — No cloud storage or active internet required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('download')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'download'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download PC Offline Files</span>
          </button>
          <button
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'browser'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4 text-indigo-600" />
            <span>Install in Windows / Chrome</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4 text-amber-600" />
            <span>Local Disk Data & Backup</span>
          </button>
        </div>

        {/* Status notification banner */}
        {downloadNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'download' && (
            <div className="space-y-4">
              {/* Option 1: Full PC Package (ZIP) */}
              <div className="p-4 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-2 border-blue-200 rounded-xl hover:border-blue-400 transition-all shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                      <PackageCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">
                          Complete PC Offline Package (.ZIP)
                        </h4>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold uppercase">
                          Recommended for PC
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Contains the entire offline application, bundled assets, and <strong>Launch_Sri_Murugan_TMS.bat</strong>. 
                        Simply extract anywhere on your PC (C: drive or Desktop) and double-click the launcher!
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> No internet needed
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Windows 10/11 & 7/8 compatible
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Auto-saves to PC local disk
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center gap-3">
                  <button
                    onClick={() => triggerDownload(
                      '/api/download/pc-package', 
                      'Sri_Murugan_Transport_PC_Offline_Package.zip',
                      'PC Offline Package (.ZIP)'
                    )}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PC Package (.ZIP - 272 KB)</span>
                  </button>
                  <a
                    href="/Sri_Murugan_Transport_PC_Offline_Package.zip"
                    download="Sri_Murugan_Transport_PC_Offline_Package.zip"
                    className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    title="Direct Download Link"
                  >
                    <span>Direct Link</span>
                  </a>
                </div>
              </div>

              {/* Option 2: Standalone Single-File (.HTML) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-400 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        Standalone Single-File Offline App (.HTML)
                      </h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                        Portable 1-Click
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      All HTML, CSS, JavaScript, icons, and local disk database engine combined into a single file. 
                      Save it to your desktop or USB pen drive and double-click to run in any browser offline.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => triggerDownload(
                          '/api/download/standalone-html', 
                          'Sri_Murugan_Transport_Offline_Desktop_App.html',
                          'Standalone Offline App (.HTML)'
                        )}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Single-File App (.HTML - 626 KB)</span>
                      </button>
                      <a
                        href="/Sri_Murugan_Transport_Offline_Desktop_App.html"
                        download="Sri_Murugan_Transport_Offline_Desktop_App.html"
                        className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>Direct Link</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offline User Credentials Info */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Pre-Configured Offline Login Accounts:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white/80 p-2 rounded border border-amber-200">
                    <span className="font-bold block text-slate-800">Admin</span>
                    <span className="text-slate-500">User: <strong>admin</strong></span><br/>
                    <span className="text-slate-500">PIN: <strong>1234</strong></span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-amber-200">
                    <span className="font-bold block text-slate-800">Booking Staff</span>
                    <span className="text-slate-500">User: <strong>staff1</strong></span><br/>
                    <span className="text-slate-500">PIN: <strong>1234</strong></span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-amber-200">
                    <span className="font-bold block text-slate-800">Accountant</span>
                    <span className="text-slate-500">User: <strong>accounts</strong></span><br/>
                    <span className="text-slate-500">PIN: <strong>1234</strong></span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-amber-200">
                    <span className="font-bold block text-slate-800">Viewer</span>
                    <span className="text-slate-500">User: <strong>viewer</strong></span><br/>
                    <span className="text-slate-500">PIN: <strong>1234</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'browser' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shrink-0 mt-0.5">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">
                        Install as Chrome / Microsoft Edge Desktop App
                      </h4>
                      {isInstalled && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Already Installed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Adds a dedicated Sri Murugan Transport icon on your Windows desktop that opens without browser toolbars.
                    </p>
                  </div>
                </div>

                {deferredPrompt ? (
                  <button
                    onClick={handleInstallPWA}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Click Here to Install Desktop App Now</span>
                  </button>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs text-slate-700">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span>Quick 2-Step Browser Install:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
                        <li>
                          Open this app in a full browser window (not inside the preview frame).
                        </li>
                        <li>
                          In Chrome or Edge, look at the right side of the address bar and click the <strong>Install (⊞ or ⊕)</strong> button.
                        </li>
                        <li>
                          Or click the browser menu <strong>(⋮) → "Save and share" → "Install Sri Murugan Transport"</strong>.
                        </li>
                      </ol>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open in Separate Browser Window</span>
                      </a>
                      <button
                        onClick={handleCopyUrl}
                        className="py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedUrl ? 'Copied URL!' : 'Copy URL'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Laptop className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Standalone Window Experience</span>
                  Once installed via Chrome or Edge, Sri Murugan Transport runs like native Windows software (Alt+Tab switcher, desktop shortcut, pin to taskbar).
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Local PC Disk Storage — Zero Cloud Dependency
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Every Lorry Receipt booked, party added, and payment entered is saved directly on your local computer disk.
                      You never need to worry about internet outages or third-party servers.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">Offline Safety Guidelines:</span>
                  <ul className="space-y-1.5 text-slate-600">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Exit Backup Prompt:</strong> Every time you log out or close, the app reminds you to download a backup file.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Daily Disk Snapshots:</strong> Keep backup files in your computer's Documents folder or on a USB drive.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Easy PC Transfer:</strong> If you change computers, simply use "Restore Backup" to bring over your entire business ledger.</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Local Disk Backup File (.JSON)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sri Murugan Transport Offline Edition</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
