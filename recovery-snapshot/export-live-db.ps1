# GYM20 encrypted Supabase-native database backup
# Exports roles, schema, and data using Supabase CLI (with Docker).
# READ-ONLY against production.
$ErrorActionPreference = "Stop"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path (Get-Location) "GYM20-Backup-$stamp"
$workDir = Join-Path $env:TEMP "GYM20-db-export-$stamp"
New-Item -ItemType Directory -Path $outDir | Out-Null
New-Item -ItemType Directory -Path $workDir | Out-Null
$archive = Join-Path $outDir "GYM20-database-backup.zip"
$encrypted = Join-Path $outDir "GYM20-database-backup.zip.enc"

foreach ($tool in @("supabase","docker","openssl")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "$tool is not installed or not in PATH. Install Supabase CLI, Docker Desktop, and OpenSSL, then reopen PowerShell."
  }
}
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw "Docker Desktop is not running. Start it and retry." }

Write-Host "Supabase Dashboard > project > Connect: copy the full PostgreSQL URI."
Write-Host "Use Direct connection (IPv6) or Session pooler (IPv4, port 5432). Replace [YOUR-PASSWORD] locally."
$secure = Read-Host "Paste the complete PostgreSQL connection URI (hidden input)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $dbUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

try {
  if ($dbUrl -notmatch '^postgres(ql)?://') { throw "Connection URI format is invalid." }
  $roles = Join-Path $workDir "roles.sql"
  $schema = Join-Path $workDir "schema.sql"
  $data = Join-Path $workDir "data.sql"
  & supabase db dump --db-url $dbUrl -f $roles --role-only
  if ($LASTEXITCODE -ne 0) { throw "Supabase roles export failed." }
  & supabase db dump --db-url $dbUrl -f $schema
  if ($LASTEXITCODE -ne 0) { throw "Supabase schema export failed." }
  & supabase db dump --db-url $dbUrl -f $data --use-copy --data-only
  if ($LASTEXITCODE -ne 0) { throw "Supabase data export failed." }
  foreach ($file in @($roles,$schema,$data)) {
    if (-not (Test-Path $file) -or (Get-Item $file).Length -eq 0) { throw "Export file missing or empty: $file" }
  }
  Compress-Archive -Path $roles,$schema,$data -DestinationPath $archive -CompressionLevel Optimal
  if (-not (Test-Path $archive) -or (Get-Item $archive).Length -eq 0) { throw "Archive creation failed." }
  Write-Host "Exports created. Choose a strong encryption passphrase and store it separately."
  & openssl enc -aes-256-cbc -pbkdf2 -iter 250000 -salt -in $archive -out $encrypted
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $encrypted)) { throw "Encryption failed. Plain ZIP remains at $archive; protect it and do not share it." }
  Remove-Item $archive -Force
  $hash = (Get-FileHash $encrypted -Algorithm SHA256).Hash
  Set-Content -Path (Join-Path $outDir "SHA256.txt") -Value "$hash  GYM20-database-backup.zip.enc"
  Write-Host "SUCCESS: $encrypted"
  Write-Host "SHA256: $hash"
}
finally {
  $dbUrl = $null
  Remove-Item $workDir -Recurse -Force -ErrorAction SilentlyContinue
  $secure.Dispose()
}
