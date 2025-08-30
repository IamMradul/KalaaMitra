-- Fix Storage RLS Policies for Image and Video Uploads
-- Run this in your Supabase SQL Editor

-- First, let's check if the buckets exist and create them if needed
-- You can also create these manually in the Supabase Dashboard > Storage

-- Create images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Create videos bucket if it doesn't exist  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 52428800, ARRAY['video/*'])
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies on storage.objects for these buckets
DROP POLICY IF EXISTS "Allow authenticated uploads to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to videos" ON storage.objects;

-- Create policy for authenticated users to upload to images bucket
CREATE POLICY "Allow authenticated uploads to images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    auth.role() = 'authenticated'
  );

-- Create policy for public read access to images bucket
CREATE POLICY "Allow public read access to images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Create policy for authenticated users to upload to videos bucket
CREATE POLICY "Allow authenticated uploads to videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND 
    auth.role() = 'authenticated'
  );

-- Create policy for public read access to videos bucket
CREATE POLICY "Allow public read access to videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

-- Create policy for users to update their own files
CREATE POLICY "Allow users to update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('images', 'videos') AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('images', 'videos') AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
