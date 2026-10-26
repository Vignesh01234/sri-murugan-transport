export type LRStatus = 'Draft' | 'Booked' | 'In Transit' | 'Delivered' | 'Cancelled';
export type PaymentType = 'To Pay' | 'Paid' | 'To Be Billed';
export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid';
export type RateBasis = 'per_pkg' | 'per_kg' | 'flat';
export type UserRole = 'Administrator' | 'Booking Staff' | 'Accountant' | 'Viewer';

export interface PackageType {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdAt?: string;
}

export interface LRItem {
  id: string;
  serialNo: number;
  description: string;
  packageType?: string;
  packages: number;
  weight: number;
  rate: number;
  rateBasis: RateBasis;
  amount: number;
}

export interface LR {
  id: string;
  lrNumber: string;
  lrDate: string;
  vehicleNumber: string;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
  fromCity: string;
  toCity: string;
  bookingBranch?: string;
  deliveryBranch?: string;
  bookingStaff?: string;
  expectedDeliveryDate?: string;
  status: LRStatus;
  cancelReason?: string;
  deliveryDate?: string;
  deliveryReceivedBy?: string;
  podReference?: string;
  deliveryRemarks?: string;
  ackPhotoUrl?: string;
  ackPhotoFileName?: string;
  ackPhotoUploadedAt?: string;

  // Consignor
  consignorId?: string;
  consignorName: string;
  consignorBusinessName?: string;
  consignorAddress: string;
  consignorCity: string;
  consignorState: string;
  consignorPincode: string;
  consignorPhone: string;
  consignorGstin?: string;
  consignorContactPerson?: string;

  // Consignee
  consigneeId?: string;
  consigneeName: string;
  consigneeBusinessName?: string;
  consigneeAddress: string;
  consigneeCity: string;
  consigneeState: string;
  consigneePincode: string;
  consigneePhone: string;
  consigneeGstin?: string;
  consigneeContactPerson?: string;

  // Items
  items: LRItem[];
  totalPackages: number;
  totalWeight: number;

  // Invoice
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceValue: number;
  ewayBillNumber?: string;
  otherReference?: string;

  // Charges
  paymentType: PaymentType;
  freightAmount: number;
  loadingCharges: number;
  unloadingCharges: number;
  otherCharges: number;
  hamaliCharges: number;
  additionalCharges: number;
  discount: number;
  gstApplicable: boolean;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;

  // Payment Tracking
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;

  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Party {
  id: string;
  name: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  gstin?: string;
  openingBalance: number;
  customerType: 'Consignor' | 'Consignee' | 'Both' | 'Broker';
  active: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: string;
  ownerName: string;
  ownerPhone: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  active: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry?: string;
  address?: string;
  assignedVehicle?: string;
  active: boolean;
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  pincode?: string;
  active: boolean;
}

export interface Route {
  id: string;
  name: string;
  fromCity: string;
  toCity: string;
  standardFreightRate?: number;
  transitTime?: string;
  active: boolean;
}

export interface Payment {
  id: string;
  lrId: string;
  lrNumber: string;
  partyId?: string;
  partyName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
  transactionRef?: string;
  remarks?: string;
  receivedBy: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  partyName: string;
  date: string;
  lrId?: string;
  lrNumber?: string;
  description: string;
  debit: number; // Charges to party
  credit: number; // Payments from party
  balance: number;
  reference?: string;
}

export interface Expense {
  id: string;
  expenseDate: string;
  category: 'Fuel' | 'Toll' | 'Maintenance' | 'Driver Allowance' | 'Office & Admin' | 'Police & RTO' | 'Loading Labour' | 'Other';
  description: string;
  amount: number;
  vehicleNumber?: string;
  route?: string;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
  referenceNumber?: string;
  remarks?: string;
  createdAt: string;
}

export interface LRPrintFieldConfig {
  // Header & Company Info
  showCompanyGstin: boolean;
  showCompanyPhone: boolean;
  showCompanyEmail: boolean;
  showCompanyTagline: boolean;

  // Vehicle, Driver & Dispatch Metadata
  showVehicleNumber: boolean;
  showDriverName: boolean;
  showBookingAndDeliveryBranch: boolean;
  showExpectedDeliveryDate: boolean;

  // Consignor & Consignee Details
  showPartyGstin: boolean;
  showPartyPhone: boolean;
  showPartyAddress: boolean;

  // Cargo, Invoice & Charges
  showPackageType: boolean;
  showWeightAndRate: boolean;
  showInvoiceDetails: boolean;
  showEwayBill: boolean;
  showChargesBreakdown: boolean;

  // Terms, Declarations & Signatures
  showDeclaration: boolean;
  termOwnersRisk: boolean;
  termDemurrage: boolean;
  termNoContraband: boolean;
  termSubjectToJurisdiction: boolean;
  showConsignorSignature: boolean;
  showDriverSignature: boolean;
  showDeliveryAckBlock: boolean;
}

export const DEFAULT_PRINT_FIELD_CONFIG: LRPrintFieldConfig = {
  showCompanyGstin: true,
  showCompanyPhone: true,
  showCompanyEmail: false,
  showCompanyTagline: false,

  showVehicleNumber: true,
  showDriverName: true,
  showBookingAndDeliveryBranch: true,
  showExpectedDeliveryDate: false,

  showPartyGstin: true,
  showPartyPhone: true,
  showPartyAddress: true,

  showPackageType: true,
  showWeightAndRate: true,
  showInvoiceDetails: true,
  showEwayBill: true,
  showChargesBreakdown: true,

  showDeclaration: true,
  termOwnersRisk: true,
  termDemurrage: true,
  termNoContraband: false,
  termSubjectToJurisdiction: true,
  showConsignorSignature: true,
  showDriverSignature: true,
  showDeliveryAckBlock: true,
};

export interface CompanySettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  lrPrefix: string;
  nextLrNumber: number;
  defaultPaymentType: PaymentType;
  defaultPrintCopy: 'Consignor Copy' | 'Consignee Copy' | 'Driver Copy' | 'Office Copy' | 'All 4 Copies';
  declaration: string;
  defaultWeightUnit: string;
  gstEnabled: boolean;
  defaultGstRate: number;
  taxCalculationBasis: 'freight' | 'total';
  currencySymbol: string;
  printLayout: 'portrait' | 'landscape';
  printPaperSize?: 'A4' | 'A5' | 'Letter';
  printCopiesPerSheet?: '1' | '2' | '4';
  tagline?: string;
  logoUrl?: string;
  showLogoOnLR?: boolean;
  logoStyle?: 'emblem' | 'truck' | 'badge' | 'custom';
  backupOnExit?: boolean;
  printFields?: LRPrintFieldConfig;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  password?: string;
  pin?: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  performedBy: string;
  timestamp: string;
}
