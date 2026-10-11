@echo off
setlocal
if "%~1"=="" goto build
if /i "%~1"=="/s" goto build
if /i "%~1"=="--silent" goto build
echo Unsupported build argument: %~1 1>&2
exit /b 64
:build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build.ps1" -Silent
exit /b %ERRORLEVEL%
