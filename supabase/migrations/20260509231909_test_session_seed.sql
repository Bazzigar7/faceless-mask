-- Test session seed for 2b.2.2+ verification.
-- Stable UUIDs allow predictable test URLs and curl commands.
-- These rows persist across smoke-test runs (smoke-test uses
-- fresh UUIDs each run and cleans them up).

INSERT INTO colleges (id, name, city, contact_dean) VALUES
  ('00000000-0000-0000-0000-000000000001', 'GRD College of Science (Test)', 'Coimbatore', 'Dean test')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO cohorts (id, college_id, name, start_date, current_strength) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'GRD Test Cohort 2026', '2026-01-15', 30)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO tracks (id, cohort_id, name, total_sessions, description, status) VALUES
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Blockchain Foundations (Test)', 6, 'Test track for development', 'active')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, track_id, session_number, date, topic, brief) VALUES
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 3, '2026-05-08T14:00:00+00:00', 'What is a smart contract?', NULL)
  ON CONFLICT (id) DO NOTHING;
