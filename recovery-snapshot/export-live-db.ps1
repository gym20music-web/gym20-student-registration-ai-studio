# GYM20 encrypted live database export
# Run in PowerShell on Windows. Requires PostgreSQL 17 client (pg_dump) and OpenSSL.
# This reads production only; it does not modify the database.
$ErrorActionPreference = "Stop"
$hostName = "db.ubrafxjpnqtjnjdaskba.supabase.co"
$port = "5432"
$dbName = "postgres"
$dbUser = "postgres"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path (Get-Location) "GYM20-Backup-$stamp"
New-Item -ItemType Directory -Path $outDir | Out-Null
$rawDump = Join-Path $outDir "gym20-live.dump"
$encryptedDump = Join-Path $outDir "gym20-live.dump.enc"

$pg = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pg) { throw "pg_dump not found. Install PostgreSQL 17 command-line tools, then reopen PowerShell." }
$version = (& pg_dump --version | Out-String).Trim()
if ($version -notmatch "([0-9]+)\.") { throw "Cannot identify pg_dump version: $version" }
if ([int]$Matches[1] -lt 17) { throw "PostgreSQL 17 client is required. Found: $version" }
if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) { throw "OpenSSL not found. Install OpenSSL before running this backup." }

$secure = Read-Host "Enter the Supabase DATABASE password (it will not be saved in this script)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
$env:PGSSLMODE = "require"

try {
  & pg_dump --format=custom --no-owner --no-acl --host=$hostName --port=$port --username=$dbUser --dbname=$dbName --file=$rawDump
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $rawDump)) { throw "pg_dump failed. No encrypted backup was created." }
  Write-Host "Database dump created. Encrypt it now; choose a strong passphrase and store it separately."
  & openssl enc -aes-256-cbc -pbkdf2 -iter 250000 -salt -in $rawDump -out $encryptedDump
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $encryptedDump)) { throw "Encryption failed. The raw dump is retained at $rawDump; protect it and do not share it." }
  Remove-Item $rawDump -Force
  $hash = (Get-FileHash $encryptedDump -Algorithm SHA256).Hash
  Set-Content -Path (Join-Path $outDir "SHA256.txt") -Value "$hash  gym20-live.dump.enc"
  Write-Host "SUCCESS: $encryptedDump"
  Write-Host "SHA256: $hash"
  Write-Host "The encrypted dump contains database records, including Auth records and sensitive push-key data. Keep the encryption passphrase separate."
}
finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue
  $secure.Dispose()
}
