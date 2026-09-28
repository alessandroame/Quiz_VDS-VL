# Persistent background web server daemon for VDS-VL Quiz Master
# Keeps Vite running continuously until system reboot or explicit termination

$ErrorActionPreference = 'SilentlyContinue'
$rootDir = "d:\Github\Quiz_VDS-VL"
Set-Location -Path $rootDir

$logFile = Join-Path $rootDir "server.log"
"[{0}] Starting persistent Vite web server daemon..." -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss") | Out-File -FilePath $logFile -Encoding utf8 -Append

while ($true) {
    try {
        "[{0}] Launching 'npx vite --host 0.0.0.0 --port 5173'..." -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss") | Out-File -FilePath $logFile -Encoding utf8 -Append
        & npx vite --host 0.0.0.0 --port 5173 *>> $logFile
    } catch {
        "[{0}] Server encountered error: {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $_ | Out-File -FilePath $logFile -Encoding utf8 -Append
    }
    Start-Sleep -Seconds 2
}
