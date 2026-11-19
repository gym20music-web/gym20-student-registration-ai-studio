# Final database export step

The available connected Supabase tools do not expose the database password or a binary pg_dump download. Do not paste the database password or service-role key into ChatGPT.

To finish the encrypted full database backup:
1. Download `export-live-db.ps1` from this folder.
2. On Windows, install PostgreSQL 17 command-line tools (pg_dump) and OpenSSL.
3. Open PowerShell in the folder where the script was downloaded and run:
   `powershell -ExecutionPolicy Bypass -File .\export-live-db.ps1`
4. When prompted, enter the database password from Supabase Dashboard → Project Settings → Database. The script uses it only in the current process, exports the database in custom pg_dump format, encrypts the dump with AES-256-CBC/PBKDF2, then deletes the unencrypted dump if encryption succeeds.
5. Keep the encryption passphrase separately. Never upload an unencrypted dump; it contains personal data and private push keys.

This is a read-only export. It does not change production.

Current live Storage inventory is zero buckets and zero objects, so there are no Storage file bodies to export at this snapshot. The database dump still captures database-side schemas/metadata. Supabase project secrets, Auth provider settings, project configuration, DNS settings, and the live database password are outside pg_dump and must be preserved separately in the Supabase dashboard. Never store secret values in this GitHub repository.
