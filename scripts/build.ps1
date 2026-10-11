[CmdletBinding()]
param([switch]$Silent, [ValidateRange(1, 4)][int]$MaxWorkers = 2, [ValidateRange(512, 2048)][int]$MaxHeapMiB = 1536)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'java-toolchain.json') -Raw | ConvertFrom-Json
function Test-Java25([string]$HomePath) {
    if (-not $HomePath -or -not (Test-Path -LiteralPath (Join-Path $HomePath 'bin\java.exe'))) { return $false }
    $versionText = & (Join-Path $HomePath 'bin\java.exe') --version 2>&1 | Out-String
    return $LASTEXITCODE -eq 0 -and $versionText -match '(?m)^(?:openjdk|java) 25\.'
}
$javaCandidates = @($env:JAVA_HOME, (Join-Path $env:LOCALAPPDATA 'BlueMap-toolchain\java'), (Join-Path $env:LOCALAPPDATA 'worldlens-toolchain\java\temurin-25'))
$javaHomePath = $javaCandidates | Where-Object { Test-Java25 $_ } | Select-Object -First 1
if (-not $javaHomePath) {
    if ([Environment]::GetEnvironmentVariable('PROCESSOR_ARCHITECTURE') -ne 'AMD64') { throw 'Automatic Java acquisition currently supports Windows x64 only. Supply a supported Java 25 JAVA_HOME for another architecture.' }
    $toolsRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'BlueMap-toolchain'))
    New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null
    $archivePath = Join-Path $toolsRoot $manifest.asset
    if (-not (Test-Path -LiteralPath $archivePath) -or (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $manifest.sha256) {
        if (Test-Path -LiteralPath $archivePath) { throw 'Existing Java archive has a different digest; preserve it for review before retrying.' }
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $manifest.url -OutFile $archivePath -UseBasicParsing -TimeoutSec 600
    }
    if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $manifest.sha256) { throw 'Java archive SHA-256 mismatch.' }
    $stagePath = Join-Path $toolsRoot ('stage-' + [guid]::NewGuid().ToString('N'))
    Expand-Archive -LiteralPath $archivePath -DestinationPath $stagePath
    $extractedHome = Get-ChildItem -LiteralPath $stagePath -Directory | Where-Object { Test-Java25 $_.FullName } | Select-Object -First 1
    if (-not $extractedHome) { throw 'Verified Java archive did not contain a runnable Java 25.' }
    $javaHomePath = Join-Path $toolsRoot 'java'
    if (Test-Path -LiteralPath $javaHomePath) { throw 'Existing Java destination is invalid; preserve it for review before retrying.' }
    Move-Item -LiteralPath $extractedHome.FullName -Destination $javaHomePath
}
$env:JAVA_HOME = $javaHomePath
$env:PATH = (Join-Path $javaHomePath 'bin') + ';' + $env:PATH
Write-Output ('Using verified runnable Java 25: ' + $javaHomePath)
Push-Location $repoRoot
try {
    & git submodule update --init -- api
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & (Join-Path $repoRoot 'gradlew.bat') ':cli:shadowJar' '--no-daemon' "--max-workers=$MaxWorkers" "-Dorg.gradle.jvmargs=-Xmx${MaxHeapMiB}m" '-Pkotlin.compiler.execution.strategy=in-process'
    exit $LASTEXITCODE
} finally { Pop-Location }

