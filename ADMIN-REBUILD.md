# GYM20 Admin Rebuild (Draft)

This branch adds a standalone admin entry point at `/admin.html`. It is intentionally isolated from `main`; it does not replace the production admin route.

## Modules
- Dashboard and quick stats.
- Student records: create, edit, activate/deactivate, search.
- Student terms and schedule editor: reuses the existing `student-terms.js` implementation, including Jalali calendar, term history, draft/publish workflow, coach swipe control, custom time wheel, attendance and student public links.
- Student exercises: reuses `student-exercises.js`.
- Registration requests: review, approve/reject, convert to student, delete unconverted requests, bulk delete.
- Courses/styles, class-type availability, price multipliers, session rates, regions, tuition and rules.
- Public registration page text settings.
- Payment method/contact details.
- Owner-only student payment ledger (requires the new migration below).
- Attendance list and per-student session status.
- Coach schedule counts for the existing coach names (هانیه / بهروز).
- Push reminders and message templates, including 6h/2h defaults and zero to disable; per-student push actions are provided by the reused term module.
- Integration status panel. Telegram secrets are never exposed in browser code.

## Database migrations
Review and apply only after the production Supabase project is recovered and the migration contents are approved:
1. `supabase/migrations/20261118010000_admin_finance_ledger.sql` — creates owner-only `gym20.student_payments`.
2. `supabase/migrations/20261118011000_restore_shared_term_editor.sql` — restores the shared-style session RPC contract expected by the current term editor, adds `coach_name`, and provides the `create_term_edit_draft` alias.

The second migration is important because the existing term editor sends `enrollment_ids[]` for a shared class session. The later legacy migration in main replaced that API with a single `enrollment_id` payload. This migration restores the multi-style session behavior and preserves coach names.

## Safety and current limitations
- No changes have been made to `main`, the production site, DNS, or Supabase.
- This branch has not been merged or deployed.
- Login and live database operations cannot be tested until the production Supabase project is reachable.
- The payment ledger remains unavailable until migration `20261118010000` is applied.
- Telegram bot password/subscription and SMS delivery require verified server-side Edge Functions/secrets; the panel does not fake these actions or expose secrets.
- The public site configuration is stored in `gym20.site_settings` under `public_site_config`.
- Only the public Supabase Publishable key is present in the browser. Never add a service-role or secret key.
