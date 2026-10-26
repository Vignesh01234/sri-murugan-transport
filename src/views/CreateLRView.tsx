import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Trash2, Printer, Save, RefreshCw, 
  Eye, Truck, MapPin, User, Building, IndianRupee, AlertCircle, CheckCircle2,
  Package, FileClock, Check
} from 'lucide-react';
import type { LR, LRItem, Party, Vehicle, City, Route, CompanySettings, RateBasis, PaymentType, PackageType, LRStatus } from '../types/index';
import { api } from '../services/api';
import { LRPrintModal } from '../components/LRPrintModal';
import { PartyModal } from '../components/PartyModal';
import { VehicleModal, CityModal, PackageTypeModal } from '../components/MasterModals';
import { TransportLogo } from '../components/TransportLogo';

interface Props {
  initialLR?: LR | null;
  settings: CompanySettings;
  currentUser: string;
  onSaved: (lr: LR, shouldPrint?: boolean) => void;
  onCancel?: () => void;
}

export const CreateLRView: React.FC<Props> = ({
  initialLR,
  settings,
  currentUser,
  onSaved,
  onCancel
}) => {
  // Master data
  const [parties, setParties] = useState<Party[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Modals for quick-adding master data
  const [showPartyModal, setShowPartyModal] = useState<null | { type: 'consignor' | 'consignee' }>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showPackageTypeModal, setShowPackageTypeModal] = useState(false);
  const [targetItemIndexForPkg, setTargetItemIndexForPkg] = useState<number | null>(null);
  const [previewLRData, setPreviewLRData] = useState<LR | null>(null);

  // Form State: LR Details
  const [lrNumber, setLrNumber] = useState<string>('');
  const [lrDate, setLrDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('K. Rajendran');
  const [driverPhone, setDriverPhone] = useState<string>('9840112233');
  const [fromCity, setFromCity] = useState<string>('Ranipet');
  const [toCity, setToCity] = useState<string>('Chennai');
  const [bookingBranch, setBookingBranch] = useState<string>('Ranipet Main Branch');
  const [deliveryBranch, setDeliveryBranch] = useState<string>('Chennai Guindy Godown');
  const [bookingStaff, setBookingStaff] = useState<string>(currentUser);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [status, setStatus] = useState<LR['status']>('Booked');

  // Consignor
  const [consignorId, setConsignorId] = useState<string>('');
  const [consignorName, setConsignorName] = useState<string>('');
  const [consignorBusinessName, setConsignorBusinessName] = useState<string>('');
  const [consignorAddress, setConsignorAddress] = useState<string>('');
  const [consignorCity, setConsignorCity] = useState<string>('Ranipet');
  const [consignorState, setConsignorState] = useState<string>('Tamil Nadu');
  const [consignorPincode, setConsignorPincode] = useState<string>('632401');
  const [consignorPhone, setConsignorPhone] = useState<string>('');
  const [consignorGstin, setConsignorGstin] = useState<string>('');
  const [consignorContactPerson, setConsignorContactPerson] = useState<string>('');

  // Consignee
  const [consigneeId, setConsigneeId] = useState<string>('');
  const [consigneeName, setConsigneeName] = useState<string>('');
  const [consigneeBusinessName, setConsigneeBusinessName] = useState<string>('');
  const [consigneeAddress, setConsigneeAddress] = useState<string>('');
  const [consigneeCity, setConsigneeCity] = useState<string>('Chennai');
  const [consigneeState, setConsigneeState] = useState<string>('Tamil Nadu');
  const [consigneePincode, setConsigneePincode] = useState<string>('600001');
  const [consigneePhone, setConsigneePhone] = useState<string>('');
  const [consigneeGstin, setConsigneeGstin] = useState<string>('');
  const [consigneeContactPerson, setConsigneeContactPerson] = useState<string>('');

  // Goods items
  const [items, setItems] = useState<LRItem[]>([
    {
      id: 'itm-1',
      serialNo: 1,
      description: 'Industrial Machine Spares',
      packageType: 'Carton Box',
      packages: 10,
      weight: 250,
      rate: 8.0,
      rateBasis: 'per_kg',
      amount: 2000
    }
  ]);

  // Invoice & references
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [invoiceValue, setInvoiceValue] = useState<string>('50000');
  const [ewayBillNumber, setEwayBillNumber] = useState<string>('');
  const [otherReference, setOtherReference] = useState<string>('');

  // Freight & Charges
  const [paymentType, setPaymentType] = useState<PaymentType>(settings.defaultPaymentType || 'To Pay');
  const [manualFreightOverride, setManualFreightOverride] = useState<boolean>(false);
  const [freightAmount, setFreightAmount] = useState<string>('2000');
  const [loadingCharges, setLoadingCharges] = useState<string>('150');
  const [unloadingCharges, setUnloadingCharges] = useState<string>('150');
  const [otherCharges, setOtherCharges] = useState<string>('50');
  const [hamaliCharges, setHamaliCharges] = useState<string>('0');
  const [additionalCharges, setAdditionalCharges] = useState<string>('0');
  const [discount, setDiscount] = useState<string>('0');

  // GST
  const [gstApplicable, setGstApplicable] = useState<boolean>(settings.gstEnabled || false);
  const [gstRate, setGstRate] = useState<string>(String(settings.defaultGstRate || 5));

  // Validation & status
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Load masters & next LR number
  useEffect(() => {
    loadMasters();
  }, []);

  const loadMasters = async () => {
    try {
      setLoadingMasters(true);
      const [ptys, vehs, cties, rtes, pkgs] = await Promise.all([
        api.getParties(),
        api.getVehicles(),
        api.getCities(),
        api.getRoutes(),
        api.getPackageTypes()
      ]);
      setParties(ptys);
      setVehicles(vehs);
      setCities(cties);
      setRoutes(rtes);
      setPackageTypes(pkgs);

      if (initialLR) {
        populateFormFromLR(initialLR);
      } else {
        const nextNum = await api.getNextLRNumber();
        setLrNumber(nextNum);
        if (vehs.length > 0) {
          setVehicleNumber(vehs[0].vehicleNumber);
          setVehicleType(vehs[0].vehicleType);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to load initial masters: ' + err.message });
    } finally {
      setLoadingMasters(false);
    }
  };

  const populateFormFromLR = (lr: LR) => {
    setLrNumber(lr.lrNumber);
    setLrDate(lr.lrDate);
    setVehicleNumber(lr.vehicleNumber);
    setVehicleType(lr.vehicleType || '');
    setDriverName(lr.driverName || '');
    setDriverPhone(lr.driverPhone || '');
    setFromCity(lr.fromCity);
    setToCity(lr.toCity);
    setBookingBranch(lr.bookingBranch || 'Ranipet Main Branch');
    setDeliveryBranch(lr.deliveryBranch || 'Chennai Guindy Godown');
    setBookingStaff(lr.bookingStaff || currentUser);
    setExpectedDeliveryDate(lr.expectedDeliveryDate || '');
    setStatus(lr.status);

    setConsignorId(lr.consignorId || '');
    setConsignorName(lr.consignorName);
    setConsignorBusinessName(lr.consignorBusinessName || lr.consignorName);
    setConsignorAddress(lr.consignorAddress);
    setConsignorCity(lr.consignorCity);
    setConsignorState(lr.consignorState);
    setConsignorPincode(lr.consignorPincode);
    setConsignorPhone(lr.consignorPhone);
    setConsignorGstin(lr.consignorGstin || '');
    setConsignorContactPerson(lr.consignorContactPerson || '');

    setConsigneeId(lr.consigneeId || '');
    setConsigneeName(lr.consigneeName);
    setConsigneeBusinessName(lr.consigneeBusinessName || lr.consigneeName);
    setConsigneeAddress(lr.consigneeAddress);
    setConsigneeCity(lr.consigneeCity);
    setConsigneeState(lr.consigneeState);
    setConsigneePincode(lr.consigneePincode);
    setConsigneePhone(lr.consigneePhone);
    setConsigneeGstin(lr.consigneeGstin || '');
    setConsigneeContactPerson(lr.consigneeContactPerson || '');

    setItems(lr.items || []);
    setInvoiceNumber(lr.invoiceNumber || '');
    setInvoiceDate(lr.invoiceDate || '');
    setInvoiceValue(String(lr.invoiceValue || 0));
    setEwayBillNumber(lr.ewayBillNumber || '');
    setOtherReference(lr.otherReference || '');

    setPaymentType(lr.paymentType);
    setFreightAmount(String(lr.freightAmount));
    setManualFreightOverride(true);
    setLoadingCharges(String(lr.loadingCharges));
    setUnloadingCharges(String(lr.unloadingCharges));
    setOtherCharges(String(lr.otherCharges));
    setHamaliCharges(String(lr.hamaliCharges));
    setAdditionalCharges(String(lr.additionalCharges));
    setDiscount(String(lr.discount));

    setGstApplicable(lr.gstApplicable);
    setGstRate(String(lr.gstRate));
  };

  // Goods calculations
  const totalPackages = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.packages) || 0), 0);
  }, [items]);

  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  }, [items]);

  const calculatedItemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [items]);

  // Keep Freight Amount in sync with items calculation unless manually overridden
  useEffect(() => {
    if (!manualFreightOverride) {
      setFreightAmount(String(calculatedItemsSubtotal));
    }
  }, [calculatedItemsSubtotal, manualFreightOverride]);

  // Financial calculations
  const totalBeforeGst = useMemo(() => {
    const f = Number(freightAmount) || 0;
    const l = Number(loadingCharges) || 0;
    const u = Number(unloadingCharges) || 0;
    const o = Number(otherCharges) || 0;
    const h = Number(hamaliCharges) || 0;
    const a = Number(additionalCharges) || 0;
    const d = Number(discount) || 0;
    return Math.max(0, f + l + u + o + h + a - d);
  }, [freightAmount, loadingCharges, unloadingCharges, otherCharges, hamaliCharges, additionalCharges, discount]);

  const gstAmount = useMemo(() => {
    if (!gstApplicable) return 0;
    const rate = Number(gstRate) || 0;
    // Calculate on freight or total based on settings
    const base = settings.taxCalculationBasis === 'total' ? totalBeforeGst : (Number(freightAmount) || 0);
    return Math.round((base * (rate / 100)) * 100) / 100;
  }, [gstApplicable, gstRate, totalBeforeGst, freightAmount, settings.taxCalculationBasis]);

  const grandTotal = useMemo(() => {
    return Math.round((totalBeforeGst + gstAmount) * 100) / 100;
  }, [totalBeforeGst, gstAmount]);

  // Item row operations
  const updateItemRow = (index: number, field: keyof LRItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Auto-calculate amount based on rate basis
      const pkgs = Number(item.packages) || 0;
      const wt = Number(item.weight) || 0;
      const r = Number(item.rate) || 0;

      if (item.rateBasis === 'per_pkg') {
        item.amount = Math.round(pkgs * r * 100) / 100;
      } else if (item.rateBasis === 'per_kg') {
        item.amount = Math.round(wt * r * 100) / 100;
      } else if (item.rateBasis === 'flat') {
        item.amount = r;
      }

      updated[index] = item;
      return updated;
    });
  };

  const addItemRow = () => {
    const defaultPkg = packageTypes[0]?.name || 'Carton Box';
    setItems(prev => [
      ...prev,
      {
        id: 'itm-' + Date.now(),
        serialNo: prev.length + 1,
        description: '',
        packageType: defaultPkg,
        packages: 1,
        weight: 10,
        rate: 5.0,
        rateBasis: 'per_kg',
        amount: 50
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index).map((item, idx) => ({ ...item, serialNo: idx + 1 })));
  };

  // Consignor selection from master
  const handleSelectConsignor = (partyId: string) => {
    setConsignorId(partyId);
    const p = parties.find(x => x.id === partyId);
    if (p) {
      setConsignorName(p.name);
      setConsignorBusinessName(p.businessName || p.name);
      setConsignorAddress(p.address);
      setConsignorCity(p.city);
      setConsignorState(p.state);
      setConsignorPincode(p.pincode);
      setConsignorPhone(p.phone);
      setConsignorGstin(p.gstin || '');
      setFromCity(p.city);
    }
  };

  // Consignee selection from master
  const handleSelectConsignee = (partyId: string) => {
    setConsigneeId(partyId);
    const p = parties.find(x => x.id === partyId);
    if (p) {
      setConsigneeName(p.name);
      setConsigneeBusinessName(p.businessName || p.name);
      setConsigneeAddress(p.address);
      setConsigneeCity(p.city);
      setConsigneeState(p.state);
      setConsigneePincode(p.pincode);
      setConsigneePhone(p.phone);
      setConsigneeGstin(p.gstin || '');
      setToCity(p.city);
    }
  };

  // Assemble full LR payload
  const buildLRObject = (): Partial<LR> => {
    return {
      id: initialLR?.id,
      lrNumber: lrNumber.trim(),
      lrDate,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType,
      driverName: driverName.trim() || undefined,
      driverPhone: driverPhone.trim() || undefined,
      fromCity: fromCity.trim(),
      toCity: toCity.trim(),
      bookingBranch,
      deliveryBranch,
      bookingStaff,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      status,

      consignorId,
      consignorName: consignorName.trim(),
      consignorBusinessName: consignorBusinessName.trim() || consignorName.trim(),
      consignorAddress: consignorAddress.trim(),
      consignorCity: consignorCity.trim(),
      consignorState: consignorState.trim(),
      consignorPincode: consignorPincode.trim(),
      consignorPhone: consignorPhone.trim(),
      consignorGstin: consignorGstin.trim().toUpperCase(),
      consignorContactPerson: consignorContactPerson.trim(),

      consigneeId,
      consigneeName: consigneeName.trim(),
      consigneeBusinessName: consigneeBusinessName.trim() || consigneeName.trim(),
      consigneeAddress: consigneeAddress.trim(),
      consigneeCity: consigneeCity.trim(),
      consigneeState: consigneeState.trim(),
      consigneePincode: consigneePincode.trim(),
      consigneePhone: consigneePhone.trim(),
      consigneeGstin: consigneeGstin.trim().toUpperCase(),
      consigneeContactPerson: consigneeContactPerson.trim(),

      items,
      totalPackages,
      totalWeight,

      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: invoiceDate || undefined,
      invoiceValue: Number(invoiceValue) || 0,
      ewayBillNumber: ewayBillNumber.trim(),
      otherReference: otherReference.trim(),

      paymentType,
      freightAmount: Number(freightAmount) || 0,
      loadingCharges: Number(loadingCharges) || 0,
      unloadingCharges: Number(unloadingCharges) || 0,
      otherCharges: Number(otherCharges) || 0,
      hamaliCharges: Number(hamaliCharges) || 0,
      additionalCharges: Number(additionalCharges) || 0,
      discount: Number(discount) || 0,
      gstApplicable,
      gstRate: Number(gstRate) || 0,
      gstAmount,
      grandTotal
    };
  };

  // Validation
  const validate = (): string | null => {
    if (!lrNumber.trim()) return 'LR Number is required';
    if (!vehicleNumber.trim()) return 'Vehicle Number is required';
    if (!fromCity.trim()) return 'From City is required';
    if (!toCity.trim()) return 'To City is required';
    if (!consignorName.trim()) return 'Consignor / Sender name is required';
    if (!consigneeName.trim()) return 'Consignee / Receiver name is required';
    if (!items || items.length === 0) return 'At least one goods item row is required';
    const emptyDesc = items.find(i => !i.description.trim());
    if (emptyDesc) return 'Please provide description for all goods items';
    if (grandTotal <= 0) return 'Grand Total must be greater than zero';
    return null;
  };

  const handleSave = async (shouldPrint = false, forceStatus?: LRStatus) => {
    const targetStatus = forceStatus || (status === 'Draft' ? 'Booked' : status);
    const errorMsg = validate();
    if (errorMsg) {
      setFeedback({ type: 'error', message: errorMsg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const payload = {
        ...buildLRObject(),
        status: targetStatus
      };
      const saved = await api.saveLR(payload);
      setStatus(saved.status);
      setFeedback({ 
        type: 'success', 
        message: targetStatus === 'Booked' && status === 'Draft'
          ? `Draft finalized! LR ${saved.lrNumber} is now officially booked.`
          : `LR ${saved.lrNumber} saved successfully!` 
      });
      onSaved(saved, shouldPrint);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save LR' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      let activeLrNumber = lrNumber.trim();
      if (!activeLrNumber) {
        activeLrNumber = `DRAFT-${Date.now().toString().slice(-4)}`;
        setLrNumber(activeLrNumber);
      }

      const payload = {
        ...buildLRObject(),
        lrNumber: activeLrNumber,
        status: 'Draft' as const
      };

      const saved = await api.saveLR(payload);
      setStatus('Draft');
      setFeedback({ 
        type: 'success', 
        message: `Consignment draft saved as ${saved.lrNumber}! You can edit and book it whenever details are finalized.` 
      });
      onSaved(saved, false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save draft' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    const errorMsg = validate();
    if (errorMsg) {
      setFeedback({ type: 'error', message: errorMsg });
      return;
    }
    const current = buildLRObject() as LR;
    setPreviewLRData(current);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all form fields?')) {
      loadMasters();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <TransportLogo settings={settings} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-blue-100 text-blue-800 tracking-wide">
                Data Entry
              </span>
              <h1 className="text-2xl font-black text-slate-900">
                {initialLR ? `Edit Lorry Receipt: ${initialLR.lrNumber}` : 'Create New Lorry Receipt (LR)'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Single entry records master details, ledgers, payment tracking, and all 4 printable copies (Consignor, Consignee, Driver & Office).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
          >
            <Eye className="w-4 h-4 text-slate-600" />
            <span>Preview LR</span>
          </button>

          {/* Save as Draft Button */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            title="Save consignment as draft without strict validation"
          >
            <FileClock className="w-4 h-4 text-amber-700" />
            <span>Save as Draft</span>
          </button>

          {status === 'Draft' && (
            <button
              type="button"
              onClick={() => handleSave(false, 'Booked')}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50 ring-2 ring-emerald-300"
              title="Convert draft into official booked LR"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Finalize & Book LR</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : status === 'Draft' ? 'Save Draft Updates' : 'Save & Generate LR'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true, status === 'Draft' ? 'Booked' : undefined)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Save & Print (4 Copies)</span>
          </button>
        </div>
      </div>

      {/* Draft Status Alert Banner */}
      {status === 'Draft' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <FileClock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-200 text-amber-900 border border-amber-300">
                  DRAFT LR
                </span>
                <span className="font-bold text-sm text-amber-900">
                  This consignment note is currently saved as a DRAFT ({lrNumber})
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Stored on offline local disk. Vehicle number, exact weights, and invoices can be updated anytime. When ready, click "Finalize & Book LR" to assign official booking serial and generate 4 print copies.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSave(false, 'Booked')}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finalize & Book Now</span>
          </button>
        </div>
      )}

      {/* Notifications / Errors */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-xs ${
          feedback.type === 'error'
            ? 'bg-rose-50 text-rose-800 border border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ================= SECTION A: LR DETAILS ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              A
            </span>
            <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
              LR Details & Vehicle Allocation
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium">Step 1 of 5</div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              LR Number *
            </label>
            <input
              type="text"
              value={lrNumber}
              onChange={e => setLrNumber(e.target.value.toUpperCase())}
              required
              className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50 text-blue-900"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-generated unique serial</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              LR Date *
            </label>
            <input
              type="date"
              value={lrDate}
              onChange={e => setLrDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Vehicle Number *
              </label>
              <button
                type="button"
                onClick={() => setShowVehicleModal(true)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                + New Vehicle
              </button>
            </div>
            <select
              value={vehicleNumber}
              onChange={e => {
                setVehicleNumber(e.target.value);
                const found = vehicles.find(v => v.vehicleNumber === e.target.value);
                if (found) setVehicleType(found.vehicleType);
              }}
              required
              className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white uppercase"
            >
              <option value="">-- Select Vehicle --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.vehicleNumber}>
                  {v.vehicleNumber} ({v.vehicleType} - {v.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              LR Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Draft">Draft (Pending Finalization)</option>
              <option value="Booked">Booked (Origin Godown)</option>
              <option value="In Transit">In Transit (On Highway)</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* City Origin and Destination */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase">From City *</label>
              <button
                type="button"
                onClick={() => setShowCityModal(true)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                + Add City
              </button>
            </div>
            <select
              value={fromCity}
              onChange={e => setFromCity(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="">-- Origin City --</option>
              {cities.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.state})</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase">To City *</label>
              <button
                type="button"
                onClick={() => setShowCityModal(true)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
              >
                + Add City
              </button>
            </div>
            <select
              value={toCity}
              onChange={e => setToCity(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="">-- Destination City --</option>
              {cities.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.state})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Booking Branch
            </label>
            <input
              type="text"
              value={bookingBranch}
              onChange={e => setBookingBranch(e.target.value)}
              placeholder="e.g. Ranipet Main Branch"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Delivery Branch / Godown
            </label>
            <input
              type="text"
              value={deliveryBranch}
              onChange={e => setDeliveryBranch(e.target.value)}
              placeholder="e.g. Chennai Guindy Godown"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Driver Name
            </label>
            <input
              type="text"
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              placeholder="e.g. K. Rajendran"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Driver Phone
            </label>
            <input
              type="text"
              value={driverPhone}
              onChange={e => setDriverPhone(e.target.value)}
              placeholder="e.g. 9840112233"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ================= SECTION B & C: PARTIES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CONSIGNOR (FROM) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                B
              </span>
              <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                Consignor Details (Sender / From)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowPartyModal({ type: 'consignor' })}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              + Create Party
            </button>
          </div>

          <div className="p-6 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select from Party Master
              </label>
              <select
                value={consignorId}
                onChange={e => handleSelectConsignor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="">-- Choose Existing Consignor --</option>
                {parties.filter(p => p.customerType !== 'Consignee').map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Consignor Name *
                </label>
                <input
                  type="text"
                  required
                  value={consignorName}
                  onChange={e => setConsignorName(e.target.value)}
                  placeholder="e.g. Sri Krishna Textiles"
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={consignorPhone}
                  onChange={e => setConsignorPhone(e.target.value)}
                  placeholder="98401 23456"
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
                value={consignorAddress}
                onChange={e => setConsignorAddress(e.target.value)}
                placeholder="Plot 45, SIPCOT Phase 2, Bhel Road"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
                <input
                  type="text"
                  value={consignorCity}
                  onChange={e => setConsignorCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PIN Code</label>
                <input
                  type="text"
                  value={consignorPincode}
                  onChange={e => setConsignorPincode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GSTIN</label>
                <input
                  type="text"
                  value={consignorGstin}
                  onChange={e => setConsignorGstin(e.target.value.toUpperCase())}
                  placeholder="33AAAAA0000A1Z5"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg uppercase focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CONSIGNEE (TO) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                C
              </span>
              <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                Consignee Details (Receiver / To)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowPartyModal({ type: 'consignee' })}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              + Create Party
            </button>
          </div>

          <div className="p-6 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select from Party Master
              </label>
              <select
                value={consigneeId}
                onChange={e => handleSelectConsignee(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="">-- Choose Existing Consignee --</option>
                {parties.filter(p => p.customerType !== 'Consignor').map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Consignee Name *
                </label>
                <input
                  type="text"
                  required
                  value={consigneeName}
                  onChange={e => setConsigneeName(e.target.value)}
                  placeholder="e.g. Balaji Hardware & Tools"
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={consigneePhone}
                  onChange={e => setConsigneePhone(e.target.value)}
                  placeholder="98402 22333"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Delivery Address
              </label>
              <textarea
                rows={2}
                value={consigneeAddress}
                onChange={e => setConsigneeAddress(e.target.value)}
                placeholder="112 Broadway Street, George Town, Chennai"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
                <input
                  type="text"
                  value={consigneeCity}
                  onChange={e => setConsigneeCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PIN Code</label>
                <input
                  type="text"
                  value={consigneePincode}
                  onChange={e => setConsigneePincode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GSTIN</label>
                <input
                  type="text"
                  value={consigneeGstin}
                  onChange={e => setConsigneeGstin(e.target.value.toUpperCase())}
                  placeholder="33AAAAA0000A1Z5"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg uppercase focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION D: GOODS DETAILS ================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              D
            </span>
            <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
              Goods Description & Multi-Item Calculation Table
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetItemIndexForPkg(null);
                setShowPackageTypeModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs"
              title="Add a new custom packaging type to master"
            >
              <Package className="w-3.5 h-3.5 text-amber-700" />
              <span>+ Add Pkg Type</span>
            </button>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goods Item</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">Description of Goods *</th>
                  <th className="py-2.5 px-3 w-36">Pkg Type</th>
                  <th className="py-2.5 px-3 w-28 text-center">Pkgs *</th>
                  <th className="py-2.5 px-3 w-32 text-right">Weight (kg) *</th>
                  <th className="py-2.5 px-3 w-32 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 w-32 text-center">Rate Basis</th>
                  <th className="py-2.5 px-3 w-36 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={e => updateItemRow(idx, 'description', e.target.value)}
                        placeholder="e.g. Cotton Garments / Auto Parts"
                        className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={item.packageType || (packageTypes[0]?.name || 'Carton Box')}
                        onChange={e => {
                          if (e.target.value === '__NEW_PKG__') {
                            setTargetItemIndexForPkg(idx);
                            setShowPackageTypeModal(true);
                          } else {
                            updateItemRow(idx, 'packageType', e.target.value);
                          }
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
                      >
                        {packageTypes.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name}{p.code ? ` (${p.code})` : ''}
                          </option>
                        ))}
                        <option value="__NEW_PKG__" className="font-bold text-blue-700 bg-blue-50">
                          + Add New Package Type...
                        </option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="1"
                        value={item.packages}
                        onChange={e => updateItemRow(idx, 'packages', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-bold text-center border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.weight}
                        onChange={e => updateItemRow(idx, 'weight', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-semibold text-right border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={e => updateItemRow(idx, 'rate', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-semibold text-right border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={item.rateBasis}
                        onChange={e => updateItemRow(idx, 'rateBasis', e.target.value as RateBasis)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="per_kg">Per kg</option>
                        <option value="per_pkg">Per Pkg</option>
                        <option value="flat">Flat Total</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={e => updateItemRow(idx, 'amount', Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs font-bold text-right border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-slate-50"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-20"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totals Footer */}
              <tfoot className="bg-slate-50 font-bold text-xs text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-600">
                    Total Packages & Weight:
                  </td>
                  <td className="py-2.5 px-3 text-center text-sm font-black text-blue-900">
                    {totalPackages}
                  </td>
                  <td className="py-2.5 px-3 text-right text-sm font-black text-blue-900">
                    {totalWeight.toFixed(1)} kg
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-slate-600">
                    Calculated Goods Subtotal:
                  </td>
                  <td className="py-2.5 px-3 text-right text-sm font-black text-emerald-800">
                    ₹{calculatedItemsSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ================= SECTION E & F: INVOICE & CHARGES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION E: INVOICE DETAILS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              E
            </span>
            <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
              Invoice & Reference Documents
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Sender Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV/2026/0894"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Invoice Value of Goods (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceValue}
                  onChange={e => setInvoiceValue(e.target.value)}
                  placeholder="50000.00"
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Goods valuation (not freight)</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  E-way Bill Number (EWB)
                </label>
                <input
                  type="text"
                  value={ewayBillNumber}
                  onChange={e => setEwayBillNumber(e.target.value)}
                  placeholder="12-digit E-way Bill No."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Other Reference / Purchase Order (PO)
              </label>
              <input
                type="text"
                value={otherReference}
                onChange={e => setOtherReference(e.target.value)}
                placeholder="e.g. PO No. 8831 / Delivery Challan"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg">
              <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                Payment Basis *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['To Pay', 'Paid', 'To Be Billed'] as const).map(pt => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setPaymentType(pt)}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold uppercase transition-all text-center ${
                      paymentType === pt
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-blue-700 mt-2 font-medium">
                {paymentType === 'To Pay' && '• "To Pay" will appear prominently on the LR; payment collected from Consignee upon delivery.'}
                {paymentType === 'Paid' && '• Payment received upfront at booking from Consignor; recorded immediately in cash registry.'}
                {paymentType === 'To Be Billed' && '• Consignment booked on credit; billed to customer account ledger periodically.'}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION F: FREIGHT & ADDITIONAL CHARGES */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                F
              </span>
              <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                Freight & Additional Charges
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">Currency: ₹ INR</span>
          </div>

          <div className="p-6 space-y-3.5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Freight Amount (₹) *
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500">
                    <input
                      type="checkbox"
                      checked={manualFreightOverride}
                      onChange={e => setManualFreightOverride(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Custom Rate</span>
                  </label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={freightAmount}
                  onChange={e => {
                    setManualFreightOverride(true);
                    setFreightAmount(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Loading Charges (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={loadingCharges}
                  onChange={e => setLoadingCharges(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Unloading Charges (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={unloadingCharges}
                  onChange={e => setUnloadingCharges(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Other Charges (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={otherCharges}
                  onChange={e => setOtherCharges(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hamali Charges (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={hamaliCharges}
                  onChange={e => setHamaliCharges(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Additional (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={additionalCharges}
                  onChange={e => setAdditionalCharges(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-rose-600 font-semibold"
                />
              </div>
            </div>

            {/* GST Config */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gstApplicable}
                  onChange={e => setGstApplicable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800 uppercase">Apply GST Tax</span>
              </label>

              {gstApplicable && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Rate:</span>
                  <select
                    value={gstRate}
                    onChange={e => setGstRate(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-bold"
                  >
                    <option value="5">5% (Transport Standard)</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                  <span className="text-xs font-bold text-slate-900 ml-1">
                    = ₹{gstAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Grand Total Summary Box */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-md">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Grand Total Payable
                </span>
                <span className="text-xs text-slate-300">
                  Total Before GST: ₹{totalBeforeGst.toFixed(2)} {gstApplicable && `+ GST ₹${gstAmount.toFixed(2)}`}
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-400">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="sticky bottom-4 z-20 bg-slate-900 text-white p-4 rounded-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="text-slate-400">Total Goods: </span>
            <span className="font-bold text-white">{totalPackages} Pkgs</span> &nbsp;|&nbsp;
            <span className="text-slate-400"> Weight: </span>
            <span className="font-bold text-white">{totalWeight} kg</span> &nbsp;|&nbsp;
            <span className="text-slate-400"> Total: </span>
            <span className="font-black text-emerald-400 text-sm">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <Eye className="w-4 h-4" />
            <span>Preview LR</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Save draft without strict completion requirements"
          >
            <FileClock className="w-4 h-4 text-amber-400" />
            <span>Save as Draft</span>
          </button>

          {status === 'Draft' && (
            <button
              type="button"
              onClick={() => handleSave(false, 'Booked')}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 ring-2 ring-emerald-400/50"
              title="Finalize draft into booked LR"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Finalize & Book</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : status === 'Draft' ? 'Save Draft Updates' : 'Save & Generate LR'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true, status === 'Draft' ? 'Booked' : undefined)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Save & Print (All 4 Copies)</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {previewLRData && (
        <LRPrintModal
          lr={previewLRData}
          settings={settings}
          onClose={() => setPreviewLRData(null)}
        />
      )}

      {showPackageTypeModal && (
        <PackageTypeModal
          onClose={() => {
            setShowPackageTypeModal(false);
            setTargetItemIndexForPkg(null);
          }}
          onSuccess={newPkg => {
            setPackageTypes(prev => {
              const exists = prev.some(p => p.id === newPkg.id);
              if (exists) return prev.map(p => p.id === newPkg.id ? newPkg : p);
              return [newPkg, ...prev];
            });
            if (targetItemIndexForPkg !== null && items[targetItemIndexForPkg]) {
              updateItemRow(targetItemIndexForPkg, 'packageType', newPkg.name);
            }
            setShowPackageTypeModal(false);
            setTargetItemIndexForPkg(null);
            setFeedback({ type: 'success', message: `Added new package type: ${newPkg.name}` });
          }}
        />
      )}

      {showPartyModal && (
        <PartyModal
          existingParties={parties}
          initialType={showPartyModal.type === 'consignor' ? 'Consignor' : 'Consignee'}
          onClose={() => setShowPartyModal(null)}
          onSuccess={newP => {
            setParties(prev => [newP, ...prev]);
            if (showPartyModal.type === 'consignor') {
              handleSelectConsignor(newP.id);
            } else {
              handleSelectConsignee(newP.id);
            }
            setShowPartyModal(null);
          }}
        />
      )}

      {showVehicleModal && (
        <VehicleModal
          onClose={() => setShowVehicleModal(false)}
          onSuccess={newV => {
            setVehicles(prev => [newV, ...prev]);
            setVehicleNumber(newV.vehicleNumber);
            setVehicleType(newV.vehicleType);
            setShowVehicleModal(false);
          }}
        />
      )}

      {showCityModal && (
        <CityModal
          onClose={() => setShowCityModal(false)}
          onSuccess={newC => {
            setCities(prev => [...prev, newC]);
            setShowCityModal(false);
          }}
        />
      )}
    </div>
  );
};
