@echo off
set HORAMED_KEYSTORE_PASSWORD=Gringo08!
cd /d C:\Antigravity\horamed\horamed\android
call gradlew.bat bundleRelease --no-daemon > C:\Antigravity\horamed\horamed\gradle_build.log 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> C:\Antigravity\horamed\horamed\gradle_build.log
