# Helper script to stop the persistent background web server daemon

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "Stopping persistent web server daemon and freeing port 5173..." -ForegroundColor Yellow

# Kill PowerShell processes running start_server_daemon.ps1
Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -like "*start_server_daemon.ps1*" -and $_.ProcessId -ne $PID
} | ForEach-Object {
    Write-Host "Terminating daemon watchdog PID: $($_.ProcessId)" -ForegroundColor DarkGray
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

# Kill processes listening on port 5173
$connections = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
        Write-Host "Terminating server process PID: $p" -ForegroundColor DarkGray
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Web server stopped successfully." -ForegroundColor Green
