-- Simple Storage RLS Policies for Image Uploads
-- Run this in your Supabase SQL Editor

-- Create images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;

-- Allow authenticated users to upload to images bucket
CREATE POLICY "Allow authenticated uploads to images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    auth.role() = 'authenticated'
  );

-- Allow public read access to images bucket
CREATE POLICY "Allow public read access to images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Verify the policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
