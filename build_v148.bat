@echo off
set PATH=C:\Program Files\nodejs;C:\Windows\System32;C:\Windows;C:\Antigravity\horamed\horamed\node_modules\.bin;%PATH%
cd /d "C:\Antigravity\horamed\horamed"
set HORAMED_KEYSTORE_PASSWORD=Gringo08!

echo [%TIME%] === BUILD v1.0.48 INICIADO === > build_v148.log
echo PATH=%PATH% >> build_v148.log

echo [%TIME%] [1/4] npm run build... >> build_v148.log
vite.cmd build > build_web_out.txt 2> build_web_err.txt
if errorlevel 1 (
  echo [%TIME%] ERRO no build web! >> build_v148.log
  type build_web_err.txt >> build_v148.log
  exit /b 1
)
echo [%TIME%] [1/4] Build web OK >> build_v148.log

echo [%TIME%] [2/4] cap sync android... >> build_v148.log
"C:\Program Files\nodejs\npx.cmd" cap sync android > build_cap_out.txt 2> build_cap_err.txt
if errorlevel 1 (
  echo [%TIME%] ERRO no cap sync! >> build_v148.log
  type build_cap_err.txt >> build_v148.log
  exit /b 1
)
echo [%TIME%] [2/4] cap sync OK >> build_v148.log

echo [%TIME%] [3/4] gradlew bundleRelease... >> build_v148.log
cd android
call gradlew.bat bundleRelease > ..\build_gradle_out.txt 2> ..\build_gradle_err.txt
if errorlevel 1 (
  echo [%TIME%] ERRO no gradle! >> ..\build_v148.log
  type ..\build_gradle_err.txt >> ..\build_v148.log
  exit /b 1
)
cd ..
echo [%TIME%] [3/4] Gradle OK >> build_v148.log

echo [%TIME%] [4/4] Copiando AAB... >> build_v148.log
copy "android\app\build\outputs\bundle\release\app-release.aab" "horamed-v1.0.48-release.aab"
echo [%TIME%] [4/4] AAB copiado >> build_v148.log

echo [%TIME%] === BUILD CONCLUIDO === >> build_v148.log
