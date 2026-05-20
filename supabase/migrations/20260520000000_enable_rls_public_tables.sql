-- Hygiene: Enable RLS on all public tables per Supabase
-- security advisor alert 2026-05-17. Server-side queries
-- route through lib/supabaseAdmin.ts (service-role key)
-- which bypasses RLS, so /api/* paths and server components
-- keep working. Anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY
-- visible to browser) is now blocked from direct DB access
-- — no policies attached, so anon role has zero permissions.
--
-- Per-user/per-cohort policies deferred to Mask Licensing V2
-- multi-tenancy work.

ALTER TABLE public.asset_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
