insert into system_settings (key, value)
values ('message_retention_days', '7')
on conflict (key) do nothing;
