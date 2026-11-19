-- Run the GYM20 push dispatcher once per minute.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
select cron.unschedule(jobid) from cron.job where jobname='gym20-student-push-dispatch';
select cron.schedule('gym20-student-push-dispatch','* * * * *',$job$
  select net.http_post(
    url := 'https://ubrafxjpnqtjnjdaskba.supabase.co/functions/v1/student-push-cron',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','sb_publishable_hqqbaInJ5kXtySlybUdwjA_i0QHxpV3',
      'x-gym20-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='gym20_student_push_cron_secret' limit 1)
    ),
    body := '{}'::jsonb
  );
$job$);
