-- 0006_group_members.sql
-- Append-only: never edit this file after merging to main.

create table if not exists public.group_members (
  group_id  uuid    not null references public.groups(id) on delete cascade,
  user_id   uuid    not null references public.users(id) on delete cascade,
  is_pic    boolean not null default false,
  primary key (group_id, user_id)
);

-- Exactly one PIC per group; enforced by a partial unique index.
create unique index one_pic_per_group on public.group_members(group_id) where is_pic;

alter table public.group_members enable row level security;

-- Now that group_members exists, add the cross-table update policy on groups.
-- Cutoff enforcement is handled at the application layer, not in DB policy.
create policy "groups_update_member" on public.groups
  for update
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
        and group_members.user_id = auth.uid()
    )
  );

-- All authenticated users may read group membership.
create policy "group_members_select_authenticated" on public.group_members
  for select
  using (auth.uid() is not null);

-- A user may add themselves to a group.
-- Cutoff enforcement is handled at the application layer.
create policy "group_members_insert_own" on public.group_members
  for insert
  with check (user_id = auth.uid());

-- A user may update their own membership row (e.g. toggle is_pic).
create policy "group_members_update_own" on public.group_members
  for update
  using (user_id = auth.uid());

-- Admins may insert and update any membership.
create policy "group_members_admin_insert" on public.group_members
  for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "group_members_admin_update" on public.group_members
  for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
