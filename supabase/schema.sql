-- EMO Supabase schema (run in Supabase SQL editor when ready).
-- Local dev uses file store in .data/db.json with the same shape.

create table if not exists checkins (
  id text primary key,
  created_at timestamptz default now(),
  valence smallint not null check (valence between -3 and 3),
  energy smallint not null check (energy between -3 and 3),
  note text
);

create table if not exists posts (
  id text primary key,
  created_at timestamptz default now(),
  name text not null,
  quote text not null,
  art text not null,
  dot text not null default 'bg-teal-300',
  likes int not null default 0
);

-- Storage bucket for check-in stills (create in Dashboard > Storage):
-- insert into storage.buckets (id, name, public) values ('stills', 'stills', true);
