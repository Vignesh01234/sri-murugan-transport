import React, { useState } from 'react';
import { 
  Printer, X, Copy, Check, Eye, Settings2, 
  FileText, Columns2, Grid2X2, Sparkles, Upload, Image as ImageIcon 
} from 'lucide-react';
import type { LR, CompanySettings } from '../types/index';
import { LRPrintTemplate } from './LRPrintTemplate';

interface Props {
  lr: LR;
  settings: CompanySettings;
  onClose: () => void;
  initialCopy?: 'Consignor Copy' | 'Consignee Copy' | 'Driver Copy' | 'Office Copy' | 'All 4 Copies' | 'ACK Photo Copy';
}

const COPY_TYPES = [
  'Consignor Copy',
  'Consignee Copy',
  'Driver Copy',
  'Office Copy'
] as const;

export const LRPrintModal: React.FC<Props> = ({ 
  lr, 
  settings, 
  onClose, 
  initialCopy = 'All 4 Copies' 
}) => {
  // Print configuration state
  const [selectedCopy, setSelectedCopy] = useState<'All 4 Copies' | 'ACK Photo Copy' | typeof COPY_TYPES[number]>(initialCopy);
  const [paperSize, setPaperSize] = useState<'A4' | 'A5' | 'Letter'>(settings.printPaperSize || 'A4');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(settings.printLayout || 'landscape');
  const [layoutMode, setLayoutMode] = useState<'single' | 'two_up' | 'four_up'>('single');
  const [showLogo, setShowLogo] = useState<boolean>(settings.showLogoOnLR !== false);
  const [logoStyle, setLogoStyle] = useState<'emblem' | 'truck' | 'badge' | 'custom'>(settings.logoStyle || 'emblem');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(settings.logoUrl);

  const handlePrint = () => {
    window.print();
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'a4_landscape' | 'a5_compact' | 'a4_portrait' | 'dual_a5' | 'all_in_one') => {
    switch (preset) {
      case 'a4_landscape':
        setPaperSize('A4');
        setOrientation('landscape');
        setLayoutMode('single');
        break;
      case 'a5_compact':
        setPaperSize('A5');
        setOrientation('landscape');
        setLayoutMode('single');
        break;
      case 'a4_portrait':
        setPaperSize('A4');
        setOrientation('portrait');
        setLayoutMode('single');
        break;
      case 'dual_a5':
        setPaperSize('A4');
        setOrientation('landscape');
        setLayoutMode('two_up');
        break;
      case 'all_in_one':
        setPaperSize('A4');
        setOrientation('landscape');
        setLayoutMode('four_up');
        break;
    }
  };

  // Clone settings with active logo and layout options
  const activeSettings: CompanySettings = {
    ...settings,
    showLogoOnLR: showLogo,
    logoStyle: logoStyle,
    logoUrl: customLogoUrl
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setCustomLogoUrl(ev.target?.result as string);
        setLogoStyle('custom');
        setShowLogo(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      {/* Dynamic Print CSS for chosen Paper Size & Orientation */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize.toLowerCase()} ${orientation};
            margin: ${paperSize === 'A5' ? '4mm' : '6mm'};
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-auto flex flex-col max-h-[96vh] overflow-hidden no-print">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">
              LR
            </div>
            <div>
              <h2 className="text-base font-bold">
                Lorry Receipt Print & Layout Setup — <span className="text-blue-400">{lr.lrNumber}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {lr.fromCity} → {lr.toCity} &nbsp;|&nbsp; {lr.consignorName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now ({paperSize} {orientation.toUpperCase()})</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Type Quick Presets Strip */}
        <div className="px-6 py-2.5 bg-slate-800 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-blue-300 font-bold uppercase text-[10px] tracking-wider">
              Standard Print Types:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => applyPreset('a4_landscape')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  paperSize === 'A4' && orientation === 'landscape' && layoutMode === 'single'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                ★ A4 Landscape (Standard PDF)
              </button>
              <button
                onClick={() => applyPreset('a5_compact')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  paperSize === 'A5' && orientation === 'landscape' && layoutMode === 'single'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                A5 Compact Half-Sheet
              </button>
              <button
                onClick={() => applyPreset('a4_portrait')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  paperSize === 'A4' && orientation === 'portrait' && layoutMode === 'single'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                A4 Portrait
              </button>
              <button
                onClick={() => applyPreset('dual_a5')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  layoutMode === 'two_up'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                2 LRs / Sheet (Dual A5 on A4)
              </button>
              <button
                onClick={() => applyPreset('all_in_one')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  layoutMode === 'four_up'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                4-in-1 LR Summary
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Controls Bar */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Copy Selection */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-bold uppercase text-[10px] mr-1">Copy:</span>
            <button
              onClick={() => setSelectedCopy('All 4 Copies')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
                selectedCopy === 'All 4 Copies'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              All 4 Copies
            </button>
            {COPY_TYPES.map(copy => (
              <button
                key={copy}
                onClick={() => setSelectedCopy(copy)}
                className={`px-2.5 py-1.5 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                  selectedCopy === copy
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {copy.replace(' Copy', '')}
              </button>
            ))}
            {lr.status === 'Delivered' && (
              <button
                onClick={() => {
                  setSelectedCopy('ACK Photo Copy');
                  setLayoutMode('single');
                }}
                className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCopy === 'ACK Photo Copy'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>ACK Photo Copy (POD)</span>
              </button>
            )}
          </div>

          {/* Paper Size & Orientation & Logo Settings */}
          <div className="flex items-center gap-2.5 flex-wrap bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
            {/* Paper Size */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Paper:</span>
              <select
                value={paperSize}
                onChange={e => setPaperSize(e.target.value as any)}
                className="px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-slate-50 focus:ring-1 focus:ring-blue-500"
              >
                <option value="A4">A4 (297×210 mm)</option>
                <option value="A5">A5 (210×148 mm)</option>
                <option value="Letter">Letter (8.5×11 in)</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Layout:</span>
              <select
                value={orientation}
                onChange={e => setOrientation(e.target.value as any)}
                className="px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-slate-50 focus:ring-1 focus:ring-blue-500"
              >
                <option value="landscape">Landscape (Standard)</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>

            {/* Logo Controls */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300">
              <label className="flex items-center gap-1 cursor-pointer text-slate-700 font-bold">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={e => setShowLogo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px]">Logo</span>
              </label>

              {showLogo && (
                <select
                  value={logoStyle}
                  onChange={e => setLogoStyle(e.target.value as any)}
                  className="px-1.5 py-0.5 text-[11px] font-medium border border-slate-200 rounded bg-slate-50"
                >
                  <option value="emblem">SMT Crest</option>
                  <option value="truck">Truck Vector</option>
                  <option value="badge">Vintage Seal</option>
                  {customLogoUrl && <option value="custom">Custom Logo</option>}
                </select>
              )}

              <label className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer" title="Upload Custom Logo for this print">
                <Upload className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Scrollable Preview Area (On-Screen) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/80 space-y-6">
          {/* Mode: 4-UP (All 4 on one sheet) */}
          {layoutMode === 'four_up' && (
            <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
              <div className="mb-2 text-xs font-bold text-slate-700 flex justify-between">
                <span>4 Copies on 1 Single {paperSize} Sheet ({orientation.toUpperCase()})</span>
                <span className="text-blue-600">Space-saving All-In-One Dispatch Format</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {COPY_TYPES.map(copy => (
                  <div key={copy} className="scale-95 origin-top">
                    <LRPrintTemplate lr={lr} settings={activeSettings} copyType={copy} isCompact={true} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode: 2-UP (2 copies per sheet) */}
          {layoutMode === 'two_up' && (
            <div className="space-y-6">
              {/* Sheet 1: Consignor & Consignee */}
              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
                <div className="mb-2 text-xs font-bold text-slate-700 flex justify-between">
                  <span>Sheet 1 of 2: Consignor Copy + Consignee Copy</span>
                  <span className="text-slate-500">{paperSize} {orientation}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LRPrintTemplate lr={lr} settings={activeSettings} copyType="Consignor Copy" isCompact={true} />
                  <LRPrintTemplate lr={lr} settings={activeSettings} copyType="Consignee Copy" isCompact={true} />
                </div>
              </div>

              {/* Sheet 2: Driver & Office */}
              <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm">
                <div className="mb-2 text-xs font-bold text-slate-700 flex justify-between">
                  <span>Sheet 2 of 2: Driver Copy + Office Copy</span>
                  <span className="text-slate-500">{paperSize} {orientation}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LRPrintTemplate lr={lr} settings={activeSettings} copyType="Driver Copy" isCompact={true} />
                  <LRPrintTemplate lr={lr} settings={activeSettings} copyType="Office Copy" isCompact={true} />
                </div>
              </div>
            </div>
          )}

          {/* Mode: Single copy per page (Standard) */}
          {layoutMode === 'single' && (
            selectedCopy === 'All 4 Copies' ? (
              COPY_TYPES.map((copy, i) => (
                <div key={copy} className="relative">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                    <span>Page {i + 1} of 4: {copy}</span>
                    <span className="text-slate-500">
                      Standard {paperSize} {orientation} &nbsp;|&nbsp; Sri Murugan Transport
                    </span>
                  </div>
                  <LRPrintTemplate 
                    lr={lr} 
                    settings={activeSettings} 
                    copyType={copy} 
                    isCompact={paperSize === 'A5'} 
                  />
                </div>
              ))
            ) : selectedCopy === 'ACK Photo Copy' ? (
              <div className="lr-print-container bg-white text-black font-sans border-2 border-black mx-auto p-5 max-w-[1000px] shadow-sm print:shadow-none print:w-full">
                <div className="flex justify-between items-center pb-3 border-b-2 border-black">
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-wider text-black">
                      {activeSettings.companyName || 'SRI MURUGAN TRANSPORT'}
                    </h1>
                    <p className="text-xs text-gray-700">{activeSettings.address}</p>
                    <p className="text-xs font-semibold text-gray-800">
                      Ph: {activeSettings.phone} &nbsp;|&nbsp; GSTIN: {activeSettings.gstin}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black uppercase tracking-widest text-black block">
                      LR ACKNOWLEDGEMENT PHOTO COPY
                    </span>
                    <span className="inline-block mt-1 px-2.5 py-0.5 border border-black rounded text-xs font-bold uppercase bg-emerald-50">
                      DELIVERY COMPLETED • PROOF OF DELIVERY (POD)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 py-3 border-b border-black text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">LR Number & Date</span>
                    <span className="font-black text-sm text-black">{lr.lrNumber} ({lr.lrDate})</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Route & Vehicle</span>
                    <span className="font-bold text-black">{lr.fromCity} → {lr.toCity} ({lr.vehicleNumber})</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Delivery Date & Receiver</span>
                    <span className="font-bold text-black">
                      {lr.deliveryDate || lr.lrDate} · {lr.deliveryReceivedBy || lr.consigneeName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">POD Ref & Packages</span>
                    <span className="font-bold text-black">
                      {lr.podReference || `POD-${lr.lrNumber}`} ({lr.totalPackages} Pkgs / {lr.totalWeight} Kg)
                    </span>
                  </div>
                </div>

                <div className="py-4 flex flex-col items-center justify-center">
                  {lr.ackPhotoUrl ? (
                    <img
                      src={lr.ackPhotoUrl}
                      alt={`Signed LR Acknowledgement Copy ${lr.lrNumber}`}
                      className="max-h-[460px] w-auto object-contain border border-gray-400 rounded p-1 bg-white"
                    />
                  ) : (
                    <div className="py-12 px-8 border-2 border-dashed border-gray-400 rounded text-center text-sm text-gray-700">
                      Signed physical receipt verified upon delivery to <strong>{lr.deliveryReceivedBy || lr.consigneeName}</strong> on <strong>{lr.deliveryDate || lr.lrDate}</strong>.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-black flex justify-between items-center text-[11px] text-gray-800">
                  <span>Remarks: {lr.deliveryRemarks || 'Consignment delivered in full and good condition.'}</span>
                  <span className="font-bold uppercase">Verified Official ACK Copy — {lr.lrNumber}</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                  <span>Single Sheet: {selectedCopy}</span>
                  <span className="text-slate-500">
                    Standard {paperSize} {orientation} &nbsp;|&nbsp; Sri Murugan Transport
                  </span>
                </div>
                <LRPrintTemplate 
                  lr={lr} 
                  settings={activeSettings} 
                  copyType={selectedCopy} 
                  isCompact={paperSize === 'A5'} 
                />
              </div>
            )
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Standard: A4 Landscape | High resolution print with auto pagination</span>
          <span className="text-slate-400">Sri Murugan Transport Print Engine</span>
        </div>
      </div>
    </div>
  );
};
