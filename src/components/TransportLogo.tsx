import React from 'react';
import type { CompanySettings } from '../types/index';

interface Props {
  settings?: CompanySettings;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'print';
  className?: string;
  forceStyle?: 'emblem' | 'truck' | 'badge';
}

export const TransportLogo: React.FC<Props> = ({
  settings,
  size = 'md',
  className = '',
  forceStyle
}) => {
  // If user uploaded a custom logo image, render it
  if (settings?.logoUrl && settings.logoStyle === 'custom' && !forceStyle) {
    const sizeClasses = {
      sm: 'h-8 w-auto max-w-[100px]',
      md: 'h-11 w-auto max-w-[140px]',
      lg: 'h-16 w-auto max-w-[180px]',
      xl: 'h-20 w-auto max-w-[220px]',
      print: 'h-12 w-auto max-w-[130px] object-contain'
    }[size];

    return (
      <img
        src={settings.logoUrl}
        alt={settings.companyName || 'Transport Logo'}
        className={`${sizeClasses} ${className} object-contain`}
      />
    );
  }

  const style = forceStyle || settings?.logoStyle || 'emblem';

  // Dimension mapping
  const dimensions = {
    sm: { width: 34, height: 34 },
    md: { width: 46, height: 46 },
    lg: { width: 64, height: 64 },
    xl: { width: 80, height: 80 },
    print: { width: 50, height: 50 }
  }[size];

  // 1. EMBLEM STYLE: Heavy Haulage Transport Crest (Sri Murugan Transport)
  if (style === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="print:text-black"
        >
          {/* Outer Shield / Hexagon with double stroke */}
          <polygon
            points="50,4 92,25 92,75 50,96 8,75 8,25"
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth="3"
            className="print:fill-black print:stroke-black"
          />
          <polygon
            points="50,8 88,27 88,73 50,92 12,73 12,27"
            fill="#1e3a8a"
            stroke="#fbbf24"
            strokeWidth="2"
            className="print:fill-white print:stroke-black"
          />

          {/* Golden Winged Accents */}
          <path
            d="M20 32 L36 40 L28 46 L16 38 Z"
            fill="#f59e0b"
            className="print:fill-black"
          />
          <path
            d="M80 32 L64 40 L72 46 L84 38 Z"
            fill="#f59e0b"
            className="print:fill-black"
          />

          {/* Modern Transport Truck Cabin & Container */}
          {/* Container Box */}
          <rect
            x="28"
            y="38"
            width="28"
            height="26"
            rx="1.5"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="1.5"
            className="print:fill-white print:stroke-black"
          />
          {/* Container ribs */}
          <line x1="34" y1="41" x2="34" y2="61" stroke="#cbd5e1" strokeWidth="1" className="print:stroke-black" />
          <line x1="40" y1="41" x2="40" y2="61" stroke="#cbd5e1" strokeWidth="1" className="print:stroke-black" />
          <line x1="46" y1="41" x2="46" y2="61" stroke="#cbd5e1" strokeWidth="1" className="print:stroke-black" />
          <line x1="52" y1="41" x2="52" y2="61" stroke="#cbd5e1" strokeWidth="1" className="print:stroke-black" />

          {/* Truck Cabin */}
          <path
            d="M57 44 L66 44 L72 52 L72 64 L57 64 Z"
            fill="#f59e0b"
            stroke="#0f172a"
            strokeWidth="1.5"
            className="print:fill-black print:stroke-black"
          />
          {/* Windshield */}
          <path
            d="M60 47 L65 47 L69 52 L60 52 Z"
            fill="#ffffff"
            className="print:fill-white"
          />

          {/* Wheels */}
          <circle cx="36" cy="67" r="4.5" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" className="print:fill-black print:stroke-white" />
          <circle cx="36" cy="67" r="1.5" fill="#ffffff" />
          <circle cx="48" cy="67" r="4.5" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" className="print:fill-black print:stroke-white" />
          <circle cx="48" cy="67" r="1.5" fill="#ffffff" />
          <circle cx="66" cy="67" r="4.5" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" className="print:fill-black print:stroke-white" />
          <circle cx="66" cy="67" r="1.5" fill="#ffffff" />

          {/* Highway Speed Line Under Truck */}
          <line x1="22" y1="74" x2="78" y2="74" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 3" className="print:stroke-black" />

          {/* Brand Monogram "SMT" at bottom badge */}
          <rect x="33" y="77" width="34" height="11" rx="2" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" className="print:fill-black print:stroke-black" />
          <text
            x="50"
            y="85.5"
            fontSize="8"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
            fill="#ffffff"
            textAnchor="middle"
            letterSpacing="0.8"
            className="print:fill-white"
          >
            SMT
          </text>
        </svg>
      </div>
    );
  }

  // 2. TRUCK STYLE: Express Logistics Truck Silhouette
  if (style === 'truck') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="16" fill="#0f172a" className="print:fill-white print:stroke-black print:stroke-2" />
          {/* Speed curves */}
          <path d="M12 28 Q 45 20 88 28" stroke="#3b82f6" strokeWidth="3" fill="none" className="print:stroke-black" />
          {/* Truck body */}
          <rect x="18" y="38" width="42" height="32" rx="3" fill="#2563eb" className="print:fill-black" />
          <path d="M62 46 L76 46 L84 56 L84 70 L62 70 Z" fill="#1d4ed8" className="print:fill-black" />
          <path d="M66 49 L74 49 L80 56 L66 56 Z" fill="#ffffff" />
          {/* Wheels */}
          <circle cx="30" cy="74" r="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" className="print:fill-white print:stroke-black" />
          <circle cx="48" cy="74" r="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" className="print:fill-white print:stroke-black" />
          <circle cx="76" cy="74" r="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" className="print:fill-white print:stroke-black" />
          <text x="39" y="58" fontSize="11" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1">SMT</text>
        </svg>
      </div>
    );
  }

  // 3. BADGE STYLE: Classic Vintage Transport Seal
  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#d97706" strokeWidth="3" className="print:fill-white print:stroke-black print:stroke-3" />
        <circle cx="50" cy="50" r="40" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" className="print:stroke-black" />
        <text x="50" y="33" fontSize="6.5" fontWeight="bold" fill="#fbbf24" textAnchor="middle" letterSpacing="1.2" className="print:fill-black">
          SRI MURUGAN
        </text>
        <text x="50" y="55" fontSize="16" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1.5" className="print:fill-black">
          SMT
        </text>
        <text x="50" y="70" fontSize="6" fontWeight="bold" fill="#94a3b8" textAnchor="middle" letterSpacing="1" className="print:fill-black">
          TRANSPORT CO.
        </text>
        <circle cx="50" cy="78" r="3" fill="#f59e0b" className="print:fill-black" />
      </svg>
    </div>
  );
};
