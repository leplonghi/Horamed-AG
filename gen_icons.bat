@echo off
cd /d C:\Antigravity\horamed\horamed
npx @capacitor/assets generate --iconBackgroundColor "#ffffff" --iconBackgroundColorDark "#ffffff" --splashBackgroundColor "#ffffff" --splashBackgroundColorDark "#ffffff" 2>&1
echo EXIT_CODE=%ERRORLEVEL%
