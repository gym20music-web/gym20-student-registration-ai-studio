# Complete the live database export

A local encrypted Supabase-native dump is required because connected Supabase tools do not provide a binary database download.

Install Supabase CLI, Docker Desktop (start it), and OpenSSL. Download `export-live-db.ps1`, open PowerShell in its folder, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\export-live-db.ps1
```

In Supabase Dashboard for project `ubrafxjpnqtjnjdaskba`, click **Connect** and copy the full PostgreSQL URI. Use Direct connection if IPv6 is supported; otherwise use Session pooler (port 5432). Replace the password placeholder locally and paste the full URI into the hidden PowerShell prompt. Choose a strong OpenSSL encryption passphrase and keep it separately.

The script exports roles, schema, and data via the Supabase CLI, archives them, encrypts the archive using AES-256-CBC/PBKDF2, and removes temporary plaintext after successful encryption. If encryption fails, it retains the local plaintext archive and reports that it must be protected. No production data is changed.

The live project currently reports zero Storage buckets and zero Storage objects. Edge Function source code is stored in this recovery branch. Project secrets, Auth provider configuration, SMTP, JWT/API signing secrets, custom-domain settings, DNS and project-level settings are not included in the database dump. Record which settings are enabled and recreate/rotate secret values securely during restoration; never commit secret values to this public GitHub repository.
