# Persistent background web server daemon for Quiz VDS-VL
# Keeps Vite running continuously in the background until system reboot or explicit termination

$ErrorActionPreference = 'SilentlyContinue'
$rootDir = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location -Path $rootDir

$logFile = Join-Path $rootDir "server.log"
$pidFile = Join-Path $rootDir "server.pid"

$PID | Out-File -FilePath $pidFile -Encoding utf8 -Force
"[{0}] Starting persistent Vite web server daemon (Watchdog PID: {1})..." -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $PID | Out-File -FilePath $logFile -Encoding utf8 -Append

while ($true) {
    try {
        "[{0}] Launching Vite dev server on 0.0.0.0:5173..." -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss") | Out-File -FilePath $logFile -Encoding utf8 -Append
        & node "node_modules/vite/bin/vite.js" --host 0.0.0.0 --port 5173 *>> $logFile
    } catch {
        "[{0}] Server encountered error: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $_ | Out-File -FilePath $logFile -Encoding utf8 -Append
    }
    Start-Sleep -Seconds 2
}
