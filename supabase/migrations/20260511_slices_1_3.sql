-- Canonical migration for backend slices 1-3
create extension if not exists pgcrypto;

-- roles
create type if not exists public.app_role as enum ('admin','teacher','student','parent');

-- profiles + user_roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
as $$
  select exists (select 1 from public.user_roles ur where ur.user_id = _user_id and ur.role = _role)
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Slice 2
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  employee_no text unique not null,
  department text,
  hire_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level text not null,
  stream text,
  academic_year text not null,
  homeroom_teacher_id uuid references public.teachers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, academic_year)
);
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id),
  admission_no text unique not null,
  current_class_id uuid references public.classes(id),
  guardian_name text,
  dob date,
  gender text,
  status text not null default 'active',
  enrollment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, subject_id)
);
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  academic_year text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, class_id, academic_year)
);
create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  teacher_id uuid not null references public.teachers(id),
  day_of_week int not null check (day_of_week between 1 and 7),
  period int not null,
  start_time time not null,
  end_time time not null,
  room text,
  academic_year text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, day_of_week, period, academic_year)
);
create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  relationship text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_profile_id, student_id)
);

-- Slice 3
create table if not exists public.attendance_policy (
  id int primary key default 1,
  earliest_sign_in time not null default '07:00',
  punctuality_limit time not null default '09:00',
  grace_threshold_mins int not null default 15,
  absence_trigger time not null default '11:00',
  half_day_boundary time not null default '13:00',
  window_authorization time not null default '16:00',
  standard_shift_end time not null default '18:00',
  updated_at timestamptz not null default now(),
  constraint one_policy_row check (id = 1)
);
insert into public.attendance_policy (id) values (1) on conflict (id) do nothing;

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id),
  log_date date not null default current_date,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  source_ip text,
  device_id text,
  user_agent text,
  outcome text not null default 'verified',
  validation text not null default 'pass',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, log_date)
);

create table if not exists public.attendance_anomalies (
  id uuid primary key default gen_random_uuid(),
  attendance_log_id uuid references public.attendance_logs(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id),
  anomaly_type text not null,
  severity text not null,
  details jsonb,
  resolved boolean not null default false,
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  log_date date not null,
  status text not null,
  recorded_by_teacher_id uuid references public.teachers(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, log_date)
);

-- Basic indexes
create index if not exists idx_students_created_at on public.students (created_at desc);
create index if not exists idx_enrollments_student on public.enrollments (student_id);
create index if not exists idx_timetable_class_day on public.timetable_entries (class_id, day_of_week);
create index if not exists idx_attendance_logs_teacher_date on public.attendance_logs (teacher_id, log_date desc);
create index if not exists idx_attendance_anomalies_resolved_created on public.attendance_anomalies (resolved, created_at desc);
create index if not exists idx_student_attendance_class_date on public.student_attendance (class_id, log_date desc);

-- Common updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auth profile bootstrap trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- updated_at triggers
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','teachers','classes','students','subjects','class_subjects','enrollments',
    'timetable_entries','parent_student_links','attendance_logs','student_attendance','attendance_policy'
  ]
  LOOP
    EXECUTE format('drop trigger if exists trg_%I_updated_at on public.%I;', t, t);
    EXECUTE format('create trigger trg_%I_updated_at before update on public.%I for each row execute procedure public.set_updated_at();', t, t);
  END LOOP;
END $$;

-- Role helpers
create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id from public.teachers t where t.profile_id = auth.uid() limit 1
$$;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id from public.students s where s.profile_id = auth.uid() limit 1
$$;

create or replace function public.teacher_teaches_class(_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    left join public.class_subjects cs on cs.class_id = c.id
    left join public.timetable_entries te on te.class_id = c.id
    where c.id = _class_id
      and (
        c.homeroom_teacher_id = public.current_teacher_id()
        or cs.teacher_id = public.current_teacher_id()
        or te.teacher_id = public.current_teacher_id()
      )
  )
$$;

create or replace function public.is_parent_of_student(_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.parent_student_links psl
    where psl.student_id = _student_id
      and psl.parent_profile_id = auth.uid()
  )
$$;

revoke execute on function public.current_teacher_id() from anon, authenticated;
revoke execute on function public.current_student_id() from anon, authenticated;
revoke execute on function public.teacher_teaches_class(uuid) from anon, authenticated;
revoke execute on function public.is_parent_of_student(uuid) from anon, authenticated;

-- RLS enablement
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.class_subjects enable row level security;
alter table public.enrollments enable row level security;
alter table public.timetable_entries enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.attendance_policy enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.attendance_anomalies enable row level security;
alter table public.student_attendance enable row level security;

-- Drop old policies for idempotency
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN (
        'profiles','user_roles','teachers','classes','students','subjects','class_subjects',
        'enrollments','timetable_entries','parent_student_links','attendance_policy',
        'attendance_logs','attendance_anomalies','student_attendance'
      )
  LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Profiles/user_roles policies
create policy profiles_select_own_or_admin on public.profiles for select
using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy profiles_update_own_or_admin on public.profiles for update
using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy user_roles_select_own_or_admin on public.user_roles for select
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy user_roles_admin_insert on public.user_roles for insert
with check (public.has_role(auth.uid(), 'admin'));
create policy user_roles_admin_delete on public.user_roles for delete
using (public.has_role(auth.uid(), 'admin'));

