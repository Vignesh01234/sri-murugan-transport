import React from 'react';
import type { LR, CompanySettings, LRPrintFieldConfig } from '../types/index';
import { DEFAULT_PRINT_FIELD_CONFIG } from '../types/index';
import { TransportLogo } from './TransportLogo';

interface Props {
  lr: LR;
  settings: CompanySettings;
  copyType: 'Consignor Copy' | 'Consignee Copy' | 'Driver Copy' | 'Office Copy';
  isCompact?: boolean;
}

export const LRPrintTemplate: React.FC<Props> = ({ lr, settings, copyType, isCompact = false }) => {
  const currency = settings.currencySymbol || '₹';
  const pf: LRPrintFieldConfig = {
    ...DEFAULT_PRINT_FIELD_CONFIG,
    ...(settings.printFields || {})
  };

  // Format currency
  const fmt = (num?: number) => {
    const val = Number(num) || 0;
    return `${currency}${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date DD-MM-YYYY
  const fmtDate = (dStr?: string) => {
    if (!dStr) return '';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    } catch {}
    return dStr;
  };

  const loadingUnloadingTotal = (Number(lr.loadingCharges) || 0) + (Number(lr.unloadingCharges) || 0) + (Number(lr.hamaliCharges) || 0);
  const otherChargesTotal = (Number(lr.otherCharges) || 0) + (Number(lr.additionalCharges) || 0) - (Number(lr.discount) || 0);

  // Header contact pieces
  const headerMetaParts: string[] = [];
  if (pf.showCompanyPhone && settings.phone) headerMetaParts.push(`Ph: ${settings.phone}`);
  if (pf.showCompanyGstin && settings.gstin) headerMetaParts.push(`GSTIN: ${settings.gstin}`);
  if (pf.showCompanyEmail && settings.email) headerMetaParts.push(`Email: ${settings.email}`);

  // Specific carriage terms list
  const specificTerms: string[] = [];
  if (pf.termOwnersRisk) {
    specificTerms.push("1. Consignment booked and carried strictly at Owner's Risk.");
  }
  if (pf.termDemurrage) {
    specificTerms.push('2. Demurrage / Godown rent applicable if goods are not cleared within 7 days of arrival.');
  }
  if (pf.termNoContraband) {
    specificTerms.push('3. Consignor certifies no hazardous, contraband, or prohibited goods are packed.');
  }
  if (pf.termSubjectToJurisdiction) {
    specificTerms.push('4. All disputes are subject to local court jurisdiction only.');
  }

  // Active signatures
  const signatureColumns: string[] = [];
  if (pf.showConsignorSignature) signatureColumns.push('Consignor Signature');
  if (pf.showDriverSignature) signatureColumns.push('Driver Signature');
  signatureColumns.push('Authorised Signatory');

  return (
    <div className={`lr-print-container bg-white text-black font-sans border-2 border-black mx-auto select-text shadow-sm print:shadow-none print:border-black print:w-full print:m-0 ${
      isCompact ? 'p-3 text-[10px] max-w-full' : 'p-5 text-xs max-w-[1000px]'
    }`}>
      {/* 1. Header Row */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-black">
        <div className="flex items-center gap-3">
          {settings.showLogoOnLR !== false && (
            <TransportLogo settings={settings} size={isCompact ? 'sm' : 'print'} />
          )}
          <div>
            <h1 className={`${isCompact ? 'text-base leading-tight' : 'text-xl'} font-black uppercase tracking-wider text-black`}>
              {settings.companyName || 'SRI MURUGAN TRANSPORT'}
            </h1>
            {pf.showCompanyTagline && settings.tagline && (
              <p className="text-[10px] font-bold text-gray-700 italic leading-tight mt-0.5">
                {settings.tagline}
              </p>
            )}
            <p className="text-[10px] text-gray-800 leading-tight mt-0.5">
              {settings.address}
            </p>
            {headerMetaParts.length > 0 && (
              <p className="text-[10px] font-semibold text-gray-800 mt-0.5">
                {headerMetaParts.join('  |  ')}
              </p>
            )}
          </div>
        </div>

        <div className="text-right flex flex-col items-end shrink-0 pl-2">
          <span className={`${isCompact ? 'text-sm' : 'text-lg'} font-black uppercase tracking-widest text-black`}>
            {lr.status === 'Draft' ? 'DRAFT RECEIPT' : 'LORRY RECEIPT'}
          </span>
          <div className="mt-1 px-2.5 py-0.5 border border-black rounded text-[10px] font-bold tracking-wide uppercase bg-gray-50 print:bg-transparent">
            {lr.status === 'Draft' ? `DRAFT • ${copyType}` : copyType}
          </div>
        </div>
      </div>

      {/* Draft Watermark Warning */}
      {lr.status === 'Draft' && (
        <div className="bg-amber-100 text-amber-900 border-b border-black py-1 px-2 text-center font-black uppercase text-[10px] tracking-widest bg-stripes">
          *** DRAFT CONSIGNMENT NOTE — NOT VALID FOR HIGHWAY TRANSIT UNTIL BOOKED ***
        </div>
      )}

      {/* 2. Key Metadata Strip */}
      <div className={`grid ${pf.showVehicleNumber && pf.showDriverName ? 'grid-cols-6' : pf.showVehicleNumber || pf.showDriverName ? 'grid-cols-5' : 'grid-cols-4'} border-b border-black text-center divide-x divide-black bg-gray-50 print:bg-transparent`}>
        <div className="py-1 px-2 text-left">
          <div className="text-[9px] uppercase font-bold text-gray-600">LR NO.</div>
          <div className="font-extrabold text-sm text-black">{lr.lrNumber}</div>
        </div>
        <div className="py-1 px-2 text-left">
          <div className="text-[9px] uppercase font-bold text-gray-600">DATE</div>
          <div className="font-bold text-[12px] text-black">{fmtDate(lr.lrDate)}</div>
        </div>
        {pf.showVehicleNumber && (
          <div className="py-1 px-2 text-left">
            <div className="text-[9px] uppercase font-bold text-gray-600">VEHICLE NO.</div>
            <div className="font-bold text-[12px] text-black uppercase">{lr.vehicleNumber || '—'}</div>
            {lr.vehicleType && <div className="text-[8.5px] text-gray-600 leading-none">{lr.vehicleType}</div>}
          </div>
        )}
        {pf.showDriverName && (
          <div className="py-1 px-2 text-left">
            <div className="text-[9px] uppercase font-bold text-gray-600">DRIVER NAME</div>
            <div className="font-bold text-[11px] text-black truncate">
              {lr.driverName || 'Fleet Driver'}
            </div>
            {lr.driverPhone && <div className="text-[8.5px] text-gray-600 leading-none">Ph: {lr.driverPhone}</div>}
          </div>
        )}
        <div className="py-1 px-2 text-left">
          <div className="text-[9px] uppercase font-bold text-gray-600">FROM</div>
          <div className="font-bold text-[12px] text-black">{lr.fromCity}</div>
        </div>
        <div className="py-1 px-2 text-left">
          <div className="text-[9px] uppercase font-bold text-gray-600">TO</div>
          <div className="font-bold text-[12px] text-black">{lr.toCity}</div>
        </div>
      </div>

      {/* 2b. Optional Secondary Dispatch Strip (Booking/Delivery Branch & Expected Delivery Date) */}
      {(pf.showBookingAndDeliveryBranch || pf.showExpectedDeliveryDate) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-1 border-b border-black text-[10px] bg-white">
          {pf.showBookingAndDeliveryBranch && (
            <div className="flex flex-wrap gap-x-4">
              <span><strong>Booking Branch:</strong> {lr.bookingBranch || `${lr.fromCity} Main Office`}</span>
              <span><strong>Delivery Godown:</strong> {lr.deliveryBranch || `${lr.toCity} Godown`}</span>
            </div>
          )}
          {pf.showExpectedDeliveryDate && (
            <div>
              <strong>Expected Delivery:</strong> {fmtDate(lr.expectedDeliveryDate) || 'Next Business Day'}
            </div>
          )}
        </div>
      )}

      {/* 3. Consignor & Consignee Columns */}
      <div className="grid grid-cols-2 border-b border-black divide-x divide-black min-h-[85px]">
        {/* Consignor Box */}
        <div className="p-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-gray-700 mb-0.5">
            CONSIGNOR (FROM)
          </div>
          <div className="font-bold text-sm text-black leading-tight">
            {lr.consignorName}
          </div>
          {lr.consignorBusinessName && lr.consignorBusinessName !== lr.consignorName && (
            <div className="text-[10px] text-gray-700 italic">{lr.consignorBusinessName}</div>
          )}
          {pf.showPartyAddress && (
            <div className="text-[11px] text-gray-800 leading-snug mt-0.5 whitespace-pre-line">
              {lr.consignorAddress || `${lr.consignorCity}, ${lr.consignorState}`}
              {lr.consignorPincode ? ` - ${lr.consignorPincode}` : ''}
            </div>
          )}
          {(pf.showPartyPhone || pf.showPartyGstin) && (
            <div className="text-[10px] text-gray-800 mt-1 flex flex-wrap gap-x-3">
              {pf.showPartyPhone && lr.consignorPhone && (
                <span><span className="font-semibold">Ph:</span> {lr.consignorPhone}</span>
              )}
              {pf.showPartyGstin && lr.consignorGstin && (
                <span><span className="font-semibold">GSTIN:</span> {lr.consignorGstin}</span>
              )}
            </div>
          )}
        </div>

        {/* Consignee Box */}
        <div className="p-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-gray-700 mb-0.5">
            CONSIGNEE (TO)
          </div>
          <div className="font-bold text-sm text-black leading-tight">
            {lr.consigneeName}
          </div>
          {lr.consigneeBusinessName && lr.consigneeBusinessName !== lr.consigneeName && (
            <div className="text-[10px] text-gray-700 italic">{lr.consigneeBusinessName}</div>
          )}
          {pf.showPartyAddress && (
            <div className="text-[11px] text-gray-800 leading-snug mt-0.5 whitespace-pre-line">
              {lr.consigneeAddress || `${lr.consigneeCity}, ${lr.consigneeState}`}
              {lr.consigneePincode ? ` - ${lr.consigneePincode}` : ''}
            </div>
          )}
          {(pf.showPartyPhone || pf.showPartyGstin) && (
            <div className="text-[10px] text-gray-800 mt-1 flex flex-wrap gap-x-3">
              {pf.showPartyPhone && lr.consigneePhone && (
                <span><span className="font-semibold">Ph:</span> {lr.consigneePhone}</span>
              )}
              {pf.showPartyGstin && lr.consigneeGstin && (
                <span><span className="font-semibold">GSTIN:</span> {lr.consigneeGstin}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Goods Table */}
      <table className="w-full border-collapse border-b border-black text-left">
        <thead>
          <tr className="border-b border-black text-[10px] font-black uppercase bg-gray-50 print:bg-transparent">
            <th className="py-1 px-2 border-r border-black w-8 text-center">#</th>
            <th className="py-1 px-2 border-r border-black">Description of Goods</th>
            <th className="py-1 px-2 border-r border-black w-20 text-center">Pkgs</th>
            {pf.showWeightAndRate && (
              <>
                <th className="py-1 px-2 border-r border-black w-24 text-right">Weight (kg)</th>
                <th className="py-1 px-2 border-r border-black w-24 text-right">Rate</th>
              </>
            )}
            <th className="py-1 px-2 w-28 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300">
          {lr.items && lr.items.length > 0 ? (
            lr.items.map((item, idx) => (
              <tr key={item.id || idx} className="text-[11px]">
                <td className="py-1.5 px-2 border-r border-black text-center font-medium">{idx + 1}</td>
                <td className="py-1.5 px-2 border-r border-black font-medium text-black">
                  {item.description}
                  {pf.showPackageType && item.packageType && (
                    <span className="text-[9px] text-gray-600 ml-1.5 font-normal">({item.packageType})</span>
                  )}
                </td>
                <td className="py-1.5 px-2 border-r border-black text-center font-bold">{item.packages}</td>
                {pf.showWeightAndRate && (
                  <>
                    <td className="py-1.5 px-2 border-r border-black text-right font-medium">{item.weight}</td>
                    <td className="py-1.5 px-2 border-r border-black text-right font-medium">
                      {item.rate.toFixed(2)}
                      <span className="text-[8px] text-gray-500 block leading-none">
                        {item.rateBasis === 'per_pkg' ? '/pkg' : item.rateBasis === 'per_kg' ? '/kg' : 'flat'}
                      </span>
                    </td>
                  </>
                )}
                <td className="py-1.5 px-2 text-right font-semibold">{item.amount.toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr className="text-[11px]">
              <td className="py-1.5 px-2 border-r border-black text-center">1</td>
              <td className="py-1.5 px-2 border-r border-black">General Goods</td>
              <td className="py-1.5 px-2 border-r border-black text-center">{lr.totalPackages}</td>
              {pf.showWeightAndRate && (
                <>
                  <td className="py-1.5 px-2 border-r border-black text-right">{lr.totalWeight}</td>
                  <td className="py-1.5 px-2 border-r border-black text-right">0.00</td>
                </>
              )}
              <td className="py-1.5 px-2 text-right font-semibold">{lr.freightAmount.toFixed(2)}</td>
            </tr>
          )}

          {/* Fill blank row if needed for aesthetic height */}
          {(!lr.items || lr.items.length <= 1) && (
            <tr className="text-[11px] h-6">
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              {pf.showWeightAndRate && (
                <>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                </>
              )}
              <td></td>
            </tr>
          )}

          {/* Subtotal row */}
          <tr className="border-t border-black font-extrabold text-[11px] bg-gray-50 print:bg-transparent">
            <td colSpan={2} className="py-1 px-2 border-r border-black text-right uppercase">
              Total
            </td>
            <td className="py-1 px-2 border-r border-black text-center font-black">
              {lr.totalPackages}
            </td>
            {pf.showWeightAndRate && (
              <>
                <td className="py-1 px-2 border-r border-black text-right font-black">
                  {lr.totalWeight}
                </td>
                <td className="border-r border-black"></td>
              </>
            )}
            <td className="py-1 px-2 text-right font-black">
              {currency}{lr.freightAmount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. Invoice & Charges Split */}
      <div className="grid grid-cols-2 border-b border-black divide-x divide-black">
        {/* Left: Invoice & Payment Type */}
        <div className="p-2 space-y-1 text-[11px]">
          {pf.showInvoiceDetails && (
            <>
              <div>
                <span className="font-bold text-gray-700">Invoice No:</span>{' '}
                <span className="font-semibold text-black">{lr.invoiceNumber || '—'}</span>
                {lr.invoiceDate && <span className="text-[10px] text-gray-600 ml-1.5">({fmtDate(lr.invoiceDate)})</span>}
              </div>
              <div>
                <span className="font-bold text-gray-700">Invoice Value:</span>{' '}
                <span className="font-semibold text-black">{fmt(lr.invoiceValue)}</span>
              </div>
            </>
          )}
          {pf.showEwayBill && lr.ewayBillNumber && (
            <div>
              <span className="font-bold text-gray-700">E-way Bill No:</span>{' '}
              <span className="font-semibold text-black">{lr.ewayBillNumber}</span>
            </div>
          )}
          <div className="pt-1">
            <span className="font-bold text-gray-700">Payment Basis:</span>{' '}
            <span className="font-black text-sm uppercase px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 print:border-none print:bg-transparent text-blue-900 print:text-black">
              {lr.paymentType}
            </span>
          </div>
        </div>

        {/* Right: Freight & Charges Breakdown */}
        <div className="divide-y divide-gray-300 text-[11px] flex flex-col justify-between">
          {pf.showChargesBreakdown && (
            <div>
              <div className="flex justify-between py-1 px-2 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Freight</span>
                <span className="font-semibold">{fmt(lr.freightAmount)}</span>
              </div>
              <div className="flex justify-between py-1 px-2 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Loading / Unloading</span>
                <span className="font-semibold">{fmt(loadingUnloadingTotal)}</span>
              </div>
              <div className="flex justify-between py-1 px-2 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Other Charges</span>
                <span className="font-semibold">{fmt(otherChargesTotal)}</span>
              </div>
              {lr.gstApplicable && (
                <div className="flex justify-between py-1 px-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">GST ({lr.gstRate}%)</span>
                  <span className="font-semibold">{fmt(lr.gstAmount)}</span>
                </div>
              )}
            </div>
          )}
          <div className={`flex justify-between py-1.5 px-2 bg-gray-50 print:bg-transparent ${pf.showChargesBreakdown ? 'border-t-2 border-black' : ''} font-black text-sm text-black`}>
            <span>Grand Total</span>
            <span>{fmt(lr.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* 6. Legal / Goods Carriage Declaration & Specific Toggled Terms */}
      {(pf.showDeclaration || specificTerms.length > 0) && (
        <div className="py-1.5 px-2 text-[9.5px] leading-snug text-gray-800 border-b border-black space-y-1">
          {pf.showDeclaration && (
            <div>
              {settings.declaration || "Goods are carried at owner's risk. Subject to local jurisdiction. Please check goods at the time of delivery."}
            </div>
          )}
          {specificTerms.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[9px] font-semibold text-gray-700 pt-0.5">
              {specificTerms.map((term, idx) => (
                <span key={idx}>{term}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6b. Delivery Completed & Consignee Acknowledgement Block (When Delivered) */}
      {pf.showDeliveryAckBlock && lr.status === 'Delivered' && (
        <div className="border-b border-black bg-emerald-50/60 print:bg-transparent p-2 flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="space-y-0.5">
            <div className="font-black uppercase text-emerald-950 print:text-black tracking-wide">
              ✓ DELIVERY COMPLETED — CONSIGNEE ACKNOWLEDGEMENT (POD)
            </div>
            <div className="text-gray-800 flex flex-wrap gap-x-4 gap-y-0.5">
              <span><strong>Delivered Date:</strong> {fmtDate(lr.deliveryDate) || fmtDate(lr.lrDate)}</span>
              <span><strong>Received By:</strong> {lr.deliveryReceivedBy || lr.consigneeName}</span>
              {lr.podReference && <span><strong>POD Ref:</strong> {lr.podReference}</span>}
              {lr.deliveryRemarks && <span><strong>Remarks:</strong> {lr.deliveryRemarks}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lr.ackPhotoUrl && !isCompact && (
              <img
                src={lr.ackPhotoUrl}
                alt="LR ACK Photo Copy"
                className="h-12 w-auto object-contain border border-black rounded bg-white p-0.5"
              />
            )}
            <div className="px-2 py-1 border-2 border-emerald-800 print:border-black rounded text-[9px] font-black uppercase text-emerald-900 print:text-black text-center leading-tight">
              GOODS DELIVERED
              <span className="block text-[8px] font-bold">
                {lr.ackPhotoUrl ? 'ACK PHOTO ATTACHED' : 'POD VERIFIED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7. Signatures Row */}
      <div className={`grid ${signatureColumns.length === 3 ? 'grid-cols-3' : signatureColumns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} pt-8 pb-1 text-center divide-x divide-gray-200`}>
        {signatureColumns.map(sigLabel => (
          <div key={sigLabel}>
            <div className="border-t border-black w-4/5 mx-auto pt-1 font-bold text-[10px] uppercase text-black">
              {sigLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
