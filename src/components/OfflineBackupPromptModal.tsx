import React, { useState } from 'react';
import { 
  HardDrive, Download, X, AlertTriangle, ShieldCheck, 
  CheckCircle2, Laptop, LogOut 
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  onClose: () => void;
  onConfirmExit?: () => void;
  isLogoutAction?: boolean;
}

export const OfflineBackupPromptModal: React.FC<Props> = ({ 
  onClose, 
  onConfirmExit,
  isLogoutAction = false 
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      await api.exportLocalDiskBackup();
      setDownloaded(true);
    } catch (err) {
      console.error(err);
      alert('Failed to export backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleProceedExit = () => {
    if (onConfirmExit) {
      onConfirmExit();
    } else {
      onClose();
      // If closing browser window
      window.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isLogoutAction ? 'Backup Data Before Sign Out?' : 'Backup Data to Local Disk?'}
              </h3>
              <p className="text-xs text-slate-400">
                100% Offline Local PC Disk Protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            <span className="font-bold block mb-1">Sri Murugan Transport Offline Safety</span>
            All your LR bookings, party ledgers, vehicle master records, and financial payments are saved locally on this computer.
            Downloading a local backup creates an offline snapshot file on your PC hard drive.
          </div>

          {downloaded ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Backup file downloaded successfully to your PC Downloads folder!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Recommended: Backup regularly to prevent local drive data loss.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleDownloadBackup}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Local Backup...' : 'Download Backup to Local Disk (.json)'}</span>
            </button>

            {downloaded ? (
              <button
                onClick={handleProceedExit}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                <span>{isLogoutAction ? 'Proceed to Sign Out' : 'Close App'}</span>
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleProceedExit}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  {isLogoutAction ? 'Sign Out Without Backup' : 'Exit Without Backup'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel / Stay in App
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 font-mono">
            <Laptop className="w-3.5 h-3.5" />
            Local Disk Only
          </span>
          <span>No Cloud Required</span>
        </div>
      </div>
    </div>
  );
};
