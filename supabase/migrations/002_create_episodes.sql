CREATE TABLE episodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  series_type     TEXT NOT NULL,
  title           TEXT NOT NULL,
  script          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  video_url       TEXT,
  thumbnail_url   TEXT,
  duration_seconds INTEGER,
  generation_cost  DECIMAL(10,4),
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_episodes_user_id ON episodes(user_id);
CREATE INDEX idx_episodes_profile_id ON episodes(profile_id);
CREATE INDEX idx_episodes_status ON episodes(status);
