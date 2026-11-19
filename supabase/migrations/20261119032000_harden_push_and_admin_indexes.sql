-- Restrict push internals to the server role and index admin foreign-key paths.
begin;
drop policy if exists student_push_service_only on gym20.student_push_vapid;
create policy student_push_service_only on gym20.student_push_vapid for all to service_role using(true) with check(true);
drop policy if exists student_push_service_only on gym20.student_push_subscriptions;
create policy student_push_service_only on gym20.student_push_subscriptions for all to service_role using(true) with check(true);
drop policy if exists student_push_service_only on gym20.student_push_deliveries;
create policy student_push_service_only on gym20.student_push_deliveries for all to service_role using(true) with check(true);
drop policy if exists student_exercises_owner_all on gym20.student_exercises;
create policy student_exercises_owner_all on gym20.student_exercises for all to authenticated
using(exists(select 1 from gym20.profiles p where p.id=(select auth.uid()) and p.role='owner' and p.is_active=true))
with check(exists(select 1 from gym20.profiles p where p.id=(select auth.uid()) and p.role='owner' and p.is_active=true));
create index if not exists idx_gym20_attendance_confirmed_by on gym20.attendance(confirmed_by);
create index if not exists idx_gym20_attendance_enrollment_id on gym20.attendance(enrollment_id);
create index if not exists idx_gym20_attendance_student_id on gym20.attendance(student_id);
create index if not exists idx_gym20_class_session_styles_enrollment_id on gym20.class_session_styles(enrollment_id);
create index if not exists idx_gym20_class_sessions_course_id on gym20.class_sessions(course_id);
create index if not exists idx_gym20_class_sessions_created_by on gym20.class_sessions(created_by);
create index if not exists idx_gym20_class_sessions_enrollment_id on gym20.class_sessions(enrollment_id);
create index if not exists idx_gym20_enrollments_course_id on gym20.enrollments(course_id);
create index if not exists idx_gym20_enrollments_student_id on gym20.enrollments(student_id);
create index if not exists idx_gym20_payments_created_by on gym20.payments(created_by);
create index if not exists idx_gym20_payments_enrollment_id on gym20.payments(enrollment_id);
create index if not exists idx_gym20_payments_student_id on gym20.payments(student_id);
create index if not exists idx_gym20_registration_requests_converted_by on gym20.public_registration_requests(converted_by);
create index if not exists idx_gym20_registration_requests_course_id on gym20.public_registration_requests(course_id);
create index if not exists idx_gym20_site_settings_updated_by on gym20.site_settings(updated_by);
create index if not exists idx_gym20_student_payments_created_by on gym20.student_payments(created_by);
create index if not exists idx_gym20_student_push_deliveries_session_id on gym20.student_push_deliveries(session_id);
create index if not exists idx_gym20_student_terms_created_by on gym20.student_terms(created_by);
create index if not exists idx_gym20_student_terms_published_version_id on gym20.student_terms(published_version_id);
create index if not exists idx_gym20_term_schedule_versions_created_by on gym20.term_schedule_versions(created_by);
commit;
