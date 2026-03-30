CREATE TABLE profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  pet_type        TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat')),
  photo_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
