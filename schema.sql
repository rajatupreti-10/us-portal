-- Create users table linked to Supabase Auth
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null,
  last_name text,
  dob date not null,
  gender text not null,
  email text not null unique,
  couple_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on users
alter table public.users enable row level security;

-- Policies for public.users
create policy "Allow public read access to users" on public.users
  for select using (true);

create policy "Allow insert for authenticated users" on public.users
  for insert to authenticated
  with check (auth.uid() = id);

create policy "Allow update for users themselves" on public.users
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Drop the old logs table if it exists
drop table if exists public.logs;

-- Recreate logs table to support dynamic couples and user associations
create table public.logs (
  id text primary key,
  couple_id text not null,
  type text not null,                 -- 'appreciation' or 'complaint'
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  message text,                       -- appreciation message or description
  title text,                         -- complaint title
  description text,                   -- complaint details
  status text,                        -- 'Open', 'Acknowledged', 'In Progress', 'Closed'
  timestamp bigint not null,          -- epoch milliseconds timestamp
  comments jsonb default '[]'::jsonb, -- comments thread
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on logs
alter table public.logs enable row level security;

-- Policies for public.logs (Siloing data by couple_id)
create policy "Enable select for users in the same couple" on public.logs
  for select to authenticated
  using (
    couple_id = (select couple_id from public.users where id = auth.uid())
  );

create policy "Enable insert for users in the same couple" on public.logs
  for insert to authenticated
  with check (
    couple_id = (select couple_id from public.users where id = auth.uid())
    and sender_id = auth.uid()
  );

create policy "Enable update for users in the same couple" on public.logs
  for update to authenticated
  using (
    couple_id = (select couple_id from public.users where id = auth.uid())
  )
  with check (
    couple_id = (select couple_id from public.users where id = auth.uid())
  );
