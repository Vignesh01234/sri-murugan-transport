# Sri Murugan Transport — Transport Management Software (TMS)

A complete, full-stack transport management web application built for **Sri Murugan Transport**, with authentic A4 Lorry Receipt (LR) generation matching the official `Transport.pdf` reference format across all 4 copies: **Consignor Copy**, **Consignee Copy**, **Driver Copy**, and **Office Copy**.

---

## 🌟 Key Features

1. **Centralized LR Entry & Automatic 4 Copies**:
   - Enter LR details once; automatically creates unique LR numbers (`SMT-2026-0001`), saves to SQLite database, updates party ledgers, and generates all four copies.
   - Exact structural replication of the reference `Transport.pdf` (Company header, LR No / Date / Vehicle / From / To grid, Consignor / Consignee boxes, Goods item table with packages & weight, Invoice & Payment split, Legal carriage declaration, and 3 signature blocks).

2. **Multi-Item Goods Calculation**:
   - Multiple goods items per LR.
   - Rate basis options: *Per kg*, *Per package*, or *Flat amount*.
   - Automatic live totals for package count, total weight (kg), goods subtotal, freight, loading/unloading, other charges, optional GST (5%/12%/18%), and Grand Total (₹ INR).

3. **Master Registries**:
   - **Customer & Party Master**: Consignor and Consignee records with addresses, phone, GSTIN, opening balances, and duplicate name warnings.
   - **Vehicle Management**: Fleet tracking with vehicle type, tonnage capacity, owner contact, insurance expiry, and fitness expiry.
   - **Driver Management**: Commercial driver records, licence numbers, validity dates, and vehicle assignments.
   - **City & Route Master**: Origin-destination corridors, standard per-kg freight rates, and transit times.

4. **Payments, Ledgers & Receivables**:
   - **Payment Entry**: Record cash, UPI (GPay/PhonePe), bank transfer (NEFT/RTGS), or cheque payments against any LR.
   - **Customer Ledger**: Live statement of account tracking opening balance, debits (freight billed), credits (payments received), and running balance.
   - **To Pay Outstanding Report**: Instant visibility into unpaid consignments where freight is collectable from consignees upon delivery.
   - **Paid LR & Collection Reports**: Complete financial reconciliation.

5. **Operational Reports & Expenses**:
   - Daily and Monthly Consignment Reports.
   - Route-wise and Vehicle-wise volume summaries.
   - Cancelled LR audit trails with documented reasons.
   - Fleet Operational Expense tracking (Fuel, Toll/Fastag, Maintenance, Driver Allowance, Union Hamali).

6. **Company Settings & Database Backup**:
   - Configure company name, registered address, phones, GSTIN, and default terms.
   - Download complete database backups as JSON/SQLite.
   - Restore database from backup archive or reset to initial factory demo data.

7. **Role-Based Access Control**:
   - Pre-configured roles: *Administrator*, *Booking Staff*, *Accountant*, and *Viewer*.
   - Complete system audit log tracking every LR creation, update, cancellation, and payment.

---

## 🚀 Getting Started (Windows PowerShell & Linux)

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### 1. Installation
In Windows PowerShell or terminal:
```powershell
npm install
```

### 2. Development Mode
Run the Express full-stack server with Vite middleware:
```powershell
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Production Build
```powershell
npm run build
npm start
```

---

## 🗄️ Database & Persistence Architecture

- **SQLite Engine**: Powered by persistent SQLite (`data/transport.sqlite`) with structured JSON synchronization (`data/transport_data.json`).
- **Persistence**: Database state survives application restarts, server reboots, and refreshes.
- **Transactions**: Payment entries, LR edits, and status updates maintain consistency across all master registries and customer ledgers.
- **Backup & Restore**:
  - Export: Click **Company Settings** → **Download JSON Backup**.
  - Restore: Click **Company Settings** → **Upload & Restore**.

---

## 🖨️ Printing Instructions (Transport.pdf Exact Fidelity)

1. Navigate to **Create New LR** (or click **LR Print & Reprint**).
2. Choose **Print All 4 Copies (Full Set)** or any individual copy (**Consignor**, **Consignee**, **Driver**, **Office**).
3. The dedicated print stylesheet automatically formats the output:
   - Paper size: **A4 Landscape**
   - Margins: Standard (8mm)
   - Backgrounds & graphics: Check **Background graphics** in your browser's print dialog for optimal badge rendering.
   - Clean output: Sidebar, navigation, headers, and action buttons are automatically hidden during print.
