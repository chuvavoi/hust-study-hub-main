-- ENUMS
create type public.hust_school as enum ('SoICT','SEEE','SME','SET','SChEM','SMSE','SBME','SAME','FoMath','FoPhysics','SEE','Other');
create type public.book_type as enum ('online','offline','both');
create type public.rental_type as enum ('online','offline');
create type public.rental_status as enum ('active','expired','pending_pickup','picked_up','cancelled');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  student_email text,
  school public.hust_school not null default 'Other',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, student_email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- BOOKS
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  cover_url text,
  description text,
  school public.hust_school not null default 'Other',
  course_codes text[] not null default '{}',
  type public.book_type not null default 'both',
  total_pages int not null default 0,
  price numeric(10,2) not null default 0,
  physical_stock int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.books to authenticated, anon;
grant all on public.books to service_role;
alter table public.books enable row level security;
create policy "Anyone can view books" on public.books for select to authenticated, anon using (true);

-- BOOK PAGES (LOCKED: server-only via service role)
create table public.book_pages (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  page_number int not null,
  content text not null,
  unique (book_id, page_number)
);
grant all on public.book_pages to service_role;
alter table public.book_pages enable row level security;
-- intentionally NO policies for anon/authenticated: content only served via secure server functions.

-- RENTALS
create table public.rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  type public.rental_type not null,
  status public.rental_status not null default 'active',
  start_date timestamptz not null default now(),
  end_date timestamptz,
  qr_code text,
  pickup_location text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.rentals to authenticated;
grant all on public.rentals to service_role;
alter table public.rentals enable row level security;
create policy "Users view own rentals" on public.rentals for select to authenticated using (auth.uid() = user_id);
create policy "Users create own rentals" on public.rentals for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own rentals" on public.rentals for update to authenticated using (auth.uid() = user_id);

-- AD WATCH SESSIONS
create table public.ad_watch_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  token text not null unique,
  pages_granted int not null default 5,
  granted_until timestamptz not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ad_watch_sessions to authenticated;
grant all on public.ad_watch_sessions to service_role;
alter table public.ad_watch_sessions enable row level security;
create policy "Users view own ad sessions" on public.ad_watch_sessions for select to authenticated using (auth.uid() = user_id);
create policy "Users create own ad sessions" on public.ad_watch_sessions for insert to authenticated with check (auth.uid() = user_id);

create index idx_rentals_user on public.rentals(user_id);
create index idx_rentals_active on public.rentals(user_id, book_id, status);
create index idx_ad_user on public.ad_watch_sessions(user_id, book_id);
create index idx_pages_book on public.book_pages(book_id, page_number);