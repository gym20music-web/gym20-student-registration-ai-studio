# GYM20 live database inventory — 2026-11-19

Project: `ubrafxjpnqtjnjdaskba`
Region: `eu-west-2`
Status at capture: `ACTIVE_HEALTHY`
PostgreSQL: `17.12`

## Live row counts (read-only snapshot)
Total rows in gym20 base tables: **968** across **19** tables.

| Table | Rows |
|---|---:|
| `attendance` | 0 |
| `class_session_styles` | 693 |
| `class_sessions` | 189 |
| `courses` | 6 |
| `enrollments` | 5 |
| `payments` | 0 |
| `profiles` | 1 |
| `public_registration_requests` | 4 |
| `site_settings` | 2 |
| `student_exercises` | 3 |
| `student_payments` | 0 |
| `student_public_links` | 2 |
| `student_push_deliveries` | 19 |
| `student_push_subscriptions` | 6 |
| `student_push_vapid` | 1 |
| `student_terms` | 2 |
| `students` | 2 |
| `term_enrollments` | 5 |
| `term_schedule_versions` | 28 |

Additional metadata:
- Auth users: **1**
- Storage buckets: **0**
- Storage objects: **0**
- gym20 routines: **16**
- gym20 triggers: **0**
- gym20 RLS policies: **23**
- gym20 indexes: **57**
- Live applied migration records: **16**
- Migration SQL files present in this repository snapshot: **11**

## Live applied migration history
- `20261118075334` — `gym20_core_schema`
- `20261118075349` — `public_registration`
- `20261118075428` — `registration_request_management`
- `20261118075431` — `student_term_scheduling`
- `20261118075433` — `shared_term_session_count`
- `20261118075435` — `term_schedule_workflows`
- `20261118075437` — `restore_shared_term_editor`
- `20261118075440` — `admin_finance_ledger`
- `20261118075456` — `admin_panel_site_config`
- `20261118110917` — `add_student_exercises_admin`
- `20261118112106` — `restore_student_public_link_rpcs`
- `20261119015537` — `public_student_schedule_rpcs`
- `20261119020031` — `public_student_schedule_rpc_wrappers`
- `20261119045233` — `restore_student_push_infrastructure`
- `20261119045454` — `schedule_student_push_dispatch`
- `20261119045629` — `harden_push_policies_and_admin_indexes`

## Important discrepancy / recovery gap
The live database reports 16 applied migration records, while the repository snapshot contains 11 migration SQL files. The repository migration directory is therefore **not a complete authoritative dump of the live schema history**. Do not treat migrations alone as a full database backup.

## What this inventory is not
This is a read-only metadata inventory, **not** a database data dump. It does not contain student records, Auth user records, database schema DDL, Storage binaries, Auth/provider configuration, project settings, or secret values. No secrets are intentionally copied into this file.

## Remaining requirement for a complete restorable backup
A real PostgreSQL dump is still required. The connected Supabase tools can inspect/query the database but do not expose a `pg_dump`/download operation or the database password. Storage currently reports zero buckets and zero objects. Supabase project secrets and Auth provider settings are not exportable through the available tools. Keep production unchanged until the database dump and configuration inventory are secured.
