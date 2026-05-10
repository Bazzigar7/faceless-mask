-- turns table for chat history
-- One row per voice-loop turn: user (Baz's transcript) or
-- assistant (Mask's response). Order via created_at.
-- sessions.transcript text column on the sessions table is
-- NOT used; this turns table replaces that planned approach.

CREATE TABLE turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index supports the common query: "all turns for
-- session X in chronological order"
CREATE INDEX idx_turns_session_created
  ON turns(session_id, created_at);

-- RLS disabled per V1 schema convention (see migration
-- 20260509003805 for precedent). Revisit when V2 lands.
ALTER TABLE turns DISABLE ROW LEVEL SECURITY;
