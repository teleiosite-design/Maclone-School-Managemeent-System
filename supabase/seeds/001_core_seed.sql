-- Core seed script for slices 1-3
-- Run in SQL editor/service role after creating auth users.

-- Expected placeholders:
-- <admin_uid>, <teacher_uid>, <student_uid>, <parent_uid>

insert into public.user_roles (user_id, role) values
  ('<admin_uid>', 'admin'),
  ('<teacher_uid>', 'teacher'),
  ('<student_uid>', 'student'),
  ('<parent_uid>', 'parent')
on conflict do nothing;

insert into public.subjects (code, name) values
  ('MATH','Mathematics'),
  ('ENG','English'),
  ('SCI','Science')
on conflict (code) do nothing;

insert into public.teachers (profile_id, employee_no, department, hire_date)
values ('<teacher_uid>', 'EMP-001', 'Sciences', '2023-09-01')
on conflict (employee_no) do nothing;

insert into public.classes (name, grade_level, stream, academic_year, homeroom_teacher_id)
values ('JSS1-A', 'JSS1', 'A', '2025/2026', (select id from public.teachers where employee_no='EMP-001'))
on conflict (name, academic_year) do nothing;

insert into public.class_subjects (class_id, subject_id, teacher_id)
select c.id, s.id, t.id
from public.classes c
join public.subjects s on s.code='MATH'
join public.teachers t on t.employee_no='EMP-001'
where c.name='JSS1-A' and c.academic_year='2025/2026'
on conflict (class_id, subject_id) do nothing;

insert into public.students (profile_id, admission_no, current_class_id, guardian_name)
values ('<student_uid>', 'ADM-0001', (select id from public.classes where name='JSS1-A' and academic_year='2025/2026'), 'Mr. Doe')
on conflict (admission_no) do nothing;

insert into public.enrollments (student_id, class_id, academic_year)
select s.id, c.id, '2025/2026'
from public.students s
join public.classes c on c.name='JSS1-A' and c.academic_year='2025/2026'
where s.admission_no='ADM-0001'
on conflict (student_id, class_id, academic_year) do nothing;

insert into public.parent_student_links (parent_profile_id, student_id, relationship, is_primary)
select '<parent_uid>', s.id, 'parent', true
from public.students s
where s.admission_no='ADM-0001'
on conflict (parent_profile_id, student_id) do nothing;

insert into public.timetable_entries (class_id, subject_id, teacher_id, day_of_week, period, start_time, end_time, room, academic_year)
select c.id, s.id, t.id, 1, 1, '08:00', '08:45', 'Room 1', '2025/2026'
from public.classes c
join public.subjects s on s.code='MATH'
join public.teachers t on t.employee_no='EMP-001'
where c.name='JSS1-A' and c.academic_year='2025/2026'
on conflict (class_id, day_of_week, period, academic_year) do nothing;
