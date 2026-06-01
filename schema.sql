-- Create logs table for connection portal
create table if not exists public.logs (
  id text primary key,
  type text not null,          -- 'appreciation' or 'complaint'
  sender text not null,        -- 'Aadya' or 'Rajat'
  receiver text not null,      -- 'Aadya' or 'Rajat'
  message text,                -- appreciation message or description
  title text,                  -- complaint title
  description text,            -- complaint details
  status text,                 -- 'Open', 'Acknowledged', 'In Progress', 'Closed'
  timestamp bigint not null,   -- epoch milliseconds timestamp
  comment text                 -- partner's response comment (for complaints)
);

-- Enable Row Level Security (RLS)
alter table public.logs enable row level security;

-- Policies for public access (since the frontend uses the client anon key)
create policy "Enable select for all users" on public.logs
  for select using (true);

create policy "Enable insert for all users" on public.logs
  for insert with check (true);

create policy "Enable update for all users" on public.logs
  for update using (true) with check (true);
