-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-photos', 'pet-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-videos', 'generated-videos', false);

-- Storage policies: users can upload/read their own files
-- Files are organized as {user_id}/filename
CREATE POLICY "Users can upload their own pet photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own pet photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
