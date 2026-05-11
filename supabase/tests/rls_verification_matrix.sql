-- RLS verification matrix (manual run with each role JWT in SQL editor)
-- Replace auth.jwt with session context in your tooling.

-- ADMIN expectations
-- Can read all registries and attendance
select count(*) from public.profiles;
select count(*) from public.students;
select count(*) from public.attendance_logs;

-- TEACHER expectations
-- Own attendance rows insert/update, read taught data
-- (run as teacher session)
select * from public.teachers;
select * from public.attendance_logs order by log_date desc limit 20;

-- STUDENT expectations
-- Read own student + class data, no writes
select * from public.students;
select * from public.timetable_entries order by day_of_week, period;

-- PARENT expectations
-- Read linked children only
select * from public.parent_student_links;
select * from public.students;

-- Negative tests (should fail in non-admin sessions)
-- insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-000000000000','teacher');
-- update public.attendance_policy set punctuality_limit='09:30' where id=1;
