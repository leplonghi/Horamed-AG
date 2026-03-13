@echo off
echo [1/3] npm run build... >> C:\Antigravity\horamed\horamed\build_v21.log 2>&1
cd /d C:\Antigravity\horamed\horamed
call npm run build >> C:\Antigravity\horamed\horamed\build_v21.log 2>&1
echo NPM_EXIT=%ERRORLEVEL% >> C:\Antigravity\horamed\horamed\build_v21.log

echo [2/3] cap sync android... >> C:\Antigravity\horamed\horamed\build_v21.log 2>&1
call npx cap sync android >> C:\Antigravity\horamed\horamed\build_v21.log 2>&1
echo CAP_EXIT=%ERRORLEVEL% >> C:\Antigravity\horamed\horamed\build_v21.log

echo [3/3] gradlew bundleRelease... >> C:\Antigravity\horamed\horamed\build_v21.log 2>&1
cd /d C:\Antigravity\horamed\horamed\android
set HORAMED_KEYSTORE_PASSWORD=Gringo08!
call gradlew.bat bundleRelease --no-daemon >> C:\Antigravity\horamed\horamed\build_v21.log 2>&1
echo GRADLE_EXIT=%ERRORLEVEL% >> C:\Antigravity\horamed\horamed\build_v21.log
echo BUILD_DONE >> C:\Antigravity\horamed\horamed\build_v21.log
