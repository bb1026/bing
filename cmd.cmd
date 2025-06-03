@echo off
setlocal enabledelayedexpansion
color 0A

:: 获取系统语言
for /f "tokens=*" %%i in ('wmic os get locale ^| findstr /r "^[0-9]"') do set locale=%%i

:: 判断语言
if "!locale!"=="2052" (
  set lang=zh
) else (
  set lang=en
)

:menu
cls
if "!lang!"=="zh" (
  echo ===============================
  echo        远程 CMD 工具菜单
  echo ===============================
  echo 1. 查看本地 IP 信息
  echo 2. 清理系统垃圾
  echo 3. 重启计算机
  echo 4. 获取本地共享目录
  echo 5. 查看本地账户信息
  echo 6. 显示系统信息
  echo 7. 查看磁盘使用情况
  echo 8. 查看端口占用情况
  echo 0. 退出
  echo ===============================
  set /p choice=请输入选项数字：
) else (
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

:: 注意这里保持使用 %choice%（不用加感叹号）
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