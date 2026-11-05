-- Grubbix Warehouse — seed data
-- Nine categories only. No invented products or prices.

insert into public.categories (name, slug, description, sort_order) values
  ('Chafing Dishes',   'chafing-dishes',  '', 1),
  ('Dinner Plates',    'dinner-plates',   '', 2),
  ('Glasswares',       'glasswares',      '', 3),
  ('Sauce Bowls',      'sauce-bowls',     '', 4),
  ('Coolers',          'coolers',         '', 5),
  ('Kitchen Utensils', 'kitchen-utensils', '', 6),
  ('Table Cloths',     'table-cloths',    '', 7),
  ('Napkins',          'napkins',         '', 8),
  ('Charger Plates',   'charger-plates',  '', 9)
on conflict (slug) do update
  set name = excluded.name,
      sort_order = excluded.sort_order;

-- Contact details are intentionally blank: fill them in the admin Settings page.
insert into public.store_settings (key, value) values
  ('business_name',  'Grubbix Warehouse'),
  ('whatsapp_number', ''),
  ('phone_number',   ''),
  ('contact_email',  ''),
  ('address',        ''),
  ('instagram_url',  ''),
  ('facebook_url',   '')
on conflict (key) do nothing;
