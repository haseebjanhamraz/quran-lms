@echo off
setlocal enabledelayedexpansion
title LiveKit Server (Windows Local)
echo =======================================================
echo     Starting LiveKit Server natively on Windows Host
echo =======================================================

if exist "bin\livekit-server.exe" (
    set "LIVEKIT_BIN=bin\livekit-server.exe"
) else (
    where livekit-server.exe >nul 2>&1
    if !errorlevel! equ 0 (
        set "LIVEKIT_BIN=livekit-server.exe"
    ) else (
        echo LiveKit server binary not found. Downloading latest Windows release...
        if not exist "bin" mkdir bin
        curl.exe -L -o bin\livekit.zip https://github.com/livekit/livekit/releases/download/v1.13.4/livekit_1.13.4_windows_amd64.zip
        if !errorlevel! neq 0 (
            echo Failed to download LiveKit binary. Please check your network connection.
            pause
            exit /b 1
        )
        tar.exe -xf bin\livekit.zip -C bin
        if exist bin\livekit.zip del /q bin\livekit.zip 2>nul
        if exist "bin\livekit-server.exe" (
            echo LiveKit server downloaded successfully to bin\livekit-server.exe
            set "LIVEKIT_BIN=bin\livekit-server.exe"
        ) else (
            echo Could not locate bin\livekit-server.exe after extraction.
            pause
            exit /b 1
        )
    )
)

echo.
echo Executable : !LIVEKIT_BIN!
echo Listening  : http://localhost:7880 (WS signaling)
echo Media Ports: 7881 (TCP), 7882 (UDP), TURN 3478 (UDP)
echo =======================================================

if exist "livekit.yaml" (
    !LIVEKIT_BIN! --config livekit.yaml --dev
) else (
    !LIVEKIT_BIN! --dev
)

pause

