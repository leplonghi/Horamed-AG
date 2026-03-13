@echo off
cd /d C:\Antigravity\horamed\horamed
call npx @capacitor/assets generate --iconBackgroundColor "#ffffff" --iconBackgroundColorDark "#ffffff" --splashBackgroundColor "#ffffff" --splashBackgroundColorDark "#ffffff" > C:\Antigravity\horamed\horamed\gen_icons.log 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> C:\Antigravity\horamed\horamed\gen_icons.log
