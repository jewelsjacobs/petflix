CREATE TABLE generation_budget (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier            TEXT NOT NULL DEFAULT 'free'
                  CHECK (tier IN ('free', 'creator', 'pro')),
  episodes_used   INTEGER DEFAULT 0,
  episodes_limit  INTEGER DEFAULT 3,
  reset_date      TIMESTAMPTZ
);

CREATE INDEX idx_generation_budget_user_id ON generation_budget(user_id);
