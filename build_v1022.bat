@echo off
cd /d C:\Antigravity\horamed\horamed

echo [%TIME%] === STEP 1: npm run build === >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
call npm run build >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%TIME%] ERROR: npm build failed with code %ERRORLEVEL% >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
    exit /b 1
)
echo [%TIME%] npm build OK >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1

echo [%TIME%] === STEP 2: npx cap sync android === >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
call npx cap sync android >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%TIME%] ERROR: cap sync failed >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
    exit /b 1
)
echo [%TIME%] cap sync OK >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1

echo [%TIME%] === STEP 3: gradlew bundleRelease === >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
cd android
call gradlew.bat bundleRelease >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [%TIME%] ERROR: gradlew bundleRelease failed >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
    exit /b 1
)
echo [%TIME%] === BUILD COMPLETE === >> C:\Antigravity\horamed\horamed\build_v1022.log 2>&1
