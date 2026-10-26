import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

if (!fs.existsSync(distDir)) {
  console.log('Building app first...');
  execSync('npm run build', { stdio: 'inherit' });
}

fs.mkdirSync(publicDir, { recursive: true });

// Find JS and CSS assets
const assetsDir = path.join(distDir, 'assets');
const files = fs.readdirSync(assetsDir);
const jsFile = files.find(f => f.endsWith('.js'));
const cssFile = files.find(f => f.endsWith('.css'));

if (jsFile && cssFile) {
  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
  const htmlTemplate = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

  // Create single-file standalone offline HTML
  let standalone = htmlTemplate;
  standalone = standalone.replace(
    new RegExp(`<link rel="stylesheet"[^>]*href="\\./assets/${cssFile.replace('.', '\\.')}"[^>]*>`),
    `<style>\n${cssContent}\n</style>`
  );
  standalone = standalone.replace(
    new RegExp(`<script type="module"[^>]*src="\\./assets/${jsFile.replace('.', '\\.')}"[^>]*></script>`),
    `<script type="module">\n${jsContent}\n</script>`
  );

  const standalonePath = path.join(publicDir, 'Sri_Murugan_Transport_Offline_Desktop_App.html');
  fs.writeFileSync(standalonePath, standalone, 'utf-8');
  console.log('Created standalone single file HTML:', standalonePath, fs.statSync(standalonePath).size, 'bytes');

  // Also copy to dist so it is directly servable
  fs.writeFileSync(path.join(distDir, 'Sri_Murugan_Transport_Offline_Desktop_App.html'), standalone, 'utf-8');
}

// Create ZIP file using python3
const zipPyScript = `
import os, zipfile

dist_dir = 'dist'
out_zip = 'public/Sri_Murugan_Transport_PC_Offline_Package.zip'
out_zip_dist = 'dist/Sri_Murugan_Transport_PC_Offline_Package.zip'

bat_content = """@echo off
chcp 65001 >nul
title Sri Murugan Transport - TMS Desktop Offline
echo ============================================================
echo   SRI MURUGAN TRANSPORT - OFFLINE PC DESKTOP APP
echo   100%% Local Disk Storage - No Cloud / No Internet Required
echo ============================================================
echo.
echo Launching Sri Murugan Transport in standalone desktop window...
echo.

where msedge >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" msedge --app="%~dp0index.html" --allow-file-access-from-files
    exit
)

where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" chrome --app="%~dp0index.html" --allow-file-access-from-files
    exit
)

start "" "%~dp0index.html"
exit
"""

readme_content = """============================================================
SRI MURUGAN TRANSPORT - OFFLINE PC DESKTOP APPLICATION
============================================================

Thank you for downloading Sri Murugan Transport Management System.
This edition runs 100% OFFLINE on your local computer disk with NO internet connection.

QUICK START INSTRUCTIONS:
-------------------------
1. Extract all files from this ZIP to a folder on your computer (e.g. C:\\SriMuruganTMS or Desktop).
2. Double-click "Launch_Sri_Murugan_TMS.bat" to start the app in a clean desktop window.
3. Or double-click "Sri_Murugan_Transport_Offline_Desktop_App.html" to run directly in any web browser.
4. You can right-click "Launch_Sri_Murugan_TMS.bat" -> "Send to" -> "Desktop (create shortcut)" to create an app icon on your Windows desktop.

LOGIN CREDENTIALS (OFFLINE ACCESS):
-----------------------------------
- Administrator: Username: admin | Password: admin (or PIN: 1234)
- Booking Staff: Username: staff1 | Password: staff (or PIN: 1234)
- Accountant:    Username: accounts | Password: accounts (or PIN: 1234)
- Guest Viewer:  Username: viewer | Password: viewer (or PIN: 1234)

LOCAL DISK STORAGE & BACKUP:
----------------------------
- All Lorry Receipts (LRs), Parties, Vehicles, Drivers, and Payments are saved directly on your PC disk.
- You can export a backup JSON file anytime using the "Local Disk Backup" button or when exiting.
- If you ever switch computers, use "Restore Backup" to import your data instantly.
"""

def make_zip(target_path):
    with zipfile.ZipFile(target_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(dist_dir):
            for f in files:
                if f.endswith('.zip'): continue
                full_p = os.path.join(root, f)
                rel_p = os.path.relpath(full_p, dist_dir)
                zf.write(full_p, rel_p)
        if os.path.exists('data/sri_murugan_transport_mysql.sql'):
            zf.write('data/sri_murugan_transport_mysql.sql', 'database/sri_murugan_transport_mysql.sql')
        if os.path.exists('data/transport.sqlite'):
            zf.write('data/transport.sqlite', 'database/sri_murugan_transport.sqlite')
        zf.writestr('Launch_Sri_Murugan_TMS.bat', bat_content)
        zf.writestr('README_OFFLINE_INSTALL.txt', readme_content)

make_zip(out_zip)
make_zip(out_zip_dist)
print("Created PC offline package:", out_zip, os.path.getsize(out_zip), "bytes")
`;

fs.writeFileSync('scripts/_make_zip.py', zipPyScript, 'utf-8');
execSync('python3 scripts/_make_zip.py', { stdio: 'inherit' });
fs.unlinkSync('scripts/_make_zip.py');
