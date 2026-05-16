-- Phase 3.3.1: Tighten assets schema and seed placeholder rows.
-- assets table deployed empty in 20260509003805_initial_schema.sql.
-- This migration tightens column constraints (type CHECK, tags NOT NULL,
-- added_by default), adds the GIN tag index for fuzzy-match queries,
-- and seeds five placeholder rows used during Phase 3.3 build/verification.
-- Placeholder rows get replaced by curated assets in a future commit
-- (Phase 3.3.6: Replace placeholder assets with curated set).

alter table assets add constraint assets_type_check check (type in ('image', 'video'));

alter table assets alter column tags set not null;

alter table assets alter column added_by set default 'baz';

create index assets_tags_gin on assets using gin (tags);

insert into assets (type, url, tags, alt_text, added_by) values
  ('image', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/512px-Bitcoin.svg.png', array['bitcoin', 'btc', 'logo'], 'Bitcoin logo placeholder', 'baz'),
  ('image', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Ethereum_logo_2014.svg/256px-Ethereum_logo_2014.svg.png', array['ethereum', 'eth', 'logo'], 'Ethereum logo placeholder', 'baz'),
  ('image', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Pizza-3007395.jpg/640px-Pizza-3007395.jpg', array['pizza', 'pizza-day', 'laszlo', 'bitcoin-pizza'], 'Pizza day placeholder image', 'baz'),
  ('image', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Solana_logo.png/512px-Solana_logo.png', array['solana', 'sol', 'logo'], 'Solana logo placeholder', 'baz'),
  ('video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', array['test', 'video', 'placeholder'], 'Big Buck Bunny test video', 'baz');
