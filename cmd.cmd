@echo off
setlocal enabledelayedexpansion
color 0A

:menu
cls
  echo ===============================
  echo       Remote CMD Tool Menu
  echo ===============================
  echo 1. View Local IP Info
  echo 2. Clean Temp Files
  echo 3. Reboot System
  echo 4. Show Shared Folders
  echo 5. View User Accounts
  echo 6. System Information
  echo 7. Disk Usage
  echo 8. Port Usage
  echo 0. Exit
  echo ===============================
  set /p choice=Enter choice number:
)

if "%choice%"=="1" goto ip
if "%choice%"=="2" goto clean
if "%choice%"=="3" goto reboot
if "%choice%"=="4" goto share
if "%choice%"=="5" goto userinfo
if "%choice%"=="6" goto sysinfo
if "%choice%"=="7" goto disk
if "%choice%"=="8" goto port
if "%choice%"=="0" exit
goto menu

:ip
cls
ipconfig
pause
goto menu

:clean
cls
PowerShell -Command "Clear-RecycleBin -Force"
del /f /s /q %temp%\* > nul
del /f /s /q %windir%\Temp\* > nul
echo Done.
pause
goto menu

:reboot
cls
shutdown -r -t 0

:share
cls
net share
pause
goto menu

:userinfo
cls
net user
net user Administrator
pause
goto menu

:sysinfo
cls
systeminfo
pause
goto menu

:disk
cls
wmic logicaldisk get size,freespace,caption
pause
goto menu

:port
cls
netstat -ano
pause
goto menu
