-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_budget ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users can only see their own profiles"
  ON profiles FOR ALL USING (auth.uid() = user_id);

-- Episodes: users can only access their own
CREATE POLICY "Users can only see their own episodes"
  ON episodes FOR ALL USING (auth.uid() = user_id);

-- Generation budget: users can only see their own
CREATE POLICY "Users can only see their own budget"
  ON generation_budget FOR ALL USING (auth.uid() = user_id);
