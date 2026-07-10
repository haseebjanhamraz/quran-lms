@echo off
title LiveKit Server (Host Natively)
echo =======================================================
echo     Starting LiveKit Server natively on Windows Host
echo =======================================================
echo Connecting to Redis on localhost:6379...
echo Listening on http://localhost:7880 (WS signaling)
echo Media Ports: 7881 (TCP), 7882 (UDP)
echo =======================================================
bin\livekit-server.exe --config livekit.yaml
pause
