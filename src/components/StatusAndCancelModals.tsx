import React, { useState } from 'react';
import {
  X, Truck, Check, AlertCircle, Camera, Upload, Image as ImageIcon,
  Download, Printer, Trash2, FileCheck2, CheckCircle2
} from 'lucide-react';
import type { LR, LRStatus } from '../types/index';
import { api } from '../services/api';

/**
 * Compresses an uploaded image file onto an HTML5 canvas so base64 storage
 * inside SQLite / MySQL stays fast and compact.
 */
function compressImageFile(file: File, maxWidth = 1100, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return reject(new Error('Failed to read image file'));
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generates a realistic, high-resolution Signed & Stamped LR Acknowledgement Copy
 * image on canvas when the user wants a digital ACK photo slip.
 */
function generateDigitalAckCopyImage(
  lr: LR,
  deliveryDate: string,
  receivedBy: string,
  podReference: string,
  remarks: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Paper background
  ctx.fillStyle = '#fdfcf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Inner subtle border
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, canvas.width - 52, canvas.height - 52);

  // Header Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(26, 26, canvas.width - 52, 82);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('SRI MURUGAN TRANSPORT', 48, 65);

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('OFFICIAL LORRY RECEIPT ACKNOWLEDGEMENT COPY (PROOF OF DELIVERY)', 48, 90);

  // Right badge in header
  ctx.fillStyle = '#059669';
  ctx.fillRect(canvas.width - 255, 42, 210, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('DELIVERY COMPLETED', canvas.width - 235, 71);

  // LR Core Details Box
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(44, 126, canvas.width - 88, 96);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(44, 126, canvas.width - 88, 96);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`LR NO: ${lr.lrNumber}`, 62, 160);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`Booking Date: ${lr.lrDate}`, 62, 186);
  ctx.fillText(`Vehicle No: ${lr.vehicleNumber || 'N/A'}`, 62, 208);

  ctx.fillText(`Route: ${lr.fromCity}  -->  ${lr.toCity}`, 360, 160);
  ctx.fillText(`Packages: ${lr.totalPackages} Pkgs  |  Weight: ${lr.totalWeight} Kg`, 360, 186);
  ctx.fillText(`Payment Mode: ${lr.paymentType}  |  Total: Rs. ${lr.grandTotal.toLocaleString('en-IN')}`, 360, 208);

  // Consignor & Consignee
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('CONSIGNOR (SENDER):', 48, 256);
  ctx.fillText('CONSIGNEE (RECEIVER):', 490, 256);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(lr.consignorName || '-', 48, 278);
  ctx.fillText(`${lr.consignorCity || lr.fromCity} | Ph: ${lr.consignorPhone || '-'}`, 48, 298);

  ctx.fillText(lr.consigneeName || '-', 490, 278);
  ctx.fillText(`${lr.consigneeCity || lr.toCity} | Ph: ${lr.consigneePhone || '-'}`, 490, 298);

  // Divider
  ctx.beginPath();
  ctx.moveTo(44, 322);
  ctx.lineTo(canvas.width - 44, 322);
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  // Receiver Acknowledgement Details
  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(44, 340, 520, 245);
  ctx.strokeStyle = '#6ee7b7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(44, 340, 520, 245);

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('CONSIGNEE DELIVERY ACKNOWLEDGEMENT (POD)', 62, 368);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`Actual Delivery Date :  ${deliveryDate}`, 62, 402);
  ctx.fillText(`Received By          :  ${receivedBy || lr.consigneeName}`, 62, 432);
  ctx.fillText(`POD / Ack Ref No.    :  ${podReference || 'POD-' + lr.lrNumber}`, 62, 462);
  ctx.fillText(`Condition / Remarks  :  ${remarks || 'Received all packages in good condition'}`, 62, 492);

  ctx.fillStyle = '#475569';
  ctx.font = 'italic 12px sans-serif';
  ctx.fillText('We hereby confirm receipt of the above consignment in full and good order.', 62, 540);
  ctx.fillText(`Verified Timestamp: ${new Date().toLocaleString('en-IN')}`, 62, 564);

  // Rubber Stamp & Signature Box on Right
  ctx.save();
  ctx.translate(740, 455);
  ctx.rotate(-0.12);

  // Blue ink rubber stamp
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 3;
  ctx.strokeRect(-145, -75, 290, 150);
  ctx.lineWidth = 1;
  ctx.strokeRect(-139, -69, 278, 138);

  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((lr.consigneeBusinessName || lr.consigneeName || 'CONSIGNEE').slice(0, 28).toUpperCase(), 0, -42);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#047857';
  ctx.fillText('GOODS RECEIVED & VERIFIED', 0, -14);

  ctx.font = 'bold 20px serif';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(receivedBy || 'Authorized Signatory', 0, 24);

  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#1d4ed8';
  ctx.fillText(`DATE: ${deliveryDate} | SIGN & STAMP`, 0, 54);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.88);
}

