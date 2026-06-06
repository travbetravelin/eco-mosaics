-- Migration: add active flag to profiles
-- Run in Supabase SQL Editor (non-destructive)

alter table public.profiles
add column if not exists active boolean not null default true;
