-- Persistent Linux workstations per signed-in user
create table if not exists workstations (
  id text primary key,
  user_id text not null,
  name text not null,
  distro text not null,
  github_repo text,
  status text not null default 'stopped',
  last_opened_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists workstations_user_id_idx on workstations (user_id);

create table if not exists workstation_state (
  workstation_id text primary key,
  user_id text not null,
  tree text not null,
  cwd text not null default '/home/cinder',
  env text not null default '{}',
  history text not null default '[]',
  packages text not null default '[]',
  updated_at timestamptz not null default now()
);
create index if not exists workstation_state_user_id_idx on workstation_state (user_id);