interface StatusModalProps {
  lr: LR;
  onClose: () => void;
  onSuccess: (updated: LR) => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({ lr, onClose, onSuccess }) => {
  const [status, setStatus] = useState<LRStatus>(lr.status === 'Draft' ? 'Booked' : lr.status);
  const [deliveryDate, setDeliveryDate] = useState<string>(
    lr.deliveryDate || new Date().toISOString().split('T')[0]
  );
  const [receivedBy, setReceivedBy] = useState<string>(lr.deliveryReceivedBy || '');
  const [podReference, setPodReference] = useState<string>(lr.podReference || '');
  const [remarks, setRemarks] = useState<string>(lr.deliveryRemarks || '');
  const [ackPhotoUrl, setAckPhotoUrl] = useState<string>(lr.ackPhotoUrl || '');
  const [ackPhotoFileName, setAckPhotoFileName] = useState<string>(lr.ackPhotoFileName || '');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsProcessingPhoto(true);
    setError('');
    try {
      const compressed = await compressImageFile(file);
      setAckPhotoUrl(compressed);
      setAckPhotoFileName(file.name);
    } catch (err: any) {
      setError(err.message || 'Failed to process photo');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleGenerateDigitalStamp = () => {
    const signer = receivedBy.trim() || lr.consigneeContactPerson || lr.consigneeName;
    if (!receivedBy.trim()) {
      setReceivedBy(signer);
    }
    const generated = generateDigitalAckCopyImage(
      lr,
      deliveryDate,
      signer,
      podReference || `POD-${lr.lrNumber}`,
      remarks || 'All packages received in good order'
    );
    setAckPhotoUrl(generated);
    setAckPhotoFileName(`ACK_${lr.lrNumber}_Signed_POD.jpg`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const updated = await api.updateLRStatus(lr.id, status, {
        deliveryDate: status === 'Delivered' ? deliveryDate : undefined,
        receivedBy: status === 'Delivered' ? receivedBy : undefined,
        podReference: status === 'Delivered' ? podReference : undefined,
        remarks: status === 'Delivered' ? remarks : undefined,
        ackPhotoUrl: status === 'Delivered' ? ackPhotoUrl : undefined,
        ackPhotoFileName: status === 'Delivered' ? ackPhotoFileName : undefined
      });
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-base">Update Delivery Status & LR ACK Photo</h3>
              <p className="text-[11px] text-slate-300">{lr.lrNumber} · {lr.fromCity} → {lr.toCity}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">{error}</div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Consignment Delivery Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as LRStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold bg-white"
            >
              <option value="Booked">Booked (At Origin Branch)</option>
              <option value="In Transit">In Transit (Dispatched on Road)</option>
              <option value="Delivered">Delivered (Delivery Completed + Attach ACK Photo Copy)</option>
            </select>
          </div>

          {status === 'Delivered' && (
            <div className="space-y-4 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                  Delivery Completion & LR ACK Photo Copy (POD)
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {ackPhotoUrl ? 'ACK Photo Attached' : 'Upload Signed Slip'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Actual Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    POD / Ack Slip Ref No.
                  </label>
                  <input
                    type="text"
                    value={podReference}
                    onChange={e => setPodReference(e.target.value)}
                    placeholder={`e.g. POD-${lr.lrNumber}`}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Received By (Receiver Name & Designation) *
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={e => setReceivedBy(e.target.value)}
                  required
                  placeholder="e.g. S. Kumar (Store In-charge / Consignee)"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Delivery Condition & Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Delivered all packages in good condition, seal verified"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* LR ACK PHOTO COPY UPLOAD / CAMERA / STAMP GENERATOR */}
              <div className="pt-2 border-t border-emerald-200/80 space-y-2.5">
                <label className="block text-xs font-black text-slate-800 uppercase">
                  LR Acknowledgement Photo Copy (Signed POD Slip)
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Upload from PC / Phone Gallery */}
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessingPhoto ? 'Processing...' : 'Upload ACK Photo / Scan'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>

                  {/* Direct Camera Capture on Mobile / Tablet */}
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>Take Camera Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>

                  {/* 1-Click Digital Signed & Stamped ACK Copy */}
                  <button
                    type="button"
                    onClick={handleGenerateDigitalStamp}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Generate Signed ACK Stamp Copy</span>
                  </button>
                </div>

                {/* Attached Photo Preview */}
                {ackPhotoUrl ? (
                  <div className="mt-2 p-2.5 bg-white rounded-xl border border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{ackPhotoFileName || 'LR_Acknowledgement_Copy.jpg'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAckPhotoUrl('');
                          setAckPhotoFileName('');
                        }}
                        className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold text-[11px] cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-52 flex items-center justify-center">
                      <img
                        src={ackPhotoUrl}
                        alt="LR Acknowledgement Photo Copy"
                        className="max-h-52 w-auto object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Attach a photo/scan of the consignee-signed LR Acknowledgement copy, or click "Generate Signed ACK Stamp Copy" to create a stamped digital POD copy.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingPhoto}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : status === 'Delivered' ? 'Complete Delivery & Save ACK' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AckPhotoModalProps {
  lr: LR;
  onClose: () => void;
  onUpdated: (updated: LR) => void;
}

/**
 * Dedicated Modal to View, Print, Download, or Upload/Replace the
 * LR Acknowledgement Photo Copy once delivery is completed.
 */
export const AckPhotoModal: React.FC<AckPhotoModalProps> = ({ lr, onClose, onUpdated }) => {
  const [ackPhotoUrl, setAckPhotoUrl] = useState<string>(lr.ackPhotoUrl || '');
  const [ackPhotoFileName, setAckPhotoFileName] = useState<string>(
    lr.ackPhotoFileName || `ACK_${lr.lrNumber}.jpg`
  );
  const [receivedBy, setReceivedBy] = useState<string>(lr.deliveryReceivedBy || lr.consigneeName);
  const [deliveryDate, setDeliveryDate] = useState<string>(
    lr.deliveryDate || new Date().toISOString().split('T')[0]
  );
  const [podReference, setPodReference] = useState<string>(lr.podReference || `POD-${lr.lrNumber}`);
  const [remarks, setRemarks] = useState<string>(
    lr.deliveryRemarks || 'Received all packages in good condition'
  );
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const compressed = await compressImageFile(file);
    setAckPhotoUrl(compressed);
    setAckPhotoFileName(file.name);
    setNotice('New ACK Photo selected. Click "Save ACK Photo Copy" below to store in database.');
  };

  const handleGenerateStamp = () => {
    const generated = generateDigitalAckCopyImage(lr, deliveryDate, receivedBy, podReference, remarks);
    setAckPhotoUrl(generated);
    setAckPhotoFileName(`ACK_${lr.lrNumber}_Signed_POD.jpg`);
    setNotice('Digital Signed ACK Copy generated. Click "Save ACK Photo Copy" to save.');
  };

  const handleSaveAck = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const updated = await api.updateLRStatus(lr.id, 'Delivered', {
        deliveryDate,
        receivedBy,
        podReference,
        remarks,
        ackPhotoUrl,
        ackPhotoFileName
      });
      onUpdated(updated);
      setNotice('LR Acknowledgement Photo Copy saved to database!');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPhoto = () => {
    if (!ackPhotoUrl) return;
    const a = document.createElement('a');
    a.href = ackPhotoUrl;
    a.download = ackPhotoFileName || `LR_ACK_${lr.lrNumber}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePrintAckPhoto = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                LR Acknowledgement Photo Copy — {lr.lrNumber}
              </h3>
              <p className="text-xs text-emerald-300">
                Delivery Completed · {lr.fromCity} → {lr.toCity} · Vehicle: {lr.vehicleNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {notice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2 no-print">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">LR Number</span>
              <span className="font-black text-slate-900">{lr.lrNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Delivery Date</span>
              <span className="font-bold text-slate-800">{deliveryDate}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Received By</span>
              <span className="font-bold text-slate-800 truncate block">{receivedBy || lr.consigneeName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">POD Ref / Packages</span>
              <span className="font-bold text-slate-800">{podReference} ({lr.totalPackages} pkgs)</span>
            </div>
          </div>

          {/* Photo Display Area */}
          {ackPhotoUrl ? (
            <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center p-3">
              <img
                src={ackPhotoUrl}
                alt={`LR Acknowledgement Copy ${lr.lrNumber}`}
                className="max-h-[420px] w-auto object-contain rounded shadow-sm bg-white"
              />
            </div>
          ) : (
            <div className="py-12 px-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-3">
              <Camera className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  No LR Acknowledgement Photo Copy Attached Yet
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Upload a photo or scan of the signed delivery receipt, capture it using your camera, or generate a stamped digital Acknowledgement Copy below.
                </p>
              </div>
            </div>
          )}

          {/* Upload / Replace / Generate Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{ackPhotoUrl ? 'Replace ACK Photo' : 'Upload ACK Photo / Scan'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                <span>Camera Capture</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleGenerateStamp}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Generate Stamped ACK Copy</span>
              </button>
            </div>

            {ackPhotoUrl && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPhoto}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JPG</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintAckPhoto}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print ACK Copy</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 no-print shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            disabled={saving || !ackPhotoUrl}
            onClick={handleSaveAck}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save ACK Photo Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface CancelModalProps {
  lr: LR;
  onClose: () => void;
  onSuccess: (cancelled: LR) => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({ lr, onClose, onSuccess }) => {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for cancelling this LR');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const cancelled = await api.cancelLR(lr.id, reason.trim());
      onSuccess(cancelled);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel LR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in">
        <div className="flex items-center justify-between px-6 py-4 bg-rose-700 text-white">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-base">Cancel LR — {lr.lrNumber}</h3>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCancel} className="p-6 space-y-4">
          <p className="text-xs text-slate-600">
            Cancelling this LR will mark it as Cancelled in the database, preserve its audit history, and exclude its freight from active financial ledgers and collection reports.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Cancellation Reason *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              placeholder="e.g. Booking cancelled by party / duplicate entry / wrong vehicle number"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md cursor-pointer"
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
