-- ClauseGuard — Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- Analyses table
-- Stores extracted text results (NOT raw files, for privacy)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists analyses (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete set null,
  document_name text not null,
  jurisdiction  text not null default 'generic',
  risk_score    int not null check (risk_score between 1 and 10),
  risk_label    text not null check (risk_label in ('low', 'medium', 'high')),
  result_json   jsonb not null,
  created_at    timestamptz not null default now()
);

-- Index for fast lookup by ID and user
create index if not exists analyses_user_id_idx on analyses(user_id);
create index if not exists analyses_created_at_idx on analyses(created_at desc);
create index if not exists analyses_risk_score_idx on analyses(risk_score desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table analyses enable row level security;

-- Anyone can read any analysis by ID (shareable links)
create policy "Public read by ID"
  on analyses for select
  using (true);

-- Only the owning user (or anonymous via service key) can insert
create policy "Insert own analyses"
  on analyses for insert
  with check (auth.uid() = user_id or user_id is null);

-- Only owner can delete their analyses
create policy "Delete own analyses"
  on analyses for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper view: recent analyses summary (for a dashboard later)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view analyses_summary as
select
  id,
  user_id,
  document_name,
  jurisdiction,
  risk_score,
  risk_label,
  created_at,
  jsonb_array_length(result_json -> 'clauses') as total_clauses
from analyses
order by created_at desc;