-- Admin-only write policies helper
create policy teachers_read_role_scoped on public.teachers for select
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'teacher')
  or public.has_role(auth.uid(), 'student')
  or public.has_role(auth.uid(), 'parent')
);
create policy teachers_admin_write on public.teachers for all
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy classes_select_scoped on public.classes for select
using (
  public.has_role(auth.uid(), 'admin')
  or (public.has_role(auth.uid(), 'teacher') and public.teacher_teaches_class(id))
  or (public.has_role(auth.uid(), 'student') and id in (select current_class_id from public.students s where s.profile_id = auth.uid()))
  or (public.has_role(auth.uid(), 'parent') and exists (
      select 1 from public.students s
      join public.parent_student_links psl on psl.student_id = s.id
      where psl.parent_profile_id = auth.uid() and s.current_class_id = classes.id
    ))
);
create policy classes_admin_write on public.classes for all
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy students_select_scoped on public.students for select
using (
  public.has_role(auth.uid(), 'admin')
  or (public.has_role(auth.uid(), 'teacher') and public.teacher_teaches_class(current_class_id))
  or (public.has_role(auth.uid(), 'student') and profile_id = auth.uid())
  or (public.has_role(auth.uid(), 'parent') and public.is_parent_of_student(id))
);
create policy students_admin_write on public.students for all
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy subjects_read_all_roles on public.subjects for select
using (auth.role() = 'authenticated');
create policy subjects_admin_write on public.subjects for all
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy class_subjects_select_scoped on public.class_subjects for select
using (
  public.has_role(auth.uid(), 'admin')
  or (public.has_role(auth.uid(), 'teacher') and teacher_id = public.current_teacher_id())
  or (public.has_role(auth.uid(), 'student') and class_id in (select current_class_id from public.students s where s.profile_id = auth.uid()))
  or (public.has_role(auth.uid(), 'parent') and exists (
    select 1 from public.students s
    join public.parent_student_links psl on psl.student_id = s.id
    where psl.parent_profile_id = auth.uid() and s.current_class_id = class_subjects.class_id
  ))
);
create policy class_subjects_admin_write on public.class_subjects for all
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy enrollments_select_scoped on public.enrollments for select
using (
  public.has_role(auth.uid(), 'admin')
  or (public.has_role(auth.uid(), 'teacher') and public.teacher_teaches_class(class_id))
  or (public.has_role(auth.uid(), 'student') and student_id = public.current_student_id())
  or (public.has_role(auth.uid(), 'parent') and public.is_parent_of_student(student_id))
);
create policy enrollments_admin_write on public.enrollments for all
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy timetable_select_scoped on public.timetable_entries for select
using (
  public.has_role(auth.uid(), 'admin')
  or (public.has_role(auth.uid(), 'teacher') and teacher_id = public.current_teacher_id())
  or (public.has_role(auth.uid(), 'student') and class_id in (select current_class_id from public.students s where s.profile_id = auth.uid()))
  or (public.has_role(auth.uid(), 'parent') and exists (
    select 1 from public.students s
    join public.parent_student_links psl on psl.student_id = s.id
    where psl.parent_profile_id = auth.uid() and s.current_class_id = timetable_entries.class_id
  ))
);
create policy timetable_admin_write on public.timetable_entries for all
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy parent_links_select_scoped on public.parent_student_links for select
using (public.has_role(auth.uid(), 'admin') or parent_profile_id = auth.uid());
create policy parent_links_admin_write on public.parent_student_links for all
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Attendance policies
create policy attendance_policy_read_roles on public.attendance_policy for select
using (auth.role() = 'authenticated');
create policy attendance_policy_admin_update on public.attendance_policy for update
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy attendance_logs_select_scoped on public.attendance_logs for select
using (public.has_role(auth.uid(), 'admin') or teacher_id = public.current_teacher_id());
create policy attendance_logs_teacher_insert on public.attendance_logs for insert
with check (teacher_id = public.current_teacher_id());
create policy attendance_logs_teacher_update_own_today on public.attendance_logs for update
using (
  public.has_role(auth.uid(), 'admin')
  or (teacher_id = public.current_teacher_id() and log_date = current_date)
)
with check (
  public.has_role(auth.uid(), 'admin')
  or (teacher_id = public.current_teacher_id() and log_date = current_date)
);

create policy attendance_anomalies_select_scoped on public.attendance_anomalies for select
using (public.has_role(auth.uid(), 'admin') or teacher_id = public.current_teacher_id());
create policy attendance_anomalies_admin_write on public.attendance_anomalies for all
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy student_attendance_select_scoped on public.student_attendance for select
using (
  public.has_role(auth.uid(), 'admin')
  or (public.has_role(auth.uid(), 'teacher') and public.teacher_teaches_class(class_id))
  or (public.has_role(auth.uid(), 'student') and student_id = public.current_student_id())
  or (public.has_role(auth.uid(), 'parent') and public.is_parent_of_student(student_id))
);
create policy student_attendance_teacher_insert on public.student_attendance for insert
with check (public.has_role(auth.uid(), 'admin') or public.teacher_teaches_class(class_id));
create policy student_attendance_teacher_update on public.student_attendance for update
using (public.has_role(auth.uid(), 'admin') or public.teacher_teaches_class(class_id))
with check (public.has_role(auth.uid(), 'admin') or public.teacher_teaches_class(class_id));
