-- Create agent_settings table
create table if not exists agent_settings (
    id uuid primary key default uuid_generate_v4(),
    agent_id varchar not null,
    first_message text,
    system_prompt text,
    website_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    constraint fk_agent unique (agent_id)
);

-- Add RLS policies
alter table agent_settings enable row level security;

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_agent_settings_updated_at
    before update on agent_settings
    for each row
    execute function update_updated_at_column();
