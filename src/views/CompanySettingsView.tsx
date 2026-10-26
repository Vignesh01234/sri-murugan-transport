import React, { useState } from 'react';
import { 
  Building, Settings, Save, RefreshCw, Download, 
  Upload, ShieldCheck, CheckCircle2, AlertTriangle, FileText,
  Sliders, Eye, EyeOff, CheckSquare, Square, Truck, Scale 
} from 'lucide-react';
import type { CompanySettings, LRPrintFieldConfig, LR } from '../types/index';
import { DEFAULT_PRINT_FIELD_CONFIG } from '../types/index';
import { api } from '../services/api';
import { TransportLogo } from '../components/TransportLogo';
import { LRPrintTemplate } from '../components/LRPrintTemplate';

interface Props {
  settings: CompanySettings;
  onSettingsUpdated: (updated: CompanySettings) => void;
}

export const CompanySettingsView: React.FC<Props> = ({ settings, onSettingsUpdated }) => {
  const [formData, setFormData] = useState<CompanySettings>({
    ...settings,
    printFields: {
      ...DEFAULT_PRINT_FIELD_CONFIG,
      ...(settings.printFields || {})
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showLivePrintPreview, setShowLivePrintPreview] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activePrintFields: LRPrintFieldConfig = {
    ...DEFAULT_PRINT_FIELD_CONFIG,
    ...(formData.printFields || {})
  };

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTogglePrintField = (key: keyof LRPrintFieldConfig) => {
    setFormData(prev => {
      const current = {
        ...DEFAULT_PRINT_FIELD_CONFIG,
        ...(prev.printFields || {})
      };
      return {
        ...prev,
        printFields: {
          ...current,
          [key]: !current[key]
        }
      };
    });
  };

  const applyPrintFieldsPreset = (preset: 'standard' | 'all' | 'minimal') => {
    if (preset === 'standard') {
      handleChange('printFields', { ...DEFAULT_PRINT_FIELD_CONFIG });
    } else if (preset === 'all') {
      const allTrue = Object.keys(DEFAULT_PRINT_FIELD_CONFIG).reduce((acc, k) => {
        acc[k as keyof LRPrintFieldConfig] = true;
        return acc;
      }, {} as LRPrintFieldConfig);
      handleChange('printFields', allTrue);
    } else {
      handleChange('printFields', {
        ...DEFAULT_PRINT_FIELD_CONFIG,
        showCompanyGstin: false,
        showCompanyEmail: false,
        showCompanyTagline: false,
        showDriverName: false,
        showBookingAndDeliveryBranch: false,
        showExpectedDeliveryDate: false,
        showPartyGstin: false,
        showPartyAddress: false,
        showPackageType: false,
        showWeightAndRate: false,
        showInvoiceDetails: false,
        showEwayBill: false,
        showChargesBreakdown: false,
        termDemurrage: false,
        termNoContraband: false,
        termSubjectToJurisdiction: false,
        showDriverSignature: false,
      });
    }
  };

  const samplePreviewLR: LR = {
    id: 'preview-lr',
    lrNumber: `${formData.lrPrefix || 'SMT-2026-'}${String(formData.nextLrNumber || 1001).padStart(4, '0')}`,
    lrDate: new Date().toISOString().split('T')[0],
    vehicleNumber: 'TN 23 BX 4589',
    vehicleType: 'Eicher 17ft Open',
    driverName: 'K. Rajendran',
    driverPhone: '9840112233',
    fromCity: 'Vellore',
    toCity: 'Chennai',
    bookingBranch: 'Ranipet Main Branch',
    deliveryBranch: 'Chennai Guindy Godown',
    bookingStaff: 'R. Vignesh',
    expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'Delivered',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryReceivedBy: 'K. Parthiban (Store Keeper)',
    podReference: 'POD-CH-9941',
    deliveryRemarks: 'Delivered 10 cartons in good condition',
    consignorName: 'Vellore Precision Leathercraft',
    consignorBusinessName: 'Vellore Precision Leathercraft LLP',
    consignorAddress: '28 Gandhi Nagar Main Road, Vellore',
    consignorCity: 'Vellore',
    consignorState: 'Tamil Nadu',
    consignorPincode: '632006',
    consignorPhone: '9443333444',
    consignorGstin: '33AAAFV9876F1Z1',
    consigneeName: 'Balaji Hardware & Tools',
    consigneeBusinessName: 'Balaji Hardware & Tools Mart',
    consigneeAddress: '112 Broadway Street, George Town, Chennai',
    consigneeCity: 'Chennai',
    consigneeState: 'Tamil Nadu',
    consigneePincode: '600001',
    consigneePhone: '9840222333',
    consigneeGstin: '33AAACB5678E1Z8',
    items: [
      {
        id: 'itm-preview-1',
        serialNo: 1,
        description: 'Tanned Leather Rolls & Industrial Spares',
        packageType: 'Carton Box',
        packages: 10,
        weight: 250,
        rate: 8.0,
        rateBasis: 'per_kg',
        amount: 2000
      }
    ],
    totalPackages: 10,
    totalWeight: 250,
    invoiceNumber: 'INV/26/0894',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceValue: 85000,
    ewayBillNumber: '341098223451',
    paymentType: formData.defaultPaymentType || 'To Pay',
    freightAmount: 2000,
    loadingCharges: 150,
    unloadingCharges: 150,
    otherCharges: 50,
    hamaliCharges: 0,
    additionalCharges: 0,
    discount: 0,
    gstApplicable: formData.gstEnabled || false,
    gstRate: formData.defaultGstRate || 5,
    gstAmount: formData.gstEnabled ? 100 : 0,
    grandTotal: formData.gstEnabled ? 2450 : 2350,
    paidAmount: 0,
    balanceDue: formData.gstEnabled ? 2450 : 2350,
    paymentStatus: 'Unpaid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await api.updateSettings(formData);
      onSettingsUpdated(updated);
      setMessage({ type: 'success', text: 'Company settings updated successfully! All new printouts will reflect these details.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup/export';
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm('Restoring this backup will replace current database records with the backup file. Proceed?')) {
          await api.restoreBackup(json);
          alert('Database restored successfully! Reloading...');
          window.location.reload();
        }
      } catch (err: any) {
        alert('Invalid backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    if (confirm('Warning: This will reset all LR bookings, payments, and expenses to the initial factory demo dataset for Sri Murugan Transport. Are you sure?')) {
      try {
        await api.resetDemo();
        alert('Demo dataset reset successfully! Reloading...');
        window.location.reload();
      } catch (err: any) {
        alert('Failed to reset demo: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Company Profile & System Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure company header details printed on all 4 LR copies, tax rules, and database backups.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
              Official Company Header Details (Printed on LRs)
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={e => handleChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={formData.tagline || ''}
                  onChange={e => handleChange('tagline', e.target.value)}
                  placeholder="e.g. Prompt & Safe Daily Cargo Services"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Registered Head Office / Branch Address *
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Numbers (Booking Hotline) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  GSTIN Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.gstin}
                  onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono font-bold uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* LR Formatting & Numbering */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
              LR Numbering & Print Layout Preferences
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  LR Number Prefix *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lrPrefix}
                  onChange={e => handleChange('lrPrefix', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. SMT-2026-</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Next Sequence Number *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.nextLrNumber}
                  onChange={e => handleChange('nextLrNumber', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Preview: {formData.lrPrefix}{String(formData.nextLrNumber).padStart(4, '0')}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default Payment Type
                </label>
                <select
                  value={formData.defaultPaymentType}
                  onChange={e => handleChange('defaultPaymentType', e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="To Pay">To Pay</option>
                  <option value="Paid">Paid</option>
                  <option value="To Be Billed">To Be Billed (Credit)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                LR Carriage Declaration & Legal Terms (Printed in Footer) *
              </label>
              <textarea
                rows={2}
                required
                value={formData.declaration}
                onChange={e => handleChange('declaration', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Transport Logo & Print Format Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                Transport Logo & Print Format Defaults (A4 / A5 & Landscape Standard)
              </h2>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Transport.pdf Fidelity
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Logo Settings & Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs">
                    <TransportLogo settings={formData} size="lg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Official LR Transport Logo
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Renders in high definition next to company name on all printed LRs.
                    </p>
                    <label className="mt-2 flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                      <input
                        type="checkbox"
                        checked={formData.showLogoOnLR !== false}
                        onChange={e => handleChange('showLogoOnLR', e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Print Transport Logo on Lorry Receipts</span>
                    </label>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Logo Style:
                  </label>
                  <select
                    value={formData.logoStyle || 'emblem'}
                    onChange={e => handleChange('logoStyle', e.target.value as any)}
                    className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="emblem">SMT Royal Emblem (Crest + Truck)</option>
                    <option value="truck">Logistics Truck Vector</option>
                    <option value="badge">Vintage Commercial Seal</option>
                    <option value="custom">Custom Uploaded Image</option>
                  </select>

                  <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            handleChange('logoUrl', ev.target?.result as string);
                            handleChange('logoStyle', 'custom');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Print Defaults: Paper Size, Orientation, Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default Paper Size *
                </label>
                <select
                  value={formData.printPaperSize || 'A4'}
                  onChange={e => handleChange('printPaperSize', e.target.value as any)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg bg-white"
                >
                  <option value="A4">A4 Standard (297 × 210 mm)</option>
                  <option value="A5">A5 Compact Half-Sheet (210 × 148 mm)</option>
                  <option value="Letter">Letter Size (8.5 × 11 in)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Standard commercial printing paper</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default Orientation *
                </label>
                <select
                  value={formData.printLayout || 'landscape'}
                  onChange={e => handleChange('printLayout', e.target.value as any)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg bg-white"
                >
                  <option value="landscape">Landscape (Standard - matches PDF)</option>
                  <option value="portrait">Portrait</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Landscape matches Transport.pdf 100%</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Default Print Mode
                </label>
                <select
                  value={formData.printCopiesPerSheet || '1'}
                  onChange={e => handleChange('printCopiesPerSheet', e.target.value as any)}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg bg-white"
                >
                  <option value="1">1 Copy per Sheet (Standard Full Page)</option>
                  <option value="2">2 Copies per Sheet (Save Paper)</option>
                  <option value="4">4 Copies on 1 Sheet (All-In-One)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Can also be changed in print preview</span>
              </div>
            </div>
          </div>
        </div>

        {/* Printed Lorry Receipt Field & Terms Visibility Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm uppercase tracking-wide">
                  Printed Lorry Receipt Field & Terms Configuration
                </h2>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Toggle individual fields (GSTIN, Driver Name, E-Way Bill, Weight/Rate, or specific carriage terms) on or off for printed Lorry Receipts.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPrintFieldsPreset('standard')}
                className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Standard Preset
              </button>
              <button
                type="button"
                onClick={() => applyPrintFieldsPreset('all')}
                className="px-2.5 py-1.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={() => applyPrintFieldsPreset('minimal')}
                className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Minimal / Compact
              </button>
              <button
                type="button"
                onClick={() => setShowLivePrintPreview(prev => !prev)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
              >
                {showLivePrintPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showLivePrintPreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Group 1: Company Header & Tax IDs */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wide">
                    1. Company Header & GSTIN
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Top Banner</span>
                </div>

                {(
                  [
                    { key: 'showCompanyGstin', label: 'Company GSTIN Number', desc: `Prints "GSTIN: ${formData.gstin || '33AABCS...'}" in receipt header` },
                    { key: 'showCompanyPhone', label: 'Company Phone Numbers', desc: 'Prints office contact numbers in receipt header' },
                    { key: 'showCompanyEmail', label: 'Company Email Address', desc: 'Prints official booking email in header' },
                    { key: 'showCompanyTagline', label: 'Company Tagline / Motto', desc: 'Prints service tagline below company title' },
                  ] as const
                ).map(item => (
                  <label
                    key={item.key}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={activePrintFields[item.key]}
                      onChange={() => handleTogglePrintField(item.key)}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              {/* Group 2: Vehicle, Driver & Dispatch Metadata */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wide">
                    2. Vehicle, Driver Name & Dispatch Info
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Dispatch Bar</span>
                </div>

                {(
                  [
                    { key: 'showDriverName', label: 'Driver Name & Contact Phone', desc: 'Prints assigned Driver Name & mobile number in dispatch strip' },
                    { key: 'showVehicleNumber', label: 'Vehicle Number & Lorry Type', desc: 'Prints Lorry Registration No. & vehicle body type' },
                    { key: 'showBookingAndDeliveryBranch', label: 'Booking Branch & Delivery Godown', desc: 'Prints origin booking office & destination godown row' },
                    { key: 'showExpectedDeliveryDate', label: 'Expected Delivery Date', desc: 'Prints estimated delivery date on the LR' },
                  ] as const
                ).map(item => (
                  <label
                    key={item.key}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={activePrintFields[item.key]}
                      onChange={() => handleTogglePrintField(item.key)}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              {/* Group 3: Party Details, Cargo Table & Charges */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wide">
                    3. Party GSTIN, Cargo & Charges Breakdown
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Body & Totals</span>
                </div>

                {(
                  [
                    { key: 'showPartyGstin', label: 'Consignor & Consignee GSTIN', desc: 'Prints sender and receiver GSTIN numbers in party boxes' },
                    { key: 'showPartyPhone', label: 'Consignor & Consignee Phone Numbers', desc: 'Prints sender and receiver contact numbers' },
                    { key: 'showPartyAddress', label: 'Full Street Address & Pincode', desc: 'Prints complete street address (when off, prints only name)' },
                    { key: 'showPackageType', label: 'Package Type Label (e.g. Carton Box)', desc: 'Prints packaging unit type beside goods description' },
                    { key: 'showWeightAndRate', label: 'Weight (kg) & Rate Columns', desc: 'Prints Weight and Rate columns in goods table' },
                    { key: 'showInvoiceDetails', label: 'Customer Invoice No. & Value', desc: 'Prints consignor invoice number, date, and declared value' },
                    { key: 'showEwayBill', label: 'E-Way Bill Number', desc: 'Prints 12-digit GST E-Way Bill number when present' },
                    { key: 'showChargesBreakdown', label: 'Itemized Freight & Charges Breakdown', desc: 'Prints Freight, Loading/Unloading & Other rows (when off, shows Grand Total only)' },
                  ] as const
                ).map(item => (
                  <label
                    key={item.key}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={activePrintFields[item.key]}
                      onChange={() => handleTogglePrintField(item.key)}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>

              {/* Group 4: Specific Carriage Terms, POD & Signatures */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wide">
                    4. Specific Carriage Terms & Signatures
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Footer & Legal</span>
                </div>

                {(
                  [
                    { key: 'showDeclaration', label: 'Primary Carriage Declaration Paragraph', desc: 'Prints the custom legal declaration text configured above' },
                    { key: 'termOwnersRisk', label: "Specific Term: Strictly at Owner's Risk", desc: 'Adds clause: "1. Consignment booked and carried strictly at Owner\'s Risk."' },
                    { key: 'termDemurrage', label: 'Specific Term: 7-Day Demurrage / Godown Rent', desc: 'Adds clause: "2. Demurrage / Godown rent applicable after 7 days of arrival."' },
                    { key: 'termNoContraband', label: 'Specific Term: No Hazardous / Contraband Goods', desc: 'Adds clause: "3. Consignor certifies no hazardous or prohibited goods are packed."' },
                    { key: 'termSubjectToJurisdiction', label: 'Specific Term: Local Court Jurisdiction', desc: 'Adds clause: "4. All disputes are subject to local court jurisdiction only."' },
                    { key: 'showConsignorSignature', label: 'Consignor Signature Column', desc: 'Includes Consignor Signature line in bottom footer' },
                    { key: 'showDriverSignature', label: 'Driver Signature Column', desc: 'Includes Driver Signature line in bottom footer' },
                    { key: 'showDeliveryAckBlock', label: 'Delivery Completed (POD) Verification Strip', desc: 'Prints receiver POD & ACK photo stamp on Delivered LRs' },
                  ] as const
                ).map(item => (
                  <label
                    key={item.key}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={activePrintFields[item.key]}
                      onChange={() => handleTogglePrintField(item.key)}
                      className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Live Interactive Lorry Receipt Preview */}
            {showLivePrintPreview && (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-800 tracking-wide">
                      Live Printed Lorry Receipt Preview
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Toggle any switch above to see fields (GSTIN, Driver Name, Specific Terms, Signatures) update immediately on the receipt below.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded border border-blue-200">
                    Real-Time Print Preview
                  </span>
                </div>
                <div className="overflow-x-auto bg-white p-3 rounded-lg border border-slate-200">
                  <LRPrintTemplate
                    lr={samplePreviewLR}
                    settings={formData}
                    copyType="Consignor Copy"
                    isCompact={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Company & Print Field Settings'}</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Maintenance Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
              Database Maintenance, Backup & Demo Restore
            </h2>
            <p className="text-xs text-slate-500">
              Download complete SQLite / JSON archives for off-site backup or restore from file.
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Export MySQL .SQL */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Export MySQL (.SQL) Dump</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Complete MySQL 8.0 / MariaDB / XAMPP `.sql` script with all 13 tables & records.
              </p>
            </div>
            <button
              type="button"
              onClick={() => api.downloadMySqlDump()}
              className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download MySQL (.SQL)</span>
            </button>
          </div>

          {/* Export JSON */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Export JSON Backup</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Save complete records (LRs, payments, masters, settings) to your computer.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Restore from Backup</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload a previously exported backup file to restore application state.
              </p>
            </div>
            <label className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors text-center">
              <Upload className="w-4 h-4" />
              <span>Upload & Restore</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset Demo */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Reset Standard Demo Data</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Revert to the original Sri Murugan Transport demo dataset matching Transport.pdf.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetDemo}
              className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset to Demo Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
