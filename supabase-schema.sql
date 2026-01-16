-- Brand Guidelines CMS Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Brands table
create table if not exists brands (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  logo_url text,
  banner_url text,
  primary_color text default '#0066FF',
  navigation jsonb default '[]'::jsonb,
  draft jsonb default '{}'::jsonb,
  published jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Pages table
create table if not exists pages (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references brands(id) on delete cascade,
  slug text not null,
  title text not null,
  "order" integer default 0,
  created_at timestamp with time zone default now()
);

-- Blocks table
create table if not exists blocks (
  id uuid default uuid_generate_v4() primary key,
  page_id uuid references pages(id) on delete cascade,
  type text not null,
  data jsonb default '{}'::jsonb,
  "order" integer default 0,
  created_at timestamp with time zone default now()
);

-- Assets table for brand asset library
create table if not exists assets (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references brands(id) on delete cascade,
  name text not null,
  description text,
  file_url text not null,
  thumbnail_url text,
  file_type text,
  file_size bigint,
  category text default 'other',
  tags text[] default '{}',
  created_at timestamp with time zone default now()
);

-- Create indexes for better performance
create index if not exists pages_brand_id_idx on pages(brand_id);
create index if not exists blocks_page_id_idx on blocks(page_id);
create index if not exists assets_brand_id_idx on assets(brand_id);
create index if not exists assets_category_idx on assets(category);

-- Enable Row Level Security (optional but recommended)
alter table brands enable row level security;
alter table pages enable row level security;
alter table blocks enable row level security;
alter table assets enable row level security;

-- Allow public access (for anonymous users)
create policy "Allow public read access on brands" on brands for select using (true);
create policy "Allow public insert access on brands" on brands for insert with check (true);
create policy "Allow public update access on brands" on brands for update using (true);
create policy "Allow public delete access on brands" on brands for delete using (true);

create policy "Allow public read access on pages" on pages for select using (true);
create policy "Allow public insert access on pages" on pages for insert with check (true);
create policy "Allow public update access on pages" on pages for update using (true);
create policy "Allow public delete access on pages" on pages for delete using (true);

create policy "Allow public read access on blocks" on blocks for select using (true);
create policy "Allow public insert access on blocks" on blocks for insert with check (true);
create policy "Allow public update access on blocks" on blocks for update using (true);
create policy "Allow public delete access on blocks" on blocks for delete using (true);

create policy "Allow public read access on assets" on assets for select using (true);
create policy "Allow public insert access on assets" on assets for insert with check (true);
create policy "Allow public update access on assets" on assets for update using (true);
create policy "Allow public delete access on assets" on assets for delete using (true);

-- Storage bucket for assets (run separately in Supabase dashboard if needed)
-- insert into storage.buckets (id, name, public) values ('assets', 'assets', true);

-- Collections table for grouping assets
create table if not exists collections (
  id uuid default uuid_generate_v4() primary key,
  brand_id uuid references brands(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

-- Add collection support to assets
alter table assets add column if not exists collection_id uuid references collections(id) on delete set null;

create index if not exists collections_brand_id_idx on collections(brand_id);
create index if not exists assets_collection_id_idx on assets(collection_id);

-- RLS for collections
alter table collections enable row level security;
create policy "Allow public read access on collections" on collections for select using (true);
create policy "Allow public insert access on collections" on collections for insert with check (true);
create policy "Allow public update access on collections" on collections for update using (true);
create policy "Allow public delete access on collections" on collections for delete using (true);

-- Folder support
alter table assets add column if not exists parent_id uuid references assets(id) on delete cascade;
alter table assets add column if not exists is_folder boolean default false;

create index if not exists assets_parent_id_idx on assets(parent_id);
